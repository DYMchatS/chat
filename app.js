// ✅ 正确的代码（请复制这一段）
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// 1. 初始化 Supabase 客户端
// 这里会读取你在 Netlify 设置的环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  // 2. 检查当前是否有用户登录
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 3. 登录/注册函数
  const handleAuth = async (type) => {
    setLoading(true)
    const { error } = type === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) alert(error.message)
    setLoading(false)
  }

  // 4. 获取消息
  const fetchMessages = async () => {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (!error) setMessages(data)
  }

  // 登录后自动获取消息
  useEffect(() => {
    if (session) fetchMessages()
  }, [session])

  // 5. 发送消息
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await supabase.from('messages').insert([
      { content: newMessage, user_id: session.user.id }
    ])

    if (!error) {
      setNewMessage('')
      fetchMessages() // 发送后刷新列表
    }
  }

  // --- 界面渲染部分 ---

  // 如果没登录，显示登录框
  if (!session) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>🔐 聊天室登录</h2>
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleAuth('login')} disabled={loading} style={{ flex: 1, padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            {loading ? '处理中...' : '登录'}
          </button>
          <button onClick={() => handleAuth('signup')} disabled={loading} style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
            注册
          </button>
        </div>
      </div>
    )
  }

  // 如果已登录，显示聊天界面
  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>💬 在线聊天室</h3>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: '5px 10px', cursor: 'pointer' }}>退出登录</button>
      </div>

      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #eee', padding: '10px', marginBottom: '10px', background: '#f9f9f9' }}>
        {messages.length === 0 ? <p style={{textAlign:'center', color:'#999'}}>暂无消息，快来聊两句吧！</p> : messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: '8px', padding: '8px', background: 'white', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <strong style={{ fontSize: '0.8em', color: '#666' }}>{msg.user_id.slice(0, 6)}...:</strong>
            <div>{msg.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="输入消息..."
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>发送</button>
      </form>
    </div>
  )
}

export default App
