import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType, NotificationChannel, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { ListNotificationChannelsDto } from './dto/list-notification-channels.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';

@Injectable()
export class NotificationChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateNotificationChannelDto,
  ): Promise<NotificationChannel> {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: dto.monitorId, userId },
      select: { id: true },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found.');
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

  async findAll(
    userId: string,
    query: ListNotificationChannelsDto,
  ): Promise<NotificationChannel[]> {
    const where: Prisma.NotificationChannelWhereInput = {
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

  async findOne(userId: string, id: string): Promise<NotificationChannel> {
    const channel = await this.prisma.notificationChannel.findFirst({
      where: { id, monitor: { userId } },
    });

    if (!channel) {
      throw new NotFoundException('Notification channel not found.');
    }

    return channel;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNotificationChannelDto,
  ): Promise<NotificationChannel> {
    const channel = await this.prisma.notificationChannel.findFirst({
      where: { id, monitor: { userId } },
    });

    if (!channel) {
      throw new NotFoundException('Notification channel not found.');
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

  async remove(userId: string, id: string): Promise<void> {
    const channel = await this.prisma.notificationChannel.findFirst({
      where: { id, monitor: { userId } },
      select: { id: true },
    });

    if (!channel) {
      throw new NotFoundException('Notification channel not found.');
    }

    await this.prisma.notificationChannel.delete({ where: { id } });
  }

  private ensureTelegramFields(type: ChannelType, chatId?: string) {
    if (type === ChannelType.TELEGRAM && !chatId) {
      throw new BadRequestException('telegramChatId is required for TELEGRAM.');
    }
  }
}
