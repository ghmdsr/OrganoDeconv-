import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiJson, apiUploadFile } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useOrganModel } from '../context/OrganModelContext'

const ALLOWED = 'CSV, TSV, TXT (max 10MB)'
/** Vite `public/` — same content as data_for_runningAlgorithm/bulk_input_example.txt */
const EXAMPLE_BULK_URL = '/bulk_input_example.txt'

export default function UploadPage() {
  const { token } = useAuth()
  const { organId } = useOrganModel()
  const navigate = useNavigate()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [runningId, setRunningId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!token) return
    apiJson('/uploads', {}, token)
      .then(setUploads)
      .catch((e) => setError(e.body?.detail || e.message))
      .finally(() => setLoading(false))
  }, [token])

  function handleFileChange(e) {
    setFile(e.target.files?.[0] || null)
    setError('')
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !token) return
    setUploading(true)
    setError('')
    try {
      const created = await apiUploadFile(file, token)
      setUploads((prev) => [created, ...prev])
      setFile(null)
      e.target.reset()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      setError(e.body?.detail || e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRunAnalysis(uploadId) {
    if (!token) return
    const runOrganId = organId === 'bone' ? 'bone' : 'intestine'
    setRunningId(uploadId)
    setError('')
    try {
      const res = await apiJson(
        '/analysis/run',
        {
          method: 'POST',
          body: JSON.stringify({ upload_id: uploadId, organ_id: runOrganId }),
        },
        token,
      )
      navigate(`/analysis/result/${res.task_id}/composition`)
    } catch (e) {
      setError(e.body?.detail || e.message || 'Failed to start analysis')
    } finally {
      setRunningId(null)
    }
  }

  async function handleDeleteUpload(uploadId, filename) {
    if (!token) return
    const ok = window.confirm(`Delete upload "${filename}"? This cannot be undone.`)
    if (!ok) return
    setDeletingId(uploadId)
    setError('')
    try {
      await apiJson(`/uploads/${encodeURIComponent(uploadId)}`, { method: 'DELETE' }, token)
      setUploads((prev) => prev.filter((u) => u.upload_id !== uploadId))
    } catch (e) {
      setError(e.body?.detail || e.message || 'Failed to delete upload')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteAllUploads() {
    if (!token) return
    const ok = window.confirm('Delete all of your uploads? This cannot be undone.')
    if (!ok) return
    setDeletingAll(true)
    setError('')
    try {
      await apiJson('/uploads', { method: 'DELETE' }, token)
      setUploads([])
    } catch (e) {
      setError(e.body?.detail || e.message || 'Failed to delete all uploads')
    } finally {
      setDeletingAll(false)
    }
  }

  if (loading) return <p>Loading list…</p>

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f8fb 0%, #ffffff 55%)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#667085', fontSize: 13, letterSpacing: 0.2 }}>Uploads</div>
              <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#101828' }}>File upload</h1>
              <div style={{ marginTop: 6, color: '#667085', fontSize: 13 }}>Allowed formats: {ALLOWED}</div>
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
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#101828' }}>Upload</h2>
                <div style={{ marginTop: 4, color: '#475467', fontSize: 13, lineHeight: 1.5 }}>
                  Before running an analysis, select the organ model from the left tab.
                </div>
                <div style={{ marginTop: 8, color: '#667085', fontSize: 13 }}>
                  Upload a <strong>TPM</strong> matrix, then run analysis from the list below.
                </div>
                <div style={{ marginTop: 8 }}>
                  <a
                    href={EXAMPLE_BULK_URL}
                    download="bulk_input_example.txt"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#175cd3',
                      textDecoration: 'none',
                    }}
                  >
                    Download example TPM file
                  </a>
                  <span style={{ marginLeft: 6, color: '#98a2b3', fontSize: 12 }}>(bulk_input_example.txt)</span>
                </div>
                <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: '1px solid #eaecf0', background: '#fcfcfd' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#344054', marginBottom: 6 }}>Input file format</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#475467', fontSize: 13, lineHeight: 1.6 }}>
                    <li>
                      <strong>Header</strong>: first column name is <code>gene</code>; remaining columns are sample IDs
                    </li>
                    <li>
                      <strong>Rows</strong>: gene symbols (HUGO)
                    </li>
                    <li>
                      <strong>Per-sample TPM</strong>: non-negative numeric TPM values per sample. Raw read counts are not
                      accepted.
                    </li>
                    <li>
                      <strong>Multiple samples</strong> can be included in one file.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpload} style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flex: '1 1 420px',
                  minWidth: 0,
                  flexWrap: 'wrap',
                }}
              >
                <input
                  ref={fileInputRef}
                  id="upload-matrix-file"
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileChange}
                  disabled={uploading}
                  aria-label="Choose TPM matrix file"
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: 'hidden',
                    clipPath: 'inset(50%)',
                    border: 0,
                  }}
                />
                <label
                  htmlFor="upload-matrix-file"
                  style={{
                    display: 'inline-block',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '1px solid #d0d5dd',
                    background: uploading ? '#f2f4f7' : '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    color: uploading ? '#98a2b3' : '#344054',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  }}
                >
                  Choose file
                </label>
                <span
                  style={{
                    fontSize: 14,
                    color: file ? '#101828' : '#667085',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    flex: '1 1 180px',
                  }}
                  title={file?.name}
                >
                  {file ? file.name : 'No file selected'}
                </span>
              </div>
              <button
                type="submit"
                disabled={!file || uploading}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid #d0d5dd',
                  background: uploading ? '#f2f4f7' : '#101828',
                  color: uploading ? '#667085' : '#fff',
                  fontWeight: 700,
                  cursor: !file || uploading ? 'not-allowed' : 'pointer',
                  boxShadow: uploading ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.08)',
                }}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </form>
          </section>

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
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#101828' }}>Your uploads</h2>
                <div style={{ marginTop: 4, color: '#667085', fontSize: 13 }}>You can delete items individually.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ color: '#667085', fontSize: 13 }}>
                  Total: <strong style={{ color: '#101828' }}>{uploads.length}</strong>
                </div>
                {uploads.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllUploads}
                    disabled={uploading || runningId !== null || deletingId !== null || deletingAll}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid #fda29b',
                      background: '#fffbfa',
                      color: '#b42318',
                      fontWeight: 700,
                      cursor: uploading || runningId !== null || deletingId !== null || deletingAll ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deletingAll ? 'Deleting all…' : 'Delete all'}
                  </button>
                )}
              </div>
            </div>

            {uploads.length === 0 ? (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: '1px dashed #d0d5dd', background: '#fcfcfd', color: '#667085' }}>
                No files uploaded yet.
              </div>
            ) : (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {uploads.map((u) => (
                  <div
                    key={u.upload_id}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: '1px solid #eaecf0',
                      background: '#fcfcfd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ minWidth: 320, flex: '1 1 420px' }}>
                      <div style={{ fontWeight: 700, color: '#101828', lineHeight: 1.25 }}>
                        {u.original_filename}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#667085' }}>
                        Uploaded: {u.created_at?.slice(0, 10)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => handleRunAnalysis(u.upload_id)}
                        disabled={runningId !== null || deletingId !== null}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          border: '1px solid #d0d5dd',
                          background: '#fff',
                          color: '#101828',
                          fontWeight: 700,
                          cursor: runningId !== null || deletingId !== null ? 'not-allowed' : 'pointer',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                        }}
                      >
                        {runningId === u.upload_id ? 'Running…' : 'Run analysis'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUpload(u.upload_id, u.original_filename)}
                        disabled={runningId !== null || deletingId !== null}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          border: '1px solid #fda29b',
                          background: '#fffbfa',
                          color: '#b42318',
                          fontWeight: 700,
                          cursor: runningId !== null || deletingId !== null ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {deletingId === u.upload_id ? 'Deleting…' : 'Delete'}
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
