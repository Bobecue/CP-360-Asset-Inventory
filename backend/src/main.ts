import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for client-side API requests
  app.enableCors();
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend server is running on: http://localhost:${port}`);
}
bootstrap();