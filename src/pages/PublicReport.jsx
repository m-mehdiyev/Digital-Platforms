import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'

const MONTHS_AZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']

export default function PublicReport() {
  const [reports, setReports] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [snapOn, setSnapOn] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const platRef = useRef(null)
  const isAutoScrolling = useRef(false)

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    function handleScroll() {
      if (isAutoScrolling.current) return

      const cont = platRef.current
      if (!cont) return

      const slides = cont.querySelectorAll('.pslide')
      slides.forEach((slide, i) => {
        const rect = slide.getBoundingClientRect()
        if (rect.top >= -80 && rect.top < window.innerHeight * 0.45) {
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

    const navOffset = 76
    const y = target.getBoundingClientRect().top + window.scrollY - navOffset

    isAutoScrolling.current = true

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    })

    window.setTimeout(() => {
      setCurrentSlide(idx)
      isAutoScrolling.current = false
    }, 700)
  }

  function toggleSnap() {
    setSnapOn((prev) => {
      const next = !prev
      if (platRef.current) {
        platRef.current.style.scrollSnapType = next ? 'y proximity' : 'none'
      }
      return next
    })
  }

  function switchReport(nextReport) {
    setReport(nextReport)
    setCurrentSlide(0)
    setShowPicker(false)

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          background: 'linear-gradient(160deg,#f8f9ff,#eef2ff)'
        }}
      >
        <div className="spinner" />
        <p style={{ fontSize: 15, color: '#6b7280' }}>Hesabat yüklənir...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'center',
          padding: 40
        }}
      >
        <div style={{ fontSize: 48 }}>📊</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Hesabat mövcud deyil</h2>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          Admin tərəfindən hələ heç bir hesabat yayımlanmayıb.
        </p>
      </div>
    )
  }

  const rd = report.report_data || {}
  const platforms = rd?.platforms || []
  const period = rd?.period || report.period_label

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#f8fafc' }}>
      <div className="orbs">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>

      <CursorGlow />
      <ProgressBar />
      <Sidebar
        platforms={platforms}
        currentSlide={currentSlide}
        goToSlide={goToSlide}
        className="pub-sidebar"
      />

      <nav
        className="pub-nav"
        style={{
          position: 'fixed',
          top: 3,
          left: 72,
          right: 0,
          zIndex: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          height: 64,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
          boxShadow: '0 2px 24px rgba(60,60,120,0.08)'
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Rəqəmsal Platformalar</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleSnap}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: snapOn ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.04)',
              border: `1.5px solid ${snapOn ? 'rgba(99,102,241,0.2)' : '#e5e7eb'}`,
              borderRadius: 100,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: snapOn ? '#6366f1' : '#9ca3af',
              cursor: 'pointer',
              transition: 'all .22s'
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: snapOn ? '#6366f1' : '#d1d5db',
                flexShrink: 0
              }}
            />
            Snap: {snapOn ? 'ON' : 'OFF'}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPicker((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                background: 'rgba(99,102,241,0.1)',
                color: '#6366f1',
                padding: '5px 14px',
                borderRadius: 100,
                border: '1.5px solid rgba(99,102,241,0.2)',
                cursor: 'pointer'
              }}
            >
              📅 {period} <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
            </button>

            {showPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#fff',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,.15)',
                  border: '1.5px solid rgba(99,102,241,.1)',
                  minWidth: 220,
                  zIndex: 100,
                  overflow: 'hidden'
                }}
              >
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => switchReport(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: r.id === report.id ? '#6366f1' : '#374151',
                      background: r.id === report.id ? 'rgba(99,102,241,0.06)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderBottom: '1px solid #f1f3f9'
                    }}
                  >
                    <span>{r.period_label}</span>
                    {r.id === report.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showPicker && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setShowPicker(false)}
            />
          )}

          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {report.published_at ? new Date(report.published_at).toLocaleDateString('az') : ''}
          </span>
        </div>
      </nav>

      <div className="pub-content" style={{ marginLeft: 72, position: 'relative', zIndex: 2 }}>
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '100px 6vw 60px',
            background: 'linear-gradient(160deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                width: 700,
                height: 700,
                borderRadius: '50%',
                filter: 'blur(80px)',
                background: 'rgba(99,102,241,.35)',
                top: -200,
                right: -150,
                animation: 'orbDrift 12s ease-in-out infinite alternate'
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 500,
                height: 500,
                borderRadius: '50%',
                filter: 'blur(80px)',
                background: 'rgba(139,92,246,.25)',
                bottom: -100,
                left: -80,
                animation: 'orbDrift 12s ease-in-out infinite alternate',
                animationDelay: '-5s'
              }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(196,181,253,.9)', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', animation: 'ep 2s infinite', display: 'inline-block' }} />
              {period}
            </div>

            <h1 style={{ fontSize: 'clamp(52px,7vw,96px)', fontWeight: 700, lineHeight: 1, color: '#fff', letterSpacing: '-.025em', marginBottom: 16 }}>
              Rəqəmsal
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg,#c4b5fd,#a78bfa,#818cf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Platformalar
              </span>
            </h1>

            <p style={{ fontSize: 16, color: 'rgba(196,181,253,.75)', maxWidth: 560, lineHeight: 1.7, marginBottom: 52 }}>
              Rəqəmsal Platformaların İdarəolunması Şöbəsi
              <br />
              Hesabat dövrü: {period}
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { n: platforms.length, l: 'Platforma' },
                { n: platforms.reduce((s, p) => s + (p.done?.length || 0), 0), l: 'Görülən İş' },
                { n: report.year || '2026', l: rd?.quarter || 'Dövr' },
                { n: platforms.filter((p) => p.screenshots?.length > 0).length, l: 'Ekran Görüntüsü' }
              ].map((k, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,.07)',
                    border: '1px solid rgba(255,255,255,.12)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: 18,
                    padding: '20px 26px',
                    minWidth: 120,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)' }} />
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{k.n}</div>
                  <div style={{ fontSize: 11, color: 'rgba(196,181,253,.7)' }}>{k.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              animation: 'sh 2.5s infinite'
            }}
            onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,.5)' }}>
              ↓
            </div>
            <span style={{ fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
              Aşağı
            </span>
          </div>
        </section>

        <section id="overview" style={{ background: 'linear-gradient(160deg,#f5f6ff,#eef0ff)', padding: '72px 6vw' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 10 }}>
            — Platforma Ekosistemi
          </div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em', marginBottom: 8 }}>
            Bütün Platformalar
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 36 }}>
            Platforma üzərinə klik edərək ətraflı hesabata keçin
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
            {platforms.map((p, idx) => (
              <OvCard key={p.id || idx} p={p} idx={idx} goToSlide={goToSlide} />
            ))}
          </div>
        </section>

        <div
          id="platforms"
          ref={platRef}
          style={{
            position: 'relative',
            padding: '24px 6vw 56px',
            scrollSnapType: snapOn ? 'y proximity' : 'none'
          }}
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

        <footer
          style={{
            background: 'linear-gradient(135deg,#0f0c29,#1e1b4b)',
            color: 'rgba(255,255,255,.6)',
            padding: '40px 6vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>IRIA</div>
          <div style={{ fontSize: 12, textAlign: 'right', lineHeight: 1.6 }}>
            Rəqəmsal Platformalar · {period}
            <br />
            Rəqəmsal Platformaların İdarəolunması Şöbəsi
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes orbDrift {0% {transform: translate(0,0) scale(1)} 100% {transform: translate(35px,50px) scale(1.1)}}
        @keyframes ep {0%,100% {opacity:1; transform: scale(1)} 50% {opacity:.4; transform: scale(.7)}}
        @keyframes sh {0%,100% {transform: translateX(-50%) translateY(0)} 50% {transform: translateX(-50%) translateY(-6px)}}
        @keyframes lbIn {from {opacity:0; transform: scale(.96)} to {opacity:1; transform: scale(1)}}
        @keyframes imgIn {from {opacity:0; transform: scale(.98)} to {opacity:1; transform: scale(1)}}
        @keyframes spin {from {transform: rotate(0deg)} to {transform: rotate(360deg)}}
        @keyframes progress {from {transform: scaleX(0)} to {transform: scaleX(1)}}

        .spinner {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 3px solid rgba(99,102,241,0.15);
          border-top-color: #6366f1;
          animation: spin .8s linear infinite;
        }

        .glass-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(18px);
          border-radius: 24px;
          box-shadow: 0 16px 48px rgba(15,23,42,0.08);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (max-width: 640px) {
          .pub-sidebar { display: none !important; }
          .pub-content { margin-left: 0 !important; }
          .pub-nav { left: 0 !important; padding: 0 14px !important; }
          .pslide { padding: 12px 14px 36px !important; }
          .mobile-col { flex-direction: column !important; }
          .mobile-grid-1 { grid-template-columns: 1fr !important; }
          .mobile-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}

function OvCard({ p, idx, goToSlide }) {
  const acc = p.color || '#6366f1'
  const [hov, setHov] = useState(false)

  return (
    <button
      onClick={() => goToSlide(idx)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="glass-card"
      style={{
        padding: '28px 22px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 14,
        border: '1.5px solid rgba(255,255,255,0.9)',
        borderTop: `4px solid ${acc}`,
        background: 'rgba(255,255,255,.74)',
        width: '100%',
        textAlign: 'left',
        transition: 'all .32s cubic-bezier(.23,1,.32,1)',
        transform: hov ? 'translateY(-6px) scale(1.02)' : 'none',
        boxShadow: hov ? `0 20px 48px ${acc}22` : '0 14px 34px rgba(15,23,42,.06)'
      }}
    >
      <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
        {p.logo_url ? (
          <img
            src={p.logo_url}
            alt={p.name}
            style={{ maxHeight: 48, maxWidth: 160, objectFit: 'contain', objectPosition: 'left' }}
          />
        ) : (
          <b style={{ fontSize: 16, color: acc }}>{p.name}</b>
        )}
      </div>

      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }} className="line-clamp-3">
        {p.tagline || 'Platforma haqqında qısa məlumat'}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '5px 14px',
          borderRadius: 100,
          background: acc,
          color: '#fff',
          marginTop: 'auto',
          letterSpacing: '.02em'
        }}
      >
        {p.done?.length || 0} iş tamamlandı{p.screenshots?.length ? ' 📷' : ''}
      </div>
    </button>
  )
}

