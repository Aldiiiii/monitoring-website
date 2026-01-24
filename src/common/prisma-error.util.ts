import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new BadRequestException('Unique constraint failed.');
    }

    if (error.code === 'P2025') {
      throw new NotFoundException('Record not found.');
    }
  }

  throw error;
}
