import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { HttpProblemFilter } from './common/errors/http-problem.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const config = app.get(AppConfigService);

  app.useLogger(app.get(PinoLogger));
  app.use(helmet());

  app.enableCors({
    origin: config.get('CORS_ORIGIN').split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpProblemFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hotel Booking API')
    .setDescription('Internal API surface for the hotel booking management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get('PORT');
  await app.listen(port);
  app.get(PinoLogger).log(`api listening on http://localhost:${port} (${config.nodeEnv})`);
}

void bootstrap();
