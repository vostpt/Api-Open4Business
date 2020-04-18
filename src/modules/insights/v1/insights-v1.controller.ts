import { Body, Controller, Get, Logger, Post, Res, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as generator from 'generate-password';
import { environment } from '../../../config/environment';
import { ResponseModel } from '../../auth/v1/models/response.model';
import { AccountService } from '../../businesses/v1/services/account.service';
import { getResponse } from '../../core/helpers/response.helper';
import { BusinessModel } from '../../core/models/business.model';
import { SuccessResponseModel } from '../../core/models/success-response.model';
import { BusinessService } from '../../core/services/business.service';
import { LocationService } from '../../core/services/location.service';
import { MailSenderService } from '../../core/services/mailsender.service';


@Controller('api/insights/v1')
@ApiBearerAuth()
// @UseGuards(AuthGuard)
@ApiTags('Insights')
export class InsightsV1Controller {
  constructor(
    private readonly accountService: AccountService,
    private readonly locationService: LocationService,
    private readonly businessService: BusinessService,
    private readonly mailService: MailSenderService,
    private readonly logger: Logger) {
    this.logger.log('Init insights controller', InsightsV1Controller.name);
  }

  @Post('business')
  @ApiOperation({ summary: 'Register a business' })
  @ApiCreatedResponse({ description: 'Successfully registered business', type: BusinessModel })
  @ApiBadRequestResponse({ description: 'Invalid business info' })
  async createBusiness(@Body() business: BusinessModel, @Res() res: Response): Promise<object> {
    let response: ResponseModel = null;
    let newBusiness;
    try {
      newBusiness = await this.businessService.createBusiness(business);
    } catch (e) {
      if (e.code === 11000) {
        this.logger.error('Duplicated email when on signup', e);
        response = getResponse(409, { resultMessage: 'Already exists' });
      }
      else {
        this.logger.error('Error on signup', e);
        response = getResponse(400, { data: e });
      }

      return res.status(response.resultCode).send(response);
    }

    try {
      const authId = business.email;
      const password = generator.generate({ length: 8, numbers: true });
      const name = business.name;

      const account = await (await this.accountService.createAccount(authId, password, name)).toPromise();

      // Send notification email to admin
      const locals = {
        emailToSend: environment.adminEmail,
        userEmail: business.email,
        userName: business.company,
        activationUrl: `${environment.portal}/businesses/confirm?token=${account.data.activationToken}&confirmationCode=${account.data.confirmationCode}`
      };

      this.mailService.sendSignUpNotificationEmail(locals);

      // Send notification email to user
      const userLocals = {
        emailToSend: environment.adminEmail,
        password: password,
      };

      this.mailService.sendConfirmAccountEmail(userLocals);
    } catch (e) {
      response = getResponse(400, { data: e });
    }



    response = getResponse(200, { data: newBusiness });

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
  @ApiOperation({ summary: 'Get locations' })
  @ApiOkResponse({ description: 'Request is valid', type: SuccessResponseModel })
  async getLocations(
    @Query('search') search: string,
    @Res() res: Response): Promise<object> {
    const exp = new RegExp('.*' + search + '.*', 'i');
    const filter = search ? { $or: [{ authId: { $regex: exp } }, { name: { $regex: exp } }] } : {};

    const locations = await this.locationService.getLocations(filter);

    const response = { data: { locations } };
    return res.status(200).send(response);
  }
}
