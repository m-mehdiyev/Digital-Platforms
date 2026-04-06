import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Eye, Edit2, X, Plus, Trash2, Save, Flag } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sep','Okt','Noy','Dek']

// ─── DB-dən hesabat məlumatlarını topla ──────────────────
async function gatherReportData(period, platforms) {
  const result = { period, generatedAt: new Date().toISOString(), platforms: [] }
  for (const plat of platforms) {
    const { data: rep } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', plat.id)
      .eq('period_label', period)
      .maybeSingle()
    result.platforms.push({
      id: plat.id, name: plat.name, tagline: plat.tagline,
      color: plat.color, logo_url: plat.logo_url,
      done: rep?.completed_items?.sort((a,b)=>a.order_index-b.order_index).map(i=>i.text) || [],
      planned: rep?.planned_items?.sort((a,b)=>a.order_index-b.order_index).map(i => ({
        text: i.text,
        start_month: i.start_month ?? null,
        end_month: i.end_month ?? null,
        is_milestone: i.is_milestone || false,
        milestone_label: i.milestone_label || '',
      })) || [],
      stats: rep?.statistics?.sort((a,b)=>a.order_index-b.order_index).map(s=>({ v:s.value, l:s.label })) || [],
      screenshots: rep?.attachments?.filter(a=>a.file_type==='screenshot').map(a=>a.file_url) || [],
      issue: rep?.issue_text || '',
    })
  }
  return result
}

// ─── Ana komponent ────────────────────────────────────────
export default function PublishReport() {
  const [period, setPeriod]       = useState('')
  const [periods, setPeriods]     = useState([])
  const [platforms, setPlatforms] = useState([])
  const [preview, setPreview]     = useState(null)
  const [busy, setBusy]           = useState(false)
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(false)
  const [editData, setEditData]   = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: plats }, { data: reps }] = await Promise.all([
      supabase.from('platforms').select('*').order('order_index'),
      supabase.from('report_periods').select('period_label').order('period_label'),
    ])
    setPlatforms(plats || [])
    const unique = [...new Set((reps || []).map(r => r.period_label))]
    setPeriods(unique)
    if (unique[0]) setPeriod(unique[0])
    setLoading(false)
  }

  async function generatePreview() {
    if (!period) return toast.error('Dövrü seçin')
    setBusy(true)
    try {
      const data = await gatherReportData(period, platforms)
      setPreview(data)
    } catch (e) { toast.error('Xəta: ' + e.message) }
    setBusy(false)
  }

  async function publish(data) {
    const rd = data || preview
    if (!rd) return toast.error('Əvvəlcə önizləmə yaradın')
    setBusy(true)
    try {
      const { error } = await supabase.from('published_reports').insert({
        period_label: rd.period, report_data: rd, published_at: new Date().toISOString()
      })
      if (error) throw new Error(error.message)
      toast.success('✅ Hesabat yayımlandı!')
      setPreview(null); setEditing(false); setEditData(null)
    } catch (e) { toast.error('Xəta: ' + e.message) }
    setBusy(false)
  }

  function openEdit() {
    setEditData(JSON.parse(JSON.stringify(preview)))
    setEditing(true)
  }

  function saveEdit() {
    setPreview(editData)
    setEditing(false)
    toast.success('Dəyişikliklər yadda saxlanıldı')
  }

  function editPlat(platId, field, val) {
    setEditData(prev => ({
      ...prev,
      platforms: prev.platforms.map(p => p.id === platId ? { ...p, [field]: val } : p)
    }))
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Yayımla</div>
          <div className="admin-page-sub">Dövr seçin, önizləyin və yayımlayın</div>
        </div>
        {preview && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={openEdit}>
              <Edit2 size={14}/> Redaktə Et
            </button>
            <button className="btn btn-success" onClick={() => publish(preview)} disabled={busy}>
              <Send size={15}/> {busy ? 'Yayımlanır...' : 'Yayımla'}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
            <label className="form-label">Hesabat Dövrü</label>
            <select className="form-select" value={period} onChange={e => { setPeriod(e.target.value); setPreview(null) }}>
              <option value="">Seçin...</option>
              {periods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={generatePreview} disabled={busy}>
            <Eye size={15}/> {busy ? 'Yüklənir...' : 'Önizləmə Yarat'}
          </button>
        </div>
      </div>

      {preview && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Xülasə — {preview.period}</div>
              <button className="btn btn-secondary btn-sm" onClick={openEdit}>
                <Edit2 size={13}/> Redaktə Et
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Platforma</th><th>Görülən</th><th>Görüləcək</th><th>KPI</th><th>Şəkil</th></tr>
              </thead>
              <tbody>
                {preview.platforms.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.logo_url && <img src={p.logo_url} alt="" style={{ height: 22, maxWidth: 70, objectFit: 'contain' }}/>}
                        <strong style={{ fontSize: 14 }}>{p.name}</strong>
                      </div>
                    </td>
                    <td><span className={`badge ${p.done?.length ? 'badge-green' : 'badge-gray'}`}>{p.done?.length || 0}</span></td>
                    <td><span className={`badge ${p.planned?.length ? 'badge-blue' : 'badge-gray'}`}>{p.planned?.length || 0}</span></td>
                    <td><span className={`badge ${p.stats?.length ? 'badge-blue' : 'badge-gray'}`}>{p.stats?.length || 0}</span></td>
                    <td><span className="badge badge-gray">{p.screenshots?.length || 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-title">📋 Tam Önizləmə</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {preview.platforms.map((p, idx) => (
                <PlatformPreviewCard key={p.id} p={p} idx={idx}/>
              ))}
            </div>
          </div>
        </>
      )}

      {editing && editData && (
        <EditModal
          data={editData}
          onChange={(platId, field, val) => editPlat(platId, field, val)}
          onSave={saveEdit}
          onClose={() => setEditing(false)}
          onPublish={() => publish(editData)}
          busy={busy}
        />
      )}
    </div>
  )
}

