-- ============================================================
-- 1. TẠO CƠ SỞ DỮ LIỆU
-- ============================================================
CREATE DATABASE IF NOT EXISTS quan_ly_lop_hoc_tieng_anh
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE quan_ly_lop_hoc_tieng_anh;

-- ============================================================
-- 2. NHÓM TÀI KHOẢN & PHÂN QUYỀN
-- ============================================================

CREATE TABLE nguoi_dung (
    ma_nguoi_dung INT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(100) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    so_dien_thoai VARCHAR(20) UNIQUE,
    anh_dai_dien VARCHAR(500),
    vai_tro ENUM('admin', 'nhan_vien', 'giao_vien', 'hoc_vien') NOT NULL,
    trang_thai ENUM('hoat_dong', 'khoa') DEFAULT 'hoat_dong',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 3. NHÓM CON NGƯỜI (HỌC VIÊN & GIÁO VIÊN)
-- ============================================================

CREATE TABLE hoc_vien (
    ma_hoc_vien INT AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung INT UNIQUE NULL,
    ho_ten VARCHAR(255) NOT NULL,
    ngay_sinh DATE,
    gioi_tinh ENUM('Nam', 'Nữ', 'Khác'),
    so_dien_thoai VARCHAR(20),
    email VARCHAR(255),
    dia_chi VARCHAR(255),
    trinh_do_hien_tai VARCHAR(20), -- A1, A2, B1, B2, C1, C2, IELTS 5.0,...
    muc_tieu_hoc_tap VARCHAR(255), -- Giao tiếp, IELTS, TOEIC,...
    trang_thai ENUM('tiem_nang', 'dang_hoc', 'tam_nghi', 'hoan_thanh', 'da_nghi') DEFAULT 'tiem_nang',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hocvien_user FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE giao_vien (
    ma_giao_vien INT AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung INT UNIQUE NULL,
    ho_ten VARCHAR(255) NOT NULL,
    so_dien_thoai VARCHAR(20),
    email VARCHAR(255),
    chuyen_mon VARCHAR(255), -- IELTS, Giao tiếp, Kids...
    gioi_thieu TEXT,
    trang_thai ENUM('dang_lam', 'nghi_viec') DEFAULT 'dang_lam',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_giaovien_user FOREIGN KEY (ma_nguoi_dung) REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 4. NHÓM KHÓA HỌC, LỚP HỌC & LỊCH HỌC
-- ============================================================

CREATE TABLE khoa_hoc (
    ma_khoa_hoc INT AUTO_INCREMENT PRIMARY KEY,
    ma_code_khoa_hoc VARCHAR(50) NOT NULL UNIQUE,
    ten_khoa_hoc VARCHAR(255) NOT NULL,
    trinh_do VARCHAR(20),
    loai_khoa_hoc ENUM('giao_tiep', 'ielts', 'toeic', 'kids', 'business') NOT NULL,
    hoc_phi DECIMAL(12, 0) NOT NULL,
    thoi_luong_tuan INT NOT NULL,
    tong_so_buoi INT NOT NULL,
    mo_ta TEXT,
    trang_thai ENUM('dang_mo', 'ngung_mo') DEFAULT 'dang_mo',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE phong_hoc (
    ma_phong INT AUTO_INCREMENT PRIMARY KEY,
    ten_phong VARCHAR(50) NOT NULL UNIQUE,
    suc_chua INT NOT NULL DEFAULT 20,
    trang_thai ENUM('khong_lich', 'co_lich', 'bao_tri') DEFAULT 'khong_lich',
    mo_ta TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE lop_hoc (
    ma_lop_hoc INT AUTO_INCREMENT PRIMARY KEY,
    ma_khoa_hoc INT NOT NULL,
    ma_code_lop VARCHAR(50) NOT NULL UNIQUE,
    ma_giao_vien INT,
    ma_phong INT NULL,
    phong_hoc VARCHAR(50),
    si_so_toi_da INT NOT NULL DEFAULT 20,
    si_so_hien_tai INT NOT NULL DEFAULT 0,
    ngay_bat_dau DATE,
    ngay_ket_thuc DATE,
    trang_thai ENUM('dang_mo', 'du_si_so', 'dang_hoc', 'da_ket_thuc', 'huy') DEFAULT 'dang_mo',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lophoc_khoahoc FOREIGN KEY (ma_khoa_hoc) REFERENCES khoa_hoc(ma_khoa_hoc),
    CONSTRAINT fk_lophoc_giaovien FOREIGN KEY (ma_giao_vien) REFERENCES giao_vien(ma_giao_vien),
    CONSTRAINT fk_lophoc_phonghoc FOREIGN KEY (ma_phong) REFERENCES phong_hoc(ma_phong)
) ENGINE=InnoDB;

CREATE TABLE khung_gio_hoc (
    ma_khung_gio INT AUTO_INCREMENT PRIMARY KEY,
    ma_lop_hoc INT NOT NULL,
    thu_trong_tuan ENUM('Thu2', 'Thu3', 'Thu4', 'Thu5', 'Thu6', 'Thu7', 'ChuNhat') NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    ma_phong INT NULL,
    phong_hoc VARCHAR(50),
    CONSTRAINT fk_khunggio_lophoc FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc) ON DELETE CASCADE,
    CONSTRAINT fk_khunggio_phonghoc FOREIGN KEY (ma_phong) REFERENCES phong_hoc(ma_phong)
) ENGINE=InnoDB;

CREATE TABLE buoi_hoc (
    ma_buoi_hoc INT AUTO_INCREMENT PRIMARY KEY,
    ma_lop_hoc INT NOT NULL,
    ma_giao_vien INT,
    ngay_hoc DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    ma_phong INT NULL,
    phong_hoc VARCHAR(50),
    chu_de VARCHAR(255),
    trang_thai ENUM('sap_toi', 'da_hoc', 'da_huy') DEFAULT 'sap_toi',
    CONSTRAINT fk_buoihoc_lophoc FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc) ON DELETE CASCADE,
    CONSTRAINT fk_buoihoc_giaovien FOREIGN KEY (ma_giao_vien) REFERENCES giao_vien(ma_giao_vien),
    CONSTRAINT fk_buoihoc_phonghoc FOREIGN KEY (ma_phong) REFERENCES phong_hoc(ma_phong)
) ENGINE=InnoDB;

-- ============================================================
-- 5. NHÓM ĐĂNG KÝ, XẾP LỚP & BẢO LƯU
-- ============================================================

CREATE TABLE danh_sach_cho (
    ma_danh_sach_cho INT AUTO_INCREMENT PRIMARY KEY,
    ma_hoc_vien INT NOT NULL,
    ma_khoa_hoc INT NOT NULL,
    ma_lop_mong_muon INT NULL,
    ngay_dang_ky DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('cho', 'da_xep_lop', 'huy') DEFAULT 'cho',
    ghi_chu TEXT,
    CONSTRAINT fk_danhsachcho_hocvien FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien) ON DELETE CASCADE,
    CONSTRAINT fk_danhsachcho_khoahoc FOREIGN KEY (ma_khoa_hoc) REFERENCES khoa_hoc(ma_khoa_hoc),
    CONSTRAINT fk_danhsachcho_lophoc FOREIGN KEY (ma_lop_mong_muon) REFERENCES lop_hoc(ma_lop_hoc)
) ENGINE=InnoDB;

CREATE TABLE dang_ky_hoc (
    ma_dang_ky INT AUTO_INCREMENT PRIMARY KEY,
    ma_hoc_vien INT NOT NULL,
    ma_lop_hoc INT NOT NULL,
    ngay_dang_ky DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('dang_hoc', 'hoan_thanh', 'bao_luu', 'chuyen_lop', 'nghi') DEFAULT 'dang_hoc',
    ghi_chu VARCHAR(255),
    CONSTRAINT fk_dangky_hocvien FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien) ON DELETE CASCADE,
    CONSTRAINT fk_dangky_lophoc FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc),
    CONSTRAINT uk_hocvien_lophoc UNIQUE (ma_hoc_vien, ma_lop_hoc)
) ENGINE=InnoDB;

CREATE TABLE dieu_chinh_dang_ky (
    ma_dieu_chinh INT AUTO_INCREMENT PRIMARY KEY,
    ma_dang_ky INT NOT NULL,
    loai_dieu_chinh ENUM('bao_luu', 'chuyen_lop', 'huy_dang_ky') NOT NULL,
    tu_lop_id INT,
    den_lop_id INT,
    ngay_yeu_cau DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_hieu_luc DATE,
    ly_do TEXT,
    trang_thai ENUM('cho_duyet', 'da_duyet', 'tu_choi') DEFAULT 'cho_duyet',
    ma_nguoi_duyet INT,
    CONSTRAINT fk_dieuchinh_dangky FOREIGN KEY (ma_dang_ky) REFERENCES dang_ky_hoc(ma_dang_ky) ON DELETE CASCADE,
    CONSTRAINT fk_dieuchinh_nguoiduyet FOREIGN KEY (ma_nguoi_duyet) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;

-- ============================================================
-- 6. KẾT QUẢ HỌC TẬP & ĐÁNH GIÁ KHÓA HỌC
-- ============================================================

CREATE TABLE ket_qua_hoc_tap (
    ma_ket_qua INT AUTO_INCREMENT PRIMARY KEY,
    ma_dang_ky INT NOT NULL,
    ten_bai_kiem_tra VARCHAR(255) NOT NULL,
    diem_so DECIMAL(4,1) NOT NULL,
    diem_toi_da DECIMAL(4,1) DEFAULT 10.0,
    ngay_cham DATE,
    ma_giao_vien_cham INT,
    ghi_chu TEXT,
    CONSTRAINT fk_ketqua_dangky FOREIGN KEY (ma_dang_ky) REFERENCES dang_ky_hoc(ma_dang_ky) ON DELETE CASCADE,
    CONSTRAINT fk_ketqua_giaovien FOREIGN KEY (ma_giao_vien_cham) REFERENCES giao_vien(ma_giao_vien)
) ENGINE=InnoDB;

-- Teacher mobile app: per-session attendance and teacher requests for class setup/changes.
CREATE TABLE diem_danh (
    ma_diem_danh INT AUTO_INCREMENT PRIMARY KEY,
    ma_lop_hoc INT NOT NULL,
    ma_hoc_vien INT NOT NULL,
    ma_giao_vien INT NOT NULL,
    ngay_hoc DATE NOT NULL,
    trang_thai ENUM('co_mat', 'vang', 'di_muon', 'co_phep') NOT NULL DEFAULT 'co_mat',
    ghi_chu VARCHAR(500),
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_diemdanh_lop_hv_ngay (ma_lop_hoc, ma_hoc_vien, ngay_hoc),
    CONSTRAINT fk_diemdanh_lop FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc) ON DELETE CASCADE,
    CONSTRAINT fk_diemdanh_hv FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien) ON DELETE CASCADE,
    CONSTRAINT fk_diemdanh_gv FOREIGN KEY (ma_giao_vien) REFERENCES giao_vien(ma_giao_vien)
) ENGINE=InnoDB;

