import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

const customFormat = printf(({ level, message, timestamp, stack }) => {
    if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), customFormat),
    transports: [
        new transports.Console({
            format: combine(colorize(), customFormat),
            level: 'debug',
        }),

        new transports.File({
            filename: 'logs/combined.log',
            level: 'info',
            maxsize: 5242880,
            maxFiles: 5,
        }),

        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});

export default logger;
