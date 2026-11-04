const pool = require('../config/db');

async function getFinanceReport(from, to) {
  const [payments] = await pool.execute(
    `SELECT DATE_FORMAT(tt.ngay_thanhtoan, '%Y-%m-%d') AS ngay, SUM(tt.so_tien) AS doanh_thu, COUNT(*) AS so_giao_dich
     FROM thanh_toan tt WHERE tt.ngay_thanhtoan >= ? AND tt.ngay_thanhtoan < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY DATE_FORMAT(tt.ngay_thanhtoan, '%Y-%m-%d') ORDER BY ngay`, [from, to],
  );
  const [[paid]] = await pool.execute(
    `SELECT COALESCE(SUM(so_tien),0) AS tong_thu FROM thanh_toan
     WHERE ngay_thanhtoan >= ? AND ngay_thanhtoan < DATE_ADD(?, INTERVAL 1 DAY)`, [from, to],
  );
  const [[debt]] = await pool.execute(
    `SELECT COALESCE(SUM(so_tien_con_no),0) AS cong_no, COUNT(*) AS hoa_don_con_no
     FROM hoa_don WHERE so_tien_con_no > 0`,
  );
  const [[refunds]] = await pool.execute(
    `SELECT COALESCE(SUM(CASE WHEN trang_thai='da_hoan' AND ngay_xu_ly >= ? AND ngay_xu_ly < DATE_ADD(?, INTERVAL 1 DAY) THEN so_tien ELSE 0 END),0) AS da_hoan,
       COALESCE(SUM(CASE WHEN trang_thai='cho_duyet' AND ngay_tao >= ? AND ngay_tao < DATE_ADD(?, INTERVAL 1 DAY) THEN so_tien ELSE 0 END),0) AS cho_duyet,
       SUM(trang_thai='cho_duyet' AND ngay_tao >= ? AND ngay_tao < DATE_ADD(?, INTERVAL 1 DAY)) AS so_yeu_cau
     FROM hoan_tien WHERE (ngay_tao >= ? AND ngay_tao < DATE_ADD(?, INTERVAL 1 DAY)) OR (ngay_xu_ly >= ? AND ngay_xu_ly < DATE_ADD(?, INTERVAL 1 DAY))`, [from, to, from, to, from, to, from, to, from, to],
  );
  const [refundRows] = await pool.execute(
    `SELECT r.ma_hoan_tien, r.ma_hoa_don, hd.ma_code_hoa_don, hv.ho_ten AS ten_hoc_vien,
       r.so_tien, r.ly_do, r.trang_thai, r.ngay_tao
     FROM hoan_tien r JOIN hoa_don hd ON hd.ma_hoa_don=r.ma_hoa_don
     JOIN hoc_vien hv ON hv.ma_hoc_vien=hd.ma_hoc_vien
     WHERE r.ngay_tao >= ? AND r.ngay_tao < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY r.ngay_tao DESC LIMIT 100`, [from, to],
  );
  const [invoices] = await pool.execute(
    `SELECT hd.ma_hoa_don, hd.ma_code_hoa_don, hv.ho_ten AS ten_hoc_vien, hd.tong_tien,
      hd.so_tien_da_nop, hd.so_tien_con_no, hd.trang_thai, hd.ngay_tao
     FROM hoa_don hd JOIN hoc_vien hv ON hv.ma_hoc_vien=hd.ma_hoc_vien
     WHERE hd.so_tien_da_nop > 0 ORDER BY hd.ngay_tao DESC LIMIT 200`,
  );
  return { from, to, summary: { tong_thu: Number(paid.tong_thu), doanh_thu_thuan: Number(paid.tong_thu) - Number(refunds.da_hoan), cong_no: Number(debt.cong_no), hoa_don_con_no: Number(debt.hoa_don_con_no), da_hoan: Number(refunds.da_hoan), cho_hoan: Number(refunds.cho_duyet), so_yeu_cau_hoan: Number(refunds.so_yeu_cau) }, daily: payments.map((row) => ({ ...row, doanh_thu: Number(row.doanh_thu), so_giao_dich: Number(row.so_giao_dich) })), refunds: refundRows, invoices };
}

