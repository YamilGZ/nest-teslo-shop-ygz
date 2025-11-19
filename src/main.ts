import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  app.setGlobalPrefix('api');

  app.useGlobalPipes( 
    new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: true, 
    }) 
   );

   const config = new DocumentBuilder()
    .setTitle('Teslo RESTFul API')
    .setDescription('API REST para la gestión de productos de Teslo Shop. Incluye autenticación JWT, gestión de productos, subida de imágenes y sistema de roles.\n\n**Instrucciones de uso:**\n1. Primero registra un usuario o inicia sesión con las credenciales del seed (test1@google.com / Abc123)\n2. Copia el token JWT de la respuesta\n3. Haz clic en el botón "Authorize" (🔒) arriba a la derecha\n4. Pega el token en el campo "Value" (sin la palabra "Bearer")\n5. Haz clic en "Authorize" y luego "Close"\n6. Ahora puedes usar todos los endpoints protegidos')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingresa el token JWT obtenido del endpoint /api/auth/login. Solo pega el token, Swagger agregará automáticamente "Bearer " al inicio.',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`App running on port ${ process.env.PORT }`);
}
bootstrap();
