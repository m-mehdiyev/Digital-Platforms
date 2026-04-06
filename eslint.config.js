import { useState } from 'react'
import {
  LayoutDashboard, Layers, FileText, Upload,
  Send, Archive, Key, Settings, ChevronRight
} from 'lucide-react'
import Dashboard from './Dashboard'
import Platforms from './Platforms'
import ReportInput from './ReportInput'
import PublishReport from './PublishReport'
import ArchivePage from './ArchivePage'
import TokenManager from './TokenManager'

const IRIA_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Azerbaijan.svg/320px-Flag_of_Azerbaijan.svg.png'

export default function AdminLayout({ role, platformId, isSuperAdmin }) {
  const [page, setPage] = useState('dashboard')

  const superNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'platforms', label: 'Platformalar', icon: Layers },
    { id: 'report', label: 'Hesabat Daxil Et', icon: FileText },
    { id: 'publish', label: 'Hesabat Yayımla', icon: Send },
    { id: 'archive', label: 'Arxiv', icon: Archive },
    { id: 'tokens', label: 'Link İdarəetmə', icon: Key },
  ]

  const platformNav = [
    { id: 'report', label: 'Hesabat Daxil Et', icon: FileText },
  ]

  const navItems = isSuperAdmin ? superNav : platformNav

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard isSuperAdmin={isSuperAdmin} />
      case 'platforms': return <Platforms />
      case 'report': return <ReportInput platformId={platformId} isSuperAdmin={isSuperAdmin} />
      case 'publish': return <PublishReport />
      case 'archive': return <ArchivePage />
      case 'tokens': return <TokenManager />
      default: return <Dashboard isSuperAdmin={isSuperAdmin} />
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Ambient orbs */}
      <div className="orbs">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-logo">
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Rəqəmsal Platformalar
            </div>
            <div className="logo-sub">Admin Panel</div>
          </div>

          <div className="admin-nav-section">Naviqasiya</div>
          <nav className="admin-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`admin-nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <item.icon size={16} />
                {item.label}
                {page === item.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </nav>

          <div className={`admin-role-badge ${isSuperAdmin ? 'super' : 'platform'}`}>
            {isSuperAdmin ? '⚡ Super Admin' : '👤 Platform Admin'}
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
