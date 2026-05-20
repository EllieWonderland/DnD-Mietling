import { useState, useEffect, useRef } from 'react'
import SessionSetup from './components/SessionSetup.jsx'
import InitiativeTracker from './components/InitiativeTracker.jsx'
import AmbienceScene from './components/AmbienceScene.jsx'
import { MUSIC_TRACKS, EFFECT_TRACKS, VIDEO_SCENES } from './components/soundboardData.jsx'
import mietlingLogo from './mietling.png'

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
  const [effectTrigger, setEffectTrigger] = useState(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [playerProfiles, setPlayerProfiles] = useState(() => loadPlayerProfiles() || PLAYER_DEFAULTS)
  const [savedCombat, setSavedCombat] = useState(() => loadCombatState())
  const musicRef = useRef(null)
  const tvMusicRef = useRef(null)

  const wsRef = useRef(null)
  const pendingStateRef = useRef(null)
  const [displayState, setDisplayState] = useState(null)

  // WebSocket: load URL from config.json at runtime (not baked at build time)
  useEffect(() => {
    let closed = false

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
              if (msg.type === 'STATE') setDisplayState(msg.state)
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
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  // Controller: broadcast full state on every change
  useEffect(() => {
    if (APP_MODE !== 'controller') return
    const str = JSON.stringify({
      type: 'STATE',
      state: { phase, participants, round, activeIndex, victory, defeat, ambienceScene, playingMusicKey, masterVolume, effectTrigger },
    })
    pendingStateRef.current = str
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(str)
      pendingStateRef.current = null
    }
  }, [phase, participants, round, activeIndex, victory, defeat, ambienceScene, playingMusicKey, masterVolume, effectTrigger])

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

  // TV: start/stop music when playingMusicKey changes (or after audio unlock)
  useEffect(() => {
    if (APP_MODE !== 'display' || !audioUnlocked) return
    const key = displayState?.playingMusicKey
    const volume = displayState?.masterVolume ?? 0.72
    if (tvMusicRef.current) {
      tvMusicRef.current.pause()
      tvMusicRef.current.currentTime = 0
      tvMusicRef.current = null
    }
    if (!key) return
    const track = MUSIC_TRACKS.find(t => t.key === key)
    if (!track) return
    const audio = new Audio(track.url)
    audio.loop = true
    audio.volume = volume
    audio.play().catch(() => {})
    tvMusicRef.current = audio
  }, [displayState?.playingMusicKey, audioUnlocked])

  // TV: sync volume while music is playing
  useEffect(() => {
    if (APP_MODE !== 'display' || !audioUnlocked || !tvMusicRef.current) return
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

  function openAmbienceScene(scene) {
    if (!scene) return
    setAmbienceScene(scene.key)
    setPhase('ambience')
  }

  function backToSetupFromAmbience() {
    stopMusic()
    setAmbienceScene(null)
    setPhase('setup')
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
    const monsters = next.filter(p => p.type === 'monster')
    if (monsters.length > 0 && monsters.every(m => m.dead)) setVictory(true)
    const players = next.filter(p => p.type === 'player')
    if (players.length > 0 && players.every(p => p.hp <= 0)) setDefeat(true)
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
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '32px' }}>
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
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <img src={mietlingLogo} alt="DnD Mietling" style={{ maxWidth: '320px', width: '60vw', objectFit: 'contain' }} />
          <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>Verbindung wird hergestellt …</div>
        </div>
      )
    }

    const { phase: dp, participants: dPart, round: dRound, activeIndex: dIdx, ambienceScene: dSceneKey, victory: dVictory, defeat: dDefeat } = displayState
    const dScene = dSceneKey ? VIDEO_SCENES.find(s => s.key === dSceneKey) ?? null : null

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {(dp === 'setup' || !dp) && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={mietlingLogo} alt="DnD Mietling" style={{ maxWidth: '400px', width: '60vw', objectFit: 'contain' }} />
          </div>
        )}
        {dp === 'combat' && (
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
            displayOnly
          />
        )}
        {dp === 'ambience' && dScene && (
          <AmbienceScene
            scene={dScene}
            onPlayEffect={() => {}}
            onBack={() => {}}
            displayOnly
          />
        )}
      </div>
    )
  }

  // ── CONTROLLER MODE (Tablet) ───────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isStandalone && installPrompt && (
        <button
          onClick={handleInstall}
          style={{
            position: 'fixed', top: '16px', right: '16px', zIndex: 2000,
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
          onPlayMusic={playMusic}
          onPlayEffect={playEffect}
          onOpenScene={openAmbienceScene}
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
          onPlayMusic={playMusic}
          onPlayEffect={playEffect}
        />
      )}
      {phase === 'ambience' && (() => {
        const scene = VIDEO_SCENES.find(s => s.key === ambienceScene) ?? null
        return scene ? (
          <AmbienceScene
            scene={scene}
            onPlayEffect={playEffect}
            onBack={backToSetupFromAmbience}
          />
        ) : null
      })()}
    </div>
  )
}
