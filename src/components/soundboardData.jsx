import cheerUrl from '../assets/effects/cheer.mp3'
import disappointmentUrl from '../assets/effects/disappointment.mp3'
import whipUrl from '../assets/effects/whip.mp3'
import punchUrl from '../assets/effects/Faustschlag.mp3'
import explosionUrl from '../assets/effects/explosion.mp3'
import glassShatterUrl from '../assets/effects/glasbruch.mp3'
import drumrollUrl from '../assets/effects/trommelwirbel.mp3'
import dragonRoarUrl from '../assets/effects/drachenbrüllen.mp3'
import dragonGrumbleUrl from '../assets/effects/Drachengrummeln.mp3'
import monsterRoarUrl from '../assets/effects/monsterbrüllen.mp3'
import wolfHowlUrl from '../assets/effects/wolfsgeheul.mp3'
import zombieUrl from '../assets/effects/zombie.mp3'
import win1Url from '../assets/effects/win1.mp3'
import win2Url from '../assets/effects/win2.mp3'
import fail1Url from '../assets/effects/fail1.mp3'
import fail2Url from '../assets/effects/fail2.mp3'
import applauseUrl from '../assets/effects/applaus.mp3'
import laughterUrl from '../assets/effects/gelaechter.mp3'
import bellUrl from '../assets/effects/Glocke.mp3'
import doorOpenUrl from '../assets/effects/tür öffnen.mp3'
import doorCloseUrl from '../assets/effects/tür schließen.mp3'
import lockedDoorUrl from '../assets/effects/abgeschlossen.mp3'
import coinsUrl from '../assets/effects/geld.mp3'
import holySpellUrl from '../assets/effects/Holy Spell.mp3'

const CDN = 'https://pub-28096ab7cf5d497990bc972094f05721.r2.dev'

// Helper: builds the R2 URL for a music filename
const m = (file) => `${CDN}/Music/${file}`

const campfireVideo     = `${CDN}/Videos/Lagerfeuer.mp4`
const villageVideo      = `${CDN}/Videos/dorf.mp4`
const tavernVideo       = `${CDN}/Videos/taverne.mp4`
const forestVideo       = `${CDN}/Videos/wald.mp4`
const gladeVideo        = `${CDN}/Videos/lichtung.mp4`
const dungeonVideo      = `${CDN}/Videos/dungeon.mp4`
const dustyDungeonVideo = `${CDN}/Videos/dusty_dungeon.mp4`
const houseVideo        = `${CDN}/Videos/house_in_woods.mp4`
const bachVideo         = `${CDN}/Videos/bach.mp4`
const castleVideo       = `${CDN}/Videos/burg.mp4`
const libraryVideo      = `${CDN}/Videos/bibliothek.mp4`
const shipVideo         = `${CDN}/Videos/piratenschiff.mp4`
const forestEdgeVideo   = `${CDN}/Videos/waldrand.mp4`
const graveyardVideo    = `${CDN}/Videos/friedhof.mp4`
const caveVideo         = `${CDN}/Videos/höhle.mp4`
const cellVideo         = `${CDN}/Videos/kerker.mp4`
const moonVideo         = `${CDN}/Videos/mond.mp4`
const moonSeaVideo      = `${CDN}/Videos/mond_meer.mp4`
const nightRainVideo    = `${CDN}/Videos/nachtregen.mp4`

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

// ── Effect Icons ──────────────────────────────────────────────────────────
export function IconBurst() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 14,9 21,7 16,12 21,17 14,15 12,22 10,15 3,17 8,12 3,7 10,9"/>
    </svg>
  )
}

export function IconShatter() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6l-3 3 3 3-2 8"/>
      <path d="M12 8l4-2"/>
      <path d="M9 14l-5 1"/>
      <path d="M15 11l5 3"/>
    </svg>
  )
}

export function IconDrum() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="9" rx="8" ry="3"/>
      <path d="M4 9v5c0 1.7 3.6 3 8 3s8-1.3 8-3V9"/>
      <path d="M8 7L5 4M16 7l3-3"/>
    </svg>
  )
}

export function IconDragon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14c-1-4 2-7 6-7l2-3 1 4c2 .5 3 2 3 4l3 1-2 2c0 2-2 4-5 4-4 0-7-2-8-5z"/>
      <circle cx="9" cy="11" r="0.9" fill="currentColor"/>
    </svg>
  )
}