async function createRefund({ ma_hoa_don, so_tien, ly_do }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [invoices] = await connection.execute('SELECT ma_hoa_don, so_tien_da_nop FROM hoa_don WHERE ma_hoa_don=? FOR UPDATE', [ma_hoa_don]);
    if (!invoices.length) { const error = new Error('Không tìm thấy hóa đơn.'); error.status = 404; throw error; }
    const [used] = await connection.execute("SELECT COALESCE(SUM(so_tien),0) AS total FROM hoan_tien WHERE ma_hoa_don=? AND trang_thai IN ('cho_duyet','da_hoan')", [ma_hoa_don]);
    if (Number(so_tien) + Number(used[0].total) > Number(invoices[0].so_tien_da_nop)) { const error = new Error('Số tiền hoàn vượt quá số tiền đã thanh toán còn có thể hoàn.'); error.status = 400; throw error; }
    const [result] = await connection.execute('INSERT INTO hoan_tien (ma_hoa_don, so_tien, ly_do) VALUES (?, ?, ?)', [ma_hoa_don, so_tien, ly_do]);
    await connection.commit();
    return result.insertId;
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

async function reviewRefund(id, action) {
  const status = action === 'approve' ? 'da_hoan' : 'tu_choi';
  const [result] = await pool.execute("UPDATE hoan_tien SET trang_thai=?, ngay_xu_ly=CURRENT_TIMESTAMP WHERE ma_hoan_tien=? AND trang_thai='cho_duyet'", [status, id]);
  if (!result.affectedRows) { const error = new Error('Yêu cầu hoàn tiền không tồn tại hoặc đã được xử lý.'); error.status = 404; throw error; }
}

async function getSettings() {
  const [[settings], [branches]] = await Promise.all([pool.execute('SELECT khoa, gia_tri FROM cau_hinh_he_thong ORDER BY khoa'), pool.execute('SELECT * FROM co_so ORDER BY ma_co_so')]);
  return { settings: Object.fromEntries(settings.map((row) => [row.khoa, row.gia_tri])), branches };
}
async function saveSettings(entries) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const [key, value] of Object.entries(entries)) await connection.execute('INSERT INTO cau_hinh_he_thong (khoa, gia_tri) VALUES (?, ?) ON DUPLICATE KEY UPDATE gia_tri=VALUES(gia_tri)', [key, String(value ?? '')]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
async function createBranch(body) {
  const [result] = await pool.execute('INSERT INTO co_so (ten_co_so, dia_chi, so_dien_thoai, email, trang_thai) VALUES (?, ?, ?, ?, ?)', [body.ten_co_so, body.dia_chi || null, body.so_dien_thoai || null, body.email || null, body.trang_thai || 'hoat_dong']);
  return result.insertId;
}
async function updateBranch(id, body) {
  const fields = ['ten_co_so', 'dia_chi', 'so_dien_thoai', 'email', 'trang_thai'];
  const sets = fields.filter((field) => body[field] !== undefined);
  if (!sets.length) return;
  const [result] = await pool.execute(`UPDATE co_so SET ${sets.map((field) => `\`${field}\`=?`).join(', ')} WHERE ma_co_so=?`, [...sets.map((field) => body[field]), id]);
  if (!result.affectedRows) {
    const [rows] = await pool.execute('SELECT ma_co_so FROM co_so WHERE ma_co_so=?', [id]);
    if (!rows.length) { const error = new Error('Không tìm thấy cơ sở.'); error.status = 404; throw error; }
  }
}

module.exports = { getFinanceReport, createRefund, reviewRefund, getSettings, saveSettings, createBranch, updateBranch };
