import { Controller, Get, Req, Res } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('')
  redirectBasePage(
    @Req() req: any,
    @Res() res: any
  ): any {
    // return this.appService.getIndexPages(req, res);
    res.writeHead(301, {Location: '/api'});
    res.end();
  }

  @Get('api')
  redirectApi(
    @Req() req: any,
    @Res() res: any
  ): any {
    return this.appService.getIndexPages(req, res);
  }

  @Get('api/docs*')
  getIndexPages(
    @Req() req: any,
    @Res() res: any
  ): any {
    return this.appService.getIndexPages(req, res);
  }

  @Get('assets/:folder/:asset')
  getAsset(
    @Req() req: any,
    @Res() res: any
  ): any {
    return res.sendFile(`assets/${req.params.folder}/${req.params.asset}`, { root: __dirname });
  }

  @Get('api/assets/:folder/:asset')
  apiGetAsset(
    @Req() req: any,
    @Res() res: any
  ): any {
    return res.sendFile(`assets/${req.params.folder}/${req.params.asset}`, { root: __dirname });
  }
  
}
