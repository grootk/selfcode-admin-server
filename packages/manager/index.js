const { Log } = require("../utils");
const { MongoManager } = require("../database");
const { CONSTANT } = require("../constants");

const logger = Log.logger;

const mongoManager = MongoManager;

module.exports = {
  mongoManager,
  logger,
  CONSTANT,
};
