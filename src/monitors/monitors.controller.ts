import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { ListMonitorsDto } from './dto/list-monitors.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  create(@Body() dto: CreateMonitorDto) {
    return this.monitorsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListMonitorsDto) {
    return this.monitorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.monitorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMonitorDto) {
    return this.monitorsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monitorsService.remove(id);
  }
}
