import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, CheckCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export const MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','İyun',
  'İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'
]
const CUR_YEAR = new Date().getFullYear()
export const YEARS = [CUR_YEAR-1, CUR_YEAR, CUR_YEAR+1, CUR_YEAR+2]
export const emptyPlan = () => ({ text:'', start_month:'', start_year:CUR_YEAR, due_month:'', due_year:CUR_YEAR })

// DB row -> form object
export function dbToForm(i) {
  return {
    text: i.text || '',
    start_month: i.start_month || '',
    start_year:  i.start_year  || CUR_YEAR,
    due_month:   i.due_month   || '',
    due_year:    i.due_year    || CUR_YEAR,
  }
}

// Shared UI — create AND edit use this same component
export function PlannedEditor({ items, onChange }) {
  const upd = (idx, field, val) => {
    const n = items.map((x,i) => i===idx ? {...x,[field]:val} : x)
    onChange(n)
  }
  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} style={{ marginBottom:10, background:'rgba(37,99,235,0.04)', borderRadius:10, padding:'10px 12px', border:'1px solid rgba(37,99,235,0.1)' }}>
          <div style={{ display:'flex', gap:6, marginBottom:8 }}>
            <input className="form-input" style={{ flex:1 }} value={item.text}
              onChange={e => upd(idx,'text',e.target.value)}
              placeholder={`Görüləcək iş ${idx+1}`}/>
            {items.length > 1 &&
              <button className="btn btn-danger btn-sm"
                onClick={() => onChange(items.filter((_,i)=>i!==idx))}>
                <Trash2 size={12}/>
              </button>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:10, color:'#059669', fontWeight:700, marginBottom:4 }}>🟢 Başlama</div>
              <div style={{ display:'flex', gap:4 }}>
                <select className="form-select" style={{ flex:1, fontSize:12, padding:'6px 6px' }}
                  value={item.start_month} onChange={e=>upd(idx,'start_month',e.target.value)}>
                  <option value="">Ay...</option>
                  {MONTHS.map((m,i)=><option key={i} value={m}>{m}</option>)}
                </select>
                <select className="form-select" style={{ width:74, fontSize:12, padding:'6px 4px' }}
                  value={item.start_year} onChange={e=>upd(idx,'start_year',parseInt(e.target.value))}>
                  {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#dc2626', fontWeight:700, marginBottom:4 }}>🔴 Bitmə</div>
              <div style={{ display:'flex', gap:4 }}>
                <select className="form-select" style={{ flex:1, fontSize:12, padding:'6px 6px' }}
                  value={item.due_month} onChange={e=>upd(idx,'due_month',e.target.value)}>
                  <option value="">Ay...</option>
                  {MONTHS.map((m,i)=><option key={i} value={m}>{m}</option>)}
                </select>
                <select className="form-select" style={{ width:74, fontSize:12, padding:'6px 4px' }}
                  value={item.due_year} onChange={e=>upd(idx,'due_year',parseInt(e.target.value))}>
                  {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm"
        onClick={() => onChange([...items, emptyPlan()])} style={{ marginTop:4 }}>
        <Plus size={12}/> İş əlavə et
      </button>
    </div>
  )
}

