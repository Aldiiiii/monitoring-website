import { ChannelType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateNotificationChannelDto {
  @IsString()
  monitorId: string;

  @IsEnum(ChannelType)
  type: ChannelType;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsOptional()
  @IsInt()
  telegramThreadId?: number;

  @IsOptional()
  @IsString()
  telegramBotToken?: string;
}
