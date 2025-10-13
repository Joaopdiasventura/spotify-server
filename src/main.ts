import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { static as Static } from 'express'
import { join } from 'node:path'
import { AppModule } from './app.module'
import type { Express, Request, Response } from 'express'

let server: Express

async function bootstrap(): Promise<Express> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(ConfigService)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true }
    })
  )

  app.enableCors({
    origin: configService.get('client.url'),
    methods: ['GET', 'DELETE', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })

  if (configService.get<string>('env') != 'production')
    app.use('/uploads', Static(join(__dirname, '..', 'uploads')))

  await app.init()
  await app.listen(configService.get<number>('port')!)
  return app.getHttpAdapter().getInstance()
}

export default async function handler(req: Request, res: Response): Promise<unknown> {
  if (!server) server = await bootstrap()
  return server(req, res)
}
