import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, RefreshControl, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, View, Platform,
} from 'react-native';

const API_BASE = (Platform.OS === 'web' && typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3000/api/v1`
  : process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api/v1').replace(/\/$/, '');
import TeacherApp from './TeacherApp';

const COLORS = { ink: '#18213b', muted: '#77819a', blue: '#3157d5', pale: '#eef2ff', line: '#e8ecf5', green: '#16815c', canvas: '#f6f8fc', white: '#ffffff' };
const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có ngày';
const pickRows = (result) => Array.isArray(result?.data) ? result.data : [];

async function get(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.message || `API trả về lỗi ${response.status}`);
  return json;
}

function Chip({ children, active = false, onPress }) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{children}</Text></Pressable>;
}

function SectionTitle({ title, hint }) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>{title}</Text>{hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}</View>;
}

function Empty({ children }) { return <Text style={styles.empty}>{children}</Text>; }

export default function App() {
  const [tab, setTab] = useState('home');
  const [persona, setPersona] = useState('student');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [learning, setLearning] = useState([]);
  const [payments, setPayments] = useState([]);
  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('chuyen_khoan');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [studentResult, courseResult, classResult] = await Promise.all([
        get('/hoc-vien'), get('/courses'), get('/classes'),
      ]);
      const studentRows = pickRows(studentResult);
      setStudents(studentRows);
      setCourses(pickRows(courseResult));
      setClasses(pickRows(classResult));
      const nextId = studentId || (studentRows[0] ? String(studentRows[0].ma_hoc_vien) : '');
      if (nextId && !studentRows.some((student) => String(student.ma_hoc_vien) === nextId)) {
        setStudentId(studentRows[0] ? String(studentRows[0].ma_hoc_vien) : '');
      } else if (nextId && !studentId) setStudentId(nextId);
      if (nextId) {
        const [registrationResult, learningResult, paymentResult] = await Promise.all([
          get(`/registrations?ma_hoc_vien=${encodeURIComponent(nextId)}`),
          get(`/hoc-vien/${nextId}/learning-history`),
          get(`/hoc-vien/${nextId}/payment-history`),
        ]);
        setRegistrations(pickRows(registrationResult));
        setLearning(pickRows(learningResult));
        setPayments(pickRows(paymentResult));
      } else {
        setRegistrations([]); setLearning([]); setPayments([]);
      }
    } catch (loadError) {
      setError(`${loadError.message}. Kiểm tra backend và EXPO_PUBLIC_API_URL.`);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.ma_hoc_vien) === studentId),
    [students, studentId],
  );

  const availableClasses = useMemo(() => checkoutCourse
    ? classes.filter((item) => Number(item.ma_khoa_hoc) === Number(checkoutCourse.ma_khoa_hoc)
      && ['dang_mo', 'dang_hoc'].includes(item.trang_thai)
      && Number(item.si_so_hien_tai || 0) < Number(item.si_so_toi_da || 0))
    : [], [classes, checkoutCourse]);

  async function submitCoursePurchase() {
    if (!studentId || !checkoutCourse || !selectedClassId) return;
    setPurchasing(true); setPurchaseNotice(''); setError('');
    try {
      const response = await fetch(`${API_BASE}/student-purchases/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_hoc_vien: Number(studentId),
          ma_khoa_hoc: Number(checkoutCourse.ma_khoa_hoc),
          ma_lop_hoc: Number(selectedClassId),
          phuong_thuc: paymentMethod,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `Thanh toán lỗi (${response.status})`);
      setPurchaseNotice(`Đã gửi yêu cầu đăng ký ${result.data.ten_khoa_hoc} (${money(result.data.so_tien)}). Nhân viên sẽ xác nhận thanh toán và đăng ký lớp.`);
      setCheckoutCourse(null); setSelectedClassId('');
      await load(true);
    } catch (purchaseError) {
      setError(purchaseError.message || 'Không thể hoàn tất đăng ký.');
    } finally { setPurchasing(false); }
  }

  const changeStudent = (id) => {
    setStudentId(String(id));
    setRegistrations([]); setLearning([]); setPayments([]);
  };

  const enrolledClassIds = new Set(registrations.map((item) => String(item.ma_lop_hoc)));
  const myClasses = classes.filter((item) => enrolledClassIds.has(String(item.ma_lop_hoc)));

  const header = <View style={styles.header}>
    <View><Text style={styles.brand}>ECMS<Text style={styles.brandAccent}> Mobile</Text></Text><Text style={styles.headerCaption}>English Center · Bản dùng thử</Text></View>
    <View style={styles.headerActions}><Pressable onPress={() => { setPersona(persona === 'student' ? 'teacher' : 'student'); setTab('home'); }} style={styles.modeButton}><Text style={styles.modeText}>{persona === 'student' ? '\u0047i\u00e1o vi\u00ean' : 'H\u1ecdc vi\u00ean'}</Text></Pressable><Pressable onPress={() => load(true)} style={styles.refreshButton}><Text style={styles.refreshText}>{'\u21bb'}</Text></Pressable></View>
  </View>;

  const content = () => {
    if (tab === 'courses') return <>
      <SectionTitle title="Khóa học" hint={`${courses.length} khóa`} />
      {purchaseNotice ? <View style={styles.success}><Text style={styles.successText}>{purchaseNotice}</Text></View> : null}
      {courses.length ? courses.map((course) => <Pressable key={course.ma_khoa_hoc} style={styles.courseRow} onPress={() => setSelectedCourse(course)}><View style={styles.courseIcon}><Text style={styles.courseIconText}>{(course.loai_khoa_hoc || 'EN').slice(0, 2).toUpperCase()}</Text></View><View style={styles.courseInfo}><Text numberOfLines={1} style={styles.cardTitle}>{course.ten_khoa_hoc}</Text><Text style={styles.cardMeta}>{course.loai_khoa_hoc || 'Tiếng Anh'} · {course.trinh_do || 'Mọi trình độ'}</Text></View><View style={styles.coursePrice}><Text style={styles.price}>{money(course.hoc_phi)}</Text><Text style={styles.courseArrow}>›</Text></View></Pressable>) : <Empty>Chưa có khóa học.</Empty>}
    </>;
    if (tab === 'classes') return <>
      <SectionTitle title="Lớp học" hint="Lớp đang mở và lớp của học viên" />
      {myClasses.length ? <><Text style={styles.subhead}>Lớp của {selectedStudent?.ho_ten || 'học viên'}</Text>{myClasses.map((item) => <ClassCard key={item.ma_lop_hoc} item={item} />)}</> : null}
      <Text style={styles.subhead}>Danh sách lớp</Text>
      {classes.length ? classes.map((item) => <ClassCard key={item.ma_lop_hoc} item={item} />) : <Empty>Chưa có lớp học.</Empty>}
    </>;
    if (tab === 'history') return <>
      <SectionTitle title="Lịch sử học tập" hint={selectedStudent?.ho_ten || 'Chọn hồ sơ ở mục Cá nhân'} />
      {learning.length ? learning.map((item, index) => <View key={item.ma_dang_ky || item.ma_ket_qua || index} style={styles.card}><Text style={styles.cardTitle}>{item.ten_khoa_hoc || item.ma_code_lop || 'Lớp học'}</Text><Text style={styles.cardMeta}>{item.ma_code_lop || ''} {item.trang_thai ? `· ${item.trang_thai}` : ''}</Text><Text style={styles.cardMeta}>Ngày đăng ký: {date(item.ngay_dang_ky)}</Text></View>) : <Empty>Chưa có dữ liệu lịch sử cho hồ sơ này.</Empty>}
      <SectionTitle title="Lịch sử thanh toán" hint={`${payments.length} hóa đơn`} />
      {payments.length ? payments.map((item, index) => <View key={`${item.ma_hoa_don || index}-${item.ma_thanh_toan || 'invoice'}`} style={styles.card}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{item.ma_code_hoa_don || `Hóa đơn #${item.ma_hoa_don || index + 1}`}</Text><Text style={styles.price}>{money(item.so_tien ?? item.tong_tien)}</Text></View><Text style={styles.cardMeta}>{item.trang_thai_hoa_don || 'Chưa rõ trạng thái'}{item.phuong_thuc ? ` · ${item.phuong_thuc}` : ''} · {date(item.ngay_thanhtoan || item.ngay_tao)}</Text></View>) : <Empty>Chưa có lịch sử thanh toán.</Empty>}
    </>;
    if (tab === 'profile') return <>
      <SectionTitle title="Chọn hồ sơ dùng thử" hint="Không cần đăng nhập" />
      <Text style={styles.cardDescription}>Chọn một hồ sơ học viên trong cơ sở dữ liệu để xem dữ liệu cá nhân. Đây là chế độ demo nội bộ.</Text>
      {students.map((student) => <Pressable key={student.ma_hoc_vien} onPress={() => changeStudent(student.ma_hoc_vien)} style={[styles.studentOption, String(student.ma_hoc_vien) === studentId && styles.studentOptionActive]}><View style={styles.avatar}><Text style={styles.avatarText}>{(student.ho_ten || 'HV').split(' ').slice(-1)[0].slice(0, 1)}</Text></View><View style={styles.studentInfo}><Text style={styles.cardTitle}>{student.ho_ten}</Text><Text style={styles.cardMeta}>Học viên #{student.ma_hoc_vien} · {student.trang_thai || 'Chưa cập nhật'}</Text></View><Text style={styles.check}>{String(student.ma_hoc_vien) === studentId ? '✓' : ''}</Text></Pressable>)}
      {!students.length && <Empty>Chưa có hồ sơ học viên trong cơ sở dữ liệu.</Empty>}
      <View style={styles.note}><Text style={styles.noteTitle}>Kết nối API</Text><Text style={styles.noteText}>{API_BASE}</Text><Text style={styles.noteText}>Điện thoại và máy tính chạy backend cần cùng mạng Wi-Fi.</Text></View>
    </>;
    return <>
      <View style={styles.hero}><Text style={styles.eyebrow}>XIN CHÀO</Text><Text style={styles.heroTitle}>{selectedStudent?.ho_ten || 'Học viên'}</Text><Text style={styles.heroText}>Cùng tiếp tục hành trình tiếng Anh của bạn.</Text></View>
      <View style={styles.stats}><Stat label="Khóa học" value={courses.length} /><Stat label="Lớp học" value={myClasses.length} /><Stat label="Hóa đơn" value={payments.length} /></View>
      <SectionTitle title="Lớp học của tôi" hint={`${myClasses.length} lớp`} />
      {myClasses.length ? myClasses.slice(0, 3).map((item) => <ClassCard key={item.ma_lop_hoc} item={item} />) : <View style={styles.card}><Empty>Chưa có lớp được ghi danh trong hồ sơ đang chọn.</Empty><Pressable onPress={() => setTab('classes')}><Text style={styles.inlineLink}>Xem danh sách lớp →</Text></Pressable></View>}
      <SectionTitle title="Khóa học nổi bật" hint={`${courses.length} khóa`} />
      {courses.slice(0, 3).map((course) => <View key={course.ma_khoa_hoc} style={styles.card}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{course.ten_khoa_hoc}</Text><Text style={styles.price}>{money(course.hoc_phi)}</Text></View><Text style={styles.cardMeta}>{course.loai_khoa_hoc || 'Tiếng Anh'} · {course.trinh_do || 'Mọi trình độ'}</Text></View>)}
    </>;
  };

  return <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />{header}
    {error ? <View style={styles.error}><Text style={styles.errorTitle}>Không tải được dữ liệu</Text><Text style={styles.errorText}>{error}</Text><Text style={styles.errorHint}>Android Emulator dùng 10.0.2.2; Expo Go trên điện thoại cần IP LAN của máy tính.</Text><Pressable onPress={() => load(true)} style={styles.retry}><Text style={styles.retryText}>Thử kết nối lại</Text></Pressable></View> : null}
    {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.blue} /><Text style={styles.cardMeta}>Đang tải dữ liệu từ trung tâm...</Text></View> : <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.blue} />}>{persona === 'teacher' ? <TeacherApp apiBase={API_BASE} tab={tab} /> : content()}</ScrollView>}
    <Modal visible={!!selectedCourse || !!checkoutCourse} transparent animationType="fade" onRequestClose={() => { setSelectedCourse(null); setCheckoutCourse(null); }}>
      <View style={styles.modalBackdrop}><View style={styles.modalCard}>
        <View style={styles.modalHeader}><Text style={styles.modalHeading}>{checkoutCourse ? 'Đăng ký khóa học' : 'Chi tiết khóa học'}</Text><Pressable accessibilityLabel="Đóng" onPress={() => { setSelectedCourse(null); setCheckoutCourse(null); }} style={styles.modalClose}><Text style={styles.modalCloseText}>×</Text></Pressable></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
          {selectedCourse && !checkoutCourse ? <><View style={styles.courseHero}><Text style={styles.courseHeroTag}>{selectedCourse.loai_khoa_hoc || 'Tiếng Anh'}</Text><Text style={styles.courseHeroLevel}>{selectedCourse.trinh_do || 'Mọi trình độ'}</Text></View><Text style={styles.modalCourseTitle}>{selectedCourse.ten_khoa_hoc}</Text><Text style={styles.modalPrice}>{money(selectedCourse.hoc_phi)}</Text><Text style={styles.modalDescription}>{selectedCourse.mo_ta || 'Chương trình đào tạo tiếng Anh tại trung tâm, được thiết kế theo trình độ và mục tiêu học tập của học viên.'}</Text><View style={styles.modalInfo}><Text style={styles.modalInfoLabel}>Học viên</Text><Text style={styles.modalInfoValue}>{selectedStudent?.ho_ten || 'Chưa chọn hồ sơ'}</Text></View><Pressable onPress={() => { setPurchaseNotice(''); setCheckoutCourse(selectedCourse); setSelectedCourse(null); setSelectedClassId(''); }} style={styles.buyButton}><Text style={styles.buyButtonText}>Đăng ký khóa học</Text></Pressable></> : null}
          {checkoutCourse ? <><Text style={styles.checkoutTitle}>{checkoutCourse.ten_khoa_hoc}</Text><Text style={styles.checkoutMeta}>Học viên: {selectedStudent?.ho_ten || 'Chưa chọn hồ sơ'} · Học phí: {money(checkoutCourse.hoc_phi)}</Text><Text style={styles.choiceLabel}>Chọn lớp còn chỗ</Text>{availableClasses.length ? availableClasses.map((item) => <Pressable key={item.ma_lop_hoc} onPress={() => setSelectedClassId(String(item.ma_lop_hoc))} style={[styles.classChoice, selectedClassId === String(item.ma_lop_hoc) && styles.classChoiceActive]}><Text style={styles.cardTitle}>{item.ma_code_lop}</Text><Text style={styles.cardMeta}>{item.ten_giao_vien || 'Chưa có giáo viên'} · {item.ten_phong || item.phong_hoc || 'Chưa xếp phòng'} · {item.si_so_hien_tai}/{item.si_so_toi_da} chỗ</Text>{item.lich_hoc?.length ? <Text style={styles.cardMeta}>{item.lich_hoc.map((slot) => `${slot.thu_trong_tuan} ${String(slot.gio_bat_dau || '').slice(0, 5)}-${String(slot.gio_ket_thuc || '').slice(0, 5)}`).join(' · ')}</Text> : null}</Pressable>) : <Empty>Khóa học hiện chưa có lớp phù hợp còn chỗ.</Empty>}<Text style={styles.choiceLabel}>Ph&#432;&#417;ng th&#7913;c thanh to&#225;n &#273;&#227; ch&#7885;n</Text><View style={styles.methods}>{[['chuyen_khoan', 'Chuyển khoản'], ['the_ngan_hang', 'Thẻ ngân hàng'], ['vi_dieu_tu', 'Ví điện tử']].map(([value, label]) => <Pressable key={value} onPress={() => setPaymentMethod(value)} style={[styles.method, paymentMethod === value && styles.methodActive]}><Text style={[styles.methodText, paymentMethod === value && styles.methodTextActive]}>{label}</Text></Pressable>)}</View><Text style={styles.demoNote}>G&#7917;i y&#234;u c&#7847;u &#273;&#7875; nh&#226;n vi&#234;n x&#225;c minh. H&#243;a &#273;&#417;n v&#224; &#273;&#259;ng k&#253; l&#7899;p s&#7869; &#273;&#432;&#7907;c ghi nh&#7853;n sau khi x&#225;c nh&#7853;n.</Text><Pressable disabled={!selectedClassId || purchasing || !selectedStudent} onPress={submitCoursePurchase} style={[styles.buyButton, (!selectedClassId || purchasing || !selectedStudent) && styles.disabled]}><Text style={styles.buyButtonText}>{purchasing ? 'Đang xử lý...' : `\u0047\u1eedi y\u00eau c\u1ea7u ${money(checkoutCourse.hoc_phi)}`}</Text></Pressable></> : null}
        </ScrollView>
      </View></View>
    </Modal>
    <View style={styles.tabBar}>{(persona === 'teacher' ? [['home','\u{1F4C5}','L\u1ecbch d\u1ea1y'],['classes','\u{1F3EB}','L\u1edbp h\u1ecdc'],['students','\u{1F465}','H\u1ecdc vi\u00ean'],['requests','\u{1F4DD}','Y\u00eau c\u1ea7u'],['history','\u{1F4CA}','\u0110i\u1ec3m s\u1ed1']] : [['home', '\u{1F3E0}', 'T\u1ed5ng quan'], ['classes', '\u{1F4C5}', 'L\u1edbp h\u1ecdc'], ['courses', '\u{1F4D8}', 'Kh\u00f3a h\u1ecdc'], ['history', '\u{1F552}', 'L\u1ecbch s\u1eed'], ['profile', '\u{1F464}', 'C\u00e1 nh\u00e2n']]).map(([key, icon, label]) => <Pressable key={key} onPress={() => setTab(key)} style={styles.tab}><Text style={[styles.tabIcon, tab === key && styles.tabIconActive]}>{icon}</Text><Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

function Stat({ label, value }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function ClassCard({ item }) {
  return <View style={styles.card}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{item.ma_code_lop || item.ten_khoa_hoc}</Text><Text style={styles.badge}>{item.trang_thai || 'Đang học'}</Text></View><Text style={styles.cardMeta}>{item.ten_khoa_hoc || 'Khóa học'} · {item.ten_giao_vien || 'Chưa phân công giáo viên'}</Text><Text style={styles.cardMeta}>Phòng {item.ten_phong || item.phong_hoc || 'Chưa xếp'} · {item.si_so_hien_tai || 0}/{item.si_so_toi_da || 0} học viên</Text>{item.lich_hoc?.length ? <Text style={styles.cardMeta}>{item.lich_hoc.map((slot) => `${slot.thu_trong_tuan} ${String(slot.gio_bat_dau || '').slice(0, 5)}-${String(slot.gio_ket_thuc || '').slice(0, 5)}`).join('  ·  ')}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas }, header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.canvas }, brand: { fontSize: 22, fontWeight: '900', color: COLORS.ink, letterSpacing: -0.8 }, brandAccent: { color: COLORS.blue }, headerCaption: { marginTop: 3, color: COLORS.muted, fontSize: 11 }, refreshButton: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }, refreshText: { fontSize: 24, color: COLORS.blue }, scroll: { paddingHorizontal: 18, paddingBottom: 25 }, hero: { padding: 22, borderRadius: 22, backgroundColor: COLORS.blue, marginBottom: 14 }, eyebrow: { color: '#cbd5ff', fontWeight: '800', fontSize: 10, letterSpacing: 1.4 }, heroTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginTop: 7 }, heroText: { color: '#e4e9ff', fontSize: 12, marginTop: 7 }, stats: { flexDirection: 'row', gap: 9, marginBottom: 20 }, stat: { flex: 1, paddingVertical: 15, paddingHorizontal: 9, alignItems: 'center', borderRadius: 16, backgroundColor: COLORS.white }, statValue: { color: COLORS.blue, fontSize: 21, fontWeight: '800' }, statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 }, sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 9, marginBottom: 10 }, sectionHeading: { color: COLORS.ink, fontWeight: '800', fontSize: 16 }, sectionHint: { color: COLORS.muted, fontSize: 10 }, card: { padding: 15, borderRadius: 16, marginBottom: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, cardTitle: { flex: 1, color: COLORS.ink, fontWeight: '750', fontSize: 13 }, price: { color: COLORS.blue, fontSize: 12, fontWeight: '800' }, cardMeta: { color: COLORS.muted, fontSize: 10, lineHeight: 16, marginTop: 5 }, cardDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 8 }, badge: { color: COLORS.green, backgroundColor: '#e7f8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, fontSize: 9, overflow: 'hidden' }, subhead: { marginTop: 6, marginBottom: 8, color: COLORS.muted, fontWeight: '700', fontSize: 11 }, empty: { color: COLORS.muted, textAlign: 'center', paddingVertical: 17, fontSize: 11 }, inlineLink: { color: COLORS.blue, marginTop: 8, fontWeight: '700', fontSize: 11 }, studentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, padding: 11, marginBottom: 8 }, studentOptionActive: { borderColor: COLORS.blue, backgroundColor: COLORS.pale }, avatar: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pale }, avatarText: { color: COLORS.blue, fontWeight: '800', fontSize: 15 }, studentInfo: { flex: 1, marginLeft: 10 }, check: { color: COLORS.blue, fontWeight: '900', fontSize: 17 }, note: { padding: 14, borderRadius: 14, backgroundColor: COLORS.pale, marginTop: 12 }, noteTitle: { color: COLORS.ink, fontWeight: '800', fontSize: 11, marginBottom: 5 }, noteText: { color: COLORS.muted, fontSize: 10, lineHeight: 16 }, error: { marginHorizontal: 18, padding: 15, borderRadius: 15, backgroundColor: '#fff0ef', borderWidth: 1, borderColor: '#ffd5d1' }, errorTitle: { color: '#a3342c', fontWeight: '800', fontSize: 13 }, errorText: { color: '#813a35', fontSize: 11, marginTop: 6, lineHeight: 16 }, errorHint: { color: '#813a35', fontSize: 10, marginTop: 5, lineHeight: 15 }, retry: { marginTop: 10, backgroundColor: COLORS.blue, padding: 9, borderRadius: 9, alignSelf: 'flex-start' }, retryText: { color: COLORS.white, fontSize: 10, fontWeight: '700' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, paddingBottom: 6, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.line }, tab: { flex: 1, alignItems: 'center', gap: 2 }, tabIcon: { color: '#9aa3b7', fontSize: 20 }, tabIconActive: { color: COLORS.blue }, tabLabel: { color: '#8992a6', fontSize: 9 }, tabLabelActive: { color: COLORS.blue, fontWeight: '800' }, chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.pale }, chipActive: { backgroundColor: COLORS.blue }, chipText: { color: COLORS.blue, fontSize: 10 }, chipTextActive: { color: COLORS.white },
  success: { backgroundColor: '#e7f8f0', borderColor: '#c5ead6', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }, successText: { color: COLORS.green, fontSize: 11, lineHeight: 16, fontWeight: '700' }, buyButton: { backgroundColor: COLORS.blue, borderRadius: 11, padding: 12, alignItems: 'center', marginTop: 12 }, buyButtonText: { color: COLORS.white, fontWeight: '800', fontSize: 11 }, checkout: { padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#cbd5ff', backgroundColor: COLORS.white, marginBottom: 14 }, checkoutTitle: { flex: 1, color: COLORS.ink, fontSize: 14, fontWeight: '800' }, close: { color: COLORS.blue, fontSize: 10, fontWeight: '700' }, checkoutMeta: { color: COLORS.muted, marginTop: 7, fontSize: 10, lineHeight: 16 }, choiceLabel: { color: COLORS.ink, fontWeight: '800', fontSize: 11, marginTop: 14, marginBottom: 7 }, classChoice: { borderWidth: 1, borderColor: COLORS.line, padding: 10, borderRadius: 11, marginBottom: 7, backgroundColor: '#fbfcff' }, classChoiceActive: { borderColor: COLORS.blue, backgroundColor: COLORS.pale }, methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, method: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, paddingVertical: 7, paddingHorizontal: 9 }, methodActive: { backgroundColor: COLORS.pale, borderColor: COLORS.blue }, methodText: { color: COLORS.muted, fontSize: 9 }, methodTextActive: { color: COLORS.blue, fontWeight: '800' }, demoNote: { color: '#94620c', fontSize: 10, lineHeight: 15, backgroundColor: '#fff6df', borderRadius: 8, padding: 9, marginTop: 12 }, disabled: { opacity: 0.45 },

  courseRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 15, marginBottom: 8, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, gap: 11 }, courseIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pale }, courseIconText: { color: COLORS.blue, fontSize: 11, fontWeight: '900' }, courseInfo: { flex: 1, minWidth: 0 }, coursePrice: { alignItems: 'flex-end', gap: 4 }, courseArrow: { color: COLORS.muted, fontSize: 17 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(19, 28, 53, 0.48)', justifyContent: 'center', alignItems: 'center', padding: 18 }, modalCard: { width: '100%', maxWidth: 520, maxHeight: '88%', backgroundColor: COLORS.white, borderRadius: 22, overflow: 'hidden' }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: '#f4f6ff' }, modalHeading: { color: COLORS.ink, fontSize: 14, fontWeight: '800' }, modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }, modalCloseText: { color: COLORS.muted, fontSize: 24, lineHeight: 27 }, modalBody: { padding: 17, paddingBottom: 20 }, courseHero: { minHeight: 90, borderRadius: 15, backgroundColor: COLORS.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }, courseHeroTag: { color: COLORS.white, fontSize: 16, fontWeight: '900' }, courseHeroLevel: { color: '#e0e7ff', borderWidth: 1, borderColor: '#aabaff', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, fontSize: 11 }, modalCourseTitle: { textAlign: 'center', color: COLORS.ink, fontSize: 19, fontWeight: '900' }, modalPrice: { textAlign: 'center', color: COLORS.blue, fontSize: 23, fontWeight: '900', marginTop: 9 }, modalDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 19, marginTop: 13 }, modalInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, marginTop: 8, borderBottomWidth: 1, borderBottomColor: COLORS.line }, modalInfoLabel: { color: COLORS.muted, fontSize: 11 }, modalInfoValue: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 }, modeButton: { backgroundColor: COLORS.pale, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 }, modeText: { color: COLORS.blue, fontSize: 10, fontWeight: '800' },
});
