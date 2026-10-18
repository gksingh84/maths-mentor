import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Lightbulb,
  FileText,
  MessageSquare,
  Check,
  Copy,
  Printer,
  Send,
  RefreshCw,
  Edit3,
  Eye,
  RotateCcw,
  PenTool,
  Zap,
  CheckCircle2,
  Save,
  Archive,
} from 'lucide-react';
import {
  getDefaultGrade,
  getActiveGrades,
  getDefaultSubject,
  getActiveSubjects,
} from '../utils/teacherPreferences';
import { ALL_STUDENT_GRADES } from '../App';

export type AssistantMode = 'lesson_plan' | 'explanation' | 'practice' | 'socratic' | 'evaluation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: AssistantMode;
}

export interface InitialCanvasData {
  title?: string;
  content?: string;
  grade?: string | null;
  subject?: string | null;
}

interface TeacherAIAssistantProps {
  user?: any;
  setNotice: (msg: string) => void;
  onNavigateToTab?: (tab: string) => void;
  initialCanvasData?: InitialCanvasData | null;
  onCanvasDataLoaded?: () => void;
  onLessonSaved?: () => Promise<void> | void;
}

function htmlToPlainOrMarkdown(content: string): string {
  if (!content) return '';
  if (!content.includes('<') || !content.includes('>')) return content;
  return content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function renderInline(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|₹\s*\d+(?:\.\d+)?)/g);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} style={{ color: '#0f172a', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return (
        <em key={idx} style={{ color: '#334155' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^₹\s*\d+(?:\.\d+)?$/.test(part.trim())) {
      return (
        <span key={idx} className="rupee-tag">
          {part.trim()}
        </span>
      );
    }
    return part;
  });
}

function renderRichEducationalContent(content: string): React.ReactNode {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Empty lines
    if (!line) {
      elements.push(<div key={`empty-${i}`} style={{ height: '8px' }} />);
      i++;
      continue;
    }

    // 2. PART 1 Banner Detection
    if (
      /^#+\s*(?:🧑‍🏫\s*)?PART\s*1\b/i.test(line) ||
      line.toUpperCase().includes('PART 1 — TEACHER INSTRUCTIONS') ||
      line.toUpperCase().includes('PART 1: TEACHER INSTRUCTIONS')
    ) {
      elements.push(
        <div key={`part1-${i}`} className="canvas-part-banner part-1-banner">
          <div className="part-badge">
            <span>🧑‍🏫</span>
            <span>TEACHER BLUEPRINT • BEFORE CLASS</span>
          </div>
          <h2 className="part-title">PART 1: TEACHER INSTRUCTIONS & PEDAGOGICAL BLUEPRINT</h2>
          <p className="part-desc">
            Curriculum alignment, prerequisites, lesson timing table, misconceptions & differentiation strategies.
          </p>
        </div>
      );
      i++;
      continue;
    }

    // 3. PART 2 Banner Detection
    if (
      /^#+\s*(?:🏫\s*)?PART\s*2\b/i.test(line) ||
      line.toUpperCase().includes('PART 2 — ACTUAL TEACHING CONTENT') ||
      line.toUpperCase().includes('PART 2: ACTUAL TEACHING CONTENT') ||
      line.toUpperCase().includes('PART 2: LIVE CLASSROOM')
    ) {
      elements.push(
        <div key={`part2-${i}`} className="canvas-part-banner part-2-banner">
          <div className="part-badge">
            <span>🏫</span>
            <span>LIVE CLASSROOM • WHAT TO TEACH</span>
          </div>
          <h2 className="part-title">PART 2: LIVE CLASSROOM TEACHING CONTENT & SCRIPT</h2>
          <p className="part-desc">
            Word-for-word teacher hook, intuitive conceptual script, worked examples, guided & independent practice.
          </p>
        </div>
      );
      i++;
      continue;
    }

    // 4. Code / Structured Text Blocks
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const blockText = codeLines.join('\n');
      elements.push(
        <div key={`code-${i}`} className="canvas-code-box">
          <pre>
            <code>{blockText}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 5. Markdown Table Block
    if (line.startsWith('|') && line.includes('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const curLine = lines[i].trim();
        // Skip separator row like |:---|:---| or |---|---|
        if (!/^\|[\s:\-+|]+\|$/.test(curLine)) {
          const cells = curLine.split('|').map((c) => c.trim());
          if (cells.length > 0 && cells[0] === '') cells.shift();
          if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
          if (cells.length > 0) {
            tableRows.push(cells);
          }
        }
        i++;
      }

      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const bodyRows = tableRows.slice(1);
        elements.push(
          <div key={`table-${i}`} className="canvas-table-container">
            <table className="canvas-styled-table">
              <thead>
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx}>{renderInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((r, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'row-even' : 'row-odd'}>
                    {r.map((c, cIdx) => (
                      <td key={cIdx}>{renderInline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // 6. Misconception Callout Card
    if (
      line.toLowerCase().includes('misconception') &&
      (line.startsWith('###') ||
        line.startsWith('**') ||
        line.startsWith('1.') ||
        line.startsWith('2.') ||
        line.startsWith('3.'))
    ) {
      const cardLines = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('---') &&
        !lines[i].trim().startsWith('|')
      ) {
        cardLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`misconception-${i}`} className="canvas-callout-card misconception-card">
          <div className="callout-header">
            <span>⚠️</span> STUDENT MISCONCEPTION & DIAGNOSTIC INTERVENTION
          </div>
          <div>
            {cardLines.map((cl, clIdx) => (
              <p key={clIdx} style={{ margin: '4px 0', fontSize: '13.5px', lineHeight: 1.6 }}>
                {renderInline(cl.replace(/^###\s+/, ''))}
              </p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // 7. Exit Ticket Card
    if (line.toLowerCase().includes('exit ticket') && (line.startsWith('###') || line.startsWith('##'))) {
      const ticketLines = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('##') &&
        !lines[i].trim().startsWith('# 🏫')
      ) {
        ticketLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`ticket-${i}`} className="canvas-callout-card exit-ticket-card">
          <div className="callout-header">
            <span>🎟️</span> 3-MINUTE CLASSROOM EXIT TICKET
          </div>
          <div>
            {ticketLines.map((tl, tlIdx) => (
              <div key={tlIdx} style={{ margin: '4px 0', fontSize: '13.5px', lineHeight: 1.6 }}>
                {renderInline(tl.replace(/^###\s+/, '').replace(/^##\s+/, ''))}
              </div>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // 8. Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="canvas-h1">
          {renderInline(line.replace('# ', ''))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <div key={`h2-${i}`} className="canvas-section-header">
          <h3 className="canvas-h2">{renderInline(line.replace('## ', ''))}</h3>
        </div>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="canvas-h3">
          {renderInline(line.replace('### ', ''))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h5
          key={`h4-${i}`}
          style={{ fontSize: '13.5px', fontWeight: 700, margin: '10px 0 4px', color: '#475569' }}
        >
          {renderInline(line.replace('#### ', ''))}
        </h5>
      );
      i++;
      continue;
    }

    // 9. Horizontal Rule
    if (/^---{2,}$/.test(line)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{ margin: '24px 0', border: 'none', borderTop: '1.5px dashed #cbd5e1' }}
        />
      );
      i++;
      continue;
    }

    // 10. Numbered Step / Question (e.g. "1. ", "2. ", "a) ")
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="canvas-numbered-step">
          <span className="step-num-circle">{numMatch[1]}</span>
          <div style={{ flex: 1 }}>{renderInline(numMatch[2])}</div>
        </div>
      );
      i++;
      continue;
    }

    // 11. Bullet Item (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={`bullet-${i}`} className="canvas-bullet-item">
          <span className="bullet-dot">•</span>
          <div style={{ flex: 1 }}>{renderInline(line.replace(/^[-*]\s+/, ''))}</div>
        </div>
      );
      i++;
      continue;
    }

    // 12. Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="canvas-p">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

const STANDARD_SUBJECT_LIST = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Social Science',
  'History',
  'Geography',
  'Computer Science',
];

const MODE_CONFIG: Record<
  AssistantMode,
  { label: string; icon: any; placeholder: string; starterPrompts: string[]; description: string }
> = {
  lesson_plan: {
    label: 'Lesson Planner',
    icon: BookOpen,
    description: 'Structured 45-min NEP 2026 lesson plans with learning outcomes, hooks, worked examples & exit tickets.',
    placeholder: 'e.g. Plan a 45-minute interactive lesson on Surface Area & Volume with real-life hook...',
    starterPrompts: [
      'Create 45-min NEP 2026 lesson plan with learning outcomes',
      'Design a 5-minute provocation hook & real-life puzzle',
      'Generate worked examples & 3-minute exit ticket',
      'Plan an inquiry-based lab or classroom demonstration',
    ],
  },
  explanation: {
    label: 'Explanations & Analogies',
    icon: Lightbulb,
    description: 'Grade-adapted mental models, vivid everyday analogies, and common misconception alerts.',
    placeholder: 'e.g. Explain why a negative times a negative equals a positive using a relatable everyday analogy...',
    starterPrompts: [
      'Explain using intuitive everyday objects & real-life analogies',
      'Identify top 3 student misconceptions & how to bust them',
      'Provide a simplified bilingual/Hinglish conceptual breakdown',
      'Break down this complex formula into 3 simple intuitive steps',
    ],
  },
  practice: {
    label: 'Questions & Worksheets',
    icon: FileText,
    description: 'Tiered questions (Foundation, Standard, HOTS), worksheets, and competency-based questions with answer keys.',
    placeholder: 'e.g. 6 tiered problems on Pythagoras theorem with full worked solutions and marking guide...',
    starterPrompts: [
      'Generate 3 Foundational, 3 Standard, and 2 HOTS questions',
      'Create a print-ready printable worksheet with separate answer key',
      'Generate competency-based questions with marking allocation',
      'Create 4 Assertion-Reason & Case-Based scenario questions',
    ],
  },
  socratic: {
    label: 'Socratic Dialogue',
    icon: MessageSquare,
    description: 'Inquiry-driven debate questions, turn-and-talk partner prompts, and conceptual checks.',
    placeholder: 'e.g. Questions to spark a lively classroom debate on whether zero is odd, even, or neutral...',
    starterPrompts: [
      '3 thought-provoking questions for classroom debate',
      'Peer instruction turn-and-talk discussion prompt',
      'Diagnostic multiple-choice question with trick options',
      'Open-ended inquiry challenge with no single obvious answer',
    ],
  },
  evaluation: {
    label: 'Answer Evaluation',
    icon: CheckCircle2,
    description: 'Evaluate student responses, step-wise marks, conceptual error diagnosis, and constructive feedback.',
    placeholder: 'e.g. Paste a student answer or math solution to evaluate with rubric and feedback...',
    starterPrompts: [
      'Evaluate student answer with "What went well" & "How to improve"',
      'Create a 5-point marking rubric with common student traps',
      'Draft constructive, age-appropriate student feedback',
      'Analyze a common student calculation error and provide remediation',
    ],
  },
};

const SESSION_STORAGE_KEY = 'ai_teaching_assistant_session_v1';

interface AIAssistantSessionState {
  board?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  mode?: AssistantMode;
  messages?: ChatMessage[];
  canvasTitle?: string;
  canvasContent?: string;
  canvasEditing?: boolean;
}

function loadSavedSession(): AIAssistantSessionState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistSession(data: AIAssistantSessionState) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota
  }
}

function clearSavedSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function TeacherAIAssistant({
  user,
  setNotice,
  onNavigateToTab,
  initialCanvasData,
  onCanvasDataLoaded,
  onLessonSaved,
}: TeacherAIAssistantProps) {
  const initialSession = useRef(loadSavedSession()).current;

  // Context state (restored from sessionStorage across refreshes and page navigation)
  const [board, setBoard] = useState(
    () => initialSession.board || 'CBSE (NEP 2026)'
  );
  const [grade, setGrade] = useState(
    () => initialSession.grade || getDefaultGrade()
  );
  const [subject, setSubject] = useState(
    () => initialSession.subject || getDefaultSubject()
  );
  const [topic, setTopic] = useState(
    () => initialSession.topic || ''
  );
  const [mode, setMode] = useState<AssistantMode>(
    () => initialSession.mode || 'lesson_plan'
  );

  // Chat conversation state (restored from sessionStorage across refreshes and page navigation)
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => initialSession.messages || []
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCanvas, setCopiedCanvas] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [hasTeacherKey, setHasTeacherKey] = useState<boolean | null>(null);

  // Live Canvas state (restored from sessionStorage across refreshes and page navigation)
  const [canvasTitle, setCanvasTitle] = useState(
    () => initialSession.canvasTitle || 'Untitled Lesson Preparation'
  );
  const [canvasContent, setCanvasContent] = useState(
    () => initialSession.canvasContent || ''
  );
  const [canvasEditing, setCanvasEditing] = useState(
    () => Boolean(initialSession.canvasEditing)
  );
  const [topicError, setTopicError] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingArchive, setSavingArchive] = useState(false);

  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);

  // Persist session to sessionStorage whenever generated content or context changes
  useEffect(() => {
    persistSession({
      board,
      grade,
      subject,
      topic,
      mode,
      messages,
      canvasTitle,
      canvasContent,
      canvasEditing,
    });
  }, [board, grade, subject, topic, mode, messages, canvasTitle, canvasContent, canvasEditing]);

  // Load lesson into Live Canvas when opened from Archive or other panels
  useEffect(() => {
    if (initialCanvasData && initialCanvasData.content !== undefined) {
      const cleanContent = htmlToPlainOrMarkdown(initialCanvasData.content || '');
      setCanvasContent(cleanContent);
      if (initialCanvasData.title) {
        setCanvasTitle(initialCanvasData.title);
        const topicCandidate = initialCanvasData.title
          .replace(/^[^:]+:\s*/, '')
          .replace(/\s*\([^)]*\)$/, '')
          .trim();
        if (topicCandidate && topicCandidate.length < 80) {
          setTopic(topicCandidate);
          setTopicError(false);
        }
      }
      if (initialCanvasData.grade) {
        setGrade(initialCanvasData.grade);
      }
      if (initialCanvasData.subject) {
        setSubject(initialCanvasData.subject);
      }
      setNotice(`✓ Loaded "${initialCanvasData.title || 'Lesson'}" into Live Teaching Canvas.`);
      onCanvasDataLoaded?.();
    }
  }, [initialCanvasData]);

  // Provider info from localStorage
  const activeProvider = typeof window !== 'undefined'
    ? (localStorage.getItem('livequiz_ai_provider') || 'auto')
    : 'auto';

  // Check teacher profile on mount for configured personal API key
  useEffect(() => {
    fetch('/api/teacher/profile', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setHasTeacherKey(Boolean(d.teacher?.apiKey || d.teacher?.hasApiKey)))
      .catch(() => setHasTeacherKey(false));
  }, []);

  // Synchronize context when teacher preferences change in Settings
  useEffect(() => {
    const handlePrefChange = () => {
      setGrade(getDefaultGrade());
      setSubject(getDefaultSubject());
    };
    window.addEventListener('teacher-preferences-updated', handlePrefChange);
    return () => window.removeEventListener('teacher-preferences-updated', handlePrefChange);
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle sending a message
  const handleSendMessage = async (textToSend?: string, explicitTopic?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    let targetTopic = (explicitTopic || topic).trim();

    // Content generation MUST start ONLY when Chapter / Topic has been mentioned
    if (!targetTopic) {
      // Check if teacher typed a short topic name directly into the chat input
      const isGenericAction = /^(create|plan|generate|make|explain|give|provide|show|write|help|draft|design|how|what|why|evaluate|check)\b/i.test(promptText);

      if (!isGenericAction && promptText.length < 60) {
        targetTopic = promptText;
        setTopic(promptText);
        setTopicError(false);
      } else {
        // Teacher requested generation without specifying a topic: halt and prompt for topic
        setTopicError(true);
        topicInputRef.current?.focus();
        setNotice('⚠️ Please enter a Chapter / Topic first to begin generating content.');

        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: promptText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode,
        };

        const clarifyMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `👋 **Please specify the Chapter or Topic first.**\n\nI am ready to help you prepare high-quality teaching resources for **${board} ${grade} ${subject}**, but content generation begins once a **Chapter or Topic** is specified.\n\n👉 *Please enter your topic in the **Chapter / Topic** box in the top control bar (or reply right here with your topic, e.g. *"Surface Area & Volume"*, *"Quadratic Equations"*, *"Light & Reflection"*, *"Fractions"*).*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode,
        };

        setMessages((prev) => [...prev, userMessage, clarifyMessage]);
        setInput('');
        return;
      }
    }

    setTopicError(false);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setCanvasTitle(`${MODE_CONFIG[mode].label}: ${targetTopic} (${grade} ${subject})`);

    try {
      const response = await fetch('/api/ai/teaching-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          board,
          grade,
          subject,
          topic: targetTopic,
          mode,
          provider: activeProvider,
        }),
      });

      let data: any = {};
      try {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text && text.length < 200 ? text : `Server error (${response.status} ${response.statusText})` };
        }
      } catch {
        data = { error: 'Network communication failure. Please check your internet connection.' };
      }

      if (!response.ok) {
        throw new Error(data.error || `Server returned error (${response.status})`);
      }

      const aiReply = data.reply || data.content || 'No response generated.';

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Automatically update the live canvas with the newly generated lesson content
      setCanvasContent(aiReply);
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Failed to reach AI teaching assistant.';
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `⚠️ **AI Assistant Notice:** ${errText}\n\n*Tip: Check [Settings > AI Settings] to confirm your unique API key.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setNotice(errText);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // Push an individual chat message to the Live Canvas
  const pushToCanvas = (content: string, customTitle?: string) => {
    setCanvasContent(content);
    if (customTitle) setCanvasTitle(customTitle);
    setNotice('✓ Content pushed to Live Teaching Canvas.');
  };

  // Copy Canvas text
  const handleCopyCanvas = () => {
    if (!canvasContent) return;
    void navigator.clipboard?.writeText(canvasContent);
    setCopiedCanvas(true);
    setNotice('✓ Canvas text copied to clipboard.');
    setTimeout(() => setCopiedCanvas(false), 2200);
  };

  // Copy individual message
  const handleCopyMessage = (msgId: string, content: string) => {
    void navigator.clipboard?.writeText(content);
    setCopiedMessageId(msgId);
    setNotice('✓ Message copied to clipboard.');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Print canvas
  const handlePrintCanvas = () => {
    window.print();
  };

  // Save current Live Teaching Canvas document as a Draft in Question Papers & Lessons
  const handleSaveDraft = async () => {
    const contentToSave = canvasContent.trim();
    if (!contentToSave) {
      setNotice('⚠️ Live Teaching Canvas is empty. Generate or write content first before saving as draft.');
      return;
    }
    setSavingDraft(true);
    try {
      const res = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: canvasTitle.trim() || 'Untitled Lesson Plan',
          subject: subject || undefined,
          grade: grade || undefined,
          totalMarks: 100,
          content: contentToSave,
          status: 'DRAFT',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }
      setNotice(`✓ Saved "${canvasTitle.trim() || 'Lesson'}" as Draft in Question Papers & Lessons.`);
      if (onLessonSaved) {
        await onLessonSaved();
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to save lesson draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Save current Live Teaching Canvas document directly into the Archive
  const handleSaveArchive = async () => {
    const contentToSave = canvasContent.trim();
    if (!contentToSave) {
      setNotice('⚠️ Live Teaching Canvas is empty. Generate or write content first before saving in Archive.');
      return;
    }
    setSavingArchive(true);
    try {
      const res = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: canvasTitle.trim() || 'Untitled Lesson Plan',
          subject: subject || undefined,
          grade: grade || undefined,
          totalMarks: 100,
          content: contentToSave,
          status: 'ARCHIVED',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }
      setNotice(`✓ Saved "${canvasTitle.trim() || 'Lesson'}" directly into Archive.`);
      if (onLessonSaved) {
        await onLessonSaved();
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to save lesson in archive.');
    } finally {
      setSavingArchive(false);
    }
  };

  // Reset session (clears sessionStorage and resets state for a fresh session)
  const handleResetSession = () => {
    if (
      (messages.length > 0 || canvasContent.trim() || topic.trim()) &&
      !window.confirm('Start a fresh teaching assistant session? Current chat and live canvas content will be cleared.')
    ) {
      return;
    }
    clearSavedSession();
    setMessages([]);
    setTopic('');
    setCanvasContent('');
    setCanvasTitle('Untitled Lesson Preparation');
    setInput('');
    setTopicError(false);
    setNotice('✓ Fresh teaching session started.');
  };

  // Combine subjects list with active subjects first
  const activeSubs = getActiveSubjects();
  const allSubs = Array.from(new Set([...activeSubs, ...STANDARD_SUBJECT_LIST]));

  const ModeIcon = MODE_CONFIG[mode].icon;

  return (
    <div className="ai-assistant-wrapper">
      {/* ============================================================== */}
      {/* 1. TOP CONTROL BAR: Context Selectors (Grade, Subject, Mode)   */}
      {/* ============================================================== */}
      <div className="ai-assistant-header-card">
        {/* Row 1: Title (Left) & AI Provider / API Key Status (Top Right Corner) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '14px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'fit-content' }}>
            <div className="ai-avatar-badge">
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="overline" style={{ margin: 0 }}>Pedagogical Copilot</span>
                <span className="nep-pill">NEP 2026 Aligned</span>
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                AI Teaching Assistant
              </h2>
            </div>
          </div>

          {/* Top Right Hand Corner: AI Provider Status */}
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            <Zap size={14} color={hasTeacherKey === false ? '#d97706' : '#0284c7'} />
            <span>AI Provider: <strong>{activeProvider === 'auto' ? 'Auto (Gemini / GPT / DeepSeek)' : activeProvider.toUpperCase()}</strong></span>
            {hasTeacherKey === true && (
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                ● API Key Active
              </span>
            )}
            {hasTeacherKey === false && onNavigateToTab && (
              <button
                type="button"
                className="text-button"
                onClick={() => onNavigateToTab('settings')}
                style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, border: '1px solid #fde68a' }}
              >
                ⚠️ Add API Key in Settings →
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Context Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Board Selector */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            <span>Board:</span>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="styled-select"
              style={{ fontSize: '12.5px', padding: '5px 9px' }}
            >
              <option value="CBSE (NEP 2026)">CBSE (NEP 2026)</option>
              <option value="ICSE">ICSE</option>
              <option value="State Board">State Board</option>
              <option value="Other">General / Other</option>
            </select>
          </label>

          {/* Grade Selector */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            <span>Class:</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="styled-select"
              style={{ fontSize: '12.5px', padding: '5px 9px' }}
            >
              {getActiveGrades().length > 0 && (
                <optgroup label="Active Classes">
                  {getActiveGrades().map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </optgroup>
              )}
              {ALL_STUDENT_GRADES.filter((g) => !getActiveGrades().includes(g)).length > 0 && (
                <optgroup label="Other Classes">
                  {ALL_STUDENT_GRADES.filter((g) => !getActiveGrades().includes(g)).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          {/* Subject Selector */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            <span>Subject:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="styled-select"
              style={{ fontSize: '12.5px', padding: '5px 9px' }}
            >
              {allSubs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {/* Chapter / Topic Field (Mandatory before generation starts) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: topicError ? '#dc2626' : '#334155', minWidth: '220px', flex: '1 1 200px' }}>
            <span style={{ whiteSpace: 'nowrap' }}>Chapter / Topic:*</span>
            <input
              ref={topicInputRef}
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (topicError) setTopicError(false);
              }}
              placeholder="e.g. Surface Area, Quadratic Equations..."
              className="styled-input"
              style={{
                fontSize: '12.5px',
                padding: '5px 10px',
                width: '100%',
                borderRadius: '8px',
                border: topicError ? '2px solid #ef4444' : '1px solid #cbd5e1',
                background: topicError ? '#fef2f2' : '#ffffff',
                outline: 'none',
              }}
            />
          </label>

          {/* New Session Button */}
          <button
            type="button"
            className="button button-secondary"
            style={{ fontSize: '12.5px', padding: '5px 12px', minHeight: '32px', gap: '6px' }}
            onClick={handleResetSession}
            title="Start a new teaching session"
          >
            <RotateCcw size={14} /> New Session
          </button>
        </div>

        {/* Row 3: Mode Selector Segmented Tabs */}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
          <div className="segmented-control" style={{ background: '#f8fafc', padding: '3px', border: '1px solid #e2e8f0', width: '100%', overflowX: 'auto' }}>
            {(Object.keys(MODE_CONFIG) as AssistantMode[]).map((m) => {
              const Icon = MODE_CONFIG[m].icon;
              return (
                <button
                  key={m}
                  type="button"
                  className={`segmented-btn ${mode === m ? 'active' : ''}`}
                  onClick={() => setMode(m)}
                  style={{ gap: '6px', fontSize: '12.5px', padding: '6px 14px', flex: '1 1 auto', justifyContent: 'center' }}
                >
                  <Icon size={14} />
                  <span>{MODE_CONFIG[m].label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SPLIT-PANE WORKSPACE: Left Chat / Right Teaching Canvas     */}
      {/* ============================================================== */}
      <div className="ai-assistant-split-grid">
        {/* ==================== LEFT PANE: CONVERSATIONAL COPILOT ==================== */}
        <div className="ai-chat-panel">
          {/* Mode Description & Topic Input */}
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ModeIcon size={16} color="#0284c7" />
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{MODE_CONFIG[mode].label}</strong>
            </div>
            <p style={{ margin: '4px 0 10px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              {MODE_CONFIG[mode].description}
            </p>

            {/* Quick Starter Prompt Chips */}
            <div className="ai-prompt-chips">
              {MODE_CONFIG[mode].starterPrompts.map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  className="ai-chip-btn"
                  onClick={() => {
                    if (!topic.trim()) {
                      setTopicError(true);
                      topicInputRef.current?.focus();
                      setNotice('⚠️ Please enter a Chapter / Topic first to generate content.');
                      return;
                    }
                    void handleSendMessage(`${promptText} on "${topic.trim()}"`, topic.trim());
                  }}
                  title={topic.trim() ? `Generate for ${topic.trim()}` : 'Enter Chapter / Topic first'}
                >
                  <Sparkles size={11} color="#0284c7" />
                  <span>{promptText}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="ai-chat-messages">
            {messages.length === 0 ? (
              <div className="ai-chat-welcome">
                <div className="ai-welcome-icon">
                  <ModeIcon size={28} />
                </div>
                <h3>How can I assist your teaching today?</h3>
                <p>
                  I'm your classroom copilot. Ask for comprehensive 45-minute lesson plans, real-world analogies, student misconception alerts, or tiered practice sets.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '380px' }}>
                  <button
                    type="button"
                    className="ai-suggestion-card"
                    onClick={() => {
                      if (!topic.trim()) {
                        setTopicError(true);
                        topicInputRef.current?.focus();
                        setNotice('⚠️ Please enter a Chapter / Topic first to generate a lesson plan.');
                        return;
                      }
                      void handleSendMessage(`Create a complete 45-minute lesson plan for ${grade} ${subject} on "${topic.trim()}"`, topic.trim());
                    }}
                  >
                    <strong>📘 Full Lesson Plan</strong>
                    <span>Learning outcomes, 5-min hook, board layout & exit ticket</span>
                  </button>
                  <button
                    type="button"
                    className="ai-suggestion-card"
                    onClick={() => {
                      if (!topic.trim()) {
                        setTopicError(true);
                        topicInputRef.current?.focus();
                        setNotice('⚠️ Please enter a Chapter / Topic first to generate analogies.');
                        return;
                      }
                      void handleSendMessage(`Explain the most difficult concepts in ${grade} ${subject} on "${topic.trim()}" using relatable everyday analogies`, topic.trim());
                    }}
                  >
                    <strong>💡 Intuitive Analogies</strong>
                    <span>Visual mental models & top 3 student misconception traps</span>
                  </button>
                  <button
                    type="button"
                    className="ai-suggestion-card"
                    onClick={() => {
                      if (!topic.trim()) {
                        setTopicError(true);
                        topicInputRef.current?.focus();
                        setNotice('⚠️ Please enter a Chapter / Topic first to generate questions.');
                        return;
                      }
                      void handleSendMessage(`Generate tiered practice questions (Foundation, Standard, HOTS) for ${grade} ${subject} on "${topic.trim()}" with complete answer keys`, topic.trim());
                    }}
                  >
                    <strong>📝 Questions & Worksheets</strong>
                    <span>Tiered questions with step-by-step worked solutions & rubrics</span>
                  </button>
                  <button
                    type="button"
                    className="ai-suggestion-card"
                    onClick={() => {
                      if (!topic.trim()) {
                        setTopicError(true);
                        topicInputRef.current?.focus();
                        setNotice('⚠️ Please enter a Chapter / Topic first to generate evaluation rubric.');
                        return;
                      }
                      void handleSendMessage(`Provide a marking rubric and evaluation framework for student responses in ${grade} ${subject} on "${topic.trim()}"`, topic.trim());
                    }}
                  >
                    <strong>🎯 Answer Evaluation & Feedback</strong>
                    <span>What you did well, how to improve, and marks breakdown</span>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`ai-message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}>
                  <div className={`ai-message-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                    <div className="ai-bubble-header">
                      <span className="ai-bubble-sender">
                        {msg.role === 'user' ? '🧑‍🏫 You (Teacher)' : '✨ AI Teaching Assistant'}
                      </span>
                      <span className="ai-bubble-time">{msg.timestamp}</span>
                    </div>

                    <div className="ai-bubble-content markdown-body">
                      {renderRichEducationalContent(msg.content)}
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="ai-bubble-actions">
                        {msg.content.includes('AI Settings') && onNavigateToTab && (
                          <button
                            type="button"
                            className="ai-action-btn primary-tint"
                            onClick={() => onNavigateToTab('settings')}
                            style={{ fontWeight: 600 }}
                          >
                            <Sparkles size={12} />
                            <span>Open AI Settings →</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="ai-action-btn"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          title="Copy response to clipboard"
                        >
                          {copiedMessageId === msg.id ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                          <span>{copiedMessageId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          className="ai-action-btn primary-tint"
                          onClick={() => pushToCanvas(msg.content, `${MODE_CONFIG[msg.mode || mode].label}: ${topic || 'Teaching Plan'} (${grade})`)}
                          title="Load this into the Live Teaching Canvas"
                        >
                          <Eye size={12} />
                          <span>Push to Canvas</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="ai-message-row assistant-row">
                <div className="ai-message-bubble assistant-bubble loading-bubble">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0284c7' }}>
                    <RefreshCw size={16} className="spin" />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      Preparing {MODE_CONFIG[mode].label.toLowerCase()} for {grade} {subject}...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="ai-chat-input-bar">
            {/* Optional Topic Anchor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Topic / Chapter:
              </span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Linear Equations in One Variable"
                style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                rows={2}
                placeholder={MODE_CONFIG[mode].placeholder}
                className="ai-chat-textarea"
                disabled={loading}
              />
              <button
                type="submit"
                className="button button-primary"
                disabled={!input.trim() || loading}
                style={{ minHeight: '44px', padding: '0 18px', background: '#0284c7', borderColor: '#0284c7' }}
                title="Send query (Enter)"
              >
                {loading ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
              </button>
            </form>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
              <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
              <span>Context: <strong>{grade} • {subject}</strong></span>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT PANE: LIVE TEACHING CANVAS ==================== */}
        <div className="ai-canvas-panel">
          {/* Canvas Toolbar Card */}
          <div className="ai-canvas-header">
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-canvas-pill">Live Teaching Canvas</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{grade} • {subject}</span>
              </div>
              <input
                value={canvasTitle}
                onChange={(e) => setCanvasTitle(e.target.value)}
                className="ai-canvas-title-input"
                title="Click to rename document"
              />
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px', gap: '5px' }}
                onClick={() => setCanvasEditing(!canvasEditing)}
                title={canvasEditing ? 'Switch to Formatted View' : 'Edit Text Directly'}
              >
                {canvasEditing ? <Eye size={13} /> : <Edit3 size={13} />}
                <span>{canvasEditing ? 'Preview' : 'Edit'}</span>
              </button>

              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px', gap: '5px' }}
                onClick={handleCopyCanvas}
                disabled={!canvasContent}
                title="Copy markdown text"
              >
                {copiedCanvas ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                <span>{copiedCanvas ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px', gap: '5px' }}
                onClick={handlePrintCanvas}
                disabled={!canvasContent}
                title="Print or export as PDF"
              >
                <Printer size={13} />
                <span>Print / PDF</span>
              </button>

              {/* Save as Draft */}
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '5px 11px', minHeight: '32px', gap: '5px', borderColor: '#38bdf8', color: '#0369a1', background: '#f0f9ff', fontWeight: 600 }}
                onClick={() => void handleSaveDraft()}
                disabled={!canvasContent.trim() || savingDraft || savingArchive}
                title="Save this lesson as a Draft in Question Papers & Lessons"
              >
                {savingDraft ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                <span>{savingDraft ? 'Saving Draft...' : 'Save as Draft'}</span>
              </button>

              {/* Save in Archive */}
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '5px 11px', minHeight: '32px', gap: '5px', borderColor: '#fcd34d', color: '#b45309', background: '#fffbeb', fontWeight: 600 }}
                onClick={() => void handleSaveArchive()}
                disabled={!canvasContent.trim() || savingDraft || savingArchive}
                title="Save this lesson directly into your Archive"
              >
                {savingArchive ? <RefreshCw size={13} className="spin" /> : <Archive size={13} />}
                <span>{savingArchive ? 'Archiving...' : 'Save in Archive'}</span>
              </button>

              {/* Bridge to Question Papers */}
              {onNavigateToTab && (
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px', gap: '5px', borderColor: '#bae6fd', color: '#0369a1', background: '#f0f9ff' }}
                  onClick={() => {
                    onNavigateToTab('worksheets');
                    setNotice('Switched to Question Papers. You can paste generated questions into your paper builder.');
                  }}
                  title="Open Question Papers generator"
                >
                  <FileText size={13} />
                  <span>Question Papers</span>
                </button>
              )}

              {/* Bridge to Whiteboard */}
              {onNavigateToTab && (
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px', gap: '5px', borderColor: '#bbf7d0', color: '#166534', background: '#f0fdf4' }}
                  onClick={() => {
                    onNavigateToTab('whiteboard');
                    setNotice('Switched to Whiteboard.');
                  }}
                  title="Open Online Whiteboard"
                >
                  <PenTool size={13} />
                  <span>Whiteboard</span>
                </button>
              )}
            </div>
          </div>

          {/* Canvas Document Sheet */}
          <div className="ai-canvas-sheet-scroll">
            {canvasEditing ? (
              <div style={{ height: '100%', padding: '16px' }}>
                <textarea
                  value={canvasContent}
                  onChange={(e) => setCanvasContent(e.target.value)}
                  className="ai-canvas-raw-textarea"
                  placeholder="Type or edit your lesson plan here..."
                />
              </div>
            ) : canvasContent ? (
              <div className="ai-canvas-document printable-content">
                <div className="canvas-doc-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span className="canvas-institution-label">
                        {user?.school || 'EduAshram Learning Centre'} • Lesson Resource
                      </span>
                      <h1 className="canvas-doc-title">{canvasTitle}</h1>
                      <div className="canvas-meta-row">
                        <span><strong>Grade:</strong> {grade}</span>
                        <span>•</span>
                        <span><strong>Subject:</strong> {subject}</span>
                        <span>•</span>
                        <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="canvas-doc-body">
                  {renderRichEducationalContent(canvasContent)}
                </div>
              </div>
            ) : (
              <div className="ai-canvas-empty">
                <div className="canvas-empty-art">
                  <BookOpen size={42} color="#0284c7" />
                </div>
                <h3>Your Live Teaching Document Will Appear Here</h3>
                <p>
                  As you interact with the AI assistant on the left, complete lesson plans, analogies, worked examples, and tiered question sheets are formatted directly onto this printable canvas.
                </p>
                <div style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ background: '#0284c7', borderColor: '#0284c7', gap: '8px' }}
                    onClick={() => void handleSendMessage(`Create a complete 45-minute lesson plan for ${grade} ${subject} on ${topic || 'Key Concepts'}`)}
                  >
                    <Sparkles size={16} />
                    <span>Generate Sample 45-Min Lesson Plan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
