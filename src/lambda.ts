// Dependencies
import 'reflect-metadata';
import helmet from 'helmet';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { Handler } from 'aws-lambda';

// Dependencies
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Usamos require() conforme exemplo oficial de NestJS + Vendia
const serverlessExpress = require('@vendia/serverless-express');

import { AppModule } from './app.module';

let cachedHandler: Handler;

async function bootstrap(): Promise<Handler> {
  if (!cachedHandler) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);

    app.use(helmet());
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    const config = new DocumentBuilder()
      .setTitle('API Refund Notes')
      .setDescription('Refund Notes API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();

    cachedHandler = serverlessExpress({ app: expressApp });
  }
  return cachedHandler;
}

export const handler: Handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const handlerFunc = await bootstrap();
  return handlerFunc(event, context, callback);
};

