import api from './api'

export interface OpsUser {
  id: string
  email: string
  name?: string
  role?: string
}

// Safe localStorage access — Next.js SSR provides a shim without getItem
function storage() {
  try {
    if (typeof window === 'undefined') return null
    const ls = window.localStorage
    if (typeof ls?.getItem !== 'function') return null
    return ls
  } catch {
    return null
  }
}

export async function login(email: string, password: string): Promise<OpsUser> {
  const response = await api.post('/api/v1/auth/login', { email, password })
  const { accessToken, refreshToken, user } = response.data

  const ls = storage()
  if (ls) {
    ls.setItem('ops_access_token', accessToken)
    if (refreshToken) ls.setItem('ops_refresh_token', refreshToken)
    ls.setItem('ops_user', JSON.stringify(user))
  }

  // Cookie for middleware route guard
  if (typeof document !== 'undefined') {
    const maxAge = 60 * 60 * 24 * 7
    document.cookie = `ops_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Strict`
  }

  return user as OpsUser
}

export function logout(): void {
  const ls = storage()
  if (ls) {
    ls.removeItem('ops_access_token')
    ls.removeItem('ops_refresh_token')
    ls.removeItem('ops_user')
  }
  if (typeof document !== 'undefined') {
    document.cookie = 'ops_token=; path=/; max-age=0'
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

export function getToken(): string | null {
  return storage()?.getItem('ops_access_token') ?? null
}

export function getUser(): OpsUser | null {
  const raw = storage()?.getItem('ops_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as OpsUser
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
