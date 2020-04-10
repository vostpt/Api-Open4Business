import { MongooseOptionsFactory, MongooseModuleOptions } from '@nestjs/mongoose';

import { environment } from './environment';

export default class MongooseConfig implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: `mongodb://${environment.mongoDbHost}:${environment.mongoDbPort}/${environment.mongoDbDatabase}`,
      retryAttempts: environment.mongoDbInitialConnectionAttempts,
      retryDelay: environment.mongoDbInitialConnectionAInterval,
      user: environment.mongoDbUser,
      pass: environment.mongoDbPassword,
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
  }
}
