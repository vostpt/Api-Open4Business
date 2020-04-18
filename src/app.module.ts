import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import MongooseConfig from './config/mongoose-config';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CoreModule } from './modules/core/core.module';
import { InsightsModule } from './modules/insights/insights.module';



@Module({
  imports: [
    CoreModule, AdminModule, AuthModule, InsightsModule, BusinessesModule,
    MongooseModule.forRootAsync({useClass: MongooseConfig})
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
}