function GanttChart({ planned, acc }) {
  const items = planned?.filter((i) => i && typeof i === 'object' && i.start_month) || []
  if (!items.length) return null

  return (
    <div className="glass-card" style={{ padding: '14px 18px', marginTop: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: acc, marginBottom: 12 }}>
        📅 İş Planı
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ width: 140, minWidth: 100 }} />
              {MONTHS_AZ.map((m, i) => (
                <th
                  key={i}
                  style={{
                    fontSize: 9,
                    color: '#9ca3af',
                    fontWeight: 500,
                    textAlign: 'center',
                    paddingBottom: 4,
                    minWidth: 34
                  }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item, ri) => {
              const start = parseInt(item.start_month, 10)
              const end = parseInt(item.end_month || item.start_month, 10)
              const milestone = parseInt(item.milestone_month || end, 10)

              return (
                <tr key={ri}>
                  <td style={{ fontSize: 11, fontWeight: 600, color: '#334155', padding: '10px 10px 10px 0', whiteSpace: 'nowrap' }}>
                    {item.text || item.label || `İş ${ri + 1}`}
                  </td>

                  {MONTHS_AZ.map((_, mi) => {
                    const monthIndex = mi + 1
                    const active = monthIndex >= start && monthIndex <= end
                    const isMilestone = monthIndex === milestone && item.milestone_month

                    return (
                      <td key={mi} style={{ height: 26, position: 'relative', textAlign: 'center' }}>
                        {active && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 2,
                              right: 2,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              height: 10,
                              borderRadius: 999,
                              background: '#888780',
                              opacity: 0.6
                            }}
                          />
                        )}

                        {isMilestone && (
                          <>
                            <div
                              style={{
                                position: 'absolute',
                                right: -5,
                                top: '50%',
                                width: 9,
                                height: 9,
                                background: '#D85A30',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 3
                              }}
                            />

                            {item.milestone_label && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: -10,
                                  top: '50%',
                                  transform: 'translate(-10%, -170%)',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: '#D85A30',
                                  whiteSpace: 'nowrap',
                                  lineHeight: 1,
                                  zIndex: 3
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

      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <div style={{ width: 16, height: 9, borderRadius: 2, background: '#888780', opacity: 0.6 }} />
          Planlaşdırılan
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <div style={{ width: 9, height: 9, background: '#D85A30', transform: 'rotate(45deg)', flexShrink: 0 }} />
          Milestone
        </div>
      </div>
    </div>
  )
}

function PlatformSlide({ p, idx, total, goToSlide }) {
  const [lightbox, setLightbox] = useState(null)
  const [visible, setVisible] = useState(false)
  const cardRef = useRef(null)

  const done = p.done || []
  const rawPlanned = [
    ...(Array.isArray(p.planned) ? p.planned : []),
    ...(Array.isArray(p.plan_month) ? p.plan_month : []),
    ...(Array.isArray(p.plan_quarter) ? p.plan_quarter : []),
    ...(Array.isArray(p.plan_year) ? p.plan_year : [])
  ]
  const plannedObjects = rawPlanned.map((i) => (typeof i === 'string' ? { text: i } : i))
  const plannedTexts = plannedObjects.map((i) => i?.text || i?.label || '')
  const hasGantt = plannedObjects.some((i) => i?.start_month)
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
        className="pslide"
        id={p.id || `platform-${idx}`}
        data-idx={idx}
        style={{
          minHeight: 560,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '24px 28px',
          marginBottom: 24,
          position: 'relative',
          background: 'linear-gradient(160deg, rgba(248,249,255,0.94), rgba(255,255,255,0.9))',
          border: '1px solid rgba(255,255,255,0.9)',
          borderRadius: 32,
          boxShadow: visible ? '0 22px 60px rgba(15,23,42,.08)' : '0 8px 24px rgba(15,23,42,.04)',
          scrollSnapAlign: 'start',
          overflow: 'hidden',
          transition: 'all .45s ease'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at top right, ${acc}16, transparent 34%)`,
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 54, height: 54, borderRadius: 18, background: `${acc}15`, border: `1px solid ${acc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.name} style={{ maxWidth: '72%', maxHeight: '72%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 20, fontWeight: 700, color: acc }}>{(p.name || '?').slice(0, 1)}</span>
              )}
            </div>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: acc, marginBottom: 6 }}>
                <span>{String(idx + 1).padStart(2, '0')}</span>
                <span style={{ opacity: 0.45 }}>/</span>
                <span>{String(total).padStart(2, '0')}</span>
              </div>
              <h3 style={{ fontSize: 'clamp(24px,3vw,34px)', lineHeight: 1.1, color: '#0f172a', margin: 0, fontWeight: 700 }}>
                {p.name}
              </h3>
              {p.tagline && <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748b' }}>{p.tagline}</p>}
            </div>
          </div>

          <button
            onClick={() => goToSlide(Math.min(idx + 1, total - 1))}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '1px solid rgba(148,163,184,.25)',
              background: '#fff',
              color: '#334155',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Növbəti"
          >
            →
          </button>
        </div>

        {stats.length > 0 && (
          <div className="mobile-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 18, position: 'relative', zIndex: 2 }}>
            {stats.map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: '16px 14px', border: '1px solid rgba(255,255,255,.85)' }}>
                <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{s.value ?? s.n ?? '-'}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.label || s.l || 'Göstərici'}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mobile-col" style={{ display: 'flex', gap: 18, alignItems: 'stretch', position: 'relative', zIndex: 2 }}>
          <div style={{ flex: 1.15, display: 'grid', gap: 18 }}>
            <InfoBlock title="Görülən işlər" accent={acc} items={done} emptyText="Bu bölmə üzrə qeyd yoxdur" icon="✓" />

            <div style={{ display: 'grid', gap: 18 }}>
              {hasGantt ? (
                <GanttChart planned={plannedObjects} acc={acc} />
              ) : (
                <InfoBlock title="Planlaşdırılan işlər" accent={acc} items={plannedTexts.filter(Boolean)} emptyText="Plan məlumatı yoxdur" icon="⏳" />
              )}
            </div>
          </div>

          <div style={{ flex: 0.95, display: 'grid', gap: 18 }}>
            {screenshots.length > 0 ? (
              <div className="glass-card" style={{ padding: 18, border: '1px solid rgba(255,255,255,.85)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: acc }}>
                    🖼️ Ekran görüntüləri
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{screenshots.length} fayl</div>
                </div>

                <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: screenshots.length > 1 ? 'repeat(2,1fr)' : '1fr', gap: 12 }}>
                  {screenshots.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(i)}
                      style={{
                        padding: 0,
                        border: 'none',
                        background: '#fff',
                        cursor: 'pointer',
                        borderRadius: 18,
                        overflow: 'hidden',
                        boxShadow: '0 10px 28px rgba(15,23,42,.08)'
                      }}
                    >
                      <img
                        src={src}
                        alt={`${p.name} screenshot ${i + 1}`}
                        style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 22, minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', border: '1px solid rgba(255,255,255,.85)' }}>
                Bu platforma üçün ekran görüntüsü əlavə edilməyib
              </div>
            )}
          </div>
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox
          images={screenshots}
          index={lightbox}
          onClose={() => setLightbox(null)}
          accentColor={acc}
        />
      )}
    </>
  )
}

function InfoBlock({ title, accent, items, emptyText, icon }) {
  return (
    <div className="glass-card" style={{ padding: 18, border: '1px solid rgba(255,255,255,.85)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        {icon} {title}
      </div>

      {items?.length ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 16, background: '#fff', border: '1px solid rgba(148,163,184,.12)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: 6, flexShrink: 0 }} />
              <div style={{ fontSize: 14, lineHeight: 1.55, color: '#334155' }}>{typeof item === 'string' ? item : item?.text || item?.label || '—'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: '#94a3b8' }}>{emptyText}</div>
      )}
    </div>
  )
}

function Sidebar({ platforms, currentSlide, goToSlide, className = '' }) {
  return (
    <aside
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 72,
        zIndex: 700,
        background: 'rgba(15,23,42,.88)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 10px'
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, marginBottom: 18 }}>
        RP
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center', overflowY: 'auto', paddingBottom: 10 }}>
        {platforms.map((p, idx) => {
          const active = idx === currentSlide
          const acc = p.color || '#6366f1'

          return (
            <button
              key={p.id || idx}
              onClick={() => goToSlide(idx)}
              title={p.name}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: active ? `1.5px solid ${acc}` : '1px solid rgba(255,255,255,.08)',
                background: active ? `${acc}20` : 'rgba(255,255,255,.03)',
                color: active ? '#fff' : 'rgba(255,255,255,.65)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                transition: 'all .25s ease',
                overflow: 'hidden'
              }}
            >
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.name} style={{ width: '68%', height: '68%', objectFit: 'contain' }} />
              ) : (
                (p.name || '?').slice(0, 2).toUpperCase()
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function ProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999, background: 'rgba(255,255,255,.08)' }}>
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#22c55e)',
          transition: 'width .1s linear'
        }}
      />
    </div>
  )
}

function CursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 })

  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x - 180,
        top: pos.y - 180,
        width: 360,
        height: 360,
        borderRadius: '50%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, rgba(99,102,241,.06) 28%, transparent 70%)',
        filter: 'blur(8px)',
        zIndex: 1,
        transition: 'left .08s linear, top .08s linear'
      }}
    />
  )
}

function Lightbox({ images, index, onClose, accentColor }) {
  const [current, setCurrent] = useState(index)
  const acc = accentColor || '#6366f1'

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length])

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', fn)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10,10,20,0.93)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'lbIn .22s ease'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        ✕
      </button>

      {images.length > 1 && (
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', fontSize: 13, color: 'rgba(255,255,255,.85)', fontWeight: 600, letterSpacing: '.05em' }}>
          {current + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && (
        <button
          onClick={prev}
          style={{
            position: 'absolute',
            left: 20,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 26,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ‹
        </button>
      )}

      <img
        key={current}
        src={images[current]}
        alt=""
        style={{
          maxWidth: '85vw',
          maxHeight: '80vh',
          objectFit: 'contain',
          borderRadius: 16,
          boxShadow: '0 32px 80px rgba(0,0,0,.6)',
          animation: 'imgIn .22s ease'
        }}
      />

      {images.length > 1 && (
        <button
          onClick={next}
          style={{
            position: 'absolute',
            right: 20,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: acc,
            border: `1.5px solid ${acc}`,
            color: '#fff',
            fontSize: 26,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ›
        </button>
      )}
    </div>
  )
}
