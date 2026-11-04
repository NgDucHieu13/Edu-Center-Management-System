CREATE TABLE IF NOT EXISTS diem_danh (
  ma_diem_danh INT AUTO_INCREMENT PRIMARY KEY,
  ma_lop_hoc INT NOT NULL,
  ma_hoc_vien INT NOT NULL,
  ma_giao_vien INT NOT NULL,
  ngay_hoc DATE NOT NULL,
  trang_thai ENUM('co_mat','vang','di_muon','co_phep') NOT NULL DEFAULT 'co_mat',
  ghi_chu VARCHAR(500),
  ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_diemdanh_lop_hv_ngay (ma_lop_hoc, ma_hoc_vien, ngay_hoc),
  CONSTRAINT fk_diemdanh_lop FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc) ON DELETE CASCADE,
  CONSTRAINT fk_diemdanh_hv FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien) ON DELETE CASCADE,
  CONSTRAINT fk_diemdanh_gv FOREIGN KEY (ma_giao_vien) REFERENCES giao_vien(ma_giao_vien)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS yeu_cau_lop_giao_vien (
  ma_yeu_cau INT AUTO_INCREMENT PRIMARY KEY,
  ma_giao_vien INT NOT NULL,
  loai_yeu_cau ENUM('mo_lop','doi_lich_phong') NOT NULL,
  ma_lop_hoc INT NULL,
  ma_khoa_hoc INT NOT NULL,
  ma_code_lop VARCHAR(50) NULL,
  ma_phong INT NULL,
  ngay_bat_dau DATE NULL,
  ngay_ket_thuc DATE NULL,
  lich_hoc JSON NOT NULL,
  ly_do TEXT,
  trang_thai ENUM('cho_duyet','da_duyet','tu_choi') NOT NULL DEFAULT 'cho_duyet',
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
