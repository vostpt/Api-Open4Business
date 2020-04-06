class SwaggerDocumentsModel {
  name: string;
  description: string;
  path: string;
  version: string;
  modules: any[];
  authentication?: string;

}

class SwaggerGroupsModel {
  name: string;
  description: string;
  documents: SwaggerDocumentsModel[]
}

export class SwaggerOptionsModel {
  configuration: {
    header: {
      imagePath?: string,   // Relative path to image (could be a static image or an endpoint)
      imageWidth?: number
    }
  };
  groups?: SwaggerGroupsModel[]

  constructor(data: Partial<SwaggerOptionsModel>) {

    this.configuration.header.imagePath   = (data.configuration.header.imagePath ? data.configuration.header.imagePath : 'assets/images/defaultSwaggerLogo.png');
    this.configuration.header.imageWidth  = (data.configuration.header.imageWidth ? data.configuration.header.imageWidth : 150);

    this.groups = data.groups;

  }

}