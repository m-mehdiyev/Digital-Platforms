import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Archive, Eye, Calendar } from 'lucide-react'

export default function ArchivePage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)

  useEffect(() => { fetchReports() }, [])

  async function fetchReports() {
    setLoading(true)
    const { data } = await supabase
      .from('published_reports')
      .select('*')
      .order('published_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Arxiv</div>
          <div className="admin-page-sub">{reports.length} yayımlanmış hesabat</div>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Arxiv boşdur</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Hələ heç bir hesabat yayımlanmayıb</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Archive size={20} color="#6366f1" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{r.period_label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                  <Calendar size={11} />
                  {new Date(r.published_at).toLocaleString('az')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-green">{r.report_data?.platforms?.length || 0} platforma</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewing(r)}>
                  <Eye size={12} /> Bax
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viewing modal */}
      {viewing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <span className="modal-title">{viewing.period_label}</span>
              <button className="modal-close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <table className="data-table">
                <thead><tr><th>Platforma</th><th>Görülən</th><th>Planlar</th><th>KPI</th></tr></thead>
                <tbody>
                  {(viewing.report_data?.platforms || []).map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="badge badge-green">{p.done?.length || 0}</span></td>
                      <td><span className="badge badge-blue">{(p.plan_month?.length || 0) + (p.plan_quarter?.length || 0) + (p.plan_year?.length || 0)}</span></td>
                      <td><span className="badge badge-blue">{p.stats?.length || 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
