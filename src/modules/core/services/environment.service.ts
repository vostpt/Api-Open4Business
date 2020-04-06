import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariablesModel, ENV_VARIABLES_SCHEMA } from '../../../config/environment';

import { ValidationErrorItem } from '@hapi/joi';

@Injectable()
export class EnvironmentService {

  private isServiceValid = false;
  public variables = new EnvironmentVariablesModel();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) { 
    this.isServiceValid = this.parseEnvironmentVariables();
    this.logger.log('Environment Service OK', 'EnvironmentService');
  }

  isValid() {
    return this.isServiceValid;
  }

  private parseEnvironmentVariables() {

    // Import available ENV variables.
    const envVariables: object = {};
    try {
      for (const key in this.variables) {
        envVariables[key] = this.configService.get(key);
      }
    } catch (error) {
      this.logger.error('Failed to assign ENV variables.', error, 'TODO: FALTA CONTEXTO');
      return false;
    }

    // Makes the validation against defined rules.
    const validation = ENV_VARIABLES_SCHEMA.validate(envVariables, { abortEarly: false });

    if (validation.error) {
      let errors = '';
      validation.error.details.forEach((key: ValidationErrorItem) => {
        errors += `${key.message}\n`;
      });

      this.logger.error('Invalid ENV variables definition!', errors, 'TODO: FALTA CONTEXTO');
      return false;
    }

    // All went OK, let's store the parsed varaibles.
    try {
      this.variables = validation.value;
    } catch (error) {
      this.logger.error('Failed to assign validated ENV variables to service variable.', error, 'TODO: FALTA CONTEXTO');
      return false;
    }

    return true;

  }

};