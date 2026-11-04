import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';

const DAYS = [['Thu2','Thứ 2'],['Thu3','Thứ 3'],['Thu4','Thứ 4'],['Thu5','Thứ 5'],['Thu6','Thứ 6'],['Thu7','Thứ 7'],['ChuNhat','Chủ nhật']];
const STATUSES = [['co_mat','Có mặt'],['vang','Vắng'],['di_muon','Đi muộn'],['co_phep','Có phép']];

export default function TeacherApp({ apiBase, tab }) {
  const [teachers, setTeachers] = useState([]); const [teacherId, setTeacherId] = useState('');
  const [classes, setClasses] = useState([]); const [courses, setCourses] = useState([]); const [rooms, setRooms] = useState([]); const [requests, setRequests] = useState([]);
  const [classId, setClassId] = useState(''); const [roster, setRoster] = useState([]); const [day, setDay] = useState(new Date().toISOString().slice(0,10));
  const [requestType, setRequestType] = useState('mo_lop'); const [courseId, setCourseId] = useState(''); const [roomId, setRoomId] = useState(''); const [requestClassId, setRequestClassId] = useState(''); const [code, setCode] = useState(''); const [weekday, setWeekday] = useState('Thu2'); const [start, setStart] = useState('18:00'); const [end, setEnd] = useState('20:00'); const [reason, setReason] = useState('');
  const [gradeStudentId, setGradeStudentId] = useState(''); const [gradeName, setGradeName] = useState(''); const [score, setScore] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const teacher = teachers.find(x => String(x.ma_giao_vien) === teacherId); const selectedClass = classes.find(x => String(x.ma_lop_hoc) === classId);
  const requestCourse = requestType === 'doi_lich_phong' ? classes.find(x => String(x.ma_lop_hoc) === requestClassId)?.ma_khoa_hoc : courseId;
  const requestList = useCallback(async () => {
    if (!teacherId) return;
    const [cl, co, ro, rq] = await Promise.all([
      fetchJson(`${apiBase}/teacher-mobile/teachers/${teacherId}/classes`),
      fetchJson(`${apiBase}/teacher-mobile/teachers/${teacherId}/assigned-courses`),
      fetchJson(`${apiBase}/phong-hoc`),
      fetchJson(`${apiBase}/teacher-mobile/teachers/${teacherId}/class-requests`),
    ]);
    setClasses(cl.data || []); setCourses(co.data || []); setRooms(ro.data || []); setRequests(rq.data || []);
    setClassId(current => current || String(cl.data?.[0]?.ma_lop_hoc || ''));
    setCourseId(current => current || String(co.data?.[0]?.ma_khoa_hoc || ''));
  }, [apiBase, teacherId]);
  useEffect(() => {
    fetchJson(`${apiBase}/teacher-mobile/teachers`).then(result => {
      const list = result.data || []; setTeachers(list); setTeacherId(current => current || String(list[0]?.ma_giao_vien || ''));
    }).catch(err => setError(err.message));
  }, [apiBase]);
  useEffect(() => { if (teacherId) requestList().catch(err => setError(err.message)); }, [requestList, teacherId]);
  const loadRoster = useCallback(async () => {
    if (!classId || !teacherId) { setRoster([]); return; }
    const result = await fetchJson(`${apiBase}/teacher-mobile/teachers/${teacherId}/classes/${classId}/students?date=${encodeURIComponent(day)}`);
    setRoster(result.data || []);
  }, [apiBase, classId, day, teacherId]);
  useEffect(() => { if (tab === 'students' || tab === 'history') loadRoster().catch(err => setError(err.message)); }, [tab, loadRoster]);
  async function send(path, body) {
    const response = await fetch(`${apiBase}${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const result = await response.json().catch(()=>({})); if (!response.ok) throw new Error(result.message || `Request failed (${response.status})`); return result;
  }
  async function saveAttendance() {
    setBusy(true); setError('');
    try { await send(`/teacher-mobile/teachers/${teacherId}/classes/${classId}/attendance`, { date:day, records:roster.map(x=>({ma_hoc_vien:x.ma_hoc_vien,trang_thai:x.trang_thai_diem_danh||'co_mat',ghi_chu:x.ghi_chu_diem_danh||''})) }); setMessage('Đã lưu điểm danh.'); }
    catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  async function saveGrade() {
    if (!gradeStudentId || !gradeName || score === '') return;
    setBusy(true); setError('');
    try { await send(`/teacher-mobile/teachers/${teacherId}/classes/${classId}/grades`, { ma_hoc_vien:Number(gradeStudentId),ten_bai_kiem_tra:gradeName,diem_so:Number(score),diem_toi_da:10 }); setMessage('Đã lưu kết quả.'); setGradeName(''); setScore(''); await loadRoster(); }
    catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  async function submitRequest() {
    if (!roomId || (requestType==='mo_lop' && !code) || (requestType==='doi_lich_phong' && !requestClassId)) return;
    setBusy(true); setError('');
    try {
      await send(`/teacher-mobile/teachers/${teacherId}/class-requests`, { loai_yeu_cau:requestType,ma_khoa_hoc:Number(requestCourse),ma_lop_hoc:requestType==='doi_lich_phong'?Number(requestClassId):undefined,ma_code_lop:requestType==='mo_lop'?code:undefined,ma_phong:Number(roomId),lich_hoc:[{thu_trong_tuan:weekday,gio_bat_dau:start,gio_ket_thuc:end,ma_phong:Number(roomId)}],ly_do:reason });
      setMessage('Đã gửi yêu cầu lên nhân viên vận hành.'); setCode(''); setReason(''); await requestList();
    } catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  const currentHeading = tab==='home' ? 'Lịch dạy' : tab==='classes' ? 'Lớp được phân công' : tab==='students' ? 'Danh sách & điểm danh' : tab==='requests' ? 'Yêu cầu mở lớp / đổi lịch' : 'Kết quả học tập';
  return <>
    <View style={styles.profile}><Text style={styles.overline}>CHẾ ĐỘ GIÁO VIÊN · DEMO</Text><Text style={styles.name}>{teacher?.ho_ten || 'Chưa có hồ sơ giáo viên'}</Text><Text style={styles.muted}>{teacher?.chuyen_mon || 'Chọn hồ sơ để xem dữ liệu'}</Text><View style={styles.chips}>{teachers.map(t=><Chip key={t.ma_giao_vien} active={teacherId===String(t.ma_giao_vien)} onPress={()=>{setTeacherId(String(t.ma_giao_vien));setClassId('');setRequestClassId('');setCourseId('');}}>{t.ho_ten}</Chip>)}</View></View>
    <View style={styles.titleRow}><Text style={styles.heading}>{currentHeading}</Text><Pressable onPress={()=>requestList().then(()=>loadRoster()).catch(err=>setError(err.message))}><Text style={styles.link}>Tải lại</Text></Pressable></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}{message ? <Text style={styles.success}>{message}</Text> : null}
    {(tab==='home'||tab==='classes') && (classes.length ? classes.map(item=><Pressable key={item.ma_lop_hoc} onPress={()=>setClassId(String(item.ma_lop_hoc))} style={[styles.card,classId===String(item.ma_lop_hoc)&&styles.activeCard]}><View style={styles.between}><Text style={styles.cardTitle}>{item.ma_code_lop}</Text><Text style={styles.pill}>{item.trang_thai}</Text></View><Text style={styles.muted}>{item.ten_khoa_hoc} · {item.ten_phong||item.phong_hoc||'Chưa xếp phòng'}</Text><Text style={styles.muted}>Sĩ số {item.si_so_hien_tai}/{item.si_so_toi_da}</Text>{(item.lich_hoc||[]).map(slot=><Text key={slot.ma_khung_gio} style={styles.muted}>{DAYS.find(([v])=>v===slot.thu_trong_tuan)?.[1]} · {String(slot.gio_bat_dau).slice(0,5)}–{String(slot.gio_ket_thuc).slice(0,5)}</Text>)}<Pressable onPress={()=>{setClassId(String(item.ma_lop_hoc));}}><Text style={styles.link}>Xem lớp và học viên</Text></Pressable></Pressable>) : <Empty>Chưa có lớp được phân công.</Empty>)}
    {tab==='students' && <><View style={styles.chips}>{classes.map(c=><Chip key={c.ma_lop_hoc} active={classId===String(c.ma_lop_hoc)} onPress={()=>setClassId(String(c.ma_lop_hoc))}>{c.ma_code_lop}</Chip>)}</View><TextInput style={styles.input} value={day} onChangeText={setDay} placeholder="Ngày học YYYY-MM-DD"/><Text style={styles.muted}>Điểm danh ngày (YYYY-MM-DD)</Text>{roster.map(student=><View key={student.ma_hoc_vien} style={styles.card}><Text style={styles.cardTitle}>{student.ho_ten}</Text><Text style={styles.muted}>{student.email||student.so_dien_thoai||`HV-${student.ma_hoc_vien}`}</Text><View style={styles.chips}>{STATUSES.map(([value,label])=><Chip key={value} active={(student.trang_thai_diem_danh||'co_mat')===value} onPress={()=>setRoster(rows=>rows.map(row=>row.ma_hoc_vien===student.ma_hoc_vien?{...row,trang_thai_diem_danh:value}:row))}>{label}</Chip>)}</View></View>)}{!roster.length&&<Empty>Không có học viên ghi danh trong lớp.</Empty>}<Primary disabled={busy||!classId} onPress={saveAttendance}>{busy?'Đang lưu...':'Lưu điểm danh'}</Primary></>}
    {tab==='history' && <><View style={styles.chips}>{classes.map(c=><Chip key={c.ma_lop_hoc} active={classId===String(c.ma_lop_hoc)} onPress={()=>setClassId(String(c.ma_lop_hoc))}>{c.ma_code_lop}</Chip>)}</View>{roster.map(student=><View key={student.ma_hoc_vien} style={styles.card}><Text style={styles.cardTitle}>{student.ho_ten}</Text>{(student.ket_qua||[]).map((g,i)=><Text key={g.ma_ket_qua||i} style={styles.muted}>{g.ten_bai_kiem_tra}: {g.diem_so}/{g.diem_toi_da}</Text>)}</View>)}<Text style={styles.label}>Chọn học viên, bài kiểm tra và điểm mới</Text><View style={styles.chips}>{roster.map(student=><Chip key={student.ma_hoc_vien} active={gradeStudentId===String(student.ma_hoc_vien)} onPress={()=>setGradeStudentId(String(student.ma_hoc_vien))}>{student.ho_ten}</Chip>)}</View><TextInput style={styles.input} value={gradeName} onChangeText={setGradeName} placeholder="Tên bài kiểm tra"/><TextInput style={styles.input} value={score} onChangeText={setScore} placeholder="Điểm / 10" keyboardType="decimal-pad"/><Primary disabled={busy||!gradeStudentId} onPress={saveGrade}>Lưu kết quả học tập</Primary></>}
    {tab==='requests' && <><View style={styles.card}><Text style={styles.label}>Loại yêu cầu</Text><View style={styles.chips}><Chip active={requestType==='mo_lop'} onPress={()=>setRequestType('mo_lop')}>Đăng ký mở lớp</Chip><Chip active={requestType==='doi_lich_phong'} onPress={()=>setRequestType('doi_lich_phong')}>Đổi lịch / phòng</Chip></View>{requestType==='mo_lop'?<><Text style={styles.label}>Khóa học đã được phân công</Text><View style={styles.chips}>{courses.map(c=><Chip key={c.ma_khoa_hoc} active={courseId===String(c.ma_khoa_hoc)} onPress={()=>setCourseId(String(c.ma_khoa_hoc))}>{c.ten_khoa_hoc}</Chip>)}</View><TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="Mã lớp đề xuất"/></>:<><Text style={styles.label}>Lớp</Text><View style={styles.chips}>{classes.map(c=><Chip key={c.ma_lop_hoc} active={requestClassId===String(c.ma_lop_hoc)} onPress={()=>setRequestClassId(String(c.ma_lop_hoc))}>{c.ma_code_lop}</Chip>)}</View></>}<Text style={styles.label}>Phòng đề xuất</Text><View style={styles.chips}>{rooms.filter(r=>r.trang_thai!=='bao_tri').map(r=><Chip key={r.ma_phong} active={roomId===String(r.ma_phong)} onPress={()=>setRoomId(String(r.ma_phong))}>{r.ten_phong}</Chip>)}</View><Text style={styles.label}>Ngày học trong tuần</Text><View style={styles.chips}>{DAYS.map(([value,label])=><Chip key={value} active={weekday===value} onPress={()=>setWeekday(value)}>{label}</Chip>)}</View><View style={styles.between}><TextInput style={[styles.input,styles.time]} value={start} onChangeText={setStart} placeholder="18:00"/><TextInput style={[styles.input,styles.time]} value={end} onChangeText={setEnd} placeholder="20:00"/></View><TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Lý do / ghi chú"/><Primary disabled={busy||!roomId} onPress={submitRequest}>Gửi nhân viên vận hành duyệt</Primary></View>{requests.map(r=><View key={r.ma_yeu_cau} style={styles.card}><Text style={styles.cardTitle}>{r.loai_yeu_cau==='mo_lop'?'Mở lớp':'Đổi lịch / phòng'} · {r.ten_khoa_hoc}</Text><Text style={styles.muted}>{r.ma_code_lop||'Mã lớp mới'} · {r.ten_phong||'Phòng'} · {r.trang_thai}</Text>{r.phan_hoi?<Text style={styles.muted}>Phản hồi: {r.phan_hoi}</Text>:null}</View>)}</>}
  </>;
}
async function fetchJson(url) { const response=await fetch(url); const payload=await response.json().catch(()=>({})); if(!response.ok) throw new Error(payload.message||`API error ${response.status}`); return payload; }
function Chip({children,active,onPress}) { return <Pressable onPress={onPress} style={[styles.chip,active&&styles.chipActive]}><Text style={[styles.chipText,active&&styles.chipTextActive]}>{children}</Text></Pressable>; }
function Primary({children,onPress,disabled}) { return <Pressable onPress={onPress} disabled={disabled} style={[styles.primary,disabled&&{opacity:.5}]}><Text style={styles.primaryText}>{children}</Text></Pressable>; }
function Empty({children}) { return <Text style={styles.empty}>{children}</Text>; }
const styles=StyleSheet.create({profile:{padding:15,borderRadius:17,backgroundColor:'#fff',borderWidth:1,borderColor:'#e8ecf5',marginBottom:14},overline:{fontSize:9,color:'#3157d5',fontWeight:'900',letterSpacing:1},name:{fontSize:18,color:'#18213b',fontWeight:'900',marginTop:5},muted:{fontSize:11,color:'#77819a',lineHeight:17,marginTop:4},chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:9},chip:{paddingHorizontal:9,paddingVertical:7,borderRadius:16,backgroundColor:'#eef2ff'},chipActive:{backgroundColor:'#3157d5'},chipText:{fontSize:10,color:'#3157d5'},chipTextActive:{color:'#fff',fontWeight:'800'},section:{fontSize:13,fontWeight:'900',color:'#18213b',marginTop:14,marginBottom:8},titleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:4,marginBottom:9},heading:{fontSize:16,fontWeight:'900',color:'#18213b'},link:{fontSize:10,color:'#3157d5',fontWeight:'800',marginTop:8},card:{padding:13,borderRadius:15,backgroundColor:'#fff',borderWidth:1,borderColor:'#e8ecf5',marginBottom:9},activeCard:{borderColor:'#3157d5',backgroundColor:'#f7f8ff'},between:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},cardTitle:{fontSize:13,color:'#18213b',fontWeight:'800',flex:1},pill:{fontSize:9,color:'#16815c',backgroundColor:'#e7f8f0',paddingHorizontal:8,paddingVertical:4,borderRadius:12,overflow:'hidden'},input:{minHeight:42,borderWidth:1,borderColor:'#e8ecf5',borderRadius:10,backgroundColor:'#fff',paddingHorizontal:11,color:'#18213b',fontSize:12,marginTop:8},time:{flex:1},label:{fontSize:11,color:'#18213b',fontWeight:'800',marginTop:13},primary:{backgroundColor:'#3157d5',borderRadius:11,padding:12,alignItems:'center',marginTop:11},primaryText:{color:'#fff',fontSize:11,fontWeight:'800'},empty:{padding:20,textAlign:'center',color:'#77819a',fontSize:11},error:{color:'#a3342c',backgroundColor:'#fff0ef',padding:10,borderRadius:10,fontSize:11,marginBottom:8},success:{color:'#16815c',backgroundColor:'#e7f8f0',padding:10,borderRadius:10,fontSize:11,marginBottom:8}});
