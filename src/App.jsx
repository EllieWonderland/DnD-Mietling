import { useState, useEffect, useRef } from 'react'
import SessionSetup from './components/SessionSetup.jsx'
import InitiativeTracker from './components/InitiativeTracker.jsx'
import AmbienceScene from './components/AmbienceScene.jsx'
import ScreenKeepAlive from './components/ScreenKeepAlive.jsx'
import { MUSIC_TRACKS, EFFECT_TRACKS, VIDEO_SCENES } from './components/soundboardData.jsx'
import mietlingLogo from './assets/images/mietling.png'

const PLAYER_DEFAULTS = [
  { id: 'athania',     name: 'Athania',     maxHp: 30 },
  { id: 'delat',      name: 'Delat',       maxHp: 28 },
  { id: 'tharion',    name: 'Tharion',     maxHp: 32 },
  { id: 'sora',       name: 'Sora',        maxHp: 26 },
  { id: 'vhahlhohkh', name: 'Vhahlhohkh', maxHp: 35 },
]

function loadPlayerProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem('dnd-player-profiles') || 'null')
    if (Array.isArray(saved) && saved.length > 0) return saved
    return null
  } catch { return null }
}

function loadPlayerHP() {
  try { return JSON.parse(localStorage.getItem('dnd-player-hp') || '{}') } catch { return {} }
}

function savePlayerHP(participants) {
  const hp = {}
  participants.filter(p => p.type === 'player').forEach(p => { hp[p.id] = p.hp })
  localStorage.setItem('dnd-player-hp', JSON.stringify(hp))
}

