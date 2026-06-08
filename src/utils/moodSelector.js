/**
 * Berechnet die euklidische Distanz zwischen den Reglerwerten und dem Stimmungsprofil
 * jedes Songs und gibt den Track mit dem geringsten Abstand zurück.
 * danger, energy, mysticism, tone müssen Werte zwischen 0.0 und 1.0 sein.
 */
export function findBestTrack(danger, energy, mysticism, tone, tracks) {
  let bestTrack = null
  let minDistance = Infinity

  for (const track of tracks) {
    if (!track.mood) continue // Event-Sounds ohne mood werden übersprungen

    const d = Math.sqrt(
      (danger - track.mood.danger) ** 2 +
      (energy - track.mood.energy) ** 2 +
      (mysticism - track.mood.mysticism) ** 2 +
      (tone - track.mood.tone) ** 2
    )

    if (d < minDistance) {
      minDistance = d
      bestTrack = track
    }
  }

  return bestTrack
}
