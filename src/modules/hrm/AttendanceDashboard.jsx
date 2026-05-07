import { useEffect, useState } from 'react';
import { hrmListEmployees, hrmManualAttendance, hrmListAttendance } from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const STATUS_COLOR = {
  PRESENT: '#059669',
  ABSENT: '#dc2626',
  LATE: '#d97706',
  HALF_DAY: '#7c3aed',
  ON_LEAVE: '#3b82f6',
  HOLIDAY: '#94a3b8',
};

function fmtMin(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}s ${m}d` : `${m}d`;
}

function QuickCheckModal({ type, employees, onClose, onSaved, ta, tc }) {
  const now = new Date();
  const todayDate = now.toISOString().slice(0, 10);
  const currentTime = now.toTimeString().slice(0, 5);

  const [employeeId, setEmployeeId] = useState('');
  const [time, setTime] = useState(currentTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isoTime = `${todayDate}T${time}:00`;
      await hrmManualAttendance({
        employeeId,
        date: todayDate,
        ...(type === 'in' ? { checkIn: isoTime } : { checkOut: isoTime }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{type === 'in' ? ta.checkIn : ta.checkOut}</h3>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>{ta.colEmployee}</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">{tc.select}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div className="hrm-field">
            <label>{type === 'in' ? ta.manualCheckIn : ta.manualCheckOut}</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? tc.saving : tc.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManualModal({ employees, onClose, onSaved, ta, tc }) {
  const [form, setForm] = useState({ employeeId: '', date: '', checkIn: '', checkOut: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await hrmManualAttendance({
        employeeId: form.employeeId,
        date: form.date,
        checkIn: form.checkIn ? `${form.date}T${form.checkIn}:00` : undefined,
        checkOut: form.checkOut ? `${form.date}T${form.checkOut}:00` : undefined,
        note: form.note || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{ta.manualTitle}</h3>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>{ta.colEmployee}</label>
            <select value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} required>
              <option value="">{tc.select}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{ta.manualDate}</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{ta.manualCheckIn}</label>
              <input type="time" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} />
            </div>
            <div className="hrm-field">
              <label>{ta.manualCheckOut}</label>
              <input type="time" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} />
            </div>
          </div>
          <div className="hrm-field">
            <label>{ta.manualNote}</label>
            <input value={form.note} onChange={(e) => set('note', e.target.value)} maxLength={255} />
          </div>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? tc.saving : tc.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function buildSummary(logs) {
  const byEmp = {};
  logs.forEach((log) => {
    const id = log.employeeId;
    if (!byEmp[id]) {
      byEmp[id] = {
        employee: log.employee,
        logs: [],
        presentDays: 0,
        lateDays: 0,
        leaveDays: 0,
        absentDays: 0,
        totalWorkedMinutes: 0,
      };
    }
    const e = byEmp[id];
    e.logs.push(log);
    if (log.status === 'PRESENT') e.presentDays++;
    else if (log.status === 'LATE') { e.presentDays++; e.lateDays++; }
    else if (log.status === 'ON_LEAVE') e.leaveDays++;
    else if (log.status === 'ABSENT') e.absentDays++;
    e.totalWorkedMinutes += log.workedMinutes || 0;
  });
  return Object.values(byEmp).map((e) => ({
    ...e,
    avgWorkedMinutes: e.logs.length > 0 ? Math.round(e.totalWorkedMinutes / e.logs.length) : 0,
    lastStatus: e.logs[e.logs.length - 1]?.status,
  }));
}

export default function AttendanceDashboard({ lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const ta = t.attendance;
  const tc = t.common;

  const STATUS_LABEL = {
    PRESENT: ta.statusPresent,
    ABSENT: ta.statusAbsent,
    LATE: ta.statusLate,
    HALF_DAY: ta.statusHalfDay,
    ON_LEAVE: ta.statusOnLeave,
    HOLIDAY: ta.statusHoliday,
  };

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickCheck, setQuickCheck] = useState(null); // 'in' | 'out' | null
  const [showManual, setShowManual] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    hrmListAttendance({ dateFrom, dateTo })
      .then((logs) => setRows(buildSummary(logs)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    hrmListEmployees({ status: 'ACTIVE' }).then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [year, month]);

  const handleQuickSaved = (type) => {
    setActionMsg(type === 'in' ? ta.checkInDone : ta.checkOutDone);
    load();
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">{ta.title}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="ghost-btn" onClick={() => { setActionMsg(''); setQuickCheck('in'); }}>
            {ta.checkIn}
          </button>
          <button className="ghost-btn" onClick={() => { setActionMsg(''); setQuickCheck('out'); }}>
            {ta.checkOut}
          </button>
          <button className="primary-btn" onClick={() => setShowManual(true)}>{ta.manualEntry}</button>
        </div>
      </div>

      {actionMsg && <div className="hrm-notice">{actionMsg}</div>}
      {error && <div className="hrm-error">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select
          className="hrm-select"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {ta.months.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          className="hrm-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="hrm-loading">{tc.loading}</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>{ta.colEmployee}</th>
                <th>{ta.colPresent}</th>
                <th>{ta.colLate}</th>
                <th>{ta.colLeave}</th>
                <th>{ta.colAbsent}</th>
                <th>{ta.colAvgHours}</th>
                <th>{ta.colLastStatus}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="hrm-empty">{ta.notFound}</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.employee?.id}>
                  <td>
                    {row.employee?.firstName} {row.employee?.lastName}
                    <div className="hrm-sub">{row.employee?.employeeCode}</div>
                  </td>
                  <td>{row.presentDays}</td>
                  <td>{row.lateDays}</td>
                  <td>{row.leaveDays}</td>
                  <td>{row.absentDays}</td>
                  <td>{fmtMin(row.avgWorkedMinutes)}</td>
                  <td>
                    {row.lastStatus ? (
                      <span className="hrm-badge" style={{ background: STATUS_COLOR[row.lastStatus] }}>
                        {STATUS_LABEL[row.lastStatus]}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {quickCheck && (
        <QuickCheckModal
          type={quickCheck}
          employees={employees}
          onClose={() => setQuickCheck(null)}
          onSaved={() => handleQuickSaved(quickCheck)}
          ta={ta}
          tc={tc}
        />
      )}

      {showManual && (
        <ManualModal
          employees={employees}
          onClose={() => setShowManual(false)}
          onSaved={load}
          ta={ta}
          tc={tc}
        />
      )}
    </div>
  );
}
