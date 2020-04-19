import { Injectable, Logger, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { promisify } from 'util';
import { compare } from 'bcrypt';

import { AuthsService } from './auths.service';
import { getResponse } from '../../../core/helpers/response.helper';
import { SessionsService } from './sessions.service';
import { DecodeTokenService } from './decode-token.service';
import { ChangePasswordModel } from '../models/change-password.model';
import { AuthModel } from '../models/auth.model';

@Injectable()
export class ChangePasswordService {
  constructor(
    @Inject(REQUEST) private readonly req: Request,
    private readonly authsService: AuthsService,
    private readonly decodeTokenService: DecodeTokenService,
    private readonly logger: Logger,
    private readonly sessionsService: SessionsService
  ) {
    // promisifying this method to avoid the callback hell
    promisify(compare);
  }

  async changePassword(body: ChangePasswordModel) {
    this.logger.setContext(ChangePasswordService.name);

    if (!this.req['token'] && !body.token) {
      this.logger.error('Missing: token in header or body');
      return getResponse(401);
    }

    const decoded = await this.decodeTokenService.decodeToken(this.req['token'] || body.token);

    if (!decoded) {
      return getResponse(401);
    }

    // find the auth
    let currentUser: AuthModel;
    try {
      currentUser = await this.authsService.findAuth({ authId: decoded.authId });
      if (!currentUser) {
        this.logger.error('No auth found for that token');
        return getResponse(401);
      }
    } catch (e) {
      this.logger.error('Error accessing authschema');
      return getResponse(500);
    }

    console.log('currentUser', currentUser.authId, currentUser.isAdmin);

    if (body.authId && !currentUser.isAdmin) {
      return getResponse(403);
    }

    let auth: AuthModel;

    console.log('body.authId', body.authId);

    if (body.authId && body.authId != currentUser.authId) {
      try {
        auth = await this.authsService.findAuth({ authId: body.authId });
        if (!auth) {
          this.logger.error('No auth found for that token');
          return getResponse(401);
        }
      } catch (e) {
        this.logger.error('Error accessing authschema');
        return getResponse(500);
      }
    } else {
      auth = currentUser;
    }

    console.log('auth', auth.authId);

    if (body.currentPassword) {
      console.log('check currentPassword');

      // check if the current password is valid
      try {
        const result = await compare(body.currentPassword, auth.password);

        if (!result) {
          this.logger.error('Current password is wrong');
          return getResponse(401, { resultMessage: 'messages.errors.invalid_credentials' });
        }
      } catch (e) {
        this.logger.error('Error comparing the passwords');
        return getResponse(500);
      }
    }

    // update the auth
    try {
      await this.authsService.updateAuth({ query: { authId: auth.authId }, update: { password: body.password } });
    } catch (e) {
      this.logger.error(`Error saving the Auth ${e.message}`);
      return getResponse(400, { resultMessage: 'Error creating the user' });
    }

    // if the token isnt sent in the body
    // delete all sessions with the token from the header
    if (!body.token && !body.authId) {
      let sessions;
      try {
        sessions = await this.sessionsService.findSessions({ authId: decoded.authId, sessionId: { $ne: decoded.sessionId } });
      } catch (e) {
        this.logger.error('Error accessing SessionsSchema');
        return getResponse(500);
      }

      try {
        sessions.forEach(async (s) =>
          await this.sessionsService.deleteSession({ sessionId: s.sessionId })
        );
      } catch (e) {
        this.logger.error('Error deleting sessions');
        return getResponse(500);
      }
    }

    return getResponse(200);
  }
}
