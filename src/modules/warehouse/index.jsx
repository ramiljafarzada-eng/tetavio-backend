import { Component, useEffect, useState } from 'react';
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

class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="hrm-panel">
          <div className="hrm-error">Xəta: {this.state.error.message}</div>
          <button className="ghost-btn" style={{ marginTop: '1rem' }} onClick={() => this.setState({ error: null })}>
            Yenidən cəhd et
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WarehouseModule({ backendSession, updateBackendSession }) {
  const [section, setSection] = useState('stock');

  // Set synchronously so child components can access the session immediately
  window.__hrmSession = backendSession;

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
        <SectionErrorBoundary key={section}>
          {section === 'stock' && <StockDashboard />}
          {section === 'products' && <ProductList />}
          {section === 'warehouses' && <WarehouseList />}
          {section === 'categories' && <CategoryList />}
          {section === 'movements' && <MovementList />}
          {section === 'purchase-orders' && <PurchaseOrderList />}
        </SectionErrorBoundary>
      </main>
    </div>
  );
}
