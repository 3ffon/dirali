import { useState } from 'react'
import { Link } from 'react-router-dom'
import SyncIndicator from './SyncIndicator'

function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="global-topbar">
      <Link to="/" className="topbar-brand">
        <img src="/icons/icon-nobg.svg" alt="" className="topbar-icon" />
        <span className="topbar-title">דירה-לי</span>
      </Link>
      <SyncIndicator />
      <nav className="nav-menu">
        <Link to="/" className="nav-link">דירות</Link>
        <Link to="/apartments/new" className="nav-link">דירה חדשה</Link>
        <Link to="/brokers" className="nav-link">מתווכים</Link>
        <Link to="/map" className="nav-link">מפה</Link>
        <Link to="/profile" className="nav-link">פרופיל</Link>
      </nav>
      <div className="nav-burger">
        <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
        {menuOpen && (
          <div className="dropdown-menu">
            <Link to="/" className="dropdown-item" onClick={() => setMenuOpen(false)}>דירות</Link>
            <Link to="/apartments/new" className="dropdown-item" onClick={() => setMenuOpen(false)}>דירה חדשה</Link>
            <Link to="/brokers" className="dropdown-item" onClick={() => setMenuOpen(false)}>מתווכים</Link>
            <Link to="/map" className="dropdown-item" onClick={() => setMenuOpen(false)}>מפה</Link>
            <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>פרופיל</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopBar
