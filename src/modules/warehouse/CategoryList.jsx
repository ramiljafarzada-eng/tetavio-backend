import { useEffect, useState } from 'react';
import { wListCategories, wCreateCategory, wUpdateCategory, wDeleteCategory } from './warehouse.api.js';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    wListCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      await wCreateCategory({ name: newName, parentId: newParent || undefined });
      setNewName('');
      setNewParent('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id) => {
    setError('');
    try {
      await wUpdateCategory(id, { name: editName });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await wDeleteCategory(id);
      setDeleteConfirm(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Kateqoriyalar</h2>
      </div>
      {error && <div className="hrm-error">{error}</div>}

      <form className="hrm-inline-form" onSubmit={handleAdd}>
        <input
          className="hrm-inline-input"
          placeholder="Kateqoriya adı..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          maxLength={200}
        />
        <select className="hrm-select" value={newParent} onChange={(e) => setNewParent(e.target.value)}>
          <option value="">Üst kateqoriya (optional)</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="primary-btn" disabled={adding}>{adding ? '...' : '+ Əlavə et'}</button>
      </form>

      {loading ? <div className="hrm-loading">Yüklənir...</div> : (
        <table className="hrm-table">
          <thead>
            <tr><th>Ad</th><th>Üst kateqoriya</th><th>Alt kateqoriyalar</th><th></th></tr>
          </thead>
          <tbody>
            {categories.length === 0 && <tr><td colSpan={4} className="hrm-empty">Kateqoriya tapılmadı</td></tr>}
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  {editingId === c.id ? (
                    <div className="hrm-inline-edit">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus maxLength={200} />
                      <button className="primary-btn small-btn" onClick={() => handleUpdate(c.id)}>✓</button>
                      <button className="ghost-btn small-btn" onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  ) : c.name}
                </td>
                <td>{categories.find((x) => x.id === c.parentId)?.name || '—'}</td>
                <td>{c.children?.length > 0 ? c.children.map((ch) => ch.name).join(', ') : '—'}</td>
                <td className="hrm-actions">
                  <button className="ghost-btn small-btn" onClick={() => { setEditingId(c.id); setEditName(c.name); }}>Düzəlt</button>
                  <button className="danger-btn small-btn" onClick={() => setDeleteConfirm(c)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteConfirm && (
        <div className="hrm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="hrm-modal small-modal" onClick={(e) => e.stopPropagation()}>
            <p><strong>{deleteConfirm.name}</strong> kateqoriyasını silmək istədiyinizdən əminsiniz?</p>
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
