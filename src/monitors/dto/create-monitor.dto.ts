import { MonitorType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateMonitorDto {
  @IsString()
  name: string;

  @IsEnum(MonitorType)
  type: MonitorType;

  @ValidateIf((value) => value.type === MonitorType.HTTP)
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  url?: string;

  @ValidateIf((value) => value.type === MonitorType.TCP)
  @IsNotEmpty()
  @IsString()
  host?: string;

  @ValidateIf((value) => value.type === MonitorType.TCP)
  @Type(() => Number)
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
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(599)
  expectCode?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  intervalSec?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  timeoutMs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  retries?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  retryDelayMs?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
