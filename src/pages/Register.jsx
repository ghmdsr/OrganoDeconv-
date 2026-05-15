import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './auth.css'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== password2) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await apiJson(
        '/register',
        {
          method: 'POST',
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password,
          }),
        },
        null
      )
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err?.body?.detail ?? err?.message ?? '회원가입 실패'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
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
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>회원가입</h1>
          <div style={{ marginTop: 8, color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
            계정을 만든 뒤 바로 로그인됩니다.
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="auth-input"
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>이메일</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="auth-input"
              />
            </label>

            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="auth-input"
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>비밀번호 확인</span>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="auth-input"
                />
              </label>
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
              <Link to="/login" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                이미 계정이 있나요? 로그인
              </Link>
              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? '생성 중…' : '회원가입'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

