import { useEffect, useState } from 'react';
import { wListMovements, wListProducts, wListWarehouses } from './warehouse.api.js';

const TYPE_LABELS = { IN: 'Giriş', OUT: 'Çıxış', TRANSFER: 'Transfer', ADJUSTMENT: 'Düzəliş' };
const TYPE_COLORS = { IN: 'w-type-in', OUT: 'w-type-out', TRANSFER: 'w-type-transfer', ADJUSTMENT: 'w-type-adj' };

export default function MovementList() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ type: '', productId: '', warehouseId: '', dateFrom: '', dateTo: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const query = {};
      if (filters.type) query.type = filters.type;
      if (filters.productId) query.productId = filters.productId;
      if (filters.warehouseId) query.warehouseId = filters.warehouseId;
      if (filters.dateFrom) query.dateFrom = filters.dateFrom;
      if (filters.dateTo) query.dateTo = filters.dateTo;
      const [m, p, w] = await Promise.all([wListMovements(query), wListProducts(), wListWarehouses()]);
      setMovements(m);
      setProducts(p);
      setWarehouses(w);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const setF = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Stok Hərəkətləri</h2>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      <div className="hrm-filters w-filters-wrap">
        <select className="hrm-select" value={filters.type} onChange={(e) => setF('type', e.target.value)}>
          <option value="">Bütün növlər</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="hrm-select" value={filters.productId} onChange={(e) => setF('productId', e.target.value)}>
          <option value="">Bütün məhsullar</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="hrm-select" value={filters.warehouseId} onChange={(e) => setF('warehouseId', e.target.value)}>
          <option value="">Bütün anbarlar</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <input type="date" className="hrm-select" value={filters.dateFrom} onChange={(e) => setF('dateFrom', e.target.value)} />
        <input type="date" className="hrm-select" value={filters.dateTo} onChange={(e) => setF('dateTo', e.target.value)} />
      </div>
      {loading ? <div className="hrm-loading">Yüklənir...</div> : (
        <table className="hrm-table">
          <thead>
            <tr><th>Tarix</th><th>Növ</th><th>Məhsul</th><th>Anbar</th><th>Miqdar</th><th>Vahid maya</th><th>Qeyd</th></tr>
          </thead>
          <tbody>
            {movements.length === 0 && <tr><td colSpan={7} className="hrm-empty">Hərəkət tapılmadı</td></tr>}
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleDateString('az-AZ')}</td>
                <td><span className={`w-type-badge ${TYPE_COLORS[m.type]}`}>{TYPE_LABELS[m.type]}</span></td>
                <td>{m.product.name} <span className="w-sku-small">({m.product.sku})</span></td>
                <td>
                  {m.warehouse?.name || '—'}
                  {m.toWarehouse && <> → {m.toWarehouse.name}</>}
                </td>
                <td>{Number(m.qty).toFixed(3)} {m.product.unit}</td>
                <td>{m.unitCostMinor ? `${(m.unitCostMinor / 100).toFixed(2)} ₼` : '—'}</td>
                <td>{m.note || m.ref || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
