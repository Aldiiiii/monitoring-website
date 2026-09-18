import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type UptimeSeriesPoint = {
  date: string;
  up: number;
  total: number;
  uptimePercent: number;
};

export type UptimeReport = {
  monitorId: string;
  days: number;
  totalChecks: number;
  upChecks: number;
  uptimePercent: number;
  series: UptimeSeriesPoint[];
  // PRD 12.4 additions
  incidentCount: number;
  totalDowntimeSec: number;
  totalDowntimeMin: number;
  avgLatencyMs: number | null;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUptimeReport(userId: string, monitorId: string, days = 7): Promise<UptimeReport> {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, userId },
      select: { id: true },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found.');
    }

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const [checks, incidents] = await Promise.all([
      this.prisma.check.findMany({
        where: {
          monitorId,
          checkedAt: {
            gte: start,
            lte: now,
          },
        },
        orderBy: { checkedAt: 'asc' },
        select: { status: true, checkedAt: true, latencyMs: true },
      }),
      this.prisma.incident.findMany({
        where: {
          monitorId,
          startedAt: { lte: now },
          OR: [{ endedAt: null }, { endedAt: { gte: start } }],
        },
        select: { startedAt: true, endedAt: true, durationSec: true },
      }),
    ]);

    const seriesMap = new Map<string, { up: number; total: number }>();
    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + offset);
      const key = day.toISOString().slice(0, 10);
      seriesMap.set(key, { up: 0, total: 0 });
    }

    for (const check of checks) {
      const key = check.checkedAt.toISOString().slice(0, 10);
      const bucket = seriesMap.get(key);
      if (!bucket) {
        continue;
      }
      bucket.total += 1;
      if (check.status === 'UP') {
        bucket.up += 1;
      }
    }

    const series: UptimeSeriesPoint[] = Array.from(seriesMap.entries()).map(
      ([date, bucket]) => {
        const uptimePercent = bucket.total
          ? Math.round((bucket.up / bucket.total) * 10000) / 100
          : 0;
        return { date, up: bucket.up, total: bucket.total, uptimePercent };
      },
    );

    const totalChecks = series.reduce((sum, point) => sum + point.total, 0);
    const upChecks = series.reduce((sum, point) => sum + point.up, 0);
    const uptimePercent = totalChecks
      ? Math.round((upChecks / totalChecks) * 10000) / 100
      : 0;

    // PRD 12.4: incident count + downtime + avg latency
    const incidentCount = incidents.length;
    let totalDowntimeSec = 0;
    for (const inc of incidents) {
      if (inc.durationSec !== null && inc.durationSec !== undefined) {
        // Clip to window [start, now] if needed — duration already computed at close time
        totalDowntimeSec += inc.durationSec;
      } else if (inc.endedAt === null) {
        // Still open — count from startedAt to now, clipped to start
        const effectiveStart = inc.startedAt < start ? start : inc.startedAt;
        totalDowntimeSec += Math.floor((now.getTime() - effectiveStart.getTime()) / 1000);
      } else if (inc.endedAt) {
        const effectiveStart = inc.startedAt < start ? start : inc.startedAt;
        const effectiveEnd = inc.endedAt > now ? now : inc.endedAt;
        totalDowntimeSec += Math.max(0, Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / 1000));
      }
    }
    const totalDowntimeMin = Math.round((totalDowntimeSec / 60) * 100) / 100;

    const latencies = checks
      .map((c) => c.latencyMs)
      .filter((v): v is number => typeof v === 'number' && v !== null);
    const avgLatencyMs = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

    return {
      monitorId,
      days,
      totalChecks,
      upChecks,
      uptimePercent,
      series,
      incidentCount,
      totalDowntimeSec,
      totalDowntimeMin,
      avgLatencyMs,
    };
  }

  async getLatencyReport(userId: string, monitorId: string, days = 7) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, userId },
      select: { id: true },
    });
    if (!monitor) {
      throw new NotFoundException('Monitor not found.');
    }
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const checks = await this.prisma.check.findMany({
      where: { monitorId, checkedAt: { gte: start, lte: now }, latencyMs: { not: null } },
      orderBy: { checkedAt: 'asc' },
      select: { latencyMs: true, checkedAt: true },
    });

    // Group by day: avg latency per day
    const dayMap = new Map<string, { sum: number; count: number }>();
    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + offset);
      dayMap.set(day.toISOString().slice(0, 10), { sum: 0, count: 0 });
    }
    for (const c of checks) {
      const key = c.checkedAt.toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket || c.latencyMs === null) continue;
      bucket.sum += c.latencyMs;
      bucket.count += 1;
    }
    const series = Array.from(dayMap.entries()).map(([date, b]) => ({
      date,
      avgLatencyMs: b.count ? Math.round(b.sum / b.count) : null,
      count: b.count,
    }));

    const all = checks.map((c) => c.latencyMs as number);
    const avgLatencyMs = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null;
    const sorted = [...all].sort((a, b) => a - b);
    const p95LatencyMs = sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
      : null;
    return { monitorId, days, avgLatencyMs, p95LatencyMs, series };
  }
}
