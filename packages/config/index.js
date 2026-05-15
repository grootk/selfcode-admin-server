const dotenv = require("dotenv");

dotenv.config();

const environment = process.env.ENVIRONMENT;

module.exports = {
  app: {
    environment,
    name: process.env.APP_NAME,
    port: process.env.APP_PORT,
    host: process.env.APP_HOST,
  },
  mongo: {
    environment,
    mongoURI: process.env.MONGO_URI,
  },
  auth: {
    secretkey: process.env.JWT_SECRET_KEY,
  },
  aws: {
    cognito: {
      userpool: process.env.AWS_COGNITO_USERPOOL,
      webclient: process.env.AWS_COGNITO_WEBCLIENT,
    },
  },
};
