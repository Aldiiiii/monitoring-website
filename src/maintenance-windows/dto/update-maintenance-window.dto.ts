import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateMaintenanceWindowDto {
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
