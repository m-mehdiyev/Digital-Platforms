import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'


export default function PublicReport() {
  const [reports, setReports]           = useState([])
  const [report, setReport]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [snapOn, setSnapOn]             = useState(true)
  const [showPicker, setShowPicker]     = useState(false)
  const platRef = useRef(null)

  useEffect(() => { fetchReports() }, [])

  async function fetchReports() {
    setLoading(true)
    const { data } = await supabase
      .from('published_reports')
      .select('*')
      .order('published_at', { ascending: false })
    setReports(data || [])
    if (data?.[0]) setReport(data[0])
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16 }}>
      <div className="spinner" /><p style={{ fontSize:15,color:'#6b7280' }}>Hesabat yüklənir...</p>
    </div>
  )

  if (!report) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,textAlign:'center',padding:40 }}>
      <div style={{ fontSize:48 }}>📊</div>
      <h2 style={{ fontSize:24,fontWeight:700,color:'#0f172a' }}>Hesabat mövcud deyil</h2>
      <p style={{ color:'#6b7280',fontSize:15 }}>Admin tərəfindən hələ heç bir hesabat yayımlanmayıb.</p>
    </div>
  )

  const rd = report.report_data
  const platforms = rd?.platforms || []
  const period = rd?.period || report.period_label

  function goToSlide(idx) {
    setCurrentSlide(idx)
    const cont = platRef.current
    if (!cont) return
    const slides = cont.querySelectorAll('.pslide')
    if (slides[idx]) cont.scrollTo({ top: slides[idx].offsetTop, behavior: 'smooth' })
  }

  function toggleSnap() {
    setSnapOn(prev => {
      const next = !prev
      if (platRef.current) platRef.current.style.scrollSnapType = next ? 'y mandatory' : 'none'
      return next
    })
  }

  function switchReport(r) {
    setReport(r)
    setCurrentSlide(0)
    setShowPicker(false)
  }

  return (
    <div style={{ position:'relative',minHeight:'100vh' }}>
      <div className="orbs"><div className="orb o1"/><div className="orb o2"/><div className="orb o3"/></div>
      <CursorGlow />
      <ProgressBar />
      <Sidebar platforms={platforms} currentSlide={currentSlide} goToSlide={goToSlide} className="pub-sidebar"/>

      <nav className="pub-nav" style={{ position:'fixed',top:3,left:72,right:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',height:64,background:'rgba(255,255,255,0.88)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(99,102,241,0.1)',boxShadow:'0 2px 24px rgba(60,60,120,0.08)' }}>
        <div style={{ fontSize:15,fontWeight:700,color:'#0f172a' }}>Rəqəmsal Platformalar</div>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <button onClick={toggleSnap} style={{ display:'flex',alignItems:'center',gap:6,background:snapOn?'rgba(99,102,241,0.08)':'rgba(0,0,0,0.04)',border:`1.5px solid ${snapOn?'rgba(99,102,241,0.2)':'#e5e7eb'}`,borderRadius:100,padding:'5px 14px',fontSize:12,fontWeight:700,color:snapOn?'#6366f1':'#9ca3af',cursor:'pointer',transition:'all .22s' }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:snapOn?'#6366f1':'#d1d5db',flexShrink:0 }}/>
            Snap: {snapOn?'ON':'OFF'}
          </button>

          {/* Dövr seçici */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowPicker(v=>!v)}
              style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,background:'rgba(99,102,241,0.1)',color:'#6366f1',padding:'5px 14px',borderRadius:100,border:'1.5px solid rgba(99,102,241,0.2)',cursor:'pointer' }}>
              📅 {period} <span style={{ fontSize:10,opacity:.7 }}>▾</span>
            </button>
            {showPicker && (
              <div style={{ position:'absolute',top:'calc(100% + 8px)',right:0,background:'#fff',borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,.15)',border:'1.5px solid rgba(99,102,241,.1)',minWidth:220,zIndex:100,overflow:'hidden' }}>
                {reports.map(r => (
                  <button key={r.id} onClick={() => switchReport(r)}
                    style={{ display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'11px 16px',fontSize:13,fontWeight:600,color:r.id===report.id?'#6366f1':'#374151',background:r.id===report.id?'rgba(99,102,241,0.06)':'transparent',border:'none',cursor:'pointer',textAlign:'left',borderBottom:'1px solid #f1f3f9' }}>
                    <span>{r.period_label}</span>
                    {r.id===report.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {showPicker && <div style={{ position:'fixed',inset:0,zIndex:99 }} onClick={()=>setShowPicker(false)}/>}

          <span style={{ fontSize:12,color:'#9ca3af' }}>{new Date(report.published_at).toLocaleDateString('az')}</span>
        </div>
      </nav>

      <div className="pub-content" style={{ marginLeft:72,position:'relative',zIndex:2 }}>

        {/* HERO */}
        <section style={{ minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'100px 6vw 60px',background:'linear-gradient(160deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',overflow:'hidden',position:'relative' }}>
          <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
            <div style={{ position:'absolute',width:700,height:700,borderRadius:'50%',filter:'blur(80px)',background:'rgba(99,102,241,.35)',top:-200,right:-150,animation:'orbDrift 12s ease-in-out infinite alternate' }}/>
            <div style={{ position:'absolute',width:500,height:500,borderRadius:'50%',filter:'blur(80px)',background:'rgba(139,92,246,.25)',bottom:-100,left:-80,animation:'orbDrift 12s ease-in-out infinite alternate',animationDelay:'-5s' }}/>
          </div>
          <div style={{ position:'relative',zIndex:2 }}>
            <div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:11,fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(196,181,253,.9)',marginBottom:28 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'#a78bfa',animation:'ep 2s infinite',display:'inline-block' }}/>{period}
              </div>
            <h1 style={{ fontSize:'clamp(52px,7vw,96px)',fontWeight:700,lineHeight:1,color:'#fff',letterSpacing:'-.025em',marginBottom:16 }}>
              Rəqəmsal<br/>
              <span style={{ background:'linear-gradient(135deg,#c4b5fd,#a78bfa,#818cf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>Platformalar</span>
            </h1>
            <p style={{ fontSize:16,color:'rgba(196,181,253,.75)',maxWidth:560,lineHeight:1.7,marginBottom:52 }}>
              Rəqəmsal Platformaların İdarəolunması Şöbəsi<br/>Hesabat dövrü: {period}
            </p>
            <div style={{ display:'flex',gap:14,flexWrap:'wrap' }}>
              {[{n:platforms.length,l:'Platforma'},{n:platforms.reduce((s,p)=>s+(p.done?.length||0),0),l:'Görülən İş'},{n:'I Rüb',l:'2026'},{n:platforms.filter(p=>p.screenshots?.length>0).length,l:'Ekran Görüntüsü'}].map((k,i)=>(
                <div key={i} style={{ background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',backdropFilter:'blur(16px)',borderRadius:18,padding:'20px 26px',minWidth:120,position:'relative',overflow:'hidden' }}>
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)' }}/>
                  <div style={{ fontSize:36,fontWeight:700,color:'#fff',lineHeight:1,marginBottom:4 }}>{k.n}</div>
                  <div style={{ fontSize:11,color:'rgba(196,181,253,.7)' }}>{k.l}</div>
                </div>
              ))}
            </div>
            </div>{/* sol mətn bağlandı */}

          </div>{/* flex wrapper bağlandı */}
          <div style={{ position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:'pointer',animation:'sh 2.5s infinite' }}
            onClick={()=>document.getElementById('overview')?.scrollIntoView({behavior:'smooth'})}>
            <div style={{ width:44,height:44,borderRadius:'50%',border:'1.5px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.06)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'rgba(255,255,255,.5)' }}>↓</div>
            <span style={{ fontSize:9,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(255,255,255,.25)' }}>Aşağı</span>
          </div>
        </section>

        {/* OVERVIEW — böyüdülmüş cardlar */}
        <section id="overview" style={{ background:'linear-gradient(160deg,#f5f6ff,#eef0ff)',padding:'72px 6vw' }}>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'#6366f1',marginBottom:10 }}>— Platforma Ekosistemi</div>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)',fontWeight:700,color:'#0f172a',letterSpacing:'-.02em',marginBottom:8 }}>Bütün Platformalar</h2>
          <p style={{ fontSize:14,color:'#6b7280',marginBottom:36 }}>Platforma üzərinə klik edərək ətraflı hesabata keçin</p>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:16 }}>
            {platforms.map((p,idx)=>(
              <OvCard key={p.id} p={p} idx={idx} goToSlide={goToSlide} />
            ))}
          </div>
        </section>

        {/* PLATFORM SNAP VIEWER */}
        <div id="platforms" ref={platRef}
          style={{ height:'calc(100vh - 67px)',overflowY:'scroll',scrollSnapType:'y mandatory',position:'relative' }}
          onScroll={e=>{
            const slides=e.target.querySelectorAll('.pslide')
            slides.forEach((s,i)=>{ const r=s.getBoundingClientRect(); if(r.top>=-50&&r.top<window.innerHeight/2) setCurrentSlide(i) })
          }}>
          {platforms.map((p,idx)=>(
            <PlatformSlide key={p.id} p={p} idx={idx} total={platforms.length} goToSlide={goToSlide} currentSlide={currentSlide} />
          ))}
        </div>

        <footer style={{ background:'linear-gradient(135deg,#0f0c29,#1e1b4b)',color:'rgba(255,255,255,.6)',padding:'40px 6vw',display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:2 }}>
          <div style={{ fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.5)' }}>IRIA</div>
          <div style={{ fontSize:12,textAlign:'right',lineHeight:1.6 }}>Rəqəmsal Platformalar · {period}<br/>Rəqəmsal Platformaların İdarəolunması Şöbəsi</div>
        </footer>
      </div>

      <style>{`
        @keyframes orbDrift{0%{transform:translate(0,0) scale(1)}100%{transform:translate(35px,50px) scale(1.1)}}
        @keyframes ep{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        @keyframes sh{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-6px)}}
        @keyframes lbIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes imgIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          /* Sidebar gizlə */
          .pub-sidebar { display: none !important; }
          /* Content tam genişlik */
          .pub-content { margin-left: 0 !important; }
          /* Nav sol mənfəz sıfırla */
          .pub-nav { left: 0 !important; }
          /* pslide padding azalt */
          .pslide { padding: 12px 14px 36px !important; }
          /* Mətn + şəkil sütunları alt-alta */
          .mobile-col { flex-direction: column !important; }
          /* İki sütunlu grid → bir sütun */
          .mobile-grid-1 { grid-template-columns: 1fr !important; }
          /* Stats 4 sütun → 2 sütun */
          .mobile-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}

/* Overview card — hover ile büyük efekt */
function OvCard({ p, idx, goToSlide }) {
  const acc = p.color || '#6366f1'
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={()=>{ document.getElementById('platforms')?.scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(()=>goToSlide(idx),350) }}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      className="glass-card"
      style={{ padding:'28px 22px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:14,border:'1.5px solid rgba(255,255,255,0.9)',borderTop:`4px solid ${acc}`,background:'none',width:'100%',textAlign:'left',transition:'all .32s cubic-bezier(.23,1,.32,1)',transform:hov?'translateY(-6px) scale(1.02)':'none',boxShadow:hov?`0 20px 48px ${acc}22`:'none' }}>
      <div style={{ height:48,display:'flex',alignItems:'center' }}>
        {p.logo_url
          ? <img src={p.logo_url} alt={p.name} style={{ maxHeight:48,maxWidth:160,objectFit:'contain',objectPosition:'left' }}/>
          : <b style={{ fontSize:16,color:acc }}>{p.name}</b>}
      </div>
      <div style={{ fontSize:13,color:'#6b7280',lineHeight:1.5 }}>{p.tagline}</div>
      <div style={{ fontSize:11,fontWeight:700,padding:'5px 14px',borderRadius:100,background:acc,color:'#fff',marginTop:'auto',letterSpacing:'.02em' }}>
        {p.done?.length||0} iş tamamlandı{p.screenshots?.length?' 📷':''}
      </div>
    </button>
  )
}

/* Platform slide */
const MONTHS_AZ = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sep','Okt','Noy','Dek']

function GanttChart({ planned, acc }) {
  const items = planned?.filter(i => i && typeof i === 'object' && i.start_month) || []
  if (!items.length) return null

  return (
    <div className="glass-card" style={{ padding:'14px 18px', marginTop:0 }}>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:acc, marginBottom:12 }}>
        📅 İş Planı
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:560 }}>
          <thead>
            <tr>
              <th style={{ width:140, minWidth:100 }}></th>
              {MONTHS_AZ.map((m, i) => (
                <th
                  key={i}
                  style={{
                    fontSize:9,
                    color:'#9ca3af',
                    fontWeight:500,
                    textAlign:'center',
                    paddingBottom:4,
                    minWidth:34
                  }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item, ri) => {
              const start = parseInt(item.start_month)
              const end = parseInt(item.end_month || item.start_month)
              const s = Math.min(start, end) - 1
              const e = Math.max(start, end) - 1

              return (
                <tr key={ri}>
                  <td
                    style={{
                      fontSize:11,
                      color:'#374151',
                      paddingRight:6,
                      paddingBottom:2,
                      maxWidth:140,
                      overflow:'hidden',
                      textOverflow:'ellipsis',
                      whiteSpace:'nowrap'
                    }}
                  >
                    {item.text}
                  </td>

                  {MONTHS_AZ.map((_, mi) => {
                    const inRange = mi >= s && mi <= e
                    const isMsEnd = item.is_milestone && mi === e

                    return (
                      <td
                        key={mi}
                        style={{
                          padding:'1px',
                          height:38,
                          position:'relative',
                          minWidth:34
                        }}
                      >
                        <div
                          style={{
                            borderRight:'1px solid rgba(0,0,0,.05)',
                            height:'100%',
                            position:'absolute',
                            right:0,
                            top:0
                          }}
                        />

                        {inRange && (
                          <div
                            style={{
                              position:'absolute',
                              left:1,
                              right:1,
                              top:20,
                              height:10,
                              borderRadius:2,
                              background:'#888780',
                              opacity:.6
                            }}
                          />
                        )}

                        {isMsEnd && (
                          <>
                            <div
                              style={{
                                position:'absolute',
                                right:-5,
                                top:21,
                                width:9,
                                height:9,
                                background:'#D85A30',
                                transform:'rotate(45deg)',
                                zIndex:3
                              }}
                            />
                            {item.milestone_label && (
                              <div
                                style={{
                                  position:'absolute',
                                  right:-10,
                                  top:5,
                                  fontSize:10,
                                  fontWeight:600,
                                  color:'#D85A30',
                                  whiteSpace:'nowrap',
                                  lineHeight:1,
                                  zIndex:3
                                }}
                              >
                                {item.milestone_label}
                              </div>
                            )}
                          </>
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

      <div style={{ display:'flex', gap:14, marginTop:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#6b7280' }}>
          <div style={{ width:16, height:9, borderRadius:2, background:'#888780', opacity:.6 }}/> Planlaşdırılan
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#6b7280' }}>
          <div style={{ width:9, height:9, background:'#D85A30', transform:'rotate(45deg)', flexShrink:0 }}/> Milestone
        </div>
      </div>
    </div>
  )
}
function PlatformSlide({ p, idx, total, goToSlide, currentSlide }) {
  const [lightbox, setLightbox] = useState(null)
  const done = p.done||[]
  const rawPlanned = p.planned || [...(p.plan_month||[]), ...(p.plan_quarter||[]), ...(p.plan_year||[])]
  const plannedObjects = rawPlanned.map(i => typeof i === 'string' ? { text: i } : i)
  const plannedTexts = plannedObjects.map(i => i.text||i)
  const hasGantt = plannedObjects.some(i => i.start_month)
  const stats = p.stats||[], screenshots = p.screenshots||[]
  const acc = p.color||'#6366f1'

  const dots = Array.from({length:total},(_,i)=>(
    <button key={i} onClick={()=>goToSlide(i)}
      style={{ width:i===currentSlide?20:6,height:6,borderRadius:i===currentSlide?3:'50%',background:i===currentSlide?'#6366f1':'#d1d5db',border:'none',cursor:'pointer',transition:'all .25s',padding:0,flexShrink:0 }}/>
  ))

  return (
    <>
      <div className="pslide" id={p.id} data-idx={idx}
        style={{ minHeight:'100%',scrollSnapAlign:'start',scrollSnapStop:'always',display:'flex',flexDirection:'column',justifyContent:'center',padding:'16px 4vw 44px',position:'relative',background:'linear-gradient(160deg,#f8f9ff,#f0f4ff)',overflowY:'auto' }}>
        <div style={{ position:'absolute',top:-150,right:-150,width:500,height:500,borderRadius:'50%',background:`radial-gradient(circle,${acc},transparent 70%)`,opacity:.06,pointerEvents:'none' }}/>

        <div style={{ maxWidth:1060,width:'100%',margin:'0 auto',display:'flex',flexDirection:'column',gap:11 }}>
          {/* Header */}
          <div style={{ display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ height:42,display:'flex',alignItems:'center' }}>
              {p.logo_url ? <img src={p.logo_url} alt={p.name} style={{ maxHeight:42,maxWidth:200,objectFit:'contain',objectPosition:'left' }}/> : <span style={{ fontSize:20,fontWeight:700,color:acc }}>{p.name}</span>}
            </div>
            <span style={{ fontSize:12,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',padding:'5px 14px',borderRadius:100,background:acc+'18',color:acc }}>{p.tagline}</span>
          </div>

          {/* Stats */}
          {stats.length>0&&(
            <div className="mobile-stats" style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min(stats.length,4)},1fr)`,gap:9 }}>
              {stats.map((s,i)=>(
                <div key={i} style={{ background:'rgba(255,255,255,.8)',border:'1.5px solid rgba(255,255,255,.95)',borderRadius:14,padding:'12px 15px',backdropFilter:'blur(8px)',boxShadow:'0 2px 12px rgba(60,60,120,0.07)' }}>
                  <span style={{ display:'block',fontSize:22,fontWeight:700,color:acc,lineHeight:1,marginBottom:3 }}>{s.v}</span>
                  <span style={{ display:'block',fontSize:13,color:'#6b7280' }}>{s.l}</span>
                </div>
              ))}
            </div>
          )}

          {/* Body — mobile: şəkillər aşağıya düşür */}
          <div className="mobile-col" style={{ display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
            {/* Mətn sütunları — daha geniş */}
            <div className="mobile-grid-1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11, flex:'1 1 500px', minWidth:0 }}>
              <div className="glass-card" style={{ padding:'14px 18px', borderTop:`3px solid ${acc}` }}>
                <div style={{ fontSize:12,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:acc,marginBottom:11 }}>✓ Görülən İşlər</div>
                <ul style={{ listStyle:'none' }}>
                  {done.length ? done.map((d,i)=>(
                    <li key={i} style={{ display:'flex',gap:8,alignItems:'flex-start',fontSize:15,color:'#374151',lineHeight:1.6,padding:'6px 0',borderBottom:i<done.length-1?'1px solid rgba(0,0,0,.04)':'none' }}>
                      <i style={{ fontStyle:'normal',fontSize:11,fontWeight:700,color:'#16a34a',flexShrink:0,marginTop:1 }}>✓</i>{d}
                    </li>
                  )) : <li style={{ color:'#9ca3af',fontStyle:'italic',fontSize:14 }}>Məlumat yoxdur</li>}
                </ul>
              </div>
              <div className="glass-card" style={{ padding:'14px 18px' }}>
                <div style={{ fontSize:13,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#2563eb',marginBottom:12 }}>› Planlaşdırılan</div>
                <ul style={{ listStyle:'none' }}>
                  {plannedTexts.length ? plannedTexts.map((t,i)=>(
                    <li key={i} style={{ display:'flex',gap:8,alignItems:'flex-start',fontSize:15,color:'#374151',lineHeight:1.6,padding:'6px 0',borderBottom:i<plannedTexts.length-1?'1px solid rgba(0,0,0,.04)':'none' }}>
                      <i style={{ fontStyle:'normal',fontSize:13,color:'#2563eb',flexShrink:0,lineHeight:1 }}>›</i>{t}
                    </li>
                  )) : <li style={{ color:'#9ca3af',fontStyle:'italic',fontSize:14 }}>Məlumat yoxdur</li>}
                </ul>
              </div>
            </div>

            {/* Screenshots — daha dar, mətnə yer açır */}
            {screenshots.length>0&&(
              <div style={{ flex:'0 0 200px', minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:acc,marginBottom:10 }}>📷 Ekran Görüntüləri</div>
                {screenshots.length===1 ? (
                  <div onClick={()=>setLightbox(0)}
                    style={{ borderRadius:14,overflow:'hidden',cursor:'zoom-in',boxShadow:'0 4px 20px rgba(0,0,0,.12)',border:'1.5px solid rgba(255,255,255,.8)' }}>
                    <img src={screenshots[0]} alt="" style={{ width:'100%',height:'auto',display:'block',transition:'transform .3s' }}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='none'}/>
                  </div>
                ) : (
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8 }}>
                    {screenshots.map((ss,i)=>(
                      <SSThumb key={i} src={ss} acc={acc} onClick={()=>setLightbox(i)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {hasGantt && <GanttChart planned={plannedObjects} acc={acc}/>}

          {p.issue&&(
            <div style={{ display:'flex',gap:8,alignItems:'flex-start',background:'#fffbeb',border:'1px solid rgba(245,158,11,.25)',borderRadius:10,padding:'9px 13px',fontSize:11,color:'#92400e' }}>
              <span>⚠️</span><span>{p.issue}</span>
            </div>
          )}
        </div>

        <div style={{ position:'absolute',bottom:12,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5,alignItems:'center' }}>
          {dots}
        </div>
      </div>

      {lightbox!==null&&(
        <Lightbox images={screenshots} index={lightbox} onClose={()=>setLightbox(null)} accentColor={acc} />
      )}
    </>
  )
}

/* Screenshot thumbnail */
function SSThumb({ src, acc, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{ borderRadius:10,overflow:'hidden',cursor:'zoom-in',boxShadow:hov?`0 6px 20px ${acc}35`:'0 2px 12px rgba(0,0,0,.1)',border:`1.5px solid ${hov?acc:'rgba(255,255,255,.8)'}`,aspectRatio:'16/10',position:'relative',transition:'all .22s' }}>
      <img src={src} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform .3s',transform:hov?'scale(1.05)':'none' }}/>
      {hov&&<div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>🔍</div>}
    </div>
  )
}

/* Lightbox */
function Lightbox({ images, index, onClose, accentColor }) {
  const [current, setCurrent] = useState(index)
  const acc = accentColor||'#6366f1'

  const prev = useCallback(()=>setCurrent(c=>(c-1+images.length)%images.length),[images.length])
  const next = useCallback(()=>setCurrent(c=>(c+1)%images.length),[images.length])

  useEffect(()=>{
    const fn = e=>{ if(e.key==='Escape')onClose(); if(e.key==='ArrowLeft')prev(); if(e.key==='ArrowRight')next() }
    window.addEventListener('keydown',fn)
    document.body.style.overflow='hidden'
    return ()=>{ window.removeEventListener('keydown',fn); document.body.style.overflow='' }
  },[onClose,prev,next])

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(10,10,20,0.93)',backdropFilter:'blur(14px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,animation:'lbIn .22s ease' }}>

      {/* Close */}
      <button onClick={onClose}
        style={{ position:'absolute',top:20,right:20,width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1.5px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10,transition:'background .2s' }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.22)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>✕</button>

      {/* Counter */}
      {images.length>1&&(
        <div style={{ position:'absolute',top:24,left:'50%',transform:'translateX(-50%)',fontSize:13,color:'rgba(255,255,255,.5)',fontWeight:600,letterSpacing:'.05em' }}>
          {current+1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {images.length>1&&(
        <button onClick={prev}
          style={{ position:'absolute',left:20,width:52,height:52,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1.5px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.background=acc;e.currentTarget.style.borderColor=acc}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'}}>‹</button>
      )}

      {/* Main image */}
      <img key={current} src={images[current]} alt=""
        style={{ maxWidth:'85vw',maxHeight:'80vh',objectFit:'contain',borderRadius:16,boxShadow:'0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06)',display:'block',animation:'imgIn .2s ease' }}/>

      {/* Next */}
      {images.length>1&&(
        <button onClick={next}
          style={{ position:'absolute',right:20,width:52,height:52,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'1.5px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.background=acc;e.currentTarget.style.borderColor=acc}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'}}>›</button>
      )}

      {/* Thumbnail strip */}
      {images.length>1&&(
        <div style={{ position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',display:'flex',gap:8,alignItems:'center' }}>
          {images.map((img,i)=>(
            <div key={i} onClick={()=>setCurrent(i)}
              style={{ width:i===current?76:58,height:i===current?48:38,borderRadius:8,overflow:'hidden',cursor:'pointer',border:`2px solid ${i===current?acc:'rgba(255,255,255,.25)'}`,opacity:i===current?1:0.55,transition:'all .22s',flexShrink:0 }}>
              <img src={img} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Sidebar */
function Sidebar({ platforms, currentSlide, goToSlide }) {
  return (
    <div className="pub-sidebar" style={{ position:'fixed',left:0,top:3,bottom:0,width:72,zIndex:700,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(24px) saturate(200%)',borderRight:'1px solid rgba(99,102,241,0.1)',boxShadow:'2px 0 20px rgba(60,60,120,0.07)',display:'flex',flexDirection:'column',alignItems:'center',padding:'72px 0 12px',gap:3,overflow:'visible' }}>
      {platforms.map((p,idx)=>{
        const isActive=currentSlide===idx; const acc=p.color||'#6366f1'
        return (
          <div key={p.id} title={p.name}
            onClick={()=>{ document.getElementById('platforms')?.scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(()=>goToSlide(idx),300) }}
            style={{ width:52,height:52,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'background .22s,transform .22s,box-shadow .22s',background:isActive?acc:'transparent',transform:isActive?'translateX(2px)':'none',boxShadow:isActive?`0 4px 20px ${acc}70`:'none',flexShrink:0 }}>
            {p.logo_url
              ? <img src={p.logo_url} alt="" style={{ maxWidth:30,maxHeight:26,objectFit:'contain',filter:isActive?'brightness(0) invert(1)':'none',transition:'filter .2s' }}/>
              : <span style={{ fontSize:7,fontWeight:700,color:isActive?'#fff':'#374151',textAlign:'center',lineHeight:1.2 }}>{p.name?.slice(0,6)}</span>}
          </div>
        )
      })}
    </div>
  )
}

function CursorGlow() {
  useEffect(()=>{
    const el=document.getElementById('pub-cg'); if(!el) return
    let mx=window.innerWidth/2,my=window.innerHeight/2,cx=mx,cy=my
    const move=e=>{mx=e.clientX;my=e.clientY}
    document.addEventListener('mousemove',move)
    let raf; const anim=()=>{cx+=(mx-cx)*.10;cy+=(my-cy)*.10;el.style.left=cx+'px';el.style.top=cy+'px';raf=requestAnimationFrame(anim)}
    anim(); return()=>{document.removeEventListener('mousemove',move);cancelAnimationFrame(raf)}
  },[])
  return <div id="pub-cg" style={{ position:'fixed',top:0,left:0,width:480,height:480,borderRadius:'50%',pointerEvents:'none',zIndex:9998,transform:'translate(-50%,-50%)',background:'radial-gradient(circle at center,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.10) 25%,rgba(99,102,241,0.04) 55%,transparent 72%)',willChange:'left,top' }}/>
}

function ProgressBar() {
  useEffect(()=>{
    const el=document.getElementById('pub-prog'); if(!el) return
    const upd=()=>{const p=window.scrollY/(document.body.scrollHeight-window.innerHeight)*100;el.style.width=p+'%'}
    window.addEventListener('scroll',upd,{passive:true}); return()=>window.removeEventListener('scroll',upd)
  },[])
  return <div id="pub-prog" style={{ position:'fixed',top:0,left:0,height:3,zIndex:9999,background:'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)',width:0,transition:'width .1s' }}/>
}
