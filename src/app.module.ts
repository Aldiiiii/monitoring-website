import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ChecksModule } from './checks/checks.module';
import { IncidentsModule } from './incidents/incidents.module';
import { AuthModule } from './auth/auth.module';
import { MonitorsModule } from './monitors/monitors.module';
import { MaintenanceWindowsModule } from './maintenance-windows/maintenance-windows.module';
import { NotificationChannelsModule } from './notification-channels/notification-channels.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  // Feature modules are imported here so Nest can wire them up.
  imports: [
    ThrottlerModule.forRoot([
      {
        // Global: 60 requests per minute per IP
        ttl: 60000,
        limit: 60,
      },
      {
        // Auth burst: 5 requests per 60s (used via @Throttle on auth endpoints)
        name: 'auth',
        ttl: 60000,
        limit: 5,
      },
    ]),
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
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
