import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Toolbar from './Toolbar'
import styles from './Editor.module.css'

export default function Editor({ content, onChange, editable }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    editable,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
  })

  // Load content once editor is ready
  useEffect(() => {
    if (!editor || !content) return
    try {
      const parsed = JSON.parse(content)
      // Handle HTML-imported content (from file upload)
      if (parsed.__html) {
        editor.commands.setContent(parsed.__html)
      } else {
        editor.commands.setContent(parsed)
      }
    } catch {
      editor.commands.setContent(content)
    }
  }, [editor]) // only on mount

  // Sync editable state
  useEffect(() => {
    if (editor) editor.setEditable(editable)
  }, [editor, editable])

  return (
    <div className={styles.wrap}>
      {editable && <Toolbar editor={editor} />}
      <div className={`${styles.editorBody} ${!editable ? styles.readonly : ''}`}>
        <EditorContent editor={editor} className={styles.content} />
      </div>
    </div>
  )
}
