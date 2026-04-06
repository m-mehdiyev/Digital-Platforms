import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export default function Platforms() {
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', tagline: '', color: '#6366f1', logo_url: '' })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPlatforms() }, [])

  async function fetchPlatforms() {
    setLoading(true)
    const { data } = await supabase.from('platforms').select('*').order('order_index')
    setPlatforms(data || [])
    setLoading(false)
  }

  const onDrop = useCallback(files => {
    const file = files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1
  })

  function openAdd() {
    setEditing(null)
    setForm({ name: '', tagline: '', color: '#6366f1', logo_url: '' })
    setLogoFile(null)
    setLogoPreview('')
    setShowModal(true)
  }

  function openEdit(p) {
    setEditing(p)
    setForm({ name: p.name, tagline: p.tagline || '', color: p.color || '#6366f1', logo_url: p.logo_url || '' })
    setLogoPreview(p.logo_url || '')
    setLogoFile(null)
    setShowModal(true)
  }

  async function save() {
    if (!form.name.trim()) return toast.error('Ad daxil edin')
    setSaving(true)
    try {
      let logo_url = form.logo_url

      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `logos/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('platform-assets').upload(path, logoFile)
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('platform-assets').getPublicUrl(path)
        logo_url = urlData.publicUrl
      }

      const payload = { name: form.name, tagline: form.tagline, color: form.color, logo_url }

      if (editing) {
        await supabase.from('platforms').update(payload).eq('id', editing.id)
        toast.success('Platforma yeniləndi')
      } else {
        await supabase.from('platforms').insert({ ...payload, order_index: platforms.length })
        toast.success('Platforma əlavə edildi')
      }
      setShowModal(false)
      fetchPlatforms()
    } catch (e) {
      toast.error('Xəta baş verdi')
    }
    setSaving(false)
  }

  async function deletePlatform(id) {
    if (!confirm('Bu platformanı silmək istəyirsiniz?')) return
    await supabase.from('platforms').delete().eq('id', id)
    toast.success('Silindi')
    fetchPlatforms()
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Platformalar</div>
          <div className="admin-page-sub">{platforms.length} platforma mövcuddur</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Platforma Əlavə Et</button>
      </div>

      <div className="platform-grid">
        {platforms.map(p => (
          <div key={p.id} className="platform-card-admin" style={{ borderTop: `3px solid ${p.color || '#6366f1'}` }}>
            <div className="platform-card-logo">
              {p.logo_url
                ? <img src={p.logo_url} alt={p.name} />
                : <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
              }
            </div>
            <div className="platform-card-name">{p.name}</div>
            <div className="platform-card-tag">{p.tagline}</div>
            <div className="platform-card-footer">
              <span className="badge badge-blue" style={{ background: p.color + '18', color: p.color }}>#{p.id?.slice(0,6)}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><Edit2 size={12} /></button>
                <button className="btn btn-danger btn-sm" onClick={() => deletePlatform(p.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Platformanı Düzəlt' : 'Yeni Platforma'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Platforma Adı *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="məs. digital• bridge" />
              </div>
              <div className="form-group">
                <label className="form-label">Təsvir / Tagline</label>
                <input className="form-input" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="məs. Dövlət İnteqrasiya Platforması" />
              </div>
              <div className="form-group">
                <label className="form-label">Rəng</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: 44, height: 38, borderRadius: 8, border: '1.5px solid #e5e7eb', cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{form.color}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Logo</label>
                {logoPreview && (
                  <div style={{ marginBottom: 10 }}>
                    <img src={logoPreview} alt="Preview" style={{ maxHeight: 48, maxWidth: 180, objectFit: 'contain' }} />
                  </div>
                )}
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: 24 }}>🖼️</div>
                  <p>Logo yükləmək üçün klikləyin və ya sürükləyin</p>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>PNG, SVG, JPG — max 2MB</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Ləğv Et</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saxlanılır...' : (editing ? 'Yenilə' : 'Əlavə Et')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
