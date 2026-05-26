import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
