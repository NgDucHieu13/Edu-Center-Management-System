const pool = require('../config/db');

const COLUMNS = `ma_hoc_vien, ma_nguoi_dung, ho_ten, ngay_sinh, gioi_tinh,
  so_dien_thoai, email, dia_chi, trinh_do_hien_tai, muc_tieu_hoc_tap,
  trang_thai, ngay_tao`;

async function findAll({ limit, offset }) {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS} FROM hoc_vien ORDER BY ma_hoc_vien DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM hoc_vien WHERE ma_hoc_vien = ?`, [id]);
  return rows[0] || null;
}

async function findByUserId(userId) {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM hoc_vien WHERE ma_nguoi_dung = ?`, [userId]);
  return rows[0] || null;
}

async function create(data) {
  const fields = ['ma_nguoi_dung', 'ho_ten', 'ngay_sinh', 'gioi_tinh', 'so_dien_thoai', 'email', 'dia_chi', 'trinh_do_hien_tai', 'muc_tieu_hoc_tap', 'trang_thai'];
  const values = fields.map((field) => data[field] ?? null);
  const [result] = await pool.execute(
    `INSERT INTO hoc_vien (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
    values,
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const fields = ['ma_nguoi_dung', 'ho_ten', 'ngay_sinh', 'gioi_tinh', 'so_dien_thoai', 'email', 'dia_chi', 'trinh_do_hien_tai', 'muc_tieu_hoc_tap', 'trang_thai'];
  const updates = fields.filter((field) => Object.hasOwn(data, field));
  if (updates.length) {
    await pool.execute(
      `UPDATE hoc_vien SET ${updates.map((field) => `\`${field}\` = ?`).join(', ')} WHERE ma_hoc_vien = ?`,
      [...updates.map((field) => data[field]), id],
    );
  }
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.execute("UPDATE hoc_vien SET trang_thai = 'da_nghi' WHERE ma_hoc_vien = ?", [id]);
  return result.affectedRows > 0;
}

async function getLearningHistory(id) {
  const [rows] = await pool.execute(
    `SELECT dk.ma_dang_ky, dk.ngay_dang_ky, dk.trang_thai AS trang_thai_dang_ky,
      l.ma_lop_hoc, l.ma_code_lop, l.ngay_bat_dau, l.ngay_ket_thuc,
      k.ma_khoa_hoc, k.ten_khoa_hoc, k.loai_khoa_hoc, k.trinh_do,
      kh.ma_ket_qua, kh.ten_bai_kiem_tra, kh.diem_so, kh.diem_toi_da, kh.ngay_cham
     FROM dang_ky_hoc dk
     JOIN lop_hoc l ON l.ma_lop_hoc = dk.ma_lop_hoc
     JOIN khoa_hoc k ON k.ma_khoa_hoc = l.ma_khoa_hoc
     LEFT JOIN ket_qua_hoc_tap kh ON kh.ma_dang_ky = dk.ma_dang_ky
     WHERE dk.ma_hoc_vien = ? ORDER BY dk.ngay_dang_ky DESC, kh.ngay_cham DESC`,
    [id],
  );
  return rows;
}

async function getPaymentHistory(id) {
  const [rows] = await pool.execute(
    `SELECT hd.ma_hoa_don, hd.ma_code_hoa_don, hd.loai_hoa_don,
      hd.ma_tham_chieu, hd.tong_tien, hd.so_tien_da_nop, hd.so_tien_con_no,
      hd.han_thanh_toan, hd.trang_thai AS trang_thai_hoa_don,
      tt.ma_thanh_toan, tt.ma_code_thanh_toan, tt.so_tien,
      tt.phuong_thuc, tt.ngay_thanhtoan, tt.ghi_chu
     FROM hoa_don hd LEFT JOIN thanh_toan tt ON tt.ma_hoa_don = hd.ma_hoa_don
     WHERE hd.ma_hoc_vien = ? ORDER BY hd.ngay_tao DESC, tt.ngay_thanhtoan DESC`,
    [id],
  );
  return rows;
}

module.exports = { findAll, findById, findByUserId, create, update, remove, getLearningHistory, getPaymentHistory };
