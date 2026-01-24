import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  // PrismaService is shared across modules via exports.
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
