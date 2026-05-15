const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

const logger = createLogger({
  transports: [
    new transports.Console({
      level: "info",
      format: combine(
        timestamp({ format: "HH:mm:ss" }),
        colorize(),
        printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level} : ${message}`;
        })
      ),
    }),
  ],
});

module.exports = {
  logger,
};
