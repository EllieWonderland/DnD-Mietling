import { useState, useEffect, useRef } from 'react'
import SessionSetup from './components/SessionSetup.jsx'
import InitiativeTracker from './components/InitiativeTracker.jsx'
import AmbienceScene from './components/AmbienceScene.jsx'
import ScreenKeepAlive from './components/ScreenKeepAlive.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { readJSON, writeJSON, storageRemove } from './utils/safeStorage.js'
import { getRoomId } from './utils/session.js'
import { MUSIC_TRACKS, EFFECT_TRACKS, VIDEO_SCENES } from './components/soundboardData.jsx'
import mietlingLogo from './assets/images/mietling.png'

// Players have no HP in this app: the DM tracks damage at the table, the
// tracker only shows death saves and who has fallen. Monsters and allies do
// carry HP — see InitiativeTracker.
const PLAYER_DEFAULTS = [
  { id: 'athania',    name: 'Athania' },
  { id: 'delat',      name: 'Delat' },
  { id: 'tharion',    name: 'Tharion' },
  { id: 'sora',       name: 'Sora' },
  { id: 'vhahlhohkh', name: 'Vhahlhohkh' },
]

// Stored profiles used to replace the defaults wholesale, so a character
// added in code never showed up for anyone who had already used the app —
// and a character removed from the code stayed forever. The defaults decide
// who exists; a stored entry only overrides name and max HP, and only with
// values that survive validation.
function loadPlayerProfiles() {
  const saved = readJSON('dnd-player-profiles', null)
  const byId = new Map()
  if (Array.isArray(saved)) {
    for (const entry of saved) {
      if (entry && typeof entry === 'object' && typeof entry.id === 'string') {
        byId.set(entry.id, entry)
      }
    }
  }
  return PLAYER_DEFAULTS.map(def => {
    const stored = byId.get(def.id)
    if (!stored) return { ...def }
    const name = typeof stored.name === 'string' && stored.name.trim()
      ? stored.name.trim()
      : def.name
    return { ...def, name }
  })
}

// Left over from the days when players had HP. Nothing writes it any more,
// so it is dropped once on start instead of lingering on every device.
storageRemove('dnd-player-hp')

function saveCombatState(state) {
  writeJSON('dnd-combat-state', state)
}
function loadCombatState() {
  return readJSON('dnd-combat-state', null)
}
function clearCombatState() {
  storageRemove('dnd-combat-state')
}

// Smoothly fade audio volume on a single element to save memory.
// Cancels any running fade. onDone is called when target is reached.
function fadeAudio(audio, fadeRef, target, durationMs, onDone) {
  if (fadeRef.current) clearInterval(fadeRef.current)
  const stepMs = 40
  const start = audio.volume
  const steps = Math.max(1, Math.round(durationMs / stepMs))
  let i = 0
  const id = setInterval(() => {
    i++
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * (i / steps)))
    if (i >= steps) {
      clearInterval(id)
      if (fadeRef.current === id) fadeRef.current = null
      onDone?.()
    }
  }, stepMs)
  fadeRef.current = id
}

function makePlayer(pid, profiles) {
  const profile = profiles.find(p => p.id === pid) ?? { id: pid, name: pid }
  return {
    id: pid, name: profile.name, type: 'player',
    initiative: 0,
    reaction: false,
    conditions: [], concentration: false,
    blessed: false, hidden: false, flying: false, exhaustion: 0,
    deathSaves: { successes: 0, failures: 0 },
  }
}

// The TV renders whatever the relay hands it. A malformed payload (foreign
// sender, half-written message, older app version) must not reach the render
// tree — a missing `participants` alone is enough to blank the screen.
function isValidDisplayState(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false
  if (!Array.isArray(s.participants)) return false
  if (!s.participants.every(p => p && typeof p === 'object' && typeof p.id === 'string')) return false
  if (typeof s.round !== 'number' || !Number.isFinite(s.round)) return false
  if (typeof s.activeIndex !== 'number' || !Number.isFinite(s.activeIndex)) return false
  if (s.phase !== 'setup' && s.phase !== 'combat') return false
  return true
}

