import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExtractTokenMiddleware } from '../../core/middleware/extract-token.middleware';
import { BusinessSchema } from '../../core/schemas/business.schema';
import { BusinessService } from '../../core/services/business.service';
import { AuthV1Controller } from './auth-v1.controller';
import { AuthSchema } from './schemas/auth.schema';
import { SessionSchema } from './schemas/session.schema';
import { AuthsService } from './services/auths.service';
import { ChangePasswordService } from './services/change-password.service';
import { ConfirmAccountService } from './services/confirm-account.service';
import { DecodeTokenService } from '../../core/services/decode-token.service';
import { LogoutService } from './services/logout.service';
import { RecoverPasswordService } from './services/recover-password.service';
import { ResendConfirmAccountEmailService } from './services/resend-confirm-account-email.service';
import { SessionsService } from './services/sessions.service';
import { SignInService } from './services/sign-in.service';
import { SignUpService } from './services/sign-up.service';
import { VerifyTokenService } from './services/verify-token.service';
import { LocationService } from '../../core/services/location.service';
import { LocationSchema } from '../../core/schemas/location.schema';



@Module({
  imports: [
    MongooseModule.forFeature([{name: 'Session', schema: SessionSchema}]),
    MongooseModule.forFeature([{name: 'Auth', schema: AuthSchema}]),
    MongooseModule.forFeature([{name: 'Location', schema: LocationSchema}]),
    MongooseModule.forFeature([{name: 'Business', schema: BusinessSchema}]),
  ],
  controllers: [AuthV1Controller],
  providers: [
    AuthsService, BusinessService, LocationService, ChangePasswordService, ConfirmAccountService,
    DecodeTokenService, LogoutService, RecoverPasswordService,
    ResendConfirmAccountEmailService, SignInService, SignUpService,
    SessionsService, VerifyTokenService
  ],
  exports: []
})
export class AuthV1Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ExtractTokenMiddleware).forRoutes(AuthV1Controller);
  }
}