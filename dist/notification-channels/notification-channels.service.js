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
exports.NotificationChannelsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationChannelsService = class NotificationChannelsService {
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
        this.ensureTelegramFields(dto.type, dto.telegramChatId);
        return this.prisma.notificationChannel.create({
            data: {
                monitorId: dto.monitorId,
                type: dto.type,
                isEnabled: dto.isEnabled ?? true,
                telegramChatId: dto.telegramChatId ?? null,
                telegramThreadId: dto.telegramThreadId ?? null,
                telegramBotToken: dto.telegramBotToken ?? null,
            },
        });
    }
    async findAll(userId, query) {
        const where = {
            monitorId: query.monitorId,
            type: query.type,
            isEnabled: query.isEnabled,
            monitor: { userId },
        };
        return this.prisma.notificationChannel.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: query.skip,
            take: query.take ?? 100,
        });
    }
    async findOne(userId, id) {
        const channel = await this.prisma.notificationChannel.findFirst({
            where: { id, monitor: { userId } },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Notification channel not found.');
        }
        return channel;
    }
    async update(userId, id, dto) {
        const channel = await this.prisma.notificationChannel.findFirst({
            where: { id, monitor: { userId } },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Notification channel not found.');
        }
        const nextType = dto.type ?? channel.type;
        const nextChatId = dto.telegramChatId ?? channel.telegramChatId;
        this.ensureTelegramFields(nextType, nextChatId ?? undefined);
        return this.prisma.notificationChannel.update({
            where: { id },
            data: {
                type: dto.type ?? undefined,
                isEnabled: dto.isEnabled ?? undefined,
                telegramChatId: dto.telegramChatId ?? undefined,
                telegramThreadId: dto.telegramThreadId ?? undefined,
                telegramBotToken: dto.telegramBotToken ?? undefined,
            },
        });
    }
    async remove(userId, id) {
        const channel = await this.prisma.notificationChannel.findFirst({
            where: { id, monitor: { userId } },
            select: { id: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Notification channel not found.');
        }
        await this.prisma.notificationChannel.delete({ where: { id } });
    }
    ensureTelegramFields(type, chatId) {
        if (type === client_1.ChannelType.TELEGRAM && !chatId) {
            throw new common_1.BadRequestException('telegramChatId is required for TELEGRAM.');
        }
    }
};
exports.NotificationChannelsService = NotificationChannelsService;
exports.NotificationChannelsService = NotificationChannelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationChannelsService);
//# sourceMappingURL=notification-channels.service.js.map