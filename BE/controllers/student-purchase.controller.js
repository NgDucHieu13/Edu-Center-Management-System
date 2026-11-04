const Purchase = require('../services/student-purchase.service');

const METHODS = new Set(['chuyen_khoan', 'the_ngan_hang', 'vi_dieu_tu']);
const positiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

async function checkout(req, res) {
  const { ma_hoc_vien, ma_khoa_hoc, ma_lop_hoc, phuong_thuc } = req.body || {};
  if (![ma_hoc_vien, ma_khoa_hoc, ma_lop_hoc].every(positiveInteger)) {
    return res.status(400).json({ message: 'ma_hoc_vien, ma_khoa_hoc va ma_lop_hoc phải là số nguyên dương.' });
  }
  if (!METHODS.has(phuong_thuc)) {
    return res.status(400).json({ message: 'phuong_thuc phải là chuyen_khoan, the_ngan_hang hoặc vi_dieu_tu.' });
  }
  try {
    const result = await Purchase.purchaseCourse({
      studentId: Number(ma_hoc_vien),
      courseId: Number(ma_khoa_hoc),
      classId: Number(ma_lop_hoc),
      paymentMethod: phuong_thuc,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.status ? error.message : 'Không thể hoàn tất đăng ký và thanh toán.',
    });
  }
}

async function requestCheckout(req, res) {
  const { ma_hoc_vien, ma_khoa_hoc, ma_lop_hoc, phuong_thuc } = req.body || {};
  if (![ma_hoc_vien, ma_khoa_hoc, ma_lop_hoc].every(positiveInteger)) return res.status(400).json({ message: 'ma_hoc_vien, ma_khoa_hoc va ma_lop_hoc phải là số nguyên dương.' });
  if (!METHODS.has(phuong_thuc)) return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ.' });
  try {
    const data = await Purchase.createPurchaseRequest({ studentId: Number(ma_hoc_vien), courseId: Number(ma_khoa_hoc), classId: Number(ma_lop_hoc), paymentMethod: phuong_thuc });
    return res.status(201).json({ data });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Không thể tạo yêu cầu đăng ký.' });
  }
}

async function listRequests(req, res) {
  try {
    const studentId = req.query.ma_hoc_vien ? Number(req.query.ma_hoc_vien) : undefined;
    return res.json({ data: await Purchase.listPurchaseRequests({ studentId }) });
  } catch (_error) { return res.status(500).json({ message: 'Không thể tải yêu cầu bán khóa học.' }); }
}

async function reviewRequest(req, res) {
  try {
    const action = req.params.action;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Thao tác không hợp lệ.' });
    const data = await Purchase.reviewPurchaseRequest(Number(req.params.id), action);
    return res.json({ data });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Không thể xử lý yêu cầu.' });
  }
}

module.exports = { checkout, requestCheckout, listRequests, reviewRequest };
