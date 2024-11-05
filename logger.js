
import winston from 'winston';


const logger = winston.createLogger({
  level: 'info', 
  format: winston.format.combine(
    winston.format.timestamp({

      format: () => {
        const date = new Date();

        const utc8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        return utc8Date.toISOString();
      }
    }),
    winston.format.json() 
  ),
  transports: [

    new winston.transports.File({ filename: 'error.log', level: 'error' }),

    new winston.transports.File({ filename: 'combined.log' }),

    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), 
        winston.format.simple() 
      )
    })
  ],
});


export default logger;
