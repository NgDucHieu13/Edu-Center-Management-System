const pool = require('../config/db');

const SAFE_COLUMNS = `ma_nguoi_dung, ten_dang_nhap, ho_ten, email, so_dien_thoai,
  anh_dai_dien, vai_tro, trang_thai, ngay_tao, ngay_cap_nhat`;
const EDITABLE = ['ten_dang_nhap', 'ho_ten', 'email', 'so_dien_thoai', 'anh_dai_dien', 'vai_tro', 'trang_thai', 'mat_khau_hash'];

async function list() {
  const [rows] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM nguoi_dung ORDER BY ngay_tao DESC, ma_nguoi_dung DESC`);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.execute(`SELECT ${SAFE_COLUMNS} FROM nguoi_dung WHERE ma_nguoi_dung = ?`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const fields = EDITABLE.filter((field) => Object.hasOwn(data, field));
  const [result] = await pool.execute(
    `INSERT INTO nguoi_dung (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
    fields.map((field) => data[field]),
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const fields = EDITABLE.filter((field) => Object.hasOwn(data, field));
  if (fields.length) {
    await pool.execute(
      `UPDATE nguoi_dung SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE ma_nguoi_dung = ?`,
      [...fields.map((field) => data[field]), id],
    );
  }
  return getById(id);
}

async function lock(id) {
  const [result] = await pool.execute("UPDATE nguoi_dung SET trang_thai = 'khoa' WHERE ma_nguoi_dung = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = { list, getById, create, update, lock };
