import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExtractTokenMiddleware } from '../../core/middleware/extract-token.middleware';
import { BusinessSchema } from '../../core/schemas/business.schema';
import { LocationSchema } from '../../core/schemas/location.schema';
import { BusinessService } from '../../core/services/business.service';
import { LocationService } from '../../core/services/location.service';
import { InsightsV1Controller } from './insights-v1.controller';
import { MailSenderService } from '../../core/services/mailsender.service';
import { AccountService } from '../../businesses/v1/services/account.service';

@Module({
  imports: [
    MongooseModule.forFeature([{name: 'Location', schema: LocationSchema}]),
    MongooseModule.forFeature([{name: 'Business', schema: BusinessSchema}]),
  ],
  controllers: [InsightsV1Controller],
  providers: [LocationService, BusinessService, MailSenderService, AccountService],
  exports: []
})
export class InsightsV1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ExtractTokenMiddleware).forRoutes(InsightsV1Controller);
  }
}