const crypto = require('crypto');
const pool = require('../config/db');

class PurchaseError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const code = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

async function createPurchaseRequest({ studentId, courseId, classId, paymentMethod }) {
  const [students] = await pool.execute('SELECT ma_hoc_vien, trang_thai FROM hoc_vien WHERE ma_hoc_vien = ?', [studentId]);
  if (!students[0]) throw new PurchaseError(404, 'Không tìm thấy hồ sơ học viên.');
  if (students[0].trang_thai === 'da_nghi') throw new PurchaseError(409, 'Hồ sơ đã nghỉ, không thể đăng ký khóa học.');
  const [courses] = await pool.execute("SELECT ma_khoa_hoc, ten_khoa_hoc, hoc_phi, trang_thai FROM khoa_hoc WHERE ma_khoa_hoc = ?", [courseId]);
  if (!courses[0] || courses[0].trang_thai !== 'dang_mo') throw new PurchaseError(404, 'Khóa học không tồn tại hoặc đã ngừng mở.');
  const [classes] = await pool.execute("SELECT ma_lop_hoc, ma_khoa_hoc, trang_thai, si_so_hien_tai, si_so_toi_da FROM lop_hoc WHERE ma_lop_hoc = ?", [classId]);
  const target = classes[0];
  if (!target || Number(target.ma_khoa_hoc) !== Number(courseId)) throw new PurchaseError(400, 'Lớp học không thuộc khóa học đã chọn.');
  if (!['dang_mo', 'dang_hoc'].includes(target.trang_thai) || Number(target.si_so_hien_tai) >= Number(target.si_so_toi_da)) throw new PurchaseError(409, 'Lớp hiện không còn chỗ nhận đăng ký.');
  const [existing] = await pool.execute(
    `SELECT d.ma_dang_ky FROM dang_ky_hoc d JOIN lop_hoc l ON l.ma_lop_hoc=d.ma_lop_hoc
     WHERE d.ma_hoc_vien=? AND l.ma_khoa_hoc=? AND d.trang_thai IN ('dang_hoc','bao_luu') LIMIT 1`, [studentId, courseId],
  );
  if (existing[0]) throw new PurchaseError(409, 'Học viên đã có đăng ký còn hiệu lực cho khóa học này.');
  const [pending] = await pool.execute("SELECT ma_yeu_cau FROM yeu_cau_mua_khoa_hoc WHERE ma_hoc_vien=? AND ma_khoa_hoc=? AND trang_thai='cho_xac_nhan' LIMIT 1", [studentId, courseId]);
  if (pending[0]) throw new PurchaseError(409, 'Yêu cầu đăng ký khóa học này đang chờ nhân viên xác nhận.');
  const [result] = await pool.execute(
    `INSERT INTO yeu_cau_mua_khoa_hoc (ma_hoc_vien,ma_khoa_hoc,ma_lop_hoc,phuong_thuc,so_tien,trang_thai)
     VALUES (?,?,?,?,?,'cho_xac_nhan')`, [studentId, courseId, classId, paymentMethod, courses[0].hoc_phi],
  );
  return { ma_yeu_cau: result.insertId, ma_hoc_vien: Number(studentId), ma_khoa_hoc: Number(courseId), ma_lop_hoc: Number(classId), ten_khoa_hoc: courses[0].ten_khoa_hoc, so_tien: Number(courses[0].hoc_phi), phuong_thuc: paymentMethod, trang_thai: 'cho_xac_nhan' };
}

async function listPurchaseRequests({ studentId } = {}) {
  const values = studentId ? [studentId] : [];
  const [rows] = await pool.query(
    `SELECT r.*, h.ho_ten AS ten_hoc_vien, k.ten_khoa_hoc, l.ma_code_lop
     FROM yeu_cau_mua_khoa_hoc r JOIN hoc_vien h ON h.ma_hoc_vien=r.ma_hoc_vien
     JOIN khoa_hoc k ON k.ma_khoa_hoc=r.ma_khoa_hoc JOIN lop_hoc l ON l.ma_lop_hoc=r.ma_lop_hoc
     ${studentId ? 'WHERE r.ma_hoc_vien=?' : ''} ORDER BY r.ngay_tao DESC, r.ma_yeu_cau DESC`, values,
  );
  return rows;
}

