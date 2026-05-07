import { useEffect, useState } from 'react';
import {
  hrmApprovePayroll,
  hrmGetPayroll,
  hrmListPayrolls,
  hrmListEmployees,
  hrmPayPayroll,
  hrmRunPayroll,
  hrmSeedAccounts,
} from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const STATUS_COLOR = { DRAFT: '#94a3b8', APPROVED: '#3b82f6', PAID: '#059669', CANCELLED: '#dc2626' };

function fmt(minor) {
  return (minor / 100).toLocaleString('az-AZ', { minimumFractionDigits: 2 }) + ' ₼';
}

function RunPayrollModal({ onClose, onCreated, tp, tc }) {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await hrmRunPayroll({ periodStart, periodEnd });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{tp.runModalTitle}</h3>
        {error && <div className="hrm-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tp.periodStart}</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
            </div>
            <div className="hrm-field">
              <label>{tp.periodEnd}</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
            </div>
          </div>
          <div className="hrm-modal-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? tp.calculating : tp.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayrollDetail({ payroll, onBack, onRefresh, tp, tc }) {
  const STATUS_LABEL = {
    DRAFT: tp.statusDraft, APPROVED: tp.statusApproved,
    PAID: tp.statusPaid, CANCELLED: tp.statusCancelled,
  };

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [showPay, setShowPay] = useState(false);

  useEffect(() => {
    hrmGetPayroll(payroll.id)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [payroll.id]);

  const approve = async () => {
    setAction('approve');
    try {
      await hrmApprovePayroll(payroll.id);
      onRefresh();
      onBack();
    } catch (e) { setError(e.message); }
    finally { setAction(''); }
  };

  const pay = async (bankAccountId) => {
    setAction('pay');
    try {
      await hrmPayPayroll(payroll.id, bankAccountId);
      onRefresh();
      onBack();
    } catch (e) { setError(e.message); }
    finally { setAction(''); setShowPay(false); }
  };

  if (loading) return <div className="hrm-loading">{tc.loading}</div>;
  if (!detail) return <div className="hrm-error">{error || tp.loadError}</div>;

  const byEmployee = {};
  (detail.items || []).forEach((item) => {
    const key = item.employeeId;
    if (!byEmployee[key]) byEmployee[key] = { employee: item.employee, items: [] };
    byEmployee[key].items.push(item);
  });

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <div>
          <h2 className="hrm-panel-title">
            Payroll — {detail.periodStart?.slice(0, 7)}
          </h2>
          <span
            className="hrm-badge"
            style={{ background: STATUS_COLOR[detail.status] }}
          >
            {STATUS_LABEL[detail.status]}
          </span>
        </div>
        <button className="ghost-btn" onClick={onBack}>{tc.back}</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      <div className="hrm-payroll-summary">
        <div className="hrm-kpi">
          <span>{tp.detailGross}</span>
          <strong>{fmt(detail.totalGrossMinor)}</strong>
        </div>
        <div className="hrm-kpi">
          <span>{tp.detailDeductions}</span>
          <strong>{fmt(detail.totalDeductionsMinor)}</strong>
        </div>
        <div className="hrm-kpi">
          <span>{tp.detailNet}</span>
          <strong>{fmt(detail.totalNetMinor)}</strong>
        </div>
      </div>

      <div className="hrm-table-wrapper">
        <table className="hrm-table">
          <thead>
            <tr>
              <th>{tp.colEmployee}</th>
              <th>{tp.colBaseSalary}</th>
              <th>{tp.colDsmfEmp}</th>
              <th>{tp.colDsmfEr}</th>
              <th>{tp.colTax}</th>
              <th>{tp.colNetSalary}</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(byEmployee).map(({ employee, items }) => {
              const earning = items.find((i) => i.label === 'Əsas maaş')?.amountMinor || 0;
              const dsmfEmp = items.find((i) => i.label.includes('işçi 3%'))?.amountMinor || 0;
              const dsmfEr = items.find((i) => i.label.includes('işəgötürən'))?.amountMinor || 0;
              const tax = items.find((i) => i.label.includes('Gəlir'))?.amountMinor || 0;
              const net = earning - dsmfEmp - tax;
              return (
                <tr key={employee?.id}>
                  <td>{employee?.firstName} {employee?.lastName}<div className="hrm-sub">{employee?.employeeCode}</div></td>
                  <td>{fmt(earning)}</td>
                  <td>{fmt(dsmfEmp)}</td>
                  <td>{fmt(dsmfEr)}</td>
                  <td>{fmt(tax)}</td>
                  <td><strong>{fmt(net)}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail.status === 'DRAFT' && (
        <div className="hrm-form-footer">
          <button className="primary-btn" onClick={approve} disabled={!!action}>
            {action === 'approve' ? tp.approving : tp.approveBtn}
          </button>
        </div>
      )}

      {detail.status === 'APPROVED' && (
        <div className="hrm-form-footer">
          <button className="primary-btn" onClick={() => setShowPay(true)} disabled={!!action}>
            {action === 'pay' ? tp.paying : tp.payBtn}
          </button>
        </div>
      )}

      {showPay && (
        <PayModal
          totalNetMinor={detail.totalNetMinor}
          onPay={pay}
          onClose={() => setShowPay(false)}
          tp={tp}
          tc={tc}
        />
      )}
    </div>
  );
}

function PayModal({ totalNetMinor, onPay, onClose, tp, tc }) {
  const [bankAccountId, setBankAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrmListEmployees({ status: 'ACTIVE' }).catch(() => []);
    import('../../lib/api.js').then(({ apiFetch }) => {
      apiFetch('/accounting/bank-accounts').then((r) => setAccounts(r || [])).catch(() => {}).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="hrm-modal-backdrop" onClick={onClose}>
      <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{tp.payModalTitle}</h3>
        <p>{tp.payModalNet} <strong>{(totalNetMinor / 100).toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼</strong></p>
        {loading ? (
          <div className="hrm-loading">{tc.loading}</div>
        ) : (
          <div className="hrm-field">
            <label>{tp.bankAccount}</label>
            <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
              <option value="">{tc.select}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.currency}</option>
              ))}
            </select>
          </div>
        )}
        <div className="hrm-modal-footer">
          <button className="ghost-btn" onClick={onClose}>{tc.cancelShort}</button>
          <button className="primary-btn" onClick={() => onPay(bankAccountId || undefined)}>{tp.payNow}</button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollDashboard({ lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const tp = t.payroll;
  const tc = t.common;

  const STATUS_LABEL = {
    DRAFT: tp.statusDraft, APPROVED: tp.statusApproved,
    PAID: tp.statusPaid, CANCELLED: tp.statusCancelled,
  };

  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRun, setShowRun] = useState(false);
  const [selected, setSelected] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const load = () => {
    setLoading(true);
    hrmListPayrolls()
      .then(setPayrolls)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const seed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await hrmSeedAccounts();
      setSeedMsg(tp.seedResult(res.results?.filter((r) => r.created).length || 0));
    } catch (e) {
      setSeedMsg(`${tc.error}${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  if (selected) {
    return (
      <PayrollDetail
        payroll={selected}
        onBack={() => setSelected(null)}
        onRefresh={load}
        tp={tp}
        tc={tc}
      />
    );
  }

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">{tp.title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost-btn" onClick={seed} disabled={seeding}>
            {seeding ? '...' : tp.seedAccounts}
          </button>
          <button className="primary-btn" onClick={() => setShowRun(true)}>{tp.addNew}</button>
        </div>
      </div>

      {seedMsg && <div className="hrm-notice">{seedMsg}</div>}
      {error && <div className="hrm-error">{error}</div>}

      {loading ? (
        <div className="hrm-loading">{tc.loading}</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>{tp.colPeriod}</th>
                <th>{tp.colGross}</th>
                <th>{tp.colNet}</th>
                <th>{tp.colStatus}</th>
                <th>{tp.colDate}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 && (
                <tr><td colSpan={6} className="hrm-empty">{tp.notFound}</td></tr>
              )}
              {payrolls.map((p) => (
                <tr key={p.id}>
                  <td>{p.periodStart?.slice(0, 7)}</td>
                  <td>{fmt(p.totalGrossMinor)}</td>
                  <td>{fmt(p.totalNetMinor)}</td>
                  <td>
                    <span className="hrm-badge" style={{ background: STATUS_COLOR[p.status] }}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString('az-AZ')}</td>
                  <td>
                    <button className="ghost-btn" onClick={() => setSelected(p)}>{tp.btnDetail}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRun && (
        <RunPayrollModal
          onClose={() => setShowRun(false)}
          onCreated={load}
          tp={tp}
          tc={tc}
        />
      )}
    </div>
  );
}
