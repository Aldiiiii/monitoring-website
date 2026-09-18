import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the NestJS app using the root module.
  const app = await NestFactory.create(AppModule);
  // Security headers per PRD 12.6
  app.use(helmet());
  // Global API prefix per PRD 12.5 (Base URL: /api)
  app.setGlobalPrefix('api');
  // Allow the frontend (Vite) to call the API during development.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({ origin: frontendUrl, credentials: true });
  // Validate and transform incoming request bodies using DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // PRD 12.5: wrap success {data, meta} and error {error: {code,message,details}}.
  // Success wrapper is opt-in via interceptor — disabled globally to avoid breaking existing frontend
  // until frontend unwrapping is fully migrated. Enable per-controller with @UseInterceptors(TransformInterceptor)
  // Error formatting is global.
  const { HttpExceptionFilter } = await import('./common/filters/http-exception.filter');
  app.useGlobalFilters(new HttpExceptionFilter());
  // Default port is 3000 unless PORT is set.
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
