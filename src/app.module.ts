import { Module } from '@nestjs/common';
import { ChecksModule } from './checks/checks.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MonitorsModule } from './monitors/monitors.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, MonitorsModule, ChecksModule, IncidentsModule],
})
export class AppModule {}
