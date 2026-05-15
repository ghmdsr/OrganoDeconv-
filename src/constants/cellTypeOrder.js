/**
 * 세포 분화축(crypt→villus·lineage) 순서. 백엔드 `data_for_runningAlgorithm/cell_type_order.txt`와 맞출 것.
 * 목록에 없는 타입은 맨 뒤에 알파벳 순으로 붙습니다.
 */
export const CELL_TYPE_DIFFERENTIATION_ORDER = [
  'Stem',
  'TA',
  'immatureEnterocyte',
  'matureEnterocyte',
  'Best4_enterocyte',
  'Goblet',
  'Enteroendocrine',
  'Tuft',
]

/** @param {string[]} names */
export function sortCellTypesByDifferentiation(names) {
  const set = new Set(names.map((s) => String(s).trim()).filter(Boolean))
  const order = CELL_TYPE_DIFFERENTIATION_ORDER.filter((c) => set.has(c))
  const rest = [...set].filter((c) => !CELL_TYPE_DIFFERENTIATION_ORDER.includes(c)).sort((a, b) => a.localeCompare(b))
  return [...order, ...rest]
}
