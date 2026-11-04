function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy API: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: status === 500 ? 'Lỗi máy chủ.' : err.message });
}

module.exports = { notFound, errorHandler };
