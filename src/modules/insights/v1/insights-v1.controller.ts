import { Body, Controller, Get, Logger, ParseIntPipe, Post, Query, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as generator from 'generate-password';
import { join } from 'path';
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

  @Get('guide')
  @ApiOperation({summary: 'Get quick guide'})
  @ApiOkResponse({description: 'Request is valid', type: SuccessResponseModel})
  async getQuickGuide(@Res() res: Response): Promise<object> {
    const guidePath = join(__dirname, '../../../assets/quick-guide.pdf');

    res.download(guidePath, 'OPEN4BUSINESS - QUICK GUIDE.pdf', () => {
      res.status(200);
    });

    return null;
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
        response = getResponse(409, {resultMessage: 'Already exists'});
      } else {
        this.logger.error('Error on signup', e);
        response = getResponse(400, {data: e});
      }

      return res.status(response.resultCode).send(response);
    }

    try {
      const authId = business.email;
      const password = generator.generate({length: 8, numbers: true});
      const name = business.name;
      const phone = business.phone;

      const account =
          await (await this.accountService.createAccount(
                     authId, password, name, phone, newBusiness._id))
              .toPromise();

      // Send notification email to admin
      const locals = {
        emailToSend: environment.adminEmail,
        userEmail: business.email,
        userName: business.company,
        activationUrl: `${environment.portal}/businesses/confirm?token=${
            account.data.activationToken}&confirmationCode=${
            account.data.confirmationCode}`
      };

      this.mailService.sendSignUpNotificationEmail(locals);

      // Send notification email to user
      const userLocals = {
        emailToSend: business.email,
        company: business.company,
        password: password,
      };

      this.mailService.sendConfirmAccountEmail(userLocals);

      response = getResponse(200, {data: newBusiness});
    } catch (e) {
      console.error(e);
      response = getResponse(400, {data: e});

      await this.businessService.deleteBusiness(business.businessId);
    }

    return res.status(response.resultCode).send(response);
  }

  @Get('locations')
  @ApiOperation({summary: 'Get locations'})
  @ApiOkResponse({description: 'Request is valid', type: SuccessResponseModel})
  async getLocations(@Query('search') search: string, @Res() res: Response):
      Promise<object> {
    const exp = new RegExp('.*' + search + '.*', 'i');

    // default filter: active and opened
    let filter = {isActive: true, isOpen: true, disabled: false};

    if (search) {
      filter = {
        ...filter,
        ...{
          $or: [
            {company: {$regex: exp}}, {store: {$regex: exp}},
            {address: {$regex: exp}}, {parish: {$regex: exp}},
            {council: {$regex: exp}}, {district: {$regex: exp}}
          ]
        }
      };
    }

    const locations = await this.locationService.getLocations(filter);

    const response = {data: {locations}};
    return res.status(200).send(response);
  }

  @Get('locations-list')
  @ApiOperation({summary: 'Get locations list'})
  @ApiOkResponse({description: 'Request is valid', type: SuccessResponseModel})
  async getLocationsList(
      @Query('limit', ParseIntPipe) limit,
      @Query('offset', ParseIntPipe) offset, @Query('search') search: string,
      @Query('sector') sector: string,
      @Query('companyType') companyType: string,
      @Query('district') district: string,
      @Res() res: Response): Promise<object> {
    const exp = new RegExp('.*' + search + '.*', 'i');

    let filter = {isActive: true, isOpen: true, disabled: false};

    if (search) {
      filter = {
        ...filter,
        ...{
          $or: [
            {company: {$regex: exp}}, {store: {$regex: exp}},
            {address: {$regex: exp}}, {parish: {$regex: exp}},
            {council: {$regex: exp}}, {district: {$regex: exp}}
          ]
        }
      };
    }

    if (sector) {
      filter = {
        ...filter,
        ...{
          sector
        }
      }
    }

    if (district) {
      filter = {
        ...filter,
        ...{
          district
        }
      }
    }

    if (companyType) {
      // Get companies by companyType
      const businesses = await this.businessService.findAll({companyType});
      const ids = businesses.map(b => b.businessId);

      filter = {
        ...filter,
        ...{
          businessId: {$in: ids}
        }
      }
    }

    const total = await this.locationService.countLocations(filter);
    const locations = await this.locationService.getLocationsWithPagination(
        filter, limit, offset);

    const response = getResponse(
        200,
        {data: {locations, total, limit, offset}});

    return res.status(200).send(response);
  }

  @Get('marker')
  @ApiOperation({ summary: 'Get custom business marker' })
  @ApiQuery({ name: 'businessId', description: 'business Id', type: String, required: true })
  async exportAllUsers(
    @Query('businessId') businessId: string,
    @Res() res: Response
  ): Promise<object> {
    let markerPath = `${environment.uploadsPath}/markers/${businessId}.png`;

    if (!fs.existsSync(markerPath)) {
      markerPath = join(__dirname, '../../../assets/images/pin.png');
    }

    const fileBuffer = fs.readFileSync(markerPath);
    res.attachment(`${businessId}.png`);
    res.contentType('image/png');
    return res.status(200).send(fileBuffer);
  }

  @Get('locations/businesses')
  @ApiOperation({summary: 'Get businesses'})
  async getBusinesses(@Res() res: Response): Promise<object> {
    const businesses = await this.businessService.findAll({});

    const publicInfo = businesses.map((b) => {
      return {
        businessId: b.businessId,
        company: b.company,
      };
    });

    const response = {data: {businesses: publicInfo}};
    return res.status(200).send(response);
  }

  @Get('locations/districts')
  @ApiOperation({summary: 'Get locations districts'})
  @ApiOkResponse({description: 'Request is valid', type: SuccessResponseModel})
  async getLocationsDistricts(@Res() res: Response): Promise<object> {
    const districts = await this.locationService.getDistricts(
        {isActive: true, isOpen: true, disabled: false, district: {'$ne': null}});
    const districtList = districts.map((d) => {
      return {district: d._id.district, count: d.count};
    });

    const response = getResponse(200, {data: {districts: districtList}});

    return res.status(200).send(response);
  }

  @Get('locations/sectors')
  @ApiOperation({summary: 'Get locations sectos'})
  @ApiOkResponse({description: 'Request is valid', type: SuccessResponseModel})
  async getLocationsSectors(@Res() res: Response): Promise<object> {
    const sectors = await this.locationService.getSectors(
        {isActive: true, isOpen: true, disabled: false, sector: {'$ne': null}});
    const sectorsList = sectors.map((s) => {
      return {sector: s._id.sector, count: s.count};
    });

    const response = getResponse(200, {data: {sectors: sectorsList}});

    return res.status(200).send(response);
  }
}
