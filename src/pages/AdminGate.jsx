import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/admin/AdminLayout'

export default function AdminGate() {
  const auth = useAuth()

  return (
    <div style={{ color: 'white', padding: '20px' }}>
      <pre>{JSON.stringify(auth, null, 2)}</pre>
    </div>
  )
}
