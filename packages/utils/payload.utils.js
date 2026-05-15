const getSuccessPayload = (data) => data;

const getErrorPayload = (error) => ({
  ...error,
});

const getValidationErrorPayload = (error) => {
  const response = {
    error: {
      message: "",
      fields: [],
    },
  };

  error.details.forEach((e) => {
    response.error.fields.push({
      key: e.context.key,
      type: e.type,
      message: e.message,
    });
  });

  response.error.message = response.error.message
    // eslint-disable-next-line no-undef
    .map((fields = fields.message))
    .join(", ");
  return response;
};

module.exports = {
  getSuccessPayload,
  getErrorPayload,
  getValidationErrorPayload,
};