export function IconSkull() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a7 7 0 0 0-5 11.9V18a1 1 0 0 0 1 1h1v2h6v-2h1a1 1 0 0 0 1-1v-3.1A7 7 0 0 0 12 3z"/>
      <circle cx="9.5" cy="11" r="1.3" fill="currentColor"/>
      <circle cx="14.5" cy="11" r="1.3" fill="currentColor"/>
    </svg>
  )
}

export function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8v5a4 4 0 0 1-8 0z"/>
      <path d="M8 5H5v1a3 3 0 0 0 3 3M16 5h3v1a3 3 0 0 1-3 3"/>
      <path d="M12 13v4"/>
      <path d="M10 17h4l1 4H9z"/>
    </svg>
  )
}

export function IconClap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 21l-4-4a2 2 0 0 1 0-3l1-1 4 4"/>
      <path d="M12 12l3-7a1.5 1.5 0 0 1 2.8 1l-1.8 5"/>
      <path d="M16 11l2-4a1.5 1.5 0 0 1 2.7 1.2L19 14a5 5 0 0 1-7 4"/>
      <path d="M5 6l1 2M3 9l2 .5"/>
    </svg>
  )
}

export function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/>
      <path d="M10 21a2 2 0 0 0 4 0"/>
      <path d="M12 3V5"/>
    </svg>
  )
}

export function IconDoor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17"/>
      <path d="M4 21h16"/>
      <circle cx="13" cy="12" r="1" fill="currentColor"/>
    </svg>
  )
}

export function IconCoins() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9" cy="7" rx="6" ry="3"/>
      <path d="M3 7v4c0 1.7 2.7 3 6 3"/>
      <path d="M9 14c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.4-1.8-2.5-4.3-2.9"/>
      <path d="M15 14v3"/>
    </svg>
  )
}

export function IconShip() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15h16l-2 5H6z"/>
      <path d="M12 15V4l6 4-6 2"/>
      <path d="M12 15v-5"/>
      <path d="M2 21c1.4 0 1.4-1 2.8-1s1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1"/>
    </svg>
  )
}

export function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z"/>
      <path d="M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

// Sieg- und Niederlagen-Jingle liegen als einzige Quelle im Bundle
// (src/orchestral_win.mp3, src/defeat_outro.mp3) und werden direkt von
// VictoryOverlay/DefeatOverlay importiert — nicht über das CDN.

