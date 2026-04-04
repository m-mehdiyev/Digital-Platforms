import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Eye, Save, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PublishReport() {
  const [period, setPeriod] = useState('')
  const [periods, setPeriods] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [editingDraft, setEditingDraft] = useState(null) // draft being edited
  const [activeTab, setActiveTab] = useState('new') // 'new' | 'drafts'

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: plats }, { data: reps }, { data: draftData }] = await Promise.all([
      supabase.from('platforms').select('*').order('order_index'),
      supabase.from('report_periods').select('period_label').order('period_label'),
      supabase.from('report_drafts').select('*').order('updated_at', { ascending: false })
    ])
    setPlatforms(plats || [])
    const uniquePeriods = [...new Set((reps || []).map(r => r.period_label))]
    setPeriods(uniquePeriods)
    if (uniquePeriods[0]) setPeriod(uniquePeriods[0])
    setDrafts(draftData || [])
    setLoading(false)
  }

  async function generatePreview(selectedPeriod) {
    const p = selectedPeriod || period
    if (!p) return toast.error('Dövrü seçin')
    setBusy(true)
    try {
      const data = await gatherReportData(p, platforms)
      setPreview(data)
      toast.success('Önizləmə hazır')
    } catch (e) {
      toast.error('Xəta: ' + e.message)
    }
    setBusy(false)
  }

  async function saveDraft() {
    if (!preview) return toast.error('Əvvəlcə önizləmə yaradın')
    setBusy(true)
    try {
      if (editingDraft) {
        await supabase.from('report_drafts').update({
          period_label: preview.period,
          report_data: preview,
          updated_at: new Date().toISOString()
        }).eq('id', editingDraft.id)
        toast.success('Draft yeniləndi')
      } else {
        const { data } = await supabase.from('report_drafts').insert({
          period_label: preview.period,
          report_data: preview,
        }).select().single()
        setEditingDraft(data)
        toast.success('Draft saxlanıldı')
      }
      await fetchData()
    } catch (e) {
      toast.error('Xəta: ' + e.message)
    }
    setBusy(false)
  }

  async function loadDraft(draft) {
    setPreview(draft.report_data)
    setEditingDraft(draft)
    setPeriod(draft.period_label)
    setActiveTab('new')
    toast('Draft yükləndi — redaktə edə bilərsiniz', { icon: '✏️' })
  }

  async function deleteDraft(id) {
    await supabase.from('report_drafts').delete().eq('id', id)
    setDrafts(prev => prev.filter(d => d.id !== id))
    if (editingDraft?.id === id) { setEditingDraft(null); setPreview(null) }
    toast.success('Draft silindi')
  }

  async function publish() {
    if (!preview) return toast.error('Əvvəlcə önizləmə yaradın')
    setBusy(true)
    try {
      await supabase.from('published_reports').insert({
        period_label: preview.period,
        report_data: preview,
        published_at: new Date().toISOString()
      })
      // Delete draft if exists
      if (editingDraft) {
        await supabase.from('report_drafts').delete().eq('id', editingDraft.id)
        setEditingDraft(null)
      }
      toast.success('Hesabat uğurla yayımlandı! 🎉')
      setPreview(null)
      await fetchData()
    } catch (e) {
      toast.error('Xəta: ' + e.message)
    }
    setBusy(false)
  }

  // Edit a specific platform's data in preview
  function editPlatformInPreview(platformId, field, value) {
    setPreview(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p.id === platformId ? { ...p, [field]: value } : p
      )
    }))
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Yayımla</div>
          <div className="admin-page-sub">Hesabatı nəzərdən keçirin, redaktə edin və yayımlayın</div>
        </div>
        {editingDraft && (
          <div className="badge badge-yellow"><Edit2 size={11} /> Draft redaktə edilir</div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[{ id: 'new', label: '+ Yeni Hesabat' }, { id: 'drafts', label: `📝 Draftlar (${drafts.length})` }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#6366f1' : '#6b7280', boxShadow: activeTab === t.id ? '0 1px 8px rgba(0,0,0,.08)' : 'none', transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── NEW REPORT TAB ── */}
      {activeTab === 'new' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Dövr Seçin</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
                <select className="form-select" value={period} onChange={e => { setPeriod(e.target.value); setPreview(null); setEditingDraft(null) }}>
                  <option value="">Dövrü seçin...</option>
                  {periods.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button className="btn btn-secondary" onClick={() => generatePreview()} disabled={busy}>
                <Eye size={15} /> {busy ? 'Yüklənir...' : 'Önizləmə Yarat'}
              </button>
              {preview && (
                <>
                  <button className="btn btn-secondary" onClick={saveDraft} disabled={busy}>
                    <Save size={15} /> {editingDraft ? 'Draftu Yenilə' : 'Draft Saxla'}
                  </button>
                  <button className="btn btn-success" onClick={publish} disabled={busy}>
                    <Send size={15} /> {busy ? 'Yayımlanır...' : 'Yayımla'}
                  </button>
                </>
              )}
            </div>
          </div>

          {preview && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Önizləmə — {preview.period}
                  {editingDraft && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#d97706', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 100 }}>Draft redaktə</span>}
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Dəyişiklik etmək üçün sətirə klikləyin</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Platforma</th><th>Görülən İşlər</th><th>Görüləcəklər</th><th>KPI</th><th>Screenshotlar</th><th>Qeyd</th></tr>
                </thead>
                <tbody>
                  {preview.platforms.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.logo_url && <img src={p.logo_url} alt="" style={{ height: 20, maxWidth: 60, objectFit: 'contain' }} />}
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-green">{p.done?.length || 0} iş</span>
                      </td>
                      <td>
                        <span className="badge badge-blue">{p.planned_items?.length || 0} plan</span>
                      </td>
                      <td>
                        <span className="badge badge-blue">{p.stats?.length || 0} KPI</span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{p.screenshots?.length || 0} şəkil</span>
                      </td>
                      <td>
                        {p.issue
                          ? <span className="badge badge-yellow">⚠️ Var</span>
                          : <span className="badge badge-gray">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Editable detail per platform */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>📝 Redaktə Bölməsi</div>
                {preview.platforms.map(p => (
                  <PlatformEditRow key={p.id} p={p} onChange={(field, val) => editPlatformInPreview(p.id, field, val)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── DRAFTS TAB ── */}
      {activeTab === 'drafts' && (
        <div>
          {drafts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Draft yoxdur</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Önizləmə yaradıb "Draft Saxla" basın</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {drafts.map(d => (
                <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={18} color="#d97706" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{d.period_label}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      Son dəyişiklik: {new Date(d.updated_at || d.created_at).toLocaleString('az')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => loadDraft(d)}>
                      <Edit2 size={12} /> Redaktə Et
                    </button>
                    <button className="btn btn-success btn-sm" onClick={async () => {
                      setPreview(d.report_data); setEditingDraft(d)
                      await supabase.from('published_reports').insert({ period_label: d.period_label, report_data: d.report_data, published_at: new Date().toISOString() })
                      await supabase.from('report_drafts').delete().eq('id', d.id)
                      toast.success('Yayımlandı! 🎉'); fetchData()
                    }}>
                      <Send size={12} /> Yayımla
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteDraft(d.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Editable row per platform in preview — ALL fields
function PlatformEditRow({ p, onChange }) {
  const [open, setOpen] = useState(false)
  const acc = p.color || '#6366f1'

  const inputStyle = { width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontFamily: 'Arial,sans-serif', outline: 'none', background: '#fff' }
  const sectionTitle = (color, label) => (
    <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 6, borderBottom: `2px solid ${color}20` }}>{label}</div>
  )

  return (
    <div style={{ border: `1.5px solid ${open ? acc+'40' : 'rgba(0,0,0,.06)'}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'border-color .2s' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: open ? acc+'08' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .2s' }}>
        {p.logo_url && <img src={p.logo_url} alt="" style={{ height: 22, maxWidth: 80, objectFit: 'contain' }} />}
        <span style={{ fontWeight: 700, color: '#0f172a', flex: 1 }}>{p.name}</span>
        <span style={{ fontSize: 12, color: '#9ca3af', marginRight: 4 }}>
          {p.done?.length || 0} iş · {p.planned_items?.length || 0} plan · {p.stats?.length || 0} KPI
        </span>
        <span style={{ fontSize: 11, color: acc, fontWeight: 700 }}>{open ? '▲ Bağla' : '▼ Aç'}</span>
      </button>

      {open && (
        <div style={{ padding: '20px', borderTop: `1px solid ${acc}20`, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Görülən İşlər ── */}
          <div>
            {sectionTitle('#059669', '✓ Görülən İşlər')}
            {(p.done || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input style={{ ...inputStyle, flex: 1 }} value={item}
                  onChange={e => { const n = [...(p.done||[])]; n[i] = e.target.value; onChange('done', n) }} />
                <button onClick={() => onChange('done', (p.done||[]).filter((_,j)=>j!==i))}
                  style={{ padding: '0 10px', border: '1.5px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <button onClick={() => onChange('done', [...(p.done||[]), ''])}
              style={{ fontSize: 12, color: '#059669', background: 'rgba(5,150,105,0.06)', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>+ İş əlavə et</button>
          </div>

          {/* ── Görüləcək İşlər ── */}
          <div>
            {sectionTitle('#2563eb', '› Görüləcək İşlər')}
            {(p.planned_items || []).map((item, i) => (
              <div key={i} style={{ background: 'rgba(37,99,235,0.04)', borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: '1px solid rgba(37,99,235,0.1)' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={item.text}
                    onChange={e => { const n=[...(p.planned_items||[])]; n[i]={...n[i],text:e.target.value}; onChange('planned_items',n) }} />
                  <button onClick={() => onChange('planned_items', (p.planned_items||[]).filter((_,j)=>j!==i))}
                    style={{ padding: '0 10px', border: '1.5px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>🟢 Başlama ayı</div>
                    <input style={inputStyle} value={item.start_month || ''}
                      onChange={e => { const n=[...(p.planned_items||[])]; n[i]={...n[i],start_month:e.target.value}; onChange('planned_items',n) }}
                      placeholder="məs. Yanvar" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>🔴 Bitmə ayı</div>
                    <input style={inputStyle} value={item.due_month || ''}
                      onChange={e => { const n=[...(p.planned_items||[])]; n[i]={...n[i],due_month:e.target.value}; onChange('planned_items',n) }}
                      placeholder="məs. Mart" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => onChange('planned_items', [...(p.planned_items||[]), {text:'',start_month:'',due_month:''}])}
              style={{ fontSize: 12, color: '#2563eb', background: 'rgba(37,99,235,0.06)', border: '1.5px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>+ Plan əlavə et</button>
          </div>

          {/* ── KPI / Statistika ── */}
          <div>
            {sectionTitle('#6366f1', '📊 KPI / Statistika')}
            {(p.stats || []).map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                <input style={inputStyle} value={s.l} placeholder="Göstərici"
                  onChange={e => { const n=[...(p.stats||[])]; n[i]={...n[i],l:e.target.value}; onChange('stats',n) }} />
                <input style={inputStyle} value={s.v} placeholder="Dəyər"
                  onChange={e => { const n=[...(p.stats||[])]; n[i]={...n[i],v:e.target.value}; onChange('stats',n) }} />
                <button onClick={() => onChange('stats', (p.stats||[]).filter((_,j)=>j!==i))}
                  style={{ padding: '0 10px', border: '1.5px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            ))}
            <button onClick={() => onChange('stats', [...(p.stats||[]), {v:'',l:'',u:''}])}
              style={{ fontSize: 12, color: '#6366f1', background: 'rgba(99,102,241,0.06)', border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>+ KPI əlavə et</button>
          </div>

          {/* ── Qeyd ── */}
          <div>
            {sectionTitle('#d97706', '⚠️ Qeyd / Problem')}
            <textarea value={p.issue || ''} onChange={e => onChange('issue', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
              placeholder="Mövcud problem və ya qeyd..." />
          </div>

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
      done: rep?.completed_items
        ?.sort((a, b) => a.order_index - b.order_index)
        .map(i => i.text) || [],
      // planned_items with start + due months for Gantt
      planned_items: rep?.planned_items
        ?.sort((a, b) => a.order_index - b.order_index)
        .map(i => ({
          text: i.text,
          start_month: i.start_month || null,
          start_year: i.start_year || null,
          due_month: i.due_month || null,
          due_year: i.due_year || null,
        })) || [],
      stats: rep?.statistics
        ?.sort((a, b) => a.order_index - b.order_index)
        .map(s => ({ v: s.value, l: s.label, u: s.unit })) || [],
      screenshots: rep?.attachments
        ?.filter(a => a.file_type === 'screenshot')
        .map(a => a.file_url) || [],
      issue: rep?.issue_text || '',
    })
  }

  return result
}
