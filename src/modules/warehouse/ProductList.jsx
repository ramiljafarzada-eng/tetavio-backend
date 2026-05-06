import { useEffect, useState } from 'react';
import { wListProducts, wListCategories, wCreateProduct, wUpdateProduct, wDeleteProduct } from './warehouse.api.js';

const EMPTY = { sku: '', name: '', barcode: '', unit: 'ədəd', categoryId: '', description: '', salePriceMinor: '', costPriceMinor: '', minStockQty: '' };

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [p, c] = await Promise.all([wListProducts({ search, categoryId: filterCat || undefined }), wListCategories()]);
      setProducts(p);
      setCategories(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterCat]);

  const handleSaved = () => { setShowForm(false); setEditing(null); load(); };

  const handleDelete = async (id) => {
    try {
      await wDeleteProduct(id);
      setDeleteConfirm(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (showForm || editing) {
    return (
      <ProductForm
        product={editing}
        categories={categories}
        onSaved={handleSaved}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    );
  }

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Məhsullar</h2>
        <button className="primary-btn" onClick={() => setShowForm(true)}>+ Yeni məhsul</button>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      <div className="hrm-filters">
        <input className="hrm-search" placeholder="Ad, SKU, barkod axtar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="hrm-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">Bütün kateqoriyalar</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {loading ? <div className="hrm-loading">Yüklənir...</div> : (
        <table className="hrm-table">
          <thead>
            <tr><th>SKU</th><th>Ad</th><th>Kateqoriya</th><th>Vahid</th><th>Satış qiym.</th><th>Maya</th><th>Min stok</th><th></th></tr>
          </thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={8} className="hrm-empty">Məhsul tapılmadı</td></tr>}
            {products.map((p) => (
              <tr key={p.id}>
                <td><span className="w-sku">{p.sku}</span></td>
                <td>{p.name}{!p.isActive && <span className="w-badge-inactive"> deaktiv</span>}</td>
                <td>{p.category?.name || '—'}</td>
                <td>{p.unit}</td>
                <td>{(p.salePriceMinor / 100).toFixed(2)} ₼</td>
                <td>{(p.costPriceMinor / 100).toFixed(2)} ₼</td>
                <td>{Number(p.minStockQty).toFixed(3)}</td>
                <td className="hrm-actions">
                  <button className="ghost-btn small-btn" onClick={() => setEditing(p)}>Düzəlt</button>
                  <button className="danger-btn small-btn" onClick={() => setDeleteConfirm(p)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {deleteConfirm && (
        <div className="hrm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="hrm-modal small-modal" onClick={(e) => e.stopPropagation()}>
            <p><strong>{deleteConfirm.name}</strong> məhsulunu silmək istədiyinizdən əminsiniz?</p>
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

function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(product ? {
    ...EMPTY,
    ...product,
    salePriceMinor: (product.salePriceMinor / 100).toFixed(2),
    costPriceMinor: (product.costPriceMinor / 100).toFixed(2),
    minStockQty: Number(product.minStockQty).toString(),
    categoryId: product.categoryId || '',
  } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const f = (name) => ({ value: form[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        salePriceMinor: Math.round(parseFloat(form.salePriceMinor || '0') * 100),
        costPriceMinor: Math.round(parseFloat(form.costPriceMinor || '0') * 100),
        minStockQty: parseFloat(form.minStockQty || '0'),
        categoryId: form.categoryId || undefined,
        barcode: form.barcode || undefined,
        description: form.description || undefined,
      };
      if (product) {
        await wUpdateProduct(product.id, payload);
      } else {
        await wCreateProduct(payload);
      }
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
        <h2 className="hrm-panel-title">{product ? 'Məhsulu düzəlt' : 'Yeni məhsul'}</h2>
        <button className="ghost-btn" onClick={onCancel}>← Geri</button>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      <form className="hrm-form" onSubmit={handleSubmit}>
        <div className="hrm-form-section">
          <h3>Əsas məlumatlar</h3>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>SKU *</label>
              <input {...f('sku')} required maxLength={20} disabled={!!product} />
            </div>
            <div className="hrm-field">
              <label>Ad *</label>
              <input {...f('name')} required maxLength={200} />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Barkod</label>
              <input {...f('barcode')} maxLength={100} />
            </div>
            <div className="hrm-field">
              <label>Vahid *</label>
              <select {...f('unit')}>
                <option value="ədəd">ədəd</option>
                <option value="kq">kq</option>
                <option value="q">q</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="m">m</option>
                <option value="m²">m²</option>
                <option value="m³">m³</option>
                <option value="qutu">qutu</option>
                <option value="paket">paket</option>
              </select>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Kateqoriya</label>
              <select {...f('categoryId')}>
                <option value="">Seçin...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="hrm-field">
              <label>Minimum stok</label>
              <input type="number" step="0.001" min="0" {...f('minStockQty')} placeholder="0" />
            </div>
          </div>
        </div>
        <div className="hrm-form-section">
          <h3>Qiymət</h3>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Satış qiyməti (AZN)</label>
              <input type="number" step="0.01" min="0" {...f('salePriceMinor')} placeholder="0.00" />
            </div>
            <div className="hrm-field">
              <label>Maya dəyəri (AZN)</label>
              <input type="number" step="0.01" min="0" {...f('costPriceMinor')} placeholder="0.00" />
            </div>
          </div>
        </div>
        <div className="hrm-form-section">
          <div className="hrm-field">
            <label>Təsvir</label>
            <textarea {...f('description')} rows={3} maxLength={1000} />
          </div>
        </div>
        <div className="hrm-form-footer">
          <button type="button" className="ghost-btn" onClick={onCancel} disabled={saving}>Ləğv et</button>
          <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saxlanılır...' : 'Saxla'}</button>
        </div>
      </form>
    </div>
  );
}
