import cheerUrl from '../Effects/cheer.mp3'
import disappointmentUrl from '../Effects/disappointment.mp3'
import whipUrl from '../Effects/whip.mp3'

const CDN = 'https://pub-28096ab7cf5d497990bc972094f05721.r2.dev'

const adventureUrl      = `${CDN}/Music/adventure_music.mp3`
const dawnUrl           = `${CDN}/Music/dawn_music.mp3`
const dreamingUrl       = `${CDN}/Music/dreaming_music.mp3`
const epicUrl           = `${CDN}/Music/epic-fantasy-background-music.mp3`
const walkingUrl        = `${CDN}/Music/walking_music.mp3`

const campfireVideo     = `${CDN}/Videos/Lagerfeuer.mp4`
const villageVideo      = `${CDN}/Videos/dorf.mp4`
const tavernVideo       = `${CDN}/Videos/taverne.mp4`
const forestVideo       = `${CDN}/Videos/wald.mp4`
const gladeVideo        = `${CDN}/Videos/lichtung.mp4`
const dungeonVideo      = `${CDN}/Videos/dungeon.mp4`
const dustyDungeonVideo = `${CDN}/Videos/dusty_dungeon.mp4`
const houseVideo        = `${CDN}/Videos/house_in_woods.mp4`
const bachVideo         = `${CDN}/Videos/bach.mp4`

export function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="12,5 10.5,12 12,10 13.5,12" fill="currentColor" stroke="none"/>
      <polygon points="12,19 10.5,12 12,14 13.5,12" fill="currentColor" fillOpacity="0.35" stroke="none"/>
      <line x1="12" y1="2" x2="12" y2="4" strokeWidth="1"/>
      <line x1="12" y1="20" x2="12" y2="22" strokeWidth="1"/>
      <line x1="2" y1="12" x2="4" y2="12" strokeWidth="1"/>
      <line x1="20" y1="12" x2="22" y2="12" strokeWidth="1"/>
    </svg>
  )
}

export function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
    </svg>
  )
}

export function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      <circle cx="17" cy="5" r="1" fill="currentColor" stroke="none"/>
      <circle cx="20" cy="9" r="0.6" fill="currentColor" stroke="none"/>
      <circle cx="14" cy="3" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export function IconCrown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18l3.5-9 5.5 5.5 5.5-5.5 3.5 9z"/>
      <line x1="2" y1="21" x2="22" y2="21"/>
      <circle cx="12" cy="14" r="1" fill="currentColor"/>
      <circle cx="5.5" cy="9" r="1.2" fill="currentColor"/>
      <circle cx="18.5" cy="9" r="1.2" fill="currentColor"/>
    </svg>
  )
}

export function IconRoad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20 L12 4 L20 20"/>
      <line x1="8" y1="14" x2="16" y2="14"/>
      <line x1="6" y1="18" x2="18" y2="18"/>
      <line x1="10" y1="10" x2="14" y2="10"/>
    </svg>
  )
}

export function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  )
}

export function IconSad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 17s-1.5-2-4-2-4 2-4 2"/>
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/>
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/>
    </svg>
  )
}

export function IconLightning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
    </svg>
  )
}

export function IconCampfire() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14c0-2 1.2-3.5 3-5 0 1.8 1.6 2.4 1.6 4.2A2.6 2.6 0 0 1 10 15.8 2 2 0 0 1 8 14z"/>
      <path d="M12 16c0-2 1.3-3.4 3.1-5.1 0 2.6 2.2 3 2.2 5.4A3.3 3.3 0 0 1 14 19.6 2.3 2.3 0 0 1 12 16z"/>
      <path d="M5 20l5-3m4 0l5 3"/>
      <path d="M4 22h16"/>
    </svg>
  )
}

