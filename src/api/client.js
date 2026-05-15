/**
 * API 클라이언트. 토큰은 AuthContext에서 가져와 헤더에 붙임.
 * VITE_API_URL 비어 있으면 '/api' 사용 → Vite 프록시가 같은 서버의 8000으로 전달 (노트북이 8000 직접 접속 불필요).
 */
const BASE_URL = (import.meta.env.VITE_API_URL || '').trim() || '/api'

export function getBaseUrl() {
  return BASE_URL
}

function buildUrl(path) {
  if (path.startsWith('http')) return path
  const base = BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export async function apiFetch(path, options = {}, token = null) {
  const url = buildUrl(path)
  const headers = { ...options.headers }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (e) {
    const hint = BASE_URL === '/api' ? '백엔드(uvicorn)가 서버에서 실행 중인지 확인하세요.' : '백엔드(API) 서버가 실행 중인지 확인하세요.'
    throw new Error(`API 연결 실패 (${url}). ${hint}`)
  }
  if (!res.ok) {
    const err = new Error(res.statusText)
    err.status = res.status
    const text = await res.text()
    try {
      err.body = text ? JSON.parse(text) : null
    } catch {
      err.body = text
    }
    throw err
  }
  return res
}

export async function apiJson(path, options = {}, token = null) {
  const res = await apiFetch(path, options, token)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/** FormData로 파일 업로드 (POST /uploads) */
export async function apiUploadFile(file, token) {
  const url = buildUrl('/uploads')
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) {
    const err = new Error(res.statusText)
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
  return text ? JSON.parse(text) : null
}
