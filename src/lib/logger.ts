import * as dotenv from 'dotenv';
dotenv.config();

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
    if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
});

const transportArray: (transports.ConsoleTransportInstance | transports.FileTransportInstance)[] = [
    new transports.File({
        filename: 'logs/combined.log',
        level: 'info',
        maxsize: 10485760,
        maxFiles: 1,
    }),

    new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880,
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

const logger = createLogger({
    level: 'info',
    format: combine(timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), customFormat),
    transports: transportArray,
});

export default logger;
