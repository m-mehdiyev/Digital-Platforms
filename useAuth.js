import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/admin/AdminLayout'

export default function AdminGate() {
  const { role, platformId, loading, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Yoxlanılır...</p>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="access-denied">
        <div style={{ fontSize: 48 }}>🔒</div>
        <h1>Giriş Qadağandır</h1>
        <p>Bu səhifəyə giriş üçün xüsusi link lazımdır. Zəhmət olmasa sistem administratorundan link alın.</p>
      </div>
    )
  }

  return <AdminLayout role={role} platformId={platformId} isSuperAdmin={isSuperAdmin} />
}
