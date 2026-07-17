const jsonSuccess = (res, data = null, message = '', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const jsonError = (res, message = 'Terjadi kesalahan.', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  jsonSuccess,
  jsonError
};
