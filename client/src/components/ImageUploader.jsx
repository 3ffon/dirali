import { useRef, useState } from 'react'
import { getImageUrl, uploadImages, deleteImage } from '../api'

function ImageUploader({ apartmentId, images, onUpdate }) {
  const fileRef = useRef()
  const [viewIndex, setViewIndex] = useState(null)

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return
    const newImages = await uploadImages(apartmentId, files)
    onUpdate([...images, ...newImages])
  }

  const handleDelete = async (imageId) => {
    await deleteImage(imageId)
    onUpdate(images.filter(img => img.id !== imageId))
  }

  const close = () => setViewIndex(null)
  const prev = (e) => { e.stopPropagation(); setViewIndex((viewIndex - 1 + images.length) % images.length) }
  const next = (e) => { e.stopPropagation(); setViewIndex((viewIndex + 1) % images.length) }

  return (
    <div className="image-uploader">
      <div className="category-header">📷 תמונות</div>

      {images.length > 0 && (
        <div className="image-grid">
          {images.map((img, i) => (
            <div key={img.id} className="image-item" onClick={() => setViewIndex(i)}>
              <img src={getImageUrl(img.id)} alt={img.original_name} />
              <button className="delete-img" onClick={(e) => { e.stopPropagation(); handleDelete(img.id) }}>×</button>
            </div>
          ))}
        </div>
      )}

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
          <div className="image-overlay-counter">{viewIndex + 1} / {images.length}</div>
        </div>
      )}

      <div className="upload-buttons">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileRef.current.click()}
        >🖼️ גלריה</button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => { handleUpload(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}

export default ImageUploader
