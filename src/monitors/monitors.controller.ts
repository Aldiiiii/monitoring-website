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
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { ListMonitorsDto } from './dto/list-monitors.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('monitors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  // Create a new monitor.
  @Roles('ADMIN')
  create(@CurrentUser() user: { id: string } | null, @Body() dto: CreateMonitorDto) {
    return this.monitorsService.create(user?.id ?? '', dto);
  }

  @Get()
  // List monitors with optional query filters.
  findAll(@CurrentUser() user: { id: string } | null, @Query() query: ListMonitorsDto) {
    return this.monitorsService.findAll(user?.id ?? '', query);
  }

  @Get(':id')
  // Get a single monitor by id.
  findOne(@CurrentUser() user: { id: string } | null, @Param('id') id: string) {
    return this.monitorsService.findOne(user?.id ?? '', id);
  }

  @Patch(':id')
  // Update a monitor by id.
  @Roles('ADMIN')
  update(
    @CurrentUser() user: { id: string } | null,
    @Param('id') id: string,
    @Body() dto: UpdateMonitorDto,
  ) {
    return this.monitorsService.update(user?.id ?? '', id, dto);
  }

  @Delete(':id')
  // Delete a monitor by id.
  @Roles('ADMIN')
  remove(@CurrentUser() user: { id: string } | null, @Param('id') id: string) {
    return this.monitorsService.remove(user?.id ?? '', id);
  }
}
