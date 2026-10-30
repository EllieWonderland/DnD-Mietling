import { useLayoutEffect, useRef } from 'react'
import { createBackNavigation } from '../utils/backNavigation.js'

let navigation

export default function useBackNavigation(onBack, enabled = true, priority = 1) {
  const callback = useRef(onBack)
  const layer = useRef(null)
  useLayoutEffect(() => { callback.current = onBack })
  useLayoutEffect(() => {
    if (!enabled) return
    navigation ??= createBackNavigation(window)
    const registration = navigation.register(() => callback.current?.(), priority)
    layer.current = registration
    return () => {
      layer.current = null
      registration.remove()
    }
  }, [enabled, priority])

  return () => layer.current?.isTop() ?? false
}
