import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // SECURITY: Limit request body size (1MB) — prevents payload attacks
  app.use(require('express').json({ limit: '1mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '1mb' }));

  // Serve uploaded files as static assets
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // ═══════════════════════════════════════════════
  // SECURITY: Helmet — HTTP security headers
  // ═══════════════════════════════════════════════
  app.use(helmet());

  // ═══════════════════════════════════════════════
  // SECURITY: Global validation pipe
  // Strips unknown properties, transforms types,
  // and validates all incoming DTOs
  // ═══════════════════════════════════════════════
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,          // Strip properties not in DTO
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true,          // Auto-transform payloads to DTO instances
    disableErrorMessages: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // ═══════════════════════════════════════════════
  // SECURITY: Strict CORS — only allow known origins
  // ═══════════════════════════════════════════════
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    maxAge: 600, // Cache preflight for 10 minutes
  });

  // ═══════════════════════════════════════════════
  // SECURITY: Disable X-Powered-By header
  // ═══════════════════════════════════════════════
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Seed default admin
  const authService = app.get(AuthService);
  await authService.seedAdmin();

  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`  eVoting Backend running on http://localhost:${port}`);
  console.log(' Security: Helmet, Rate Limiting, Validation, CORS — enabled');
}
bootstrap();
