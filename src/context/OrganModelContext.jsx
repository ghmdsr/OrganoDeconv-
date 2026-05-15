import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEFAULT_ORGAN_ID, ORGAN_MODELS, getOrganModel } from '../constants/organModels'

const STORAGE_KEY = 'organodeconv_organ_model'

const OrganModelContext = createContext(null)

function readStoredOrganId() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s && ORGAN_MODELS.some((o) => o.id === s && o.available)) return s
  } catch {
    /* ignore */
  }
  return DEFAULT_ORGAN_ID
}

export function OrganModelProvider({ children }) {
  const [organId, setOrganIdState] = useState(readStoredOrganId)

  const setOrganId = useCallback((id) => {
    const m = ORGAN_MODELS.find((o) => o.id === id)
    if (!m?.available) return
    setOrganIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      organId,
      setOrganId,
      organ: getOrganModel(organId),
    }),
    [organId, setOrganId],
  )

  return <OrganModelContext.Provider value={value}>{children}</OrganModelContext.Provider>
}

export function useOrganModel() {
  const ctx = useContext(OrganModelContext)
  if (!ctx) throw new Error('useOrganModel must be used within OrganModelProvider')
  return ctx
}
