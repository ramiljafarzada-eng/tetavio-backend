import { API_BASE_URL } from '../../lib/api.js';

async function wRequest(path, options = {}) {
  const session = window.__hrmSession;
  if (!session?.accessToken) throw new Error('Giriş tələb olunur');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Server əlaqəsi yoxdur');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const msg = payload?.message || `HTTP ${response.status}`;
    throw new Error(Array.isArray(msg) ? msg.join('; ') : msg);
  }
  return payload;
}

// Categories
export const wListCategories = () => wRequest('/warehouse/categories');
export const wCreateCategory = (dto) => wRequest('/warehouse/categories', { method: 'POST', body: JSON.stringify(dto) });
export const wUpdateCategory = (id, dto) => wRequest(`/warehouse/categories/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
export const wDeleteCategory = (id) => wRequest(`/warehouse/categories/${id}`, { method: 'DELETE' });

// Products
export const wListProducts = (query = {}) => {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.isActive !== undefined) params.set('isActive', query.isActive);
  const qs = params.toString();
  return wRequest(`/warehouse/products${qs ? `?${qs}` : ''}`);
};
export const wGetProduct = (id) => wRequest(`/warehouse/products/${id}`);
export const wCreateProduct = (dto) => wRequest('/warehouse/products', { method: 'POST', body: JSON.stringify(dto) });
export const wUpdateProduct = (id, dto) => wRequest(`/warehouse/products/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
export const wDeleteProduct = (id) => wRequest(`/warehouse/products/${id}`, { method: 'DELETE' });

// Warehouses
export const wListWarehouses = () => wRequest('/warehouse/warehouses');
export const wCreateWarehouse = (dto) => wRequest('/warehouse/warehouses', { method: 'POST', body: JSON.stringify(dto) });
export const wUpdateWarehouse = (id, dto) => wRequest(`/warehouse/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
export const wDeleteWarehouse = (id) => wRequest(`/warehouse/warehouses/${id}`, { method: 'DELETE' });

// Stock
export const wListBalances = (warehouseId) => wRequest(`/warehouse/stock/balances${warehouseId ? `?warehouseId=${warehouseId}` : ''}`);
export const wListMovements = (query = {}) => {
  const params = new URLSearchParams();
  if (query.productId) params.set('productId', query.productId);
  if (query.warehouseId) params.set('warehouseId', query.warehouseId);
  if (query.type) params.set('type', query.type);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  const qs = params.toString();
  return wRequest(`/warehouse/stock/movements${qs ? `?${qs}` : ''}`);
};
export const wCreateMovement = (dto) => wRequest('/warehouse/stock/movements', { method: 'POST', body: JSON.stringify(dto) });

// Purchase Orders
export const wListPurchaseOrders = (status) => wRequest(`/warehouse/purchase-orders${status ? `?status=${status}` : ''}`);
export const wGetPurchaseOrder = (id) => wRequest(`/warehouse/purchase-orders/${id}`);
export const wCreatePurchaseOrder = (dto) => wRequest('/warehouse/purchase-orders', { method: 'POST', body: JSON.stringify(dto) });
export const wUpdatePurchaseOrder = (id, dto) => wRequest(`/warehouse/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
export const wReceivePurchaseOrder = (id, dto) => wRequest(`/warehouse/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify(dto) });
