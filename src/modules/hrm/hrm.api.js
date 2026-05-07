import { API_BASE_URL, refreshTokens } from '../../lib/api.js';

let _onSessionUpdate = null;

export function initHrmApi(onSessionUpdate) {
  _onSessionUpdate = onSessionUpdate;
}

async function doFetch(path, options, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Server əlaqəsi yoxdur');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const err = new Error();
    err.status = response.status;
    err.payload = payload;
    const msg = payload?.message || `HTTP ${response.status}`;
    const errors = payload?.errors;
    const detail = Array.isArray(errors) && errors.length > 0 ? errors.join(', ') : null;
    err.message = detail || (Array.isArray(msg) ? msg.join(', ') : msg);
    throw err;
  }

  return payload?.data !== undefined ? payload.data : payload;
}

async function hrmRequest(path, options = {}) {
  const session = window.__hrmSession;
  if (!session?.accessToken) throw new Error('Giriş tələb olunur');

  try {
    return await doFetch(path, options, session.accessToken);
  } catch (err) {
    if (err.status !== 401 || !session?.refreshToken) throw err;

    try {
      const rotated = await refreshTokens(session.refreshToken);
      const nextSession = { ...session, accessToken: rotated.accessToken, refreshToken: rotated.refreshToken };
      window.__hrmSession = nextSession;
      if (typeof _onSessionUpdate === 'function') _onSessionUpdate(nextSession);
      return await doFetch(path, options, rotated.accessToken);
    } catch {
      throw err;
    }
  }
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

// ─── Positions ───────────────────────────────────────────────────────────────
export const hrmListPositions = () => hrmRequest('/hrm/positions');

export const hrmCreatePosition = (data) =>
  hrmRequest('/hrm/positions', { method: 'POST', body: JSON.stringify(data) });

export const hrmUpdatePosition = (id, data) =>
  hrmRequest(`/hrm/positions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const hrmDeletePosition = (id) =>
  hrmRequest(`/hrm/positions/${id}`, { method: 'DELETE' });

// ─── Work Schedules ───────────────────────────────────────────────────────────
export const hrmListSchedules = () => hrmRequest('/hrm/schedules');

export const hrmCreateSchedule = (data) =>
  hrmRequest('/hrm/schedules', { method: 'POST', body: JSON.stringify(data) });

export const hrmUpdateSchedule = (id, data) =>
  hrmRequest(`/hrm/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const hrmDeleteSchedule = (id) =>
  hrmRequest(`/hrm/schedules/${id}`, { method: 'DELETE' });

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

export const hrmBulkAttendance = (data) =>
  hrmRequest('/hrm/attendance/bulk', { method: 'POST', body: JSON.stringify(data) });

export const hrmUpdateAttendance = (id, data) =>
  hrmRequest(`/hrm/attendance/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const hrmDeleteAttendance = (id) =>
  hrmRequest(`/hrm/attendance/${id}`, { method: 'DELETE' });

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

export const hrmMyLeaveBalances = () =>
  hrmRequest('/hrm/leave-requests/my-balances');

export const hrmLeaveBalances = (employeeId) =>
  hrmRequest(`/hrm/leave-requests/balances/${employeeId}`);

export const hrmUpsertLeaveBalance = (data) =>
  hrmRequest('/hrm/leave-requests/balances', { method: 'POST', body: JSON.stringify(data) });

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
