import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, CheckCircle, Flag } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

const MONTHS = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sep','Okt','Noy','Dek']
const emptyPlan = () => ({ text: '', start_month: '', end_month: '', is_milestone: false, milestone_label: '' })

export default function ReportInput({ platformId, isSuperAdmin }) {
  const [platforms, setPlatforms]         = useState([])
  const [selectedPlatformId, setSelPlat]  = useState(platformId || '')
  const [period, setPeriod]               = useState('')
  const [doneItems, setDoneItems]         = useState([''])
  const [planItems, setPlanItems]         = useState([emptyPlan()])
  const [kpis, setKpis]                   = useState([{ label: '', value: '' }])
  const [screenshots, setScreenshots]     = useState([])
  const [screenshotFiles, setSsFiles]     = useState([])
  const [issue, setIssue]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [existingPeriodId, setExistingId] = useState(null)

  useEffect(() => { fetchPlatforms() }, [])

  useEffect(() => {
    if (!selectedPlatformId || !period) return
    const t = setTimeout(() => fetchExisting(), 700)
    return () => clearTimeout(t)
  }, [selectedPlatformId, period])

  async function fetchPlatforms() {
    const { data, error } = await supabase.from('platforms').select('*').order('order_index')
    console.log('fetchPlatforms result:', { data, error })
    if (error) {
      console.error('fetchPlatforms ERROR:', error)
      return
    }
    setPlatforms(data || [])
    if (!platformId && data?.[0]) setSelPlat(data[0].id)
  }

  async function fetchExisting() {
    console.log('fetchExisting started with:', { selectedPlatformId, period })

    const { data, error } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', selectedPlatformId)
      .eq('period_label', period)
      .maybeSingle()

    console.log('fetchExisting result:', { data, error })

    if (error) {
      console.warn('fetchExisting ERROR:', error)
      return
    }

    if (data) {
      setExistingId(data.id)
      setDoneItems(data.completed_items?.sort((a,b)=>a.order_index-b.order_index).map(i=>i.text) || [''])
      const pl = data.planned_items?.sort((a,b)=>a.order_index-b.order_index).map(i => ({
        text: i.text || '',
        start_month: i.start_month ?? '',
        end_month: i.end_month ?? '',
        is_milestone: i.is_milestone || false,
        milestone_label: i.milestone_label || '',
      }))
      setPlanItems(pl?.length ? pl : [emptyPlan()])
      setKpis(data.statistics?.sort((a,b)=>a.order_index-b.order_index).map(s=>({ label:s.label, value:s.value })) || [{ label:'', value:'' }])
      setScreenshots(data.attachments?.map(a=>({ url:a.file_url, name:a.file_name })) || [])
      setIssue(data.issue_text || '')
      toast('Mövcud məlumatlar yükləndi', { icon: 'ℹ️' })
    } else {
      setExistingId(null)
      setDoneItems([''])
      setPlanItems([emptyPlan()])
      setKpis([{ label:'', value:'' }])
      setScreenshots([])
      setSsFiles([])
      setIssue('')
    }
  }

  const onDrop = useCallback(files => {
    console.log('Dropped screenshot files:', files)
    setSsFiles(p => [...p, ...files])
    setScreenshots(p => [...p, ...files.map(f => ({ url: URL.createObjectURL(f), name: f.name, isNew: true, file: f }))])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } })

  function updatePlan(i, field, val) {
    const n = [...planItems]
    n[i] = { ...n[i], [field]: val }
    setPlanItems(n)
  }

  async function save() {
    if (!selectedPlatformId) return toast.error('Platforma seçin')
    if (!period) return toast.error('Dövrü daxil edin')

    setSaving(true)

    try {
      console.log('SAVE STARTED:', {
        selectedPlatformId,
        period,
        issue,
        existingPeriodId,
        doneItems,
        planItems,
        kpis,
        screenshots,
        screenshotFiles
      })

      let pid = existingPeriodId

      if (!pid) {
        const { data: pd, error } = await supabase
          .from('report_periods')
          .insert({
            platform_id: selectedPlatformId,
            period_label: period,
            issue_text: issue
          })
          .select()
          .single()

        console.log('report_periods insert result:', {
          pd,
          error,
          selectedPlatformId,
          period,
          issue
        })

        if (error) throw new Error(error.message)
        pid = pd.id
      } else {
        const { error: updError } = await supabase
          .from('report_periods')
          .update({ issue_text: issue })
          .eq('id', pid)

        console.log('report_periods update result:', { pid, updError })

        if (updError) throw new Error(updError.message)
      }

      const deleteResults = await Promise.all([
        supabase.from('completed_items').delete().eq('period_id', pid),
        supabase.from('planned_items').delete().eq('period_id', pid),
        supabase.from('statistics').delete().eq('period_id', pid),
      ])

      console.log('delete old rows result:', deleteResults)

      const deleteErrors = deleteResults
        .map(r => r.error)
        .filter(Boolean)

      if (deleteErrors.length) {
        throw new Error(deleteErrors.map(e => e.message).join(' | '))
      }

      const done = doneItems.filter(t => t.trim())
      console.log('filtered done items:', done)

      if (done.length) {
        const { data: doneData, error: doneError } = await supabase
          .from('completed_items')
          .insert(done.map((text, idx) => ({
            period_id: pid,
            text,
            order_index: idx
          })))

        console.log('completed_items insert result:', { doneData, doneError })

        if (doneError) throw new Error('Görülən işlər: ' + doneError.message)
      }

      const plans = planItems.filter(t => t.text.trim())
      console.log('filtered plan items:', plans)

      if (plans.length) {
        const { data: planData, error: planError } = await supabase
          .from('planned_items')
          .insert(
            plans.map((item, idx) => ({
              period_id: pid,
              text: item.text,
              plan_type: 'month',
              order_index: idx,
              start_month: item.start_month !== '' ? parseInt(item.start_month) : null,
              end_month: item.end_month !== '' ? parseInt(item.end_month) : null,
              is_milestone: item.is_milestone || false,
              milestone_label: item.milestone_label || null,
            }))
          )

        console.log('planned_items insert result:', { planData, planError })

        if (planError) throw new Error('Planlar: ' + planError.message)
      }

      const kpiRows = kpis.filter(k => k.label.trim() && k.value.trim())
      console.log('filtered kpi rows:', kpiRows)

      if (kpiRows.length) {
        const { data: kpiData, error: kpiError } = await supabase
          .from('statistics')
          .insert(
            kpiRows.map((k, idx) => ({
              period_id: pid,
              label: k.label,
              value: k.value,
              order_index: idx
            }))
          )

        console.log('statistics insert result:', { kpiData, kpiError })

        if (kpiError) throw new Error('KPI: ' + kpiError.message)
      }

      for (const ss of screenshots.filter(s => s.isNew && s.file)) {
        const path = `screenshots/${pid}/${Date.now()}.${ss.name.split('.').pop()}`
        console.log('uploading screenshot:', { name: ss.name, path })

        const { error: upErr } = await supabase.storage
          .from('platform-assets')
          .upload(path, ss.file)

        console.log('storage upload result:', { upErr, path, name: ss.name })

        if (upErr) {
          toast.error('Şəkil yüklənmədi: ' + ss.name)
          continue
        }

        const { data: ud } = supabase.storage
          .from('platform-assets')
          .getPublicUrl(path)

        console.log('public url result:', ud)

        const { data: attData, error: attError } = await supabase
          .from('attachments')
          .insert({
            period_id: pid,
            file_url: ud.publicUrl,
            file_name: ss.name,
            file_type: 'screenshot'
          })

        console.log('attachments insert result:', { attData, attError })

        if (attError) throw new Error('Attachment: ' + attError.message)
      }

      setExistingId(pid)
      setScreenshots(p => p.map(s => ({ ...s, isNew: false, file: undefined })))
      setSsFiles([])
      toast.success('✅ Məlumatlar saxlanıldı!')
    } catch (e) {
      console.error('SAVE ERROR:', e)
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

          <div className="card">
            <div className="card-title" style={{ color: '#059669' }}>✓ Görülən İşlər</div>
            {doneItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={item}
                  onChange={e => {
                    const n = [...doneItems]
                    n[i] = e.target.value
                    setDoneItems(n)
                  }}
                  placeholder={`İş ${i + 1}`}
                />
                {doneItems.length > 1 &&
                  <button className="btn btn-danger btn-sm" onClick={() => setDoneItems(doneItems.filter((_,j)=>j!==i))}>
                    <Trash2 size={12}/>
                  </button>}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setDoneItems([...doneItems,''])} style={{ marginTop: 4 }}>
              <Plus size={12}/> Əlavə et
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📊 Statistika / KPI</div>
            {kpis.map((kpi, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                <input
                  className="form-input"
                  value={kpi.label}
                  onChange={e => {
                    const n = [...kpis]
                    n[i] = { ...n[i], label: e.target.value }
                    setKpis(n)
                  }}
                  placeholder="Göstərici"
                />
                <input
                  className="form-input"
                  value={kpi.value}
                  onChange={e => {
                    const n = [...kpis]
                    n[i] = { ...n[i], value: e.target.value }
                    setKpis(n)
                  }}
                  placeholder="Dəyər"
                />
                <button className="btn btn-danger btn-sm" onClick={() => setKpis(kpis.filter((_,j)=>j!==i))}>
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setKpis([...kpis,{label:'',value:''}])}>
              <Plus size={12}/> KPI əlavə et
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: '#d97706' }}>⚠️ Çətinliklər / Qeydlər</div>
            <textarea className="form-textarea" value={issue} onChange={e => setIssue(e.target.value)} placeholder="Mövcud problem..."/>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="card">
            <div className="card-title" style={{ color: '#2563eb' }}>› Görüləcək İşlər</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
              Ay seçsəniz Gantt cədvəlində görünəcək. Seçməsəniz siyahı kimi qalır.
            </div>

            {planItems.map((item, i) => (
              <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: 'rgba(37,99,235,0.03)', borderRadius: 10, border: '1px solid rgba(37,99,235,0.1)' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    value={item.text}
                    onChange={e => updatePlan(i, 'text', e.target.value)}
                    placeholder={`İş ${i + 1}`}
                  />
                  {planItems.length > 1 &&
                    <button className="btn btn-danger btn-sm" onClick={() => setPlanItems(planItems.filter((_,j)=>j!==i))}>
                      <Trash2 size={12}/>
                    </button>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>Başlanğıc ayı</div>
                    <select
                      className="form-select"
                      style={{ fontSize: 13 }}
                      value={item.start_month}
                      onChange={e => updatePlan(i, 'start_month', e.target.value)}
                    >
                      <option value="">— Seçin</option>
                      {MONTHS.map((m, mi) => <option key={mi+1} value={mi+1}>{m} ({mi+1})</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>Bitmə ayı</div>
                    <select
                      className="form-select"
                      style={{ fontSize: 13 }}
                      value={item.end_month}
                      onChange={e => updatePlan(i, 'end_month', e.target.value)}
                    >
                      <option value="">— Seçin</option>
                      {MONTHS.map((m, mi) => <option key={mi+1} value={mi+1}>{m} ({mi+1})</option>)}
                    </select>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={item.is_milestone}
                    onChange={e => updatePlan(i, 'is_milestone', e.target.checked)}
                    style={{ accentColor: '#D85A30', width: 14, height: 14 }}
                  />
                  <Flag size={12} color="#D85A30"/> Milestone
                </label>

                {item.is_milestone && (
                  <input
                    className="form-input"
                    style={{ marginTop: 6, fontSize: 12 }}
                    value={item.milestone_label}
                    onChange={e => updatePlan(i, 'milestone_label', e.target.value)}
                    placeholder="Milestone adı (məs. v1.0, Beta...)"
                  />
                )}
              </div>
            ))}

            <button className="btn btn-secondary btn-sm" onClick={() => setPlanItems([...planItems, emptyPlan()])} style={{ marginTop: 4 }}>
              <Plus size={12}/> Əlavə et
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📷 Ekran Görüntüləri</div>
            {screenshots.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {screenshots.map((ss, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={ss.url} alt="" style={{ width: 100, height: 65, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e5e7eb' }}/>
                    {ss.isNew && (
                      <span style={{ position:'absolute', top:2, left:2, background:'#6366f1', color:'#fff', fontSize:8, fontWeight:700, padding:'1px 4px', borderRadius:4 }}>
                        YENİ
                      </span>
                    )}
                    <button
                      onClick={() => setScreenshots(screenshots.filter((_,j)=>j!==i))}
                      style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#dc2626', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    >
                      <X size={10}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
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
