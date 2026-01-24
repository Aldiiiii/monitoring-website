import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Monitor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/prisma-error.util';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { ListMonitorsDto } from './dto/list-monitors.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@Injectable()
export class MonitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMonitorDto): Promise<Monitor> {
    try {
      return await this.prisma.monitor.create({
        data: {
          userId: dto.userId,
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
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: ListMonitorsDto): Promise<Monitor[]> {
    const where: Prisma.MonitorWhereInput = {
      userId: query.userId,
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

  async findOne(id: string): Promise<Monitor> {
    const monitor = await this.prisma.monitor.findUnique({ where: { id } });
    if (!monitor) {
      throw new NotFoundException('Monitor not found.');
    }

    return monitor;
  }

  async update(id: string, dto: UpdateMonitorDto): Promise<Monitor> {
    try {
      return await this.prisma.monitor.update({
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
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.monitor.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
