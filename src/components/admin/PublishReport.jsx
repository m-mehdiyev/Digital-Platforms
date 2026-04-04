import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PublishReport() {
  const [period, setPeriod] = useState('')
  const [periods, setPeriods] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [preview, setPreview] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: plats } = await supabase.from('platforms').select('*').order('order_index')
    const { data: reps } = await supabase.from('report_periods').select('period_label').order('period_label')
    setPlatforms(plats || [])
    const uniquePeriods = [...new Set((reps || []).map(r => r.period_label))]
    setPeriods(uniquePeriods)
    if (uniquePeriods[0]) setPeriod(uniquePeriods[0])
    setLoading(false)
  }

  async function generatePreview() {
    if (!period) return toast.error('Dövrü seçin')
    setPublishing(true)
    try {
      const data = await gatherReportData(period, platforms)
      setPreview(data)
    } catch (e) {
      toast.error('Məlumatlar yüklənərkən xəta')
    }
    setPublishing(false)
  }

  async function publish() {
    if (!preview) return toast.error('Əvvəlcə önizləmə yaradın')
    setPublishing(true)
    try {
      await supabase.from('published_reports').insert({
        period_label: period,
        report_data: preview,
        published_at: new Date().toISOString()
      })
      toast.success('Hesabat uğurla yayımlandı! 🎉')
      setPreview(null)
    } catch (e) {
      toast.error('Yayımlanarkən xəta')
    }
    setPublishing(false)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Yayımla</div>
          <div className="admin-page-sub">Dövr seçin və hesabatı ictimaiyyətə açın</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
        <div className="card-title">Dövr Seçin</div>
        <div className="form-group">
          <select className="form-select" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="">Dövrü seçin...</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={generatePreview} disabled={publishing}>
            <Eye size={15} /> Önizləmə
          </button>
          {preview && (
            <button className="btn btn-success" onClick={publish} disabled={publishing}>
              <Send size={15} /> {publishing ? 'Yayımlanır...' : 'Yayımla'}
            </button>
          )}
        </div>
      </div>

      {preview && (
        <div className="card">
          <div className="card-title">Önizləmə — {period}</div>
          <table className="data-table">
            <thead>
              <tr><th>Platforma</th><th>Görülən İşlər</th><th>Planlar</th><th>KPI</th><th>Screenshotlar</th></tr>
            </thead>
            <tbody>
              {preview.platforms.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td><span className="badge badge-green">{p.done?.length || 0}</span></td>
                  <td><span className="badge badge-blue">{(p.plan_month?.length || 0) + (p.plan_quarter?.length || 0) + (p.plan_year?.length || 0)}</span></td>
                  <td><span className="badge badge-blue">{p.stats?.length || 0}</span></td>
                  <td><span className="badge badge-gray">{p.screenshots?.length || 0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

async function gatherReportData(period, platforms) {
  const result = { period, generatedAt: new Date().toISOString(), platforms: [] }

  for (const plat of platforms) {
    const { data: rep } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', plat.id)
      .eq('period_label', period)
      .single()

    result.platforms.push({
      id: plat.id,
      name: plat.name,
      tagline: plat.tagline,
      color: plat.color,
      logo_url: plat.logo_url,
      done: rep?.completed_items?.sort((a, b) => a.order_index - b.order_index).map(i => i.text) || [],
      plan_month: rep?.planned_items?.filter(i => i.plan_type === 'month').sort((a, b) => a.order_index - b.order_index).map(i => i.text) || [],
      plan_quarter: rep?.planned_items?.filter(i => i.plan_type === 'quarter').sort((a, b) => a.order_index - b.order_index).map(i => i.text) || [],
      plan_year: rep?.planned_items?.filter(i => i.plan_type === 'year').sort((a, b) => a.order_index - b.order_index).map(i => i.text) || [],
      stats: rep?.statistics?.sort((a, b) => a.order_index - b.order_index).map(s => ({ v: s.value, l: s.label, u: s.unit })) || [],
      screenshots: rep?.attachments?.filter(a => a.file_type === 'screenshot').map(a => a.file_url) || [],
      issue: rep?.issue_text || '',
    })
  }

  return result
}
