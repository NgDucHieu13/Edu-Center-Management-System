CREATE TABLE IF NOT EXISTS hoan_tien (
  ma_hoan_tien INT AUTO_INCREMENT PRIMARY KEY,
  ma_hoa_don INT NOT NULL,
  so_tien DECIMAL(12,0) NOT NULL,
  ly_do VARCHAR(500) NOT NULL,
  trang_thai ENUM('cho_duyet','da_hoan','tu_choi') NOT NULL DEFAULT 'cho_duyet',
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_xu_ly DATETIME NULL,
  CONSTRAINT fk_hoantien_hoadon FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS co_so (
  ma_co_so INT AUTO_INCREMENT PRIMARY KEY,
  ten_co_so VARCHAR(150) NOT NULL,
  dia_chi VARCHAR(255) NULL,
  so_dien_thoai VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  trang_thai ENUM('hoat_dong','tam_dung') NOT NULL DEFAULT 'hoat_dong',
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cau_hinh_he_thong (
  khoa VARCHAR(100) PRIMARY KEY,
  gia_tri TEXT NULL,
  cap_nhat_luc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO co_so (ten_co_so, dia_chi, trang_thai)
SELECT 'Cơ sở chính', 'Chưa cập nhật địa chỉ', 'hoat_dong'
WHERE NOT EXISTS (SELECT 1 FROM co_so);

INSERT INTO cau_hinh_he_thong (khoa, gia_tri) VALUES
  ('ten_trung_tam', 'ECMS Pro'),
  ('email_lien_he', ''),
  ('so_dien_thoai_lien_he', ''),
  ('han_thanh_toan_mac_dinh', '7'),
  ('don_vi_tien_te', 'VND')
ON DUPLICATE KEY UPDATE khoa = VALUES(khoa);
