import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { ExternalLink, User } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Discover() {
  const [projects, setProjects] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get the session user email and update it in the database
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setEmail(session.user.email)
        
        // Update the user's email in the profiles table
        const { error } = await supabase
          .from('profiles')
          .update({ email: session.user.email })
          .eq('id', session.user.id)
        
        if (error) {
          console.error('Error updating email:', error)
        } else {
          console.log('Email updated successfully:', session.user.email)
        }
      }
    }

    getUserData()
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Example of using the email state */}
      <div style={{ marginBottom: '20px', fontSize: '0.9rem', opacity: 0.7 }}>
        Logged in as: {email || 'Guest'}
      </div>

      <h1 style={{ fontSize: '3rem', margin: '0 0 40px 0', letterSpacing: '-2px' }}>Explore.</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
        {projects.map(project => (
          <Link 
            to={`/project/${project.id}`} 
            key={project.id} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="box-3d" style={{ overflow: 'hidden', height: '320px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
              <div style={{ flex: 1, background: 'white', position: 'relative' }}>
                <iframe 
                  srcDoc={project.html_content} 
                  title={project.title} 
                  style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} 
                  scrolling="no"
                />
                <div style={{ position: 'absolute', inset: 0 }} />
              </div>
              <div style={{ padding: '15px', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{project.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>HTML Project</span>
                  <ExternalLink size={16} color="var(--primary)" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}