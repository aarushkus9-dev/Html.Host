// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { AlertProvider } from './AlertContext'
import { Layout, PenTool, Settings as SettingsIcon, LogOut, Shield, MonitorPlay } from 'lucide-react'

// Pages
import Login from './pages/Login'
import Discover from './pages/Discover'
import Editor from './pages/Editor'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import ProjectView from './pages/ProjectView'
import Banned from './pages/Banned'
import Videos from './pages/Videos'

// Components
import BanGuard from './components/BanGuard'

function AppContent() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check for custom session in localStorage
    const savedSession = localStorage.getItem('user_session')
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession)
      setSession(parsedSession)
      if (parsedSession?.user?.id) checkAdmin(parsedSession.user.id)
    }
  }, [])

  const checkAdmin = async (userId) => {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
    if (data) setIsAdmin(data.is_admin)
  }

  const handleLogout = () => {
    setSession(null)
    setIsAdmin(false)
    localStorage.removeItem('user_session')
  }

  return (
    <Router>
      <Routes>
        {/* Banned route - accessible without BanGuard */}
        <Route path="/banned" element={<Banned />} />
        
        {/* All other routes wrapped in BanGuard */}
        <Route path="/*" element={
          <BanGuard>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
              {/* Floating 3D Navbar */}
              <nav style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '15px 25px', 
                marginBottom: '40px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layout size={24} color="var(--primary)"/> HTML.HOST
                </Link>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Discover</Link>
                  <Link to="/videos" className="btn-3d" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.9rem' }}>
                        <MonitorPlay size={16} /> Videos
                  </Link>
                  {session ? (
                    <>
                      <Link to="/editor" className="btn-3d" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.9rem' }}>
                        <PenTool size={16} /> Create
                      </Link>
                      <Link to="/settings" style={{ color: 'var(--text-dim)' }}><SettingsIcon size={20}/></Link>
                      {isAdmin && <Link to="/admin" style={{ color: '#ef4444' }}><Shield size={20}/></Link>}
                      <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                        <LogOut size={20} />
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="btn-3d" style={{ textDecoration: 'none', background: 'white', color: 'black' }}>
                      Login
                    </Link>
                  )}
                </div>
              </nav>

              <Routes>
                <Route path="/" element={<Discover />} />
                <Route path="/login" element={<Login session={session} setSession={setSession} />} />
                <Route path="/videos" element={<Videos session={session} />} />
                <Route path="/editor" element={session ? <Editor session={session} /> : <Navigate to="/login" />} />
                <Route path="/settings" element={session ? <Settings session={session} /> : <Navigate to="/login" />} />
                <Route path="/admin" element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
                <Route path="/project/:id" element={<ProjectView />} />
              </Routes>
            </div>
          </BanGuard>
        } />
      </Routes>
    </Router>
  )
}

export default function App() {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  )
}