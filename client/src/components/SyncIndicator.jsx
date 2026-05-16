import { useSyncStatus } from '../hooks/useSyncStatus'

function SyncIndicator() {
  const { isOnline, pendingCount, isSyncing } = useSyncStatus()

  if (isOnline && !isSyncing && pendingCount === 0) return null

  let dotClass = 'sync-dot'
  let label = ''

  if (isSyncing) {
    dotClass += ' sync-dot--syncing'
    label = 'מסנכרן...'
  } else if (!isOnline && pendingCount > 0) {
    dotClass += ' sync-dot--offline'
    label = `אופליין (${pendingCount})`
  } else if (!isOnline) {
    dotClass += ' sync-dot--offline'
    label = 'אופליין'
  } else if (pendingCount > 0) {
    dotClass += ' sync-dot--pending'
    label = `ממתין לסנכרון (${pendingCount})`
  }

  return (
    <div className="sync-indicator">
      <span className={dotClass}></span>
      <span>{label}</span>
    </div>
  )
}

export default SyncIndicator
