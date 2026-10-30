const GUARD = '__dndBackGuard'

// One shared history entry protects the active combat and all its dialogs.
// Reusing it avoids accumulating entries when dialogs open and close. The
// registry decides which layer handles Back; dialogs take priority over combat.
export function createBackNavigation(browser) {
  const layers = []
  let scheduled = false
  let removing = false
  let armed = Boolean(browser.history.state?.[GUARD])

  function top() {
    return layers.reduce((best, layer) => !best || layer.priority >= best.priority ? layer : best, null)
  }

  function sync() {
    scheduled = false
    if (removing) return
    if (layers.length && !armed) {
      browser.history.pushState({ ...browser.history.state, [GUARD]: true }, '')
      armed = true
    } else if (!layers.length && armed) {
      // back() is asynchronous. A new dialog may mount before popstate arrives;
      // that event belongs to cleanup and must never close the new dialog.
      removing = true
      browser.history.back()
    }
  }

  function schedule() {
    if (scheduled) return
    scheduled = true
    // Coalesce React StrictMode's setup/cleanup/setup into a single entry.
    queueMicrotask(sync)
  }

  browser.addEventListener('popstate', event => {
    const wasArmed = armed
    armed = Boolean(event.state?.[GUARD])
    if (removing) removing = false
    else if (wasArmed && !armed) top()?.onBack()
    schedule()
  })

  return {
    register(onBack, priority = 1) {
      const layer = { onBack, priority }
      layers.push(layer)
      schedule()
      return {
        isTop: () => top() === layer,
        remove() {
          const index = layers.indexOf(layer)
          if (index !== -1) layers.splice(index, 1)
          schedule()
        },
      }
    },
  }
}
