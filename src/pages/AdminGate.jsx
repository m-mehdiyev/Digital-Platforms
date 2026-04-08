export default function AdminGate() {
  const { role, isSuperAdmin } = useAuth()

  return (
    <div style={{ color: 'white', padding: 50 }}>
      <h1>ADMIN WORKS</h1>
      <p>Role: {role}</p>
      <p>SuperAdmin: {isSuperAdmin ? 'YES' : 'NO'}</p>
    </div>
  )
}
