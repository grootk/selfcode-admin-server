const mongoose = require("mongoose");
const {
  Log: { logger },
} = require("../utils");
const { mongo } = require("../config");

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

mongoose.set("debug", true);
mongoose.set("strictQuery", true);

const connect = () => {
  logger.info("connecting to mongo db");
  mongoose.connect(mongo.mongoURI, {
    socketTimeoutMS: 60000,
    maxpoolSize: 10,
  });
  return mongoose.connection;
};

module.exports = {
  connect,
};
