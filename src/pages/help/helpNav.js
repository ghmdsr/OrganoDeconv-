/** Shared styles for Help Center sub-navigation */
export const helpAside = {
  width: 200,
  flexShrink: 0,
  padding: '8px 0',
}

export const helpNavLink = (isActive) => ({
  display: 'block',
  padding: '10px 14px',
  marginBottom: 4,
  borderRadius: 10,
  borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
  background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
  color: isActive ? '#3730a3' : '#475467',
  fontWeight: isActive ? 700 : 500,
  fontSize: 13,
  textDecoration: 'none',
  transition: 'background 0.15s ease',
})

export const helpContentBox = {
  flex: 1,
  minWidth: 0,
  padding: '8px 8px 48px 4px',
}

export const helpProse = {
  fontSize: 15,
  color: '#475467',
  lineHeight: 1.7,
}
