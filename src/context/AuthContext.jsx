import { createContext, useCallback, useContext, useState } from 'react'
import { apiJson, getBaseUrl } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    try {
      return localStorage.getItem('token')
    } catch {
      return null
    }
  })
  const [user, setUser] = useState(null)

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken)
      setTokenState(newToken)
    } else {
      localStorage.removeItem('token')
      setTokenState(null)
      setUser(null)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    const url = `${getBaseUrl()}/token`
    let res
    try {
      res = await fetch(url, {
        method: 'POST',
        body: form,
      })
    } catch (e) {
      throw new Error(
        'API 서버에 연결할 수 없습니다. 서버에서 백엔드(uvicorn)가 실행 중인지 확인하세요.'
      )
    }
    if (!res.ok) {
      const err = new Error('Login failed')
      err.status = res.status
      const text = await res.text()
      try {
        err.body = text ? JSON.parse(text) : null
      } catch {
        err.body = text
      }
      throw err
    }
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    setToken(data.access_token)
    return data
  }, [setToken])

  const logout = useCallback(() => {
    setToken(null)
  }, [setToken])

  const fetchUser = useCallback(async () => {
    if (!token) return null
    const data = await apiJson('/users/me', {}, token)
    setUser(data)
    return data
  }, [token])

  const value = {
    token,
    user,
    login,
    logout,
    setToken,
    fetchUser,
    isLoggedIn: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
