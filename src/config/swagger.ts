import { SwaggerOptionsModel} from '../modules/core'

const BASE_PATH = 'api/';

export const swaggerRoutes: SwaggerOptionsModel = {
  configuration: {
    header: {
     // imagePath: 'assets/images/defaultSwaggerLogo.png',
      imageWidth: 150
    }
  },
  groups: [
    {
      name: 'Resources',
      description: 'CloudNode admin module',
      documents: [
        {
          name: 'AdminV1Module',
          description: 'some description',
          path: BASE_PATH + 'resource-management/v1',
          version: '1.2.7',
          modules: []
        }
      ]
    }
  ]
};