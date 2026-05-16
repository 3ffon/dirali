import { useState, useEffect, useMemo } from 'react'
import { getImageBlobUrl, getImageUrl } from '../api'

function isTempImageId(id) {
  return typeof id === 'string' && (id.startsWith('temp_') || id.startsWith('img_temp_'))
}

export function useImageUrl(imageId) {
  const isTempId = isTempImageId(imageId)
  const serverUrl = useMemo(() => isTempId ? null : getImageUrl(imageId), [imageId, isTempId])
  const [blobUrl, setBlobUrl] = useState(null)

  useEffect(() => {
    if (!isTempId) return

    let cancelled = false
    let revoke = null
    getImageBlobUrl(imageId).then(url => {
      if (!cancelled && url) {
        setBlobUrl(url)
        revoke = url
      }
    })

    return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke) }
  }, [imageId, isTempId])

  return isTempId ? blobUrl : serverUrl
}
