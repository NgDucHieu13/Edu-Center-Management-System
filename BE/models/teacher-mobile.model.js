const pool = require('../config/db');

async function listTeachers() {
  const [rows] = await pool.query("SELECT ma_giao_vien, ho_ten, chuyen_mon, email, so_dien_thoai FROM giao_vien WHERE trang_thai = 'dang_lam' ORDER BY ho_ten");
  return rows;
}
async function getProfile(id) {
  const [rows] = await pool.execute('SELECT ma_giao_vien, ho_ten, chuyen_mon, email, so_dien_thoai, gioi_thieu, trang_thai FROM giao_vien WHERE ma_giao_vien = ?', [id]);
  return rows[0] || null;
}
async function listClasses(id) {
  const [rows] = await pool.execute(
    `SELECT l.*, k.ten_khoa_hoc, k.loai_khoa_hoc, p.ten_phong,
       (SELECT COUNT(*) FROM dang_ky_hoc dk WHERE dk.ma_lop_hoc=l.ma_lop_hoc AND dk.trang_thai='dang_hoc') AS si_so_hien_tai
     FROM lop_hoc l JOIN khoa_hoc k ON k.ma_khoa_hoc=l.ma_khoa_hoc
     LEFT JOIN phong_hoc p ON p.ma_phong=l.ma_phong
     WHERE l.ma_giao_vien=? ORDER BY l.ngay_bat_dau DESC`, [id]);
  for (const row of rows) {
    const [slots] = await pool.execute('SELECT * FROM khung_gio_hoc WHERE ma_lop_hoc=? ORDER BY thu_trong_tuan, gio_bat_dau', [row.ma_lop_hoc]);
    row.lich_hoc = slots;
  }
  return rows;
}
async function listStudents(teacherId, classId, date) {
  const [owned] = await pool.execute('SELECT ma_lop_hoc FROM lop_hoc WHERE ma_lop_hoc=? AND ma_giao_vien=?', [classId, teacherId]);
  if (!owned.length) return null;
  const [rows] = await pool.execute(
    `SELECT hv.ma_hoc_vien, hv.ho_ten, hv.email, hv.so_dien_thoai, dk.ma_dang_ky, dk.trang_thai AS trang_thai_dang_ky,
       dd.trang_thai AS trang_thai_diem_danh, dd.ghi_chu AS ghi_chu_diem_danh,
       (SELECT JSON_ARRAYAGG(JSON_OBJECT('ma_ket_qua', q.ma_ket_qua, 'ten_bai_kiem_tra', q.ten_bai_kiem_tra, 'diem_so', q.diem_so, 'diem_toi_da', q.diem_toi_da, 'ngay_cham', q.ngay_cham)) FROM ket_qua_hoc_tap q WHERE q.ma_dang_ky=dk.ma_dang_ky) AS ket_qua
     FROM dang_ky_hoc dk JOIN hoc_vien hv ON hv.ma_hoc_vien=dk.ma_hoc_vien
     LEFT JOIN diem_danh dd ON dd.ma_lop_hoc=dk.ma_lop_hoc AND dd.ma_hoc_vien=dk.ma_hoc_vien AND dd.ngay_hoc=?
     WHERE dk.ma_lop_hoc=? AND dk.trang_thai='dang_hoc' ORDER BY hv.ho_ten`, [date, classId]);
  return rows.map((row) => ({ ...row, ket_qua: typeof row.ket_qua === 'string' ? JSON.parse(row.ket_qua) : (row.ket_qua || []) }));
}
async function saveAttendance(teacherId, classId, date, records) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [owned] = await connection.execute('SELECT ma_lop_hoc FROM lop_hoc WHERE ma_lop_hoc=? AND ma_giao_vien=? FOR UPDATE', [classId, teacherId]);
    if (!owned.length) { const err = new Error('Class is not assigned to this teacher.'); err.status = 403; throw err; }
    for (const record of records) {
      const [enrolled] = await connection.execute("SELECT ma_dang_ky FROM dang_ky_hoc WHERE ma_lop_hoc=? AND ma_hoc_vien=? AND trang_thai='dang_hoc'", [classId, record.ma_hoc_vien]);
      if (!enrolled.length) { const err = new Error('Student is not enrolled in this class.'); err.status = 400; throw err; }
      await connection.execute(
        `INSERT INTO diem_danh (ma_lop_hoc,ma_hoc_vien,ma_giao_vien,ngay_hoc,trang_thai,ghi_chu) VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE ma_giao_vien=VALUES(ma_giao_vien),trang_thai=VALUES(trang_thai),ghi_chu=VALUES(ghi_chu)`,
        [classId, record.ma_hoc_vien, teacherId, date, record.trang_thai, record.ghi_chu || null]);
    }
    await connection.commit(); return { saved: records.length, ngay_hoc: date };
  } catch (err) { await connection.rollback(); throw err; } finally { connection.release(); }
}
async function addGrade(teacherId, classId, data) {
  const [rows] = await pool.execute('SELECT dk.ma_dang_ky FROM dang_ky_hoc dk JOIN lop_hoc l ON l.ma_lop_hoc=dk.ma_lop_hoc WHERE dk.ma_hoc_vien=? AND dk.ma_lop_hoc=? AND dk.trang_thai=\'dang_hoc\' AND l.ma_giao_vien=?', [data.ma_hoc_vien, classId, teacherId]);
  if (!rows.length) { const err = new Error('Student is not enrolled in a class assigned to this teacher.'); err.status = 403; throw err; }
  const [result] = await pool.execute('INSERT INTO ket_qua_hoc_tap (ma_dang_ky,ten_bai_kiem_tra,diem_so,diem_toi_da,ngay_cham,ma_giao_vien_cham,ghi_chu) VALUES (?,?,?,?,?,?,?)', [rows[0].ma_dang_ky, data.ten_bai_kiem_tra, data.diem_so, data.diem_toi_da || 10, data.ngay_cham || new Date().toISOString().slice(0,10), teacherId, data.ghi_chu || null]);
  const [grade] = await pool.execute('SELECT * FROM ket_qua_hoc_tap WHERE ma_ket_qua=?', [result.insertId]); return grade[0];
}
async function listAssignedCourses(teacherId) {
  const [rows] = await pool.execute('SELECT DISTINCT k.ma_khoa_hoc,k.ten_khoa_hoc,k.loai_khoa_hoc,k.trinh_do FROM lop_hoc l JOIN khoa_hoc k ON k.ma_khoa_hoc=l.ma_khoa_hoc WHERE l.ma_giao_vien=? ORDER BY k.ten_khoa_hoc', [teacherId]); return rows;
}
async function createClassRequest(teacherId, data) {
  const [course] = await pool.execute('SELECT 1 FROM lop_hoc WHERE ma_giao_vien=? AND ma_khoa_hoc=? LIMIT 1', [teacherId, data.ma_khoa_hoc]);
  if (!course.length) { const err = new Error('Course is not assigned to this teacher.'); err.status = 403; throw err; }
  if (data.ma_lop_hoc) {
    const [owned] = await pool.execute('SELECT ma_lop_hoc FROM lop_hoc WHERE ma_lop_hoc=? AND ma_giao_vien=? AND ma_khoa_hoc=?', [data.ma_lop_hoc, teacherId, data.ma_khoa_hoc]);
    if (!owned.length) { const err = new Error('Class is not assigned to this teacher.'); err.status = 403; throw err; }
  }
  const [result] = await pool.execute('INSERT INTO yeu_cau_lop_giao_vien (ma_giao_vien,loai_yeu_cau,ma_lop_hoc,ma_khoa_hoc,ma_code_lop,ma_phong,ngay_bat_dau,ngay_ket_thuc,lich_hoc,ly_do) VALUES (?,?,?,?,?,?,?,?,?,?)', [teacherId, data.loai_yeu_cau, data.ma_lop_hoc || null, data.ma_khoa_hoc, data.ma_code_lop || null, data.ma_phong || null, data.ngay_bat_dau || null, data.ngay_ket_thuc || null, JSON.stringify(data.lich_hoc), data.ly_do || null]);
  return getRequest(result.insertId);
}
async function getRequest(id) { const [rows] = await pool.execute('SELECT y.*,g.ho_ten AS ten_giao_vien,k.ten_khoa_hoc,l.ma_code_lop AS ma_code_lop_hien_tai,p.ten_phong FROM yeu_cau_lop_giao_vien y JOIN giao_vien g ON g.ma_giao_vien=y.ma_giao_vien JOIN khoa_hoc k ON k.ma_khoa_hoc=y.ma_khoa_hoc LEFT JOIN lop_hoc l ON l.ma_lop_hoc=y.ma_lop_hoc LEFT JOIN phong_hoc p ON p.ma_phong=y.ma_phong WHERE y.ma_yeu_cau=?',[id]); return rows[0] || null; }
async function listRequests(teacherId) { const sql='SELECT y.*,g.ho_ten AS ten_giao_vien,k.ten_khoa_hoc,l.ma_code_lop AS ma_code_lop_hien_tai,p.ten_phong FROM yeu_cau_lop_giao_vien y JOIN giao_vien g ON g.ma_giao_vien=y.ma_giao_vien JOIN khoa_hoc k ON k.ma_khoa_hoc=y.ma_khoa_hoc LEFT JOIN lop_hoc l ON l.ma_lop_hoc=y.ma_lop_hoc LEFT JOIN phong_hoc p ON p.ma_phong=y.ma_phong'; const [rows]= await pool.query(sql + (teacherId ? ' WHERE y.ma_giao_vien=?' : '') + ' ORDER BY y.ngay_tao DESC', teacherId ? [teacherId] : []); return rows; }
async function assertScheduleAvailable(connection, req, slots) {
  for (const slot of slots) {
    const [rows] = await connection.execute(
      `SELECT s.ma_lop_hoc,s.gio_bat_dau,s.gio_ket_thuc,l.ma_giao_vien,COALESCE(s.ma_phong,l.ma_phong) AS ma_phong
       FROM khung_gio_hoc s JOIN lop_hoc l ON l.ma_lop_hoc=s.ma_lop_hoc
       WHERE s.thu_trong_tuan=? AND l.trang_thai NOT IN ('huy','da_ket_thuc') AND l.ma_lop_hoc<>?`,
      [slot.thu_trong_tuan, req.ma_lop_hoc || 0]);
    const conflict = rows.find(row => slot.gio_bat_dau < row.gio_ket_thuc && slot.gio_ket_thuc > row.gio_bat_dau && (Number(row.ma_phong) === Number(req.ma_phong) || Number(row.ma_giao_vien) === Number(req.ma_giao_vien)));
    if (conflict) { const err = new Error('Requested time conflicts with another class room or teacher schedule.'); err.status = 409; throw err; }
  }
}
async function reviewRequest(id, approverId, approve, response) {
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows]=await connection.execute('SELECT * FROM yeu_cau_lop_giao_vien WHERE ma_yeu_cau=? FOR UPDATE',[id]); const req=rows[0];
    if (!req) { const err=new Error('Request not found.'); err.status=404; throw err; }
    if(req.trang_thai!=='cho_duyet') { const err=new Error('Request has already been reviewed.'); err.status=409; throw err; }
    if(approve) {
      const slots=typeof req.lich_hoc==='string'?JSON.parse(req.lich_hoc):req.lich_hoc;
      await assertScheduleAvailable(connection, req, slots);
      if(req.loai_yeu_cau==='mo_lop') {
        const [classes]=await connection.execute("SELECT COUNT(*) AS count FROM lop_hoc WHERE ma_code_lop=?",[req.ma_code_lop]);
        if(classes[0].count) { const err=new Error('Class code already exists.'); err.status=409; throw err; }
        const [created]=await connection.execute("INSERT INTO lop_hoc (ma_khoa_hoc,ma_code_lop,ma_giao_vien,ma_phong,si_so_toi_da,ngay_bat_dau,ngay_ket_thuc,trang_thai) VALUES (?,?,?, ?,20,?,?, 'dang_mo')",[req.ma_khoa_hoc,req.ma_code_lop,req.ma_giao_vien,req.ma_phong,req.ngay_bat_dau,req.ngay_ket_thuc]);
        for(const s of slots) await connection.execute('INSERT INTO khung_gio_hoc (ma_lop_hoc,thu_trong_tuan,gio_bat_dau,gio_ket_thuc,ma_phong) VALUES (?,?,?,?,?)',[created.insertId,s.thu_trong_tuan,s.gio_bat_dau,s.gio_ket_thuc,req.ma_phong]);
      } else {
        await connection.execute('UPDATE lop_hoc SET ma_phong=?, ngay_bat_dau=COALESCE(?,ngay_bat_dau), ngay_ket_thuc=COALESCE(?,ngay_ket_thuc) WHERE ma_lop_hoc=?',[req.ma_phong,req.ngay_bat_dau,req.ngay_ket_thuc,req.ma_lop_hoc]);
        await connection.execute('DELETE FROM khung_gio_hoc WHERE ma_lop_hoc=?',[req.ma_lop_hoc]);
        for(const s of slots) await connection.execute('INSERT INTO khung_gio_hoc (ma_lop_hoc,thu_trong_tuan,gio_bat_dau,gio_ket_thuc,ma_phong) VALUES (?,?,?,?,?)',[req.ma_lop_hoc,s.thu_trong_tuan,s.gio_bat_dau,s.gio_ket_thuc,req.ma_phong]);
      }
    }
    await connection.execute('UPDATE yeu_cau_lop_giao_vien SET trang_thai=?,phan_hoi=?,ma_nguoi_duyet=?,ngay_xu_ly=NOW() WHERE ma_yeu_cau=?',[approve?'da_duyet':'tu_choi',response||null,approverId||null,id]);
    await connection.commit(); return getRequest(id);
  } catch(err) { await connection.rollback(); throw err; } finally { connection.release(); }
}
module.exports={listTeachers,getProfile,listClasses,listStudents,saveAttendance,addGrade,listAssignedCourses,createClassRequest,listRequests,reviewRequest};
