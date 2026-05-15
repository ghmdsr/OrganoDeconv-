/** Product name shown in the shell, help, and document title */
export const APP_NAME = 'OrganoDeconv'

/** Short line under the product name on the home hero */
export const APP_TAGLINE = 'Organoid cell-type composition from bulk RNA-seq'

/** Default organ when the app loads or storage is empty */
export const DEFAULT_ORGAN_ID = 'intestine'

/**
 * Tissue / organ models. Intestine and Bone are wired for composition analysis;
 * others reserve UI and future API routing.
 * @type {{ id: string, label: string, available: boolean, homeHint?: string }[]}
 */
export const ORGAN_MODELS = [
  {
    id: 'intestine',
    label: 'Intestine',
    available: true,
    homeHint: 'Intestinal reference · organoid deconvolution live',
  },
  {
    id: 'bone',
    label: 'Bone',
    available: true,
    homeHint: 'Bone reference · organoid deconvolution',
  },
  { id: 'liver', label: 'Liver', available: false, homeHint: 'Liver reference · in development' },
  {
    id: 'salivary_gland',
    label: 'Salivary gland',
    available: false,
    homeHint: 'Salivary reference · in development',
  },
]

export function getOrganModel(organId) {
  return ORGAN_MODELS.find((o) => o.id === organId) ?? ORGAN_MODELS[0]
}
