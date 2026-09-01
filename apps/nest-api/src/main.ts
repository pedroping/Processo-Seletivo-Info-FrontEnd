import 'dotenv/config';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';
import { ALLOWED_ORIGINS, DEFAULT_PORT } from './common/constants/api.constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.enableCors({ origin: ALLOWED_ORIGINS, credentials: true });

  app.use(compression());
  app.use(cookieParser());

  const port = process.env['PORT'] || DEFAULT_PORT;

  await app.listen(port);

  Logger.log(`Server running on port ${port}`);
}

bootstrap();
