const pool = require('../config/db');

const COURSE_FIELDS = ['ma_code_khoa_hoc', 'ten_khoa_hoc', 'trinh_do', 'loai_khoa_hoc', 'hoc_phi', 'thoi_luong_tuan', 'tong_so_buoi', 'mo_ta', 'trang_thai'];
const CLASS_FIELDS = ['ma_khoa_hoc', 'ma_code_lop', 'ma_giao_vien', 'ma_phong', 'phong_hoc', 'si_so_toi_da', 'ngay_bat_dau', 'ngay_ket_thuc', 'trang_thai'];
const TEACHER_FIELDS = ['ma_nguoi_dung', 'ho_ten', 'so_dien_thoai', 'email', 'chuyen_mon', 'gioi_thieu', 'trang_thai'];

function pick(data, fields) {
  return fields.filter((field) => Object.hasOwn(data || {}, field));
}

async function listCourses() {
  const [rows] = await pool.query('SELECT * FROM khoa_hoc ORDER BY ngay_tao DESC');
  return rows;
}
async function getCourse(id) {
  const [rows] = await pool.execute('SELECT * FROM khoa_hoc WHERE ma_khoa_hoc = ?', [id]);
  return rows[0] || null;
}
async function createCourse(data) {
  const fields = pick(data, COURSE_FIELDS);
  const [result] = await pool.execute(`INSERT INTO khoa_hoc (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, fields.map((field) => data[field]));
  return getCourse(result.insertId);
}
async function updateCourse(id, data) {
  const fields = pick(data, COURSE_FIELDS);
  if (fields.length) await pool.execute(`UPDATE khoa_hoc SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE ma_khoa_hoc = ?`, [...fields.map((field) => data[field]), id]);
  return getCourse(id);
}
async function deleteCourse(id) {
  const [result] = await pool.execute('DELETE FROM khoa_hoc WHERE ma_khoa_hoc = ?', [id]);
  return result.affectedRows > 0;
}

async function listClasses({ teacherId } = {}) {
  const where = teacherId ? 'WHERE l.ma_giao_vien = ?' : '';
  const values = teacherId ? [teacherId] : [];
  const [rows] = await pool.query(
    `SELECT l.*, p.ten_phong, k.ten_khoa_hoc, k.loai_khoa_hoc, g.ho_ten AS ten_giao_vien
     FROM lop_hoc l JOIN khoa_hoc k ON k.ma_khoa_hoc = l.ma_khoa_hoc
     LEFT JOIN giao_vien g ON g.ma_giao_vien = l.ma_giao_vien
     LEFT JOIN phong_hoc p ON p.ma_phong = l.ma_phong
     ${where} ORDER BY l.ngay_bat_dau DESC, l.ma_lop_hoc DESC`, values,
  );
  if (!rows.length) return rows;
  const ids = rows.map((row) => row.ma_lop_hoc);
  const placeholders = ids.map(() => '?').join(', ');
  const [schedules] = await pool.execute(`SELECT s.*, p.ten_phong FROM khung_gio_hoc s LEFT JOIN phong_hoc p ON p.ma_phong = s.ma_phong WHERE s.ma_lop_hoc IN (${placeholders}) ORDER BY s.thu_trong_tuan, s.gio_bat_dau`, ids);
  const byClass = new Map();
  for (const schedule of schedules) {
    if (!byClass.has(schedule.ma_lop_hoc)) byClass.set(schedule.ma_lop_hoc, []);
    byClass.get(schedule.ma_lop_hoc).push(schedule);
  }
  return rows.map((row) => ({ ...row, ten_phong: row.ten_phong || row.phong_hoc, lich_hoc: byClass.get(row.ma_lop_hoc) || [] }));
}
async function getClass(id, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT l.*, p.ten_phong, k.ten_khoa_hoc, k.loai_khoa_hoc, g.ho_ten AS ten_giao_vien
     FROM lop_hoc l JOIN khoa_hoc k ON k.ma_khoa_hoc = l.ma_khoa_hoc
     LEFT JOIN giao_vien g ON g.ma_giao_vien = l.ma_giao_vien
     LEFT JOIN phong_hoc p ON p.ma_phong = l.ma_phong WHERE l.ma_lop_hoc = ?`, [id],
  );
  if (!rows[0]) return null;
  const [schedules] = await executor.execute('SELECT s.*, p.ten_phong FROM khung_gio_hoc s LEFT JOIN phong_hoc p ON p.ma_phong = s.ma_phong WHERE s.ma_lop_hoc = ? ORDER BY s.thu_trong_tuan, s.gio_bat_dau', [id]);
  return { ...rows[0], ten_phong: rows[0].ten_phong || rows[0].phong_hoc, lich_hoc: schedules };
}
async function createClass(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const fields = pick(data, CLASS_FIELDS);
    const [result] = await connection.execute(`INSERT INTO lop_hoc (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, fields.map((field) => data[field]));
    for (const schedule of data.lich_hoc || []) {
      await connection.execute('INSERT INTO khung_gio_hoc (ma_lop_hoc, thu_trong_tuan, gio_bat_dau, gio_ket_thuc, ma_phong, phong_hoc) VALUES (?, ?, ?, ?, ?, ?)', [result.insertId, schedule.thu_trong_tuan, schedule.gio_bat_dau, schedule.gio_ket_thuc, schedule.ma_phong ?? data.ma_phong ?? null, schedule.phong_hoc ?? data.phong_hoc ?? null]);
    }
    await connection.commit();
    return getClass(result.insertId);
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
async function updateClass(id, data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const fields = pick(data, CLASS_FIELDS);
    if (fields.length) await connection.execute(`UPDATE lop_hoc SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE ma_lop_hoc = ?`, [...fields.map((field) => data[field]), id]);
    if (Object.hasOwn(data, 'lich_hoc')) {
      await connection.execute('DELETE FROM khung_gio_hoc WHERE ma_lop_hoc = ?', [id]);
      for (const schedule of data.lich_hoc || []) {
        await connection.execute('INSERT INTO khung_gio_hoc (ma_lop_hoc, thu_trong_tuan, gio_bat_dau, gio_ket_thuc, ma_phong, phong_hoc) VALUES (?, ?, ?, ?, ?, ?)', [id, schedule.thu_trong_tuan, schedule.gio_bat_dau, schedule.gio_ket_thuc, schedule.ma_phong ?? data.ma_phong ?? null, schedule.phong_hoc ?? data.phong_hoc ?? null]);
      }
    }
    const row = await getClass(id, connection);
    await connection.commit();
    return row;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

async function listTeachers() {
  const [rows] = await pool.query(
    `SELECT g.*, COUNT(DISTINCT l.ma_lop_hoc) AS so_lop_dang_day
     FROM giao_vien g LEFT JOIN lop_hoc l ON l.ma_giao_vien = g.ma_giao_vien AND l.trang_thai IN ('dang_mo','du_si_so','dang_hoc')
     GROUP BY g.ma_giao_vien ORDER BY g.ho_ten`,
  );
  return rows;
}
async function getTeacher(id) {
  const [rows] = await pool.execute('SELECT * FROM giao_vien WHERE ma_giao_vien = ?', [id]);
  return rows[0] || null;
}
async function createTeacher(data) {
  const fields = pick(data, TEACHER_FIELDS);
  const [result] = await pool.execute(`INSERT INTO giao_vien (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, fields.map((field) => data[field]));
  return getTeacher(result.insertId);
}
async function updateTeacher(id, data) {
  const fields = pick(data, TEACHER_FIELDS);
  if (fields.length) await pool.execute(`UPDATE giao_vien SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE ma_giao_vien = ?`, [...fields.map((field) => data[field]), id]);
  return getTeacher(id);
}
async function deleteTeacher(id) {
  const [result] = await pool.execute('DELETE FROM giao_vien WHERE ma_giao_vien = ?', [id]);
  return result.affectedRows > 0;
}
async function listWaitlist() {
  const [rows] = await pool.query(
    `SELECT w.*, s.ho_ten AS ten_hoc_vien, c.ten_khoa_hoc, l.ma_code_lop
     FROM danh_sach_cho w JOIN hoc_vien s ON s.ma_hoc_vien = w.ma_hoc_vien
     JOIN khoa_hoc c ON c.ma_khoa_hoc = w.ma_khoa_hoc
     LEFT JOIN lop_hoc l ON l.ma_lop_hoc = w.ma_lop_mong_muon
     WHERE w.trang_thai = 'cho' ORDER BY w.ngay_dang_ky`);
  return rows;
}
async function cancelWaitlist(id) {
  const [result] = await pool.execute("UPDATE danh_sach_cho SET trang_thai = 'huy' WHERE ma_danh_sach_cho = ? AND trang_thai = 'cho'", [id]);
  return result.affectedRows > 0;
}

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, listClasses, getClass, createClass, updateClass, listTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, listWaitlist, cancelWaitlist };
