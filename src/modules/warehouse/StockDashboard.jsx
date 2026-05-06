import { useEffect, useState } from 'react';
import { wListBalances, wListWarehouses, wCreateMovement, wListProducts } from './warehouse.api.js';

export default function StockDashboard() {
  const [balances, setBalances] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMovModal, setShowMovModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [b, w] = await Promise.all([
        wListBalances(filterWarehouse || undefined),
        wListWarehouses(),
      ]);
      setBalances(b);
      setWarehouses(w);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterWarehouse]);

  const filtered = balances.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.product.name.toLowerCase().includes(q) || b.product.sku.toLowerCase().includes(q);
  });

  const lowStock = filtered.filter((b) => Number(b.qty) <= Number(b.product.minStockQty) && Number(b.product.minStockQty) > 0);

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Stok</h2>
        <button className="primary-btn" onClick={() => setShowMovModal(true)}>+ Hərəkət</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      {lowStock.length > 0 && (
        <div className="w-alert-bar">
          ⚠ {lowStock.length} məhsulun stoku minimum həddədir
        </div>
      )}

      <div className="hrm-filters">
        <select className="hrm-select" value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)}>
          <option value="">Bütün anbarlar</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <input
          className="hrm-search"
          placeholder="Ad, SKU axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="hrm-loading">Yüklənir...</div>
      ) : (
        <table className="hrm-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Məhsul</th>
              <th>Anbar</th>
              <th>Miqdar</th>
              <th>Vahid</th>
              <th>Ort. Maya</th>
              <th>Cəmi Dəyər</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="hrm-empty">Stok tapılmadı</td></tr>
            )}
            {filtered.map((b) => {
              const isLow = Number(b.product.minStockQty) > 0 && Number(b.qty) <= Number(b.product.minStockQty);
              return (
                <tr key={b.id} className={isLow ? 'w-row-low' : ''}>
                  <td><span className="w-sku">{b.product.sku}</span></td>
                  <td>{b.product.name}</td>
                  <td>{b.warehouse.name}</td>
                  <td className={isLow ? 'w-qty-low' : ''}>{Number(b.qty).toFixed(3)}</td>
                  <td>{b.product.unit}</td>
                  <td>{(b.avgCostMinor / 100).toFixed(2)} ₼</td>
                  <td>{((Number(b.qty) * b.avgCostMinor) / 100).toFixed(2)} ₼</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showMovModal && (
        <MovementModal warehouses={warehouses} onClose={() => setShowMovModal(false)} onSaved={load} />
      )}
    </div>
  );
}

function MovementModal({ warehouses, onClose, onSaved }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ type: 'IN', productId: '', warehouseId: '', toWarehouseId: '', qty: '', unitCostMinor: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    wListProducts({ isActive: 'true' }).then(setProducts).catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await wCreateMovement({
        type: form.type,
        productId: form.productId,
        warehouseId: form.warehouseId || undefined,
        toWarehouseId: form.toWarehouseId || undefined,
        qty: parseFloat(form.qty),
        unitCostMinor: Math.round(parseFloat(form.unitCostMinor || '0') * 100),
        note: form.note || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const TYPE_LABELS = { IN: 'Giriş', OUT: 'Çıxış', TRANSFER: 'Transfer', ADJUSTMENT: 'Düzəliş' };

  return (
    <div className="hrm-modal-overlay" onClick={onClose}>
      <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hrm-modal-header">
          <h3>Stok hərəkəti</h3>
          <button className="ghost-btn" onClick={onClose}>✕</button>
        </div>
        {error && <div className="hrm-error">{error}</div>}
        <form className="hrm-form" onSubmit={handleSubmit}>
          <div className="hrm-field">
            <label>Növ *</label>
            <select className="hrm-select" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="hrm-field">
            <label>Məhsul *</label>
            <select className="hrm-select" value={form.productId} onChange={(e) => set('productId', e.target.value)} required>
              <option value="">Seçin...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="hrm-field">
            <label>{form.type === 'TRANSFER' ? 'Göndərən anbar' : 'Anbar'} *</label>
            <select className="hrm-select" value={form.warehouseId} onChange={(e) => set('warehouseId', e.target.value)} required>
              <option value="">Seçin...</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {form.type === 'TRANSFER' && (
            <div className="hrm-field">
              <label>Qəbul edən anbar *</label>
              <select className="hrm-select" value={form.toWarehouseId} onChange={(e) => set('toWarehouseId', e.target.value)} required>
                <option value="">Seçin...</option>
                {warehouses.filter((w) => w.id !== form.warehouseId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Miqdar *</label>
              <input type="number" step="0.001" min="0.001" value={form.qty} onChange={(e) => set('qty', e.target.value)} required />
            </div>
            {(form.type === 'IN' || form.type === 'ADJUSTMENT') && (
              <div className="hrm-field">
                <label>Vahid Maya (AZN)</label>
                <input type="number" step="0.01" min="0" value={form.unitCostMinor} onChange={(e) => set('unitCostMinor', e.target.value)} placeholder="0.00" />
              </div>
            )}
          </div>
          <div className="hrm-field">
            <label>Qeyd</label>
            <input value={form.note} onChange={(e) => set('note', e.target.value)} />
          </div>
          <div className="hrm-form-footer">
            <button type="button" className="ghost-btn" onClick={onClose}>Ləğv et</button>
            <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saxlanılır...' : 'Saxla'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
