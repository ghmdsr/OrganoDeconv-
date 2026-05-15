import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiFetch, apiJson } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { sortCellTypesByDifferentiation } from '../constants/cellTypeOrder'

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"'
        i++
      } else inQ = !inQ
    } else if (!inQ && c === ',') {
      out.push(cur.trim())
      cur = ''
    } else cur += c
  }
  out.push(cur.trim())
  return out
}

function parseProportionVal(s) {
  if (s == null || s === '') return NaN
  const t = String(s).trim().replace(/\s/g, '').replace(',', '.')
  return Number(t)
}

/**
 * Parse composition tables (tab/comma/semicolon/whitespace-separated).
 * @returns {{ ok: true, table: { headers: string[], rows: object[] } } | { ok: false, error: string }}
 */
function parseCompositionTable(text) {
  const raw = String(text).replace(/^\uFEFF/, '').trim()
  if (!raw) return { ok: false, error: 'The server returned an empty body.' }
  const head = raw.trimStart()
  if (head.startsWith('<')) return { ok: false, error: 'Response is HTML (e.g. login or 404), not CSV.' }
  if (head.startsWith('{') || head.startsWith('[')) {
    return { ok: false, error: 'Response is JSON. The composition.csv URL may be wrong.' }
  }

  const lines = raw
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length < 2) return { ok: false, error: 'No data rows after the header.' }

  const tryBuild = (matrix) => {
    const header = matrix[0].map((c) => c.replace(/^"|"$/g, '').replace(/\uFEFF/g, '').trim())
    if (header.length < 3) return null
    const h0 = header[0] || 'col0'
    const h1 = header[1] || 'col1'
    const h2 = header[2] || 'col2'
    const body = matrix.slice(1).filter((row) => row && row.length >= 3)
    if (body.length === 0) return null
    const rows = body.map((row) => ({
      [h0]: String(row[0] ?? '').replace(/^"|"$/g, '').trim(),
      [h1]: String(row[1] ?? '').replace(/^"|"$/g, '').trim(),
      [h2]: String(row[2] ?? '').replace(/^"|"$/g, '').trim(),
    }))
    let valid = 0
    for (const r of rows) {
      const p = parseProportionVal(r[h2])
      if (r[h0] && r[h1] && !Number.isNaN(p)) valid++
    }
    if (valid === 0) return null
    return { headers: [h0, h1, h2], rows }
  }

  const tabM = lines.map((l) => l.split('\t').map((c) => c.trim()))
  if (tabM[0].length >= 3) {
    const t = tryBuild(tabM)
    if (t) return { ok: true, table: t }
  }

  const semiM = lines.map((l) => l.split(';').map((c) => c.trim()))
  if (semiM[0].length >= 3) {
    const t = tryBuild(semiM)
    if (t) return { ok: true, table: t }
  }

  const csvM = lines.map((l) => parseCsvLine(l))
  if (csvM[0].length >= 3) {
    const t = tryBuild(csvM)
    if (t) return { ok: true, table: t }
  }

  const wsM = lines.map((l) => l.trim().split(/\s+/))
  const allThree = wsM.every((r) => r.length === 3)
  if (allThree && wsM[0].length === 3) {
    const t = tryBuild(wsM)
    if (t) return { ok: true, table: t }
  }

  return {
    ok: false,
    error:
      'Could not detect sample_id, cell_type, and proportion columns. Use tab-, comma-, or semicolon-separated CSV.',
  }
}

/** Gene column + per-sample numeric columns (TSV) → { samples, byGene: Map upperGene → { [sample]: number } } */
function parseGeneExpressionTsv(text) {
  const raw = String(text).replace(/^\uFEFF/, '').trim()
  if (!raw) return null
  const lines = raw.split(/\r\n|\n|\r/).filter((l) => l.length > 0)
  if (lines.length < 2) return null
  const header = lines[0].split('\t').map((c) => c.replace(/^"|"$/g, '').trim())
  if (header.length < 2) return null
  const samples = header.slice(1)
  const byGene = new Map()
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t')
    const g = String(parts[0] ?? '')
      .replace(/^"|"$/g, '')
      .trim()
    if (!g) continue
    const row = {}
    for (let j = 0; j < samples.length; j++) {
      const v = parts[j + 1]
      const n = v != null && String(v).trim() !== '' ? Number(String(v).replace(',', '.')) : NaN
      row[samples[j]] = Number.isFinite(n) ? n : NaN
    }
    byGene.set(g.toUpperCase(), row)
  }
  return { samples, byGene }
}

