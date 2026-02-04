import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAlert } from '../AlertContext'
import { Save } from 'lucide-react'

export default function Editor({ session }) {
  // Removed [title, setTitle] state as it is now derived from HTML
  const [html, setHtml] = useState(
    `<title>My Awesome Project</title>
<style>
  body {
    font-family: sans-serif;
    text-align: center;
    padding: 50px;
  }

  h1 {
    color: #333;
  }
</style>

<h1>Hello World</h1>
<p>Edit me!</p>`
  )
  const [saving, setSaving] = useState(false)

  const { showAlert } = useAlert()

  const handleSave = async () => {
    setSaving(true)

    // 1. Extract Title from HTML using DOMParser
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const extractedTitle = doc.querySelector('title')?.innerText

    // Validate that a title exists
    if (!extractedTitle) {
      setSaving(false)
      return showAlert('Please add a <title> tag to your HTML code.', 'error')
    }

    // 2. Insert into Supabase including author details
    const { error } = await supabase.from('projects').insert({
      user_id: session.user.id,
      title: extractedTitle,
      html_content: html,
      // "Who created the project": Storing the username alongside the ID
      owner: session.user.username,
    })

    if (error) {
      showAlert(error.message, 'error')
    } else {
      showAlert(`Published "${extractedTitle}" successfully!`)
    }

    setSaving(false)
  }

  return (
    <div
      style={{
        height: '75vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
        
        {/* Display who is editing */}
        <div style={{ color: '#888', fontStyle: 'italic', fontSize: '14px' }}>
          Author: <span style={{ color: '#fff' }}>{session.user.username}</span>
        </div>

        <button
          className="btn-3d"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Publishing...' : 'Publish'}
        </button>
      </div>

      {/* Editor */}
      <div
        className="box-3d"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {/* Code Input */}
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          spellCheck="false"
          placeholder="<html>...</html>"
          style={{
            width: '50%',
            background: '#1e1e1e',
            color: '#d4d4d4',
            border: 'none',
            resize: 'none',
            padding: '20px',
            fontFamily: '"Fira Code", monospace',
            fontSize: '14px',
            outline: 'none',
            lineHeight: '1.5',
          }}
        />

        {/* Live Preview */}
        <div
          style={{
            width: '50%',
            background: 'white',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              padding: '5px 10px',
              background: '#eee',
              color: '#555',
              fontSize: '10px',
              fontWeight: 'bold',
              zIndex: 10,
            }}
          >
            PREVIEW
            <div style={{backgroundColor: '#59ff43', color: '#59ff43', borderRadius:'11rem', width: '.5rem', height: '.5rem', position: 'relative', top: '.1rem', left: '.1rem'}}></div>
          </div>

          <iframe
            title="preview"
            srcDoc={html}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  )
}