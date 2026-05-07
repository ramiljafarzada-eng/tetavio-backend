import { useEffect, useState } from 'react';
import { hrmCreateDepartment, hrmDeleteDepartment, hrmListDepartments, hrmUpdateDepartment } from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const EMPTY = { name: '' };

export default function DepartmentList({ lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const td = t.departments;
  const tc = t.common;

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    hrmListDepartments()
      .then(setDepartments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setFormError(''); setModal('new'); };
  const openEdit = (d) => { setForm({ name: d.name }); setFormError(''); setModal(d); };
  const closeModal = () => setModal(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'new') {
        await hrmCreateDepartment(form);
      } else {
        await hrmUpdateDepartment(modal.id, form);
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
      await hrmDeleteDepartment(deleteId);
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
        <h2 className="hrm-panel-title">{td.title}</h2>
        <button className="primary-btn" onClick={openNew}>{td.addNew}</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      {loading ? (
        <div className="hrm-loading">{tc.loading}</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>{td.colName}</th>
                <th>{td.colManager}</th>
                <th>{tc.employeeCount}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 && (
                <tr><td colSpan={4} className="hrm-empty">{td.notFound}</td></tr>
              )}
              {departments.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    {d.parent && <div className="hrm-sub">{d.parent.name}</div>}
                  </td>
                  <td>{d.manager ? `${d.manager.firstName} ${d.manager.lastName}` : '—'}</td>
                  <td>{d._count?.employees ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="ghost-btn" onClick={() => openEdit(d)}>{tc.edit}</button>
                      <button className="ghost-btn" onClick={() => setDeleteId(d.id)}>{tc.delete}</button>
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
            <h3>{modal === 'new' ? td.newTitle : td.editTitle}</h3>
            {formError && <div className="hrm-error">{formError}</div>}
            <form onSubmit={submit}>
              <div className="hrm-field">
                <label>{td.colName} *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required maxLength={100}
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
            <h3>{td.deleteTitle}</h3>
            <p>{td.deleteBody}</p>
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
