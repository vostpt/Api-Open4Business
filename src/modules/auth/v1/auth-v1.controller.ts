import { Body, Controller, Get, Logger, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { getResponse } from '../../core/helpers/response.helper';
import { CreatedSuccessResponseModel } from '../../core/models/created-success-response.model';
import { SuccessResponseModel } from '../../core/models/success-response.model';
import { BusinessService } from '../../core/services/business.service';
import { DecodeTokenService } from '../../core/services/decode-token.service';
import { ChangePasswordModel } from './models/change-password.model';
import { ConfirmAccountModel } from './models/confirm-account.model';
import { RecoverPasswordModel } from './models/recover-password.model';
import { ResendConfirmAccountEmailModel } from './models/resend-confirm-account-email.model';
import { SignInResponseModel } from './models/sign-in-response.model';
import { SignInModel } from './models/sign-in.model';
import { SignUpResponseModel } from './models/sign-up-response.model';
import { SignUpModel } from './models/sign-up.model';
import { AuthsService } from './services/auths.service';
import { ChangePasswordService } from './services/change-password.service';
import { ConfirmAccountService } from './services/confirm-account.service';
import { LogoutService } from './services/logout.service';
import { RecoverPasswordService } from './services/recover-password.service';
import { ResendConfirmAccountEmailService } from './services/resend-confirm-account-email.service';
import { SignInService } from './services/sign-in.service';
import { SignUpService } from './services/sign-up.service';
import { VerifyTokenService } from './services/verify-token.service';
import { LocationService } from '../../core/services/location.service';



@Controller('api/auth/v1')
@ApiTags('Auth')
export class AuthV1Controller {
  private loggerContext = 'AuthController';

  constructor(
      private readonly businessService: BusinessService,
      private readonly locationService: LocationService,
      private readonly authService: AuthsService,
      private readonly changePasswordService: ChangePasswordService,
      private readonly confirmAccountService: ConfirmAccountService,
      private readonly logger: Logger,
      private readonly logoutService: LogoutService,
      private readonly recoverPasswordService: RecoverPasswordService,
      private readonly resendConfirmAccountEmailService:
          ResendConfirmAccountEmailService,
      private readonly signInService: SignInService,
      private readonly signUpService: SignUpService,
      private readonly verifyTokenService: VerifyTokenService,
      private readonly decodeTokenService: DecodeTokenService) {}

  @Get('session')
  @ApiOperation({summary: 'Verify if the session is still valid'})
  @ApiOkResponse({description: 'Session is valid', type: SuccessResponseModel})
  @ApiUnauthorizedResponse({description: 'Session isn\'t valid'})
  async verifySession(@Req() req: any, @Res() res: Response): Promise<object> {
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

    const response =
        await this.verifyTokenService.verifyToken(authorization, res);
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

  @Put('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change an account\'s info' })
  @ApiOkResponse({ description: 'Successfully updated info', type: SuccessResponseModel })
  @ApiBadRequestResponse({ description: 'Missing parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid authorization header' })
  async updateAuth(
    @Body('authId') authId: string,
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('phone') phone: string,
    @Body('company') company: string,
    @Body('isActive') isActive: boolean,
    @Req() req,
    @Res() res: Response
  ): Promise<object> {
    // decode the token
    const decoded = await this.decodeTokenService.decodeToken(req['token']);

    if (decoded === null) {
      return res.status(401).send(
          getResponse(401, {resultMessage: 'Invalid token'}));
    }

    const query = {authId: decoded.authId};
    let update = {};

    // Only admin can change other users info
    if (authId && authId != decoded.authId) {
      const admin = await this.authService.findAuth({authId: decoded.authId});

      if (!admin || !admin.isAdmin) {
        return res.status(403).send(getResponse(
            403,
            {resultMessage: 'You don\'t have permission to do this action.'}));
      }

      update = {
        ...update,
        isActive
      };

      query.authId = authId;
    }

    try {
      if (email) {
        update = {
          ...update,
          ...{
            authId: email
          }
        };
      }

      if (name) {
        update = {...update, name};
      }

      if (phone) {
        update = {...update, phone};
      }

      if (company) {
        update = {...update, company};
      }

      let changes = await this.authService.updateAuth({query, update});

      if (company) {
        changes =
            await this.businessService.updateBusiness({query: {email}, update});
      }
      const business = await this.businessService.find({email});

      // Disable / Enable all locations for user
      await this.locationService.updateLocations({query: {businessId: business.businessId, disabled: isActive}, update: {disabled: !isActive}});

      const auth = await this.authService.findAuth(query);

      const response = getResponse(200, {
        data: {
          info: {email: auth.authId, name: auth.name, phone: auth.phone, isActive: auth.isActive},
          changes
        }
      });

      return res.status(response.resultCode).send(response);
    } catch (e) {
      let response;

      if (e.code === 11000) {
        this.logger.error('Duplicated email', e);
        response = getResponse(409, {resultMessage: 'Email already exists'});
      } else {
        this.logger.error('Error on update user info', e);
        response = getResponse(400, {data: e});
      }

      return res.status(response.resultCode).send(response);
    }
  }

  @Get('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account info' })
  @ApiOkResponse({ description: 'Successfully get account info', type: SuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Invalid authorization header' })
  async getInfo(
    @Query('authId') authId: string,
    @Req() req,
    @Res() res: Response
  ): Promise<object> {
    // decode the token
    const decoded = await this.decodeTokenService.decodeToken(req['token']);


    if (decoded === null) {
      return res.status(401).send(
          getResponse(401, {resultMessage: 'Invalid token'}));
    }

    const query = {authId: decoded.authId};

    // Only admin can change other users info
    if (authId && authId != decoded.authId) {
      const admin = await this.authService.findAuth({authId: decoded.authId});

      if (!admin || !admin.isAdmin) {
        return res.status(403).send(getResponse(
            403,
            {resultMessage: 'You don\'t have permission to do this action.'}));
      }

      query.authId = authId;
    }

    const auth = await this.authService.findAuth({authId: query.authId});
    const company = await this.businessService.find({email: query.authId});

    const response = getResponse(200, {
      data: {
        info: {
          email: auth.authId,
          name: auth.name,
          phone: auth.phone,
          isAdmin: auth.isAdmin,
          isActive: auth.isActive
        },
        company
      }
    });
    return res.status(response.resultCode).send(response);
  }

  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Successfully get all users', type: SuccessResponseModel })
  @ApiUnauthorizedResponse({ description: 'Invalid authorization header' })
  @ApiForbiddenResponse({ description: 'Forbiden' })
  async getUsers(
    @Query('search') search: string,
    @Req() req,
    @Res() res: Response
  ): Promise<object> {
    // decode the token
    const decoded = await this.decodeTokenService.decodeToken(req['token']);

    if (decoded === null) {
      return res.status(401).send(
          getResponse(401, {resultMessage: 'Invalid token'}));
    }

    const admin = await this.authService.findAuth({authId: decoded.authId});

    if (!admin || !admin.isAdmin) {
      return res.status(403).send(getResponse(
          403,
          {resultMessage: 'You don\'t have permission to do this action.'}));
    }

    const exp = new RegExp('.*' + search + '.*', 'i');
    const filter =
        search ? {$or: [{authId: {$regex: exp}}, {name: {$regex: exp}}]} : {};
    const users = await this.authService.getAll(filter);

    const response = getResponse(200, {data: {users}});
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