// cat = category, sub = subcategory (for ordered song list).
// Array order determines display order.
export const MUSIC_TRACKS = [
  // ── Siedlung & Hof ────────────────────────────────────────────────────
  { key: 'peasant-folk',            label: 'Bauernvolk',  cat: 'Siedlung & Hof', sub: 'Dorf & Taverne',  url: m('dueg-oth-musik-bauern-142722.mp3'),                                  Icon: IconMug,   mood: { danger: 0.00, energy: 0.65, mysticism: 0.10, tone: 0.85 } },
  { key: 'middle-ages-happiness',   label: 'Mittelalter', cat: 'Siedlung & Hof', sub: 'Dorf & Taverne',  url: m('land_of_books_youtube-middle-ages-happynes-432859.mp3'),             Icon: IconMug,   mood: { danger: 0.00, energy: 0.60, mysticism: 0.10, tone: 0.90 } },
  { key: 'medieval-festive-dance',  label: 'Festtanz',    cat: 'Siedlung & Hof', sub: 'Dorf & Taverne',  url: m('tunetank-medieval-festive-music-412772.mp3'),                        Icon: IconMug,   mood: { danger: 0.00, energy: 0.75, mysticism: 0.10, tone: 0.85 } },
  { key: 'medieval-nobility',       label: 'Adel',        cat: 'Siedlung & Hof', sub: 'Adel & Hof',      url: m('dueg-oth-musik-adel-142724.mp3'),                                    Icon: IconCrown, mood: { danger: 0.00, energy: 0.45, mysticism: 0.20, tone: 0.85 } },
  { key: 'the-tournament',          label: 'Turnier',     cat: 'Siedlung & Hof', sub: 'Adel & Hof',      url: m('emmraan-the-tournament-280277.mp3'),                                 Icon: IconCrown, mood: { danger: 0.25, energy: 0.70, mysticism: 0.15, tone: 0.80 } },
  { key: 'fantasy-kingdom',         label: 'Königreich',  cat: 'Siedlung & Hof', sub: 'Adel & Hof',      url: m('emmraan-fantasy-kingdom-261257.mp3'),                                Icon: IconCrown, mood: { danger: 0.10, energy: 0.35, mysticism: 0.45, tone: 0.80 } },
  { key: 'medieval-ambience',       label: 'Ambiente',    cat: 'Siedlung & Hof', sub: 'Mauern & Hallen', url: m('dueg-oth-musik-hintergrund-142725.mp3'),                             Icon: IconHouse, mood: { danger: 0.10, energy: 0.30, mysticism: 0.20, tone: 0.60 } },
  { key: 'sunset-castle',           label: 'Abendrot',    cat: 'Siedlung & Hof', sub: 'Mauern & Hallen', url: m('valentinik-sunset-at-the-castle-350754.mp3'),                        Icon: IconHouse, mood: { danger: 0.05, energy: 0.25, mysticism: 0.35, tone: 0.75 } },
  { key: 'mystical-city',           label: 'Stadt',       cat: 'Siedlung & Hof', sub: 'Mauern & Hallen', url: m('luis_humanoide-the-mystical-city-cinematic-music-496260.mp3'),       Icon: IconHouse, mood: { danger: 0.20, energy: 0.35, mysticism: 0.70, tone: 0.65 } },
  { key: 'the-tower',               label: 'Turm',        cat: 'Siedlung & Hof', sub: 'Mauern & Hallen', url: m('welbornworks-thetower-328520.mp3'),                                  Icon: IconHouse, mood: { danger: 0.50, energy: 0.40, mysticism: 0.80, tone: 0.40 } },
  { key: 'castle-hollow-steps',     label: 'Schritte',    cat: 'Siedlung & Hof', sub: 'Mauern & Hallen', url: m('menieldm-castle-of-hollow-steps-495836.mp3'),                        Icon: IconHouse, mood: { danger: 0.50, energy: 0.15, mysticism: 0.40, tone: 0.20 } },
  { key: 'cinematic-desolation',    label: 'Trostlos',    cat: 'Siedlung & Hof', sub: 'Mauern & Hallen', url: m('senormusica81-cinematic-desolation-2026-v2-2-463167.mp3'),           Icon: IconSad,   mood: { danger: 0.40, energy: 0.15, mysticism: 0.30, tone: 0.10 } },

  // ── Reise & Wildnis ───────────────────────────────────────────────────
  { key: 'walking-theme',           label: 'Wanderung',   cat: 'Reise & Wildnis', sub: 'Wege & Aufbruch', url: m('walking_music.mp3'),                                                 Icon: IconRoad,    mood: { danger: 0.10, energy: 0.35, mysticism: 0.15, tone: 0.70 } },
  { key: 'adventure-theme',         label: 'Abenteuer',   cat: 'Reise & Wildnis', sub: 'Wege & Aufbruch', url: m('adventure_music.mp3'),                                               Icon: IconCompass, mood: { danger: 0.20, energy: 0.55, mysticism: 0.30, tone: 0.80 } },
  { key: 'great-adventure',         label: 'Großreise',   cat: 'Reise & Wildnis', sub: 'Wege & Aufbruch', url: m('mvnocopyrightmusic-great-adventure-532735.mp3'),                     Icon: IconCompass, mood: { danger: 0.15, energy: 0.50, mysticism: 0.25, tone: 0.80 } },
  { key: 'dawn-hope',               label: 'Dämmerung',   cat: 'Reise & Wildnis', sub: 'Wege & Aufbruch', url: m('dawn_music.mp3'),                                                    Icon: IconSun,     mood: { danger: 0.05, energy: 0.20, mysticism: 0.25, tone: 0.90 } },
  { key: 'wild-wood',               label: 'Wildwald',    cat: 'Reise & Wildnis', sub: 'Wald & Moor',     url: m('kaazoom-the-wild-wood-full-version-404937.mp3'),                     Icon: IconTrees,   mood: { danger: 0.30, energy: 0.40, mysticism: 0.40, tone: 0.60 } },
  { key: 'midnight-forest',         label: 'Nachtwald',   cat: 'Reise & Wildnis', sub: 'Wald & Moor',     url: m('geoffharvey-midnight-in-the-pine-forest-228844.mp3'),                Icon: IconTrees,   mood: { danger: 0.40, energy: 0.20, mysticism: 0.50, tone: 0.35 } },
  { key: 'spirits-moor',            label: 'Moorgeister', cat: 'Reise & Wildnis', sub: 'Wald & Moor',     url: m('geoffharvey-spirits-of-the-moor-180852.mp3'),                        Icon: IconRiver,   mood: { danger: 0.55, energy: 0.25, mysticism: 0.70, tone: 0.25 } },
  { key: 'woods-mystery',           label: 'Geheimwald',  cat: 'Reise & Wildnis', sub: 'Wald & Moor',     url: m('ob-lix-the-woods-mystery-intrigue-background-music-110802.mp3'),      Icon: IconTrees,   mood: { danger: 0.45, energy: 0.35, mysticism: 0.50, tone: 0.45 } },

  // ── Verlies & Ruinen ──────────────────────────────────────────────────
  { key: 'dark-spooky',             label: 'Höhle',       cat: 'Verlies & Ruinen', sub: 'Höhlen & Gewölbe', url: m('leberch-dark-spooky-309318.mp3'),                                    Icon: IconDungeon, mood: { danger: 0.70, energy: 0.25, mysticism: 0.40, tone: 0.10 } },
  { key: 'echoes-beneath-stone',    label: 'Echos',       cat: 'Verlies & Ruinen', sub: 'Höhlen & Gewölbe', url: m('menieldm-echoes-beneath-the-stone-495845.mp3'),                      Icon: IconDungeon, mood: { danger: 0.65, energy: 0.20, mysticism: 0.50, tone: 0.15 } },
  { key: 'obsidian-halls',          label: 'Obsidian',    cat: 'Verlies & Ruinen', sub: 'Höhlen & Gewölbe', url: m('menieldm-obsidian-halls-495840.mp3'),                                Icon: IconDungeon, mood: { danger: 0.75, energy: 0.30, mysticism: 0.60, tone: 0.15 } },
  { key: 'graveyard',               label: 'Friedhof',    cat: 'Verlies & Ruinen', sub: 'Ruinen & Gräber',  url: m('thisisbeatkitchen-beatkitchen-the-graveyard-yu-gi-oh-soundtrack-104-bpm-387052.mp3'), Icon: IconRuins, mood: { danger: 0.60, energy: 0.45, mysticism: 0.60, tone: 0.20 } },
  { key: 'forgotten-kingdom',       label: 'Verfall',     cat: 'Verlies & Ruinen', sub: 'Ruinen & Gräber',  url: m('onecinematicstudio-the-forgotten-kingdom-_-melancholic-amp-grand-ancient-ruins-music-529059.mp3'), Icon: IconRuins, mood: { danger: 0.30, energy: 0.25, mysticism: 0.60, tone: 0.35 } },
  { key: 'secrets-forgotten',       label: 'Geheimnis',   cat: 'Verlies & Ruinen', sub: 'Ruinen & Gräber', url: m('melodierealm-secrets-of-the-forgotten-453719.mp3'),               Icon: IconRuins,   mood: { danger: 0.35, energy: 0.20, mysticism: 0.80, tone: 0.45 } },

  // ── Kampf & Verfolgung ────────────────────────────────────────────────
  { key: 'war-drums',               label: 'Trommeln',    cat: 'Kampf & Verfolgung', sub: 'Schlacht',           url: m('amaksi-war-drums-173853.mp3'),                                       Icon: IconLightning, mood: { danger: 0.75, energy: 0.70, mysticism: 0.10, tone: 0.40 } },
  { key: 'epic-legend',             label: 'Legende',     cat: 'Kampf & Verfolgung', sub: 'Schlacht',           url: m('epic-fantasy-background-music.mp3'),                                 Icon: IconCrown,     mood: { danger: 0.60, energy: 0.75, mysticism: 0.50, tone: 0.75 } },
  { key: 'epic-battle',             label: 'Schlacht',    cat: 'Kampf & Verfolgung', sub: 'Schlacht',           url: m('francis_samuel-epic-battle-francisco-samuel-123469.mp3'),            Icon: IconLightning, mood: { danger: 0.90, energy: 0.90, mysticism: 0.50, tone: 0.40 } },
  { key: 'powerful-battle',         label: 'Bosskampf',   cat: 'Kampf & Verfolgung', sub: 'Schlacht',           url: m('tunetank-cinematic-powerful-battle-music-414692.mp3'),               Icon: IconLightning, mood: { danger: 0.95, energy: 0.95, mysticism: 0.40, tone: 0.35 } },
  { key: 'forbidden-fire',          label: 'Feuersbann',  cat: 'Kampf & Verfolgung', sub: 'Verfolgung & Bann',  url: m('iuvenis-genesis-del-fuego-prohibido-509238.mp3'),                    Icon: IconLightning, mood: { danger: 0.70, energy: 0.65, mysticism: 0.80, tone: 0.40 } },
  { key: 'action-chase',            label: 'Hetzjagd',    cat: 'Kampf & Verfolgung', sub: 'Verfolgung & Bann',  url: m('lilliben-action-chase-adrenaline-soundtrack-364888.mp3'),            Icon: IconLightning, mood: { danger: 0.80, energy: 1.00, mysticism: 0.20, tone: 0.40 } },

  // ── Mystik & Kosmos ───────────────────────────────────────────────────
  { key: 'forbidden-spell',         label: 'Bannzauber',  cat: 'Mystik & Kosmos', sub: 'Zauber & Magie',  url: m('40173586-forbidden-spell-awakening-dark-fantasy-488140.mp3'),        Icon: IconStar, mood: { danger: 0.70, energy: 0.30, mysticism: 0.90, tone: 0.15 } },
  { key: 'magic-in-air',            label: 'Magie',       cat: 'Mystik & Kosmos', sub: 'Zauber & Magie',  url: m('geoffharvey-magic-in-the-air-43177.mp3'),                            Icon: IconStar, mood: { danger: 0.05, energy: 0.30, mysticism: 0.85, tone: 0.85 } },
  { key: 'dark-fairytale',          label: 'Märchen',     cat: 'Mystik & Kosmos', sub: 'Zauber & Magie',  url: m('denis-pavlov-music-mysterious-esoteric-magical-shadowy-dark-fairytale-music-369257.mp3'), Icon: IconStar, mood: { danger: 0.40, energy: 0.25, mysticism: 0.90, tone: 0.25 } },
  { key: 'blessings-forest',        label: 'Waldsegen',   cat: 'Mystik & Kosmos', sub: 'Zauber & Magie',  url: m('whatssmooth-blessings-from-the-forest-fairies-of-the-magic-woods-426366.mp3'), Icon: IconTrees, mood: { danger: 0.05, energy: 0.30, mysticism: 0.95, tone: 0.90 } },
  { key: 'lost-dreams',             label: 'Träume',      cat: 'Mystik & Kosmos', sub: 'Traum & Aura',    url: m('dreaming_music.mp3'),                                                Icon: IconMoon, mood: { danger: 0.05, energy: 0.15, mysticism: 0.60, tone: 0.50 } },
  { key: 'echoes-of-aura',          label: 'Aura',        cat: 'Mystik & Kosmos', sub: 'Traum & Aura',    url: m('gnosticbliss-432-hz-echoes-of-the-aura-331610.mp3'),                 Icon: IconStar, mood: { danger: 0.05, energy: 0.10, mysticism: 1.00, tone: 0.60 } },

  // ── Handwerk ──────────────────────────────────────────────────────────
  { key: 'dwarven-forges',          label: 'Schmiede',    cat: 'Handwerk', sub: null, url: m('bizinbars_tome-dwarven-forges-213935.mp3'),                          Icon: IconDungeon, mood: { danger: 0.20, energy: 0.50, mysticism: 0.40, tone: 0.50 } },
]

