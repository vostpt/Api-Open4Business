import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvParser } from 'nest-csv-parser';
import { ExtractTokenMiddleware } from '../../core/middleware/extract-token.middleware';
import { BusinessSchema } from '../../core/schemas/business.schema';
import { LocationSchema } from '../../core/schemas/location.schema';
import { BusinessService } from '../../core/services/business.service';
import { LocationService } from '../../core/services/location.service';
import { ParseService } from './services/parser.service';
import { BusinessesV1Controller } from './businesses-v1.controller';
import { AccountService } from './services/account.service';
import { MailSenderService } from '../../core/services/mailsender.service';
import { DecodeTokenService } from '../../core/services/decode-token.service';



@Module({
  imports: [
    MongooseModule.forFeature([{name: 'Location', schema: LocationSchema}]),
    MongooseModule.forFeature([{name: 'Business', schema: BusinessSchema}]),
  ],
  controllers: [BusinessesV1Controller],
  providers: [LocationService, ParseService, CsvParser, BusinessService, AccountService, MailSenderService, DecodeTokenService],
  exports: []
})
export class BusinessesV1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ExtractTokenMiddleware).forRoutes(BusinessesV1Controller);
  }
}