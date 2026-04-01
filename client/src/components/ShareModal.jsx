import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { X, UserPlus, Trash2, Crown, Eye, Edit3 } from 'lucide-react'
import api from '../api'
import styles from './ShareModal.module.css'

export default function ShareModal({ doc, onClose, onUpdate }) {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [permission, setPermission] = useState('view')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/auth/users').then(r => {
      // Filter out already-shared users
      const sharedIds = new Set(doc.shares.map(s => s.shared_with_id))
      setUsers(r.data.filter(u => !sharedIds.has(u.id)))
    })
  }, [doc.shares])

  async function handleShare() {
    if (!selectedUser) return toast.error('Select a user to share with')
    setLoading(true)
    try {
      await api.post(`/api/documents/${doc.id}/share`, { user_id: selectedUser, permission })
      toast.success('Document shared')
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(userId, name) {
    if (!confirm(`Remove ${name}'s access?`)) return
    try {
      await api.delete(`/api/documents/${doc.id}/share/${userId}`)
      toast.success('Access revoked')
      onUpdate()
      onClose()
    } catch {
      toast.error('Failed to revoke access')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Share "{doc.title}"</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.body}>
          {/* Current access */}
          <div className={styles.section}>
            <h3>People with access</h3>
            <div className={styles.accessList}>
              <div className={styles.accessItem}>
                <div className={styles.avatar}>{doc.owner?.name?.[0]?.toUpperCase()}</div>
                <div className={styles.accessInfo}>
                  <span className={styles.accessName}>{doc.owner?.name} (you)</span>
                  <span className={styles.accessEmail}>{doc.owner?.email}</span>
                </div>
                <span className={styles.roleBadge}><Crown size={12} /> Owner</span>
              </div>

              {doc.shares.map(s => (
                <div key={s.shared_with_id} className={styles.accessItem}>
                  <div className={styles.avatar}>{s.name?.[0]?.toUpperCase()}</div>
                  <div className={styles.accessInfo}>
                    <span className={styles.accessName}>{s.name}</span>
                    <span className={styles.accessEmail}>{s.email}</span>
                  </div>
                  <span className={`${styles.roleBadge} ${s.permission === 'edit' ? styles.edit : styles.view}`}>
                    {s.permission === 'edit' ? <><Edit3 size={11} /> Can edit</> : <><Eye size={11} /> View only</>}
                  </span>
                  <button
                    className={styles.revokeBtn}
                    onClick={() => handleRevoke(s.shared_with_id, s.name)}
                    title="Remove access"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add new share */}
          {users.length > 0 && (
            <div className={styles.section}>
              <h3>Add people</h3>
              <div className={styles.addRow}>
                <select
                  className={styles.select}
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                >
                  <option value="">Select a person...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <select
                  className={styles.permSelect}
                  value={permission}
                  onChange={e => setPermission(e.target.value)}
                >
                  <option value="view">View only</option>
                  <option value="edit">Can edit</option>
                </select>
                <button className={styles.shareBtn} onClick={handleShare} disabled={loading}>
                  <UserPlus size={15} />
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          )}

          {users.length === 0 && doc.shares.length === 0 && (
            <p className={styles.noUsers}>All available users already have access.</p>
          )}
          {users.length === 0 && doc.shares.length > 0 && (
            <p className={styles.noUsers}>All available users already have access.</p>
          )}
        </div>
      </div>
    </div>
  )
}
