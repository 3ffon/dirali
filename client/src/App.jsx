import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import TopBar from './components/TopBar'
import HomePage from './pages/HomePage'
import ApartmentFormPage from './pages/ApartmentFormPage'
import ApartmentDetailPage from './pages/ApartmentDetailPage'
import BrokersPage from './pages/BrokersPage'
import BrokerMessagesPage from './pages/BrokerMessagesPage'
import UserProfilePage from './pages/UserProfilePage'
import MapPage from './pages/MapPage'
import { fetchBrokers } from './api'

function App() {
  useEffect(() => {
    fetchBrokers().catch(() => {})
  }, [])
  return (
    <div className="app-layout">
      <TopBar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apartments/new" element={<ApartmentFormPage />} />
          <Route path="/apartments/:id" element={<ApartmentDetailPage />} />
          <Route path="/apartments/:id/edit" element={<ApartmentFormPage />} />
          <Route path="/brokers" element={<BrokersPage />} />
          <Route path="/brokers/:id/messages" element={<BrokerMessagesPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
