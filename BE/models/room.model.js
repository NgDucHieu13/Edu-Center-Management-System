const pool = require('../config/db');

const FIELDS = ['ten_phong', 'suc_chua', 'trang_thai', 'mo_ta'];
const select = `SELECT p.*,
  (SELECT COUNT(DISTINCT l.ma_lop_hoc) FROM lop_hoc l WHERE (l.ma_phong = p.ma_phong OR l.phong_hoc = p.ten_phong OR l.phong_hoc LIKE CONCAT('%', p.ten_phong)) AND l.trang_thai NOT IN ('da_ket_thuc','huy')) AS so_lop
  FROM phong_hoc p`;

async function findAll() {
  const [rows] = await pool.query(`${select} ORDER BY p.ten_phong`);
  return rows;
}
async function findById(id) {
  const [rows] = await pool.execute(`${select} WHERE p.ma_phong = ?`, [id]);
  return rows[0] || null;
}
async function create(data) {
  const fields = FIELDS.filter((field) => Object.hasOwn(data, field));
  const [result] = await pool.execute(`INSERT INTO phong_hoc (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, fields.map((field) => data[field]));
  return findById(result.insertId);
}
async function update(id, data) {
  const fields = FIELDS.filter((field) => Object.hasOwn(data, field));
  if (fields.length) await pool.execute(`UPDATE phong_hoc SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE ma_phong = ?`, [...fields.map((field) => data[field]), id]);
  return findById(id);
}
async function remove(id) {
  const [result] = await pool.execute('DELETE FROM phong_hoc WHERE ma_phong = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
