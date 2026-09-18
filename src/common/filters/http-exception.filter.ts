import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const excResponse = exception.getResponse() as any;

      // Nest ValidationPipe returns { message: string[], error, statusCode }
      let message: string = exception.message;
      let details: any = undefined;

      if (typeof excResponse === 'object' && excResponse !== null) {
        if (Array.isArray(excResponse.message)) {
          message = 'Validation failed';
          details = excResponse.message.map((msg: string) => {
            // msg like "email must be an email"
            const parts = msg.split(' ');
            return { field: parts[0], issue: msg };
          });
        } else if (typeof excResponse.message === 'string') {
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

    // Fallback for non-HttpException
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    });
  }

  private toErrorCode(status: number, message: string): string {
    if (status === 400) return 'VALIDATION_ERROR';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (message.includes('Throttler')) return 'RATE_LIMITED';
    return 'ERROR';
  }
}
