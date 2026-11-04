import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Clock3, GraduationCap, RefreshCw, Users, Wallet } from 'lucide-react';
import { api } from './api';

const read = (result) => result.status === 'fulfilled' ? result.value?.data || [] : [];
const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

export default function DashboardPage({ navigate }) {
  const [data, setData] = useState({ students: [], teachers: [], courses: [], classes: [], rooms: [], waitlist: [], registrations: [], purchases: [], teacherRequests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const results = await Promise.allSettled([api.listStudents(), api.listTeachers(), api.listCourses(), api.listClasses(), api.listRooms(), api.listWaitlist(), api.listRegistrations(), api.listPurchaseRequests(), api.listTeacherClassRequests()]);
    setData({ students: read(results[0]), teachers: read(results[1]), courses: read(results[2]), classes: read(results[3]), rooms: read(results[4]), waitlist: read(results[5]), registrations: read(results[6]), purchases: read(results[7]), teacherRequests: read(results[8]) });
    const failed = results.find((item) => item.status === 'rejected');
    if (failed) setError(failed.reason?.message || 'Một số dữ liệu chưa tải được.');
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCourses = data.courses.filter((item) => item.trang_thai === 'dang_mo').length;
  const runningClasses = data.classes.filter((item) => ['dang_mo', 'dang_hoc'].includes(item.trang_thai));
  const activeStudents = data.students.filter((item) => item.trang_thai === 'dang_hoc').length;
  const seats = runningClasses.reduce((sum, item) => sum + Number(item.si_so_toi_da || 0), 0);
  const enrolled = runningClasses.reduce((sum, item) => sum + Number(item.si_so_hien_tai || 0), 0);
  const fillRate = seats ? Math.round(enrolled / seats * 100) : 0;
  const pendingPurchases = data.purchases.filter((item) => item.trang_thai === 'cho_xac_nhan');
  const pendingTeacherRequests = data.teacherRequests.filter((item) => item.trang_thai === 'cho_duyet');
  const pendingTotal = pendingPurchases.length + pendingTeacherRequests.length + data.waitlist.length;
  const upcoming = [...runningClasses].sort((a, b) => String(a.ngay_bat_dau || '').localeCompare(String(b.ngay_bat_dau || ''))).slice(0, 5);
  const courseBreakdown = useMemo(() => {
    const groups = new Map();
    runningClasses.forEach((item) => {
      const label = item.loai_khoa_hoc || item.ten_khoa_hoc || 'Khóa học khác';
      const group = groups.get(label) || { label, classes: 0, students: 0 };
      group.classes += 1; group.students += Number(item.si_so_hien_tai || 0); groups.set(label, group);
    });
    return [...groups.values()].sort((a, b) => b.students - a.students).slice(0, 5);
  }, [runningClasses]);
  const maxStudents = Math.max(1, ...courseBreakdown.map((item) => item.students));
  const queue = [
    ...pendingPurchases.map((item) => ({ id: `purchase-${item.ma_yeu_cau || item.ma_giao_dich}`, person: item.ten_hoc_vien || 'Học viên', detail: item.ten_khoa_hoc || item.ma_code_lop || 'Đăng ký khóa học', amount: money(item.so_tien || item.hoc_phi), kind: 'Thanh toán', icon: Wallet, tone: 'amber', target: 'transactions' })),
    ...pendingTeacherRequests.map((item) => ({ id: `teacher-${item.ma_yeu_cau}`, person: item.ten_giao_vien || 'Giáo viên', detail: item.ma_code_lop || item.ten_khoa_hoc || 'Yêu cầu mở lớp / đổi lịch', amount: 'Chờ duyệt', kind: 'Yêu cầu giáo viên', icon: GraduationCap, tone: 'violet', target: 'classes' })),
    ...data.waitlist.slice(0, 6).map((item) => ({ id: `wait-${item.ma_hoc_vien}-${item.ma_lop_hoc}`, person: item.ten_hoc_vien || 'Học viên', detail: item.ma_code_lop || item.ten_khoa_hoc || 'Chờ xếp lớp', amount: 'Chờ xếp lớp', kind: 'Danh sách chờ', icon: Users, tone: 'blue', target: 'registration' })),
  ].slice(0, 7);

  return <div className="dashboard-page">
    <div className="breadcrumb"><span>Tổng quan</span><span>›</span><strong>Dashboard &amp; Báo cáo</strong></div>
    <section className="dashboard-hero"><div><div className="dashboard-overline"><span className="live-dot"/> TỔNG QUAN VẬN HÀNH</div><h1>Tổng quan Vận hành &amp; Báo cáo</h1><p>Theo dõi nhanh tình hình học viên, lớp học và các yêu cầu đang chờ xử lý.</p></div><button className="button button-quiet dashboard-refresh" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/> Cập nhật dữ liệu</button></section>
    {error && <div className="alert alert-error">{error}</div>}
    <section className="dashboard-kpis">
      <Metric icon={Wallet} label="Ghi danh hiện tại" value={loading ? '—' : data.registrations.length} hint="Lượt đăng ký trong hệ thống" tone="blue" onClick={() => navigate('registration')} />
      <Metric icon={Users} label="Học viên đang học" value={loading ? '—' : activeStudents} hint={`${data.students.length} hồ sơ học viên`} tone="violet" onClick={() => navigate('students')} />
      <Metric icon={Activity} label="Tỷ lệ lấp đầy lớp" value={loading ? '—' : `${fillRate}%`} hint={`${enrolled} / ${seats} chỗ trong lớp đang mở`} tone="green" onClick={() => navigate('classes')} />
      <Metric icon={Clock3} label="Yêu cầu cần xử lý" value={loading ? '—' : pendingTotal} hint={`${pendingPurchases.length} giao dịch · ${pendingTeacherRequests.length} yêu cầu GV`} tone="red" onClick={() => navigate('transactions')} />
    </section>

    <section className="dashboard-insights">
      <article className="dashboard-panel dashboard-course-panel"><div className="dashboard-panel-heading"><div><span className="panel-kicker">PHÂN TÍCH LỚP HỌC</span><h2>Cơ cấu khóa học</h2><p>Học viên theo các lớp đang mở hoặc đang học</p></div><span className="dashboard-panel-icon"><BookOpen size={19}/></span></div>
        {courseBreakdown.length ? <div className="course-bars">{courseBreakdown.map((item, index) => <div className="course-bar-row" key={item.label}><div className="course-bar-label"><strong>{item.label}</strong><span>{item.students} học viên · {item.classes} lớp</span></div><div className="course-bar-track"><i className={`bar-tone-${index % 4}`} style={{ width: `${Math.max(5, item.students / maxStudents * 100)}%` }}/></div></div>)}</div> : <div className="dashboard-insight-empty">{loading ? 'Đang tải dữ liệu lớp học…' : 'Chưa có dữ liệu lớp đang mở để phân tích.'}</div>}
        <button className="dashboard-panel-link" onClick={() => navigate('courses')}>Quản lý khóa học <ArrowRight size={14}/></button>
      </article>
      <article className="dashboard-panel dashboard-occupancy-panel"><div className="dashboard-panel-heading"><div><span className="panel-kicker">SỨC CHỨA TRUNG TÂM</span><h2>Tình hình lớp học</h2><p>Tổng quan số chỗ và tình trạng tuyển sinh</p></div><span className="dashboard-panel-icon green"><CalendarDays size={19}/></span></div>
        <div className="occupancy-ring-wrap"><div className="occupancy-ring" style={{ '--fill': `${fillRate}%` }}><div><strong>{loading ? '—' : `${fillRate}%`}</strong><span>lấp đầy</span></div></div><div className="occupancy-legend"><div><i className="legend-blue"/><span>Đã ghi danh</span><b>{enrolled}</b></div><div><i className="legend-muted"/><span>Còn chỗ</span><b>{Math.max(0, seats - enrolled)}</b></div><div><i className="legend-violet"/><span>Lớp đang hoạt động</span><b>{runningClasses.length}</b></div><div><i className="legend-amber"/><span>Khóa học đang mở</span><b>{openCourses}</b></div></div></div>
        <button className="dashboard-panel-link" onClick={() => navigate('classes')}>Xem danh sách lớp <ArrowRight size={14}/></button>
      </article>
    </section>

    <section className="dashboard-queue-panel"><div className="dashboard-panel-heading queue-heading"><div><span className="panel-kicker">ƯU TIÊN VẬN HÀNH</span><h2>Hàng đợi cần xử lý</h2><p>Giao dịch học viên, yêu cầu giáo viên và danh sách chờ</p></div><span className="queue-count">{loading ? '—' : pendingTotal} đang chờ</span></div>
      {queue.length ? <div className="dashboard-queue-list">{queue.map((item) => { const Icon = item.icon; return <button className="dashboard-queue-row" key={item.id} onClick={() => navigate(item.target)}><span className={`queue-icon ${item.tone}`}><Icon size={17}/></span><span className="queue-person"><strong>{item.person}</strong><small>{item.kind}</small></span><span className="queue-detail">{item.detail}</span><b className="queue-amount">{item.amount}</b><ArrowRight size={15} className="queue-arrow"/></button>; })}</div> : <div className="dashboard-insight-empty">{loading ? 'Đang tải hàng đợi…' : 'Không có yêu cầu nào đang chờ xử lý.'}</div>}
    </section>

    <section className="dashboard-panel dashboard-classes-panel"><div className="dashboard-panel-heading"><div><span className="panel-kicker">LỊCH VẬN HÀNH</span><h2>Lớp học đang hoạt động</h2><p>{loading ? 'Đang tải dữ liệu…' : `${runningClasses.length} lớp đang mở hoặc đang học`}</p></div><button className="button button-quiet" onClick={() => navigate('classes')}>Quản lý lớp <ArrowRight size={14}/></button></div>
      {upcoming.length ? <div className="dashboard-class-list">{upcoming.map((item) => { const capacity = Number(item.si_so_toi_da || 0); const count = Number(item.si_so_hien_tai || 0); const percent = capacity ? Math.min(100, Math.round(count / capacity * 100)) : 0; return <article className="dashboard-class-row" key={item.ma_lop_hoc}><span className="dashboard-class-icon"><CalendarDays size={17}/></span><div className="dashboard-class-main"><div className="dashboard-class-title"><strong>{item.ma_code_lop}</strong><span>{item.trang_thai === 'dang_hoc' ? 'Đang học' : 'Đang mở'}</span></div><p>{item.ten_khoa_hoc || 'Khóa học'} · {item.ten_giao_vien || 'Chưa phân công giáo viên'}</p><div className="dashboard-capacity"><span><i style={{ width: `${percent}%` }}/></span><small>{count}/{capacity} học viên</small></div></div></article>; })}</div> : <div className="dashboard-insight-empty">{loading ? 'Đang tải danh sách lớp…' : 'Chưa có lớp học đang hoạt động.'}</div>}
    </section>
    <footer className="dashboard-footer">Số liệu được tổng hợp trực tiếp từ dữ liệu hiện có của trung tâm.</footer>
  </div>;
}

function Metric({ icon: Icon, label, value, hint, tone, onClick }) {
  return <button className="dashboard-kpi" onClick={onClick}><div className="kpi-top"><span>{label}</span><i className={`kpi-icon ${tone}`}><Icon size={19}/></i></div><strong className="kpi-value">{value}</strong><div className="kpi-bottom"><span>{hint}</span><span className="kpi-trend"><ArrowUpRight size={14}/></span></div></button>;
}
