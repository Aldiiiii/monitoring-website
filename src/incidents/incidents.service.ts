import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Incident } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListIncidentsDto } from './dto/list-incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListIncidentsDto): Promise<Incident[]> {
    const where: Prisma.IncidentWhereInput = {
      monitorId: query.monitorId,
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

  async findOne(id: string): Promise<Incident> {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      throw new NotFoundException('Incident not found.');
    }

    return incident;
  }
}
