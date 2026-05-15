import { helpProse } from './helpNav'

const step = { margin: '0 0 22px', paddingLeft: 0, listStyle: 'none' }

export default function HelpTutorial() {
  return (
    <article>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#101828' }}>Tutorial</h2>
      <ol style={{ ...helpProse, paddingLeft: 0, counterReset: 'step' }}>
        <li style={step}>
          <strong style={{ color: '#101828' }}>1. Sign in</strong>
          <p style={{ margin: '8px 0 0', paddingLeft: 0 }}>
            Log in with your account. New users can register from the sign-in page.
          </p>
        </li>
        <li style={step}>
          <strong style={{ color: '#101828' }}>2. Prepare a TPM matrix</strong>
          <p style={{ margin: '8px 0 0' }}>
            Build a table: first column <code style={{ fontSize: 13, background: '#f2f4f7', padding: '2px 6px', borderRadius: 6 }}>gene</code>, sample names in the header, TPM values (non-negative floats). Gene IDs must be{' '}
            <strong>HUGO symbols</strong>. See <strong>File upload</strong> for details.
          </p>
        </li>
        <li style={step}>
          <strong style={{ color: '#101828' }}>3. Upload &amp; run</strong>
          <p style={{ margin: '8px 0 0' }}>
            Open <strong>Upload</strong>, choose your CSV/TSV file, then start analysis from the file list. You will be
            redirected to the result view when the job is accepted.
          </p>
        </li>
        <li style={step}>
          <strong style={{ color: '#101828' }}>4. Read composition</strong>
          <p style={{ margin: '8px 0 0' }}>
            Under <strong>Analysis result → Predicted cell composition</strong>, pick a sample and inspect the scatter plot: red
            dots are estimated proportions; boxes and median lines summarize reference tissue.
          </p>
        </li>
        <li style={{ margin: 0, listStyle: 'none' }}>
          <strong style={{ color: '#101828' }}>5. Composition-matched GEX (optional)</strong>
          <p style={{ margin: '8px 0 0' }}>
            If the server has the reference RDS, open <strong>Composition-matched GEX</strong>, enter a gene symbol, and
            compare expected (reference mixture) vs observed TPM for the selected sample. Download the predicted TSV if
            needed.
          </p>
        </li>
      </ol>
    </article>
  )
}
