import { Body, Controller, Get, Logger, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { multerOptions } from '../../../config/multer.config';
import { AuthGuard } from '../../core/guards/auth.guard';
import { SuccessResponseModel } from '../../core/models/success-response.model';
import getName from './helpers/name.helper';
import { HelloModel } from './models/hello.model';
import { ParseService } from './services/parser.service';
import { LocationService } from './services/location.service';
import { v1 as uuidv1 } from 'uuid';

@Controller('insights/v1')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Insights')
export class InsightsV1Controller {
  constructor(
    private readonly locationService: LocationService,
    private readonly parser: ParseService, private readonly logger: Logger) {
    this.logger.log('Init insights controller', InsightsV1Controller.name);
  }

  @Get('user/info')
  @ApiOperation({ summary: 'Get server hello' })
  @ApiOkResponse({ description: 'Hello is valid', type: SuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Token isn\'t valid' })
  @ApiQuery({ name: 'authId', description: 'The authId to describe', type: String, required: true })
  async getUserInfo(
    @Query('authId') authId: string,
    // @Param('authId') authId: string,
    @Res() res: Response
  ): Promise<object> {
    // TODO: read from database user info

    // TODO: read from mongo

    const response = {data: {authId, isActive: true, languageKey: 'en'}};
    return res.status(200).send(response);
  }

  @Post('hello')
  @ApiOperation({summary: 'Get server hello'})
  @ApiCreatedResponse({description: 'Successfully get hello', type: HelloModel})
  @ApiUnauthorizedResponse({description: 'Invalid credentials'})
  async postHello(@Body() body: HelloModel, @Res() res: Response):
      Promise<object> {
    const response = {name: getName(body)};
    return res.status(200).send(response);
  }

  @Post('locations/import')
  @ApiOperation({summary: 'Import locations csv'})
  @UseInterceptors(FileInterceptor('file', multerOptions('locations')))
  @ApiOkResponse({description: 'File uploaded successfully'})
  @ApiUnauthorizedResponse({description: 'Unauthorized'})
  @ApiForbiddenResponse({description: 'Forbidden'})
  @ApiResponse({status: 412, description: 'Missing required parameters'})
  async importLocations(@Res() res: any, @UploadedFile() file) {
    console.log(file);

    // Parse csv file
    const headers = [
      'locationId',   'company',       'store',         'address',
      'fregesia',     'concelho',      'district',      'zipCode',
      'latitude',     'longitude',     'phone',         'sector',
      'schedule1',    'schedule1Dow',  'schedule1Type', 'schedule2',
      'schedule2Dow', 'schedule2Type', 'schedule3',     'schedule3Dow',
      'schedule3Type'
    ];

    const data = await this.parser.parseLocations(file.path, headers);

    data.list.forEach(location => {
      // console.log(location);
      location.locationId = uuidv1();
      this.locationService.createLocation(location);
    });

    const response = {import: "OK!"};

    return res.send(response);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get locations' })
  @ApiOkResponse({ description: 'Request is valid', type: SuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Token isn\'t valid' })
  @ApiQuery({ name: 'authId', description: 'The authId to describe', type: String, required: true })
  async getLocations(
    @Res() res: Response
  ): Promise<object> {
    const locations = await this.locationService.getLocations({});
    
    const response = {data: {locations}};
    return res.status(200).send(response);
  }
}
