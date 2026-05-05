import { useEffect, useState } from 'react';
import { hrmCheckIn, hrmCheckOut, hrmManualAttendance, hrmMonthlyReport } from './hrm.api.js';

const STATUS_LABEL = {
  PRESENT: 'İşdə',
  ABSENT: 'Yoxdur',
  LATE: 'Gecikmiş',
  HALF_DAY: 'Yarım gün',
  ON_LEAVE: 'Məzuniyyətdə',
  HOLIDAY: 'İstirahət',
};
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

function ManualModal({ onClose, onSaved }) {
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
        <h3>Manual Davamiyyət</h3>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>İşçi ID *</label>
            <input value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} required />
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Tarix *</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Giriş saatı</label>
              <input type="time" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} />
            </div>
            <div className="hrm-field">
              <label>Çıxış saatı</label>
              <input type="time" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} />
            </div>
          </div>
          <div className="hrm-field">
            <label>Qeyd</label>
            <input value={form.note} onChange={(e) => set('note', e.target.value)} maxLength={255} />
          </div>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>Ləğv</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saxlanılır...' : 'Saxla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AttendanceDashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionBusy, setActionBusy] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    hrmMonthlyReport(year, month)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [year, month]);

  const handleCheckIn = async () => {
    setActionBusy('in');
    setActionMsg('');
    try {
      await hrmCheckIn();
      setActionMsg('Giriş qeyd edildi.');
      load();
    } catch (e) {
      setActionMsg(`Xəta: ${e.message}`);
    } finally {
      setActionBusy('');
    }
  };

  const handleCheckOut = async () => {
    setActionBusy('out');
    setActionMsg('');
    try {
      await hrmCheckOut();
      setActionMsg('Çıxış qeyd edildi.');
      load();
    } catch (e) {
      setActionMsg(`Xəta: ${e.message}`);
    } finally {
      setActionBusy('');
    }
  };

  const months = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'];

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Davamiyyət</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="ghost-btn" onClick={handleCheckIn} disabled={!!actionBusy}>
            {actionBusy === 'in' ? '...' : 'Giriş qeyd et'}
          </button>
          <button className="ghost-btn" onClick={handleCheckOut} disabled={!!actionBusy}>
            {actionBusy === 'out' ? '...' : 'Çıxış qeyd et'}
          </button>
          <button className="primary-btn" onClick={() => setShowManual(true)}>Manual daxil et</button>
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
          {months.map((m, i) => (
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
        <div className="hrm-loading">Yüklənir...</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>İşçi</th>
                <th>İş günləri</th>
                <th>İşdə oldu</th>
                <th>Gecikdi</th>
                <th>Məzuniyyət</th>
                <th>Orta iş saatı</th>
                <th>Status (son)</th>
              </tr>
            </thead>
            <tbody>
              {report.length === 0 && (
                <tr><td colSpan={7} className="hrm-empty">Məlumat tapılmadı</td></tr>
              )}
              {report.map((row) => {
                const lastLog = row.logs?.[row.logs.length - 1];
                return (
                  <tr key={row.employee.id}>
                    <td>
                      {row.employee.firstName} {row.employee.lastName}
                      <div className="hrm-sub">{row.employee.employeeCode}</div>
                    </td>
                    <td>{row.workdays}</td>
                    <td>{row.presentDays}</td>
                    <td>{row.lateDays}</td>
                    <td>{row.leaveDays}</td>
                    <td>{fmtMin(row.avgWorkedMinutes)}</td>
                    <td>
                      {lastLog ? (
                        <span className="hrm-badge" style={{ background: STATUS_COLOR[lastLog.status] }}>
                          {STATUS_LABEL[lastLog.status]}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showManual && (
        <ManualModal onClose={() => setShowManual(false)} onSaved={load} />
      )}
    </div>
  );
}
