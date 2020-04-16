import {Body, Controller, Get, Logger, Post, Res, UploadedFile, UseInterceptors, UseGuards} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import * as fs from 'fs';
import {v1 as uuidv1} from 'uuid';
import {multerOptions} from '../../../config/multer.config';
import {ResponseModel} from '../../auth/v1/models/response.model';
import {getResponse} from '../../core/helpers/response.helper';
import {SuccessResponseModel} from '../../core/models/success-response.model';
import {BusinessModel} from '../../core/models/business.model';

import {ParseService} from './services/parser.service';
import { environment } from '../../../config/environment';
import { LocationService } from '../../core/services/location.service';
import { BusinessService } from '../../core/services/business.service';
import { AuthGuard } from '../../core/guards/auth.guard';
import { BusinessLocationModel } from '../../core/models/business-location.model';

@Controller('businesses/v1')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Businesses')
export class BusinessesV1Controller {
  constructor(
      private readonly locationService: LocationService,
      private readonly businessService: BusinessService,
      private readonly parser: ParseService, private readonly logger: Logger) {
    this.logger.log('Init insights controller', BusinessesV1Controller.name);
  }

  @Post('business')
  @ApiOperation({summary: 'Create a business'})
  @ApiCreatedResponse({description: 'Successfully created business', type: BusinessModel})
  @ApiBadRequestResponse({description: 'Invalid company info'})
  async createBusiness(@Body() business: BusinessLocationModel, @Res() res: Response):
      Promise<object> {
    let response: ResponseModel;

    try {
      const newBusiness = await this.businessService.createBusiness(business);

      if (newBusiness) {
        if (business.logo) {
          const originalLogo = business.logo;

          try {  
            const dotIndex = originalLogo.lastIndexOf('.');
            business.logo = `${environment.uploadsPath}/company-${newBusiness.businessId}${originalLogo.substr(dotIndex, originalLogo.length - dotIndex)}`;

            fs.rename(originalLogo, business.logo, (err) => {
              if (err) throw err;
            });
          } catch (e) {
            console.error('Failed to rename company logo.', e);
            business.logo = originalLogo;
          }
        }

        if (business.dataFile) {
          try {
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

            const data = await this.parser.parseLocations(
                business.dataFile, headers, ';');

            data.list.forEach(location => {
              if (location.company == business.company) {
                location.locationId = uuidv1();
                this.locationService.createLocation(location);
              }
            });

            response = getResponse(200, {data: newBusiness});
          } catch (e) {
            console.error(
                'Failed to parse locations in: ' + business.dataFile, e);

            response = getResponse(200, {data: newBusiness, resultMessage: e});
          }
        }
      } else {
        this.logger.error('Invalid company info.');
        response = getResponse(400, {resultMessage: 'Invalid company info.'});
      }
    } catch (e) {
      this.logger.error('Error creating business', e);
      response =
          getResponse(400, {resultMessage: 'Invalid company info.', data: e});
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
  async getLocations(@Res() res: Response): Promise<object> {
    const locations = await this.locationService.getLocations({});

    const response = {data: {locations}};
    return res.status(200).send(response);
  }
}
