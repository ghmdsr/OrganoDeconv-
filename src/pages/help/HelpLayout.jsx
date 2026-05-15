import { NavLink, Outlet } from 'react-router-dom'
import { APP_NAME } from '../../constants/organModels'
import { helpAside, helpContentBox, helpNavLink } from './helpNav'

export default function HelpLayout() {
  return (
    <div style={{ padding: '28px 24px 56px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#667085', textTransform: 'uppercase' }}>
          {APP_NAME} · Documentation
        </p>
        <h1 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>Help Center</h1>
        <p style={{ margin: '10px 0 0', fontSize: 15, color: '#667085', maxWidth: 640 }}>
          Guides for getting started, running analyses, and preparing your TPM matrix.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
        <nav style={helpAside} aria-label="Help sections">
          <NavLink to="/help/introduction" style={({ isActive }) => helpNavLink(isActive)}>
            Introduction
          </NavLink>
          <NavLink to="/help/tutorial" style={({ isActive }) => helpNavLink(isActive)}>
            Tutorial
          </NavLink>
          <NavLink to="/help/upload" style={({ isActive }) => helpNavLink(isActive)}>
            File upload
          </NavLink>
        </nav>
        <div style={helpContentBox}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
