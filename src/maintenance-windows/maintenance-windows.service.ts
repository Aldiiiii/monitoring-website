import { Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceWindow, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceWindowDto } from './dto/create-maintenance-window.dto';
import { ListMaintenanceWindowsDto } from './dto/list-maintenance-windows.dto';
import { UpdateMaintenanceWindowDto } from './dto/update-maintenance-window.dto';

@Injectable()
export class MaintenanceWindowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateMaintenanceWindowDto,
  ): Promise<MaintenanceWindow> {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: dto.monitorId, userId },
      select: { id: true },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found.');
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (!(startAt.getTime() < endAt.getTime())) {
      throw new NotFoundException('endAt must be after startAt.');
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

  async findAll(
    userId: string,
    query: ListMaintenanceWindowsDto,
  ): Promise<MaintenanceWindow[]> {
    const where: Prisma.MaintenanceWindowWhereInput = {
      monitorId: query.monitorId,
      monitor: { userId },
      startAt:
        query.from || query.to
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

  async findOne(userId: string, id: string): Promise<MaintenanceWindow> {
    const window = await this.prisma.maintenanceWindow.findFirst({
      where: { id, monitor: { userId } },
    });

    if (!window) {
      throw new NotFoundException('Maintenance window not found.');
    }

    return window;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateMaintenanceWindowDto,
  ): Promise<MaintenanceWindow> {
    const window = await this.prisma.maintenanceWindow.findFirst({
      where: { id, monitor: { userId } },
      select: { id: true },
    });

    if (!window) {
      throw new NotFoundException('Maintenance window not found.');
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    const endAt = dto.endAt ? new Date(dto.endAt) : undefined;
    if (startAt && endAt && !(startAt.getTime() < endAt.getTime())) {
      throw new NotFoundException('endAt must be after startAt.');
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

  async remove(userId: string, id: string): Promise<void> {
    const window = await this.prisma.maintenanceWindow.findFirst({
      where: { id, monitor: { userId } },
      select: { id: true },
    });

    if (!window) {
      throw new NotFoundException('Maintenance window not found.');
    }

    await this.prisma.maintenanceWindow.delete({ where: { id } });
  }
}
