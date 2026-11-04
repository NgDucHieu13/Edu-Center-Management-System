import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownToLine, BadgeCheck, BarChart3, BookOpen, Building2, CreditCard,
  CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, GraduationCap,
  LayoutDashboard, MoreHorizontal, Plus, Search, Settings, Shield, SlidersHorizontal,
  Sparkles, UserRound, UserRoundPlus, Users, X,
} from 'lucide-react';
import { api } from './api';
import CoursesPage from './CoursesPage';
import ClassesPage from './ClassesPage';
import RoomsPage from './RoomsPage';
import RegistrationPage from './RegistrationPage';
import SalesPage from './SalesPage';
import DashboardPage from './DashboardPage';
import FinancePage from './FinancePage';
import SettingsPage from './SettingsPage';

const DASHBOARD = 'dashboard';
const ACCOUNT = 'accounts';
const OPERATIONS = 'operations';
const COURSES = 'courses';
const CLASSES = 'classes';
const ROOMS = 'rooms';
const REGISTRATION = 'registration';
const SALES = 'sales';
const FINANCE = 'finance';
const SETTINGS = 'settings';
const SEARCH_ICONS = { accounts: Shield, teachers: GraduationCap, students: UserRound, courses: BookOpen, classes: CalendarDays, rooms: Building2 };
const normalizeSearch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
const ROLE_OPTIONS = [
  ['admin', 'Admin'], ['nhan_vien', 'Nhân viên'], ['giao_vien', 'Giáo viên'], ['hoc_vien', 'Học viên'],
];
const ACCOUNT_FORM = { ten_dang_nhap: '', ho_ten: '', mat_khau: '', email: '', so_dien_thoai: '', vai_tro: 'nhan_vien', trang_thai: 'hoat_dong' };
const TEACHER_FORM = { ho_ten: '', email: '', so_dien_thoai: '', chuyen_mon: '', gioi_thieu: '', trang_thai: 'dang_lam', ma_nguoi_dung: '' };
const STUDENT_FORM = { ho_ten: '', ngay_sinh: '', gioi_tinh: '', email: '', so_dien_thoai: '', dia_chi: '', trinh_do_hien_tai: '', muc_tieu_hoc_tap: '', trang_thai: 'tiem_nang', ma_nguoi_dung: '' };

const roleName = (role) => ROLE_OPTIONS.find(([value]) => value === role)?.[1] || role || '—';
const accountStatus = (status) => status === 'hoat_dong' ? 'Hoạt động' : status === 'khoa' ? 'Đã khóa' : status;
const teacherStatus = (status) => status === 'dang_lam' ? 'Đang làm việc' : 'Nghỉ việc';
const studentStatus = (status) => ({ tiem_nang: 'Tiềm năng', dang_hoc: 'Đang học', tam_nghi: 'Tạm nghỉ', hoan_thanh: 'Hoàn thành', da_nghi: 'Đã nghỉ' })[status] || status;
const statusOf = (record, kind) => kind === ACCOUNT ? record.trang_thai === 'hoat_dong' : kind === 'teachers' ? record.trang_thai === 'dang_lam' : ['dang_hoc', 'tiem_nang'].includes(record.trang_thai);
const statusText = (record, kind) => kind === ACCOUNT ? accountStatus(record.trang_thai) : kind === 'teachers' ? teacherStatus(record.trang_thai) : studentStatus(record.trang_thai);
const recordId = (record, kind) => kind === ACCOUNT ? record.ma_nguoi_dung : kind === 'teachers' ? record.ma_giao_vien : record.ma_hoc_vien;
const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((part) => part[0] || '').join('').toUpperCase() || 'EC';

function Avatar({ name, large = false }) { return <span className={`avatar ${large ? 'avatar-large' : ''}`}>{initials(name)}</span>; }

function StatCard({ icon: Icon, title, value, caption, tone = 'blue' }) {
  return <article className="stat-card"><div className="stat-heading"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={17} /></span></div><div className="stat-number">{value}</div><div className="stat-caption">{caption}</div></article>;
}

