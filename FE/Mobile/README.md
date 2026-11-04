# ECMS Mobile (Expo)

App React Native/Expo dùng để xem dữ liệu thật từ backend cho mục đích demo. Chưa có đăng nhập; màn Cá nhân cho phép chọn hồ sơ học viên trong database.

## Chạy thử

1. Chạy MySQL và backend tại `PJ/BE` bằng `npm run dev`.
2. Tạo `.env` cạnh `package.json` từ `.env.example`.
   - Android Emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1`
   - Expo Go trên điện thoại: thay bằng IPv4 LAN của máy tính, ví dụ `http://192.168.1.20:3000/api/v1`; máy tính và điện thoại cần chung Wi-Fi.
3. Cài dependency bằng `npm install`, sau đó chạy `npx expo start`.
4. Quét QR bằng Expo Go hoặc nhấn `a` để mở Android Emulator.

## Màn hình demo

- Tổng quan học viên, khóa học và lớp.
- Danh sách lớp, giáo viên, phòng, sĩ số và lịch học.
- Danh sách khóa học, học phí và trình độ.
- Lịch sử học tập, thanh toán theo hồ sơ được chọn.
- Chọn hồ sơ học viên để thử dữ liệu mà không cần đăng nhập.

API dùng GET cho dữ liệu. Chế độ không đăng nhập chỉ phù hợp để test nội bộ; không đưa bản demo này lên môi trường công khai.

Trong tab **Khóa học**, chọn **Đăng ký khóa học**, chọn lớp còn chỗ và phương thức thanh toán mô phỏng. Backend tạo đăng ký, hóa đơn và giao dịch thử trong một transaction; chức năng này không trừ tiền thật và đang mở cho demo không đăng nhập.
## Teacher mobile

The Expo app has a demo teacher mode (use the role toggle in the header; no login is required). Teachers can review assigned classes and schedules, view enrolled learners, record daily attendance, add assessment scores, and submit requests to open a class for an assigned course or change an assigned class room/schedule. Requests are reviewed from **Admin → Quản lý Lớp học → Yêu cầu giáo viên**.

Apply `BE/migrations/002_teacher_mobile.sql` to the existing MySQL database before using teacher attendance and class requests. The migration adds the attendance and teacher class-request tables.
