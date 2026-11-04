import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, CircleDollarSign, Clock3, GraduationCap, Plus, Search, X } from 'lucide-react';
import { api } from './api';

const EMPTY = { ma_code_khoa_hoc: '', ten_khoa_hoc: '', loai_khoa_hoc: 'ielts', trinh_do: '', hoc_phi: '', thoi_luong_tuan: '', tong_so_buoi: '', mo_ta: '', trang_thai: 'dang_mo' };
const TYPES = [['ielts', 'IELTS'], ['toeic', 'TOEIC'], ['giao_tiep', 'Giao ti\u1ebfp'], ['kids', 'Ti\u1ebfng Anh tr\u1ebb em'], ['business', 'Business']];
const typeName = (value) => TYPES.find(([key]) => key === value)?.[1] || value || '\u2014';

export default function CoursesPage({ initialSearch = '' }) {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCourses = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await api.listCourses();
      const rows = result.data || [];
      setCourses(rows);
      setSelected((current) => rows.find((row) => row.ma_khoa_hoc === current?.ma_khoa_hoc) || rows[0] || null);
    } catch (err) { setError(err.message || 'Unable to load courses.'); setCourses([]); setSelected(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (initialSearch) setSearch(initialSearch); }, [initialSearch]);

  const filtered = useMemo(() => courses.filter((course) => {
    const q = search.trim().toLocaleLowerCase('vi');
    return (!q || [course.ma_code_khoa_hoc, course.ten_khoa_hoc, course.loai_khoa_hoc, course.trinh_do].some((value) => String(value || '').toLocaleLowerCase('vi').includes(q))) && (status === 'all' || course.trang_thai === status);
  }), [courses, search, status]);

  function openForm(course = null) {
    setEditing(course);
    setForm(course ? { ...EMPTY, ...course } : EMPTY);
    setError(''); setModal(true);
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError('');
    const body = { ...form, ma_code_khoa_hoc: form.ma_code_khoa_hoc.trim(), ten_khoa_hoc: form.ten_khoa_hoc.trim(), trinh_do: form.trinh_do.trim() || null, hoc_phi: Number(form.hoc_phi), thoi_luong_tuan: Number(form.thoi_luong_tuan), tong_so_buoi: Number(form.tong_so_buoi), mo_ta: form.mo_ta.trim() || null };
    try {
      const result = editing ? await api.updateCourse(editing.ma_khoa_hoc, body) : await api.createCourse(body);
      setModal(false); setNotice(editing ? 'Updated course.' : 'Course added.');
      await loadCourses(); if (result?.data) setSelected(result.data);
    } catch (err) { setError(err.message || 'Could not save course.'); }
    finally { setSaving(false); }
  }

  async function remove(course) {
    if (!window.confirm(`Delete course "${course.ten_khoa_hoc}"?`)) return;
    try { await api.deleteCourse(course.ma_khoa_hoc); setSelected(null); setNotice('Course deleted.'); await loadCourses(); }
    catch (err) { setError(err.message || 'Could not delete this course.'); }
  }

  const activeCount = courses.filter((course) => course.trang_thai === 'dang_mo').length;
  const revenue = courses.reduce((sum, course) => sum + Number(course.hoc_phi || 0), 0);

  return <>
    <div className="breadcrumb"><span>Qu&#7843;n l&#253; kinh doanh</span><span>&rsaquo;</span><strong>Kh&#243;a h&#7885;c</strong></div>
    <section className="page-heading"><div><p className="eyebrow">S&#7843;n ph&#7849;m &#273;&#224;o t&#7841;o</p><h1>Qu&#7843;n l&#253; Kh&#243;a h&#7885;c</h1><p className="subheading">Qu&#7843;n l&#253; danh m&#7909;c v&#224; h&#7885;c ph&#237; c&#225;c kh&#243;a h&#7885;c &#273;ang b&#225;n t&#7841;i trung t&#226;m.</p></div><div className="heading-actions"><button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Th&#234;m kh&#243;a h&#7885;c</button></div></section>
    <section className="stats-grid course-stats"><article className="stat-card"><div className="stat-heading"><span>T&#7893;ng kh&#243;a h&#7885;c</span><span className="stat-icon"><BookOpen size={17} /></span></div><div className="stat-number">{courses.length}</div><div className="stat-caption">Danh m&#7909;c s&#7843;n ph&#7849;m</div></article><article className="stat-card"><div className="stat-heading"><span>Kh&#243;a &#273;ang m&#7903;</span><span className="stat-icon green"><Check size={17} /></span></div><div className="stat-number">{activeCount}</div><div className="stat-caption">C&#243; th&#7875; t&#432; v&#7845;n v&#224; &#273;&#259;ng k&#253;</div></article><article className="stat-card"><div className="stat-heading"><span>H&#7885;c ph&#237; trung b&#236;nh</span><span className="stat-icon violet"><CircleDollarSign size={17} /></span></div><div className="stat-number">{courses.length ? Math.round(revenue / courses.length).toLocaleString('vi-VN') : 0}<small>₫</small></div><div className="stat-caption">Gi&#225; ni&#234;m y&#7871;t m&#7895;i kh&#243;a</div></article><article className="stat-card"><div className="stat-heading"><span>Nh&#243;m kh&#243;a h&#7885;c</span><span className="stat-icon amber"><GraduationCap size={17} /></span></div><div className="stat-number">{new Set(courses.map((course) => course.loai_khoa_hoc)).size}</div><div className="stat-caption">IELTS, TOEIC, giao ti&#7871;p...</div></article></section>
    <section className="filter-bar"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="T&#236;m t&#234;n kh&#243;a, m&#227; kh&#243;a, tr&#236;nh &#273;&#7897;..." /></label><label className="select-field"><span>Tr&#7841;ng th&#225;i</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">T&#7845;t c&#7843;</option><option value="dang_mo">&#272;ang m&#7903;</option><option value="ngung_mo">Ng&#7915;ng m&#7903;</option></select></label></section>
    {error && <div className="alert alert-error">{error}<button className="icon-button" onClick={() => setError('')}><X size={16} /></button></div>}{notice && <div className="alert alert-success">{notice}</div>}
    <section className={`directory-layout ${selected ? '' : 'no-detail'}`}><div className="table-card"><div className="table-topline"><div><h2>Danh m&#7909;c kh&#243;a h&#7885;c</h2><p>{filtered.length} kh&#243;a h&#7885;c</p></div><button className="icon-button" onClick={loadCourses}><Clock3 size={17} /></button></div><div className="table-scroll"><table><thead><tr><th>Kh&#243;a h&#7885;c</th><th>Ph&#226;n lo&#7841;i</th><th>Th&#7901;i l&#432;&#7907;ng</th><th>H&#7885;c ph&#237;</th><th>Tr&#7841;ng th&#225;i</th><th className="align-right">S&#7917;a</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="table-message">&#272;ang t&#7843;i...</td></tr> : filtered.length === 0 ? <tr><td colSpan="6" className="table-message">Ch&#432;a c&#243; kh&#243;a h&#7885;c ph&#249; h&#7907;p.</td></tr> : filtered.map((course) => <tr key={course.ma_khoa_hoc} className={selected?.ma_khoa_hoc === course.ma_khoa_hoc ? 'row-selected' : ''} onClick={() => setSelected(course)}><td><div className="person-cell"><span className="course-avatar"><BookOpen size={16} /></span><div><strong>{course.ten_khoa_hoc}</strong><small>{course.ma_code_khoa_hoc} · {course.trinh_do || 'M&#7885;i tr&#236;nh &#273;&#7897;'}</small></div></div></td><td><span className="specialty-pill">{typeName(course.loai_khoa_hoc)}</span></td><td>{course.thoi_luong_tuan} tu&#7847;n · {course.tong_so_buoi} bu&#7893;i</td><td><strong>{Number(course.hoc_phi).toLocaleString('vi-VN')}₫</strong></td><td><span className={`status-pill ${course.trang_thai === 'dang_mo' ? 'status-active' : 'status-inactive'}`}><i />{course.trang_thai === 'dang_mo' ? '\u0110ang m\u1edf' : 'Ng\u1eebng m\u1edf'}</span></td><td className="align-right"><button className="icon-button" onClick={(e) => { e.stopPropagation(); openForm(course); }}>S&#7917;a</button></td></tr>)}</tbody></table></div><footer className="table-footer">Hi&#7875;n th&#7883; {filtered.length} / {courses.length} kh&#243;a h&#7885;c</footer></div>
    {selected && <aside className="detail-card course-detail"><div className="detail-header"><div><BookOpen size={18} /><strong>Chi ti&#7871;t kh&#243;a h&#7885;c</strong></div><button className="icon-button" onClick={() => setSelected(null)}><X size={18} /></button></div><div className="detail-body"><div className="course-cover"><BookOpen size={28} /><span>{typeName(selected.loai_khoa_hoc)}</span></div><div className="teacher-identity"><h2>{selected.ten_khoa_hoc}</h2><p>{selected.ma_code_khoa_hoc} · {selected.trinh_do || 'M&#7885;i tr&#236;nh &#273;&#7897;'}</p><span className={`status-pill ${selected.trang_thai === 'dang_mo' ? 'status-active' : 'status-inactive'}`}><i />{selected.trang_thai === 'dang_mo' ? '\u0110ang m\u1edf' : 'Ng\u1eebng m\u1edf'}</span></div><div className="course-price">{Number(selected.hoc_phi).toLocaleString('vi-VN')}<small>₫</small><span>H&#7885;c ph&#237; tr&#7885;n kh&#243;a</span></div><div className="account-row"><span>Th&#7901;i l&#432;&#7907;ng</span><b>{selected.thoi_luong_tuan} tu&#7847;n</b></div><div className="account-row"><span>T&#7893;ng s&#7889; bu&#7893;i</span><b>{selected.tong_so_buoi} bu&#7893;i</b></div><div className="course-description">{selected.mo_ta || 'Ch&#432;a c&#243; m&#244; t&#7843; kh&#243;a h&#7885;c.'}</div></div><div className="detail-actions"><button className="button button-primary" onClick={() => openForm(selected)}>Ch&#7881;nh s&#7917;a</button><button className="button button-danger-quiet" onClick={() => remove(selected)}>X&#243;a</button></div></aside>}</section>
    {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(false); }}><section className="modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><span className="modal-icon"><BookOpen size={19} /></span><div><h2>{editing ? 'C&#7853;p nh&#7853;t kh&#243;a h&#7885;c' : 'Th&#234;m kh&#243;a h&#7885;c m&#7899;i'}</h2><p>Kh&#243;a h&#7885;c l&#224; s&#7843;n ph&#7849;m b&#225;n v&#224; &#273;&#259;ng k&#253; cho h&#7885;c vi&#234;n.</p></div></div><button className="icon-button" onClick={() => setModal(false)}><X size={18} /></button></div><form onSubmit={save}><div className="form-grid">
      <label className="form-field"><span>M&#227; kh&#243;a h&#7885;c <b>*</b></span><input required maxLength="50" value={form.ma_code_khoa_hoc} onChange={(e) => setForm({ ...form, ma_code_khoa_hoc: e.target.value })} /></label><label className="form-field"><span>T&#234;n kh&#243;a h&#7885;c <b>*</b></span><input required maxLength="255" value={form.ten_khoa_hoc} onChange={(e) => setForm({ ...form, ten_khoa_hoc: e.target.value })} /></label>
      <label className="form-field"><span>Lo&#7841;i kh&#243;a h&#7885;c <b>*</b></span><select value={form.loai_khoa_hoc} onChange={(e) => setForm({ ...form, loai_khoa_hoc: e.target.value })}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="form-field"><span>Tr&#236;nh &#273;&#7897;</span><input value={form.trinh_do || ''} onChange={(e) => setForm({ ...form, trinh_do: e.target.value })} placeholder="Beginner, A1, IELTS 5.0..." /></label>
      <label className="form-field"><span>H&#7885;c ph&#237; (VND) <b>*</b></span><input required type="number" min="1" step="1000" value={form.hoc_phi} onChange={(e) => setForm({ ...form, hoc_phi: e.target.value })} /></label><label className="form-field"><span>Th&#7901;i l&#432;&#7907;ng (tu&#7847;n) <b>*</b></span><input required type="number" min="1" value={form.thoi_luong_tuan} onChange={(e) => setForm({ ...form, thoi_luong_tuan: e.target.value })} /></label>
      <label className="form-field"><span>T&#7893;ng s&#7889; bu&#7893;i <b>*</b></span><input required type="number" min="1" value={form.tong_so_buoi} onChange={(e) => setForm({ ...form, tong_so_buoi: e.target.value })} /></label><label className="form-field"><span>Tr&#7841;ng th&#225;i</span><select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}><option value="dang_mo">&#272;ang m&#7903; b&#225;n</option><option value="ngung_mo">Ng&#7915;ng m&#7903;</option></select></label>
      <label className="form-field full-field"><span>M&#244; t&#7843; kh&#243;a h&#7885;c</span><textarea rows="3" value={form.mo_ta || ''} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} /></label>
    </div>{error && <div className="alert alert-error">{error}</div>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setModal(false)}>H&#7911;y</button><button className="button button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu khóa học'}</button></div></form></section></div>}
  </>;
}
