import { Module } from '@nestjs/common';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { AdminController } from './admin.controller';
import { MailSenderService } from '../core/services/mailsender.service';


@Module({
  imports: [],
  controllers: [AdminController],
  providers: [MongooseHealthIndicator, MailSenderService],
  exports: []
})
export class AdminModule {
}
