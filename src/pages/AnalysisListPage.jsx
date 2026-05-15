import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ORGAN_MODELS } from '../constants/organModels'

function organModelLabel(organId) {
  const id = organId || 'intestine'
  const m = ORGAN_MODELS.find((o) => o.id === id)
  if (m) return m.label
  return id.replace(/_/g, ' ')
}

export default function AnalysisListPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    apiJson('/analysis/sessions', {}, token)
      .then(setSessions)
      .catch((e) => setError(e.body?.detail || e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <p>Loading…</p>

  async function handleDelete(taskId) {
    if (!token) return
    const ok = window.confirm(
      `Remove analysis ${taskId.slice(0, 8)}… (${organModelLabel(
        sessions.find((x) => x.task_id === taskId)?.organ_id,
      )}) from this list? This cannot be undone.`,
    )
    if (!ok) return
    setDeletingId(taskId)
    setError('')
    try {
      await apiJson(`/analysis/sessions/${encodeURIComponent(taskId)}`, { method: 'DELETE' }, token)
      setSessions((prev) => prev.filter((s) => s.task_id !== taskId))
    } catch (e) {
      setError(e.body?.detail || e.message || 'Failed to delete analysis')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteAll() {
    if (!token) return
    const ok = window.confirm('Delete all analyses from this list? This cannot be undone.')
    if (!ok) return
    setDeletingAll(true)
    setError('')
    try {
      await apiJson('/analysis/sessions', { method: 'DELETE' }, token)
      setSessions([])
    } catch (e) {
      setError(e.body?.detail || e.message || 'Failed to delete all analyses')
    } finally {
      setDeletingAll(false)
    }
  }

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f8fb 0%, #ffffff 55%)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#667085', fontSize: 13, letterSpacing: 0.2 }}>Analyses</div>
              <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#101828' }}>My analyses</h1>
              <div style={{ marginTop: 6, color: '#667085', fontSize: 13 }}>
                View analysis sessions you have run; you can delete items individually.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ color: '#667085', fontSize: 13 }}>
                Total: <strong style={{ color: '#101828' }}>{sessions.length}</strong>
              </div>
              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deletingId !== null || deletingAll}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #fda29b',
                    background: '#fffbfa',
                    color: '#b42318',
                    fontWeight: 700,
                    cursor: deletingId !== null || deletingAll ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deletingAll ? 'Deleting all…' : 'Delete all'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #fda29b',
                background: '#fffbfa',
                color: '#b42318',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <section
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 16,
              background: '#fff',
              border: '1px solid #eaecf0',
              boxShadow: '0 8px 28px rgba(16, 24, 40, 0.06)',
            }}
          >
            {sessions.length === 0 ? (
              <div style={{ padding: 14, borderRadius: 14, border: '1px dashed #d0d5dd', background: '#fcfcfd', color: '#667085' }}>
                No analyses yet. Upload a file on the Upload page and run an analysis.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map((s) => (
                  <div
                    key={s.task_id}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: '1px solid #eaecf0',
                      background: '#fcfcfd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      const t = e.target
                      if (t && (t.closest?.('button') || t.closest?.('a'))) return
                      navigate(`/analysis/result/${s.task_id}/composition`)
                    }}
                  >
                    <div style={{ minWidth: 320, flex: '1 1 420px' }}>
                      <div style={{ fontWeight: 700, color: '#101828', lineHeight: 1.25 }}>
                        <Link to={`/analysis/result/${s.task_id}/composition`} style={{ color: '#101828', textDecoration: 'none' }}>
                          {s.task_id.slice(0, 8)}… · {organModelLabel(s.organ_id)}
                        </Link>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#667085' }}>
                        Created: {s.created_at?.slice(0, 19)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                      <span
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: '1px solid #e4e7ec',
                          background: '#fff',
                          fontSize: 13,
                          color: s.status === 'SUCCESS' ? '#067647' : s.status === 'FAILURE' ? '#b42318' : '#344054',
                          fontWeight: 700,
                        }}
                      >
                        {s.status}
                      </span>
                      <Link
                        to={`/analysis/result/${s.task_id}/composition`}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          border: '1px solid #d0d5dd',
                          background: '#fff',
                          color: '#101828',
                          fontWeight: 700,
                          textDecoration: 'none',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(s.task_id)
                        }}
                        disabled={deletingId !== null}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          border: '1px solid #fda29b',
                          background: '#fffbfa',
                          color: '#b42318',
                          fontWeight: 700,
                          cursor: deletingId !== null ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {deletingId === s.task_id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
