import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiJson } from '../api/client'
import './auth.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = useMemo(() => (params.get('token') || '').trim(), [params])
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== password2) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setLoading(true)
    try {
      await apiJson(
        '/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ token, new_password: password }),
        },
        null
      )
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      const msg = err?.body?.detail ?? err?.message ?? '재설정 실패'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-page__bg" aria-hidden />
        <div className="auth-page__inner">
          <div className="auth-page__card" style={{ padding: 24 }}>
            <p style={{ color: '#64748b', marginBottom: 16 }}>재설정 링크가 없습니다. 비밀번호 찾기를 다시 요청해 주세요.</p>
            <Link to="/forgot-password" className="auth-submit" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
              비밀번호 찾기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg" aria-hidden />
      <div className="auth-page__inner">
        <div style={{ marginBottom: 18 }}>
          <Link to="/login" className="auth-page__back">
            ← 로그인으로
          </Link>
          <div style={{ color: '#64748b', fontSize: 13, letterSpacing: 0.2, marginTop: 14 }}>Account</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>새 비밀번호 설정</h1>
          <div style={{ marginTop: 8, color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>새 비밀번호를 입력한 뒤 저장하세요.</div>
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

        {done && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #bbf7d0',
              background: 'linear-gradient(180deg, #f0fdf4 0%, #fff 100%)',
              color: '#166534',
              fontSize: 14,
            }}
          >
            비밀번호가 변경되었습니다. 잠시 후 로그인 화면으로 이동합니다.
          </div>
        )}

        <div className="auth-page__card">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>새 비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={done}
                  minLength={6}
                  className="auth-input"
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>새 비밀번호 확인</span>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={done}
                  minLength={6}
                  className="auth-input"
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="submit" disabled={loading || done} className="auth-submit">
                {loading ? '저장 중…' : '비밀번호 저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
