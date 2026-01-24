import { MonitorType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateMonitorDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsEnum(MonitorType)
  type: MonitorType;

  @ValidateIf((value) => value.type === MonitorType.HTTP)
  @IsUrl({ require_tld: false })
  url?: string;

  @ValidateIf((value) => value.type === MonitorType.TCP)
  @IsString()
  host?: string;

  @ValidateIf((value) => value.type === MonitorType.TCP)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  expectCode?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  intervalSec?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  retries?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  retryDelayMs?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
