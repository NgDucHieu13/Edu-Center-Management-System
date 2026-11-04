# Backend Quản lý Trung tâm Tiếng Anh

Backend Node.js/Express dùng MySQL (`mysql2` pool), JWT và bcrypt. Module CRUD mẫu là Học viên, ánh xạ theo `sqll.sql` hiện có.

## Khởi chạy

1. Chạy nội dung `sqll.sql` trong MySQL để tạo database và các bảng.
2. Sao chép `.env.example` thành `.env`, cập nhật `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; đặt `JWT_SECRET` ngẫu nhiên đủ mạnh.
3. Cài đặt và chạy:

```bash
npm install
npm run dev
```

Kiểm tra đăng nhập MySQL và liệt kê bảng bằng `npm run db:check`. Nếu MySQL báo `Access denied`, cập nhật `DB_USER`/`DB_PASSWORD` trong `.env`. Nếu đăng nhập thành công nhưng database chưa có bảng, chạy `sqll.sql` bằng MySQL Workbench rồi kiểm tra lại.

Server kiểm tra kết nối MySQL trước khi lắng nghe cổng. Health check `GET /health` trả `database: connected` hoặc HTTP 503 khi database không truy cập được. API học viên nằm tại `/api/v1/hoc-vien`.

## JWT

Middleware đọc `Authorization: Bearer <token>`. Payload tối thiểu phải có `sub` (mã người dùng) và `vai_tro` với một trong các giá trị `admin`, `nhan_vien`, `giao_vien`, `hoc_vien`. Có thể tạo token sau khi xác thực thông tin đăng nhập bằng `signAccessToken` trong `utils/token.js`. Mã hóa/so sánh mật khẩu bằng `hashPassword` và `comparePassword` từ `utils/password.js`.

## API mẫu

- `GET /api/v1/hoc-vien?page=1&limit=20` — danh sách (Admin, Nhân viên, Giáo viên)
- `GET /api/v1/hoc-vien/:id` — chi tiết (Admin, Nhân viên, Giáo viên)
- `POST /api/v1/hoc-vien` — tạo (Admin, Nhân viên)
- `PATCH /api/v1/hoc-vien/:id` — cập nhật (Admin, Nhân viên)
- `DELETE /api/v1/hoc-vien/:id` — xóa (Admin, Nhân viên)

Ví dụ body tạo:

```json
{
  "ho_ten": "Nguyễn An",
  "ngay_sinh": "2008-04-12",
  "gioi_tinh": "Nam",
  "email": "an@example.com",
  "trinh_do_hien_tai": "A2",
  "muc_tieu_hoc_tap": "Giao tiếp",
  "trang_thai": "tiem_nang"
}
```

SQL schema ban đầu chưa có kiểm tra đăng nhập hoặc cấp token. `utils/token.js` là helper để module Auth có thể cấp JWT sau này; mọi truy vấn SQL trong module mẫu dùng placeholder tham số.
