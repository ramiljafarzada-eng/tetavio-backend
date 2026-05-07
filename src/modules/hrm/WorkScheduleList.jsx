import { useEffect, useState } from 'react';
import { hrmCreateSchedule, hrmDeleteSchedule, hrmListSchedules, hrmUpdateSchedule } from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const EMPTY = {
  name: '',
  workStartTime: '09:00',
  workEndTime: '18:00',
  breakMinutes: 60,
  workDays: '1,2,3,4,5',
  gracePeriodMin: 10,
  isDefault: false,
};

function parseDays(str) {
  return (str || '').split(',').filter(Boolean);
}

function DayPicker({ value, onChange, ts }) {
  const DAYS = [
    { val: '1', label: ts.dayMon },
    { val: '2', label: ts.dayTue },
    { val: '3', label: ts.dayWed },
    { val: '4', label: ts.dayThu },
    { val: '5', label: ts.dayFri },
    { val: '6', label: ts.daySat },
    { val: '0', label: ts.daySun },
  ];
  const selected = parseDays(value);
  const toggle = (v) => {
    const next = selected.includes(v) ? selected.filter((d) => d !== v) : [...selected, v];
    onChange(next.sort().join(','));
  };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {DAYS.map((d) => (
        <button
          key={d.val}
          type="button"
          onClick={() => toggle(d.val)}
          className={selected.includes(d.val) ? 'primary-btn' : 'ghost-btn'}
          style={{ padding: '4px 10px', fontSize: 13 }}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

function dayNames(str, ts) {
  const DAYS = [
    { val: '1', label: ts.dayMon },
    { val: '2', label: ts.dayTue },
    { val: '3', label: ts.dayWed },
    { val: '4', label: ts.dayThu },
    { val: '5', label: ts.dayFri },
    { val: '6', label: ts.daySat },
    { val: '0', label: ts.daySun },
  ];
  const sel = parseDays(str);
  return DAYS.filter((d) => sel.includes(d.val)).map((d) => d.label).join(', ') || '—';
}

export default function WorkScheduleList({ lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const ts = t.schedules;
  const tc = t.common;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    hrmListSchedules()
      .then(setSchedules)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setFormError(''); setModal('new'); };
  const openEdit = (s) => {
    setForm({
      name: s.name,
      workStartTime: s.workStartTime,
      workEndTime: s.workEndTime,
      breakMinutes: s.breakMinutes,
      workDays: s.workDays,
      gracePeriodMin: s.gracePeriodMin,
      isDefault: s.isDefault,
    });
    setFormError('');
    setModal(s);
  };
  const closeModal = () => setModal(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, breakMinutes: Number(form.breakMinutes), gracePeriodMin: Number(form.gracePeriodMin) };
      if (modal === 'new') {
        await hrmCreateSchedule(payload);
      } else {
        await hrmUpdateSchedule(modal.id, payload);
      }
      closeModal();
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await hrmDeleteSchedule(deleteId);
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
        <h2 className="hrm-panel-title">{ts.title}</h2>
        <button className="primary-btn" onClick={openNew}>{ts.addNew}</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      {loading ? (
        <div className="hrm-loading">{tc.loading}</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>{ts.colName}</th>
                <th>{ts.colWorkHours}</th>
                <th>{ts.colWorkDays}</th>
                <th>{ts.colGrace}</th>
                <th>{tc.employeeCount}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 && (
                <tr><td colSpan={6} className="hrm-empty">{ts.notFound}</td></tr>
              )}
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    {s.isDefault && <span className="hrm-badge" style={{ background: '#059669', marginLeft: 6 }}>Default</span>}
                  </td>
                  <td>{s.workStartTime} – {s.workEndTime}</td>
                  <td>{dayNames(s.workDays, ts)}</td>
                  <td>{ts.minutesSuffix(s.gracePeriodMin)}</td>
                  <td>{s._count?.employees ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="ghost-btn" onClick={() => openEdit(s)}>{tc.edit}</button>
                      <button className="ghost-btn" onClick={() => setDeleteId(s.id)}>{tc.delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <div className="hrm-modal-backdrop" onClick={closeModal}>
          <div className="hrm-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h3>{modal === 'new' ? ts.newTitle : ts.editTitle}</h3>
            {formError && <div className="hrm-error">{formError}</div>}
            <form onSubmit={submit}>
              <div className="hrm-field">
                <label>{ts.colName} *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={100} />
              </div>
              <div className="hrm-form-row">
                <div className="hrm-field">
                  <label>{ts.startTime}</label>
                  <input type="time" value={form.workStartTime} onChange={(e) => set('workStartTime', e.target.value)} required />
                </div>
                <div className="hrm-field">
                  <label>{ts.endTime}</label>
                  <input type="time" value={form.workEndTime} onChange={(e) => set('workEndTime', e.target.value)} required />
                </div>
              </div>
              <div className="hrm-form-row">
                <div className="hrm-field">
                  <label>{ts.breakMinutes}</label>
                  <input type="number" min={0} max={480} value={form.breakMinutes} onChange={(e) => set('breakMinutes', e.target.value)} />
                </div>
                <div className="hrm-field">
                  <label>{ts.graceMinutes}</label>
                  <input type="number" min={0} max={120} value={form.gracePeriodMin} onChange={(e) => set('gracePeriodMin', e.target.value)} />
                </div>
              </div>
              <div className="hrm-field">
                <label>{ts.workDaysLabel}</label>
                <DayPicker value={form.workDays} onChange={(v) => set('workDays', v)} ts={ts} />
              </div>
              <div className="hrm-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => set('isDefault', e.target.checked)}
                />
                <label htmlFor="isDefault" style={{ marginBottom: 0 }}>{ts.setDefault}</label>
              </div>
              <div className="hrm-modal-footer">
                <button type="button" className="ghost-btn" onClick={closeModal}>{tc.cancelShort}</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? tc.saving : tc.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="hrm-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{ts.deleteTitle}</h3>
            <p>{ts.deleteBody}</p>
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
