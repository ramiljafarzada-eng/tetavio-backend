import { useEffect, useState } from 'react';
import { hrmCreatePosition, hrmDeletePosition, hrmListPositions, hrmUpdatePosition } from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const EMPTY = { title: '', level: 1 };

export default function PositionList({ lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const tp = t.positions;
  const tc = t.common;

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    hrmListPositions()
      .then(setPositions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setFormError(''); setModal('new'); };
  const openEdit = (p) => { setForm({ title: p.title, level: p.level }); setFormError(''); setModal(p); };
  const closeModal = () => setModal(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'new') {
        await hrmCreatePosition(form);
      } else {
        await hrmUpdatePosition(modal.id, form);
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
      await hrmDeletePosition(deleteId);
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
        <h2 className="hrm-panel-title">{tp.title}</h2>
        <button className="primary-btn" onClick={openNew}>{tp.addNew}</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      {loading ? (
        <div className="hrm-loading">{tc.loading}</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>{tp.colTitle}</th>
                <th>{tp.colLevel}</th>
                <th>{tc.employeeCount}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 && (
                <tr><td colSpan={4} className="hrm-empty">{tp.notFound}</td></tr>
              )}
              {positions.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.title}</strong></td>
                  <td>{p.level}</td>
                  <td>{p._count?.employees ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="ghost-btn" onClick={() => openEdit(p)}>{tc.edit}</button>
                      <button className="ghost-btn" onClick={() => setDeleteId(p.id)}>{tc.delete}</button>
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
          <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal === 'new' ? tp.newTitle : tp.editTitle}</h3>
            {formError && <div className="hrm-error">{formError}</div>}
            <form onSubmit={submit}>
              <div className="hrm-field">
                <label>{tp.colTitle} *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required maxLength={100}
                />
              </div>
              <div className="hrm-field">
                <label>{tp.levelLabel}</label>
                <input
                  type="number" min={1} max={20}
                  value={form.level}
                  onChange={(e) => setForm((p) => ({ ...p, level: Number(e.target.value) }))}
                />
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
            <h3>{tp.deleteTitle}</h3>
            <p>{tp.deleteBody}</p>
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
