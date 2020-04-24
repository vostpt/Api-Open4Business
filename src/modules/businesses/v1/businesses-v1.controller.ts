import {Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import * as fs from 'fs';
import {v1 as uuidv1, v4 as uuidv4} from 'uuid';
import {environment} from '../../../config/environment';
import {multerOptions} from '../../../config/multer.config';
import {ResponseModel} from '../../auth/v1/models/response.model';
import {AuthGuard} from '../../core/guards/auth.guard';
import {getResponse} from '../../core/helpers/response.helper';
import {BusinessModel} from '../../core/models/business.model';
import {LocationModel} from '../../core/models/location.model';
import {BusinessService} from '../../core/services/business.service';
import {DecodeTokenService} from '../../core/services/decode-token.service';
import {LocationService} from '../../core/services/location.service';
import {MailSenderService} from '../../core/services/mailsender.service';
import {BatchModel} from './models/batch.model';
import {LocationsResponseModel} from './models/businesses-responses.model';
import {AccountService} from './services/account.service';
import {BatchService} from './services/batch.service';
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
      private readonly batchService: BatchService,
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

  @Post('business/marker')
  @ApiOperation({summary: 'Update business marker'})
  @ApiCreatedResponse({description: 'Successfully updated business logo', type: BusinessModel})
  @ApiBadRequestResponse({description: 'Invalid business info'})
  async updateBusinessMarker(
    @Body('markerPath') markerPath: string, 
    @Body('businessId') businessId: string, 
    @Req() req, 
    @Res() res: Response):
      Promise<object> {
    const email = req.context.authId;
    const isAdmin = req.context.isAdmin;
    let resultMessage = 'OK';

    if (!markerPath || !businessId) {
      return res.status(400).send(getResponse(
          400, {resultMessage: 'Missing "marker" or "businessId".'}));
    }

    try {
      const business = await this.businessService.find({email});
      console.log('business', business.businessId, business.email);
      if (isAdmin || email == business.email) {
        if (fs.existsSync(markerPath)) {
          fs.renameSync(
              markerPath,
              `${environment.uploadsPath}/markers/${businessId}.png`);
        } else {
          resultMessage = 'Marker not found.';
        }

        return res.status(200).send(getResponse(200, {resultMessage}));
      }

      return res.status(404).send(getResponse(404, {resultMessage}));
    } catch (e) {
      return res.status(400).send(getResponse(
          400, {resultMessage: 'Failed to set custom marker', data: e}));
    }
  }

  @Post('locations')
  @ApiOperation({summary: 'Add locations to a business'})
  @ApiCreatedResponse({description: 'Successfully added locations to a business', type: ResponseModel})
  @ApiBadRequestResponse({description: 'Invalid company info'})
  async addLocationsBusiness(
    @Body('email') personEmail: string, 
    @Body('name') personName: string, 
    @Body('phone') personPhone: string, 
    @Body('dataFile') dataFile: string, 
    @Req() req, 
    @Res() res: Response
  ): Promise<object> {
    let response: ResponseModel;
    const email = req.context.authId;
    let company: string;
    let companyEmail: string;
    const batch = new BatchModel();
    batch.batchId = uuidv4();
    batch.personEmail = personEmail;
    batch.personName = personName;
    batch.personPhone = personPhone;
    batch.createdAt = Math.round(+new Date() / 1000);
    batch.updatedAt = Math.round(+new Date() / 1000);

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

      batch.businessId = business.businessId;
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

      let data;
      try {
        data = await this.parser.parseLocations(dataFile, headers, ',');
      } catch (e) {
        data = await this.parser.parseLocations(dataFile, headers, ';');
      }

      if (data) {
        batch.stats.total = data.list.length;

        for (let i = 0; i < data.list.length; i++) {
          const location: LocationModel = data.list[i];

          location.locationId = uuidv1();
          location.businessId = business.businessId;
          location.isActive = false;
          location.isOpen = true;
          location.audit = {
            personName,
            personEmail,
            personPhone,
            batchId: batch.batchId,
            updatedAt: Math.round(+new Date() / 1000)
          };

          try {
            if (location.latitude &&
                location.latitude.toString().indexOf(',') >= 0) {
              location.latitude =
                  parseInt(location.latitude.toString().replace(',', '.'));
            }

            if (location.longitude &&
                location.longitude.toString().indexOf(',') >= 0) {
              location.longitude =
                  parseInt(location.longitude.toString().replace(',', '.'));
            }

            if (location.company && location.store && location.latitude &&
                location.longitude) {
              await this.locationService.createLocation(location);
              batch.stats.sucess++;
            }
          } catch (e) {
            errors.push({...e.errors, row: i + 1});
          }
        }

        batch.stats.ignored = batch.stats.total - batch.stats.sucess;

        try {
          await this.batchService.createBatch(batch);

          response = getResponse(200, {
            data: {
              batchId: batch.batchId,
              totalRows: batch.stats.total,
              successCount: batch.stats.sucess,
              errorCount: batch.stats.ignored,
              errors
            }
          });
        } catch (error) {
          await this.locationService.deleteBatchLocations(batch.batchId);
          response = getResponse(
              400, {data: error, resultMessage: 'Failed to create batch.'});
        }
      } else {
        response = getResponse(
            400, {data: errors, resultMessage: 'Failed to parse csv.'});
      }
    } catch (e) {
      console.log(e);
      response = getResponse(
          400, {data: e, resultMessage: 'Failed to import locations.'});
    }

    // Send notification email to admin
    const userLocals = {
      emailToSend: environment.adminEmail,
      company,
      companyEmail,
      status: 'Importadas',
      successCount: batch.stats.sucess,
      errorCount: batch.stats.ignored,
      batchUrl: `${environment.portal}/businesses/locations/review?batchId=${
          batch.batchId}&email=${companyEmail}`
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
    const isAdmin = req.context.isAdmin;
    let response: ResponseModel = getResponse(200, {data: {locations: []}});
    const newLocation = !location.locationId;

    // Create batch
    const batch = new BatchModel();
    batch.batchId = uuidv4();
    batch.createdAt = Math.round(+new Date() / 1000);
    batch.updatedAt = Math.round(+new Date() / 1000);
    batch.stats.total = 1;
    batch.stats.sucess = 1;

    try {
      let businessFilter = null;
      if (isAdmin) {
        const _location: LocationModel =
            await this.locationService.findLocation(
                {locationId: location.locationId});
        businessFilter = {businessId: _location.businessId};
      } else {
        businessFilter = {email};
      }

      const business: BusinessModel =
          await this.businessService.find(businessFilter);

      if (!business) {
        response = getResponse(403);
        return res.status(response.resultCode).send(response);
      }

      batch.personEmail = business.email;
      batch.personName = business.name;
      batch.personPhone = business.phone;
      
      let updatedLocation;
      if (location.locationId) {
        updatedLocation = await this.locationService.updateLocation(
            business.businessId, location);
      } else {
        location.locationId = uuidv1();
        location.businessId = business.businessId;
        location.audit = {
          personName: email,
          personEmail: email,
          batchId: batch.batchId,
          updatedAt: Math.round(+new Date() / 1000)
        };

        await this.locationService.createLocation(location);

        // Send notification email to admin
        const userLocals = {
          emailToSend: environment.adminEmail,
          company: business.company,
          companyEmail: business.email,
          status: 'Nova',
          successCount: batch.stats.sucess,
          errorCount: batch.stats.ignored,
          batchUrl:
              `${environment.portal}/businesses/locations/review?batchId=${
                  batch.batchId}&email=${business.email}`
        };

        this.mailService.sendImportNotificationEmail(userLocals);
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
    const isAdmin = req.context.isAdmin;

    let response: ResponseModel = getResponse(200, {data: {locations: []}});

    try {
      let businessFilter = null;
      if (isAdmin) {
        const location: LocationModel =
            await this.locationService.findLocation({locationId});
        businessFilter = {businessId: location.businessId};
      } else {
        businessFilter = {email};
      }

      const business: BusinessModel =
          await this.businessService.find(businessFilter);

      if (!business) {
        response = getResponse(403);
        return res.status(response.resultCode).send(response);
      }

      const deletedLocation = await this.locationService.deleteLocation(
          business.businessId, locationId);

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
    const response = getResponse(200, {data: {id: file.path}});
    return res.status(response.resultCode).send(response);
  }

  @Get('locations')
  @ApiOperation({summary: 'Get all locations from user\'s business'})
  @ApiQuery({name: 'limit', type: Number, required: true})
  @ApiQuery({name: 'offset', type: Number, required: true})
  @ApiQuery({name: 'search', type: String, required: false})
  @ApiQuery({name: 'batchId', type: String, required: false})
  @ApiOkResponse({description: 'Returns list of locations', type: LocationsResponseModel})
  @ApiForbiddenResponse({description: 'Forbidden'})
  @ApiBadRequestResponse({description: 'Invalid parameters'})
  @ApiNotFoundResponse({description: 'No Business was found for user'})
  @ApiInternalServerErrorResponse({description: 'Unknown error'})
  async getLocations(
    @Query('limit', ParseIntPipe) limit,
    @Query('offset', ParseIntPipe) offset,
    @Query('search') search: string,
    @Query('batchId') batchId: string,
    @Req() req,
    @Res() res: Response,
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

      const total = await this.locationService.countLocations(filter);
      const locations = await this.locationService.getLocationsWithPagination(
          filter, limit, offset);

      response = getResponse(
          200, {data: {locations, total, limit: limit, offset: offset}});
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
      return res.status(403).send(getResponse(
          403, {resultMessage: 'Only admin can approve locations.'}));
    }

    let response = getResponse(200);

    try {
      let changes = await this.locationService.updateLocations(
          {query: {'audit.batchId': batchId}, update: {isActive: confirm}});

      changes = await this.batchService.updateBatch({
        query: {'batchId': batchId},
        update: {status: confirm ? 'APPROVED' : 'REJECTED', updatedAt: Math.round(+new Date() / 1000)},
      });

      // Send notification email to user
      const locals = {
        emailToSend: email,
        portalUrl: `${environment.portal}/businesses/locations`,
        confirm
      };

      this.mailService.sendImportConfirmationEmail(locals);

      response = getResponse(200, {data: changes});
    } catch (e) {
      response = getResponse(400, {data: e});
    }

    return res.status(response.resultCode).send(response);
    ;
  }

  @Post('locations/batch')
  @ApiOperation({summary: 'Submit/discard locations batch'})
  @ApiOkResponse({description: 'locations batch sbumited/discarded'})
  @ApiForbiddenResponse({description: 'Invalid token'})
  @ApiResponse({status: 412, description: 'Missing required parameters'})
  async submitLocationsBatch(
      @Body('batchId') batchId: string, @Body('submit') submit: boolean,
      @Req() req, @Res() res: any) {
    const email = req.context.authId;
    let response = getResponse(200);
    let changes;

    try {
      const batch = await this.batchService.find({'batchId': batchId});

      if (!batch) {
        response = getResponse(404, {resultMessage: 'Batch not found.'});
        return res.status(response.resultCode).send(response);
      }

      if (batch.status != 'WAITING_FOR_APPROVAL' && batch.status != 'REJECTED') {
        response = getResponse(400, {resultMessage: 'Batch already closed.'});
        return res.status(response.resultCode).send(response);
      }

      const business =
          await this.businessService.find({'businessId': batch.businessId});

      if (!business || business.email != email) {
        response = getResponse(403);
        return res.status(response.resultCode).send(response);
      }

      if (submit) {
        changes = await this.batchService.updateBatch({
          query: {'batchId': batchId},
          update: {status: 'WAITING_FOR_APPROVAL', updatedAt: Math.round(+new Date() / 1000)}
        });

        // Send notification email to admin
        const userLocals = {
          emailToSend: environment.adminEmail,
          company: business.company,
          companyEmail: business.email,
          status: 'Submetidas Para Revisão',
          successCount: batch.stats.success,
          errorCount: batch.stats.total - batch.stats.success,
          batchUrl:
              `${environment.portal}/businesses/locations/review?batchId=${
                  batchId}&email=${business.email}`
        };

        this.mailService.sendImportNotificationEmail(userLocals);
      } else {
        changes = await this.batchService.updateBatch(
            {query: {'batchId': batchId}, update: {status: 'DISCARDED', updatedAt: Math.round(+new Date() / 1000)}});

        changes = await this.locationService.deleteBatchLocations(batchId);
      }

      response = getResponse(200, {data: {changes, submit}});
    } catch (e) {
      response = getResponse(400, {data: e});
    }

    return res.status(response.resultCode).send(response);
  }

  @Get('locations/batch')
  @ApiOperation({summary: 'Get all locations batches from user\'s business'})
  @ApiQuery({name: 'status', type: String, required: false})
  @ApiOkResponse({description: 'Returns list of batch locations'})
  @ApiForbiddenResponse({description: 'Forbidden'})
  @ApiBadRequestResponse({description: 'Invalid parameters'})
  @ApiNotFoundResponse({description: 'No Business was found for user'})
  @ApiInternalServerErrorResponse({description: 'Unknown error'})
  async getBatches(
      @Query('status') status: string,
      @Req() req,
      @Res() res: Response,
      ): Promise<object> {
    const email = req.context.authId;
    const isAdmin = req.context.isAdmin;

    let filter = {};

    if (status) {
      filter = {...filter, status: { $in: status.split(',') }};
    }

    // Shortcut for admin
    if (isAdmin) {
      const batches = await this.batchService.findMany(filter);

      const response: ResponseModel = getResponse(200, {data: {batches}});
      return res.status(response.resultCode).send(response);
    }

    const business = await this.businessService.find({'email': email});

    if (!business) {
      return res.status(403).send(getResponse(403));
    }

    try {
      filter = {
        ...filter,
        businessId: business.businessId
      };
      
      const batches = await this.batchService.findMany(filter);

      const response: ResponseModel = getResponse(200, {data: {batches}});
      return res.status(response.resultCode).send(response);
    } catch (e) {
      return res.status(400).send(getResponse(400, {data: e}));
    }
  }

  @Get('locations/batch/:batchId')
  @ApiOperation({summary: 'Get all locations batches from user\'s business'})
  @ApiQuery({name: 'status', type: String, required: false})
  @ApiOkResponse({description: 'Returns list of batch locations'})
  @ApiForbiddenResponse({description: 'Forbidden'})
  @ApiBadRequestResponse({description: 'Invalid parameters'})
  @ApiNotFoundResponse({description: 'No Business was found for user'})
  @ApiInternalServerErrorResponse({description: 'Unknown error'})
  async getBatch(
      @Param('batchId') batchId: string,
      @Req() req,
      @Res() res: Response,
      ): Promise<object> {
    const email = req.context.authId;
    const isAdmin = req.context.isAdmin;

    if (!batchId) {
      return res.status(409).send(getResponse(409, {resultMessage: "Missing 'batchId'"}));
    }

    // Shortcut for admin
    if (isAdmin) {
      const batch = await this.batchService.find({batchId});

      if (!batch) {
        return res.status(404).send(getResponse(404));
      }

      const response: ResponseModel = getResponse(200, {data: {batch}});
      return res.status(response.resultCode).send(response);
    }

    const business = await this.businessService.find({'email': email});

    if (!business) {
      return res.status(404).send(getResponse(404));
    }

    try {
      let filter = {};

      filter = {
        businessId: business.businessId,
        batchId
      };
      const batch = await this.batchService.find(filter);

      if (!batch) {
        return res.status(404).send(getResponse(404));
      }

      const response: ResponseModel = getResponse(200, {data: {batch}});
      return res.status(response.resultCode).send(response);
    } catch (e) {
      return res.status(400).send(getResponse(400, {data: e}));
    }
  }
}
