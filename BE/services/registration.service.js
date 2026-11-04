const pool = require('../config/db');

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function hasScheduleConflict(connection, studentId, classId, candidateSchedules, excludeClassId = classId) {
  if (!candidateSchedules.length) return false;
  const [existing] = await connection.execute(
    `SELECT s.thu_trong_tuan, s.gio_bat_dau, s.gio_ket_thuc
     FROM dang_ky_hoc d JOIN khung_gio_hoc s ON s.ma_lop_hoc = d.ma_lop_hoc
     WHERE d.ma_hoc_vien = ? AND d.trang_thai = 'dang_hoc' AND d.ma_lop_hoc <> ? AND d.ma_lop_hoc <> ?`,
    [studentId, classId, excludeClassId],
  );
  return candidateSchedules.some((a) => existing.some((b) =>
    a.thu_trong_tuan === b.thu_trong_tuan && a.gio_bat_dau < b.gio_ket_thuc && a.gio_ket_thuc > b.gio_bat_dau));
}

async function registerStudent({ studentId, classId, note }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [students] = await connection.execute('SELECT ma_hoc_vien FROM hoc_vien WHERE ma_hoc_vien = ? FOR UPDATE', [studentId]);
    if (!students[0]) throw new ApiError(404, 'Không tìm thấy học viên.');
    const [classes] = await connection.execute('SELECT * FROM lop_hoc WHERE ma_lop_hoc = ? FOR UPDATE', [classId]);
    const target = classes[0];
    if (!target || !['dang_mo', 'du_si_so', 'dang_hoc'].includes(target.trang_thai)) throw new ApiError(404, 'Lớp không tồn tại hoặc không nhận đăng ký.');
    const [existing] = await connection.execute("SELECT ma_dang_ky FROM dang_ky_hoc WHERE ma_hoc_vien = ? AND ma_lop_hoc = ? AND trang_thai IN ('dang_hoc','bao_luu')", [studentId, classId]);
    if (existing[0]) throw new ApiError(409, 'Học viên đã đăng ký lớp này.');
    const [schedules] = await connection.execute('SELECT thu_trong_tuan, gio_bat_dau, gio_ket_thuc FROM khung_gio_hoc WHERE ma_lop_hoc = ?', [classId]);
    if (await hasScheduleConflict(connection, studentId, classId, schedules)) throw new ApiError(409, 'Lịch học bị trùng với một lớp học viên đang tham gia.');

    const [counts] = await connection.execute("SELECT COUNT(*) AS total FROM dang_ky_hoc WHERE ma_lop_hoc = ? AND trang_thai = 'dang_hoc'", [classId]);
    const enrolled = Number(counts[0].total);
    if (enrolled >= target.si_so_toi_da) {
      const [waiting] = await connection.execute("SELECT ma_danh_sach_cho FROM danh_sach_cho WHERE ma_hoc_vien = ? AND ma_lop_mong_muon = ? AND trang_thai = 'cho'", [studentId, classId]);
      if (waiting[0]) throw new ApiError(409, 'Học viên đã nằm trong danh sách chờ của lớp này.');
      await connection.execute("INSERT INTO danh_sach_cho (ma_hoc_vien, ma_khoa_hoc, ma_lop_mong_muon, trang_thai, ghi_chu) VALUES (?, ?, ?, 'cho', ?)", [studentId, target.ma_khoa_hoc, classId, note || null]);
      await connection.execute("UPDATE lop_hoc SET si_so_hien_tai = ?, trang_thai = 'du_si_so' WHERE ma_lop_hoc = ?", [enrolled, classId]);
      await connection.commit();
      return { waiting: true, message: 'Lớp đã đủ sĩ số; học viên đã được thêm vào danh sách chờ.' };
    }

    const [result] = await connection.execute("INSERT INTO dang_ky_hoc (ma_hoc_vien, ma_lop_hoc, trang_thai, ghi_chu) VALUES (?, ?, 'dang_hoc', ?)", [studentId, classId, note || null]);
    const newCount = enrolled + 1;
    await connection.execute('UPDATE lop_hoc SET si_so_hien_tai = ?, trang_thai = ? WHERE ma_lop_hoc = ?', [newCount, newCount >= target.si_so_toi_da ? 'du_si_so' : target.trang_thai, classId]);
    await connection.execute("UPDATE hoc_vien SET trang_thai = 'dang_hoc' WHERE ma_hoc_vien = ?", [studentId]);
    await connection.commit();
    return { waiting: false, ma_dang_ky: result.insertId };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

async function listRegistrations({ studentId, classId }) {
  const filters = [];
  const values = [];
  if (studentId) { filters.push('d.ma_hoc_vien = ?'); values.push(studentId); }
  if (classId) { filters.push('d.ma_lop_hoc = ?'); values.push(classId); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT d.*, s.ho_ten AS ten_hoc_vien, c.ma_code_lop, c.ma_phong, c.phong_hoc, p.ten_phong, k.ten_khoa_hoc
     FROM dang_ky_hoc d JOIN hoc_vien s ON s.ma_hoc_vien = d.ma_hoc_vien
     JOIN lop_hoc c ON c.ma_lop_hoc = d.ma_lop_hoc JOIN khoa_hoc k ON k.ma_khoa_hoc = c.ma_khoa_hoc
     LEFT JOIN phong_hoc p ON p.ma_phong = c.ma_phong
     ${where} ORDER BY d.ngay_dang_ky DESC`, values,
  );
  return rows;
}

async function requestAdjustment({ registrationId, type, destinationClassId, reason }) {
  if (!['bao_luu', 'chuyen_lop', 'huy_dang_ky'].includes(type)) throw new ApiError(400, 'loai_dieu_chinh không hợp lệ.');
  if (type === 'chuyen_lop' && !destinationClassId) throw new ApiError(400, 'Chuyển lớp cần den_lop_id.');
  const [rows] = await pool.execute('SELECT ma_dang_ky, ma_lop_hoc FROM dang_ky_hoc WHERE ma_dang_ky = ?', [registrationId]);
  if (!rows[0]) throw new ApiError(404, 'Không tìm thấy đăng ký học.');
  const [result] = await pool.execute(
    `INSERT INTO dieu_chinh_dang_ky (ma_dang_ky, loai_dieu_chinh, tu_lop_id, den_lop_id, ly_do)
     VALUES (?, ?, ?, ?, ?)`,
    [registrationId, type, rows[0].ma_lop_hoc, destinationClassId || null, reason || null],
  );
  return { ma_dieu_chinh: result.insertId, trang_thai: 'cho_duyet' };
}

async function approveAdjustment({ adjustmentId, approverId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [adjustments] = await connection.execute('SELECT * FROM dieu_chinh_dang_ky WHERE ma_dieu_chinh = ? FOR UPDATE', [adjustmentId]);
    const adjustment = adjustments[0];
    if (!adjustment) throw new ApiError(404, 'Không tìm thấy yêu cầu điều chỉnh.');
    if (adjustment.trang_thai !== 'cho_duyet') throw new ApiError(409, 'Yêu cầu này đã được xử lý.');
    const [registrations] = await connection.execute('SELECT * FROM dang_ky_hoc WHERE ma_dang_ky = ? FOR UPDATE', [adjustment.ma_dang_ky]);
    const registration = registrations[0];
    if (!registration) throw new ApiError(404, 'Đăng ký học không còn tồn tại.');
    if (registration.trang_thai !== 'dang_hoc') throw new ApiError(409, 'Đăng ký không còn ở trạng thái đang học.');
    const oldClassId = registration.ma_lop_hoc;

    if (adjustment.loai_dieu_chinh === 'chuyen_lop') {
      const [classes] = await connection.execute('SELECT * FROM lop_hoc WHERE ma_lop_hoc = ? FOR UPDATE', [adjustment.den_lop_id]);
      const destination = classes[0];
      if (!destination || !['dang_mo', 'dang_hoc'].includes(destination.trang_thai)) throw new ApiError(409, 'Lớp chuyển đến không nhận học viên.');
      const [alreadyEnrolled] = await connection.execute("SELECT ma_dang_ky FROM dang_ky_hoc WHERE ma_hoc_vien = ? AND ma_lop_hoc = ? AND trang_thai IN ('dang_hoc','bao_luu') AND ma_dang_ky <> ?", [registration.ma_hoc_vien, destination.ma_lop_hoc, registration.ma_dang_ky]);
      if (alreadyEnrolled[0]) throw new ApiError(409, 'Học viên đã có đăng ký ở lớp chuyển đến.');
      const [countRows] = await connection.execute("SELECT COUNT(*) AS total FROM dang_ky_hoc WHERE ma_lop_hoc = ? AND trang_thai = 'dang_hoc'", [destination.ma_lop_hoc]);
      if (Number(countRows[0].total) >= destination.si_so_toi_da) throw new ApiError(409, 'Lớp chuyển đến đã đủ sĩ số.');
      const [scheduleRows] = await connection.execute('SELECT thu_trong_tuan, gio_bat_dau, gio_ket_thuc FROM khung_gio_hoc WHERE ma_lop_hoc = ?', [destination.ma_lop_hoc]);
      if (await hasScheduleConflict(connection, registration.ma_hoc_vien, destination.ma_lop_hoc, scheduleRows, oldClassId)) throw new ApiError(409, 'Lịch lớp chuyển đến bị trùng.');
      await connection.execute('UPDATE dang_ky_hoc SET ma_lop_hoc = ?, trang_thai = \'dang_hoc\' WHERE ma_dang_ky = ?', [destination.ma_lop_hoc, registration.ma_dang_ky]);
      await connection.execute("UPDATE lop_hoc SET si_so_hien_tai = GREATEST(si_so_hien_tai - 1, 0), trang_thai = IF(trang_thai = 'du_si_so', 'dang_mo', trang_thai) WHERE ma_lop_hoc = ?", [oldClassId]);
      await connection.execute('UPDATE lop_hoc SET si_so_hien_tai = si_so_hien_tai + 1, trang_thai = IF(si_so_hien_tai + 1 >= si_so_toi_da, \'du_si_so\', trang_thai) WHERE ma_lop_hoc = ?', [destination.ma_lop_hoc]);
    } else {
      const nextStatus = adjustment.loai_dieu_chinh === 'bao_luu' ? 'bao_luu' : 'nghi';
      await connection.execute('UPDATE dang_ky_hoc SET trang_thai = ? WHERE ma_dang_ky = ?', [nextStatus, registration.ma_dang_ky]);
      await connection.execute("UPDATE lop_hoc SET si_so_hien_tai = GREATEST(si_so_hien_tai - 1, 0), trang_thai = IF(trang_thai = 'du_si_so', 'dang_mo', trang_thai) WHERE ma_lop_hoc = ?", [oldClassId]);
    }
    await connection.execute("UPDATE dieu_chinh_dang_ky SET trang_thai = 'da_duyet', ma_nguoi_duyet = ? WHERE ma_dieu_chinh = ?", [approverId, adjustmentId]);
    await connection.commit();
    return { ma_dieu_chinh: Number(adjustmentId), trang_thai: 'da_duyet' };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

module.exports = { ApiError, registerStudent, listRegistrations, requestAdjustment, approveAdjustment };