export function IconTrees() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16l3-5 3 5z"/>
      <path d="M4 14l3-5 3 5z"/>
      <path d="M13 14l3-5 3 5z"/>
      <line x1="7" y1="16" x2="7" y2="20"/>
      <line x1="16" y1="14" x2="16" y2="20"/>
      <line x1="12" y1="16" x2="12" y2="20"/>
      <path d="M2 21h20"/>
    </svg>
  )
}

export function IconMug() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h12v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/>
      <path d="M16 10h2a2 2 0 0 1 0 4h-2"/>
      <path d="M7 4v2M10 3v3M13 4v2"/>
    </svg>
  )
}

export function IconDungeon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M8 4v16M12 4v16M16 4v16"/>
      <path d="M4 8h16M4 12h16M4 16h16"/>
    </svg>
  )
}

export function IconHouse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7"/>
      <path d="M5 10v10h14V10"/>
      <path d="M10 20v-5h4v5"/>
    </svg>
  )
}

export function IconRiver() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>
      <path d="M3 10c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>
      <path d="M3 15c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>
      <path d="M3 20c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>
    </svg>
  )
}

export function IconVillage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 21h20"/>
      <path d="M4 12l3-4 3 4v9H4z"/>
      <path d="M14 8l4-5 4 5v13h-8z"/>
      <path d="M6 21v-5h2v5"/>
      <path d="M16 21v-7h2v7"/>
    </svg>
  )
}

export function IconGlade() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3"/>
      <path d="M12 2v2"/>
      <path d="M5.2 5.2l1.4 1.4"/>
      <path d="M2 11h2"/>
      <path d="M18.8 5.2l-1.4 1.4"/>
      <path d="M22 11h-2"/>
      <path d="M3 20c2.5-4 5-5 9-5s6.5 1 9 5"/>
      <path d="M2 22h20"/>
    </svg>
  )
}

export function IconRuins() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21v-7"/>
      <path d="M5 11V9a7 7 0 0 1 14 0v2"/>
      <path d="M19 21v-7"/>
      <path d="M9 10h6"/>
      <path d="M7 15l3-2"/>
      <path d="M14 17l3-1"/>
    </svg>
  )
}

export const MUSIC_TRACKS = [
  { key: 'adventure', label: 'Abenteuer', url: adventureUrl, Icon: IconCompass },
  { key: 'dawn', label: 'Morgengrauen', url: dawnUrl, Icon: IconSun },
  { key: 'dreaming', label: 'Träumerei', url: dreamingUrl, Icon: IconMoon },
  { key: 'epic', label: 'Episch', url: epicUrl, Icon: IconCrown },
  { key: 'walking', label: 'Reise', url: walkingUrl, Icon: IconRoad },
]

export const EFFECT_TRACKS = [
  { key: 'cheer', label: 'Jubel', url: cheerUrl, Icon: IconStar },
  { key: 'disappointment', label: 'Enttäuschung', url: disappointmentUrl, Icon: IconSad },
  { key: 'whip', label: 'Peitsche', url: whipUrl, Icon: IconLightning },
]

export const VIDEO_SCENES = [
  { key: 'campfire', label: 'Lagerfeuer', url: campfireVideo, Icon: IconCampfire },
  { key: 'tavern', label: 'Taverne', url: tavernVideo, Icon: IconMug },
  { key: 'village', label: 'Dorf', url: villageVideo, Icon: IconVillage },
  { key: 'forest', label: 'Wald', url: forestVideo, Icon: IconTrees },
  { key: 'glade', label: 'Lichtung', url: gladeVideo, Icon: IconGlade },
  { key: 'dungeon', label: 'Dungeon', url: dungeonVideo, Icon: IconDungeon },
  { key: 'dusty-dungeon', label: 'Ruinen', url: dustyDungeonVideo, Icon: IconRuins },
  { key: 'house', label: 'Waldhaus', url: houseVideo, Icon: IconHouse },
  { key: 'river', label: 'Bach', url: bachVideo, Icon: IconRiver },
]
