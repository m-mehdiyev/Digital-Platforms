import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Eye, RefreshCw, Clock, CheckCircle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

async function gatherReport(period, platforms) {
  const result = { period, generatedAt: new Date().toISOString(), platforms: [] }

  for (const plat of platforms) {
    const { data: rep, error } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', plat.id)
      .eq('period_label', period)
      .maybeSingle()

    if (error) console.warn('gatherReport error for', plat.name, error.message)

    result.platforms.push({
      id: plat.id,
      name: plat.name,
      tagline: plat.tagline,
      color: plat.color,
      logo_url: plat.logo_url,
      done: rep?.completed_items?.sort((a, b) => a.order_index - b.order_index).map(i => i.text) || [],
      planned_items: rep?.planned_items?.sort((a, b) => a.order_index - b.order_index).map(i => ({
        text: i.text,
        plan_group: i.plan_group || (i.plan_type === 'year' ? 'year_end' : 'next_month'),
      })) || [],
      stats: rep?.statistics?.sort((a, b) => a.order_index - b.order_index).map(s => ({ v: s.value, l: s.label })) || [],
      screenshots: rep?.attachments?.filter(a => a.file_type === 'screenshot').map(a => a.file_url) || [],
      issue: rep?.issue_text || '',
    })
  }

  return result
}

function summarize(reportData) {
  const platforms = reportData?.platforms || []
  return {
    platformCount: platforms.length,
    doneCount: platforms.reduce((s, p) => s + (p.done?.length || 0), 0),
    plannedCount: platforms.reduce((s, p) => s + (p.planned_items?.length || 0), 0),
    nextMonthCount: platforms.reduce((s, p) => s + (p.planned_items?.filter(i => i.plan_group === 'next_month').length || 0), 0),
    yearEndCount: platforms.reduce((s, p) => s + (p.planned_items?.filter(i => i.plan_group === 'year_end').length || 0), 0),
  }
}

