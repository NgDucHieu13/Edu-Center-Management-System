# Edu Center Management System

Hệ thống quản lý trung tâm tiếng Anh, được xây dựng trong khuôn khổ Đồ án 4. Dự án hỗ trợ quản lý hoạt động đào tạo, từ hồ sơ học viên, giáo viên, khóa học và lớp học đến đăng ký học, theo dõi học phí và kết quả học tập.

Hệ thống gồm **trang quản trị web** dành cho quản trị viên, nhân viên và **ứng dụng di động** phục vụ học viên, giáo viên, cùng sử dụng API và cơ sở dữ liệu MySQL.

## Chức năng chính

### Trang quản trị

- Xem tổng quan tình hình hoạt động của trung tâm.
- Quản lý tài khoản, vai trò người dùng, hồ sơ học viên và giáo viên.
- Quản lý khóa học, lớp học, phòng học và lịch học.
- Đăng ký học, theo dõi danh sách chờ và xử lý yêu cầu điều chỉnh đăng ký.
- Xét duyệt yêu cầu mua khóa học và yêu cầu mở lớp, đổi phòng hoặc lịch học của giáo viên.
- Theo dõi tài chính, xử lý yêu cầu hoàn tiền và cấu hình thông tin cơ sở.

### Ứng dụng di động

- **Học viên:** xem khóa học, lớp học, lịch sử học tập và thanh toán; đăng ký khóa học với quy trình thanh toán mô phỏng.
- **Giáo viên:** xem lớp được phân công, danh sách học viên và lịch dạy; điểm danh, nhập điểm và gửi yêu cầu điều chỉnh lớp học.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Backend | Node.js, Express, mysql2 |
| Trang quản trị | React, Vite, Lucide React |
| Ứng dụng di động | React Native, Expo |
| Cơ sở dữ liệu | MySQL |
| Tiện ích xác thực | JSON Web Token (JWT), bcrypt |

## Cấu trúc dự án

```text
.
├── BE/                 # API và xử lý nghiệp vụ
│   ├── controllers/    # Xử lý yêu cầu
│   ├── models/         # Truy vấn dữ liệu
│   ├── routes/         # Định nghĩa endpoint
│   ├── services/       # Nghiệp vụ đăng ký, mua khóa học
│   ├── migrations/     # Cập nhật cơ sở dữ liệu
│   └── sqll.sql        # Khởi tạo cơ sở dữ liệu
├── FE/
│   ├── Admin/          # Trang quản trị React
│   └── Mobile/         # Ứng dụng React Native/Expo
└── docs/               # Đặc tả, sơ đồ, báo cáo và thiết kế giao diện
```

## Hướng dẫn chạy

Cần cài Node.js, npm và MySQL. Để chạy ứng dụng di động, sử dụng Expo Go hoặc Android Emulator.

### 1. Tải mã nguồn và tạo cơ sở dữ liệu

```bash
git clone https://github.com/NgDucHieu13/Edu-Center-Management-System.git
cd Edu-Center-Management-System
```

Chạy [`BE/sqll.sql`](BE/sqll.sql) bằng MySQL Workbench để tạo database. Sau đó chọn database `quan_ly_lop_hoc_tieng_anh` và chạy các file SQL trong [`BE/migrations/`](BE/migrations/) theo thứ tự `002`, `003`, `004` để bổ sung các bảng cho chức năng mở rộng.

### 2. Chạy backend

Sao chép `BE/.env.example` thành `BE/.env`, cập nhật thông tin kết nối MySQL và đặt `JWT_SECRET`.

```bash
cd BE
npm install
npm run db:check
npm run dev
```

Backend mặc định chạy tại `http://localhost:3000`, API tại `/api/v1`. Kiểm tra kết nối bằng `http://localhost:3000/health`.

### 3. Chạy trang quản trị

Mở terminal mới tại thư mục gốc của repo:

```bash
cd FE/Admin
npm install
npm run dev
```

Truy cập địa chỉ Vite hiển thị trong terminal, thường là `http://localhost:5173`. Có thể cấu hình `VITE_API_URL` trong `.env` theo file `.env.example`.

### 4. Chạy ứng dụng di động

Sao chép `FE/Mobile/.env.example` thành `FE/Mobile/.env` và cấu hình `EXPO_PUBLIC_API_URL`:

- Android Emulator: `http://10.0.2.2:3000/api/v1`.
- Điện thoại thật: dùng IPv4 LAN của máy chạy backend; điện thoại và máy tính cần cùng mạng Wi-Fi.

Mở terminal mới tại thư mục gốc của repo:

```bash
cd FE/Mobile
npm install
npm start
```

Quét mã QR bằng Expo Go hoặc nhấn `a` để mở Android Emulator.

## Trạng thái phát triển

Dự án hiện phục vụ học tập và demo nội bộ. Ứng dụng di động cho phép chọn hồ sơ, chuyển chế độ học viên/giáo viên mà chưa cần đăng nhập; nhiều API đang mở để thử nghiệm giao diện. Các tiện ích JWT và bcrypt đã có trong backend, nhưng luồng xác thực và kiểm soát quyền truy cập cần được hoàn thiện trước khi triển khai thực tế. Thanh toán hiện là mô phỏng, không thực hiện giao dịch tiền thật.

Các file `.env`, `node_modules`, log và cache được bỏ qua khi đưa mã nguồn lên Git. Sử dụng các file `.env.example` để cấu hình môi trường riêng.

## Tài liệu trong repo

- [Hướng dẫn backend](BE/README.md) và [tài liệu API](BE/API.md).
- [Hướng dẫn trang quản trị](FE/Admin/README.md).
- [Hướng dẫn ứng dụng di động](FE/Mobile/README.md).
- [Đặc tả, báo cáo và thiết kế](docs/).