CREATE TABLE yeu_cau_lop_giao_vien (
    ma_yeu_cau INT AUTO_INCREMENT PRIMARY KEY,
    ma_giao_vien INT NOT NULL,
    loai_yeu_cau ENUM('mo_lop', 'doi_lich_phong') NOT NULL,
    ma_lop_hoc INT NULL,
    ma_khoa_hoc INT NOT NULL,
    ma_code_lop VARCHAR(50) NULL,
    ma_phong INT NULL,
    ngay_bat_dau DATE NULL,
    ngay_ket_thuc DATE NULL,
    lich_hoc JSON NOT NULL,
    ly_do TEXT,
    trang_thai ENUM('cho_duyet', 'da_duyet', 'tu_choi') NOT NULL DEFAULT 'cho_duyet',
    phan_hoi TEXT,
    ma_nguoi_duyet INT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_xu_ly DATETIME NULL,
    CONSTRAINT fk_yclop_gv FOREIGN KEY (ma_giao_vien) REFERENCES giao_vien(ma_giao_vien),
    CONSTRAINT fk_yclop_lop FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc) ON DELETE SET NULL,
    CONSTRAINT fk_yclop_khoa FOREIGN KEY (ma_khoa_hoc) REFERENCES khoa_hoc(ma_khoa_hoc),
    CONSTRAINT fk_yclop_phong FOREIGN KEY (ma_phong) REFERENCES phong_hoc(ma_phong),
    CONSTRAINT fk_yclop_duyet FOREIGN KEY (ma_nguoi_duyet) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;

CREATE TABLE danh_gia_khoa_hoc (
    ma_danh_gia INT AUTO_INCREMENT PRIMARY KEY,
    ma_hoc_vien INT NOT NULL,
    ma_khoa_hoc INT NOT NULL,
    ma_lop_hoc INT,
    so_sao INT CHECK (so_sao BETWEEN 1 AND 5),
    nhan_xet TEXT,
    ngay_danh_gia DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_danhgia_hocvien FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien) ON DELETE CASCADE,
    CONSTRAINT fk_danhgia_khoahoc FOREIGN KEY (ma_khoa_hoc) REFERENCES khoa_hoc(ma_khoa_hoc),
    CONSTRAINT fk_danhgia_lophoc FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc)
) ENGINE=InnoDB;

