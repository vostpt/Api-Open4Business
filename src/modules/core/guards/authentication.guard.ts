import { Injectable, CanActivate, ExecutionContext, HttpService, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

import { EnvironmentService } from '../services/environment.service';

// import { UrlModel } from '../models/url.model';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly logger: Logger,
    private readonly httpService: HttpService
  ) {
    logger.setContext(AuthenticationGuard.name);
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

    const request:any = context.switchToHttp().getRequest();

    request.context = {};

    // const { authorization } = request.headers;

    // if (!authorization) {
    //   this.logger.error(`Authorization not found ${JSON.stringify(request.headers)}`);
    //   return false;
    // }

    // const regex = /^Bearer\s([^.]+(?:\.[^.]+){2})$/gm;
    // if (!regex.test(authorization)) {
    //   this.logger.error(`Invalid Authorization`);
    //   return false;
    // }

    // TODO: Wainting for authentication.
    return true;




  }
}
