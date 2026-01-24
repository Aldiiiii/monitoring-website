import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ChecksService } from './checks.service';
import { ListChecksDto } from './dto/list-checks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('checks')
@UseGuards(JwtAuthGuard)
export class ChecksController {
  constructor(private readonly checksService: ChecksService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string } | null, @Query() query: ListChecksDto) {
    return this.checksService.findAll(user?.id ?? '', query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string } | null, @Param('id') id: string) {
    return this.checksService.findOne(user?.id ?? '', id);
  }
}
