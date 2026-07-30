import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for client-side API requests
  app.enableCors();
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend server is running on: http://localhost:${port}`);
}
bootstrap();