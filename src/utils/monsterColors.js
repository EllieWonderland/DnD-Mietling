export const MONSTER_COLORS = [
  { id: 'white',      label: 'Weiß',       hex: '#FFFFFF', border: '#888888', textDark: true },
  { id: 'black',      label: 'Schwarz',    hex: '#18181B', border: '#52525B', textDark: false },
  { id: 'brown',      label: 'Braun',      hex: '#8D5524', border: '#5C3818', textDark: false },
  { id: 'lightblue',  label: 'Hellblau',   hex: '#38BDF8', border: '#0284C7', textDark: true },
  { id: 'darkblue',   label: 'Dunkelblau', hex: '#1D4ED8', border: '#1E3A8A', textDark: false },
  { id: 'purple',     label: 'Lila',       hex: '#7E22CE', border: '#581C87', textDark: false },
  { id: 'lilac',      label: 'Flieder',    hex: '#C084FC', border: '#9333EA', textDark: true },
  { id: 'pink',       label: 'Pink',       hex: '#EC4899', border: '#BE185D', textDark: false },
  { id: 'rose',       label: 'Rosa',       hex: '#F472B6', border: '#DB2777', textDark: true },
  { id: 'lightgreen', label: 'Hellgrün',   hex: '#4ADE80', border: '#16A34A', textDark: true },
  { id: 'darkgreen',  label: 'Dunkelgrün', hex: '#15803D', border: '#14532D', textDark: false },
  { id: 'yellow',     label: 'Gelb',       hex: '#FACC15', border: '#CA8A04', textDark: true },
  { id: 'red',        label: 'Rot',        hex: '#EF4444', border: '#B91C1C', textDark: false },
  { id: 'orange',     label: 'Orange',     hex: '#F97316', border: '#C2410C', textDark: false },
]

export function getMonsterColor(colorId) {
  if (!colorId) return null
  return MONSTER_COLORS.find(c => c.id === colorId) || null
}
