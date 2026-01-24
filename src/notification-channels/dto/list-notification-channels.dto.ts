import { ChannelType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListNotificationChannelsDto {
  @IsOptional()
  @IsString()
  monitorId?: string;

  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isEnabled?: boolean;

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
