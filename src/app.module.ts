import { Module } from '@nestjs/common';

import { CoreModule } from './modules/core/core.module'

import { AppController } from './app.controller';

import { AppService } from './app.service';

@Module({
  imports: [
    CoreModule,

    // Feature Modules.

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
