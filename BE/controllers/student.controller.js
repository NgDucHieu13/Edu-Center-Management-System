const Student = require('../models/student.model');

const ALLOWED_FIELDS = new Set(['ma_nguoi_dung', 'ho_ten', 'ngay_sinh', 'gioi_tinh', 'so_dien_thoai', 'email', 'dia_chi', 'trinh_do_hien_tai', 'muc_tieu_hoc_tap', 'trang_thai']);
const GENDERS = new Set(['Nam', 'Nữ', 'Khác']);
const STATUSES = new Set(['tiem_nang', 'dang_hoc', 'tam_nghi', 'hoan_thanh', 'da_nghi']);

function validatePayload(body, partial = false) {
  const data = Object.fromEntries(Object.entries(body || {}).filter(([key]) => ALLOWED_FIELDS.has(key)));
  if (!partial && (!data.ho_ten || !String(data.ho_ten).trim())) return 'ho_ten là bắt buộc.';
  if (Object.hasOwn(data, 'ho_ten') && !String(data.ho_ten).trim()) return 'ho_ten không được để trống.';
  if (data.gioi_tinh != null && !GENDERS.has(data.gioi_tinh)) return 'gioi_tinh không hợp lệ.';
  if (data.trang_thai != null && !STATUSES.has(data.trang_thai)) return 'trang_thai không hợp lệ.';
  if (Object.hasOwn(body || {}, 'ma_nguoi_dung') && data.ma_nguoi_dung != null && (!Number.isInteger(Number(data.ma_nguoi_dung)) || Number(data.ma_nguoi_dung) < 1)) return 'ma_nguoi_dung phải là số nguyên dương.';
  return data;
}

function handleDbError(err, res) {
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email, số điện thoại hoặc tài khoản đã tồn tại.' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'ma_nguoi_dung không tồn tại.' });
  if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Học viên đang được tham chiếu bởi dữ liệu khác.' });
  return res.status(500).json({ message: 'Lỗi máy chủ.' });
}

async function list(req, res) {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  try { return res.json({ data: await Student.findAll({ limit, offset: (page - 1) * limit }), page, limit }); }
  catch (err) { return handleDbError(err, res); }
}

async function getById(req, res) {
  try {
    const row = await Student.findById(Number(req.params.id));
    return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy học viên.' });
  } catch (err) { return handleDbError(err, res); }
}

async function create(req, res) {
  const data = validatePayload(req.body);
  if (typeof data === 'string') return res.status(400).json({ message: data });
  try { return res.status(201).json({ data: await Student.create(data) }); }
  catch (err) { return handleDbError(err, res); }
}

async function update(req, res) {
  const data = validatePayload(req.body, true);
  if (typeof data === 'string') return res.status(400).json({ message: data });
  if (!Object.keys(data).length) return res.status(400).json({ message: 'Cần cung cấp ít nhất một trường hợp lệ để cập nhật.' });
  try {
    const row = await Student.update(Number(req.params.id), data);
    return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy học viên.' });
  } catch (err) { return handleDbError(err, res); }
}

async function remove(req, res) {
  try {
    const removed = await Student.remove(Number(req.params.id));
    return removed ? res.status(204).end() : res.status(404).json({ message: 'Không tìm thấy học viên.' });
  } catch (err) { return handleDbError(err, res); }
}

async function history(req, res, next, kind) {
  try {
    const id = Number(req.params.id);
    if (req.user?.vai_tro === 'hoc_vien') {
      const ownProfile = await Student.findByUserId(Number(req.user.sub));
      if (!ownProfile || ownProfile.ma_hoc_vien !== id) return res.status(403).json({ message: 'Bạn chỉ được xem lịch sử của chính mình.' });
    }
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên.' });
    const data = kind === 'payments' ? await Student.getPaymentHistory(id) : await Student.getLearningHistory(id);
    return res.json({ data });
  } catch (err) { return next(err); }
}

const learningHistory = (req, res, next) => history(req, res, next, 'learning');
const paymentHistory = (req, res, next) => history(req, res, next, 'payments');

module.exports = { list, getById, create, update, remove, learningHistory, paymentHistory };
