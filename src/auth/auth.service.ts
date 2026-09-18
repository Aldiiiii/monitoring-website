import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ACCESS_TOKEN_TTL_SEC = 60 * 60;

export interface GoogleProfile {
  id: string;
  emails: { value: string }[];
  displayName: string;
  photos: { value: string }[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please login with Google for this account.');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    };
  }

  async validateGoogleUser(profile: GoogleProfile) {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new BadRequestException('Email not provided by Google.');
    }

    // Check if user exists by googleId
    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.id },
    });

    if (existingByGoogleId) {
      const updated = await this.prisma.user.update({
        where: { id: existingByGoogleId.id },
        data: {
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
        },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      return this.generateToken(updated);
    }

    // Check if user exists by email
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      const linked = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.id,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
        },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      return this.generateToken(linked);
    }

    // Create new user
    const created = await this.prisma.user.create({
      data: {
        name: profile.displayName,
        email,
        googleId: profile.id,
        avatar: profile.photos[0]?.value,
        password: null, // OAuth user, no password
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return this.generateToken(created);
  }

  private async generateToken(user: { id: string; email: string; role: string; isActive: boolean }) {
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
    };
  }
}