const VALID_RESULT_PANELS = new Set(['composition', 'matched-gex'])

export default function AnalysisResultPage() {
  const { taskId, resultPanel } = useParams()
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tableRows, setTableRows] = useState(null)
  const [csvLoadError, setCsvLoadError] = useState('')
  /** Selected sample for the composition scatter (cell type × proportion) */
  const [selectedSampleForPlot, setSelectedSampleForPlot] = useState('')
  const [csvDownloading, setCsvDownloading] = useState(false)
  const csvLoadedForTaskId = useRef(null)
  /** URL `resultPanel`: composition | matched-gex (matches Layout sidebar) */
  const resultTab = resultPanel === 'matched-gex' ? 'matched_gex' : 'composition'
  const [matchedGexDownloading, setMatchedGexDownloading] = useState(false)
  /** Matched-GEX tab: cached predicted vs. observed expression TSVs */
  const [gexPairCache, setGexPairCache] = useState(null)
  const [gexPairLoading, setGexPairLoading] = useState(false)
  const [gexPairError, setGexPairError] = useState('')
  const [geneInput, setGeneInput] = useState('')
  const [geneBarRows, setGeneBarRows] = useState(null)
  const [geneBarNotice, setGeneBarNotice] = useState('')
  /** Sample for gene-level bar chart (same selector pattern as predicted composition tab) */
  const [selectedSampleForGenePlot, setSelectedSampleForGenePlot] = useState('')

  useEffect(() => {
    if (!token || !taskId) return
    apiJson(`/analysis/result/${taskId}`, {}, token)
      .then(setData)
      .catch((e) => setError(e.body?.detail || e.message))
  }, [token, taskId])

  useEffect(() => {
    if (!token || !taskId || !data || data.state !== 'SUCCESS') {
      setCsvLoadError('')
      if (data?.state !== 'SUCCESS') {
        setTableRows(null)
        csvLoadedForTaskId.current = null
      }
      return
    }
    if (csvLoadedForTaskId.current !== taskId) {
      setTableRows(null)
      csvLoadedForTaskId.current = taskId
    }
    let cancelled = false
    const urls = [
      `/analysis/result/${encodeURIComponent(taskId)}/composition.csv`,
      `/analysis/result/${encodeURIComponent(taskId)}/files/composition.csv`,
    ]

    async function loadCsvWithRetries() {
      setCsvLoadError('')
      let lastFetchErr = ''
      let lastParseErr = ''

      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        for (const url of urls) {
          if (cancelled) return
          try {
            const text = await apiFetch(url, {}, token).then((res) => res.text())
            const parsed = parseCompositionTable(text)
            if (parsed.ok) {
              if (cancelled) return
              setTableRows(parsed.table)
              const H = parsed.table.headers
              const keySample = H.find((h) => String(h).toLowerCase().replace(/\s/g, '') === 'sample_id') || H[0]
              const samples = [...new Set(parsed.table.rows.map((r) => String(r[keySample] ?? '').trim()).filter(Boolean))]
              setSelectedSampleForPlot((prev) => (samples.length && !samples.includes(prev) ? samples[0] : prev))
              setCsvLoadError('')
              return
            }
            lastParseErr = parsed.error || 'Parse failed'
          } catch (e) {
            const msg = e.body?.detail ?? e.body ?? e.message ?? String(e.status ?? '')
            lastFetchErr = typeof msg === 'string' ? msg : JSON.stringify(msg)
          }
        }
        if (attempt < 4 && !cancelled) {
          await new Promise((r) => setTimeout(r, 700))
        }
      }

      if (!cancelled) {
        setTableRows(null)
        const parts = []
        if (lastFetchErr) parts.push(`Request: ${lastFetchErr}`)
        if (lastParseErr) parts.push(`Parse: ${lastParseErr}`)
        setCsvLoadError(parts.join(' · ') || 'Could not load composition.csv.')
      }
    }

    loadCsvWithRetries()
    return () => {
      cancelled = true
    }
  }, [token, taskId, data?.state])

  useEffect(() => {
    setGexPairCache(null)
    setGexPairError('')
    setGeneBarRows(null)
    setGeneBarNotice('')
    setGeneInput('')
    setSelectedSampleForGenePlot('')
  }, [taskId])

  useEffect(() => {
    if (!token || !taskId || data?.state !== 'SUCCESS') return
    const cm = data?.result?.composition_matched_gex
    if (!cm?.tsv || resultTab !== 'matched_gex') return
    if (gexPairCache?.taskId === taskId) return
    const bulkObsFile = cm.bulk_tsv || 'bulk_observed_tpm.tsv'
    let cancelled = false
    ;(async () => {
      setGexPairLoading(true)
      setGexPairError('')
      try {
        const [predText, obsText] = await Promise.all([
          apiFetch(
            `/analysis/result/${encodeURIComponent(taskId)}/files/composition_matched_predicted_gex.tsv`,
            {},
            token,
          ).then((r) => r.text()),
          apiFetch(
            `/analysis/result/${encodeURIComponent(taskId)}/files/${encodeURIComponent(bulkObsFile)}`,
            {},
            token,
          ).then((r) => r.text()),
        ])
        if (cancelled) return
        const pred = parseGeneExpressionTsv(predText)
        const obs = parseGeneExpressionTsv(obsText)
        if (!pred?.byGene || !obs?.byGene) {
          setGexPairError('Failed to parse expression TSV files.')
          return
        }
        const bulkTsvName = String(cm.bulk_tsv || bulkObsFile || '')
        const inferredUnit =
          cm.bulk_unit ||
          (bulkTsvName.includes('bulk_observed_tpm') || bulkTsvName.includes('_tpm.tsv')
            ? 'tpm'
            : bulkTsvName.includes('log1p')
              ? 'log1p_cpm'
              : bulkTsvName.includes('bulk_observed_cpm') || bulkTsvName.includes('_cpm.tsv')
                ? 'cpm'
                : 'tpm')
        setGexPairCache({
          taskId,
          samples: pred.samples,
          predByGene: pred.byGene,
          obsByGene: obs.byGene,
          bulkUnit: inferredUnit,
        })
      } catch (e) {
        if (!cancelled) setGexPairError(e?.message || 'Could not load expression tables.')
      } finally {
        if (!cancelled) setGexPairLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    token,
    taskId,
    data?.state,
    data?.result?.composition_matched_gex,
    resultTab,
    gexPairCache?.taskId,
  ])

  // composition.csv → per-sample, per-cell-type proportions; scatter y matches tooltip.
  const { bySample, cellTypes, sampleList } = useMemo(() => {
    if (!tableRows?.rows?.length || !tableRows.headers?.length) return { bySample: {}, cellTypes: [], sampleList: [] }
    const H = tableRows.headers
    const keySample = H.find((h) => String(h).toLowerCase().replace(/\s/g, '') === 'sample_id') || H[0]
    const keyCell = H.find((h) => String(h).toLowerCase().replace(/\s/g, '') === 'cell_type') || H[1]
    const keyProp = H.find((h) => String(h).toLowerCase().replace(/\s/g, '') === 'proportion') || H[2]
    const bySample = {}
    const cellSet = new Set()
    for (const row of tableRows.rows) {
      const sid = row[keySample] != null ? String(row[keySample]).trim() : ''
      const ct = row[keyCell] != null ? String(row[keyCell]).trim() : ''
      let p = Number(row[keyProp])
      if (sid === '' || ct === '' || Number.isNaN(p)) continue
      if (p > 1) p = p / 100
      cellSet.add(ct)
      if (!bySample[sid]) bySample[sid] = { name: sid }
      bySample[sid][ct] = p
    }
    const samples = Object.keys(bySample).sort()
    const types =
      data?.result?.organ === 'bone'
        ? [...cellSet].sort((a, b) => a.localeCompare(b))
        : sortCellTypesByDifferentiation([...cellSet])
    return { bySample, cellTypes: types, sampleList: samples }
  }, [tableRows, data?.result?.organ])

  const tissueRef = data?.result?.tissue_reference ?? null

  const effectiveSample = selectedSampleForPlot || (sampleList[0] ?? '')

  const { scatterData, refBoxes } = useMemo(() => {
    const types = cellTypes
    const sample = effectiveSample && bySample[effectiveSample] ? bySample[effectiveSample] : null
    const scatter = sample ? types.map((ct, i) => ({ x: i, y: sample[ct] ?? 0, cellType: ct })) : []
    const boxes = types.map((ct, i) => {
      const r = tissueRef && tissueRef[ct]
      if (!r || typeof r.min !== 'number') return null
      return { index: i, cellType: ct, ...r }
    }).filter(Boolean)
    return { scatterData: scatter, refBoxes: boxes }
  }, [cellTypes, bySample, effectiveSample, tissueRef])

  async function downloadCompositionCsv() {
    if (!token || !taskId) return
    setCsvDownloading(true)
    try {
      const res = await apiFetch(`/analysis/result/${taskId}/composition.csv`, {}, token)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `composition_${taskId.slice(0, 8)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 600)
    } catch (e) {
      const msg = e?.body?.detail ?? e?.body ?? e?.message
      window.alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setCsvDownloading(false)
    }
  }

  async function downloadMatchedGexTsv() {
    if (!token || !taskId) return
    setMatchedGexDownloading(true)
    try {
      const res = await apiFetch(
        `/analysis/result/${taskId}/files/composition_matched_predicted_gex.tsv`,
        {},
        token,
      )
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `composition_matched_gex_${taskId.slice(0, 8)}.tsv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 600)
    } catch (e) {
      const msg = e?.body?.detail ?? e?.body ?? e?.message
      window.alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setMatchedGexDownloading(false)
    }
  }

  function runGeneBarLookup() {
    setGeneBarNotice('')
    const sym = geneInput.trim()
    if (!sym) {
      setGeneBarRows(null)
      setGeneBarNotice('Enter a gene symbol.')
      return
    }
    if (!gexPairCache || gexPairCache.taskId !== taskId) {
      setGeneBarNotice('Expression data is still loading or the last load failed.')
      return
    }
    const g = sym.toUpperCase()
    const pr = gexPairCache.predByGene.get(g)
    const ob = gexPairCache.obsByGene.get(g)
    if (!pr && !ob) {
      setGeneBarRows(null)
      setGeneBarNotice('That gene was not found in the matrices (expect HUGO symbols).')
      return
    }
    const samples = gexPairCache.samples
    const rows = samples.map((s) => ({
      sample: s,
      predicted: pr && Number.isFinite(pr[s]) ? pr[s] : null,
      observed: ob && Number.isFinite(ob[s]) ? ob[s] : null,
    }))
    setGeneBarRows(rows)
  }

  useEffect(() => {
    if (gexPairCache?.samples?.length) {
      setSelectedSampleForGenePlot(gexPairCache.samples[0])
    }
  }, [gexPairCache?.taskId, gexPairCache?.samples])

  const effectiveGenePlotSample =
    selectedSampleForGenePlot || (gexPairCache?.samples?.[0] ?? '')

  const geneBarDisplayRows = useMemo(() => {
    if (!geneBarRows?.length || !effectiveGenePlotSample) return null
    return geneBarRows.filter((r) => r.sample === effectiveGenePlotSample)
  }, [geneBarRows, effectiveGenePlotSample])

  const compositionMatchedMeta = data?.result?.composition_matched_gex
  const hasMatchedGex =
    compositionMatchedMeta != null &&
    typeof compositionMatchedMeta === 'object' &&
    compositionMatchedMeta.tsv
  const bulkUnitForUi = useMemo(() => {
    if (gexPairCache?.bulkUnit) return gexPairCache.bulkUnit
    const cm = compositionMatchedMeta
    if (cm?.bulk_unit) return cm.bulk_unit
    const name = String(cm?.bulk_tsv || '')
    if (name.includes('bulk_observed_tpm') || name.includes('_tpm.tsv')) return 'tpm'
    if (name.includes('log1p')) return 'log1p_cpm'
    if (name.includes('bulk_observed_cpm') || name.includes('_cpm.tsv')) return 'cpm'
    return 'tpm'
  }, [gexPairCache?.bulkUnit, compositionMatchedMeta])
  const obsAxisLabel =
    bulkUnitForUi === 'tpm'
      ? 'Observed TPM (bulk)'
      : bulkUnitForUi === 'cpm'
        ? 'Observed CPM (bulk)'
        : 'Observed log1p(CPM) (bulk)'
  const predAxisLabel = 'Expected CPM (10x reference)'
  const observedBarName =
    bulkUnitForUi === 'tpm'
      ? 'Observed TPM'
      : bulkUnitForUi === 'cpm'
        ? 'Observed CPM'
        : 'Observed log1p(CPM)'

  if (resultPanel && !VALID_RESULT_PANELS.has(resultPanel)) {
    return <Navigate to={`/analysis/result/${taskId}/composition`} replace />
  }

  if (error) return <p style={{ color: '#c00' }}>{error}</p>
  if (!data) return <p>Loading…</p>

  if (resultPanel === 'matched-gex' && data.result?.organ === 'bone') {
    return <Navigate to={`/analysis/result/${taskId}/composition`} replace />
  }

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f8fb 0%, #ffffff 55%)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#667085', fontSize: 13, letterSpacing: 0.2 }}>Analysis</div>
              <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, color: '#101828' }}>
                Result {taskId.slice(0, 8)}…
              </h1>
            </div>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #e4e7ec',
                background: '#fff',
                fontSize: 13,
                color: '#344054',
              }}
            >
              Status:{' '}
              <strong style={{ color: data.state === 'SUCCESS' ? '#067647' : data.state === 'FAILURE' ? '#b42318' : '#344054' }}>
                {data.state}
              </strong>
            </div>
          </div>
      {data.state === 'FAILURE' && data.error && (
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
              {data.error}
            </div>
      )}

      {data.state === 'SUCCESS' && (
        <>
          <div
            style={{
              marginTop: 18,
              borderRadius: 16,
              border: '1px solid #eaecf0',
              background: '#fff',
              boxShadow: '0 8px 28px rgba(16, 24, 40, 0.06)',
              padding: '20px 22px',
            }}
          >
              {resultTab === 'composition' && (
              <section
                style={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#101828' }}>
                      Predicted cell composition
                    </h2>
                    <div
                      style={{
                        marginTop: 8,
                        color: '#475467',
                        fontSize: 13,
                        lineHeight: 1.55,
                        maxWidth: 820,
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        The deconvolution is performed on bulk RNA-seq data using an intestinal single-cell reference. For
                        each uploaded sample, BayesPrism outputs a cell-type fraction vector; here, we use the package’s
                        final type-level θ values. These values are saved to{' '}
                        <code style={{ fontSize: 12, color: '#667085' }}>composition.csv</code> and displayed on the Y axis
                        as percentages from 0 to 100.
                      </p>
                      <p style={{ margin: '10px 0 0' }}>
                        Select a sample above to view the plot. Red points indicate the BayesPrism-estimated fractions for the
                        selected sample. For each cell type, the shaded band represents the interquartile range (Q1–Q3) of
                        cell-type proportions observed across reference tissue bulk samples, and the dashed line indicates
                        the median of that reference set.
                      </p>
                    </div>
                  </div>
                </div>
            {sampleList.length > 0 && cellTypes.length > 0 ? (
              <>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label htmlFor="composition-sample-select" style={{ fontWeight: 600, color: '#344054', fontSize: 13 }}>
                    Sample to plot:
                  </label>
                  <select
                    id="composition-sample-select"
                    value={effectiveSample}
                    onChange={(e) => setSelectedSampleForPlot(e.target.value)}
                        style={{
                          minWidth: 320,
                          padding: '8px 12px',
                          borderRadius: 12,
                          border: '1px solid #d0d5dd',
                          background: '#fff',
                          fontSize: 13,
                          color: '#101828',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                        }}
                  >
                    {sampleList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', color: '#475467', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 999, background: '#d92d20', display: 'inline-block' }} />
                        <span>Predicted cell-type proportion (query)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 10, borderRadius: 3, background: '#8b9dc3', opacity: 0.65, display: 'inline-block' }} />
                        <span>Cell-type proportions from intestinal tissue bulk (for reference; IQR shaded, median dashed)</span>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        padding: 14,
                        borderRadius: 14,
                        border: '1px solid #eaecf0',
                        background: '#fcfcfd',
                      }}
                    >
                <div style={{ cursor: 'crosshair' }}>
                  <ResponsiveContainer width="100%" height={420}>
                    <ComposedChart
                      data={scatterData}
                      margin={{ top: 16, right: 16, left: 16, bottom: 80 }}
                    >
                      <XAxis
                        type="number"
                        dataKey="x"
                        domain={[-0.5, cellTypes.length - 0.5]}
                        ticks={cellTypes.map((_, i) => i)}
                        tickFormatter={(i) => (cellTypes[Number(i)] != null ? cellTypes[Number(i)] : '')}
                        tick={{ fontSize: 11 }}
                        angle={cellTypes.length > 4 ? -45 : 0}
                        textAnchor={cellTypes.length > 4 ? 'end' : 'middle'}
                        interval={0}
                        label={{ value: 'Cell type', position: 'insideBottom', offset: -8 }}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`}
                        label={{ value: 'Proportion (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const p = payload[0]
                          const cellType = cellTypes[p?.payload?.x] ?? p?.payload?.cellType ?? ''
                          const raw = bySample[effectiveSample]?.[cellType]
                          const prop = raw != null ? (Number(raw) * 100).toFixed(2) : ''
                          const refMed = refBoxes.find((b) => b.cellType === cellType)?.median
                          return (
                            <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid #d0d5dd', borderRadius: 10, boxShadow: '0 10px 25px rgba(16,24,40,0.18)', fontSize: 13, color: '#101828' }}>
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>{cellType}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <span style={{ color: '#475467' }}>Query estimate</span>
                                <strong style={{ color: '#d92d20' }}>{prop}%</strong>
                              </div>
                              {refMed != null && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
                                  <span style={{ color: '#475467' }}>Reference median</span>
                                  <strong style={{ color: '#344054' }}>{(refMed * 100).toFixed(2)}%</strong>
                                </div>
                              )}
                            </div>
                          )
                        }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      {refBoxes.map((b) => (
                        <ReferenceArea
                          key={b.cellType}
                          x1={b.index - 0.35}
                          x2={b.index + 0.35}
                          y1={b.q1}
                          y2={b.q3}
                          fill="#8b9dc3"
                          fillOpacity={0.55}
                          stroke="#4a5f8f"
                          strokeWidth={1.2}
                        />
                      ))}
                      {refBoxes.map((b) => (
                        <ReferenceLine
                          key={`med-${b.cellType}`}
                          segment={[
                            { x: b.index - 0.35, y: b.median },
                            { x: b.index + 0.35, y: b.median },
                          ]}
                          stroke="#2c3e50"
                          strokeWidth={2}
                          strokeDasharray="4 2"
                        />
                      ))}
                      <Scatter
                        dataKey="y"
                        fill="#c00"
                        name=""
                        shape="circle"
                        r={6}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                    </div>
              </>
            ) : (
              <>
                <p style={{ color: '#666', fontSize: '0.9em', marginBottom: 8 }}>
                  Load composition.csv to show the interactive plot above.
                </p>
                {csvLoadError && (
                  <p style={{ color: '#c00', fontSize: '0.85em', marginBottom: 8 }}>CSV load failed: {csvLoadError}</p>
                )}
              </>
            )}
                <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid #eaecf0', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={downloadCompositionCsv}
                    disabled={csvDownloading}
                    style={{
                      padding: '10px 14px',
                      cursor: csvDownloading ? 'wait' : 'pointer',
                      border: '1px solid #d0d5dd',
                      borderRadius: 12,
                      background: '#fff',
                      fontWeight: 700,
                      color: '#101828',
                      boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                    }}
                  >
                    {csvDownloading ? 'Downloading…' : 'Download composition CSV'}
                  </button>
                </div>
              </section>
              )}

              {resultTab === 'matched_gex' && (
              <section
                style={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#101828' }}>
                  Composition-matched healthy-tissue expression (predicted)
                </h2>
                <div
                  style={{
                    marginTop: 12,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #b2ddff',
                    background: 'linear-gradient(180deg, #f0f9ff 0%, #eff8ff 100%)',
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: '#1c3d5a',
                    maxWidth: 920,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#026aa2' }}>
                    Guide: bulk uploads use TPM only
                  </div>
                  <p style={{ margin: 0 }}>
                    Cell-type references are built from <strong>10x scRNA-seq UMI</strong> profiles and reported as
                    library-size–normalized <strong>CPM</strong> (counts per million UMI). Because UMIs are not
                    length-normalized like conventional bulk <strong>TPM</strong>, we require uploads as{' '}
                    <strong>per-sample TPM</strong> so the bulk layer stays interpretable alongside the reference.
                  </p>
                </div>
                <p style={{ marginTop: 12, color: '#667085', fontSize: 13, lineHeight: 1.55, maxWidth: 880 }}>
                  <strong>Expected expression (E)</strong> is a linear mixture of healthy epithelial cell-type profiles
                  (10x CPM–scale) weighted by your estimated proportions.
                </p>
                {hasMatchedGex ? (
                  <>
                    <div
                      style={{
                        marginTop: 14,
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#f9fafb',
                        border: '1px solid #eaecf0',
                        fontSize: 13,
                        color: '#344054',
                      }}
                    >
                      <div>
                        Genes: <strong>{compositionMatchedMeta.n_genes}</strong>
                        {' · '}
                        Samples: <strong>{compositionMatchedMeta.n_samples}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 18,
                        padding: 16,
                        borderRadius: 14,
                        border: '1px solid #eaecf0',
                        background: '#fcfcfd',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#101828', marginBottom: 8 }}>
                        Gene-level expected vs. observed
                      </div>
                      <p style={{ margin: '0 0 12px', color: '#667085', fontSize: 12, lineHeight: 1.5 }}>
                        Enter a symbol, then choose a sample under <strong>Sample to plot</strong>. For that sample, bars
                        compare <strong>expected</strong> expression (10x CPM reference mixture) with{' '}
                        <strong>observed</strong> bulk (
                        {bulkUnitForUi === 'tpm' ? 'TPM' : bulkUnitForUi === 'cpm' ? 'CPM' : 'log1p(CPM)'}
                        ). The left and right Y axes may use different
                        scales.
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        <input
                          type="text"
                          value={geneInput}
                          onChange={(e) => setGeneInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && runGeneBarLookup()}
                          placeholder="e.g. LGR5, MUC2"
                          aria-label="Gene symbol"
                          style={{
                            minWidth: 200,
                            flex: '1 1 180px',
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: '1px solid #d0d5dd',
                            fontSize: 14,
                          }}
                        />
                        <button
                          type="button"
                          onClick={runGeneBarLookup}
                          disabled={gexPairLoading || !!gexPairError}
                          style={{
                            padding: '10px 16px',
                            borderRadius: 12,
                            border: '1px solid #d0d5dd',
                            background: gexPairLoading || gexPairError ? '#f2f4f7' : '#101828',
                            color: gexPairLoading || gexPairError ? '#98a2b3' : '#fff',
                            fontWeight: 700,
                            cursor: gexPairLoading || gexPairError ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Plot
                        </button>
                      </div>
                      {gexPairCache?.samples?.length > 0 && !gexPairLoading && !gexPairError && (
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <label htmlFor="matched-gex-sample-select" style={{ fontWeight: 600, color: '#344054', fontSize: 13 }}>
                            Sample to plot:
                          </label>
                          <select
                            id="matched-gex-sample-select"
                            value={effectiveGenePlotSample}
                            onChange={(e) => setSelectedSampleForGenePlot(e.target.value)}
                            aria-label="Sample for bar chart"
                            style={{
                              minWidth: 320,
                              padding: '8px 12px',
                              borderRadius: 12,
                              border: '1px solid #d0d5dd',
                              background: '#fff',
                              fontSize: 13,
                              color: '#101828',
                              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                            }}
                          >
                            {gexPairCache.samples.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {gexPairLoading && (
                        <p style={{ margin: '12px 0 0', color: '#667085', fontSize: 13 }}>Loading expression tables…</p>
                      )}
                      {gexPairError && (
                        <p style={{ margin: '12px 0 0', color: '#b42318', fontSize: 13 }}>{gexPairError}</p>
                      )}
                      {geneBarNotice && (
                        <p style={{ margin: '12px 0 0', color: '#b54708', fontSize: 13 }}>{geneBarNotice}</p>
                      )}
                      {geneBarRows && geneBarRows.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: 13, color: '#475467', marginBottom: 8 }}>
                            Gene: <strong style={{ color: '#101828' }}>{geneInput.trim().toUpperCase()}</strong>
                          </div>
                          {geneBarDisplayRows && geneBarDisplayRows.length > 0 && (
                          <div style={{ width: '100%', height: 380 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={geneBarDisplayRows}
                                margin={{
                                  top: 12,
                                  right: 48,
                                  left: 8,
                                  bottom: geneBarDisplayRows.length > 4 ? 64 : 28,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#eceff5" />
                                <XAxis
                                  dataKey="sample"
                                  tick={{ fontSize: 11 }}
                                  angle={geneBarDisplayRows.length > 4 ? -30 : 0}
                                  textAnchor={geneBarDisplayRows.length > 4 ? 'end' : 'middle'}
                                  height={geneBarDisplayRows.length > 4 ? 70 : 36}
                                  interval={0}
                                />
                                <YAxis
                                  yAxisId="left"
                                  tick={{ fontSize: 11 }}
                                  label={{
                                    value: predAxisLabel,
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fontSize: 11, fill: '#7c3aed' },
                                  }}
                                />
                                <YAxis
                                  yAxisId="right"
                                  orientation="right"
                                  tick={{ fontSize: 11 }}
                                  label={{
                                    value: obsAxisLabel,
                                    angle: 90,
                                    position: 'insideRight',
                                    style: { fontSize: 11, fill: '#059669' },
                                  }}
                                />
                                <Tooltip
                                  formatter={(value, name) =>
                                    value != null && Number.isFinite(Number(value))
                                      ? [Number(value).toFixed(4), name]
                                      : ['—', name]
                                  }
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="predicted" name="Expected CPM" fill="#7c3aed" maxBarSize={32} />
                                <Bar
                                  yAxisId="right"
                                  dataKey="observed"
                                  name={observedBarName}
                                  fill="#059669"
                                  maxBarSize={32}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={downloadMatchedGexTsv}
                        disabled={matchedGexDownloading}
                        style={{
                          padding: '10px 14px',
                          cursor: matchedGexDownloading ? 'wait' : 'pointer',
                          border: '1px solid #d0d5dd',
                          borderRadius: 12,
                          background: '#fff',
                          fontWeight: 700,
                          color: '#101828',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                        }}
                      >
                        {matchedGexDownloading ? 'Downloading…' : 'Download predicted expression TSV'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      marginTop: 14,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px dashed #d0d5dd',
                      background: '#fcfcfd',
                      color: '#667085',
                      fontSize: 14,
                    }}
                  >
                    No composition-matched GEX outputs were produced for this run. The server may be missing{' '}
                    <code style={{ fontSize: 12 }}>real_GEX_per_Celltype.rds</code>, or the R pipeline may have skipped
                    this step.
                  </div>
                )}
              </section>
              )}
          </div>
        </>
      )}
        </div>
      </div>
    </>
  )
}
