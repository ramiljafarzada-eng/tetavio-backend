import { useEffect, useState } from 'react';
import {
  hrmCancelLeave,
  hrmCreateLeaveRequest,
  hrmHrApproveLeave,
  hrmListLeaveRequests,
  hrmManagerApproveLeave,
  hrmMyLeaveBalances,
  hrmRejectLeave,
} from './hrm.api.js';

const LEAVE_TYPE_LABEL = {
  ANNUAL: 'İllik məzuniyyət',
  SICK: 'Xəstəlik',
  UNPAID: 'Ödənişsiz',
  MATERNITY: 'Analıq',
  OTHER: 'Digər',
};
const STATUS_LABEL = {
  PENDING: 'Gözləyir',
  MANAGER_APPROVED: 'Menecer təsdiqi',
  HR_APPROVED: 'HR təsdiqi',
  REJECTED: 'Rədd edildi',
  CANCELLED: 'Ləğv',
};
const STATUS_COLOR = {
  PENDING: '#d97706',
  MANAGER_APPROVED: '#7c3aed',
  HR_APPROVED: '#059669',
  REJECTED: '#dc2626',
  CANCELLED: '#94a3b8',
};

function NewLeaveModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await hrmCreateLeaveRequest(form);
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
        <h3>Məzuniyyət sorğusu</h3>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>Növ *</label>
            <select value={form.leaveType} onChange={(e) => set('leaveType', e.target.value)}>
              {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Başlama *</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
            </div>
            <div className="hrm-field">
              <label>Bitmə *</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
            </div>
          </div>
          <div className="hrm-field">
            <label>Səbəb</label>
            <input value={form.reason} onChange={(e) => set('reason', e.target.value)} maxLength={500} />
          </div>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>Ləğv</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Göndərilir...' : 'Göndər'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaveDashboard() {
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([hrmListLeaveRequests(), hrmMyLeaveBalances()])
      .then(([reqs, bals]) => { setRequests(reqs); setBalances(bals); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = async (fn, id, label) => {
    setBusy(id);
    setMsg('');
    try {
      await fn(id);
      setMsg(`${label} uğurlu oldu.`);
      load();
    } catch (e) {
      setMsg(`Xəta: ${e.message}`);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Məzuniyyət</h2>
        <button className="primary-btn" onClick={() => setShowNew(true)}>+ Sorğu yarat</button>
      </div>

      {msg && <div className="hrm-notice">{msg}</div>}
      {error && <div className="hrm-error">{error}</div>}

      {balances.length > 0 && (
        <div className="hrm-payroll-summary" style={{ marginBottom: 24 }}>
          {balances.map((b) => (
            <div className="hrm-kpi" key={b.leaveType}>
              <span>{LEAVE_TYPE_LABEL[b.leaveType]}</span>
              <strong>{b.totalDays - b.usedDays - b.pendingDays} gün qalıb</strong>
              <div className="hrm-sub">Cəmi {b.totalDays} | İstifadə {b.usedDays} | Gözləyir {b.pendingDays}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="hrm-loading">Yüklənir...</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>İşçi</th>
                <th>Növ</th>
                <th>Başlama</th>
                <th>Bitmə</th>
                <th>Günlər</th>
                <th>Status</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={7} className="hrm-empty">Sorğu tapılmadı</td></tr>
              )}
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee?.firstName} {r.employee?.lastName}</td>
                  <td>{LEAVE_TYPE_LABEL[r.leaveType]}</td>
                  <td>{r.startDate?.slice(0, 10)}</td>
                  <td>{r.endDate?.slice(0, 10)}</td>
                  <td>{r.workdays}</td>
                  <td>
                    <span className="hrm-badge" style={{ background: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status === 'PENDING' && (
                        <button className="ghost-btn" disabled={busy === r.id}
                          onClick={() => action(hrmManagerApproveLeave, r.id, 'Menecer təsdiqi')}>
                          Menecer tər.
                        </button>
                      )}
                      {r.status === 'MANAGER_APPROVED' && (
                        <button className="ghost-btn" disabled={busy === r.id}
                          onClick={() => action(hrmHrApproveLeave, r.id, 'HR təsdiqi')}>
                          HR tər.
                        </button>
                      )}
                      {(r.status === 'PENDING' || r.status === 'MANAGER_APPROVED') && (
                        <button className="ghost-btn" disabled={busy === r.id}
                          onClick={() => action(hrmRejectLeave, r.id, 'Rədd')}>
                          Rədd et
                        </button>
                      )}
                      {(r.status === 'PENDING' || r.status === 'MANAGER_APPROVED') && (
                        <button className="ghost-btn" disabled={busy === r.id}
                          onClick={() => action(hrmCancelLeave, r.id, 'Ləğv')}>
                          Ləğv et
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <NewLeaveModal onClose={() => setShowNew(false)} onSaved={load} />}
    </div>
  );
}
