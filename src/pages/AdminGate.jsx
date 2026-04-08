import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/admin/AdminLayout'

export default function AdminGate() {
  const { role, platformId, loading, isSuperAdmin } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!role) {
    return <div>No access</div>
  }

  return (
    <AdminLayout
      role={role}
      platformId={platformId}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
