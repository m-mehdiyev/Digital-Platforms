import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Archive, Eye, Calendar, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ArchivePage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)

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

  async function deleteReport(id) {
    setDeleting(id)
    try {
      const { error } = await supabase.from('published_reports').delete().eq('id', id)
      if (error) throw error
      setReports(prev => prev.filter(r => r.id !== id))
      toast.success('Hesabat silindi')
    } catch (e) {
      toast.error('Xəta: ' + e.message)
    }
    setDeleting(null)
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
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Archive size={20} color="#6366f1" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{r.period_label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                  <Calendar size={11} />
                  {new Date(r.published_at).toLocaleString('az')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-green">{r.report_data?.platforms?.length || 0} platforma</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewing(r)}>
                  <Eye size={12} /> Bax
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleting(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {viewing && typeof viewing === 'object' && !viewing.confirmDelete && (
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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.logo_url && <img src={p.logo_url} alt="" style={{ height: 20, maxWidth: 60, objectFit: 'contain' }} />}
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      <td><span className="badge badge-green">{p.done?.length || 0}</span></td>
                      <td><span className="badge badge-blue">{(p.planned_items?.length || 0)}</span></td>
                      <td><span className="badge badge-blue">{p.stats?.length || 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleting && typeof deleting === 'object' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleting(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#dc2626" /> Hesabatı Sil
              </span>
              <button className="modal-close" onClick={() => setDeleting(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                <strong>"{deleting.period_label}"</strong> hesabatını silmək istədiyinizə əminsiniz?
                Bu əməliyyat geri qaytarıla bilməz.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleting(null)}>Ləğv Et</button>
              <button
                className="btn btn-danger"
                onClick={async () => { await deleteReport(deleting.id); setDeleting(null) }}
              >
                <Trash2 size={14} /> Bəli, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
