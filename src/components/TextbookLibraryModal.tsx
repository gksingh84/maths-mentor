import { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  UploadCloud,
  Trash2,
  X,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  FileText,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { ALL_STUDENT_GRADES } from '../App';
import { STANDARD_SUBJECT_LIST } from './TeacherAIAssistant';

export interface TextbookItem {
  id: string;
  title: string;
  grade: string;
  subject: string;
  chapter?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  teacherName?: string;
  uploadedAt: string;
  activeForAI: boolean;
}

interface TextbookLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGrade?: string;
  selectedSubject?: string;
  onTextbooksChanged?: () => void;
  setNotice: (msg: string) => void;
}

export function TextbookLibraryModal({
  isOpen,
  onClose,
  selectedGrade,
  selectedSubject,
  onTextbooksChanged,
  setNotice,
}: TextbookLibraryModalProps) {
  const [books, setBooks] = useState<TextbookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>(selectedGrade || 'all');
  const [filterSubject, setFilterSubject] = useState<string>(selectedSubject || 'all');

  // Form State for uploading new book
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState(selectedGrade || 'Grade 6');
  const [newSubject, setNewSubject] = useState(selectedSubject || 'Science');
  const [newChapter, setNewChapter] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial grade and subject when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedGrade) setNewGrade(selectedGrade);
      if (selectedSubject) setNewSubject(selectedSubject);
    }
  }, [isOpen, selectedGrade, selectedSubject]);

  // Fetch textbooks list
  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/textbooks', { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.textbooks)) {
        setBooks(data.textbooks);
      }
    } catch {
      setNotice('⚠️ Could not load textbook library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadBooks();
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setFormError('File size exceeds the 30MB maximum limit.');
      return;
    }

    setFormError('');
    setSelectedFile(file);

    // Auto-fill Title if empty
    if (!newTitle.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      setNewTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter a book or chapter title.');
      return;
    }
    if (!selectedFile || !fileBase64) {
      setFormError('Please select a PDF or document file to upload.');
      return;
    }

    setUploading(true);
    setFormError('');

    try {
      const res = await fetch('/api/textbooks/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: newTitle.trim(),
          grade: newGrade,
          subject: newSubject,
          chapter: newChapter.trim() || undefined,
          fileName: selectedFile.name,
          fileData: fileBase64,
          fileType: selectedFile.type || 'application/pdf',
          activeForAI: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload textbook.');
      }

      setNotice(`✓ "${newTitle.trim()}" uploaded and active for AI grounding.`);
      // Reset form
      setNewTitle('');
      setNewChapter('');
      setSelectedFile(null);
      setFileBase64('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      await loadBooks();
      if (onTextbooksChanged) onTextbooksChanged();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/textbooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ activeForAI: !current }),
      });
      if (res.ok) {
        setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, activeForAI: !current } : b)));
        setNotice(!current ? '✓ Textbook activated for AI grounding.' : 'Textbook paused for AI grounding.');
        if (onTextbooksChanged) onTextbooksChanged();
      }
    } catch {
      setNotice('⚠️ Failed to update textbook status.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the Textbook Library?`)) return;

    try {
      const res = await fetch(`/api/textbooks/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== id));
        setNotice(`✓ Removed "${title}".`);
        if (onTextbooksChanged) onTextbooksChanged();
      }
    } catch {
      setNotice('⚠️ Failed to delete textbook.');
    }
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.chapter && b.chapter.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = filterGrade === 'all' || b.grade.toLowerCase() === filterGrade.toLowerCase();
      const matchSubj = filterSubject === 'all' || b.subject.toLowerCase() === filterSubject.toLowerCase();
      return matchSearch && matchGrade && matchSubj;
    });
  }, [books, searchQuery, filterGrade, filterSubject]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={22} color="#0284c7" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Textbook & Curriculum Library
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Upload textbooks and chapter PDFs to ground AI lesson notes and quizzes directly in your curriculum.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upload New Book Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <UploadCloud size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#1e293b' }}>
                Upload New Textbook, Chapter, or Reference Material
              </h3>
            </div>

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpload}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Book / Material Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. NCERT Science - Curiosity"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Grade / Class *
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                  >
                    {ALL_STUDENT_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Subject *
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                  >
                    {STANDARD_SUBJECT_LIST.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Chapter / Scope (Optional)
                  </label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="e.g. Chapter 4: Materials Around Us"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="button button-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 14px', minHeight: '36px', gap: '6px' }}
                  >
                    <FileText size={15} />
                    <span>{selectedFile ? selectedFile.name : 'Choose PDF / Document...'}</span>
                  </button>
                  {selectedFile && (
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                      ✓ {Math.round(selectedFile.size / 1024)} KB ready
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="button button-primary"
                  style={{
                    background: '#0284c7',
                    borderColor: '#0284c7',
                    fontSize: '13px',
                    padding: '0 20px',
                    minHeight: '36px',
                    gap: '6px',
                  }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} /> Add to Textbook Library
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Library Search & Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search uploaded books, chapters, or files..."
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={14} color="#64748b" />
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#fff' }}
              >
                <option value="all">All Grades</option>
                {ALL_STUDENT_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#fff' }}
              >
                <option value="all">All Subjects</option>
                {STANDARD_SUBJECT_LIST.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Book Cards Grid / List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                Curriculum Resources ({filteredBooks.length} available)
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Books marked <strong>Active</strong> are automatically referenced by the AI assistant.
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontSize: '13.5px' }}>Loading curriculum library...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '12px',
                  color: '#64748b',
                }}
              >
                <BookOpen size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '15px' }}>No Textbooks Found</h4>
                <p style={{ margin: 0, fontSize: '13px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Upload your school's textbook PDFs or chapter booklets above. The AI Assistant will read them and generate notes, analogies, and quizzes grounded in their exact contents.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    style={{
                      background: '#ffffff',
                      border: book.activeForAI ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      {/* Badges row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                          {book.grade}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#ede9fe', color: '#6d28d9' }}>
                          {book.subject}
                        </span>
                        {book.activeForAI && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <FileCheck2 size={11} /> AI Grounding Active
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0 0 4px', fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                        {book.title}
                      </h4>
                      {book.chapter && (
                        <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b' }}>
                          📖 {book.chapter}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
                        {book.fileName} • {Math.round(book.fileSize / 1024)} KB
                      </p>
                    </div>

                    {/* Actions row */}
                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '10px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={book.activeForAI}
                          onChange={() => void handleToggleActive(book.id, book.activeForAI)}
                        />
                        <span style={{ color: book.activeForAI ? '#15803d' : '#64748b', fontWeight: 600 }}>
                          {book.activeForAI ? 'Grounding On' : 'Grounding Off'}
                        </span>
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={book.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-secondary"
                          style={{ padding: '3px 8px', fontSize: '11.5px', minHeight: '26px', gap: '3px' }}
                          title="Open or download uploaded document"
                        >
                          <ExternalLink size={12} />
                          <span>View</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDelete(book.id, book.title)}
                          className="button button-secondary"
                          style={{ padding: '3px 8px', fontSize: '11.5px', minHeight: '26px', color: '#dc2626', borderColor: '#fecaca' }}
                          title="Delete from library"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <CheckCircle2 size={14} color="#16a34a" />
            <span>Active books for your selected Grade & Subject are automatically parsed during generation.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="button button-primary"
            style={{ padding: '0 20px', minHeight: '36px', fontSize: '13px', background: '#0284c7', borderColor: '#0284c7' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