function saveCombatState(state) {
  try { localStorage.setItem('dnd-combat-state', JSON.stringify(state)) } catch {}
}
function loadCombatState() {
  try { return JSON.parse(localStorage.getItem('dnd-combat-state') || 'null') } catch { return null }
}
function clearCombatState() {
  localStorage.removeItem('dnd-combat-state')
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

function makePlayer(pid, savedHP, profiles) {
  const profile = profiles.find(p => p.id === pid) ?? { id: pid, name: pid, maxHp: 20 }
  const hp = savedHP[pid] ?? profile.maxHp
  return {
    id: pid, name: profile.name, type: 'player',
    initiative: 0, hp, maxHp: profile.maxHp,
    reaction: false,
    conditions: [], concentration: false,
    blessed: false, hidden: false, flying: false, exhaustion: 0,
    deathSaves: { successes: 0, failures: 0 },
  }
}

const APP_MODE = new URLSearchParams(window.location.search).get('mode') === 'display'
  ? 'display'
  : 'controller'

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
  const [ambienceFits, setAmbienceFits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dnd-ambience-fits')) || {} } catch { return {} }
  })
  const [effectTrigger, setEffectTrigger] = useState(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [playerProfiles, setPlayerProfiles] = useState(() => loadPlayerProfiles() || PLAYER_DEFAULTS)
  const [savedCombat, setSavedCombat] = useState(() => loadCombatState())
  const [mood, setMood] = useState({ danger: 0.2, energy: 0.4, mysticism: 0.3, tone: 0.6 })
  const tvMusicRef = useRef(null)
  const fadeRef = useRef(null)

  const wsRef = useRef(null)
  const bcRef = useRef(null)
  const pendingStateRef = useRef(null)
  const [displayState, setDisplayState] = useState(null)
  const [displayCompactScroll, setDisplayCompactScroll] = useState(null)

  // Clear display compact scroll when turn changes in display mode
  useEffect(() => {
    if (APP_MODE === 'display') {
      setDisplayCompactScroll(null)
    }
  }, [displayState?.activeIndex, displayState?.round])

  // WebSocket & BroadcastChannel: sync state & scroll events
  useEffect(() => {
    let closed = false
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dnd-mietling') : null
    bcRef.current = bc

    if (bc) {
      bc.onmessage = event => {
        if (APP_MODE === 'display') {
          const msg = event.data
          if (msg?.type === 'STATE') {
            setDisplayState(msg.state)
          } else if (msg?.type === 'COMPACT_SCROLL') {
            setDisplayCompactScroll(msg.scroll)
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

      function connect() {
        if (closed) return
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (pendingStateRef.current) {
            ws.send(pendingStateRef.current)
            pendingStateRef.current = null
          }
        }

        ws.onmessage = event => {
          if (APP_MODE === 'display') {
            try {
              const msg = JSON.parse(event.data)
              if (msg.type === 'STATE') {
                setDisplayState(msg.state)
              } else if (msg.type === 'COMPACT_SCROLL') {
                setDisplayCompactScroll(msg.scroll)
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

  // Controller: broadcast full state on every change
  useEffect(() => {
    if (APP_MODE !== 'controller') return
    const payload = {
      type: 'STATE',
      state: { phase, participants, round, activeIndex, victory, defeat, ambienceScene, ambienceFits, playingMusicKey, masterVolume, effectTrigger },
    }
    const str = JSON.stringify(payload)
    pendingStateRef.current = str
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(str)
      pendingStateRef.current = null
    }
    if (bcRef.current) {
      bcRef.current.postMessage(payload)
    }
  }, [phase, participants, round, activeIndex, victory, defeat, ambienceScene, ambienceFits, playingMusicKey, masterVolume, effectTrigger])

  // Controller: broadcast right panel scroll position
  function sendCompactScroll(scrollData) {
    if (APP_MODE !== 'controller') return
    const scrollObj = {
      scrollRatio: scrollData.scrollRatio,
      scrollTop: scrollData.scrollTop,
      timestamp: scrollData.timestamp || Date.now(),
    }
    const statePayload = {
      type: 'STATE',
      state: {
        ...latestStateRef.current,
        compactScroll: scrollObj,
      },
    }
    const scrollPayload = {
      type: 'COMPACT_SCROLL',
      scroll: scrollObj,
    }
    const stateStr = JSON.stringify(statePayload)
    const scrollStr = JSON.stringify(scrollPayload)
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(stateStr)
      ws.send(scrollStr)
    }
    if (bcRef.current) {
      bcRef.current.postMessage(statePayload)
      bcRef.current.postMessage(scrollPayload)
    }
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
      fadeAudio(audio, fadeRef, volume, FADE_MS)
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
    if (APP_MODE !== 'display' || !audioUnlocked || !tvMusicRef.current) return
    // If a fade is currently running, do not interfere - it ends within ~600 ms.
    if (fadeRef.current) return
    tvMusicRef.current.volume = displayState?.masterVolume ?? 0.72
  }, [displayState?.masterVolume, audioUnlocked])

  // TV: one-shot effect sounds
  useEffect(() => {
    if (APP_MODE !== 'display' || !audioUnlocked || !displayState?.effectTrigger) return
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
      try { localStorage.setItem('dnd-ambience-fits', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function updatePlayerProfile(id, name, maxHp) {
    setPlayerProfiles(prev => {
      const next = prev.map(p => p.id === id ? { ...p, name, maxHp } : p)
      localStorage.setItem('dnd-player-profiles', JSON.stringify(next))
      return next
    })
  }

  function startCombat(selectedIds, initiatives) {
    clearCombatState()
    const savedHP = loadPlayerHP()
    const players = selectedIds.map(pid => ({
      ...makePlayer(pid, savedHP, playerProfiles),
      initiative: Math.max(1, parseInt(initiatives[pid]) || 1),
    }))
    const sorted = [...players].sort((a, b) => b.initiative - a.initiative)
    setParticipants(sorted)
    setRound(1)
    setActiveIndex(0)
    setVictory(false)
    setDefeat(false)
    setPhase('combat')
  }

  function updateParticipants(next) {
    setParticipants(next)
    savePlayerHP(next)
    if (victory || defeat) return
    const monsters = next.filter(p => p.type === 'monster')
    const players = next.filter(p => p.type === 'player')
    const allMonstersDead = monsters.length > 0 && monsters.every(m => m.dead)
    // Player counts as down at 0 HP OR active death save (dying).
    const allPlayersDown = players.length > 0 && players.every(p => p.hp <= 0 || p.dying)
    if (allMonstersDead) setVictory(true)
    else if (allPlayersDown && monsters.some(m => !m.dead)) setDefeat(true)
  }

  function nextTurn() {
    setRound(r => r + 1)
    const next = participants.map(p => ({ ...p, reaction: false }))
    updateParticipants(next)
  }
  function prevTurn() { setRound(r => Math.max(1, r - 1)) }

  function endCombat() {
    savePlayerHP(participants)
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
        {/* The combat screen always takes precedence. An active scene pauses
            during combat and resumes afterwards (if not stopped). */}
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
          setParticipants={updateParticipants}
          round={round}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onNextTurn={nextTurn}
          onPrevTurn={prevTurn}
          onEndCombat={endCombat}
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
