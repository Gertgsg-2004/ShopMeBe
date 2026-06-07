import api from './api'
import { ApiResponse, AuthResponse, User } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password })
    return data
  },

  async register(fullName: string, email: string, password: string, confirmPassword: string, phone?: string): Promise<ApiResponse<AuthResponse>> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      fullName, email, password, confirmPassword, phone
    })
    return data
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User>>('/auth/profile')
    return data
  },

  async updateProfile(dto: { fullName: string; phone?: string; address?: string; dateOfBirth?: string }): Promise<ApiResponse<object>> {
    const { data } = await api.put<ApiResponse<object>>('/auth/profile', dto)
    return data
  },

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<object>> {
    const { data } = await api.post<ApiResponse<object>>('/auth/change-password', {
      currentPassword, newPassword, confirmPassword
    })
    return data
  },
}
