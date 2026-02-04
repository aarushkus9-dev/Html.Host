// src/AlertContext.jsx
import { createContext, useContext, useState } from 'react'
import { X, CheckCircle, AlertTriangle } from 'lucide-react'

const AlertContext = createContext()

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([])

  // Helper to add alert
  const showAlert = (message, type = 'success') => {
    const id = Date.now()
    setAlerts(prev => [...prev, { id, message, type }])
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }, 3000)
  }

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="toast-container">
        {alerts.map(alert => (
          <div key={alert.id} className="toast" style={{ borderColor: alert.type === 'error' ? '#ef4444' : '#8b5cf6' }}>
            {alert.type === 'error' ? <AlertTriangle size={18} color="#ef4444"/> : <CheckCircle size={18} color="#8b5cf6"/>}
            <span style={{flex: 1}}>{alert.message}</span>
            <button onClick={() => removeAlert(alert.id)} style={{background: 'none', border: 'none', color: '#666', cursor: 'pointer'}}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  )
}

export const useAlert = () => useContext(AlertContext)