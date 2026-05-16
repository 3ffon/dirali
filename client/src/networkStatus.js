let _online = navigator.onLine
const listeners = new Set()

window.addEventListener('online', () => { _online = true; notify() })
window.addEventListener('offline', () => { _online = false; notify() })

function notify() { listeners.forEach(fn => fn(_online)) }

export function isOnline() { return _online }

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
