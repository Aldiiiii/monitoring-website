import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateMaintenanceWindowDto {
  @IsString()
  monitorId: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsString()
  note?: string;
}
