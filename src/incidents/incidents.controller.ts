import { Controller, Get, Param, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { ListIncidentsDto } from './dto/list-incidents.dto';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  findAll(@Query() query: ListIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }
}
