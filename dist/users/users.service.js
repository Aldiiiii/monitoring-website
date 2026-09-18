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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_error_util_1 = require("../common/prisma-error.util");
const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        try {
            const existing = await this.prisma.user.findUnique({
                where: { email: dto.email },
                select: { id: true },
            });
            if (existing) {
                throw new common_1.BadRequestException('Email already registered.');
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
        }
        catch (error) {
            (0, prisma_error_util_1.handlePrismaError)(error);
        }
    }
    async findAll(query) {
        const where = {
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
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: userSelect,
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user;
    }
    async update(id, dto) {
        try {
            const existing = await this.prisma.user.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!existing) {
                throw new common_1.NotFoundException('User not found.');
            }
            const passwordHash = dto.password
                ? await bcrypt.hash(dto.password, 10)
                : undefined;
            return await this.prisma.user.update({
                where: { id },
                data: {
                    name: dto.name,
                    email: dto.email,
                    role: dto.role,
                    password: passwordHash,
                },
                select: userSelect,
            });
        }
        catch (error) {
            (0, prisma_error_util_1.handlePrismaError)(error);
        }
    }
    async deactivate(id) {
        try {
            const existing = await this.prisma.user.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!existing) {
                throw new common_1.NotFoundException('User not found.');
            }
            return await this.prisma.user.update({
                where: { id },
                data: { isActive: false },
                select: userSelect,
            });
        }
        catch (error) {
            (0, prisma_error_util_1.handlePrismaError)(error);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map