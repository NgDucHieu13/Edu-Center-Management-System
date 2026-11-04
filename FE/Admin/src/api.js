const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload.message || `Yêu cầu thất bại (${response.status}).`, response.status);
  return payload;
}

export const api = {
  listCourses: () => request('/courses'),
  createCourse: (body) => request('/courses', { method: 'POST', body }),
  updateCourse: (id, body) => request(`/courses/${id}`, { method: 'PATCH', body }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  listClasses: () => request('/classes'),
  createClass: (body) => request('/classes', { method: 'POST', body }),
  updateClass: (id, body) => request(`/classes/${id}`, { method: 'PATCH', body }),
  listWaitlist: () => request('/waitlist'),
  listTeacherClassRequests: () => request('/teacher-mobile/class-requests'),
  approveTeacherClassRequest: (id, phan_hoi = '') => request(`/teacher-mobile/class-requests/${id}/approve`, { method: 'POST', body: { phan_hoi } }),
  rejectTeacherClassRequest: (id, phan_hoi = '') => request(`/teacher-mobile/class-requests/${id}/reject`, { method: 'POST', body: { phan_hoi } }),
  cancelWaitlist: (id) => request(`/waitlist/${id}`, { method: 'DELETE' }),
  listRooms: () => request('/phong-hoc'),
  createRoom: (body) => request('/phong-hoc', { method: 'POST', body }),
  updateRoom: (id, body) => request(`/phong-hoc/${id}`, { method: 'PATCH', body }),
  deleteRoom: (id) => request(`/phong-hoc/${id}`, { method: 'DELETE' }),
  listRegistrations: () => request('/registrations'),
  registerStudent: (body) => request('/registrations', { method: 'POST', body }),
  listUsers: () => request('/users'),
  createUser: (body) => request('/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PATCH', body }),
  lockUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  listTeachers: () => request('/teachers'),
  getTeacher: (id) => request(`/teachers/${id}`),
  getTeacherClasses: (id) => request(`/teachers/${id}/classes`),
  createTeacher: (body) => request('/teachers', { method: 'POST', body }),
  updateTeacher: (id, body) => request(`/teachers/${id}`, { method: 'PATCH', body }),
  deleteTeacher: (id) => request(`/teachers/${id}`, { method: 'DELETE' }),
  listStudents: () => request('/hoc-vien'),
  getStudentLearningHistory: (id) => request(`/hoc-vien/${id}/learning-history`),
  getStudentPaymentHistory: (id) => request(`/hoc-vien/${id}/payment-history`),
  sellCourse: (body) => request('/student-purchases/course', { method: 'POST', body }),
  listPurchaseRequests: () => request('/student-purchases/requests'),
  reviewPurchaseRequest: (id, action) => request(`/student-purchases/requests/${id}/${action}`, { method: 'POST' }),
  getFinanceReport: (from, to) => request(`/admin/finance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  createRefund: (body) => request('/admin/refunds', { method: 'POST', body }),
  reviewRefund: (id, action) => request(`/admin/refunds/${id}/${action}`, { method: 'POST', body: {} }),
  getSystemSettings: () => request('/admin/settings'),
  saveSystemSettings: (body) => request('/admin/settings', { method: 'PUT', body }),
  createBranch: (body) => request('/admin/branches', { method: 'POST', body }),
  updateBranch: (id, body) => request(`/admin/branches/${id}`, { method: 'PATCH', body }),
  createStudent: (body) => request('/hoc-vien', { method: 'POST', body }),
  updateStudent: (id, body) => request(`/hoc-vien/${id}`, { method: 'PATCH', body }),
  deleteStudent: (id) => request(`/hoc-vien/${id}`, { method: 'DELETE' }),
};

export { API_BASE };
