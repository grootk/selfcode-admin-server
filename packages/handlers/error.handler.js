const { payloadUtils } = require("../utils");

module.exports = (data, req, res) => {
  const statusCode = data.status;
  res.status(statusCode).send(payloadUtils.getErrorPayload(data));
};
