import { useEffect, useState } from 'react';
import StockDashboard from './StockDashboard.jsx';
import ProductList from './ProductList.jsx';
import WarehouseList from './WarehouseList.jsx';
import CategoryList from './CategoryList.jsx';
import MovementList from './MovementList.jsx';
import PurchaseOrderList from './PurchaseOrderList.jsx';

const NAV = [
  { key: 'stock', label: 'Stok' },
  { key: 'products', label: 'Məhsullar' },
  { key: 'warehouses', label: 'Anbarlar' },
  { key: 'categories', label: 'Kateqoriyalar' },
  { key: 'movements', label: 'Hərəkətlər' },
  { key: 'purchase-orders', label: 'Satınalma' },
];

export default function WarehouseModule({ backendSession, updateBackendSession }) {
  const [section, setSection] = useState('stock');

  useEffect(() => {
    window.__hrmSession = backendSession;
  }, [backendSession]);

  return (
    <div className="hrm-layout">
      <aside className="hrm-sidebar">
        <div className="hrm-sidebar-title">Anbar</div>
        <nav className="hrm-nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`hrm-nav-item${section === n.key ? ' active' : ''}`}
              onClick={() => setSection(n.key)}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="hrm-main">
        {section === 'stock' && <StockDashboard />}
        {section === 'products' && <ProductList />}
        {section === 'warehouses' && <WarehouseList />}
        {section === 'categories' && <CategoryList />}
        {section === 'movements' && <MovementList />}
        {section === 'purchase-orders' && <PurchaseOrderList backendSession={backendSession} />}
      </main>
    </div>
  );
}
