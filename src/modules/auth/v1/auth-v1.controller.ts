import {Body, Controller, Get, Logger, Post, Put, Req, Res, Query} from '@nestjs/common';
import {ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse} from '@nestjs/swagger';
import {Response} from 'express';

import {CreatedSuccessResponseModel} from '../../core/models/created-success-response.model';
import {SuccessResponseModel} from '../../core/models/success-response.model';

import {ChangePasswordModel} from './models/change-password.model';
import {ConfirmAccountModel} from './models/confirm-account.model';
import {RecoverPasswordModel} from './models/recover-password.model';
import {ResendConfirmAccountEmailModel} from './models/resend-confirm-account-email.model';
import {SignInResponseModel} from './models/sign-in-response.model';
import {SignInModel} from './models/sign-in.model';
import {SignUpResponseModel} from './models/sign-up-response.model';
import {SignUpModel} from './models/sign-up.model';
import {ChangePasswordService} from './services/change-password.service';
import {ConfirmAccountService} from './services/confirm-account.service';
import {LogoutService} from './services/logout.service';
import {RecoverPasswordService} from './services/recover-password.service';
import {ResendConfirmAccountEmailService} from './services/resend-confirm-account-email.service';
import {SignInService} from './services/sign-in.service';
import {SignUpService} from './services/sign-up.service';
import {VerifyTokenService} from './services/verify-token.service';

@Controller('auth/v1')
@ApiTags('Auth')
export class AuthV1Controller {
  private loggerContext = 'AuthController';

  constructor(
      private readonly changePasswordService: ChangePasswordService,
      private readonly confirmAccountService: ConfirmAccountService,
      private readonly logger: Logger,
      private readonly logoutService: LogoutService,
      private readonly recoverPasswordService: RecoverPasswordService,
      private readonly resendConfirmAccountEmailService:
          ResendConfirmAccountEmailService,
      private readonly signInService: SignInService,
      private readonly signUpService: SignUpService,
      private readonly verifyTokenService: VerifyTokenService) {
    this.logger.log('Init auth controller', AuthV1Controller.name);
  }

  @Get('session')
  @ApiOperation({ summary: 'Verify if the session is still valid' })
  @ApiOkResponse({ description: 'Session is valid', type: SuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Session isn\'t valid' })
  async verifySession(
    @Req() req: any,
    @Res() res: Response
  ): Promise<object> {
    let {authorization} = req.headers;

    if (!authorization) {
      this.logger.error(
          `Authorization header not found ${JSON.stringify(req.headers)}`,
          this.loggerContext);

          return res.status(401).send('Authorization header not found');
    }

    const regex = /^Bearer\s([^.]+(?:\.[^.]+){2})$/gm;

    if (!regex.test(authorization)) {
      this.logger.error(
          `Authorization header doesn\'t match regex ${authorization}`,
          this.loggerContext);
          return res.status(401).send('Invalid Authorization header');
    }

    authorization = authorization.replace('Bearer ', '');

    const response = await this.verifyTokenService.verifyToken(authorization, res);
    return res.status(response.resultCode).send(response);
  }

  @Get('token')
  @ApiOperation({ summary: 'Verify if the token is still valid' })
  @ApiOkResponse({ description: 'Token is valid', type: SuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Token isn\'t valid' })
  @ApiQuery({ name: 'token', description: 'The token to validate', type: String, required: true })
  async verifyToken(
    @Query('token') token: string,
    @Res() res: Response
  ): Promise<object> {
    const response = await this.verifyTokenService.verifyToken(token, res);
    return res.status(response.resultCode).send(response);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in and create a new session' })
  @ApiCreatedResponse({ description: 'Successfully signed in, token is returned', type: SignInResponseModel })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async signIn(
    @Body() body: SignInModel,
    @Res() res: Response
  ): Promise<object> {
    const response = await this.signInService.signIn(body);
    return res.status(response.resultCode).send(response);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign up and create a new auth' })
  @ApiCreatedResponse({ description: 'Successfully signed up, auth is created', type: SignUpResponseModel })
  @ApiBadRequestResponse({ description: 'Missing parameters' })
  async signUp(
    @Body() body: SignUpModel,
    @Res() res: Response
  ): Promise<object> {
    const response = await this.signUpService.signUp(body);
    return res.status(response.resultCode).send(response);
  }

  @Put('confirm')
  @ApiOperation({ summary: 'Confirm account' })
  @ApiOkResponse({ description: 'Successfully confirmed the account', type: SuccessResponseModel })
  @ApiBadRequestResponse({ description: 'Confirmation code invalid' })
  async confirmAccount(
    @Body() body: ConfirmAccountModel,
    @Res() res: Response
  ): Promise<object> {
    const response = await this.confirmAccountService.confirmAccount(body);
    return res.status(response.resultCode).send(response);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Resend confirm account email and generate a new code' })
  @ApiCreatedResponse({ description: 'Successfully sent the email', type: CreatedSuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Missing parameters' })
  async resendConfirmEmail(
    @Body() body: ResendConfirmAccountEmailModel,
    @Res() res: Response
  ): Promise<object> {
    const response =
        await this.resendConfirmAccountEmailService.resendEmail(body);
    return res.status(response.resultCode).send(response);
  }

  @Post('recover')
  @ApiOperation({ summary: 'Trigger the recover password process' })
  @ApiCreatedResponse({ description: 'Successfully sent the email', type: CreatedSuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Invalid authId' })
  @ApiBadRequestResponse({ description: 'Missing parameters' })
  async recoverPassword(
    @Body() body: RecoverPasswordModel,
    @Res() res: Response
  ): Promise<object> {
    const response = await this.recoverPasswordService.recoverPassword(body);
    return res.status(response.resultCode).send(response);
  }

  @Put('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change an account\'s password' })
  @ApiOkResponse({ description: 'Successfully changed the password', type: SuccessResponseModel })
  @ApiBadRequestResponse({ description: 'Missing parameters or the password and confirmPassword don\'t match' })
  @ApiUnauthorizedResponse({ description: 'Invalid authorization header' })
  async changePassword(
    @Body() body: ChangePasswordModel,
    @Res() res: Response
  ): Promise<object> {
    const response = await this.changePasswordService.changePassword(body);
    return res.status(response.resultCode).send(response);
  }

  @Get('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Destroy the session' })
  @ApiOkResponse({ description: 'Session destroyed successfully', type: SuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Token isn\'t valid' })
  async logout(
    @Res() res: Response
  ): Promise<object> {
    const response = await this.logoutService.logout();
    return res.status(response.resultCode).send(response);
  }
}
