import api from './api'
import { ApiResponse, PagedResult, Product, ProductFilter, Review } from '../types'

export const productService = {
  async getProducts(filter: ProductFilter = {}): Promise<ApiResponse<PagedResult<Product>>> {
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const { data } = await api.get<ApiResponse<PagedResult<Product>>>(`/products?${params}`)
    return data
  },

  async getProduct(slug: string): Promise<ApiResponse<Product>> {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${slug}`)
    return data
  },

  async getFeatured(count = 8): Promise<ApiResponse<Product[]>> {
    const { data } = await api.get<ApiResponse<Product[]>>(`/products/featured?count=${count}`)
    return data
  },

  async getNew(count = 8): Promise<ApiResponse<Product[]>> {
    const { data } = await api.get<ApiResponse<Product[]>>(`/products/new?count=${count}`)
    return data
  },

  async getRelated(productId: number, categoryId: number, count = 4): Promise<ApiResponse<Product[]>> {
    const { data } = await api.get<ApiResponse<Product[]>>(`/products/${productId}/related?categoryId=${categoryId}&count=${count}`)
    return data
  },

  async getReviews(productId: number): Promise<ApiResponse<Review[]>> {
    const { data } = await api.get<ApiResponse<Review[]>>(`/reviews/product/${productId}`)
    return data
  },

  async createReview(productId: number, rating: number, comment?: string): Promise<ApiResponse<Review>> {
    const { data } = await api.post<ApiResponse<Review>>('/reviews', { productId, rating, comment })
    return data
  },
}
