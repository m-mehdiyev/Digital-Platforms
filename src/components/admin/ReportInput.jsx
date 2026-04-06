import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

const PLAN_GROUPS = {
  next_month: 'next_month',
  year_end: 'year_end',
}

function makeLocalId(seed = '') {
  return seed || `plan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function createPlannedItem(group, text = '', seed = '') {
  return {
    local_id: makeLocalId(seed),
    text,
    plan_group: group,
  }
}

function normalizePlannedItems(items = []) {
  const normalized = (items || []).map(item => {
    const group = item?.plan_group || item?.type || item?.plan_type || PLAN_GROUPS.next_month
    const normalizedGroup = group === 'year' ? PLAN_GROUPS.year_end : group === 'month' ? PLAN_GROUPS.next_month : group
    return createPlannedItem(normalizedGroup, item?.text || '', item?.local_id || item?.id)
  })

  const byNextMonth = normalized.filter(item => item.plan_group === PLAN_GROUPS.next_month)
  const byYearEnd = normalized.filter(item => item.plan_group === PLAN_GROUPS.year_end)

  return [
    ...(byNextMonth.length ? byNextMonth : [createPlannedItem(PLAN_GROUPS.next_month)]),
    ...(byYearEnd.length ? byYearEnd : [createPlannedItem(PLAN_GROUPS.year_end)]),
  ]
}

function PlannedSection({ label, items, onUpdate, onRemove, onAdd }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, paddingBottom: 6, borderBottom: '1.5px solid rgba(99,102,241,0.12)' }}>
        {label}
      </div>
      {items.map((item, index) => (
        <div key={item.local_id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            value={item.text}
            onChange={e => onUpdate(item.local_id, e.target.value)}
            placeholder={`İş ${index + 1}`}
          />
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(item.local_id)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
        <Plus size={12} /> Əlavə et
      </button>
    </div>
  )
}

export function PlannedEditor({ items, onChange }) {
  const normalizedItems = normalizePlannedItems(items)
  const byNextMonth = normalizedItems.filter(item => item.plan_group === PLAN_GROUPS.next_month)
  const byYearEnd = normalizedItems.filter(item => item.plan_group === PLAN_GROUPS.year_end)

  function updateItem(localId, value) {
    onChange(normalizedItems.map(item => item.local_id === localId ? { ...item, text: value } : item))
  }

  function addItem(group) {
    onChange([...normalizedItems, createPlannedItem(group)])
  }

  function removeItem(localId) {
    const target = normalizedItems.find(item => item.local_id === localId)
    if (!target) return

    const remaining = normalizedItems.filter(item => item.local_id !== localId)
    const sameGroup = remaining.filter(item => item.plan_group === target.plan_group)

    if (sameGroup.length === 0) {
      remaining.push(createPlannedItem(target.plan_group))
    }

    onChange(normalizePlannedItems(remaining))
  }

  return (
    <div>
      <PlannedSection
        label="Növbəti ay görüləcək işlər"
        items={byNextMonth}
        onUpdate={updateItem}
        onRemove={removeItem}
        onAdd={() => addItem(PLAN_GROUPS.next_month)}
      />
      <PlannedSection
        label="İlin sonunadək görüləcək işlər"
        items={byYearEnd}
        onUpdate={updateItem}
        onRemove={removeItem}
        onAdd={() => addItem(PLAN_GROUPS.year_end)}
      />
    </div>
  )
}

export function rowToForm(row) {
  const planGroup = row.plan_group || (row.plan_type === 'year' ? PLAN_GROUPS.year_end : PLAN_GROUPS.next_month)
  return createPlannedItem(planGroup, row.text || '', row.id)
}

export function formToRow(item, periodId, idx) {
  const planGroup = item.plan_group || PLAN_GROUPS.next_month
  return {
    period_id: periodId,
    text: item.text,
    plan_group: planGroup,
    plan_type: planGroup === PLAN_GROUPS.year_end ? 'year' : 'month',
    order_index: idx,
  }
}

async function buildDraftPayload(periodLabel, platforms, currentPlatformId, currentPlatformData = null) {
  const result = { period: periodLabel, generatedAt: new Date().toISOString(), platforms: [] }

  for (const plat of platforms) {
    if (plat.id === currentPlatformId && currentPlatformData) {
      result.platforms.push({
        id: plat.id,
        name: plat.name,
        tagline: plat.tagline,
        color: plat.color,
        logo_url: plat.logo_url,
        done: currentPlatformData.done || [],
        planned_items: currentPlatformData.planned_items || [],
        stats: currentPlatformData.stats || [],
        screenshots: currentPlatformData.screenshots || [],
        issue: currentPlatformData.issue || '',
      })
      continue
    }

    const { data: rep } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', plat.id)
      .eq('period_label', periodLabel)
      .maybeSingle()

    result.platforms.push({
      id: plat.id,
      name: plat.name,
      tagline: plat.tagline,
      color: plat.color,
      logo_url: plat.logo_url,
      done: rep?.completed_items?.sort((a, b) => a.order_index - b.order_index).map(i => i.text) || [],
      planned_items: rep?.planned_items?.sort((a, b) => a.order_index - b.order_index).map(rowToForm) || [],
      stats: rep?.statistics?.sort((a, b) => a.order_index - b.order_index).map(s => ({ v: s.value, l: s.label })) || [],
      screenshots: rep?.attachments?.filter(a => a.file_type === 'screenshot').map(a => a.file_url) || [],
      issue: rep?.issue_text || '',
    })
  }

  return result
}

export default function ReportInput({ platformId, isSuperAdmin }) {
  const [platforms, setPlatforms] = useState([])
  const [selPlatId, setSelPlatId] = useState(platformId || '')
  const [period, setPeriod] = useState('')
  const [periodId, setPeriodId] = useState(null)

  const [done, setDone] = useState([''])
  const [planned, setPlanned] = useState(normalizePlannedItems([]))
  const [kpis, setKpis] = useState([{ label: '', value: '' }])
  const [issue, setIssue] = useState('')
  const [screenshots, setScreenshots] = useState([])

  const [saving, setSaving] = useState(false)
  const [loadingD, setLoadingD] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => { loadPlatforms() }, [])
  useEffect(() => { if (selPlatId && period) loadExisting() }, [selPlatId, period])

  async function loadPlatforms() {
    const { data, error } = await supabase.from('platforms').select('*').order('order_index')
    if (error) {
      showErr('Platformalar yüklənmədi: ' + error.message)
      return
    }
    setPlatforms(data || [])
    if (!platformId && data?.[0]) setSelPlatId(data[0].id)
  }

  async function loadExisting() {
    setLoadingD(true)
    setErrors([])

    const { data, error } = await supabase
      .from('report_periods')
      .select('*, completed_items(*), planned_items(*), statistics(*), attachments(*)')
      .eq('platform_id', selPlatId)
      .eq('period_label', period)
      .maybeSingle()

    if (error) {
      showErr('Məlumat yüklənərkən xəta: ' + error.message)
      setLoadingD(false)
      return
    }

    if (data) {
      setPeriodId(data.id)
      setDone(data.completed_items?.sort((a, b) => a.order_index - b.order_index).map(i => i.text) || [''])
      setPlanned(normalizePlannedItems(data.planned_items?.sort((a, b) => a.order_index - b.order_index).map(rowToForm) || []))
      setKpis(data.statistics?.sort((a, b) => a.order_index - b.order_index).map(s => ({ label: s.label, value: s.value })) || [{ label: '', value: '' }])
      setScreenshots(data.attachments?.map(a => ({ url: a.file_url, name: a.file_name })) || [])
      setIssue(data.issue_text || '')
      toast('Mövcud məlumatlar yükləndi', { icon: 'ℹ️' })
    } else {
      setPeriodId(null)
      setDone([''])
      setPlanned(normalizePlannedItems([]))
      setKpis([{ label: '', value: '' }])
      setScreenshots([])
      setIssue('')
    }

    setLoadingD(false)
  }

  function showErr(message) {
    setErrors(prev => [...prev, message])
    toast.error(message)
  }

  const onDrop = useCallback(files => {
    setScreenshots(prev => [...prev, ...files.map(file => ({ url: URL.createObjectURL(file), name: file.name, isNew: true, file }))])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } })

  async function save() {
    const validationErrors = []
    if (!selPlatId) validationErrors.push('Platforma seçilməyib')
    if (!period.trim()) validationErrors.push('Hesabat dövrü yazılmayıb')

    if (validationErrors.length) {
      validationErrors.forEach(error => toast.error(error))
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    setErrors([])

    try {
      let pid = periodId
      if (!pid) {
        const { data: insertedPeriod, error } = await supabase
          .from('report_periods')
          .insert({ platform_id: selPlatId, period_label: period.trim(), issue_text: issue })
          .select()
          .single()

        if (error) throw new Error('Hesabat dövrü yaradılmadı: ' + error.message)
        pid = insertedPeriod.id
      } else {
        const { error } = await supabase.from('report_periods').update({ issue_text: issue }).eq('id', pid)
        if (error) throw new Error('Dövr yenilənmədi: ' + error.message)
      }

      await Promise.all([
        supabase.from('completed_items').delete().eq('period_id', pid),
        supabase.from('planned_items').delete().eq('period_id', pid),
        supabase.from('statistics').delete().eq('period_id', pid),
      ])

      const doneRows = done.filter(text => text.trim()).map((text, index) => ({ period_id: pid, text, order_index: index }))
      if (doneRows.length) {
        const { error } = await supabase.from('completed_items').insert(doneRows)
        if (error) throw new Error('Görülən işlər saxlanmadı: ' + error.message)
      }

      const planRows = planned
        .filter(item => item.text?.trim())
        .map((item, index) => formToRow(item, pid, index))
      if (planRows.length) {
        const { error } = await supabase.from('planned_items').insert(planRows)
        if (error) throw new Error('Görüləcək işlər saxlanmadı: ' + error.message)
      }

      const kpiRows = kpis
        .filter(kpi => kpi.label.trim() && kpi.value.trim())
        .map((kpi, index) => ({ period_id: pid, label: kpi.label, value: kpi.value, order_index: index }))
      if (kpiRows.length) {
        const { error } = await supabase.from('statistics').insert(kpiRows)
        if (error) throw new Error('Statistika saxlanmadı: ' + error.message)
      }

      const finalScreenshots = []
      for (const screenshot of screenshots) {
        if (screenshot.isNew && screenshot.file) {
          const path = `screenshots/${pid}/${Date.now()}_${screenshot.name}`
          const { error: uploadError } = await supabase.storage.from('platform-assets').upload(path, screenshot.file)
          if (uploadError) {
            toast.error('Şəkil yüklənmədi: ' + screenshot.name)
            continue
          }
          const { data } = supabase.storage.from('platform-assets').getPublicUrl(path)
          const publicUrl = data.publicUrl
          finalScreenshots.push(publicUrl)
          await supabase.from('attachments').insert({ period_id: pid, file_url: publicUrl, file_name: screenshot.name, file_type: 'screenshot' })
        } else if (screenshot.url) {
          finalScreenshots.push(screenshot.url)
        }
      }

      const currentPlatformData = {
        done: done.filter(text => text.trim()),
        planned_items: planned.filter(item => item.text?.trim()).map(item => ({ text: item.text.trim(), plan_group: item.plan_group })),
        stats: kpis.filter(kpi => kpi.label.trim() && kpi.value.trim()).map(kpi => ({ l: kpi.label, v: kpi.value })),
        screenshots: finalScreenshots,
        issue,
      }

      const reportData = await buildDraftPayload(period.trim(), platforms, selPlatId, currentPlatformData)
      const { data: existingDraft } = await supabase
        .from('report_drafts')
        .select('id')
        .eq('period_label', period.trim())
        .maybeSingle()

      if (existingDraft?.id) {
        const { error } = await supabase
          .from('report_drafts')
          .update({ report_data: reportData, updated_at: new Date().toISOString() })
          .eq('id', existingDraft.id)
        if (error) throw new Error('Draft yenilənmədi: ' + error.message)
      } else {
        const { error } = await supabase
          .from('report_drafts')
          .insert({ period_label: period.trim(), report_data: reportData })
        if (error) throw new Error('Draft saxlanmadı: ' + error.message)
      }

      setPeriodId(pid)
      setScreenshots(prev => prev.map(screenshot => ({ ...screenshot, isNew: false, file: undefined })))
      toast.success('✅ Məlumatlar saxlanıldı və draft yeniləndi!')
    } catch (error) {
      showErr(error.message)
    }

    setSaving(false)
  }

  const selectedPlatform = platforms.find(platform => platform.id === selPlatId)

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Hesabat Daxil Et</div>
          <div className="admin-page-sub">Yeni hesabat yaradılır və draft kimi saxlanılır</div>
        </div>
        <button className="btn btn-success" onClick={save} disabled={saving || loadingD}>
          <CheckCircle size={15} /> {saving ? 'Saxlanılır...' : 'Saxla'}
        </button>
      </div>

      {errors.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>{errors.map((error, index) => <div key={index} style={{ fontSize: 13, color: '#dc2626' }}>{error}</div>)}</div>
          <button onClick={() => setErrors([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 }}>✕</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Platforma *</label>
            {isSuperAdmin ? (
              <select className="form-select" value={selPlatId} onChange={e => { setSelPlatId(e.target.value); setPeriodId(null) }}>
                <option value="">Seçin...</option>
                {platforms.map(platform => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
              </select>
            ) : (
              <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                {selectedPlatform?.name || '...'}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hesabat Dövrü *</label>
            <input className="form-input" value={period} onChange={e => setPeriod(e.target.value)} placeholder="məs. 2026 Aprel" />
          </div>
        </div>
        {loadingD && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#6366f1', display: 'flex', gap: 6, alignItems: 'center' }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Yüklənir...
          </div>
        )}
        {periodId && !loadingD && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#059669', fontWeight: 600 }}>
            ✓ Mövcud məlumatlar yükləndi — redaktə edə bilərsiniz
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ color: '#059669' }}>✓ Görülən İşlər</div>
            {done.map((item, index) => (
              <div key={`done-${index}`} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input className="form-input" style={{ flex: 1 }} value={item}
                  onChange={e => {
                    const next = [...done]
                    next[index] = e.target.value
                    setDone(next)
                  }}
                  placeholder={`İş ${index + 1}`} />
                {done.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setDone(done.filter((_, i) => i !== index))}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDone([...done, ''])} style={{ marginTop: 4 }}>
              <Plus size={12} /> Əlavə et
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📊 Statistika / KPI</div>
            {kpis.map((kpi, index) => (
              <div key={`kpi-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                <input className="form-input" value={kpi.label}
                  onChange={e => {
                    const next = [...kpis]
                    next[index] = { ...next[index], label: e.target.value }
                    setKpis(next)
                  }}
                  placeholder="Göstərici" />
                <input className="form-input" value={kpi.value}
                  onChange={e => {
                    const next = [...kpis]
                    next[index] = { ...next[index], value: e.target.value }
                    setKpis(next)
                  }}
                  placeholder="Dəyər" />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setKpis(kpis.filter((_, i) => i !== index))}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setKpis([...kpis, { label: '', value: '' }])}>
              <Plus size={12} /> KPI əlavə et
            </button>
          </div>

          <div className="card">
            <div className="card-title" style={{ color: '#d97706' }}>⚠️ Çətinliklər / Qeydlər</div>
            <textarea className="form-textarea" value={issue} onChange={e => setIssue(e.target.value)} placeholder="Mövcud problem..." />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ color: '#2563eb' }}>📅 Görüləcək İşlər</div>
            <PlannedEditor items={planned} onChange={setPlanned} />
          </div>

          <div className="card">
            <div className="card-title" style={{ color: '#6366f1' }}>📷 Ekran Görüntüləri</div>
            {screenshots.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {screenshots.map((screenshot, index) => (
                  <div key={`shot-${index}`} style={{ position: 'relative' }}>
                    <img src={screenshot.url} alt="" style={{ width: 100, height: 65, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e5e7eb' }} />
                    {screenshot.isNew && <span style={{ position: 'absolute', top: 2, left: 2, background: '#6366f1', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>YENİ</span>}
                    <button type="button" onClick={() => setScreenshots(screenshots.filter((_, i) => i !== index))}
                      style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
