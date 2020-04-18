
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ValidationError, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as helmet from 'helmet';

import getRoutesTree from './config/routes';
import { environment } from './config/environment';

import { AppModule } from './app.module';

import { TimeoutInterceptor } from './modules/core/interceptors/timeout.interceptor';

import { AuthDocumentation } from './modules/auth/auth.swagger';
import { AdminDocumentation } from './modules/admin/admin.swagger';
import { SwaggerOptionsHelper } from './modules/core/helpers/swagger-options.helper';
import { InsightsDocumentation } from './modules/insights/insights.swagger';
import { BusinessesDocumentation } from './modules/businesses/businesses.swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.use(helmet());
  app.useLogger(app.get(Logger));
  app.useStaticAssets(join(__dirname, '/../assets'));
  app.useGlobalInterceptors(new TimeoutInterceptor());
  app.useGlobalPipes(new ValidationPipe(
    {
      exceptionFactory: (errors: ValidationError[]) => {
        const final = {
          errors:
            errors.map(error => {
              const _return = {};
              _return[error.property] = error.constraints[Object.keys(error.constraints)[0]];
              return _return;
            })

        }
        return final;
      }
    }
  ));

  const customCss = SwaggerOptionsHelper.getDefaultImage();
  const routesTree = getRoutesTree();
  const swaggerCustomization = { customCss, customfavIcon: '/assets/images/favicon.ico' };

  AdminDocumentation.init(app, routesTree, {...swaggerCustomization, customSiteTitle: 'O4B - Admin API'});
  AuthDocumentation.init(app, routesTree, {...swaggerCustomization, customSiteTitle: 'O4B - Auth API'});
  InsightsDocumentation.init(app, routesTree, {...swaggerCustomization, customSiteTitle: 'O4B - Insights API'});
  BusinessesDocumentation.init(app, routesTree, {...swaggerCustomization, customSiteTitle: 'O4B - Businesses API'});

  app.get(Logger).log(`Running on port ${environment.port}`);
  await app.listen(environment.port);
}

bootstrap();
