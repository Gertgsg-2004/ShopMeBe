import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthResponse, User } from '../types'
import { authService } from '../services/authService'

interface AuthState {
  user: User | null
  token: string | null
  roles: string[]
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const token = localStorage.getItem('token')
const userStr = localStorage.getItem('user')
const user = userStr ? JSON.parse(userStr) : null

const initialState: AuthState = {
  user,
  token,
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),
  isAuthenticated: !!token,
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password)
      if (!response.success) return rejectWithValue(response.message || 'Đăng nhập thất bại')
      return response.data!
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Đăng nhập thất bại')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (dto: { fullName: string; email: string; password: string; confirmPassword: string; phone?: string }, { rejectWithValue }) => {
    try {
      const response = await authService.register(dto.fullName, dto.email, dto.password, dto.confirmPassword, dto.phone)
      if (!response.success) return rejectWithValue(response.message || 'Đăng ký thất bại')
      return response.data!
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Đăng ký thất bại')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.roles = []
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('roles')
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.roles = action.payload.roles
        state.user = {
          id: action.payload.userId,
          fullName: action.payload.fullName,
          email: action.payload.email,
          avatar: action.payload.avatar,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem('token', action.payload.token)
        if (action.payload.refreshToken) localStorage.setItem('refreshToken', action.payload.refreshToken)
        localStorage.setItem('user', JSON.stringify(state.user))
        localStorage.setItem('roles', JSON.stringify(action.payload.roles))
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.roles = action.payload.roles
        state.user = {
          id: action.payload.userId,
          fullName: action.payload.fullName,
          email: action.payload.email,
          avatar: action.payload.avatar,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(state.user))
        localStorage.setItem('roles', JSON.stringify(action.payload.roles))
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, updateUser } = authSlice.actions
export default authSlice.reducer
