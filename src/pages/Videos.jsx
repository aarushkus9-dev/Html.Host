// src/pages/Videos.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Upload, Home, Film, User, Settings, X, Play, Wand2, Search, MonitorPlay, ChevronDown, ThumbsUp, Share2, MoreVertical } from 'lucide-react'

export default function Videos({ session }) {
  const [videos, setVideos] = useState([])
  const [currentView, setCurrentView] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [cinemaMode, setCinemaMode] = useState(null)
  const [currentChannel, setCurrentChannel] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [currentShortIndex, setCurrentShortIndex] = useState(0)
  const [userProfile, setUserProfile] = useState(null)
  const [profilesCache, setProfilesCache] = useState({}) // Cache for user profiles
  
  // Upload form state
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] = useState('General')
  
  // Theme state
  const [customBg, setCustomBg] = useState('')
  const [activeTheme, setActiveTheme] = useState('midnight')

  useEffect(() => {
    loadVideos()
    loadTheme()
    if (session) {
      loadUserProfile()
    }
  }, [session])

  useEffect(() => {
    if (currentView === 'shorts') {
      // Auto-scroll to current short
      const container = document.getElementById('shorts-feed')
      if (container) {
        const shortHeight = container.clientHeight
        container.scrollTo({
          top: currentShortIndex * shortHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [currentShortIndex, currentView])

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single()
      
      if (data) setUserProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadProfileForUser = async (userId) => {
    // Check cache first
    if (profilesCache[userId]) {
      return profilesCache[userId]
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single()
      
      if (data) {
        setProfilesCache(prev => ({ ...prev, [userId]: data }))
        return data
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
    return null
  }

  const loadTheme = () => {
    const saved = localStorage.getItem('videos_theme') || 'midnight'
    const custom = localStorage.getItem('videos_custom_bg')
    setActiveTheme(saved)
    if (saved === 'custom' && custom) {
      setCustomBg(custom)
      applyTheme('custom', custom)
    } else {
      applyTheme(saved)
    }
  }

  const applyTheme = (theme, customUrl = '') => {
    const root = document.documentElement
    
    if (theme === 'custom' && customUrl) {
      root.style.setProperty('--bg', `url('${customUrl}')`)
      root.style.backgroundImage = `url('${customUrl}')`
      root.style.backgroundSize = 'cover'
      root.style.backgroundPosition = 'center'
      root.style.backgroundAttachment = 'fixed'
    } else {
      root.style.backgroundImage = 'none'
      
      switch(theme) {
        case 'midnight':
          root.style.setProperty('--bg', '#0e0e10')
          break
        case 'deep-space':
          root.style.background = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)'
          break
        case 'forest':
          root.style.backgroundImage = "url('https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?w=1920&q=80')"
          root.style.backgroundSize = 'cover'
          root.style.backgroundPosition = 'center'
          root.style.backgroundAttachment = 'fixed'
          break
        case 'cyber':
          root.style.background = 'linear-gradient(45deg, #121212, #2a0845)'
          break
      }
    }
  }

  const setTheme = (theme) => {
    setActiveTheme(theme)
    localStorage.setItem('videos_theme', theme)
    applyTheme(theme)
  }

  const setCustomTheme = () => {
    if (!customBg) return alert('Please enter a URL')
    localStorage.setItem('videos_theme', 'custom')
    localStorage.setItem('videos_custom_bg', customBg)
    setActiveTheme('custom')
    applyTheme('custom', customBg)
  }

  const loadVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setVideos(data)
      // Preload profiles for video owners
      const ownerIds = [...new Set(data.map(v => v.owner_id).filter(Boolean))]
      ownerIds.forEach(id => loadProfileForUser(id))
    }
  }

  const isShort = (url) => url.includes('shorts') || url.includes('tiktok')

  const fetchMetadata = async () => {
    if (!uploadUrl) return alert('Paste a URL first!')
    
    try {
      const ytId = getYoutubeId(uploadUrl)
      
      if (ytId) {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`)
        const data = await res.json()
        
        if (data.title) {
          setUploadTitle(data.title)
          alert('Title fetched successfully!')
        } else {
          alert('Could not fetch title automatically')
        }
      } else {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(uploadUrl)}`)
        const data = await res.json()
        
        if (data.title) {
          setUploadTitle(data.title)
          alert('Title fetched successfully!')
        } else {
          alert('Could not fetch title automatically')
        }
      }
    } catch (e) {
      console.error('Fetch error:', e)
      alert('Error fetching metadata. Please type manually.')
    }
  }

  const uploadVideo = async () => {
    if (!uploadUrl || !uploadTitle) return alert('Missing fields')
    if (!session) return alert('Please login first')

    const ytId = getYoutubeId(uploadUrl)
    const thumb = ytId 
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` 
      : 'https://placehold.co/600x400/111/FFF?text=No+Thumb'

    const { error } = await supabase.from('videos').insert({
      title: uploadTitle,
      url: uploadUrl,
      thumbnail_url: thumb,
      category: uploadCategory,
      owner_id: session.user.id,
      owner_name: userProfile?.username || session.user.username
    })

    if (!error) {
      setUploadModalOpen(false)
      setUploadUrl('')
      setUploadTitle('')
      setUploadCategory('General')
      loadVideos()
    } else {
      alert('Upload failed: ' + error.message)
    }
  }

  const loadComments = async (videoId) => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
    
    if (data) {
      setComments(data)
      // Preload profiles for commenters
      const commenterIds = [...new Set(data.map(c => c.user_id).filter(Boolean))]
      commenterIds.forEach(id => loadProfileForUser(id))
    }
  }

  const postComment = async () => {
    if (!commentText || !cinemaMode || !session) return

    const { error } = await supabase.from('comments').insert({
      video_id: cinemaMode.id,
      user_id: session.user.id,
      username: userProfile?.username || session.user.username,
      text: commentText
    })

    if (!error) {
      setCommentText('')
      loadComments(cinemaMode.id)
    }
  }

  const openCinema = (video) => {
    setCinemaMode(video)
    loadComments(video.id)
  }

  const openChannel = (username) => {
    setCurrentChannel(username)
    setCurrentView('channel')
  }

  const getYoutubeId = (url) => {
    const reg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
    const match = url.match(reg)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const getFilteredVideos = () => {
    let filtered = videos.filter(v => !isShort(v.url))
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(v => v.category === selectedCategory)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return filtered
  }

  const getChannelVideos = () => {
    return videos.filter(v => v.owner_name === currentChannel && !isShort(v.url))
  }

  const getShorts = () => {
    return videos.filter(v => isShort(v.url))
  }

  const handleShortsScroll = (e) => {
    const container = e.target
    const scrollPosition = container.scrollTop
    const shortHeight = container.clientHeight
    const newIndex = Math.round(scrollPosition / shortHeight)
    setCurrentShortIndex(newIndex)
  }

  const UserAvatar = ({ userId, username, size = 36 }) => {
    const profile = profilesCache[userId]
    const avatarUrl = profile?.avatar_url
    const displayName = username || profile?.username || 'U'

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={displayName}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            objectFit: 'cover',
            border: size > 40 ? '3px solid var(--border)' : '2px solid rgba(255,255,255,0.3)',
            flexShrink: 0
          }}
        />
      )
    }

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: size > 40 ? '2rem' : (size > 32 ? '1rem' : '0.85rem'),
        flexShrink: 0,
        border: size > 40 ? '3px solid var(--border)' : '2px solid rgba(255,255,255,0.3)'
      }}>
        {displayName[0].toUpperCase()}
      </div>
    )
  }

  const VideoCard = ({ video }) => (
    <div 
      onClick={() => openCinema(video)}
      style={{ 
        cursor: 'pointer', 
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ 
        width: '100%', 
        aspectRatio: '16/9', 
        background: '#000',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '12px'
      }}>
        <img 
          src={video.thumbnail_url} 
          alt={video.title}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <UserAvatar userId={video.owner_id} username={video.owner_name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: '600', 
            marginBottom: '4px',
            fontSize: '0.95rem',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {video.title}
          </div>
          <div 
            style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-dim)',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onClick={(e) => {
              e.stopPropagation()
              openChannel(video.owner_name)
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-dim)'}
          >
            {video.owner_name}
          </div>
        </div>
      </div>
    </div>
  )

  const displayUsername = userProfile?.username || session?.user?.username || '?'
  const displayAvatar = userProfile?.avatar_url

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        marginBottom: '24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.3rem' }}>
          <MonitorPlay size={32} color="var(--primary)" />
          Videos
        </div>
        
        <div style={{ 
          flex: 1, 
          maxWidth: '600px', 
          margin: '0 40px',
          background: '#000',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          height: '42px'
        }}>
          <Search size={20} color="#666" />
          <input 
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              outline: 'none',
              flex: 1,
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {session && (
            <button 
              className="btn-3d" 
              onClick={() => setUploadModalOpen(true)}
              style={{ padding: '10px 20px' }}
            >
              <Upload size={18} /> Upload
            </button>
          )}
          <div 
            onClick={() => setCurrentView('settings')}
            style={{ cursor: 'pointer' }}
          >
            {session && displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Profile"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border)'
                }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: session ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '1rem'
              }}>
                {session ? displayUsername[0].toUpperCase() : '?'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Sidebar */}
        <aside style={{ 
          width: '220px', 
          flexShrink: 0,
          position: 'sticky',
          top: '20px',
          height: 'fit-content'
        }}>
          <NavItem 
            icon={<Home size={22} />} 
            label="Home" 
            active={currentView === 'home'}
            onClick={() => setCurrentView('home')}
          />
          <NavItem 
            icon={<Film size={22} />} 
            label="Shorts" 
            active={currentView === 'shorts'}
            onClick={() => setCurrentView('shorts')}
          />
          {session && (
            <NavItem 
              icon={<User size={22} />} 
              label="Your Channel" 
              active={currentView === 'channel' && currentChannel === displayUsername}
              onClick={() => {
                openChannel(displayUsername)
              }}
            />
          )}
          <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />
          <NavItem 
            icon={<Settings size={22} />} 
            label="Settings" 
            active={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
          />
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1 }}>
          {/* Home View */}
          {currentView === 'home' && (
            <div>
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '32px', 
                overflowX: 'auto', 
                paddingBottom: '4px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {['All', 'Gaming', 'Music', 'Tech', 'Vlog'].map(cat => (
                  <Tag 
                    key={cat}
                    label={cat}
                    active={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                  />
                ))}
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '32px 16px'
              }}>
                {getFilteredVideos().map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}

          {/* Shorts View */}
          {currentView === 'shorts' && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px 0'
            }}>
              <div 
                id="shorts-feed"
                onScroll={handleShortsScroll}
                style={{
                  width: '23rem',
                  height: '41rem',
                  overflowY: 'scroll',
                  msOverflowStyle: 'none',
                  background: '#000',
                  borderRadius: '20px',
                  position: 'relative',
                  top: '.01rem',
                  boxShadow: '10px 10px 0px rgba(0,0,0,0.8)',
                  border: '2px solid rgba(255,255,255,0.1)'
                }}
              >
                <style>
                  {`
                    #shorts-feed::-webkit-scrollbar {
                      display: none;
                    }
                  `}
                </style>
                {getShorts().length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    color: '#666',
                    fontSize: '1.1rem',
                    gap: '12px'
                  }}>
                    <Film size={48} color="#444" />
                    <div>No shorts yet</div>
                    <div style={{ fontSize: '0.9rem', color: '#555' }}>Upload a YouTube Short or TikTok!</div>
                  </div>
                ) : (
                  getShorts().map((video, idx) => {
                    const ytId = getYoutubeId(video.url)
                    const isActive = idx === currentShortIndex
                    return (
                      <div key={video.id} style={{
                        height: '100%',
                        scrollSnapAlign: 'start',
                        position: 'relative',
                        background: '#000'
                      }}>
                        <iframe 
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=${isActive ? 1 : 0}&loop=1&playlist=${ytId}&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            border: 'none',
                            pointerEvents: 'auto'
                          }}
                          allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        
                        {/* Video Info Overlay */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '80px 24px 32px',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
                          color: 'white',
                          pointerEvents: 'none'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            marginBottom: '10px'
                          }}>
                            <UserAvatar userId={video.owner_id} username={video.owner_name} size={36} />
                            <div>
                              <span style={{ fontWeight: '700', fontSize: '1rem' }}>@{video.owner_name}</span>
                            </div>
                          </div>
                          <h3 style={{ 
                            margin: 0, 
                            fontSize: '1.1rem', 
                            lineHeight: '1.5',
                            fontWeight: '600',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                          }}>
                            {video.title}
                          </h3>
                          {video.category && (
                            <div style={{ 
                              marginTop: '8px',
                              fontSize: '0.85rem',
                              color: 'rgba(255,255,255,0.8)'
                            }}>
                              #{video.category}
                            </div>
                          )}
                        </div>

                        {/* Progress Indicator */}
                        <div style={{
                          position: 'absolute',
                          top: 20,
                          right: 20,
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(8px)',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'white',
                          pointerEvents: 'none',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          {idx + 1} / {getShorts().length}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Channel View */}
          {currentView === 'channel' && currentChannel && (
            <div>
              <div style={{ 
                background: `linear-gradient(120deg, hsl(${(currentChannel.length * 40) % 360}, 60%, 30%), hsl(${((currentChannel.length * 40) + 40) % 360}, 60%, 50%))`,
                height: '180px',
                borderRadius: '12px',
                marginBottom: '20px'
              }} />
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '24px',
                marginBottom: '40px',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border)'
              }}>
                {/* Use first video's owner_id to get avatar */}
                {(() => {
                  const channelVideo = videos.find(v => v.owner_name === currentChannel)
                  return <UserAvatar userId={channelVideo?.owner_id} username={currentChannel} size={80} />
                })()}
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: '2.2rem', fontWeight: '700' }}>{currentChannel}</h1>
                  <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                    {getChannelVideos().length} videos
                  </p>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '32px 16px'
              }}>
                {getChannelVideos().map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ marginBottom: '32px', fontSize: '2rem' }}>Settings</h1>

              {session && (
                <div className="box-3d" style={{ padding: '32px' }}>
                  <h3 style={{ 
                    marginBottom: '20px', 
                    paddingBottom: '12px', 
                    borderBottom: '1px solid var(--border)',
                    fontSize: '1.3rem'
                  }}>
                    Account
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt="Profile"
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid var(--border)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          border: '3px solid var(--border)'
                        }}>
                          {displayUsername[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          Signed in as
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                          @{displayUsername}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}
        onClick={() => setUploadModalOpen(false)}
        >
          <div 
            className="box-3d" 
            style={{ 
              width: '480px', 
              padding: '32px',
              background: 'var(--surface)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Upload Video</h3>
              <X 
                size={24} 
                style={{ cursor: 'pointer', color: 'var(--text-dim)' }} 
                onClick={() => setUploadModalOpen(false)}
              />
            </div>

            <label style={{ 
              display: 'block', 
              fontSize: '0.9rem', 
              color: 'var(--text-dim)', 
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Video URL
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                className="input-3d"
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
              />
              <button 
                className="btn-3d" 
                onClick={fetchMetadata}
                title="Auto-fill title"
                style={{ padding: '8px 16px' }}
              >
                <Wand2 size={18} />
              </button>
            </div>

            <label style={{ 
              display: 'block', 
              fontSize: '0.9rem', 
              color: 'var(--text-dim)', 
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Title
            </label>
            <input 
              className="input-3d"
              type="text"
              placeholder="My awesome video"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              style={{ marginBottom: '20px' }}
            />

            <label style={{ 
              display: 'block', 
              fontSize: '0.9rem', 
              color: 'var(--text-dim)', 
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Category
            </label>
            <select 
              className="input-3d"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              style={{ marginBottom: '24px' }}
            >
              <option value="General">General</option>
              <option value="Gaming">Gaming</option>
              <option value="Music">Music</option>
              <option value="Tech">Tech</option>
              <option value="Vlog">Vlog</option>
            </select>

            <button 
              className="btn-3d" 
              onClick={uploadVideo}
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              <Upload size={18} />
              Publish Video
            </button>
          </div>
        </div>
      )}

      {/* Cinema Mode */}
      {cinemaMode && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            background: 'rgba(0,0,0,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', fontSize: '1.1rem' }}>
              <MonitorPlay size={24} color="var(--primary)" />
              Videos
            </div>
            <button 
              className="btn-3d" 
              onClick={() => setCinemaMode(null)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none' }}
            >
              <X size={18} /> Close
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            flex: 1,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '32px', overflowY: 'auto', background: '#0a0a0a' }}>
              <div style={{
                width: '100%',
                maxWidth: '1400px',
                margin: '0 auto',
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}>
                <iframe 
                  src={`https://www.youtube.com/embed/${getYoutubeId(cinemaMode.url)}?autoplay=1&rel=0`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
              
              <h1 style={{ margin: '0 0 16px', fontSize: '1.5rem', fontWeight: '600' }}>
                {cinemaMode.title}
              </h1>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <UserAvatar userId={cinemaMode.owner_id} username={cinemaMode.owner_name} size={40} />
                <span 
                  style={{ 
                    color: 'white', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                  onClick={() => {
                    setCinemaMode(null)
                    openChannel(cinemaMode.owner_name)
                  }}
                >
                  {cinemaMode.owner_name}
                </span>
              </div>
            </div>

            <div style={{
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              background: '#0a0a0a',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ 
                padding: '20px', 
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                fontWeight: '600',
                fontSize: '1.1rem'
              }}>
                Comments
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {comments.length === 0 ? (
                  <div style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
                    No comments yet. Be the first!
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                        <UserAvatar userId={comment.user_id} username={comment.username} size={32} />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>
                            @{comment.username}
                          </div>
                          <div style={{ color: '#ddd', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {session && (
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <input 
                    className="input-3d"
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && postComment()}
                    style={{ marginBottom: '12px' }}
                  />
                  <button 
                    className="btn-3d" 
                    onClick={postComment}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Comment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(8px); }
          }
        `}
      </style>
    </div>
  )
}

// Helper Components
function NavItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        color: active ? 'white' : 'var(--text-dim)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontWeight: active ? '600' : '500',
        fontSize: '0.95rem',
        background: active ? 'var(--surface-hover)' : 'transparent',
        transition: '0.2s',
        marginBottom: '4px'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface)'
          e.currentTarget.style.color = 'white'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-dim)'
        }
      }}
    >
      {icon}
      {label}
    </div>
  )
}

function Tag({ label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '8px 16px',
        background: active ? 'white' : 'var(--surface)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: '500',
        color: active ? 'black' : 'var(--text-dim)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: '0.2s',
        border: 'none'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-hover)'
          e.currentTarget.style.color = 'white'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface)'
          e.currentTarget.style.color = 'var(--text-dim)'
        }
      }}
    >
      {label}
    </div>
  )
}