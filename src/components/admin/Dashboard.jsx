import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react'

export default function Dashboard({ isSuperAdmin }) {
  const [stats, setStats] = useState({ total: 0, completed: 0, partial: 0, empty: 0 })
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastPublished, setLastPublished] = useState(null)
  const [period, setPeriod] = useState('')
  const [periods, setPeriods] = useState([])

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (period) fetchPlatformStats(period) }, [period])

  async function fetchData() {
    setLoading(true)
    try {
      // Get all unique periods
      const { data: reps } = await supabase
        .from('report_periods')
        .select('period_label')
        .order('period_label', { ascending: false })
      const unique = [...new Set((reps || []).map(r => r.period_label))]
      setPeriods(unique)
      if (unique[0]) setPeriod(unique[0])

      const { data: published } = await supabase
        .from('published_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
      if (published?.[0]) setLastPublished(published[0])

      // If no period yet, just load platforms
      const { data: plats } = await supabase.from('platforms').select('*').order('order_index')
      if (!unique[0]) {
        const enriched = (plats || []).map(p => ({ ...p, doneCount: 0, planCount: 0, kpiCount: 0, status: 'empty' }))
        setPlatforms(enriched)
        setStats({ total: enriched.length, completed: 0, partial: 0, empty: enriched.length })
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function fetchPlatformStats(selectedPeriod) {
    try {
      const { data: plats } = await supabase.from('platforms').select('*').order('order_index')

      // For each platform get real counts from report_periods
      const enriched = await Promise.all((plats || []).map(async p => {
        const { data: rep } = await supabase
          .from('report_periods')
          .select('id, completed_items(count), planned_items(count), statistics(count)')
          .eq('platform_id', p.id)
          .eq('period_label', selectedPeriod)
          .single()

        const doneCount = rep?.completed_items?.[0]?.count || 0
        const planCount = rep?.planned_items?.[0]?.count || 0
        const kpiCount = rep?.statistics?.[0]?.count || 0
        const total = doneCount + planCount + kpiCount

        let status = 'empty'
        if (total > 0 && doneCount > 0 && planCount > 0) status = 'completed'
        else if (total > 0) status = 'partial'

        return { ...p, doneCount, planCount, kpiCount, status }
      }))

      setPlatforms(enriched)
      const completed = enriched.filter(p => p.status === 'completed').length
      const partial = enriched.filter(p => p.status === 'partial').length
      setStats({ total: enriched.length, completed, partial, empty: enriched.length - completed - partial })
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Dashboard</div>
          <div className="admin-page-sub">Hesabat dövrünün ümumi vəziyyəti</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {periods.length > 0 && (
            <select className="form-select" value={period} onChange={e => setPeriod(e.target.value)}
              style={{ fontSize: 12, padding: '6px 12px', minWidth: 160 }}>
              {periods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          {lastPublished && (
            <div className="badge badge-green">
              <Eye size={11} /> Son yayım: {new Date(lastPublished.created_at).toLocaleDateString('az')}
            </div>
          )}
        </div>
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
        <div className="card-title">Platform Vəziyyəti — {period || 'Dövr seçilməyib'}</div>
        {platforms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>
            Hələ məlumat daxil edilməyib
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Platforma</th>
                <th>Status</th>
                <th>Görülən İşlər</th>
                <th>Planlar</th>
                <th>KPI / Statistika</th>
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
                  <td>
                    <span className="badge badge-green" style={{ opacity: p.doneCount > 0 ? 1 : 0.4 }}>
                      {p.doneCount} iş
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-blue" style={{ opacity: p.planCount > 0 ? 1 : 0.4 }}>
                      {p.planCount} plan
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-blue" style={{ opacity: p.kpiCount > 0 ? 1 : 0.4 }}>
                      {p.kpiCount} KPI
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
