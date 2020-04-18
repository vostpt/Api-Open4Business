import { Body, Controller, Get, Logger, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { Response } from 'express';
import { getResponse } from '../core/helpers/response.helper';


@Controller('api/admin')
@ApiBearerAuth()
@ApiTags('Admin')
export class AdminController {
  constructor(
      private readonly logger: Logger,
      private readonly mongooseHealthIndicator: MongooseHealthIndicator) {
    this.logger.log('Init admin controller', AdminController.name);
  }

  @Get('status')
  @ApiOperation({ description: 'Return information about the API\'s status' })
  @ApiResponse({ status: 200, description: 'Status information returned sucessfully!' })
  @ApiResponse({ status: 500, description: 'Mongo DB is dead' })
  async status(@Res() res: Response) {
    const mongoState = await this.mongooseHealthIndicator.pingCheck('mongoDB');

    const status = {mongoState: mongoState.mongoDB.status};

    return res.status(200).send(status);
  }

  @Post('status')
  @ApiOperation({
    description:
        `Manage the api\'s status, restarting the api, etc. No feature is implemented at this time`
  })
  @ApiResponse({status: 200, description: 'Status updated successfully.'})
  editLoggerLevel(@Body('body') body: object, @Res() res: Response) {
    res.send(getResponse(200));
  }
}
