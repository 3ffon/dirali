import { useState, useEffect } from 'react'
import { isOnline, onNetworkChange, onSyncChange, isSyncing, getPendingCount } from '../api'

export function useSyncStatus() {
  const [online, setOnline] = useState(isOnline())
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(isSyncing())

  useEffect(() => {
    const unsubNetwork = onNetworkChange(setOnline)
    const unsubSync = onSyncChange(() => {
      setSyncing(isSyncing())
      getPendingCount().then(setPendingCount)
    })
    getPendingCount().then(setPendingCount)
    return () => { unsubNetwork(); unsubSync() }
  }, [])

  return { isOnline: online, pendingCount, isSyncing: syncing }
}
