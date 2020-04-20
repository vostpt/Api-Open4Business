import {Body, Controller, Get, Logger, Param, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, Delete} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {v1 as uuidv1, v4 as uuidv4} from 'uuid';

import {environment} from '../../../config/environment';
import {multerOptions} from '../../../config/multer.config';
import {ResponseModel} from '../../auth/v1/models/response.model';
import {AuthGuard} from '../../core/guards/auth.guard';
import {getResponse} from '../../core/helpers/response.helper';
import {BusinessModel} from '../../core/models/business.model';
import {LocationModel} from '../../core/models/location.model';
import {SuccessResponseModel} from '../../core/models/success-response.model';
import {BusinessService} from '../../core/services/business.service';
import {DecodeTokenService} from '../../core/services/decode-token.service';
import {LocationService} from '../../core/services/location.service';
import {MailSenderService} from '../../core/services/mailsender.service';

import {AccountService} from './services/account.service';
import {ParseService} from './services/parser.service';



@Controller('api/businesses/v1')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Businesses')
export class BusinessesV1Controller {
  constructor(
      private readonly accountService: AccountService,
      private readonly locationService: LocationService,
      private readonly businessService: BusinessService,
      private readonly mailService: MailSenderService,
      private readonly decodeTokenService: DecodeTokenService,
      private readonly parser: ParseService, private readonly logger: Logger) {
    this.logger.log('Init insights controller', BusinessesV1Controller.name);
  }

  @Post('business/logo')
  @ApiOperation({summary: 'Update business logo'})
  @ApiCreatedResponse({description: 'Successfully updated business logo', type: BusinessModel})
  @ApiBadRequestResponse({description: 'Invalid business info'})
  async updateBusinessLogo(
    @Param() logo: string, 
    @Req() req, 
    @Res() res: Response):
      Promise<object> {
    const email = req.context.authId;

    if (!logo) {
      return res.status(400).send(
          getResponse(400, {resultMessage: 'Missing "logo".'}));
    }

    try {
      const updatedBusiness = await this.businessService.updateBusiness(
          {query: {email: email}, update: {logo: logo}});

      return res.status(200).send(getResponse(200, {data: updatedBusiness}));
    } catch (e) {
      return res.status(400).send(
          getResponse(400, {resultMessage: 'In development!', data: e}));
    }
  }

  @Post('locations')
  @ApiOperation({summary: 'Add locations to a business'})
  @ApiCreatedResponse({description: 'Successfully added locations to a business', type: ResponseModel})
  @ApiBadRequestResponse({description: 'Invalid company info'})
  async addLocationsBusiness(
    @Body('email') personEmail: string, 
    @Body('name') personName: string, 
    @Body('dataFile') dataFile: string, 
    @Req() req, 
    @Res() res: Response
  ): Promise<object> {
    let response: ResponseModel;
    const email = req.context.authId;
    const batchId = uuidv4();
    let company: string;
    let companyEmail: string;
    let counter = 0;
    const errors = [];

    if (!dataFile) {
      return res.status(400).send(
          getResponse(400, {resultMessage: 'Missing "dataFile".'}));
    }

    try {
      const business: BusinessModel =
          await this.businessService.find({email: email});

      if (!business) {
        return res.status(404).send(
            getResponse(404, {resultMessage: 'Company not found.'}));
      }

      company = business.company;
      companyEmail = business.email;

      // Parse csv file
      const headers = [
        'locationId',    'company',
        'store',         'address',
        'parish',        'council',
        'district',      'zipCode',
        'latitude',      'longitude',
        'phone',         'sector',
        'schedule1',     'schedule1Dow',
        'schedule1Type', 'schedule1Period',
        'schedule2',     'schedule2Dow',
        'schedule2Type', 'schedule2Period',
        'schedule3',     'schedule3Dow',
        'schedule3Type', 'schedule3Period',
        'byAppointment', 'contactForSchedule',
        'typeOfService', 'obs'
      ];

      const data = await this.parser.parseLocations(dataFile, headers, ',');


      for (let i = 0; i < data.list.length; i++) {
        const location: LocationModel = data.list[i];

        location.locationId = uuidv1();
        location.businessId = business.businessId;
        location.isActive = false;
        location.isOpen = true;
        location.audit = {
          personName,
          personEmail,
          batchId,
          updatedAt: Math.round(+new Date() / 1000)
        };

        try {
          await this.locationService.createLocation(location);
          counter++;
        } catch (e) {
          errors.push({...e.errors, row: i + 1});
        }
      }

      response = getResponse(200, {
        data: {
          totalRows: data.list.length,
          successCount: counter,
          errorCount: errors.length,
          errors
        }
      });
    } catch (e) {
      response = getResponse(
          400, {data: e, resultMessage: 'Failed to import locations.'});
    }

    // Send notification email to admin
    const userLocals = {
      emailToSend: environment.adminEmail,
      company,
      companyEmail,
      successCount: counter,
      errorCount: errors.length,
      batchUrl: `${environment.portal}/businesses/locations/review?batchId=${
          batchId}&email=${companyEmail}`
    };

    this.mailService.sendImportNotificationEmail(userLocals);
    return res.status(response.resultCode).send(response);
  }

