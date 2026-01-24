import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ChecksController],
  providers: [ChecksService],
})
export class ChecksModule {}
