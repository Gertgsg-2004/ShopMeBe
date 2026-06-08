import api from './api'
import { ApiResponse, Customer, DashboardData, PagedResult, Order, Product, Category, Coupon } from '../types'

// ---- Supplier types ----
export interface Supplier {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  totalDebt: number
  isActive: boolean
  createdAt: string
}

export interface PurchaseOrder {
  id: number
  supplierId: number
  supplierName: string
  orderCode: string
  status: string // Draft, Ordered, Received, Paid
  totalAmount: number
  paidAmount: number
  notes?: string
  createdAt: string
  receivedAt?: string
  items: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: number
  productId: number
  productName: string
  sku?: string
  quantity: number
  costPrice: number
  subTotal: number
}

// ---- Warehouse types ----
export interface StockItem {
  productId: number
  productName: string
  sku?: string
  currentStock: number
  price: number
  costPrice: number
  stockValue: number
  mainImageUrl?: string
}

export interface StockTransaction {
  id: number
  productId: number
  productName: string
  sku?: string
  type: string // Import, Export, Adjustment
  quantity: number
  stockBefore: number
  stockAfter: number
  reference?: string
  notes?: string
  createdAt: string
  createdByName?: string
}

export interface InventoryCheck {
  id: number
  checkCode: string
  status: string // Draft, Completed
  notes?: string
  createdAt: string
  completedAt?: string
  createdByName?: string
  items: InventoryCheckItem[]
}

export interface InventoryCheckItem {
  id: number
  productId: number
  productName: string
  sku?: string
  systemStock: number
  actualStock: number
  difference: number
}

// ---- POS types ----
export interface PosProduct {
  id: number
  name: string
  sku?: string
  price: number
  salePrice?: number
  displayPrice: number
  stock: number
  mainImageUrl?: string
}

export interface PosOrderItem {
  productId: number
  quantity: number
  price: number
}

export interface PosOrderRequest {
  items: PosOrderItem[]
  discount: number
  paymentMethod: string
  cashReceived?: number
  notes?: string
}

export interface PosOrderResponse {
  orderId: number
  orderCode: string
  items: { productName: string; quantity: number; price: number; subTotal: number }[]
  subTotal: number
  discount: number
  total: number
  paymentMethod: string
  cashReceived?: number
  change?: number
  createdAt: string
}

// ---- Report types ----
export interface RevenueReport {
  date: string
  orders: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

export interface TopProductReport {
  rank: number
  productId: number
  productName: string
  sku?: string
  qtySold: number
  revenue: number
}

export interface SummaryReport {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  totalOrders: number
  profitMargin: number
}

export interface StockValueReport {
  totalValue: number
  items: { productId: number; productName: string; sku?: string; stock: number; costPrice: number; value: number }[]
}

export const adminService = {
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    const { data } = await api.get<ApiResponse<DashboardData>>('/admin/dashboard')
    return data
  },

  async getCustomers(page = 1, pageSize = 20): Promise<ApiResponse<Customer[]>> {
    const { data } = await api.get<ApiResponse<Customer[]>>(`/admin/customers?page=${page}&pageSize=${pageSize}`)
    return data
  },

  async toggleCustomerActive(userId: string): Promise<ApiResponse<{ isActive: boolean }>> {
    const { data } = await api.put<ApiResponse<{ isActive: boolean }>>(`/admin/customers/${userId}/toggle-active`)
    return data
  },

  async getAllOrders(page = 1, pageSize = 20): Promise<ApiResponse<PagedResult<Order>>> {
    const { data } = await api.get<ApiResponse<PagedResult<Order>>>(`/orders/all?page=${page}&pageSize=${pageSize}`)
    return data
  },

  async updateOrderStatus(id: number, status: number): Promise<ApiResponse<object>> {
    const { data } = await api.put<ApiResponse<object>>(`/orders/${id}/status`, { status })
    return data
  },

