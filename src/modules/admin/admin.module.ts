import { Module } from '@nestjs/common';
import { MongooseHealthIndicator } from '@nestjs/terminus';

import { AdminController } from './admin.controller';

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [MongooseHealthIndicator],
  exports: [
  ]
})
export class AdminModule { }
