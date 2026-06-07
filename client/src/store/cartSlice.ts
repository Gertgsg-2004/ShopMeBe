import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Cart } from '../types'
import { cartService } from '../services/cartService'

interface CartState {
  cart: Cart | null
  loading: boolean
  error: string | null
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
}

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await cartService.getCart()
    return response.data || null
  } catch {
    return rejectWithValue('Không thể tải giỏ hàng')
  }
})

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity }: { productId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await cartService.addToCart(productId, quantity)
      if (!response.success) return rejectWithValue(response.message)
      return response.data!
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Thêm vào giỏ thất bại')
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }: { itemId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await cartService.updateItem(itemId, quantity)
      return response.data!
    } catch {
      return rejectWithValue('Cập nhật thất bại')
    }
  }
)

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId: number, { rejectWithValue }) => {
    try {
      const response = await cartService.removeItem(itemId)
      return response.data!
    } catch {
      return rejectWithValue('Xóa thất bại')
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartState: (state) => {
      state.cart = null
    },
  },
  extraReducers: (builder) => {
    const setCart = (state: CartState, action: PayloadAction<Cart>) => {
      state.cart = action.payload
      state.loading = false
    }

    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true })
      .addCase(fetchCart.fulfilled, (state, action) => { state.cart = action.payload; state.loading = false })
      .addCase(fetchCart.rejected, (state) => { state.loading = false })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeCartItem.fulfilled, setCart)
  },
})

export const { clearCartState } = cartSlice.actions
export default cartSlice.reducer
