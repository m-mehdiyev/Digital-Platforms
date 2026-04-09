import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const MONTHS_AZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']

export default function PublicReport() {
  const [reports, setReports] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [snapOn, setSnapOn] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('public-report-theme') || 'dark')
  const platRef = useRef(null)
  const isAutoScrolling = useRef(false)

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('pr-light', theme === 'light')
    localStorage.setItem('public-report-theme', theme)
    return () => document.body.classList.remove('pr-light')
  }, [theme])

  useEffect(() => {
    function handleScroll() {
      if (isAutoScrolling.current) return
      const cont = platRef.current
      if (!cont) return

      const slides = cont.querySelectorAll('.pslide')
      slides.forEach((s, i) => {
        const r = s.getBoundingClientRect()
        if (r.top >= -120 && r.top < window.innerHeight * 0.45) {
          setCurrentSlide(i)
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [report])

  async function fetchReports() {
    setLoading(true)
    const { data, error } = await supabase
      .from('published_reports')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('published_reports fetch error:', error)
      setReports([])
      setReport(null)
      setLoading(false)
      return
    }

    setReports(data || [])
    if (data?.[0]) setReport(data[0])
    setLoading(false)
  }

  function goToSlide(idx) {
    const cont = platRef.current
    if (!cont) return

    const slides = cont.querySelectorAll('.pslide')
    const target = slides[idx]
    if (!target) return

    const navOffset = 88
    const y = target.getBoundingClientRect().top + window.scrollY - navOffset
    isAutoScrolling.current = true
    window.scrollTo({ top: y, behavior: 'smooth' })

    window.setTimeout(() => {
      setCurrentSlide(idx)
      isAutoScrolling.current = false
    }, 700)
  }

  function toggleSnap() {
    setSnapOn(prev => {
      const next = !prev
      if (platRef.current) platRef.current.style.scrollSnapType = next ? 'y proximity' : 'none'
      return next
    })
  }

  function switchReport(nextReport) {
    setReport(nextReport)
    setCurrentSlide(0)
    setShowPicker(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="pr-shell">
        <GlobalStyles />
        <div className="pr-loading">
          <div className="pr-spinner" />
          <p>Hesabat yüklənir...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="pr-shell">
        <GlobalStyles />
        <div className="pr-empty">
          <div style={{ fontSize: 48 }}>📊</div>
          <h2>Hesabat mövcud deyil</h2>
          <p>Admin tərəfindən hələ heç bir hesabat yayımlanmayıb.</p>
        </div>
      </div>
    )
  }

  const rd = report.report_data || {}
  const platforms = rd?.platforms || []
  const period = rd?.period || report.period_label || 'Dövr'
  const totalDone = platforms.reduce((sum, p) => sum + (p.done?.length || 0), 0)
  const totalScreenshots = platforms.reduce((sum, p) => sum + (p.screenshots?.length || 0), 0)

  return (
    <div className="pr-shell">
      <GlobalStyles />
      <HeroCanvas />

      <Sidebar platforms={platforms} currentSlide={currentSlide} goToSlide={goToSlide} />

      <header className="pr-topbar">
        <div className="pr-topbar-brand">Rəqəmsal Platformaların İdarəolunması Şöbəsi</div>

        <div className="pr-topbar-right">
          <div className="pr-chip">
            <span className="pr-chip-dot" />
            Canlı görünüş
          </div>

          <button className="pr-chip pr-chip-btn" onClick={toggleSnap}>
            {snapOn ? 'Snap ON' : 'Snap OFF'}
          </button>

          <div style={{ position: 'relative' }}>
            <button className="pr-chip pr-chip-btn" onClick={() => setShowPicker(v => !v)}>
              📅 {period}
            </button>

            {showPicker && (
              <>
                <div className="pr-picker-backdrop" onClick={() => setShowPicker(false)} />
                <div className="pr-picker">
                  {reports.map(r => (
                    <button
                      key={r.id}
                      className={`pr-picker-item ${r.id === report.id ? 'is-active' : ''}`}
                      onClick={() => switchReport(r)}
                    >
                      <span>{r.period_label}</span>
                      {r.id === report.id && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            className="pr-chip pr-chip-btn"
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
          >
            🌗 Light / Dark
          </button>
        </div>
      </header>

      <section className="pr-hero">
        <div className="pr-hero-fade" />
        <div className="pr-hero-content">
          <div className="pr-hero-ey">
            <span className="pr-hero-ey-dot" />
            Rəqəmsal Platformaların İdarəolunması Şöbəsi
          </div>

          <h1 className="pr-hero-h1">
            Rəqəmsal
            <br />
            <span className="gr">Platformalar</span>
          </h1>

          <p className="pr-hero-sub">Rəqəmsal platformalara dair hesabatlar · {period}</p>

          <div className="pr-hero-kpis">
            <KpiCard n={platforms.length} l="Platforma" />
            <KpiCard n={totalDone} l="Görülən iş" />
            <KpiCard n={period} l="Hesabat dövrü" />
            <KpiCard n={totalScreenshots} l="Ekran görüntüsü" />
          </div>
        </div>
      </section>

      <div className="pr-wrap">
        <section className="pr-section" id="overview">
          <SectionIntro
            kicker="Platforma ekosistemi"
            title="Bütün platformalar"
            desc="Platforma üzərinə klik edərək ətraflı hesabata keçin"
          />

          <div className="pr-ov-grid">
            {platforms.map((p, idx) => (
              <OverviewCard key={p.id || idx} p={p} idx={idx} goToSlide={goToSlide} />
            ))}
          </div>
        </section>

        <div className="pr-divider" />

        <section className="pr-section" id="platforms">
          <SectionIntro
            kicker="Ətraflı hesabat"
            title="Platformalara dair detallar"
            desc="Görülən işlər, Planlaşdırılan işlər, Gantt cədvəli və ekran görüntüləri"
          />

          <div
            className="pr-plat-list"
            ref={platRef}
            style={{ scrollSnapType: snapOn ? 'y proximity' : 'none' }}
          >
            {platforms.map((p, idx) => (
              <PlatformSlide
                key={p.id || idx}
                p={p}
                idx={idx}
                total={platforms.length}
                goToSlide={goToSlide}
              />
            ))}
          </div>
        </section>
      </div>

      <footer className="pr-footer">
        <div className="pr-footer-brand">IRIA</div>
        <div className="pr-footer-meta">
          Rəqəmsal Platformalar · {period}
          <br />
          Rəqəmsal Platformaların İdarəolunması Şöbəsi
        </div>
      </footer>
    </div>
  )
}

function KpiCard({ n, l }) {
  return (
    <div className="pr-kpi">
      <div className="pr-kpi-n">{n}</div>
      <div className="pr-kpi-l">{l}</div>
    </div>
  )
}

function SectionIntro({ kicker, title, desc }) {
  return (
    <div className="pr-rv pr-rv-in">
      <div className="pr-sec-kicker">{kicker}</div>
      <h2 className="pr-sec-h2">{title}</h2>
      <p className="pr-sec-desc">{desc}</p>
    </div>
  )
}

function OverviewCard({ p, idx, goToSlide }) {
  const accent = p.color || '#15c39a'

  return (
    <button className="pr-ov-card" onClick={() => goToSlide(idx)} style={{ '--ov-accent': accent }}>
      <div className="pr-ov-num">{String(idx + 1).padStart(2, '0')}</div>

      <div className="pr-ov-logo">
        {p.logo_url ? (
          <img src={p.logo_url} alt={p.name} />
        ) : (
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{p.short || p.name}</div>
        )}
      </div>

      <div className="pr-ov-name">{p.name}</div>
      <div className="pr-ov-tag">{p.tagline || p.tag || 'Platforma haqqında məlumat'}</div>
      <div className="pr-ov-badge">
        <span className="pr-ov-badge-dot" />
        {p.done?.length || 0} iş tamamlandı
      </div>
    </button>
  )
}

function PlatformSlide({ p, idx, total, goToSlide }) {
  const [lightbox, setLightbox] = useState(null)
  const [visible, setVisible] = useState(false)
  const cardRef = useRef(null)

  const done = p.done || []
  const rawPlanned =
    Array.isArray(p.planned) && p.planned.length
      ? p.planned
      : [...(p.plan_month || []), ...(p.plan_quarter || []), ...(p.plan_year || [])]

  const plannedObjects = rawPlanned.map(item => (typeof item === 'string' ? { text: item } : item))
  const hasGantt = plannedObjects.some(item => item && typeof item === 'object' && item.start_month)
  const stats = p.stats || []
  const screenshots = p.screenshots || []
  const acc = p.color || '#6366f1'

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div
        ref={cardRef}
        className={`pslide pr-plat-card pr-rv ${visible ? 'pr-rv-in' : ''}`}
        id={p.id || `platform-${idx}`}
        style={{ scrollSnapAlign: 'start' }}
      >
        <div className="pr-plat-glow" style={{ background: acc }} />

        <div className="pr-plat-head">
          <div className="pr-plat-head-left">
            <div className="pr-plat-icon" style={{ background: `${acc}20`, color: acc }}>
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.name} />
              ) : (
                <span>{p.short || p.name?.slice(0, 2)}</span>
              )}
            </div>

            <div>
              <div className="pr-plat-name">{p.name}</div>
              <div className="pr-plat-tag">{p.tagline || p.tag || 'Platforma'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="pr-plat-idx">{String(idx + 1).padStart(2, '0')}</div>

            <div className="pr-plat-nav">
              <button onClick={() => goToSlide(Math.max(0, idx - 1))}>←</button>
              <button onClick={() => goToSlide(Math.min(total - 1, idx + 1))}>→</button>
            </div>
          </div>
        </div>

        {stats.length > 0 && (
          <div className="pr-stat-row" style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)},1fr)` }}>
            {stats.map((s, i) => (
              <div key={i} className="pr-stat">
                <div className="pr-stat-v" style={{ color: acc }}>
                  {s.v ?? s.value ?? s.n ?? '-'}
                </div>
                <div className="pr-stat-l">{s.l ?? s.label ?? 'Göstərici'}</div>
              </div>
            ))}
          </div>
        )}

        {/* Görülən işlər + Şəkillər — yan-yana */}
        <div style={{ display: 'grid', gridTemplateColumns: screenshots.length > 0 ? '1fr 220px' : '1fr', gap: 12, alignItems: 'start' }}>
          <div className="pr-gpanel">
            <div className="pr-panel-hd" style={{ color: acc }}>
              <span className="pr-panel-hd-ico" style={{ background: `${acc}1c`, color: acc }}>✓</span>
              Görülən işlər
            </div>
            <ul className="pr-ilist">
              {done.length ? done.map((d, i) => (
                <li key={i}><span className="pr-im" style={{ color: '#16a34a' }}>✓</span><span>{d}</span></li>
              )) : <div className="pr-empty-txt">Məlumat yoxdur</div>}
            </ul>
          </div>

          {screenshots.length > 0 && (
            <div className="pr-gpanel">
              <div className="pr-panel-hd" style={{ color: acc }}>
                <span className="pr-panel-hd-ico" style={{ background: `${acc}1c`, color: acc }}>📷</span>
                Ekran görüntüləri ({screenshots.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7, maxHeight: 280, overflowY: 'auto', padding: '2px 0 4px' }}>
                {screenshots.map((src, i) => (
                  <button key={i} className="pr-ss-thumb" onClick={() => setLightbox(i)} type="button"
                    style={{ aspectRatio: '16/10', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'transparent', padding: 0, display: 'block', width: '100%' }}>
                    <img src={src} alt={`${p.name} screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasGantt && (
          <div className="pr-gpanel" style={{ marginTop: 12 }}>
            <div className="pr-panel-hd" style={{ color: acc }}>
              <span className="pr-panel-hd-ico" style={{ background: `${acc}1c`, color: acc }}>📅</span>
              Yol Xəritəsi — Gantt
            </div>
            <GanttChart planned={plannedObjects} acc={acc} />
          </div>
        )}

        {p.issue && (
          <div className="pr-issue">
            <span>⚠️</span>
            <span>{p.issue}</span>
          </div>
        )}
      </div>

      {lightbox !== null && <Lightbox images={screenshots} index={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}

function GanttChart({ planned, acc }) {
  const items = planned?.filter(item => item && typeof item === 'object' && item.start_month) || []
  if (!items.length) return null

  const ST_COLORS = {
    pending: '#64748b', in_progress: '#3b82f6', done: '#22c55e', blocked: '#ef4444',
  }
  const ST_LABELS = {
    pending: 'To Do', in_progress: 'In Progress', done: 'Done', blocked: 'Blocked',
  }

  return (
    <>
      <div className="pr-gantt-wrap">
        <table className="pr-gtbl">
          <thead>
            <tr>
              <th className="pr-gnh" />
              <th className="pr-gst-th" />

              {MONTHS_AZ.map((m, i) => (
                <th key={i}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, ri) => {
              const start =
                Math.min(parseInt(item.start_month, 10), parseInt(item.end_month || item.start_month, 10)) - 1
              const end =
                Math.max(parseInt(item.start_month, 10), parseInt(item.end_month || item.start_month, 10)) - 1
              const barColor = ST_COLORS[item.status] || acc
              const stLabel = ST_LABELS[item.status] || 'To do'

              return (
                <tr key={ri}>
                  <td className="pr-gnd">{item.text}</td>
                  <td className="pr-gst">
                    <span style={{ fontSize: 9, fontWeight: 700, color: barColor, background: barColor + '22', border: `1px solid ${barColor}55`, borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap', display: 'inline-block', letterSpacing: '.02em' }}>{stLabel}</span>
                  </td>
                  {MONTHS_AZ.map((_, mi) => {
                    const inRange = mi >= start && mi <= end
                    const isMsEnd = item.is_milestone && mi === end
                    return (
                      <td key={mi}>
                        <div className="pr-gcl" />
                        {inRange && (
                          <div className="pr-gbar" style={{ background: barColor + '40', border: `1px solid ${barColor}80` }} />
                        )}
                        {isMsEnd && (
                          <>
                            <div className="pr-gms" />
                            {item.milestone_label && <div className="pr-gms-l">{item.milestone_label}</div>}
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
      <div className="pr-gleg">
        {[
          { label: 'To Do',        color: '#64748b' },
          { label: 'In Progress',  color: '#3b82f6' },
          { label: 'Done',         color: '#22c55e' },
          { label: 'Blocked',      color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="pr-gleg-i">
            <div className="pr-gleg-bar" style={{ background: s.color + '40', border: `1px solid ${s.color}80` }} />
            {s.label}
          </div>
        ))}
        <div className="pr-gleg-i">
          <div className="pr-gleg-ms" />
          Milestone
        </div>
      </div>
    </>
  )
}

function Sidebar({ platforms, currentSlide, goToSlide }) {
  return (
    <aside className="pr-sidebar">
      <div className="pr-sb-brand">RP</div>
      <div className="pr-sb-label">Platform</div>

      <div className="pr-dot-nav">
        {platforms.map((p, idx) => {
          const isActive = idx === currentSlide
          const acc = p.color || '#6366f1'

          return (
            <button
              key={p.id || idx}
              className={`pr-nav-icon ${isActive ? 'on' : ''}`}
              data-label={p.name}
              aria-label={p.name}
              onClick={() => goToSlide(idx)}
              style={isActive ? { background: `linear-gradient(135deg, ${acc}, #61c7ff)` } : {}}
            >
              {p.logo_url ? (
                <img
                  src={p.logo_url}
                  alt=""
                  style={{
                    maxWidth: 24,
                    maxHeight: 20,
                    objectFit: 'contain',
                    filter: isActive ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
              ) : (
                <span>{p.short || p.name?.slice(0, 2)}</span>
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)
  const prev = useCallback(() => setCurrent(c => (c - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  return (
    <div className="pr-lb on" onClick={e => e.target === e.currentTarget && onClose()}>
      {images.length > 1 && (
        <button className="pr-lb-nav pr-lb-nav-left" onClick={prev}>
          ‹
        </button>
      )}

      <img className="pr-lb-img" src={images[current]} alt="" />

      {images.length > 1 && (
        <button className="pr-lb-nav pr-lb-nav-right" onClick={next}>
          ›
        </button>
      )}

      <button className="pr-lb-x" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}

function HeroCanvas() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d')
    let animationFrame = null
    let w = 0
    let h = 0
    let t = 0
    let mx = 0.5
    let my = 0.5
    const colors = ['#7c5cff', '#5b7cff', '#46b7ff', '#19c78f', '#a78bfa']

    function resize() {
      w = canvas.width = window.innerWidth
      h = canvas.height = wrap.offsetHeight
    }

    function draw() {
      t += 0.008
      ctx.clearRect(0, 0, w, h)

      const grd = ctx.createLinearGradient(0, 0, 0, h)
      grd.addColorStop(0, '#0d1220')
      grd.addColorStop(0.45, '#111a2d')
      grd.addColorStop(1, '#0d1422')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < 26; i++) {
        const x = w * (i / 26) + Math.sin(t + i) * 40 + (mx / w) * 20
        const y = h * 0.3 + Math.cos(t * 1.2 + i * 0.7) * 120 + (my / h) * 20
        const r = 80 + (i % 5) * 18
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, `${colors[i % colors.length]}38`)
        g.addColorStop(1, `${colors[i % colors.length]}00`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < 80; i++) {
        const x = (Math.sin(i * 19.23 + t * 2.2) * 0.5 + 0.5) * w
        const y = (Math.cos(i * 11.71 + t * 1.5) * 0.5 + 0.5) * h
        const size = 1 + (i % 3)
        ctx.fillStyle = 'rgba(255,255,255,0.18)'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrame = requestAnimationFrame(draw)
    }

    function handleMove(e) {
      mx = e.clientX
      my = e.clientY
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMove)
    resize()
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div ref={wrapRef} className="pr-canvas-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="pr-canvas" />
    </div>
  )
}

function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
        background: #0d1220;
        color: #eef4ff;
        overflow-x: hidden;
      }

      .pr-shell {
        --bg: #0d1220;
        --text: #eef4ff;
        --muted: #a7b7d4;
        --glass: rgba(255,255,255,.08);
        --glass-b: rgba(255,255,255,.14);
        --content: min(1200px,calc(100vw - 120px));
        --sidebar: 92px;
        --purple: #7c5cff;
        --indigo: #5b7cff;
        --blue: #46b7ff;
        --green: #19c78f;
        --amber: #f5a524;
        position: relative;
        min-height: 100vh;
        background: radial-gradient(circle at top right, rgba(124,92,255,.08), transparent 28%), linear-gradient(180deg, #0d1220 0%, #10182a 55%, #0d1422 100%);
        color: var(--text);
      }

   body.pr-light .pr-shell {
  --bg: #eef2ff;
  --text: #0f172a;
  --muted: #50627f;
  --glass: rgba(255,255,255,.72);
  --glass-b: rgba(120,138,170,.18);
  background:
    radial-gradient(circle at top right, rgba(99,102,241,.08), transparent 30%),
    linear-gradient(180deg, #f8fbff 0%, #eef2ff 55%, #e9eefc 100%);
}

      .pr-loading,
      .pr-empty {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 14px;
        text-align: center;
        padding: 40px;
      }

      .pr-empty h2 { margin: 0; font-size: 24px; color: #0f172a; }
      .pr-empty p { margin: 0; color: #6b7280; }

      .pr-spinner {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 3px solid rgba(255,255,255,.18);
        border-top-color: #7c5cff;
        animation: pr-spin .85s linear infinite;
      }

      @keyframes pr-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .pr-canvas-wrap {
        position: absolute;
        inset: 0 0 auto 0;
        height: 110vh;
        min-height: 780px;
        overflow: hidden;
        z-index: 0;
      }

      .pr-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .pr-hero {
        position: relative;
        min-height: 100vh;
        z-index: 2;
        display: flex;
        align-items: center;
      }

      .pr-hero-fade {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(7,9,26,0) 0%, rgba(7,9,26,.12) 35%, rgba(7,9,26,.52) 65%, rgba(7,9,26,.82) 100%);
        z-index: 1;
      }

      .pr-hero-content {
        position: relative;
        z-index: 2;
        min-height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding: 94px 72px 72px calc(var(--sidebar) + 52px);
      }

      .pr-hero-ey {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: rgba(255,255,255,.48);
        margin-bottom: 18px;
        animation: pr-rU .8s .1s ease both;
      }

      .pr-hero-ey-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 10px var(--green);
        animation: pr-gp 2.5s infinite;
      }

      @keyframes pr-gp {
        0%,100% { opacity: 1; transform: scale(1); }
        50% { opacity: .4; transform: scale(.7); }
      }

      .pr-hero-h1 {
        font-size: clamp(52px,8vw,92px);
        font-weight: 700;
        line-height: 1;
        letter-spacing: -.045em;
        color: #fff;
        margin: 0 0 12px;
        animation: pr-rU .9s .25s ease both;
      }

      .pr-hero-h1 .gr {
        background: linear-gradient(110deg,#c4b5fd 0%,#818cf8 45%,#38bdf8 85%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .pr-hero-sub {
        font-size: 16px;
        font-weight: 300;
        color: rgba(255,255,255,.52);
        margin: 0 0 34px;
        letter-spacing: -.01em;
        animation: pr-rU .9s .4s ease both;
      }

      .pr-hero-kpis {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        animation: pr-rU .9s .55s ease both;
      }

      .pr-kpi {
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 14px;
        padding: 18px 24px;
        backdrop-filter: blur(20px);
        min-width: 110px;
        transition: background .25s, transform .25s;
      }

      .pr-kpi:hover {
        background: rgba(255,255,255,.1);
        transform: translateY(-3px);
      }

      .pr-kpi-n {
        font-size: 34px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -.04em;
        color: #fff;
      }

      .pr-kpi-l {
        font-size: 10px;
        color: rgba(255,255,255,.42);
        margin-top: 6px;
        font-weight: 400;
        letter-spacing: .06em;
        text-transform: uppercase;
      }

      @keyframes pr-rU {
        from { opacity: 0; transform: translateY(28px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .pr-sidebar {
        position: fixed;
        left: 14px;
        top: 14px;
        bottom: 14px;
        width: 68px;
        padding: 14px 8px;
        border-radius: 26px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        z-index: 200;
        background: linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.05));
        border: 1px solid var(--glass-b);
        backdrop-filter: blur(28px) saturate(1.45);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.14),0 20px 50px rgba(0,0,5,.18);
      }

      .pr-sb-brand {
        width: 44px;
        height: 44px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 13px;
        background: linear-gradient(135deg,rgba(124,92,255,.95),rgba(54,183,255,.88));
        box-shadow: 0 10px 28px rgba(86,88,214,.25);
        color: #fff;
        flex-shrink: 0;
      }

      .pr-sb-label {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        color: rgba(255,255,255,.46);
        font-size: 10px;
        letter-spacing: .2em;
        text-transform: uppercase;
        margin-top: 6px;
      }

      .pr-dot-nav {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: auto 0;
      }

      .pr-nav-icon {
        width: 40px;
        height: 40px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.08);
        color: #fff;
        cursor: pointer;
        transition: all .28s cubic-bezier(.23,1,.32,1);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
      }

      .pr-nav-icon:hover {
        transform: translateY(-2px) scale(1.06);
        background: rgba(255,255,255,.14);
      }

      .pr-nav-icon::after {
        content: attr(data-label);
        position: absolute;
        left: calc(100% + 12px);
        top: 50%;
        transform: translateY(-50%);
        background: rgba(15,18,40,.9);
        color: #fff;
        font-size: 11px;
        white-space: nowrap;
        padding: 4px 10px;
        border-radius: 8px;
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s;
        border: 1px solid rgba(255,255,255,.1);
      }

      .pr-nav-icon:hover::after { opacity: 1; }
      .pr-nav-icon.on { box-shadow: 0 0 0 4px rgba(255,255,255,.08),0 10px 24px rgba(68,111,255,.22); }

      .pr-topbar {
        position: fixed;
        top: 12px;
        right: 14px;
        z-index: 250;
        margin: 0 14px 0 calc(var(--sidebar) + 26px);
        min-height: 60px;
        padding: 10px 20px;
        border-radius: 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        background: linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.06));
        border: 1px solid var(--glass-b);
        backdrop-filter: blur(28px) saturate(1.5);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.14),0 12px 32px rgba(0,0,10,.14);
      }

      .pr-topbar-brand {
        font-size: 14px;
        font-weight: 600;
        color: var(--text);
        letter-spacing: -.015em;
      }

      .pr-topbar-right {
        display: flex;
        align-items: center;
        gap: 9px;
        flex-wrap: wrap;
      }

      .pr-chip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 14px;
        border-radius: 100px;
        color: rgba(239,244,255,.9);
        font-size: 12px;
        font-weight: 500;
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(255,255,255,.06);
      }

      .pr-chip-btn { cursor: pointer; }

      .pr-chip-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #15c39a;
        box-shadow: 0 0 0 5px rgba(21,195,154,.14);
      }

      .pr-picker-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
      }

      .pr-picker {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 220px;
        z-index: 101;
        background: rgba(15,18,40,.98);
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 18px 42px rgba(0,0,0,.35);
      }

      .pr-picker-item {
        width: 100%;
        border: none;
        background: transparent;
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 11px 16px;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid rgba(255,255,255,.08);
      }

      .pr-picker-item.is-active {
        background: rgba(124,92,255,.18);
      }

      .pr-wrap {
        margin-left: calc(var(--sidebar) + 18px);
        padding: 0 14px;
        position: relative;
        z-index: 2;
      }

      .pr-section {
        padding: 56px 58px 80px;
      }

      .pr-sec-kicker {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: rgba(255,255,255,.4);
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .pr-sec-kicker::before {
        content: '';
        width: 28px;
        height: 1px;
        background: linear-gradient(90deg,rgba(124,92,255,.8),transparent);
      }

      .pr-sec-h2 {
        margin: 0 0 10px;
        font-size: clamp(30px,4vw,48px);
        font-weight: 700;
        letter-spacing: -.04em;
        color: #fff;
        line-height: 1.06;
      }

      .pr-sec-desc {
        margin: 0 0 44px;
        font-size: 15px;
        color: var(--muted);
        font-weight: 300;
        line-height: 1.6;
      }

      .pr-ov-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill,minmax(210px,1fr));
        gap: 12px;
      }

      .pr-ov-card {
        border: none;
        border-radius: 20px;
        padding: 16px 20px 20px;
        cursor: pointer;
        background: linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.05));
        border: 1px solid var(--glass-b);
        backdrop-filter: blur(18px);
        transition: transform .12s linear, box-shadow .12s linear, border-color .12s linear;
        position: relative;
        overflow: hidden;
        color: inherit;
        display: block;
        text-align: left;
      }

      .pr-ov-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 20px 20px 0 0;
        background: var(--ov-accent, linear-gradient(90deg,#16a34a,#22c55e));
      }

      .pr-ov-card:hover {
        transform: translate3d(0,-4px,0) scale(1.018);
        box-shadow: 0 16px 34px rgba(0,0,0,.18);
      }

      .pr-ov-num {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: .08em;
        color: rgba(255,255,255,.22);
        margin-bottom: 18px;
      }

      .pr-ov-logo {
        height: 34px;
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      .pr-ov-logo img {
        max-height: 34px;
        max-width: 116px;
        object-fit: contain;
        object-position: left;
      }

      .pr-ov-name {
        font-size: 15px;
        font-weight: 700;
        color: #fff;
        letter-spacing: -.02em;
        margin-bottom: 10px;
      }

      .pr-ov-tag {
        font-size: 11px;
        color: var(--muted);
        font-weight: 300;
        line-height: 1.55;
        margin-bottom: 18px;
        max-width: 200px;
      }

      .pr-ov-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 12px;
        border-radius: 100px;
        color: #fff;
        background: #129a17;
      }

      .pr-ov-badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #fff;
      }

      .pr-divider {
        height: 1px;
        margin: 0 58px;
        background: linear-gradient(90deg,transparent,rgba(255,255,255,.08) 20%,rgba(255,255,255,.08) 80%,transparent);
      }

      .pr-plat-list {
        display: grid;
        gap: 20px;
      }

      .pr-plat-card {
        border-radius: 28px;
        padding: 28px;
        position: relative;
        overflow: hidden;
        background: linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04));
        border: 1px solid var(--glass-b);
        backdrop-filter: blur(20px);
        color: var(--text);
        transition: transform .34s cubic-bezier(.23,1,.32,1), box-shadow .34s ease, border-color .34s ease;
      }

      .pr-plat-card:hover {
        transform: translateY(-8px) scale(1.012);
        box-shadow: 0 28px 64px rgba(8,15,40,.18);
      }

      .pr-plat-glow {
        position: absolute;
        right: -100px;
        top: -100px;
        width: 350px;
        height: 350px;
        border-radius: 50%;
        filter: blur(60px);
        pointer-events: none;
        opacity: .08;
      }

      .pr-plat-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
        gap: 20px;
        flex-wrap: wrap;
      }

      .pr-plat-head-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .pr-plat-icon {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        flex-shrink: 0;
        border: 1px solid rgba(255,255,255,.1);
      }

      .pr-plat-icon img {
        max-width: 30px;
        max-height: 26px;
        object-fit: contain;
      }

      .pr-plat-name {
        font-size: 24px;
        font-weight: 700;
        color: #fff;
        letter-spacing: -.035em;
        margin-bottom: 3px;
      }

      .pr-plat-tag {
        font-size: 13px;
        color: var(--muted);
        font-weight: 300;
      }

      .pr-plat-nav {
        display: flex;
        gap: 8px;
      }

      .pr-plat-nav button {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 13px;
        background: rgba(255,255,255,.08);
        color: var(--text);
        font-size: 18px;
        cursor: pointer;
      }

      .pr-plat-idx {
        font-size: 72px;
        font-weight: 700;
        letter-spacing: -.06em;
        color: rgba(255,255,255,.04);
        line-height: 1;
        user-select: none;
      }

      .pr-stat-row {
        display: grid;
        gap: 10px;
        margin-bottom: 20px;
      }

      .pr-stat {
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 16px;
        padding: 18px 20px;
      }

      .pr-stat-v {
        font-size: 28px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -.04em;
        margin-bottom: 5px;
      }

      .pr-stat-l {
        font-size: 11px;
        color: rgba(255,255,255,.5);
        font-weight: 400;
        letter-spacing: .04em;
        text-transform: uppercase;
      }

      .pr-cols2 {
        display: grid;
        grid-template-columns: 7fr 3fr;
        gap: 12px;
        margin-bottom: 12px;
        align-items: start;
      }

      .pr-gpanel {
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 20px;
        padding: 22px;
        backdrop-filter: blur(12px);
      }

      .pr-panel-hd {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: .1em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,.07);
      }

      .pr-panel-hd-ico {
        width: 20px;
        height: 20px;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
      }

      .pr-ilist {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .pr-ilist li {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        font-size: 13.5px;
        color: rgba(239,244,255,.82);
        padding: 8px 0;
        line-height: 1.55;
        font-weight: 300;
        border-bottom: 1px solid rgba(255,255,255,.05);
      }

      .pr-ilist li:last-child {
        border-bottom: none;
      }

      .pr-im {
        flex-shrink: 0;
        margin-top: 2px;
        font-size: 10px;
        font-weight: 700;
      }

      .pr-empty-txt {
        font-size: 13px;
        color: rgba(255,255,255,.32);
        font-style: italic;
        padding: 6px 0;
      }

      .pr-gantt-wrap {
        overflow-x: hidden;
        margin-top: 4px;
      }

      .pr-gtbl {
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
      }

      @media (max-width: 640px) {
  .pr-gantt-wrap {
    overflow-x: auto;
  }

  .pr-gtbl {
    min-width: 760px;
    table-layout: auto;
  }
}

      .pr-gtbl th {
        font-size: 10px;
        font-weight: 600;
        color: rgba(255,255,255,.62);
        text-align: center;
        padding-bottom: 10px;
        min-width: 34px;
      }

      .pr-gnh {
        min-width: 340px;
        width: 340px;
        text-align: left !important;
      }

      .pr-gtbl td {
        height: 42px;
        position: relative;
        vertical-align: top;
      }

      .pr-gst {
        width: 88px;
        min-width: 88px;
        padding-right: 10px;
        vertical-align: middle;
      }

      .pr-gst-th {
        width: 88px;
        min-width: 88px;
      }

      .pr-gnd {
        font-size: 12px;
        line-height: 1.35;
        color: rgba(239,244,255,.76);
        font-weight: 300;
        padding-right: 12px;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
        min-width: 340px;
        width: 340px;
        max-width: none;
      }

      .pr-gcl {
        position: absolute;
        right: 0;
        top: 3px;
        bottom: 3px;
        width: 1px;
        background: rgba(255,255,255,.05);
      }

      .pr-gbar {
        position: absolute;
        left: 2px;
        right: 2px;
        top: 50%;
        height: 9px;
        border-radius: 3px;
        transform: translateY(-50%);
      }

      .pr-gms {
        position: absolute;
        right: -0px;
        top: 50%;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: var(--amber);
        transform: translateY(-50%) rotate(45deg);
        z-index: 2;
        box-shadow: 0 0 8px rgba(245,165,36,.5);
      }

      .pr-gms-l {
        position: absolute;
        right: 0;
        bottom: calc(50% + 9px);
        font-size: 10px;
        font-weight: 600;
        color: var(--amber);
        white-space: nowrap;
        z-index: 3;
      }

      .pr-gleg {
        display: flex;
        gap: 18px;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,.06);
      }

      .pr-gleg-i {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: rgba(255,255,255,.42);
      }

      .pr-gleg-bar {
        width: 18px;
        height: 7px;
        border-radius: 2px;
      }

      .pr-gleg-ms {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: var(--amber);
        transform: rotate(45deg);
        flex-shrink: 0;
      }

      .pr-ss-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill,minmax(130px,1fr));
        gap: 10px;
        margin-top: 4px;
      }

      .pr-shot-panel {
        min-height: 100%;
      }

      .pr-ss-thumb {
        aspect-ratio: 16 / 10;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.1);
        cursor: pointer;
        transition: transform .25s, box-shadow .25s, border-color .25s;
        background: transparent;
        padding: 0;
      }

      .pr-ss-thumb:hover {
        transform: scale(1.04);
        box-shadow: 0 16px 40px rgba(0,0,0,.35);
        border-color: rgba(255,255,255,.25);
      }

      .pr-ss-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .pr-empty-shot {
        min-height: 180px;
      }

      .pr-issue {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        background: rgba(245,165,36,.07);
        border: 1px solid rgba(245,165,36,.2);
        border-radius: 14px;
        padding: 13px 16px;
        font-size: 13px;
        color: rgba(245,165,36,.9);
        margin-top: 12px;
        line-height: 1.55;
      }

      .pr-lb {
        display: flex;
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0,0,0,.82);
        backdrop-filter: blur(18px);
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .pr-lb-img {
        max-width: 88vw;
        max-height: 84vh;
        object-fit: contain;
        border-radius: 14px;
      }

      .pr-lb-x,
      .pr-lb-nav {
        position: fixed;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: rgba(255,255,255,.12);
        border: 1px solid rgba(255,255,255,.15);
        color: #fff;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pr-lb-x { top: 20px; right: 20px; }
      .pr-lb-nav-left { left: 20px; }
      .pr-lb-nav-right { right: 20px; }

      .pr-footer {
        margin: 0 14px 14px calc(var(--sidebar) + 26px);
        padding: 24px 28px;
        border-radius: 22px;
        background: linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04));
        border: 1px solid var(--glass-b);
        backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        position: relative;
        z-index: 2;
      }

      .pr-footer-brand {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -.03em;
        color: #fff;
      }

      .pr-footer-meta {
        font-size: 12px;
        color: rgba(255,255,255,.34);
        text-align: right;
        line-height: 1.8;
        font-weight: 300;
      }

      .pr-rv {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity .65s ease, transform .65s ease;
      }

      .pr-rv-in {
        opacity: 1;
        transform: translateY(0);
      }

      body.pr-light .pr-topbar,
      body.pr-light .pr-sidebar,
      body.pr-light .pr-ov-card,
      body.pr-light .pr-plat-card,
      body.pr-light .pr-gpanel,
      body.pr-light .pr-stat,
      body.pr-light .pr-kpi,
      body.pr-light .pr-chip,
      body.pr-light .pr-footer {
        background: linear-gradient(180deg,rgba(255,255,255,.88),rgba(255,255,255,.72));
        border-color: rgba(148,163,184,.2);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7),0 14px 36px rgba(148,163,184,.12);
      }

      body.pr-light .pr-topbar-brand,
      body.pr-light .pr-sec-h2,
      body.pr-light .pr-plat-name,
      body.pr-light .pr-footer-brand,
      body.pr-light .pr-ov-name,
      body.pr-light .pr-kpi-n {
        color: #0f172a;
      }

      body.pr-light .pr-sec-desc,
      body.pr-light .pr-ov-tag,
      body.pr-light .pr-plat-tag,
      body.pr-light .pr-footer-meta,
      body.pr-light .pr-kpi-l,
      body.pr-light .pr-stat-l,
      body.pr-light .pr-ilist li,
      body.pr-light .pr-gleg-i,
      body.pr-light .pr-sb-label,
      body.pr-light .pr-chip,
      body.pr-light .pr-sec-kicker,
      body.pr-light .pr-gnd {
        color: #5b6b87;
      }

      body.pr-light .pr-plat-card {
        color: #0f172a;
      }

      body.pr-light .pr-ov-num,
      body.pr-light .pr-plat-idx {
        color: rgba(15,23,42,.08);
      }

      body.pr-light .pr-divider {
        background: linear-gradient(90deg,transparent,rgba(148,163,184,.18) 20%,rgba(148,163,184,.18) 80%,transparent);
      }

      body.pr-light .pr-gcl {
        background: rgba(148,163,184,.16);
      }

      body.pr-light .pr-ilist li {
        border-bottom: 1px solid rgba(148,163,184,.14);
      }

      body.pr-light .pr-panel-hd {
        border-bottom: 1px solid rgba(148,163,184,.16);
      }

      body.pr-light .pr-nav-icon {
        color: #1e293b;
        background: rgba(255,255,255,.9);
        border-color: rgba(148,163,184,.28);
      }

      body.pr-light .pr-gtbl th {
        color: #64748b;
      }

      body.pr-light .pr-issue {
        background: #fef2f2;
        border-color: #fecaca;
        color: #b91c1c;
      }

      @media (max-width: 900px) {
        .pr-sidebar { display: none; }
        .pr-topbar { margin-left: 14px; right: 14px; }
        .pr-wrap { margin-left: 0; }
        .pr-footer { margin-left: 14px; }
        .pr-cols2 { grid-template-columns: 1fr; }
        .pr-section { padding: 60px 24px; }
        .pr-divider { margin: 0 24px; }
        .pr-hero-content { padding: 84px 24px 56px; }
      }

      @media (max-width: 640px) {
        .pr-topbar {
          padding: 10px 14px;
          gap: 10px;
        }

        .pr-topbar-brand {
          display: none;
        }

        .pr-hero-kpis {
          gap: 8px;
        }

        .pr-kpi {
          min-width: calc(50% - 8px);
          flex: 1 1 calc(50% - 8px);
        }

        .pr-stat-row {
          grid-template-columns: repeat(2,1fr) !important;
        }

        .pr-ss-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  )
}
