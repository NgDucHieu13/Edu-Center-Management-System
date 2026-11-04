CREATE TABLE IF NOT EXISTS yeu_cau_mua_khoa_hoc (
    ma_yeu_cau INT AUTO_INCREMENT PRIMARY KEY,
    ma_hoc_vien INT NOT NULL,
    ma_khoa_hoc INT NOT NULL,
    ma_lop_hoc INT NOT NULL,
    phuong_thuc ENUM('chuyen_khoan', 'the_ngan_hang', 'vi_dieu_tu') NOT NULL,
    so_tien DECIMAL(12,2) NOT NULL,
    trang_thai ENUM('cho_xac_nhan', 'da_xac_nhan', 'tu_choi') NOT NULL DEFAULT 'cho_xac_nhan',
    ma_hoa_don INT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_xu_ly DATETIME NULL,
    CONSTRAINT fk_yeucau_mua_hocvien FOREIGN KEY (ma_hoc_vien) REFERENCES hoc_vien(ma_hoc_vien),
    CONSTRAINT fk_yeucau_mua_khoahoc FOREIGN KEY (ma_khoa_hoc) REFERENCES khoa_hoc(ma_khoa_hoc),
    CONSTRAINT fk_yeucau_mua_lophoc FOREIGN KEY (ma_lop_hoc) REFERENCES lop_hoc(ma_lop_hoc),
    CONSTRAINT fk_yeucau_mua_hoadon FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don),
    INDEX idx_yeucau_mua_status (trang_thai, ngay_tao),
    INDEX idx_yeucau_mua_student (ma_hoc_vien, ma_khoa_hoc, trang_thai)
) ENGINE=InnoDB;
