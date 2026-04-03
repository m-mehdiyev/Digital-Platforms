import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Copy, Trash2, Key, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

function generateToken(length = 24) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function TokenManager() {
  const [tokens, setTokens] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ role: 'platform_admin', platform_id: '', label: '' })
  const [newToken, setNewToken] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: toks }, { data: plats }] = await Promise.all([
      supabase.from('admin_tokens').select('*, platforms(name)').order('created_at', { ascending: false }),
      supabase.from('platforms').select('id, name').order('order_index')
    ])
    setTokens(toks || [])
    setPlatforms(plats || [])
    setLoading(false)
  }

  async function createToken() {
    if (form.role === 'platform_admin' && !form.platform_id) return toast.error('Platforma seçin')
    const token = generateToken()
    const { error } = await supabase.from('admin_tokens').insert({
      token,
      role: form.role,
      platform_id: form.role === 'platform_admin' ? form.platform_id : null,
      label: form.label || (form.role === 'super_admin' ? 'Super Admin' : platforms.find(p => p.id === form.platform_id)?.name),
      active: true
    })
    if (error) return toast.error('Xəta: ' + error.message)
    setNewToken(token)
    toast.success('Link yaradıldı!')
    fetchData()
    setShowModal(false)
    setForm({ role: 'platform_admin', platform_id: '', label: '' })
  }

  async function deactivate(id) {
    await supabase.from('admin_tokens').update({ active: false }).eq('id', id)
    toast.success('Link deaktiv edildi')
    fetchData()
  }

  async function deleteToken(id) {
    if (!confirm('Bu linki silmək istəyirsiniz?')) return
    await supabase.from('admin_tokens').delete().eq('id', id)
    toast.success('Silindi')
    fetchData()
  }

  function copyLink(token) {
    const url = `${window.location.origin}/admin?token=${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link kopyalandı!')
  }

  const origin = window.location.origin

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="admin-page-title">Link İdarəetmə</div>
          <div className="admin-page-sub">Admin linklərini yaradın və idarə edin</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Yeni Link</button>
      </div>

      {/* Last created token highlight */}
      {newToken && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #059669' }}>
          <div style={{ fontWeight: 700, color: '#059669', marginBottom: 8 }}>✅ Yeni Link Yaradıldı</div>
          <div className="token-url">{origin}/admin?token={newToken}</div>
          <button className="token-copy" onClick={() => copyLink(newToken)}>📋 Kopyala</button>
        </div>
      )}

      {/* Token list */}
      <div className="card">
        <div className="card-title"><Key size={16} /> Mövcud Linklər</div>
        {tokens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>Hələ link yaradılmayıb</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Ad</th><th>Rol</th><th>Platforma</th><th>Status</th><th>Tarix</th><th></th></tr>
            </thead>
            <tbody>
              {tokens.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.label}</td>
                  <td>
                    {t.role === 'super_admin'
                      ? <span className="badge badge-blue">⚡ Super Admin</span>
                      : <span className="badge badge-green">👤 Platform Admin</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{t.platforms?.name || '—'}</td>
                  <td>
                    {t.active
                      ? <span className="badge badge-green">Aktiv</span>
                      : <span className="badge badge-gray">Deaktiv</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(t.created_at).toLocaleDateString('az')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {t.active && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => copyLink(t.token)} title="Kopyala"><Copy size={11} /></button>
                          <button className="btn btn-secondary btn-sm" onClick={() => deactivate(t.id)} title="Deaktiv et"><RefreshCw size={11} /></button>
                        </>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteToken(t.id)} title="Sil"><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Yeni Admin Linki</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="super_admin">⚡ Super Admin</option>
                  <option value="platform_admin">👤 Platform Admin</option>
                </select>
              </div>
              {form.role === 'platform_admin' && (
                <div className="form-group">
                  <label className="form-label">Platforma</label>
                  <select className="form-select" value={form.platform_id} onChange={e => setForm({ ...form, platform_id: e.target.value })}>
                    <option value="">Platforma seçin...</option>
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Ad (istəyə bağlı)</label>
                <input className="form-input" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="məs. Orxan - Digital Bridge" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Ləğv Et</button>
              <button className="btn btn-primary" onClick={createToken}><Key size={14} /> Link Yarat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
