import { helpProse } from './helpNav'

const EXAMPLE_BULK_URL = '/bulk_input_example.txt'

export default function HelpUpload() {
  return (
    <article>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#101828' }}>File upload</h2>
      <div style={helpProse}>
        <p style={{ margin: '0 0 16px' }}>
          The app accepts <strong>CSV or TSV</strong> text files (e.g. <code style={{ fontSize: 13, background: '#f2f4f7', padding: '2px 6px', borderRadius: 6 }}>.csv</code>,{' '}
          <code style={{ fontSize: 13, background: '#f2f4f7', padding: '2px 6px', borderRadius: 6 }}>.tsv</code>,{' '}
          <code style={{ fontSize: 13, background: '#f2f4f7', padding: '2px 6px', borderRadius: 6 }}>.txt</code>). Maximum size follows the upload form limit (e.g. 10 MB).
        </p>
        <p style={{ margin: '0 0 16px' }}>
          <a
            href={EXAMPLE_BULK_URL}
            download="bulk_input_example.txt"
            style={{ fontWeight: 600, color: '#175cd3', textDecoration: 'none' }}
          >
            Download example TPM matrix
          </a>
          <span style={{ color: '#667085' }}> (bulk_input_example.txt)</span>
        </p>

        <h3 style={{ margin: '24px 0 10px', fontSize: 15, fontWeight: 700, color: '#101828' }}>Layout</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>
            <strong>First column header</strong> should be named <code style={{ fontSize: 13, background: '#f2f4f7', padding: '2px 6px', borderRadius: 6 }}>gene</code> (case-insensitive in practice; keep it consistent).
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Row names / first column</strong>: HUGO gene symbols (one gene per row).
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Remaining columns</strong>: one column per bulk sample; values are <strong>TPM</strong> (non-negative real numbers). Raw counts are not accepted.
          </li>
        </ul>

        <h3 style={{ margin: '24px 0 10px', fontSize: 15, fontWeight: 700, color: '#101828' }}>Validation</h3>
        <p style={{ margin: '0 0 12px' }}>
          The server checks numeric content, dimensions, and gene-name conventions. If validation fails, fix the matrix
          and re-upload—common issues are non-numeric cells, missing headers, or non-HUGO symbols.
        </p>

        <h3 style={{ margin: '24px 0 10px', fontSize: 15, fontWeight: 700, color: '#101828' }}>Why TPM?</h3>
        <p style={{ margin: 0 }}>
          Single-cell reference signatures are on a <strong>per-million</strong> scale compatible with TPM; using TPM for
          bulk keeps the exploratory comparison interpretable. See <strong>Introduction</strong> for the biology
          context.
        </p>
      </div>
    </article>
  )
}
