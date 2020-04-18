import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { BusinessesV1Module } from './v1/businesses-v1.module';

export class BusinessesDocumentation {

  static init(app, routesTree, swaggerCustomization): void {
    const businessesMenu = routesTree.find(menu => menu.name === 'Businesses');
    const businessesOptions = new DocumentBuilder()
      .setTitle(businessesMenu.name)
      .setDescription(businessesMenu.description)
      .setVersion(businessesMenu.children[0].version)
      .addBearerAuth()
      .build();
      console.log(businessesMenu);
      console.log(businessesOptions);
    const businessesDocument = SwaggerModule.createDocument(app, businessesOptions, { include: [BusinessesV1Module] });
    SwaggerModule.setup(`api/docs/${businessesMenu.children[0].path}`, app, businessesDocument, swaggerCustomization);
  }
}
