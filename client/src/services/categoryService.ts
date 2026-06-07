import api from './api'
import { ApiResponse, Category } from '../types'

export const categoryService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories')
    return data
  },

  async getCategory(slug: string): Promise<ApiResponse<Category>> {
    const { data } = await api.get<ApiResponse<Category>>(`/categories/${slug}`)
    return data
  },
}
