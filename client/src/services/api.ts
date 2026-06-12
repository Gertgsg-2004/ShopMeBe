import axios, { AxiosError } from 'axios'

const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null
  try {
    // Use bare axios to avoid interceptor recursion
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
    const payload = data?.data
    if (payload?.token) {
      localStorage.setItem('token', payload.token)
      if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
      return payload.token
    }
  } catch {
    // refresh failed — fall through to logout
  }
  return null
}

function clearSessionAndRedirect() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  localStorage.removeItem('roles')
  window.location.href = '/dang-nhap'
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any
    const isAuthEndpoint = typeof original?.url === 'string' && original.url.includes('/auth/')
    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      // Deduplicate concurrent refresh attempts
      if (!refreshPromise) refreshPromise = tryRefreshToken().finally(() => { refreshPromise = null })
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      clearSessionAndRedirect()
    }
    return Promise.reject(error)
  }
)

export default api
