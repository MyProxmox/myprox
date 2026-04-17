import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

function safeGetToken(): string | null {
  try {
    if (typeof window === 'undefined') return null
    const ls = window.localStorage
    if (typeof ls?.getItem !== 'function') return null
    return ls.getItem('ops_access_token')
  } catch {
    return null
  }
}

function safeClearAuth() {
  try {
    if (typeof window === 'undefined') return
    const ls = window.localStorage
    if (typeof ls?.removeItem === 'function') {
      ls.removeItem('ops_access_token')
      ls.removeItem('ops_user')
    }
    document.cookie = 'ops_token=; path=/; max-age=0'
    window.location.href = '/login'
  } catch {
    // ignore
  }
}

api.interceptors.request.use(
  (config) => {
    const token = safeGetToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) safeClearAuth()
    return Promise.reject(error)
  }
)

export default api
