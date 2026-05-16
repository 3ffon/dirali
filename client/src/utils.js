export function buildImageFilename(address, imageId, originalName) {
  const ext = originalName?.match(/\.(\w+)$/)?.[1] || 'jpg'
  const streetAndNumber = (address || '').split(',')[0].trim().replace(/\s+/g, '-')
  const base = streetAndNumber || 'image'
  return `${base}-${imageId}.${ext}`
}

export async function shareOrDownload(url, filename) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const file = new File([blob], filename || 'image.jpg', { type: blob.type })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
    }
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Share failed:', err)
  }
}