-- ============================================================
-- 7. NHÓM SẢN PHẨM / GIÁO TRÌNH & BÁN HÀNG
-- ============================================================

CREATE TABLE san_pham (
    ma_san_pham INT AUTO_INCREMENT PRIMARY KEY,
    ma_code_san_pham VARCHAR(50) UNIQUE,
    ten_san_pham VARCHAR(255) NOT NULL,
    loai_san_pham VARCHAR(100),
    trinh_do_phu_hop VARCHAR(20),
    don_gia DECIMAL(12, 0) NOT NULL,
    so_luong_ton INT DEFAULT 0,
    trang_thai ENUM('dang_ban', 'ngung_ban') DEFAULT 'dang_ban',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE don_hang (
    ma_don_hang INT AUTO_INCREMENT PRIMARY KEY,
    ma_code_don_hang VARCHAR(50) UNIQUE,
    ma_hoc_vien INT NOT NULL,
    ma_nhan_vien INT,
    loai_don_hang ENUM('tai_quay', 'kem_dang_ky_khoa') DEFAULT 'tai_quay',
    tong_tien DECIMAL(12, 0) NOT NULL,
    tien_giam_gia DECIMAL(12, 0) DEFAULT 0,
    tien_thanhtoan DECIMAL(12, 0) NOT NULL,
    trang_thai ENUM('cho_thanh_toan', 'da_thanh_toan', 'da_huy') DEFAULT 'cho_thanh_toan',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donhang_hocvien FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien) ON DELETE CASCADE,
    CONSTRAINT fk_donhang_nhanvien FOREIGN KEY (ma_nhan_vien) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;

CREATE TABLE chi_tiet_don_hang (
    ma_chi_tiet_don INT AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang INT NOT NULL,
    ma_san_pham INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    don_gia DECIMAL(12, 0) NOT NULL,
    thanh_tien DECIMAL(12, 0) NOT NULL,
    CONSTRAINT fk_chitiet_donhang FOREIGN KEY (ma_don_hang) REFERENCES don_hang(ma_don_hang) ON DELETE CASCADE,
    CONSTRAINT fk_chitiet_sanpham FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
) ENGINE=InnoDB;

-- ============================================================
-- 8. NHÓM HÓA ĐƠN, THANH TOÁN & CÔNG NỢ
-- ============================================================

CREATE TABLE hoa_don (
    ma_hoa_don INT AUTO_INCREMENT PRIMARY KEY,
    ma_code_hoa_don VARCHAR(50) UNIQUE,
    ma_hoc_vien INT NOT NULL,
    loai_hoa_don ENUM('hoc_phi', 'don_hang') NOT NULL,
    ma_tham_chieu INT NOT NULL,
    tong_tien DECIMAL(12, 0) NOT NULL,
    so_tien_da_nop DECIMAL(12, 0) DEFAULT 0,
    so_tien_con_no DECIMAL(12, 0) NOT NULL,
    han_thanh_toan DATE,
    trang_thai ENUM('chua_thanh_toan', 'mot_phan', 'da_thanh_toan', 'qua_han') DEFAULT 'chua_thanh_toan',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hoadon_hocvien FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE thanh_toan (
    ma_thanh_toan INT AUTO_INCREMENT PRIMARY KEY,
    ma_code_thanh_toan VARCHAR(50) UNIQUE,
    ma_hoa_don INT NOT NULL,
    so_tien DECIMAL(12, 0) NOT NULL,
    phuong_thuc ENUM('tien_mat', 'chuyen_khoan', 'the_ngan_hang', 'vi_dieu_tu') NOT NULL,
    ma_nhan_vien INT,
    ma_giao_dich_vnpay VARCHAR(100),
    ngay_thanhtoan DATETIME DEFAULT CURRENT_TIMESTAMP,
    ghi_chu VARCHAR(255),
    CONSTRAINT fk_thanhtoan_hoadon FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don) ON DELETE CASCADE,
    CONSTRAINT fk_thanhtoan_nhanvien FOREIGN KEY (ma_nhan_vien) REFERENCES nguoi_dung(ma_nguoi_dung)
) ENGINE=InnoDB;
