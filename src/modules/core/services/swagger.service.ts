import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { EnvironmentService } from './environment.service';

import { UrlModel } from '../models/url.model';
import { SwaggerOptionsModel } from '../models/swagger-options.model'


@Injectable()
export class SwaggerService {

  constructor(
    private readonly environmentService: EnvironmentService,
  ) { }

  init(app: INestApplication, options: SwaggerOptionsModel): void {

    // Overwrite CSS options!
    const headerImageUrl = new UrlModel(this.environmentService.variables.APP_URL).setPath('assets/images/defaultSwaggerLogo.png').buildUrl();
    const cssOptions = {
      // customCss: '.swagger-ui .topbar { display: none }' .swagger-ui .topbar { background-color: white; }`
      customCss: `.topbar-wrapper img {content:url(\'${headerImageUrl}\'); width:${options.configuration.header.imageWidth}px; height:auto;}`
    };


    if (options.groups) {
      options.groups.forEach(group => {

        group.documents.forEach(document => {

          const options = new DocumentBuilder()
            .setTitle(document.name)
            .setDescription(document.description)
            .setVersion(document.version)
            .addServer(this.environmentService.variables.APP_URL)

          if (!document.authentication || document.authentication === 'bearer') {
            options.addBearerAuth();
          }

          const publicResourcesDocument = SwaggerModule.createDocument(app, options.build(),
            {
              include: document.modules,
              ignoreGlobalPrefix: false,
            });

          SwaggerModule.setup(document.path, app, publicResourcesDocument, cssOptions);

        });
      });
    }

  }

}
