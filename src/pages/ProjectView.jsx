import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Code, Maximize2, Minimize2, Eye } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('html_content, title, owner')
        .eq('id', id)
        .single()
      
      if (data) setProject(data)
    }
    fetchProject()
  }, [id])

  if (!project) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', color: 'var(--text)' }}>
      Loading...
    </div>
  )

  return (
    // 1. OUTER BACKGROUND LAYER (Handles the spacing/padding from edge of screen)
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      background: 'var(--background)', // The background behind the floating window
      padding: isFullscreen ? '0' : '30px', // The gap between window and screen edge
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      transition: 'padding 0.3s ease', // Smooth animation
      position: 'fixed',
      inset: 0,
      zIndex: 9999
    }}>
      
      {/* 2. THE FLOATING WINDOW CONTAINER (Holds Header + Content) */}
      <div style={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--surface)', 
        // Logic: Round the corners of the whole window, or 0 if fullscreen
        borderRadius: isFullscreen ? '0' : '16px', 
        border: isFullscreen ? 'none' : '1px solid var(--border)',
        boxShadow: isFullscreen ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)', // Deep shadow for floating effect
        overflow: 'hidden', // IMPORTANT: This clips the header corners to match the radius
        transition: 'all 0.3s ease'
      }}>

        {/* --- HEADER TOOLBAR --- */}
        {/* We hide the header logic inside the window now */}
        {!isFullscreen && (
          <div style={{ 
            height: '60px', 
            borderBottom: '1px solid var(--border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 20px',
            background: 'var(--surface)',
            flexShrink: 0 // Prevent header from squishing
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => navigate('/')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <ArrowLeft size={18} /> Back
              </button>
              <div style={{ height: '20px', width: '1px', background: 'var(--border)' }}></div>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{project.title}</h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>by @{project.owner}</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowCode(!showCode)}
                className="btn-3d"
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '0.85rem',
                  background: showCode ? 'var(--primary)' : 'transparent',
                  color: showCode ? 'white' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {showCode ? <Eye size={16} /> : <Code size={16} />}
                {showCode ? 'Hide Code' : 'View Code'}
              </button>

              <button 
                onClick={() => setIsFullscreen(true)}
                style={{ 
                  padding: '8px', 
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text)'
                }}
                title="Enter Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* --- MAIN CONTENT (Split View) --- */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          
          {/* LEFT: PREVIEW */}
          <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
            <iframe 
              srcDoc={project.html_content} 
              title={project.title}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
            />

            {/* Exit Fullscreen Button (Floating) */}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: 'blur(4px)',
                  zIndex: 50
                }}
              >
                <Minimize2 size={16} /> Exit Fullscreen
              </button>
            )}
          </div>

          {/* RIGHT: CODE SIDEBAR */}
          {showCode && !isFullscreen && (
            <div style={{ 
              width: '40%', 
              maxWidth: '600px', 
              minWidth: '300px',
              borderLeft: '1px solid var(--border)', 
              background: '#1e1e1e', 
              display: 'flex',
              flexDirection: 'column'
            }}>
               <div style={{ 
                 padding: '10px 15px', 
                 borderBottom: '1px solid #333', 
                 fontSize: '0.8rem', 
                 color: '#888',
                 fontFamily: 'monospace',
                 display: 'flex',
                 justifyContent: 'space-between',
                 background: '#252526'
               }}>
                 <span>index.html</span>
                 <span>Read Only</span>
               </div>
               <div style={{ flex: 1, overflow: 'auto' }}>
                 <SyntaxHighlighter 
                    language="html" 
                    style={vscDarkPlus} 
                    customStyle={{ margin: 0, padding: '20px', fontSize: '14px', lineHeight: '1.5', minHeight: '100%' }}
                    showLineNumbers={true}
                    wrapLongLines={true}
                 >
                    {project.html_content}
                 </SyntaxHighlighter>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}