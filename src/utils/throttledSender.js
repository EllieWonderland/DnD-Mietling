// Coalesce frequent updates without postponing the final send indefinitely.
// send() reads the latest state when it runs, never a queued slider value.
export function createThrottledSender(send, intervalMs = 100) {
  let lastSentAt = null
  let timer = null

  function cancel() {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function flush() {
    cancel()
    lastSentAt = Date.now()
    send()
  }

  function schedule() {
    const remaining = lastSentAt === null ? 0 : intervalMs - (Date.now() - lastSentAt)
    if (remaining <= 0) {
      flush()
    } else if (timer === null) {
      timer = setTimeout(flush, remaining)
    }
  }

  return { schedule, flush, cancel }
}
