/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import mongoose from 'mongoose';
import { app } from './app';
import config from './config/index';
import { errorLogger, logger } from './shared/logger';

process.on('uncaughtException', error => {
  errorLogger.error(error);
  process.exit(1);
});

let server: any;
async function main() {
  try {
    // Add connection options for better performance
    await mongoose.connect(config.database_url as string, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    logger.info('DB Connected on Successfully');

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);

    // Fix: server.close() check was inverted (!server should be server)
    server = app.listen(port, config.base_url as string, () => {
      logger.info(`Example app listening on http://${config.base_url}:${config.port}`);
    });
  } catch (error) {
    errorLogger.error(error);
    throw error;
  }

  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        errorLogger.error(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}
main().catch(err => errorLogger.error(err));

process.on('SIGTERM', () => {
  logger.info('SIGTERM is received');
  if (server) {  // Fixed: was !server (inverted logic)
    server.close();
  }
});