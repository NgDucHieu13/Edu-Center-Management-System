# API quản lý

Các API quản lý người dùng/khóa học/lớp/giáo viên/học viên/đăng ký đang mở không cần JWT trong giai đoạn phát triển để dễ gọi thử.

## Tài khoản và phân quyền

- `GET /api/v1/users` — danh sách tài khoản, không trả mật khẩu hash.
- `GET /api/v1/users/:id` — chi tiết tài khoản.
- `POST /api/v1/users` — tạo tài khoản; mật khẩu tối thiểu 8 ký tự và được hash bằng bcrypt.
- `PATCH /api/v1/users/:id` — sửa thông tin, đổi role/trạng thái; mật khẩu mới là tùy chọn.
- `DELETE /api/v1/users/:id` — khóa tài khoản (`trang_thai = khoa`), không xóa dữ liệu.

Role hợp lệ: `admin`, `nhan_vien`, `giao_vien`, `hoc_vien`.

## Học viên

- `GET /api/v1/hoc-vien?page=1&limit=20` — danh sách.
- `GET /api/v1/hoc-vien/:id` — hồ sơ.
- `POST /api/v1/hoc-vien`, `PATCH /api/v1/hoc-vien/:id` — tạo/cập nhật.
- `DELETE /api/v1/hoc-vien/:id` — chuyển trạng thái sang `da_nghi`, giữ lịch sử học và thanh toán.
- `GET /api/v1/hoc-vien/:id/learning-history` — lớp đã đăng ký và kết quả.
- `GET /api/v1/hoc-vien/:id/payment-history` — hóa đơn và các lần thanh toán.

## Khóa học và lớp học

- `GET|POST /api/v1/courses`, `GET|PATCH|DELETE /api/v1/courses/:id` — danh mục khóa học.
- `GET|POST /api/v1/classes`, `GET|PATCH /api/v1/classes/:id` — lớp học và khung giờ.
- `GET /api/v1/classes?ma_giao_vien=1` — lọc lớp theo giáo viên.
- `GET /api/v1/teachers/:id/classes` — lớp được phân công.

Ví dụ tạo lớp:

```json
{
  "ma_khoa_hoc": 1,
  "ma_code_lop": "IELTS-01",
  "ma_giao_vien": 1,
  "phong_hoc": "A101",
  "si_so_toi_da": 20,
  "lich_hoc": [
    { "thu_trong_tuan": "Thu2", "gio_bat_dau": "18:00:00", "gio_ket_thuc": "20:00:00" }
  ]
}
```

`thu_trong_tuan` nhận `Thu2`, `Thu3`, `Thu4`, `Thu5`, `Thu6`, `Thu7`, `ChuNhat` theo ENUM trong schema.

## Giáo viên

- `GET|POST /api/v1/teachers`, `GET|PATCH|DELETE /api/v1/teachers/:id` — hồ sơ và chuyên môn.

## Đăng ký, xếp lớp và hàng chờ

- `POST /api/v1/registrations` — body `{ "ma_hoc_vien": 1, "ma_lop_hoc": 1 }`. API dùng transaction, kiểm tra sĩ số và trùng lịch; lớp đầy trả HTTP 202 và thêm vào hàng chờ.
- `GET /api/v1/registrations?ma_hoc_vien=1&ma_lop_hoc=1` — tra cứu.
- `POST /api/v1/registrations/:id/adjustments` — yêu cầu `{ "loai_dieu_chinh": "bao_luu|chuyen_lop|huy_dang_ky", "den_lop_id": 2, "ly_do": "..." }`.
- `POST /api/v1/adjustments/:id/approve` — duyệt điều chỉnh; chuyển lớp sẽ kiểm tra sĩ số và trùng lịch lần nữa.
- `GET /api/v1/waitlist`, `DELETE /api/v1/waitlist/:id` — xem/hủy yêu cầu chờ.

## Mã lỗi

- `400`: dữ liệu đầu vào/ENUM không hợp lệ.
- `401` / `403`: token thiếu hoặc role không được phép.
- `404`: không tìm thấy bản ghi.
- `409`: trùng dữ liệu, lịch học, sĩ số hoặc trạng thái không cho phép.
- `202`: đăng ký được đưa vào danh sách chờ.

## Học viên đăng ký khóa học và thanh toán thử

`POST /api/v1/student-purchases/course` là luồng bán trực tiếp của nhân viên: tạo đăng ký lớp, hóa đơn học phí và giao dịch thanh toán trong một transaction.

