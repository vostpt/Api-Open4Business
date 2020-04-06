import { Injectable, ValidationPipe, ValidationError, HttpException } from '@nestjs/common';

@Injectable()
export class ValidationResponsePipe extends ValidationPipe {

  constructor() {

    super(
      {
        exceptionFactory: (errors: ValidationError[]) => {
          console.log('detntro do pipe', errors);
          const final = {
            errors:
              errors.map(error => {
                const _return = {};
                _return[error.property] = error.constraints[Object.keys(error.constraints)[0]];
                return _return;
              })

          }

          // TODO: finish this pipe!
          // console.log('END', final);
          //return final;
          return new HttpException(final, 412);
          //return new BadRequestException(final.errors, HttpStatus.PRECONDITION_FAILED.toString())
        }
      }
    );
  }

}
