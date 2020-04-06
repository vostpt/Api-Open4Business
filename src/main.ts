import { NestFactory,  } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';

import { AppModule } from './app.module';

import { EnvironmentService } from './modules/core';
import { SwaggerService } from './modules/core';

import { join } from 'path';

import { swaggerRoutes } from './config/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet()); // Helmet protects from some well-known web vulnerabilities by setting HTTP headers appropriately.
  app.enableCors();

  // Define assets folder as public access.
  app.useStaticAssets(join(__dirname, 'assets'), { prefix: '/assets' });

  // Configure Swagger documentation.
  app.get(SwaggerService).init(app, swaggerRoutes);

  // Prepare environment settings and start application.
  const logger = app.get(Logger);
  const environmentService = app.get(EnvironmentService);
  if (environmentService.isValid() ) {
    await app.listen(environmentService.variables.APP_PORT);
    logger.log(`Application STARTED successfully at ${environmentService.variables.APP_URL} (port: ${environmentService.variables.APP_PORT})`, 'Main');
  }
  else {
    logger.error(`Application TERMINATED`, null, 'Main');
    app.close();
  }

}

bootstrap();