function App() {
  const [section, setSection] = useState(DASHBOARD);
  const [operationTab, setOperationTab] = useState('teachers');
  const kind = section === ACCOUNT ? ACCOUNT : section === OPERATIONS ? operationTab : null;
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [studentDetailTab, setStudentDetailTab] = useState('profile');
  const [studentHistory, setStudentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(ACCOUNT_FORM);
  const [saving, setSaving] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalOpen, setGlobalOpen] = useState(false);
  const [globalIndex, setGlobalIndex] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(() => window.localStorage.getItem('ecms.branchId') || '');
  const globalInput = useRef(null);
  const globalLoadStarted = useRef(false);

  useEffect(() => {
    api.getSystemSettings().then((response) => {
      const rows = response.data?.branches || [];
      setBranches(rows);
      const current = rows.find((item) => String(item.ma_co_so) === branchId && item.trang_thai === 'hoat_dong');
      const first = rows.find((item) => item.trang_thai === 'hoat_dong');
      if (!current && first) { setBranchId(String(first.ma_co_so)); window.localStorage.setItem('ecms.branchId', String(first.ma_co_so)); }
    }).catch(() => {});
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = kind === ACCOUNT ? await api.listUsers() : kind === 'teachers' ? await api.listTeachers() : await api.listStudents();
      const rows = response.data || [];
      setRecords(rows);
      setSelected((current) => rows.find((row) => recordId(row, kind) === recordId(current || {}, kind)) || rows[0] || null);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu. Hãy kiểm tra backend và MySQL.');
      setRecords([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => { if ([ACCOUNT, 'teachers', 'students'].includes(kind)) fetchRecords(); }, [fetchRecords, kind]);

  useEffect(() => { setStudentDetailTab('profile'); setStudentHistory([]); setHistoryError(''); }, [selected?.ma_hoc_vien]);
  useEffect(() => {
    if (kind !== 'students' || !selected || studentDetailTab === 'profile') { setStudentHistory([]); setHistoryError(''); return undefined; }
    let active = true; setHistoryLoading(true); setHistoryError('');
    const load = studentDetailTab === 'learning' ? api.getStudentLearningHistory : api.getStudentPaymentHistory;
    load(selected.ma_hoc_vien).then((r) => { if (active) setStudentHistory(r.data || []); }).catch((e) => { if (active) { setStudentHistory([]); setHistoryError(e.message || 'Kh?ng t?i ???c l?ch s?.'); } }).finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [kind, selected?.ma_hoc_vien, studentDetailTab]);

  useEffect(() => {
    if (kind !== 'teachers' || !selected) { setAssignedClasses([]); return undefined; }
    let active = true;
    api.getTeacherClasses(selected.ma_giao_vien)
      .then((response) => { if (active) setAssignedClasses(response.data || []); })
      .catch(() => { if (active) setAssignedClasses([]); });
    return () => { active = false; };
  }, [kind, selected]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const roles = useMemo(() => [...new Set(records.map((row) => row.vai_tro).filter(Boolean))], [records]);
  const specialties = useMemo(() => [...new Set(records.map((row) => row.chuyen_mon).filter(Boolean))], [records]);
  const filtered = useMemo(() => records.filter((row) => {
    const query = search.trim().toLocaleLowerCase('vi');
    const searchable = kind === ACCOUNT
      ? [row.ten_dang_nhap, row.ho_ten, row.email, row.so_dien_thoai]
      : kind === 'teachers' ? [row.ho_ten, row.email, row.so_dien_thoai, row.chuyen_mon]
        : [row.ho_ten, row.email, row.so_dien_thoai, row.trinh_do_hien_tai, row.muc_tieu_hoc_tap];
    const matchSearch = !query || searchable.some((value) => String(value || '').toLocaleLowerCase('vi').includes(query));
    const matchStatus = statusFilter === 'all' || row.trang_thai === statusFilter;
    const matchRole = roleFilter === 'all' || row.vai_tro === roleFilter || row.chuyen_mon === roleFilter;
    return matchSearch && matchStatus && matchRole;
  }), [records, search, statusFilter, roleFilter, kind]);

  const activeCount = records.filter((row) => statusOf(row, kind)).length;
  const admins = records.filter((row) => row.vai_tro === 'admin').length;
  const staffCount = records.filter((row) => row.vai_tro === 'nhan_vien').length;

  function resetFilters() { setSearch(''); setStatusFilter('all'); setRoleFilter('all'); }
  function switchSection(next) { setSection(next); setModuleSearch(''); setGlobalOpen(false); resetFilters(); setError(''); }

  const loadGlobalIndex = useCallback(async () => {
    if (globalLoadStarted.current) return;
    globalLoadStarted.current = true; setGlobalLoading(true); setGlobalError('');
    const results = await Promise.allSettled([api.listUsers(), api.listTeachers(), api.listStudents(), api.listCourses(), api.listClasses(), api.listRooms()]);
    const rows = results.map((item) => item.status === 'fulfilled' ? item.value?.data || [] : []);
    const entries = [
      ...rows[0].map((row) => ({ type: 'accounts', label: 'Tài khoản', title: row.ho_ten || row.ten_dang_nhap, subtitle: `@${row.ten_dang_nhap || ''} · ${roleName(row.vai_tro)}`, row })),
      ...rows[1].map((row) => ({ type: 'teachers', label: 'Giáo viên', title: row.ho_ten, subtitle: `${row.chuyen_mon || 'Chưa cập nhật chuyên môn'} · GV-${row.ma_giao_vien}`, row })),
      ...rows[2].map((row) => ({ type: 'students', label: 'Học viên', title: row.ho_ten, subtitle: `${row.email || row.so_dien_thoai || 'Chưa có liên hệ'} · HV-${row.ma_hoc_vien}`, row })),
      ...rows[3].map((row) => ({ type: 'courses', label: 'Khóa học', title: row.ten_khoa_hoc, subtitle: `${row.ma_code_khoa_hoc || ''} · ${row.loai_khoa_hoc || ''} · ${row.trinh_do || ''}`, row })),
      ...rows[4].map((row) => ({ type: 'classes', label: 'Lớp học', title: row.ma_code_lop, subtitle: `${row.ten_khoa_hoc || ''} · ${row.ten_giao_vien || 'Chưa phân công giáo viên'}`, row })),
      ...rows[5].map((row) => ({ type: 'rooms', label: 'Phòng học', title: row.ten_phong, subtitle: `ROOM-${String(row.ma_phong).padStart(3, '0')} · Sức chứa ${row.suc_chua || 0}`, row })),
    ];
    setGlobalIndex(entries);
    if (results.every((item) => item.status === 'rejected')) { globalLoadStarted.current = false; setGlobalError('Không tải được dữ liệu tìm kiếm. Hãy kiểm tra kết nối backend.'); }
    setGlobalLoading(false);
  }, []);

  const globalResults = useMemo(() => {
    const query = normalizeSearch(globalQuery);
    if (query.length < 2 || !globalIndex) return [];
    return globalIndex.filter((item) => normalizeSearch(`${item.title} ${item.subtitle} ${item.label}`).includes(query)).slice(0, 8);
  }, [globalIndex, globalQuery]);

  function openGlobalResult(result) {
    setGlobalOpen(false); setGlobalQuery(''); setGlobalError(''); resetFilters();
    if (['accounts', 'teachers', 'students'].includes(result.type)) {
      if (result.type === 'accounts') setSection(ACCOUNT);
      else { setSection(OPERATIONS); setOperationTab(result.type); }
      setSelected(result.row); setModuleSearch('');
      return;
    }
    const route = { courses: COURSES, classes: CLASSES, rooms: ROOMS }[result.type];
    if (route) { setModuleSearch(result.title || ''); setSection(route); }
  }

  function navigateDashboard(destination) {
    if (destination === 'teachers' || destination === 'students') {
      setOperationTab(destination); switchSection(OPERATIONS);
    } else {
      const route = { classes: CLASSES, courses: COURSES, transactions: SALES, registration: REGISTRATION, rooms: ROOMS, finance: FINANCE }[destination];
      if (route) switchSection(route);
    }
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); globalInput.current?.focus(); setGlobalOpen(true); loadGlobalIndex(); }
      if (event.key === 'Escape') setGlobalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loadGlobalIndex]);
  function openCreate() {
    setEditing(null);
    setForm(kind === ACCOUNT ? ACCOUNT_FORM : kind === 'teachers' ? TEACHER_FORM : STUDENT_FORM);
    setFormOpen(true);
  }
  function openEdit(row) {
    setEditing(row);
    setForm(kind === ACCOUNT ? { ...ACCOUNT_FORM, ...row, mat_khau: '' }
      : kind === 'teachers' ? { ...TEACHER_FORM, ...row, ma_nguoi_dung: row.ma_nguoi_dung || '' }
        : { ...STUDENT_FORM, ...row, ngay_sinh: row.ngay_sinh ? String(row.ngay_sinh).slice(0, 10) : '', ma_nguoi_dung: row.ma_nguoi_dung || '' });
    setFormOpen(true);
  }

  async function saveRecord(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      let body;
      if (kind === ACCOUNT) {
        body = { ...form, ten_dang_nhap: form.ten_dang_nhap.trim(), ho_ten: form.ho_ten.trim(), email: form.email.trim() || null, so_dien_thoai: form.so_dien_thoai.trim() || null };
        if (!body.mat_khau) delete body.mat_khau;
      } else if (kind === 'teachers') {
        body = { ...form, ho_ten: form.ho_ten.trim(), email: form.email.trim() || null, so_dien_thoai: form.so_dien_thoai.trim() || null, chuyen_mon: form.chuyen_mon.trim() || null, gioi_thieu: form.gioi_thieu.trim() || null, ma_nguoi_dung: form.ma_nguoi_dung ? Number(form.ma_nguoi_dung) : null };
      } else {
        body = { ...form, ho_ten: form.ho_ten.trim(), ngay_sinh: form.ngay_sinh || null, gioi_tinh: form.gioi_tinh || null, email: form.email.trim() || null, so_dien_thoai: form.so_dien_thoai.trim() || null, ma_nguoi_dung: form.ma_nguoi_dung ? Number(form.ma_nguoi_dung) : null };
      }

      let response;
      if (kind === ACCOUNT) response = editing ? await api.updateUser(editing.ma_nguoi_dung, body) : await api.createUser(body);
      else if (kind === 'teachers') response = editing ? await api.updateTeacher(editing.ma_giao_vien, body) : await api.createTeacher(body);
      else response = editing ? await api.updateStudent(editing.ma_hoc_vien, body) : await api.createStudent(body);

      setFormOpen(false);
      setNotice(editing ? 'Đã cập nhật thông tin.' : 'Đã tạo mới thành công.');
      await fetchRecords();
      if (response?.data) setSelected(response.data);
    } catch (err) {
      setError(err.message || 'Không thể lưu thông tin.');
    } finally { setSaving(false); }
  }

  async function removeRecord(row) {
    const name = kind === ACCOUNT ? row.ten_dang_nhap : row.ho_ten;
    const action = kind === ACCOUNT ? 'khóa tài khoản' : kind === 'students' ? 'cho học viên nghỉ' : 'xóa hồ sơ';
    if (!window.confirm(`Bạn có chắc muốn ${action} “${name}”?`)) return;
    try {
      if (kind === ACCOUNT) await api.lockUser(row.ma_nguoi_dung);
      else if (kind === 'teachers') await api.deleteTeacher(row.ma_giao_vien);
      else await api.deleteStudent(row.ma_hoc_vien);
      setSelected(null);
      setNotice(kind === ACCOUNT ? 'Đã khóa tài khoản.' : 'Đã cập nhật hồ sơ.');
      await fetchRecords();
    } catch (err) { setError(err.message || 'Không thể thực hiện thao tác.'); }
  }

  const title = kind === ACCOUNT ? 'Tài khoản & Phân quyền' : kind === 'teachers' ? 'Quản lý Giáo viên' : 'Quản lý Học viên';
  const singular = kind === ACCOUNT ? 'tài khoản' : kind === 'teachers' ? 'giáo viên' : 'học viên';
  const idField = kind === ACCOUNT ? 'ma_nguoi_dung' : kind === 'teachers' ? 'ma_giao_vien' : 'ma_hoc_vien';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-logo" src="/ecms-logo.svg" alt="Education tech" /><div><strong>ECMS Pro</strong><span>Education Admin</span></div></div>
        <nav className="side-nav">
          <p className="nav-label">Tổng quan</p><button className={`nav-button ${section === DASHBOARD ? 'active' : ''}`} onClick={() => switchSection(DASHBOARD)}><LayoutDashboard size={18} /><span>Dashboard &amp; Báo cáo</span></button>
          <p className="nav-label">Quản trị viên</p><button className={`nav-button ${section === ACCOUNT ? 'active' : ''}`} onClick={() => switchSection(ACCOUNT)}><Shield size={18} /><span>Tài khoản &amp; Phân quyền</span></button>
          <p className="nav-label">Nh&#226;n vi&#234;n v&#7853;n h&#224;nh</p><button className={`nav-button ${section === OPERATIONS && operationTab === 'teachers' ? 'active' : ''}`} onClick={() => { switchSection(OPERATIONS); setOperationTab('teachers'); }}><GraduationCap size={18} /><span>Gi&#225;o vi&#234;n</span></button><button className={`nav-button ${section === OPERATIONS && operationTab === 'students' ? 'active' : ''}`} onClick={() => { switchSection(OPERATIONS); setOperationTab('students'); }}><UserRound size={18} /><span>H&#7885;c vi&#234;n</span></button><div className="nav-divider" aria-hidden="true" /><button className={`nav-button ${section === CLASSES ? 'active' : ''}`} onClick={() => switchSection(CLASSES)}><CalendarDays size={18} /><span>Qu&#7843;n l&#253; L&#7899;p h&#7885;c</span></button><button className={`nav-button ${section === ROOMS ? 'active' : ''}`} onClick={() => switchSection(ROOMS)}><Building2 size={18} /><span>Qu&#7843;n l&#253; Ph&#242;ng h&#7885;c</span></button><button className={`nav-button ${section === REGISTRATION ? 'active' : ''}`} onClick={() => switchSection(REGISTRATION)}><BadgeCheck size={18} /><span>&#272;&#259;ng k&#253; &amp; X&#7871;p l&#7899;p</span></button><div className="nav-divider" aria-hidden="true" /><button className={`nav-button ${section === COURSES ? 'active' : ''}`} onClick={() => switchSection(COURSES)}><BookOpen size={18} /><span>Qu&#7843;n l&#253; Kh&#243;a h&#7885;c</span></button><button className={`nav-button ${section === SALES ? 'active' : ''}`} onClick={() => switchSection(SALES)}><CreditCard size={18} /><span>Qu&#7843;n l&#253; giao d&#7883;ch</span></button>
          <p className="nav-label">Báo cáo &amp; hệ thống</p><button className={`nav-button ${section === FINANCE ? 'active' : ''}`} onClick={() => switchSection(FINANCE)}><BarChart3 size={18} /><span>Báo cáo tài chính</span></button><button className={`nav-button ${section === SETTINGS ? 'active' : ''}`} onClick={() => switchSection(SETTINGS)}><Settings size={18} /><span>Cài đặt hệ thống</span></button>
        </nav>
        <div className="term-card"><div><Sparkles size={16} /><strong>Học kỳ hiện tại</strong></div><span className="live-dot">Đang hoạt động</span></div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className={`global-search-wrap ${globalOpen ? 'open' : ''}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setGlobalOpen(false); }}>
            <div className="global-search"><Search size={17} /><input ref={globalInput} aria-label="Tìm kiếm" value={globalQuery} onChange={(event) => { setGlobalQuery(event.target.value); setGlobalOpen(true); if (!globalIndex) loadGlobalIndex(); }} onFocus={() => { setGlobalOpen(true); if (!globalIndex) loadGlobalIndex(); }} placeholder="Tìm tài khoản, học viên, khóa học..." /><kbd>Ctrl K</kbd></div>
            {globalOpen && <div className="global-search-dropdown" role="listbox">
              {globalLoading && <div className="global-search-message">Đang tải dữ liệu tìm kiếm...</div>}
              {!globalLoading && globalError && <div className="global-search-message search-error">{globalError}<button onClick={loadGlobalIndex}>Thử lại</button></div>}
              {!globalLoading && !globalError && globalQuery.trim().length < 2 && <div className="global-search-message">Nhập ít nhất 2 ký tự để tìm.</div>}
              {!globalLoading && !globalError && globalQuery.trim().length >= 2 && !globalResults.length && <div className="global-search-message">Không tìm thấy kết quả phù hợp.</div>}
              {globalResults.map((result, index) => { const Icon = SEARCH_ICONS[result.type] || Search; const id = result.row.ma_nguoi_dung || result.row.ma_giao_vien || result.row.ma_hoc_vien || result.row.ma_khoa_hoc || result.row.ma_lop_hoc || result.row.ma_phong; return <button className="global-search-result" key={`${result.type}-${id}-${index}`} onClick={() => openGlobalResult(result)} role="option"><span className="global-result-icon"><Icon size={16}/></span><span className="global-result-copy"><strong>{result.title || 'Chưa có tên'}</strong><small>{result.subtitle}</small></span><span className="global-result-type">{result.label}</span></button>; })}
              {globalResults.length > 0 && <div className="global-search-footer">Hiển thị tối đa 8 kết quả phù hợp</div>}
            </div>}
          </div>
          <div className="branch-select"><Building2 size={16} /><select aria-label="Chọn cơ sở" value={branchId} onChange={(event) => { setBranchId(event.target.value); window.localStorage.setItem('ecms.branchId', event.target.value); }}><option value="">Cơ sở chưa cấu hình</option>{branches.filter((item) => item.trang_thai === 'hoat_dong').map((item) => <option key={item.ma_co_so} value={item.ma_co_so}>{item.ten_co_so}{item.dia_chi ? ` · ${item.dia_chi}` : ''}</option>)}</select><ChevronDown size={15} /></div>
          <div className="top-actions">{![DASHBOARD, FINANCE, SETTINGS, COURSES, SALES, CLASSES, ROOMS, REGISTRATION].includes(section) && <button className="button button-primary top-add" onClick={openCreate}><Plus size={17} /> Thêm mới</button>}<div className="profile-chip"><Avatar name="Quản trị viên" /><span><b>Quản trị viên</b><small>ECMS Pro</small></span></div></div>
        </header>

        <main className="main-content">
          {section === DASHBOARD ? <DashboardPage navigate={navigateDashboard} /> : section === FINANCE ? <FinancePage /> : section === SETTINGS ? <SettingsPage /> : section === COURSES ? <CoursesPage initialSearch={moduleSearch} /> : section === SALES ? <SalesPage /> : section === CLASSES ? <ClassesPage initialSearch={moduleSearch} /> : section === ROOMS ? <RoomsPage initialSearch={moduleSearch} /> : section === REGISTRATION ? <RegistrationPage /> : <>
          <div className="breadcrumb"><span>Nhân sự &amp; hệ thống</span><ChevronRight size={14} /><strong>{title}</strong></div>
          <section className="page-heading"><div><p className="eyebrow">{section === ACCOUNT ? 'Quản trị hệ thống' : 'Nhân viên vận hành'}</p><h1>{title}</h1><p className="subheading">{section === ACCOUNT ? 'Tạo tài khoản, quản lý trạng thái và phân quyền truy cập.' : 'Quản lý hồ sơ nhân sự vận hành của trung tâm.'}</p></div><div className="heading-actions"><button className="button button-soft" onClick={() => window.print()}><ArrowDownToLine size={16} /> Xuất danh sách</button><button className="button button-primary" onClick={openCreate}><UserRoundPlus size={17} /> Thêm {singular}</button></div></section>

          <div className="module-tabs" role="tablist" aria-label="Nhóm quản lý">
            <button className={section === ACCOUNT ? 'selected' : ''} onClick={() => switchSection(ACCOUNT)}><Shield size={16} /> Tài khoản &amp; phân quyền</button>
            <button className={section === OPERATIONS ? 'selected' : ''} onClick={() => switchSection(OPERATIONS)}><Users size={16} /> Nhân viên vận hành</button>
          </div>
          {section === OPERATIONS && <div className="sub-tabs" role="tablist" aria-label="Nhân viên vận hành"><button className={operationTab === 'teachers' ? 'selected' : ''} onClick={() => { setOperationTab('teachers'); resetFilters(); }}><GraduationCap size={15} /> Giáo viên</button><button className={operationTab === 'students' ? 'selected' : ''} onClick={() => { setOperationTab('students'); resetFilters(); }}><UserRound size={15} /> Học viên</button></div>}

          <section className="stats-grid">
            {kind === ACCOUNT ? <>
              <StatCard icon={Users} title="Tổng tài khoản" value={records.length} caption="Tài khoản trong hệ thống" />
              <StatCard icon={BadgeCheck} title="Đang hoạt động" value={activeCount} caption="Có thể đăng nhập" tone="green" />
              <StatCard icon={Shield} title="Quản trị viên" value={admins} caption="Role admin" tone="violet" />
              <StatCard icon={Activity} title="Nhân viên" value={staffCount} caption="Role nhan_vien" tone="amber" />
            </> : <>
              <StatCard icon={kind === 'teachers' ? GraduationCap : UserRound} title={`Tổng ${singular}`} value={records.length} caption="Hồ sơ trong hệ thống" />
              <StatCard icon={BadgeCheck} title="Đang hoạt động" value={activeCount} caption="Theo trạng thái hiện tại" tone="green" />
              <StatCard icon={kind === 'teachers' ? BookOpen : Sparkles} title={kind === 'teachers' ? 'Chuyên môn' : 'Trạng thái tiềm năng'} value={kind === 'teachers' ? specialties.length : records.filter((row) => row.trang_thai === 'tiem_nang').length} caption={kind === 'teachers' ? 'Nhóm chuyên môn' : 'Học viên mới quan tâm'} tone="violet" />
              <StatCard icon={CalendarDays} title={kind === 'teachers' ? 'Lớp đang dạy' : 'Đang học'} value={kind === 'teachers' ? assignedClasses.length : records.filter((row) => row.trang_thai === 'dang_hoc').length} caption={kind === 'teachers' && selected ? selected.ho_ten : 'Theo hồ sơ học viên'} tone="amber" />
            </>}
          </section>

          <section className="filter-bar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={kind === ACCOUNT ? 'Tìm tên, username, email...' : 'Tìm theo tên, email, số điện thoại...'} /></label>
            <label className="select-field"><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option>{kind === ACCOUNT ? <><option value="hoat_dong">Hoạt động</option><option value="khoa">Đã khóa</option></> : kind === 'teachers' ? <><option value="dang_lam">Đang làm việc</option><option value="nghi_viec">Nghỉ việc</option></> : <><option value="tiem_nang">Tiềm năng</option><option value="dang_hoc">Đang học</option><option value="tam_nghi">Tạm nghỉ</option><option value="hoan_thanh">Hoàn thành</option><option value="da_nghi">Đã nghỉ</option></>}</select><ChevronDown size={15} /></label>
            {kind === ACCOUNT ? <label className="select-field"><span>Vai trò</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Tất cả vai trò</option>{roles.map((role) => <option key={role} value={role}>{roleName(role)}</option>)}</select><ChevronDown size={15} /></label> : kind === 'teachers' ? <label className="select-field"><span>Chuyên môn</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Tất cả chuyên môn</option>{specialties.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={15} /></label> : null}
            <button className="button button-quiet" onClick={resetFilters}><SlidersHorizontal size={16} /> Đặt lại</button>
          </section>

          {error && <div className="alert alert-error"><AlertCircle size={18} /><span>{error}</span><button className="icon-button" onClick={() => setError('')} aria-label="Đóng"><X size={16} /></button></div>}
          {notice && <div className="alert alert-success"><Check size={17} /><span>{notice}</span></div>}

          <section className={`directory-layout ${selected ? '' : 'no-detail'}`}>
            <div className="table-card">
              <div className="table-topline"><div><h2>{kind === ACCOUNT ? 'Tài khoản hệ thống' : kind === 'teachers' ? 'Danh sách giáo viên' : 'Danh sách học viên'}</h2><p>{filtered.length} hồ sơ phù hợp</p></div><button className="icon-button" onClick={fetchRecords} aria-label="Tải lại"><Activity size={17} /></button></div>
              <div className="table-scroll"><table><thead><tr>{kind === ACCOUNT ? <><th>Tài khoản</th><th>Thông tin người dùng</th><th>Vai trò</th><th>Trạng thái</th><th className="align-right">Thao tác</th></> : kind === 'teachers' ? <><th>Giáo viên</th><th>Chuyên môn</th><th>Liên hệ</th><th>Trạng thái</th><th className="align-right">Thao tác</th></> : <><th>Học viên</th><th>Trình độ / Mục tiêu</th><th>Liên hệ</th><th>Trạng thái</th><th className="align-right">Thao tác</th></>}</tr></thead>
                <tbody>{loading ? <tr><td className="table-message" colSpan="5">Đang tải dữ liệu...</td></tr> : filtered.length === 0 ? <tr><td className="table-message" colSpan="5">{records.length ? 'Không có kết quả phù hợp.' : 'Chưa có dữ liệu. Hãy thêm hồ sơ đầu tiên.'}</td></tr> : filtered.map((row) => <tr key={recordId(row, kind)} className={recordId(selected || {}, kind) === recordId(row, kind) ? 'row-selected' : ''} onClick={() => setSelected(row)}>
                  {kind === ACCOUNT ? <><td><div className="person-cell"><Avatar name={row.ho_ten} /><div><strong>{row.ten_dang_nhap}</strong><small>UID-{String(row.ma_nguoi_dung).padStart(4, '0')}</small></div></div></td><td><div className="contact-cell"><span>{row.ho_ten}</span><small>{row.email || row.so_dien_thoai || 'Chưa có liên hệ'}</small></div></td><td><span className="specialty-pill">{roleName(row.vai_tro)}</span></td></> : kind === 'teachers' ? <><td><div className="person-cell"><Avatar name={row.ho_ten} /><div><strong>{row.ho_ten}</strong><small>GV-{String(row.ma_giao_vien).padStart(4, '0')}</small></div></div></td><td><span className="specialty-pill">{row.chuyen_mon || 'Chưa cập nhật'}</span></td><td><div className="contact-cell"><span>{row.email || '—'}</span><small>{row.so_dien_thoai || 'Chưa có số điện thoại'}</small></div></td></> : <><td><div className="person-cell"><Avatar name={row.ho_ten} /><div><strong>{row.ho_ten}</strong><small>HV-{String(row.ma_hoc_vien).padStart(4, '0')}</small></div></div></td><td><div className="contact-cell"><span>{row.trinh_do_hien_tai || 'Chưa xếp trình độ'}</span><small>{row.muc_tieu_hoc_tap || 'Chưa cập nhật mục tiêu'}</small></div></td><td><div className="contact-cell"><span>{row.email || '—'}</span><small>{row.so_dien_thoai || 'Chưa có số điện thoại'}</small></div></td></>}
                  <td><span className={`status-pill ${statusOf(row, kind) ? 'status-active' : 'status-inactive'}`}><i />{statusText(row, kind)}</span></td><td className="align-right"><button className="icon-button row-menu" onClick={(event) => { event.stopPropagation(); openEdit(row); }} aria-label="Sửa"><MoreHorizontal size={19} /></button></td>
                </tr>)}</tbody>
              </table></div>
              <footer className="table-footer"><span>Hiển thị <b>{filtered.length ? 1 : 0}–{filtered.length}</b> trong <b>{records.length}</b> {singular}</span><span className="page-controls"><button disabled><ChevronLeft size={16} /></button><b>1</b><button disabled><ChevronRight size={16} /></button></span></footer>
            </div>

            {selected && <aside className="detail-card"><div className="detail-header"><div><UserRound size={18} /><strong>{kind === ACCOUNT ? 'Chi tiết tài khoản' : kind === 'teachers' ? 'Hồ sơ giáo viên' : 'Hồ sơ học viên'}</strong></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Đóng"><X size={18} /></button></div>
              <div className="detail-body"><div className="teacher-identity"><Avatar name={kind === ACCOUNT ? selected.ho_ten : selected.ho_ten} large /><h2>{selected.ho_ten}</h2><p>{kind === ACCOUNT ? `@${selected.ten_dang_nhap}` : kind === 'teachers' ? selected.chuyen_mon || 'Chưa cập nhật chuyên môn' : selected.muc_tieu_hoc_tap || 'Học viên'}</p><span className={`status-pill ${statusOf(selected, kind) ? 'status-active' : 'status-inactive'}`}><i />{statusText(selected, kind)}</span></div>
                <div className="contact-panel"><div><small>Email</small><strong>{selected.email || 'Chưa cập nhật'}</strong></div><div><small>Điện thoại</small><strong>{selected.so_dien_thoai || 'Chưa cập nhật'}</strong></div></div>
                {kind === ACCOUNT ? <div className="detail-section"><div className="section-title"><Shield size={16} /><strong>Quyền truy cập</strong></div><div className="account-row"><span>Vai trò</span><b>{roleName(selected.vai_tro)}</b></div><div className="account-row"><span>Mã tài khoản</span><b>{selected.ma_nguoi_dung}</b></div><div className="account-row"><span>Ngày tạo</span><b>{selected.ngay_tao ? new Date(selected.ngay_tao).toLocaleDateString('vi-VN') : '—'}</b></div></div> : kind === 'teachers' ? <div className="detail-section"><div className="section-title"><CalendarDays size={16} /><strong>Lớp được phân công</strong><span>{assignedClasses.length}</span></div>{assignedClasses.length ? assignedClasses.map((course) => <div className="class-item" key={course.ma_lop_hoc}><div><strong>{course.ten_khoa_hoc || 'Khóa học'}</strong><small>{course.ma_code_lop} · {course.phong_hoc || 'Chưa có phòng'}</small></div><span>{course.si_so_hien_tai}/{course.si_so_toi_da}</span></div>) : <div className="empty-classes">Chưa có lớp được phân công.</div>}</div> : <div className="student-details"><div className="student-detail-tabs" role="tablist" aria-label="Student information"><button className={studentDetailTab === 'profile' ? 'selected' : ''} onClick={() => setStudentDetailTab('profile')}>H&#7891; s&#417;</button><button className={studentDetailTab === 'learning' ? 'selected' : ''} onClick={() => setStudentDetailTab('learning')}>L&#7883;ch s&#7917; h&#7885;c t&#7853;p</button><button className={studentDetailTab === 'payments' ? 'selected' : ''} onClick={() => setStudentDetailTab('payments')}>L&#7883;ch s&#7917; thanh to&#225;n</button></div>
{studentDetailTab === 'profile' ? <div className="detail-section"><div className="section-title"><GraduationCap size={16} /><strong>H&#7891; s&#417; h&#7885;c vi&#234;n</strong></div><div className="account-row"><span>Ng&#224;y sinh</span><b>{selected.ngay_sinh ? new Date(selected.ngay_sinh).toLocaleDateString('vi-VN') : '&mdash;'}</b></div><div className="account-row"><span>Gi&#7899;i t&#237;nh</span><b>{selected.gioi_tinh || '&mdash;'}</b></div><div className="account-row"><span>Tr&#236;nh &#273;&#7897;</span><b>{selected.trinh_do_hien_tai || '&mdash;'}</b></div><div className="account-row"><span>M&#7909;c ti&#234;u</span><b>{selected.muc_tieu_hoc_tap || '&mdash;'}</b></div><div className="account-row"><span>Tr&#7841;ng th&#225;i</span><b>{studentStatus(selected.trang_thai)}</b></div><div className="account-row"><span>&#272;&#7883;a ch&#7881;</span><b>{selected.dia_chi || '&mdash;'}</b></div></div> : <div className="detail-section"><div className="section-title"><GraduationCap size={16} /><strong>{studentDetailTab === 'learning' ? 'L&#7883;ch s&#7917; h&#7885;c t&#7853;p' : 'L&#7883;ch s&#7917; thanh to&#225;n'}</strong><span>{studentHistory.length}</span></div>
{historyLoading ? <div className="empty-classes">Loading history...</div> : historyError ? <div className="empty-classes">{historyError}</div> : !studentHistory.length ? <div className="empty-classes">Ch&#432;a c&#243; d&#7919; li&#7879;u l&#7883;ch s&#7917;.</div> : studentDetailTab === 'learning' ? studentHistory.map((item, index) => <article className="history-item" key={item.ma_ket_qua || item.ma_dang_ky || index}><strong>{item.ten_khoa_hoc || 'Kh&#243;a h&#7885;c'} &middot; {item.ma_code_lop || 'Ch&#432;a x&#7871;p l&#7899;p'}</strong><small>{item.loai_khoa_hoc || ''}{item.trinh_do ? ' &middot; ' + item.trinh_do : ''}</small><small>&#272;&#259;ng k&#253;: {item.ngay_dang_ky ? new Date(item.ngay_dang_ky).toLocaleDateString('vi-VN') : '&mdash;'} &middot; {item.trang_thai_dang_ky || '&mdash;'}</small>{item.ten_bai_kiem_tra && <small>{item.ten_bai_kiem_tra}: {item.diem_so ?? '&mdash;'}/{item.diem_toi_da ?? '&mdash;'}</small>}</article>) : studentHistory.map((item, index) => <article className="history-item" key={item.ma_thanh_toan || item.ma_hoa_don || index}><strong>{item.ma_code_hoa_don || ('H&#243;a &#273;&#417;n #' + item.ma_hoa_don)}</strong><small>T&#7893;ng: {Number(item.tong_tien || 0).toLocaleString('vi-VN')}&#8363; &middot; C&#242;n n&#7907;: {Number(item.so_tien_con_no || 0).toLocaleString('vi-VN')}&#8363;</small><small>Thanh to&#225;n: {item.so_tien == null ? 'Ch&#432;a thanh to&#225;n' : Number(item.so_tien).toLocaleString('vi-VN') + ' VND'} {item.phuong_thuc ? ' &middot; ' + item.phuong_thuc : ''}</small><small>{item.ngay_thanhtoan ? new Date(item.ngay_thanhtoan).toLocaleDateString('vi-VN') : 'Ch&#432;a c&#243; giao d&#7883;ch'} &middot; {item.trang_thai_hoa_don || '&mdash;'}</small></article>)}</div>}</div>}
              </div><div className="detail-actions"><button className="button button-primary" onClick={() => openEdit(selected)}>Chỉnh sửa</button><button className="button button-danger-quiet" onClick={() => removeRecord(selected)}>{kind === ACCOUNT ? 'Khóa tài khoản' : kind === 'students' ? 'Cho nghỉ' : 'Xóa hồ sơ'}</button></div>
            </aside>}
          </section>
          <footer className="app-footer">ECMS Pro <span>·</span> Hệ thống quản lý trung tâm tiếng Anh</footer>
          </>}
        </main>
      </div>

      {formOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="record-form-title"><div className="modal-heading"><div><span className="modal-icon"><UserRoundPlus size={19} /></span><div><h2 id="record-form-title">{editing ? 'Cập nhật' : 'Thêm'} {singular}</h2><p>Thông tin được lưu trực tiếp vào cơ sở dữ liệu.</p></div></div><button className="icon-button" onClick={() => setFormOpen(false)} aria-label="Đóng"><X size={18} /></button></div>
        <form onSubmit={saveRecord}><div className="form-grid">
          {kind === ACCOUNT ? <>
            <label className="form-field"><span>Tên đăng nhập <b>*</b></span><input required maxLength="100" value={form.ten_dang_nhap} onChange={(e) => setForm({ ...form, ten_dang_nhap: e.target.value })} /></label>
            <label className="form-field"><span>Họ và tên <b>*</b></span><input required maxLength="255" value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} /></label>
            <label className="form-field"><span>{editing ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu *'}</span><input type="password" required={!editing} minLength="8" autoComplete="new-password" value={form.mat_khau} onChange={(e) => setForm({ ...form, mat_khau: e.target.value })} /></label>
            <label className="form-field"><span>Vai trò</span><select value={form.vai_tro} onChange={(e) => setForm({ ...form, vai_tro: e.target.value })}>{ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="form-field"><span>Email</span><input type="email" maxLength="255" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="form-field"><span>Số điện thoại</span><input maxLength="20" value={form.so_dien_thoai || ''} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} /></label>
            <label className="form-field"><span>Trạng thái</span><select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}><option value="hoat_dong">Hoạt động</option><option value="khoa">Đã khóa</option></select></label>
          </> : kind === 'teachers' ? <>
            <label className="form-field"><span>Họ và tên <b>*</b></span><input required maxLength="255" value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} /></label>
            <label className="form-field"><span>Chuyên môn</span><input maxLength="255" placeholder="IELTS, TOEIC, Giao tiếp..." value={form.chuyen_mon} onChange={(e) => setForm({ ...form, chuyen_mon: e.target.value })} /></label>
            <label className="form-field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="form-field"><span>Số điện thoại</span><input value={form.so_dien_thoai} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} /></label>
            <label className="form-field"><span>Mã tài khoản liên kết</span><input type="number" min="1" value={form.ma_nguoi_dung} onChange={(e) => setForm({ ...form, ma_nguoi_dung: e.target.value })} /></label>
            <label className="form-field"><span>Trạng thái</span><select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}><option value="dang_lam">Đang làm việc</option><option value="nghi_viec">Nghỉ việc</option></select></label>
          </> : <>
            <label className="form-field"><span>Họ và tên <b>*</b></span><input required maxLength="255" value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} /></label>
            <label className="form-field"><span>Ngày sinh</span><input type="date" value={form.ngay_sinh || ''} onChange={(e) => setForm({ ...form, ngay_sinh: e.target.value })} /></label>
            <label className="form-field"><span>Giới tính</span><select value={form.gioi_tinh || ''} onChange={(e) => setForm({ ...form, gioi_tinh: e.target.value || null })}><option value="">Chưa cập nhật</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></label>
            <label className="form-field"><span>Trạng thái</span><select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}><option value="tiem_nang">Tiềm năng</option><option value="dang_hoc">Đang học</option><option value="tam_nghi">Tạm nghỉ</option><option value="hoan_thanh">Hoàn thành</option><option value="da_nghi">Đã nghỉ</option></select></label>
            <label className="form-field"><span>Email</span><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="form-field"><span>Số điện thoại</span><input value={form.so_dien_thoai || ''} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} /></label>
            <label className="form-field"><span>Trình độ hiện tại</span><input value={form.trinh_do_hien_tai || ''} onChange={(e) => setForm({ ...form, trinh_do_hien_tai: e.target.value })} placeholder="A2, IELTS 5.0..." /></label>
            <label className="form-field"><span>Mục tiêu học tập</span><input value={form.muc_tieu_hoc_tap || ''} onChange={(e) => setForm({ ...form, muc_tieu_hoc_tap: e.target.value })} placeholder="Giao tiếp, IELTS..." /></label>
            <label className="form-field"><span>Mã tài khoản liên kết</span><input type="number" min="1" value={form.ma_nguoi_dung || ''} onChange={(e) => setForm({ ...form, ma_nguoi_dung: e.target.value })} /></label>
            <label className="form-field"><span>Địa chỉ</span><input value={form.dia_chi || ''} onChange={(e) => setForm({ ...form, dia_chi: e.target.value })} /></label>
          </>}
        </div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Hủy</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo mới'}</button></div></form>
      </section></div>}
    </div>
  );
}

export default App;
