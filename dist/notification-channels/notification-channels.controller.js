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
exports.NotificationChannelsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const notification_channels_service_1 = require("./notification-channels.service");
const create_notification_channel_dto_1 = require("./dto/create-notification-channel.dto");
const list_notification_channels_dto_1 = require("./dto/list-notification-channels.dto");
const update_notification_channel_dto_1 = require("./dto/update-notification-channel.dto");
let NotificationChannelsController = class NotificationChannelsController {
    constructor(notificationChannelsService) {
        this.notificationChannelsService = notificationChannelsService;
    }
    create(user, dto) {
        return this.notificationChannelsService.create(user?.id ?? '', dto);
    }
    findAll(user, query) {
        return this.notificationChannelsService.findAll(user?.id ?? '', query);
    }
    findOne(user, id) {
        return this.notificationChannelsService.findOne(user?.id ?? '', id);
    }
    update(user, id, dto) {
        return this.notificationChannelsService.update(user?.id ?? '', id, dto);
    }
    remove(user, id) {
        return this.notificationChannelsService.remove(user?.id ?? '', id);
    }
};
exports.NotificationChannelsController = NotificationChannelsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_notification_channel_dto_1.CreateNotificationChannelDto]),
    __metadata("design:returntype", void 0)
], NotificationChannelsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_notification_channels_dto_1.ListNotificationChannelsDto]),
    __metadata("design:returntype", void 0)
], NotificationChannelsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificationChannelsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_notification_channel_dto_1.UpdateNotificationChannelDto]),
    __metadata("design:returntype", void 0)
], NotificationChannelsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificationChannelsController.prototype, "remove", null);
exports.NotificationChannelsController = NotificationChannelsController = __decorate([
    (0, common_1.Controller)('notification-channels'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [notification_channels_service_1.NotificationChannelsService])
], NotificationChannelsController);
//# sourceMappingURL=notification-channels.controller.js.map