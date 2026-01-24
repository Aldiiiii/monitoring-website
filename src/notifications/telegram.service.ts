import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

type TelegramMessageParams = {
  chatId: string;
  text: string;
  threadId?: number | null;
  token?: string | null;
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  async sendMessage({
    chatId,
    text,
    threadId,
    token,
  }: TelegramMessageParams): Promise<void> {
    const botToken = token ?? process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      this.logger.warn('Telegram bot token is not configured.');
      return;
    }

    if (!chatId) {
      this.logger.warn('Telegram chatId is missing.');
      return;
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text,
      message_thread_id: threadId ?? undefined,
    });

    await new Promise<void>((resolve) => {
      const request = https.request(
        {
          hostname: 'api.telegram.org',
          path: `/bot${botToken}/sendMessage`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (response) => {
          response.resume();
          if (response.statusCode && response.statusCode >= 400) {
            this.logger.warn(`Telegram send failed with ${response.statusCode}.`);
          }
          resolve();
        },
      );

      request.on('error', (error) => {
        this.logger.warn(`Telegram send error: ${error.message}`);
        resolve();
      });

      request.write(payload);
      request.end();
    });
  }
}
