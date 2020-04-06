import * as Joi from '@hapi/joi';

export class EnvironmentVariablesModel {
  // NOTE: To have access to properties before assignment, it's necessary to equalize them to NULL here.
  APP_URL: string = null;
  APP_PORT: number = null;
  LOG_LEVEL: string = null;
}

// Validations to apply to environment variables.
export const ENV_VARIABLES_SCHEMA = Joi.object({
  APP_URL: Joi.string().uri().required(),
  APP_PORT: Joi.number().integer().default(80),
  LOG_LEVEL: Joi.string()
});
