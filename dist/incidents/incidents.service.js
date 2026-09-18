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
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IncidentsService = class IncidentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, query) {
        const where = {
            monitorId: query.monitorId,
            monitor: { userId },
            startedAt: query.from || query.to
                ? {
                    gte: query.from ? new Date(query.from) : undefined,
                    lte: query.to ? new Date(query.to) : undefined,
                }
                : undefined,
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.incident.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                skip: query.skip,
                take: query.take ?? 100,
            }),
            this.prisma.incident.count({ where }),
        ]);
        return { data, total };
    }
    async findOne(userId, id) {
        const incident = await this.prisma.incident.findFirst({
            where: { id, monitor: { userId } },
        });
        if (!incident) {
            throw new common_1.NotFoundException('Incident not found.');
        }
        return incident;
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map