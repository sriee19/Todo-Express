const winston = require('winston');
const path = require('path');
const os = require('os');
const fs = require('fs');

const logFilePath = path.join(os.homedir(), 'todo-logs/app.log');

if (fs.existsSync(logFilePath)) {
  fs.unlinkSync(logFilePath);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFilePath }),
  ],
});

module.exports = logger;
