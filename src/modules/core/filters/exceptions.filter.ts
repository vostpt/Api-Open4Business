import { ExceptionFilter, Catch, HttpException, ArgumentsHost, Logger, HttpStatus } from '@nestjs/common';

import { getResponse } from '../helpers/response.helper';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {

  constructor(
    private readonly logger: Logger
  ) {
  }

  catch(exception: any, host: ArgumentsHost) {
    this.logger.setContext(ExceptionsFilter.name);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.BAD_REQUEST;

    try {
      if (exception.response?.data) {
        this.logger.error('found error data in exception response');
        status = exception.response?.data.resultCode;
      }  
    } catch (e) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    }

    // status = exception instanceof HttpException ?
    //   exception.getStatus() : (exception.errors ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR);

    const errors = JSON.stringify(exception.errors)

    this.logger.error(`${errors || exception} on ${request.url}`, JSON.stringify(exception.response?.data));

    response.status(status).json(getResponse(status, {
      resultMessage: 'Error',
      data: exception.response?.data?.data || exception || {}
    }));
  }

}