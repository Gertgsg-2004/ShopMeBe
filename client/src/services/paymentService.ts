import api from './api'

export const paymentService = {
  async createVnPayUrl(orderId: number, amount: number): Promise<string> {
    const { data } = await api.post<{ success: boolean; data: string }>('/payment/vnpay/create', { orderId, amount })
    return data.data
  }
}
