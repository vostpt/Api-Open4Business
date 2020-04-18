import { readFileSync } from 'fs';
import { join } from 'path';

export class SwaggerOptionsHelper {
  static getDefaultImage() {
    let customCss = '';
    try {
      const img = readFileSync(join(__dirname, '../../../assets/images/default-domain-image.png')).toString('base64');
      customCss = `.topbar-wrapper img {content:url(data:image/png};base64,${img}); height: 50px;} .swagger-ui .topbar {padding: 10px 0 6px 0;background-color: #fafafa;}`;
    } catch (e) {
      // nothing happens
    }
    return customCss;
  }

}
