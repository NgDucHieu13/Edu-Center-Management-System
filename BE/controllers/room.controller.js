const Room = require('../models/room.model');
const STATUSES = new Set(['khong_lich', 'co_lich', 'bao_tri']);

function validate(body, partial = false) {
  if (!partial && (!body.ten_phong || !body.suc_chua)) throw Object.assign(new Error('ten_phong và suc_chua là bắt buộc.'), { status: 400 });
  if (body.suc_chua !== undefined && (!Number.isInteger(Number(body.suc_chua)) || Number(body.suc_chua) < 1)) throw Object.assign(new Error('suc_chua phải là số nguyên dương.'), { status: 400 });
  if (body.trang_thai !== undefined && !STATUSES.has(body.trang_thai)) throw Object.assign(new Error('trang_thai không hợp lệ.'), { status: 400 });
}
function handleError(res, error) {
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Tên phòng đã tồn tại.' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Phòng đang được lớp hoặc buổi học sử dụng.' });
  return res.status(error.status || 500).json({ message: error.status ? error.message : 'Lỗi máy chủ.' });
}
const endpoint = (fn) => async (req, res) => { try { await fn(req, res); } catch (error) { handleError(res, error); } };

exports.list = endpoint(async (_req, res) => res.json({ data: await Room.findAll() }));
exports.get = endpoint(async (req, res) => {
  const room = await Room.findById(Number(req.params.id));
  return room ? res.json({ data: room }) : res.status(404).json({ message: 'Không tìm thấy phòng học.' });
});
exports.create = endpoint(async (req, res) => {
  const body = req.body || {}; validate(body);
  return res.status(201).json({ data: await Room.create({ ...body, suc_chua: Number(body.suc_chua), trang_thai: body.trang_thai || 'khong_lich' }) });
});
exports.update = endpoint(async (req, res) => {
  const body = req.body || {}; validate(body, true);
  const room = await Room.update(Number(req.params.id), { ...body, ...(body.suc_chua !== undefined ? { suc_chua: Number(body.suc_chua) } : {}) });
  return room ? res.json({ data: room }) : res.status(404).json({ message: 'Không tìm thấy phòng học.' });
});
exports.remove = endpoint(async (req, res) => {
  if (!await Room.remove(Number(req.params.id))) return res.status(404).json({ message: 'Không tìm thấy phòng học.' });
  return res.status(204).end();
});
