import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, CheckCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export default function ReportInput({ platformId, isSuperAdmin }) {
  const [platforms, setPlatforms]         = useState([])
  const [selectedPlatformId, setSelPlat]  = useState(platformId || '')
  const [period, setPeriod]               = useState('')
  const [doneItems, setDoneItems]         = useState([''])
  const [planItems, setPlanItems]         = useState([''])   // tək siyahı
  const [kpis, setKpis]                   = useState([{ label: '', value: '' }])
  const [screenshots, setScreenshots]     = useState([])
  const [screenshotFiles, setSsFiles]     = useState([])
  const [issue, setIssue]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [existingPeriodId, setExistingId] = useState(null)

  useEffect(() => { fetchPlatforms() }, [])

  // Debounce: period yazılıb 700ms dayandıqdan sonra yüklə
  useEffect(() => {
    if (!selectedPlatformId || !period) return
    const t = setTimeout(() => fetchExisting(), 700)
    return () => clearTimeout(t)
  }, [selectedPlatformId, period])

  async function fetchPlatforms() {
    const { data } = await supabase.from('platforms').select('*').order('order_index')
    setPlatforms(data || [])
    if (!platformId && data?.[0]) setSelPlat(data[0].id)
  }

  async function fetchExisting() {
    const { data, error } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', selectedPlatformId)
      .eq('period_label', period)
      .maybeSingle()

    if (error) { console.warn(error); return }

    if (data) {
      setExistingId(data.id)
      setDoneItems(data.completed_items?.sort((a,b)=>a.order_index-b.order_index).map(i=>i.text) || [''])
      const pl = data.planned_items?.sort((a,b)=>a.order_index-b.order_index).map(i=>i.text)
      setPlanItems(pl?.length ? pl : [''])
      setKpis(data.statistics?.sort((a,b)=>a.order_index-b.order_index).map(s=>({ label:s.label, value:s.value })) || [{ label:'', value:'' }])
      setScreenshots(data.attachments?.map(a=>({ url:a.file_url, name:a.file_name })) || [])
      setIssue(data.issue_text || '')
      toast('Mövcud məlumatlar yükləndi', { icon: 'ℹ️' })
    } else {
      setExistingId(null)
      setDoneItems(['']); setPlanItems(['']); setKpis([{ label:'', value:'' }])
      setScreenshots([]); setSsFiles([]); setIssue('')
    }
  }

  const onDrop = useCallback(files => {
    setSsFiles(p => [...p, ...files])
    setScreenshots(p => [...p, ...files.map(f => ({ url: URL.createObjectURL(f), name: f.name, isNew: true, file: f }))])
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } })

  async function save() {
    if (!selectedPlatformId) return toast.error('Platforma seçin')
    if (!period) return toast.error('Dövrü daxil edin')
    setSaving(true)
    try {
      let pid = existingPeriodId
      if (!pid) {
        const { data: pd, error } = await supabase.from('report_periods')
          .insert({ platform_id: selectedPlatformId, period_label: period, issue_text: issue })
          .select().single()
        if (error) throw new Error(error.message)
        pid = pd.id
      } else {
        await supabase.from('report_periods').update({ issue_text: issue }).eq('id', pid)
      }

      await Promise.all([
        supabase.from('completed_items').delete().eq('period_id', pid),
        supabase.from('planned_items').delete().eq('period_id', pid),
        supabase.from('statistics').delete().eq('period_id', pid),
      ])

      const done = doneItems.filter(t => t.trim())
      if (done.length) await supabase.from('completed_items').insert(
        done.map((text, idx) => ({ period_id: pid, text, order_index: idx }))
      )

      const plans = planItems.filter(t => t.trim())
      if (plans.length) {
        const { error } = await supabase.from('planned_items').insert(
          plans.map((text, idx) => ({ period_id: pid, text, plan_type: 'month', order_index: idx }))
        )
        if (error) throw new Error('Planlar: ' + error.message)
      }

      const kpiRows = kpis.filter(k => k.label.trim() && k.value.trim())
      if (kpiRows.length) await supabase.from('statistics').insert(
        kpiRows.map((k, idx) => ({ period_id: pid, label: k.label, value: k.value, order_index: idx }))
      )

      for (const ss of screenshots.filter(s => s.isNew && s.file)) {
        const path = `screenshots/${pid}/${Date.now()}.${ss.name.split('.').pop()}`
        const { error: upErr } = await supabase.storage.from('platform-assets').upload(path, ss.file)
        if (upErr) { toast.error('Şəkil yüklənmədi: ' + ss.name); continue }
        const { data: ud } = supabase.storage.from('platform-assets').getPublicUrl(path)
        await supabase.from('attachments').insert({ period_id: pid, file_url: ud.publicUrl, file_name: ss.name, file_type: 'screenshot' })
      }

      setExistingId(pid)
      setScreenshots(p => p.map(s => ({ ...s, isNew: false, file: undefined })))
      setSsFiles([])
      toast.success('✅ Məlumatlar saxlanıldı!')
    } catch (e) {
      toast.error('Xəta: ' + e.message)
    }
    setSaving(false)
  }

  const selPlat = platforms.find(p => p.id === selectedPlatformId)

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Daxil Et</div>
          <div className="admin-page-sub">{existingPeriodId ? '✓ Mövcud hesabat redaktə edilir' : 'Yeni hesabat'}</div>
        </div>
        <button className="btn btn-success" onClick={save} disabled={saving}>
          <CheckCircle size={15}/> {saving ? 'Saxlanılır...' : 'Saxla'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Platforma</label>
            {isSuperAdmin ? (
              <select className="form-select" value={selectedPlatformId} onChange={e => setSelPlat(e.target.value)}>
                <option value="">Seçin...</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                {selPlat?.name || '...'}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hesabat Dövrü</label>
            <input className="form-input" value={period} onChange={e => setPeriod(e.target.value)} placeholder="məs. Q1 2026"/>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Görülən işlər */}
          <div className="card">
            <div className="card-title" style={{ color: '#059669' }}>✓ Görülən İşlər</div>
            {doneItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input className="form-input" style={{ flex: 1 }} value={item}
                  onChange={e => { const n=[...doneItems]; n[i]=e.target.value; setDoneItems(n) }}
                  placeholder={`İş ${i+1}`}/>
                {doneItems.length > 1 &&
                  <button className="btn btn-danger btn-sm" onClick={() => setDoneItems(doneItems.filter((_,j)=>j!==i))}><Trash2 size={12}/></button>}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setDoneItems([...doneItems,''])} style={{ marginTop: 4 }}>
              <Plus size={12}/> Əlavə et
            </button>
          </div>

          {/* KPI */}
          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📊 Statistika / KPI</div>
            {kpis.map((kpi, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                <input className="form-input" value={kpi.label}
                  onChange={e => { const n=[...kpis]; n[i]={...n[i],label:e.target.value}; setKpis(n) }}
                  placeholder="Göstərici"/>
                <input className="form-input" value={kpi.value}
                  onChange={e => { const n=[...kpis]; n[i]={...n[i],value:e.target.value}; setKpis(n) }}
                  placeholder="Dəyər"/>
                <button className="btn btn-danger btn-sm" onClick={() => setKpis(kpis.filter((_,j)=>j!==i))}><Trash2 size={12}/></button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setKpis([...kpis,{label:'',value:''}])}>
              <Plus size={12}/> KPI əlavə et
            </button>
          </div>

          {/* Qeyd */}
          <div className="card">
            <div className="card-title" style={{ color: '#d97706' }}>⚠️ Çətinliklər / Qeydlər</div>
            <textarea className="form-textarea" value={issue} onChange={e => setIssue(e.target.value)} placeholder="Mövcud problem..."/>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Görüləcək işlər — tək siyahı */}
          <div className="card">
            <div className="card-title" style={{ color: '#2563eb' }}>› Görüləcək İşlər</div>
            {planItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input className="form-input" style={{ flex: 1 }} value={item}
                  onChange={e => { const n=[...planItems]; n[i]=e.target.value; setPlanItems(n) }}
                  placeholder={`İş ${i+1}`}/>
                {planItems.length > 1 &&
                  <button className="btn btn-danger btn-sm" onClick={() => setPlanItems(planItems.filter((_,j)=>j!==i))}><Trash2 size={12}/></button>}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setPlanItems([...planItems,''])} style={{ marginTop: 4 }}>
              <Plus size={12}/> Əlavə et
            </button>
          </div>

          {/* Screenshots */}
          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📷 Ekran Görüntüləri</div>
            {screenshots.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {screenshots.map((ss, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={ss.url} alt="" style={{ width: 100, height: 65, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e5e7eb' }}/>
                    {ss.isNew && <span style={{ position:'absolute',top:2,left:2,background:'#6366f1',color:'#fff',fontSize:8,fontWeight:700,padding:'1px 4px',borderRadius:4 }}>YENİ</span>}
                    <button onClick={() => setScreenshots(screenshots.filter((_,j)=>j!==i))}
                      style={{ position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'#dc2626',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <X size={10}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div {...getRootProps()} className={`dropzone ${isDragActive?'active':''}`}>
              <input {...getInputProps()}/>
              <Upload size={20} color="#a5b4fc"/>
              <p>Ekran görüntülərini yükləyin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