  @Put('locations')
  @ApiOperation({summary: 'Update location'})
  @ApiCreatedResponse({description: 'Successfully updated location', type: ResponseModel})
  @ApiBadRequestResponse({description: 'Invalid location info'})
  async updateLocation(
    @Body() location: LocationModel, 
    @Req() req, 
    @Res() res: Response
  ) : Promise<object> {
    const email = req.context.authId;

    let response: ResponseModel = getResponse(200, {data: {locations: []}});

    try {
      const business: BusinessModel = await this.businessService.find({email});

      if (!business) {
        response = getResponse(403);
        return res.status(response.resultCode).send(response);
      }

      let updatedLocation;
      if (location.locationId) {
        updatedLocation = await this.locationService.updateLocation(business.businessId, location);
      } else {
        location.locationId = uuidv1();
        location.businessId = business.businessId;
        location.audit = {
          personName: email,
          personEmail: email,
          batchId: uuidv4(),
          updatedAt: Math.round(+new Date() / 1000)
        };

        await this.locationService.createLocation(location);
      }

      return res.status(200).send(getResponse(200, {data: updatedLocation}));
    } catch (e) {
      return res.status(400).send(getResponse(
          400, {resultMessage: 'Failed to update location', data: e}));
    }
  }

  @Delete('locations')
  @ApiOperation({summary: 'Delete location'})
  @ApiCreatedResponse({description: 'Successfully deleted location', type: ResponseModel})
  @ApiBadRequestResponse({description: 'Invalid location info'})
  async deleteLocation(
    @Query('locationId') locationId: string, 
    @Req() req, 
    @Res() res: Response
  ) : Promise<object> {
    const email = req.context.authId;

    let response: ResponseModel = getResponse(200, {data: {locations: []}});

    try {
      const business: BusinessModel = await this.businessService.find({email});

      if (!business) {
        response = getResponse(403);
        return res.status(response.resultCode).send(response);
      }

      const deletedLocation = await this.locationService.deleteLocation(business.businessId, locationId);

      return res.status(200).send(getResponse(200, {data: deletedLocation}));
    } catch (e) {
      return res.status(400).send(getResponse(
          400, {resultMessage: 'Failed to delete location', data: e}));
    }
  }

