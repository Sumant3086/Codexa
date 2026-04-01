import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Share2, Save, Check } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Editor from '../components/Editor'
import ShareModal from '../components/ShareModal'
import styles from './EditorPage.module.css'

const AUTOSAVE_DELAY = 1500

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(null)
  const [saveState, setSaveState] = useState('saved') // 'saved' | 'saving' | 'unsaved'
  const [showShare, setShowShare] = useState(false)
  const saveTimer = useRef(null)
  const isOwner = doc?.role === 'owner'
  const canEdit = doc?.role === 'owner' || doc?.role === 'edit'

  useEffect(() => {
    fetchDoc()
  }, [id])

  async function fetchDoc() {
    try {
      const { data } = await api.get(`/api/documents/${id}`)
      setDoc(data)
      setTitle(data.title)
      setContent(data.content)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load document')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const scheduleSave = useCallback((newTitle, newContent) => {
    if (!canEdit) return
    setSaveState('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(newTitle, newContent), AUTOSAVE_DELAY)
  }, [canEdit, id])

  async function save(t, c) {
    setSaveState('saving')
    try {
      await api.patch(`/api/documents/${id}`, { title: t, content: c })
      setSaveState('saved')
    } catch {
      setSaveState('unsaved')
      toast.error('Failed to save')
    }
  }

  function handleTitleChange(e) {
    const val = e.target.value
    setTitle(val)
    scheduleSave(val, content)
  }

  function handleTitleBlur() {
    clearTimeout(saveTimer.current)
    if (canEdit) save(title, content)
  }

  function handleContentChange(newContent) {
    setContent(newContent)
    scheduleSave(title, newContent)
  }

  function handleManualSave() {
    clearTimeout(saveTimer.current)
    save(title, content)
  }

  if (loading) return <div className={styles.loading}>Loading document...</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </button>

        <input
          className={styles.titleInput}
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          disabled={!canEdit}
          placeholder="Untitled Document"
          maxLength={200}
        />

        <div className={styles.headerRight}>
          <SaveIndicator state={saveState} onSave={handleManualSave} canEdit={canEdit} />

          {!canEdit && (
            <span className={styles.viewBadge}>View Only</span>
          )}

          {isOwner && (
            <button className={styles.shareBtn} onClick={() => setShowShare(true)}>
              <Share2 size={15} /> Share
            </button>
          )}
        </div>
      </header>

      <div className={styles.editorWrap}>
        <Editor
          content={content}
          onChange={handleContentChange}
          editable={canEdit}
        />
      </div>

      {showShare && (
        <ShareModal
          doc={doc}
          onClose={() => setShowShare(false)}
          onUpdate={fetchDoc}
        />
      )}
    </div>
  )
}

function SaveIndicator({ state, onSave, canEdit }) {
  if (!canEdit) return null
  return (
    <button
      className={`${styles.saveIndicator} ${styles[state]}`}
      onClick={onSave}
      title="Save now"
    >
      {state === 'saved' && <><Check size={13} /> Saved</>}
      {state === 'saving' && 'Saving...'}
      {state === 'unsaved' && <><Save size={13} /> Save</>}
    </button>
  )
}
