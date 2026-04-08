import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './styles/global.css'
import AdminGate from './pages/AdminGate'
import PublicReport from './pages/PublicReport'

export default function App() {
  return (
    <HashRouter>
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '12px', fontFamily: 'Arial, sans-serif', fontSize: '13px' },
        success: { style: { background: '#059669', color: '#fff' } },
        error: { style: { background: '#dc2626', color: '#fff' } },
      }} />
      <Routes>
        <Route path="/admin" element={<AdminGate />} />
        <Route path="/" element={<PublicReport />} />
        <Route path="*" element={<PublicReport />} />
      </Routes>
    </HashRouter>
  )
}
