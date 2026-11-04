const Model = require('../models/management.model');
const Registration = require('../services/registration.service');

const COURSE_TYPES = new Set(['giao_tiep', 'ielts', 'toeic', 'kids', 'business']);
const COURSE_STATUSES = new Set(['dang_mo', 'ngung_mo']);
const CLASS_STATUSES = new Set(['dang_mo', 'du_si_so', 'dang_hoc', 'da_ket_thuc', 'huy']);
const TEACHER_STATUSES = new Set(['dang_lam', 'nghi_viec']);
const WEEKDAYS = new Set(['Thu2', 'Thu3', 'Thu4', 'Thu5', 'Thu6', 'Thu7', 'ChuNhat']);

function validation(message) { const error = new Error(message); error.status = 400; return error; }
function required(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) throw validation(`Thiếu trường bắt buộc: ${missing.join(', ')}.`);
}
function positiveNumber(value, field, { optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === '')) return;
  if (!Number.isInteger(Number(value)) || Number(value) <= 0) throw validation(`${field} phải là số nguyên dương.`);
}
function validateSchedules(schedules) {
  if (schedules === undefined) return;
  if (!Array.isArray(schedules)) throw validation('lich_hoc phải là một mảng.');
  for (const item of schedules) {
    if (!WEEKDAYS.has(item.thu_trong_tuan)) throw validation('thu_trong_tuan không hợp lệ.');
    if (!item.gio_bat_dau || !item.gio_ket_thuc || item.gio_bat_dau >= item.gio_ket_thuc) throw validation('Giờ học không hợp lệ.');
    if (item.ma_phong != null) positiveNumber(item.ma_phong, 'ma_phong');
  }
}
function sendError(res, error) {
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Mã, email hoặc dữ liệu duy nhất đã tồn tại.' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Dữ liệu tham chiếu không tồn tại.' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Dữ liệu đang được sử dụng ở module khác.' });
  return res.status(error.status || 500).json({ message: error.status ? error.message : 'Lỗi máy chủ.' });
}
const endpoint = (fn) => async (req, res) => { try { await fn(req, res); } catch (error) { return sendError(res, error); } };

const listCourses = endpoint(async (req, res) => res.json({ data: await Model.listCourses() }));
const getCourse = endpoint(async (req, res) => {
  const row = await Model.getCourse(Number(req.params.id));
  return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy khóa học.' });
});
const createCourse = endpoint(async (req, res) => {
  const body = req.body || {};
  required(body, ['ma_code_khoa_hoc', 'ten_khoa_hoc', 'loai_khoa_hoc', 'hoc_phi', 'thoi_luong_tuan', 'tong_so_buoi']);
  if (!COURSE_TYPES.has(body.loai_khoa_hoc)) throw validation('loai_khoa_hoc không hợp lệ.');
  if (body.trang_thai !== undefined && !COURSE_STATUSES.has(body.trang_thai)) throw validation('trang_thai khóa học không hợp lệ.');
  for (const field of ['hoc_phi', 'thoi_luong_tuan', 'tong_so_buoi']) positiveNumber(body[field], field);
  return res.status(201).json({ data: await Model.createCourse(body) });
});
const updateCourse = endpoint(async (req, res) => {
  const body = req.body || {};
  if (body.loai_khoa_hoc !== undefined && !COURSE_TYPES.has(body.loai_khoa_hoc)) throw validation('loai_khoa_hoc không hợp lệ.');
  if (body.trang_thai !== undefined && !COURSE_STATUSES.has(body.trang_thai)) throw validation('trang_thai khóa học không hợp lệ.');
  for (const field of ['hoc_phi', 'thoi_luong_tuan', 'tong_so_buoi']) if (body[field] !== undefined) positiveNumber(body[field], field);
  const row = await Model.updateCourse(Number(req.params.id), body);
  return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy khóa học.' });
});
const deleteCourse = endpoint(async (req, res) => {
  if (!await Model.deleteCourse(Number(req.params.id))) return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
  return res.status(204).end();
});

