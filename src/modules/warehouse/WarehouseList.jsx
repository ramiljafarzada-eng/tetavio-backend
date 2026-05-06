import { useEffect, useState } from 'react';
import { wListWarehouses, wCreateWarehouse, wUpdateWarehouse, wDeleteWarehouse } from './warehouse.api.js';

const EMPTY = { name: '', code: '', address: '', isDefault: false };

export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    wListWarehouses()
      .then(setWarehouses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    try {
      await wDeleteWarehouse(id);
      setDeleteConfirm(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (showForm || editing) {
    return (
      <WarehouseForm
        warehouse={editing}
        onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    );
  }

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Anbarlar</h2>
        <button className="primary-btn" onClick={() => setShowForm(true)}>+ Yeni anbar</button>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      {loading ? <div className="hrm-loading">Yüklənir...</div> : (
        <div className="w-card-grid">
          {warehouses.length === 0 && <p className="hrm-empty">Anbar tapılmadı</p>}
          {warehouses.map((w) => (
            <div key={w.id} className={`w-card${w.isDefault ? ' w-card-default' : ''}`}>
              <div className="w-card-head">
                <span className="w-card-name">{w.name}</span>
                {w.isDefault && <span className="w-badge-default">Əsas</span>}
                {!w.isActive && <span className="w-badge-inactive">Deaktiv</span>}
              </div>
              {w.code && <div className="w-card-detail">Kod: {w.code}</div>}
              {w.address && <div className="w-card-detail">{w.address}</div>}
              <div className="w-card-actions">
                <button className="ghost-btn small-btn" onClick={() => setEditing(w)}>Düzəlt</button>
                <button className="danger-btn small-btn" onClick={() => setDeleteConfirm(w)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteConfirm && (
        <div className="hrm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="hrm-modal small-modal" onClick={(e) => e.stopPropagation()}>
            <p><strong>{deleteConfirm.name}</strong> anbarını silmək istədiyinizdən əminsiniz?</p>
            <div className="hrm-form-footer">
              <button className="ghost-btn" onClick={() => setDeleteConfirm(null)}>Ləğv et</button>
              <button className="danger-btn" onClick={() => handleDelete(deleteConfirm.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WarehouseForm({ warehouse, onSaved, onCancel }) {
  const [form, setForm] = useState(warehouse ? { ...EMPTY, ...warehouse } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const f = (name) => ({ value: form[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, code: form.code || undefined, address: form.address || undefined };
      if (warehouse) await wUpdateWarehouse(warehouse.id, payload);
      else await wCreateWarehouse(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">{warehouse ? 'Anbarı düzəlt' : 'Yeni anbar'}</h2>
        <button className="ghost-btn" onClick={onCancel}>← Geri</button>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      <form className="hrm-form" onSubmit={handleSubmit}>
        <div className="hrm-form-row">
          <div className="hrm-field">
            <label>Ad *</label>
            <input {...f('name')} required maxLength={200} />
          </div>
          <div className="hrm-field">
            <label>Kod</label>
            <input {...f('code')} maxLength={20} />
          </div>
        </div>
        <div className="hrm-field">
          <label>Ünvan</label>
          <input {...f('address')} maxLength={500} />
        </div>
        <div className="hrm-field">
          <label className="hrm-checkbox-label">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
            Əsas anbar
          </label>
        </div>
        {warehouse && (
          <div className="hrm-field">
            <label className="hrm-checkbox-label">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
              Aktivdir
            </label>
          </div>
        )}
        <div className="hrm-form-footer">
          <button type="button" className="ghost-btn" onClick={onCancel} disabled={saving}>Ləğv et</button>
          <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saxlanılır...' : 'Saxla'}</button>
        </div>
      </form>
    </div>
  );
}
