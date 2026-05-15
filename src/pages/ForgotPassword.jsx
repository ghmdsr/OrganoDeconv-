import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api/client'
import './auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [devUrl, setDevUrl] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setDevUrl('')
    setLoading(true)
    try {
      const data = await apiJson(
        '/forgot-password',
        { method: 'POST', body: JSON.stringify({ email: email.trim() }) },
        null
      )
      setDone(true)
      if (data?.reset_url) setDevUrl(data.reset_url)
    } catch (err) {
      const msg = err?.body?.detail ?? err?.message ?? '요청 처리 실패'
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
          <Link to="/login" className="auth-page__back">
            ← 로그인으로
          </Link>
          <div style={{ color: '#64748b', fontSize: 13, letterSpacing: 0.2, marginTop: 14 }}>Account</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>비밀번호 찾기</h1>
          <div style={{ marginTop: 8, color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
            가입 시 사용한 이메일을 입력하세요. 메일이 설정된 서버에서는 재설정 링크가 발송됩니다.
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
              lineHeight: 1.5,
            }}
          >
            해당 이메일이 등록되어 있으면 비밀번호 재설정 안내가 발송되었습니다. 메일함과 스팸함을 확인해 주세요.
            {devUrl && (
              <div style={{ marginTop: 12, wordBreak: 'break-all' }}>
                <strong>개발 모드:</strong> 아래 링크로 바로 재설정할 수 있습니다.
                <br />
                <a href={devUrl} style={{ color: '#0f766e' }}>
                  {devUrl}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="auth-page__card">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>이메일</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={done}
                className="auth-input"
              />
            </label>

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
                로그인으로 돌아가기
              </Link>
              <button type="submit" disabled={loading || done} className="auth-submit">
                {loading ? '처리 중…' : done ? '완료' : '재설정 메일 보내기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
