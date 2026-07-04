const { StatusCodes } = require("http-status-codes");

function sendError(res, error) {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    error: error.message,
  });
}

function parsePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

module.exports = {
  sendError,
  parsePositiveNumber,
  StatusCodes,
};
