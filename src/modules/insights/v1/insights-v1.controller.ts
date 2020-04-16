import {Body, Controller, Get, Logger, Post, Res} from '@nestjs/common';
import {ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {ResponseModel} from '../../auth/v1/models/response.model';
import {getResponse} from '../../core/helpers/response.helper';
import {BusinessModel} from '../../core/models/business.model';
import {SuccessResponseModel} from '../../core/models/success-response.model';
import {BusinessService} from '../../core/services/business.service';
import {LocationService} from '../../core/services/location.service';
import {MailSenderService} from '../../core/services/mailsender.service';

@Controller('insights/v1')
@ApiBearerAuth()
// @UseGuards(AuthGuard)
@ApiTags('Insights')
export class InsightsV1Controller {
  constructor(
      private readonly locationService: LocationService,
      private readonly businessService: BusinessService,
      private readonly mailService: MailSenderService,
      private readonly logger: Logger) {
    this.logger.log('Init insights controller', InsightsV1Controller.name);
  }

  @Post('business')
  @ApiOperation({summary: 'Register a business'})
  @ApiCreatedResponse({description: 'Successfully registered business', type: BusinessModel})
  @ApiBadRequestResponse({description: 'Invalid business info'})
  async createBusiness(@Body() business: BusinessModel, @Res() res: Response):
      Promise<object> {
    let response: ResponseModel = null;
    const newBusiness = await this.businessService.createBusiness(business);

    // Send notification email to admin

    // const locals = {
    //   emailToSend: 'pedro.santos@domatica.pt',
    //   userEmail: business.email,
    //   userName: business.company,
    //   activationUrl: 'http://localhost:8000/api/v1/auth'
    // };

    // this.mailService.sendSignUpNotificationEmail(locals);

    response = getResponse(200, {data: newBusiness});

    // try {
    //   const newBusiness = await
    //   this.businessService.createBusiness(business);

    //   if (newBusiness) {
    //     response = getResponse(200, {data: {business: newBusiness}});
    //   } else {
    //     this.logger.error('Invalid company info.');
    //     response = getResponse(400, {resultMessage: 'Invalid company
    //     info.'});
    //   }
    // } catch (e) {
    //   this.logger.error('Error creating business', e);
    //   response =
    //       getResponse(400, {resultMessage: 'Invalid company info.', data:
    //       e});
    // }

    return res.status(response.resultCode).send(response);
  }

  @Get('locations')
  @ApiOperation({summary: 'Get locations'})
  @ApiOkResponse({description: 'Request is valid', type: SuccessResponseModel})
  async getLocations(@Res() res: Response): Promise<object> {
    const locations = await this.locationService.getLocations({});

    const response = {data: {locations}};
    return res.status(200).send(response);
  }
}
