"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePrismaError = handlePrismaError;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function handlePrismaError(error) {
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            throw new common_1.BadRequestException('Unique constraint failed.');
        }
        if (error.code === 'P2025') {
            throw new common_1.NotFoundException('Record not found.');
        }
    }
    throw error;
}
//# sourceMappingURL=prisma-error.util.js.map