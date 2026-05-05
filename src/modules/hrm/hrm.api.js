import { API_BASE_URL } from '../../lib/api.js';

let _onSessionUpdate = null;

export function initHrmApi(onSessionUpdate) {
  _onSessionUpdate = onSessionUpdate;
}

async function hrmRequest(path, options = {}) {
  const session = window.__hrmSession;
  if (!session?.accessToken) throw new Error('Giriş tələb olunur');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Server əlaqəsi yoxdur');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const msg = payload?.message || `HTTP ${response.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }

  return payload?.data !== undefined ? payload.data : payload;
}

// ─── Employees ───────────────────────────────────────────────────────────────
export const hrmListEmployees = (query = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v && params.set(k, v));
  const qs = params.toString();
  return hrmRequest(`/hrm/employees${qs ? `?${qs}` : ''}`);
};

export const hrmGetEmployee = (id) => hrmRequest(`/hrm/employees/${id}`);

export const hrmCreateEmployee = (data) =>
  hrmRequest('/hrm/employees', { method: 'POST', body: JSON.stringify(data) });

export const hrmUpdateEmployee = (id, data) =>
  hrmRequest(`/hrm/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const hrmDeleteEmployee = (id) =>
  hrmRequest(`/hrm/employees/${id}`, { method: 'DELETE' });

// ─── Departments ─────────────────────────────────────────────────────────────
export const hrmListDepartments = () => hrmRequest('/hrm/departments');

export const hrmCreateDepartment = (data) =>
  hrmRequest('/hrm/departments', { method: 'POST', body: JSON.stringify(data) });

export const hrmUpdateDepartment = (id, data) =>
  hrmRequest(`/hrm/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const hrmDeleteDepartment = (id) =>
  hrmRequest(`/hrm/departments/${id}`, { method: 'DELETE' });

// ─── Attendance ───────────────────────────────────────────────────────────────
export const hrmListAttendance = (query = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => v && params.set(k, v));
  const qs = params.toString();
  return hrmRequest(`/hrm/attendance${qs ? `?${qs}` : ''}`);
};

export const hrmCheckIn = (data) =>
  hrmRequest('/hrm/attendance/check-in', { method: 'POST', body: JSON.stringify(data) });

export const hrmCheckOut = (data) =>
  hrmRequest('/hrm/attendance/check-out', { method: 'PUT', body: JSON.stringify(data) });

export const hrmManualAttendance = (data) =>
  hrmRequest('/hrm/attendance/manual', { method: 'POST', body: JSON.stringify(data) });

export const hrmMonthlyReport = (employeeId, year, month) =>
  hrmRequest(`/hrm/attendance/monthly/${employeeId}/${year}/${month}`);

// ─── Leave ────────────────────────────────────────────────────────────────────
export const hrmListLeaveRequests = () => hrmRequest('/hrm/leave-requests');

export const hrmCreateLeaveRequest = (data) =>
  hrmRequest('/hrm/leave-requests', { method: 'POST', body: JSON.stringify(data) });

export const hrmManagerApproveLeave = (id) =>
  hrmRequest(`/hrm/leave-requests/${id}/manager-approve`, { method: 'PATCH' });

export const hrmHrApproveLeave = (id) =>
  hrmRequest(`/hrm/leave-requests/${id}/hr-approve`, { method: 'PATCH' });

export const hrmRejectLeave = (id, rejectionReason) =>
  hrmRequest(`/hrm/leave-requests/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason }),
  });

export const hrmCancelLeave = (id) =>
  hrmRequest(`/hrm/leave-requests/${id}/cancel`, { method: 'PATCH' });

export const hrmLeaveBalances = (employeeId) =>
  hrmRequest(`/hrm/leave-requests/balances/${employeeId}`);

// ─── Payroll ──────────────────────────────────────────────────────────────────
export const hrmListPayrolls = () => hrmRequest('/hrm/payroll');

export const hrmGetPayroll = (id) => hrmRequest(`/hrm/payroll/${id}`);

export const hrmRunPayroll = (data) =>
  hrmRequest('/hrm/payroll/run', { method: 'POST', body: JSON.stringify(data) });

export const hrmApprovePayroll = (id) =>
  hrmRequest(`/hrm/payroll/${id}/approve`, { method: 'PATCH' });

export const hrmPayPayroll = (id, bankAccountId) =>
  hrmRequest(`/hrm/payroll/${id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ bankAccountId }),
  });

export const hrmSeedAccounts = () =>
  hrmRequest('/hrm/payroll/seed-accounts', { method: 'POST' });
