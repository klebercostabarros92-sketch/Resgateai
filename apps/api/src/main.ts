import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ── Security ────────────────────────────────────────────────
  app.use(helmet.default());
  app.use(compression());

  // ── CORS ────────────────────────────────────────────────────
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3001')
    .split(',');
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    credentials: true,
  });

  // ── Versioning ──────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api/v1');

  // ── WebSocket ───────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── Pipes / Filters / Interceptors ──────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ── Swagger (não expor em produção sem auth) ─────────────────
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RESGATE AI API')
      .setDescription('Plataforma de Gestão de Auto Socorro e Guinchos')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação e autorização')
      .addTag('occurrences', 'Central de ocorrências')
      .addTag('dispatch', 'Despacho inteligente')
      .addTag('vehicles', 'Gestão da frota')
      .addTag('drivers', 'Motoristas')
      .addTag('clients', 'Clientes')
      .addTag('financial', 'Financeiro')
      .addTag('reports', 'Relatórios')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📖 Swagger disponível em: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 RESGATE AI API rodando na porta ${port} [${nodeEnv}]`);
  logger.log(`🌐 URL: http://localhost:${port}/api/v1`);
}

bootstrap();
