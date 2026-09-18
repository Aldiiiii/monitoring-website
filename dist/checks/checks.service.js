"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChecksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChecksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const http = require("http");
const https = require("https");
const net = require("net");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../notifications/telegram.service");
let ChecksService = ChecksService_1 = class ChecksService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.logger = new common_1.Logger(ChecksService_1.name);
        this.isRunning = false;
    }
    async runScheduledChecks() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        const now = new Date();
        try {
            const activeMonitors = await this.prisma.monitor.findMany({
                where: { isActive: true },
            });
            if (activeMonitors.length === 0) {
                return;
            }
            const maintenanceWindows = await this.prisma.maintenanceWindow.findMany({
                where: {
                    startAt: { lte: now },
                    endAt: { gte: now },
                    monitor: { isActive: true },
                },
                select: { monitorId: true },
            });
            const maintenanceIds = new Set(maintenanceWindows.map((window) => window.monitorId));
            for (const monitor of activeMonitors) {
                const isInMaintenance = maintenanceIds.has(monitor.id);
                if (monitor.lastCheckedAt) {
                    const elapsedMs = now.getTime() - new Date(monitor.lastCheckedAt).getTime();
                    const intervalMs = (monitor.intervalSec ?? 60) * 1000;
                    if (elapsedMs < intervalMs) {
                        continue;
                    }
                }
                await this.runCheckForMonitor(monitor, isInMaintenance);
            }
        }
        catch (error) {
            this.logger.error('Scheduled check failed.', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async findAll(userId, query) {
        const where = {
            monitorId: query.monitorId,
            status: query.status,
            monitor: { userId },
            checkedAt: query.from || query.to
                ? {
                    gte: query.from ? new Date(query.from) : undefined,
                    lte: query.to ? new Date(query.to) : undefined,
                }
                : undefined,
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.check.findMany({
                where,
                orderBy: { checkedAt: 'desc' },
                skip: query.skip,
                take: query.take ?? 100,
            }),
            this.prisma.check.count({ where }),
        ]);
        return { data, total };
    }
    async findOne(userId, id) {
        const check = await this.prisma.check.findFirst({
            where: { id, monitor: { userId } },
        });
        if (!check) {
            throw new common_1.NotFoundException('Check not found.');
        }
        return check;
    }
    async runCheckForMonitor(monitor, suppressNotification = false) {
        const result = await this.performCheckWithRetries(monitor);
        const checkedAt = new Date();
        const previousStatus = monitor.lastStatus;
        const nextStatus = result.status === client_1.CheckStatus.UP ? client_1.MonitorStatus.UP : client_1.MonitorStatus.DOWN;
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
            await tx.monitor.update({
                where: { id: monitor.id },
                data: {
                    lastStatus: nextStatus,
                    lastCheckedAt: checkedAt,
                    lastLatencyMs: result.latencyMs,
                },
            });
            if (monitor.lastStatus === client_1.MonitorStatus.UP && nextStatus === client_1.MonitorStatus.DOWN) {
                await tx.incident.create({
                    data: {
                        monitorId: monitor.id,
                        startedAt: checkedAt,
                        reason: result.error,
                    },
                });
            }
            if (monitor.lastStatus === client_1.MonitorStatus.DOWN && nextStatus === client_1.MonitorStatus.UP) {
                const openIncident = await tx.incident.findFirst({
                    where: { monitorId: monitor.id, endedAt: null },
                    orderBy: { startedAt: 'desc' },
                });
                if (openIncident) {
                    const durationSec = Math.max(0, Math.floor((checkedAt.getTime() - openIncident.startedAt.getTime()) / 1000));
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
        if (!suppressNotification) {
            await this.notifyTelegram(monitor, previousStatus, nextStatus);
        }
    }
    async performCheckWithRetries(monitor) {
        const retries = Math.max(0, monitor.retries ?? 0);
        const delayMs = Math.max(0, monitor.retryDelayMs ?? 0);
        let lastResult = null;
        for (let attempt = 0; attempt <= retries; attempt += 1) {
            const result = monitor.type === client_1.MonitorType.HTTP
                ? await this.checkHttp(monitor)
                : await this.checkTcp(monitor);
            if (result.status === client_1.CheckStatus.UP) {
                return result;
            }
            lastResult = result;
            if (attempt < retries && delayMs > 0) {
                await this.sleep(delayMs);
            }
        }
        return (lastResult ?? {
            status: client_1.CheckStatus.DOWN,
            latencyMs: null,
            statusCode: null,
            error: 'unknown_error',
        });
    }
    async checkHttp(monitor, redirectCount = 0, startTime) {
        if (!monitor.url) {
            return {
                status: client_1.CheckStatus.DOWN,
                latencyMs: null,
                statusCode: null,
                error: 'missing_url',
            };
        }
        const urlStr = monitor.url;
        let url;
        try {
            url = new URL(urlStr);
        }
        catch {
            return {
                status: client_1.CheckStatus.DOWN,
                latencyMs: null,
                statusCode: null,
                error: 'invalid_url',
            };
        }
        const method = monitor.method ?? 'GET';
        const timeoutMs = monitor.timeoutMs;
        const start = startTime ?? Date.now();
        return new Promise((resolve) => {
            const client = url.protocol === 'https:' ? https : http;
            const isHttps = url.protocol === 'https:';
            const req = client.request({
                hostname: url.hostname,
                port: url.port ? Number(url.port) : undefined,
                path: `${url.pathname}${url.search}`,
                method,
                timeout: timeoutMs,
                ...(isHttps ? { rejectUnauthorized: true } : {}),
            }, (res) => {
                const statusCode = res.statusCode ?? null;
                const location = res.headers?.location;
                const isRedirect = statusCode !== null && [301, 302, 303, 307, 308].includes(statusCode);
                if (isRedirect && location && redirectCount < 5) {
                    res.resume();
                    try {
                        const nextUrl = new URL(location, url).toString();
                        const nextMonitor = { ...monitor, url: nextUrl };
                        this.checkHttp(nextMonitor, redirectCount + 1, start).then(resolve);
                    }
                    catch {
                        const latencyMs = Date.now() - start;
                        resolve({
                            status: client_1.CheckStatus.DOWN,
                            latencyMs,
                            statusCode,
                            error: 'invalid_redirect_url',
                        });
                    }
                    return;
                }
                const limit = 1_000_000;
                let body = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    if (body.length < limit) {
                        body += chunk;
                    }
                });
                res.on('end', () => {
                    const latencyMs = Date.now() - start;
                    let ok = false;
                    let error = null;
                    if (monitor.expectCode) {
                        ok = statusCode === monitor.expectCode;
                        if (!ok) {
                            error = `status_${statusCode ?? 'unknown'}`;
                        }
                    }
                    else if (statusCode !== null) {
                        ok = statusCode >= 200 && statusCode < 400;
                        if (!ok) {
                            error = `status_${statusCode}`;
                        }
                    }
                    else {
                        error = 'no_status';
                    }
                    if (ok && monitor.keyword) {
                        ok = body.includes(monitor.keyword);
                        if (!ok) {
                            error = 'keyword_not_found';
                        }
                    }
                    resolve({
                        status: ok ? client_1.CheckStatus.UP : client_1.CheckStatus.DOWN,
                        latencyMs,
                        statusCode,
                        error,
                    });
                });
            });
            req.on('timeout', () => {
                req.destroy(new Error('timeout'));
            });
            req.on('error', (err) => {
                const latencyMs = Date.now() - start;
                resolve({
                    status: client_1.CheckStatus.DOWN,
                    latencyMs,
                    statusCode: null,
                    error: err.message,
                });
            });
            req.end();
        });
    }
    async checkTcp(monitor) {
        const host = monitor.host;
        const port = monitor.port;
        if (!host || !port) {
            return {
                status: client_1.CheckStatus.DOWN,
                latencyMs: null,
                statusCode: null,
                error: 'missing_host_or_port',
            };
        }
        return new Promise((resolve) => {
            const start = Date.now();
            const socket = new net.Socket();
            let settled = false;
            const finalize = (result) => {
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
                    status: client_1.CheckStatus.UP,
                    latencyMs,
                    statusCode: null,
                    error: null,
                });
            });
            socket.once('timeout', () => {
                const latencyMs = Date.now() - start;
                finalize({
                    status: client_1.CheckStatus.DOWN,
                    latencyMs,
                    statusCode: null,
                    error: 'timeout',
                });
            });
            socket.once('error', (err) => {
                const latencyMs = Date.now() - start;
                finalize({
                    status: client_1.CheckStatus.DOWN,
                    latencyMs,
                    statusCode: null,
                    error: err.message,
                });
            });
            socket.connect(port, host);
        });
    }
    sleep(delayMs) {
        return new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    async notifyTelegram(monitor, previousStatus, nextStatus) {
        if (!((previousStatus === client_1.MonitorStatus.UP &&
            nextStatus === client_1.MonitorStatus.DOWN) ||
            (previousStatus === client_1.MonitorStatus.DOWN &&
                nextStatus === client_1.MonitorStatus.UP))) {
            return;
        }
        const channels = await this.prisma.notificationChannel.findMany({
            where: {
                monitorId: monitor.id,
                type: client_1.ChannelType.TELEGRAM,
                isEnabled: true,
            },
        });
        if (channels.length === 0) {
            return;
        }
        const target = this.getMonitorTarget(monitor);
        const label = target ? `${monitor.name} ${target}` : monitor.name;
        const text = nextStatus === client_1.MonitorStatus.DOWN
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
    getMonitorTarget(monitor) {
        if (monitor.type === client_1.MonitorType.HTTP) {
            return monitor.url ?? '';
        }
        if (!monitor.host) {
            return '';
        }
        return monitor.port ? `${monitor.host}:${monitor.port}` : monitor.host;
    }
};
exports.ChecksService = ChecksService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChecksService.prototype, "runScheduledChecks", null);
exports.ChecksService = ChecksService = ChecksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], ChecksService);
//# sourceMappingURL=checks.service.js.map