  @Post('confirm')
  @ApiOperation({summary: 'Confirm business'})
  @ApiOkResponse({description: 'Business confirmed'})
  @ApiBadRequestResponse({description: 'Invalid token'})
  @ApiResponse({status: 412, description: 'Missing required parameters'})
  async confirmBusiness(
      @Body('token') token, @Body('confirmationCode') confirmationCode,
      @Req() req, @Res() res: any) {
    const isAdmin = req.context.isAdmin;

    if (!isAdmin) {
      return res.status(400).send(getResponse(
          400, {resultMessage: 'Only admin can activate accounts.'}));
    }

    let response = getResponse(200);

    try {
      await (await this.accountService.confirmAccount(token, confirmationCode))
          .toPromise();

      const decodedAuth = await this.decodeTokenService.decodeToken(token);
      const business =
          await this.businessService.find({email: decodedAuth.authId});

      // Send notification email to user
      const locals = {
        emailToSend: decodedAuth.authId,
        company: business.company,
        loginUrl: `${environment.portal}/auth/signin`
      };

      this.mailService.sendAccountConfirmedEmail(locals);
    } catch (e) {
      response = getResponse(400, {data: e});
    }

    return res.status(response.resultCode).send(response);
  }

  @Post('file')
  @ApiOperation({summary: 'Upload file'})
  @UseInterceptors(FileInterceptor('file', multerOptions('tmp')))
  @ApiOkResponse({description: 'File uploaded successfully'})
  @ApiBadRequestResponse({description: 'Invalid File info'})
  @ApiResponse({status: 412, description: 'Missing required parameters'})
  async importLocations(@Res() res: any, @UploadedFile() file) {
    console.log(file);

    const response = getResponse(200, {data: {id: file.path}});
    return res.status(response.resultCode).send(response);
  }

  @Get('locations')
  @ApiOperation({summary: 'Get all locations from a business'})
  @ApiOkResponse({description: 'Returns list of locations', type: SuccessResponseModel})
  async getLocations(
    @Query('search') search: string,
    @Query('batchId') batchId: string,
    @Req() req,
    @Res() res: Response
  ): Promise<object> {
    const email = req.context.authId;
    const isAdmin = req.context.isAdmin;

    let response: ResponseModel = getResponse(200, {data: {locations: []}});

    try {
      let filter = {};

      if (!isAdmin) {
        const business: BusinessModel =
            await this.businessService.find({email});

        if (!business) {
          response = getResponse(404);
          return res.status(response.resultCode).send(response);
        }

        filter = {
          ...filter,
          ...{
            businessId: business.businessId
          }
        };
      }

      if (search) {
        const exp = new RegExp('.*' + search + '.*', 'i');
        filter = {
          ...filter,
          $or: [
            {company: {$regex: exp}}, {store: {$regex: exp}},
            {address: {$regex: exp}}, {fregesia: {$regex: exp}},
            {concelho: {$regex: exp}}, {district: {$regex: exp}}
          ]
        };
      }

      if (batchId) {
        filter = {
          ...filter,
          ...{
            'audit.batchId': batchId
          }
        };
      }

      console.log('search locations', filter);

      const locations = await this.locationService.getLocations(filter);
      response = getResponse(200, {data: {locations}});
    } catch (e) {
      response = getResponse(404, {data: e});
    }

    return res.status(response.resultCode).send(response);
  }

  @Post('locations/confirm')
  @ApiOperation({summary: 'Confirm business locations'})
  @ApiOkResponse({description: 'Business locations confirmed'})
  @ApiBadRequestResponse({description: 'Invalid token'})
  @ApiResponse({status: 412, description: 'Missing required parameters'})
  async confirmBusinessLocations(
      @Body('batchId') batchId: string, @Body('email') email: string,
      @Body('confirm') confirm: boolean, @Req() req, @Res() res: any) {
    const isAdmin = req.context.isAdmin;

    if (!isAdmin) {
      return res.status(400).send(getResponse(
          400, {resultMessage: 'Only admin can activate accounts.'}));
    }

    let response = getResponse(200);

    try {
      const changes = await this.locationService.updateLocations(
          {query: {'audit.batchId': batchId}, update: {isActive: confirm}});

      // Send notification email to user
      const locals = {emailToSend: email, portalUrl: `${environment.portal}`};

      this.mailService.sendImportConfirmationEmail(locals);

      response = getResponse(200, {data: changes});
    } catch (e) {
      response = getResponse(400, {data: e});
    }

    return res.status(response.resultCode).send(response);
    ;
  }
}
