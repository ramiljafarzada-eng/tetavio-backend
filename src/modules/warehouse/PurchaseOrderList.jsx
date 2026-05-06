import { useEffect, useState } from 'react';
import { wListPurchaseOrders, wGetPurchaseOrder, wCreatePurchaseOrder, wUpdatePurchaseOrder, wReceivePurchaseOrder, wListProducts, wListWarehouses } from './warehouse.api.js';

const STATUS_LABELS = { DRAFT: 'Qaralama', SENT: 'Göndərildi', PARTIAL: 'Qismən', RECEIVED: 'Qəbul edildi', CANCELLED: 'Ləğv' };
const STATUS_COLORS = { DRAFT: 'w-s-draft', SENT: 'w-s-sent', PARTIAL: 'w-s-partial', RECEIVED: 'w-s-received', CANCELLED: 'w-s-cancelled' };

export default function PurchaseOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const load = () => {
    setLoading(true);
    wListPurchaseOrders(filterStatus || undefined)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filterStatus]);

  if (showCreate) {
    return <POCreateForm onSaved={() => { setShowCreate(false); load(); }} onCancel={() => setShowCreate(false)} />;
  }

  if (viewingId) {
    return <PODetail id={viewingId} onBack={() => { setViewingId(null); load(); }} />;
  }

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">Satınalma Sifarişləri</h2>
        <button className="primary-btn" onClick={() => setShowCreate(true)}>+ Yeni sifariş</button>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      <div className="hrm-filters">
        <select className="hrm-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Bütün statuslar</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {loading ? <div className="hrm-loading">Yüklənir...</div> : (
        <table className="hrm-table">
          <thead>
            <tr><th>№</th><th>Təchizatçı</th><th>Anbar</th><th>Tarix</th><th>Status</th><th>Cəmi</th><th></th></tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={7} className="hrm-empty">Sifariş tapılmadı</td></tr>}
            {orders.map((o) => (
              <tr key={o.id}>
                <td><span className="w-sku">{o.poNumber}</span></td>
                <td>{o.supplierName}</td>
                <td>{o.warehouse.name}</td>
                <td>{new Date(o.orderDate).toLocaleDateString('az-AZ')}</td>
                <td><span className={`w-type-badge ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span></td>
                <td>{(o.totalMinor / 100).toFixed(2)} ₼</td>
                <td><button className="ghost-btn small-btn" onClick={() => setViewingId(o.id)}>Bax</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PODetail({ id, onBack }) {
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceive, setShowReceive] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    wGetPurchaseOrder(id)
      .then((data) => { setPo(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(load, [id]);

  const handleStatusChange = async (status) => {
    setSaving(true);
    setError('');
    try {
      await wUpdatePurchaseOrder(id, { status });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async () => {
    setSaving(true);
    setError('');
    try {
      const items = Object.entries(receiveQtys)
        .filter(([, qty]) => parseFloat(qty) > 0)
        .map(([itemId, qty]) => ({ itemId, qtyReceived: parseFloat(qty) }));
      if (items.length === 0) { setError('Miqdar daxil edin'); setSaving(false); return; }
      await wReceivePurchaseOrder(id, { items });
      setShowReceive(false);
      setReceiveQtys({});
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="hrm-panel"><div className="hrm-loading">Yüklənir...</div></div>;

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">{po?.poNumber} — {po?.supplierName}</h2>
        <button className="ghost-btn" onClick={onBack}>← Geri</button>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      {po && (
        <>
          <div className="w-po-meta">
            <span>Anbar: <strong>{po.warehouse.name}</strong></span>
            <span>Tarix: <strong>{new Date(po.orderDate).toLocaleDateString('az-AZ')}</strong></span>
            <span>Status: <span className={`w-type-badge ${STATUS_COLORS[po.status]}`}>{STATUS_LABELS[po.status]}</span></span>
            <span>Cəmi: <strong>{(po.totalMinor / 100).toFixed(2)} ₼</strong></span>
          </div>
          {po.note && <p className="w-po-note">{po.note}</p>}

          <table className="hrm-table">
            <thead>
              <tr><th>Məhsul</th><th>Sifariş miqdarı</th><th>Qəbul edildi</th><th>Vahid maya</th><th>Cəmi</th></tr>
            </thead>
            <tbody>
              {po.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product.name} <span className="w-sku-small">({item.product.sku})</span></td>
                  <td>{Number(item.qtyOrdered).toFixed(3)} {item.product.unit}</td>
                  <td className={Number(item.qtyReceived) >= Number(item.qtyOrdered) ? 'w-qty-ok' : ''}>
                    {Number(item.qtyReceived).toFixed(3)}
                  </td>
                  <td>{(item.unitCostMinor / 100).toFixed(2)} ₼</td>
                  <td>{(Number(item.qtyOrdered) * item.unitCostMinor / 100).toFixed(2)} ₼</td>
                </tr>
              ))}
            </tbody>
          </table>

          {showReceive && (
            <div className="w-receive-section">
              <h4>Qəbul et</h4>
              {po.items.map((item) => (
                <div key={item.id} className="hrm-form-row">
                  <div className="hrm-field" style={{ flex: 2 }}>
                    <label>{item.product.name}</label>
                  </div>
                  <div className="hrm-field">
                    <label>Miqdar</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max={Number(item.qtyOrdered) - Number(item.qtyReceived)}
                      value={receiveQtys[item.id] || ''}
                      onChange={(e) => setReceiveQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                      placeholder={`Max: ${(Number(item.qtyOrdered) - Number(item.qtyReceived)).toFixed(3)}`}
                    />
                  </div>
                </div>
              ))}
              <div className="hrm-form-footer">
                <button className="ghost-btn" onClick={() => setShowReceive(false)}>Ləğv et</button>
                <button className="primary-btn" onClick={handleReceive} disabled={saving}>{saving ? '...' : 'Qəbul et'}</button>
              </div>
            </div>
          )}

          <div className="w-po-actions">
            {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
              <>
                {!showReceive && (
                  <button className="primary-btn" onClick={() => setShowReceive(true)}>Qəbul et</button>
                )}
                {po.status === 'DRAFT' && (
                  <button className="ghost-btn" onClick={() => handleStatusChange('SENT')} disabled={saving}>Göndərildi kimi işarələ</button>
                )}
                <button className="danger-btn" onClick={() => handleStatusChange('CANCELLED')} disabled={saving}>Ləğv et</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function POCreateForm({ onSaved, onCancel }) {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ warehouseId: '', supplierName: '', orderDate: new Date().toISOString().slice(0, 10), expectedDate: '', note: '' });
  const [items, setItems] = useState([{ productId: '', qtyOrdered: '', unitCostMinor: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([wListWarehouses(), wListProducts({ isActive: 'true' })])
      .then(([w, p]) => { setWarehouses(w); setProducts(p); })
      .catch(() => {});
  }, []);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setItem = (i, k, v) => setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem = () => setItems((p) => [...p, { productId: '', qtyOrdered: '', unitCostMinor: '' }]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        expectedDate: form.expectedDate || undefined,
        note: form.note || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          qtyOrdered: parseFloat(i.qtyOrdered),
          unitCostMinor: Math.round(parseFloat(i.unitCostMinor || '0') * 100),
        })),
      };
      await wCreatePurchaseOrder(payload);
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
        <h2 className="hrm-panel-title">Yeni Satınalma Sifarişi</h2>
        <button className="ghost-btn" onClick={onCancel}>← Geri</button>
      </div>
      {error && <div className="hrm-error">{error}</div>}
      <form className="hrm-form" onSubmit={handleSubmit}>
        <div className="hrm-form-section">
          <h3>Sifariş məlumatları</h3>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Anbar *</label>
              <select className="hrm-select" value={form.warehouseId} onChange={(e) => setF('warehouseId', e.target.value)} required>
                <option value="">Seçin...</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="hrm-field">
              <label>Təchizatçı *</label>
              <input value={form.supplierName} onChange={(e) => setF('supplierName', e.target.value)} required maxLength={200} />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Sifariş tarixi *</label>
              <input type="date" value={form.orderDate} onChange={(e) => setF('orderDate', e.target.value)} required />
            </div>
            <div className="hrm-field">
              <label>Gözlənilən tarix</label>
              <input type="date" value={form.expectedDate} onChange={(e) => setF('expectedDate', e.target.value)} />
            </div>
          </div>
          <div className="hrm-field">
            <label>Qeyd</label>
            <input value={form.note} onChange={(e) => setF('note', e.target.value)} />
          </div>
        </div>

        <div className="hrm-form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Məhsullar</h3>
            <button type="button" className="ghost-btn small-btn" onClick={addItem}>+ Əlavə et</button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="hrm-form-row w-po-item-row">
              <div className="hrm-field" style={{ flex: 2 }}>
                <label>Məhsul *</label>
                <select className="hrm-select" value={item.productId} onChange={(e) => setItem(i, 'productId', e.target.value)} required>
                  <option value="">Seçin...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="hrm-field">
                <label>Miqdar *</label>
                <input type="number" step="0.001" min="0.001" value={item.qtyOrdered} onChange={(e) => setItem(i, 'qtyOrdered', e.target.value)} required />
              </div>
              <div className="hrm-field">
                <label>Vahid qiymət (AZN)</label>
                <input type="number" step="0.01" min="0" value={item.unitCostMinor} onChange={(e) => setItem(i, 'unitCostMinor', e.target.value)} placeholder="0.00" />
              </div>
              {items.length > 1 && (
                <button type="button" className="danger-btn small-btn" style={{ alignSelf: 'flex-end', marginBottom: '0.25rem' }} onClick={() => removeItem(i)}>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="hrm-form-footer">
          <button type="button" className="ghost-btn" onClick={onCancel} disabled={saving}>Ləğv et</button>
          <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saxlanılır...' : 'Saxla'}</button>
        </div>
      </form>
    </div>
  );
}
