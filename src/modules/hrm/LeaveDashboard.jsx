import { useEffect, useState } from 'react';
import {
  hrmCancelLeave,
  hrmCreateLeaveRequest,
  hrmHrApproveLeave,
  hrmLeaveBalances,
  hrmListEmployees,
  hrmListLeaveRequests,
  hrmManagerApproveLeave,
  hrmMyLeaveBalances,
  hrmRejectLeave,
  hrmUpsertLeaveBalance,
} from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const STATUS_COLOR = {
  PENDING: '#d97706',
  MANAGER_APPROVED: '#7c3aed',
  HR_APPROVED: '#059669',
  REJECTED: '#dc2626',
  CANCELLED: '#94a3b8',
};

function NewLeaveModal({ onClose, onSaved, tl, tc }) {
  const LEAVE_TYPE_LABEL = {
    ANNUAL: tl.typeAnnual, SICK: tl.typeSick, UNPAID: tl.typeUnpaid,
    MATERNITY: tl.typeMaternity, PATERNITY: tl.typePaternity, OTHER: tl.typeOther,
  };
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
        <h3>{tl.newModalTitle}</h3>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>{tl.typeLabel}</label>
            <select value={form.leaveType} onChange={(e) => set('leaveType', e.target.value)}>
              {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tl.startLabel}</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
            </div>
            <div className="hrm-field">
              <label>{tl.endLabel}</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
            </div>
          </div>
          <div className="hrm-field">
            <label>{tl.reasonLabel}</label>
            <input value={form.reason} onChange={(e) => set('reason', e.target.value)} maxLength={500} />
          </div>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? tl.sendingBtn : tl.sendBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BalanceManagerModal({ onClose, tl, tc }) {
  const LEAVE_TYPE_LABEL = {
    ANNUAL: tl.typeAnnual, SICK: tl.typeSick, UNPAID: tl.typeUnpaid,
    MATERNITY: tl.typeMaternity, PATERNITY: tl.typePaternity, OTHER: tl.typeOther,
  };
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeId: '', leaveType: 'ANNUAL', allocated: 21 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [empBalances, setEmpBalances] = useState([]);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    hrmListEmployees({ status: 'ACTIVE' }).then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.employeeId) { setEmpBalances([]); return; }
    hrmLeaveBalances(form.employeeId).then(setEmpBalances).catch(() => setEmpBalances([]));
  }, [form.employeeId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await hrmUpsertLeaveBalance({ employeeId: form.employeeId, leaveType: form.leaveType, allocated: Number(form.allocated) });
      setSuccess(tl.balanceUpdated);
      if (form.employeeId) hrmLeaveBalances(form.employeeId).then(setEmpBalances).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <h3>{tl.balanceModalTitle}</h3>
        {error && <div className="hrm-error">{error}</div>}
        {success && <div className="hrm-notice">{success}</div>}
        <form onSubmit={submit}>
          <div className="hrm-field">
            <label>{tl.employeeLabel}</label>
            <select value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} required>
              <option value="">{tc.select}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>
          {empBalances.length > 0 && (
            <div className="hrm-payroll-summary" style={{ marginBottom: 12 }}>
              {empBalances.map((b) => (
                <div className="hrm-kpi" key={b.leaveType} style={{ flex: '0 0 auto', minWidth: 100 }}>
                  <span style={{ fontSize: 11 }}>{LEAVE_TYPE_LABEL[b.leaveType]}</span>
                  <strong>{b.allocated - b.used - b.pending}</strong>
                  <div className="hrm-sub">{tl.totalShort} {b.allocated}</div>
                </div>
              ))}
            </div>
          )}
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tl.typeLabel}</label>
              <select value={form.leaveType} onChange={(e) => set('leaveType', e.target.value)}>
                {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="hrm-field">
              <label>{tl.allocatedDays}</label>
              <input type="number" min={0} max={365} value={form.allocated}
                onChange={(e) => set('allocated', e.target.value)} required />
            </div>
          </div>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.close}</button>
            <button type="submit" className="primary-btn" disabled={saving || !form.employeeId}>
              {saving ? tc.saving : tl.updateBalance}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeaveDashboard({ lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const tl = t.leave;
  const tc = t.common;

  const LEAVE_TYPE_LABEL = {
    ANNUAL: tl.typeAnnual, SICK: tl.typeSick, UNPAID: tl.typeUnpaid,
    MATERNITY: tl.typeMaternity, PATERNITY: tl.typePaternity, OTHER: tl.typeOther,
  };
  const STATUS_LABEL = {
    PENDING: tl.statusPending,
    MANAGER_APPROVED: tl.statusManagerApproved,
    HR_APPROVED: tl.statusHrApproved,
    REJECTED: tl.statusRejected,
    CANCELLED: tl.statusCancelled,
  };

  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showBalanceMgr, setShowBalanceMgr] = useState(false);
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
      setMsg(tl.actionSuccess(label));
      load();
    } catch (e) {
      setMsg(`${tc.error}${e.message}`);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">{tl.title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost-btn" onClick={() => setShowBalanceMgr(true)}>{tl.balanceMgr}</button>
          <button className="primary-btn" onClick={() => setShowNew(true)}>{tl.newRequest}</button>
        </div>
      </div>

      {msg && <div className="hrm-notice">{msg}</div>}
      {error && <div className="hrm-error">{error}</div>}

      {balances.length > 0 && (
        <div className="hrm-payroll-summary" style={{ marginBottom: 24 }}>
          {balances.map((b) => (
            <div className="hrm-kpi" key={b.leaveType}>
              <span>{LEAVE_TYPE_LABEL[b.leaveType]}</span>
              <strong>{tl.daysLeft(b.allocated - b.used - b.pending)}</strong>
              <div className="hrm-sub">{tl.totalLabel(b.allocated)} | {tl.usedLabel(b.used)} | {tl.pendingLabel(b.pending)}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="hrm-loading">{tc.loading}</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>{tl.colEmployee}</th>
                <th>{tl.colType}</th>
                <th>{tl.colStart}</th>
                <th>{tl.colEnd}</th>
                <th>{tl.colDays}</th>
                <th>{tl.colStatus}</th>
                <th>{tl.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={7} className="hrm-empty">{tl.notFound}</td></tr>
              )}
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee?.firstName} {r.employee?.lastName}</td>
                  <td>{LEAVE_TYPE_LABEL[r.leaveType]}</td>
                  <td>{r.startDate?.slice(0, 10)}</td>
                  <td>{r.endDate?.slice(0, 10)}</td>
                  <td>{r.daysRequested}</td>
                  <td>
                    <span className="hrm-badge" style={{ background: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status === 'PENDING' && (
                        <button className="ghost-btn" disabled={busy === r.id}
                          onClick={() => action(hrmManagerApproveLeave, r.id, tl.statusManagerApproved)}>
                          {tl.btnManagerApprove}
                        </button>
                      )}
                      {r.status === 'MANAGER_APPROVED' && (
                        <button className="ghost-btn" disabled={busy === r.id}
                          onClick={() => action(hrmHrApproveLeave, r.id, tl.statusHrApproved)}>
                          {tl.btnHrApprove}
                        </button>
                      )}
                      {(r.status === 'PENDING' || r.status === 'MANAGER_APPROVED') && (
                        <>
                          <button className="ghost-btn" disabled={busy === r.id}
                            onClick={() => action(hrmRejectLeave, r.id, tl.statusRejected)}>
                            {tl.btnReject}
                          </button>
                          <button className="ghost-btn" disabled={busy === r.id}
                            onClick={() => action(hrmCancelLeave, r.id, tl.statusCancelled)}>
                            {tl.btnCancel}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <NewLeaveModal onClose={() => setShowNew(false)} onSaved={load} tl={tl} tc={tc} />}
      {showBalanceMgr && <BalanceManagerModal onClose={() => setShowBalanceMgr(false)} tl={tl} tc={tc} />}
    </div>
  );
}
