import { useState, useRef } from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { getImageUrl } from '../api'
import { useImageUrl } from '../hooks/useImageUrl'
import { shareOrDownload, buildImageFilename } from '../utils'

function isVideo(mimeType) {
  return mimeType?.startsWith('video/')
}

function isDocument(mimeType) {
  return mimeType && !mimeType.startsWith('image/') && !mimeType.startsWith('video/')
}

function getFileExtension(filename) {
  if (!filename) return '?'
  const ext = filename.split('.').pop().toUpperCase()
  return ext.length <= 5 ? ext : '?'
}

function getDocColor(mimeType) {
  if (mimeType?.includes('pdf')) return '#E53935'
  if (mimeType?.includes('word') || mimeType?.includes('document')) return '#1A73E8'
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '#0F9D58'
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return '#F4981E'
  return '#5F6368'
}

function DocIcon({ mimeType, size = 32 }) {
  const color = getDocColor(mimeType)
  if (mimeType?.includes('pdf')) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
      </svg>
    )
  }
  if (mimeType?.includes('word') || mimeType?.includes('document')) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-2h8v-1H8v1zm0-3h8v-1H8v1zm0-3h5v-1H8v1z"/>
      </svg>
    )
  }
  if (mimeType?.includes('sheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-7h3v2H8v-2zm5 0h3v2h-3v-2zm-5 4h3v2H8v-2zm5 0h3v2h-3v-2zm-5-8h3v2H8V9zm5 0h3v2h-3V9z"/>
      </svg>
    )
  }
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm3-7c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
    </svg>
  )
}

function ImageViewerItem({ image }) {
  const url = useImageUrl(image.id)
  if (!url) return <div className="image-item image-item--loading" />

  return (
    <PhotoView src={url}>
      <div className="image-item">
        <img src={url} alt={image.original_name} />
      </div>
    </PhotoView>
  )
}

function VideoViewerItem({ image, onPlay }) {
  const url = useImageUrl(image.id)
  if (!url) return <div className="image-item image-item--loading" />

  return (
    <div className="image-item" onClick={() => onPlay({ url, image })}>
      <video src={url} muted playsInline preload="metadata" />
      <div className="video-overlay">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}

function DocViewerItem({ image, index, onOpen }) {
  const ext = getFileExtension(image.original_name)

  return (
    <div className="image-item doc-tile" onClick={() => onOpen(index)}>
      <DocIcon mimeType={image.mime_type} size={28} />
      <span className="doc-tile-ext">{ext}</span>
    </div>
  )
}

function DocCarousel({ docs, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const touchStart = useRef(null)

  if (!docs || docs.length === 0) return null
  const image = docs[index]
  const url = getImageUrl(image.id)

  const prev = () => setIndex(i => (i > 0 ? i - 1 : docs.length - 1))
  const next = () => setIndex(i => (i < docs.length - 1 ? i + 1 : 0))

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (diff > 50) prev()
    else if (diff < -50) next()
    touchStart.current = null
  }

  return (
    <div className="video-modal" onClick={onClose}>
      <button className="video-modal-close" onClick={onClose}>×</button>
      <div className="doc-carousel" onClick={e => e.stopPropagation()} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="doc-carousel-counter">{index + 1}/{docs.length}</div>
        <DocIcon mimeType={image.mime_type} size={64} />
        <div className="doc-modal-name">{image.original_name || 'מסמך'}</div>
        <div className="doc-modal-actions">
          <button className="btn btn-primary" onClick={() => window.open(url, '_blank')}>
            פתח
          </button>
          <button className="btn btn-secondary" onClick={() => shareOrDownload(url, image.original_name || 'document')}>
            שתף
          </button>
        </div>
        {docs.length > 1 && (
          <div className="doc-carousel-nav">
            <button className="doc-nav-btn" onClick={next}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="doc-nav-btn" onClick={prev}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function VideoModal({ url, image, address, onClose }) {
  if (!url) return null
  return (
    <div className="video-modal" onClick={onClose}>
      <button className="video-modal-close" onClick={onClose}>×</button>
      <video src={url} controls autoPlay playsInline onClick={e => e.stopPropagation()} />
      <div
        onClick={(e) => { e.stopPropagation(); shareOrDownload(url, buildImageFilename(address, image.id, image.original_name)) }}
        className="share-fab"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
        </svg>
      </div>
    </div>
  )
}

function ImageViewer({ images, address, thumbnailStrip }) {
  const [activeVideo, setActiveVideo] = useState(null)
  const [docStartIndex, setDocStartIndex] = useState(null)

  if (!images || images.length === 0) return null

  const imageItems = images.filter(img => !isVideo(img.mime_type) && !isDocument(img.mime_type))
  const videoItems = images.filter(img => isVideo(img.mime_type))
  const docItems = images.filter(img => isDocument(img.mime_type))
  const className = thumbnailStrip ? 'image-strip' : 'image-grid'

  return (
    <>
      {imageItems.length > 0 && (
        <PhotoProvider
          overlayRender={({ index }) => {
            const img = imageItems[index]
            const url = getImageUrl(img.id)
            if (!url) return null
            return (
              <div
                onClick={() => {
                  shareOrDownload(url, buildImageFilename(address, img.id, img.original_name))
                }}
                className="share-fab"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
              </div>
            )
          }}
        >
          <div className={className}>
            {imageItems.map((img) => (
              <ImageViewerItem key={img.id} image={img} />
            ))}
          </div>
        </PhotoProvider>
      )}

      {videoItems.length > 0 && (
        <div className={className}>
          {videoItems.map((img) => (
            <VideoViewerItem key={img.id} image={img} onPlay={setActiveVideo} />
          ))}
        </div>
      )}

      {docItems.length > 0 && (
        <div className={className}>
          {docItems.map((img, i) => (
            <DocViewerItem key={img.id} image={img} index={i} onOpen={setDocStartIndex} />
          ))}
        </div>
      )}

      <VideoModal url={activeVideo?.url} image={activeVideo?.image} address={address} onClose={() => setActiveVideo(null)} />
      {docStartIndex !== null && (
        <DocCarousel docs={docItems} startIndex={docStartIndex} onClose={() => setDocStartIndex(null)} />
      )}
    </>
  )
}

export default ImageViewer