  async createProduct(formData: FormData): Promise<ApiResponse<Product>> {
    const { data } = await api.post<ApiResponse<Product>>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async updateProduct(id: number, formData: FormData): Promise<ApiResponse<Product>> {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async deleteProduct(id: number): Promise<ApiResponse<object>> {
    const { data } = await api.delete<ApiResponse<object>>(`/products/${id}`)
    return data
  },

  async createCategory(formData: FormData): Promise<ApiResponse<Category>> {
    const { data } = await api.post<ApiResponse<Category>>('/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async getCoupons(): Promise<ApiResponse<Coupon[]>> {
    const { data } = await api.get<ApiResponse<Coupon[]>>('/coupons')
    return data
  },

  async createCoupon(coupon: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    const { data } = await api.post<ApiResponse<Coupon>>('/coupons', coupon)
    return data
  },

  async updateCoupon(id: number, coupon: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    const { data } = await api.put<ApiResponse<Coupon>>(`/coupons/${id}`, coupon)
    return data
  },

  async deleteCoupon(id: number): Promise<ApiResponse<object>> {
    const { data } = await api.delete<ApiResponse<object>>(`/coupons/${id}`)
    return data
  },

  // ---- Suppliers ----
  async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    const { data } = await api.get<ApiResponse<Supplier[]>>('/suppliers')
    return data
  },
  async createSupplier(body: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    const { data } = await api.post<ApiResponse<Supplier>>('/suppliers', body)
    return data
  },
  async updateSupplier(id: number, body: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    const { data } = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, body)
    return data
  },
  async deleteSupplier(id: number): Promise<ApiResponse<object>> {
    const { data } = await api.delete<ApiResponse<object>>(`/suppliers/${id}`)
    return data
  },

  // ---- Purchase Orders ----
  async getPurchaseOrders(supplierId?: number): Promise<ApiResponse<PurchaseOrder[]>> {
    const q = supplierId ? `?supplierId=${supplierId}` : ''
    const { data } = await api.get<ApiResponse<PurchaseOrder[]>>(`/purchase-orders${q}`)
    return data
  },
  async getPurchaseOrderById(id: number): Promise<ApiResponse<PurchaseOrder>> {
    const { data } = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`)
    return data
  },
  async createPurchaseOrder(body: { supplierId: number; notes?: string; items: { productId: number; quantity: number; costPrice: number }[] }): Promise<ApiResponse<PurchaseOrder>> {
    const { data } = await api.post<ApiResponse<PurchaseOrder>>('/purchase-orders', body)
    return data
  },
  async receivePurchaseOrder(id: number): Promise<ApiResponse<object>> {
    const { data } = await api.post<ApiResponse<object>>(`/purchase-orders/${id}/receive`)
    return data
  },
  async payPurchaseOrder(id: number, amount: number): Promise<ApiResponse<object>> {
    const { data } = await api.post<ApiResponse<object>>(`/purchase-orders/${id}/pay`, { amount })
    return data
  },

  // ---- Warehouse ----
  async getStock(): Promise<ApiResponse<StockItem[]>> {
    const { data } = await api.get<ApiResponse<StockItem[]>>('/warehouse/stock')
    return data
  },
  async getStockTransactions(params?: { type?: string; page?: number; pageSize?: number }): Promise<ApiResponse<PagedResult<StockTransaction>>> {
    const q = new URLSearchParams()
    if (params?.type) q.set('type', params.type)
    if (params?.page) q.set('page', String(params.page))
    if (params?.pageSize) q.set('pageSize', String(params.pageSize))
    const { data } = await api.get<ApiResponse<PagedResult<StockTransaction>>>(`/warehouse/transactions?${q}`)
    return data
  },
  async adjustStock(productId: number, newQuantity: number, notes: string): Promise<ApiResponse<object>> {
    const { data } = await api.post<ApiResponse<object>>('/warehouse/adjust', { productId, newQuantity, notes })
    return data
  },
  async createInventoryCheck(items: { productId: number; actualStock: number }[], notes?: string): Promise<ApiResponse<InventoryCheck>> {
    const { data } = await api.post<ApiResponse<InventoryCheck>>('/warehouse/inventory-checks', { items, notes })
    return data
  },
  async getInventoryChecks(): Promise<ApiResponse<InventoryCheck[]>> {
    const { data } = await api.get<ApiResponse<InventoryCheck[]>>('/warehouse/inventory-checks')
    return data
  },
  async completeInventoryCheck(id: number): Promise<ApiResponse<object>> {
    const { data } = await api.post<ApiResponse<object>>(`/warehouse/inventory-checks/${id}/complete`)
    return data
  },

  // ---- POS ----
  async posSearchProducts(query: string): Promise<ApiResponse<PosProduct[]>> {
    const { data } = await api.get<ApiResponse<PosProduct[]>>(`/pos/products?q=${encodeURIComponent(query)}`)
    return data
  },
  async posCreateOrder(order: PosOrderRequest): Promise<ApiResponse<PosOrderResponse>> {
    const { data } = await api.post<ApiResponse<PosOrderResponse>>('/pos/order', order)
    return data
  },

  // ---- Reports ----
  async getRevenueReport(from: string, to: string, groupBy: string): Promise<ApiResponse<RevenueReport[]>> {
    const { data } = await api.get<ApiResponse<RevenueReport[]>>(`/reports/revenue?from=${from}&to=${to}&groupBy=${groupBy}`)
    return data
  },
  async getTopProductsReport(from: string, to: string, limit: number): Promise<ApiResponse<TopProductReport[]>> {
    const { data } = await api.get<ApiResponse<TopProductReport[]>>(`/reports/top-products?from=${from}&to=${to}&limit=${limit}`)
    return data
  },
  async getSummaryReport(from: string, to: string): Promise<ApiResponse<SummaryReport>> {
    const { data } = await api.get<ApiResponse<SummaryReport>>(`/reports/summary?from=${from}&to=${to}`)
    return data
  },
  async getStockValueReport(): Promise<ApiResponse<StockValueReport>> {
    const { data } = await api.get<ApiResponse<StockValueReport>>('/reports/stock-value')
    return data
  },
}
