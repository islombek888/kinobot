import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);

    // Allow CORS if needed (good for webhooks but usually not needed for polling)
    app.enableCors();

    // Enable graceful shutdown
    app.enableShutdownHooks();

    // Get port from environment variables (Required for Render)
    const port = process.env.PORT || 3000;

    // Listen on 0.0.0.0 to be accessible from outside the container (Required for Render)
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
    logger.log(`🤖 Bot is starting...`);
  } catch (error) {

    logger.error(`❌ Application failed to start: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();