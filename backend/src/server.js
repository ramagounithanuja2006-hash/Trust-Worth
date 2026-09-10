'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { ensureUploadDirs } = require('./config/paths');

async function start() {
  ensureUploadDirs();
  logger.info('VisionTrust Backend v1.0.0 — SIH26228');
  logger.info(`Node.js ${process.version} | env=${env.nodeEnv} | port=${env.port}`);

  const dbConnected = await connectDatabase();
  logger.info(dbConnected ? 'MongoDB connected' : 'MongoDB unavailable (running without persistence)');

  const server = app.listen(env.port, () => {
    logger.info(`Server ready at http://localhost:${env.port}`);
    logger.info(`Health → http://localhost:${env.port}/api/health`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
  });

  return server;
}

if (require.main === module) {
  start().catch((error) => {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { start };
