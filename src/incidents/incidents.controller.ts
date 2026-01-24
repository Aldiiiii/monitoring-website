import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { ListIncidentsDto } from './dto/list-incidents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string } | null,
    @Query() query: ListIncidentsDto,
  ) {
    return this.incidentsService.findAll(user?.id ?? '', query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string } | null, @Param('id') id: string) {
    return this.incidentsService.findOne(user?.id ?? '', id);
  }
}
