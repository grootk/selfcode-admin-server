const express = require("express");
const helmet = require("helmet");
const process = require("process");
const config = require("../packages/config");
const { logger } = require("../packages/manager");
const appRoutes = require("./index.routes");
const { userCron } = require("./cron/cron");
// const {userCron}=require("./cron/userCron")
let app;
let server;
const initApp = async () => {
  const { name, port, host } = config.app;
  app = new express();
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-id-token,x-entity-id,x-user-id,x-api-key,X-Amz-User-Agent,X-Entity-Id"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
  });

  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.raw());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb",extended: true }));
  app.use(express.text());

  userCron();
  app.use(appRoutes);

  server = app.listen(port, host, (err) => {
    if (err) {
      logger.error({
        err,
        message: err.message,
      });
    }
    logger.info({ message: `${name} running on http://${host}:${port}` });
  });
};

const shutdown = async (code = null) => {
  if (!server) {
    return;
  }
  server.close((err) => {
    if (err) {
      process.exitCode = code || 1;
    }
    process.exit();
  });
};

process.on("SIGINT", async () => {
  logger.error({
    message: `Process ${process.pid}, Got SIGINT. Graceful shutdown`,
  });
  await shutdown();
});

process.on("SIGTERM", async () => {
  logger.error({
    message: `Process ${process.pid}, Got SIGTERM. Graceful shutdown`,
  });
  await shutdown();
});

process.on("beforeExit", (code) => {
  setTimeout(async () => {
    logger.error({ message: `Process will exit with code: ${code}` });
    await shutdown(code);
  }, 100);
});

process.on("exit", (code) => {
  logger.error({ message: `Process exited with code: ${code}` });
});

process.on("uncaughtException", async (err) => {
  logger.error({
    err,
    message: `Uncaught Exception: ${err.message}`,
  });
  await shutdown();
});

process.on("error", async (err) => {
  logger.error({
    err,
    message: `Error: ${err.message}`,
  });
  await shutdown();
});

process.on("unhandledRejection", async (reason, promise) => {
  logger.error({
    message: `Unhandled rejection at ${promise}, reason: ${
      reason.stack || reason
    }`,
  });
  await shutdown();
});

initApp()
  .then(() => logger.info({ message: "Server Initialized" }))
  .catch((err) => logger.error(err));
