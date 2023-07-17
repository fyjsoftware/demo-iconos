import chalk from 'chalk';
import winston from 'winston';
import 'winston-daily-rotate-file';

const fecha = new Date();
const fechaArr = [fecha.getFullYear(), fecha.getMonth(), fecha.getDate(),
    fecha.getHours(), fecha.getMinutes(), fecha.getSeconds(),
    fecha.getMilliseconds()];
const logger = winston.createLogger({
    'transports': [
          new winston.transports.DailyRotateFile({
            format: winston.format.combine(winston.format.timestamp(),
                    winston.format.json()),
            maxFiles: '14d',
            datePattern: 'YYYY-MM-DD',
            filename: './logs/%DATE%.log'
          })
    ]
    });

export function info(str) {
    console.log(chalk.white("[" + new Date().toLocaleString() + "]") + " " +
                chalk.bgGreen.white("INFO") + " " + chalk.white(str));
    logger.log({private: true, message: str, level: 'info'});
}

export function warn(str) {
    console.log(chalk.white("[" + new Date().toLocaleString() + "]") + " " +
                chalk.bgYellow.black("WARN") + " " + chalk.white(str));
    logger.log({private: true, message: str, level: 'warn'});
}

export function error(str) {
    console.log(chalk.white("[" + new Date().toLocaleString() + "]") + " " +
                chalk.bgRed.white("ERROR") + " " + chalk.white(str));
    logger.log({private: true, message: str, level: 'error'});
}

export function debug(str) {
    console.log(chalk.white("[" + new Date().toLocaleString() + "]") + " " +
                chalk.bgBlue.white("DEBUG") + " " + chalk.white(str));
    logger.log({private: true, message: str, level: 'debug'});
}