const listClasses = endpoint(async (req, res) => {
  const teacherId = req.query.ma_giao_vien ? Number(req.query.ma_giao_vien) : undefined;
  return res.json({ data: await Model.listClasses({ teacherId }) });
});
const getClass = endpoint(async (req, res) => {
  const row = await Model.getClass(Number(req.params.id));
  return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy lớp học.' });
});
const createClass = endpoint(async (req, res) => {
  const body = req.body || {};
  required(body, ['ma_khoa_hoc', 'ma_code_lop']);
  positiveNumber(body.ma_khoa_hoc, 'ma_khoa_hoc');
  if (body.ma_giao_vien != null) positiveNumber(body.ma_giao_vien, 'ma_giao_vien');
  if (body.ma_phong != null) positiveNumber(body.ma_phong, 'ma_phong');
  if (body.si_so_toi_da !== undefined) positiveNumber(body.si_so_toi_da, 'si_so_toi_da');
  if (body.trang_thai !== undefined && !CLASS_STATUSES.has(body.trang_thai)) throw validation('trang_thai lớp học không hợp lệ.');
  validateSchedules(body.lich_hoc);
  return res.status(201).json({ data: await Model.createClass(body) });
});
const updateClass = endpoint(async (req, res) => {
  const body = req.body || {};
  if (body.ma_khoa_hoc !== undefined) positiveNumber(body.ma_khoa_hoc, 'ma_khoa_hoc');
  if (body.ma_giao_vien != null) positiveNumber(body.ma_giao_vien, 'ma_giao_vien');
  if (body.ma_phong != null) positiveNumber(body.ma_phong, 'ma_phong');
  if (body.si_so_toi_da !== undefined) positiveNumber(body.si_so_toi_da, 'si_so_toi_da');
  if (body.trang_thai !== undefined && !CLASS_STATUSES.has(body.trang_thai)) throw validation('trang_thai lớp học không hợp lệ.');
  validateSchedules(body.lich_hoc);
  const row = await Model.updateClass(Number(req.params.id), body);
  return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy lớp học.' });
});

const listTeachers = endpoint(async (req, res) => res.json({ data: await Model.listTeachers() }));
const getTeacher = endpoint(async (req, res) => {
  const row = await Model.getTeacher(Number(req.params.id));
  return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
});
const createTeacher = endpoint(async (req, res) => {
  const body = req.body || {};
  required(body, ['ho_ten']);
  if (body.ma_nguoi_dung != null) positiveNumber(body.ma_nguoi_dung, 'ma_nguoi_dung');
  if (body.trang_thai !== undefined && !TEACHER_STATUSES.has(body.trang_thai)) throw validation('trang_thai giáo viên không hợp lệ.');
  return res.status(201).json({ data: await Model.createTeacher(body) });
});
const updateTeacher = endpoint(async (req, res) => {
  const body = req.body || {};
  if (body.trang_thai !== undefined && !TEACHER_STATUSES.has(body.trang_thai)) throw validation('trang_thai giáo viên không hợp lệ.');
  const row = await Model.updateTeacher(Number(req.params.id), body);
  return row ? res.json({ data: row }) : res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
});
const deleteTeacher = endpoint(async (req, res) => {
  if (!await Model.deleteTeacher(Number(req.params.id))) return res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
  return res.status(204).end();
});
const listWaitlist = endpoint(async (req, res) => res.json({ data: await Model.listWaitlist() }));
const cancelWaitlist = endpoint(async (req, res) => {
  if (!await Model.cancelWaitlist(Number(req.params.id))) return res.status(404).json({ message: 'Không tìm thấy yêu cầu chờ hoặc yêu cầu đã được xử lý.' });
  return res.status(204).end();
});

const registerStudent = endpoint(async (req, res) => {
  const body = req.body || {};
  required(body, ['ma_hoc_vien', 'ma_lop_hoc']);
  positiveNumber(body.ma_hoc_vien, 'ma_hoc_vien');
  positiveNumber(body.ma_lop_hoc, 'ma_lop_hoc');
  const result = await Registration.registerStudent({ studentId: Number(body.ma_hoc_vien), classId: Number(body.ma_lop_hoc), note: body.ghi_chu });
  return res.status(result.waiting ? 202 : 201).json(result);
});
const listRegistrations = endpoint(async (req, res) => {
  const studentId = req.query.ma_hoc_vien ? Number(req.query.ma_hoc_vien) : undefined;
  const classId = req.query.ma_lop_hoc ? Number(req.query.ma_lop_hoc) : undefined;
  return res.json({ data: await Registration.listRegistrations({ studentId, classId }) });
});
const requestAdjustment = endpoint(async (req, res) => {
  const body = req.body || {};
  required(body, ['loai_dieu_chinh']);
  if (body.den_lop_id) positiveNumber(body.den_lop_id, 'den_lop_id');
  const data = await Registration.requestAdjustment({ registrationId: Number(req.params.id), type: body.loai_dieu_chinh, destinationClassId: body.den_lop_id ? Number(body.den_lop_id) : null, reason: body.ly_do });
  return res.status(201).json({ data });
});
const approveAdjustment = endpoint(async (req, res) => {
  const data = await Registration.approveAdjustment({ adjustmentId: Number(req.params.id), approverId: Number(req.user.sub) });
  return res.json({ data });
});

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, listClasses, getClass, createClass, updateClass, listTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, listWaitlist, cancelWaitlist, registerStudent, listRegistrations, requestAdjustment, approveAdjustment };
