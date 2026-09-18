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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceWindowsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const maintenance_windows_service_1 = require("./maintenance-windows.service");
const create_maintenance_window_dto_1 = require("./dto/create-maintenance-window.dto");
const list_maintenance_windows_dto_1 = require("./dto/list-maintenance-windows.dto");
const update_maintenance_window_dto_1 = require("./dto/update-maintenance-window.dto");
let MaintenanceWindowsController = class MaintenanceWindowsController {
    constructor(maintenanceWindowsService) {
        this.maintenanceWindowsService = maintenanceWindowsService;
    }
    create(user, dto) {
        return this.maintenanceWindowsService.create(user?.id ?? '', dto);
    }
    findAll(user, query) {
        return this.maintenanceWindowsService.findAll(user?.id ?? '', query);
    }
    findOne(user, id) {
        return this.maintenanceWindowsService.findOne(user?.id ?? '', id);
    }
    update(user, id, dto) {
        return this.maintenanceWindowsService.update(user?.id ?? '', id, dto);
    }
    remove(user, id) {
        return this.maintenanceWindowsService.remove(user?.id ?? '', id);
    }
};
exports.MaintenanceWindowsController = MaintenanceWindowsController;
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ write: { limit: 30, ttl: 60000 } }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_maintenance_window_dto_1.CreateMaintenanceWindowDto]),
    __metadata("design:returntype", void 0)
], MaintenanceWindowsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_maintenance_windows_dto_1.ListMaintenanceWindowsDto]),
    __metadata("design:returntype", void 0)
], MaintenanceWindowsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MaintenanceWindowsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, throttler_1.Throttle)({ write: { limit: 30, ttl: 60000 } }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_maintenance_window_dto_1.UpdateMaintenanceWindowDto]),
    __metadata("design:returntype", void 0)
], MaintenanceWindowsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, throttler_1.Throttle)({ write: { limit: 30, ttl: 60000 } }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MaintenanceWindowsController.prototype, "remove", null);
exports.MaintenanceWindowsController = MaintenanceWindowsController = __decorate([
    (0, common_1.Controller)('maintenance-windows'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [maintenance_windows_service_1.MaintenanceWindowsService])
], MaintenanceWindowsController);
//# sourceMappingURL=maintenance-windows.controller.js.map