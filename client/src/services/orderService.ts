import api from './api'
import { ApiResponse, Order, PagedResult } from '../types'

export const orderService = {
  async getMyOrders(page = 1, pageSize = 10): Promise<ApiResponse<PagedResult<Order>>> {
    const { data } = await api.get<ApiResponse<PagedResult<Order>>>(`/orders?page=${page}&pageSize=${pageSize}`)
    return data
  },

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`)
    return data
  },

  async createOrder(dto: {
    receiverName: string
    receiverPhone: string
    shippingAddress: string
    paymentMethod: number
    note?: string
    couponCode?: string
  }): Promise<ApiResponse<Order>> {
    const { data } = await api.post<ApiResponse<Order>>('/orders', dto)
    return data
  },

  async cancelOrder(id: number): Promise<ApiResponse<object>> {
    const { data } = await api.post<ApiResponse<object>>(`/orders/${id}/cancel`)
    return data
  },

  async validateCoupon(code: string, orderAmount: number): Promise<ApiResponse<{ discount: number; message: string }>> {
    const { data } = await api.post<ApiResponse<{ discount: number; message: string }>>('/coupons/validate', { code, orderAmount })
    return data
  },
}
