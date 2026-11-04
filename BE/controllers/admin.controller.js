const Model = require('../models/admin.model');
const endpoint = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'Lỗi máy chủ.' }); }
};
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const SETTING_KEYS = new Set(['ten_trung_tam', 'email_lien_he', 'so_dien_thoai_lien_he', 'han_thanh_toan_mac_dinh', 'don_vi_tien_te']);

const finance = endpoint(async (req, res) => {
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = `${defaultTo.slice(0, 8)}01`;
  const from = req.query.from || defaultFrom;
  const to = req.query.to || defaultTo;
  if (!validDate(from) || !validDate(to) || from > to) return res.status(400).json({ message: 'Khoảng ngày không hợp lệ.' });
  res.json({ data: await Model.getFinanceReport(from, to) });
});
const createRefund = endpoint(async (req, res) => {
  const { ma_hoa_don, so_tien, ly_do } = req.body || {};
  if (!Number.isInteger(Number(ma_hoa_don)) || Number(ma_hoa_don) < 1 || !Number.isFinite(Number(so_tien)) || Number(so_tien) <= 0 || !String(ly_do || '').trim()) return res.status(400).json({ message: 'Cần mã hóa đơn, số tiền hoàn dương và lý do.' });
  const id = await Model.createRefund({ ma_hoa_don: Number(ma_hoa_don), so_tien: Number(so_tien), ly_do: String(ly_do).trim() });
  res.status(201).json({ data: { ma_hoan_tien: id } });
});
const reviewRefund = endpoint(async (req, res) => {
  if (!['approve', 'reject'].includes(req.params.action)) return res.status(400).json({ message: 'Thao tác không hợp lệ.' });
  await Model.reviewRefund(Number(req.params.id), req.params.action);
  res.json({ message: 'Đã cập nhật yêu cầu hoàn tiền.' });
});
const settings = endpoint(async (_req, res) => res.json({ data: await Model.getSettings() }));
const saveSettings = endpoint(async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ message: 'Cấu hình không hợp lệ.' });
  if (Object.keys(req.body).some((key) => !SETTING_KEYS.has(key))) return res.status(400).json({ message: 'Có khóa cấu hình không được hỗ trợ.' });
  if (req.body.han_thanh_toan_mac_dinh !== undefined && (!Number.isInteger(Number(req.body.han_thanh_toan_mac_dinh)) || Number(req.body.han_thanh_toan_mac_dinh) < 1 || Number(req.body.han_thanh_toan_mac_dinh) > 90)) return res.status(400).json({ message: 'Hạn thanh toán phải từ 1 đến 90 ngày.' });
  await Model.saveSettings(req.body);
  res.json({ message: 'Đã lưu cấu hình.' });
});
const createBranch = endpoint(async (req, res) => {
  if (!String(req.body?.ten_co_so || '').trim()) return res.status(400).json({ message: 'Tên cơ sở là bắt buộc.' });
  const id = await Model.createBranch({ ...req.body, ten_co_so: req.body.ten_co_so.trim() });
  res.status(201).json({ data: { ma_co_so: id } });
});
const updateBranch = endpoint(async (req, res) => {
  if (req.body?.ten_co_so !== undefined && !String(req.body.ten_co_so).trim()) return res.status(400).json({ message: 'Tên cơ sở không được để trống.' });
  await Model.updateBranch(Number(req.params.id), req.body || {});
  res.json({ message: 'Đã cập nhật cơ sở.' });
});

module.exports = { finance, createRefund, reviewRefund, settings, saveSettings, createBranch, updateBranch };