export default function ReportInput({ platformId, isSuperAdmin }) {
  const [platforms, setPlatforms] = useState([])
  const [selPlatId, setSelPlatId] = useState(platformId || '')
  const [period, setPeriod] = useState('')
  const [doneItems, setDoneItems] = useState([''])
  const [planned, setPlanned] = useState([emptyPlan()])
  const [kpis, setKpis] = useState([{label:'',value:''}])
  const [screenshots, setScreenshots] = useState([])
  const [ssFiles, setSsFiles] = useState([])
  const [issue, setIssue] = useState('')
  const [saving, setSaving] = useState(false)
  const [periodId, setPeriodId] = useState(null)

  useEffect(()=>{ fetchPlatforms() },[])
  useEffect(()=>{ if(selPlatId&&period) fetchExisting() },[selPlatId,period])

  async function fetchPlatforms() {
    const {data} = await supabase.from('platforms').select('*').order('order_index')
    setPlatforms(data||[])
    if(!platformId && data?.[0]) setSelPlatId(data[0].id)
  }

  async function fetchExisting() {
    const {data} = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', selPlatId)
      .eq('period_label', period)
      .single()
    if(data) {
      setPeriodId(data.id)
      const done = data.completed_items?.sort((a,b)=>a.order_index-b.order_index).map(i=>i.text)
      setDoneItems(done?.length ? done : [''])
      const plans = data.planned_items?.sort((a,b)=>a.order_index-b.order_index)
      setPlanned(plans?.length ? plans.map(dbToForm) : [emptyPlan()])
      const kpi = data.statistics?.sort((a,b)=>a.order_index-b.order_index)
      setKpis(kpi?.length ? kpi.map(s=>({label:s.label,value:s.value})) : [{label:'',value:''}])
      setScreenshots(data.attachments?.map(a=>({url:a.file_url,name:a.file_name}))||[])
      setIssue(data.issue_text||'')
      toast('Mövcud məlumatlar yükləndi',{icon:'ℹ️'})
    } else {
      setPeriodId(null)
      setDoneItems(['']); setPlanned([emptyPlan()])
      setKpis([{label:'',value:''}]); setScreenshots([]); setSsFiles([]); setIssue('')
    }
  }

  const onDrop = useCallback(files=>{
    setSsFiles(p=>[...p,...files])
    setScreenshots(p=>[...p,...files.map(f=>({url:URL.createObjectURL(f),name:f.name}))])
  },[])
  const {getRootProps,getInputProps,isDragActive} = useDropzone({onDrop,accept:{'image/*':[]}})

  async function save() {
    if(!selPlatId) return toast.error('Platforma seçin')
    if(!period) return toast.error('Dövrü daxil edin')
    setSaving(true)
    try {
      let pid = periodId
      if(!pid) {
        const {data:pd,error} = await supabase.from('report_periods')
          .insert({platform_id:selPlatId, period_label:period, issue_text:issue})
          .select().single()
        if(error) throw error
        pid = pd.id
      } else {
        await supabase.from('report_periods').update({issue_text:issue}).eq('id',pid)
      }

      await supabase.from('completed_items').delete().eq('period_id',pid)
      await supabase.from('planned_items').delete().eq('period_id',pid)
      await supabase.from('statistics').delete().eq('period_id',pid)

      const done = doneItems.filter(i=>i.trim())
      if(done.length) await supabase.from('completed_items').insert(
        done.map((text,idx)=>({period_id:pid,text,order_index:idx}))
      )

      const plans = planned.filter(i=>i.text.trim())
      if(plans.length) {
        // start_month, due_month həmişə var (v3 migration)
        // start_year, due_year — migration v5 işlədilibsə gəlir, işlədilməyibsə null olaraq ignore edilir
        const rows = plans.map((item,idx)=>{
          const row = {
            period_id: pid,
            text: item.text,
            plan_type: 'custom',
            start_month: item.start_month||null,
            due_month: item.due_month||null,
            order_index: idx,
          }
          // Yalnız dəyər varsa əlavə et (migration olmaya bilər)
          if(item.start_year) row.start_year = item.start_year
          if(item.due_year) row.due_year = item.due_year
          return row
        })
        const {error:pErr} = await supabase.from('planned_items').insert(rows)
        if(pErr) {
          // year sütunları yoxdursa, yenidən year olmadan cəhd et
          const rowsNoYear = rows.map(r=>{ const {start_year,due_year,...rest}=r; return rest })
          const {error:pErr2} = await supabase.from('planned_items').insert(rowsNoYear)
          if(pErr2) throw pErr2
        }
      }

      const kpiList = kpis.filter(k=>k.label.trim()&&k.value.trim())
      if(kpiList.length) await supabase.from('statistics').insert(
        kpiList.map((k,idx)=>({period_id:pid,label:k.label,value:k.value,order_index:idx}))
      )

      for(const file of ssFiles) {
        const path = `screenshots/${pid}/${Date.now()}.${file.name.split('.').pop()}`
        const {error:upErr} = await supabase.storage.from('platform-assets').upload(path,file)
        if(upErr) continue
        const {data:ud} = supabase.storage.from('platform-assets').getPublicUrl(path)
        await supabase.from('attachments').insert({period_id:pid,file_url:ud.publicUrl,file_name:file.name,file_type:'screenshot'})
      }

      setPeriodId(pid); setSsFiles([])
      toast.success('Məlumatlar saxlanıldı!')
    } catch(e) {
      console.error(e)
      toast.error('Xəta: '+e.message)
    }
    setSaving(false)
  }

  const selPlat = platforms.find(p=>p.id===selPlatId)

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Daxil Et</div>
          <div className="admin-page-sub">Platforma məlumatlarını doldurun</div>
        </div>
        <button className="btn btn-success" onClick={save} disabled={saving}>
          <CheckCircle size={15}/> {saving?'Saxlanılır...':'Saxla'}
        </button>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Platforma</label>
            {isSuperAdmin ? (
              <select className="form-select" value={selPlatId} onChange={e=>setSelPlatId(e.target.value)}>
                <option value="">Seçin...</option>
                {platforms.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <div style={{padding:'10px 14px',background:'rgba(99,102,241,0.06)',borderRadius:10,fontSize:13,fontWeight:700,color:'#6366f1'}}>
                {selPlat?.name||'...'}
              </div>
            )}
          </div>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Hesabat Dövrü</label>
            <input className="form-input" value={period} onChange={e=>setPeriod(e.target.value)} placeholder="məs. 2026 I Rüb"/>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div className="card-title" style={{color:'#059669'}}>✓ Görülən İşlər</div>
            {doneItems.map((item,idx)=>(
              <div key={idx} style={{display:'flex',gap:6,marginBottom:6}}>
                <input className="form-input" style={{flex:1}} value={item}
                  onChange={e=>{const n=[...doneItems];n[idx]=e.target.value;setDoneItems(n)}}
                  placeholder={`İş ${idx+1}`}/>
                {doneItems.length>1 &&
                  <button className="btn btn-danger btn-sm"
                    onClick={()=>setDoneItems(doneItems.filter((_,i)=>i!==idx))}>
                    <Trash2 size={12}/>
                  </button>}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm"
              onClick={()=>setDoneItems([...doneItems,''])} style={{marginTop:4}}>
              <Plus size={12}/> Əlavə et
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{color:'#6366f1'}}>📊 Statistika / KPI</div>
            {kpis.map((kpi,idx)=>(
              <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:6,marginBottom:6}}>
                <input className="form-input" value={kpi.label}
                  onChange={e=>{const n=[...kpis];n[idx]={...n[idx],label:e.target.value};setKpis(n)}}
                  placeholder="Göstərici"/>
                <input className="form-input" value={kpi.value}
                  onChange={e=>{const n=[...kpis];n[idx]={...n[idx],value:e.target.value};setKpis(n)}}
                  placeholder="Dəyər"/>
                <button className="btn btn-danger btn-sm"
                  onClick={()=>setKpis(kpis.filter((_,i)=>i!==idx))}><Trash2 size={12}/></button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm"
              onClick={()=>setKpis([...kpis,{label:'',value:''}])}>
              <Plus size={12}/> KPI əlavə et
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{color:'#d97706'}}>⚠️ Qeyd / Problem</div>
            <textarea className="form-textarea" value={issue}
              onChange={e=>setIssue(e.target.value)} placeholder="Mövcud problem..."/>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div className="card-title" style={{color:'#2563eb'}}>📅 Görüləcək İşlər</div>
            <PlannedEditor items={planned} onChange={setPlanned}/>
          </div>

          <div className="card">
            <div className="card-title" style={{color:'#6366f1'}}>📷 Ekran Görüntüləri</div>
            {screenshots.length>0 && (
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                {screenshots.map((ss,idx)=>(
                  <div key={idx} style={{position:'relative'}}>
                    <img src={ss.url} alt="" style={{width:100,height:65,objectFit:'cover',borderRadius:8,border:'1.5px solid #e5e7eb'}}/>
                    <button onClick={()=>setScreenshots(screenshots.filter((_,i)=>i!==idx))}
                      style={{position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'#dc2626',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
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
