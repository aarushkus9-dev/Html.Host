import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAlert } from '../AlertContext'
import { Save, User, Globe, Image } from 'lucide-react'

export default function Settings({ session }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const { showAlert } = useAlert()

  useEffect(() => {
    getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      const { user } = session

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username || '')
        setWebsite(data.website || '')
        setAvatarUrl(data.avatar_url || '')
      }
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setLoading(true)
      const { user } = session

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }
      showAlert('Profile updated successfully!')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="box-3d" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
      <h2 style={{ marginBottom: '30px' }}>User Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Profile Picture Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--border)'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            display: avatarUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: '700',
            border: '3px solid var(--border)'
          }}>
            {username ? username[0].toUpperCase() : '?'}
          </div>
        </div>

        {/* Avatar URL Field */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)' }}>Avatar URL</label>
          <div style={{ position: 'relative' }}>
            <Image size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            <input
              className="input-3d"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {/* Username Field */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)' }}>Username</label>
          <div style={{ position: 'relative' }}>
            <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            <input
              className="input-3d"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        <button
          className="btn-3d"
          onClick={updateProfile}
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </div>
  )
}