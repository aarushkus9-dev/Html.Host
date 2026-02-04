import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Banned() {
  const [banInfo, setBanInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkBanStatus()
  }, [])

  const checkBanStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('banned, ban_reason, ban_expires_at')
        .eq('id', session.user.id)
        .single()
      
      setBanInfo(data)
    }
    setLoading(false)
  }

  const getRemainingTime = () => {
    if (!banInfo?.ban_expires_at) return 'Permanent'
    
    const now = new Date()
    const expiresAt = new Date(banInfo.ban_expires_at)
    const diff = expiresAt - now
    
    if (diff <= 0) return 'Expired (refresh page)'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="banned-container">
        <div className="banned-card">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="banned-container">
      <div className="banned-card">
        <div className="ban-icon">🚫</div>
        <h1>Account Suspended</h1>
        <p className="ban-message">
          Your account has been temporarily suspended and cannot access this platform.
        </p>
        
        {banInfo?.ban_reason && (
          <div className="ban-details">
            <h3>Reason:</h3>
            <p>{banInfo.ban_reason}</p>
          </div>
        )}
        
        <div className="ban-details">
          <h3>Time Remaining:</h3>
          <p className="time-remaining">{getRemainingTime()}</p>
        </div>

        <p className="ban-note">
          This ban is device-locked. Creating new accounts or using different browsers will not bypass this restriction.
        </p>
      </div>

      <style jsx>{`
        .banned-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d0a0a 100%);
          padding: 20px;
        }
        
        .banned-card {
          background: #1f1f1f;
          border: 2px solid #7f1d1d;
          border-radius: 16px;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(127, 29, 29, 0.3);
        }
        
        .ban-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        h1 {
          color: #fecaca;
          font-size: 2rem;
          margin: 0 0 1rem 0;
          letter-spacing: -1px;
        }
        
        .ban-message {
          color: #d1d5db;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        .ban-details {
          background: #0a0a0a;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-left: 4px solid #b91c1c;
        }
        
        .ban-details h3 {
          color: #fca5a5;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 0.5rem 0;
        }
        
        .ban-details p {
          color: #fff;
          font-size: 1.1rem;
          margin: 0;
        }
        
        .time-remaining {
          font-family: 'Courier New', monospace;
          font-size: 1.5rem !important;
          color: #fecaca !important;
          font-weight: bold;
        }
        
        .ban-note {
          color: #9ca3af;
          font-size: 0.85rem;
          margin: 1.5rem 0;
          line-height: 1.5;
        }
        
        .signout-btn {
          background: #374151;
          color: #e5e7eb;
          border: 1px solid #4b5563;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
        }
        
        .signout-btn:hover {
          background: #4b5563;
          border-color: #6b7280;
        }
      `}</style>
    </div>
  )
}