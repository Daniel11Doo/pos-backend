import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function createApp() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN ?? '*';

  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('POS API')
    .setDescription('API del sistema de punto de venta')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y perfil de usuario')
    .addTag('Users', 'Gestión de usuarios del sistema')
    .addTag('Categories', 'Categorías de productos')
    .addTag('Products', 'Catálogo de productos e inventario')
    .addTag('Inventory', 'Movimientos de inventario (entradas, salidas y ajustes)')
    .addTag('Cash Registers', 'Cajas, sesiones y movimientos de efectivo')
    .addTag('Sales', 'Registro de ventas, cancelaciones y reembolsos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}

// En Vercel este archivo se importa como módulo (no se ejecuta directo), así
// que necesita exportar un handler serverless en vez de solo escuchar un
// puerto. Se cachea la instancia entre invocaciones "warm" de la función.
let cachedHandler: ((req: unknown, res: unknown) => void) | undefined;

export default async function handler(req: unknown, res: unknown) {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  const server = cachedHandler!;
  server(req, res);
}

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

// Solo levanta un servidor tradicional cuando este archivo se ejecuta
// directo (desarrollo local, `start:prod`) — no cuando Vercel lo importa
// como función serverless.
if (require.main === module) {
  bootstrap();
}
