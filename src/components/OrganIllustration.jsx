/**
 * Health Icons (MIT) — https://healthicons.org — see public/organs/ATTRIBUTION.txt
 */
const ORGAN_SRC = {
  intestine: '/organs/intestine.svg',
  liver: '/organs/liver.svg',
  bone: '/organs/bone.svg',
  salivary_gland: '/organs/salivary_gland.svg',
}

const ORGAN_ALT = {
  intestine: 'Intestine',
  liver: 'Liver',
  bone: 'Spine (bone-related icon)',
  salivary_gland: 'Mouth (salivary region)',
}

export function OrganIllustration({ organId, className = '' }) {
  const src = ORGAN_SRC[organId]
  const alt = ORGAN_ALT[organId] ?? 'Organ'
  if (!src) {
    return (
      <div className={className} style={{ width: 92, height: 92, borderRadius: 16, background: '#e2e8f0' }} aria-hidden />
    )
  }
  return (
    <img
      src={src}
      alt=""
      role="presentation"
      className={className}
      loading="lazy"
      decoding="async"
      title={alt}
    />
  )
}
