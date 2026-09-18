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
var MonitorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_error_util_1 = require("../common/prisma-error.util");
let MonitorsService = MonitorsService_1 = class MonitorsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MonitorsService_1.name);
    }
    async create(userId, dto) {
        try {
            const monitor = await this.prisma.monitor.create({
                data: {
                    userId,
                    name: dto.name,
                    type: dto.type,
                    url: dto.url ?? null,
                    host: dto.host ?? null,
                    port: dto.port ?? null,
                    method: dto.method ?? null,
                    keyword: dto.keyword ?? null,
                    expectCode: dto.expectCode ?? null,
                    intervalSec: dto.intervalSec ?? undefined,
                    timeoutMs: dto.timeoutMs ?? undefined,
                    retries: dto.retries ?? undefined,
                    retryDelayMs: dto.retryDelayMs ?? undefined,
                    isActive: dto.isActive ?? true,
                },
            });
            this.logger.log(`AUDIT create monitor ${monitor.id} by user ${userId} name=${dto.name} type=${dto.type}`);
            return monitor;
        }
        catch (error) {
            (0, prisma_error_util_1.handlePrismaError)(error);
        }
    }
    async findAll(userId, query) {
        const where = {
            userId,
            type: query.type,
            isActive: query.isActive,
        };
        return this.prisma.monitor.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: query.skip,
            take: query.take ?? 50,
        });
    }
    async findOne(userId, id) {
        const monitor = await this.prisma.monitor.findFirst({
            where: { id, userId },
        });
        if (!monitor) {
            throw new common_1.NotFoundException('Monitor not found.');
        }
        return monitor;
    }
    async update(userId, id, dto) {
        try {
            const exists = await this.prisma.monitor.findFirst({
                where: { id, userId },
                select: { id: true },
            });
            if (!exists) {
                throw new common_1.NotFoundException('Monitor not found.');
            }
            const updated = await this.prisma.monitor.update({
                where: { id },
                data: {
                    name: dto.name,
                    type: dto.type,
                    url: dto.url ?? undefined,
                    host: dto.host ?? undefined,
                    port: dto.port ?? undefined,
                    method: dto.method ?? undefined,
                    keyword: dto.keyword ?? undefined,
                    expectCode: dto.expectCode ?? undefined,
                    intervalSec: dto.intervalSec ?? undefined,
                    timeoutMs: dto.timeoutMs ?? undefined,
                    retries: dto.retries ?? undefined,
                    retryDelayMs: dto.retryDelayMs ?? undefined,
                    isActive: dto.isActive ?? undefined,
                },
            });
            this.logger.log(`AUDIT update monitor ${id} by user ${userId} dto=${JSON.stringify(dto)}`);
            return updated;
        }
        catch (error) {
            (0, prisma_error_util_1.handlePrismaError)(error);
        }
    }
    async remove(userId, id) {
        try {
            const exists = await this.prisma.monitor.findFirst({
                where: { id, userId },
                select: { id: true },
            });
            if (!exists) {
                throw new common_1.NotFoundException('Monitor not found.');
            }
            await this.prisma.monitor.delete({ where: { id } });
            this.logger.log(`AUDIT delete monitor ${id} by user ${userId}`);
        }
        catch (error) {
            (0, prisma_error_util_1.handlePrismaError)(error);
        }
    }
};
exports.MonitorsService = MonitorsService;
exports.MonitorsService = MonitorsService = MonitorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MonitorsService);
//# sourceMappingURL=monitors.service.js.map