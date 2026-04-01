import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileText, LogIn } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

const DEMO_ACCOUNTS = [
  { email: 'alice@demo.com', name: 'Alice Johnson' },
  { email: 'bob@demo.com',   name: 'Bob Smith' },
  { email: 'carol@demo.com', name: 'Carol White' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function quickLogin(demoEmail) {
    setEmail(demoEmail)
    setPassword('password123')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <FileText size={32} color="#4f46e5" />
          <h1>Ajaia Docs</h1>
        </div>
        <p className={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            <LogIn size={16} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.demo}>
          <p>Demo accounts (password: <code>password123</code>)</p>
          <div className={styles.demoList}>
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.email} className={styles.demoBtn} onClick={() => quickLogin(a.email)}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
