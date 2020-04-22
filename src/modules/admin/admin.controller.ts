import { Controller, Get, Logger, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { Response } from 'express';


@Controller('api/admin')
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

    const status = {status: 'Running', mongoState: mongoState.mongoDB.status};

    return res.status(200).send(status);
  }
}
