import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Check,
  CheckStatus,
  ChannelType,
  Monitor,
  MonitorStatus,
  MonitorType,
  Prisma,
} from '@prisma/client';
import * as http from 'http';
import * as https from 'https';
import * as net from 'net';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../notifications/telegram.service';
import { ListChecksDto } from './dto/list-checks.dto';

type CheckResult = {
  status: CheckStatus;
  latencyMs: number | null;
  statusCode: number | null;
  error: string | null;
};

@Injectable()
export class ChecksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  private readonly logger = new Logger(ChecksService.name);
  private isRunning = false;

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduledChecks(): Promise<void> {
    // Prevent overlapping runs if a previous cron is still running.
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const now = new Date();

    try {
      // Fetch all active monitors.
      const activeMonitors = await this.prisma.monitor.findMany({
        where: { isActive: true },
      });

      if (activeMonitors.length === 0) {
        return;
      }

      // Find monitors currently in a maintenance window.
      const maintenanceWindows = await this.prisma.maintenanceWindow.findMany({
        where: {
          startAt: { lte: now },
          endAt: { gte: now },
          monitor: { isActive: true },
        },
        select: { monitorId: true },
      });

      const maintenanceIds = new Set(
        maintenanceWindows.map((window) => window.monitorId),
      );

      for (const monitor of activeMonitors) {
        if (maintenanceIds.has(monitor.id)) {
          continue;
        }
        // Run check per monitor (HTTP or TCP).
        await this.runCheckForMonitor(monitor);
      }
    } catch (error) {
      this.logger.error('Scheduled check failed.', error as Error);
    } finally {
      this.isRunning = false;
    }
  }

  async findAll(userId: string, query: ListChecksDto): Promise<Check[]> {
    const where: Prisma.CheckWhereInput = {
      monitorId: query.monitorId,
      status: query.status,
      monitor: { userId },
      checkedAt:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
    };

    return this.prisma.check.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      skip: query.skip,
      take: query.take ?? 100,
    });
  }

  async findOne(userId: string, id: string): Promise<Check> {
    const check = await this.prisma.check.findFirst({
      where: { id, monitor: { userId } },
    });
    if (!check) {
      throw new NotFoundException('Check not found.');
    }

    return check;
  }

  private async runCheckForMonitor(monitor: Monitor): Promise<void> {
    // Apply retry logic and return the final check result.
    const result = await this.performCheckWithRetries(monitor);
    const checkedAt = new Date();

    const previousStatus = monitor.lastStatus;
    const nextStatus =
      result.status === CheckStatus.UP ? MonitorStatus.UP : MonitorStatus.DOWN;

    // Store check + update monitor + incident handling in one transaction.
    await this.prisma.$transaction(async (tx) => {
      await tx.check.create({
        data: {
          monitorId: monitor.id,
          status: result.status,
          latencyMs: result.latencyMs,
          statusCode: result.statusCode,
          error: result.error,
          checkedAt,
        },
      });

      // Update monitor's last known state.
      await tx.monitor.update({
        where: { id: monitor.id },
        data: {
          lastStatus: nextStatus,
          lastCheckedAt: checkedAt,
          lastLatencyMs: result.latencyMs,
        },
      });

      // UP -> DOWN: create new incident.
      if (monitor.lastStatus === MonitorStatus.UP && nextStatus === MonitorStatus.DOWN) {
        await tx.incident.create({
          data: {
            monitorId: monitor.id,
            startedAt: checkedAt,
            reason: result.error,
          },
        });
      }

      // DOWN -> UP: close latest open incident.
      if (monitor.lastStatus === MonitorStatus.DOWN && nextStatus === MonitorStatus.UP) {
        const openIncident = await tx.incident.findFirst({
          where: { monitorId: monitor.id, endedAt: null },
          orderBy: { startedAt: 'desc' },
        });

        if (openIncident) {
          const durationSec = Math.max(
            0,
            Math.floor(
              (checkedAt.getTime() - openIncident.startedAt.getTime()) / 1000,
            ),
          );
          await tx.incident.update({
            where: { id: openIncident.id },
            data: {
              endedAt: checkedAt,
              durationSec,
            },
          });
        }
      }
    });

    await this.notifyTelegram(monitor, previousStatus, nextStatus);
  }

  private async performCheckWithRetries(monitor: Monitor): Promise<CheckResult> {
    const retries = Math.max(0, monitor.retries ?? 0);
    const delayMs = Math.max(0, monitor.retryDelayMs ?? 0);
    let lastResult: CheckResult | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      // Run the actual check based on monitor type.
      const result =
        monitor.type === MonitorType.HTTP
          ? await this.checkHttp(monitor)
          : await this.checkTcp(monitor);

      if (result.status === CheckStatus.UP) {
        return result;
      }

      lastResult = result;

      if (attempt < retries && delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    return (
      lastResult ?? {
        status: CheckStatus.DOWN,
        latencyMs: null,
        statusCode: null,
        error: 'unknown_error',
      }
    );
  }

  private async checkHttp(monitor: Monitor): Promise<CheckResult> {
    if (!monitor.url) {
      return {
        status: CheckStatus.DOWN,
        latencyMs: null,
        statusCode: null,
        error: 'missing_url',
      };
    }

    let url: URL;
    try {
      url = new URL(monitor.url);
    } catch {
      return {
        status: CheckStatus.DOWN,
        latencyMs: null,
        statusCode: null,
        error: 'invalid_url',
      };
    }

    const method = monitor.method ?? 'GET';
    const timeoutMs = monitor.timeoutMs;

    return new Promise<CheckResult>((resolve) => {
      const start = Date.now();
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port ? Number(url.port) : undefined,
          path: `${url.pathname}${url.search}`,
          method,
          timeout: timeoutMs,
        },
        (res) => {
          const statusCode = res.statusCode ?? null;
          const limit = 1_000_000;
          let body = '';

          // Read a limited response body for keyword checks.
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            if (body.length < limit) {
              body += chunk;
            }
          });

          res.on('end', () => {
            const latencyMs = Date.now() - start;
            let ok = false;
            let error: string | null = null;

            // Determine "UP" by expectCode or standard 2xx/3xx.
            if (monitor.expectCode) {
              ok = statusCode === monitor.expectCode;
              if (!ok) {
                error = `status_${statusCode ?? 'unknown'}`;
              }
            } else if (statusCode !== null) {
              ok = statusCode >= 200 && statusCode < 400;
              if (!ok) {
                error = `status_${statusCode}`;
              }
            } else {
              error = 'no_status';
            }

            // Optional body keyword validation.
            if (ok && monitor.keyword) {
              ok = body.includes(monitor.keyword);
              if (!ok) {
                error = 'keyword_not_found';
              }
            }

            resolve({
              status: ok ? CheckStatus.UP : CheckStatus.DOWN,
              latencyMs,
              statusCode,
              error,
            });
          });
        },
      );

      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });

      req.on('error', (err) => {
        const latencyMs = Date.now() - start;
        resolve({
          status: CheckStatus.DOWN,
          latencyMs,
          statusCode: null,
          error: err.message,
        });
      });

      req.end();
    });
  }

  private async checkTcp(monitor: Monitor): Promise<CheckResult> {
    const host = monitor.host;
    const port = monitor.port;

    if (!host || !port) {
      return {
        status: CheckStatus.DOWN,
        latencyMs: null,
        statusCode: null,
        error: 'missing_host_or_port',
      };
    }

    return new Promise<CheckResult>((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();
      let settled = false;

      const finalize = (result: CheckResult) => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(monitor.timeoutMs);

      socket.once('connect', () => {
        const latencyMs = Date.now() - start;
        finalize({
          status: CheckStatus.UP,
          latencyMs,
          statusCode: null,
          error: null,
        });
      });

      socket.once('timeout', () => {
        const latencyMs = Date.now() - start;
        finalize({
          status: CheckStatus.DOWN,
          latencyMs,
          statusCode: null,
          error: 'timeout',
        });
      });

      socket.once('error', (err) => {
        const latencyMs = Date.now() - start;
        finalize({
          status: CheckStatus.DOWN,
          latencyMs,
          statusCode: null,
          error: err.message,
        });
      });

      socket.connect(port, host);
    });
  }

  private sleep(delayMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private async notifyTelegram(
    monitor: Monitor,
    previousStatus: MonitorStatus,
    nextStatus: MonitorStatus,
  ): Promise<void> {
    if (
      !(
        (previousStatus === MonitorStatus.UP &&
          nextStatus === MonitorStatus.DOWN) ||
        (previousStatus === MonitorStatus.DOWN &&
          nextStatus === MonitorStatus.UP)
      )
    ) {
      return;
    }

    const channels = await this.prisma.notificationChannel.findMany({
      where: {
        monitorId: monitor.id,
        type: ChannelType.TELEGRAM,
        isEnabled: true,
      },
    });

    if (channels.length === 0) {
      return;
    }

    const target = this.getMonitorTarget(monitor);
    const label = target ? `${monitor.name} ${target}` : monitor.name;
    const text =
      nextStatus === MonitorStatus.DOWN
        ? `🚨 DOWN ${label}`
        : `✅ UP AGAIN ${label}`;

    for (const channel of channels) {
      if (!channel.telegramChatId) {
        continue;
      }

      await this.telegramService.sendMessage({
        chatId: channel.telegramChatId,
        threadId: channel.telegramThreadId ?? undefined,
        token: channel.telegramBotToken ?? undefined,
        text,
      });
    }
  }

  private getMonitorTarget(monitor: Monitor): string {
    if (monitor.type === MonitorType.HTTP) {
      return monitor.url ?? '';
    }

    if (!monitor.host) {
      return '';
    }

    return monitor.port ? `${monitor.host}:${monitor.port}` : monitor.host;
  }
}
