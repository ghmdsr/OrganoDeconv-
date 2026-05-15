import { Link, useNavigate } from 'react-router-dom'
import { OrganIllustration } from '../components/OrganIllustration'
import { APP_NAME, APP_TAGLINE, ORGAN_MODELS } from '../constants/organModels'
import { useAuth } from '../context/AuthContext'
import { useOrganModel } from '../context/OrganModelContext'
import './HomePage.css'

const loginState = (pathname) => ({ from: { pathname } })

export default function HomePage() {
  const { organId, setOrganId } = useOrganModel()
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="home">
      <div className="home__bg" aria-hidden />

      <header className="home__header">
        <Link to="/" className="home__brand">
          {APP_NAME}
        </Link>
        <div className="home__actions">
          {!token ? (
            <>
              <Link to="/login" className="home__btn home__btn--ghost">
                Log in
              </Link>
              <Link to="/register" className="home__btn home__btn--primary">
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link to="/upload" className="home__btn home__btn--ghost">
                Workspace
              </Link>
              <button
                type="button"
                className="home__btn home__btn--muted"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Log out
              </button>
            </>
          )}
        </div>
      </header>

      <div className="home__main">
        <div className="home__hero">
          <p className="home__eyebrow">{APP_TAGLINE}</p>
          <h1 className="home__title">{APP_NAME}</h1>
          <p className="home__lede">
            {token
              ? 'Select an organ-specific reference model for estimating cell-type proportions in organoid bulk RNA-seq.'
              : 'OrganoDeconv estimates cell-type composition in organoid cultures from bulk RNA-seq using organ-specific reference panels. Pick the organ that matches your system—intestine, liver, and others differ by reference—then sign in to upload and run analyses.'}
          </p>
        </div>

        <div className="home__grid" role="listbox" aria-label="Organ model">
          {ORGAN_MODELS.map((m) => {
            const selected = organId === m.id
            const enabled = m.available
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={!enabled}
                onClick={() => enabled && setOrganId(m.id)}
                className={[
                  'home__organ',
                  selected ? 'home__organ--selected' : '',
                  !enabled ? 'home__organ--disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {!enabled && <span className="home__organ-badge">Soon</span>}
                <div className="home__organ-visual" aria-hidden>
                  <OrganIllustration organId={m.id} className="home__organ-art" />
                </div>
                <div className="home__organ-title">{m.label}</div>
                {m.homeHint && <p className="home__organ-hint">{m.homeHint}</p>}
                {selected && enabled && <div className="home__organ-check">Selected</div>}
              </button>
            )
          })}
        </div>

        <section className="home__cta">
          <div className="home__cta-actions">
            {!token ? (
              <>
                <Link to="/login" state={loginState('/upload')} className="home__link-primary">
                  Upload data
                </Link>
                <Link to="/login" state={loginState('/analysis')} className="home__link-secondary">
                  My analyses
                </Link>
                <Link to="/login" state={loginState('/help/introduction')} className="home__link-ghost">
                  Help
                </Link>
              </>
            ) : (
              <>
                <Link to="/upload" className="home__link-primary">
                  Upload data
                </Link>
                <Link to="/analysis" className="home__link-secondary">
                  My analyses
                </Link>
                <Link to="/help/introduction" className="home__link-ghost">
                  Help
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
