import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAlert } from '../AlertContext'
import { User, Lock, ArrowRight } from 'lucide-react'

export default function Login({ session, setSession }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { showAlert } = useAlert()

  // Check for existing session
  useEffect(() => {
    const savedSession = localStorage.getItem('user_session')
    if (savedSession) {
      setSession(JSON.parse(savedSession))
    }
  }, [setSession])

  // Simple hash function
  const hashPassword = async (password) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleAuth = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      showAlert('Username and password are required.', 'error')
      return
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters.', 'error')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        // Check if username exists
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle()

        if (checkError) {
          console.error('Check error:', checkError)
          showAlert('Database error. Please try again.', 'error')
          setLoading(false)
          return
        }

        if (existingUser) {
          showAlert('Username already taken.', 'error')
          setLoading(false)
          return
        }

        // Hash password
        const passwordHash = await hashPassword(password)

        // Create user profile (id will auto-generate)
        const { data, error } = await supabase
          .from('profiles')
          .insert([{ username, password_hash: passwordHash }])
          .select()
          .single()

        if (error) {
          console.error('Insert error:', error)
          showAlert(error.message, 'error')
        } else {
          const userSession = {
            user: {
              id: data.id,
              username: data.username
            }
          }
          setSession(userSession)
          localStorage.setItem('user_session', JSON.stringify(userSession))
          showAlert('Account created successfully!')
        }
      } else {
        // Sign in - get user profile
        const { data: user, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle()

        if (error) {
          console.error('Query error:', error)
          showAlert('Database error. Please try again.', 'error')
          setLoading(false)
          return
        }

        if (!user) {
          showAlert('Invalid username or password.', 'error')
          setLoading(false)
          return
        }

        // Verify password
        const passwordHash = await hashPassword(password)
        const isValid = passwordHash === user.password_hash

        if (!isValid) {
          showAlert('Invalid username or password.', 'error')
        } else {
          const userSession = {
            user: {
              id: user.id,
              username: user.username
            }
          }
          setSession(userSession)
          localStorage.setItem('user_session', JSON.stringify(userSession))
          showAlert('Successfully logged in!')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      showAlert('An error occurred. Please try again.', 'error')
    }

    setLoading(false)
  }

  const handleLogout = () => {
    setSession(null)
    localStorage.removeItem('user_session')
    showAlert('Logged out successfully.')
  }

  if (session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="box-3d" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>
            You are logged in
          </h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>
            Welcome back, {session.user.username}!
          </p>
          <button 
            className="btn-3d" 
            onClick={handleLogout}
            style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
          >
            Log Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="box-3d" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>
          {isSignUp ? 'Create Account' : 'Welcome Back! <3'}
        </h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>
          {isSignUp 
            ? 'Choose a username and password to get started.' 
            : 'Enter your credentials to continue.'}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Username */}
          <div style={{ position: 'relative' }}>
            <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '14px' }}/>
            <input 
              className="input-3d"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              required
              style={{ paddingLeft: '40px' }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '14px' }}/>
            <input 
              className="input-3d"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <button 
            className="btn-3d" 
            disabled={loading} 
            style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? (isSignUp ? 'Creating...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Log In')} 
            <ArrowRight size={18} />
          </button>
        </form>

        <button 
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-dim)', 
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '0.9rem',
            marginTop: '20px',
            padding: '8px'
          }}
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}