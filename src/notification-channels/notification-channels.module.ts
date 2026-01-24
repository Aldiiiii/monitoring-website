import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationChannelsController } from './notification-channels.controller';
import { NotificationChannelsService } from './notification-channels.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationChannelsController],
  providers: [NotificationChannelsService],
})
export class NotificationChannelsModule {}
