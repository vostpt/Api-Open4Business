import { ExceptionFilter, Catch, HttpException, ArgumentsHost, Logger, HttpStatus } from '@nestjs/common';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {

  constructor(
    private readonly logger: Logger
  ) {
    logger.setContext(ExceptionsFilter.name);
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`${exception} on ${request.url}`, JSON.stringify(exception.response));

    // catch JOI errors.

    // catch http AXIOS errors.

    response.status(status).json({
      resultCode: status,
      resultMessage: 'Error',
      resultTimestamp: new Date().toISOString(),
      data: exception.response
      //data: exception.response?.data?.data || exception || {}
    });
  }

}