export default function PublishReport() {
  const [platforms, setPlatforms] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyPeriod, setBusyPeriod] = useState('')
  const [preview, setPreview] = useState(null)

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)

    const [{ data: plats }, { data: periodsData }, { data: draftsData }, { data: publishedData }] = await Promise.all([
      supabase.from('platforms').select('*').order('order_index'),
      supabase.from('report_periods').select('period_label').order('created_at', { ascending: false }),
      supabase.from('report_drafts').select('*').order('updated_at', { ascending: false }),
      supabase.from('published_reports').select('*').order('published_at', { ascending: false }),
    ])

    const platformsList = plats || []
    setPlatforms(platformsList)

    const periodSet = new Set([
      ...(periodsData || []).map(r => r.period_label),
      ...(draftsData || []).map(r => r.period_label),
      ...(publishedData || []).map(r => r.period_label),
    ])

    const mapped = [...periodSet].map(periodLabel => {
      const draft = (draftsData || []).find(d => d.period_label === periodLabel)
      const published = (publishedData || []).find(p => p.period_label === periodLabel)
      return {
        period_label: periodLabel,
        draft,
        published,
        status: published ? 'published' : draft ? 'draft' : 'waiting',
        report_data: published?.report_data || draft?.report_data || null,
        updated_at: published?.published_at || draft?.updated_at || draft?.created_at || null,
      }
    }).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))

    setRows(mapped)
    setLoading(false)
  }

  async function openPreview(row) {
    setBusyPeriod(row.period_label)
    try {
      const { data: freshDraft } = await supabase
        .from('report_drafts')
        .select('*')
        .eq('period_label', row.period_label)
        .maybeSingle()

      if (freshDraft?.report_data) {
        setPreview({ period: row.period_label, status: 'draft', report: freshDraft.report_data })
      } else if (row.published?.report_data) {
        setPreview({ period: row.period_label, status: 'published', report: row.published.report_data })
      } else {
        const report = await gatherReport(row.period_label, platforms)
        setPreview({ period: row.period_label, status: row.status, report })
      }
    } finally {
      setBusyPeriod('')
    }
  }

  async function publishRow(row) {
    setBusyPeriod(row.period_label)
    try {
      const reportData = row.draft?.report_data || row.report_data || await gatherReport(row.period_label, platforms)

      if (!reportData?.platforms?.length) {
        toast.error('Bu dövr üçün yayımlanacaq məlumat tapılmadı')
        setBusyPeriod('')
        return
      }

      if (row.published?.id) {
        const { error } = await supabase
          .from('published_reports')
          .update({ report_data: reportData, published_at: new Date().toISOString() })
          .eq('id', row.published.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('published_reports')
          .insert({ period_label: row.period_label, report_data: reportData, published_at: new Date().toISOString() })
        if (error) throw error
      }

      if (row.draft?.id) {
        await supabase.from('report_drafts').delete().eq('id', row.draft.id)
      }

      toast.success('Hesabat yayımlandı')
      await init()
    } catch (error) {
      toast.error('Yayımlama alınmadı: ' + error.message)
    }
    setBusyPeriod('')
  }

  const stats = useMemo(() => ({
    total: rows.length,
    draft: rows.filter(r => r.status === 'draft').length,
    waiting: rows.filter(r => r.status === 'waiting').length,
    published: rows.filter(r => r.status === 'published').length,
  }), [rows])

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Yayımla</div>
          <div className="admin-page-sub">Sadə siyahı: preview et, sonra yayımla</div>
        </div>
        <button className="btn btn-secondary" onClick={init}>
          <RefreshCw size={14} /> Yenilə
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-box"><div className="stat-box-num">{stats.total}</div><div className="stat-box-label">Ümumi dövr</div></div>
        <div className="stat-box"><div className="stat-box-num" style={{ color: '#f59e0b' }}>{stats.draft}</div><div className="stat-box-label">Draft</div></div>
        <div className="stat-box"><div className="stat-box-num" style={{ color: '#6b7280' }}>{stats.waiting}</div><div className="stat-box-label">Gözləmədə</div></div>
        <div className="stat-box"><div className="stat-box-num" style={{ color: '#059669' }}>{stats.published}</div><div className="stat-box-label">Yayımlanıb</div></div>
      </div>

      <div className="card">
        <div className="card-title">📋 Hesabat siyahısı</div>
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Hələ hesabat yoxdur</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Dövr</th>
                <th>Status</th>
                <th>Son yenilənmə</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.period_label}>
                  <td style={{ fontWeight: 700 }}>{row.period_label}</td>
                  <td>
                    {row.status === 'published' && <span className="badge badge-green"><CheckCircle size={10} /> Yayımlanıb</span>}
                    {row.status === 'draft' && <span className="badge badge-yellow"><Clock size={10} /> Draft</span>}
                    {row.status === 'waiting' && <span className="badge badge-gray"><FileText size={10} /> Gözləmədə</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>
                    {row.updated_at ? new Date(row.updated_at).toLocaleString('az') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openPreview(row)} disabled={busyPeriod === row.period_label}>
                        <Eye size={12} /> Preview
                      </button>
                      <button className="btn btn-success btn-sm" onClick={() => publishRow(row)} disabled={busyPeriod === row.period_label}>
                        <Send size={12} /> {row.status === 'published' ? 'Yenidən yayımla' : 'Yayımla'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {preview && (
        <PreviewModal preview={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

function PreviewModal({ preview, onClose }) {
  const summary = summarize(preview.report)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.72)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="card" style={{ width: 'min(980px, 100%)', maxHeight: '90vh', overflow: 'auto', background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(15,23,42,.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="card-title">Preview — {preview.period}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Status: {preview.status === 'published' ? 'Yayımlanıb' : preview.status === 'draft' ? 'Draft' : 'Gözləmədə'}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bağla</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 18 }}>
          <InfoBox label="Platforma" value={summary.platformCount} />
          <InfoBox label="Görülən iş" value={summary.doneCount} />
          <InfoBox label="Növbəti ay" value={summary.nextMonthCount} />
          <InfoBox label="İlin sonunadək" value={summary.yearEndCount} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(preview.report?.platforms || []).map(platform => (
            <div key={platform.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ color: '#0f172a' }}>{platform.name}</strong>
                <span className="badge badge-gray">{(platform.done?.length || 0)} iş · {(platform.planned_items?.length || 0)} plan</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <PreviewList title="Görülən işlər" items={platform.done || []} />
                <div>
                  <PreviewList
                    title="Növbəti ay görüləcək işlər"
                    items={(platform.planned_items || []).filter(i => i.plan_group === 'next_month').map(i => i.text)}
                  />
                  <div style={{ height: 8 }} />
                  <PreviewList
                    title="İlin sonunadək görüləcək işlər"
                    items={(platform.planned_items || []).filter(i => i.plan_group === 'year_end').map(i => i.text)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.12)' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function PreviewList({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Məlumat yoxdur</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#374151', padding: '4px 0', borderBottom: index < items.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
              <span style={{ color: '#6366f1' }}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
