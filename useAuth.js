import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, CheckCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export default function ReportInput({ platformId, isSuperAdmin }) {
  const [platforms, setPlatforms] = useState([])
  const [selectedPlatformId, setSelectedPlatformId] = useState(platformId || '')
  const [period, setPeriod] = useState('')
  const [periodLabel, setPeriodLabel] = useState('')
  const [doneItems, setDoneItems] = useState([''])
  const [planMonth, setPlanMonth] = useState([''])
  const [planQuarter, setPlanQuarter] = useState([''])
  const [planYear, setPlanYear] = useState([''])
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
      setDoneItems(data.completed_items.map(i => i.text) || [''])
      const planned = data.planned_items || []
      setPlanMonth(planned.filter(i => i.plan_type === 'month').map(i => i.text) || [''])
      setPlanQuarter(planned.filter(i => i.plan_type === 'quarter').map(i => i.text) || [''])
      setPlanYear(planned.filter(i => i.plan_type === 'year').map(i => i.text) || [''])
      setKpis(data.statistics.map(s => ({ label: s.label, value: s.value, unit: s.unit || '' })) || [{ label: '', value: '', unit: '' }])
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
    setPlanMonth([''])
    setPlanQuarter([''])
    setPlanYear([''])
    setKpis([{ label: '', value: '', unit: '' }])
    setScreenshots([])
    setScreenshotFiles([])
    setIssue('')
  }

  const onDropScreenshots = useCallback(files => {
    const newFiles = files.slice(0, 10)
    setScreenshotFiles(prev => [...prev, ...newFiles])
    const previews = newFiles.map(f => ({ url: URL.createObjectURL(f), name: f.name, isNew: true }))
    setScreenshots(prev => [...prev, ...previews])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropScreenshots, accept: { 'image/*': [] }, maxFiles: 10
  })

  function addItem(setter, arr) { setter([...arr, '']) }
  function updateItem(setter, arr, idx, val) { const n = [...arr]; n[idx] = val; setter(n) }
  function removeItem(setter, arr, idx) { setter(arr.filter((_, i) => i !== idx)) }

  function addKpi() { setKpis([...kpis, { label: '', value: '', unit: '' }]) }
  function updateKpi(idx, field, val) { const n = [...kpis]; n[idx][field] = val; setKpis(n) }
  function removeKpi(idx) { setKpis(kpis.filter((_, i) => i !== idx)) }

  function removeScreenshot(idx) {
    setScreenshots(prev => prev.filter((_, i) => i !== idx))
    setScreenshotFiles(prev => {
      const newFiles = [...prev]
      newFiles.splice(idx, 0)
      return newFiles
    })
  }

  async function save() {
    if (!selectedPlatformId) return toast.error('Platforma seçin')
    if (!period) return toast.error('Dövrü daxil edin')
    setSaving(true)
    try {
      let periodId = existingPeriodId

      // Upsert period
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

      // Clear old data
      await supabase.from('completed_items').delete().eq('period_id', periodId)
      await supabase.from('planned_items').delete().eq('period_id', periodId)
      await supabase.from('statistics').delete().eq('period_id', periodId)

      // Insert completed items
      const doneFiltered = doneItems.filter(i => i.trim())
      if (doneFiltered.length) {
        await supabase.from('completed_items').insert(
          doneFiltered.map((text, idx) => ({ period_id: periodId, text, order_index: idx }))
        )
      }

      // Insert planned items
      const allPlan = [
        ...planMonth.filter(i => i.trim()).map((text, idx) => ({ period_id: periodId, text, plan_type: 'month', order_index: idx })),
        ...planQuarter.filter(i => i.trim()).map((text, idx) => ({ period_id: periodId, text, plan_type: 'quarter', order_index: idx })),
        ...planYear.filter(i => i.trim()).map((text, idx) => ({ period_id: periodId, text, plan_type: 'year', order_index: idx })),
      ]
      if (allPlan.length) await supabase.from('planned_items').insert(allPlan)

      // Insert KPIs
      const kpiFiltered = kpis.filter(k => k.label.trim() && k.value.trim())
      if (kpiFiltered.length) {
        await supabase.from('statistics').insert(
          kpiFiltered.map((k, idx) => ({ period_id: periodId, label: k.label, value: k.value, unit: k.unit, order_index: idx }))
        )
      }

      // Upload new screenshots
      for (const file of screenshotFiles) {
        const ext = file.name.split('.').pop()
        const path = `screenshots/${periodId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('platform-assets').upload(path, file)
        if (upErr) continue
        const { data: urlData } = supabase.storage.from('platform-assets').getPublicUrl(path)
        await supabase.from('attachments').insert({
          period_id: periodId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: 'screenshot'
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

      {/* Platform + Period selector */}
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
        {/* Left: Completed + KPIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Completed Work */}
          <div className="card">
            <div className="card-title" style={{ color: '#059669' }}>✓ Görülən İşlər</div>
            {doneItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input className="form-input" style={{ flex: 1 }} value={item}
                  onChange={e => updateItem(setDoneItems, doneItems, idx, e.target.value)}
                  placeholder={`İş ${idx + 1}`} />
                {doneItems.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(setDoneItems, doneItems, idx)}><Trash2 size={12} /></button>
                )}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => addItem(setDoneItems, doneItems)} style={{ marginTop: 4 }}>
              <Plus size={12} /> Əlavə et
            </button>
          </div>

          {/* KPIs */}
          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📊 Statistika / KPI</div>
            {kpis.map((kpi, idx) => (
              <div key={idx} className="kpi-input-row">
                <input className="form-input" value={kpi.label} onChange={e => updateKpi(idx, 'label', e.target.value)} placeholder="Göstərici (məs. İstifadəçi)" />
                <input className="form-input" value={kpi.value} onChange={e => updateKpi(idx, 'value', e.target.value)} placeholder="Dəyər (məs. 25K)" />
                <button className="btn btn-danger btn-sm" onClick={() => removeKpi(idx)}><Trash2 size={12} /></button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={addKpi}><Plus size={12} /> KPI əlavə et</button>
          </div>

          {/* Issue / Alert */}
          <div className="card">
            <div className="card-title" style={{ color: '#d97706' }}>⚠️ Qeyd / Problem (istəyə bağlı)</div>
            <textarea className="form-textarea" value={issue} onChange={e => setIssue(e.target.value)} placeholder="Mövcud problem və ya qeyd..." />
          </div>
        </div>

        {/* Right: Plans + Screenshots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Planned Work */}
          <div className="card">
            <div className="card-title" style={{ color: '#2563eb' }}>› Planlaşdırılan İşlər</div>

            {/* Month */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Növbəti Ay</div>
              {planMonth.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input className="form-input" style={{ flex: 1 }} value={item}
                    onChange={e => updateItem(setPlanMonth, planMonth, idx, e.target.value)}
                    placeholder={`Plan ${idx + 1}`} />
                  {planMonth.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeItem(setPlanMonth, planMonth, idx)}><Trash2 size={12} /></button>}
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => addItem(setPlanMonth, planMonth)}><Plus size={12} /> Əlavə et</button>
            </div>

            {/* Quarter */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Növbəti Rüb</div>
              {planQuarter.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input className="form-input" style={{ flex: 1 }} value={item}
                    onChange={e => updateItem(setPlanQuarter, planQuarter, idx, e.target.value)}
                    placeholder={`Plan ${idx + 1}`} />
                  {planQuarter.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeItem(setPlanQuarter, planQuarter, idx)}><Trash2 size={12} /></button>}
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => addItem(setPlanQuarter, planQuarter)}><Plus size={12} /> Əlavə et</button>
            </div>

            {/* Year */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>İl Sonuna Qədər</div>
              {planYear.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input className="form-input" style={{ flex: 1 }} value={item}
                    onChange={e => updateItem(setPlanYear, planYear, idx, e.target.value)}
                    placeholder={`Plan ${idx + 1}`} />
                  {planYear.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeItem(setPlanYear, planYear, idx)}><Trash2 size={12} /></button>}
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => addItem(setPlanYear, planYear)}><Plus size={12} /> Əlavə et</button>
            </div>
          </div>

          {/* Screenshots */}
          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📷 Ekran Görüntüləri</div>
            {screenshots.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {screenshots.map((ss, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={ss.url} alt="" style={{ width: 100, height: 65, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e5e7eb' }} />
                    <button onClick={() => removeScreenshot(idx)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}><X size={10} /></button>
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
