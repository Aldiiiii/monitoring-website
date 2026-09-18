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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUptimeReport(userId, monitorId, days = 7) {
        const monitor = await this.prisma.monitor.findFirst({
            where: { id: monitorId, userId },
            select: { id: true },
        });
        if (!monitor) {
            throw new common_1.NotFoundException('Monitor not found.');
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
        const seriesMap = new Map();
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
        const series = Array.from(seriesMap.entries()).map(([date, bucket]) => {
            const uptimePercent = bucket.total
                ? Math.round((bucket.up / bucket.total) * 10000) / 100
                : 0;
            return { date, up: bucket.up, total: bucket.total, uptimePercent };
        });
        const totalChecks = series.reduce((sum, point) => sum + point.total, 0);
        const upChecks = series.reduce((sum, point) => sum + point.up, 0);
        const uptimePercent = totalChecks
            ? Math.round((upChecks / totalChecks) * 10000) / 100
            : 0;
        const incidentCount = incidents.length;
        let totalDowntimeSec = 0;
        for (const inc of incidents) {
            if (inc.durationSec !== null && inc.durationSec !== undefined) {
                totalDowntimeSec += inc.durationSec;
            }
            else if (inc.endedAt === null) {
                const effectiveStart = inc.startedAt < start ? start : inc.startedAt;
                totalDowntimeSec += Math.floor((now.getTime() - effectiveStart.getTime()) / 1000);
            }
            else if (inc.endedAt) {
                const effectiveStart = inc.startedAt < start ? start : inc.startedAt;
                const effectiveEnd = inc.endedAt > now ? now : inc.endedAt;
                totalDowntimeSec += Math.max(0, Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / 1000));
            }
        }
        const totalDowntimeMin = Math.round((totalDowntimeSec / 60) * 100) / 100;
        const latencies = checks
            .map((c) => c.latencyMs)
            .filter((v) => typeof v === 'number' && v !== null);
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
    async getLatencyReport(userId, monitorId, days = 7) {
        const monitor = await this.prisma.monitor.findFirst({
            where: { id: monitorId, userId },
            select: { id: true },
        });
        if (!monitor) {
            throw new common_1.NotFoundException('Monitor not found.');
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
        const dayMap = new Map();
        for (let offset = 0; offset < days; offset += 1) {
            const day = new Date(start);
            day.setDate(start.getDate() + offset);
            dayMap.set(day.toISOString().slice(0, 10), { sum: 0, count: 0 });
        }
        for (const c of checks) {
            const key = c.checkedAt.toISOString().slice(0, 10);
            const bucket = dayMap.get(key);
            if (!bucket || c.latencyMs === null)
                continue;
            bucket.sum += c.latencyMs;
            bucket.count += 1;
        }
        const series = Array.from(dayMap.entries()).map(([date, b]) => ({
            date,
            avgLatencyMs: b.count ? Math.round(b.sum / b.count) : null,
            count: b.count,
        }));
        const all = checks.map((c) => c.latencyMs);
        const avgLatencyMs = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null;
        const sorted = [...all].sort((a, b) => a - b);
        const p95LatencyMs = sorted.length
            ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
            : null;
        return { monitorId, days, avgLatencyMs, p95LatencyMs, series };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map