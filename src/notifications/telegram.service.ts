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

  // Cooldown dedup per monitorId+status (PRD 12.3: 5 menit)
  private readonly cooldownMs = 5 * 60 * 1000;
  private readonly lastSentAt = new Map<string, number>();

  private getDedupKey(chatId: string, text: string): string {
    // Key by chatId + first line of text (contains monitor name + status)
    return `${chatId}:${text.split('\n')[0]}`;
  }

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

    // Dedup: skip if same message sent within cooldown window
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

  private attemptSend(botToken: string, payload: string, timeoutMs: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
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
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve(true);
          } else {
            this.logger.warn(`Telegram send failed with ${response.statusCode}.`);
            resolve(false);
          }
        },
      );

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
}
