import {Module} from '@nestjs/common';
import {MongooseHealthIndicator} from '@nestjs/terminus';

import {LocationService} from '../core/services/location.service';
import {MailSenderService} from '../core/services/mailsender.service';

import {AdminController} from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationSchema } from '../core/schemas/location.schema';
import { BusinessSchema } from '../core/schemas/business.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{name: 'Location', schema: LocationSchema}]),
    MongooseModule.forFeature([{name: 'Business', schema: BusinessSchema}]),
  ],
  controllers: [AdminController],
  providers: [MongooseHealthIndicator, MailSenderService, LocationService],
  exports: []
})
export class AdminModule {
}
