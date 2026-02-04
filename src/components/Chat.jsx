import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Send } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Chat({ session }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef()

  useEffect(() => {
    fetchMessages()
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }, [])

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50)
    if (data) setMessages(data)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    await supabase.from('messages').insert([{ 
      content: newMessage, 
      user_id: session.user.id,
      username: session.user.email.split('@')[0] 
    }])
    setNewMessage('')
  }

  return (
    <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="box-3d" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>Community Chat</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{m.username}: </span>
            <span>{m.content}</span>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '10px', gap: '5px' }}>
        <input className="input-3d" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Say hi..." />
        <button className="btn-3d"><Send size={16}/></button>
      </form>
    </motion.div>
  )
}