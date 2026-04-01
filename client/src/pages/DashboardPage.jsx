import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileText, Plus, Upload, LogOut, Users, Crown, Trash2, ExternalLink } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [owned, setOwned] = useState([])
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    try {
      const { data } = await api.get('/api/documents')
      setOwned(data.owned)
      setShared(data.shared)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  async function createDoc() {
    try {
      const { data } = await api.post('/api/documents', { title: 'Untitled Document' })
      navigate(`/doc/${data.id}`)
    } catch {
      toast.error('Failed to create document')
    }
  }

  async function deleteDoc(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    try {
      await api.delete(`/api/documents/${id}`)
      setOwned(prev => prev.filter(d => d.id !== id))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['txt', 'md', 'docx'].includes(ext)) {
      toast.error('Only .txt, .md, and .docx files are supported')
      return
    }
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/api/upload', form)
      toast.success('File imported successfully')
      navigate(`/doc/${data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  function formatDate(str) {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <FileText size={24} color="#4f46e5" />
          <span className={styles.brand}>Ajaia Docs</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{user.name}</span>
          <button className={styles.logoutBtn} onClick={logout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.actions}>
          <button className={styles.newBtn} onClick={createDoc}>
            <Plus size={18} /> New Document
          </button>
          <button
            className={styles.uploadBtn}
            onClick={() => fileRef.current.click()}
            disabled={uploading}
          >
            <Upload size={18} />
            {uploading ? 'Importing...' : 'Import File'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.docx"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <span className={styles.uploadHint}>Supports .txt, .md, .docx (max 5MB)</span>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading documents...</div>
        ) : (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Crown size={16} /> My Documents
                <span className={styles.count}>{owned.length}</span>
              </h2>
              {owned.length === 0 ? (
                <div className={styles.empty}>
                  No documents yet. Create one to get started.
                </div>
              ) : (
                <div className={styles.grid}>
                  {owned.map(doc => (
                    <div key={doc.id} className={styles.card} onClick={() => navigate(`/doc/${doc.id}`)}>
                      <div className={styles.cardIcon}><FileText size={20} /></div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>{doc.title}</div>
                        <div className={styles.cardMeta}>Updated {formatDate(doc.updated_at)}</div>
                      </div>
                      <div className={styles.cardActions}>
                        <span className={`${styles.badge} ${styles.owner}`}>Owner</span>
                        <button
                          className={styles.deleteBtn}
                          onClick={e => deleteDoc(doc.id, e)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Users size={16} /> Shared with Me
                <span className={styles.count}>{shared.length}</span>
              </h2>
              {shared.length === 0 ? (
                <div className={styles.empty}>No documents have been shared with you yet.</div>
              ) : (
                <div className={styles.grid}>
                  {shared.map(doc => (
                    <div key={doc.id} className={styles.card} onClick={() => navigate(`/doc/${doc.id}`)}>
                      <div className={styles.cardIcon}><FileText size={20} /></div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>{doc.title}</div>
                        <div className={styles.cardMeta}>
                          By {doc.owner_name} · Updated {formatDate(doc.updated_at)}
                        </div>
                      </div>
                      <div className={styles.cardActions}>
                        <span className={`${styles.badge} ${styles.shared}`}>
                          {doc.role === 'edit' ? 'Can Edit' : 'View Only'}
                        </span>
                        <ExternalLink size={14} color="#718096" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
