import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChecksModule } from './checks/checks.module';
import { IncidentsModule } from './incidents/incidents.module';
import { AuthModule } from './auth/auth.module';
import { MonitorsModule } from './monitors/monitors.module';
import { MaintenanceWindowsModule } from './maintenance-windows/maintenance-windows.module';
import { NotificationChannelsModule } from './notification-channels/notification-channels.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  // Feature modules are imported here so Nest can wire them up.
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MonitorsModule,
    MaintenanceWindowsModule,
    NotificationChannelsModule,
    ReportsModule,
    UsersModule,
    ChecksModule,
    IncidentsModule,
  ],
})
export class AppModule {}
