import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ApartmentFormPage from './pages/ApartmentFormPage'
import ApartmentDetailPage from './pages/ApartmentDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/apartments/new" element={<ApartmentFormPage />} />
      <Route path="/apartments/:id" element={<ApartmentDetailPage />} />
      <Route path="/apartments/:id/edit" element={<ApartmentFormPage />} />
    </Routes>
  )
}

export default App
