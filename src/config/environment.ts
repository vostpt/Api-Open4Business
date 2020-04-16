import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

export class Environment {
  port: number;
  logLevel: string;
  mongoDbHost: string;
  mongoDbPort: number;
  mongoDbDatabase: string;
  mongoDbInitialConnectionAttempts: number;
  mongoDbInitialConnectionAInterval: number;
  mongoDbUser: string;
  mongoDbPassword: string;
  tokenTtl: number;
  uploadsPath: string;
  jwtPrivateKey: Buffer;
  jwtPublicKey: Buffer
  defaultTimeout: number;
  smtpHost: string;
  smtpEmail: string;
  smtpPassword: string;
  adminEmail: string;
}

export const environment: Environment = {
  port: Number(process.env.PORT),
  logLevel: process.env.LOG_LEVEL,
  mongoDbHost: process.env.MONGO_DB_HOST,
  mongoDbPort: Number(process.env.MONGO_DB_PORT),
  mongoDbDatabase: process.env.MONGO_DB_DATABASE,
  mongoDbInitialConnectionAttempts: Number(process.env.MONGO_DB_INITIAL_CONNECTION_ATTEMPTS || 10),
  mongoDbInitialConnectionAInterval: Number(process.env.MONGO_DB_INITIAL_CONNECTION_INTERVAL || 1000),
  mongoDbUser: process.env.MONGO_DB_USER,
  mongoDbPassword: process.env.MONGO_DB_PASS,
  tokenTtl: Number(process.env.TOKEN_TTL),
  uploadsPath: process.env.UPLOADS_PATH,
  jwtPrivateKey: readFileSync((join(__dirname, '../', '/auth-keys/jwtRS256.key'))),
  jwtPublicKey: readFileSync((join(__dirname, '../', '/auth-keys/jwtRS256.key.pub'))),
  defaultTimeout: Number(process.env.DEFAULT_TIMEOUT || 90),
  smtpHost: process.env.SMTP_HOST,
  smtpEmail: process.env.SMTP_EMAIL,
  smtpPassword: process.env.SMTP_PASSWORD,
  adminEmail: process.env.ADMIN_EMAIL
};
