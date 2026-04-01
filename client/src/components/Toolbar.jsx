import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Undo, Redo, Minus
} from 'lucide-react'
import styles from './Toolbar.module.css'

export default function Toolbar({ editor }) {
  if (!editor) return null

  const btn = (action, active, title, icon) => (
    <button
      key={title}
      className={`${styles.btn} ${active ? styles.active : ''}`}
      onMouseDown={e => { e.preventDefault(); action() }}
      title={title}
    >
      {icon}
    </button>
  )

  const sep = (key) => <div key={key} className={styles.sep} />

  return (
    <div className={styles.toolbar}>
      {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        editor.isActive('heading', { level: 1 }), 'Heading 1', <Heading1 size={15} />)}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 }), 'Heading 2', <Heading2 size={15} />)}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        editor.isActive('heading', { level: 3 }), 'Heading 3', <Heading3 size={15} />)}

      {sep('s1')}

      {btn(() => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold'), 'Bold (Ctrl+B)', <Bold size={15} />)}
      {btn(() => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'), 'Italic (Ctrl+I)', <Italic size={15} />)}
      {btn(() => editor.chain().focus().toggleUnderline().run(),
        editor.isActive('underline'), 'Underline (Ctrl+U)', <Underline size={15} />)}
      {btn(() => editor.chain().focus().toggleStrike().run(),
        editor.isActive('strike'), 'Strikethrough', <Strikethrough size={15} />)}

      {sep('s2')}

      {btn(() => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'), 'Bullet List', <List size={15} />)}
      {btn(() => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'), 'Numbered List', <ListOrdered size={15} />)}

      {sep('s3')}

      {btn(() => editor.chain().focus().setTextAlign('left').run(),
        editor.isActive({ textAlign: 'left' }), 'Align Left', <AlignLeft size={15} />)}
      {btn(() => editor.chain().focus().setTextAlign('center').run(),
        editor.isActive({ textAlign: 'center' }), 'Align Center', <AlignCenter size={15} />)}
      {btn(() => editor.chain().focus().setTextAlign('right').run(),
        editor.isActive({ textAlign: 'right' }), 'Align Right', <AlignRight size={15} />)}

      {sep('s4')}

      {btn(() => editor.chain().focus().setHorizontalRule().run(),
        false, 'Horizontal Rule', <Minus size={15} />)}

      {sep('s5')}

      {btn(() => editor.chain().focus().undo().run(),
        false, 'Undo (Ctrl+Z)', <Undo size={15} />)}
      {btn(() => editor.chain().focus().redo().run(),
        false, 'Redo (Ctrl+Y)', <Redo size={15} />)}
    </div>
  )
}
