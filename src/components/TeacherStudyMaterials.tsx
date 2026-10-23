import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Video,
  UploadCloud,
  Check,
  X,
  Search,
  RefreshCw,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Undo,
  Redo,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileCheck,
  Type,
  Sparkles,
  Paintbrush,
  Superscript,
  Subscript,
  StretchVertical,
  PenTool,
} from 'lucide-react';
import { WorksheetQuestionBuilder } from './WorksheetQuestionBuilder';
import { ArticleAiImageModal } from './ArticleAiImageModal';
import { getDefaultGrade, getDefaultSubject } from '../utils/teacherPreferences';
import {
  type StudyMaterial,
  type StudyMediaType,
  type MaterialStatus,
  STANDARD_GRADES,
  STANDARD_SUBJECTS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  FONT_SIZE_STEPS,
  LINE_SPACING_OPTIONS,
} from '../types/studyMaterial';

interface TeacherStudyMaterialsProps {
  setNotice: (msg: string) => void;
  onViewPortal?: () => void;
}

export function TeacherStudyMaterials({ setNotice }: TeacherStudyMaterialsProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudyMaterial | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/study-materials', { credentials: 'same-origin' }).then((r) => r.json());
      if (res.materials) setMaterials(res.materials);
    } catch {
      setNotice('Could not load study materials.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete study material "${title}"?`)) return;
    try {
      const res = await fetch(`/api/study-materials/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      }).then((r) => r.json());
      if (res.ok) {
        setNotice('Study material deleted successfully.');
        setMaterials((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      setNotice('Error deleting study material.');
    }
  }

  const filtered = materials.filter((m) => {
    if (selectedGrade !== 'ALL' && m.grade !== selectedGrade) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!m.title.toLowerCase().includes(q) && !m.subject.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <section className="view-enter study-manager-view">
      <div className="page-heading">
        <div>
          <span className="overline">STUDENT RESOURCE MANAGEMENT</span>
          <h1>Study Materials & Lessons</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="button button-primary"
            onClick={() => {
              setEditingItem(null);
              setEditorOpen(true);
            }}
          >
            <Plus size={16} /> New Study Material
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="filter-shelf" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', margin: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', minWidth: '260px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', padding: '8px', width: '100%', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`filter-pill ${selectedGrade === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedGrade('ALL')}
          >
            All Grades
          </button>
          {STANDARD_GRADES.map((g) => (
            <button
              key={g}
              className={`filter-pill ${selectedGrade === g ? 'active' : ''}`}
              onClick={() => setSelectedGrade(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <button className="icon-button" onClick={() => void load()} title="Refresh list">
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Table list */}
      {loading ? (
        <div className="empty-state">
          <RefreshCw size={24} className="spin" color="#0284c7" />
          <p>Loading study materials...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={36} color="#94a3b8" />
          <h3>No study materials found</h3>
          <p>Get started by publishing your first lesson, PDF formula sheet, or video lecture.</p>
          <button
            className="button button-primary"
            onClick={() => {
              setEditingItem(null);
              setEditorOpen(true);
            }}
          >
            <Plus size={16} /> Create Material
          </button>
        </div>
      ) : (
        <div className="materials-admin-grid">
          {filtered.map((item) => (
            <div key={item.id} className="material-admin-card">
              <div className="admin-card-header">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`media-type-badge media-type-${item.mediaType.toLowerCase()}`}>
                    {item.mediaType === 'VIDEO' ? <Video size={13} /> : item.mediaType === 'PDF' ? <FileText size={13} /> : item.mediaType === 'WORKSHEET' ? <FileCheck size={13} /> : <BookOpen size={13} />} {item.mediaType}
                  </span>
                  <span className="grade-badge-overlay" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {item.grade}
                  </span>
                </div>
                <span className={`status-pill status-${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>

              <h3 className="admin-card-title">{item.title}</h3>
              <p className="admin-card-desc">{item.description || 'No excerpt summary provided.'}</p>

              <div className="admin-card-meta">
                <span>📚 {item.subject}</span>
                <span>•</span>
                <span><Eye size={12} /> {item.views} views</span>
              </div>

              <div className="admin-card-actions">
                <button
                  className="button button-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px', height: '30px' }}
                  onClick={() => {
                    setEditingItem(item);
                    setEditorOpen(true);
                  }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  className="icon-button danger-hover"
                  style={{ height: '30px', width: '30px' }}
                  title="Delete material"
                  onClick={() => void handleDelete(item.id, item.title)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && (
        <StudyMaterialEditorModal
          initialData={editingItem}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            setNotice('Study material saved successfully!');
            void load();
          }}
          setNotice={setNotice}
        />
      )}
    </section>
  );
}

// EDITOR MODAL
function StudyMaterialEditorModal({
  initialData,
  onClose,
  onSaved,
  setNotice,
}: {
  initialData: StudyMaterial | null;
  onClose: () => void;
  onSaved: () => void;
  setNotice: (msg: string) => void;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const initialHtmlRef = useRef(initialData?.content || '');
  const contentRef = useRef(initialData?.content || '');
  const [wordCount, setWordCount] = useState(() => {
    const raw = (initialData?.content || '').replace(/<[^>]*>/g, ' ').trim();
    return raw ? raw.split(/\s+/).filter(Boolean).length : 0;
  });
  const wordCountTimerRef = useRef<any>(null);

  const [grade, setGrade] = useState(() => initialData?.grade || getDefaultGrade());
  const [subject, setSubject] = useState(() => initialData?.subject || getDefaultSubject());
  const [mediaType, setMediaType] = useState<StudyMediaType>(initialData?.mediaType || 'ARTICLE');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [readTime, setReadTime] = useState(initialData?.readTime || '8 min read');
  const [status] = useState<MaterialStatus>(initialData?.status || 'PUBLISHED');
  const [fileUrl, setFileUrl] = useState(initialData?.fileUrl || '');
  const [fileName, setFileName] = useState(initialData?.fileName || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Article formatting editor state
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const articleImageInputRef = useRef<HTMLInputElement>(null);
  const lastActiveCellRef = useRef<HTMLTableCellElement | null>(null);
  const lastSelectedElementRef = useRef<HTMLElement | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [uploadingArticleImg, setUploadingArticleImg] = useState(false);
  const isDraggingColRef = useRef(false);

  const [currentFontFamily, setCurrentFontFamily] = useState('Arial, sans-serif');
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [currentLineSpacing, setCurrentLineSpacing] = useState('1.7');
  const [formatPainterStyle, setFormatPainterStyle] = useState<{
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    lineHeight?: string;
    backgroundColor?: string;
  } | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [selectedTableInfo, setSelectedTableInfo] = useState<{
    table: HTMLTableElement;
    cell: HTMLTableCellElement;
    colIndex: number;
    totalCols: number;
    currentWidth: string;
  } | null>(null);

  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgWidth, setImgWidth] = useState<string>('100%');
  const [imgHeight, setImgHeight] = useState<string>('auto');
  const [imgAlign, setImgAlign] = useState<'left' | 'center' | 'right'>('center');

  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [restoredDraftAvailable, setRestoredDraftAvailable] = useState(false);
  const [showAiImageModal, setShowAiImageModal] = useState(false);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      contentRef.current = html;
      if (wordCountTimerRef.current) clearTimeout(wordCountTimerRef.current);
      wordCountTimerRef.current = setTimeout(() => {
        const raw = html.replace(/<[^>]*>/g, ' ').trim();
        setWordCount(raw ? raw.split(/\s+/).filter(Boolean).length : 0);
      }, 400);
    }
  };

  // Check if an unsaved local draft exists on open
  useEffect(() => {
    if (!initialData) {
      try {
        const saved = localStorage.getItem('study_material_auto_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.title?.trim() || parsed.content?.trim())) {
            setRestoredDraftAvailable(true);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [initialData]);

  // Periodically auto-save draft to localStorage while typing
  useEffect(() => {
    if (initialData) return;
    const interval = setInterval(() => {
      const curContent = editorMode === 'visual' && visualEditorRef.current ? visualEditorRef.current.innerHTML : contentRef.current;
      if (title.trim() || curContent.trim() || description.trim()) {
        try {
          localStorage.setItem('study_material_auto_draft', JSON.stringify({
            title,
            description,
            content: curContent,
            grade,
            subject,
            mediaType,
            videoUrl,
            coverImage,
            readTime,
            status,
            fileUrl,
            fileName,
            savedAt: new Date().toLocaleTimeString(),
          }));
        } catch {
          // ignore
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [title, description, grade, subject, mediaType, videoUrl, coverImage, readTime, status, fileUrl, fileName, initialData, editorMode]);

  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
        document.execCommand('styleWithCSS', false, 'false');
      } catch {
        // ignore
      }
    }
  }, [editorMode]);

  function restoreLocalDraft() {
    try {
      const saved = localStorage.getItem('study_material_auto_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.content) {
          setContent(parsed.content);
          contentRef.current = parsed.content;
          initialHtmlRef.current = parsed.content;
          if (visualEditorRef.current) visualEditorRef.current.innerHTML = parsed.content;
          const raw = parsed.content.replace(/<[^>]*>/g, ' ').trim();
          setWordCount(raw ? raw.split(/\s+/).filter(Boolean).length : 0);
        }
        if (parsed.grade) setGrade(parsed.grade);
        if (parsed.subject) setSubject(parsed.subject);
        if (parsed.mediaType) setMediaType(parsed.mediaType);
        if (parsed.videoUrl) setVideoUrl(parsed.videoUrl);
        if (parsed.coverImage) setCoverImage(parsed.coverImage);
        if (parsed.readTime) setReadTime(parsed.readTime);
        setNotice('Restored your unsaved draft!');
      }
    } catch {
      // ignore
    } finally {
      setRestoredDraftAvailable(false);
    }
  }

  function discardLocalDraft() {
    localStorage.removeItem('study_material_auto_draft');
    setRestoredDraftAvailable(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const uploadRes = await fetch('/api/study-materials/upload', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64,
            mediaType: mediaType === 'ARTICLE' ? 'PDF' : mediaType,
          }),
        }).then((r) => r.json());

        if (uploadRes.fileUrl) {
          setFileUrl(uploadRes.fileUrl);
          setFileName(uploadRes.fileName);
          setNotice(`File "${file.name}" uploaded successfully!`);
        } else {
          setNotice(uploadRes.error || 'Failed to upload file.');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setNotice('File upload error.');
      setUploading(false);
    }
  }

  async function handleCoverFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const uploadRes = await fetch('/api/study-materials/upload', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64,
              mediaType: 'IMAGE',
            }),
          }).then((r) => r.json());

          if (uploadRes.fileUrl) {
            setCoverImage(uploadRes.fileUrl);
            setNotice(`Cover image "${file.name}" uploaded successfully!`);
          } else {
            setCoverImage(base64);
            setNotice(`Cover image loaded.`);
          }
        } catch {
          setCoverImage(base64);
          setNotice(`Cover image loaded.`);
        } finally {
          setUploadingCover(false);
          if (coverFileInputRef.current) coverFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setNotice('Error reading image file.');
      setUploadingCover(false);
    }
  }

  function execFormat(e: React.MouseEvent, command: string, value: string | undefined = undefined) {
    e.preventDefault();
    if (editorMode === 'code') {
      insertTagInCode(command, value);
      return;
    }
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
      restoreSelection();
      try {
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand(command, false, value);
      } catch {
        // ignore
      }
      handleVisualInput();
    }
  }

  function toggleList(e: React.MouseEvent, type: 'unordered' | 'ordered') {
    e.preventDefault();
    if (editorMode === 'code') {
      insertTagInCode(type === 'unordered' ? 'insertUnorderedList' : 'insertOrderedList');
      return;
    }

    const editor = visualEditorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();

    const command = type === 'unordered' ? 'insertUnorderedList' : 'insertOrderedList';
    const tag = type === 'unordered' ? 'ul' : 'ol';

    // 1. If editor is empty or contains only break/empty block, initialize with list item
    const inner = editor.innerHTML.trim();
    if (!inner || inner === '<br>' || inner === '<p><br></p>' || inner === '<p></p>') {
      editor.innerHTML = `<${tag}><li><br></li></${tag}><p><br></p>`;
      const li = editor.querySelector('li');
      if (li) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(li, 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      handleVisualInput();
      saveSelection();
      setNotice(type === 'unordered' ? 'Bullet list created.' : 'Numbered list created.');
      return;
    }

    // 2. Try standard execCommand
    let success = false;
    try {
      document.execCommand('styleWithCSS', false, 'false');
      success = document.execCommand(command, false, undefined);
    } catch {
      success = false;
    }

    // 3. Verify if selection is inside an li
    const sel = window.getSelection();
    let inList = false;
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editor) {
        if (node.nodeName === 'LI' || node.nodeName === 'UL' || node.nodeName === 'OL') {
          inList = true;
          break;
        }
        node = node.parentNode;
      }
    }

    // 4. Fallback if execCommand did not wrap into a list
    if (!success || !inList) {
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          let block: HTMLElement | null = range.startContainer.nodeType === Node.ELEMENT_NODE
            ? (range.startContainer as HTMLElement)
            : range.startContainer.parentElement;

          while (block && block.parentElement && block.parentElement !== editor) {
            block = block.parentElement;
          }

          if (block && block !== editor && block.tagName !== 'TABLE' && !block.closest('table')) {
            const content = block.innerHTML || '<br>';
            const newList = document.createElement(tag);
            newList.innerHTML = `<li>${content}</li>`;
            block.parentNode?.replaceChild(newList, block);
            const li = newList.querySelector('li');
            if (li) {
              const newRange = document.createRange();
              newRange.selectNodeContents(li);
              newRange.collapse(false);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          } else {
            const snippet = `<${tag}><li><br></li></${tag}><p><br></p>`;
            try {
              document.execCommand('insertHTML', false, snippet);
            } catch {
              editor.innerHTML += snippet;
            }
          }
        } else {
          const fragment = range.extractContents();
          const newList = document.createElement(tag);
          const li = document.createElement('li');
          li.appendChild(fragment);
          newList.appendChild(li);
          range.insertNode(newList);
          const newRange = document.createRange();
          newRange.selectNodeContents(li);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }

    handleVisualInput();
    saveSelection();
    setNotice(type === 'unordered' ? 'Bullet list toggled.' : 'Numbered list toggled.');
  }

  function insertTagInCode(command: string, value?: string) {
    const textarea = codeEditorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || 'text';

    let open = '';
    let close = '';
    switch (command) {
      case 'bold': open = '<b>'; close = '</b>'; break;
      case 'italic': open = '<i>'; close = '</i>'; break;
      case 'underline': open = '<u>'; close = '</u>'; break;
      case 'strikeThrough': open = '<s>'; close = '</s>'; break;
      case 'superscript': open = '<sup>'; close = '</sup>'; break;
      case 'subscript': open = '<sub>'; close = '</sub>'; break;
      case 'insertUnorderedList': open = '<ul>\n  <li>'; close = '</li>\n</ul>'; break;
      case 'insertOrderedList': open = '<ol>\n  <li>'; close = '</li>\n</ol>'; break;
      case 'insertHorizontalRule': open = '<hr />\n'; close = ''; break;
      case 'removeFormat': open = ''; close = ''; break;
      case 'formatBlock':
        open = value || '<p>';
        close = value ? value.replace('<', '</') : '</p>';
        break;
      default: return;
    }

    const nextVal = textarea.value.substring(0, start) + open + selected + close + textarea.value.substring(end);
    setContent(nextVal);
    contentRef.current = nextVal;
    setTimeout(() => {
      textarea.selectionStart = start + open.length;
      textarea.selectionEnd = start + open.length + selected.length;
      textarea.focus();
    }, 0);
  }

  function applyAlignment(e: React.MouseEvent, align: 'left' | 'center' | 'right') {
    e.preventDefault();

    if (editorMode === 'code') {
      applyAlignmentInCode(align);
      return;
    }

    if (!visualEditorRef.current) return;
    visualEditorRef.current.focus();

    const selection = window.getSelection();
    let targetNode: Node | null = null;
    if (selection && selection.rangeCount > 0) {
      targetNode = selection.getRangeAt(0).commonAncestorContainer;
    }
    if (!targetNode || targetNode === visualEditorRef.current) {
      targetNode = lastSelectedElementRef.current || lastActiveCellRef.current;
    }

    let targetElem: HTMLElement | null = null;
    if (targetNode) {
      targetElem = targetNode.nodeType === Node.ELEMENT_NODE ? (targetNode as HTMLElement) : targetNode.parentElement;
    }

    // 1. Check for IMAGE / FIGURE
    const activeImg = selectedImg || (visualEditorRef.current.querySelector('img.is-selected') as HTMLImageElement | null);
    const img = activeImg || (targetElem?.tagName === 'IMG'
      ? (targetElem as HTMLImageElement)
      : (targetElem?.querySelector('img') || targetElem?.closest('figure')?.querySelector('img') || (lastSelectedElementRef.current?.tagName === 'IMG' ? lastSelectedElementRef.current as HTMLImageElement : null)));

    const figure = img?.closest('figure') || targetElem?.closest('figure') || lastSelectedElementRef.current?.closest('figure');

    if (img || figure) {
      if (figure) {
        figure.style.textAlign = align;
        if (align === 'center') {
          figure.style.marginLeft = 'auto';
          figure.style.marginRight = 'auto';
        } else if (align === 'right') {
          figure.style.marginLeft = 'auto';
          figure.style.marginRight = '0';
        } else {
          figure.style.marginLeft = '0';
          figure.style.marginRight = 'auto';
        }
      }
      if (img) {
        img.style.display = 'inline-block';
        if (img.parentElement && img.parentElement !== visualEditorRef.current) {
          img.parentElement.style.textAlign = align;
        }
        if (align === 'center') {
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
          img.style.float = 'none';
        } else if (align === 'right') {
          img.style.marginLeft = 'auto';
          img.style.marginRight = '0';
          img.style.float = 'none';
        } else {
          img.style.marginLeft = '0';
          img.style.marginRight = 'auto';
          img.style.float = 'none';
        }
        setImgAlign(align);
      }
      handleVisualInput();
      setNotice(`Image aligned ${align === 'center' ? 'mid (center)' : align}.`);
      return;
    }

    // 2. Check for TABLE
    const activeCell = getActiveTableCell() || lastActiveCellRef.current || (targetElem?.closest('td, th') as HTMLTableCellElement | null);
    const table = (targetElem?.closest('table') as HTMLTableElement | null) || activeCell?.closest('table') || (lastSelectedElementRef.current?.closest('table') as HTMLTableElement | null);

    if (table) {
      // Table block margin alignment
      if (align === 'center') {
        table.style.marginLeft = 'auto';
        table.style.marginRight = 'auto';
      } else if (align === 'right') {
        table.style.marginLeft = 'auto';
        table.style.marginRight = '0';
      } else {
        table.style.marginLeft = '0';
        table.style.marginRight = 'auto';
      }

      // Check if user has specific cells selected or highlighted
      const affectedCells: HTMLElement[] = [];
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        table.querySelectorAll('td, th').forEach((c) => {
          if (range.intersectsNode(c)) {
            affectedCells.push(c as HTMLElement);
          }
        });
      }

      if (affectedCells.length > 0) {
        affectedCells.forEach((c) => {
          c.style.textAlign = align;
          c.querySelectorAll('p, div').forEach((p) => ((p as HTMLElement).style.textAlign = align));
        });
        setNotice(`Selected table cells aligned ${align === 'center' ? 'mid (center)' : align}.`);
      } else if (activeCell) {
        activeCell.style.textAlign = align;
        activeCell.querySelectorAll('p, div').forEach((p) => ((p as HTMLElement).style.textAlign = align));
        setNotice(`Table and cell aligned ${align === 'center' ? 'mid (center)' : align}.`);
      } else {
        table.querySelectorAll('td, th').forEach((c) => {
          (c as HTMLElement).style.textAlign = align;
        });
        setNotice(`Table aligned ${align === 'center' ? 'mid (center)' : align}.`);
      }

      handleVisualInput();
      return;
    }

    // 3. Regular TEXT / BLOCKS (headings, paragraphs, blockquotes, lists)
    const alignCmd = align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : 'justifyRight';
    try {
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand(alignCmd, false, undefined);
    } catch {
      // ignore
    }

    let matchedBlock = false;
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const blocks = visualEditorRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, div, li');
      blocks.forEach((b) => {
        if (range.intersectsNode(b)) {
          (b as HTMLElement).style.textAlign = align;
          matchedBlock = true;
        }
      });
    }

    if (!matchedBlock && targetElem) {
      const block = targetElem.closest('p, h1, h2, h3, h4, h5, h6, blockquote, div, li') as HTMLElement | null;
      if (block && visualEditorRef.current.contains(block)) {
        block.style.textAlign = align;
      } else if (targetElem !== visualEditorRef.current && visualEditorRef.current.contains(targetElem)) {
        targetElem.style.textAlign = align;
      }
    }

    handleVisualInput();
    setNotice(`Text aligned ${align === 'center' ? 'mid (center)' : align}.`);
  }

  function applyAlignmentInCode(align: 'left' | 'center' | 'right') {
    const textarea = codeEditorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    let replacement = '';
    if (selected.trim()) {
      const trimmed = selected.trim();
      if (trimmed.startsWith('<table')) {
        const margin = align === 'center' ? 'margin: 14px auto;' : align === 'right' ? 'margin: 14px 0 14px auto;' : 'margin: 14px auto 14px 0;';
        replacement = `<div style="text-align: ${align}; ${margin}">\n${selected}\n</div>`;
      } else if (trimmed.startsWith('<img') || trimmed.startsWith('<figure')) {
        replacement = `<div style="text-align: ${align};">\n${selected}\n</div>`;
      } else if (/^<(p|h[1-6]|div|blockquote)\b/i.test(trimmed)) {
        replacement = `<div style="text-align: ${align};">\n${selected}\n</div>`;
      } else {
        replacement = `<div style="text-align: ${align};">${selected}</div>`;
      }
    } else {
      const label = align === 'center' ? 'Centered content' : align === 'right' ? 'Right-aligned content' : 'Left-aligned content';
      replacement = `<p style="text-align: ${align};">${label}</p>`;
    }

    const nextVal = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setContent(nextVal);
    contentRef.current = nextVal;
    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = start + replacement.length;
      textarea.focus();
    }, 0);
    setNotice(`HTML aligned ${align === 'center' ? 'mid (center)' : align}.`);
  }

  function insertCustomHtml(htmlSnippet: string) {
    if (editorMode === 'visual') {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        try {
          document.execCommand('insertHTML', false, htmlSnippet);
        } catch {
          visualEditorRef.current.innerHTML += htmlSnippet;
        }
        handleVisualInput();
      }
    } else {
      const textarea = codeEditorRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const nextVal = textarea.value.substring(0, start) + htmlSnippet + textarea.value.substring(end);
        setContent(nextVal);
        contentRef.current = nextVal;
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + htmlSnippet.length;
          textarea.focus();
        }, 0);
      } else {
        const nextVal = (content || '') + '\n' + htmlSnippet;
        setContent(nextVal);
        contentRef.current = nextVal;
      }
    }
  }

  function handleInsertLink(e: React.MouseEvent) {
    e.preventDefault();
    const url = window.prompt('Enter website link URL (e.g. https://...):');
    if (!url) return;
    if (editorMode === 'visual') {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        document.execCommand('createLink', false, url);
        handleVisualInput();
      }
    } else {
      insertCustomHtml(`<a href="${url}" target="_blank" rel="noreferrer">link</a>`);
    }
  }

  const applyImageStyle = (w: string, h: string, align: 'left' | 'center' | 'right') => {
    if (!selectedImg) return;
    const formattedWidth = w ? (w.endsWith('%') || w.endsWith('px') || w === 'auto' ? w : `${w}px`) : '100%';
    const formattedHeight = h ? (h.endsWith('%') || h.endsWith('px') || h === 'auto' ? h : `${h}px`) : 'auto';

    setImgWidth(formattedWidth);
    setImgHeight(formattedHeight);
    setImgAlign(align);

    selectedImg.style.width = formattedWidth;
    selectedImg.style.height = formattedHeight;
    selectedImg.style.display = 'block';

    const fig = selectedImg.closest('figure');
    if (fig) {
      fig.style.textAlign = align;
      if (align === 'center') {
        fig.style.marginLeft = 'auto';
        fig.style.marginRight = 'auto';
      } else if (align === 'left') {
        fig.style.marginLeft = '0';
        fig.style.marginRight = 'auto';
      } else if (align === 'right') {
        fig.style.marginLeft = 'auto';
        fig.style.marginRight = '0';
      }
    }

    if (align === 'center') {
      selectedImg.style.marginLeft = 'auto';
      selectedImg.style.marginRight = 'auto';
      selectedImg.style.float = 'none';
    } else if (align === 'left') {
      selectedImg.style.marginLeft = '0';
      selectedImg.style.marginRight = 'auto';
      selectedImg.style.float = 'none';
    } else if (align === 'right') {
      selectedImg.style.marginLeft = 'auto';
      selectedImg.style.marginRight = '0';
      selectedImg.style.float = 'none';
    }

    handleVisualInput();
  };

  const setupInsertedImage = () => {
    setTimeout(() => {
      if (!visualEditorRef.current) return;
      const imgs = visualEditorRef.current.querySelectorAll('img');
      if (imgs.length > 0) {
        const lastImg = imgs[imgs.length - 1] as HTMLImageElement;
        imgs.forEach((i) => i.classList.remove('is-selected'));
        lastImg.classList.add('is-selected');
        setSelectedImg(lastImg);
        lastSelectedElementRef.current = lastImg;
        updateTableSelection(null);

        const styleW = lastImg.style.width || (lastImg.getAttribute('width') ? `${lastImg.getAttribute('width')}px` : '100%');
        const styleH = lastImg.style.height || (lastImg.getAttribute('height') ? `${lastImg.getAttribute('height')}px` : 'auto');
        setImgWidth(styleW);
        setImgHeight(styleH);
        setImgAlign('center');
      }
    }, 60);
  };

  function handleInsertWebImage(e: React.MouseEvent) {
    e.preventDefault();
    const url = window.prompt('Enter Image URL to embed into article:');
    if (!url) return;
    const imgHtml = `<figure style="margin: 16px 0; text-align: center;"><img src="${url}" alt="Diagram" style="max-width: 100%; max-height: 400px; border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.08);" /></figure><p><br></p>`;
    insertCustomHtml(imgHtml);
    if (editorMode === 'visual') {
      setupInsertedImage();
    }
  }

  function handleInsertAiImage(imageUrl: string, promptText: string) {
    const imgHtml = `<figure style="margin: 20px 0; text-align: center;"><img src="${imageUrl}" alt="${promptText}" style="max-width: 100%; max-height: 450px; border-radius: 12px; box-shadow: 0 6px 22px rgba(0,0,0,0.09);" /><figcaption style="font-size: 12.5px; color: #64748b; margin-top: 8px;"><em>${promptText}</em></figcaption></figure><p><br></p>`;
    insertCustomHtml(imgHtml);
    setShowAiImageModal(false);
    setNotice('AI artwork embedded into article!');
    if (editorMode === 'visual') {
      setupInsertedImage();
    }
  }

  async function handleArticleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingArticleImg(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const uploadRes = await fetch('/api/study-materials/upload', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64,
              mediaType: 'IMAGE',
            }),
          }).then((r) => r.json());

          const finalUrl = uploadRes.fileUrl || base64;
          const imgHtml = `<figure style="margin: 18px 0; text-align: center;"><img src="${finalUrl}" alt="${file.name}" style="max-width: 100%; max-height: 400px; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);" /><figcaption style="font-size: 12px; color: #64748b; margin-top: 6px;"><em>${file.name}</em></figcaption></figure><p><br></p>`;
          insertCustomHtml(imgHtml);
          setNotice(`Image "${file.name}" embedded into article!`);
          if (editorMode === 'visual') {
            setupInsertedImage();
          }
        } catch {
          const imgHtml = `<figure style="margin: 18px 0; text-align: center;"><img src="${base64}" alt="${file.name}" style="max-width: 100%; max-height: 400px; border-radius: 10px;" /><figcaption style="font-size: 12px; color: #64748b; margin-top: 6px;"><em>${file.name}</em></figcaption></figure><p><br></p>`;
          insertCustomHtml(imgHtml);
          setNotice(`Image loaded into article!`);
          if (editorMode === 'visual') {
            setupInsertedImage();
          }
        } finally {
          setUploadingArticleImg(false);
          if (articleImageInputRef.current) articleImageInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setNotice('Failed to upload image.');
      setUploadingArticleImg(false);
    }
  }

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && visualEditorRef.current) {
      const range = sel.getRangeAt(0);
      if (visualEditorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }
    }
  };

  const applyFontFamily = (fontVal: string) => {
    setCurrentFontFamily(fontVal);
    if (editorMode === 'code') {
      const textarea = codeEditorRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end) || 'Sample text';
      const replacement = `<span style="font-family: ${fontVal};">${selected}</span>`;
      const nextVal = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      setContent(nextVal);
      contentRef.current = nextVal;
      setTimeout(() => {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + replacement.length;
        textarea.focus();
      }, 0);
      return;
    }

    if (!visualEditorRef.current) return;
    restoreSelection();
    const sel = window.getSelection();
    const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : savedRangeRef.current;
    const primaryFont = fontVal.split(',')[0].replace(/["']/g, '').trim();

    if (range && !range.collapsed) {
      try {
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand('fontName', false, primaryFont);
      } catch {
        // fallback
      }

      const targets = Array.from(visualEditorRef.current.querySelectorAll(`font[face], font`));
      const createdSpans: HTMLElement[] = [];
      targets.forEach((node) => {
        const fontEl = node as HTMLElement;
        fontEl.removeAttribute('face');
        const span = document.createElement('span');
        span.style.fontFamily = fontVal;
        if (fontEl.style.fontSize) span.style.fontSize = fontEl.style.fontSize;
        if (fontEl.style.color) span.style.color = fontEl.style.color;
        while (fontEl.firstChild) {
          span.appendChild(fontEl.firstChild);
        }
        fontEl.parentNode?.replaceChild(span, fontEl);
        createdSpans.push(span);
      });

      if (createdSpans.length === 0) {
        const spanTargets = Array.from(visualEditorRef.current.querySelectorAll(`span[style*="font-family"]`));
        spanTargets.forEach((s) => {
          const el = s as HTMLElement;
          if (el.style.fontFamily.toLowerCase().includes(primaryFont.toLowerCase())) {
            el.style.fontFamily = fontVal;
            createdSpans.push(el);
          }
        });
      }

      if (createdSpans.length > 0 && sel) {
        const newRange = document.createRange();
        newRange.setStartBefore(createdSpans[0]);
        newRange.setEndAfter(createdSpans[createdSpans.length - 1]);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    } else if (range && range.collapsed) {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const currentElem = node as HTMLElement | null;
      if (currentElem && visualEditorRef.current.contains(currentElem) && currentElem !== visualEditorRef.current) {
        currentElem.style.fontFamily = fontVal;
      }
    }

    handleVisualInput();
    saveSelection();
  };

  const applyFontSize = (sizeVal: string) => {
    setCurrentFontSize(sizeVal);
    if (editorMode === 'code') {
      const textarea = codeEditorRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end) || 'Sample text';
      const replacement = `<span style="font-size: ${sizeVal};">${selected}</span>`;
      const nextVal = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      setContent(nextVal);
      contentRef.current = nextVal;
      setTimeout(() => {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + replacement.length;
        textarea.focus();
      }, 0);
      return;
    }

    if (!visualEditorRef.current) return;
    restoreSelection();
    const sel = window.getSelection();
    const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : savedRangeRef.current;

    if (range && !range.collapsed) {
      try {
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand('fontSize', false, '7');
      } catch {
        // fallback
      }

      const targets = Array.from(visualEditorRef.current.querySelectorAll('font[size="7"], font[size="xxx-large"], [style*="-webkit-xxx-large"]'));
      const createdSpans: HTMLElement[] = [];
      targets.forEach((node) => {
        const el = node as HTMLElement;
        el.removeAttribute('size');
        const span = document.createElement('span');
        span.style.fontSize = sizeVal;
        if (el.style.fontFamily) span.style.fontFamily = el.style.fontFamily;
        if (el.style.color) span.style.color = el.style.color;
        while (el.firstChild) {
          span.appendChild(el.firstChild);
        }
        el.parentNode?.replaceChild(span, el);
        createdSpans.push(span);
      });

      if (createdSpans.length > 0 && sel) {
        const newRange = document.createRange();
        newRange.setStartBefore(createdSpans[0]);
        newRange.setEndAfter(createdSpans[createdSpans.length - 1]);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    } else if (range && range.collapsed) {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const currentElem = node as HTMLElement | null;
      if (currentElem && visualEditorRef.current.contains(currentElem) && currentElem !== visualEditorRef.current) {
        currentElem.style.fontSize = sizeVal;
      }
    }

    handleVisualInput();
    saveSelection();
  };

  const stepFontSize = (delta: number) => {
    let activeSize = currentFontSize;
    const sel = window.getSelection();
    const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : savedRangeRef.current;
    if (range && visualEditorRef.current) {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const elem = node as HTMLElement | null;
      if (elem && visualEditorRef.current.contains(elem)) {
        try {
          const computed = window.getComputedStyle(elem);
          if (computed.fontSize) {
            const px = parseInt(computed.fontSize, 10);
            if (!isNaN(px)) {
              let closest = FONT_SIZE_STEPS[2];
              let minDiff = 9999;
              FONT_SIZE_STEPS.forEach((s) => {
                const sPx = parseInt(s, 10);
                const diff = Math.abs(sPx - px);
                if (diff < minDiff) {
                  minDiff = diff;
                  closest = s;
                }
              });
              activeSize = closest;
            }
          }
        } catch {
          // quiet
        }
      }
    }

    const idx = FONT_SIZE_STEPS.indexOf(activeSize);
    let nextIdx = idx >= 0 ? idx + delta : (delta > 0 ? 3 : 1);
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= FONT_SIZE_STEPS.length) nextIdx = FONT_SIZE_STEPS.length - 1;
    applyFontSize(FONT_SIZE_STEPS[nextIdx]);
  };

  const handleToggleFormatPainter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (formatPainterStyle) {
      setFormatPainterStyle(null);
      setNotice('Format Painter cancelled.');
      return;
    }

    if (editorMode === 'code') {
      setNotice('Format painter is available in Visual Editor mode.');
      return;
    }

    if (!visualEditorRef.current) return;
    const sel = window.getSelection();
    const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : savedRangeRef.current;
    if (range && visualEditorRef.current) {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const elem = (node as HTMLElement) || visualEditorRef.current;
      if (elem) {
        try {
          const computed = window.getComputedStyle(elem);
          const styleToCopy = {
            fontFamily: elem.style.fontFamily || computed.fontFamily,
            fontSize: elem.style.fontSize || computed.fontSize,
            fontWeight: computed.fontWeight,
            fontStyle: computed.fontStyle,
            textDecoration: computed.textDecoration,
            color: elem.style.color || computed.color,
            lineHeight: elem.style.lineHeight || computed.lineHeight,
            backgroundColor: elem.style.backgroundColor || computed.backgroundColor,
          };
          setFormatPainterStyle(styleToCopy);
          setNotice('Format copied! Drag or click to apply formatting to text.');
        } catch {
          setNotice('Could not copy format.');
        }
      }
    } else {
      setNotice('Select or place caret inside text to copy format.');
    }
  };

  const applyCopiedFormat = () => {
    if (!formatPainterStyle || !visualEditorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!visualEditorRef.current.contains(range.commonAncestorContainer)) return;

    const style = formatPainterStyle;

    if (!range.collapsed) {
      try {
        const span = document.createElement('span');
        if (style.fontFamily) span.style.fontFamily = style.fontFamily;
        if (style.fontSize) span.style.fontSize = style.fontSize;
        if (style.fontWeight) span.style.fontWeight = style.fontWeight;
        if (style.fontStyle) span.style.fontStyle = style.fontStyle;
        if (style.textDecoration) span.style.textDecoration = style.textDecoration;
        if (style.color) span.style.color = style.color;
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
          span.style.backgroundColor = style.backgroundColor;
        }
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      } catch {
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const el = node as HTMLElement | null;
        if (el && el !== visualEditorRef.current) {
          if (style.fontFamily) el.style.fontFamily = style.fontFamily;
          if (style.fontSize) el.style.fontSize = style.fontSize;
          if (style.fontWeight) el.style.fontWeight = style.fontWeight;
          if (style.fontStyle) el.style.fontStyle = style.fontStyle;
          if (style.textDecoration) el.style.textDecoration = style.textDecoration;
          if (style.color) el.style.color = style.color;
        }
      }
    } else {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const el = node as HTMLElement | null;
      if (el && el !== visualEditorRef.current && visualEditorRef.current.contains(el)) {
        if (style.fontFamily) el.style.fontFamily = style.fontFamily;
        if (style.fontSize) el.style.fontSize = style.fontSize;
        if (style.fontWeight) el.style.fontWeight = style.fontWeight;
        if (style.fontStyle) el.style.fontStyle = style.fontStyle;
        if (style.textDecoration) el.style.textDecoration = style.textDecoration;
        if (style.color) el.style.color = style.color;
      }
    }

    if (style.lineHeight) {
      let block: Node | null = range.commonAncestorContainer;
      if (block.nodeType === Node.TEXT_NODE) block = block.parentElement;
      while (block && block !== visualEditorRef.current) {
        if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'DIV', 'TD', 'TH'].includes((block as HTMLElement).tagName)) {
          (block as HTMLElement).style.lineHeight = style.lineHeight;
          break;
        }
        block = block.parentNode;
      }
    }

    setFormatPainterStyle(null);
    handleVisualInput();
    saveSelection();
    setNotice('Format applied!');
  };

  const applyLineSpacing = (spacingVal: string) => {
    setCurrentLineSpacing(spacingVal);
    if (editorMode === 'code') {
      const textarea = codeEditorRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end) || 'Paragraph text';
      const replacement = `<p style="line-height: ${spacingVal};">${selected}</p>`;
      const nextVal = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      setContent(nextVal);
      contentRef.current = nextVal;
      setTimeout(() => {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + replacement.length;
        textarea.focus();
      }, 0);
      return;
    }

    if (!visualEditorRef.current) return;
    restoreSelection();
    const sel = window.getSelection();
    const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : savedRangeRef.current;

    if (range && visualEditorRef.current) {
      const blocks: HTMLElement[] = [];
      const blockSelector = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, div, td, th';

      if (!range.collapsed) {
        const allBlocks = Array.from(visualEditorRef.current.querySelectorAll(blockSelector));
        allBlocks.forEach((b) => {
          if (range.intersectsNode(b)) {
            blocks.push(b as HTMLElement);
          }
        });
      }

      if (blocks.length === 0) {
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        while (node && node !== visualEditorRef.current) {
          if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'DIV', 'TD', 'TH'].includes((node as HTMLElement).tagName)) {
            blocks.push(node as HTMLElement);
            break;
          }
          node = node.parentNode;
        }
      }

      if (blocks.length > 0) {
        blocks.forEach((b) => {
          b.style.lineHeight = spacingVal;
        });
      } else {
        visualEditorRef.current.style.lineHeight = spacingVal;
      }
    }
    handleVisualInput();
    saveSelection();
  };

  function getActiveTableCell(): HTMLTableCellElement | null {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node !== visualEditorRef.current) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        return node as HTMLTableCellElement;
      }
      node = node.parentNode;
    }
    return null;
  }

  function updateTableSelection(cell: HTMLTableCellElement | null) {
    if (!cell) {
      if (visualEditorRef.current) {
        visualEditorRef.current.querySelectorAll('.cell-active-col').forEach((c) => c.classList.remove('cell-active-col'));
      }
      setSelectedTableInfo(null);
      return;
    }
    const table = cell.closest('table');
    if (!table) return;

    lastActiveCellRef.current = cell;
    const row = cell.parentElement;
    const colIndex = Array.from(row?.children || []).indexOf(cell);
    const totalCols = row?.children.length || 0;
    const widthStyle = cell.style.width || '';
    const computedWidth = Math.round((cell.offsetWidth / (table.offsetWidth || 1)) * 100) + '%';

    if (visualEditorRef.current) {
      visualEditorRef.current.querySelectorAll('.cell-active-col').forEach((c) => c.classList.remove('cell-active-col'));
      table.querySelectorAll('tr').forEach((r) => {
        const c = r.children[colIndex];
        if (c) c.classList.add('cell-active-col');
      });
    }

    setSelectedTableInfo({
      table,
      cell,
      colIndex: colIndex >= 0 ? colIndex : 0,
      totalCols: totalCols || 1,
      currentWidth: widthStyle || computedWidth,
    });
  }

  function handleEditorSelectionChange() {
    saveSelection();
    const cell = getActiveTableCell();
    if (cell) {
      updateTableSelection(cell);
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && visualEditorRef.current) {
      const range = sel.getRangeAt(0);
      if (visualEditorRef.current.contains(range.commonAncestorContainer)) {
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        const elem = node as HTMLElement | null;
        if (elem && elem !== visualEditorRef.current) {
          if (!visualEditorRef.current?.querySelector('img.is-selected')) {
            lastSelectedElementRef.current = elem;
          }

          // Detect active font family & font size from element at cursor
          try {
            const computed = window.getComputedStyle(elem);
            const detectedFont = computed.fontFamily;
            const detectedSize = computed.fontSize;

            if (detectedFont) {
              const matched = FONT_FAMILY_OPTIONS.find((f) => {
                const primary = f.value.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
                return detectedFont.toLowerCase().includes(primary);
              });
              if (matched) {
                setCurrentFontFamily(matched.value);
              }
            }

            if (detectedSize) {
              const pxVal = parseInt(detectedSize, 10);
              if (!isNaN(pxVal)) {
                let closest = FONT_SIZE_STEPS[2];
                let minDiff = 9999;
                FONT_SIZE_STEPS.forEach((s) => {
                  const sPx = parseInt(s, 10);
                  const diff = Math.abs(sPx - pxVal);
                  if (diff < minDiff) {
                    minDiff = diff;
                    closest = s;
                  }
                });
                setCurrentFontSize(closest);
              }
            }

            // Detect line-height from enclosing block
            let blockNode: Node | null = elem;
            while (blockNode && blockNode !== visualEditorRef.current) {
              const tag = (blockNode as HTMLElement).tagName;
              if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'DIV', 'TD', 'TH'].includes(tag)) {
                const el = blockNode as HTMLElement;
                const rawLh = el.style.lineHeight || window.getComputedStyle(el).lineHeight;
                if (rawLh) {
                  const num = parseFloat(rawLh);
                  if (!isNaN(num)) {
                    const fs = parseFloat(window.getComputedStyle(el).fontSize);
                    const ratio = num > 5 && !isNaN(fs) && fs > 0 ? (num / fs) : num;
                    const matched = LINE_SPACING_OPTIONS.find((opt) => Math.abs(parseFloat(opt.value) - ratio) < 0.18);
                    if (matched) {
                      setCurrentLineSpacing(matched.value);
                    }
                  }
                }
                break;
              }
              blockNode = blockNode.parentNode;
            }
          } catch {
            // quiet
          }
        }
      }
    }
  }

  function applyColWidth(widthVal: string) {
    if (!selectedTableInfo) return;
    const { table, colIndex } = selectedTableInfo;
    let formatted = widthVal.trim();
    if (formatted && !formatted.endsWith('%') && !formatted.endsWith('px') && formatted !== 'auto') {
      const num = parseFloat(formatted);
      if (!isNaN(num)) {
        formatted = num <= 100 ? `${num}%` : `${num}px`;
      }
    }

    table.style.tableLayout = 'fixed';
    table.style.width = '100%';

    table.querySelectorAll('tr').forEach((row) => {
      const cell = row.children[colIndex] as HTMLElement | undefined;
      if (cell) {
        cell.style.width = formatted;
      }
    });

    setSelectedTableInfo((prev) => prev ? { ...prev, currentWidth: formatted } : null);
    handleVisualInput();
    setNotice(`Column ${colIndex + 1} width set to ${formatted}.`);
  }

  function equalizeColWidths() {
    if (!selectedTableInfo) return;
    const { table } = selectedTableInfo;
    const allRows = table.querySelectorAll('tr');
    const maxCols = Math.max(...Array.from(allRows).map((r) => r.children.length), 1);
    const eqWidth = (100 / maxCols).toFixed(2) + '%';

    table.style.tableLayout = 'fixed';
    table.style.width = '100%';

    allRows.forEach((row) => {
      Array.from(row.children).forEach((cell) => {
        (cell as HTMLElement).style.width = eqWidth;
      });
    });

    setSelectedTableInfo((prev) => prev ? { ...prev, currentWidth: eqWidth, totalCols: maxCols } : null);
    handleVisualInput();
    setNotice(`All ${maxCols} columns equalized to ${eqWidth}.`);
  }

  function stepColWidth(deltaPercent: number) {
    if (!selectedTableInfo) return;
    const current = selectedTableInfo.currentWidth;
    let curPercent = 25;
    if (current.endsWith('%')) {
      curPercent = parseFloat(current) || 25;
    } else if (current.endsWith('px')) {
      const px = parseFloat(current) || 100;
      const tWidth = selectedTableInfo.table.offsetWidth || 600;
      curPercent = Math.round((px / tWidth) * 100);
    }
    const nextPercent = Math.max(5, Math.min(90, Math.round(curPercent + deltaPercent)));
    applyColWidth(`${nextPercent}%`);
  }

  function insertTable() {
    const tableHtml =
      '<table style="width: 100%; border-collapse: collapse; margin: 14px 0; border: 1px solid #cbd5e1; table-layout: fixed;">' +
      '<thead>' +
      '<tr style="background: #f1f5f9;">' +
      '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 33.33%;">Concept</th>' +
      '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 33.33%;">Formula / Definition</th>' +
      '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 33.34%;">Example</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      '<tr>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Item 1</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Description</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.34%;">e.g. 5</td>' +
      '</tr>' +
      '<tr>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Item 2</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Description</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.34%;">e.g. 10</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>' +
      '<p><br></p>';

    if (editorMode === 'code') {
      insertCustomHtml(tableHtml);
      return;
    }
    insertCustomHtml(tableHtml);
  }

  function addTableRow(direction: 'above' | 'below' = 'below') {
    if (editorMode !== 'visual' || !visualEditorRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (visualEditorRef.current.querySelector('tbody tr:last-child td, tr:last-child td, tr:last-child th') as HTMLTableCellElement | null);
    if (!cell) {
      insertTable();
      return;
    }
    const currentRow = cell.closest('tr');
    const table = cell.closest('table');
    if (!table || !currentRow) {
      insertTable();
      return;
    }

    const colCount = Math.max(
      currentRow.children.length,
      table.rows[0]?.children.length || 3
    );

    const firstRow = table.rows[0];
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const newCell = document.createElement('td');
      newCell.style.border = '1px solid #cbd5e1';
      newCell.style.padding = '8px 10px';
      if (firstRow && firstRow.children[i]) {
        const refCell = firstRow.children[i] as HTMLElement;
        if (refCell.style.width) newCell.style.width = refCell.style.width;
      }
      newCell.innerHTML = '<br>';
      newRow.appendChild(newCell);
    }

    if (direction === 'above') {
      currentRow.parentElement?.insertBefore(newRow, currentRow);
    } else {
      if (currentRow.parentElement?.tagName === 'THEAD') {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          tbody.insertBefore(newRow, tbody.firstChild);
        } else {
          currentRow.parentElement?.appendChild(newRow);
        }
      } else if (currentRow.nextSibling) {
        currentRow.parentElement?.insertBefore(newRow, currentRow.nextSibling);
      } else {
        currentRow.parentElement?.appendChild(newRow);
      }
    }

    const firstTd = newRow.querySelector('td');
    if (firstTd) {
      updateTableSelection(firstTd);
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(firstTd);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    handleVisualInput();
    setNotice('Row added to table.');
  }

  function deleteTableRow() {
    if (editorMode !== 'visual' || !visualEditorRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (visualEditorRef.current.querySelector('tbody tr:last-child td, tr:last-child td') as HTMLTableCellElement | null);
    if (!cell) return;
    const currentRow = cell.closest('tr');
    const table = cell.closest('table');
    if (!table || !currentRow) return;

    if (table.rows.length <= 1) {
      table.remove();
      updateTableSelection(null);
      handleVisualInput();
      setNotice('Table removed.');
      return;
    }

    currentRow.remove();
    const nextActive = table.querySelector('tbody tr:last-child td, tr:last-child td') as HTMLTableCellElement | null;
    updateTableSelection(nextActive);
    handleVisualInput();
    setNotice('Row deleted from table.');
  }

  function addTableColumn(direction: 'left' | 'right' = 'right') {
    if (editorMode !== 'visual' || !visualEditorRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (visualEditorRef.current.querySelector('tr td:last-child, tr th:last-child') as HTMLTableCellElement | null);
    if (!cell) {
      insertTable();
      return;
    }
    const table = cell.closest('table');
    const currentRow = cell.closest('tr');
    if (!table || !currentRow) {
      insertTable();
      return;
    }

    const colIndex = Array.from(currentRow.children).indexOf(cell);
    const targetIndex = direction === 'right' ? colIndex + 1 : colIndex;
    const newTotalCols = currentRow.children.length + 1;
    const defaultColWidth = (100 / newTotalCols).toFixed(2) + '%';

    table.style.tableLayout = 'fixed';
    table.style.width = '100%';

    const allRows = table.querySelectorAll('tr');
    allRows.forEach((row) => {
      const isHeader = row.parentElement?.tagName === 'THEAD' || row.querySelector('th') !== null;
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.style.border = '1px solid #cbd5e1';
      newCell.style.padding = '8px 10px';
      newCell.style.width = defaultColWidth;
      if (isHeader) {
        newCell.style.textAlign = 'left';
        newCell.style.background = '#f1f5f9';
        newCell.innerHTML = 'Header';
      } else {
        newCell.innerHTML = '<br>';
      }

      if (targetIndex >= row.children.length) {
        row.appendChild(newCell);
      } else {
        row.insertBefore(newCell, row.children[targetIndex]);
      }
    });

    const activeCellTarget = currentRow.children[targetIndex] as HTMLTableCellElement | undefined;
    if (activeCellTarget) {
      updateTableSelection(activeCellTarget);
    }

    handleVisualInput();
    setNotice('Column added to table.');
  }

  function deleteTableColumn() {
    if (editorMode !== 'visual' || !visualEditorRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (visualEditorRef.current.querySelector('tr td:last-child, tr th:last-child') as HTMLTableCellElement | null);
    if (!cell) return;
    const table = cell.closest('table');
    const currentRow = cell.closest('tr');
    if (!table || !currentRow) return;

    const colIndex = Array.from(currentRow.children).indexOf(cell);
    const totalCols = currentRow.children.length;

    if (totalCols <= 1) {
      table.remove();
      updateTableSelection(null);
      handleVisualInput();
      setNotice('Table removed.');
      return;
    }

    const allRows = table.querySelectorAll('tr');
    allRows.forEach((row) => {
      if (row.children[colIndex]) {
        row.children[colIndex].remove();
      } else if (row.lastElementChild) {
        row.lastElementChild.remove();
      }
    });

    const nextActive = table.querySelector('tr td:last-child, tr th:last-child') as HTMLTableCellElement | null;
    updateTableSelection(nextActive);
    handleVisualInput();
    setNotice('Column deleted from table.');
  }

  function deleteTable() {
    if (editorMode !== 'visual' || !visualEditorRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || visualEditorRef.current.querySelector('table');
    if (!cell) return;
    const table = cell.tagName === 'TABLE' ? (cell as HTMLTableElement) : cell.closest('table');
    if (table) {
      table.remove();
      updateTableSelection(null);
      handleVisualInput();
      setNotice('Table removed.');
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingColRef.current) return;
    const target = e.target as HTMLElement;
    const cell = target.closest('td, th') as HTMLTableCellElement | null;
    if (cell && visualEditorRef.current?.contains(cell)) {
      const rect = cell.getBoundingClientRect();
      const isNearRightEdge = Math.abs(e.clientX - rect.right) <= 6;
      if (isNearRightEdge) {
        cell.style.cursor = 'col-resize';
      } else if (cell.style.cursor === 'col-resize') {
        cell.style.cursor = '';
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('td, th') as HTMLTableCellElement | null;
    if (cell && visualEditorRef.current?.contains(cell)) {
      const rect = cell.getBoundingClientRect();
      const isNearRightEdge = Math.abs(e.clientX - rect.right) <= 6;
      if (isNearRightEdge) {
        e.preventDefault();
        e.stopPropagation();
        const table = cell.closest('table');
        if (!table) return;

        const row = cell.parentElement;
        const colIndex = Array.from(row?.children || []).indexOf(cell);
        if (colIndex === -1) return;

        isDraggingColRef.current = true;
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';

        const tableWidth = table.offsetWidth;
        const startX = e.clientX;
        const startWidth = cell.offsetWidth;
        const nextCell = row?.children[colIndex + 1] as HTMLElement | undefined;
        const nextStartWidth = nextCell ? nextCell.offsetWidth : undefined;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMove = (moveEvt: MouseEvent) => {
          const delta = moveEvt.clientX - startX;
          const minW = 35;
          if (nextCell && nextStartWidth !== undefined) {
            const clampedDelta = Math.max(minW - startWidth, Math.min(nextStartWidth - minW, delta));
            const w1Pct = (((startWidth + clampedDelta) / tableWidth) * 100).toFixed(2) + '%';
            const w2Pct = (((nextStartWidth - clampedDelta) / tableWidth) * 100).toFixed(2) + '%';
            table.querySelectorAll('tr').forEach((r) => {
              const c1 = r.children[colIndex] as HTMLElement | undefined;
              const c2 = r.children[colIndex + 1] as HTMLElement | undefined;
              if (c1) c1.style.width = w1Pct;
              if (c2) c2.style.width = w2Pct;
            });
            setSelectedTableInfo((prev) => prev ? { ...prev, currentWidth: w1Pct } : null);
          } else {
            const newW = Math.max(minW, startWidth + delta);
            const wPct = ((newW / tableWidth) * 100).toFixed(2) + '%';
            table.querySelectorAll('tr').forEach((r) => {
              const c = r.children[colIndex] as HTMLElement | undefined;
              if (c) c.style.width = wPct;
            });
            setSelectedTableInfo((prev) => prev ? { ...prev, currentWidth: wPct } : null);
          }
        };

        const handleUp = () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
          isDraggingColRef.current = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          handleVisualInput();
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return;
      }
    }

    if (cell && visualEditorRef.current?.contains(cell)) {
      updateTableSelection(cell);
    } else if (!target.closest('.study-article-table-toolbar')) {
      updateTableSelection(null);
    }

    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      visualEditorRef.current?.querySelectorAll('img.is-selected').forEach((i) => i.classList.remove('is-selected'));
      img.classList.add('is-selected');
      setSelectedImg(img);
      lastSelectedElementRef.current = img;
      updateTableSelection(null);

      const styleW = img.style.width || (img.getAttribute('width') ? `${img.getAttribute('width')}px` : '100%');
      const styleH = img.style.height || (img.getAttribute('height') ? `${img.getAttribute('height')}px` : 'auto');
      setImgWidth(styleW);
      setImgHeight(styleH);

      const ml = img.style.marginLeft;
      const mr = img.style.marginRight;
      const fig = img.closest('figure');
      const figAlign = fig ? fig.style.textAlign : '';

      if (figAlign === 'left') {
        setImgAlign('left');
      } else if (figAlign === 'right') {
        setImgAlign('right');
      } else if (figAlign === 'center') {
        setImgAlign('center');
      } else if (ml === 'auto' && mr === 'auto') {
        setImgAlign('center');
      } else if (ml === 'auto' && (mr === '0px' || mr === '0')) {
        setImgAlign('right');
      } else if ((ml === '0px' || ml === '0') && mr === 'auto') {
        setImgAlign('left');
      } else {
        setImgAlign('center');
      }
    } else if (!target.closest('.study-article-image-toolbar')) {
      visualEditorRef.current?.querySelectorAll('img.is-selected').forEach((img) => img.classList.remove('is-selected'));
      setSelectedImg(null);
      if (target.closest('figure')) {
        lastSelectedElementRef.current = target.closest('figure');
      } else if (target.closest('table')) {
        lastSelectedElementRef.current = target.closest('table');
      } else {
        lastSelectedElementRef.current = target;
      }
    }
  };

  function toggleMode(newMode: 'visual' | 'code') {
    if (newMode === editorMode) return;
    setSelectedImg(null);
    updateTableSelection(null);
    if (newMode === 'code') {
      const html = visualEditorRef.current ? visualEditorRef.current.innerHTML : contentRef.current;
      contentRef.current = html;
      setContent(html);
      setEditorMode('code');
    } else {
      const html = codeEditorRef.current ? codeEditorRef.current.value : contentRef.current;
      contentRef.current = html;
      initialHtmlRef.current = html;
      setEditorMode('visual');
      setTimeout(() => {
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = html;
        }
      }, 0);
    }
  }

  async function handleSaveMaterial(targetStatus?: 'DRAFT' | 'PUBLISHED') {
    const finalStatus = targetStatus || status;
    const finalContent = editorMode === 'visual' && visualEditorRef.current
      ? visualEditorRef.current.innerHTML
      : (codeEditorRef.current ? codeEditorRef.current.value : contentRef.current);

    const trimmedTitle = title.trim();
    const effectiveTitle = trimmedTitle || (finalStatus === 'DRAFT' ? `Draft - ${subject} (${grade})` : '');
    if (!effectiveTitle) {
      setNotice('Please enter a Title / Chapter Name to publish.');
      return;
    }

    setSaving(true);
    const payload = {
      title: effectiveTitle,
      description,
      content: finalContent,
      grade,
      subject,
      mediaType,
      videoUrl: videoUrl.trim() || null,
      coverImage: coverImage.trim() || null,
      readTime: readTime.trim() || null,
      status: finalStatus,
      fileUrl: fileUrl.trim() || null,
      fileName: fileName.trim() || null,
    };

    try {
      const url = initialData ? `/api/study-materials/${initialData.id}` : '/api/study-materials';
      const method = initialData ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res.material) {
        localStorage.removeItem('study_material_auto_draft');
        setNotice(finalStatus === 'DRAFT' ? 'Study material saved as Draft!' : 'Study material published successfully!');
        onSaved();
      } else {
        setNotice(res.error || 'Could not save material.');
      }
    } catch {
      setNotice('Network error while saving.');
    } finally {
      setSaving(false);
    }
  }

  function attemptClose() {
    const currentContent = editorMode === 'visual' && visualEditorRef.current
      ? visualEditorRef.current.innerHTML
      : (codeEditorRef.current ? codeEditorRef.current.value : contentRef.current);

    const isChanged = (
      title.trim() !== (initialData?.title || '') ||
      currentContent.trim() !== (initialData?.content || '') ||
      description.trim() !== (initialData?.description || '') ||
      coverImage.trim() !== (initialData?.coverImage || '')
    );

    if (isChanged && (title.trim() || currentContent.trim() || description.trim())) {
      setShowDraftPrompt(true);
    } else {
      localStorage.removeItem('study_material_auto_draft');
      onClose();
    }
  }

  return createPortal(
    <div
      className="study-editor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) attemptClose();
      }}
    >
      <div className="study-editor-card">
        <div className="study-editor-header">
          <h3>
            <BookOpen size={20} color="#0284c7" />
            {initialData ? 'Edit Study Material' : 'Create New Study Material'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="button button-secondary"
              style={{ fontSize: '12px', padding: '4px 10px', height: '30px', gap: '5px' }}
              onClick={() => handleSaveMaterial('DRAFT')}
              disabled={saving}
              title="Save as Draft"
            >
              <Save size={14} /> Save Draft
            </button>
            <button className="icon-button quiet" onClick={attemptClose} aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSaveMaterial('PUBLISHED');
          }}
          className="study-editor-form"
        >
          {restoredDraftAvailable && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#92400e' }}>
                <Save size={15} />
                <span><strong>Unsaved draft found</strong> from your previous writing session.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="button button-primary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={restoreLocalDraft}
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={discardLocalDraft}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
          <label className="field compact-field">
            <span>Title / Chapter Name <span className="required-star">*</span></span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visual Guide to Fractions & Decimals"
            />
          </label>

          <div className="form-grid-2">
            <label className="field compact-field">
              <span>Grade / Class <span className="required-star">*</span></span>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                {STANDARD_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>

            <label className="field compact-field">
              <span>Subject <span className="required-star">*</span></span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {STANDARD_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid-2">
            <label className="field compact-field">
              <span>Media Format <span className="required-star">*</span></span>
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value as StudyMediaType)}>
                <option value="WORKSHEET">📝 Interactive Worksheet (with Instant Practice & PDF)</option>
                <option value="ARTICLE">📖 Article / Revision Notes</option>
                <option value="PDF">📄 PDF Document</option>
                <option value="VIDEO">🎥 Video Lesson</option>
                <option value="PRESENTATION">📊 Slide Deck</option>
                <option value="IMAGE">🖼️ Infographic / Image</option>
              </select>
            </label>

            <label className="field compact-field">
              <span>Estimated Duration / Read Time</span>
              <input
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="e.g. 8 min read, 15 min video"
              />
            </label>
          </div>

          <label className="field compact-field">
            <span>Short Excerpt / Summary (For blog card snippet)</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary to show students on the card..."
            />
          </label>

          {/* Conditional Media Specific Fields */}
          {mediaType === 'VIDEO' && (
            <label className="field compact-field">
              <span>YouTube or Video URL</span>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
          )}

          {(mediaType === 'PDF' || mediaType === 'PRESENTATION' || mediaType === 'IMAGE' || mediaType === 'WORKSHEET') && (
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                  {mediaType === 'WORKSHEET' ? 'Attach Optional Printable PDF Worksheet:' : `Attach File (${mediaType}):`}
                </strong>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <UploadCloud size={14} /> {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === 'IMAGE' ? 'image/*' : '.pdf'}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
              {fileUrl ? (
                <div style={{ fontSize: '12px', color: '#059669', wordBreak: 'break-all' }}>
                  ✓ Stored at: <code>{fileUrl}</code> ({fileName})
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  No file uploaded yet. You can upload a file or specify a link below.
                </div>
              )}
            </div>
          )}

          {/* Cover Image Section with Local Machine Upload & URL */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={15} color="#0284c7" /> Cover Image (Local Upload or Web URL):
              </strong>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '4px 10px', height: '28px', gap: '6px' }}
                onClick={() => coverFileInputRef.current?.click()}
                disabled={uploadingCover}
              >
                <UploadCloud size={14} /> {uploadingCover ? 'Uploading...' : 'Upload Cover from PC'}
              </button>
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Paste image URL (e.g. Unsplash) or click 'Upload Cover from PC'..."
                style={{ flex: 1, fontSize: '13px' }}
              />
              {coverImage && (
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px', height: '36px', color: '#dc2626' }}
                  onClick={() => setCoverImage('')}
                  title="Remove cover image"
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>

            {coverImage && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <img
                  src={coverImage}
                  alt="Cover Preview"
                  style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
                  <strong style={{ color: '#0f172a' }}>Cover Active: </strong>
                  <span style={{ color: '#64748b', wordBreak: 'break-all' }}>
                    {coverImage.startsWith('data:') ? 'Local file uploaded' : coverImage}
                  </span>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => coverFileInputRef.current?.click()}
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Content Section: Worksheet Questions Builder OR Article Rich Text Editor */}
          {mediaType === 'WORKSHEET' ? (
            <WorksheetQuestionBuilder
              initialContent={contentRef.current}
              onChange={(json) => {
                contentRef.current = json;
              }}
              subject={subject}
            />
          ) : (
            <div className="compact-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#1e293b' }}>
                Detailed Notes & Content (HTML or Text)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                  {wordCount} words
                </span>
                <div className="toolbar-mode-switch">
                  <button
                    type="button"
                    className={`toolbar-mode-btn ${editorMode === 'visual' ? 'active' : ''}`}
                    onClick={() => toggleMode('visual')}
                  >
                    ✏️ Visual Editor
                  </button>
                  <button
                    type="button"
                    className={`toolbar-mode-btn ${editorMode === 'code' ? 'active' : ''}`}
                    onClick={() => toggleMode('code')}
                  >
                    💻 HTML Code
                  </button>
                </div>
              </div>
            </div>

            <div className="article-editor-container">
              {/* Rich formatting toolbar */}
              <div className="article-editor-toolbar">
                {/* Group: History (Undo / Redo / Format Painter) */}
                <div className="toolbar-btn-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Undo (Ctrl+Z)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (editorMode === 'visual') {
                        visualEditorRef.current?.focus();
                        document.execCommand('undo');
                        handleVisualInput();
                      } else {
                        codeEditorRef.current?.focus();
                        document.execCommand('undo');
                      }
                    }}
                  >
                    <Undo size={13} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Redo (Ctrl+Y)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (editorMode === 'visual') {
                        visualEditorRef.current?.focus();
                        document.execCommand('redo');
                        handleVisualInput();
                      } else {
                        codeEditorRef.current?.focus();
                        document.execCommand('redo');
                      }
                    }}
                  >
                    <Redo size={13} />
                  </button>
                  <button
                    type="button"
                    className={`toolbar-btn ${formatPainterStyle ? 'btn-active-painter' : ''}`}
                    title={
                      formatPainterStyle
                        ? 'Format Painter Active: Select text or click to apply style (Click to Cancel)'
                        : 'Format Painter: Copy formatting from selected text and paint onto another'
                    }
                    onMouseDown={handleToggleFormatPainter}
                  >
                    <Paintbrush size={13} />
                  </button>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Font Family & Font Size */}
                <div className="toolbar-btn-group">
                  <div className="toolbar-btn toolbar-select-btn" title="Text Font Style">
                    <Type size={13} color="#64748b" style={{ flexShrink: 0 }} />
                    <select
                      value={currentFontFamily}
                      onChange={(e) => applyFontFamily(e.target.value)}
                      onFocus={saveSelection}
                      onMouseDown={saveSelection}
                      aria-label="Font Style"
                      className="toolbar-select-control font-family-select"
                    >
                      {FONT_FAMILY_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="toolbar-btn toolbar-select-btn" title="Text Size">
                    <span className="toolbar-select-label">Size</span>
                    <select
                      value={currentFontSize}
                      onChange={(e) => applyFontSize(e.target.value)}
                      onFocus={saveSelection}
                      onMouseDown={saveSelection}
                      aria-label="Font Size"
                      className="toolbar-select-control font-size-select"
                    >
                      {FONT_SIZE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    title="Decrease Font Size (A-)"
                    className="toolbar-btn"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      stepFontSize(-1);
                    }}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    title="Increase Font Size (A+)"
                    className="toolbar-btn"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      stepFontSize(1);
                    }}
                  >
                    A+
                  </button>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Typography */}
                <div className="toolbar-btn-group">
                  <button type="button" className="toolbar-btn" title="Heading 2 (Major Section)" onMouseDown={(e) => execFormat(e, 'formatBlock', '<h2>')}>
                    <strong>H2</strong>
                  </button>
                  <button type="button" className="toolbar-btn" title="Heading 3 (Subhead)" onMouseDown={(e) => execFormat(e, 'formatBlock', '<h3>')}>
                    <strong>H3</strong>
                  </button>
                  <button type="button" className="toolbar-btn" title="Normal Paragraph" onMouseDown={(e) => execFormat(e, 'formatBlock', '<p>')}>
                    ¶ Body
                  </button>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Text styles */}
                <div className="toolbar-btn-group">
                  <button type="button" className="toolbar-btn" title="Bold" onMouseDown={(e) => execFormat(e, 'bold')}>
                    <b>B</b>
                  </button>
                  <button type="button" className="toolbar-btn" title="Italic" onMouseDown={(e) => execFormat(e, 'italic')}>
                    <i>I</i>
                  </button>
                  <button type="button" className="toolbar-btn" title="Underline" onMouseDown={(e) => execFormat(e, 'underline')}>
                    <u>U</u>
                  </button>
                  <button type="button" className="toolbar-btn" title="Strikethrough" onMouseDown={(e) => execFormat(e, 'strikeThrough')}>
                    <s>S</s>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Superscript (x² / power/index)"
                    onMouseDown={(e) => execFormat(e, 'superscript')}
                  >
                    <Superscript size={13} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Subscript (x₂ / chemical formula/base)"
                    onMouseDown={(e) => execFormat(e, 'subscript')}
                  >
                    <Subscript size={13} />
                  </button>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Alignment & Line Spacing */}
                <div className="toolbar-btn-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Align Left (Works on text, images & tables) [Ctrl+L]"
                    onMouseDown={(e) => applyAlignment(e, 'left')}
                  >
                    <AlignLeft size={13} /> Left
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Align Mid / Center (Works on text, images & tables) [Ctrl+E]"
                    onMouseDown={(e) => applyAlignment(e, 'center')}
                  >
                    <AlignCenter size={13} /> Mid
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Align Right (Works on text, images & tables) [Ctrl+R]"
                    onMouseDown={(e) => applyAlignment(e, 'right')}
                  >
                    <AlignRight size={13} /> Right
                  </button>
                  <div className="toolbar-btn toolbar-select-btn" title="Line Spacing (Line Height)">
                    <StretchVertical size={13} color="#64748b" style={{ flexShrink: 0 }} />
                    <select
                      value={currentLineSpacing}
                      onChange={(e) => applyLineSpacing(e.target.value)}
                      onFocus={saveSelection}
                      onMouseDown={saveSelection}
                      aria-label="Line Spacing"
                      className="toolbar-select-control line-spacing-select"
                    >
                      {LINE_SPACING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Lists */}
                <div className="toolbar-btn-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Bullet List (• Bullet)"
                    onMouseDown={(e) => toggleList(e, 'unordered')}
                  >
                    • Bullet
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Numbered List (1. List)"
                    onMouseDown={(e) => toggleList(e, 'ordered')}
                  >
                    1. List
                  </button>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Educational Callouts */}
                <div className="toolbar-btn-group">
                  <button
                    type="button"
                    className="toolbar-btn btn-accent"
                    title="Insert Key Concept Callout"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertCustomHtml(
                        '<blockquote style="border-left: 4px solid #059669; background: #f0fdf4; padding: 12px 18px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #065f46;"><strong>💡 Key Concept: </strong>Write key rule, formula or definition here...</blockquote><p><br></p>'
                      );
                    }}
                  >
                    💡 Key Concept
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn btn-blue"
                    title="Insert Formula Box"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertCustomHtml(
                        '<div style="background: #f8fafc; border: 1.5px solid #0284c7; border-radius: 10px; padding: 12px 18px; margin: 16px 0; color: #0369a1; font-family: monospace; font-size: 14px;"><strong>📐 Formula: </strong>(a + b)² = a² + 2ab + b²</div><p><br></p>'
                      );
                    }}
                  >
                    📐 Formula Box
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Insert Divider Line"
                    onMouseDown={(e) => execFormat(e, 'insertHorizontalRule')}
                  >
                    ― Line
                  </button>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Media & Links */}
                <div className="toolbar-btn-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Upload image from computer directly into article"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      articleImageInputRef.current?.click();
                    }}
                    disabled={uploadingArticleImg}
                  >
                    <UploadCloud size={13} /> {uploadingArticleImg ? 'Uploading...' : 'Local Image'}
                  </button>
                  <input
                    ref={articleImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleArticleImageUpload}
                    style={{ display: 'none' }}
                  />

                  <button type="button" className="toolbar-btn" title="Embed image from URL" onMouseDown={handleInsertWebImage}>
                    <ImageIcon size={13} /> Web Image
                  </button>

                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Generate and Embed AI Visuals with Gemini or ChatGPT"
                    style={{
                      background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
                      borderColor: '#c4b5fd',
                      color: '#7c3aed',
                      fontWeight: 700,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowAiImageModal(true);
                    }}
                  >
                    <Sparkles size={13} color="#7c3aed" /> AI Image
                  </button>

                  <button type="button" className="toolbar-btn" title="Insert Link" onMouseDown={handleInsertLink}>
                    <LinkIcon size={13} /> Link
                  </button>

                  <button type="button" className="toolbar-btn" title="Clear Formatting" onMouseDown={(e) => execFormat(e, 'removeFormat')}>
                    Clear Format
                  </button>
                </div>

                <div className="toolbar-separator" />

                {/* Group: Table Tools (Rows & Columns Controls) */}
                <div className="toolbar-btn-group">
                  <button
                    type="button"
                    className="toolbar-btn btn-blue"
                    title="Insert New Table"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertTable();
                    }}
                  >
                    <Table size={13} /> Table
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Add row below active row (+ Row)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTableRow('below');
                    }}
                  >
                    + Row
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Delete active row (- Row)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      deleteTableRow();
                    }}
                  >
                    - Row
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Add column to the right (+ Column)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTableColumn('right');
                    }}
                  >
                    + Col
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Delete active column (- Column)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      deleteTableColumn();
                    }}
                  >
                    - Col
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Delete entire table"
                    style={{ color: '#ef4444' }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      deleteTable();
                    }}
                  >
                    <Trash2 size={12} /> Table
                  </button>
                </div>
              </div>

              {/* Contextual Image Format Toolbar */}
              {editorMode === 'visual' && selectedImg && (
                <div className="study-article-image-toolbar word-doc-image-toolbar">
                  <div className="image-toolbar-label">
                    <PenTool size={14} color="#0284c7" /> <strong>Image Format:</strong>
                  </div>

                  <div className="image-toolbar-group">
                    <span>Width:</span>
                    <button
                      type="button"
                      className={imgWidth === '25%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle('25%', imgHeight, imgAlign); }}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      className={imgWidth === '50%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle('50%', imgHeight, imgAlign); }}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      className={imgWidth === '75%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle('75%', imgHeight, imgAlign); }}
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      className={imgWidth === '100%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle('100%', imgHeight, imgAlign); }}
                    >
                      100%
                    </button>
                    <input
                      type="text"
                      placeholder="100%"
                      value={imgWidth}
                      onChange={(e) => applyImageStyle(e.target.value, imgHeight, imgAlign)}
                      className="img-dim-input"
                    />
                  </div>

                  <div className="image-toolbar-group">
                    <span>Height:</span>
                    <button
                      type="button"
                      className={imgHeight === 'auto' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle(imgWidth, 'auto', imgAlign); }}
                    >
                      Auto
                    </button>
                    <input
                      type="text"
                      placeholder="auto"
                      value={imgHeight}
                      onChange={(e) => applyImageStyle(imgWidth, e.target.value, imgAlign)}
                      className="img-dim-input"
                    />
                  </div>

                  <div className="image-toolbar-group">
                    <span>Align:</span>
                    <button
                      type="button"
                      className={imgAlign === 'left' ? 'active' : ''}
                      title="Align Left"
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle(imgWidth, imgHeight, 'left'); }}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      className={imgAlign === 'center' ? 'active' : ''}
                      title="Align Center"
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle(imgWidth, imgHeight, 'center'); }}
                    >
                      🎯 Center
                    </button>
                    <button
                      type="button"
                      className={imgAlign === 'right' ? 'active' : ''}
                      title="Align Right"
                      onMouseDown={(e) => { e.preventDefault(); applyImageStyle(imgWidth, imgHeight, 'right'); }}
                    >
                      Right
                    </button>
                  </div>

                  <div className="image-toolbar-group" style={{ marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="btn-delete-img"
                      title="Delete Image"
                      onClick={() => {
                        if (selectedImg) {
                          const fig = selectedImg.closest('figure');
                          if (fig && fig.contains(selectedImg) && fig.children.length <= 2) {
                            fig.remove();
                          } else {
                            selectedImg.remove();
                          }
                          setSelectedImg(null);
                          handleVisualInput();
                          setNotice('Image removed.');
                        }
                      }}
                    >
                      <Trash2 size={13} /> Delete Image
                    </button>
                    <button
                      type="button"
                      className="btn-close-img-tool"
                      title="Done formatting image"
                      onClick={() => {
                        if (visualEditorRef.current) {
                          visualEditorRef.current.querySelectorAll('img').forEach((i) => i.classList.remove('is-selected'));
                        }
                        setSelectedImg(null);
                      }}
                    >
                      <X size={14} /> Done
                    </button>
                  </div>
                </div>
              )}

              {/* Contextual Table Column Width Toolbar */}
              {editorMode === 'visual' && selectedTableInfo && (
                <div className="study-article-table-toolbar">
                  <div className="table-toolbar-label">
                    <Table size={14} color="#059669" />
                    <strong>Table:</strong>
                    <span className="table-col-pill">Col {selectedTableInfo.colIndex + 1} of {selectedTableInfo.totalCols}</span>
                  </div>

                  <div className="table-toolbar-group">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>Col Width:</span>
                    <button
                      type="button"
                      className={selectedTableInfo.currentWidth === '15%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyColWidth('15%'); }}
                    >
                      15%
                    </button>
                    <button
                      type="button"
                      className={selectedTableInfo.currentWidth === '25%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyColWidth('25%'); }}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      className={selectedTableInfo.currentWidth === '33.33%' || selectedTableInfo.currentWidth === '33%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyColWidth('33.33%'); }}
                    >
                      33%
                    </button>
                    <button
                      type="button"
                      className={selectedTableInfo.currentWidth === '50%' ? 'active' : ''}
                      onMouseDown={(e) => { e.preventDefault(); applyColWidth('50%'); }}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      title="Distribute width equally across all columns"
                      onMouseDown={(e) => { e.preventDefault(); equalizeColWidths(); }}
                    >
                      Equalize All
                    </button>
                    <button
                      type="button"
                      title="Decrease Column Width (-5%)"
                      style={{ padding: '3px 8px', fontWeight: 700 }}
                      onMouseDown={(e) => { e.preventDefault(); stepColWidth(-5); }}
                    >
                      - 5%
                    </button>
                    <button
                      type="button"
                      title="Increase Column Width (+5%)"
                      style={{ padding: '3px 8px', fontWeight: 700 }}
                      onMouseDown={(e) => { e.preventDefault(); stepColWidth(5); }}
                    >
                      + 5%
                    </button>
                    <input
                      type="text"
                      placeholder="e.g. 25% or 150px"
                      value={selectedTableInfo.currentWidth}
                      onChange={(e) => applyColWidth(e.target.value)}
                      className="col-dim-input"
                      title="Enter custom width in % or px"
                    />
                  </div>

                  <div className="table-toolbar-group">
                    <button
                      type="button"
                      title="Insert column to left"
                      onMouseDown={(e) => { e.preventDefault(); addTableColumn('left'); }}
                    >
                      + Col Left
                    </button>
                    <button
                      type="button"
                      title="Insert column to right"
                      onMouseDown={(e) => { e.preventDefault(); addTableColumn('right'); }}
                    >
                      + Col Right
                    </button>
                    <button
                      type="button"
                      title="Delete this column"
                      className="btn-danger"
                      onMouseDown={(e) => { e.preventDefault(); deleteTableColumn(); }}
                    >
                      - Del Col
                    </button>
                    <button
                      type="button"
                      title="Insert row above"
                      onMouseDown={(e) => { e.preventDefault(); addTableRow('above'); }}
                    >
                      + Row Above
                    </button>
                    <button
                      type="button"
                      title="Insert row below"
                      onMouseDown={(e) => { e.preventDefault(); addTableRow('below'); }}
                    >
                      + Row Below
                    </button>
                    <button
                      type="button"
                      title="Delete this row"
                      className="btn-danger"
                      onMouseDown={(e) => { e.preventDefault(); deleteTableRow(); }}
                    >
                      - Del Row
                    </button>
                    <button
                      type="button"
                      className="btn-close-table-tool"
                      onClick={() => updateTableSelection(null)}
                      title="Done adjusting table"
                    >
                      <X size={14} /> Done
                    </button>
                  </div>
                </div>
              )}

              {/* Canvas: Visual Editor OR Code Editor */}
              {editorMode === 'visual' ? (
                <div
                  ref={visualEditorRef}
                  className={`study-article-visual-canvas ${formatPainterStyle ? 'has-format-painter' : ''}`}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleVisualInput}
                  onBlur={handleVisualInput}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseUp={() => {
                    if (formatPainterStyle) {
                      applyCopiedFormat();
                    } else {
                      handleEditorSelectionChange();
                    }
                  }}
                  onKeyUp={handleEditorSelectionChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && formatPainterStyle) {
                      setFormatPainterStyle(null);
                      setNotice('Format Painter cancelled.');
                      return;
                    }
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
                      e.preventDefault();
                      applyAlignment(e as any, 'left');
                      return;
                    }
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
                      e.preventDefault();
                      applyAlignment(e as any, 'center');
                      return;
                    }
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
                      e.preventDefault();
                      applyAlignment(e as any, 'right');
                      return;
                    }
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                      // Native browser undo operates cleanly on contentEditable DOM
                      setTimeout(() => handleVisualInput(), 20);
                      return;
                    }
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
                      // Native browser redo
                      setTimeout(() => handleVisualInput(), 20);
                      return;
                    }
                    if (e.key === 'Tab') {
                      const cell = getActiveTableCell();
                      if (cell) {
                        e.preventDefault();
                        const table = cell.closest('table');
                        if (table) {
                          const allCells = Array.from(table.querySelectorAll('td, th'));
                          const idx = allCells.indexOf(cell);
                          if (e.shiftKey) {
                            if (idx > 0) {
                              const prev = allCells[idx - 1] as HTMLElement;
                              prev.focus();
                              const range = document.createRange();
                              const sel = window.getSelection();
                              range.selectNodeContents(prev);
                              sel?.removeAllRanges();
                              sel?.addRange(range);
                            }
                          } else {
                            if (idx < allCells.length - 1) {
                              const next = allCells[idx + 1] as HTMLElement;
                              next.focus();
                              const range = document.createRange();
                              const sel = window.getSelection();
                              range.selectNodeContents(next);
                              sel?.removeAllRanges();
                              sel?.addRange(range);
                            } else {
                              addTableRow('below');
                            }
                          }
                        }
                        return;
                      }
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      const sel = window.getSelection();
                      const anchorNode = sel?.anchorNode;
                      const parentElem = anchorNode ? (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode as HTMLElement) : null;
                      if (parentElem?.closest('li')) return;
                      e.preventDefault();
                      try {
                        document.execCommand('insertParagraph', false, undefined);
                      } catch {
                        document.execCommand('insertHTML', false, '<p><br></p>');
                      }
                      handleVisualInput();
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: initialHtmlRef.current }}
                />
              ) : (
                <textarea
                  ref={codeEditorRef}
                  className="study-article-code-canvas"
                  rows={12}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    contentRef.current = e.target.value;
                    const raw = e.target.value.replace(/<[^>]*>/g, ' ').trim();
                    setWordCount(raw ? raw.split(/\s+/).filter(Boolean).length : 0);
                  }}
                  placeholder="Write or paste your article HTML notes here..."
                />
              )}

            </div>
          </div>
          )}

          <div className="study-editor-footer">
            <button type="button" className="button button-secondary" onClick={attemptClose}>
              Cancel
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => handleSaveMaterial('DRAFT')}
                disabled={saving}
                title="Save article as draft"
              >
                <Save size={15} /> Save as Draft
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => handleSaveMaterial('PUBLISHED')}
                disabled={saving}
              >
                {saving ? <RefreshCw size={15} className="spin" /> : <Check size={15} />}
                {saving ? 'Saving Material...' : initialData ? 'Update Material' : 'Publish Study Material'}
              </button>
            </div>
          </div>
        </form>

        {showDraftPrompt && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000000,
              padding: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '1.5px solid #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                animation: 'studyCardPop 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <Save size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16.5px', color: '#0f172a', fontWeight: 700 }}>
                    Save Article in Draft?
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                    You have unsaved changes. Would you like to save this article as a draft before closing?
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="button button-primary"
                  style={{ justifyContent: 'center', padding: '10px 16px', fontSize: '13.5px' }}
                  onClick={() => {
                    setShowDraftPrompt(false);
                    void handleSaveMaterial('DRAFT');
                  }}
                  disabled={saving}
                >
                  <Save size={15} /> Save as Draft & Exit
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  style={{ justifyContent: 'center', padding: '9px 16px', fontSize: '13px', color: '#dc2626' }}
                  onClick={() => {
                    setShowDraftPrompt(false);
                    localStorage.removeItem('study_material_auto_draft');
                    onClose();
                  }}
                >
                  <Trash2 size={14} /> Discard & Exit
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  style={{ justifyContent: 'center', padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => setShowDraftPrompt(false)}
                >
                  Continue Writing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-Editor AI Image Generator Modal */}
        {showAiImageModal && (
          <ArticleAiImageModal
            isOpen={showAiImageModal}
            onClose={() => setShowAiImageModal(false)}
            onInsert={handleInsertAiImage}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
