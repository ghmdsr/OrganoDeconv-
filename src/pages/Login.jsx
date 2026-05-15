import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(from === '/login' ? '/' : from, { replace: true })
    } catch (err) {
      let msg = '로그인 실패'
      if (err.body != null) {
        if (typeof err.body === 'object' && err.body.detail != null) {
          msg = typeof err.body.detail === 'string' ? err.body.detail : JSON.stringify(err.body.detail)
        } else if (typeof err.body === 'string' && err.body.length > 0) {
          msg = err.body.length > 120 ? err.body.slice(0, 120) + '…' : err.body
        }
      } else if (err.message) {
        msg = err.message
      }
      if (err.status) msg = `[${err.status}] ${msg}`
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg" aria-hidden />
      <div className="auth-page__inner">
        <div style={{ marginBottom: 18 }}>
          <Link to="/" className="auth-page__back">
            ← Back to home
          </Link>
          <div style={{ color: '#64748b', fontSize: 13, letterSpacing: 0.2, marginTop: 14 }}>Account</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>로그인</h1>
          <div style={{ marginTop: 8, color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
            계정으로 로그인해 분석을 진행하세요.
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #fecaca',
              background: 'linear-gradient(180deg, #fff1f2 0%, #fff 100%)',
              color: '#b91c1c',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div className="auth-page__card">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>사용자명</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="auth-input"
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="auth-input"
              />
            </label>

            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <Link to="/forgot-password" style={{ color: '#0f766e', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 6,
              }}
            >
              <Link to="/register" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                계정이 없나요? 회원가입
              </Link>
              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? '로그인 중…' : '로그인'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
