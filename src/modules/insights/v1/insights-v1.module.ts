import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';

import {ExtractTokenMiddleware} from '../../core/middleware/extract-token.middleware';

import {InsightsV1Controller} from './insights-v1.controller';
import {LocationService} from './services/location.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationSchema } from './schemas/location.schema';
import { ParseService } from './services/parser.service';
import { CsvParser } from 'nest-csv-parser';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Location', schema: LocationSchema }]),
  ],
  controllers: [InsightsV1Controller],
  providers: [LocationService, ParseService, CsvParser],
  exports: []
})
export class InsightsV1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ExtractTokenMiddleware).forRoutes(InsightsV1Controller);
  }
}