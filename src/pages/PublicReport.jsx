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
          <h2 style={{ fontSize: 'clamp