// Fill in what a valid-but-sparse state leaves out so the render path never
// meets undefined where it expects a list or a flag.
function normalizeDisplayState(s) {
  return {
    ...s,
    participants: s.participants.map(p => ({
      ...p,
      conditions: Array.isArray(p.conditions) ? p.conditions : [],
      deathSaves: p.deathSaves && typeof p.deathSaves === 'object'
        ? p.deathSaves
        : { successes: 0, failures: 0 },
    })),
    ambienceFits: s.ambienceFits && typeof s.ambienceFits === 'object' ? s.ambienceFits : {},
    victory: !!s.victory,
    defeat: !!s.defeat,
  }
}

function isValidCompactScroll(scroll) {
  if (!scroll || typeof scroll !== 'object') return false
  return typeof scroll.scrollRatio === 'number' || typeof scroll.scrollTop === 'number'
}

const APP_MODE = new URLSearchParams(window.location.search).get('mode') === 'display'
  ? 'display'
  : 'controller'

// Everything is relayed inside one room. The controller owns the id and hands
// it to the TV through the connection URL; without it the display connects to
// nothing, which is the whole point — the relay hostname itself is public.
const ROOM = getRoomId(APP_MODE)

export default function App() {
  const [phase, setPhase] = useState('setup')
  const [participants, setParticipants] = useState([])
  const [round, setRound] = useState(1)
  const [activeIndex, setActiveIndex] = useState(0)
  const [victory, setVictory] = useState(false)
  const [defeat, setDefeat] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [playingMusicKey, setPlayingMusicKey] = useState(null)
  const [masterVolume, setMasterVolume] = useState(0.72)
  const [ambienceScene, setAmbienceScene] = useState(null)
  const [ambienceFits, setAmbienceFits] = useState(() => readJSON('dnd-ambience-fits', {}) || {})
  const [effectTrigger, setEffectTrigger] = useState(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [playerProfiles, setPlayerProfiles] = useState(loadPlayerProfiles)
  const [savedCombat, setSavedCombat] = useState(() => loadCombatState())
  const [mood, setMood] = useState({ danger: 0.2, energy: 0.4, mysticism: 0.3, tone: 0.6 })
  const tvMusicRef = useRef(null)
  const fadeRef = useRef(null)
  // The relay replays the cached state on every (re)connect, effect trigger
  // included. The first state a display sees only primes these refs — without
  // that, reconnecting or pressing "Ton aktivieren" fires the last explosion
  // into a quiet table.
  const effectPrimedRef = useRef(false)
  const lastEffectNonceRef = useRef(null)
  // Volume the controller last asked for. A fade owns audio.volume while it
  // runs, so slider moves during those ~600 ms land here and are applied at
  // the end instead of being dropped.
  const targetVolumeRef = useRef(0.72)

  const wsRef = useRef(null)
  const bcRef = useRef(null)
  const pendingStateRef = useRef(null)
  const lastMsgAtRef = useRef(Date.now())
  const [displayState, setDisplayState] = useState(null)
  const [displayCompactScroll, setDisplayCompactScroll] = useState(null)

  function applyDisplayState(raw) {
    const state = normalizeDisplayState(raw)
    if (!effectPrimedRef.current) {
      effectPrimedRef.current = true
      lastEffectNonceRef.current = state.effectTrigger?.nonce ?? null
    }
    setDisplayState(state)
  }

  // Clear display compact scroll when turn changes in display mode
  useEffect(() => {
    if (APP_MODE === 'display') {
      setDisplayCompactScroll(null)
    }
  }, [displayState?.activeIndex, displayState?.round])

  // WebSocket & BroadcastChannel: sync state & scroll events
  useEffect(() => {
    if (!ROOM) return // display opened without a room — nothing to connect to
    let closed = false
    const bc = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(`dnd-mietling-${ROOM}`)
      : null
    bcRef.current = bc

    if (bc) {
      bc.onmessage = event => {
        if (APP_MODE === 'display') {
          lastMsgAtRef.current = Date.now()
          const msg = event.data
          if (msg?.type === 'STATE') {
            if (isValidDisplayState(msg.state)) applyDisplayState(msg.state)
          } else if (msg?.type === 'COMPACT_SCROLL') {
            if (isValidCompactScroll(msg.scroll)) setDisplayCompactScroll(msg.scroll)
          }
        }
      }
    }

    async function init() {
      let wsUrl
      try {
        const res = await fetch('/config.json')
        const cfg = await res.json()
        if (cfg.wsUrl && !cfg.wsUrl.startsWith('REPLACE')) wsUrl = cfg.wsUrl
      } catch {}

      if (!wsUrl) {
        wsUrl = import.meta.env.DEV
          ? `ws://${window.location.hostname}:3001`
          : null
      }

      if (!wsUrl) return // no server configured — silently skip WebSocket

      // The room travels in the query string; the relay never forwards across rooms.
      const roomUrl = `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}room=${encodeURIComponent(ROOM)}`

      function connect() {
        if (closed) return
        const ws = new WebSocket(roomUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (pendingStateRef.current) {
            ws.send(pendingStateRef.current)
            pendingStateRef.current = null
          }
        }

        ws.onmessage = event => {
          if (APP_MODE === 'display') {
            lastMsgAtRef.current = Date.now()
            try {
              const msg = JSON.parse(event.data)
              if (msg.type === 'STATE') {
                if (isValidDisplayState(msg.state)) applyDisplayState(msg.state)
              } else if (msg.type === 'COMPACT_SCROLL') {
                if (isValidCompactScroll(msg.scroll)) setDisplayCompactScroll(msg.scroll)
              }
            } catch {}
          }
        }

        ws.onclose = () => { if (!closed) setTimeout(connect, 3000) }
        ws.onerror = () => {}
      }

      connect()
    }

    init()
    return () => {
      closed = true
      if (bc) bc.close()
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  const latestStateRef = useRef({})
  useEffect(() => {
    latestStateRef.current = { phase, participants, round, activeIndex, victory, defeat, ambienceScene, ambienceFits, playingMusicKey, masterVolume, effectTrigger }
  }, [phase, participants, round, activeIndex, victory, defeat, ambienceScene, ambienceFits, playingMusicKey, masterVolume, effectTrigger])

  // Controller: push the current state to the TV. Reads from latestStateRef so
  // the heartbeat below can reuse it without stale-closure trouble.
  const lastStateSentRef = useRef(0)
  function broadcastState() {
    const payload = { type: 'STATE', state: latestStateRef.current }
    const str = JSON.stringify(payload)
    lastStateSentRef.current = Date.now()
    pendingStateRef.current = str
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(str)
      pendingStateRef.current = null
    }
    if (bcRef.current) {
      bcRef.current.postMessage(payload)
    }
  }

  // Controller: broadcast full state on every change
  useEffect(() => {
    if (APP_MODE !== 'controller') return
    broadcastState()
  }, [phase, participants, round, activeIndex, victory, defeat, ambienceScene, ambienceFits, playingMusicKey, masterVolume, effectTrigger])

  // Controller: idle heartbeat. If the TV ever misses a single message - a
  // socket dying unnoticed while a fullscreen video keeps the browser busy is
  // the usual cause - it catches up within a few seconds instead of being
  // stuck on the previous screen.
  useEffect(() => {
    if (APP_MODE !== 'controller') return
    const id = setInterval(() => {
      if (Date.now() - lastStateSentRef.current < 4000) return
      broadcastState()
    }, 4000)
    return () => clearInterval(id)
  }, [])

  // Display: watchdog. With the heartbeat above, silence means the socket is
  // dead even though it never fired onclose. Closing it starts the reconnect,
  // and the relay replays the last state on connect.
  useEffect(() => {
    if (APP_MODE !== 'display') return
    const id = setInterval(() => {
      if (Date.now() - lastMsgAtRef.current < 15000) return
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        lastMsgAtRef.current = Date.now()
        ws.close()
      }
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // Controller: broadcast right panel scroll position
  const scrollThrottleRef = useRef(null)
  const pendingScrollRef = useRef(null)

  function dispatchCompactScroll(scrollData) {
    const payload = {
      type: 'COMPACT_SCROLL',
      scroll: {
        scrollRatio: scrollData.scrollRatio,
        scrollTop: scrollData.scrollTop,
        timestamp: scrollData.timestamp || Date.now(),
      },
    }
    const str = JSON.stringify(payload)
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(str)
    }
    if (bcRef.current) {
      bcRef.current.postMessage(payload)
    }
  }

  function sendCompactScroll(scrollData) {
    if (APP_MODE !== 'controller') return
    pendingScrollRef.current = scrollData
    if (scrollThrottleRef.current) return

    dispatchCompactScroll(scrollData)
    scrollThrottleRef.current = setTimeout(() => {
      scrollThrottleRef.current = null
      if (pendingScrollRef.current) {
        dispatchCompactScroll(pendingScrollRef.current)
        pendingScrollRef.current = null
      }
    }, 40)
  }

  // PWA install prompt
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsStandalone(standalone)

    function onBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)
    }
    function onAppInstalled() {
      setInstallPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  // Music and Video only play on TV (Display Mode). The Controller (Master)
  // only controls and shows what is playing - no local playback here.

  // TV: start/stop music when playingMusicKey changes (or after audio unlock)
  useEffect(() => {
    if (APP_MODE !== 'display' || !audioUnlocked) return
    const key = displayState?.playingMusicKey
    const volume = displayState?.masterVolume ?? 0.72

    // Reuse a single persistent audio element instead of creating new ones
    // to prevent memory/limit freezes on tablets.
    let audio = tvMusicRef.current
    if (!audio) {
      audio = new Audio()
      audio.loop = true
      tvMusicRef.current = audio
    }

    const FADE_MS = 600

    // Swap source, start quietly and fade in gently (old stream is released by load()).
    const startTrack = track => {
      audio.pause()
      audio.src = track.url
      audio.loop = true
      audio.volume = 0
      audio.load()
      audio.play().catch(() => {})
      // Fade towards the volume known when the fade started, then snap to
      // whatever the slider says now — a move during the fade is not lost.
      fadeAudio(audio, fadeRef, volume, FADE_MS, () => {
        audio.volume = targetVolumeRef.current
      })
    }

    if (!key) {
      // Fade out, then stop and explicitly release buffer/stream
      if (!audio.src || audio.paused) return
      fadeAudio(audio, fadeRef, 0, FADE_MS, () => {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      })
      return
    }

    const track = MUSIC_TRACKS.find(t => t.key === key)
    if (!track) return

    // If another song is already playing -> fade out first, then switch
    if (audio.src && !audio.paused) {
      fadeAudio(audio, fadeRef, 0, FADE_MS, () => startTrack(track))
    } else {
      startTrack(track)
    }
  }, [displayState?.playingMusicKey, audioUnlocked])

  // TV: sync volume while music is playing
  useEffect(() => {
    if (APP_MODE !== 'display') return
    targetVolumeRef.current = displayState?.masterVolume ?? 0.72
    if (!audioUnlocked || !tvMusicRef.current) return
    // A running fade owns the volume; its onDone applies the ref afterwards.
    if (fadeRef.current) return
    tvMusicRef.current.volume = targetVolumeRef.current
  }, [displayState?.masterVolume, audioUnlocked])

  // TV: one-shot effect sounds
  useEffect(() => {
    if (APP_MODE !== 'display' || !audioUnlocked || !displayState?.effectTrigger) return
    const nonce = displayState.effectTrigger.nonce
    // Only a nonce the display has not seen before is a real trigger; a
    // replayed state carries the old one.
    if (nonce === lastEffectNonceRef.current) return
    lastEffectNonceRef.current = nonce
    const track = EFFECT_TRACKS.find(t => t.key === displayState.effectTrigger.key)
    if (!track) return
    const audio = new Audio(track.url)
    audio.volume = displayState.masterVolume ?? 0.72
    audio.play().catch(() => {})
    // Release stream/buffer after playing so effect audios don't accumulate
    audio.onended = () => { audio.removeAttribute('src'); audio.load() }
  }, [displayState?.effectTrigger?.nonce, audioUnlocked])

  // Controller: auto-save full combat state on every change during combat
  useEffect(() => {
    if (APP_MODE !== 'controller' || phase !== 'combat') return
    saveCombatState({ phase, participants, round, activeIndex, victory, defeat })
  }, [phase, participants, round, activeIndex, victory, defeat])

  function stopMusic() {
    setPlayingMusicKey(null)
  }

  function playMusic(track) {
    if (!track) return
    if (playingMusicKey === track.key) { setPlayingMusicKey(null); return }
    setPlayingMusicKey(track.key)
  }

  // Slider path: only sets music if it changes (NO toggle, unlike playMusic)
  function selectMusic(track) {
    if (!track || track.key === playingMusicKey) return
    setPlayingMusicKey(track.key)
  }

  // Hybrid: manual click in soundboard -> pull sliders to the song's mood values
  function playMusicAndSyncSliders(track) {
    playMusic(track) // Existing toggle logic (click on playing song = stop)
    if (track?.mood) setMood(track.mood)
  }

  function playEffect(track) {
    if (!track) return
    setEffectTrigger({ key: track.key, nonce: Date.now() })
  }

  function resumeCombat() {
    if (!savedCombat) return
    setParticipants(savedCombat.participants)
    setRound(savedCombat.round)
    setActiveIndex(savedCombat.activeIndex)
    setVictory(savedCombat.victory ?? false)
    setDefeat(savedCombat.defeat ?? false)
    // Same as startCombat: the combat screen takes over the TV, so a scene
    // left running must not pop back up when the combat ends.
    setAmbienceScene(null)
    setPhase('combat')
    setSavedCombat(null)
  }

  // Start scene: only runs on TV. Controller does NOT switch to a
  // fullscreen view, but only shows in the soundboard that it's live.
  function openAmbienceScene(scene) {
    if (!scene) return
    setAmbienceScene(prev => prev === scene.key ? null : scene.key)
  }

  function stopAmbienceScene() {
    setAmbienceScene(null)
  }

  // Toggle current scene display between 'contain' and 'cover'.
  // Saved per scene in localStorage.
  function toggleSceneFit(sceneKey) {
    if (!sceneKey) return
    setAmbienceFits(prev => {
      const next = { ...prev, [sceneKey]: (prev[sceneKey] === 'cover' ? 'contain' : 'cover') }
      writeJSON('dnd-ambience-fits', next)
      return next
    })
  }

  function updatePlayerProfile(id, name) {
    setPlayerProfiles(prev => {
      const next = prev.map(p => p.id === id ? { ...p, name } : p)
      writeJSON('dnd-player-profiles', next)
      return next
    })
  }

  function startCombat(selectedIds, initiatives) {
    clearCombatState()
    const players = selectedIds.map(pid => ({
      ...makePlayer(pid, playerProfiles),
      initiative: Math.max(1, parseInt(initiatives[pid]) || 1),
    }))
    // `order` is the turn order from here on. Initiative only decides the
    // starting line-up; after that manual swaps own it (see InitiativeTracker).
    const sorted = [...players]
      .sort((a, b) => b.initiative - a.initiative)
      .map((p, i) => ({ ...p, order: i }))
    setParticipants(sorted)
    setRound(1)
    setActiveIndex(0)
    setVictory(false)
    setDefeat(false)
    setPlayingMusicKey(null)
    setAmbienceScene(null)
    setPhase('combat')
  }

  function nextTurn() {
    setRound(r => r + 1)
    const next = participants.map(p => ({ ...p, reaction: false }))
    updateParticipants(next)
  }
  function prevTurn() { setRound(r => Math.max(1, r - 1)) }

  function endCombat() {
    clearCombatState()
    setSavedCombat(null)
    setPhase('setup')
    setVictory(false)
    setDefeat(false)
  }

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  // ── DISPLAY MODE (TV) ──────────────────────────────────────────────────────
  if (APP_MODE === 'display') {
    // Without a room the TV would have to listen to the whole relay. It waits
    // for the link from the setup screen instead.
    if (!ROOM) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px', padding: 'clamp(20px, 4vh, 48px)', boxSizing: 'border-box', textAlign: 'center' }}>
          <img src={mietlingLogo} alt="DnD Mietling" style={{ maxWidth: '320px', width: '60vw', objectFit: 'contain' }} />
          <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-title)', fontSize: '1.3rem', letterSpacing: '0.08em' }}>
            Kein Raum in der Adresse
          </div>
          <div style={{ color: 'var(--text-dim)', maxWidth: '32em', lineHeight: 1.7 }}>
            Diese Anzeige braucht die Verbindungs-Adresse aus dem Setup-Bildschirm
            („TV verbinden"). Sie enthält den Raum-Code dieser Session.
          </div>
        </div>
      )
    }

    if (!audioUnlocked) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '32px', padding: 'clamp(20px, 4vh, 48px)', boxSizing: 'border-box' }}>
          <img src={mietlingLogo} alt="DnD Mietling" style={{ maxWidth: '320px', width: '60vw', objectFit: 'contain' }} />
          <button
            onClick={() => {
              const AudioCtx = window.AudioContext || window.webkitAudioContext
              if (AudioCtx) new AudioCtx().resume()
              const a = new Audio(); a.play().catch(() => {})
              setAudioUnlocked(true)
            }}
            style={{
              padding: '20px 48px', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.08em',
              background: 'linear-gradient(180deg, #2f2418, #1f1812)',
              color: 'var(--gold)', border: '2px solid var(--border-gold)',
              borderRadius: '8px', cursor: 'pointer',
              boxShadow: '0 0 32px rgba(201,162,39,0.3)',
            }}
          >
            Ton aktivieren
          </button>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            {displayState ? 'Bereit' : 'Verbindung wird hergestellt …'}
          </div>
        </div>
      )
    }

    if (!displayState) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', padding: 'clamp(20px, 4vh, 48px)', boxSizing: 'border-box' }}>
          <img src={mietlingLogo} alt="DnD Mietling" style={{ maxWidth: '320px', width: '60vw', objectFit: 'contain' }} />
          <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Verbindung wird hergestellt …</div>
        </div>
      )
    }

    const { phase: dp, participants: dPart, round: dRound, activeIndex: dIdx, ambienceScene: dSceneKey, ambienceFits: dFits, victory: dVictory, defeat: dDefeat } = displayState
    const dScene = dSceneKey ? VIDEO_SCENES.find(s => s.key === dSceneKey) ?? null : null
    const dSceneFit = (dFits && dSceneKey && dFits[dSceneKey]) || 'contain'

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ScreenKeepAlive enabled={true} />
        {/* The combat screen always takes precedence. Starting or resuming a
            combat clears the scene for good — it does not come back when the
            combat ends (see startCombat/resumeCombat). */}
        <ErrorBoundary label="TV-Anzeige">
        {dp === 'combat' ? (
          <InitiativeTracker
            participants={dPart}
            setParticipants={() => {}}
            round={dRound}
            activeIndex={dIdx}
            setActiveIndex={() => {}}
            onNextTurn={() => {}}
            onEndCombat={() => {}}
            victory={dVictory ?? false}
            setVictory={() => {}}
            defeat={dDefeat ?? false}
            setDefeat={() => {}}
            compactScroll={displayCompactScroll}
            displayOnly
          />
        ) : dScene ? (
          <AmbienceScene
            scene={dScene}
            fit={dSceneFit}
            onPlayEffect={() => {}}
            onBack={() => {}}
            displayOnly
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={mietlingLogo} alt="DnD Mietling" style={{ maxWidth: '400px', width: '60vw', objectFit: 'contain' }} />
          </div>
        )}
        </ErrorBoundary>
      </div>
    )
  }

  // ── CONTROLLER MODE (Tablet) ───────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScreenKeepAlive enabled={true} />
      {!isStandalone && installPrompt && (
        <button
          onClick={handleInstall}
          style={{
            position: 'fixed', bottom: '16px', left: '16px', zIndex: 2000,
            padding: '12px 16px', borderRadius: '999px',
            border: '1px solid var(--border-gold)',
            background: 'linear-gradient(180deg, #2f2418, #1f1812)',
            color: 'var(--text-main)', fontWeight: 700,
            boxShadow: '0 0 24px rgba(201, 162, 39, 0.25)',
          }}
        >
          App installieren
        </button>
      )}
      {savedCombat && phase === 'setup' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #2f2418, #1f1812)',
            border: '2px solid var(--border-gold)',
            borderRadius: '12px',
            padding: '32px 40px',
            display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center',
            boxShadow: '0 0 64px rgba(201,162,39,0.3)',
            maxWidth: '480px', width: '90%',
          }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', color: 'var(--gold)', letterSpacing: '0.08em' }}>
              Unterbrochener Kampf
            </div>
            <div style={{ color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.6 }}>
              Runde {savedCombat.round} &mdash; {savedCombat.participants?.length ?? 0} Teilnehmer
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={resumeCombat}
                style={{
                  padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem',
                  background: 'linear-gradient(180deg, #3a2800, #2a1800)',
                  color: 'var(--gold)', border: '2px solid var(--border-gold)',
                  cursor: 'pointer',
                }}
              >
                Fortsetzen
              </button>
              <button
                onClick={() => { clearCombatState(); setSavedCombat(null) }}
                style={{
                  padding: '12px 28px', borderRadius: '8px', fontSize: '1rem',
                  background: 'transparent',
                  color: 'var(--text-dim)', border: '1px solid rgba(201,162,39,0.3)',
                  cursor: 'pointer',
                }}
              >
                Verwerfen
              </button>
            </div>
          </div>
        </div>
      )}
      {phase === 'setup' && (
        <SessionSetup
          players={playerProfiles}
          room={ROOM}
          onUpdateProfile={updatePlayerProfile}
          onStart={startCombat}
          playingMusicKey={playingMusicKey}
          volume={masterVolume}
          onVolumeChange={setMasterVolume}
          onPlayMusic={playMusicAndSyncSliders}
          onPlayEffect={playEffect}
          onOpenScene={openAmbienceScene}
          onStopScene={stopAmbienceScene}
          activeSceneKey={ambienceScene}
          activeSceneFit={(ambienceScene && ambienceFits[ambienceScene]) || 'contain'}
          onToggleSceneFit={toggleSceneFit}
          mood={mood}
          onMoodChange={setMood}
          onSelectMusic={selectMusic}
          onStopMusic={stopMusic}
        />
      )}
      {phase === 'combat' && (
        <InitiativeTracker
          participants={participants}
          setParticipants={setParticipants}
          round={round}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onNextTurn={nextTurn}
          onPrevTurn={prevTurn}
          onEndCombat={endCombat}
          onUpdateProfile={updatePlayerProfile}
          victory={victory}
          setVictory={setVictory}
          defeat={defeat}
          setDefeat={setDefeat}
          playingMusicKey={playingMusicKey}
          volume={masterVolume}
          onVolumeChange={setMasterVolume}
          onPlayMusic={playMusicAndSyncSliders}
          onPlayEffect={playEffect}
          mood={mood}
          onMoodChange={setMood}
          onSelectMusic={selectMusic}
          onStopMusic={stopMusic}
          onCompactScroll={sendCompactScroll}
        />
      )}
    </div>
  )
}
