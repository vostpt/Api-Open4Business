import { Controller, Get, Logger, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { Response } from 'express';
import { getResponse } from '../core/helpers/response.helper';
import { MailSenderService } from '../core/services/mailsender.service';
import { environment } from '../../config/environment';
import { LocationService } from '../core/services/location.service';


@Controller('api/admin')
@ApiTags('Admin')
export class AdminController {
  constructor(
      private readonly logger: Logger,
      private readonly mailService: MailSenderService,
      private readonly locationService: LocationService,
      private readonly mongooseHealthIndicator: MongooseHealthIndicator) {
    this.logger.log('Init admin controller', AdminController.name);
  }

  @Get('status')
  @ApiOperation({ description: 'Return information about the API\'s status' })
  @ApiResponse({ status: 200, description: 'Status information returned sucessfully!' })
  @ApiResponse({ status: 500, description: 'Mongo DB is dead' })
  async status(@Res() res: Response) {
    const mongoState = await this.mongooseHealthIndicator.pingCheck('mongoDB');

    const status = {status: 'Running', mongoState: mongoState.mongoDB.status};

    return res.status(200).send(status);
  }

  @Get('test')
  @ApiOperation({ description: 'Test operations' })
  @ApiResponse({ status: 200, description: 'Status information returned sucessfully!' })
  @ApiResponse({ status: 500, description: 'Mongo DB is dead' })
  async test(@Res() res: Response) {
    
    // const locals = {
    //   company: 'Home',
    //   emailToSend: 'baldasman@hotmail.com',
    //   loginUrl: 'http://localhost:4200/auth/signin',
    //   guideUrl: `${environment.portal}/api/insights/v1/guide`
    // };
    
    // this.mailService.sendAccountConfirmedEmail(locals);

    this.locationService.updateBusinessRef();

    return res.status(200).send(getResponse(200));
  }
}
