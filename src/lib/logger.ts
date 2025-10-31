/**
 * Configures and exports a Winston logger instance for application-wide logging.
 *
 * The logger supports both file and console transports, with log rotation for files.
 * In development mode, logs are also output to the console with colorization.
 *
 * Log files:
 * - logs/combined.log: All logs at 'info' level and above (rotated, max 10MB, 1 file)
 * - logs/error.log: All logs at 'error' level (rotated, max 5MB, 5 files)
 *
 * The logger uses a custom format that includes timestamps, log levels, and stack traces for errors.
 *
 * Usage:
 *   import logger from './logger.js';
 *   logger.info('message');
 *   logger.error('error message', error);
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

/**
 * Custom log message format for Winston.
 * Includes timestamp, log level, message, and stack trace if present.
 */
const customFormat = printf(({ level, message, timestamp, stack }) => {
    if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
});

/**
 * Array of Winston transports for log output.
 * Adds file transports for combined and error logs, and a console transport in development.
 */
const transportArray: (transports.ConsoleTransportInstance | transports.FileTransportInstance)[] = [
    new transports.File({
        filename: 'logs/combined.log',
        level: 'info',
        maxsize: 10485760, // 10 MB
        maxFiles: 1,
    }),

    new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5 MB
        maxFiles: 5,
    }),
];

if (process.env.NODE_ENV === 'development') {
    transportArray.push(
        new transports.Console({
            format: combine(colorize(), customFormat),
            level: 'debug',
        }),
    );
}

/**
 * The configured Winston logger instance for the application.
 */
const logger = createLogger({
    level: 'info',
    format: combine(timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), customFormat),
    transports: transportArray,
});

export default logger;
