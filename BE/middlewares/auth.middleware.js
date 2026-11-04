const jwt = require('jsonwebtoken');

const ROLES = Object.freeze({ ADMIN: 'admin', STAFF: 'nhan_vien', TEACHER: 'giao_vien', STUDENT: 'hoc_vien' });

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const [scheme, token] = header ? header.split(' ') : [];
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Vui lòng cung cấp Bearer token.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET chưa được cấu hình.' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: error.name === 'TokenExpiredError' ? 'Token đã hết hạn.' : 'Token không hợp lệ.' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực.' });
    if (!roles.includes(req.user.vai_tro)) return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles, ROLES };
