const User = require('../models/user.model');
const { hashPassword } = require('../utils/password');

const ROLES = new Set(['admin', 'nhan_vien', 'giao_vien', 'hoc_vien']);
const STATUSES = new Set(['hoat_dong', 'khoa']);

function badRequest(message) { const error = new Error(message); error.status = 400; return error; }
function handleError(res, error) {
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Tên đăng nhập, email hoặc số điện thoại đã được sử dụng.' });
  return res.status(error.status || 500).json({ message: error.status ? error.message : 'Lỗi máy chủ.' });
}
const endpoint = (handler) => async (req, res) => {
  try { await handler(req, res); } catch (error) { return handleError(res, error); }
};

const list = endpoint(async (req, res) => res.json({ data: await User.list() }));
const getById = endpoint(async (req, res) => {
  const user = await User.getById(Number(req.params.id));
  return user ? res.json({ data: user }) : res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
});
const create = endpoint(async (req, res) => {
  const body = req.body || {};
  for (const field of ['ten_dang_nhap', 'ho_ten', 'mat_khau', 'vai_tro']) {
    if (!String(body[field] || '').trim()) throw badRequest(`${field} là bắt buộc.`);
  }
  if (String(body.mat_khau).length < 8) throw badRequest('Mật khẩu phải có ít nhất 8 ký tự.');
  if (!ROLES.has(body.vai_tro)) throw badRequest('vai_tro không hợp lệ.');
  if (body.trang_thai !== undefined && !STATUSES.has(body.trang_thai)) throw badRequest('trang_thai không hợp lệ.');
  const data = {
    ten_dang_nhap: String(body.ten_dang_nhap).trim(),
    ho_ten: String(body.ho_ten).trim(),
    email: body.email?.trim() || null,
    so_dien_thoai: body.so_dien_thoai?.trim() || null,
    anh_dai_dien: body.anh_dai_dien || null,
    vai_tro: body.vai_tro,
    trang_thai: body.trang_thai || 'hoat_dong',
    mat_khau_hash: await hashPassword(body.mat_khau),
  };
  return res.status(201).json({ data: await User.create(data) });
});
const update = endpoint(async (req, res) => {
  const body = req.body || {};
  const data = {};
  for (const field of ['ten_dang_nhap', 'ho_ten', 'email', 'so_dien_thoai', 'anh_dai_dien']) {
    if (Object.hasOwn(body, field)) data[field] = typeof body[field] === 'string' ? body[field].trim() || null : body[field];
  }
  if (Object.hasOwn(body, 'vai_tro')) {
    if (!ROLES.has(body.vai_tro)) throw badRequest('vai_tro không hợp lệ.');
    data.vai_tro = body.vai_tro;
  }
  if (Object.hasOwn(body, 'trang_thai')) {
    if (!STATUSES.has(body.trang_thai)) throw badRequest('trang_thai không hợp lệ.');
    data.trang_thai = body.trang_thai;
  }
  if (body.mat_khau) {
    if (String(body.mat_khau).length < 8) throw badRequest('Mật khẩu phải có ít nhất 8 ký tự.');
    data.mat_khau_hash = await hashPassword(body.mat_khau);
  }
  if (!Object.keys(data).length) throw badRequest('Cần cung cấp ít nhất một trường để cập nhật.');
  const user = await User.update(Number(req.params.id), data);
  return user ? res.json({ data: user }) : res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
});
const lock = endpoint(async (req, res) => {
  if (!await User.lock(Number(req.params.id))) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  return res.status(204).end();
});

module.exports = { list, getById, create, update, lock };
