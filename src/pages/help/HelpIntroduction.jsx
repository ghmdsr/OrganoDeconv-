import { APP_NAME } from '../../constants/organModels'
import { helpProse } from './helpNav'

export default function HelpIntroduction() {
  return (
    <article>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#101828' }}>Introduction</h2>
      <div style={helpProse}>
        <p style={{ margin: '0 0 16px' }}>
          <strong>{APP_NAME}</strong> infers <strong>cell-type composition in organoids</strong> from bulk RNA-seq. Models
          are split by <strong>organ-specific reference</strong> tracks—<strong>Intestine</strong> is available today;
          <strong>Liver</strong>, <strong>Bone</strong>, and <strong>Salivary gland</strong> follow as their references
          are wired in. Choose the organ that matches your organoid system before you run analyses.
        </p>
        <p style={{ margin: '0 0 16px' }}>
          The Intestine track estimates <strong>cell-type proportions</strong> with a single-cell–trained reference, then
          optionally compares <strong>composition-matched expected expression</strong> to your bulk TPM measurements.
        </p>
        <p style={{ margin: '0 0 16px' }}>
          Reference signatures are treated as <strong>CPM-scale</strong> (10x-style UMI counts per million). Bulk uploads
          must therefore be <strong>TPM-normalized</strong> so that “expected” and “observed” layers share a coherent
          per-million interpretation (exploratory use; not a replacement for wet-lab validation).
        </p>
        <p style={{ margin: 0 }}>
          Use <strong>My analyses</strong> to reopen past runs; when a result is open, switch between{' '}
          <strong>Predicted cell composition</strong> and <strong>Composition-matched GEX</strong> from the sidebar under{' '}
          <strong>Analysis result</strong>.
        </p>
      </div>
    </article>
  )
}
