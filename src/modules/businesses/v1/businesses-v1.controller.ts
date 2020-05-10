import {Body, Controller, Delete, Get, HttpService, Logger, Param, ParseIntPipe, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse} from '@nestjs/swagger';
import {Response} from 'express';
import * as fs from 'fs';
import {imageSize} from 'image-size';
import {of, throwError} from 'rxjs';
import {catchError, map, mergeMap} from 'rxjs/operators';
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
      private readonly parserService: ParseService,
      private readonly httpService: HttpService,
      private readonly logger: Logger) {
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

      if (isAdmin || email == business.email) {
        if (fs.existsSync(markerPath)) {
          imageSize(markerPath, function(err, dimensions) {
            console.log(dimensions.width, dimensions.height);

            if (dimensions.width <= 41 && dimensions.height <= 51) {
              fs.renameSync(
                  markerPath,
                  `${environment.uploadsPath}/markers/${businessId}.png`);

              res.status(200).send(getResponse(200, {resultMessage}));
            } else {
              resultMessage = `A imagem deve ter no máx 41x51 e não ${
                  dimensions.width}x${dimensions.height}.`;
              res.status(400).send(getResponse(400, {resultMessage}));
            }
          });
        } else {
          resultMessage = 'Marker not found.';
        }

        // return res.status(200).send(getResponse(200, {resultMessage}));
        return null;
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
        data = await this.parserService.parseLocations(dataFile, headers, ',');
      } catch (e) {
        console.error('Parse with ","', e);

        this.logger.warn('Failed to parse CSV using ",". Try again with ";"');
        data = await this.parserService.parseLocations(dataFile, headers, ';');
      }

      if (data) {
        batch.stats.total = data.list.length;

        for (let i = 0; i < data.list.length; i++) {
          const location: LocationModel = data.list[i];
          let update = true;

          console.log('locationId', location.locationId);
          if (!location.locationId) {
            location.locationId = uuidv1();
            update = false;
            console.log('-> locationId = ', location.locationId);
          }

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

            if (!location.schedule1 && !location.schedule2 &&
                !location.schedule3) {
              location.isOpen = false;
              errors.push({
                message:
                    'Loja marcada como fechada porque não foi definido nenhum horário',
                row: i + 1
              });
            }

            // Validate location
            if (environment.mapbox && environment.country) {
              const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${
                  location.longitude},${location.latitude}.json?access_token=${
                  environment.mapbox}&types=country`;

              try {
                location.isLocationValid =
                    await (
                        await this.httpService
                            .get(
                                url,
                                {headers: {'Content-Type': 'application/json'}})
                            .pipe(
                                catchError(err => {
                                  return throwError(err);
                                }),
                                mergeMap(res => {
                                  return of(res);
                                }),
                                map(
                                    res => {
                                      const resultData = res['data'];

                                      if (resultData['features'] &&
                                          resultData['features'].length > 0) {
                                        const country =
                                            resultData['features'][0];

                                        if (country.place_name ==
                                            environment.country) {
                                          return true;
                                        }
                                      }

                                      return false;
                                    },
                                    () => {
                                      return false;
                                    })))
                        .toPromise();
              } catch (error) {
                console.error(
                    'error validating location', error.response || error);
                location.isLocationValid = true;
              }
            }

            // Validate
            if (!location.isLocationValid) {
              location.isOpen = false;
              errors.push({
                message:
                    'Loja marcada como fechada porque não se encontra em território nacional.',
                row: i + 1
              });
            }

            // Check for coded info in obs
            if (location.obs) {
              const tag = location.obs.match(/\$\{.+?:.+?\}/g);

              if (tag) {
                for (let k = 0; k < tag.length; k++) {
                  const info = tag[k].replace(/(\$\{|\})/g, '').split(':');

                  if (!location.external) {
                    location.external = {};
                  }

                  location.external[info[0]] = info[1];

                  location.obs = location.obs.replace(tag[k], '');
                }
              }
            }

            if (this.locationService.isValid(location)) {
              if (update) {
                await this.locationService.updateLocation(
                    business.businessId, location);
                batch.stats.updated++;
              } else {
                await this.locationService.createLocation(location);
                batch.stats.added++;
              }
            } else {
              let errorMessage = 'Campos obrigatórios em falta:';
              if (!this.locationService.validateStringField(
                      location.locationId)) {
                errorMessage += ' ID,';
              }
              if (!this.locationService.validateStringField(location.company)) {
                errorMessage += ' Empresa,';
              }
              if (!this.locationService.validateStringField(location.store)) {
                errorMessage += ' Loja,';
              }
              if (!this.locationService.validateStringField(
                      location.longitude)) {
                errorMessage += ' Longitude,';
              }
              if (!this.locationService.validateStringField(
                      location.latitude)) {
                errorMessage += ' Latitude,';
              }

              errors.push({message: errorMessage, row: i + 1});
            }
          } catch (e) {
            errors.push({...e.errors, row: i + 1});
          }
        }

        batch.stats.ignored =
            batch.stats.total - batch.stats.added - batch.stats.updated;

        try {
          await this.batchService.createBatch(batch);

          response = getResponse(200, {
            data: {
              batchId: batch.batchId,
              totalRows: batch.stats.total,
              addCount: batch.stats.added,
              updateCount: batch.stats.updated,
              errorCount:
                  batch.stats.total - batch.stats.added - batch.stats.updated,
              errors
            }
          });
        } catch (error) {
          this.logger.error('Failed to create batch.', error);

          await this.locationService.deleteBatchLocations(batch.batchId);
          response = getResponse(
              400, {data: error, resultMessage: 'Failed to create batch.'});
        }
      } else {
        this.logger.error('Failed to parse csv.');

        response = getResponse(
            400, {data: errors, resultMessage: 'Failed to parse csv.'});
      }
    } catch (e) {
      this.logger.error('Failed to import locations.', e);

      response = getResponse(
          400, {data: e, resultMessage: 'Failed to import locations.'});
    }

    // Send notification email to admin
    const userLocals = {
      emailToSend: environment.adminEmail,
      company,
      companyEmail,
      status: 'Importadas',
      addCount: batch.stats.added,
      updateCount: batch.stats.updated,
      errorCount: batch.stats.total - batch.stats.added - batch.stats.updated,
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

    // Validate
    if (location.isOpen && (!this.locationService.hasSchedule(location))) {
      response = getResponse(
          450, {resultMessage: 'Store cannot be open without a schedule.'});
      return res.status(response.resultCode).send(response);
    }

    // Validate location
    if (environment.mapbox && environment.country) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${
          location.longitude},${location.latitude}.json?access_token=${
          environment.mapbox}&types=country`;

      try {
        location.isLocationValid =
            await (
                await this.httpService
                    .get(url, {headers: {'Content-Type': 'application/json'}})
                    .pipe(
                        catchError(err => {
                          return throwError(err);
                        }),
                        mergeMap(res => {
                          return of(res);
                        }),
                        map(
                            res => {
                              const resultData = res['data'];

                              if (resultData['features'] &&
                                  resultData['features'].length > 0) {
                                const country = resultData['features'][0];

                                if (country.place_name == environment.country) {
                                  return true;
                                }
                              }

                              return false;
                            },
                            () => {
                              return false;
                            })))
                .toPromise();
      } catch (error) {
        console.error('error validating location', error.response || error);
        location.isLocationValid = true;
      }
    }

    // Validate
    if (location.isOpen && !location.isLocationValid) {
      response = getResponse(451, {
        resultMessage: 'Store cannot be opened because location is not valid.'
      });
      return res.status(response.resultCode).send(response);
    }

    // Create batch
    const batch = new BatchModel();
    batch.batchId = uuidv4();
    batch.createdAt = Math.round(+new Date() / 1000);
    batch.updatedAt = Math.round(+new Date() / 1000);
    batch.stats.total = 1;
    batch.stats.added = 1;

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

      batch.businessId = business.businessId;
      batch.personEmail = business.email;
      batch.personName = business.name;
      batch.personPhone = business.phone;

      if (location.obs) {
        const tag = location.obs.match(/\$\{.+?:.+?\}/g);

        if (tag) {
          for (let k = 0; k < tag.length; k++) {
            const info = tag[k].replace(/(\$\{|\})/g, '').split(':');

            if (!location.external) {
              location.external = {};
            }

            location.external[info[0]] = info[1];

            location.obs = location.obs.replace(tag[k], '');
          }
        }
      }

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
        await this.batchService.createBatch(batch);

        // Send notification email to admin
        const userLocals = {
          emailToSend: environment.adminEmail,
          company: business.company,
          companyEmail: business.email,
          status: 'Nova',
          addCount: batch.stats.added,
          updateCount: batch.stats.updated,
          errorCount:
              batch.stats.total - batch.stats.added - batch.stats.updated,
          batchUrl:
              `${environment.portal}/businesses/locations/review?batchId=${
                  batch.batchId}&email=${business.email}`
        };

        this.mailService.sendImportNotificationEmail(userLocals);
      }

      return res.status(200).send(getResponse(200, {data: updatedLocation}));
    } catch (e) {
      console.error(e);
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
        loginUrl: `${environment.portal}/auth/signin`,
        guideUrl: `${environment.portal}/api/insights/v1/guide`
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
  @ApiQuery({name: 'status', type: String, required: false})
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
    @Query('status') status: string,
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
            {address: {$regex: exp}}, {parish: {$regex: exp}},
            {council: {$regex: exp}}, {district: {$regex: exp}}
          ]
        };
      }

      if (status) {
        if (status == 'open' || status == 'closed') {
          filter = {
            ...filter,
            ...{
              isOpen: (status == 'open')
            }
          };
        } else if (status == 'pending') {
          filter = {
            ...filter,
            ...{
              isActive: false
            }
          };
        }
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

  @Get('locations/export')
  @ApiOperation({ summary: 'Get csv file with list of locations' })
  @ApiQuery({name: 'search', type: String, required: false})
  @ApiOkResponse({ description: 'CSV file' })
  @ApiUnauthorizedResponse({ description: 'Token isn\'t valid' })
  @ApiQuery({ name: 'name', description: 'search to filter locations', type: String, required: true })
  async exportLocation(
    @Query('search') search: string,
    @Req() req,
    @Res() res: Response
  ): Promise<object> {
    const email = req.context.authId;
    const isAdmin = req.context.isAdmin;
    console.log(email, isAdmin);
    try {
      let filter = {};

      if (!isAdmin) {
        const business: BusinessModel =
            await this.businessService.find({email});

        if (!business) {
          const response = getResponse(404);
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
            {address: {$regex: exp}}, {parish: {$regex: exp}},
            {council: {$regex: exp}}, {district: {$regex: exp}}
          ]
        };
      }

      const locations = await this.locationService.getLocations(filter);

      let data =
          'OUR ID,EMPRESA,LOJA,MORADA,FREGUESIA,CONCELHO,DISTRITO,CÓDIGO POSTAL,LATITUDE (x),LONGITUDE (y),TELEFONE,SECTOR (Escolher Um),HORÁRIO 1,DIAS DA SEMANA HORARIO 1,TIPO HORÁRIO 1,PERÍODO HORÁRIO 1 ,HORÁRIO 2,DIAS DA SEMANA HORARIO 2,TIPO HORÁRIO 2,PERÍODO  HORÁRIO 2,HORÁRIO 3 ,DIAS DA SEMANA HORARIO 3,TIPO HORÁRIO 3,PERÍODO HORÁRIO 3 ,POR MARCAÇÃO,CONTACTO PARA AGENDAMENTO,TIPO DE SERVIÇO,OBSERVAÇÕES\n';
      locations.forEach((location) => {
        data += `"${location.locationId}","${location.company}","${
            location.store}","${location.address}","${location.parish}","${
            location.council}","${location.district}","${location.zipCode}",${
            location.latitude},${location.longitude},"${location.phone}","${
            location.sector}","${location.schedule1}","${
            location.schedule1Dow}","${location.schedule1Type}","${
            location.schedule1Period}","${location.schedule2}","${
            location.schedule2Dow}","${location.schedule2Type}","${
            location.schedule2Period}","${location.schedule3}","${
            location.schedule3Dow}","${location.schedule3Type}","${
            location.schedule3Period}","${location.byAppointment}","${
            location.contactForSchedule}","${location.typeOfService}","${
            location.obs}"\n`;
      });

      res.attachment(`locations-${uuidv1()}.csv`);
      res.contentType('text/csv');
      return res.status(200).send(data);
    } catch (e) {
      const response = getResponse(404, {data: e});
      return res.status(404).send(response);
    }
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
        update: {
          status: confirm ? 'APPROVED' : 'REJECTED',
          updatedAt: Math.round(+new Date() / 1000)
        },
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

      if (batch.status != 'WAITING_FOR_APPROVAL' &&
          batch.status != 'REJECTED') {
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
          update: {
            status: 'WAITING_FOR_APPROVAL',
            updatedAt: Math.round(+new Date() / 1000)
          }
        });

        // Send notification email to admin
        const userLocals = {
          emailToSend: environment.adminEmail,
          company: business.company,
          companyEmail: business.email,
          status: 'Submetidas Para Revisão',
          addCount: batch.stats.added,
          updateCount: batch.stats.updated,
          errorCount:
              batch.stats.total - batch.stats.added - batch.stats.updated,
          batchUrl:
              `${environment.portal}/businesses/locations/review?batchId=${
                  batchId}&email=${business.email}`
        };

        this.mailService.sendImportNotificationEmail(userLocals);
      } else {
        changes = await this.batchService.updateBatch({
          query: {'batchId': batchId},
          update:
              {status: 'DISCARDED', updatedAt: Math.round(+new Date() / 1000)}
        });

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
      filter = {...filter, status: {$in: status.split(',')}};
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
      filter = {...filter, businessId: business.businessId};

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
      return res.status(409).send(
          getResponse(409, {resultMessage: 'Missing \'batchId\''}));
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

      filter = {businessId: business.businessId, batchId};
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