// Groups MUSIC_TRACKS by category -> subcategory (array order).
export function getMusicGroups() {
  const cats = []
  for (const track of MUSIC_TRACKS) {
    let cat = cats.find(c => c.name === track.cat)
    if (!cat) { cat = { name: track.cat, subs: [] }; cats.push(cat) }
    let sub = cat.subs.find(s => s.name === (track.sub ?? ''))
    if (!sub) { sub = { name: track.sub ?? '', tracks: [] }; cat.subs.push(sub) }
    sub.tracks.push(track)
  }
  return cats
}

// cat = main category. Array order determines display order.
// Remains flat (App.jsx searches effects by key) - grouping via getEffectGroups().
export const EFFECT_TRACKS = [
  // ── Kampf & Action ────────────────────────────────────────────────────
  { key: 'faustschlag',     label: 'Faustschlag',    cat: 'Kampf & Action', url: punchUrl,    Icon: IconBurst },
  { key: 'explosion',       label: 'Explosion',      cat: 'Kampf & Action', url: explosionUrl,      Icon: IconBurst },
  { key: 'glasbruch',       label: 'Glasbruch',      cat: 'Kampf & Action', url: glassShatterUrl,      Icon: IconShatter },
  { key: 'trommelwirbel',   label: 'Trommelwirbel',  cat: 'Kampf & Action', url: drumrollUrl,  Icon: IconDrum },
  { key: 'whip',            label: 'Peitsche',       cat: 'Kampf & Action', url: whipUrl,           Icon: IconLightning },

  // ── Kreaturen ─────────────────────────────────────────────────────────
  { key: 'drachenbruellen', label: 'Drachenbrüllen', cat: 'Kreaturen', url: dragonRoarUrl, Icon: IconDragon },
  { key: 'drachengrummeln', label: 'Drachengrummeln',cat: 'Kreaturen', url: dragonGrumbleUrl, Icon: IconDragon },
  { key: 'monsterbruellen', label: 'Monsterbrüllen', cat: 'Kreaturen', url: monsterRoarUrl, Icon: IconSkull },
  { key: 'wolfsgeheul',     label: 'Wolfsgeheul',    cat: 'Kreaturen', url: wolfHowlUrl,     Icon: IconMoon },
  { key: 'zombie',          label: 'Zombie',         cat: 'Kreaturen', url: zombieUrl,          Icon: IconSkull },

  // ── Erfolg & Misserfolg ───────────────────────────────────────────────
  { key: 'win1',  label: 'Sieg 1',   cat: 'Erfolg & Misserfolg', url: win1Url,  Icon: IconTrophy },
  { key: 'win2',  label: 'Sieg 2',   cat: 'Erfolg & Misserfolg', url: win2Url,  Icon: IconTrophy },
  { key: 'fail1', label: 'Patzer 1', cat: 'Erfolg & Misserfolg', url: fail1Url, Icon: IconSad },
  { key: 'fail2', label: 'Patzer 2', cat: 'Erfolg & Misserfolg', url: fail2Url, Icon: IconSad },

  // ── Publikum & Reaktion ───────────────────────────────────────────────
  { key: 'applaus',        label: 'Applaus',      cat: 'Publikum & Reaktion', url: applauseUrl,        Icon: IconClap },
  { key: 'gelaechter',     label: 'Gelächter',    cat: 'Publikum & Reaktion', url: laughterUrl,     Icon: IconClap },
  { key: 'cheer',          label: 'Jubel',        cat: 'Publikum & Reaktion', url: cheerUrl,          Icon: IconStar },
  { key: 'disappointment', label: 'Enttäuschung', cat: 'Publikum & Reaktion', url: disappointmentUrl, Icon: IconSad },

  // ── Umgebung & Magie ──────────────────────────────────────────────────
  { key: 'glocke',        label: 'Glocke',         cat: 'Umgebung & Magie', url: bellUrl,        Icon: IconBell },
  { key: 'tuer-auf',      label: 'Tür öffnen',     cat: 'Umgebung & Magie', url: doorOpenUrl,       Icon: IconDoor },
  { key: 'tuer-zu',       label: 'Tür schließen',  cat: 'Umgebung & Magie', url: doorCloseUrl,        Icon: IconDoor },
  { key: 'abgeschlossen', label: 'Abgeschlossen',  cat: 'Umgebung & Magie', url: lockedDoorUrl, Icon: IconDoor },
  { key: 'geld',          label: 'Münzen',         cat: 'Umgebung & Magie', url: coinsUrl,          Icon: IconCoins },
  { key: 'holy-spell',    label: 'Heiliger Zauber',cat: 'Umgebung & Magie', url: holySpellUrl,     Icon: IconSun },
]

