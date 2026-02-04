// src/components/BanGuard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BanGuard({ children }) {
  const [isChecking, setIsChecking] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    checkBanStatus()
  }, [location.pathname])

  const getDeviceFingerprint = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('fingerprint', 2, 2)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      canvas.toDataURL()
    ].join('|')
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }

  const checkBanStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.id) {
        const deviceId = getDeviceFingerprint()
        
        // Check if user is banned
        const { data: profile } = await supabase
          .from('profiles')
          .select('banned, ban_expires_at, device_id')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          // Store device ID if not already stored
          if (!profile.device_id) {
            await supabase
              .from('profiles')
              .update({ device_id: deviceId })
              .eq('id', session.user.id)
          }
          
          // Check if banned
          if (profile.banned) {
            // Check if ban has expired
            if (profile.ban_expires_at) {
              const expiresAt = new Date(profile.ban_expires_at)
              if (new Date() > expiresAt) {
                // Unban user
                await supabase
                  .from('profiles')
                  .update({ 
                    banned: false, 
                    ban_reason: null, 
                    ban_expires_at: null 
                  })
                  .eq('id', session.user.id)
              } else {
                navigate('/banned')
                return
              }
            } else {
              // Permanent ban
              navigate('/banned')
              return
            }
          }
          
          // Check if device is banned (even with different account)
          const { data: bannedDevices } = await supabase
            .from('profiles')
            .select('id, banned')
            .eq('device_id', deviceId)
            .eq('banned', true)
          
          if (bannedDevices && bannedDevices.length > 0) {
            // This device is associated with a banned account
            navigate('/banned')
            return
          }
        }
      }
    } catch (error) {
      console.error('Error checking ban status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid var(--border)', 
            borderTop: '3px solid var(--primary)', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }} />
          <p style={{ color: 'var(--text-dim)' }}>Checking access...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return children
}