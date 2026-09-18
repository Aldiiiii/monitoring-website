import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationChannelsService } from './notification-channels.service';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { ListNotificationChannelsDto } from './dto/list-notification-channels.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';

@Controller('notification-channels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationChannelsController {
  constructor(
    private readonly notificationChannelsService: NotificationChannelsService,
  ) {}

  @Post()
  @Throttle({ write: { limit: 30, ttl: 60000 } })
  @Roles('ADMIN')
  create(
    @CurrentUser() user: { id: string } | null,
    @Body() dto: CreateNotificationChannelDto,
  ) {
    return this.notificationChannelsService.create(user?.id ?? '', dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string } | null,
    @Query() query: ListNotificationChannelsDto,
  ) {
    return this.notificationChannelsService.findAll(user?.id ?? '', query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { id: string } | null,
    @Param('id') id: string,
  ) {
    return this.notificationChannelsService.findOne(user?.id ?? '', id);
  }

  @Patch(':id')
  @Throttle({ write: { limit: 30, ttl: 60000 } })
  @Roles('ADMIN')
  update(
    @CurrentUser() user: { id: string } | null,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationChannelDto,
  ) {
    return this.notificationChannelsService.update(user?.id ?? '', id, dto);
  }

  @Delete(':id')
  @Throttle({ write: { limit: 30, ttl: 60000 } })
  @Roles('ADMIN')
  remove(@CurrentUser() user: { id: string } | null, @Param('id') id: string) {
    return this.notificationChannelsService.remove(user?.id ?? '', id);
  }
}
