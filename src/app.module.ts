import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import MongooseConfig from './config/mongoose-config';

import { CoreModule } from './modules/core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { InsightsModule } from './modules/insights/insights.module';

@Module({
  imports: [
    CoreModule,

    AdminModule,
    AuthModule,
    InsightsModule,
    MongooseModule.forRootAsync({
      useClass: MongooseConfig
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
