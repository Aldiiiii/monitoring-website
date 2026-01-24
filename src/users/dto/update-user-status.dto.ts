import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserStatusDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
