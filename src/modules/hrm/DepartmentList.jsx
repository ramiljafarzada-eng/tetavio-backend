import { useEffect, useState } from 'react';
import { hrmCreateDepartment, hrmListDepartments } from './hrm.api.js';

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    hrmListDepartments()
      .then(setDepartments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await hrmCreateDepartment(form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Şöbələr</h2>
        <button className="primary-btn" onClick={() => setShowForm(true)}>+ Yeni şöbə</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      {showForm && (
        <div className="hrm-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Yeni şöbə</h3>
            {formError && <div className="hrm-error">{formError}</div>}
            <form onSubmit={submit}>
              <div className="hrm-field">
                <label>Ad *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  maxLength={100}
                />
              </div>
              <div className="hrm-field">
                <label>Təsvir</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  maxLength={255}
                />
              </div>
              <div className="hrm-modal-footer">
                <button type="button" className="ghost-btn" onClick={() => setShowForm(false)}>Ləğv</button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saxlanılır...' : 'Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="hrm-loading">Yüklənir...</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Təsvir</th>
                <th>İşçi sayı</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 && (
                <tr><td colSpan={3} className="hrm-empty">Şöbə tapılmadı</td></tr>
              )}
              {departments.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.description || '—'}</td>
                  <td>{d._count?.employees ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
