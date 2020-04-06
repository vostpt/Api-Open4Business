import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Module, Global, HttpModule, Logger } from '@nestjs/common';
import { ConfigModule  } from '@nestjs/config';

// Services.
import { EnvironmentService } from './services/environment.service';
import { SwaggerService } from './services/swagger.service';

// Filters.
import { ExceptionsFilter } from './filters/exceptions.filter';

// Pipes.
import { ValidationResponsePipe } from './pipes/validation-response.pipe';

@Global() // This will make this module available globaly! This should only be done on this CoreModule!
@Module({
  controllers: [],
  providers: [
    Logger,
    EnvironmentService,

    SwaggerService,

    {
      provide: APP_FILTER,
      useClass: ExceptionsFilter
    },
    {
      provide: APP_PIPE,
      useClass: ValidationResponsePipe
    }
  ],
  imports: [
    HttpModule,
    ConfigModule.forRoot({ // Load and parse .env file.
      isGlobal: true
    })
  ],
  exports: [
    HttpModule,
    Logger,
    EnvironmentService
  ]
})
export class CoreModule { }
