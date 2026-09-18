import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // PRD 12.4: Checks 30-90 hari (default 90), incidents 12 bulan disimpan. Job harian midnight.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async pruneOldChecks(): Promise<void> {
    const retentionDays = Number(process.env.CHECKS_RETENTION_DAYS ?? 90);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    try {
      const result = await this.prisma.check.deleteMany({
        where: { checkedAt: { lt: cutoff } },
      });
      if (result.count > 0) {
        this.logger.log(`Pruned ${result.count} checks older than ${cutoff.toISOString()}`);
      }
    } catch (error) {
      this.logger.error('Failed to prune old checks', error as Error);
    }
  }
}
