import { useRef } from 'react'
import { getImageUrl, uploadImages, deleteImage } from '../api'

function ImageUploader({ apartmentId, images, onUpdate }) {
  const fileRef = useRef()
  const cameraRef = useRef()

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return
    const newImages = await uploadImages(apartmentId, files)
    onUpdate([...images, ...newImages])
  }

  const handleDelete = async (imageId) => {
    await deleteImage(imageId)
    onUpdate(images.filter(img => img.id !== imageId))
  }

  return (
    <div className="image-uploader">
      <div className="category-header">📷 תמונות</div>

      {images.length > 0 && (
        <div className="image-grid">
          {images.map(img => (
            <div key={img.id} className="image-item">
              <img src={getImageUrl(img.id)} alt={img.original_name} />
              <button className="delete-img" onClick={() => handleDelete(img.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="upload-buttons">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => cameraRef.current.click()}
        >📸 צלם</button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileRef.current.click()}
        >🖼️ גלריה</button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleUpload(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleUpload(e.target.files)}
      />
    </div>
  )
}

export default ImageUploader
