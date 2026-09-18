"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const ACCESS_TOKEN_TTL_SEC = 60 * 60;
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.BadRequestException('Email already registered.');
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
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('Please login with Google for this account.');
        }
        const passwordOk = await bcrypt.compare(dto.password, user.password);
        if (!passwordOk) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
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
    async validateGoogleUser(profile) {
        const email = profile.emails[0]?.value;
        if (!email) {
            throw new common_1.BadRequestException('Email not provided by Google.');
        }
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
        const created = await this.prisma.user.create({
            data: {
                name: profile.displayName,
                email,
                googleId: profile.id,
                avatar: profile.photos[0]?.value,
                password: null,
            },
            select: { id: true, name: true, email: true, role: true, isActive: true },
        });
        return this.generateToken(created);
    }
    async generateToken(user) {
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated.');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map