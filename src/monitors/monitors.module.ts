import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MonitorsController } from './monitors.controller';
import { MonitorsService } from './monitors.service';

@Module({
  imports: [PrismaModule],
  controllers: [MonitorsController],
  providers: [MonitorsService],
})
export class MonitorsModule {}
