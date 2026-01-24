import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChecksService } from './checks.service';
import { ListChecksDto } from './dto/list-checks.dto';

@Controller('checks')
export class ChecksController {
  constructor(private readonly checksService: ChecksService) {}

  @Get()
  findAll(@Query() query: ListChecksDto) {
    return this.checksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checksService.findOne(id);
  }
}
