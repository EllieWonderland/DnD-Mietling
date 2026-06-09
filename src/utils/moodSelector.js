/**
 * Calculates the Euclidean distance between slider values and the mood profile
 * of each song, returning the track with the smallest distance.
 * danger, energy, mysticism, tone must be values between 0.0 and 1.0.
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
