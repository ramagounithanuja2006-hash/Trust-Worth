'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, errors } = format;
const lineFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const isTest = process.env.NODE_ENV === 'test';
const logDir = path.join(__dirname, '../../logs');
if (!isTest) fs.mkdirSync(logDir, { recursive: true });

const loggerTransports = [
  new transports.Console({
    silent: isTest,
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), lineFormat)
  })
];

if (!isTest) {
  loggerTransports.push(
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, 'combined.log') })
  );
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    lineFormat
  ),
  transports: loggerTransports
});

module.exports = logger;
