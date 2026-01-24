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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MaintenanceWindowsService } from './maintenance-windows.service';
import { CreateMaintenanceWindowDto } from './dto/create-maintenance-window.dto';
import { ListMaintenanceWindowsDto } from './dto/list-maintenance-windows.dto';
import { UpdateMaintenanceWindowDto } from './dto/update-maintenance-window.dto';

@Controller('maintenance-windows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceWindowsController {
  constructor(
    private readonly maintenanceWindowsService: MaintenanceWindowsService,
  ) {}

  @Post()
  @Roles('ADMIN')
  create(
    @CurrentUser() user: { id: string } | null,
    @Body() dto: CreateMaintenanceWindowDto,
  ) {
    return this.maintenanceWindowsService.create(user?.id ?? '', dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string } | null,
    @Query() query: ListMaintenanceWindowsDto,
  ) {
    return this.maintenanceWindowsService.findAll(user?.id ?? '', query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { id: string } | null,
    @Param('id') id: string,
  ) {
    return this.maintenanceWindowsService.findOne(user?.id ?? '', id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @CurrentUser() user: { id: string } | null,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceWindowDto,
  ) {
    return this.maintenanceWindowsService.update(user?.id ?? '', id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentUser() user: { id: string } | null, @Param('id') id: string) {
    return this.maintenanceWindowsService.remove(user?.id ?? '', id);
  }
}