async function reviewPurchaseRequest(id, action) {
  const [rows] = await pool.execute("SELECT * FROM yeu_cau_mua_khoa_hoc WHERE ma_yeu_cau=? AND trang_thai='cho_xac_nhan'", [id]);
  const request = rows[0];
  if (!request) throw new PurchaseError(404, 'Yêu cầu không tồn tại hoặc đã được xử lý.');
  if (action === 'reject') {
    await pool.execute("UPDATE yeu_cau_mua_khoa_hoc SET trang_thai='tu_choi', ngay_xu_ly=CURRENT_TIMESTAMP WHERE ma_yeu_cau=? AND trang_thai='cho_xac_nhan'", [id]);
    return { ma_yeu_cau: Number(id), trang_thai: 'tu_choi' };
  }
  const receipt = await purchaseCourse({ studentId: request.ma_hoc_vien, courseId: request.ma_khoa_hoc, classId: request.ma_lop_hoc, paymentMethod: request.phuong_thuc });
  const [updated] = await pool.execute("UPDATE yeu_cau_mua_khoa_hoc SET trang_thai='da_xac_nhan', ngay_xu_ly=CURRENT_TIMESTAMP, ma_hoa_don=? WHERE ma_yeu_cau=? AND trang_thai='cho_xac_nhan'", [receipt.data.ma_hoa_don, id]);
  if (!updated.affectedRows) throw new PurchaseError(409, 'Yêu cầu đã được nhân viên khác xử lý.');
  return { ...receipt.data, ma_yeu_cau: Number(id), trang_thai: 'da_xac_nhan' };
}

