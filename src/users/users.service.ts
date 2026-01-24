import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/prisma-error.util';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<Partial<User>> {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existing) {
        throw new BadRequestException('Email already registered.');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);

      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          role: dto.role,
          password: passwordHash,
        },
        select: userSelect,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: ListUsersDto): Promise<Partial<User>[]> {
    const where: Prisma.UserWhereInput = {
      role: query.role,
      isActive: query.isActive,
    };

    return this.prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.take ?? 50,
    });
  }

  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<Partial<User>> {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('User not found.');
      }

      const passwordHash = dto.password
        ? await bcrypt.hash(dto.password, 10)
        : undefined;

      return await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          role: dto.role as UserRole | undefined,
          password: passwordHash,
        },
        select: userSelect,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deactivate(id: string): Promise<Partial<User>> {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('User not found.');
      }

      return await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: userSelect,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
