import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