async function purchaseCourse({ studentId, courseId, classId, paymentMethod }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [students] = await connection.execute(
      'SELECT ma_hoc_vien, trang_thai FROM hoc_vien WHERE ma_hoc_vien = ? FOR UPDATE', [studentId],
    );
    if (!students[0]) throw new PurchaseError(404, 'Không tìm thấy hồ sơ học viên.');
    if (students[0].trang_thai === 'da_nghi') throw new PurchaseError(409, 'Hồ sơ học viên đã nghỉ, không thể đăng ký khóa học.');

    const [courses] = await connection.execute(
      'SELECT ma_khoa_hoc, ten_khoa_hoc, hoc_phi, trang_thai FROM khoa_hoc WHERE ma_khoa_hoc = ? FOR UPDATE', [courseId],
    );
    const course = courses[0];
    if (!course || course.trang_thai !== 'dang_mo') throw new PurchaseError(404, 'Khóa học không tồn tại hoặc đã ngừng mở.');

    const [classes] = await connection.execute(
      'SELECT ma_lop_hoc, ma_khoa_hoc, ma_code_lop, si_so_toi_da, trang_thai FROM lop_hoc WHERE ma_lop_hoc = ? FOR UPDATE', [classId],
    );
    const targetClass = classes[0];
    if (!targetClass || Number(targetClass.ma_khoa_hoc) !== Number(courseId)) {
      throw new PurchaseError(400, 'Lớp học không thuộc khóa học đã chọn.');
    }
    if (!['dang_mo', 'dang_hoc'].includes(targetClass.trang_thai)) {
      throw new PurchaseError(409, 'Lớp này hiện không nhận đăng ký.');
    }

    const [existing] = await connection.execute(
      `SELECT d.ma_dang_ky FROM dang_ky_hoc d
       JOIN lop_hoc l ON l.ma_lop_hoc = d.ma_lop_hoc
       WHERE d.ma_hoc_vien = ? AND l.ma_khoa_hoc = ? AND d.trang_thai IN ('dang_hoc', 'bao_luu') LIMIT 1`,
      [studentId, courseId],
    );
    if (existing[0]) throw new PurchaseError(409, 'Học viên đã có đăng ký đang hiệu lực cho khóa học này.');

    const [schedule] = await connection.execute(
      'SELECT thu_trong_tuan, gio_bat_dau, gio_ket_thuc FROM khung_gio_hoc WHERE ma_lop_hoc = ?', [classId],
    );
    if (schedule.length) {
      const [currentSchedules] = await connection.execute(
        `SELECT s.thu_trong_tuan, s.gio_bat_dau, s.gio_ket_thuc
         FROM dang_ky_hoc d JOIN khung_gio_hoc s ON s.ma_lop_hoc = d.ma_lop_hoc
         WHERE d.ma_hoc_vien = ? AND d.trang_thai = 'dang_hoc' AND d.ma_lop_hoc <> ?`,
        [studentId, classId],
      );
      const conflict = schedule.some((candidate) => currentSchedules.some((current) =>
        candidate.thu_trong_tuan === current.thu_trong_tuan
        && candidate.gio_bat_dau < current.gio_ket_thuc
        && candidate.gio_ket_thuc > current.gio_bat_dau));
      if (conflict) throw new PurchaseError(409, 'Lịch học của lớp bị trùng với một lớp học viên đang tham gia.');
    }

    const [countRows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM dang_ky_hoc WHERE ma_lop_hoc = ? AND trang_thai = 'dang_hoc'", [classId],
    );
    const enrolledCount = Number(countRows[0].total);
    if (enrolledCount >= Number(targetClass.si_so_toi_da)) {
      throw new PurchaseError(409, 'Lớp đã đủ sĩ số. Vui lòng chọn lớp khác; hệ thống chưa ghi nhận thanh toán.');
    }

    const [registrationResult] = await connection.execute(
      "INSERT INTO dang_ky_hoc (ma_hoc_vien, ma_lop_hoc, trang_thai, ghi_chu) VALUES (?, ?, 'dang_hoc', ?)",
      [studentId, classId, 'Đăng ký từ ứng dụng học viên (thanh toán demo)'],
    );
    const registrationId = registrationResult.insertId;
    const amount = Number(course.hoc_phi);

    const invoiceCode = code('HD');
    const [invoiceResult] = await connection.execute(
      `INSERT INTO hoa_don
       (ma_code_hoa_don, ma_hoc_vien, loai_hoa_don, ma_tham_chieu, tong_tien, so_tien_da_nop, so_tien_con_no, trang_thai)
       VALUES (?, ?, 'hoc_phi', ?, ?, ?, 0, 'da_thanh_toan')`,
      [invoiceCode, studentId, registrationId, amount, amount],
    );
    const invoiceId = invoiceResult.insertId;
    const [paymentResult] = await connection.execute(
      `INSERT INTO thanh_toan (ma_code_thanh_toan, ma_hoa_don, so_tien, phuong_thuc, ghi_chu)
       VALUES (?, ?, ?, ?, ?)`,
      [code('TT'), invoiceId, amount, paymentMethod, 'Thanh toán mô phỏng trong môi trường thử nghiệm'],
    );

    const nextCount = enrolledCount + 1;
    const nextClassStatus = nextCount >= Number(targetClass.si_so_toi_da) ? 'du_si_so' : targetClass.trang_thai;
    await connection.execute(
      'UPDATE lop_hoc SET si_so_hien_tai = ?, trang_thai = ? WHERE ma_lop_hoc = ?',
      [nextCount, nextClassStatus, classId],
    );
    await connection.execute("UPDATE hoc_vien SET trang_thai = 'dang_hoc' WHERE ma_hoc_vien = ?", [studentId]);

    await connection.commit();
    return {
      data: {
        ma_dang_ky: registrationId,
        ma_lop_hoc: Number(classId),
        ma_khoa_hoc: Number(courseId),
        ten_khoa_hoc: course.ten_khoa_hoc,
        ma_hoa_don: invoiceId,
        ma_code_hoa_don: invoiceCode,
        ma_thanh_toan: paymentResult.insertId,
        tong_tien: amount,
        phuong_thuc: paymentMethod,
        trang_thai_thanh_toan: 'da_thanh_toan',
        thanh_toan_mo_phong: true,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { PurchaseError, purchaseCourse, createPurchaseRequest, listPurchaseRequests, reviewPurchaseRequest };
