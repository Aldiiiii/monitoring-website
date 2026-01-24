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

    const checks = await this.prisma.check.findMany({
      where: {
        monitorId,
        checkedAt: {
          gte: start,
          lte: now,
        },
      },
      orderBy: { checkedAt: 'asc' },
      select: { status: true, checkedAt: true },
    });

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

    return {
      monitorId,
      days,
      totalChecks,
      upChecks,
      uptimePercent,
      series,
    };
  }
}
