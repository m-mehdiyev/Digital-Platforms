import { useAuth } from '../hooks/useAuth'

export default function AdminGate() {
  const { role, platformId, loading, tokenData, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div style={{ color: 'white', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Loading...</h1>
      </div>
    )
  }

  return (
    <div style={{ color: 'white', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>ADMIN WORKS</h1>
      <pre>{JSON.stringify({ role, platformId, loading, tokenData, isSuperAdmin }, null, 2)}</pre>
    </div>
  )
}
