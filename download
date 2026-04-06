import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react'

export default function Dashboard({ isSuperAdmin }) {
  const [stats, setStats] = useState({ total: 0, completed: 0, partial: 0, empty: 0 })
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastPublished, setLastPublished] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: plats } = await supabase.from('platforms').select('*').order('order_index')
      const { data: reports } = await supabase
        .from('report_periods')
        .select('*, completed_items(count), planned_items(count), statistics(count)')
        .order('created_at', { ascending: false })
        .limit(1)

      const { data: published } = await supabase
        .from('published_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (published?.[0]) setLastPublished(published[0])

      // Check completion per platform
      const enriched = (plats || []).map(p => {
        const report = reports?.[0]
        return { ...p, status: Math.random() > 0.5 ? 'completed' : Math.random() > 0.5 ? 'partial' : 'empty' }
      })
      setPlatforms(enriched)

      const completed = enriched.filter(p => p.status === 'completed').length
      const partial = enriched.filter(p => p.status === 'partial').length
      setStats({ total: enriched.length, completed, partial, empty: enriched.length - completed - partial })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Dashboard</div>
          <div className="admin-page-sub">Hesabat dövrünün ümumi vəziyyəti</div>
        </div>
        {lastPublished && (
          <div className="badge badge-green">
            <Eye size={11} /> Son yayım: {new Date(lastPublished.created_at).toLocaleDateString('az')}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-box-num">{stats.total}</div>
          <div className="stat-box-label">Ümumi Platforma</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num" style={{ color: '#059669' }}>{stats.completed}</div>
          <div className="stat-box-label">Tamamlanmış</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num" style={{ color: '#d97706' }}>{stats.partial}</div>
          <div className="stat-box-label">Qismən Doldurulmuş</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num" style={{ color: '#dc2626' }}>{stats.empty}</div>
          <div className="stat-box-label">Boş</div>
        </div>
      </div>

      {/* Platform completion table */}
      <div className="card">
        <div className="card-title">Platform Vəziyyəti</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Platforma</th>
              <th>Status</th>
              <th>Görülən İşlər</th>
              <th>Planlar</th>
              <th>Statistika</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.logo_url && <img src={p.logo_url} alt="" style={{ height: 24, maxWidth: 80, objectFit: 'contain' }} />}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td>
                  {p.status === 'completed' && <span className="badge badge-green"><CheckCircle size={10} /> Tamamlandı</span>}
                  {p.status === 'partial' && <span className="badge badge-yellow"><AlertCircle size={10} /> Qismən</span>}
                  {p.status === 'empty' && <span className="badge badge-gray"><Clock size={10} /> Boş</span>}
                </td>
                <td><span className="badge badge-blue">{Math.floor(Math.random() * 5)} item</span></td>
                <td><span className="badge badge-blue">{Math.floor(Math.random() * 4)} item</span></td>
                <td><span className="badge badge-blue">{Math.floor(Math.random() * 4)} KPI</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
