import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function PublicReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [snapOn, setSnapOn] = useState(true)
  const platRef = useRef(null)

  useEffect(() => { fetchLatest() }, [])

  async function fetchLatest() {
    setLoading(true)
    const { data } = await supabase
      .from('published_reports')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(1)
      .single()
    setReport(data || null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <p style={{ fontSize: 13, color: '#6b7280' }}>Hesabat yüklənir...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48 }}>📊</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Hesabat mövcud deyil</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Admin tərəfindən hələ heç bir hesabat yayımlanmayıb.</p>
      </div>
    )
  }

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

  const iria = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text y="28" font-size="14" font-weight="bold" fill="#1e40af" font-family="Arial">IRIA</text></svg>')

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Ambient orbs */}
      <div className="orbs"><div className="orb o1" /><div className="orb o2" /><div className="orb o3" /></div>

      {/* Cursor glow */}
      <CursorGlow />

      {/* Progress bar */}
      <ProgressBar />

      {/* Sidebar */}
      <Sidebar platforms={platforms} currentSlide={currentSlide} goToSlide={goToSlide} />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 3, left: 72, right: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 64, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 2px 24px rgba(60,60,120,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Rəqəmsal Platformalar</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggleSnap} style={{ display: 'flex', alignItems: 'center', gap: 6, background: snapOn ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.04)', border: `1.5px solid ${snapOn ? 'rgba(99,102,241,0.2)' : '#e5e7eb'}`, borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: snapOn ? '#6366f1' : '#9ca3af', cursor: 'pointer', transition: 'all .22s' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: snapOn ? '#6366f1' : '#d1d5db', flexShrink: 0 }} />
            Snap: {snapOn ? 'ON' : 'OFF'}
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '4px 12px', borderRadius: 100 }}>{period}</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(report.published_at).toLocaleDateString('az')}</span>
        </div>
      </nav>

      <div style={{ marginLeft: 72, position: 'relative', zIndex: 2 }}>
        {/* HERO */}
        <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 6vw 60px', background: 'linear-gradient(160deg,#0f0c29 0%,#302b63 50%,#24243e 100%)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(99,102,241,.35)', top: -200, right: -150, animation: 'orbDrift 12s ease-in-out infinite alternate' }} />
            <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(139,92,246,.25)', bottom: -100, left: -80, animation: 'orbDrift 12s ease-in-out infinite alternate', animationDelay: '-5s' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(196,181,253,.9)', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', animation: 'ep 2s infinite', display: 'inline-block' }} />
              {period}
            </div>
            <h1 style={{ fontSize: 'clamp(52px,7vw,96px)', fontWeight: 700, lineHeight: 1, color: '#fff', letterSpacing: '-.025em', marginBottom: 16 }}>
              Rəqəmsal<br />
              <span style={{ background: 'linear-gradient(135deg,#c4b5fd,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Platformalar</span>
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(196,181,253,.75)', maxWidth: 560, lineHeight: 1.7, marginBottom: 52 }}>
              Rəqəmsal Platformaların İdarəolunması Şöbəsi<br />Hesabat dövrü: {period}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { n: platforms.length, l: 'Platforma' },
                { n: platforms.reduce((s, p) => s + (p.done?.length || 0), 0), l: 'Görülən İş' },
                { n: 'I Rüb', l: '2026' },
                { n: platforms.filter(p => p.screenshots?.length > 0).length, l: 'Ekran Görüntüsü' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: '20px 26px', minWidth: 120, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)' }} />
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{k.n}</div>
                  <div style={{ fontSize: 11, color: 'rgba(196,181,253,.7)' }}>{k.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', animation: 'sh 2.5s infinite' }}
            onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,.5)' }}>↓</div>
            <span style={{ fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>Aşağı</span>
          </div>
        </section>

        {/* OVERVIEW */}
        <section id="overview" style={{ background: 'linear-gradient(160deg,#f5f6ff,#eef0ff)', padding: '72px 6vw' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 10 }}>— Platforma Ekosistemi</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em', marginBottom: 8 }}>Bütün Platformalar</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 36 }}>Platforma üzərinə klik edərək ətraflı hesabata keçin</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
            {platforms.map((p, idx) => (
              <button key={p.id} onClick={() => { document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => goToSlide(idx), 350) }}
                className="glass-card"
                style={{ padding: '18px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, transition: 'all .32s', border: '1.5px solid rgba(255,255,255,0.9)', borderTop: `3px solid ${p.color || '#6366f1'}`, background: 'none', width: '100%', textAlign: 'left' }}>
                <div style={{ height: 30, display: 'flex', alignItems: 'center' }}>
                  {p.logo_url ? <img src={p.logo_url} alt={p.name} style={{ maxHeight: 30, maxWidth: 100, objectFit: 'contain', objectPosition: 'left' }} /> : <b style={{ fontSize: 12, color: p.color }}>{p.name}</b>}
                </div>
                <div style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.4 }}>{p.tagline}</div>
                <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: (p.color || '#6366f1') + '18', color: p.color || '#6366f1' }}>
                  {p.done?.length || 0} iş{p.screenshots?.length ? ' 📷' : ''}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* PLATFORM SNAP VIEWER */}
        <div id="platforms" ref={platRef}
          style={{ height: 'calc(100vh - 67px)', overflowY: 'scroll', scrollSnapType: 'y mandatory', position: 'relative' }}
          onScroll={e => {
            const slides = e.target.querySelectorAll('.pslide')
            slides.forEach((s, i) => {
              const r = s.getBoundingClientRect()
              if (r.top >= -50 && r.top < window.innerHeight / 2) setCurrentSlide(i)
            })
          }}>
          {platforms.map((p, idx) => (
            <PlatformSlide key={p.id} p={p} idx={idx} total={platforms.length} goToSlide={goToSlide} currentSlide={currentSlide} />
          ))}
        </div>

        {/* FOOTER */}
        <footer style={{ background: 'linear-gradient(135deg,#0f0c29,#1e1b4b)', color: 'rgba(255,255,255,.6)', padding: '40px 6vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>IRIA</div>
          <div style={{ fontSize: 12, textAlign: 'right', lineHeight: 1.6 }}>
            Rəqəmsal Platformalar · {period}<br />
            Rəqəmsal Platformaların İdarəolunması Şöbəsi
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes orbDrift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(35px,50px) scale(1.1); } }
        @keyframes ep { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.7); } }
        @keyframes sh { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(-6px); } }
      `}</style>
    </div>
  )
}

function PlatformSlide({ p, idx, total, goToSlide, currentSlide }) {
  const [activeThumb, setActiveThumb] = useState(0)

  const done = p.done || []
  const planMonth = p.plan_month || []
  const planQuarter = p.plan_quarter || []
  const planYear = p.plan_year || []
  const stats = p.stats || []
  const screenshots = p.screenshots || []
  const acc = p.color || '#6366f1'

  const dots = Array.from({ length: total }, (_, i) => (
    <button key={i} onClick={() => goToSlide(i)}
      style={{ width: i === currentSlide ? 20 : 6, height: 6, borderRadius: i === currentSlide ? 3 : '50%', background: i === currentSlide ? '#6366f1' : '#d1d5db', border: 'none', cursor: 'pointer', transition: 'all .25s', padding: 0, flexShrink: 0 }} />
  ))

  return (
    <div className="pslide" id={p.id} data-idx={idx}
      style={{ height: '100%', minHeight: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 4vw 44px', position: 'relative', background: 'linear-gradient(160deg,#f8f9ff,#f0f4ff)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle,${acc},transparent 70%)`, opacity: .06, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1060, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ height: 42, display: 'flex', alignItems: 'center' }}>
            {p.logo_url ? <img src={p.logo_url} alt={p.name} style={{ maxHeight: 42, maxWidth: 200, objectFit: 'contain', objectPosition: 'left' }} /> : <span style={{ fontSize: 20, fontWeight: 700, color: acc }}>{p.name}</span>}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 100, background: acc + '18', color: acc }}>{p.tagline}</span>
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 4)},1fr)`, gap: 9 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.8)', border: '1.5px solid rgba(255,255,255,.95)', borderRadius: 14, padding: '12px 15px', backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(60,60,120,0.07)' }}>
                <span style={{ display: 'block', fontSize: 22, fontWeight: 700, color: acc, lineHeight: 1, marginBottom: 3 }}>{s.v}</span>
                <span style={{ display: 'block', fontSize: 10, color: '#6b7280' }}>{s.l}</span>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* Cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, flex: 1, minWidth: 0 }}>
            <div className="glass-card" style={{ padding: '14px 18px', borderTop: `3px solid ${acc}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: acc, marginBottom: 11 }}>✓ Görülən İşlər</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
                {done.length ? done.map((d, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#374151', lineHeight: 1.5, padding: '5px 0', borderBottom: i < done.length - 1 ? '1px solid rgba(0,0,0,.04)' : 'none' }}>
                    <i style={{ fontStyle: 'normal', fontSize: 11, fontWeight: 700, color: '#16a34a', flexShrink: 0, marginTop: 1 }}>✓</i>{d}
                  </li>
                )) : <li style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12 }}>Məlumat yoxdur</li>}
              </ul>
            </div>
            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 11 }}>› Planlaşdırılan</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
                {[...planMonth.map(t => ({ t, tag: 'Növbəti ay' })), ...planQuarter.map(t => ({ t, tag: 'Növbəti rüb' })), ...planYear.map(t => ({ t, tag: 'İl sonu' }))].map(({ t, tag }, i, arr) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#374151', lineHeight: 1.5, padding: '5px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,.04)' : 'none' }}>
                    <i style={{ fontStyle: 'normal', fontSize: 13, color: '#2563eb', flexShrink: 0, lineHeight: 1 }}>›</i>{t}
                  </li>
                ))}
                {!planMonth.length && !planQuarter.length && !planYear.length && <li style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12 }}>Məlumat yoxdur</li>}
              </ul>
            </div>
          </div>

          {/* Gallery */}
          {screenshots.length > 0 && (
            <div style={{ flexShrink: 0, width: 270 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: acc, marginBottom: 8 }}>📷 Ekran Görüntüləri</div>
              {/* MacBook */}
              <div style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.13))', width: '100%' }}>
                <div style={{ background: 'linear-gradient(180deg,#2d2d2d,#1a1a1a)', borderRadius: '10px 10px 0 0', padding: '8px 8px 0' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3a3a3a', border: '1px solid #555', margin: '0 auto 6px' }} />
                  <div style={{ background: '#000', borderRadius: 4, overflow: 'hidden', border: '2px solid #111', aspectRatio: '16/9' }}>
                    <img src={screenshots[activeThumb]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity .18s' }} />
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(180deg,#c8c8c8,#b0b0b0)', height: 13, borderRadius: '0 0 6px 6px', position: 'relative', boxShadow: '0 3px 10px rgba(0,0,0,.18)' }}>
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 55, height: 4, background: '#a0a0a0', borderRadius: '0 0 4px 4px' }} />
                </div>
              </div>
              {/* Thumbnails */}
              {screenshots.length > 1 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {screenshots.map((ss, i) => (
                    <div key={i} onClick={() => setActiveThumb(i)}
                      style={{ width: 72, height: 46, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === activeThumb ? acc : 'rgba(0,0,0,.06)'}`, opacity: i === activeThumb ? 1 : 0.55, transition: 'all .2s', transform: i === activeThumb ? 'scale(1.06)' : 'scale(1)' }}>
                      <img src={ss} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Issue */}
        {p.issue && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fffbeb', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: '9px 13px', fontSize: 11, color: '#92400e' }}>
            <span>⚠️</span><span>{p.issue}</span>
          </div>
        )}
      </div>

      {/* Dots nav */}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, alignItems: 'center' }}>
        {dots}
      </div>
    </div>
  )
}

function Sidebar({ platforms, currentSlide, goToSlide }) {
  return (
    <div style={{ position: 'fixed', left: 0, top: 3, bottom: 0, width: 72, zIndex: 700, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px) saturate(200%)', borderRight: '1px solid rgba(99,102,241,0.1)', boxShadow: '2px 0 20px rgba(60,60,120,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 0 12px', gap: 3, overflow: 'visible' }}>
      {platforms.map((p, idx) => {
        const isActive = currentSlide === idx
        const acc = p.color || '#6366f1'
        return (
          <div key={p.id} title={p.name}
            onClick={() => { document.getElementById('platforms')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => goToSlide(idx), 300) }}
            style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', transition: 'background .22s,transform .22s,box-shadow .22s', background: isActive ? acc : 'transparent', transform: isActive ? 'translateX(2px)' : 'none', boxShadow: isActive ? `0 4px 20px ${acc}70` : 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.logo_url
                ? <img src={p.logo_url} alt="" style={{ maxWidth: 30, maxHeight: 26, objectFit: 'contain', filter: isActive ? 'brightness(0) invert(1)' : 'none', transition: 'filter .2s' }} />
                : <span style={{ fontSize: 7, fontWeight: 700, color: isActive ? '#fff' : '#374151', textAlign: 'center', lineHeight: 1.2 }}>{p.name?.slice(0, 6)}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CursorGlow() {
  useEffect(() => {
    const el = document.getElementById('pub-cg')
    if (!el) return
    let mx = window.innerWidth / 2, my = window.innerHeight / 2
    let cx = mx, cy = my
    const move = e => { mx = e.clientX; my = e.clientY }
    document.addEventListener('mousemove', move)
    let raf
    const anim = () => { cx += (mx - cx) * .10; cy += (my - cy) * .10; el.style.left = cx + 'px'; el.style.top = cy + 'px'; raf = requestAnimationFrame(anim) }
    anim()
    return () => { document.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])
  return <div id="pub-cg" style={{ position: 'fixed', top: 0, left: 0, width: 480, height: 480, borderRadius: '50%', pointerEvents: 'none', zIndex: 9998, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle at center,rgba(99,102,241,0.18) 0%,rgba(139,92,246,0.10) 25%,rgba(99,102,241,0.04) 55%,transparent 72%)', willChange: 'left,top' }} />
}

function ProgressBar() {
  useEffect(() => {
    const el = document.getElementById('pub-prog')
    if (!el) return
    const upd = () => { const p = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100; el.style.width = p + '%' }
    window.addEventListener('scroll', upd, { passive: true })
    return () => window.removeEventListener('scroll', upd)
  }, [])
  return <div id="pub-prog" style={{ position: 'fixed', top: 0, left: 0, height: 3, zIndex: 9999, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)', width: 0, transition: 'width .1s' }} />
}
