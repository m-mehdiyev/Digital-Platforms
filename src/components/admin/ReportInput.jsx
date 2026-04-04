import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, CheckCircle, Calendar } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

// Month options in Azerbaijani
const MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','İyun',
  'İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export default function ReportInput({ platformId, isSuperAdmin }) {
  const [platforms, setPlatforms] = useState([])
  const [selectedPlatformId, setSelectedPlatformId] = useState(platformId || '')
  const [period, setPeriod] = useState('')
  const [doneItems, setDoneItems] = useState([''])
  // New planned items: { text, month, year }
  const [plannedItems, setPlannedItems] = useState([{ text: '', month: '', year: CURRENT_YEAR }])
  const [kpis, setKpis] = useState([{ label: '', value: '', unit: '' }])
  const [screenshots, setScreenshots] = useState([])
  const [screenshotFiles, setScreenshotFiles] = useState([])
  const [issue, setIssue] = useState('')
  const [saving, setSaving] = useState(false)
  const [existingPeriodId, setExistingPeriodId] = useState(null)

  useEffect(() => { fetchPlatforms() }, [])
  useEffect(() => { if (selectedPlatformId && period) fetchExisting() }, [selectedPlatformId, period])

  async function fetchPlatforms() {
    const { data } = await supabase.from('platforms').select('*').order('order_index')
    setPlatforms(data || [])
    if (!platformId && data?.[0]) setSelectedPlatformId(data[0].id)
  }

  async function fetchExisting() {
    const { data } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', selectedPlatformId)
      .eq('period_label', period)
      .single()

    if (data) {
      setExistingPeriodId(data.id)
      setDoneItems(data.completed_items.map(i => i.text).length ? data.completed_items.map(i => i.text) : [''])
      // Load planned items with due_date
      const planned = data.planned_items || []
      setPlannedItems(planned.length ? planned.map(i => ({
        text: i.text,
        month: i.due_month || '',
        year: i.due_year || CURRENT_YEAR
      })) : [{ text: '', month: '', year: CURRENT_YEAR }])
      setKpis(data.statistics.length ? data.statistics.map(s => ({ label: s.label, value: s.value, unit: s.unit || '' })) : [{ label: '', value: '', unit: '' }])
      setScreenshots(data.attachments.map(a => ({ url: a.file_url, name: a.file_name })) || [])
      setIssue(data.issue_text || '')
      toast('Mövcud məlumatlar yükləndi', { icon: 'ℹ️' })
    } else {
      setExistingPeriodId(null)
      resetForm()
    }
  }

  function resetForm() {
    setDoneItems([''])
    setPlannedItems([{ text: '', month: '', year: CURRENT_YEAR }])
    setKpis([{ label: '', value: '', unit: '' }])
    setScreenshots([])
    setScreenshotFiles([])
    setIssue('')
  }

  // Planned items helpers
  function addPlan() { setPlannedItems(prev => [...prev, { text: '', month: '', year: CURRENT_YEAR }]) }
  function updatePlan(idx, field, val) { setPlannedItems(prev => { const n=[...prev]; n[idx]={...n[idx],[field]:val}; return n }) }
  function removePlan(idx) { setPlannedItems(prev => prev.filter((_,i)=>i!==idx)) }

  // Done items helpers
  function addDone() { setDoneItems(prev => [...prev, '']) }
  function updateDone(idx, val) { setDoneItems(prev => { const n=[...prev]; n[idx]=val; return n }) }
  function removeDone(idx) { setDoneItems(prev => prev.filter((_,i)=>i!==idx)) }

  // KPI helpers
  function addKpi() { setKpis(prev => [...prev, { label: '', value: '', unit: '' }]) }
  function updateKpi(idx, field, val) { setKpis(prev => { const n=[...prev]; n[idx]={...n[idx],[field]:val}; return n }) }
  function removeKpi(idx) { setKpis(prev => prev.filter((_,i)=>i!==idx)) }

  const onDropScreenshots = useCallback(files => {
    const newFiles = files.slice(0, 10)
    setScreenshotFiles(prev => [...prev, ...newFiles])
    const previews = newFiles.map(f => ({ url: URL.createObjectURL(f), name: f.name, isNew: true }))
    setScreenshots(prev => [...prev, ...previews])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropScreenshots, accept: { 'image/*': [] }, maxFiles: 10
  })

  function removeScreenshot(idx) {
    setScreenshots(prev => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    if (!selectedPlatformId) return toast.error('Platforma seçin')
    if (!period) return toast.error('Dövrü daxil edin')
    setSaving(true)
    try {
      let periodId = existingPeriodId
      if (!periodId) {
        const { data: pData, error } = await supabase.from('report_periods').insert({
          platform_id: selectedPlatformId,
          period_label: period,
          issue_text: issue
        }).select().single()
        if (error) throw error
        periodId = pData.id
      } else {
        await supabase.from('report_periods').update({ issue_text: issue }).eq('id', periodId)
      }

      await supabase.from('completed_items').delete().eq('period_id', periodId)
      await supabase.from('planned_items').delete().eq('period_id', periodId)
      await supabase.from('statistics').delete().eq('period_id', periodId)

      const doneFiltered = doneItems.filter(i => i.trim())
      if (doneFiltered.length) {
        await supabase.from('completed_items').insert(
          doneFiltered.map((text, idx) => ({ period_id: periodId, text, order_index: idx }))
        )
      }

      // Save planned items with due_month + due_year
      const planFiltered = plannedItems.filter(i => i.text.trim())
      if (planFiltered.length) {
        await supabase.from('planned_items').insert(
          planFiltered.map((item, idx) => ({
            period_id: periodId,
            text: item.text,
            plan_type: 'custom',
            due_month: item.month || null,
            due_year: item.year || null,
            order_index: idx
          }))
        )
      }

      const kpiFiltered = kpis.filter(k => k.label.trim() && k.value.trim())
      if (kpiFiltered.length) {
        await supabase.from('statistics').insert(
          kpiFiltered.map((k, idx) => ({ period_id: periodId, label: k.label, value: k.value, unit: k.unit, order_index: idx }))
        )
      }

      for (const file of screenshotFiles) {
        const ext = file.name.split('.').pop()
        const path = `screenshots/${periodId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('platform-assets').upload(path, file)
        if (upErr) continue
        const { data: urlData } = supabase.storage.from('platform-assets').getPublicUrl(path)
        await supabase.from('attachments').insert({
          period_id: periodId, file_url: urlData.publicUrl, file_name: file.name, file_type: 'screenshot'
        })
      }

      setExistingPeriodId(periodId)
      setScreenshotFiles([])
      toast.success('Məlumatlar saxlanıldı!')
    } catch (e) {
      console.error(e)
      toast.error('Xəta: ' + e.message)
    }
    setSaving(false)
  }

  const selectedPlatform = platforms.find(p => p.id === selectedPlatformId)

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Daxil Et</div>
          <div className="admin-page-sub">Platforma məlumatlarını doldurun</div>
        </div>
        <button className="btn btn-success" onClick={save} disabled={saving}>
          <CheckCircle size={15} /> {saving ? 'Saxlanılır...' : 'Saxla'}
        </button>
      </div>

      {/* Platform + Period */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Platforma</label>
            {isSuperAdmin ? (
              <select className="form-select" value={selectedPlatformId} onChange={e => setSelectedPlatformId(e.target.value)}>
                <option value="">Platforma seçin...</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                {selectedPlatform?.name || 'Platforma yüklənir...'}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hesabat Dövrü</label>
            <input className="form-input" value={period} onChange={e => setPeriod(e.target.value)} placeholder="məs. 2026 I Rüb, Aprel 2026..." />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Completed Work */}
          <div className="card">
            <div className="card-title" style={{ color: '#059669' }}>✓ Görülən İşlər</div>
            {doneItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input className="form-input" style={{ flex: 1 }} value={item}
                  onChange={e => updateDone(idx, e.target.value)}
                  placeholder={`İş ${idx + 1}`} />
                {doneItems.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeDone(idx)}><Trash2 size={12} /></button>
                )}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={addDone} style={{ marginTop: 4 }}>
              <Plus size={12} /> Əlavə et
            </button>
          </div>

          {/* KPIs */}
          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📊 Statistika / KPI</div>
            {kpis.map((kpi, idx) => (
              <div key={idx} className="kpi-input-row">
                <input className="form-input" value={kpi.label} onChange={e => updateKpi(idx,'label',e.target.value)} placeholder="Göstərici" />
                <input className="form-input" value={kpi.value} onChange={e => updateKpi(idx,'value',e.target.value)} placeholder="Dəyər" />
                <button className="btn btn-danger btn-sm" onClick={() => removeKpi(idx)}><Trash2 size={12} /></button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={addKpi}><Plus size={12} /> KPI əlavə et</button>
          </div>

          {/* Issue */}
          <div className="card">
            <div className="card-title" style={{ color: '#d97706' }}>⚠️ Qeyd / Problem</div>
            <textarea className="form-textarea" value={issue} onChange={e => setIssue(e.target.value)} placeholder="Mövcud problem və ya qeyd..." />
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Planned Work — new format with date picker */}
          <div className="card">
            <div className="card-title" style={{ color: '#2563eb' }}>
              <Calendar size={15} /> Görüləcək İşlər
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
              Hər iş üçün görüləcəyi ayı seçin — public səhifədə Gantt chart kimi göstəriləcək
            </div>

            {plannedItems.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(99,102,241,0.04)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: '1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    value={item.text}
                    onChange={e => updatePlan(idx, 'text', e.target.value)}
                    placeholder={`Görüləcək iş ${idx + 1}`}
                  />
                  {plannedItems.length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => removePlan(idx)}><Trash2 size={12} /></button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Calendar size={13} color="#6b7280" />
                  <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Hədəf tarix:</span>
                  <select
                    className="form-select"
                    style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
                    value={item.month}
                    onChange={e => updatePlan(idx, 'month', e.target.value)}
                  >
                    <option value="">Ay seçin...</option>
                    {MONTHS.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                  <select
                    className="form-select"
                    style={{ width: 90, fontSize: 12, padding: '6px 10px' }}
                    value={item.year}
                    onChange={e => updatePlan(idx, 'year', parseInt(e.target.value))}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            ))}

            <button className="btn btn-secondary btn-sm" onClick={addPlan} style={{ marginTop: 4 }}>
              <Plus size={12} /> İş əlavə et
            </button>
          </div>

          {/* Screenshots */}
          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📷 Ekran Görüntüləri</div>
            {screenshots.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {screenshots.map((ss, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={ss.url} alt="" style={{ width: 100, height: 65, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e5e7eb' }} />
                    <button onClick={() => removeScreenshot(idx)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <Upload size={20} color="#a5b4fc" />
              <p>Ekran görüntülərini yükləyin</p>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>PNG, JPG — çoxlu seçim mümkündür</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
