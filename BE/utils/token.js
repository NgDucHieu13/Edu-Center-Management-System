const jwt = require('jsonwebtoken');

function signAccessToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET chưa được cấu hình.');
  return jwt.sign(
    { sub: user.ma_nguoi_dung, vai_tro: user.vai_tro },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

module.exports = { signAccessToken };
