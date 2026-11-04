import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, BookOpen, CalendarDays, CreditCard, GraduationCap, Receipt, Users } from 'lucide-react';
import { api } from './api';

const dayName = (value) => ({ Thu2: 'Th\u1ee9 2', Thu3: 'Th\u1ee9 3', Thu4: 'Th\u1ee9 4', Thu5: 'Th\u1ee9 5', Thu6: 'Th\u1ee9 6', Thu7: 'Th\u1ee9 7', ChuNhat: 'Ch\u1ee7 nh\u1eadt' })[value] || value;
const methodName = (value) => ({ chuyen_khoan: 'Chuyển khoản', the_ngan_hang: 'Thẻ ngân hàng', vi_dieu_tu: 'Ví điện tử' })[value] || value || '—';

export default function SalesPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [classId, setClassId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('chuyen_khoan');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [studentResult, courseResult, classResult, requestResult] = await Promise.all([
        api.listStudents(), api.listCourses(), api.listClasses(), api.listPurchaseRequests(),
      ]);
      const studentRows = studentResult.data || [];
      const courseRows = (courseResult.data || []).filter((item) => item.trang_thai === 'dang_mo');
      setStudents(studentRows); setCourses(courseRows); setClasses(classResult.data || []);
      setPurchaseRequests((requestResult.data || []).filter((item) => item.trang_thai === 'cho_xac_nhan'));
      setStudentId((current) => studentRows.some((item) => String(item.ma_hoc_vien) === current) ? current : String(studentRows[0]?.ma_hoc_vien || ''));
      setCourseId((current) => courseRows.some((item) => String(item.ma_khoa_hoc) === current) ? current : String(courseRows[0]?.ma_khoa_hoc || ''));
    } catch (err) { setError(err.message || 'Không tải được dữ liệu bán khóa học.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  useEffect(() => {
    if (!studentId) { setPayments([]); return undefined; }
    let active = true;
    api.getStudentPaymentHistory(studentId).then((result) => { if (active) setPayments(result.data || []); })
      .catch((err) => { if (active) setError(err.message || 'Không tải được lịch sử thanh toán.'); });
    return () => { active = false; };
  }, [studentId]);

  const selectedStudent = students.find((item) => String(item.ma_hoc_vien) === studentId);
  const selectedCourse = courses.find((item) => String(item.ma_khoa_hoc) === courseId);
  const availableClasses = useMemo(() => classes.filter((item) =>
    String(item.ma_khoa_hoc) === courseId
    && ['dang_mo', 'dang_hoc'].includes(item.trang_thai)
    && Number(item.si_so_hien_tai || 0) < Number(item.si_so_toi_da || 0)), [classes, courseId]);
  const selectedClass = availableClasses.find((item) => String(item.ma_lop_hoc) === classId);
  const openClasses = classes.filter((item) => ['dang_mo', 'dang_hoc'].includes(item.trang_thai) && Number(item.si_so_hien_tai || 0) < Number(item.si_so_toi_da || 0)).length;

  async function submit(event) {
    event.preventDefault(); if (!studentId || !courseId || !classId) return;
    setSaving(true); setError(''); setNotice(null);
    try {
      const result = await api.sellCourse({ ma_hoc_vien: Number(studentId), ma_khoa_hoc: Number(courseId), ma_lop_hoc: Number(classId), phuong_thuc: paymentMethod });
      setNotice(result.data);
      setClassId('');
      await loadCatalog();
      const history = await api.getStudentPaymentHistory(studentId);
      setPayments(history.data || []);
    } catch (err) { setError(err.message || 'Không thể hoàn tất giao dịch.'); }
    finally { setSaving(false); }
  }

  async function reviewRequest(request, action) {
    setSaving(true); setError(''); setNotice(null);
    try {
      const result = await api.reviewPurchaseRequest(request.ma_yeu_cau, action);
      if (action === 'approve') setNotice(result.data);
      await loadCatalog();
      if (studentId) {
        const history = await api.getStudentPaymentHistory(studentId);
        setPayments(history.data || []);
      }
    } catch (err) { setError(err.message || 'Không thể xử lý yêu cầu đăng ký.'); }
    finally { setSaving(false); }
  }

  return <>
    <div className="breadcrumb"><span>Nhân viên vận hành</span><span>›</span><strong>Quản lý giao dịch</strong></div>
    <section className="page-heading"><div><p className="eyebrow">Theo dõi và xác nhận thanh toán khóa học</p><h1>Quản lý giao dịch</h1><p className="subheading">Xử lý yêu cầu đăng ký từ học viên, tạo giao dịch tại quầy và tra cứu hóa đơn.</p></div><div className="heading-actions"><button className="button button-quiet" onClick={loadCatalog}>Tải lại</button></div></section>
    <section className="stats-grid sales-stats"><Stat icon={BookOpen} title="Khóa đang mở" value={courses.length} caption="Sẵn sàng tư vấn"/><Stat icon={CalendarDays} title="Lớp còn chỗ" value={openClasses} caption="Theo sỉ số hiện tại" tone="green"/><Stat icon={Users} title="Hồ sơ học viên" value={students.length} caption="Có thể tạo giao dịch" tone="violet"/><Stat icon={Receipt} title="Giao dịch của học viên" value={payments.length} caption={selectedStudent?.ho_ten || 'Chọn học viên'} tone="amber"/></section>
    {error && <div className="alert alert-error">{error}</div>}
    {notice && <div className="alert alert-success"><BadgeCheck size={17}/><span>Đã ghi nhận đăng ký {notice.ten_khoa_hoc}, hóa đơn <b>{notice.ma_code_hoa_don}</b> với số tiền {Number(notice.tong_tien || 0).toLocaleString('vi-VN')}₫.</span></div>}
    <section className="table-card sales-requests-card"><div className="table-topline"><div><h2>Yêu cầu đăng ký chờ xác nhận <span className="sales-request-count">{purchaseRequests.length}</span></h2><p>Học viên đã gửi thông tin đăng ký và phương thức thanh toán từ ứng dụng.</p></div><button className="button button-quiet" onClick={loadCatalog}>Tải lại</button></div><div className="table-scroll"><table><thead><tr><th>Học viên</th><th>Khóa học / Lớp</th><th>Số tiền</th><th>Phương thức</th><th>Ngày gửi</th><th>Xử lý</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="table-message">Đang tải...</td></tr> : !purchaseRequests.length ? <tr><td colSpan="6" className="table-message">Hiện không có yêu cầu nào chờ xác nhận.</td></tr> : purchaseRequests.map((request) => <tr key={request.ma_yeu_cau}><td><strong>{request.ten_hoc_vien}</strong></td><td><strong>{request.ten_khoa_hoc}</strong><small className="table-secondary">{request.ma_code_lop}</small></td><td><strong>{Number(request.so_tien || 0).toLocaleString('vi-VN')}₫</strong></td><td>{methodName(request.phuong_thuc)}</td><td>{request.ngay_tao ? new Date(request.ngay_tao).toLocaleString('vi-VN') : '—'}</td><td><div className="sales-review-actions"><button className="button button-primary" disabled={saving} onClick={() => reviewRequest(request, 'approve')}>Xác nhận</button><button className="button button-danger-quiet" disabled={saving} onClick={() => reviewRequest(request, 'reject')}>Từ chối</button></div></td></tr>)}</tbody></table></div></section>
    <div className="sales-layout">
      <section className="table-card registration-form-card"><div className="table-topline"><div><h2>Tạo giao dịch tại quầy</h2><p>Hệ thống kiểm tra sĩ số và trùng lịch khi ghi nhận</p></div><span className="stat-icon"><CreditCard size={17}/></span></div>
        <form className="registration-form" onSubmit={submit}>
          <label className="form-field"><span>Học viên <b>*</b></span><select required value={studentId} onChange={(e)=>setStudentId(e.target.value)}><option value="">Chọn học viên</option>{students.map((item)=><option key={item.ma_hoc_vien} value={item.ma_hoc_vien}>{item.ho_ten} · HV-{item.ma_hoc_vien}</option>)}</select></label>
          <label className="form-field"><span>Khóa học <b>*</b></span><select required value={courseId} onChange={(e)=>{setCourseId(e.target.value);setClassId('');}}><option value="">Chọn khóa học</option>{courses.map((item)=><option key={item.ma_khoa_hoc} value={item.ma_khoa_hoc}>{item.ten_khoa_hoc} · {item.trinh_do || item.loai_khoa_hoc}</option>)}</select></label>
          {selectedCourse && <div className="sales-course-summary"><div><BookOpen size={16}/><span><strong>{selectedCourse.ten_khoa_hoc}</strong><small>{selectedCourse.loai_khoa_hoc} · {selectedCourse.trinh_do || 'Mọi trình độ'}</small></span></div><b>{Number(selectedCourse.hoc_phi || 0).toLocaleString('vi-VN')}₫</b><p>{selectedCourse.mo_ta || 'Ch\u01b0\u01a1ng tr\u00ecnh ti\u1ebfng Anh t\u1ea1i trung t\u00e2m.'}</p></div>}
          <label className="form-field"><span>Lớp còn chỗ <b>*</b></span><select required value={classId} onChange={(e)=>setClassId(e.target.value)} disabled={!courseId}><option value="">{availableClasses.length?'Chọn lớp':'Không có lớp phù hợp còn chỗ'}</option>{availableClasses.map((item)=><option key={item.ma_lop_hoc} value={item.ma_lop_hoc}>{item.ma_code_lop} · {item.ten_giao_vien || 'Chưa phân công'} · {item.ten_phong || item.phong_hoc || 'Chưa có phòng'} · {item.si_so_hien_tai}/{item.si_so_toi_da}</option>)}</select></label>
          {selectedClass && <div className="registration-class-info"><div><CalendarDays size={16}/><span><strong>{selectedClass.ma_code_lop} · {selectedClass.ten_khoa_hoc}</strong><small>{selectedClass.lich_hoc?.length ? selectedClass.lich_hoc.map((slot)=>`${dayName(slot.thu_trong_tuan)} ${String(slot.gio_bat_dau).slice(0,5)}-${String(slot.gio_ket_thuc).slice(0,5)}`).join(', ') : 'Chưa xếp lịch'}</small></span></div><div><GraduationCap size={16}/><span><strong>{selectedClass.ten_giao_vien || 'Chưa phân công giáo viên'}</strong><small>{selectedClass.si_so_hien_tai}/{selectedClass.si_so_toi_da} học viên đã ghi danh</small></span></div></div>}
          <fieldset className="payment-options"><legend>Phương thức thanh toán</legend>{[['chuyen_khoan','Chuyển khoản'],['the_ngan_hang','Thẻ ngân hàng'],['vi_dieu_tu','Ví điện tử']].map(([value,label])=><label key={value} className={paymentMethod===value?'payment-option selected':'payment-option'}><input type="radio" name="payment" value={value} checked={paymentMethod===value} onChange={()=>setPaymentMethod(value)}/>{label}</label>)}</fieldset>
          <div className="sales-total"><span>Tổng thanh toán</span><strong>{selectedCourse ? Number(selectedCourse.hoc_phi).toLocaleString('vi-VN') : '0'}₫</strong></div>
          <p className="sales-demo-note">Giao dịch hiện được ghi nhận theo luồng thanh toán demo; chưa kết nối cổng thanh toán thật.</p>
          <button className="button button-primary" disabled={loading||saving||!studentId||!courseId||!classId}>{saving?'Đang xử lý...':`Ghi nhận giao dịch${selectedCourse?` · ${Number(selectedCourse.hoc_phi).toLocaleString('vi-VN')}₫`:''}`}</button>
        </form>
      </section>
      <section className="table-card"><div className="table-topline"><div><h2>Lịch sử hóa đơn</h2><p>{selectedStudent ? `Hồ sơ ${selectedStudent.ho_ten}` : 'Chọn học viên để xem giao dịch'}</p></div><span className="stat-icon amber"><Receipt size={17}/></span></div><div className="table-scroll"><table><thead><tr><th>Mã hóa đơn</th><th>Số tiền</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead><tbody>{loading?<tr><td colSpan="4" className="table-message">Đang tải...</td></tr>:!payments.length?<tr><td colSpan="4" className="table-message">Chưa có hóa đơn cho hồ sơ này.</td></tr>:payments.map((item,index)=><tr key={`${item.ma_hoa_don}-${item.ma_thanh_toan||index}`}><td><strong>{item.ma_code_hoa_don||`HD-${item.ma_hoa_don}`}</strong><small className="table-secondary">{item.loai_hoa_don==='hoc_phi'?'Học phí':'Hóa đơn'}</small></td><td><strong>{Number(item.so_tien ?? item.tong_tien ?? 0).toLocaleString('vi-VN')}₫</strong></td><td>{methodName(item.phuong_thuc)}<small className="table-secondary">{item.ngay_thanhtoan?new Date(item.ngay_thanhtoan).toLocaleDateString('vi-VN'):'—'}</small></td><td><span className="status-pill status-active"><i/>{item.trang_thai_hoa_don||'Chưa rõ'}</span></td></tr>)}</tbody></table></div></section>
    </div>
  </>;
}
function Stat({icon:Icon,title,value,caption,tone=''}) { return <article className="stat-card"><div className="stat-heading"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={17}/></span></div><div className="stat-number">{value}</div><div className="stat-caption">{caption}</div></article>; }
