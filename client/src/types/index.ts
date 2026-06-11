export interface User {
  id: string
  fullName: string
  email: string
  phone?: string
  address?: string
  avatar?: string
  dateOfBirth?: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiration: string
  userId: string
  email: string
  fullName: string
  avatar?: string
  roles: string[]
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  imageUrl?: string
  parentId?: number
  parentName?: string
  sortOrder: number
  isActive: boolean
  productCount: number
  children: Category[]
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  shortDescription?: string
  price: number
  salePrice?: number
  displayPrice: number
  stock: number
  sku?: string
  categoryId: number
  categoryName: string
  isFeatured: boolean
  isNew: boolean
  isActive: boolean
  soldCount: number
  averageRating: number
  reviewCount: number
  mainImageUrl?: string
  imageUrls: string[]
  createdAt: string
}

export interface ProductFilter {
  search?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  isFeatured?: boolean
  isNew?: boolean
  sortBy?: string
  sortOrder?: string
  page?: number
  pageSize?: number
}

export interface Review {
  id: number
  productId: number
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment?: string
  createdAt: string
}

export interface CartItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  subTotal: number
  stock: number
}

export interface Cart {
  id: number
  items: CartItem[]
  total: number
  itemCount: number
}

export interface Order {
  id: number
  orderCode: string
  receiverName: string
  receiverPhone: string
  shippingAddress: string
  subTotal: number
  shippingFee: number
  discountAmount: number
  total: number
  status: number
  statusText: string
  paymentMethod: number
  paymentMethodText: string
  paymentStatus: number
  note?: string
  couponCode?: string
  createdAt: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  subTotal: number
}

export interface Coupon {
  id: number
  code: string
  description?: string
  isPercent: boolean
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  startDate?: string
  endDate?: string
  isActive: boolean
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors: string[]
}

export interface DashboardData {
  totalOrders: number
  totalOrdersToday: number
  totalRevenue: number
  totalRevenueToday: number
  totalCustomers: number
  totalProducts: number
  pendingOrders: number
  lowStockProducts: number
  revenueChart: RevenueByDate[]
  topProducts: TopProduct[]
  recentOrders: RecentOrder[]
}

export interface RevenueByDate {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  productId: number
  productName: string
  productImage?: string
  soldCount: number
  revenue: number
}

export interface RecentOrder {
  id: number
  orderCode: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

export interface Customer {
  id: string
  fullName: string
  email: string
  phone?: string
  address?: string
  avatar?: string
  isActive: boolean
  createdAt: string
  totalOrders: number
  totalSpent: number
  totalTopUp: number
  walletBalance: number
  lastOrderAt?: string
}

export interface Notification {
  id: number
  title: string
  content: string
  type: string
  targetUserId?: string
  targetGroup?: string
  createdAt: string
  isRead: boolean
}
