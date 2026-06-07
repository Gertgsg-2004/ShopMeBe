import api from './api'
import { ApiResponse, Customer, DashboardData, PagedResult, Order, Product, Category, Coupon } from '../types'

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
}
