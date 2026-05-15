import { useEffect, useState } from 'react'
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrganModel } from '../context/OrganModelContext'
import { apiJson } from '../api/client'
import { APP_NAME, APP_TAGLINE, ORGAN_MODELS } from '../constants/organModels'
import './Layout.css'

function navClass(active, sub = false) {
  const base = sub ? 'layout-nav-link layout-nav-link--sub' : 'layout-nav-link'
  return active ? `${base} layout-nav-link--active` : base
}

export default function Layout() {
  const { logout, token } = useAuth()
  const { organId, setOrganId } = useOrganModel()
  const navigate = useNavigate()
  const location = useLocation()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    if (!token) {
      setSessions([])
      return
    }
    apiJson('/analysis/sessions', {}, token)
      .then(setSessions)
      .catch(() => setSessions([]))
  }, [token, location.pathname])

  const analysisNavActive =
    location.pathname === '/analysis' || location.pathname.startsWith('/analysis/')
  const resultPathMatch = location.pathname.match(/^\/analysis\/result\/([^/]+)(?:\/([^/]+))?$/)
  const resultTaskId = resultPathMatch?.[1]
  const sessionForResult = resultTaskId ? sessions.find((s) => s.task_id === resultTaskId) : null
  const showMatchedGexNav = sessionForResult?.organ_id !== 'bone'

  return (
    <div className="layout-shell">
      <aside className="layout-aside" aria-label="Application menu">
        <div className="layout-brand">
          <div className="layout-brand-badge">
            <span className="layout-brand-dot" aria-hidden />
            <span className="layout-brand-title">{APP_NAME}</span>
          </div>
          <div className="layout-brand-sub">{APP_TAGLINE}</div>
        </div>

        <div className="layout-nav-scroll">
          <div className="layout-section-label">Organ model</div>
          <div className="layout-organ-list" role="listbox" aria-label="Organ model">
            {ORGAN_MODELS.map((m) => {
              const active = organId === m.id
              const cls = [
                'layout-organ-option',
                active ? 'layout-organ-option--active' : '',
                !m.available ? 'layout-organ-option--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-disabled={!m.available}
                  disabled={!m.available}
                  title={!m.available ? 'Coming soon' : undefined}
                  className={cls}
                  onClick={() => m.available && setOrganId(m.id)}
                >
                  <span>{m.label}</span>
                  {!m.available && <span className="layout-organ-badge">Soon</span>}
                </button>
              )
            })}
          </div>

          <div className="layout-section-label">Workspace</div>
          <nav className="layout-nav-block" aria-label="Primary navigation">
            <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
              Home
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => navClass(isActive)}>
              Upload
            </NavLink>
            <NavLink to="/analysis" className={() => navClass(analysisNavActive)}>
              My analyses
            </NavLink>
          </nav>

          {resultTaskId && (
            <div className="layout-context-panel">
              <div className="layout-section-label">Analysis result</div>
              <nav className="layout-nav-block" aria-label="Current analysis panels">
                <NavLink
                  to={`/analysis/result/${resultTaskId}/composition`}
                  className={({ isActive }) => navClass(isActive)}
                >
                  Predicted cell composition
                </NavLink>
                {showMatchedGexNav && (
                  <NavLink
                    to={`/analysis/result/${resultTaskId}/matched-gex`}
                    className={({ isActive }) => navClass(isActive)}
                  >
                    Composition-matched GEX
                  </NavLink>
                )}
              </nav>
            </div>
          )}

          <div className="layout-section-label">Help</div>
          <nav className="layout-nav-block" aria-label="Help">
            <NavLink to="/help/introduction" className={({ isActive }) => navClass(isActive, true)}>
              Introduction
            </NavLink>
            <NavLink to="/help/tutorial" className={({ isActive }) => navClass(isActive, true)}>
              Tutorial
            </NavLink>
            <NavLink to="/help/upload" className={({ isActive }) => navClass(isActive, true)}>
              File upload
            </NavLink>
          </nav>
        </div>

        <div className="layout-footer">
          <button
            type="button"
            className="layout-logout"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
