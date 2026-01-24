import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsString()
  @MinLength(8)
  password: string;
}