// Groups EFFECT_TRACKS by main category (array order).
export function getEffectGroups() {
  const cats = []
  for (const track of EFFECT_TRACKS) {
    let cat = cats.find(c => c.name === track.cat)
    if (!cat) { cat = { name: track.cat, tracks: [] }; cats.push(cat) }
    cat.tracks.push(track)
  }
  return cats
}

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
  { key: 'forest-edge', label: 'Waldrand', url: forestEdgeVideo, Icon: IconTrees },
  { key: 'castle', label: 'Burg', url: castleVideo, Icon: IconCrown },
  { key: 'library', label: 'Bibliothek', url: libraryVideo, Icon: IconBook },
  { key: 'ship', label: 'Piratenschiff', url: shipVideo, Icon: IconShip },
  { key: 'cave', label: 'Höhle', url: caveVideo, Icon: IconDungeon },
  { key: 'cell', label: 'Kerker', url: cellVideo, Icon: IconDungeon },
  { key: 'graveyard-scene', label: 'Friedhof', url: graveyardVideo, Icon: IconRuins },
  { key: 'moon', label: 'Mondnacht', url: moonVideo, Icon: IconMoon },
  { key: 'moon-sea', label: 'Mondmeer', url: moonSeaVideo, Icon: IconRiver },
  { key: 'night-rain', label: 'Nachtregen', url: nightRainVideo, Icon: IconMoon },
]
