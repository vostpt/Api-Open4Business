import { Injectable, Inject, Logger } from '@nestjs/common';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { promisify } from 'util';
import {v1 as uuidv1} from 'uuid';
import { sign } from 'jsonwebtoken';
import * as dateformat from 'dateformat';
import { compare } from 'bcrypt';

import { environment } from '../../../../config/environment';

import { AuthsService } from './auths.service';
import { SessionsService } from './sessions.service';
import { getResponse } from '../../../core/helpers/response.helper';

import { SessionModel } from '../models/session.model';

@Injectable()
export class SignInService {
  constructor(
    @Inject(REQUEST) private readonly req: Request,
    private readonly authsService: AuthsService,
    private readonly logger: Logger,
    private readonly sessionService: SessionsService
  ) {
    // promisifying this method to avoid the callback hell
    promisify(compare);
  }

  async signIn(body) {
    this.logger.setContext(SignInService.name);

    // find the auth
    let auth
    try {
      auth = await this.authsService.findAuth({ authId: body.authId });
      if (!auth) {
        this.logger.error('Auth not found');
        return getResponse(401, { resultMessage: 'messages.errors.invalid_credentials' });
      }

      if (!auth.isActive) {
        this.logger.error('Account isn\'t confirmed');
        return getResponse(423, { resultMessage: 'messages.errors.account_not_confirmed' });
      }
    } catch (e) {
      this.logger.error('Error accessing AuthSchema');
      return getResponse(500);
    }

    // compare the passwords
    try {
      const result = await compare(body.password, auth.password);

      if (!result) {
        this.logger.error('Passwords don\'t match');
        return getResponse(401, { resultMessage: 'messages.errors.invalid_credentials' });
      }
    } catch (e) {
      this.logger.error('Error comparing the passwords');
      return getResponse(500);
    }

    // generate the sessionId
    const sessionId = uuidv1();

    // create the token
    const tokenModel = {
      authId: auth.authId,
      sessionId,
      sessionType: body.sessionType,
      numberOfLogins: auth.numberOfLogins + 1,
      lastLoginDate: Math.round(+new Date() / 1000),
      ttl: (environment.tokenTtl || 172800),
      createdAt: Math.round(+new Date() / 1000)
    };

    const token = sign(tokenModel, environment.jwtPrivateKey, { algorithm: 'RS256' });

    this.logger.log('Token generated, updating number of logins');

    // update the number of logins
    try {
      await this.authsService.updateAuth({ query: { authId: auth.authId }, update: { numberOfLogins: auth.numberOfLogins + 1 } });
    } catch (e) {
      this.logger.error('Error updating the auth');
      return getResponse(500);
    }

    const nowTimestamp = Math.round(+new Date() / 1000);

    // create session
    const session = new SessionModel({
      sessionId,
      authId: auth.authId,
      lastLoginFrom: this.req.ip,
      lastLoginDate: nowTimestamp,
      lastToken: token,
      sessionType: body.sessionType,
      context: body.context || '',
      expiresAt: nowTimestamp + (environment.tokenTtl || 172800),
      description: `My session ${dateformat(new Date(), 'fullDate')}`
    });

    try {
      await this.sessionService.createSession(session);
      return getResponse(200, { data: { token } })
    } catch (e) {
      this.logger.error('Error saving the session');
      return getResponse(500);
    }
  }
}
