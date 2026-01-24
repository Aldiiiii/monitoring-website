import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the NestJS app using the root module.
  const app = await NestFactory.create(AppModule);
  // Allow the frontend (Vite) to call the API during development.
  app.enableCors({ origin: true });
  // Validate and transform incoming request bodies using DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Default port is 3000 unless PORT is set.
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
