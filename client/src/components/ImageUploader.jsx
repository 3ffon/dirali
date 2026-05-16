import { useRef } from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { getImageUrl, uploadImages, deleteImage } from '../api'
import { shareOrDownload, buildImageFilename } from '../utils'

function ImageUploader({ apartmentId, address, images, onUpdate }) {
  const fileRef = useRef()

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
        <PhotoProvider
          overlayRender={({ index }) => {
            const img = images[index]
            return (
              <div
                onClick={() => shareOrDownload(getImageUrl(img.id), buildImageFilename(address, img.id, img.original_name))}
                className="share-fab"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
              </div>
            )
          }}
        >
          <div className="image-grid">
            {images.map((img) => (
              <PhotoView key={img.id} src={getImageUrl(img.id)}>
                <div className="image-item">
                  <img src={getImageUrl(img.id)} alt={img.original_name} />
                  <button className="delete-img" onClick={(e) => { e.stopPropagation(); handleDelete(img.id) }}>×</button>
                </div>
              </PhotoView>
            ))}
          </div>
        </PhotoProvider>
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
