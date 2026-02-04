import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminDashboard() {
  const [allProjects, setAllProjects] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projects') // 'projects' or 'users'

  useEffect(() => {
    fetchAllProjects()
    fetchAllUsers()
  }, [])

  const fetchAllProjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setAllProjects(data)
    if (error) console.error('Error fetching:', error.message)
    setLoading(false)
  }

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('id', { ascending: false })
    
    if (data) setAllUsers(data)
    if (error) console.error('Error fetching users:', error.message)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return
    
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) {
      setAllProjects(prev => prev.filter(p => p.id !== id))
    } else {
      alert("Error deleting project")
    }
  }

  const handleBanUser = async (userId) => {
    const reason = prompt("Enter ban reason:")
    if (!reason) return
    
    const durationDays = prompt("Enter ban duration in days (leave empty for permanent ban):")
    
    let banExpiresAt = null
    if (durationDays && !isNaN(durationDays)) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays))
      banExpiresAt = expiryDate.toISOString()
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        banned: true, 
        ban_reason: reason,
        ban_expires_at: banExpiresAt
      })
      .eq('id', userId)
    
    if (!error) {
      alert("User banned successfully")
      fetchAllUsers()
    } else {
      alert("Error banning user")
    }
  }

  const handleUnbanUser = async (userId) => {
    if (!window.confirm("Unban this user?")) return
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        banned: false, 
        ban_reason: null,
        ban_expires_at: null
      })
      .eq('id', userId)
    
    if (!error) {
      alert("User unbanned successfully")
      fetchAllUsers()
    } else {
      alert("Error unbanning user")
    }
  }

  return (
    <div className="d-div">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            {activeTab === 'projects' 
              ? `Overlooking ${allProjects.length} total projects`
              : `Managing ${allUsers.length} total users`
            }
          </p>
        </div>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>
      </header>

      {activeTab === 'projects' ? (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project Details</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="project-info">
                      <span className="project-title">{p.title}</span>
                      <span className="project-id">ID: {p.id}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {allProjects.length === 0 && !loading && (
            <div className="empty-state">No projects found.</div>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="project-info">
                      <span className="project-title">{u.email || 'No email'}</span>
                      <span className="project-id">ID: {u.id}</span>
                    </div>
                  </td>
                  <td>
                    {u.banned ? (
                      <span className="status-badge banned">
                        Banned
                        {u.ban_expires_at && ` (Until ${new Date(u.ban_expires_at).toLocaleDateString()})`}
                      </span>
                    ) : (
                      <span className="status-badge active">Active</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {u.banned ? (
                      <button className="unban-btn" onClick={() => handleUnbanUser(u.id)}>
                        Unban
                      </button>
                    ) : (
                      <button className="ban-btn" onClick={() => handleBanUser(u.id)}>
                        Ban User
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {allUsers.length === 0 && !loading && (
            <div className="empty-state">No users found.</div>
          )}
        </div>
      )}

      <style>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .admin-header h1 { font-size: 1.5rem; margin: 0; }
        .admin-header p { color: #94a3b8; margin: 4px 0 0 0; }

        .tab-buttons {
          display: flex;
          gap: 10px;
        }
        .tab-btn {
          background: #27272a;
          color: #94a3b8;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.2s;
        }
        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }
        .tab-btn:hover:not(.active) {
          background: #3f3f46;
        }

        .table-wrapper {
          background-color: #131314ff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--card-shadow);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          background: #27272a;
          padding: 1rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }
        .admin-table td {
          padding: 1rem;
          border-bottom: 1px solid #27272a;
        }
        .project-info { display: flex; flex-direction: column; }
        .project-title { font-weight: 600; color: #fff; }
        .project-id { font-size: 0.7rem; color: #64748b; font-family: monospace; }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .status-badge.active {
          background: #065f46;
          color: #6ee7b7;
        }
        .status-badge.banned {
          background: #7f1d1d;
          color: #fecaca;
        }

        .delete-btn, .ban-btn {
          background: #7f1d1d;
          color: #fecaca;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.2s;
        }
        .delete-btn:hover, .ban-btn:hover { background: #b91c1c; }

        .unban-btn {
          background: #065f46;
          color: #6ee7b7;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.2s;
        }
        .unban-btn:hover { background: #047857; }

        .empty-state { padding: 3rem; text-align: center; color: #64748b; }
      `}</style>
    </div>
  )
}