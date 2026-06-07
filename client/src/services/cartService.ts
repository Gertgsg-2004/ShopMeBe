import api from './api'
import { ApiResponse, Cart } from '../types'

export const cartService = {
  async getCart(): Promise<ApiResponse<Cart>> {
    const { data } = await api.get<ApiResponse<Cart>>('/cart')
    return data
  },

  async addToCart(productId: number, quantity = 1): Promise<ApiResponse<Cart>> {
    const { data } = await api.post<ApiResponse<Cart>>('/cart/add', { productId, quantity })
    return data
  },

  async updateItem(itemId: number, quantity: number): Promise<ApiResponse<Cart>> {
    const { data } = await api.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity })
    return data
  },

  async removeItem(itemId: number): Promise<ApiResponse<Cart>> {
    const { data } = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`)
    return data
  },

  async clearCart(): Promise<ApiResponse<object>> {
    const { data } = await api.delete<ApiResponse<object>>('/cart')
    return data
  },
}
