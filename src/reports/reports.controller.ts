import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { UptimeReportDto } from './dto/uptime-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('uptime')
  getUptime(
    @CurrentUser() user: { id: string } | null,
    @Query() query: UptimeReportDto,
  ) {
    return this.reportsService.getUptimeReport(
      user?.id ?? '',
      query.monitorId,
      query.days ?? 7,
    );
  }
}
