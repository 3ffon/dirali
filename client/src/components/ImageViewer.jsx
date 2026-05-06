import { useState } from 'react'
import { getImageUrl } from '../api'

function ImageViewer({ images, thumbnailStrip }) {
  const [viewIndex, setViewIndex] = useState(null)

  if (!images || images.length === 0) return null

  const close = () => setViewIndex(null)

  const prev = (e) => {
    e.stopPropagation()
    setViewIndex((viewIndex - 1 + images.length) % images.length)
  }

  const next = (e) => {
    e.stopPropagation()
    setViewIndex((viewIndex + 1) % images.length)
  }

  return (
    <>
      <div className={thumbnailStrip ? 'image-strip' : 'image-grid'}>
        {images.map((img, i) => (
          <div key={img.id} className="image-item" onClick={() => setViewIndex(i)}>
            <img src={getImageUrl(img.id)} alt={img.original_name} />
          </div>
        ))}
      </div>

      {viewIndex !== null && (
        <div className="image-overlay" onClick={close}>
          <button className="image-overlay-close" onClick={close}>×</button>
          {images.length > 1 && (
            <>
              <button className="image-overlay-nav image-overlay-prev" onClick={prev}>‹</button>
              <button className="image-overlay-nav image-overlay-next" onClick={next}>›</button>
            </>
          )}
          <img
            src={getImageUrl(images[viewIndex].id)}
            alt={images[viewIndex].original_name}
            className="image-overlay-img"
            onClick={e => e.stopPropagation()}
          />
          <div className="image-overlay-counter">
            {viewIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}

export default ImageViewer
