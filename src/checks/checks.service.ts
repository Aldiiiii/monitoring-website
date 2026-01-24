import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Check } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListChecksDto } from './dto/list-checks.dto';

@Injectable()
export class ChecksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListChecksDto): Promise<Check[]> {
    const where: Prisma.CheckWhereInput = {
      monitorId: query.monitorId,
      status: query.status,
      checkedAt:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
    };

    return this.prisma.check.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      skip: query.skip,
      take: query.take ?? 100,
    });
  }

  async findOne(id: string): Promise<Check> {
    const check = await this.prisma.check.findUnique({ where: { id } });
    if (!check) {
      throw new NotFoundException('Check not found.');
    }

    return check;
  }
}
