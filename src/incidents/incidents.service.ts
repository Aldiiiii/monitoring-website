import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Incident } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListIncidentsDto } from './dto/list-incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListIncidentsDto): Promise<Incident[]> {
    const where: Prisma.IncidentWhereInput = {
      monitorId: query.monitorId,
      monitor: { userId },
      startedAt:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
    };

    return this.prisma.incident.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: query.skip,
      take: query.take ?? 100,
    });
  }

  async findOne(userId: string, id: string): Promise<Incident> {
    const incident = await this.prisma.incident.findFirst({
      where: { id, monitor: { userId } },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found.');
    }

    return incident;
  }
}
