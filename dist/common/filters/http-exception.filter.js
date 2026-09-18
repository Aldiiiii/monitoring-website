"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const excResponse = exception.getResponse();
            let message = exception.message;
            let details = undefined;
            if (typeof excResponse === 'object' && excResponse !== null) {
                if (Array.isArray(excResponse.message)) {
                    message = 'Validation failed';
                    details = excResponse.message.map((msg) => {
                        const parts = msg.split(' ');
                        return { field: parts[0], issue: msg };
                    });
                }
                else if (typeof excResponse.message === 'string') {
                    message = excResponse.message;
                    details = excResponse.details ?? undefined;
                }
            }
            const code = this.toErrorCode(status, message);
            return response.status(status).json({
                error: {
                    code,
                    message,
                    ...(details ? { details } : {}),
                },
            });
        }
        const message = exception instanceof Error ? exception.message : 'Internal server error';
        return response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: {
                code: 'INTERNAL_ERROR',
                message,
            },
        });
    }
    toErrorCode(status, message) {
        if (status === 400)
            return 'VALIDATION_ERROR';
        if (status === 401)
            return 'UNAUTHORIZED';
        if (status === 403)
            return 'FORBIDDEN';
        if (status === 404)
            return 'NOT_FOUND';
        if (status === 429)
            return 'RATE_LIMITED';
        if (message.includes('Throttler'))
            return 'RATE_LIMITED';
        return 'ERROR';
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map