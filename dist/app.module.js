"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const checks_module_1 = require("./checks/checks.module");
const incidents_module_1 = require("./incidents/incidents.module");
const auth_module_1 = require("./auth/auth.module");
const monitors_module_1 = require("./monitors/monitors.module");
const maintenance_windows_module_1 = require("./maintenance-windows/maintenance-windows.module");
const notification_channels_module_1 = require("./notification-channels/notification-channels.module");
const reports_module_1 = require("./reports/reports.module");
const users_module_1 = require("./users/users.module");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 300,
                },
                {
                    name: 'auth',
                    ttl: 60000,
                    limit: 5,
                },
                {
                    name: 'write',
                    ttl: 60000,
                    limit: 30,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            monitors_module_1.MonitorsModule,
            maintenance_windows_module_1.MaintenanceWindowsModule,
            notification_channels_module_1.NotificationChannelsModule,
            reports_module_1.ReportsModule,
            users_module_1.UsersModule,
            checks_module_1.ChecksModule,
            incidents_module_1.IncidentsModule,
            health_module_1.HealthModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map