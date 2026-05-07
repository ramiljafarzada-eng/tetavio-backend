import { useEffect, useState } from 'react';
import {
  hrmListEmployees,
  hrmManualAttendance,
  hrmBulkAttendance,
  hrmMarkHoliday,
  hrmUpdateAttendance,
  hrmDeleteAttendance,
  hrmListAttendance,
} from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const STATUS_COLOR = {
  PRESENT: '#059669',
  ABSENT: '#dc2626',
  LATE: '#d97706',
  HALF_DAY: '#7c3aed',
  ON_LEAVE: '#3b82f6',
  SICK_LEAVE: '#ec4899',
  BUSINESS_TRIP: '#f59e0b',
  HOLIDAY: '#94a3b8',
};

function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalISO(localDate, timeStr) {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const m = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${localDate}T${timeStr}:00${sign}${h}:${m}`;
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
}

function fmtMin(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}s ${m}d` : `${m}d`;
}

function EmployeeCheckList({ employees, selected, onToggle, onToggleAll, tc }) {
  const allSelected = selected.size === employees.length;
  return (
    <div className="hrm-field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ margin: 0 }}>{`İşçilər (${selected.size}/${employees.length})`}</label>
        <button type="button" className="ghost-btn" style={{ padding: '2px 10px', fontSize: '0.8rem' }} onClick={onToggleAll}>
          {allSelected ? 'Heçbirini seçmə' : 'Hamısını seç'}
        </button>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8, padding: '4px 0' }}>
        {employees.map((emp) => (
          <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.has(emp.id)} onChange={() => onToggle(emp.id)} style={{ width: 15, height: 15, flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem' }}>
              {emp.firstName} {emp.lastName}
              <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: '0.78rem' }}>({emp.employeeCode})</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function BulkModal({ employees, onClose, onSaved, ta, tc }) {
  const now = new Date();
  const firstOfMonth = localDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastOfMonth = localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(lastOfMonth);
  const [checkIn, setCheckIn] = useState('09:00');
  const [checkOut, setCheckOut] = useState('18:00');
  const [selected, setSelected] = useState(new Set(employees.map((e) => e.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const toggleAll = () => setSelected(selected.size === employees.length ? new Set() : new Set(employees.map((e) => e.id)));
  const toggleOne = (id) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const setThisMonth = () => { setDateFrom(firstOfMonth); setDateTo(lastOfMonth); };
  const setToday = () => { const t = localDateStr(now); setDateFrom(t); setDateTo(t); };
  const setThisWeek = () => {
    const day = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
    setDateFrom(localDateStr(mon)); setDateTo(localDateStr(fri));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (selected.size === 0) { setError('Ən az 1 işçi seçin'); return; }
    setSaving(true); setError(''); setResult('');
    try {
      const tzOffset = -now.getTimezoneOffset();
      const res = await hrmBulkAttendance({
        employeeIds: [...selected],
        dateFrom,
        dateTo,
        checkInTime: checkIn || undefined,
        checkOutTime: checkOut || undefined,
        tzOffsetMinutes: tzOffset,
      });
      setResult(`${res?.count ?? '?'} qeyd yazıldı (şənbə/bazar atlandı).`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" style={{ maxWidth: 540, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <h3>Toplu davamiyyət qeydi</h3>
        {error && <div className="hrm-error">{error}</div>}
        {result && <div className="hrm-notice">{result}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>Tarix aralığı</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} required style={{ flex: 1 }} />
              <span style={{ color: 'var(--muted)' }}>—</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} required style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button type="button" className="ghost-btn" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={setToday}>Bu gün</button>
              <button type="button" className="ghost-btn" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={setThisWeek}>Bu həftə</button>
              <button type="button" className="ghost-btn" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={setThisMonth}>Bu ay</button>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{ta.manualCheckIn}</label>
              <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="hrm-field">
              <label>{ta.manualCheckOut}</label>
              <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <EmployeeCheckList employees={employees} selected={selected} onToggle={toggleOne} onToggleAll={toggleAll} tc={tc} />
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 0' }}>Şənbə, bazar və mövcud məzuniyyət/bayram qeydləri atlanır.</p>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
            <button type="submit" className="primary-btn" disabled={saving || selected.size === 0}>
              {saving ? tc.saving : `Qeyd et (${selected.size} işçi)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeaveMarkModal({ employees, onClose, onSaved, ta, tc }) {
  const now = new Date();
  const firstOfMonth = localDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastOfMonth = localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [status, setStatus] = useState('ON_LEAVE');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(lastOfMonth);
  const [selected, setSelected] = useState(new Set());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const toggleAll = () => setSelected(selected.size === employees.length ? new Set() : new Set(employees.map((e) => e.id)));
  const toggleOne = (id) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const setToday = () => { const t = localDateStr(now); setDateFrom(t); setDateTo(t); };
  const setThisWeek = () => {
    const day = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
    setDateFrom(localDateStr(mon)); setDateTo(localDateStr(fri));
  };
  const setThisMonth = () => { setDateFrom(firstOfMonth); setDateTo(lastOfMonth); };

  const STATUS_OPTIONS = [
    { value: 'ON_LEAVE', label: 'Məzuniyyət' },
    { value: 'SICK_LEAVE', label: 'Xəstəlik' },
    { value: 'BUSINESS_TRIP', label: 'Ezamiyyət' },
  ];

  const submit = async (e) => {
    e.preventDefault();
    if (selected.size === 0) { setError('Ən az 1 işçi seçin'); return; }
    setSaving(true); setError(''); setResult('');
    try {
      const res = await hrmBulkAttendance({
        employeeIds: [...selected],
        dateFrom,
        dateTo,
        status,
        note: note || undefined,
      });
      setResult(`${res?.count ?? '?'} qeyd yazıldı (şənbə/bazar atlandı).`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label || status;

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" style={{ maxWidth: 540, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <h3>Məzuniyyət / Xəstəlik / Ezamiyyət qeydi</h3>
        {error && <div className="hrm-error">{error}</div>}
        {result && <div className="hrm-notice">{result}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>Növ</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 14px', borderRadius: 8, border: `2px solid ${status === opt.value ? STATUS_COLOR[opt.value] : 'var(--line)'}`, background: status === opt.value ? `${STATUS_COLOR[opt.value]}18` : 'transparent', flex: 1, justifyContent: 'center' }}>
                  <input type="radio" name="leaveStatus" value={opt.value} checked={status === opt.value} onChange={() => setStatus(opt.value)} style={{ display: 'none' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: status === opt.value ? STATUS_COLOR[opt.value] : 'inherit' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="hrm-field">
            <label>Tarix aralığı</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} required style={{ flex: 1 }} />
              <span style={{ color: 'var(--muted)' }}>—</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} required style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button type="button" className="ghost-btn" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={setToday}>Bu gün</button>
              <button type="button" className="ghost-btn" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={setThisWeek}>Bu həftə</button>
              <button type="button" className="ghost-btn" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={setThisMonth}>Bu ay</button>
            </div>
          </div>
          <div className="hrm-field">
            <label>Qeyd (isteğe bağlı)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="məs. xəstəxana qəbzi var" maxLength={300} />
          </div>
          <EmployeeCheckList employees={employees} selected={selected} onToggle={toggleOne} onToggleAll={toggleAll} tc={tc} />
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 0' }}>Şənbə, bazar və bayram günləri atlanır.</p>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
            <button type="submit" className="primary-btn" disabled={saving || selected.size === 0}>
              {saving ? tc.saving : `${statusLabel} qeyd et (${selected.size})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HolidayModal({ employees, onClose, onSaved, ta, tc }) {
  const now = new Date();
  const [date, setDate] = useState(localDateStr(now));
  const [selected, setSelected] = useState(new Set(employees.map((e) => e.id)));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleAll = () => setSelected(selected.size === employees.length ? new Set() : new Set(employees.map((e) => e.id)));
  const toggleOne = (id) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const submit = async (e) => {
    e.preventDefault();
    if (selected.size === 0) { setError('Ən az 1 işçi seçin'); return; }
    setSaving(true); setError('');
    try {
      await Promise.all([...selected].map((empId) =>
        hrmMarkHoliday({ employeeId: empId, date, status: 'HOLIDAY', note: note || undefined })
      ));
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
      <div className="hrm-modal" style={{ maxWidth: 520, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <h3>Bayram / İstirahət günü qeydi</h3>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>Tarix</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="hrm-field">
            <label>Qeyd (isteğe bağlı)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="məs. Novruz bayramı" maxLength={255} />
          </div>
          <EmployeeCheckList employees={employees} selected={selected} onToggle={toggleOne} onToggleAll={toggleAll} tc={tc} />
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
            <button type="submit" className="primary-btn" disabled={saving || selected.size === 0}>
              {saving ? tc.saving : `Bayram qeyd et (${selected.size})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickCheckModal({ type, employees, onClose, onSaved, ta, tc }) {
  const now = new Date();
  const todayDate = localDateStr(now);
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
      const isoTime = toLocalISO(todayDate, time);
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
        checkIn: form.checkIn ? toLocalISO(form.date, form.checkIn) : undefined,
        checkOut: form.checkOut ? toLocalISO(form.date, form.checkOut) : undefined,
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

function EditModal({ log, employees, onClose, onSaved, ta, tc }) {
  const logDate = log.date ? localDateStr(new Date(log.date)) : '';
  const [checkIn, setCheckIn] = useState(log.checkIn ? new Date(log.checkIn).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
  const [checkOut, setCheckOut] = useState(log.checkOut ? new Date(log.checkOut).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
  const [note, setNote] = useState(log.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await hrmUpdateAttendance(log.id, {
        employeeId: log.employeeId,
        date: logDate,
        checkIn: checkIn ? toLocalISO(logDate, checkIn) : undefined,
        checkOut: checkOut ? toLocalISO(logDate, checkOut) : undefined,
        note: note || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const empName = employees.find((e) => e.id === log.employeeId);

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{tc.edit}</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 8 }}>
          {empName ? `${empName.firstName} ${empName.lastName}` : log.employeeId} — {logDate}
        </p>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{ta.manualCheckIn}</label>
              <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="hrm-field">
              <label>{ta.manualCheckOut}</label>
              <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="hrm-field">
            <label>{ta.manualNote}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
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
    SICK_LEAVE: ta.statusSickLeave || 'Xəstəlikdə',
    BUSINESS_TRIP: ta.statusBusinessTrip || 'Ezamiyyətdə',
    HOLIDAY: ta.statusHoliday,
  };

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickCheck, setQuickCheck] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [showHoliday, setShowHoliday] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    setSelectedLogs(new Set());
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    hrmListAttendance({ dateFrom, dateTo })
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const toggleLogSelect = (id) =>
    setSelectedLogs((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleAllLogs = () =>
    setSelectedLogs(selectedLogs.size === logs.length ? new Set() : new Set(logs.map((l) => l.id)));

  const bulkDelete = async () => {
    if (selectedLogs.size === 0) return;
    setBulkDeleting(true);
    setError('');
    try {
      await Promise.all([...selectedLogs].map((id) => hrmDeleteAttendance(id)));
      load();
    } catch (err) {
      setError(err.message);
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    hrmListEmployees({ status: 'ACTIVE' }).then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [year, month]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await hrmDeleteAttendance(deleteId);
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
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
          <button className="ghost-btn" onClick={() => setShowManual(true)}>{ta.manualEntry}</button>
          <button className="primary-btn" onClick={() => setShowBulk(true)}>{ta.bulkEntry || 'Toplu qeyd'}</button>
          <button className="ghost-btn" onClick={() => setShowLeave(true)}>Məzuniyyət / Xəstəlik / Ezamiyyət</button>
          <button className="ghost-btn" onClick={() => setShowHoliday(true)}>Bayram qeyd et</button>
        </div>
      </div>

      {actionMsg && <div className="hrm-notice">{actionMsg}</div>}
      {error && <div className="hrm-error">{error}</div>}

      {selectedLogs.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(220,38,38,0.07)', borderRadius: 8, marginBottom: 10, border: '1px solid rgba(220,38,38,0.18)' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>{selectedLogs.size} qeyd seçildi</span>
          <button
            className="ghost-btn"
            style={{ color: '#dc2626', marginLeft: 'auto' }}
            onClick={bulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? 'Silinir...' : `Seçilənləri sil (${selectedLogs.size})`}
          </button>
          <button className="ghost-btn" style={{ fontSize: '0.8rem' }} onClick={() => setSelectedLogs(new Set())}>Ləğv et</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select className="hrm-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {ta.months.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select className="hrm-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
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
                <th style={{ width: 36, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    style={{ width: 15, height: 15 }}
                    checked={logs.length > 0 && selectedLogs.size === logs.length}
                    ref={(el) => { if (el) el.indeterminate = selectedLogs.size > 0 && selectedLogs.size < logs.length; }}
                    onChange={toggleAllLogs}
                  />
                </th>
                <th>{ta.colEmployee}</th>
                <th>{ta.manualDate}</th>
                <th>{ta.manualCheckIn}</th>
                <th>{ta.manualCheckOut}</th>
                <th>{ta.colAvgHours}</th>
                <th>{ta.colLastStatus}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={8} className="hrm-empty">{ta.notFound}</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} style={selectedLogs.has(log.id) ? { background: 'rgba(220,38,38,0.04)' } : {}}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      style={{ width: 15, height: 15 }}
                      checked={selectedLogs.has(log.id)}
                      onChange={() => toggleLogSelect(log.id)}
                    />
                  </td>
                  <td>
                    {log.employee?.firstName} {log.employee?.lastName}
                    <div className="hrm-sub">{log.employee?.employeeCode}</div>
                  </td>
                  <td>{log.date ? log.date.slice(0, 10) : '—'}</td>
                  <td>{fmtTime(log.checkIn)}</td>
                  <td>{fmtTime(log.checkOut)}</td>
                  <td>{fmtMin(log.workedMinutes)}</td>
                  <td>
                    {log.status ? (
                      <span className="hrm-badge" style={{ background: STATUS_COLOR[log.status] }}>
                        {STATUS_LABEL[log.status]}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="ghost-btn" onClick={() => setEditLog(log)}>{tc.edit}</button>
                      <button className="ghost-btn" style={{ color: '#dc2626' }} onClick={() => setDeleteId(log.id)}>{tc.delete}</button>
                    </div>
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
          onSaved={() => { setActionMsg(quickCheck === 'in' ? ta.checkInDone : ta.checkOutDone); load(); }}
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

      {showBulk && (
        <BulkModal
          employees={employees}
          onClose={() => setShowBulk(false)}
          onSaved={load}
          ta={ta}
          tc={tc}
        />
      )}

      {showLeave && (
        <LeaveMarkModal
          employees={employees}
          onClose={() => setShowLeave(false)}
          onSaved={load}
          ta={ta}
          tc={tc}
        />
      )}

      {showHoliday && (
        <HolidayModal
          employees={employees}
          onClose={() => setShowHoliday(false)}
          onSaved={load}
          ta={ta}
          tc={tc}
        />
      )}

      {editLog && (
        <EditModal
          log={editLog}
          employees={employees}
          onClose={() => setEditLog(null)}
          onSaved={load}
          ta={ta}
          tc={tc}
        />
      )}

      {deleteId && (
        <div className="hrm-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{tc.confirmDelete || 'Silmək istədiyinizə əminsiniz?'}</h3>
            <div className="hrm-modal-footer">
              <button className="ghost-btn" onClick={() => setDeleteId(null)}>{tc.cancelShort}</button>
              <button className="primary-btn" style={{ background: '#dc2626' }} onClick={confirmDelete}>{tc.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