Ứng dụng học viên dùng `POST /api/v1/student-purchases/requests` để gửi yêu cầu đăng ký kèm phương thức thanh toán. Yêu cầu được đưa vào trạng thái `cho_xac_nhan`; chưa ghi danh vào lớp và chưa tạo hóa đơn cho đến khi nhân viên xác nhận tại trang **Bán khóa học**. Nhân viên dùng `GET /api/v1/student-purchases/requests` để xem hàng chờ, `POST /api/v1/student-purchases/requests/:id/approve` để xác nhận hoặc `/reject` để từ chối. Học viên có thể tra yêu cầu của mình bằng `GET /api/v1/student-purchases/requests?ma_hoc_vien=:id`.

## Báo cáo tài chính và cài đặt quản trị

Sau khi cập nhật code, tạo bảng hoàn tiền, cơ sở và cấu hình bằng lệnh `npm run db:migrate:finance` trong thư mục `PJ/BE`.

- `GET /api/v1/admin/finance?from=YYYY-MM-DD&to=YYYY-MM-DD` — doanh thu thuần, khoản thu theo ngày, công nợ hiện tại, hoàn tiền và danh sách hóa đơn.
- `POST /api/v1/admin/refunds` — tạo yêu cầu hoàn tiền với `{ "ma_hoa_don": 1, "so_tien": 500000, "ly_do": "..." }`.
- `POST /api/v1/admin/refunds/:id/approve` hoặc `/reject` — xử lý yêu cầu hoàn tiền đang chờ.
- `GET /api/v1/admin/settings`, `PUT /api/v1/admin/settings` — đọc/lưu cấu hình trung tâm.
- `POST /api/v1/admin/branches`, `PATCH /api/v1/admin/branches/:id` — thêm/cập nhật cơ sở.

Áp dụng `migrations/003_course_purchase_requests.sql` vào database hiện có để tạo bảng hàng chờ xác nhận.

Body mẫu:
```json
{ "ma_hoc_vien": 1, "ma_khoa_hoc": 1, "ma_lop_hoc": 1, "phuong_thuc": "chuyen_khoan" }
```

`phuong_thuc` nhận `chuyen_khoan`, `the_ngan_hang` hoặc `vi_dieu_tu`. Backend tự lấy học phí trong cơ sở dữ liệu; kiểm tra trạng thái khóa/lớp, lớp thuộc khóa, sĩ số, đăng ký trùng và lịch học. Lỗi nào cũng rollback toàn bộ đăng ký, hóa đơn và thanh toán. Đây là giao dịch mô phỏng, không kết nối ngân hàng/VNPay và không trừ tiền thật.

## Mobile giáo viên

Trước khi dùng các API dưới đây, áp dụng migration `migrations/002_teacher_mobile.sql` vào database hiện tại. Chế độ giáo viên trên Mobile là demo, chọn hồ sơ thay vì đăng nhập.

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/api/v1/teacher-mobile/teachers` | Danh sách hồ sơ giáo viên demo |
| GET | `/api/v1/teacher-mobile/teachers/:teacherId/classes` | Lịch và lớp được phân công |
| GET | `/api/v1/teacher-mobile/teachers/:teacherId/classes/:classId/students?date=YYYY-MM-DD` | Danh sách học viên, điểm danh ngày đó, điểm đã nhập |
| POST | `/api/v1/teacher-mobile/teachers/:teacherId/classes/:classId/attendance` | Lưu điểm danh theo buổi/ngày |
| POST | `/api/v1/teacher-mobile/teachers/:teacherId/classes/:classId/grades` | Nhập kết quả học tập |
| GET | `/api/v1/teacher-mobile/teachers/:teacherId/assigned-courses` | Khóa học giáo viên đang được phân công |
| POST | `/api/v1/teacher-mobile/teachers/:teacherId/class-requests` | Gửi yêu cầu mở lớp hoặc đổi lịch/phòng |
| GET | `/api/v1/teacher-mobile/class-requests` | Danh sách yêu cầu cho trang vận hành |
| POST | `/api/v1/teacher-mobile/class-requests/:requestId/approve` | Duyệt và áp dụng lịch/phòng hoặc tạo lớp |
| POST | `/api/v1/teacher-mobile/class-requests/:requestId/reject` | Từ chối yêu cầu |

The demo teacher APIs are open for local testing, consistent with the other development endpoints. Add authentication and role checks before deployment.
