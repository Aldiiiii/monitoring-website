import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListMaintenanceWindowsDto {
  @IsOptional()
  @IsString()
  monitorId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;
}
