"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const https = require("https");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor() {
        this.logger = new common_1.Logger(TelegramService_1.name);
        this.cooldownMs = 5 * 60 * 1000;
        this.lastSentAt = new Map();
    }
    getDedupKey(chatId, text) {
        return `${chatId}:${text.split('\n')[0]}`;
    }
    async sendMessage({ chatId, text, threadId, token, }) {
        const botToken = token ?? process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            this.logger.warn('Telegram bot token is not configured.');
            return;
        }
        if (!chatId) {
            this.logger.warn('Telegram chatId is missing.');
            return;
        }
        const dedupKey = this.getDedupKey(chatId, text);
        const lastAt = this.lastSentAt.get(dedupKey);
        if (lastAt && Date.now() - lastAt < this.cooldownMs) {
            this.logger.log(`Telegram dedup skip for ${dedupKey}`);
            return;
        }
        const payload = JSON.stringify({
            chat_id: chatId,
            text,
            message_thread_id: threadId ?? undefined,
        });
        const maxRetries = 3;
        const timeoutMs = 8000;
        for (let attempt = 0; attempt < maxRetries; attempt += 1) {
            const success = await this.attemptSend(botToken, payload, timeoutMs);
            if (success) {
                this.lastSentAt.set(dedupKey, Date.now());
                return;
            }
            if (attempt < maxRetries - 1) {
                await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            }
        }
        this.logger.warn(`Telegram send failed after ${maxRetries} attempts for ${chatId}`);
    }
    attemptSend(botToken, payload, timeoutMs) {
        return new Promise((resolve) => {
            const request = https.request({
                hostname: 'api.telegram.org',
                path: `/bot${botToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            }, (response) => {
                response.resume();
                if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                    resolve(true);
                }
                else {
                    this.logger.warn(`Telegram send failed with ${response.statusCode}.`);
                    resolve(false);
                }
            });
            request.setTimeout(timeoutMs, () => {
                request.destroy(new Error('timeout'));
            });
            request.on('error', (error) => {
                this.logger.warn(`Telegram send error: ${error.message}`);
                resolve(false);
            });
            request.write(payload);
            request.end();
        });
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)()
], TelegramService);
//# sourceMappingURL=telegram.service.js.map