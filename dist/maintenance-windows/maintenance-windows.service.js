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
exports.MaintenanceWindowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MaintenanceWindowsService = class MaintenanceWindowsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const monitor = await this.prisma.monitor.findFirst({
            where: { id: dto.monitorId, userId },
            select: { id: true },
        });
        if (!monitor) {
            throw new common_1.NotFoundException('Monitor not found.');
        }
        const startAt = new Date(dto.startAt);
        const endAt = new Date(dto.endAt);
        if (!(startAt.getTime() < endAt.getTime())) {
            throw new common_1.NotFoundException('endAt must be after startAt.');
        }
        return this.prisma.maintenanceWindow.create({
            data: {
                monitorId: dto.monitorId,
                startAt,
                endAt,
                note: dto.note ?? null,
            },
        });
    }
    async findAll(userId, query) {
        const where = {
            monitorId: query.monitorId,
            monitor: { userId },
            startAt: query.from || query.to
                ? {
                    gte: query.from ? new Date(query.from) : undefined,
                    lte: query.to ? new Date(query.to) : undefined,
                }
                : undefined,
        };
        return this.prisma.maintenanceWindow.findMany({
            where,
            orderBy: { startAt: 'desc' },
            skip: query.skip,
            take: query.take ?? 100,
        });
    }
    async findOne(userId, id) {
        const window = await this.prisma.maintenanceWindow.findFirst({
            where: { id, monitor: { userId } },
        });
        if (!window) {
            throw new common_1.NotFoundException('Maintenance window not found.');
        }
        return window;
    }
    async update(userId, id, dto) {
        const window = await this.prisma.maintenanceWindow.findFirst({
            where: { id, monitor: { userId } },
            select: { id: true },
        });
        if (!window) {
            throw new common_1.NotFoundException('Maintenance window not found.');
        }
        const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
        const endAt = dto.endAt ? new Date(dto.endAt) : undefined;
        if (startAt && endAt && !(startAt.getTime() < endAt.getTime())) {
            throw new common_1.NotFoundException('endAt must be after startAt.');
        }
        return this.prisma.maintenanceWindow.update({
            where: { id },
            data: {
                startAt,
                endAt,
                note: dto.note ?? undefined,
            },
        });
    }
    async remove(userId, id) {
        const window = await this.prisma.maintenanceWindow.findFirst({
            where: { id, monitor: { userId } },
            select: { id: true },
        });
        if (!window) {
            throw new common_1.NotFoundException('Maintenance window not found.');
        }
        await this.prisma.maintenanceWindow.delete({ where: { id } });
    }
};
exports.MaintenanceWindowsService = MaintenanceWindowsService;
exports.MaintenanceWindowsService = MaintenanceWindowsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceWindowsService);
//# sourceMappingURL=maintenance-windows.service.js.map