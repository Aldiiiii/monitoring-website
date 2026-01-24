import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MaintenanceWindowsController } from './maintenance-windows.controller';
import { MaintenanceWindowsService } from './maintenance-windows.service';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceWindowsController],
  providers: [MaintenanceWindowsService],
})
export class MaintenanceWindowsModule {}
