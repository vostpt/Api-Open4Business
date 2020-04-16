import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { InsightsV1Module } from './v1/insights-v1.module';

export class InsightsDocumentation {

  static init(app, routesTree, swaggerCustomization): void {
    const insightsMenu = routesTree.find(menu => menu.name === 'Insights');
    const insightsOptions = new DocumentBuilder()
      .setTitle(insightsMenu.name)
      .setDescription(insightsMenu.description)
      .setVersion(insightsMenu.children[0].version)
      .build();
      
    const insightsDocument = SwaggerModule.createDocument(app, insightsOptions, { include: [InsightsV1Module] });
    SwaggerModule.setup(`api/${insightsMenu.children[0].path}`, app, insightsDocument, swaggerCustomization);
  }
}