// ─── Gantt mini komponent (preview + edit üçün) ──────────
function MiniGantt({ planned, acc }) {
  const hasGantt = planned?.some(p => p.start_month)
  if (!hasGantt) return null

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: acc, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
        📅 İş Planı — Gantt
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ width: 160, textAlign: 'left', fontSize: 10, color: '#9ca3af', fontWeight: 500, paddingBottom: 4 }}></th>
              {MONTHS.map((m, i) => (
                <th key={i} style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, textAlign: 'center', paddingBottom: 4, minWidth: 36 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planned.filter(p => p.start_month).map((item, i) => {
              const start = parseInt(item.start_month)
const end = parseInt(item.end_month || item.start_month)
const s = Math.min(start, end) - 1
const e = Math.max(start, end) - 1
              return (
                <tr key={i}>
                  <td style={{ fontSize: 11, color: '#374151', paddingRight: 8, paddingBottom: 3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.text}
                  </td>
                 {MONTHS.map((_, mi) => {
  const inRange = mi >= s && mi <= e
  const isMsEnd = item.is_milestone && mi === e

  return (
    <td
      key={mi}
      style={{
        padding: '2px 1px',
        height: 28,
        position: 'relative',
        minWidth: 42
      }}
    >
      <div
        style={{
          borderRight: '1px solid #f1f3f9',
          height: '100%',
          position: 'absolute',
          right: 0,
          top: 0
        }}
      />

      {inRange && (
        <div
          style={{
            position: 'absolute',
            left: 1,
            right: 1,
            top: 7,
            height: 14,
            borderRadius: 3,
            background: '#888780',
            opacity: .65
          }}
        />
      )}

      {isMsEnd && (
        <div
          style={{
            position: 'absolute',
            right: -6,
            top: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 2,
            whiteSpace: 'nowrap'
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              background: '#D85A30',
              transform: 'rotate(45deg)',
              flexShrink: 0
            }}
          />
          {item.milestone_label && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#D85A30',
                lineHeight: 1
              }}
            >
              {item.milestone_label}
            </span>
          )}
        </div>
      )}
    </td>
  )
})}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <div style={{ width: 18, height: 10, borderRadius: 2, background: '#888780', opacity: .65 }}/> Planlaşdırılan
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <div style={{ width: 10, height: 10, background: '#D85A30', transform: 'rotate(45deg)' }}/> Milestone
        </div>
      </div>
    </div>
  )
}

// ─── Tam Önizləmə Kartı ───────────────────────────────────
function PlatformPreviewCard({ p, idx }) {
  const acc = p.color || '#6366f1'
  const isEven = idx % 2 === 0
  const plannedTexts = p.planned?.map(i => typeof i === 'string' ? i : i.text) || []

  return (
    <div style={{ border: `1.5px solid ${acc}30`, borderRadius: 16, overflow: 'hidden', background: isEven ? 'rgba(255,255,255,0.8)' : 'rgba(248,250,255,0.8)' }}>
      <div style={{ background: `linear-gradient(135deg, ${acc}12, ${acc}06)`, padding: '16px 20px', borderBottom: `1px solid ${acc}20`, display: 'flex', alignItems: 'center', gap: 14 }}>
        {p.logo_url && <img src={p.logo_url} alt="" style={{ height: 36, maxWidth: 140, objectFit: 'contain', objectPosition: 'left' }}/>}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
          {p.tagline && <div style={{ fontSize: 13, color: '#6b7280' }}>{p.tagline}</div>}
        </div>
        {p.issue && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 10px' }}>
            ⚠️ {p.issue}
          </div>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        {p.stats?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(p.stats.length, 4)}, 1fr)`, gap: 10, marginBottom: 20 }}>
            {p.stats.map((s, i) => (
              <div key={i} style={{ background: `${acc}0d`, border: `1px solid ${acc}25`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: acc, lineHeight: 1, marginBottom: 4 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: p.screenshots?.length ? '1fr 1fr 240px' : '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #d1fae5' }}>
              ✓ Görülən İşlər
            </div>
            {p.done?.length ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {p.done.map((d, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#374151', padding: '5px 0', borderBottom: i < p.done.length-1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
                    <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>✓</span>{d}
                  </li>
                ))}
              </ul>
            ) : <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Məlumat yoxdur</div>}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #dbeafe' }}>
              › Görüləcək İşlər
            </div>
            {plannedTexts.length ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {plannedTexts.map((d, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#374151', padding: '5px 0', borderBottom: i < plannedTexts.length-1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
                    <span style={{ color: '#2563eb', flexShrink: 0 }}>›</span>{d}
                  </li>
                ))}
              </ul>
            ) : <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Məlumat yoxdur</div>}
          </div>

          {p.screenshots?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #e0e7ff' }}>
                📷 Şəkillər
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {p.screenshots.map((ss, i) => (
                  <img key={i} src={ss} alt="" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gantt — yalnız ay məlumatı olan planned item-lər varsa */}
        <MiniGantt planned={p.planned} acc={acc} />
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────
function EditModal({ data, onChange, onSave, onClose, onPublish, busy }) {
  const IS = { width:'100%', padding:'8px 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:14, fontFamily:'Arial,sans-serif', outline:'none', background:'#fff' }
  const SS = { padding:'7px 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, fontFamily:'Arial,sans-serif', outline:'none', background:'#fff', width:'100%' }
  const ST = (color, label) => (
    <div style={{ fontSize:12, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8, paddingBottom:5, borderBottom:`2px solid ${color}22` }}>{label}</div>
  )

  function updatePlanned(platId, idx, field, val) {
    const plat = data.platforms.find(p => p.id === platId)
    const updated = plat.planned.map((item, i) => i === idx ? { ...item, [field]: val } : item)
    onChange(platId, 'planned', updated)
  }

  function addPlanned(platId) {
    const plat = data.platforms.find(p => p.id === platId)
    onChange(platId, 'planned', [...(plat.planned || []), { text: '', start_month: null, end_month: null, is_milestone: false, milestone_label: '' }])
  }

  function removePlanned(platId, idx) {
    const plat = data.platforms.find(p => p.id === platId)
    onChange(platId, 'planned', plat.planned.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.7)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px', overflow:'auto', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:860, boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f3f9' }}>
          <div style={{ fontSize:17, fontWeight:700, color:'#0f172a' }}>✏️ Redaktə — {data.period}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-success btn-sm" onClick={onSave}><Save size={13}/> Saxla</button>
            <button className="btn btn-primary btn-sm" onClick={onPublish} disabled={busy}><Send size={13}/> Yayımla</button>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'#f4f6fb', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#6b7280' }}>✕</button>
          </div>
        </div>

        <div style={{ padding:'20px 24px', maxHeight:'75vh', overflowY:'auto' }}>
          {data.platforms.map(p => {
            const acc = p.color || '#6366f1'
            return (
              <div key={p.id} style={{ border:`1.5px solid ${acc}30`, borderRadius:14, marginBottom:16, overflow:'hidden' }}>
                <div style={{ background:`${acc}0a`, padding:'12px 16px', borderBottom:`1px solid ${acc}20`, display:'flex', alignItems:'center', gap:10 }}>
                  {p.logo_url && <img src={p.logo_url} alt="" style={{ height:22, maxWidth:80, objectFit:'contain' }}/>}
                  <span style={{ fontWeight:700, color:'#0f172a', fontSize:15 }}>{p.name}</span>
                </div>
                <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:16 }}>

                  {/* Görülən */}
                  <div>
                    {ST('#059669', '✓ Görülən İşlər')}
                    {(p.done || []).map((item, i) => (
                      <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                        <input style={{...IS, flex:1}} value={item}
                          onChange={e => { const n=[...(p.done||[])]; n[i]=e.target.value; onChange(p.id,'done',n) }}/>
                        <button onClick={() => onChange(p.id,'done',(p.done||[]).filter((_,j)=>j!==i))}
                          style={{ padding:'0 10px', border:'1.5px solid #fecaca', borderRadius:8, background:'#fef2f2', color:'#dc2626', cursor:'pointer', fontSize:14 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => onChange(p.id,'done',[...(p.done||[]),''])}
                      style={{ fontSize:13, color:'#059669', background:'rgba(5,150,105,0.06)', border:'1.5px solid rgba(5,150,105,0.2)', borderRadius:8, padding:'5px 12px', cursor:'pointer' }}>+ Əlavə et</button>
                  </div>

                  {/* Görüləcək — ay seçici ilə */}
                  <div>
                    {ST('#2563eb', '› Görüləcək İşlər')}
                    {(p.planned || []).map((item, i) => (
                      <div key={i} style={{ marginBottom:10, padding:'10px 12px', background:'rgba(37,99,235,0.03)', borderRadius:10, border:'1px solid rgba(37,99,235,0.1)' }}>
                        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                          <input style={{...IS, flex:1}} value={item.text || ''}
                            onChange={e => updatePlanned(p.id, i, 'text', e.target.value)}/>
                          <button onClick={() => removePlanned(p.id, i)}
                            style={{ padding:'0 10px', border:'1.5px solid #fecaca', borderRadius:8, background:'#fef2f2', color:'#dc2626', cursor:'pointer', fontSize:14 }}>✕</button>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                          <div>
                            <div style={{ fontSize:11, color:'#6b7280', marginBottom:3 }}>Başlanğıc ayı</div>
                            <select style={SS} value={item.start_month || ''}
                              onChange={e => updatePlanned(p.id, i, 'start_month', e.target.value ? parseInt(e.target.value) : null)}>
                              <option value="">— Seçin</option>
                              {MONTHS.map((m, mi) => <option key={mi+1} value={mi+1}>{m} ({mi+1})</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize:11, color:'#6b7280', marginBottom:3 }}>Bitmə ayı</div>
                            <select style={SS} value={item.end_month || ''}
                              onChange={e => updatePlanned(p.id, i, 'end_month', e.target.value ? parseInt(e.target.value) : null)}>
                              <option value="">— Seçin</option>
                              {MONTHS.map((m, mi) => <option key={mi+1} value={mi+1}>{m} ({mi+1})</option>)}
                            </select>
                          </div>
                        </div>
                        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6b7280', cursor:'pointer' }}>
                          <input type="checkbox" checked={item.is_milestone || false}
                            onChange={e => updatePlanned(p.id, i, 'is_milestone', e.target.checked)}
                            style={{ accentColor:'#D85A30', width:14, height:14 }}/>
                          <Flag size={12} color="#D85A30"/> Milestone
                        </label>
                        {item.is_milestone && (
                          <input style={{...IS, marginTop:6, fontSize:12}} value={item.milestone_label || ''}
                            onChange={e => updatePlanned(p.id, i, 'milestone_label', e.target.value)}
                            placeholder="Milestone adı (məs. v1.0, Beta...)"/>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addPlanned(p.id)}
                      style={{ fontSize:13, color:'#2563eb', background:'rgba(37,99,235,0.06)', border:'1.5px solid rgba(37,99,235,0.2)', borderRadius:8, padding:'5px 12px', cursor:'pointer' }}>+ Əlavə et</button>
                  </div>

                  {/* KPI */}
                  <div>
                    {ST('#6366f1', '📊 KPI / Statistika')}
                    {(p.stats || []).map((s, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:6, marginBottom:6 }}>
                        <input style={IS} value={s.l||''} placeholder="Göstərici"
                          onChange={e => { const n=[...(p.stats||[])]; n[i]={...n[i],l:e.target.value}; onChange(p.id,'stats',n) }}/>
                        <input style={IS} value={s.v||''} placeholder="Dəyər"
                          onChange={e => { const n=[...(p.stats||[])]; n[i]={...n[i],v:e.target.value}; onChange(p.id,'stats',n) }}/>
                        <button onClick={() => onChange(p.id,'stats',(p.stats||[]).filter((_,j)=>j!==i))}
                          style={{ padding:'0 10px', border:'1.5px solid #fecaca', borderRadius:8, background:'#fef2f2', color:'#dc2626', cursor:'pointer', fontSize:14 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => onChange(p.id,'stats',[...(p.stats||[]),{v:'',l:''}])}
                      style={{ fontSize:13, color:'#6366f1', background:'rgba(99,102,241,0.06)', border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:8, padding:'5px 12px', cursor:'pointer' }}>+ KPI əlavə et</button>
                  </div>

                  {/* Qeyd */}
                  <div>
                    {ST('#d97706', '⚠️ Qeyd / Problem')}
                    <textarea style={{...IS, resize:'vertical', minHeight:54}} value={p.issue||''}
                      onChange={e => onChange(p.id,'issue',e.target.value)} placeholder="Mövcud problem..."/>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
