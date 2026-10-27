import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { io, type Socket } from 'socket.io-client';
import { AppWindow, Archive, ArrowLeft, ArrowRight, Award, BarChart3, Bell, BookOpen, BookOpenCheck, Calculator, Calendar, CalendarCheck, Camera, Check, CheckCircle2, CheckCheck, CheckSquare, ChevronDown, ChevronUp, CircleHelp, Clock3, Copy, CreditCard, Download, ExternalLink, Eye, FileSpreadsheet, FileText, Filter, Hand, KeyRound, ListChecks, Lock, LogOut, Mail, Maximize2, MessageCircle, Minimize2, Paperclip, Pause, Pencil, PenTool, Phone, Play, Plus, Printer, Radio, RefreshCw, RotateCcw, Save, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Square, Table, Trash2, TrendingUp, Type, UploadCloud, UserCheck, Users, UserX, Volume2, VolumeX, X } from 'lucide-react';
import { PublicPortal } from './components/PublicPortal';
import { AuthModal, type AuthMode } from './components/AuthModal';
import { SuperAdminConsole } from './components/SuperAdminConsole';
import { ClassroomChatWidget, ClassroomChatHeaderButton } from './components/ClassroomChatWidget';
import { ClassroomCalendar, type CalendarEventItem } from './components/ClassroomCalendar';
import { UserGuidePage } from './components/UserGuidePage';
import { StudentLiveWhiteboard } from './components/StudentLiveWhiteboard';
import { getActiveGrades, getDefaultGrade, getActiveSubjects, getDefaultSubject } from './utils/teacherPreferences';
import { cleanIndianPhoneNumber, openWhatsAppChat, generateScorecardMessage, generateQuizAnnouncementMessage, generateWorksheetAnnouncementMessage } from './utils/whatsapp';
import { playCountdownWarningSound, playAnswerRevealChime, isQuizSoundEnabled, setQuizSoundEnabled, playTestSound, unlockAudio } from './utils/quizSounds';
export { getActiveGrades, getDefaultGrade, getActiveSubjects, getDefaultSubject };

type Mode = 'LIVE' | 'SELF_PACED';
type QuestionType = 'MCQ' | 'FILL_BLANK' | 'TRUE_FALSE' | 'SOLVE';
type Status = 'DRAFT' | 'ACTIVE' | 'CLOSED';
type Option = { id?: string; text: string; isCorrect?: boolean; correct?: boolean };
type Question = { id?: string; prompt: string; marks: number; imageUrl?: string | null; type?: QuestionType; options: Option[] };
type Quiz = { id: string; title: string; grade?: string | null; mode: Mode; status: Status; timeLimitSeconds: number | null; showResults: boolean; currentQuestionIndex: number; currentAnswerRevealed: boolean; createdAt?: string; updatedAt?: string; questions?: Question[]; _count?: { questions: number; attempts: number } };
type Student = { id: string; name: string; grade?: string | null; passkey?: string | null; parentPhone?: string | null; parentName?: string | null; active: boolean; joiningDate?: string | null; createdAt?: string; _count: { attempts: number } };
type User = { id?: string; role: 'admin' | 'teacher' | 'superadmin' | 'student'; name?: string; email?: string; username?: string; hasApiKey?: boolean; school?: string | null; subject?: string | null; grade?: string | null; teacherId?: string | null; teacherName?: string | null };
export type LiveTimerState = {
  enabled: boolean;
  durationSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  phase: 'question' | 'revealing' | 'gap' | 'advancing' | 'idle';
  gapRemainingSeconds: number;
};
type QuizDraft = { title: string; grade?: string; mode: Mode; hasTimer: boolean; minutes: number; liveTimerSeconds?: number | null; showResults: boolean; questions: Question[] };
import { TeacherAIAssistant } from './components/TeacherAIAssistant';
export const ALL_STUDENT_GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
export const ALL_ACADEMIC_SUBJECTS = [
  'Mathematics',
  'Science',
  'General Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Social Science (SST)',
  'History',
  'Geography',
  'Civics / Political Science',
  'Economics',
  'English',
  'English Grammar & Literature',
  'Hindi',
  'Sanskrit',
  'Computer Science',
  'Information Technology (IT)',
  'Environmental Studies (EVS)',
  'General Knowledge (GK)',
  'Moral Science & Ethics',
  'Other / Custom Subject',
];
const newDraft = (): QuizDraft => ({ title: '', grade: getDefaultGrade(), mode: 'LIVE', hasTimer: false, minutes: 20, liveTimerSeconds: 30, showResults: true, questions: [emptyQuestion()] });
type StudentQuiz = { id: string; title: string; grade?: string | null; mode: Mode; status: Status; timeLimitSeconds: number | null; questionCount: number; totalMarks?: number; attempt: { status: string; deadlineAt: string | null; score: number | null; submittedAt?: string | null } | null };
type ActiveQuiz = { id: string; title: string; grade?: string | null; mode: Mode; status: Status; timeLimitSeconds: number | null; showResults: boolean; currentQuestionIndex: number; currentAnswerRevealed: boolean; questionCount?: number; totalMarks?: number; questions: Question[]; timer?: LiveTimerState | null; attempt: { status: string; deadlineAt: string | null; score: number | null; answers: { questionId: string; optionId: string }[] } | null };
type Result = { id: string; studentId?: string; name: string; status: string; submittedAt: string | null; score: number | null; totalMarks: number; parentPhone?: string | null; parentName?: string | null; answers: { question: string; response: string; correct: boolean; marks: number }[] };
type LiveStats = { answered: number; participants: number; distribution: { optionId: string; count: number }[]; responses: { name: string; optionId: string; text: string }[] };

type WorksheetSubmission = {
  id: string;
  paperId: string;
  studentId: string;
  images: string;
  score: number | null;
  remarks: string | null;
  aiDraftScore?: number | null;
  aiDraftRemarks?: string | null;
  aiDraftBreakdown?: string | null;
  aiStatus?: string | null;
  status: 'SUBMITTED' | 'GRADED';
  submittedAt: string;
  gradedAt: string | null;
  student?: { id: string; name: string };
};

type WorksheetPaper = {
  id: string;
  title: string;
  subject: string | null;
  grade: string | null;
  totalMarks: number;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number };
  submission?: WorksheetSubmission | null;
  submissions?: WorksheetSubmission[];
};

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type AttendanceRecord = {
  studentId: string;
  name: string;
  grade?: string;
  status: AttendanceStatus | '';
  remarks?: string;
  updatedAt?: string;
};

type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
};

type MonthlyAttendanceStudent = {
  studentId: string;
  name: string;
  grade?: string;
  days: Record<string, AttendanceStatus>;
  presentCount: number;
  absentCount: number;
  totalMarked: number;
  attendanceRate: number;
};

type FeeStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE' | 'EXEMPT';
type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

type StudentFeeRecord = {
  feeId?: string;
  studentId: string;
  name: string;
  grade?: string;
  amountDue: number;
  amountPaid: number;
  status: FeeStatus;
  paidAt?: string | null;
  paymentMode?: PaymentMode | string;
  receiptNo?: string | null;
  notes?: string | null;
};

type FeeSummary = {
  totalStudents: number;
  totalDue: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  paidCount: number;
  pendingCount: number;
  partialCount?: number;
};

type StudentFeeLedgerMonth = {
  month: string;
  status: FeeStatus;
  amountDue: number;
  amountPaid: number;
  balance: number;
  paidAt?: string | null;
  receiptNo?: string | null;
  paymentMode?: PaymentMode | string;
  notes?: string | null;
};

type StudentFeeLedger = {
  student: { id: string; name: string; grade?: string };
  academicYear: string;
  months: StudentFeeLedgerMonth[];
  summary: {
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    paidMonths: number;
    pendingMonths: number;
  };
};

type ScoreRecordItem = {
  id: string;
  title: string;
  itemType: 'QUIZ' | 'QUESTION_PAPER';
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  subject?: string;
  academicYear: string;
  completedAt: string;
  remarks?: string | null;
  isSourceDeleted: boolean;
  sourceStatus?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
};

type StudentProgressReportData = {
  student: { id: string; name: string; grade?: string; active: boolean; joiningDate?: string | null };
  academicYear: string;
  availableYears: string[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    totalDays: number;
    rate: number;
  };
  fees: {
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    pendingMonths: number;
    status: FeeStatus;
  };
  scores: ScoreRecordItem[];
  statistics: {
    totalAssessments: number;
    quizzesCount: number;
    questionPapersCount: number;
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
    overallGrade: string;
    deletedItemsPreservedCount: number;
  };
};

const ACADEMIC_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

function getCurrentAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: April is 3
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getCalendarYearMonth(academicYear: string, monthName: string): { year: number; month: number; yearMonth: string } {
  const parts = academicYear.split('-');
  const startYear = parseInt(parts[0], 10);
  const endYear = parseInt(parts[1], 10) || startYear + 1;
  const monthIdx = ACADEMIC_MONTHS.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
  if (monthIdx === -1) {
    return { year: startYear, month: 4, yearMonth: `${startYear}-04` };
  }
  let calYear = startYear;
  let calMonth = monthIdx + 4; // Apr=4 ... Dec=12
  if (monthIdx >= 9) { // Jan=1, Feb=2, Mar=3
    calYear = endYear;
    calMonth = monthIdx - 8;
  }
  const monthStr = String(calMonth).padStart(2, '0');
  return { year: calYear, month: calMonth, yearMonth: `${calYear}-${monthStr}` };
}


const emptyQuestion = (type: QuestionType = 'MCQ'): Question => {
  if (type === 'TRUE_FALSE') {
    return { prompt: '', marks: 1, type: 'TRUE_FALSE', imageUrl: '', options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] };
  }
  if (type === 'FILL_BLANK') {
    return { prompt: 'Fill in the blank: ___', marks: 1, type: 'FILL_BLANK', imageUrl: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] };
  }
  if (type === 'SOLVE') {
    return { prompt: 'Solve: ', marks: 2, type: 'SOLVE', imageUrl: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] };
  }
  return { prompt: '', marks: 1, type: 'MCQ', imageUrl: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] };
};


function printHtmlContent(content: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title></title><style>
    @page {
      margin: 0;
      size: auto;
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        padding: 15mm 18mm !important;
        box-sizing: border-box !important;
      }
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      padding: 15mm 18mm;
      margin: 0;
      background: #ffffff;
    }
    ul { list-style-type: disc !important; padding-left: 20px !important; margin: 12px 0 !important; }
    ol { list-style-type: decimal !important; margin: 12px 0 !important; padding-left: 20px !important; }
    li { margin-bottom: 6px !important; }
    p { margin: 0 0 8px 0; }
    h1, h2, h3 { margin: 14px 0 8px 0; color: #0f172a; }
    img { max-width: 100% !important; height: auto !important; margin: 14px auto; display: block; border-radius: 4px; }
    table { width: 100% !important; border-collapse: collapse !important; margin: 14px 0 !important; table-layout: fixed !important; }
    th, td { border: 1px solid #cbd5e1 !important; padding: 6px 10px !important; text-align: left; }
    th { background: #f1f5f9 !important; font-weight: 600; }
  </style></head><body>${content}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

function QuestionTypeBadge({ type }: { type?: string }) {
  if (type === 'TRUE_FALSE') return <span className="q-type-badge badge-tf"><CheckCircle2 size={13} /> True / False</span>;
  if (type === 'FILL_BLANK') return <span className="q-type-badge badge-fb"><PenTool size={13} /> Fill in Blanks</span>;
  if (type === 'SOLVE') return <span className="q-type-badge badge-solve"><Calculator size={13} /> Problem Solving</span>;
  return <span className="q-type-badge badge-mcq"><ListChecks size={13} /> Multiple Choice</span>;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong.');
  return data as T;
}

const SESSION_ACTIVE_KEY = 'eduashram_session_active';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginModal, setLoginModal] = useState<AuthMode | null>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const s = window.location.search.toLowerCase();
      if (s.includes('resettoken') || s.includes('action=reset-password')) return 'teacher_reset_password';
      if (p === '/student' || s.includes('student')) return 'student';
      if (p === '/teacher/signup' || p === '/signup' || s.includes('teacher_signup')) return 'teacher_signup';
      if (p === '/teacher' || p === '/teacher/login' || s.includes('teacher_login') || s.includes('teacher')) return 'teacher_login';
    }
    return null;
  });
  const [view, setView] = useState<'portal' | 'dashboard' | 'superadmin' | 'user_guide'>(() => {
    if (typeof window !== 'undefined' && (window.location.search.includes('admin') || window.location.search.includes('superadmin'))) {
      return 'superadmin';
    }
    if (typeof window !== 'undefined' && (window.location.search.includes('guide') || window.location.pathname === '/guide' || window.location.pathname === '/user-guide')) {
      return 'user_guide';
    }
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_ACTIVE_KEY) !== '1') {
      return 'portal';
    }
    const saved = localStorage.getItem('maths_mentor_view');
    return saved === 'portal' ? 'portal' : 'dashboard';
  });
  const [previousView, setPreviousView] = useState<'portal' | 'dashboard' | 'superadmin'>('portal');
  const [notice, setNotice] = useState('');

  async function signOut() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Fallback in case POST failed
      await fetch('/api/auth/logout').catch(() => undefined);
    }
    setUser(null);
    setView('portal');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      localStorage.removeItem('maths_mentor_view');
      localStorage.removeItem('teacher_active_tab');
      localStorage.removeItem('student_active_tab');
      localStorage.removeItem('livequiz_ai_key');
      localStorage.removeItem('livequiz_ai_provider');
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('eduashram_tab_channel');
          bc.postMessage({ type: 'LOGOUT' });
          bc.close();
        }
      } catch { }
    }
  }

  useEffect(() => {
    localStorage.removeItem('livequiz_ai_key');
    if (window.location.search.includes('logout')) {
      void signOut().finally(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setLoading(false);
      });
      return;
    }

    const authChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('eduashram_tab_channel')
      : null;

    if (authChannel) {
      authChannel.onmessage = (event) => {
        if (event.data?.type === 'CHECK_SESSION') {
          // If this tab already has an active session, let new tab know
          if (sessionStorage.getItem(SESSION_ACTIVE_KEY) === '1') {
            authChannel.postMessage({ type: 'CONFIRM_SESSION' });
          }
        } else if (event.data?.type === 'LOGOUT') {
          setUser(null);
          setView('portal');
          sessionStorage.removeItem(SESSION_ACTIVE_KEY);
          localStorage.removeItem('maths_mentor_view');
          localStorage.removeItem('teacher_active_tab');
          localStorage.removeItem('student_active_tab');
        } else if (event.data?.type === 'LOGIN' && event.data?.user) {
          sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');
          setUser(event.data.user);
          if (event.data.user.role === 'superadmin') {
            setView('superadmin');
          } else {
            setView('dashboard');
            localStorage.setItem('maths_mentor_view', 'dashboard');
          }
        }
      };
    }

    const checkCurrentAuth = () => {
      api<{ user: User }>('/api/auth/me')
        .then((result) => {
          if (result.user) {
            sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');
            setUser(result.user);
            if (result.user.role === 'superadmin') {
              const savedView = localStorage.getItem('maths_mentor_view');
              if (savedView === 'portal' && !window.location.search.includes('admin') && !window.location.search.includes('superadmin')) {
                setView('portal');
              } else {
                setView('superadmin');
              }
            } else {
              const savedView = localStorage.getItem('maths_mentor_view');
              if (savedView === 'portal') {
                setView('portal');
              } else {
                setView('dashboard');
                localStorage.setItem('maths_mentor_view', 'dashboard');
              }
            }
          } else {
            sessionStorage.removeItem(SESSION_ACTIVE_KEY);
            setUser(null);
            if (!window.location.search.includes('admin')) {
              setView('portal');
              localStorage.removeItem('maths_mentor_view');
            }
          }
        })
        .catch(() => {
          sessionStorage.removeItem(SESSION_ACTIVE_KEY);
          setUser(null);
          if (!window.location.search.includes('admin')) {
            setView('portal');
            localStorage.removeItem('maths_mentor_view');
          }
        })
        .finally(() => setLoading(false));
    };

    const isTabActive = typeof window !== 'undefined' && sessionStorage.getItem(SESSION_ACTIVE_KEY) === '1';

    if (isTabActive) {
      // Tab is already known to be active in this browser session (e.g. reload or SPA navigation)
      checkCurrentAuth();
    } else if (authChannel) {
      // Tab was newly opened: check if any other tab has an active session
      let receivedResponse = false;
      const timeoutId = setTimeout(() => {
        if (!receivedResponse) {
          // No other tabs responded. The app was closed.
          // Automatically logout to clear any lingering cookies or view states.
          void signOut().finally(() => {
            setLoading(false);
          });
        }
      }, 70);

      const handleConfirm = (event: MessageEvent) => {
        if (event.data?.type === 'CONFIRM_SESSION') {
          receivedResponse = true;
          clearTimeout(timeoutId);
          authChannel.removeEventListener('message', handleConfirm);
          sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');
          checkCurrentAuth();
        }
      };

      authChannel.addEventListener('message', handleConfirm);
      authChannel.postMessage({ type: 'CHECK_SESSION' });
    } else {
      checkCurrentAuth();
    }

    return () => {
      authChannel?.close();
    };
  }, []);

  if (loading) return <div className="loading-screen"><span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span><span>Getting EduAshram ready</span></div>;

  // View 0: User Guide Page
  if (view === 'user_guide') {
    return (
      <UserGuidePage
        onBack={() => {
          if (previousView === 'dashboard' && user) {
            setView('dashboard');
          } else if (previousView === 'superadmin' && user?.role === 'superadmin') {
            setView('superadmin');
          } else {
            setView('portal');
          }
          if (window.location.search.includes('guide') || window.location.pathname === '/guide' || window.location.pathname === '/user-guide') {
            window.history.replaceState({}, '', '/');
          }
        }}
        userRole={user?.role}
      />
    );
  }

  // View 1: Super Admin Console
  if (view !== 'portal' && (view === 'superadmin' || user?.role === 'superadmin')) {
    return (
      <>
        <SuperAdminConsole
          currentUser={user}
          onSignOut={signOut}
          onLoginSuccess={(u) => {
            sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');
            setUser(u as User);
          }}
          onBackToPortal={() => {
            setView('portal');
            localStorage.setItem('maths_mentor_view', 'portal');
            if (typeof window !== 'undefined' && (window.location.search.includes('admin') || window.location.search.includes('superadmin') || window.location.pathname.includes('admin'))) {
              window.history.replaceState({}, '', '/');
            }
          }}
        />
      </>
    );
  }

  // View 2: Public Portal
  if (!user || view === 'portal') {
    return (
      <>
        <PublicPortal
          user={user}
          onOpenLogin={(mode) => {
            const m = mode as AuthMode;
            setLoginModal(m);
            if (m === 'student') window.history.replaceState({}, '', '/student');
            else if (m === 'teacher_signup') window.history.replaceState({}, '', '/teacher/signup');
            else if (m === 'teacher_login') window.history.replaceState({}, '', '/teacher/login');
          }}
          onOpenSuperAdmin={() => {
            setView('superadmin');
            localStorage.removeItem('maths_mentor_view');
          }}
          onOpenUserGuide={() => {
            setPreviousView('portal');
            setView('user_guide');
          }}
          onGoToDashboard={() => {
            if (user?.role === 'superadmin') {
              setView('superadmin');
              localStorage.removeItem('maths_mentor_view');
            } else {
              setView('dashboard');
              localStorage.setItem('maths_mentor_view', 'dashboard');
            }
          }}
          onSignOut={signOut}
        />
        {loginModal && (
          <AuthModal
            mode={loginModal}
            onClose={() => {
              setLoginModal(null);
              if (window.location.pathname !== '/' || window.location.search) {
                window.history.replaceState({}, '', '/');
              }
            }}
            onSwitchMode={(nextMode) => {
              setLoginModal(nextMode);
              if (nextMode === 'teacher_signup') window.history.replaceState({}, '', '/teacher/signup');
              else if (nextMode === 'teacher_login') window.history.replaceState({}, '', '/teacher/login');
              else if (nextMode === 'student') window.history.replaceState({}, '', '/student');
              else if (nextMode === 'teacher_forgot_password') window.history.replaceState({}, '', '/teacher/forgot-password');
            }}
            onSuccess={(u) => {
              localStorage.removeItem('livequiz_ai_key');
              sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');
              if (u.role === 'teacher' || u.role === 'admin') {
                localStorage.setItem('teacher_active_tab', 'overview');
              }
              setUser(u);
              setLoginModal(null);
              window.history.replaceState({}, '', '/');
              if (u.role === 'superadmin') {
                setView('superadmin');
              } else {
                setView('dashboard');
                localStorage.setItem('maths_mentor_view', 'dashboard');
              }
              try {
                if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                  const bc = new BroadcastChannel('eduashram_tab_channel');
                  bc.postMessage({ type: 'LOGIN', user: u });
                  bc.close();
                }
              } catch { }
            }}
          />
        )}
      </>
    );
  }

  // View 3: Logged in Dashboard (Teacher or Student)
  return (
    <>
      {(user.role === 'admin' || user.role === 'teacher') ? (
        <TeacherApp
          user={user}
          onSignOut={signOut}
          notice={notice}
          setNotice={setNotice}
          onViewPortal={() => setView('portal')}
          onOpenUserGuide={() => {
            setPreviousView('dashboard');
            setView('user_guide');
          }}
        />
      ) : (
        <StudentApp
          user={user}
          onSignOut={signOut}
          notice={notice}
          setNotice={setNotice}
          onViewPortal={() => setView('portal')}
          onOpenUserGuide={() => {
            setPreviousView('dashboard');
            setView('user_guide');
          }}
        />
      )}
      <ClassroomChatWidget user={user} />
    </>
  );
}

export function Login({ mode, onSubmit, error }: { mode: 'admin' | 'student'; onMode?: (mode: 'admin' | 'student') => void; onSubmit: (values: { email?: string; password?: string; passkey?: string }) => void; error: string }) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    await onSubmit(mode === 'admin' ? { email, password } : { passkey });
    setBusy(false);
  }
  return <main className="login-layout">
    <section className="login-side">
      <div className="login-brand"><span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span><span>EduAshram</span></div>
      <div className="login-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> LEARN · PRACTISE · EXCEL</div>
        <h1>Understand Maths.<br />Master Every <em>Concept.</em></h1>
        <p className="login-subtext">Live classes, clear explanations, and guided practice to help you become a confident Maths learner.</p>
        <div className="login-pillars">
          <div className="pillar-item">
            <span className="pillar-icon"><CheckCircle2 size={16} /></span>
            <div className="pillar-text">
              <strong>Learn concepts clearly</strong>
              <span>Understand the why behind every formula.</span>
            </div>
          </div>
          <div className="pillar-item">
            <span className="pillar-icon"><CheckCircle2 size={16} /></span>
            <div className="pillar-text">
              <strong>Practise with purpose</strong>
              <span>Strengthen your skills with questions and worksheets.</span>
            </div>
          </div>
          <div className="pillar-item">
            <span className="pillar-icon"><CheckCircle2 size={16} /></span>
            <div className="pillar-text">
              <strong>Grow with every class</strong>
              <span>Build confidence one concept at a time.</span>
            </div>
          </div>
        </div>
        <div className="login-note"><Sparkles size={17} /><span>Every student can learn Maths with the right guidance.</span></div>
      </div>
      <div className="login-footer"><span>EduAshram</span><span>Learn · Practise · Excel</span></div>
    </section>
    <section className="login-main">
      <div className="login-card">
        <span className="overline">Welcome to EduAshram</span><h2>{mode === 'student' ? 'Student Passkey Access' : 'Teacher Administration'}</h2><p className="muted">{mode === 'student' ? 'Enter the passkey your teacher shared with you.' : 'Sign in to prepare a quiz or bring the class together.'}</p>
        <form onSubmit={submit} className="form-stack">
          {mode === 'student' ? <label className="field"><span>Your passkey</span><div className="input-with-icon"><KeyRound size={17} /><input autoFocus required value={passkey} onChange={(event) => setPasskey(event.target.value.toUpperCase())} placeholder="Enter your 6-character passkey" autoCapitalize="characters" autoComplete="one-time-code" maxLength={12} /></div></label> : <><label className="field"><span>Email address</span><input autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teacher@school.com" autoComplete="username" /></label><label className="field"><span>Password</span><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" /></label></>}
          {error && <div className="inline-error" role="alert">{error}</div>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Joining...' : mode === 'student' ? <>Join classroom <ArrowRight size={17} /></> : <>Sign in <ArrowRight size={17} /></>}</button>
        </form>
        {mode === 'admin' && <div className="secure-note"><ShieldCheck size={15} /><span>Protected teacher access</span></div>}
      </div>
      <div className="login-bottom">Learn concepts clearly <span /> Practise with purpose <span /> Grow with every class</div>
    </section>
  </main>;
}

function isUpcomingReminder(event: CalendarEventItem): boolean {
  if (event.type && event.type !== 'reminder' && event.type !== 'event') {
    return false;
  }
  if (!event.date) return false;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (event.date > todayStr) return true;
  if (event.date < todayStr) return false;

  // If today: check time if available
  if (event.time && event.time.includes(':')) {
    const [hrs, mins] = event.time.split(':').map(Number);
    if (!isNaN(hrs) && !isNaN(mins)) {
      const eventTime = new Date();
      eventTime.setHours(hrs, mins, 0, 0);
      return eventTime >= now;
    }
  }
  return true;
}

function TeacherApp({
  user,
  onSignOut,
  notice,
  setNotice,
  onViewPortal,
  onOpenUserGuide,
}: {
  user: User;
  onSignOut: () => void;
  notice: string;
  setNotice: (text: string) => void;
  onViewPortal?: () => void;
  onOpenUserGuide?: () => void;
}) {
  type TeacherTab = 'overview' | 'ai_assistant' | 'quizzes' | 'worksheets' | 'archive' | 'calendar' | 'whiteboard' | 'students' | 'results' | 'settings' | 'ai_settings';
  const [tab, setTabState] = useState<TeacherTab>(() => {
    const saved = localStorage.getItem('teacher_active_tab') as any;
    const validTabs: TeacherTab[] = ['overview', 'ai_assistant', 'quizzes', 'worksheets', 'archive', 'calendar', 'whiteboard', 'students', 'results', 'settings', 'ai_settings'];
    if (saved === 'ai_settings') return 'settings';
    if (saved === 'results') return 'students';
    return validTabs.includes(saved) ? saved : 'overview';
  });

  const [studentSubTab, setStudentSubTab] = useState<'roster' | 'attendance' | 'fees' | 'progress' | 'results'>(() => {
    const saved = localStorage.getItem('teacher_active_tab');
    return saved === 'results' ? 'results' : 'roster';
  });

  const setTab = (newTab: TeacherTab) => {
    if (newTab === 'results') {
      setTabState('students');
      setStudentSubTab('results');
      localStorage.setItem('teacher_active_tab', 'students');
      return;
    }
    const targetTab = newTab === 'ai_settings' ? 'settings' : newTab;
    setTabState(targetTab);
    localStorage.setItem('teacher_active_tab', targetTab);
  };

  useEffect(() => {
    // Whenever a teacher signs in, always start on the overview page first
    if (localStorage.getItem('teacher_active_tab') === 'overview' && tab !== 'overview') {
      setTabState('overview');
    }
  }, [user.id]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [worksheets, setWorksheets] = useState<WorksheetPaper[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [distribution, setDistribution] = useState<{ question: string; options: { text: string; correct: boolean; count: number }[] }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCanvasLesson, setActiveCanvasLesson] = useState<{
    title: string;
    content: string;
    grade?: string | null;
    subject?: string | null;
  } | null>(null);

  const [hasVisitedWhiteboard, setHasVisitedWhiteboard] = useState(tab === 'whiteboard');
  const [isTeacherWhiteboardLive, setIsTeacherWhiteboardLive] = useState(false);

  useEffect(() => {
    if (tab === 'whiteboard') {
      setHasVisitedWhiteboard(true);
    }
  }, [tab]);

  const archivedQuizzes = quizzes.filter((q) => q.status === 'CLOSED');
  const activeQuizzes = quizzes.filter((q) => q.status !== 'CLOSED');
  const archivedWorksheets = worksheets.filter((w) => w.status === 'ARCHIVED');
  const activeWorksheets = worksheets.filter((w) => w.status !== 'ARCHIVED');

  async function refresh() {
    setRefreshing(true);
    try {
      const [quizData, studentData, worksheetData, calendarData] = await Promise.all([
        api<{ quizzes: Quiz[] }>('/api/quizzes'),
        api<{ students: Student[] }>('/api/students'),
        api<{ worksheets: WorksheetPaper[] }>('/api/worksheets').catch(() => ({ worksheets: [] })),
        api<{ events: CalendarEventItem[] }>('/api/calendar/events').catch(() => ({ events: [] })),
      ]);
      setQuizzes(quizData.quizzes);
      setStudents(studentData.students);
      setWorksheets(worksheetData.worksheets || []);
      setCalendarEvents(calendarData.events || []);
      const activeLive = (quizData.quizzes || []).find((q: Quiz) => q.status === 'ACTIVE');
      if (activeLive) {
        setSelectedQuiz(activeLive.id);
      } else if (!quizData.quizzes?.some((q: Quiz) => q.id === selectedQuiz && q.status === 'ACTIVE')) {
        setSelectedQuiz('');
      }
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to load your dashboard.'); }
    finally { setRefreshing(false); }
  }

  async function loadResults(id: string) {
    if (!id) return;
    try {
      const data = await api<{ results: Result[]; distribution: typeof distribution }>(`/api/quizzes/${id}/results`);
      setResults(data.results);
      setDistribution(data.distribution);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to load results.'); }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => { if ((tab === 'students' || tab === 'results') && selectedQuiz) void loadResults(selectedQuiz); }, [tab, selectedQuiz]);
  useEffect(() => {
    const openResults = (event: Event) => {
      const quizId = (event as CustomEvent<string>).detail;
      if (quizId) {
        setSelectedQuiz(quizId);
        setStudentSubTab('results');
        setTab('students');
      }
    };
    document.addEventListener('open-results', openResults);
    return () => document.removeEventListener('open-results', openResults);
  }, []);
  useEffect(() => {
    if (notice) { const timeout = window.setTimeout(() => setNotice(''), 3400); return () => window.clearTimeout(timeout); }
  }, [notice]);

  const upcomingReminders = useMemo(() => {
    return calendarEvents
      .filter(isUpcomingReminder)
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [calendarEvents]);

  const liveQuiz = quizzes.find((quiz) => quiz.id === selectedQuiz && quiz.status === 'ACTIVE');

  function exportCsv() {
    const lines = [['Student', 'Parent Name', 'Parent WhatsApp', 'Status', 'Score', 'Out of', 'Submitted at'], ...results.map((result) => [result.name, result.parentName ?? '', result.parentPhone ? cleanIndianPhoneNumber(result.parentPhone).formatted : '', result.status, result.score ?? '', result.totalMarks, result.submittedAt ? new Date(result.submittedAt).toLocaleString() : ''])];
    const csv = lines.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `${(quizzes.find((quiz) => quiz.id === selectedQuiz)?.title ?? 'quiz-results').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-results.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function handleResetAttempt(result: Result) {
    if (!selectedQuiz) return;
    const currentQ = quizzes.find((q) => q.id === selectedQuiz);
    const quizTitle = currentQ?.title || 'this quiz';
    if (!window.confirm(`Reset "${quizTitle}" for ${result.name}? This will clear their submitted answers and allow them to retry the quiz from Question 1.`)) return;
    try {
      await api(`/api/quizzes/${selectedQuiz}/attempts/${result.id}/reset`, { method: 'POST' });
      setNotice(`✓ "${quizTitle}" reset for ${result.name}. They can now retake the quiz.`);
      await loadResults(selectedQuiz);
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to reset quiz for this student.');
    }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span><span>EduAshram</span><span className="brand-dot" /></div>
      <div className="sidebar-label">TEACHER SPACE</div>
      <nav className="side-nav" aria-label="Teacher navigation">
        <NavItem active={tab === 'overview'} icon={<BarChart3 size={17} />} label="Overview" onClick={() => setTab('overview')} />
        <NavItem active={tab === 'ai_assistant'} icon={<Sparkles size={17} />} label="AI Teaching Assistant" onClick={() => setTab('ai_assistant')} />
        <NavItem active={tab === 'calendar'} icon={<Calendar size={17} />} label="Calendar & Reminders" onClick={() => setTab('calendar')} />
        <NavItem
          active={tab === 'whiteboard'}
          icon={<PenTool size={17} />}
          label={isTeacherWhiteboardLive ? 'Live Whiteboard' : 'Whiteboard'}
          count={isTeacherWhiteboardLive ? 'LIVE' : undefined}
          onClick={() => setTab('whiteboard')}
        />
        <NavItem active={tab === 'quizzes'} icon={<BookOpenCheck size={17} />} label="Quizzes and Worksheets" count={activeQuizzes.length} onClick={() => setTab('quizzes')} />
        <NavItem active={tab === 'worksheets'} icon={<FileText size={17} />} label="Question Papers" count={activeWorksheets.length} onClick={() => setTab('worksheets')} />
        <NavItem active={tab === 'archive'} icon={<Archive size={17} />} label="Archive" count={archivedQuizzes.length + archivedWorksheets.length} onClick={() => setTab('archive')} />
        <NavItem active={tab === 'students'} icon={<Users size={17} />} label="Students" count={students.length} onClick={() => setTab('students')} />
        <NavItem active={tab === 'settings' || tab === 'ai_settings'} icon={<Settings size={17} />} label="Settings" onClick={() => setTab('settings')} />
        {onOpenUserGuide && (
          <NavItem active={false} icon={<BookOpen size={17} />} label="User Guide" onClick={onOpenUserGuide} />
        )}
      </nav>
      <div className="sidebar-bottom"><div className="teacher-profile"><div className="avatar avatar-green">{(user.email ?? 'T').slice(0, 1).toUpperCase()}</div><div className="profile-copy"><strong>{user.email?.split('@')[0]}</strong><span>Teacher account</span></div><button className="icon-button quiet" title="Sign out" aria-label="Sign out" onClick={onSignOut}><LogOut size={16} /></button></div><div className="sidebar-footnote">A little progress, every day.</div></div>
    </aside>
    <main className="workspace">
      <header className="topbar">
        <div className="breadcrumb">Your classroom <span>/</span> <strong>{tabLabel(tab)}</strong></div>
        <div className="topbar-actions">
          {onViewPortal && (
            <button className="button button-secondary" style={{ fontSize: '13px', padding: '5px 12px', minHeight: '36px', gap: '6px' }} onClick={onViewPortal} title="Preview public website as seen by students and parents">
              <ExternalLink size={14} /> Public Portal
            </button>
          )}
          {onOpenUserGuide && (
            <button
              className="button button-secondary guide-topbar-btn"
              onClick={onOpenUserGuide}
              title="Open Complete User Guide (Public Portal, Teacher's Space, Student's Space)"
            >
              <BookOpen size={14} /> User Guide
            </button>
          )}
          {tab === 'overview' ? (
            <button className="button button-secondary" style={{ fontSize: '13px', padding: '5px 12px', minHeight: '36px', gap: '6px' }} onClick={onSignOut}>
              <LogOut size={14} /> Logout
            </button>
          ) : (
            <button className="button button-secondary" style={{ fontSize: '13px', padding: '5px 12px', minHeight: '36px', gap: '6px' }} onClick={() => setTab('overview')}>
              <ArrowLeft size={14} /> Back to Classroom
            </button>
          )}
          <ClassroomChatHeaderButton />
          <span className="today-label">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
          <button className="icon-button" title="Refresh dashboard" aria-label="Refresh dashboard" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          <div className="avatar avatar-small">{(user.email ?? 'T').slice(0, 1).toUpperCase()}</div>
        </div>
      </header>
      <div className={`content-area ${tab === 'whiteboard' ? 'content-area--whiteboard' : ''}`}>
        {isTeacherWhiteboardLive && tab !== 'whiteboard' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            marginBottom: '16px',
            background: 'linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%)',
            border: '1px solid #86efac',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.25)'
              }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>
                Your Live Whiteboard is broadcasting to students in the background.
              </span>
            </div>
            <button
              className="button button-primary"
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => setTab('whiteboard')}
            >
              <PenTool size={13} /> Return to Whiteboard
            </button>
          </div>
        )}
        {tab === 'overview' && (() => {
          const openQuizzes = quizzes.filter((q) => q.status === 'ACTIVE');
          const openPapers = worksheets.filter((w) => w.status === 'PUBLISHED');

          return (
            <section className="view-enter">
              <div className="page-heading">
                <div>
                  <span className="overline">Good to see you.</span>
                  <h1>Your classroom at a glance</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="button button-primary" onClick={() => setTab('quizzes')}><Plus size={17} /> Create a Quiz</button>
                  <button className="button button-secondary" onClick={() => setTab('worksheets')}><FileText size={17} /> Create a Question Paper</button>
                  <button className="button button-secondary" onClick={() => setTab('calendar')}><Calendar size={17} /> Calendar & Reminders</button>
                </div>
              </div>

              <div className="metrics-grid">
                <Metric label="Live / Open Quizzes" value={openQuizzes.length} icon={<Radio size={17} />} tint="coral" onClick={() => setTab('quizzes')} />
                <Metric label="Open Question Papers" value={openPapers.length} icon={<FileText size={17} />} tint="blue" onClick={() => setTab('worksheets')} />
                <Metric label="Total Students" value={students.length} icon={<Users size={17} />} tint="sage" onClick={() => setTab('students')} />
                {upcomingReminders.length > 0 && (
                  <Metric
                    label={upcomingReminders.length === 1 ? "Upcoming Reminder" : "Upcoming Reminders"}
                    value={upcomingReminders.length}
                    icon={<Bell size={17} />}
                    tint="amber"
                    onClick={() => setTab('calendar')}
                    title={upcomingReminders[0]?.title ? `Next reminder: "${upcomingReminders[0].title}" on ${upcomingReminders[0].date}. Click to view in Calendar & Reminders.` : 'Click to view in Calendar & Reminders'}
                  />
                )}
              </div>

              <div className="section-heading">
                <div>
                  <h2>Live & Active Quizzes</h2>
                  <p>Quizzes and worksheets currently open for student participation</p>
                </div>
                <button className="text-button" onClick={() => setTab('quizzes')}>All Quizzes & Worksheets <ArrowRight size={15} /></button>
              </div>

              {openQuizzes.length === 0 ? (
                <div className="empty-state" style={{ padding: '16px 20px', margin: '0 0 16px 0', minHeight: '100px' }}>
                  <span className="empty-icon" style={{ width: '36px', height: '36px', marginBottom: '6px' }}><Radio size={20} color="#0284c7" /></span>
                  <h3 style={{ fontSize: '16px', margin: '0 0 10px' }}>No Live or Open Quizzes right now.</h3>
                  <button className="button button-primary" style={{ minHeight: '38px', fontSize: '14px', padding: '0 16px' }} onClick={() => setTab('quizzes')}><Plus size={15} /> Open Quizzes</button>
                </div>
              ) : (
                <QuizList
                  quizzes={openQuizzes.slice(0, 4)}
                  onEdit={(quiz) => { setSelectedQuiz(quiz.id); setTab('quizzes'); }}
                  onSelect={(quiz) => { setSelectedQuiz(quiz.id); if (quiz.mode === 'LIVE') { setTab('quizzes'); } else { setStudentSubTab('results'); setTab('students'); } }}
                  onOpenAI={() => setTab('quizzes')}
                  onRefresh={refresh}
                  setNotice={setNotice}
                />
              )}

              <div className="section-heading" style={{ marginTop: '24px' }}>
                <div>
                  <h2>Open Question Papers</h2>
                  <p>Active question papers accepting student workbook answer sheet uploads</p>
                </div>
                <button className="text-button" onClick={() => setTab('worksheets')}>All Question Papers <ArrowRight size={15} /></button>
              </div>

              {openPapers.length === 0 ? (
                <div className="empty-state" style={{ padding: '16px 20px', margin: 0, minHeight: '100px' }}>
                  <span className="empty-icon" style={{ width: '38px', height: '38px', marginBottom: '6px' }}><FileText size={20} color="#0284c7" /></span>
                  <h3 style={{ fontSize: '16px', margin: '0 0 10px' }}>No Open Question Papers right now.</h3>
                  <button className="button button-primary" style={{ minHeight: '38px', fontSize: '14px', padding: '0 16px' }} onClick={() => setTab('worksheets')}><Plus size={15} /> Manage Question Papers</button>
                </div>
              ) : (
                <div className="worksheet-grid">
                  {openPapers.slice(0, 3).map((paper) => (
                    <div className="worksheet-card" key={paper.id}>
                      <div>
                        <div className="worksheet-card-meta">
                          <span className="worksheet-badge badge-published">
                            {paper.status}
                          </span>
                          {paper.subject && <span className="worksheet-badge badge-subject">{paper.subject}</span>}
                          {paper.grade && <span className="worksheet-badge badge-draft">{paper.grade}</span>}
                        </div>
                        <h3>{paper.title}</h3>
                        <div className="worksheet-card-stats">
                          <span>Marks: <strong>{paper.totalMarks}</strong></span>
                          <span>Created: <strong>{new Date(paper.createdAt).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        <button className="button button-secondary" style={{ fontSize: '13px', padding: '6px 12px', flex: '1 1 auto' }} onClick={() => setTab('worksheets')}>
                          Manage in Question Papers <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}
        <div style={{ display: tab === 'ai_assistant' ? 'block' : 'none', width: '100%' }}>
          <TeacherAIAssistant
            user={user}
            setNotice={setNotice}
            onNavigateToTab={(targetTab) => setTab(targetTab as TeacherTab)}
            initialCanvasData={activeCanvasLesson}
            onCanvasDataLoaded={() => setActiveCanvasLesson(null)}
            onLessonSaved={refresh}
          />
        </div>
        {tab === 'quizzes' && <QuizManager quizzes={quizzes} selectedQuiz={selectedQuiz} setSelectedQuiz={setSelectedQuiz} liveQuiz={liveQuiz} refresh={refresh} setNotice={setNotice} teacherName={user?.name} onNavigateToAISettings={() => setTab('settings')} onNavigateToArchive={() => setTab('archive')} />}
        {tab === 'worksheets' && <WorksheetsPanel setNotice={setNotice} teacherName={user?.name} onNavigateToAISettings={() => setTab('settings')} onNavigateToArchive={() => setTab('archive')} />}
        {tab === 'archive' && (
          <TeacherArchivePanel
            quizzes={quizzes}
            worksheets={worksheets}
            refresh={refresh}
            setNotice={setNotice}
            onOpenResults={(quizId) => { setSelectedQuiz(quizId); setStudentSubTab('results'); setTab('students'); }}
            onOpenInLiveCanvas={(lesson) => {
              setActiveCanvasLesson(lesson);
              setTab('ai_assistant');
            }}
          />
        )}
        {tab === 'calendar' && <ClassroomCalendar user={user} readOnly={false} onEventsChange={refresh} />}
        {(hasVisitedWhiteboard || tab === 'whiteboard' || isTeacherWhiteboardLive) && (
          <div style={{ display: tab === 'whiteboard' ? 'block' : 'none', width: '100%' }}>
            <TeacherWhiteboard
              setNotice={setNotice}
              teacherName={user?.name}
              defaultGrade={getDefaultGrade()}
              onBroadcastChange={setIsTeacherWhiteboardLive}
              isActiveTab={tab === 'whiteboard'}
            />
          </div>
        )}
        {(tab === 'students' || tab === 'results') && (
          <StudentManager
            students={students}
            refresh={refresh}
            setNotice={setNotice}
            onBackToClassroom={() => setTab('overview')}
            quizzes={quizzes}
            selectedQuiz={selectedQuiz}
            setSelectedQuiz={setSelectedQuiz}
            results={results}
            distribution={distribution}
            onExport={exportCsv}
            onResetAttempt={handleResetAttempt}
            subTab={studentSubTab}
            setSubTab={setStudentSubTab}
            teacherName={user?.name}
          />
        )}
        {(tab === 'settings' || tab === 'ai_settings') && <TeacherSettingsPanel setNotice={setNotice} user={user} />}
      </div>
      {notice && <div className="toast" role="status"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button></div>}
    </main>
  </div>;
}

function TeacherSettingsPanel({ setNotice, user }: { setNotice: (msg: string) => void; user?: User }) {
  const [subTab, setSubTab] = useState<'ai' | 'classes' | 'preferences' | 'support'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teacher_settings_subtab');
      if (saved === 'ai' || saved === 'classes' || saved === 'preferences' || saved === 'support') return saved;
    }
    return 'ai';
  });

  const handleSubTabChange = (t: 'ai' | 'classes' | 'preferences' | 'support') => {
    setSubTab(t);
    localStorage.setItem('teacher_settings_subtab', t);
  };

  return (
    <section className="view-enter">
      <div className="page-heading">
        <div>
          <span className="overline">Teacher Preferences & Configuration</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={28} color="#059669" /> Settings
          </h1>
          <p>Manage your AI generator key, class & subject offerings, teaching preferences, and support resources.</p>
        </div>
      </div>

      {/* Segmented Sub-Navigation Tabs */}
      <div className="student-subtabs-nav" style={{ maxWidth: '850px', marginBottom: '24px' }}>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'ai' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('ai')}
        >
          <Sparkles size={16} />
          <span>AI Settings</span>
        </button>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'classes' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('classes')}
        >
          <BookOpen size={16} />
          <span>Class & Subject Settings</span>
        </button>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'preferences' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('preferences')}
        >
          <SlidersHorizontal size={16} />
          <span>Teaching Preferences</span>
        </button>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'support' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('support')}
        >
          <CircleHelp size={16} />
          <span>Help & Support</span>
        </button>
      </div>

      {subTab === 'ai' && <AISettingsPanel setNotice={setNotice} user={user} />}
      {subTab === 'classes' && <ClassSubjectSettingsPanel setNotice={setNotice} user={user} />}
      {subTab === 'preferences' && <TeachingPreferencesPanel setNotice={setNotice} />}
      {subTab === 'support' && <HelpSupportPanel setNotice={setNotice} user={user} />}
    </section>
  );
}

function AISettingsPanel({ setNotice, user }: { setNotice: (msg: string) => void; user?: User }) {
  const [provider, setProvider] = useState(() => localStorage.getItem('livequiz_ai_provider') || 'auto');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('livequiz_ai_key');
    fetch('/api/teacher/profile', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (d.teacher) {
          setApiKey(d.teacher.apiKey || '');
          if (user) user.hasApiKey = Boolean(d.teacher.apiKey);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setKeyError('');
    localStorage.setItem('livequiz_ai_provider', provider);
    localStorage.removeItem('livequiz_ai_key');

    try {
      const res = await fetch('/api/teacher/api-key', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save API key.');
      }
      setSaved(true);
      if (user) user.hasApiKey = Boolean(apiKey.trim());
      setNotice(apiKey.trim() ? '✓ Personal AI API Key saved to your teacher profile.' : '✓ Personal AI API Key removed.');
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Unable to save API key.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ai-page-card" style={{ maxWidth: '820px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>AI Engine & Personal Key Configuration</h2>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>Configure your personal AI provider and unique API key for generating interactive quizzes and classroom question papers.</p>
      </div>

      <form onSubmit={handleSave} className="ai-form-grid">
        {saved && (
          <div className="compact-nep" style={{ background: '#ecfdf5', borderColor: '#6ee7b7', color: '#047857' }}>
            <CheckCircle2 size={18} />
            <span>AI Settings saved! Your personal API key is securely registered to your teacher account.</span>
          </div>
        )}

        {keyError && (
          <div className="inline-error" style={{ fontSize: '14px', padding: '12px 16px', borderRadius: '10px' }}>
            {keyError}
          </div>
        )}

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
          <strong style={{ color: '#0f172a' }}>🔒 Teacher API Key Policy:</strong> Every teacher must provide their own unique Google Gemini, OpenAI, or DeepSeek API key. Duplication or sharing of API keys between teacher accounts is strictly prohibited by the system.
        </div>

        <div className="form-grid-2">
          <label className="field compact-field">
            <span>AI Engine Provider</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="auto">Auto Select (Google Gemini / OpenAI GPT / DeepSeek)</option>
              <option value="gemini">Google Gemini AI</option>
              <option value="openai">ChatGPT (OpenAI GPT-4o)</option>
              <option value="deepseek">DeepSeek AI (DeepSeek-V3 / R1)</option>
            </select>
            <small className="muted" style={{ marginTop: '4px' }}>
              Select your preferred AI service provider.
            </small>
          </label>

          <label className="field compact-field">
            <span>Personal API Key *</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setKeyError(''); }}
                placeholder="Paste your unique Gemini, OpenAI, or DeepSeek API key..."
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="button button-secondary"
                style={{ padding: '0 12px', minHeight: '44px', fontSize: '13px' }}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <small className="muted" style={{ marginTop: '4px' }}>
              Each teacher must enter their own unique API key. No sharing or duplication allowed.
            </small>
          </label>
        </div>

        <div className="compact-modal-actions" style={{ marginTop: '20px' }}>
          <button type="submit" className="button button-primary" style={{ padding: '0 28px', minHeight: '44px', background: '#059669', borderColor: '#059669' }} disabled={saving || loading}>
            {saving ? (
              <>
                <RefreshCw size={15} className="spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save AI Settings
              </>
            )}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '15px', margin: '0 0 10px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#0284c7" /> Active AI Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Active Provider</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {provider === 'gemini' ? 'Google Gemini AI' : provider === 'openai' ? 'ChatGPT (OpenAI)' : provider === 'deepseek' ? 'DeepSeek AI (V3/R1)' : 'Auto (Gemini / GPT / DeepSeek)'}
            </div>
          </div>
          <div style={{ padding: '14px', background: apiKey ? '#f0fdf4' : '#fffbeb', border: apiKey ? '1px solid #bbf7d0' : '1px solid #fde68a', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: apiKey ? '#166534' : '#92400e', fontWeight: 600 }}>API Key Status</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: apiKey ? '#15803d' : '#b45309', marginTop: '4px' }}>
              {apiKey ? '✓ Personal Key Active' : '⚠️ No API Key Added'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassSubjectSettingsPanel({ setNotice, user }: { setNotice: (msg: string) => void; user?: User }) {
  const [selectedGrades, setSelectedGrades] = useState<string[]>(() => getActiveGrades());
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => getActiveSubjects());

  const [sessionMonth, setSessionMonth] = useState(() => localStorage.getItem('teacher_pref_session_month') || 'April');
  const [passThreshold, setPassThreshold] = useState(() => localStorage.getItem('teacher_pref_pass_mark') || '40');
  const [schoolName, setSchoolName] = useState(() => user?.school || localStorage.getItem('teacher_pref_school') || 'EduAshram Learning Centre');
  const [saving, setSaving] = useState(false);

  const toggleGrade = (g: string) => {
    setSelectedGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('teacher_pref_grades', JSON.stringify(selectedGrades));
    localStorage.setItem('teacher_pref_subjects', JSON.stringify(selectedSubjects));
    localStorage.setItem('teacher_pref_session_month', sessionMonth);
    localStorage.setItem('teacher_pref_pass_mark', passThreshold);
    localStorage.setItem('teacher_pref_school', schoolName);
    window.dispatchEvent(new Event('teacher-preferences-updated'));
    setTimeout(() => {
      setSaving(false);
      setNotice('✓ Class & Subject settings saved successfully.');
    }, 250);
  };

  return (
    <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Card 1: School & Academic Session Details */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>Institution & Academic Session</h2>
          <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#64748b' }}>Configure your institution name and academic year session parameters.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="field">
              <span style={{ fontWeight: 700, color: '#334155' }}>School / Coaching Centre Name</span>
              <input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. EduAshram High School & Coaching Academy"
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>This name appears on printed student question papers, progress reports, and fee receipts.</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label className="field">
                <span style={{ fontWeight: 700, color: '#334155' }}>Academic Session Cycle</span>
                <select
                  value={sessionMonth}
                  onChange={(e) => setSessionMonth(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                >
                  <option value="April">April to March (Standard CBSE / ICSE)</option>
                  <option value="January">January to December (Calendar Year)</option>
                  <option value="June">June to May (State Board Cycle)</option>
                </select>
              </label>

              <label className="field">
                <span style={{ fontWeight: 700, color: '#334155' }}>Passing Threshold (%)</span>
                <select
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                >
                  <option value="33">33% (Standard Board Minimum)</option>
                  <option value="40">40% (Proficiency Pass)</option>
                  <option value="50">50% (Mastery Standard)</option>
                  <option value="60">60% (First Division Standard)</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Active Classes & Grades */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Active Classes / Grades Taught</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Select the grades you actively manage. These will be prioritized across dropdowns.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '4px 10px', minHeight: '32px' }}
                onClick={() => setSelectedGrades([...ALL_STUDENT_GRADES])}
              >
                Select All
              </button>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '4px 10px', minHeight: '32px' }}
                onClick={() => setSelectedGrades(['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'])}
              >
                Grades 6–10
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {ALL_STUDENT_GRADES.map((g) => {
              const active = selectedGrades.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleGrade(g)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: active ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                    background: active ? '#ecfdf5' : '#f8fafc',
                    color: active ? '#047857' : '#475569',
                    fontSize: '13.5px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {active ? <Check size={14} /> : null}
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 3: Subjects Taught */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Teaching Subjects</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Select your primary instructional subjects.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '4px 10px', minHeight: '32px' }}
                onClick={() => setSelectedSubjects(ALL_ACADEMIC_SUBJECTS.filter((s) => s !== 'Other / Custom Subject'))}
              >
                Select All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {ALL_ACADEMIC_SUBJECTS.filter((s) => s !== 'Other / Custom Subject').map((s) => {
              const active = selectedSubjects.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSubject(s)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: active ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                    background: active ? '#f0f9ff' : '#f8fafc',
                    color: active ? '#0369a1' : '#475569',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {active ? <Check size={14} /> : null}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="submit"
            className="button button-primary"
            style={{ padding: '0 28px', minHeight: '44px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            disabled={saving}
          >
            {saving ? <RefreshCw size={15} className="spin" /> : <Save size={16} />}
            <span>Save Class & Subject Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function TeachingPreferencesPanel({ setNotice }: { setNotice: (msg: string) => void }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('teacher_teaching_preferences');
      return saved ? JSON.parse(saved) : {
        defaultQuizMinutes: '20',
        instantAnswerReveal: true,
        shuffleQuestions: true,
        allowRetries: true,
        autoSaveDrafts: true,
        includeSchoolHeader: true,
        audioEffects: true,
        submissionAlerts: true,
      };
    } catch {
      return {
        defaultQuizMinutes: '20',
        instantAnswerReveal: true,
        shuffleQuestions: true,
        allowRetries: true,
        autoSaveDrafts: true,
        includeSchoolHeader: true,
        audioEffects: true,
        submissionAlerts: true,
      };
    }
  });

  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setPrefs((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('teacher_teaching_preferences', JSON.stringify(prefs));
    setTimeout(() => {
      setSaving(false);
      setNotice('✓ Teaching preferences updated.');
    }, 250);
  };

  return (
    <div style={{ maxWidth: '820px' }}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Quizzes & Assessment Experience */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>Quiz & Classroom Controls</h2>
          <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#64748b' }}>Configure default behavior for interactive live quizzes and student self-paced tests.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="field">
              <span style={{ fontWeight: 700, color: '#334155' }}>Default Quiz Duration Limit</span>
              <select
                value={prefs.defaultQuizMinutes}
                onChange={(e) => setPrefs({ ...prefs, defaultQuizMinutes: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
              >
                <option value="15">15 Minutes (Quick Test)</option>
                <option value="20">20 Minutes (Standard Quiz)</option>
                <option value="30">30 Minutes (Mid-Length Assessment)</option>
                <option value="45">45 Minutes (Full Period Exam)</option>
                <option value="60">60 Minutes (Comprehensive Paper)</option>
                <option value="0">Untimed / Self-Paced (No Timer)</option>
              </select>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={prefs.instantAnswerReveal}
                  onChange={() => toggle('instantAnswerReveal')}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#059669', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Instant Solution & Explanation Reveal</strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>Display answer feedback and explanations immediately after a student submits their choice.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={prefs.shuffleQuestions}
                  onChange={() => toggle('shuffleQuestions')}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#059669', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Randomize Question Order</strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>Shuffle question sequences for student attempts to reduce peer copying in computer labs.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={prefs.allowRetries}
                  onChange={() => toggle('allowRetries')}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#059669', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Allow Quiz Retakes by Default</strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>Allow students to review incorrect answers and retry quizzes for mastery practice.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Question Papers & Workflow */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>Question Paper Studio & Automation</h2>
          <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#64748b' }}>Worksheet drafting and print presentation defaults.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                checked={prefs.autoSaveDrafts}
                onChange={() => toggle('autoSaveDrafts')}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#059669', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Auto-Save Drafts Every 15 Seconds</strong>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Automatically preserve your in-progress question papers and study materials as you type.</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                checked={prefs.includeSchoolHeader}
                onChange={() => toggle('includeSchoolHeader')}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#059669', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Print School Header & Signature Block</strong>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Render institution name, total marks header, and teacher sign-off line on printed sheets.</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                checked={prefs.audioEffects}
                onChange={() => toggle('audioEffects')}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#059669', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Classroom Sound Effects</strong>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Play cheerful audio cues on answer reveals and leaderboard calculations.</span>
              </div>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="submit"
            className="button button-primary"
            style={{ padding: '0 28px', minHeight: '44px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            disabled={saving}
          >
            {saving ? <RefreshCw size={15} className="spin" /> : <Save size={16} />}
            <span>Save Teaching Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function HelpSupportPanel({ setNotice, user }: { setNotice: (msg: string) => void; user?: User }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const faqs = [
    {
      q: 'How do I obtain a personal AI API Key for quiz & paper generation?',
      a: 'You can generate a free Google Gemini API key by visiting Google AI Studio (aistudio.google.com). Sign in with your Google account, click "Create API key", copy it, and paste it into Settings > AI Settings. OpenAI (platform.openai.com) and DeepSeek (platform.deepseek.com) keys are also supported.'
    },
    {
      q: 'How do students log into their student dashboard?',
      a: 'Students do not need complex passwords or email addresses. As the teacher, navigate to the Students Directory tab to copy each student’s unique passkey. Students can visit /student on any phone, tablet, or laptop, type or paste their passkey, and instantly access their classroom.'
    },
    {
      q: 'How does the Add Offline Assessment Score feature work?',
      a: 'When you conduct physical paper tests, class tests, or unit exams in person, navigate to Students > Progress Reports, select the student, and click "Add Offline Test". Enter their score, subject, and remarks. The score is immediately computed into their overall academic report, term GPA, and grade card.'
    },
    {
      q: 'Can I print Question Papers and worksheets for offline exams?',
      a: 'Yes! In the Question Papers tab, every paper has a dedicated "Print Paper" button with print-optimized CSS that removes UI chrome and prints clean examination papers complete with school headers and question numbers.'
    },
    {
      q: 'Are historical student marks preserved if I delete an old quiz?',
      a: 'Yes! EduAshram features Permanent Score Preservation. If an old quiz or paper is deleted, all past student grades and test records are preserved safely in the student progress reports with an archived tag.'
    }
  ];

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
      setNotice('✓ Thank you! Your feedback has been sent to the EduAshram support team.');
    }, 400);
  };

  return (
    <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Helpdesk Channels Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>Teacher Helpdesk & Dedicated Support</h2>
        <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#64748b' }}>Our academic technical support team is available to assist you with classroom setup, student accounts, and question generation.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '16px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Support</strong>
              <a href="mailto:support@eduashram.com" style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'block', marginTop: '2px' }}>support@eduashram.com</a>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Replies within 2 to 4 business hours</span>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teacher Helpline</strong>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '2px' }}>+91 98765 43210</span>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Mon – Sat · 9:00 AM – 7:00 PM IST</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs Accordion Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Frequently Asked Questions (FAQ)</h2>
        <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#64748b' }}>Quick solutions to common questions about quizzes, student passkeys, and scoring.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  border: isOpen ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: isOpen ? '#f8fafc' : '#ffffff',
                  transition: 'all 0.15s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    color: isOpen ? '#0369a1' : '#1e293b'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#0284c7" /> : <ChevronDown size={18} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 18px 16px 18px', fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback / Contact Form Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Send Feedback or Report an Issue</h2>
        <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#64748b' }}>Need assistance with your account or have a feature request? Drop us a note.</p>

        {submitted ? (
          <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#059669" />
            <div>
              <strong>Your message has been sent successfully!</strong>
              <p style={{ margin: '2px 0 0', fontSize: '13px' }}>Our support team will review your request and get back to you at {user?.email || 'your registered email'}.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="field">
              <span style={{ fontWeight: 700, color: '#334155' }}>Subject / Topic</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Assistance with Question Paper Studio, or Feature Suggestion"
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
              />
            </label>

            <label className="field">
              <span style={{ fontWeight: 700, color: '#334155' }}>Message Details *</span>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your query, classroom issue, or feedback in detail..."
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                className="button button-primary"
                style={{ padding: '0 24px', minHeight: '42px', background: '#0284c7', borderColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                disabled={sending}
              >
                {sending ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
                <span>Send Message to Support</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function TeacherWhiteboard({
  setNotice,
  teacherName,
  defaultGrade: _defaultGrade,
  onBroadcastChange,
  isActiveTab,
}: {
  setNotice: (msg: string) => void;
  teacherName?: string;
  defaultGrade?: string;
  onBroadcastChange?: (isLive: boolean) => void;
  isActiveTab?: boolean;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('teacher_broadcast_grade');
      if (saved) return saved;
    } catch (_) {}
    return 'ALL';
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Student Engagement & Doubts Queue states
  const [doubts, setDoubts] = useState<Array<{ socketId: string; studentName: string; note: string; timestamp: number }>>([]);
  const [showDoubtsDrawer, setShowDoubtsDrawer] = useState(false);
  const [viewersRoster, setViewersRoster] = useState<Array<{ socketId: string; studentName: string; grade: string; joinedAt: number }>>([]);
  const [showRosterDrawer, setShowRosterDrawer] = useState(false);
  const [delegatedStudent, setDelegatedStudent] = useState<{ socketId: string; studentName: string; permission: 'pointer' | 'chalk' } | null>(null);
  const [sentimentData, setSentimentData] = useState({
    comprehensionRate: 100,
    totalCount: 0,
    positiveCount: 0,
    questionCount: 0,
    slowDownCount: 0,
    speedUpCount: 0
  });
  const [reactionToasts, setReactionToasts] = useState<Array<{ id: string; emoji: string; studentName: string; label: string }>>([]);

  const socketRef = useRef<Socket | null>(null);
  const selectedGradeRef = useRef(selectedGrade);
  selectedGradeRef.current = selectedGrade;
  const isBroadcastingRef = useRef(isBroadcasting);
  isBroadcastingRef.current = isBroadcasting;
  const onBroadcastChangeRef = useRef(onBroadcastChange);
  onBroadcastChangeRef.current = onBroadcastChange;
  const processedMsgIdsRef = useRef<Set<string>>(new Set());
  const processedReactionIdsRef = useRef<Set<string>>(new Set());
  const broadcastInitializedRef = useRef(false);
  const viewersRosterRef = useRef(viewersRoster);
  viewersRosterRef.current = viewersRoster;

  const handleSelectGrade = (newGrade: string) => {
    setSelectedGrade(newGrade);
    try {
      localStorage.setItem('teacher_broadcast_grade', newGrade);
    } catch (_) {}
  };

  useEffect(() => {
    if (isActiveTab) {
      const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'RESIZE_CANVAS' }, '*');
      }
    }
  }, [isActiveTab]);

  const openInNewWindow = () => {
    const width = Math.min(1360, Math.floor(window.screen.availWidth * 0.75));
    const height = Math.min(920, Math.floor(window.screen.availHeight * 0.9));
    const left = Math.floor((window.screen.availWidth - width) / 2);
    const top = Math.floor((window.screen.availHeight - height) / 2);

    window.open(
      '/whiteboard.html',
      'EduAshramWhiteboardWindow',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );
    setNotice('Whiteboard opened in a separate window. You can snap it adjacent to another app.');
  };

  const handleSetDelegation = useCallback((socketId: string, studentName: string, permission: 'pointer' | 'chalk' | 'none') => {
    const matched = viewersRosterRef.current.find(
      (v) => (socketId && v.socketId === socketId) || (v.studentName && studentName && v.studentName.trim().toLowerCase() === studentName.trim().toLowerCase())
    );
    const resolvedSocketId = socketId || matched?.socketId || '';
    const resolvedStudentName = studentName || matched?.studentName || 'Student';
    const studentId = (matched as any)?.studentId || '';

    const newDelegated = permission === 'none' ? null : { socketId: resolvedSocketId, studentName: resolvedStudentName, permission };
    setDelegatedStudent(newDelegated);

    const fullPayload = {
      type: 'ENGAGEMENT_STATE_SYNC',
      isBroadcasting: isBroadcastingRef.current,
      selectedGrade: selectedGradeRef.current,
      viewerCount: viewersRosterRef.current.length || (newDelegated ? 1 : 0),
      viewersRoster: viewersRosterRef.current,
      delegatedStudent: newDelegated
    };

    const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(fullPayload, '*');
      } catch (_) {}
    }
    try {
      const channel = new BroadcastChannel('eduashram_whiteboard_sync');
      channel.postMessage(fullPayload);
      channel.close();
    } catch (_) {}

    if (socketRef.current) {
      socketRef.current.emit('whiteboard:set_delegation', {
        grade: selectedGradeRef.current,
        targetSocketId: resolvedSocketId,
        socketId: resolvedSocketId,
        studentId,
        studentName: resolvedStudentName,
        permission
      });
    }

    if (permission === 'none') {
      setNotice('Revoked student board delegation.');
    } else {
      setNotice(`Delegated board ${permission === 'chalk' ? 'chalk ✏️' : 'laser pointer 🎯'} to ${resolvedStudentName}.`);
    }
  }, [setNotice]);

  const handleDismissDoubt = useCallback((targetSocketId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('whiteboard:dismiss_doubt', {
        grade: selectedGradeRef.current,
        targetSocketId
      });
    }
    setDoubts((prev) => prev.filter((d) => d.socketId !== targetSocketId));
  }, []);

  const handleClearAllDoubts = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('whiteboard:clear_all_doubts', {
        grade: selectedGradeRef.current
      });
    }
    setDoubts([]);
    setNotice('Cleared all doubt questions from queue.');
  }, [setNotice]);

  const startBroadcast = () => {
    isBroadcastingRef.current = true;
    if (!socketRef.current || !socketRef.current.connected) {
      const socket = io({
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 25,
        reconnectionDelay: 1000
      });
      socketRef.current = socket;

      socket.on('connect_error', (err) => {
        console.warn('Teacher whiteboard broadcast socket error:', err);
      });

      socket.on('whiteboard:viewer_count', (data: { count: number }) => {
        if (typeof data?.count === 'number') {
          setViewerCount(data.count);
        }
      });

      socket.on('whiteboard:doubts_update', (data: { doubts: any[] }) => {
        setDoubts(data?.doubts || []);
      });

      socket.on('whiteboard:viewers_roster', (data: { viewers: any[] }) => {
        setViewersRoster(data?.viewers || []);
      });

      socket.on('whiteboard:delegation_changed', (data: { delegatedStudent: any }) => {
        const del = data?.delegatedStudent || null;
        setDelegatedStudent(del);
        const fullPayload = {
          type: 'ENGAGEMENT_STATE_SYNC',
          isBroadcasting: isBroadcastingRef.current,
          selectedGrade: selectedGradeRef.current,
          viewerCount: viewersRosterRef.current.length || (del ? 1 : 0),
          viewersRoster: viewersRosterRef.current,
          delegatedStudent: del
        };
        const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(fullPayload, '*');
        }
        try {
          const channel = new BroadcastChannel('eduashram_whiteboard_sync');
          channel.postMessage(fullPayload);
          channel.close();
        } catch (_) {}
      });

      socket.on('whiteboard:sentiment_update', (data: any) => {
        if (data && typeof data.comprehensionRate === 'number') {
          setSentimentData({
            comprehensionRate: data.comprehensionRate,
            totalCount: data.totalCount ?? data.total ?? 0,
            positiveCount: data.positiveCount ?? data.understood ?? 0,
            questionCount: data.questionCount ?? data.confused ?? 0,
            slowDownCount: data.slowDownCount ?? data.slower ?? 0,
            speedUpCount: data.speedUpCount ?? data.faster ?? 0,
          });
        }
      });

      socket.on('whiteboard:reaction_event', (data: { id?: string; emoji?: string; studentName?: string; label?: string; type?: string }) => {
        const reactionId = data?.id || `${Date.now()}-${Math.random()}`;
        const dedupeKey = data?.id || `${data?.studentName || 'Student'}-${data?.emoji || data?.type || '👍'}-${Math.floor(Date.now() / 1500)}`;
        if (processedReactionIdsRef.current.has(dedupeKey) || (data?.id && processedReactionIdsRef.current.has(data.id))) return;
        processedReactionIdsRef.current.add(dedupeKey);
        if (data?.id) processedReactionIdsRef.current.add(data.id);
        if (processedReactionIdsRef.current.size > 200) {
          const first = processedReactionIdsRef.current.values().next().value;
          if (first) processedReactionIdsRef.current.delete(first);
        }

        const typeEmojiMap: Record<string, { emoji: string; label: string }> = {
          understood: { emoji: '👍', label: 'Got it' },
          confused: { emoji: '❓', label: 'Doubt' },
          slower: { emoji: '🐢', label: 'Slower' },
          faster: { emoji: '⚡', label: 'Ready' },
        };
        const fallback = (data?.type && typeEmojiMap[data.type]) || { emoji: '👍', label: 'Reaction' };
        const emoji = (data?.emoji && data.emoji !== 'undefined') ? data.emoji : fallback.emoji;
        const studentName = (data?.studentName && data.studentName !== 'undefined' && data.studentName.trim()) || 'Student';
        const label = (data?.label && data.label !== 'undefined') ? data.label : fallback.label;

        const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
        if (iframe?.contentWindow) {
          // Whiteboard iframe renders floating reaction bubble directly over the canvas
          iframe.contentWindow.postMessage({ type: 'REACTION_EVENT', id: reactionId, emoji, studentName, label }, '*');
        } else {
          // If iframe is not active in DOM (e.g. standalone window), display toast in React host and sync
          const toast = {
            id: reactionId,
            emoji,
            studentName,
            label
          };
          setReactionToasts((prev) => [...prev.slice(-5), toast]);
          setTimeout(() => {
            setReactionToasts((prev) => prev.filter((t) => t.id !== reactionId));
          }, 3000);

          try {
            const channel = new BroadcastChannel('eduashram_whiteboard_sync');
            channel.postMessage({ type: 'REACTION_EVENT', id: reactionId, emoji, studentName, label });
            channel.close();
          } catch (_) {}
        }
      });

      socket.on('whiteboard:laser_pointer', (data: any) => {
        const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'STUDENT_LASER_POINTER', ...data }, '*');
        }
        try {
          const channel = new BroadcastChannel('eduashram_whiteboard_sync');
          channel.postMessage({ type: 'STUDENT_LASER_POINTER', ...data });
          channel.close();
        } catch (_) {}
      });

      socket.on('whiteboard:stroke', (data: any) => {
        if (data && data.fromStudent) {
          const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'STUDENT_STROKE', pageIndex: data.pageIndex, stroke: data.stroke }, '*');
          }
          try {
            const channel = new BroadcastChannel('eduashram_whiteboard_sync');
            channel.postMessage({ type: 'STUDENT_STROKE', pageIndex: data.pageIndex, stroke: data.stroke });
            channel.close();
          } catch (_) {}
        }
      });

      socket.on('whiteboard:erase', (data: any) => {
        if (data && data.fromStudent) {
          const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'STUDENT_ERASE', pageIndex: data.pageIndex, erasePoints: data.erasePoints }, '*');
          }
          try {
            const channel = new BroadcastChannel('eduashram_whiteboard_sync');
            channel.postMessage({ type: 'STUDENT_ERASE', pageIndex: data.pageIndex, erasePoints: data.erasePoints });
            channel.close();
          } catch (_) {}
        }
      });

      socket.on('connect', () => {
        if (isBroadcastingRef.current) {
          const iframeEl = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
          if (iframeEl?.contentWindow) {
            iframeEl.contentWindow.postMessage({ type: 'REQUEST_ALL_PAGES' }, '*');
          }
          try {
            const channel = new BroadcastChannel('eduashram_whiteboard_sync');
            channel.postMessage({ type: 'REQUEST_ALL_PAGES' });
            channel.close();
          } catch (_) {}
        }
      });
    }

    const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'REQUEST_ALL_PAGES' }, '*');
    }
    try {
      const channel = new BroadcastChannel('eduashram_whiteboard_sync');
      channel.postMessage({ type: 'REQUEST_ALL_PAGES' });
      channel.close();
    } catch (_) {}

    setIsBroadcasting(true);
    broadcastInitializedRef.current = false;
    onBroadcastChangeRef.current?.(true);
    setNotice(`Live broadcast started for ${selectedGrade === 'ALL' ? 'All Grades' : selectedGrade}. Students can now view your board in real-time.`);
  };

  const stopBroadcast = () => {
    isBroadcastingRef.current = false;
    broadcastInitializedRef.current = false;
    if (socketRef.current) {
      socketRef.current.emit('whiteboard:stop_broadcast', { grade: selectedGradeRef.current });
      // Allow socket buffer to flush over network before disconnect
      const s = socketRef.current;
      setTimeout(() => {
        try { s.disconnect(); } catch (_) {}
      }, 200);
      socketRef.current = null;
    }
    setIsBroadcasting(false);
    onBroadcastChangeRef.current?.(false);
    setViewerCount(0);
    setDoubts([]);
    setViewersRoster([]);
    setDelegatedStudent(null);
    setSentimentData({ comprehensionRate: 100, totalCount: 0, positiveCount: 0, questionCount: 0, slowDownCount: 0, speedUpCount: 0 });
    setReactionToasts([]);
    setNotice('Live whiteboard broadcast stopped.');
  };

  const syncEngagementToWhiteboard = useCallback(() => {
    const payload = {
      type: 'ENGAGEMENT_STATE_SYNC',
      isBroadcasting,
      selectedGrade,
      viewerCount,
      doubts,
      viewersRoster,
      delegatedStudent,
      sentimentData
    };
    const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(payload, '*');
      } catch (_) {}
    }
    try {
      const channel = new BroadcastChannel('eduashram_whiteboard_sync');
      channel.postMessage(payload);
      channel.close();
    } catch (_) {}
  }, [isBroadcasting, selectedGrade, viewerCount, doubts, viewersRoster, delegatedStudent, sentimentData]);

  useEffect(() => {
    syncEngagementToWhiteboard();
  }, [syncEngagementToWhiteboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Notify iframe of fullscreen change so canvas immediately covers 100% of viewport width
    const iframe = document.getElementById('teacher-whiteboard-iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'FULLSCREEN_CHANGE', isFullscreen }, '*');
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const teacherNameRef = useRef(teacherName);
  teacherNameRef.current = teacherName;
  const syncEngagementToWhiteboardRef = useRef(syncEngagementToWhiteboard);
  syncEngagementToWhiteboardRef.current = syncEngagementToWhiteboard;
  const startBroadcastRef = useRef(startBroadcast);
  startBroadcastRef.current = startBroadcast;
  const stopBroadcastRef = useRef(stopBroadcast);
  stopBroadcastRef.current = stopBroadcast;

  const handleBoardEvent = useCallback((data: any) => {
    if (!data || typeof data !== 'object') return;
    if (data._msgId) {
      if (processedMsgIdsRef.current.has(data._msgId)) return;
      processedMsgIdsRef.current.add(data._msgId);
      if (processedMsgIdsRef.current.size > 200) {
        const first = processedMsgIdsRef.current.values().next().value;
        if (first) processedMsgIdsRef.current.delete(first);
      }
    }

    if (data.type === 'WHITEBOARD_ALL_PAGES_RESPONSE') {
      if (socketRef.current) {
        if (!broadcastInitializedRef.current) {
          broadcastInitializedRef.current = true;
          socketRef.current.emit('whiteboard:start_broadcast', {
            grade: selectedGradeRef.current,
            teacherName: teacherNameRef.current || 'Teacher',
            pages: data.pages || [{ strokes: [], shapes: [], texts: [], widgets: [] }],
            activePageIndex: typeof data.activePageIndex === 'number' ? data.activePageIndex : 0
          });
        } else if (isBroadcastingRef.current) {
          socketRef.current.emit('whiteboard:full_sync', {
            grade: selectedGradeRef.current,
            pages: data.pages || [{ strokes: [], shapes: [], texts: [], widgets: [] }],
            activePageIndex: typeof data.activePageIndex === 'number' ? data.activePageIndex : 0
          });
        }
      }
    } else if (data.type === 'WHITEBOARD_PAGE_UPDATE') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:page_update', {
          grade: selectedGradeRef.current,
          pageIndex: data.pageIndex,
          page: data.page
        });
      }
    } else if (data.type === 'WHITEBOARD_BOARD_TYPE_CHANGED' || data.type === 'BOARD_TYPE_CHANGED') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:board_type', {
          grade: selectedGradeRef.current,
          boardType: data.boardType,
          pageIndex: typeof data.pageIndex === 'number' ? data.pageIndex : 0
        });
      }
    } else if (data.type === 'WHITEBOARD_STROKE') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:stroke', {
          grade: selectedGradeRef.current,
          pageIndex: data.pageIndex,
          stroke: data.stroke
        });
      }
    } else if (data.type === 'WHITEBOARD_PAGE_CHANGED') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:page_changed', {
          grade: selectedGradeRef.current,
          activePageIndex: data.activePageIndex,
          boardType: data.boardType
        });
      }
    } else if (data.type === 'WHITEBOARD_CLEAR_PAGE') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:clear_page', {
          grade: selectedGradeRef.current,
          pageIndex: data.pageIndex
        });
      }
    } else if (data.type === 'WHITEBOARD_GRID_CHANGED') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:grid', {
          grade: selectedGradeRef.current,
          pageIndex: data.pageIndex,
          gridVisible: data.gridVisible
        });
      }
    } else if (data.type === 'WHITEBOARD_GRAPH_CHANGED') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:graph', {
          grade: selectedGradeRef.current,
          pageIndex: data.pageIndex,
          graphVisible: data.graphVisible
        });
      }
    } else if (data.type === 'WHITEBOARD_SCROLL') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:scroll', {
          grade: selectedGradeRef.current,
          pageIndex: data.pageIndex,
          scrollTop: data.scrollTop,
          scrollHeight: data.scrollHeight,
          clientHeight: data.clientHeight,
          scrollRatio: data.scrollRatio,
          zoom: data.zoom
        });
      }
    } else if (data.type === 'WHITEBOARD_PAGE_HEIGHT_CHANGED') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:page_height', {
          grade: selectedGradeRef.current,
          pageIndex: data.pageIndex,
          height: data.height
        });
      }
    } else if (data.type === 'WHITEBOARD_VIDEO_ACTION') {
      if (isBroadcastingRef.current && socketRef.current) {
        socketRef.current.emit('whiteboard:video_action', {
          grade: selectedGradeRef.current,
          ...data
        });
      }
    } else if (data.type === 'REQUEST_ENGAGEMENT_STATE') {
      syncEngagementToWhiteboardRef.current?.();
    } else if (data.type === 'WHITEBOARD_SET_DELEGATION') {
      const targetId = data.socketId || data.targetSocketId || '';
      handleSetDelegation(targetId, data.studentName, data.permission);
    } else if (data.type === 'OPEN_ROSTER_DRAWER') {
      setShowRosterDrawer(true);
    } else if (data.type === 'OPEN_DOUBTS_DRAWER') {
      setShowDoubtsDrawer(true);
    } else if (data.type === 'WHITEBOARD_DISMISS_DOUBT') {
      handleDismissDoubt(data.doubtId || data.socketId || data.targetSocketId);
    } else if (data.type === 'WHITEBOARD_CLEAR_ALL_DOUBTS') {
      handleClearAllDoubts();
    } else if (data.type === 'WHITEBOARD_GO_LIVE') {
      startBroadcastRef.current?.();
    } else if (data.type === 'WHITEBOARD_STOP_LIVE') {
      stopBroadcastRef.current?.();
    }
  }, [handleSetDelegation, handleDismissDoubt, handleClearAllDoubts]);

  // Handle postMessage and BroadcastChannel events from the whiteboard to stream real-time vectors
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      handleBoardEvent(e.data);
    };

    window.addEventListener('message', handleMessage);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('eduashram_whiteboard_sync');
        channel.onmessage = (e) => {
          handleBoardEvent(e.data);
        };
      }
    } catch (_) {}

    return () => {
      window.removeEventListener('message', handleMessage);
      if (channel) {
        channel.close();
      }
    };
  }, [handleBoardEvent]);

  // Cleanup broadcast on unmount (e.g. when logging out)
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('whiteboard:stop_broadcast', { grade: selectedGradeRef.current });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      onBroadcastChangeRef.current?.(false);
    };
  }, []);

  return (
    <section className={`whiteboard-section ${isFullscreen ? 'whiteboard-fullscreen-active' : 'view-enter'}`}>
      {!isFullscreen && (
        <div className="page-heading whiteboard-page-heading">
          <div className="whiteboard-title-group">
            <h1 className="whiteboard-title">Online Whiteboard</h1>
            <span className="whiteboard-badge">Interactive Canvas</span>
          </div>
          <div className="whiteboard-top-actions">
            {/* Live Broadcast Controls in Header */}
            <div className="teacher-broadcast-header-group">
              <span className="teacher-broadcast-label">Broadcast Class:</span>
              <select
                className="teacher-grade-select"
                value={selectedGrade}
                onChange={(e) => handleSelectGrade(e.target.value)}
                disabled={isBroadcasting}
                title="Select which Grade / Batch can watch your live whiteboard"
              >
                <option value="ALL">All Grades (Global Broadcast)</option>
                {ALL_STUDENT_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {!isBroadcasting ? (
                <button
                  type="button"
                  className="btn-go-live whiteboard-action-btn"
                  onClick={startBroadcast}
                  title="Broadcast your whiteboard strokes and pages to connected students in real-time"
                >
                  <Radio size={14} /> Go Live
                </button>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="live-pill-indicator">
                    <span className="live-pulse-dot" /> LIVE ({selectedGrade === 'ALL' ? 'All' : selectedGrade})
                  </span>
                  <button
                    type="button"
                    className="btn-stop-live whiteboard-action-btn"
                    onClick={stopBroadcast}
                    title="Stop broadcasting this whiteboard session"
                  >
                    <Square size={12} /> Stop Broadcast
                  </button>

                  {/* Doubt Queue Button */}
                  <button
                    type="button"
                    className={`teacher-doubts-btn ${doubts.length > 0 ? 'has-doubts' : ''}`}
                    onClick={() => setShowDoubtsDrawer(true)}
                    title="Open Student Doubt Queue"
                  >
                    <Hand size={13} />
                    <span>Doubts</span>
                    {doubts.length > 0 && <span className="teacher-doubts-badge">{doubts.length}</span>}
                  </button>

                  {/* Student Roster Button */}
                  <button
                    type="button"
                    className="teacher-doubts-btn"
                    onClick={() => setShowRosterDrawer(true)}
                    title="Connected Students & Delegation"
                  >
                    <Users size={13} />
                    <span>{viewersRoster.length || viewerCount} Students</span>
                  </button>

                  {/* Active Student Delegation Badge */}
                  {delegatedStudent && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      <span>{delegatedStudent.permission === 'chalk' ? '✏️' : '🎯'} {delegatedStudent.studentName}</span>
                      <button
                        type="button"
                        onClick={() => handleSetDelegation(delegatedStudent.socketId, delegatedStudent.studentName, 'none')}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          padding: '1px 5px',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                        title="Revoke access"
                      >
                        Revoke
                      </button>
                    </div>
                  )}

                  {/* Classroom Comprehension / Sentiment Pill */}
                  <div
                    className={`teacher-sentiment-pill teacher-sentiment-pill--${
                      sentimentData.comprehensionRate >= 75 ? 'high' : sentimentData.comprehensionRate >= 45 ? 'mid' : 'low'
                    }`}
                    title={`Class comprehension: ${sentimentData.comprehensionRate}%\n👍 Got it: ${sentimentData.positiveCount}\n❓ Doubts: ${sentimentData.questionCount}\n🐢 Slower: ${sentimentData.slowDownCount}\n⚡ Ready: ${sentimentData.speedUpCount}`}
                  >
                    <span>{sentimentData.comprehensionRate >= 75 ? '🟢' : sentimentData.comprehensionRate >= 45 ? '🟡' : '🔴'}</span>
                    <span>{sentimentData.comprehensionRate}% Comprehension</span>
                  </div>
                </div>
              )}
            </div>

            <span className="whiteboard-header-separator" />

            <button
              type="button"
              className="button button-primary whiteboard-action-btn"
              onClick={openInNewWindow}
              title="Open whiteboard in an independent window (great for placing adjacent to another app, question paper, or Zoom screen share)"
            >
              <AppWindow size={14} /> New Window
            </button>
            <button
              type="button"
              className="button button-secondary whiteboard-action-btn"
              onClick={() => setIsFullscreen(true)}
              title="Expand whiteboard to full screen view"
            >
              <Maximize2 size={14} /> Fullscreen
            </button>
            <button
              type="button"
              className="button button-secondary whiteboard-action-btn"
              onClick={() => {
                setIframeKey((k) => k + 1);
                setNotice('Whiteboard canvas reloaded.');
              }}
              title="Reload the whiteboard canvas"
            >
              <RotateCcw size={14} /> Reload
            </button>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="whiteboard-fullscreen-bar">
          <div className="whiteboard-fullscreen-brand">
            <span className="brand-dot" />
            <strong>EduAshram Whiteboard</strong>
            {isBroadcasting && (
              <span className="live-pill-indicator" style={{ marginLeft: '10px' }}>
                <span className="live-pulse-dot" /> LIVE ({selectedGrade}) · {viewerCount} student{viewerCount === 1 ? '' : 's'}
              </span>
            )}
            <span className="badge">Fullscreen Mode (Press Esc or Exit)</span>
          </div>
          <div className="whiteboard-fullscreen-controls">
            <select
              className="teacher-grade-select"
              value={selectedGrade}
              onChange={(e) => handleSelectGrade(e.target.value)}
              disabled={isBroadcasting}
              title="Select which Grade / Batch can watch your live whiteboard"
              style={{ background: '#0f172a', color: '#fff', borderColor: '#334155', minHeight: '32px', padding: '2px 8px', fontSize: '12px' }}
            >
              <option value="ALL">All Grades</option>
              {ALL_STUDENT_GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {isBroadcasting ? (
              <>
                <button
                  type="button"
                  className="button button-danger"
                  style={{ background: '#dc2626', color: '#fff', borderColor: '#b91c1c', minHeight: '32px', padding: '4px 12px' }}
                  onClick={stopBroadcast}
                >
                  <Square size={13} /> Stop Live
                </button>

                {/* Doubts Queue Button in Fullscreen */}
                <button
                  type="button"
                  className={`teacher-doubts-btn ${doubts.length > 0 ? 'has-doubts' : ''}`}
                  onClick={() => setShowDoubtsDrawer(true)}
                  style={{ minHeight: '32px' }}
                  title="Open Student Doubt Queue"
                >
                  <Hand size={13} />
                  <span>Doubts</span>
                  {doubts.length > 0 && <span className="teacher-doubts-badge">{doubts.length}</span>}
                </button>

                {/* Roster Button in Fullscreen */}
                <button
                  type="button"
                  className="teacher-doubts-btn"
                  onClick={() => setShowRosterDrawer(true)}
                  style={{ minHeight: '32px' }}
                  title="Connected Students & Delegation"
                >
                  <Users size={13} />
                  <span>{viewersRoster.length || viewerCount}</span>
                </button>

                {/* Active Student Delegation in Fullscreen */}
                {delegatedStudent && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    <span>{delegatedStudent.permission === 'chalk' ? '✏️' : '🎯'} {delegatedStudent.studentName}</span>
                    <button
                      type="button"
                      onClick={() => handleSetDelegation(delegatedStudent.socketId, delegatedStudent.studentName, 'none')}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                      title="Revoke access"
                    >
                      Revoke
                    </button>
                  </div>
                )}

                {/* Sentiment in Fullscreen */}
                <div
                  className={`teacher-sentiment-pill teacher-sentiment-pill--${
                    sentimentData.comprehensionRate >= 75 ? 'high' : sentimentData.comprehensionRate >= 45 ? 'mid' : 'low'
                  }`}
                  style={{ minHeight: '26px' }}
                >
                  <span>{sentimentData.comprehensionRate >= 75 ? '🟢' : sentimentData.comprehensionRate >= 45 ? '🟡' : '🔴'}</span>
                  <span>{sentimentData.comprehensionRate}%</span>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="button button-success"
                style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d', minHeight: '32px', padding: '4px 12px' }}
                onClick={startBroadcast}
              >
                <Radio size={13} /> Go Live
              </button>
            )}
            <button
              type="button"
              className="button button-secondary"
              style={{ background: '#1e293b', color: '#fff', borderColor: '#334155', minHeight: '32px', padding: '4px 12px' }}
              onClick={openInNewWindow}
              title="Open whiteboard in a standalone window adjacent to other apps"
            >
              <AppWindow size={13} /> New Window
            </button>
            <button
              type="button"
              className="button button-primary"
              style={{ minHeight: '32px', padding: '4px 14px' }}
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 size={13} /> Exit Fullscreen
            </button>
            <button
              type="button"
              className="button button-secondary"
              style={{ background: '#1e293b', color: '#fff', borderColor: '#334155', minHeight: '32px', padding: '4px 12px' }}
              onClick={() => {
                setIframeKey((k) => k + 1);
                setNotice('Canvas reloaded.');
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      )}

      <div className={`whiteboard-frame-container ${isFullscreen ? 'whiteboard-frame-container--fullscreen' : ''}`}>
        <iframe
          key={iframeKey}
          id="teacher-whiteboard-iframe"
          title="Online Teaching Whiteboard"
          src="/whiteboard.html"
          className="whiteboard-iframe"
          allow="clipboard-read; clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture"
        />
      </div>

      {/* Doubt Queue Drawer */}
      {showDoubtsDrawer && (
        <div className="teacher-drawer-overlay" onClick={() => setShowDoubtsDrawer(false)}>
          <div className="teacher-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-drawer-header">
              <h3>
                <Hand size={18} color="#d97706" /> Student Doubts ({doubts.length})
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {doubts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllDoubts}
                    style={{
                      background: 'none',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      color: '#64748b',
                      fontWeight: 600
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDoubtsDrawer(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="teacher-drawer-content">
              {doubts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 10px' }}>
                  <Hand size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>No pending doubts</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>
                    Students can click "Raise Hand" with optional questions during the lesson.
                  </p>
                </div>
              ) : (
                doubts.map((d) => {
                  const isDoubtDelegated = Boolean(
                    delegatedStudent &&
                      (delegatedStudent.socketId === d.socketId ||
                        (d.studentName &&
                          delegatedStudent.studentName &&
                          delegatedStudent.studentName.trim().toLowerCase() === d.studentName.trim().toLowerCase()))
                  );
                  return (
                      <div key={d.socketId} className="teacher-doubt-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{d.studentName}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {Math.max(1, Math.round((Date.now() - d.timestamp) / 1000))}s ago
                          </span>
                        </div>
                        {d.note && (
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '6px 8px', borderRadius: '6px' }}>
                            "{d.note}"
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {isDoubtDelegated ? (
                            <button
                              type="button"
                              onClick={() => handleSetDelegation(d.socketId, d.studentName, 'none')}
                              style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Revoke ({delegatedStudent?.permission === 'chalk' ? 'Chalk' : 'Pointer'})
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSetDelegation(d.socketId, d.studentName, 'pointer')}
                                style={{
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Grant student board laser pointer"
                              >
                                🎯 Pointer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDelegation(d.socketId, d.studentName, 'chalk')}
                                style={{
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Grant student board chalk"
                              >
                                ✏️ Chalk
                              </button>
                            </>
                          )}
                      <button
                        type="button"
                        onClick={() => handleDismissDoubt(d.socketId)}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginLeft: 'auto'
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      )}

      {/* Student Roster Drawer */}
      {showRosterDrawer && (
        <div className="teacher-drawer-overlay" onClick={() => setShowRosterDrawer(false)}>
          <div className="teacher-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-drawer-header">
              <h3>
                <Users size={18} color="#0284c7" /> Connected Students ({viewersRoster.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowRosterDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="teacher-drawer-content">
              {viewersRoster.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 10px' }}>
                  <Users size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>No students connected yet</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>
                    When students join for this class grade, they will appear here.
                  </p>
                </div>
              ) : (
                viewersRoster.map((st) => {
                  const isCurrentDelegated = Boolean(
                    delegatedStudent &&
                      (delegatedStudent.socketId === st.socketId ||
                        (st.studentName &&
                          delegatedStudent.studentName &&
                          delegatedStudent.studentName.trim().toLowerCase() === st.studentName.trim().toLowerCase()))
                  );
                  return (
                    <div
                      key={st.socketId}
                      className={`teacher-student-row ${isCurrentDelegated ? 'is-delegated' : ''}`}
                    >
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>
                          {st.studentName}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {st.grade} • Connected
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isCurrentDelegated ? (
                          <button
                            type="button"
                            onClick={() => handleSetDelegation(st.socketId, st.studentName, 'none')}
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Revoke ({delegatedStudent?.permission === 'chalk' ? 'Chalk' : 'Pointer'})
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSetDelegation(st.socketId, st.studentName, 'pointer')}
                              style={{
                                background: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Delegate laser pointer"
                            >
                              🎯 Pointer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetDelegation(st.socketId, st.studentName, 'chalk')}
                              style={{
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Delegate student board chalk"
                            >
                              ✏️ Chalk
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Reaction Toasts */}
      {reactionToasts.length > 0 && (
        <div className="teacher-reaction-toast-container">
          {reactionToasts.map((toast) => (
            <div key={toast.id} className="teacher-reaction-toast">
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{toast.emoji || '👍'}</span>
              <span><strong>{toast.studentName}</strong>: {toast.label || 'Sent reaction'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function tabLabel(tab: string) { return ({ overview: 'Overview', ai_assistant: 'AI Teaching Assistant', calendar: 'Calendar & Reminders', whiteboard: 'Online Whiteboard', quizzes: 'Quizzes and Worksheets', worksheets: 'Question Papers', archive: 'Archive', students: 'Students', results: 'Results', settings: 'Settings', ai_settings: 'Settings' } as Record<string, string>)[tab] ?? tab; }
function NavItem({ active, icon, label, count, onClick }: { active: boolean; icon: React.ReactNode; label: string; count?: number | string; onClick: () => void }) {
  const isLive = count === 'LIVE' || count === 'Live';
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <small style={isLive ? { background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' } : undefined}>
          {count}
        </small>
      )}
    </button>
  );
}
function Metric({ label, value, icon, tint, onClick, title }: { label: string; value: number | string; icon: React.ReactNode; tint: string; onClick?: () => void; title?: string }) { return <div className="metric" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }} title={title}><div className={`metric-icon ${tint}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div><div className="metric-trend">↗</div></div>; }

export type UploadedSourceFile = {
  name: string;
  type: string;
  data: string;
  size: number;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function processSourceFile(file: File): Promise<UploadedSourceFile> {
  // If image, resize client-side for maximum speed, snappy UX, and optimal LLM vision
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const rawData = e.target?.result as string;
        const img = new window.Image();
        img.onerror = () => {
          resolve({
            name: file.name,
            type: file.type || 'image/jpeg',
            data: rawData,
            size: file.size,
          });
        };
        img.onload = () => {
          const maxDim = 2200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
            resolve({
              name: file.name,
              type: 'image/jpeg',
              data: dataUrl,
              size: Math.round(dataUrl.length * 0.75),
            });
          } else {
            resolve({
              name: file.name,
              type: file.type || 'image/jpeg',
              data: rawData,
              size: file.size,
            });
          }
        };
        img.src = rawData;
      };
      reader.readAsDataURL(file);
    });
  }

  // Document (PDF, text notes)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      resolve({
        name: file.name,
        type: file.type || 'application/pdf',
        data: e.target?.result as string,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}

function ContentSourceUploadSection({
  files,
  onFilesChange,
  strictMode,
  onStrictModeChange,
  onPreviewImage,
}: {
  files: UploadedSourceFile[];
  onFilesChange: (files: UploadedSourceFile[]) => void;
  strictMode: boolean;
  onStrictModeChange: (strict: boolean) => void;
  onPreviewImage?: (dataUrl: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setProcessing(true);
    try {
      const fileList = Array.from(selected);
      const newItems: UploadedSourceFile[] = [];
      for (const f of fileList) {
        const processed = await processSourceFile(f);
        newItems.push(processed);
      }
      onFilesChange([...files, ...newItems]);
    } catch (err) {
      console.error('File reading error:', err);
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="upload-source-card">
      <div className="upload-source-header">
        <div className="upload-source-title">
          <span className="title-icon"><UploadCloud size={18} /></span>
          <span>Upload Study Materials, Chapter Scans or Sample Papers</span>
        </div>
        {files.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="upload-source-badge">
              <CheckCircle2 size={13} /> {files.length} {files.length === 1 ? 'file' : 'files'} attached
            </span>
            <button
              type="button"
              className="text-button"
              style={{ fontSize: '11.5px', color: '#ef4444', padding: '2px 6px' }}
              onClick={() => onFilesChange([])}
            >
              Clear All
            </button>
          </div>
        ) : (
          <span className="upload-source-badge" style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' }}>
            Optional
          </span>
        )}
      </div>

      <div
        className={`upload-source-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.txt,.md"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-icon-wrap">
          {processing ? <RefreshCw size={20} className="spin" /> : <UploadCloud size={20} />}
        </div>
        <div className="dropzone-prompt-text">
          {processing ? 'Processing uploaded files...' : 'Click to Browse or Drag & Drop Files Here'}
        </div>
        <div className="dropzone-sub-text">
          Upload sample papers, photos or scans of textbook chapters, exercise sheets, or diagram images.
        </div>
        <div className="dropzone-pills">
          <span className="dropzone-pill">📸 Book Chapter Scans (JPG, PNG)</span>
          <span className="dropzone-pill">📄 Sample Question Papers (PDF)</span>
          <span className="dropzone-pill">📝 Text Notes (.txt, .md)</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="upload-source-list">
          {files.map((file, idx) => {
            const isImg = file.type.startsWith('image/');
            const isPdf = file.type.includes('pdf');
            return (
              <div key={idx} className="upload-source-item">
                {isImg ? (
                  <img
                    src={file.data}
                    alt={file.name}
                    className="upload-item-thumb"
                    title="Click to preview full size"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPreviewImage) onPreviewImage(file.data);
                    }}
                  />
                ) : (
                  <div className="upload-item-doc-icon">
                    {isPdf ? 'PDF' : <FileText size={18} />}
                  </div>
                )}
                <div className="upload-item-details">
                  <span className="upload-item-name" title={file.name}>{file.name}</span>
                  <span className="upload-item-meta">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="upload-item-remove"
                  title="Remove this file"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Strict Mode Toggle Box */}
      <div className={`strict-toggle-box ${strictMode ? 'strict-active' : 'strict-inactive'}`}>
        <div className="strict-toggle-info">
          <div className="strict-toggle-label">
            {strictMode ? <Lock size={15} /> : <Sparkles size={15} />}
            <span>
              {strictMode
                ? 'Strict Mode: Generate EXCLUSIVELY from Uploaded Content'
                : 'Standard AI Mode: LLM Knowledge + Upload Reference'}
            </span>
          </div>
          <div className="strict-toggle-desc">
            {strictMode
              ? 'AI will strictly construct questions, options, and solutions ONLY from your uploaded files and scans. Outside LLM content is restricted.'
              : 'AI generates questions using general curriculum intelligence, using any uploaded files as helpful reference and style guide.'}
          </div>
        </div>
        <label className="modern-switch" title={strictMode ? 'Strict Mode is ON' : 'Strict Mode is OFF'}>
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => onStrictModeChange(e.target.checked)}
          />
          <span className="modern-switch-slider"></span>
        </label>
      </div>

      {strictMode && files.length === 0 && (
        <div className="strict-mode-warning-note">
          <CircleHelp size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Note:</strong> Strict Mode is enabled, but no files have been uploaded yet. Please attach at least one chapter scan or sample paper above, or toggle Strict Mode off to generate from general AI curriculum knowledge.
          </span>
        </div>
      )}
    </div>
  );
}

function AIQuizModal({ onClose, onGenerated, onNavigateToAISettings }: { onClose: () => void; onGenerated: (quiz: { title: string; mode: Mode; hasTimer?: boolean; minutes?: number; liveTimerSeconds?: number | null; questions: Question[]; grade?: string }) => void; onNavigateToAISettings?: () => void }) {
  const [subject, setSubject] = useState(() => getDefaultSubject());
  const [customSubject, setCustomSubject] = useState('');
  const [grade, setGrade] = useState(() => getDefaultGrade());
  const [topic, setTopic] = useState('');
  const [subtopics, setSubtopics] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState<'ALL' | 'MCQ' | 'FILL_BLANK' | 'TRUE_FALSE' | 'SOLVE'>('ALL');
  const [mode, setMode] = useState<Mode>('LIVE');
  const [hasTimer, setHasTimer] = useState(false);
  const [minutes, setMinutes] = useState(20);
  const [liveTimerSeconds, setLiveTimerSeconds] = useState(30);
  const [details, setDetails] = useState('');
  const [sourceFiles, setSourceFiles] = useState<UploadedSourceFile[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [hasTeacherKey, setHasTeacherKey] = useState<boolean | null>(null);

  const provider = localStorage.getItem('livequiz_ai_provider') || 'auto';
  const activeSubject = subject === 'Other' ? (customSubject.trim() || 'General') : subject;
  const isHindi = activeSubject.toLowerCase().includes('hindi') || activeSubject.includes('हिंदी') || activeSubject.includes('हिन्दी');

  useEffect(() => {
    localStorage.removeItem('livequiz_ai_key');
    fetch('/api/teacher/profile', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setHasTeacherKey(Boolean(d.teacher?.apiKey || d.teacher?.hasApiKey)))
      .catch(() => setHasTeacherKey(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError('Please enter a topic.'); return; }
    if (strictMode && sourceFiles.length === 0) {
      setError('Please upload at least one sample paper, chapter scan, or image to generate strictly from uploaded content.');
      return;
    }
    if (hasTeacherKey === false) {
      setError('Every teacher must add their own unique personal AI API Key in AI Settings before generating quizzes. Duplication or sharing of keys is not allowed.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const finalSubject = subject === 'Other' ? (customSubject || 'General') : subject;
      const res = await api<{ title: string; questions: Question[] }>('/api/ai/generate-quiz', {
        method: 'POST',
        body: JSON.stringify({
          subject: finalSubject,
          grade,
          topic,
          subtopics,
          difficulty,
          questionCount,
          questionType,
          mode,
          details,
          provider,
          strictSourceContent: strictMode,
          uploadedFiles: sourceFiles.length > 0 ? sourceFiles : undefined,
        }),
      });
      onGenerated({
        title: res.title,
        grade,
        mode,
        hasTimer,
        minutes,
        liveTimerSeconds: (mode === 'LIVE' && hasTimer) ? liveTimerSeconds : null,
        questions: res.questions
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to generate quiz.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ai-form-grid">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: hasTeacherKey === false ? '#fffbeb' : '#f0f9ff', border: hasTeacherKey === false ? '1px solid #fde68a' : '1px solid #bae6fd', borderRadius: '12px', color: hasTeacherKey === false ? '#92400e' : '#0369a1', fontSize: '13.5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} />
          <span>AI Engine Settings: <strong>{provider === 'gemini' ? 'Google Gemini AI' : provider === 'openai' ? 'ChatGPT (OpenAI)' : provider === 'deepseek' ? 'DeepSeek AI' : 'Auto Select'}</strong> {hasTeacherKey ? '(Personal Key Active ✓)' : '(No Key Configured ⚠️)'}</span>
        </div>
        {onNavigateToAISettings && (
          <button type="button" className="text-button" style={{ fontSize: '12.5px', color: hasTeacherKey === false ? '#b45309' : '#0284c7', fontWeight: 600, padding: 0 }} onClick={onNavigateToAISettings}>
            {hasTeacherKey === false ? 'Add Your API Key →' : 'Configure AI Settings →'}
          </button>
        )}
      </div>

      <div className="form-grid-3">
        <label className="field compact-field">
          <span>Subject</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {getActiveSubjects().length > 0 && (
              <optgroup label="Teaching Subjects">
                {getActiveSubjects().map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            )}
            <optgroup label="Other Subjects">
              {ALL_ACADEMIC_SUBJECTS.filter((s) => !getActiveSubjects().includes(s) && s !== 'Other / Custom Subject').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Other">Other / Custom</option>
            </optgroup>
          </select>
        </label>

        <label className="field compact-field">
          <span>Grade / Class</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
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

        <div className="field compact-field">
          <span>Difficulty Level</span>
          <div className="difficulty-pills">
            {(['Easy', 'Moderate', 'Hard'] as const).map((level) => (
              <button key={level} type="button" className={`pill ${difficulty === level ? 'active-' + level.toLowerCase() : ''}`} onClick={() => setDifficulty(level)}>
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subject === 'Other' && (
        <label className="field">
          <span>Specify Custom Subject</span>
          <input required value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="e.g. General Knowledge" />
        </label>
      )}

      {isHindi && (
        <div style={{
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '1px solid #fed7aa',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#9a3412',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500
        }}>
          <span style={{ fontSize: '16px' }}>🇮🇳</span>
          <span>
            <strong>Hindi Subject Active:</strong> Teacher can enter topics and subtopics in <em>Hinglish</em> (e.g. <em>"Karak aur uske bhed"</em>, <em>"Sandhi vichhed"</em>). The quiz, questions, options, and explanations will be generated <strong>strictly in pure Hindi (देवनागरी लिपि)</strong>.
          </span>
        </div>
      )}

      <div className="form-grid-2">
        <label className="field compact-field">
          <span>Main Topic <span className="required-star">*</span></span>
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={isHindi ? "e.g. Karak aur uske bhed, Sandhi vichhed, Surdas ke Pad (Hinglish/Hindi)" : "e.g. Photosynthesis, Motion, Fractions"}
          />
        </label>

        <label className="field compact-field">
          <span>Sub-Topics (Optional)</span>
          <input
            value={subtopics}
            onChange={(e) => setSubtopics(e.target.value)}
            placeholder={isHindi ? "e.g. Niyam, udaharan, paribhasha (Hinglish/Hindi)" : "e.g. Light reaction, Chlorophyll"}
          />
        </label>
      </div>

      <div className="form-grid-2">
        <label className="field compact-field">
          <span>Number of Questions</span>
          <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
            <option value={25}>25 Questions</option>
            <option value={30}>30 Questions</option>
          </select>
        </label>

        <label className="field compact-field">
          <span>Question Format / Type</span>
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value as any)}>
            <option value="ALL">All Types (Mixed MCQ, Fill-in-blank, True/False, Solve)</option>
            <option value="MCQ">Multiple Choice (MCQ) Only</option>
            <option value="FILL_BLANK">Fill in the Blanks Only</option>
            <option value="TRUE_FALSE">True / False Only</option>
            <option value="SOLVE">Solve / Problem Solving Only</option>
          </select>
        </label>
      </div>

      {/* Upload Study Materials, Chapter Scans, Sample Papers & Strict Toggle */}
      <ContentSourceUploadSection
        files={sourceFiles}
        onFilesChange={setSourceFiles}
        strictMode={strictMode}
        onStrictModeChange={setStrictMode}
        onPreviewImage={setPreviewImage}
      />

      <div className="form-grid-2">
        <div className="field compact-field" style={{ gridColumn: '1 / -1' }}>
          <span>Quiz Delivery Mode</span>
          <div className="mode-choice compact-mode-choice">
            <button type="button" className={mode === 'LIVE' ? 'chosen' : ''} onClick={() => { setMode('LIVE'); }}>
              <Radio size={15} />
              <span><strong>Live classroom</strong></span>
            </button>
            <button type="button" className={mode === 'SELF_PACED' && hasTimer ? 'chosen' : ''} onClick={() => { setMode('SELF_PACED'); setHasTimer(true); }}>
              <Clock3 size={15} />
              <span><strong>Timed practice</strong></span>
            </button>
            <button type="button" className={mode === 'SELF_PACED' && !hasTimer ? 'chosen' : ''} onClick={() => { setMode('SELF_PACED'); setHasTimer(false); }}>
              <BookOpenCheck size={15} />
              <span><strong>Self Paced</strong></span>
            </button>
          </div>
        </div>

        {mode === 'LIVE' && (
          <div style={{ gridColumn: '1 / -1', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock3 size={15} color="#0284c7" /> Per-Question Timer (Auto Reveal & Advance)
              </span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: hasTimer ? '#0284c7' : '#64748b' }}>
                <input type="checkbox" checked={hasTimer} onChange={(e) => setHasTimer(e.target.checked)} />
                {hasTimer ? 'Timer Active' : 'Manual Pace (No Timer)'}
              </label>
            </div>
            {hasTimer && (
              <div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {[15, 20, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`button button-quiet ${liveTimerSeconds === sec ? 'active-pill' : ''}`}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: liveTimerSeconds === sec ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: liveTimerSeconds === sec ? '#e0f2fe' : '#ffffff',
                        color: liveTimerSeconds === sec ? '#0369a1' : '#475569',
                      }}
                      onClick={() => setLiveTimerSeconds(sec)}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <div className="input-suffix" style={{ maxWidth: '160px' }}>
                  <input type="number" min={5} max={300} value={liveTimerSeconds} onChange={(e) => setLiveTimerSeconds(Number(e.target.value))} />
                  <span>seconds</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                  Automatically reveals answer after timer expires, pauses 2-3s, and shows next question. Teacher can pause anytime.
                </p>
              </div>
            )}
          </div>
        )}

        {mode === 'SELF_PACED' && hasTimer && (
          <label className="field compact-field short-field" style={{ marginTop: '4px' }}>
            <span>Time Limit (Minutes)</span>
            <div className="input-suffix">
              <input type="number" min={1} max={1440} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
              <span>minutes</span>
            </div>
          </label>
        )}

        <label className="field compact-field" style={{ gridColumn: (mode === 'SELF_PACED' && hasTimer) ? 'auto' : '1 / -1' }}>
          <span>Any Other Details (Optional)</span>
          <input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. Focus on word problems..." />
        </label>
      </div>

      <div className="nep-callout compact-nep">
        <Sparkles size={16} />
        <span><strong>NEP 2026 Aligned:</strong> Questions focus on real-world scenarios, critical reasoning, and competency assessment.</span>
      </div>

      {error && <div className="inline-error">{error}</div>}

      <div className="modal-actions compact-modal-actions">
        <button type="button" className="button button-quiet" onClick={onClose} disabled={generating}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={generating}>
          {generating ? <><RefreshCw size={16} className="spin" /> Generating {questionCount} Questions...</> : <><Sparkles size={16} /> Generate {questionCount} Questions</>}
        </button>
      </div>

      {previewImage && (
        <div className="word-doc-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Uploaded material preview" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} />
          <button className="icon-button quiet" style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} onClick={() => setPreviewImage(null)}>
            <X size={18} />
          </button>
        </div>
      )}
    </form>
  );
}

function QuizList({ quizzes, onEdit, onSelect, onOpenAI, onRefresh, setNotice, onRestart }: { quizzes: Quiz[]; onEdit: (quiz: Quiz) => void; onSelect: (quiz: Quiz) => void; onOpenAI: () => void; onRefresh: () => Promise<void>; setNotice: (text: string) => void; onRestart?: (quiz: Quiz) => void }) {
  async function remove(quiz: Quiz) {
    if (!window.confirm(`Delete “${quiz.title}” and all its results?`)) return;
    try { await api(`/api/quizzes/${quiz.id}`, { method: 'DELETE' }); setNotice('Quiz deleted.'); await onRefresh(); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to delete quiz.'); }
  }
  if (!quizzes.length) return <div className="empty-state"><span className="empty-icon"><Sparkles size={26} /></span><h3>Your first quiz starts here.</h3><p>Build a live classroom round or generate an AI quiz in seconds.</p><div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}><button className="button button-primary" onClick={onOpenAI}><Sparkles size={17} /> Generate with AI</button><button className="button button-secondary" onClick={() => onEdit({ id: '', title: '', mode: 'LIVE', status: 'DRAFT', currentQuestionIndex: 0, currentAnswerRevealed: false, timeLimitSeconds: null, showResults: true })}><Plus size={16} /> Create manually</button></div></div>;
  return <div className="quiz-list">{quizzes.map((quiz) => <article className="quiz-row" key={quiz.id}><div className={`quiz-mode-icon ${quiz.mode === 'LIVE' ? 'mode-live' : 'mode-timed'}`}>{quiz.mode === 'LIVE' ? <Radio size={19} /> : <Clock3 size={19} />}</div><button className="quiz-row-main" onClick={() => onSelect(quiz)}><strong>{quiz.title}</strong><span>{quiz.mode === 'LIVE' ? (quiz.timeLimitSeconds ? `${quiz.timeLimitSeconds}s timer · Live classroom` : 'Live classroom') : quiz.timeLimitSeconds !== null ? `${Math.round(quiz.timeLimitSeconds / 60)} min · Self-paced` : 'Self Paced'} <i /> {quiz._count?.questions ?? 0} questions <i /> {quiz._count?.attempts ?? 0} attempts</span></button><StatusPill status={quiz.status} /><div className="quiz-row-actions">{onRestart && <button className="icon-button" title="Restart quiz for unsubmitted students (reset to Question 1)" aria-label={`Restart ${quiz.title}`} onClick={() => onRestart(quiz)}><RotateCcw size={15} /></button>}<button className="icon-button" title="Edit quiz" aria-label={`Edit ${quiz.title}`} disabled={quiz.status === 'ACTIVE'} onClick={() => onEdit(quiz)}><Pencil size={15} /></button><button className="icon-button danger-hover" title="Delete quiz" aria-label={`Delete ${quiz.title}`} onClick={() => void remove(quiz)}><Trash2 size={15} /></button></div></article>)}</div>;
}
function StatusPill({ status }: { status: Status }) { return <span className={`status-pill status-${status.toLowerCase()}`}><i />{status === 'ACTIVE' ? 'Live' : status === 'CLOSED' ? 'Finished' : 'Draft'}</span>; }

function QuizManager({ quizzes, selectedQuiz, setSelectedQuiz, liveQuiz, refresh, setNotice, initialOpenAI, teacherName, onNavigateToAISettings, onNavigateToArchive }: { quizzes: Quiz[]; selectedQuiz: string; setSelectedQuiz: (id: string) => void; liveQuiz?: Quiz; refresh: () => Promise<void>; setNotice: (text: string) => void; initialOpenAI?: boolean; teacherName?: string | null; onNavigateToAISettings?: () => void; onNavigateToArchive?: () => void }) {
  const [draft, setDraft] = useState<QuizDraft | null>(null);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAIModal, setShowAIModal] = useState(Boolean(initialOpenAI));
  const [stats, setStats] = useState<LiveStats>({ answered: 0, participants: 0, distribution: [], responses: [] });
  const socketRef = useRef<Socket | null>(null);
  const [liveState, setLiveState] = useState<{ status: Status; currentQuestionIndex: number; currentAnswerRevealed: boolean; questionCount: number; question: Question | null } | null>(null);
  const [liveTimer, setLiveTimer] = useState<LiveTimerState | null>(null);

  const activeQuizzes = quizzes.filter((quiz) => quiz.status !== 'CLOSED');
  const archivedQuizzes = quizzes.filter((quiz) => quiz.status === 'CLOSED');

  useEffect(() => {
    if (!liveQuiz || liveQuiz.mode !== 'LIVE' || liveQuiz.status !== 'ACTIVE') {
      setLiveState(null);
      setLiveTimer(null);
      return;
    }
    const socket = io({ withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('watch:quiz', liveQuiz.id));
    socket.on('quiz:stats', setStats);
    socket.on('quiz:timer', (timerData: LiveTimerState) => setLiveTimer(timerData));
    socket.on('quiz:state', (state: any) => {
      setLiveState(state);
      if (state?.timer !== undefined) setLiveTimer(state.timer);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [liveQuiz?.id, liveQuiz?.status]);

  const [teacherSoundEnabled, setTeacherSoundEnabled] = useState<boolean>(() => isQuizSoundEnabled());
  const teacherWarningSecRef = useRef<number | null>(null);

  useEffect(() => {
    teacherWarningSecRef.current = null;
  }, [liveQuiz?.currentQuestionIndex]);

  useEffect(() => {
    if (!liveQuiz || liveQuiz.mode !== 'LIVE' || liveQuiz.status !== 'ACTIVE' || !liveTimer || !liveTimer.enabled || liveTimer.isPaused) {
      return;
    }
    if (liveTimer.phase === 'question' && liveTimer.remainingSeconds >= 1 && liveTimer.remainingSeconds <= 5) {
      if (teacherWarningSecRef.current !== liveTimer.remainingSeconds) {
        teacherWarningSecRef.current = liveTimer.remainingSeconds;
        playCountdownWarningSound(liveTimer.remainingSeconds, teacherSoundEnabled);
      }
    } else if (liveTimer.phase === 'revealing' || liveTimer.phase === 'gap') {
      if (teacherWarningSecRef.current !== 0) {
        teacherWarningSecRef.current = 0;
        playAnswerRevealChime(teacherSoundEnabled);
      }
    } else if (liveTimer.phase === 'question' && liveTimer.remainingSeconds > 5) {
      teacherWarningSecRef.current = null;
    }
  }, [liveQuiz?.id, liveQuiz?.mode, liveQuiz?.status, liveQuiz?.currentQuestionIndex, liveTimer?.phase, liveTimer?.remainingSeconds, liveTimer?.isPaused, liveTimer?.enabled, teacherSoundEnabled]);

  async function startEdit(quiz?: Quiz) {
    if (!quiz?.id) { setEditingId(''); setDraft(newDraft()); return; }
    try {
      const data = await api<{ quiz: Quiz }>(`/api/quizzes/${quiz.id}/detail`);
      const full = data.quiz;
      setEditingId(full.id);
      setDraft({
        title: full.title,
        grade: full.grade || 'All Grades',
        mode: full.mode,
        hasTimer: full.mode === 'LIVE' ? (full.timeLimitSeconds !== null && full.timeLimitSeconds > 0) : (full.mode === 'SELF_PACED' && full.timeLimitSeconds !== null),
        minutes: Math.max(1, Math.round((full.timeLimitSeconds ?? 1200) / 60)),
        liveTimerSeconds: full.mode === 'LIVE' && full.timeLimitSeconds ? full.timeLimitSeconds : 30,
        showResults: full.showResults,
        questions: full.questions ?? [emptyQuestion()]
      });
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to open this quiz.'); }
  }

  function updateQuestion(index: number, updater: (question: Question) => Question) {
    if (!draft) return;
    setDraft({ ...draft, questions: draft.questions.map((question, questionIndex) => questionIndex === index ? updater(question) : question) });
  }

  async function saveQuiz(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const body = {
        title: draft.title,
        grade: draft.grade && draft.grade !== 'All Grades' ? draft.grade : null,
        mode: draft.mode,
        timeLimitSeconds: draft.mode === 'LIVE'
          ? (draft.hasTimer ? (draft.liveTimerSeconds || 30) : null)
          : (draft.hasTimer ? Math.max(60, draft.minutes * 60) : null),
        showResults: draft.showResults,
        questions: draft.questions
      };
      await api(editingId ? `/api/quizzes/${editingId}` : '/api/quizzes', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
      setDraft(null); setNotice(editingId ? 'Quiz updated.' : 'Quiz created.'); await refresh();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to save quiz.'); }
    finally { setSaving(false); }
  }

  async function control(action: 'start' | 'next' | 'reveal' | 'stop' | 'pause_timer' | 'resume_timer' | 'set_timer' | 'add_time', quizId?: string, seconds?: number) {
    unlockAudio();
    const targetQuiz = quizId ? quizzes.find((q) => q.id === quizId) : liveQuiz;
    if (!targetQuiz) return;
    try {
      if (action === 'reveal') {
        setLiveState((prev) => prev ? { ...prev, currentAnswerRevealed: true } : prev);
      } else if (action === 'next') {
        setLiveState((prev) => prev ? { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1, currentAnswerRevealed: false } : prev);
      }
      await api(`/api/quizzes/${targetQuiz.id}/control`, { method: 'PATCH', body: JSON.stringify({ action, seconds }) });
      if (action === 'stop') {
        setSelectedQuiz('');
        setLiveTimer(null);
        setNotice(`✓ "${targetQuiz.title}" finished and safely moved to Archive.`);
      } else if (action === 'start') {
        setSelectedQuiz(targetQuiz.id);
        setNotice(`🚀 "${targetQuiz.title}" is now LIVE! Classroom monitor active.`);
      }
      await refresh();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to update this quiz.'); }
  }

  async function setTimedStatus(quiz: Quiz, action: 'start' | 'stop') {
    try {
      await api(`/api/quizzes/${quiz.id}/status`, { method: 'PATCH', body: JSON.stringify({ action }) });
      if (action === 'stop') {
        setSelectedQuiz('');
        setNotice(`✓ "${quiz.title}" practice quiz closed and safely moved to Archive.`);
      } else {
        setSelectedQuiz(quiz.id);
        setNotice(`🚀 "${quiz.title}" practice quiz is now open.`);
      }
      await refresh();
    }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to update this quiz.'); }
  }

  async function restartQuiz(quiz: Quiz) {
    if (!window.confirm(`Restart "${quiz.title}" for students who have not submitted? Completed student submissions will remain saved.`)) return;
    try {
      await api(`/api/quizzes/${quiz.id}/restart`, { method: 'POST' });
      setNotice(`"${quiz.title}" restarted for unsubmitted students.`);
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to restart quiz.');
    }
  }

  function handleAIGenerated(result: { title: string; mode: Mode; hasTimer?: boolean; minutes?: number; liveTimerSeconds?: number | null; questions: Question[]; grade?: string }) {
    setEditingId('');
    setDraft({
      title: result.title,
      grade: result.grade || getDefaultGrade(),
      mode: result.mode,
      hasTimer: result.hasTimer ?? false,
      minutes: result.minutes ?? 20,
      liveTimerSeconds: result.liveTimerSeconds ?? 30,
      showResults: true,
      questions: result.questions,
    });
    setShowAIModal(false);
    setNotice(`✨ AI Quiz generated for ${result.grade || getDefaultGrade()} with NEP 2026 alignment! Review and save below.`);
  }

  if (draft) return <section className="view-enter"><div className="page-heading compact-heading"><div><button className="back-link" onClick={() => setDraft(null)}><ArrowLeft size={15} /> All quizzes</button><h1>{editingId ? 'Edit your quiz' : 'Build a quiz'}</h1><p>Keep each question clear and focused.</p></div><button className="button button-primary" onClick={(event) => void saveQuiz(event as unknown as React.FormEvent)} disabled={saving}>{saving ? 'Saving...' : <><Check size={16} /> Save quiz</>}</button></div>
    <form className="editor-layout" onSubmit={saveQuiz}>
      <div className="editor-main">
        <div className="form-panel"><div className="panel-title"><span className="step-count">01</span><div><h2>Quiz details</h2><p>Give your quiz a name and select target grade.</p></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}><label className="field"><span>Quiz title</span><input required maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Fractions, round one" /></label><label className="field"><span>Target Grade</span><select value={draft.grade || getDefaultGrade()} onChange={(event) => setDraft({ ...draft, grade: event.target.value })} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', width: '100%' }}><option value="All Grades">All Grades (Open to all students)</option>{getActiveGrades().length > 0 && (<optgroup label="Active Classes">{getActiveGrades().map((g) => (<option key={g} value={g}>{g}</option>))}</optgroup>)}{ALL_STUDENT_GRADES.filter((g) => !getActiveGrades().includes(g)).length > 0 && (<optgroup label="Other Classes">{ALL_STUDENT_GRADES.filter((g) => !getActiveGrades().includes(g)).map((g) => (<option key={g} value={g}>{g}</option>))}</optgroup>)}</select></label></div><div className="field"><span>How will students take it?</span><div className="mode-choice"><button type="button" className={draft.mode === 'LIVE' ? 'chosen' : ''} onClick={() => setDraft({ ...draft, mode: 'LIVE' })}><Radio size={18} /><span><strong>Live classroom</strong></span>{draft.mode === 'LIVE' && <Check size={16} />}</button><button type="button" className={draft.mode === 'SELF_PACED' && draft.hasTimer ? 'chosen' : ''} onClick={() => setDraft({ ...draft, mode: 'SELF_PACED', hasTimer: true })}><Clock3 size={18} /><span><strong>Timed practice</strong></span>{draft.mode === 'SELF_PACED' && draft.hasTimer && <Check size={16} />}</button><button type="button" className={draft.mode === 'SELF_PACED' && !draft.hasTimer ? 'chosen' : ''} onClick={() => setDraft({ ...draft, mode: 'SELF_PACED', hasTimer: false })}><BookOpenCheck size={18} /><span><strong>Self Paced</strong></span>{draft.mode === 'SELF_PACED' && !draft.hasTimer && <Check size={16} />}</button></div></div>{draft.mode === 'LIVE' && (
          <div style={{ marginTop: '16px', padding: '14px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: '#1e293b' }}>
                <Clock3 size={17} color="#0284c7" /> Per-Question Timer (Auto-Reveal & Advance)
              </span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: draft.hasTimer ? '#0284c7' : '#64748b' }}>
                <input
                  type="checkbox"
                  checked={draft.hasTimer}
                  onChange={(event) => setDraft({ ...draft, hasTimer: event.target.checked, liveTimerSeconds: draft.liveTimerSeconds || 30 })}
                />
                <span>{draft.hasTimer ? 'Timer Active ✓' : 'Manual Pace (No timer)'}</span>
              </label>
            </div>
            {draft.hasTimer && (
              <div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {[15, 20, 30, 45, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`button button-quiet ${draft.liveTimerSeconds === sec ? 'active-pill' : ''}`}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: draft.liveTimerSeconds === sec ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: draft.liveTimerSeconds === sec ? '#e0f2fe' : '#ffffff',
                        color: draft.liveTimerSeconds === sec ? '#0369a1' : '#475569',
                      }}
                      onClick={() => setDraft({ ...draft, liveTimerSeconds: sec })}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <div className="input-suffix" style={{ maxWidth: '180px' }}>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={draft.liveTimerSeconds || 30}
                    onChange={(event) => setDraft({ ...draft, liveTimerSeconds: Math.max(5, Math.min(300, Number(event.target.value))) })}
                  />
                  <span>seconds</span>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  ⏱ Each question will automatically reveal the answer after the timer finishes, pause for 2-3 seconds, and advance to the next question. You can pause or adjust the timer anytime during class.
                </p>
              </div>
            )}
          </div>
        )}{draft.mode === 'SELF_PACED' && draft.hasTimer && <label className="field short-field" style={{ marginTop: '16px' }}><span>Time limit</span><div className="input-suffix"><input type="number" min={1} max={1440} value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: Number(event.target.value) })} /><span>minutes</span></div></label>}<label className="check-row"><input type="checkbox" checked={draft.showResults} onChange={(event) => setDraft({ ...draft, showResults: event.target.checked })} /><span><strong>Show results to students</strong></span></label></div>
        {draft.questions.map((question, index) => <div className="form-panel question-editor" key={index}>
          <div className="panel-title">
            <span className="step-count">{String(index + 2).padStart(2, '0')}</span>
            <div>
              <h2>Question {index + 1}</h2>
              <p>Write prompt and set multiple choice options.</p>
            </div>
            {draft.questions.length > 1 && (
              <button
                type="button"
                className="icon-button danger-hover panel-remove"
                title="Remove question"
                onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, questionIndex) => questionIndex !== index) })}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <label className="field">
            <span>Question Prompt</span>
            <textarea
              required
              maxLength={1000}
              rows={2}
              value={question.prompt}
              onChange={(event) => updateQuestion(index, (value) => ({ ...value, prompt: event.target.value }))}
              placeholder="Write a question..."
            />
          </label>

          <div className="options-heading">
            <span>Answer options</span>
            <span>Mark correct answer</span>
          </div>
          <div className="option-editor-list">
            {question.options.map((option, optionIndex) => (
              <div className={`option-editor ${option.isCorrect ? 'correct-option' : ''}`} key={optionIndex}>
                <button
                  type="button"
                  className={`correct-radio ${option.isCorrect ? 'checked' : ''}`}
                  aria-label={`Mark option ${optionIndex + 1} as correct`}
                  onClick={() => updateQuestion(index, (value) => ({ ...value, options: value.options.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === optionIndex })) }))}
                >
                  {option.isCorrect && <Check size={12} />}
                </button>
                <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                <input
                  required
                  maxLength={300}
                  value={option.text}
                  onChange={(event) => updateQuestion(index, (value) => ({ ...value, options: value.options.map((item, itemIndex) => itemIndex === optionIndex ? { ...item, text: event.target.value } : item) }))}
                  placeholder={`Option ${optionIndex + 1}`}
                />
                {question.options.length > 2 && (
                  <button
                    type="button"
                    className="mini-icon"
                    aria-label="Remove option"
                    onClick={() => updateQuestion(index, (value) => ({ ...value, options: value.options.filter((_, itemIndex) => itemIndex !== optionIndex).map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === 0 ? item.isCorrect || !value.options.some((entry) => entry.isCorrect) : item.isCorrect })) }))}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="question-footer">
            <button
              type="button"
              className="text-button add-option"
              disabled={question.options.length >= 8}
              onClick={() => updateQuestion(index, (value) => ({ ...value, options: [...value.options, { text: '', isCorrect: false }] }))}
            >
              <Plus size={14} /> Add option
            </button>
            <label className="marks-field">
              Points <input type="number" min={1} max={100} value={question.marks} onChange={(event) => updateQuestion(index, (value) => ({ ...value, marks: Number(event.target.value) }))} />
            </label>
          </div>
        </div>)}
        <button type="button" className="add-question" onClick={() => setDraft({ ...draft, questions: [...draft.questions, emptyQuestion()] })}><span><Plus size={16} /></span> Add another question</button>
      </div>
      <aside className="editor-aside"><div className="aside-note"><span><CircleHelp size={17} /></span><strong>A clear question goes a long way.</strong><p>Keep wording simple, and use answer options that are easy to scan on a phone.</p></div><div className="summary-box"><span className="overline">Quiz summary</span><div><BookOpenCheck size={15} /> {draft.questions.length} question{draft.questions.length === 1 ? '' : 's'}</div><div>{draft.mode === 'LIVE' ? <Radio size={15} /> : <Clock3 size={15} />} {draft.mode === 'LIVE' ? 'Live classroom' : `${draft.minutes} minute timer`}</div></div></aside>
    </form>
  </section>;

  if (showAIModal) {
    return (
      <section className="view-enter">
        <div className="page-heading compact-heading">
          <div>
            <button className="back-link" onClick={() => setShowAIModal(false)}>
              <ArrowLeft size={15} /> All quizzes
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span className="ai-badge"><Sparkles size={15} /> AI Quiz Generator</span>
            </div>
            <h1 style={{ marginTop: '4px' }}>Generate Quiz</h1>
          </div>
        </div>

        <div className="ai-page-card">
          <AIQuizModal onClose={() => setShowAIModal(false)} onGenerated={handleAIGenerated} onNavigateToAISettings={onNavigateToAISettings} />
        </div>
      </section>
    );
  }

  return (
    <section className="view-enter">
      <div className="page-heading">
        <div>
          <span className="overline">Quizzes & Worksheets</span>
          <h1>Quizzes and Worksheets</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="button button-primary" onClick={() => setShowAIModal(true)}>
            <Sparkles size={17} /> Generate with AI
          </button>
          <button className="button button-secondary" onClick={() => void startEdit()}>
            <Plus size={17} /> Create manually
          </button>
          {onNavigateToArchive && (
            <button className="button button-secondary" onClick={onNavigateToArchive}>
              <Archive size={16} /> View Archive
            </button>
          )}
        </div>
      </div>

      {liveQuiz && liveQuiz.status === 'ACTIVE' && (
        <div className="live-panel live-panel-fullwidth" style={{ marginBottom: '24px' }}>
          <div className="live-panel-head">
            <span className="overline">Classroom monitor · {liveQuiz.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="live-indicator">
                {liveQuiz.status === 'ACTIVE' && liveQuiz.mode === 'LIVE' ? <><i /> Live now</> : 'Ready when you are'}
              </span>
              <button
                className="icon-button quiet"
                title="Close monitor"
                onClick={() => setSelectedQuiz('')}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {liveQuiz.mode === 'LIVE' ? (
            <>
              {/* Live Classroom Interactive Timer Controller Bar */}
              <div
                className="live-timer-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '12px 18px',
                  margin: '6px 0 16px',
                  background: liveTimer?.phase === 'gap'
                    ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
                    : liveTimer?.isPaused
                      ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                      : (liveTimer && liveTimer.enabled)
                        ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                        : '#f8fafc',
                  border: liveTimer?.phase === 'gap'
                    ? '2px solid #34d399'
                    : liveTimer?.isPaused
                      ? '2px solid #f59e0b'
                      : (liveTimer && liveTimer.enabled)
                        ? '2px solid #38bdf8'
                        : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {liveTimer && liveTimer.enabled ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: (liveTimer.phase === 'gap' || liveTimer.phase === 'revealing') ? '#10b981' : liveTimer.isPaused ? '#f59e0b' : '#0284c7',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          fontWeight: 800,
                          fontSize: '15px',
                        }}
                      >
                        {liveTimer.phase === 'gap' || liveTimer.phase === 'revealing' ? (
                          <Check size={20} />
                        ) : liveTimer.isPaused ? (
                          <Pause size={18} />
                        ) : (
                          <Clock3 size={18} />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '19px', fontWeight: 800, color: liveTimer.isPaused ? '#b45309' : (liveTimer.phase === 'gap' ? '#047857' : '#0f172a') }}>
                            {liveTimer.phase === 'gap'
                              ? `Next Question in ${Math.max(1, liveTimer.gapRemainingSeconds)}s`
                              : liveTimer.phase === 'revealing'
                                ? 'Revealing Answer to Students...'
                                : liveTimer.phase === 'advancing'
                                  ? 'Loading Next Question...'
                                  : `${Math.max(0, liveTimer.remainingSeconds)}s remaining`}
                          </span>
                          {liveTimer.isPaused ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                letterSpacing: '0.5px',
                              }}
                            >
                              PAUSED
                            </span>
                          ) : liveTimer.phase === 'gap' ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#d1fae5',
                                color: '#065f46',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              GAP (ANSWER REVEALED)
                            </span>
                          ) : liveTimer.phase === 'revealing' ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                              }}
                            >
                              REVEALING ANSWER...
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                              }}
                            >
                              AUTO REVEAL ({liveTimer.durationSeconds}s)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {liveTimer.phase === 'gap'
                            ? `Answer is revealed on student screens. Advancing automatically in ${Math.max(1, liveTimer.gapRemainingSeconds)}s.`
                            : liveTimer.phase === 'revealing'
                              ? 'Time expired. Syncing answer reveal to all student screens...'
                              : liveTimer.phase === 'advancing'
                                ? 'Advancing to the next question...'
                                : liveTimer.isPaused
                                  ? 'Timer is paused. Students have unlimited time until you resume.'
                                  : 'Reveals answer automatically when timer expires, pauses 2-3s, and advances.'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Clock3 size={20} color="#64748b" />
                      <div>
                        <strong style={{ fontSize: '14px', color: '#334155' }}>Manual Pace (No Timer)</strong>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                          You control question reveals manually. Or enable an automated timer below:
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {liveTimer && liveTimer.enabled ? (
                    <>
                      {liveTimer.isPaused ? (
                        <button
                          type="button"
                          className="button button-primary"
                          style={{
                            background: '#10b981',
                            borderColor: '#059669',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: 700,
                            gap: '6px',
                          }}
                          title="Resume timer countdown"
                          onClick={() => void control('resume_timer')}
                        >
                          <Play size={15} /> Resume Timer
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{
                            background: '#fef3c7',
                            borderColor: '#f59e0b',
                            color: '#b45309',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: 700,
                            gap: '6px',
                          }}
                          title="Pause timer on this question"
                          onClick={() => void control('pause_timer')}
                        >
                          <Pause size={15} /> Pause Timer
                        </button>
                      )}

                      {liveTimer.phase === 'question' && (
                        <button
                          type="button"
                          className="button button-quiet"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                          }}
                          title="Add 10 extra seconds to this question"
                          onClick={() => void control('add_time', undefined, 10)}
                        >
                          +10s
                        </button>
                      )}

                      <select
                        value={liveTimer.durationSeconds || 30}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          void control('set_timer', undefined, val);
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                        title="Change timer duration in seconds"
                      >
                        <option value={15}>15 seconds</option>
                        <option value={20}>20 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={45}>45 seconds</option>
                        <option value={60}>60 seconds</option>
                        <option value={90}>90 seconds</option>
                      </select>
                      <button
                        type="button"
                        className="button button-quiet"
                        style={{
                          padding: '6px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: teacherSoundEnabled ? '#047857' : '#64748b',
                          background: teacherSoundEnabled ? '#ecfdf5' : '#ffffff',
                          border: teacherSoundEnabled ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                        }}
                        title={teacherSoundEnabled ? '5-second countdown warning sound is ON. Click to mute.' : '5-second countdown warning sound is OFF. Click to unmute.'}
                        onClick={() => {
                          unlockAudio();
                          const next = !teacherSoundEnabled;
                          setTeacherSoundEnabled(next);
                          setQuizSoundEnabled(next);
                          if (next) {
                            playTestSound();
                          }
                        }}
                      >
                        {teacherSoundEnabled ? <Volume2 size={14} color="#059669" /> : <VolumeX size={14} color="#94a3b8" />}
                        <span>{teacherSoundEnabled ? 'Sound ON' : 'Muted'}</span>
                      </button>

                      {teacherSoundEnabled && (
                        <button
                          type="button"
                          className="button button-quiet"
                          style={{
                            padding: '6px 8px',
                            fontSize: '11px',
                            color: '#059669',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                          }}
                          title="Click to test countdown bell sound"
                          onClick={() => {
                            unlockAudio();
                            playTestSound();
                          }}
                        >
                          Test Sound
                        </button>
                      )}

                      <button
                        type="button"
                        className="button button-quiet"
                        style={{ padding: '6px 10px', fontSize: '12px', color: '#64748b' }}
                        title="Turn off automatic timer and use manual pace"
                        onClick={() => void control('set_timer', undefined, 0)}
                      >
                        Turn Off
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {[15, 20, 30, 45, 60].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          className="button button-secondary"
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}
                          onClick={() => void control('set_timer', undefined, sec)}
                        >
                          Start {sec}s Timer
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="monitor-question">
                <div className="monitor-question-meta">
                  <span>
                    QUESTION {String((liveState?.currentQuestionIndex ?? liveQuiz.currentQuestionIndex) + 1).padStart(2, '0')}{' '}
                    <span>/ {liveState?.questionCount ?? liveQuiz._count?.questions ?? 0}</span>
                  </span>
                  <span className="answer-counter">
                    <Users size={14} /> {stats.answered} answered
                  </span>
                </div>
                <h3>
                  {liveState?.question?.prompt ??
                    liveQuiz.questions?.[liveQuiz.currentQuestionIndex]?.prompt ??
                    'Loading question...'}
                </h3>
              </div>
              <div className="teacher-options-list">
                {(liveState?.question?.options ?? liveQuiz.questions?.[liveQuiz.currentQuestionIndex]?.options ?? []).map(
                  (option, index) => {
                    const count = stats.distribution.find((entry) => entry.optionId === option.id)?.count ?? 0;
                    const total = stats.answered;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    const isCorrectOption = Boolean(option.isCorrect);
                    return (
                      <div
                        className={`teacher-option-card ${liveState?.currentAnswerRevealed && isCorrectOption ? 'is-correct' : ''}`}
                        key={option.id ?? index}
                      >
                        <div className="teacher-option-header">
                          <span className="student-option-letter">{String.fromCharCode(65 + index)}</span>
                          <span className="teacher-option-text">{option.text}</span>
                          <span className="teacher-option-count">
                            {count} ({percent}%)
                          </span>
                          {liveState?.currentAnswerRevealed && isCorrectOption && (
                            <span className="correct-label">
                              <Check size={14} /> Correct
                            </span>
                          )}
                        </div>
                        <div className="teacher-bar-track">
                          <div className="teacher-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  }
                )}
                {stats.responses.length > 0 && (
                  <div className="live-responses">
                    <span className="live-responses-title">Student responses</span>
                    {[...stats.responses]
                      .reverse()
                      .slice(0, 6)
                      .map((response, index) => (
                        <div className="live-response" key={`${response.name}-${index}`}>
                          <strong>{response.name}</strong>
                          <span>{response.text}</span>
                        </div>
                      ))}
                  </div>
                )}
                {liveState?.currentAnswerRevealed && (
                  <div className="reveal-note">
                    <CheckCircle2 size={16} /> Correct answer is revealed on student screens
                  </div>
                )}
              </div>
              <div className="monitor-actions">
                <button
                  className="button button-primary"
                  onClick={() => void control(liveState?.currentAnswerRevealed ? 'next' : 'reveal')}
                >
                  {liveState?.currentAnswerRevealed ? (
                    <>
                      <ArrowRight size={17} /> Next question
                    </>
                  ) : (
                    <>
                      <Eye size={17} /> Reveal answer
                    </>
                  )}
                </button>
                <button className="button button-quiet" onClick={() => void control('stop')}>
                  <X size={17} /> End quiz
                </button>
                <button className="button button-quiet" title="Restart quiz for students who have not submitted" onClick={() => void restartQuiz(liveQuiz)}>
                  <RotateCcw size={16} /> Restart quiz
                </button>
                <button
                  type="button"
                  className="button button-quiet"
                  style={{ color: '#047857', background: '#ecfdf5', borderColor: '#a7f3d0' }}
                  title="Share live quiz announcement with parents on WhatsApp"
                  onClick={() => {
                    const text = generateQuizAnnouncementMessage({
                      quizTitle: liveQuiz.title,
                      grade: liveQuiz.grade,
                      mode: liveQuiz.mode,
                      questionCount: liveQuiz._count?.questions ?? (liveQuiz.questions?.length || 0),
                      timeMinutes: liveQuiz.mode === 'LIVE' ? null : (liveQuiz.timeLimitSeconds ? Math.round(liveQuiz.timeLimitSeconds / 60) : null),
                      teacherName,
                    });
                    openWhatsAppChat(null, text);
                  }}
                >
                  <MessageCircle size={15} color="#059669" /> WhatsApp
                </button>
              </div>
            </>
          ) : (
            <div className="timed-monitor">
              <div className="timed-icon">
                {liveQuiz.timeLimitSeconds !== null ? <Clock3 size={24} /> : <BookOpenCheck size={24} />}
              </div>
              <h3>{liveQuiz.title}</h3>
              <p>
                {liveQuiz.timeLimitSeconds !== null
                  ? `${Math.round((liveQuiz.timeLimitSeconds ?? 0) / 60)} minutes`
                  : 'Self-Paced (No time limit)'} · {liveQuiz._count?.questions ?? 0} questions
              </p>
              <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                <button className="button button-quiet" style={{ flex: 1 }} onClick={() => void setTimedStatus(liveQuiz, 'stop')}>
                  <X size={16} /> Close quiz
                </button>
                <button className="button button-secondary" title="Restart quiz for students who have not submitted" onClick={() => void restartQuiz(liveQuiz)}>
                  <RotateCcw size={16} /> Restart
                </button>
              </div>
              <button
                className="text-button monitor-results"
                onClick={() => document.dispatchEvent(new CustomEvent('open-results', { detail: liveQuiz.id }))}
              >
                View student results <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {activeQuizzes.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '120px', padding: '24px 20px' }}>
          <span className="empty-icon" style={{ width: '38px', height: '38px', marginBottom: '6px' }}>
            <Sparkles size={20} color="#0284c7" />
          </span>
          <h3 style={{ fontSize: '16px', margin: '0 0 8px' }}>No Active or Draft Quizzes.</h3>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13.5px' }}>
            {archivedQuizzes.length > 0 ? 'All finished quizzes are safely preserved in your Archive.' : 'Create a quiz manually or generate one instantly with AI.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="button button-primary" style={{ minHeight: '38px', fontSize: '14px', padding: '0 16px' }} onClick={() => setShowAIModal(true)}>
              <Sparkles size={15} /> Generate with AI
            </button>
            <button className="button button-secondary" style={{ minHeight: '38px', fontSize: '14px', padding: '0 16px' }} onClick={() => void startEdit()}>
              <Plus size={15} /> Create manually
            </button>
            {onNavigateToArchive && (
              <button className="button button-secondary" style={{ minHeight: '38px', fontSize: '14px', padding: '0 16px' }} onClick={onNavigateToArchive}>
                <Archive size={15} /> View Archive
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="worksheet-grid">
          {activeQuizzes.map((quiz) => (
            <div className="worksheet-card" key={quiz.id} style={{ border: selectedQuiz === quiz.id ? '2px solid #0284c7' : undefined }}>
              <div>
                <div className="worksheet-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span className={`worksheet-badge ${quiz.status === 'ACTIVE' ? 'badge-published' : quiz.status === 'CLOSED' ? 'badge-subject' : 'badge-draft'}`} style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {quiz.status === 'ACTIVE' ? '● LIVE NOW' : quiz.status === 'CLOSED' ? '✓ FINISHED' : 'DRAFT'}
                  </span>
                  <span className="worksheet-badge badge-grade" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 600, padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {quiz.grade || 'All Grades'}
                  </span>
                  <select
                    className={`worksheet-badge ${quiz.mode === 'LIVE' ? 'badge-subject' : 'badge-draft'}`}
                    style={{ border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', outline: 'none', padding: '3px 8px', borderRadius: '8px', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}
                    value={quiz.mode === 'LIVE' ? 'LIVE' : (quiz.timeLimitSeconds !== null ? 'TIMED' : 'SELF_PACED')}
                    onChange={async (e) => {
                      const val = e.target.value;
                      let newMode: Mode = 'SELF_PACED';
                      let newTime: number | null = null;
                      if (val === 'LIVE') {
                        newMode = 'LIVE';
                        newTime = null;
                      } else if (val === 'TIMED') {
                        newMode = 'SELF_PACED';
                        newTime = quiz.timeLimitSeconds ?? 1200;
                      } else {
                        newMode = 'SELF_PACED';
                        newTime = null;
                      }
                      try {
                        await api(`/api/quizzes/${quiz.id}/mode`, { method: 'PATCH', body: JSON.stringify({ mode: newMode, timeLimitSeconds: newTime }) });
                        setNotice(`Mode changed for "${quiz.title}"`);
                        await refresh();
                      } catch (cause) {
                        setNotice(cause instanceof Error ? cause.message : 'Unable to update mode');
                      }
                    }}
                  >
                    <option value="LIVE">LIVE CLASSROOM</option>
                    <option value="TIMED">TIME PACED</option>
                    <option value="SELF_PACED">SELF PACED</option>
                  </select>
                </div>
                <h3>{quiz.title}</h3>
                <div className="worksheet-card-stats">
                  <span>Questions: <strong>{quiz._count?.questions ?? 0}</strong></span>
                  <span>Attempts: <strong>{quiz._count?.attempts ?? 0}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {quiz.status === 'ACTIVE' ? (
                    <button
                      className="button button-primary"
                      style={{ fontSize: '12.5px', padding: '6px 10px', flex: 1, background: '#0284c7' }}
                      title="View live classroom monitor for this quiz"
                      onClick={() => setSelectedQuiz(quiz.id)}
                    >
                      <Radio size={13} /> {selectedQuiz === quiz.id ? 'Monitoring Live' : 'Open Monitor'}
                    </button>
                  ) : (
                    <button
                      className="button button-primary"
                      style={{ fontSize: '12.5px', padding: '6px 10px', flex: 1 }}
                      title={quiz.mode === 'LIVE' ? 'Start live classroom quiz' : 'Open practice quiz for students'}
                      onClick={() => {
                        if (quiz.mode === 'LIVE') {
                          void control('start', quiz.id);
                        } else {
                          void setTimedStatus(quiz, 'start');
                        }
                      }}
                    >
                      {quiz.mode === 'LIVE' ? <Radio size={13} /> : <BookOpenCheck size={13} />} {quiz.mode === 'LIVE' ? 'Start Live Quiz' : 'Open Practice Quiz'}
                    </button>
                  )}
                  <button
                    className="button button-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 10px' }}
                    title="Edit Quiz"
                    disabled={quiz.status === 'ACTIVE'}
                    onClick={() => void startEdit(quiz)}
                  >
                    <Pencil size={13} /> Edit Studio
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', width: '100%' }}>
                  <button
                    className="button button-secondary"
                    style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', whiteSpace: 'nowrap' }}
                    title="View Student Results"
                    onClick={() => {
                      setSelectedQuiz(quiz.id);
                      document.dispatchEvent(new CustomEvent('open-results', { detail: quiz.id }));
                    }}
                  >
                    <BarChart3 size={13} /> Results ({quiz._count?.attempts ?? 0})
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5', whiteSpace: 'nowrap' }}
                    title="Share quiz announcement with parents on WhatsApp"
                    onClick={() => {
                      const text = generateQuizAnnouncementMessage({
                        quizTitle: quiz.title,
                        grade: quiz.grade,
                        mode: quiz.mode,
                        questionCount: quiz._count?.questions ?? (quiz.questions?.length || 0),
                        timeMinutes: quiz.mode === 'LIVE' ? null : (quiz.timeLimitSeconds ? Math.round(quiz.timeLimitSeconds / 60) : null),
                        teacherName,
                      });
                      openWhatsAppChat(null, text);
                    }}
                  >
                    <MessageCircle size={13} color="#059669" /> WhatsApp
                  </button>

                  {quiz.status === 'ACTIVE' && (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5', whiteSpace: 'nowrap' }}
                      title="Finish quiz and move to Archive"
                      onClick={async () => {
                        if (!window.confirm(`Mark "${quiz.title}" as Finished? It will be moved to the Archive and student attempts will be finalized.`)) return;
                        try {
                          await api(`/api/quizzes/${quiz.id}/status`, { method: 'PATCH', body: JSON.stringify({ action: 'stop' }) });
                          setNotice(`✓ "${quiz.title}" marked finished and moved to Archive.`);
                          await refresh();
                        } catch (err) {
                          setNotice(err instanceof Error ? err.message : 'Unable to mark quiz finished');
                        }
                      }}
                    >
                      <CheckCircle2 size={13} color="#047857" /> Mark Finished
                    </button>
                  )}

                  <button
                    className="icon-button danger-hover"
                    title="Delete Quiz"
                    style={{ padding: '6px 8px', height: '30px', minWidth: '32px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={async () => {
                      if (!window.confirm(`Delete "${quiz.title}" and all its results?`)) return;
                      try {
                        await api(`/api/quizzes/${quiz.id}`, { method: 'DELETE' });
                        setNotice('Quiz deleted.');
                        await refresh();
                      } catch (cause) {
                        setNotice(cause instanceof Error ? cause.message : 'Unable to delete quiz');
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ==========================================================================
   TEACHER ARCHIVE PANEL & QUIZ PREVIEW MODAL
   ========================================================================== */

function ArchivedQuizPreviewModal({
  quiz,
  fullData,
  loading,
  onClose,
  onOpenResults,
}: {
  quiz: Quiz;
  fullData: Quiz | null;
  loading: boolean;
  onClose: () => void;
  onOpenResults: (quizId: string) => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge-finished worksheet-badge">✓ ARCHIVED QUIZ</span>
              <span className="worksheet-badge badge-grade" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                {quiz.grade || 'All Grades'}
              </span>
              <span className="worksheet-badge badge-subject">
                {quiz.mode === 'LIVE' ? 'LIVE CLASSROOM' : quiz.timeLimitSeconds !== null ? 'TIME PACED' : 'SELF PACED'}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{quiz.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title="Close"><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
              <div>Loading quiz questions...</div>
            </div>
          ) : !fullData || !fullData.questions || fullData.questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              No questions recorded for this quiz.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 16px', borderRadius: '10px', fontSize: '13.5px', color: '#475569' }}>
                <span>Total Questions: <strong>{fullData.questions.length}</strong></span>
                <span>Total Marks: <strong>{fullData.questions.reduce((sum, q) => sum + (q.marks ?? 1), 0)}</strong></span>
                <span>Recorded Attempts: <strong>{quiz._count?.attempts ?? 0}</strong></span>
              </div>

              {fullData.questions.map((q, idx) => (
                <div key={q.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 18px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '14px' }}>Question {idx + 1}</span>
                      <QuestionTypeBadge type={q.type} />
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                      {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#0f172a', lineHeight: 1.45 }}>
                    {q.prompt}
                  </p>

                  {q.imageUrl && (
                    <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', maxHeight: '200px' }}>
                      <img src={q.imageUrl} alt="Question diagram" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={opt.id || optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: opt.isCorrect ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                          background: opt.isCorrect ? '#f0fdf4' : '#fafafa',
                          fontSize: '13.5px',
                          color: opt.isCorrect ? '#15803d' : '#334155',
                          fontWeight: opt.isCorrect ? 600 : 400,
                        }}
                      >
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: opt.isCorrect ? '#22c55e' : '#e2e8f0', color: opt.isCorrect ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span style={{ flex: 1 }}>{opt.text}</span>
                        {opt.isCorrect && <Check size={14} color="#15803d" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="button button-primary"
            style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => {
              onClose();
              onOpenResults(quiz.id);
            }}
          >
            <BarChart3 size={14} /> View Student Results ({quiz._count?.attempts ?? 0})
          </button>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherArchivePanel({
  quizzes,
  worksheets,
  refresh,
  setNotice,
  onOpenResults,
  onOpenInLiveCanvas,
}: {
  quizzes: Quiz[];
  worksheets: WorksheetPaper[];
  refresh: () => Promise<void>;
  setNotice: (text: string) => void;
  onOpenResults: (quizId: string) => void;
  onOpenInLiveCanvas?: (lesson: { title: string; content: string; grade?: string | null; subject?: string | null }) => void;
}) {
  const [filterType, setFilterType] = useState<'all' | 'quizzes' | 'worksheets'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [viewingPaper, setViewingPaper] = useState<WorksheetPaper | null>(null);
  const [checkingSubmissions, setCheckingSubmissions] = useState<WorksheetPaper | null>(null);
  const [previewingQuiz, setPreviewingQuiz] = useState<Quiz | null>(null);
  const [previewQuizLoading, setPreviewQuizLoading] = useState(false);
  const [fullQuizData, setFullQuizData] = useState<Quiz | null>(null);

  async function handleOpenQuizInCanvas(quiz: Quiz) {
    try {
      const data = await api<{ quiz: Quiz & { questions?: any[] } }>(`/api/quizzes/${quiz.id}/detail`);
      const qList = data.quiz?.questions || [];
      let doc = `# Quiz Review: ${quiz.title}\n\n`;
      doc += `**Grade:** ${quiz.grade || 'All Grades'} • **Mode:** ${quiz.mode}\n\n`;
      doc += `## Question Bank & Solutions\n\n`;
      qList.forEach((q: any, i: number) => {
        doc += `### Q${i + 1}. ${q.text || q.questionText || 'Question'}\n`;
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: any) => {
            doc += `- ${opt.isCorrect ? '✅ ' : '• '}${opt.text}\n`;
          });
        }
        if (q.explanation) {
          doc += `\n*Explanation:* ${q.explanation}\n`;
        }
        doc += `\n`;
      });
      onOpenInLiveCanvas?.({
        title: `Quiz Review: ${quiz.title}`,
        content: doc,
        grade: quiz.grade || undefined,
        subject: 'Mathematics',
      });
    } catch {
      onOpenInLiveCanvas?.({
        title: `Quiz: ${quiz.title}`,
        content: `# Quiz: ${quiz.title}\n\nGrade: ${quiz.grade || 'All Grades'}`,
        grade: quiz.grade || undefined,
        subject: 'Mathematics',
      });
    }
  }

  const archivedQuizzes = quizzes.filter((q) => q.status === 'CLOSED');
  const archivedWorksheets = worksheets.filter((w) => w.status === 'ARCHIVED');

  const filteredQuizzes = archivedQuizzes.filter((q) => {
    const matchesSearch = !searchQuery.trim() || q.title.toLowerCase().includes(searchQuery.toLowerCase()) || (q.grade || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || q.grade === gradeFilter || (gradeFilter === 'All Grades' && (!q.grade || q.grade === 'All Grades'));
    return matchesSearch && matchesGrade;
  });

  const filteredWorksheets = archivedWorksheets.filter((w) => {
    const matchesSearch = !searchQuery.trim() || w.title.toLowerCase().includes(searchQuery.toLowerCase()) || (w.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) || (w.grade || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || w.grade === gradeFilter || (gradeFilter === 'All Grades' && (!w.grade || w.grade === 'All Grades'));
    return matchesSearch && matchesGrade;
  });

  const totalArchivedCount = archivedQuizzes.length + archivedWorksheets.length;
  const totalSubmissionsAndAttempts = archivedQuizzes.reduce((sum, q) => sum + (q._count?.attempts ?? 0), 0) + archivedWorksheets.reduce((sum, w) => sum + (w._count?.submissions ?? 0), 0);

  async function handleReopenQuiz(quiz: Quiz) {
    if (!window.confirm(`Re-open "${quiz.title}"? This will restore it back to Quizzes and Worksheets in Draft mode so you can modify or run it again.`)) return;
    try {
      await api(`/api/quizzes/${quiz.id}/status`, { method: 'PATCH', body: JSON.stringify({ action: 'reopen' }) });
      setNotice(`✓ "${quiz.title}" restored to Quizzes & Worksheets in Draft mode.`);
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to re-open quiz.');
    }
  }

  async function handleDeleteQuiz(quiz: Quiz) {
    if (!window.confirm(`Permanently delete "${quiz.title}" from Archive? All question records and student results will be permanently removed. This cannot be undone.`)) return;
    try {
      await api(`/api/quizzes/${quiz.id}`, { method: 'DELETE' });
      setNotice(`✓ "${quiz.title}" permanently deleted.`);
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to delete quiz.');
    }
  }

  async function handleReopenWorksheet(paper: WorksheetPaper) {
    if (!window.confirm(`Re-open "${paper.title}"? This will move it back to active Question Papers for students to submit answer sheets.`)) return;
    try {
      await api(`/api/worksheets/${paper.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' }) });
      setNotice(`✓ "${paper.title}" re-opened and restored to Question Papers.`);
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to re-open question paper.');
    }
  }

  async function handleDeleteWorksheet(paper: WorksheetPaper) {
    if (!window.confirm(`Permanently delete "${paper.title}" from Archive? All paper contents and student submissions will be permanently removed. This cannot be undone.`)) return;
    try {
      await api(`/api/worksheets/${paper.id}`, { method: 'DELETE' });
      setNotice(`✓ "${paper.title}" permanently deleted.`);
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to delete question paper.');
    }
  }

  async function handleInspectQuiz(quiz: Quiz) {
    setPreviewingQuiz(quiz);
    setPreviewQuizLoading(true);
    try {
      const data = await api<{ quiz: Quiz }>(`/api/quizzes/${quiz.id}/detail`);
      setFullQuizData(data.quiz);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to load quiz details.');
    } finally {
      setPreviewQuizLoading(false);
    }
  }

  const showQuizzes = filterType === 'all' || filterType === 'quizzes';
  const showWorksheets = filterType === 'all' || filterType === 'worksheets';
  const displayedCount = (showQuizzes ? filteredQuizzes.length : 0) + (showWorksheets ? filteredWorksheets.length : 0);

  return (
    <section className="view-enter archive-container">
      <div className="page-heading">
        <div>
          <span className="overline">Classroom Records</span>
          <h1>Archive</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            All finished quizzes and completed question papers are stored here safely. Records remain preserved until you delete them.
          </p>
        </div>
      </div>

      <div className="archive-stats-row">
        <div className="archive-stat-card">
          <div className="archive-stat-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
            <Archive size={22} />
          </div>
          <div className="archive-stat-info">
            <strong>{totalArchivedCount}</strong>
            <span>Total in Archive</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <BookOpenCheck size={22} />
          </div>
          <div className="archive-stat-info">
            <strong>{archivedQuizzes.length}</strong>
            <span>Finished Quizzes</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <FileText size={22} />
          </div>
          <div className="archive-stat-info">
            <strong>{archivedWorksheets.length}</strong>
            <span>Completed Papers</span>
          </div>
        </div>

        <div className="archive-stat-card">
          <div className="archive-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Users size={22} />
          </div>
          <div className="archive-stat-info">
            <strong>{totalSubmissionsAndAttempts}</strong>
            <span>Recorded Responses</span>
          </div>
        </div>
      </div>

      <div className="archive-filter-bar">
        <div className="archive-nav-pills">
          <button
            type="button"
            className={`archive-pill-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Records <span className="archive-pill-count">{totalArchivedCount}</span>
          </button>
          <button
            type="button"
            className={`archive-pill-btn ${filterType === 'quizzes' ? 'active' : ''}`}
            onClick={() => setFilterType('quizzes')}
          >
            Finished Quizzes <span className="archive-pill-count">{archivedQuizzes.length}</span>
          </button>
          <button
            type="button"
            className={`archive-pill-btn ${filterType === 'worksheets' ? 'active' : ''}`}
            onClick={() => setFilterType('worksheets')}
          >
            Completed Question Papers <span className="archive-pill-count">{archivedWorksheets.length}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div className="archive-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by title, subject, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13.5px', height: '37px' }}
          >
            <option value="ALL">All Grades</option>
            {ALL_STUDENT_GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {totalArchivedCount === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px', minHeight: '180px' }}>
          <span className="empty-icon" style={{ width: '48px', height: '48px', marginBottom: '12px' }}>
            <Archive size={26} color="#0284c7" />
          </span>
          <h3 style={{ fontSize: '18px', margin: '0 0 8px' }}>Your Archive is empty.</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', maxWidth: '480px' }}>
            When you mark quizzes as finished or question papers as complete, they are preserved safely here until you choose to delete them.
          </p>
        </div>
      ) : displayedCount === 0 ? (
        <div className="empty-state" style={{ padding: '36px 20px', minHeight: '160px' }}>
          <span className="empty-icon" style={{ width: '44px', height: '44px', marginBottom: '10px' }}>
            <Filter size={22} color="#64748b" />
          </span>
          <h3 style={{ fontSize: '16px', margin: '0 0 6px' }}>No records match your filter criteria.</h3>
          <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '13.5px' }}>
            Try clearing your search query or choosing another grade.
          </p>
          <button
            type="button"
            className="button button-secondary"
            style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => {
              setSearchQuery('');
              setGradeFilter('ALL');
              setFilterType('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="worksheet-grid">
          {/* 1. Finished Quizzes */}
          {showQuizzes && filteredQuizzes.map((quiz) => (
            <div className="archive-card" key={`quiz-${quiz.id}`}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '6px' }}>
                  <div className="worksheet-card-meta" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                    <span className="worksheet-badge badge-finished" style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      ✓ FINISHED
                    </span>
                    <span className="worksheet-badge badge-grade" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 600, padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {quiz.grade || 'All Grades'}
                    </span>
                    <span className="worksheet-badge badge-subject" style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {quiz.mode === 'LIVE' ? 'LIVE CLASSROOM' : (quiz.timeLimitSeconds !== null ? 'TIME PACED' : 'SELF PACED')}
                    </span>
                  </div>
                  <span className="archive-card-archived-tag" style={{ flexShrink: 0, padding: '2px 7px', fontSize: '10.5px' }}>
                    <BookOpenCheck size={11} /> Quiz
                  </span>
                </div>

                <h3 style={{ margin: '6px 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {quiz.title}
                </h3>

                <div className="worksheet-card-stats" style={{ margin: '8px 0 8px 0' }}>
                  <span>Questions: <strong>{quiz._count?.questions ?? 0}</strong></span>
                  <span>Student Attempts: <strong>{quiz._count?.attempts ?? 0}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {onOpenInLiveCanvas && (
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{
                      width: '100%',
                      fontSize: '12px',
                      padding: '6px 12px',
                      gap: '6px',
                      borderColor: '#bae6fd',
                      color: '#0369a1',
                      background: '#f0f9ff',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Open quiz review in Live Teaching Canvas"
                    onClick={() => void handleOpenQuizInCanvas(quiz)}
                  >
                    <Sparkles size={13} /> Open in Live Teaching Canvas
                  </button>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ flex: 1, fontSize: '12.5px', padding: '6px 10px' }}
                    title="View Student Results & Score Breakdown"
                    onClick={() => onOpenResults(quiz.id)}
                  >
                    <BarChart3 size={13} /> View Results ({quiz._count?.attempts ?? 0})
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 10px' }}
                    title="Preview Quiz Questions and Answer Key"
                    onClick={() => void handleInspectQuiz(quiz)}
                  >
                    <Eye size={13} /> Inspect
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', width: '100%' }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', whiteSpace: 'nowrap' }}
                    title="Restore quiz to Quizzes & Worksheets in Draft mode"
                    onClick={() => void handleReopenQuiz(quiz)}
                  >
                    <RotateCcw size={13} /> Re-open Quiz
                  </button>

                  <button
                    type="button"
                    className="icon-button danger-hover"
                    title="Permanently Delete Quiz from Archive"
                    style={{ padding: '6px 8px', height: '30px', minWidth: '32px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => void handleDeleteQuiz(quiz)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 2. Completed Question Papers */}
          {showWorksheets && filteredWorksheets.map((paper) => (
            <div className="archive-card" key={`paper-${paper.id}`}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '6px' }}>
                  <div className="worksheet-card-meta" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                    <span className="worksheet-badge badge-completed" style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      ✓ COMPLETED
                    </span>
                    {paper.grade && <span className="worksheet-badge badge-grade" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 600, padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>{paper.grade}</span>}
                    {paper.subject && <span className="worksheet-badge badge-subject" style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>{paper.subject}</span>}
                  </div>
                  <span className="archive-card-archived-tag" style={{ flexShrink: 0, padding: '2px 7px', fontSize: '10.5px' }}>
                    <FileText size={11} /> Paper
                  </span>
                </div>

                <h3 style={{ margin: '6px 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {paper.title}
                </h3>

                <div className="worksheet-card-stats" style={{ margin: '8px 0 8px 0' }}>
                  <span>Marks: <strong>{paper.totalMarks}</strong></span>
                  <span>Submissions: <strong>{paper._count?.submissions ?? 0}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {onOpenInLiveCanvas && (
                  <button
                    type="button"
                    className="button button-primary"
                    style={{
                      width: '100%',
                      fontSize: '12.5px',
                      padding: '7px 12px',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      borderColor: '#0284c7',
                      color: '#ffffff',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Open this lesson in Live Teaching Canvas to view, teach or edit"
                    onClick={() => onOpenInLiveCanvas(paper)}
                  >
                    <Sparkles size={14} /> Open in Live Teaching Canvas
                  </button>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ flex: 1, fontSize: '12.5px', padding: '6px 10px' }}
                    title="View Answer Sheet Submissions & Grades"
                    onClick={async () => {
                      const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${paper.id}`);
                      setCheckingSubmissions(full.worksheet);
                    }}
                  >
                    <CheckSquare size={13} /> Submissions ({paper._count?.submissions ?? 0})
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 10px' }}
                    title="View & Print Question Paper"
                    onClick={() => setViewingPaper(paper)}
                  >
                    <Eye size={13} /> View Paper
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', width: '100%' }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', whiteSpace: 'nowrap' }}
                    title="Re-open submissions for students"
                    onClick={() => void handleReopenWorksheet(paper)}
                  >
                    <RotateCcw size={13} /> Re-open Paper
                  </button>

                  <button
                    type="button"
                    className="icon-button danger-hover"
                    title="Permanently Delete Question Paper from Archive"
                    style={{ padding: '6px 8px', height: '30px', minWidth: '32px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => void handleDeleteWorksheet(paper)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {previewingQuiz && (
        <ArchivedQuizPreviewModal
          quiz={previewingQuiz}
          fullData={fullQuizData}
          loading={previewQuizLoading}
          onClose={() => {
            setPreviewingQuiz(null);
            setFullQuizData(null);
          }}
          onOpenResults={onOpenResults}
        />
      )}

      {viewingPaper && (
        <PaperPreviewModal
          paper={viewingPaper}
          onClose={() => setViewingPaper(null)}
          onOpenInLiveCanvas={(paper) => onOpenInLiveCanvas?.(paper)}
        />
      )}

      {checkingSubmissions && (
        <WorksheetSubmissionsModal
          paper={checkingSubmissions}
          onClose={() => setCheckingSubmissions(null)}
          onRefresh={async () => {
            const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${checkingSubmissions.id}`);
            setCheckingSubmissions(full.worksheet);
            await refresh();
          }}
          setNotice={setNotice}
        />
      )}
    </section>
  );
}

// ==========================================
// 1. ATTENDANCE TRACKER PANEL
// ==========================================
function AttendanceTrackerPanel({ students, setNotice }: { students: Student[]; setNotice: (text: string) => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [gradeFilter, setGradeFilter] = useState(() => getDefaultGrade() || 'ALL');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [monthPicker, setMonthPicker] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus | ''; remarks: string; updatedAt?: string }>>({});
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ yearMonth: string; daysInMonth: number; students: MonthlyAttendanceStudent[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch daily attendance
  const loadDailyAttendance = async (targetDate: string, grade: string) => {
    setLoading(true);
    try {
      const data = await api<{
        date: string;
        records: { studentId: string; status: AttendanceStatus; remarks?: string; updatedAt?: string }[];
        summary: AttendanceSummary;
      }>(`/api/attendance?date=${targetDate}&grade=${grade}`);

      const map: Record<string, { status: AttendanceStatus | ''; remarks: string; updatedAt?: string }> = {};
      data.records.forEach((r) => {
        map[r.studentId] = { status: r.status, remarks: r.remarks || '', updatedAt: r.updatedAt };
      });
      setRecords(map);
      setSummary(data.summary);
      setIsDirty(false);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly matrix
  const loadMonthlyAttendance = async (yearMonth: string, grade: string) => {
    setLoading(true);
    try {
      const data = await api<{
        yearMonth: string;
        daysInMonth?: number;
        students: MonthlyAttendanceStudent[];
        records?: { studentId: string; date: string; status: AttendanceStatus }[];
      }>(`/api/attendance/monthly?yearMonth=${yearMonth}&grade=${grade}`);

      const [yearStr, monthStr] = yearMonth.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const computedDays = new Date(y, m, 0).getDate();

      const rawStudents = Array.isArray(data?.students) ? data.students : [];
      const records = Array.isArray(data?.records) ? data.records : [];

      const formattedStudents: MonthlyAttendanceStudent[] = rawStudents.map((st: any) => {
        if (st.days && typeof st.presentCount === 'number') {
          return st as MonthlyAttendanceStudent;
        }
        const studentRecs = records.filter((r) => r.studentId === (st.studentId || st.id));
        const days: Record<string, AttendanceStatus> = {};
        studentRecs.forEach((r) => {
          const d = String(parseInt(r.date.slice(8, 10), 10));
          days[d] = r.status;
        });
        const presentCount = studentRecs.filter((r) => r.status === 'PRESENT').length;
        const absentCount = studentRecs.filter((r) => r.status === 'ABSENT').length;
        const totalMarked = studentRecs.length;
        const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

        return {
          studentId: st.studentId || st.id,
          name: st.name,
          grade: st.grade,
          days,
          presentCount,
          absentCount,
          totalMarked,
          attendanceRate,
        };
      });

      setMonthlyData({
        yearMonth,
        daysInMonth: data?.daysInMonth || computedDays,
        students: formattedStudents,
      });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to load monthly attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'daily') {
      void loadDailyAttendance(date, gradeFilter);
    } else {
      void loadMonthlyAttendance(monthPicker, gradeFilter);
    }
  }, [date, gradeFilter, viewMode, monthPicker]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status: prev[studentId]?.status === status ? '' : status,
      },
    }));
    setIsDirty(true);
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'PRESENT' }),
        remarks,
      },
    }));
    setIsDirty(true);
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, { status: AttendanceStatus | ''; remarks: string; updatedAt?: string }> = {};
    const eligibleStudents = (gradeFilter === 'ALL' ? students : students.filter((s) => (s.grade || 'Grade 6') === gradeFilter))
      .filter((st) => {
        const jDate = st.joiningDate ? new Date(st.joiningDate).toISOString().slice(0, 10) : (st.createdAt ? new Date(st.createdAt).toISOString().slice(0, 10) : '2000-01-01');
        return date >= jDate;
      });
    eligibleStudents.forEach((st) => {
      next[st.id] = {
        status,
        remarks: records[st.id]?.remarks || '',
        updatedAt: records[st.id]?.updatedAt,
      };
    });
    setRecords((prev) => ({ ...prev, ...next }));
    setIsDirty(true);
  };

  const saveDailyAttendance = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(records)
        .filter(([_, v]) => Boolean(v.status))
        .map(([studentId, v]) => ({
          studentId,
          status: v.status as AttendanceStatus,
          remarks: v.remarks,
        }));
      await api('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({ date, records: payload }),
      });
      setIsDirty(false);
      setNotice(`Attendance saved for ${date}.`);
      await loadDailyAttendance(date, gradeFilter);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const relevantStudents = (gradeFilter === 'ALL' ? students : students.filter((s) => (s.grade || 'Grade 6') === gradeFilter))
    .filter((st) => {
      const jDate = st.joiningDate ? new Date(st.joiningDate).toISOString().slice(0, 10) : (st.createdAt ? new Date(st.createdAt).toISOString().slice(0, 10) : '2000-01-01');
      return date >= jDate;
    });

  // Quick date shifts
  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="attendance-panel">
      {/* Controls & Mode Bar */}
      <div className="attendance-header-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="overline" style={{ margin: 0 }}>Daily & Monthly Tracking</span>
              <span className="academic-session-pill">Academic Year: {getCurrentAcademicYear(new Date(date))}</span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Student Attendance Register
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View Mode Toggle */}
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${viewMode === 'daily' ? 'active' : ''}`}
                onClick={() => setViewMode('daily')}
              >
                <CalendarCheck size={15} /> Daily Sheet
              </button>
              <button
                type="button"
                className={`segmented-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                onClick={() => setViewMode('monthly')}
              >
                <FileSpreadsheet size={15} /> Monthly Matrix
              </button>
            </div>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              aria-label="Filter by grade"
              className="styled-select"
            >
              <option value="ALL">All Grades ({students.length})</option>
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
          </div>
        </div>

        {/* Date Selector Row */}
        {viewMode === 'daily' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="icon-button" title="Previous Day" onClick={() => shiftDate(-1)}>
                <ArrowLeft size={16} />
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#1e293b' }}>
                <Calendar size={16} color="#0284c7" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="styled-date-input"
                />
              </label>
              <button type="button" className="icon-button" title="Next Day" onClick={() => shiftDate(1)}>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="button button-quiet"
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              >
                Today
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Quick Mark:</span>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '5px 10px', gap: '4px' }}
                onClick={() => markAll('PRESENT')}
              >
                <CheckCheck size={14} color="#059669" /> All Present
              </button>
              <button
                type="button"
                className="button button-secondary"
                style={{ fontSize: '12px', padding: '5px 10px', gap: '4px' }}
                onClick={() => markAll('ABSENT')}
              >
                <X size={14} color="#e11d48" /> All Absent
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ fontSize: '13px', padding: '6px 16px', gap: '6px' }}
                disabled={saving}
                onClick={() => void saveDailyAttendance()}
              >
                <Save size={15} /> {saving ? 'Saving...' : isDirty ? 'Save Attendance ●' : 'Save Attendance'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="#0284c7" />
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                Select Month:
                <input
                  type="month"
                  value={monthPicker}
                  onChange={(e) => setMonthPicker(e.target.value)}
                  className="styled-date-input"
                  style={{ marginLeft: '8px' }}
                />
              </label>
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Showing full month breakdown for CBSE / School Academic Session
            </span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards for Daily Sheet */}
      {viewMode === 'daily' && summary && (
        <div className="attendance-kpi-grid">
          <div className="att-kpi-card att-kpi-total">
            <span className="att-kpi-label">Total Enrolled</span>
            <div className="att-kpi-val">{summary.total}</div>
            <span className="att-kpi-sub">Students in view</span>
          </div>
          <div className="att-kpi-card att-kpi-present">
            <span className="att-kpi-label">Present</span>
            <div className="att-kpi-val" style={{ color: '#059669' }}>{summary.present}</div>
            <span className="att-kpi-sub">Attendance Rate: {summary.attendanceRate}%</span>
          </div>
          <div className="att-kpi-card att-kpi-absent">
            <span className="att-kpi-label">Absent</span>
            <div className="att-kpi-val" style={{ color: '#e11d48' }}>{summary.absent}</div>
            <span className="att-kpi-sub">Not in class</span>
          </div>
          <div className="att-kpi-card att-kpi-late">
            <span className="att-kpi-label">Late / Excused</span>
            <div className="att-kpi-val" style={{ color: '#d97706' }}>{summary.late + summary.excused}</div>
            <span className="att-kpi-sub">{summary.late} Late · {summary.excused} Excused</span>
          </div>
        </div>
      )}

      {/* Daily Register List */}
      {viewMode === 'daily' && (
        <div className="attendance-table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
              <div>Loading attendance register for {date}...</div>
            </div>
          ) : relevantStudents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No students found for {gradeFilter}.
            </div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Student</th>
                  <th>Class / Grade</th>
                  <th style={{ minWidth: '280px' }}>Attendance Status</th>
                  <th>Remarks / Reasons</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {relevantStudents.map((st, idx) => {
                  const current = records[st.id] || { status: '', remarks: '' };
                  return (
                    <tr key={st.id} className={current.status ? `row-status-${current.status.toLowerCase()}` : ''}>
                      <td style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={`avatar avatar-small avatar-color-${idx % 4}`}>
                            {st.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '14px' }}>{st.name}</strong>
                            {!st.active && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#dc2626' }}>(Inactive)</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="grade-badge">{st.grade || 'Grade 6'}</span>
                      </td>
                      <td>
                        <div className="attendance-btn-group">
                          <button
                            type="button"
                            className={`att-pill att-pill-present ${current.status === 'PRESENT' ? 'selected' : ''}`}
                            onClick={() => handleStatusChange(st.id, 'PRESENT')}
                            title="Mark Present"
                          >
                            <Check size={14} /> Present
                          </button>
                          <button
                            type="button"
                            className={`att-pill att-pill-absent ${current.status === 'ABSENT' ? 'selected' : ''}`}
                            onClick={() => handleStatusChange(st.id, 'ABSENT')}
                            title="Mark Absent"
                          >
                            <X size={14} /> Absent
                          </button>
                          <button
                            type="button"
                            className={`att-pill att-pill-late ${current.status === 'LATE' ? 'selected' : ''}`}
                            onClick={() => handleStatusChange(st.id, 'LATE')}
                            title="Mark Late"
                          >
                            <Clock3 size={14} /> Late
                          </button>
                          <button
                            type="button"
                            className={`att-pill att-pill-excused ${current.status === 'EXCUSED' ? 'selected' : ''}`}
                            onClick={() => handleStatusChange(st.id, 'EXCUSED')}
                            title="Mark Excused"
                          >
                            <ShieldCheck size={14} /> Excused
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={current.remarks}
                          onChange={(e) => handleRemarkChange(st.id, e.target.value)}
                          placeholder="e.g. Doctor visit, sick leave..."
                          className="att-remark-input"
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                        {current.updatedAt ? new Date(current.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Monthly Summary Grid */}
      {viewMode === 'monthly' && (
        <div className="monthly-matrix-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
              <div>Generating monthly attendance matrix...</div>
            </div>
          ) : !monthlyData || monthlyData.students.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No monthly attendance records for {monthPicker}.
            </div>
          ) : (
            <div className="monthly-matrix-scroll">
              <table className="monthly-matrix-table" style={{ textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th className="sticky-col first-col" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center' }}>
                        Student
                      </div>
                    </th>
                    <th className="sticky-col second-col" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center' }}>
                        Grade
                      </div>
                    </th>
                    {Array.from({ length: monthlyData.daysInMonth }, (_, i) => (
                      <th key={i + 1} style={{ width: '28px', textAlign: 'center', fontSize: '11px', padding: '6px 2px' }}>
                        {i + 1}
                      </th>
                    ))}
                    <th style={{ width: '70px', textAlign: 'center' }}>Present</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Absent</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.students.map((st) => (
                    <tr key={st.studentId}>
                      <td className="sticky-col first-col" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a', textAlign: 'center' }}>{st.name}</strong>
                        </div>
                      </td>
                      <td className="sticky-col second-col" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center' }}>
                          <span className="grade-badge" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#334155', fontWeight: 600, display: 'inline-block', textAlign: 'center' }}>
                            {st.grade || 'Grade 6'}
                          </span>
                        </div>
                      </td>
                      {Array.from({ length: monthlyData.daysInMonth }, (_, i) => {
                        const dayNum = String(i + 1);
                        const status = st.days[dayNum];
                        let cellClass = 'cell-empty';
                        let char = '·';
                        if (status === 'PRESENT') { cellClass = 'cell-p'; char = 'P'; }
                        else if (status === 'ABSENT') { cellClass = 'cell-a'; char = 'A'; }
                        else if (status === 'LATE') { cellClass = 'cell-l'; char = 'L'; }
                        else if (status === 'EXCUSED') { cellClass = 'cell-e'; char = 'E'; }

                        return (
                          <td key={i} className={`matrix-day-cell ${cellClass}`} style={{ textAlign: 'center' }} title={`Day ${dayNum}: ${status || 'Unrecorded'}`}>
                            {char}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#059669' }}>{st.presentCount ?? 0}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#e11d48' }}>{st.absentCount ?? 0}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`rate-pill ${(st.attendanceRate ?? 100) >= 75 ? 'rate-good' : 'rate-low'}`}>
                          {st.attendanceRate ?? 100}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. MONTHLY FEES TRACKER PANEL
// ==========================================
function MonthlyFeesPanel({
  students,
  setNotice,
  initialStudentId,
}: {
  students: Student[];
  setNotice: (text: string) => void;
  initialStudentId?: string | null;
}) {
  const [academicYear, setAcademicYear] = useState(() => getCurrentAcademicYear());
  const [availableYears] = useState(['2026-2027', '2025-2026', '2024-2025', '2027-2028']);
  const [month, setMonth] = useState(() => {
    const curMonth = new Date().toLocaleString('en-US', { month: 'long' });
    return ACADEMIC_MONTHS.includes(curMonth) ? curMonth : 'April';
  });
  const [gradeFilter, setGradeFilter] = useState(() => getDefaultGrade() || 'ALL');
  const [viewMode, setViewMode] = useState<'register' | 'ledger'>(initialStudentId ? 'ledger' : 'register');
  const [selectedStudentForLedger, setSelectedStudentForLedger] = useState<string>(initialStudentId || (students[0]?.id ?? ''));

  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [ledgerData, setLedgerData] = useState<StudentFeeLedger | null>(null);
  const [loading, setLoading] = useState(false);

  // Payment Recording Modal State
  const [paymentModal, setPaymentModal] = useState<{
    studentId: string;
    studentName: string;
    grade?: string;
    month: string;
    amountDue: number;
    amountPaid: number;
    status: FeeStatus;
    paymentMode: string;
    receiptNo: string;
    notes: string;
  } | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentForLedger(initialStudentId);
      setViewMode('ledger');
    }
  }, [initialStudentId]);

  const loadMonthlyFees = async (year: string, targetMonth: string, grade: string) => {
    setLoading(true);
    try {
      const data = await api<{
        academicYear?: string;
        month?: string;
        records?: StudentFeeRecord[];
        fees?: StudentFeeRecord[];
        summary?: FeeSummary;
      }>(`/api/fees?academicYear=${year}&month=${targetMonth}&grade=${grade}`);
      const list = Array.isArray(data?.records) ? data.records : (Array.isArray(data?.fees) ? data.fees : []);
      setFeeRecords(list);
      setSummary(data?.summary || null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to load fee register.');
      setFeeRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentLedger = async (studentId: string, year: string) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await api<any>(`/api/fees/student/${studentId}?academicYear=${year}`);
      if (data) {
        const rawMonths = Array.isArray(data.months) ? data.months : (Array.isArray(data.ledger) ? data.ledger : []);
        const safeMonths: StudentFeeLedgerMonth[] = rawMonths.map((m: any) => ({
          month: m.month,
          status: m.status || 'PENDING',
          amountDue: m.amountDue ?? 1500,
          amountPaid: m.amountPaid ?? 0,
          balance: m.balance ?? Math.max(0, (m.amountDue ?? 1500) - (m.amountPaid ?? 0)),
          paidAt: m.paidAt || null,
          paymentMode: m.paymentMode || '',
          receiptNo: m.receiptNo || '',
          notes: m.notes || '',
        }));

        setLedgerData({
          student: data.student || { id: studentId, name: 'Student', grade: 'Grade 6' },
          academicYear: data.academicYear || year,
          months: safeMonths,
          summary: {
            totalDue: data.summary?.totalDue ?? safeMonths.reduce((s, m) => s + m.amountDue, 0),
            totalPaid: data.summary?.totalPaid ?? safeMonths.reduce((s, m) => s + m.amountPaid, 0),
            totalPending: data.summary?.totalPending ?? data.summary?.balance ?? 0,
            paidMonths: data.summary?.paidMonths ?? safeMonths.filter((m) => m.status === 'PAID').length,
            pendingMonths: data.summary?.pendingMonths ?? safeMonths.filter((m) => m.status !== 'PAID').length,
          },
        });
      } else {
        setLedgerData(null);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to load student fee ledger.');
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'register') {
      void loadMonthlyFees(academicYear, month, gradeFilter);
    } else if (selectedStudentForLedger) {
      void loadStudentLedger(selectedStudentForLedger, academicYear);
    }
  }, [academicYear, month, gradeFilter, viewMode, selectedStudentForLedger]);

  const openPaymentModal = (record: {
    studentId: string;
    name?: string;
    grade?: string;
    month?: string;
    amountDue?: number;
    amountPaid?: number;
    status?: FeeStatus;
    paymentMode?: string;
    receiptNo?: string | null;
    notes?: string | null;
  }) => {
    const student = students.find((s) => s.id === record.studentId);
    const targetMonth = record.month || month;
    const due = record.amountDue ?? 1500;
    const paid = record.amountPaid ?? due;
    const receipt = record.receiptNo || `REC-${academicYear.split('-')[0]}-${Math.floor(1000 + Math.random() * 9000)}`;

    setPaymentModal({
      studentId: record.studentId,
      studentName: record.name || student?.name || 'Student',
      grade: record.grade || student?.grade || 'Grade 6',
      month: targetMonth,
      amountDue: due,
      amountPaid: paid,
      status: (paid >= due ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING') as FeeStatus,
      paymentMode: record.paymentMode || 'UPI',
      receiptNo: receipt,
      notes: record.notes || '',
    });
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    setPaymentSaving(true);
    try {
      await api(`/api/fees/${paymentModal.studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          academicYear,
          month: paymentModal.month,
          amountDue: paymentModal.amountDue,
          amountPaid: paymentModal.amountPaid,
          status: paymentModal.status,
          paymentMode: paymentModal.paymentMode,
          receiptNo: paymentModal.receiptNo,
          notes: paymentModal.notes,
        }),
      });
      setNotice(`Fee payment recorded for ${paymentModal.studentName} (${paymentModal.month}).`);
      setPaymentModal(null);
      if (viewMode === 'register') {
        await loadMonthlyFees(academicYear, month, gradeFilter);
      } else {
        await loadStudentLedger(selectedStudentForLedger, academicYear);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to update fee record.');
    } finally {
      setPaymentSaving(false);
    }
  };

  // Inline change for Due Amount
  const handleDueAmountChange = (studentId: string, newDue: number) => {
    const val = isNaN(newDue) || newDue < 0 ? 0 : newDue;
    setFeeRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        const paid = r.amountPaid ?? 0;
        const status: FeeStatus = val === 0 && paid === 0 ? 'PENDING' : (paid >= val && val > 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING');
        return {
          ...r,
          amountDue: val,
          status,
        };
      })
    );
  };

  // Inline change for Paid Amount
  const handlePaidAmountChange = (studentId: string, newPaid: number) => {
    const val = isNaN(newPaid) || newPaid < 0 ? 0 : newPaid;
    setFeeRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        const due = r.amountDue ?? 1500;
        const status: FeeStatus = (val >= due && due > 0 ? 'PAID' : val > 0 ? 'PARTIAL' : 'PENDING');
        return {
          ...r,
          amountPaid: val,
          status,
        };
      })
    );
  };

  // Save inline fee record to server on blur or enter
  const handleSaveInlineFee = async (studentId: string) => {
    const rec = feeRecords.find((r) => r.studentId === studentId);
    if (!rec) return;

    const due = rec.amountDue ?? 1500;
    const paid = rec.amountPaid ?? 0;
    const computedStatus: FeeStatus = (paid >= due && due > 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING');

    try {
      await api(`/api/fees/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          academicYear,
          month,
          amountDue: due,
          amountPaid: paid,
          status: computedStatus,
        }),
      });

      // Recalculate summary KPIs in real-time
      setFeeRecords((current) => {
        const totalDue = current.reduce((s, r) => s + (r.amountDue ?? 0), 0);
        const totalCollected = current.reduce((s, r) => s + (r.amountPaid ?? 0), 0);
        const totalPending = Math.max(0, totalDue - totalCollected);
        const paidCount = current.filter((r) => (r.amountPaid ?? 0) >= (r.amountDue ?? 0) && (r.amountDue ?? 0) > 0).length;
        const pendingCount = current.filter((r) => (r.amountPaid ?? 0) === 0).length;
        const partialCount = current.filter((r) => (r.amountPaid ?? 0) > 0 && (r.amountPaid ?? 0) < (r.amountDue ?? 0)).length;
        const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

        setSummary({
          totalStudents: current.length,
          totalDue,
          totalCollected,
          totalPending,
          paidCount,
          pendingCount,
          partialCount,
          collectionRate,
        });

        return current;
      });

      setNotice(`Updated fee record for ${rec.name || 'Student'}: Due ₹${due.toLocaleString()}, Paid ₹${paid.toLocaleString()}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to update fee record.');
    }
  };

  return (
    <div className="fees-panel">
      {/* Header and Filter Controls */}
      <div className="fees-header-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="overline" style={{ margin: 0 }}>Financial Register</span>
              <span className="academic-session-pill">Session: April to March</span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Monthly Student Fees Tracking
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Academic Year Selector */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              <span>Academic Year:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="styled-select"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr} (Apr–Mar)</option>
                ))}
              </select>
            </label>

            {/* View Mode Toggle */}
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${viewMode === 'register' ? 'active' : ''}`}
                onClick={() => setViewMode('register')}
              >
                <CreditCard size={15} /> Monthly Register
              </button>
              <button
                type="button"
                className={`segmented-btn ${viewMode === 'ledger' ? 'active' : ''}`}
                onClick={() => setViewMode('ledger')}
              >
                <FileText size={15} /> Student 12M Ledger
              </button>
            </div>
          </div>
        </div>

        {/* 12-Month Academic Month Pills (April to March) */}
        {viewMode === 'register' && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Month (April – March Academic Session):
              </span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="styled-select"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="ALL">All Grades</option>
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
            </div>

            <div className="fees-month-pills">
              {ACADEMIC_MONTHS.map((m) => {
                const isSelected = month === m;
                return (
                  <button
                    key={m}
                    type="button"
                    className={`fee-month-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => setMonth(m)}
                  >
                    <span className="month-name">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'ledger' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Select Student:</span>
            <select
              value={selectedStudentForLedger}
              onChange={(e) => setSelectedStudentForLedger(e.target.value)}
              className="styled-select"
              style={{ minWidth: '220px' }}
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.grade || 'Grade 6'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Metrics Banner for Monthly Register */}
      {viewMode === 'register' && summary && (
        <div className="fees-kpi-grid">
          <div className="fee-kpi-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <span className="fee-kpi-label" style={{ textAlign: 'center' }}>Students In Month</span>
            <div className="fee-kpi-val" style={{ textAlign: 'center' }}>{summary.totalStudents ?? 0}</div>
            <span className="fee-kpi-sub" style={{ textAlign: 'center' }}>{month} {academicYear}</span>
          </div>
          <div className="fee-kpi-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <span className="fee-kpi-label" style={{ textAlign: 'center' }}>Total Fees Due</span>
            <div className="fee-kpi-val" style={{ color: '#0f172a', textAlign: 'center' }}>₹{(summary.totalDue || 0).toLocaleString()}</div>
            <span className="fee-kpi-sub" style={{ textAlign: 'center' }}>
              {summary.totalStudents > 0 ? `Avg ₹${Math.round((summary.totalDue || 0) / summary.totalStudents).toLocaleString()}/student` : 'Custom fee structure'}
            </span>
          </div>
          <div className="fee-kpi-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <span className="fee-kpi-label" style={{ textAlign: 'center' }}>Total Collected</span>
            <div className="fee-kpi-val" style={{ color: '#059669', textAlign: 'center' }}>₹{(summary.totalCollected || 0).toLocaleString()}</div>
            <span className="fee-kpi-sub" style={{ textAlign: 'center' }}>{summary.paidCount ?? 0} Students Paid</span>
          </div>
          <div className="fee-kpi-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <span className="fee-kpi-label" style={{ textAlign: 'center' }}>Total Pending</span>
            <div className="fee-kpi-val" style={{ color: '#e11d48', textAlign: 'center' }}>₹{(summary.totalPending || 0).toLocaleString()}</div>
            <span className="fee-kpi-sub" style={{ textAlign: 'center' }}>{summary.pendingCount ?? 0} Pending</span>
          </div>
          <div className="fee-kpi-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <span className="fee-kpi-label" style={{ textAlign: 'center' }}>Collection Rate</span>
            <div className="fee-kpi-val" style={{ color: '#0284c7', textAlign: 'center' }}>{summary.collectionRate ?? 0}%</div>
            <div className="kpi-mini-bar" style={{ margin: '8px auto 0 auto', width: '85%' }}>
              <div className="kpi-mini-bar-fill" style={{ width: `${Math.min(100, Math.max(0, summary.collectionRate ?? 0))}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Monthly Register Table View */}
      {viewMode === 'register' && (
        <div className="fees-table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
              <div>Loading fee records for {month} {academicYear}...</div>
            </div>
          ) : (!feeRecords || feeRecords.length === 0) ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No students enrolled to track fees.
            </div>
          ) : (
            <table className="fees-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th style={{ textAlign: 'center' }}>Student Name</th>
                  <th style={{ textAlign: 'center' }}>Grade</th>
                  <th style={{ textAlign: 'center' }}>Due Amount</th>
                  <th style={{ textAlign: 'center' }}>Paid Amount</th>
                  <th style={{ textAlign: 'center' }}>Balance</th>
                  <th style={{ textAlign: 'center' }}>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>Mode & Receipt</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(feeRecords || []).map((rec, idx) => {
                  const amountDue = rec.amountDue ?? 1500;
                  const amountPaid = rec.amountPaid ?? 0;
                  const balance = Math.max(0, amountDue - amountPaid);
                  const status = rec.status || 'PENDING';
                  return (
                    <tr key={rec.studentId || idx}>
                      <td style={{ color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: '#0f172a', fontSize: '14px', textAlign: 'center' }}>{rec.name || 'Student'}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="grade-badge" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#334155', fontWeight: 600, display: 'inline-block' }}>
                          {rec.grade || 'Grade 6'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="fee-num-cell" title="Click to edit due amount for this student">
                          <span className="fee-num-symbol">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={amountDue}
                            onChange={(e) => handleDueAmountChange(rec.studentId, Number(e.target.value))}
                            onBlur={() => handleSaveInlineFee(rec.studentId)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineFee(rec.studentId); }}
                            className="fee-num-input"
                            aria-label={`Due amount for ${rec.name}`}
                          />
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="fee-num-cell" title="Click to edit paid amount">
                          <span className="fee-num-symbol" style={{ color: amountPaid > 0 ? '#059669' : '#64748b' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={amountPaid}
                            onChange={(e) => handlePaidAmountChange(rec.studentId, Number(e.target.value))}
                            onBlur={() => handleSaveInlineFee(rec.studentId)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineFee(rec.studentId); }}
                            className="fee-num-input"
                            style={{ color: amountPaid > 0 ? '#059669' : '#64748b', fontWeight: 700 }}
                            aria-label={`Paid amount for ${rec.name}`}
                          />
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: balance > 0 ? '#e11d48' : '#059669', textAlign: 'center' }}>
                        {balance === 0 ? '₹0' : `₹${balance.toLocaleString()}`}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`fee-status-badge badge-${status.toLowerCase()}`} style={{ display: 'inline-block' }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', textAlign: 'center' }}>
                        {rec.paymentMode ? (
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{rec.paymentMode}</span>
                            {rec.receiptNo && <span style={{ color: '#64748b', marginLeft: '6px' }}>({rec.receiptNo})</span>}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: '12px', padding: '4px 10px', gap: '4px' }}
                            onClick={() => openPaymentModal(rec)}
                            title="Edit full payment details and receipt"
                          >
                            <CreditCard size={13} /> {status === 'PAID' ? 'Edit' : 'Pay'}
                          </button>
                          <button
                            type="button"
                            className="button button-quiet"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            title="View student's 12-month ledger"
                            onClick={() => {
                              setSelectedStudentForLedger(rec.studentId);
                              setViewMode('ledger');
                            }}
                          >
                            Ledger
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Student 12-Month Ledger View */}
      {viewMode === 'ledger' && (
        <div className="student-ledger-wrapper">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
              <div>Loading 12-month fee ledger...</div>
            </div>
          ) : !ledgerData ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Select a student to view their April–March fee ledger.
            </div>
          ) : (
            <>
              {/* Student Ledger Summary Profile */}
              <div className="ledger-summary-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="avatar avatar-large avatar-color-0">
                      {(ledgerData.student?.name || 'S').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                        {ledgerData.student?.name || 'Student'}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className="grade-badge">{ledgerData.student?.grade || 'Grade 6'}</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          Academic Year: <strong>{ledgerData.academicYear}</strong> (April 1 to March 31)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Annual Fees</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        ₹{(ledgerData.summary?.totalDue || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Paid</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                        ₹{(ledgerData.summary?.totalPaid || 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Outstanding Balance</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: (ledgerData.summary?.totalPending || 0) > 0 ? '#e11d48' : '#059669' }}>
                        ₹{(ledgerData.summary?.totalPending || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 12-Month Table */}
              <div className="fees-table-container" style={{ marginTop: '16px' }}>
                <table className="fees-table" style={{ textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Month #</th>
                      <th style={{ textAlign: 'center' }}>Academic Month</th>
                      <th style={{ textAlign: 'center' }}>Amount Due</th>
                      <th style={{ textAlign: 'center' }}>Amount Paid</th>
                      <th style={{ textAlign: 'center' }}>Balance</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Payment Mode</th>
                      <th style={{ textAlign: 'center' }}>Receipt #</th>
                      <th style={{ textAlign: 'center' }}>Payment Date</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ledgerData.months || []).map((m, idx) => {
                      const amountDue = m.amountDue ?? 1500;
                      const amountPaid = m.amountPaid ?? 0;
                      const balance = m.balance ?? Math.max(0, amountDue - amountPaid);
                      const status = m.status || 'PENDING';
                      return (
                        <tr key={m.month || idx}>
                          <td style={{ color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ textAlign: 'center' }}>
                            <strong style={{ color: '#0f172a' }}>{m.month}</strong>
                          </td>
                          <td style={{ fontWeight: 600, textAlign: 'center' }}>₹{amountDue.toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: amountPaid > 0 ? '#059669' : '#64748b', textAlign: 'center' }}>
                            ₹{amountPaid.toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 700, color: balance > 0 ? '#e11d48' : '#059669', textAlign: 'center' }}>
                            {balance === 0 ? '₹0' : `₹${balance.toLocaleString()}`}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`fee-status-badge badge-${status.toLowerCase()}`} style={{ display: 'inline-block', ...(status === 'EXEMPT' ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' } : {}) }}>
                              {status === 'EXEMPT' ? 'Not Enrolled' : status}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', textAlign: 'center' }}>{m.paymentMode || '—'}</td>
                          <td style={{ fontSize: '13px', fontFamily: 'monospace', textAlign: 'center' }}>{m.receiptNo || '—'}</td>
                          <td style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                            {m.paidAt ? new Date(m.paidAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              {status === 'EXEMPT' ? (
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{m.notes || 'Not enrolled'}</span>
                              ) : (
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  style={{ fontSize: '12px', padding: '4px 10px', gap: '4px' }}
                                  onClick={() =>
                                    openPaymentModal({
                                      studentId: ledgerData.student?.id || selectedStudentForLedger,
                                      name: ledgerData.student?.name,
                                      grade: ledgerData.student?.grade,
                                      month: m.month,
                                      amountDue,
                                      amountPaid,
                                      status: status as FeeStatus,
                                      paymentMode: m.paymentMode,
                                      receiptNo: m.receiptNo,
                                      notes: m.notes,
                                    })
                                  }
                                >
                                  <CreditCard size={13} /> {status === 'PAID' ? 'Edit' : 'Pay'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payment Recording Modal */}
      {paymentModal && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span className="overline" style={{ margin: 0 }}>Record Student Fee</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {paymentModal.studentName} · {paymentModal.month}
                </h3>
              </div>
              <button type="button" className="icon-button quiet" onClick={() => setPaymentModal(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="field">
                  <span>Amount Due (₹)</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={paymentModal.amountDue}
                    onChange={(e) => {
                      const due = Number(e.target.value);
                      const paid = paymentModal.amountPaid;
                      setPaymentModal({
                        ...paymentModal,
                        amountDue: due,
                        status: paid >= due ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
                      });
                    }}
                  />
                </label>
                <label className="field">
                  <span>Amount Paid (₹)</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={paymentModal.amountPaid}
                    onChange={(e) => {
                      const paid = Number(e.target.value);
                      const due = paymentModal.amountDue;
                      setPaymentModal({
                        ...paymentModal,
                        amountPaid: paid,
                        status: paid >= due ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
                      });
                    }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="field">
                  <span>Payment Status</span>
                  <select
                    value={paymentModal.status}
                    onChange={(e) => setPaymentModal({ ...paymentModal, status: e.target.value as FeeStatus })}
                    className="styled-select"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PENDING">PENDING</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </label>
                <label className="field">
                  <span>Payment Mode</span>
                  <select
                    value={paymentModal.paymentMode}
                    onChange={(e) => setPaymentModal({ ...paymentModal, paymentMode: e.target.value })}
                    className="styled-select"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Receipt Number</span>
                <input
                  type="text"
                  value={paymentModal.receiptNo}
                  onChange={(e) => setPaymentModal({ ...paymentModal, receiptNo: e.target.value })}
                  placeholder="e.g. REC-2026-1042"
                />
              </label>

              <label className="field">
                <span>Notes / Transaction Ref</span>
                <input
                  type="text"
                  value={paymentModal.notes}
                  onChange={(e) => setPaymentModal({ ...paymentModal, notes: e.target.value })}
                  placeholder="e.g. Paid by parent via UPI Txn #..."
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="button button-secondary" onClick={() => setPaymentModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={paymentSaving}>
                  {paymentSaving ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. STUDENT PROGRESS REPORT PANEL
// ==========================================
const CALENDAR_MONTHS_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getAssessmentMonthName(dateStr: string): string {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split('-');
    const monthNum = parseInt(parts[1], 10) - 1;
    return CALENDAR_MONTHS_NAMES[monthNum] || '';
  }
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'long' }) : '';
}

function StudentProgressReportPanel({
  students,
  selectedStudentId,
  onSelectStudent,
  setNotice,
}: {
  students: Student[];
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
  setNotice: (text: string) => void;
}) {
  const initialStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const [selectedGrade, setSelectedGrade] = useState<string>(() => initialStudent?.grade || getDefaultGrade());

  const [academicYear, setAcademicYear] = useState(() => getCurrentAcademicYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const curMonth = new Date().toLocaleString('en-US', { month: 'long' });
    return ACADEMIC_MONTHS.includes(curMonth) ? curMonth : 'April';
  });

  // Filter students by selectedGrade
  const gradeStudents = students.filter((s) => (s.grade || 'Grade 6') === selectedGrade);

  // Filter students enrolled on or before selectedMonth according to Date of Joining
  const eligibleGradeStudents = gradeStudents.filter((st) => {
    if (selectedMonth === 'ALL') return true;
    const targetYM = getCalendarYearMonth(academicYear, selectedMonth).yearMonth;
    const jDate = st.joiningDate
      ? new Date(st.joiningDate).toISOString().slice(0, 10)
      : (st.createdAt ? new Date(st.createdAt).toISOString().slice(0, 10) : '2000-01-01');
    const jYM = jDate.slice(0, 7);
    return targetYM >= jYM;
  });

  const currentStudentId = (eligibleGradeStudents.length > 0 && selectedStudentId && eligibleGradeStudents.some((s) => s.id === selectedStudentId))
    ? selectedStudentId
    : (eligibleGradeStudents[0]?.id ?? '');

  // Keep selectedGrade in sync if parent passed a student from another grade
  useEffect(() => {
    if (selectedStudentId) {
      const st = students.find((s) => s.id === selectedStudentId);
      if (st?.grade && st.grade !== selectedGrade) {
        setSelectedGrade(st.grade);
      }
    }
  }, [selectedStudentId, students]);

  // Keep parent's selectedStudentId in sync when gradeStudents switch
  useEffect(() => {
    if (currentStudentId !== selectedStudentId) {
      onSelectStudent(currentStudentId);
    }
  }, [currentStudentId, selectedStudentId]);

  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    const inGrade = students
      .filter((s) => (s.grade || 'Grade 6') === newGrade)
      .filter((st) => {
        if (selectedMonth === 'ALL') return true;
        const targetYM = getCalendarYearMonth(academicYear, selectedMonth).yearMonth;
        const jDate = st.joiningDate
          ? new Date(st.joiningDate).toISOString().slice(0, 10)
          : (st.createdAt ? new Date(st.createdAt).toISOString().slice(0, 10) : '2000-01-01');
        return targetYM >= jDate.slice(0, 7);
      });
    if (inGrade.length > 0) {
      onSelectStudent(inGrade[0].id);
    } else {
      onSelectStudent('');
      setReport(null);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    if (newMonth !== 'ALL') {
      const targetYM = getCalendarYearMonth(academicYear, newMonth).yearMonth;
      const valid = gradeStudents.filter((st) => {
        const jDate = st.joiningDate
          ? new Date(st.joiningDate).toISOString().slice(0, 10)
          : (st.createdAt ? new Date(st.createdAt).toISOString().slice(0, 10) : '2000-01-01');
        return targetYM >= jDate.slice(0, 7);
      });
      if (currentStudentId && !valid.some((st) => st.id === currentStudentId)) {
        if (valid.length > 0) {
          onSelectStudent(valid[0].id);
        } else {
          onSelectStudent('');
          setReport(null);
        }
      }
    }
  };
  const [report, setReport] = useState<StudentProgressReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'QUIZ' | 'QUESTION_PAPER'>('ALL');

  // Manual / Offline Score Entry Modal
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreDraft, setScoreDraft] = useState<{
    title: string;
    itemType: 'QUIZ' | 'QUESTION_PAPER';
    score: number;
    totalMarks: number;
    subject: string;
    grade: string;
    completedAt: string;
    remarks: string;
  }>({
    title: '',
    itemType: 'QUIZ',
    score: 20,
    totalMarks: 25,
    subject: getDefaultSubject(),
    grade: 'A',
    completedAt: new Date().toISOString().slice(0, 10),
    remarks: 'Offline Class Assessment',
  });
  const [scoreSaving, setScoreSaving] = useState(false);

  const loadProgressReport = async (studentId: string, year: string) => {
    if (!studentId) {
      setReport(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api<StudentProgressReportData>(`/api/students/${studentId}/progress-report?academicYear=${year}`);
      setReport(data);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to load progress report.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStudentId) {
      void loadProgressReport(currentStudentId, academicYear);
    } else {
      setReport(null);
    }
  }, [currentStudentId, academicYear]);

  useEffect(() => {
    if (!showScoreModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowScoreModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showScoreModal]);

  const handleSaveScoreRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudentId) return;
    setScoreSaving(true);
    try {
      await api(`/api/students/${currentStudentId}/score-records`, {
        method: 'POST',
        body: JSON.stringify({
          ...scoreDraft,
          academicYear,
        }),
      });
      setNotice('Score entry added to student academic record.');
      setShowScoreModal(false);
      setScoreDraft({
        title: '',
        itemType: 'QUIZ',
        score: 20,
        totalMarks: 25,
        subject: getDefaultSubject(),
        grade: 'A',
        completedAt: new Date().toISOString().slice(0, 10),
        remarks: 'Offline Assessment',
      });
      await loadProgressReport(currentStudentId, academicYear);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to record score.');
    } finally {
      setScoreSaving(false);
    }
  };

  // Printable Report Card Generator
  const printOfficialReportCard = () => {
    if (!report) return;
    const student = report.student;
    const scores = Array.isArray(report.scores) ? report.scores : [];
    const stats = report.statistics;
    const att = report.attendance;
    const fees = report.fees;

    const scoresToPrint = selectedMonth === 'ALL'
      ? scores
      : scores.filter((s) => {
        const m = getAssessmentMonthName(s.completedAt);
        return m.toLowerCase() === selectedMonth.toLowerCase();
      });

    const scoresRows = scoresToPrint
      .map(
        (s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${new Date(s.completedAt).toLocaleDateString()}</td>
          <td><strong>${s.title}</strong> ${s.isSourceDeleted ? '<span style="font-size:10px; color:#d97706; border:1px solid #fde68a; background:#fef3c7; padding:1px 4px; border-radius:4px;">Preserved</span>' : ''}</td>
          <td>${s.itemType === 'QUIZ' ? 'Quiz / Test' : 'Question Paper'}</td>
          <td>${s.subject || 'Mathematics'}</td>
          <td style="text-align: center;">${s.totalMarks}</td>
          <td style="text-align: center; font-weight: bold;">${s.score}</td>
          <td style="text-align: center; font-weight: bold;">${s.percentage}%</td>
          <td style="text-align: center; font-weight: bold; color: #0284c7;">${s.grade}</td>
          <td>${s.remarks || '—'}</td>
        </tr>`
      )
      .join('');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #0f172a;">
        <div style="border-bottom: 3px double #0284c7; padding-bottom: 16px; margin-bottom: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; color: #0369a1; text-transform: uppercase; letter-spacing: 1px;">Maths Mentor Academy</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">CBSE & Concept Coaching Centre · Learn · Practise · Excel</p>
          <h2 style="margin: 12px 0 0 0; font-size: 18px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
            Student Academic Progress Report (${report.academicYear}${selectedMonth !== 'ALL' ? ` · ${selectedMonth}` : ''})
          </h2>
          <p style="margin: 2px 0 0 0; font-size: 13px; color: #475569;">Annual Academic Session: April 1 to March 31</p>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <div>
            <p style="margin: 0 0 6px 0;"><strong>Student Name:</strong> ${student.name}</p>
            <p style="margin: 0 0 6px 0;"><strong>Class / Grade:</strong> ${student.grade || 'Grade 6'}</p>
            <p style="margin: 0 0 6px 0;"><strong>Date of Joining:</strong> ${report.student?.joiningDate ? new Date(report.student.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            <p style="margin: 0;"><strong>Academic Session:</strong> April 1, ${report.academicYear.split('-')[0]} – March 31, ${report.academicYear.split('-')[1]}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 6px 0;"><strong>Date of Report:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 0 0 6px 0;"><strong>Overall Grade:</strong> <span style="font-size: 18px; font-weight: bold; color: #0284c7;">${stats.overallGrade}</span></p>
            <p style="margin: 0;"><strong>Attendance Rate:</strong> ${att.rate}% (${att.present}/${att.totalDays} Days)</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; text-align: center;">
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #fff;">
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Average Score</span>
            <div style="font-size: 20px; font-weight: bold; color: #0369a1; margin-top: 4px;">${stats.averagePercentage}%</div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #fff;">
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Assessments Taken</span>
            <div style="font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px;">${stats.totalAssessments} Tests</div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #fff;">
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Highest / Lowest</span>
            <div style="font-size: 16px; font-weight: bold; color: #059669; margin-top: 6px;">${stats.highestPercentage}% / ${stats.lowestPercentage}%</div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #fff;">
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Fee Clearance</span>
            <div style="font-size: 16px; font-weight: bold; color: ${fees.status === 'PAID' ? '#059669' : '#e11d48'}; margin-top: 6px;">${fees.status === 'PAID' ? 'Cleared' : `₹${fees.totalPending} Due`}</div>
          </div>
        </div>

        <h3 style="font-size: 16px; color: #0f172a; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          Academic Score History (Quizzes & Question Papers)
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px; text-align: center;">#</th>
              <th style="padding: 8px; text-align: left;">Date</th>
              <th style="padding: 8px; text-align: left;">Assessment Title</th>
              <th style="padding: 8px; text-align: left;">Type</th>
              <th style="padding: 8px; text-align: left;">Subject</th>
              <th style="padding: 8px; text-align: center;">Max</th>
              <th style="padding: 8px; text-align: center;">Scored</th>
              <th style="padding: 8px; text-align: center;">%</th>
              <th style="padding: 8px; text-align: center;">Grade</th>
              <th style="padding: 8px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${scoresRows || '<tr><td colspan="10" style="text-align:center; padding:16px; color:#64748b;">No scores recorded for this session.</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #cbd5e1;">
          <div style="text-align: center; width: 200px;">
            <div style="border-bottom: 1px solid #475569; margin-bottom: 6px; height: 30px;"></div>
            <span style="font-size: 12px; font-weight: 600; color: #475569;">Teacher's Signature</span>
          </div>
          <div style="text-align: center; width: 200px;">
            <div style="border-bottom: 1px solid #475569; margin-bottom: 6px; height: 30px;"></div>
            <span style="font-size: 12px; font-weight: 600; color: #475569;">Principal / Centre Head</span>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center;">
          * Grading Scale: A+ (90-100%), A (80-89%), B (70-79%), C (60-69%), D (50-59%), F (Below 50%).
          Permanent academic archive record.
        </div>
      </div>
    `;

    printHtmlContent(html);
  };

  const stats = report?.statistics || (report as any)?.summary || {
    totalAssessments: 0,
    quizzesCount: 0,
    questionPapersCount: 0,
    averagePercentage: 0,
    highestPercentage: 0,
    lowestPercentage: 0,
    overallGrade: '—',
    deletedItemsPreservedCount: 0,
  };
  const att = report?.attendance || {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    totalDays: 0,
    rate: 100,
  };
  const fees = report?.fees || {
    totalDue: 0,
    totalPaid: 0,
    totalPending: 0,
    pendingMonths: 0,
    status: 'PAID' as FeeStatus,
  };
  const scores = Array.isArray(report?.scores) ? report.scores : [];

  // Filter by selected month first
  const monthScores = (selectedMonth === 'ALL'
    ? scores
    : scores.filter((s) => {
      const m = getAssessmentMonthName(s.completedAt);
      return m.toLowerCase() === selectedMonth.toLowerCase();
    })
  );

  // Then filter by type (ALL, QUIZ, QUESTION_PAPER)
  const filteredScores = monthScores.filter((s) => {
    if (typeFilter === 'QUIZ') return s.itemType === 'QUIZ';
    if (typeFilter === 'QUESTION_PAPER') return s.itemType === 'QUESTION_PAPER';
    return true;
  });

  const quizzesInMonthCount = monthScores.filter((s) => s.itemType === 'QUIZ').length;
  const papersInMonthCount = monthScores.filter((s) => s.itemType === 'QUESTION_PAPER').length;

  return (
    <div className="progress-report-panel">
      {/* Top Header Card */}
      <div className="report-header-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="overline" style={{ margin: 0 }}>Academic Year Report</span>
              <span className="academic-session-pill">Session: April to March</span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Student Progress & Assessment History
            </h2>
          </div>
        </div>

        {/* Toolbar: All dropdowns and buttons in the exact same line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '14px',
        }}>
          {/* Grade Selector Dropdown */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#334155', flexShrink: 0 }}>
            <span>Grade:</span>
            <select
              value={selectedGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="styled-select"
              style={{ minWidth: '95px', padding: '6px 10px', fontSize: '13px' }}
            >
              {ALL_STUDENT_GRADES.map((g) => {
                const count = students.filter((s) => (s.grade || 'Grade 6') === g).length;
                return (
                  <option key={g} value={g}>
                    {g}{count > 0 ? ` (${count})` : ''}
                  </option>
                );
              })}
            </select>
          </label>

          {/* Student Selector (Only students of selected Grade, without grade in brackets) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#334155', flexShrink: 0 }}>
            <span>Student:</span>
            <select
              value={currentStudentId}
              onChange={(e) => onSelectStudent(e.target.value)}
              className="styled-select"
              style={{ minWidth: '120px', maxWidth: '160px', padding: '6px 10px', fontSize: '13px' }}
              disabled={eligibleGradeStudents.length === 0}
            >
              {eligibleGradeStudents.length === 0 ? (
                <option value="">No students in {selectedGrade}</option>
              ) : (
                eligibleGradeStudents.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))
              )}
            </select>
          </label>

          {/* Academic Year Selector */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#334155', flexShrink: 0 }}>
            <span>Year:</span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="styled-select"
              style={{ minWidth: '105px', padding: '6px 10px', fontSize: '13px' }}
            >
              {['2026-2027', '2025-2026', '2024-2025', '2027-2028'].map((yr) => (
                <option key={yr} value={yr}>{yr} (Apr–Mar)</option>
              ))}
            </select>
          </label>

          {/* Month Selector Dropdown */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#334155', flexShrink: 0 }}>
            <span>Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="styled-select"
              style={{ minWidth: '110px', padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="ALL">All Months</option>
              {ACADEMIC_MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="button button-secondary"
            style={{ fontSize: '13px', padding: '6px 12px', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={printOfficialReportCard}
            disabled={eligibleGradeStudents.length === 0 || !currentStudentId || !report || filteredScores.length === 0}
          >
            <Printer size={15} /> Print Report Card
          </button>

          <button
            type="button"
            className="button button-primary"
            style={{ fontSize: '13px', padding: '6px 14px', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => setShowScoreModal(true)}
            disabled={eligibleGradeStudents.length === 0 || !currentStudentId}
          >
            <Plus size={15} /> Add Offline Test
          </button>
        </div>

        {/* Persistence Guarantee Banner */}
        <div className="persistence-notice-banner">
          <ShieldCheck size={20} color="#0284c7" style={{ flexShrink: 0 }} />
          <div>
            <strong>Permanent Score Preservation Guarantee:</strong> All quiz and question paper scores of this academic year (April to March) are permanently stored. Even if you delete a quiz or question paper later, the student&apos;s score, marks, percentage, and date will remain intact here.
            {gradeStudents.length > 0 && report && stats.deletedItemsPreservedCount > 0 && (
              <span style={{ display: 'block', marginTop: '4px', color: '#b45309', fontWeight: 600 }}>
                📌 {stats.deletedItemsPreservedCount} score record(s) from deleted assessments are actively preserved and displayed below.
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={26} className="spin" style={{ marginBottom: '10px' }} />
          <div>Loading student academic progress report...</div>
        </div>
      ) : (!currentStudentId || eligibleGradeStudents.length === 0 || !report || (report.student?.grade && report.student.grade !== selectedGrade)) ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '16px',
          border: '1px dashed #cbd5e1',
          margin: '20px 0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#f1f5f9',
            color: '#64748b',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Award size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            {gradeStudents.length === 0
              ? `No Students Enrolled in ${selectedGrade}`
              : eligibleGradeStudents.length === 0
                ? `No Students Enrolled in ${selectedGrade} for ${selectedMonth}`
                : 'No Student Selected'}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '440px', marginInline: 'auto' }}>
            {gradeStudents.length === 0
              ? `There are no students enrolled in ${selectedGrade}. Please select another grade from the Grade dropdown above.`
              : eligibleGradeStudents.length === 0
                ? `No students in ${selectedGrade} had joined on or before ${selectedMonth} (${academicYear}). Please select another month or grade.`
                : 'Please select a student from the dropdown above to view their academic summary, assessment scores, and attendance record.'}
          </p>
        </div>
      ) : (
        <>
          {/* Student Profile & KPI Performance Card */}
          <div className="report-profile-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="avatar avatar-large avatar-color-1">
                  {(report.student?.name || 'S').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                      {report.student?.name || 'Student'}
                    </h3>
                    <span className="grade-badge" style={{ fontSize: '12px' }}>{report.student?.grade || 'Grade 6'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                    <span>Academic Session: <strong>April 1, {academicYear.split('-')[0]} – March 31, {academicYear.split('-')[1]}</strong></span>
                    <span>·</span>
                    <span>
                      Date of Joining: <strong>{report.student?.joiningDate ? new Date(report.student.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</strong>
                    </span>
                    <span>·</span>
                    <span style={{ color: report.student?.active ? '#059669' : '#dc2626' }}>
                      {report.student?.active ? '● Active Student' : '● Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Big Overall Grade Badge */}
              <div className="overall-grade-pill">
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#0369a1' }}>Overall Grade</span>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0284c7', lineHeight: 1 }}>{stats.overallGrade || '—'}</div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Avg {stats.averagePercentage || 0}%</span>
              </div>
            </div>

            {/* Performance KPI Cards */}
            <div className="report-kpi-grid">
              <div className="report-kpi-item">
                <span className="rep-kpi-icon"><TrendingUp size={16} /></span>
                <div>
                  <span className="rep-kpi-title">Average Score</span>
                  <div className="rep-kpi-val">{stats.averagePercentage || 0}%</div>
                  <span className="rep-kpi-sub">High: {stats.highestPercentage || 0}% · Low: {stats.lowestPercentage || 0}%</span>
                </div>
              </div>

              <div className="report-kpi-item">
                <span className="rep-kpi-icon"><Award size={16} /></span>
                <div>
                  <span className="rep-kpi-title">Assessments</span>
                  <div className="rep-kpi-val">{stats.totalAssessments || 0} Total</div>
                  <span className="rep-kpi-sub">{stats.quizzesCount || 0} Quizzes · {stats.questionPapersCount || 0} Papers</span>
                </div>
              </div>

              <div className="report-kpi-item">
                <span className="rep-kpi-icon"><CalendarCheck size={16} /></span>
                <div>
                  <span className="rep-kpi-title">Session Attendance</span>
                  <div className="rep-kpi-val" style={{ color: (att.rate ?? 100) >= 75 ? '#059669' : '#e11d48' }}>
                    {att.rate ?? 100}%
                  </div>
                  <span className="rep-kpi-sub">{att.present ?? 0} / {att.totalDays ?? 0} Days Present</span>
                </div>
              </div>

              <div className="report-kpi-item">
                <span className="rep-kpi-icon"><CreditCard size={16} /></span>
                <div>
                  <span className="rep-kpi-title">Fee Clearance</span>
                  <div className="rep-kpi-val" style={{ color: fees.status === 'PAID' ? '#059669' : '#e11d48' }}>
                    {fees.status === 'PAID' ? 'Fully Cleared' : `₹${fees.totalPending || 0} Due`}
                  </div>
                  <span className="rep-kpi-sub">
                    {fees.status === 'PAID' ? 'All 12 Months Paid' : `${fees.pendingMonths || 0} Months Pending`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Score History Section */}
          <div className="score-history-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Complete Assessment & Test Score History
                  </h3>
                  <span
                    className="academic-session-pill"
                    style={{
                      background: selectedMonth === 'ALL' ? '#f1f5f9' : '#e0f2fe',
                      color: selectedMonth === 'ALL' ? '#475569' : '#0369a1',
                      borderColor: selectedMonth === 'ALL' ? '#cbd5e1' : '#bae6fd',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {selectedMonth === 'ALL' ? 'All Months (Apr–Mar)' : `Month: ${selectedMonth}`}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  {selectedMonth === 'ALL'
                    ? `Showing all quizzes, question papers & offline tests for session ${academicYear} (April to March)`
                    : `Showing quizzes, question papers & offline tests completed in ${selectedMonth} (${academicYear})`}
                </p>
              </div>

              {/* Assessment Type Filter */}
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-btn ${typeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('ALL')}
                >
                  All ({monthScores.length})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${typeFilter === 'QUIZ' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('QUIZ')}
                >
                  Quizzes ({quizzesInMonthCount})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${typeFilter === 'QUESTION_PAPER' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('QUESTION_PAPER')}
                >
                  Question Papers ({papersInMonthCount})
                </button>
              </div>
            </div>

            {filteredScores.length === 0 ? (
              <div style={{ padding: '16px 20px 8px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  No score records found for {selectedMonth === 'ALL' ? `session ${academicYear}` : `${selectedMonth} (${academicYear})`}
                  {typeFilter !== 'ALL' ? ` under ${typeFilter === 'QUIZ' ? 'Quizzes' : 'Question Papers'}` : ''}.
                </p>
                {scores.length > 0 && selectedMonth !== 'ALL' ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    There are <strong>{scores.length}</strong> assessment records in other months of this session.{' '}
                    <button
                      type="button"
                      className="button button-quiet"
                      style={{
                        display: 'inline-flex',
                        padding: '2px 8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#0284c7',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedMonth('ALL')}
                    >
                      View All Months
                    </button>
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    Record marks using &ldquo;Add Offline Test&rdquo; or complete quizzes in Student Space.
                  </p>
                )}
              </div>
            ) : (
              <div className="scores-table-container">
                <table className="scores-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Assessment Title</th>
                      <th>Type</th>
                      <th>Date Completed</th>
                      <th>Marks Obtained</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Status / Record Source</th>
                      <th>Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScores.map((score, idx) => (
                      <tr key={score.id}>
                        <td style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '14px' }}>{score.title}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {score.subject || 'Mathematics'}
                          </div>
                        </td>
                        <td>
                          <span className={`score-type-pill pill-${score.itemType.toLowerCase()}`}>
                            {score.itemType === 'QUIZ' ? 'Quiz / Test' : 'Question Paper'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>
                          {new Date(score.completedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '15px' }}>
                          <span style={{ color: '#0f172a' }}>{score.score}</span>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}> / {score.totalMarks}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="score-pct-bar">
                              <div
                                className="score-pct-fill"
                                style={{
                                  width: `${Math.min(100, score.percentage)}%`,
                                  background: score.percentage >= 80 ? '#059669' : score.percentage >= 60 ? '#0284c7' : '#e11d48',
                                }}
                              />
                            </div>
                            <strong style={{ fontSize: '13px', color: '#0f172a', width: '38px' }}>
                              {score.percentage}%
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span className={`letter-grade-badge grade-${score.grade.charAt(0).toLowerCase()}`}>
                            {score.grade}
                          </span>
                        </td>
                        <td>
                          {score.isSourceDeleted ? (
                            <span className="source-preserved-badge" title="Parent quiz/paper was deleted, but student score is preserved!">
                              <ShieldCheck size={12} /> Score Preserved
                            </span>
                          ) : score.sourceStatus === 'ARCHIVED' ? (
                            <span className="source-archived-badge">
                              <Archive size={12} /> Archived
                            </span>
                          ) : (
                            <span className="source-active-badge">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                          {score.remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Manual / Offline Test Score Entry Modal - Styled with subtle soft gray backdrop & inner panel */}
      {showScoreModal && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.18)',
            backdropFilter: 'blur(1.5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            pointerEvents: 'auto',
          }}
          onClick={() => setShowScoreModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 26px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.24), 0 10px 24px -6px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
              animation: 'rise-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #a7f3d0' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>Add Offline Assessment Score</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Manual score record for class tests, quizzes & papers</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button quiet"
                style={{ borderRadius: '10px' }}
                onClick={() => setShowScoreModal(false)}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveScoreRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label className="field" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Assessment Title</span>
                  <input
                    required
                    value={scoreDraft.title}
                    onChange={(e) => setScoreDraft({ ...scoreDraft, title: e.target.value })}
                    placeholder="e.g. Unit 3 Test: Fractions & Decimals"
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label className="field" style={{ gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Assessment Type</span>
                    <select
                      value={scoreDraft.itemType}
                      onChange={(e) => setScoreDraft({ ...scoreDraft, itemType: e.target.value as 'QUIZ' | 'QUESTION_PAPER' })}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%', cursor: 'pointer' }}
                    >
                      <option value="QUIZ">Quiz / Class Test</option>
                      <option value="QUESTION_PAPER">Question Paper / Exam</option>
                    </select>
                  </label>
                  <label className="field" style={{ gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Subject</span>
                    <select
                      value={ALL_ACADEMIC_SUBJECTS.includes(scoreDraft.subject) ? scoreDraft.subject : 'Other / Custom Subject'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other / Custom Subject') {
                          setScoreDraft({ ...scoreDraft, subject: 'Other' });
                        } else {
                          setScoreDraft({ ...scoreDraft, subject: val });
                        }
                      }}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%', cursor: 'pointer' }}
                    >
                      {getActiveSubjects().length > 0 && (
                        <optgroup label="Teaching Subjects">
                          {getActiveSubjects().map((subj) => (
                            <option key={subj} value={subj}>{subj}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Other Subjects">
                        {ALL_ACADEMIC_SUBJECTS.filter((subj) => !getActiveSubjects().includes(subj)).map((subj) => (
                          <option key={subj} value={subj}>{subj}</option>
                        ))}
                      </optgroup>
                    </select>
                  </label>
                </div>

                {(!ALL_ACADEMIC_SUBJECTS.filter((s) => s !== 'Other / Custom Subject').includes(scoreDraft.subject) || scoreDraft.subject === 'Other') && (
                  <label className="field" style={{ gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Specify Custom Subject Name</span>
                    <input
                      required
                      value={scoreDraft.subject === 'Other' ? '' : scoreDraft.subject}
                      onChange={(e) => setScoreDraft({ ...scoreDraft, subject: e.target.value })}
                      placeholder="e.g. Sanskrit Grammar, French, Accountancy"
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                    />
                  </label>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '12px' }}>
                  <label className="field" style={{ gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Marks Obtained</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={scoreDraft.score}
                      onChange={(e) => setScoreDraft({ ...scoreDraft, score: Number(e.target.value) })}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                    />
                  </label>
                  <label className="field" style={{ gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Max Marks</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={scoreDraft.totalMarks}
                      onChange={(e) => setScoreDraft({ ...scoreDraft, totalMarks: Number(e.target.value) })}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                    />
                  </label>
                  <label className="field" style={{ gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Date Completed</span>
                    <input
                      type="date"
                      required
                      value={scoreDraft.completedAt}
                      onChange={(e) => setScoreDraft({ ...scoreDraft, completedAt: e.target.value })}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%', cursor: 'pointer' }}
                    />
                  </label>
                </div>

                <label className="field" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Teacher Remarks / Notes</span>
                  <input
                    value={scoreDraft.remarks}
                    onChange={(e) => setScoreDraft({ ...scoreDraft, remarks: e.target.value })}
                    placeholder="e.g. Good problem solving on word problems"
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    This score will be automatically included in the student's progress report, overall grade, and averages.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ minHeight: '38px', padding: '0 16px', fontSize: '13.5px', borderRadius: '10px' }}
                  onClick={() => setShowScoreModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  style={{ minHeight: '38px', padding: '0 20px', fontSize: '13.5px', fontWeight: 700, borderRadius: '10px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  disabled={scoreSaving}
                >
                  {scoreSaving ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Add Score to Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ==========================================
// 4. MAIN STUDENT MANAGER
// ==========================================
function StudentManager({
  students,
  refresh,
  setNotice,
  onBackToClassroom,
  quizzes = [],
  selectedQuiz = '',
  setSelectedQuiz = () => { },
  results = [],
  distribution = [],
  onExport = () => { },
  onResetAttempt = async () => { },
  subTab: externalSubTab,
  setSubTab: externalSetSubTab,
  teacherName,
}: {
  students: Student[];
  refresh: () => Promise<void>;
  setNotice: (text: string) => void;
  onBackToClassroom?: () => void;
  quizzes?: Quiz[];
  selectedQuiz?: string;
  setSelectedQuiz?: (id: string) => void;
  results?: Result[];
  distribution?: { question: string; options: { text: string; correct: boolean; count: number }[] }[];
  onExport?: () => void;
  onResetAttempt?: (result: Result) => Promise<void>;
  subTab?: 'roster' | 'attendance' | 'fees' | 'progress' | 'results';
  setSubTab?: (tab: 'roster' | 'attendance' | 'fees' | 'progress' | 'results') => void;
  teacherName?: string | null;
}) {
  const [internalSubTab, setInternalSubTab] = useState<'roster' | 'attendance' | 'fees' | 'progress' | 'results'>('roster');
  const subTab = externalSubTab ?? internalSubTab;
  const setSubTab = (newSubTab: 'roster' | 'attendance' | 'fees' | 'progress' | 'results') => {
    if (externalSetSubTab) externalSetSubTab(newSubTab);
    else setInternalSubTab(newSubTab);
  };
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null);
  const [selectedStudentForFees, setSelectedStudentForFees] = useState<string | null>(null);

  // Roster Tab States
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(() => getDefaultGrade());
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [parentPhone, setParentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [filterGrade, setFilterGrade] = useState(() => getDefaultGrade() || 'ALL');
  const [editingStudent, setEditingStudent] = useState<{ id: string; name: string; grade: string; joiningDate: string; parentPhone?: string; parentName?: string } | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);
  const [createdPasskey, setCreatedPasskey] = useState('');
  const [createdStudentName, setCreatedStudentName] = useState('');
  const [visiblePasskeys, setVisiblePasskeys] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handlePrefChange = () => {
      const def = getDefaultGrade();
      if (def) {
        setFilterGrade(def);
        setGrade(def);
      }
    };
    window.addEventListener('teacher-preferences-updated', handlePrefChange);
    return () => window.removeEventListener('teacher-preferences-updated', handlePrefChange);
  }, []);

  useEffect(() => {
    if (!editingStudent) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingStudent(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingStudent]);

  async function addStudent(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const data = await api<{ student: { name: string; grade?: string; joiningDate?: string; parentPhone?: string; parentName?: string }; passkey: string }>('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          grade,
          joiningDate,
          parentPhone: parentPhone.trim() || undefined,
          parentName: parentName.trim() || undefined,
        }),
      });
      setCreatedPasskey(data.passkey);
      setCreatedStudentName(data.student.name || name);
      setName('');
      setParentPhone('');
      setParentName('');
      setGrade(getDefaultGrade());
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to add student.');
    } finally {
      setCreating(false);
    }
  }

  async function updateStudent(student: Student, action: 'disable' | 'enable' | 'reset') {
    try {
      const data = await api<{ passkey?: string }>(`/api/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(action === 'reset' ? { resetPasskey: true } : { active: action === 'enable' }),
      });
      if (data.passkey) {
        setCreatedPasskey(data.passkey);
        setCreatedStudentName(student.name);
      }
      setNotice(action === 'reset' ? `New 6-character passkey created for ${student.name}.` : `Student ${action === 'disable' ? 'disabled' : 'enabled'}.`);
      await refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to update student.');
    }
  }

  async function removeStudent(student: Student) {
    if (!window.confirm(`Remove ${student.name} and their attempt history? (Note: Historical April–March scores are safely preserved in student score records)`)) return;
    try {
      await api(`/api/students/${student.id}`, { method: 'DELETE' });
      await refresh();
      setNotice('Student removed.');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to remove student.');
    }
  }

  async function togglePasskeyVisibility(student: Student) {
    if (!student.passkey) {
      await updateStudent(student, 'reset');
    }
    setVisiblePasskeys((prev) => ({ ...prev, [student.id]: !prev[student.id] }));
  }

  const filteredStudents = filterGrade === 'ALL'
    ? students
    : students.filter((s) => (s.grade || 'Grade 6') === filterGrade);

  return (
    <section className="view-enter">
      {/* Top Heading */}
      <div className="page-heading">
        <div>
          <span className="overline">Student Management</span>
          <h1>Students.</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {onBackToClassroom && (
            <button className="button button-secondary" onClick={onBackToClassroom}>
              <ArrowLeft size={16} /> Back to Classroom
            </button>
          )}
          <span className="student-total">
            <Users size={16} /> {students.length} students
          </span>
        </div>
      </div>

      {/* Segmented Sub-Navigation Tabs */}
      <div className="student-subtabs-nav">
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'roster' ? 'active' : ''}`}
          onClick={() => setSubTab('roster')}
        >
          <Users size={16} />
          <span>Student Directory</span>
          <span className="subtab-count">{students.length}</span>
        </button>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setSubTab('attendance')}
        >
          <CalendarCheck size={16} />
          <span>Attendance Register</span>
        </button>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'fees' ? 'active' : ''}`}
          onClick={() => {
            setSelectedStudentForFees(null);
            setSubTab('fees');
          }}
        >
          <CreditCard size={16} />
          <span>Monthly Fees (Apr–Mar)</span>
        </button>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'progress' ? 'active' : ''}`}
          onClick={() => setSubTab('progress')}
        >
          <Award size={16} />
          <span>Progress Reports</span>
        </button>
        <button
          type="button"
          className={`student-subtab-btn ${subTab === 'results' ? 'active' : ''}`}
          onClick={() => setSubTab('results')}
        >
          <CheckCircle2 size={16} />
          <span>Results & Assessments</span>
        </button>
      </div>

      {/* Sub-Tab 1: Student Directory / Roster */}
      {subTab === 'roster' && (
        <div className="student-layout">
          <div className="roster-panel">
            <div className="panel-heading">
              <div>
                <h2>List Of Students</h2>
                <p>Manage student access, passkeys, and view records</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  aria-label="Filter students by grade"
                  style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, color: '#334155' }}
                >
                  <option value="ALL">All Grades ({students.length})</option>
                  {getActiveGrades().length > 0 && (
                    <optgroup label="Active Classes">
                      {getActiveGrades().map((g) => {
                        const count = students.filter((s) => (s.grade || 'Grade 6') === g).length;
                        const isDefault = g === getDefaultGrade();
                        return (
                          <option key={g} value={g}>
                            {g} ({count}){isDefault ? ' (Default)' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {ALL_STUDENT_GRADES.filter((g) => !getActiveGrades().includes(g)).length > 0 && (
                    <optgroup label="Other Classes">
                      {ALL_STUDENT_GRADES.filter((g) => !getActiveGrades().includes(g)).map((g) => {
                        const count = students.filter((s) => (s.grade || 'Grade 6') === g).length;
                        return (
                          <option key={g} value={g}>
                            {g} ({count})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
                <button className="icon-button" title="Refresh students" onClick={() => void refresh()}>
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {filteredStudents.length ? (
              <div className="roster-list">
                {filteredStudents.map((student, index) => {
                  const isShown = Boolean(visiblePasskeys[student.id]);
                  const passkeyVal = student.passkey || '';
                  return (
                    <div className={`roster-row ${!student.active ? 'inactive-row' : ''}`} key={student.id}>
                      <div className={`avatar avatar-roster avatar-color-${index % 4}`}>
                        {student.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="roster-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong>{student.name}</strong>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                            {student.grade || 'Grade 6'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="#0284c7" />
                            <strong>Date of Joining:</strong> {student.joiningDate ? new Date(student.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')}
                          </span>
                          <span>·</span>
                          <span style={{ color: student.active ? '#059669' : '#dc2626', fontWeight: 600 }}>
                            {student.active ? 'Active' : 'Access paused'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', flexWrap: 'wrap' }}>
                          {student.parentPhone ? (
                            <a
                              href={`https://wa.me/${cleanIndianPhoneNumber(student.parentPhone).fullWithCountry}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="whatsapp-roster-pill"
                              title={`Chat with ${student.parentName || 'parent'} on WhatsApp (${student.parentPhone})`}
                            >
                              <MessageCircle size={13} />
                              <span>Parent: {cleanIndianPhoneNumber(student.parentPhone).formatted} {student.parentName ? `(${student.parentName})` : ''}</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="text-button"
                              style={{ fontSize: '11.5px', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}
                              onClick={() => setEditingStudent({
                                id: student.id,
                                name: student.name,
                                grade: student.grade || getDefaultGrade(),
                                joiningDate: student.joiningDate
                                  ? new Date(student.joiningDate).toISOString().slice(0, 10)
                                  : (student.createdAt ? new Date(student.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
                                parentPhone: '',
                                parentName: '',
                              })}
                            >
                              <Plus size={12} /> Add Parent WhatsApp
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '13px' }}>
                          <span className="muted">Passkey:</span>
                          <code style={{ fontStyle: 'normal', fontWeight: 'bold', letterSpacing: isShown ? '2px' : '1px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '6px' }}>
                            {isShown ? (passkeyVal || '••••••') : '••••••'}
                          </code>
                          <button type="button" className="text-button" style={{ fontSize: '12px', padding: 0, color: '#047857' }} onClick={() => void togglePasskeyVisibility(student)}>
                            {isShown ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            className="text-button"
                            style={{ fontSize: '12px', padding: 0, color: '#059669' }}
                            onClick={async () => {
                              let key = student.passkey;
                              if (!key) {
                                const data = await api<{ passkey?: string }>(`/api/students/${student.id}`, { method: 'PATCH', body: JSON.stringify({ resetPasskey: true }) });
                                key = data.passkey || '';
                                await refresh();
                              }
                              void navigator.clipboard?.writeText(key);
                              setNotice(`Copied ${student.name}'s passkey.`);
                            }}
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>

                        {/* Quick Action Navigation Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: '11px', padding: '3px 10px', minHeight: '26px', gap: '4px' }}
                            onClick={() => {
                              setSelectedStudentForReport(student.id);
                              setSubTab('progress');
                            }}
                            title="View complete April–March score history & report card"
                          >
                            <Award size={13} color="#0284c7" /> Progress Report
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: '11px', padding: '3px 10px', minHeight: '26px', gap: '4px' }}
                            onClick={() => {
                              setSelectedStudentForFees(student.id);
                              setSubTab('fees');
                            }}
                            title="View 12-month fee ledger"
                          >
                            <CreditCard size={13} color="#059669" /> Fees Ledger
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: '11px', padding: '3px 10px', minHeight: '26px', gap: '4px' }}
                            onClick={() => setSubTab('results')}
                            title="View quiz results & assessment performance"
                          >
                            <CheckCircle2 size={13} color="#6366f1" /> Quiz Results
                          </button>
                        </div>
                      </div>

                      <div className="roster-actions">
                        <button
                          className="icon-button"
                          title="Edit student details & joining date"
                          aria-label={`Edit ${student.name}`}
                          onClick={() => setEditingStudent({
                            id: student.id,
                            name: student.name,
                            grade: student.grade || getDefaultGrade(),
                            joiningDate: student.joiningDate
                              ? new Date(student.joiningDate).toISOString().slice(0, 10)
                              : (student.createdAt ? new Date(student.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
                            parentPhone: student.parentPhone || '',
                            parentName: student.parentName || '',
                          })}
                        >
                          <Pencil size={15} />
                        </button>
                        <button className="icon-button" title="Generate a new passkey" aria-label={`Reset ${student.name}'s passkey`} onClick={() => void updateStudent(student, 'reset')}><RefreshCw size={15} /></button>
                        <button className="icon-button" title={student.active ? 'Pause access' : 'Restore access'} aria-label={`${student.active ? 'Disable' : 'Enable'} ${student.name}`} onClick={() => void updateStudent(student, student.active ? 'disable' : 'enable')}>{student.active ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                        <button className="icon-button danger-hover" title="Remove student" aria-label={`Delete ${student.name}`} onClick={() => void removeStudent(student)}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="roster-empty">
                {students.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span>No students found in {filterGrade}.</span>
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: '12px', padding: '4px 12px', minHeight: '30px' }}
                      onClick={() => setFilterGrade('ALL')}
                    >
                      Show All Grades ({students.length})
                    </button>
                  </div>
                ) : (
                  'No students yet. Add your first student to get started.'
                )}
              </div>
            )}
          </div>

          <aside className="add-student-panel">
            <span className="overline">Add to your class</span>
            <h2>A name, grade & passkey.</h2>
            <form onSubmit={addStudent} className="form-stack" style={{ marginBottom: '24px' }}>
              <label className="field">
                <span>Student name</span>
                <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Maya Chen" />
              </label>
              <label className="field">
                <span>Grade / Class</span>
                <select
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', width: '100%' }}
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
              <label className="field">
                <span>Date of Joining</span>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(event) => setJoiningDate(event.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', width: '100%' }}
                />
              </label>
              <label className="field">
                <span>Parent WhatsApp No. (India)</span>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    type="tel"
                    maxLength={15}
                    value={parentPhone}
                    onChange={(event) => setParentPhone(event.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </label>
              <label className="field">
                <span>Parent Name (Optional)</span>
                <input
                  maxLength={100}
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  placeholder="e.g. Mr. Sharma"
                />
              </label>
              <button className="button button-primary button-wide" disabled={creating}>
                {creating ? 'Creating...' : <><Plus size={16} /> Add student</>}
              </button>
            </form>
            {createdPasskey && (
              <div className="passkey-reveal" style={{ marginTop: '16px', marginBottom: '20px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>Passkey for <strong>{createdStudentName || 'Student'}</strong></span>
                  <button className="icon-button quiet" type="button" title="Dismiss" onClick={() => setCreatedPasskey('')}><X size={15} /></button>
                </div>
                <div style={{ marginTop: '6px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '28px', letterSpacing: '3px', fontFamily: 'monospace, sans-serif' }}>
                    {createdPasskey}
                  </strong>
                </div>
                <small>Short 6-character passkey. Share it with the student.</small>
                <div style={{ marginTop: '10px' }}>
                  <button type="button" className="text-button" onClick={() => { void navigator.clipboard?.writeText(createdPasskey); setNotice('Passkey copied.'); }}>
                    <Copy size={14} /> Copy passkey
                  </button>
                </div>
              </div>
            )}
            <div className="privacy-callout"><ShieldCheck size={16} /><span>Passkeys are private to each student. Their answers are never shown to other students.</span></div>
          </aside>
        </div>
      )}

      {/* Sub-Tab 2: Attendance Tracker */}
      {subTab === 'attendance' && (
        <AttendanceTrackerPanel students={students} setNotice={setNotice} />
      )}

      {/* Sub-Tab 3: Monthly Fees Tracker */}
      {subTab === 'fees' && (
        <MonthlyFeesPanel
          students={students}
          setNotice={setNotice}
          initialStudentId={selectedStudentForFees}
        />
      )}

      {/* Sub-Tab 4: Student Progress Reports */}
      {subTab === 'progress' && (
        <StudentProgressReportPanel
          students={students}
          selectedStudentId={selectedStudentForReport}
          onSelectStudent={(id) => setSelectedStudentForReport(id)}
          setNotice={setNotice}
        />
      )}

      {/* Sub-Tab 5: Quiz & Assessment Results */}
      {subTab === 'results' && (
        <ResultsPanel
          quizzes={quizzes}
          selectedQuiz={selectedQuiz}
          setSelectedQuiz={setSelectedQuiz}
          results={results}
          distribution={distribution}
          onExport={onExport}
          onResetAttempt={onResetAttempt}
          setNotice={setNotice}
          teacherName={teacherName}
          refreshStudents={refresh}
        />
      )}

      {/* Edit Student Modal - Clean floating card with subtle soft gray backdrop & panel */}
      {editingStudent && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.18)',
            backdropFilter: 'blur(1.5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            pointerEvents: 'auto',
          }}
          onClick={() => setEditingStudent(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 26px',
              maxWidth: '460px',
              width: '100%',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.24), 0 10px 24px -6px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
              animation: 'rise-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #a7f3d0' }}>
                  <Pencil size={19} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>Edit Student Details</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Update student profile, class grade & joining date</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button quiet"
                style={{ borderRadius: '10px' }}
                onClick={() => setEditingStudent(null)}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setEditingSaving(true);
              try {
                await api(`/api/students/${editingStudent.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    name: editingStudent.name.trim(),
                    grade: editingStudent.grade,
                    joiningDate: editingStudent.joiningDate,
                    parentPhone: editingStudent.parentPhone !== undefined ? (editingStudent.parentPhone.trim() || null) : undefined,
                    parentName: editingStudent.parentName !== undefined ? (editingStudent.parentName.trim() || null) : undefined,
                  })
                });
                setEditingStudent(null);
                await refresh();
                setNotice('✓ Student details updated successfully.');
              } catch (cause) {
                setNotice(cause instanceof Error ? cause.message : 'Unable to update student.');
              } finally {
                setEditingSaving(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label className="field" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Student Name</span>
                  <input
                    required
                    maxLength={100}
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    placeholder="e.g. Ayesha Khan"
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                  />
                </label>

                <label className="field" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Grade / Class</span>
                  <select
                    value={editingStudent.grade}
                    onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value })}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%', cursor: 'pointer' }}
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

                <label className="field" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Date of Joining</span>
                  <input
                    type="date"
                    required
                    value={editingStudent.joiningDate}
                    onChange={(e) => setEditingStudent({ ...editingStudent, joiningDate: e.target.value })}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Used as the enrollment start date for monthly fee ledgers & attendance records.
                  </span>
                </label>

                <label className="field" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Parent WhatsApp No. (India)</span>
                  <div className="phone-input-wrap">
                    <span className="phone-prefix">+91</span>
                    <input
                      type="tel"
                      maxLength={15}
                      value={editingStudent.parentPhone || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Used for sending instant student scorecards and quiz announcements.
                  </span>
                </label>

                <label className="field" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Parent Name (Optional)</span>
                  <input
                    maxLength={100}
                    value={editingStudent.parentName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                    placeholder="e.g. Mr. Sharma"
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ minHeight: '38px', padding: '0 16px', fontSize: '13.5px', borderRadius: '10px' }}
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  style={{ minHeight: '38px', padding: '0 20px', fontSize: '13.5px', fontWeight: 700, borderRadius: '10px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  disabled={editingSaving}
                >
                  {editingSaving ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}


function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getQuizMonthKey(quiz: Quiz): string {
  const raw = quiz.createdAt || quiz.updatedAt;
  if (!raw) return getCurrentMonthKey();
  const d = new Date(raw);
  if (isNaN(d.getTime())) return getCurrentMonthKey();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthKeyLabel(key: string): string {
  if (key === 'ALL') return 'All Months';
  const [yStr, mStr] = key.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(y) || isNaN(m)) return key;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function ResultsPanel({
  quizzes,
  selectedQuiz,
  setSelectedQuiz,
  results,
  distribution,
  onExport,
  onResetAttempt,
  setNotice,
  teacherName,
  refreshStudents,
}: {
  quizzes: Quiz[];
  selectedQuiz: string;
  setSelectedQuiz: (id: string) => void;
  results: Result[];
  distribution: { question: string; options: { text: string; correct: boolean; count: number }[] }[];
  onExport: () => void;
  onResetAttempt: (result: Result) => Promise<void>;
  setNotice?: (text: string) => void;
  teacherName?: string | null;
  refreshStudents?: () => Promise<void>;
}) {
  const currentMonthKey = getCurrentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => currentMonthKey);

  // If selectedQuiz prop changes to a quiz from another month (e.g. from open-results event),
  // sync selectedMonth so the quiz is visible in the dropdown
  useEffect(() => {
    if (selectedQuiz) {
      const activeQ = quizzes.find((q) => q.id === selectedQuiz);
      if (activeQ) {
        const qMonth = getQuizMonthKey(activeQ);
        if (qMonth && selectedMonth !== 'ALL' && selectedMonth !== qMonth) {
          setSelectedMonth(qMonth);
        }
      }
    }
  }, [selectedQuiz, quizzes]);

  const monthOptions = useMemo(() => {
    const keysSet = new Set<string>();
    keysSet.add(currentMonthKey);

    if (selectedMonth && selectedMonth !== 'ALL') {
      keysSet.add(selectedMonth);
    }

    quizzes.forEach((q) => {
      const k = getQuizMonthKey(q);
      if (k) keysSet.add(k);
    });

    const now = new Date();
    for (let i = -1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      keysSet.add(k);
    }

    const sortedKeys = Array.from(keysSet).sort((a, b) => b.localeCompare(a));

    const counts: Record<string, number> = {};
    quizzes.forEach((q) => {
      const k = getQuizMonthKey(q);
      counts[k] = (counts[k] || 0) + 1;
    });

    const list = sortedKeys.map((k) => {
      const label = formatMonthKeyLabel(k);
      const count = counts[k] || 0;
      return {
        value: k,
        label: `${label} · ${count} ${count === 1 ? 'quiz' : 'quizzes'}`,
        count,
      };
    });

    return [
      ...list,
      {
        value: 'ALL',
        label: `All Months · ${quizzes.length} total ${quizzes.length === 1 ? 'quiz' : 'quizzes'}`,
        count: quizzes.length,
        isCurrent: false,
      },
    ];
  }, [quizzes, currentMonthKey, selectedMonth]);

  const filteredQuizzes = useMemo(() => {
    if (selectedMonth === 'ALL') return quizzes;
    return quizzes.filter((item) => getQuizMonthKey(item) === selectedMonth);
  }, [quizzes, selectedMonth]);

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    if (selectedQuiz) {
      const activeQ = quizzes.find((q) => q.id === selectedQuiz);
      if (activeQ) {
        const qMonth = getQuizMonthKey(activeQ);
        if (newMonth !== 'ALL' && qMonth !== newMonth) {
          setSelectedQuiz('');
        }
      }
    }
  };

  const quiz = quizzes.find((entry) => entry.id === selectedQuiz);
  const submitted = results.filter((result) => result.status === 'SUBMITTED');
  const average = submitted.length
    ? Math.round(submitted.reduce((sum, result) => sum + (result.score ?? 0) / Math.max(1, result.totalMarks) * 100, 0) / submitted.length)
    : 0;
  const [expanded, setExpanded] = useState('');
  const [showStudentScores, setShowStudentScores] = useState(true);
  const [showAnswerPatterns, setShowAnswerPatterns] = useState(true);

  // Parent WhatsApp scorecard states
  const [phonePromptResult, setPhonePromptResult] = useState<Result | null>(null);
  const [promptPhone, setPromptPhone] = useState('');
  const [promptParentName, setPromptParentName] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  function triggerScorecardWhatsApp(targetResult: Result, phoneToUse?: string, parentNameToUse?: string) {
    const activeQ = quizzes.find((q) => q.id === selectedQuiz);
    const phone = phoneToUse || targetResult.parentPhone;
    const parentName = parentNameToUse !== undefined ? parentNameToUse : targetResult.parentName;
    const correctCount = targetResult.answers ? targetResult.answers.filter((a) => a.correct).length : undefined;
    const totalQuestions = targetResult.answers ? targetResult.answers.length : (activeQ?.questions?.length || 0);

    const message = generateScorecardMessage({
      studentName: targetResult.name,
      parentName,
      quizTitle: activeQ?.title || 'Classroom Assessment',
      score: targetResult.score,
      totalMarks: targetResult.totalMarks,
      submittedAt: targetResult.submittedAt,
      correctCount,
      totalQuestions,
      teacherName,
    });

    openWhatsAppChat(phone, message);
  }

  function handleShareScorecard(result: Result) {
    if (result.parentPhone && cleanIndianPhoneNumber(result.parentPhone).isValid) {
      triggerScorecardWhatsApp(result);
    } else {
      setPromptPhone(result.parentPhone || '');
      setPromptParentName(result.parentName || '');
      setPhonePromptResult(result);
    }
  }

  async function handleSavePromptPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!phonePromptResult) return;
    const { isValid, formatted } = cleanIndianPhoneNumber(promptPhone);
    if (!isValid) {
      alert('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }
    setSavingPhone(true);
    try {
      if (phonePromptResult.studentId) {
        await api(`/api/students/${phonePromptResult.studentId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            parentPhone: promptPhone.trim(),
            parentName: promptParentName.trim() || undefined,
          }),
        });
        phonePromptResult.parentPhone = promptPhone.trim();
        phonePromptResult.parentName = promptParentName.trim() || null;
        if (refreshStudents) void refreshStudents();
      }
      triggerScorecardWhatsApp(phonePromptResult, promptPhone.trim(), promptParentName.trim());
      setPhonePromptResult(null);
      if (setNotice) setNotice(`✓ Parent WhatsApp (${formatted}) saved and scorecard opened!`);
    } catch (cause) {
      if (setNotice) setNotice(cause instanceof Error ? cause.message : 'Unable to save parent phone.');
    } finally {
      setSavingPhone(false);
    }
  }

  return (
    <div className="results-subtab-panel">
      {/* Header and Quiz Selector Card */}
      <div className="report-header-card">
        {/* Top Row: Title on Left, Month filters & Export CSV on Top Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="overline" style={{ margin: 0 }}>Quiz & Assessment Evaluation</span>
              <span className="academic-session-pill">Evaluations & Scores</span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Quiz Results & Answer Analytics
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Scores, individual student answers, and question-by-question response patterns.
            </p>
          </div>

          {/* Top Right Corner: Month with quizzes, Month date picker, Export CSV */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <label
              className="select-wrap"
              style={{ minWidth: '190px', width: 'auto' }}
              title="Filter quizzes by month"
            >
              <select
                value={selectedMonth}
                onChange={(event) => handleMonthChange(event.target.value)}
                aria-label="Filter quizzes by month"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </label>

            <input
              type="month"
              value={selectedMonth === 'ALL' ? currentMonthKey : selectedMonth}
              onChange={(e) => {
                if (e.target.value) handleMonthChange(e.target.value);
              }}
              className="styled-date-input"
              title="Pick specific month from calendar"
              aria-label="Pick month from calendar"
              style={{ height: '46px', padding: '0 10px', fontSize: '13.5px', borderRadius: '12px' }}
            />

            <button className="button button-secondary" onClick={onExport} disabled={!results.length}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Second Row: Quiz Selector Dropdown */}
        <div style={{ marginTop: '14px' }}>
          <label className="select-wrap" style={{ width: '100%', display: 'block' }}>
            <select
              value={selectedQuiz}
              onChange={(event) => setSelectedQuiz(event.target.value)}
              aria-label="Choose a quiz"
              disabled={filteredQuizzes.length === 0}
            >
              <option value="">
                {filteredQuizzes.length === 0
                  ? `No quizzes in ${formatMonthKeyLabel(selectedMonth)}`
                  : `Choose a quiz (${filteredQuizzes.length})...`}
              </option>
              {filteredQuizzes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}{item.grade ? ` · ${item.grade}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </label>
        </div>
      </div>

      {quiz ? (
        <>
          <div className="results-metrics">
            <Metric label="Students started" value={results.length} icon={<Users size={17} />} tint="sage" />
            <Metric label="Submitted" value={submitted.length} icon={<CheckCircle2 size={17} />} tint="blue" />
            <Metric label="Class average" value={`${average}%`} icon={<BarChart3 size={17} />} tint="coral" />
          </div>

          <div className="results-layout">
            <div className="results-table-panel">
              <div className="panel-heading panel-heading-toggle" onClick={() => setShowStudentScores((prev) => !prev)}>
                <div>
                  <h2>Student scores</h2>
                  <p>{quiz.title} · {results.length} participants</p>
                </div>
                <div className="toggle-arrow" title={showStudentScores ? 'Hide student scores' : 'Show student scores'}>
                  {showStudentScores ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              {showStudentScores && (
                results.length ? (
                  <div className="results-list">
                    {results.map((result, index) => (
                      <div className="result-student" key={result.id}>
                        <div className="result-summary-row">
                          <button className="result-summary" onClick={() => setExpanded(expanded === result.id ? '' : result.id)}>
                            <span className={`avatar avatar-roster avatar-color-${index % 4}`}>{result.name.slice(0, 1).toUpperCase()}</span>
                            <span className="result-name">
                              <strong>{result.name}</strong>
                              <small>{result.status === 'SUBMITTED' ? 'Submitted' : 'In progress'}</small>
                            </span>
                            <strong className="result-score">{result.score === null ? '—' : `${result.score} / ${result.totalMarks}`}</strong>
                            <ChevronDown size={16} className={expanded === result.id ? 'rotate-chevron' : ''} />
                          </button>
                          <div className="result-summary-actions">
                            <button
                              type="button"
                              className="result-whatsapp-btn"
                              title={result.parentPhone ? `Share scorecard with parent on WhatsApp (${result.parentPhone})` : `Add parent WhatsApp number & share scorecard for ${result.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareScorecard(result);
                              }}
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </button>
                            <button
                              className="result-restart-btn"
                              title={`Reset quiz for ${result.name} so they can retake it`}
                              aria-label={`Reset quiz for ${result.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void onResetAttempt(result);
                              }}
                            >
                              <RotateCcw size={13} /> Restart Quiz
                            </button>
                          </div>
                        </div>
                        {expanded === result.id && (
                          <div className="answer-review">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Submitted Answers ({result.answers.length})
                              </span>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="result-whatsapp-btn"
                                  style={{ minHeight: '30px', padding: '4px 10px' }}
                                  title={result.parentPhone ? `Share scorecard with parent on WhatsApp (${result.parentPhone})` : `Add parent WhatsApp number & share scorecard`}
                                  onClick={() => handleShareScorecard(result)}
                                >
                                  <MessageCircle size={13} /> WhatsApp Scorecard
                                </button>
                                <button
                                  className="result-restart-btn"
                                  style={{ minHeight: '30px', padding: '4px 10px' }}
                                  title={`Reset quiz for ${result.name} so they can retake it`}
                                  onClick={() => void onResetAttempt(result)}
                                >
                                  <RotateCcw size={13} /> Restart Quiz for {result.name}
                                </button>
                              </div>
                            </div>
                            {result.answers.length ? (
                              result.answers.map((answer, answerIndex) => (
                                <div className="answer-review-row" key={answerIndex}>
                                  <span className={`answer-mark ${answer.correct ? 'mark-correct' : 'mark-wrong'}`}>
                                    {answer.correct ? <Check size={13} /> : <X size={13} />}
                                  </span>
                                  <div>
                                    <strong>{answer.question}</strong>
                                    <span>{answer.response} · {answer.correct ? `${answer.marks} point${answer.marks === 1 ? '' : 's'}` : 'Incorrect'}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="muted">No answers saved.</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="roster-empty">No one has joined this quiz yet.</div>
                )
              )}
            </div>

            <div className="distribution-panel">
              <div className="panel-heading panel-heading-toggle" onClick={() => setShowAnswerPatterns((prev) => !prev)}>
                <div>
                  <h2>Answer patterns</h2>
                  <p>Responses across the class</p>
                </div>
                <div className="toggle-arrow" title={showAnswerPatterns ? 'Hide answer patterns' : 'Show answer patterns'}>
                  {showAnswerPatterns ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              {showAnswerPatterns && (
                distribution.length ? (
                  distribution.map((question, index) => {
                    const count = question.options.reduce((sum, option) => sum + option.count, 0);
                    return (
                      <div className="result-distribution" key={index}>
                        <div className="result-distribution-title">
                          <span>Q{index + 1}</span>
                          <strong>{question.question}</strong>
                        </div>
                        {question.options.map((option, optionIndex) => (
                          <div className="result-option" key={optionIndex}>
                            <div>
                              <span>{option.text}</span>
                              <strong>{option.count}</strong>
                            </div>
                            <div className="bar-track">
                              <div
                                className={`bar-fill ${option.correct ? 'bar-correct' : ''}`}
                                style={{ width: `${count ? (option.count / count) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })
                ) : (
                  <div className="roster-empty">Question patterns will appear here.</div>
                )
              )}
            </div>
          </div>
        </>
      ) : filteredQuizzes.length === 0 ? (
        <div className="empty-state" style={{ background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '48px 24px', textAlign: 'center' }}>
          <span className="empty-icon"><Calendar size={24} color="#0284c7" /></span>
          <h3 style={{ margin: '10px 0 6px 0', fontSize: '17px', color: '#1e293b', fontWeight: 700 }}>
            No quizzes conducted in {formatMonthKeyLabel(selectedMonth)}
          </h3>
          <p style={{ margin: '0 auto', maxWidth: '480px', fontSize: '13px', color: '#64748b' }}>
            There are no quizzes created for this month. Pick a different month above or view all quizzes across all time.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {selectedMonth !== currentMonthKey && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => handleMonthChange(currentMonthKey)}
                style={{ fontSize: '13px' }}
              >
                Switch to {formatMonthKeyLabel(currentMonthKey)}
              </button>
            )}
            <button
              type="button"
              className="button button-secondary"
              onClick={() => handleMonthChange('ALL')}
              style={{ fontSize: '13px' }}
            >
              Show All Quizzes ({quizzes.length})
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '48px 24px' }}>
          <span className="empty-icon"><BarChart3 size={24} /></span>
          <h3>Choose a quiz to see its story.</h3>
          <p>
            Showing quizzes for {formatMonthKeyLabel(selectedMonth)} ({filteredQuizzes.length} available). Select a quiz above to review student scores, responses, and question patterns.
          </p>
        </div>
      )}

      {/* Quick Parent WhatsApp Prompt Modal */}
      {phonePromptResult && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.25)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            pointerEvents: 'auto',
          }}
          onClick={() => setPhonePromptResult(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 26px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.24), 0 10px 24px -6px rgba(15, 23, 42, 0.12)',
              border: '1px solid #e2e8f0',
              animation: 'rise-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #a7f3d0' }}>
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Send Scorecard</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>For <strong>{phonePromptResult.name}</strong> ({phonePromptResult.score ?? 0}/{phonePromptResult.totalMarks} marks)</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button quiet"
                onClick={() => setPhonePromptResult(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Enter the parent's Indian WhatsApp number below. It will be saved to the student's profile, and the pre-filled scorecard will open instantly in WhatsApp.
            </p>

            <form onSubmit={handleSavePromptPhone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label className="field" style={{ gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Parent WhatsApp Number (India)</span>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    type="tel"
                    required
                    autoFocus
                    maxLength={15}
                    value={promptPhone}
                    onChange={(e) => setPromptPhone(e.target.value)}
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                  />
                </div>
              </label>

              <label className="field" style={{ gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Parent Name (Optional)</span>
                <input
                  maxLength={100}
                  value={promptParentName}
                  onChange={(e) => setPromptParentName(e.target.value)}
                  placeholder="e.g. Mr. Sharma"
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, width: '100%' }}
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setPhonePromptResult(null)}
                  style={{ minHeight: '38px', padding: '0 16px', fontSize: '13.5px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  style={{ minHeight: '38px', padding: '0 18px', fontSize: '13.5px', fontWeight: 700, borderRadius: '10px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  disabled={savingPhone}
                >
                  {savingPhone ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={15} /> Save & Open WhatsApp
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function StudentApp({
  user,
  onSignOut,
  notice,
  setNotice,
  onViewPortal,
  onOpenUserGuide,
}: {
  user: User;
  onSignOut: () => void;
  notice: string;
  setNotice: (text: string) => void;
  onViewPortal?: () => void;
  onOpenUserGuide?: () => void;
}) {
  const [tab, setTabState] = useState<'open' | 'whiteboard' | 'quiz_history' | 'paper_history' | 'calendar'>(() => {
    const saved = localStorage.getItem('student_active_tab') as any;
    const validTabs = ['open', 'whiteboard', 'quiz_history', 'paper_history', 'calendar'];
    return validTabs.includes(saved) ? saved : 'open';
  });

  const setTab = (newTab: 'open' | 'whiteboard' | 'quiz_history' | 'paper_history' | 'calendar') => {
    setTabState(newTab);
    localStorage.setItem('student_active_tab', newTab);
  };

  const [liveWhiteboardInfo, setLiveWhiteboardInfo] = useState<{ isLive: boolean; grade?: string; teacherName?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const isGradeMatch = (gradeA?: string | null, gradeB?: string | null): boolean => {
      if (!gradeA || !gradeB) return true;
      const a = gradeA.trim().toLowerCase();
      const b = gradeB.trim().toLowerCase();
      if (a === b || a === 'all' || b === 'all' || a === 'all grades' || b === 'all grades') return true;
      const matchA = a.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/i);
      const matchB = b.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/i);
      if (matchA && matchB) return matchA[1] === matchB[1];
      return a.replace(/[-_\s]+/g, '') === b.replace(/[-_\s]+/g, '');
    };

    const checkLiveStatus = async () => {
      try {
        const gradeParam = user.grade ? encodeURIComponent(user.grade) : '';
        const teacherParam = user.teacherId ? encodeURIComponent(user.teacherId) : '';
        const res = await fetch(`/api/whiteboard/live-status?grade=${gradeParam}&teacherId=${teacherParam}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (isMounted) {
          if (data && data.isLive) {
            setLiveWhiteboardInfo(data);
          } else {
            setLiveWhiteboardInfo(null);
          }
        }
      } catch (_) {}
    };

    checkLiveStatus();
    const interval = window.setInterval(checkLiveStatus, 10000);

    const socket = io({
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      checkLiveStatus();
    });

    socket.on('whiteboard:status_update', (data: any) => {
      if (!isMounted) return;
      const matchesTeacher = !user.teacherId || !data.teacherId || data.teacherId === user.teacherId;
      const matchesGrade = !data.grade || data.grade === 'ALL' || !user.grade || isGradeMatch(data.grade, user.grade);
      if (data?.isLive) {
        if (matchesTeacher || matchesGrade) {
          setLiveWhiteboardInfo(data);
        }
      } else {
        setLiveWhiteboardInfo(null);
      }
    });

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      socket.disconnect();
    };
  }, [user.grade, user.teacherId]);

  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liveTimer, setLiveTimer] = useState<LiveTimerState | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const submittedRef = useRef(false);
  const activeQuizRef = useRef<ActiveQuiz | null>(null);
  activeQuizRef.current = activeQuiz;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isQuizSoundEnabled());
  const lastPlayedWarningSecRef = useRef<number | null>(null);

  useEffect(() => {
    lastPlayedWarningSecRef.current = null;
  }, [activeQuiz?.currentQuestionIndex]);

  useEffect(() => {
    if (!activeQuiz || activeQuiz.mode !== 'LIVE' || !liveTimer || !liveTimer.enabled || liveTimer.isPaused) {
      return;
    }
    // Last 5 seconds light warning music (5, 4, 3, 2, 1)
    if (liveTimer.phase === 'question' && liveTimer.remainingSeconds >= 1 && liveTimer.remainingSeconds <= 5) {
      if (lastPlayedWarningSecRef.current !== liveTimer.remainingSeconds) {
        lastPlayedWarningSecRef.current = liveTimer.remainingSeconds;
        playCountdownWarningSound(liveTimer.remainingSeconds, soundEnabled);
      }
    } else if (liveTimer.phase === 'revealing' || liveTimer.phase === 'gap') {
      if (lastPlayedWarningSecRef.current !== 0) {
        lastPlayedWarningSecRef.current = 0;
        playAnswerRevealChime(soundEnabled);
      }
    } else if (liveTimer.phase === 'question' && liveTimer.remainingSeconds > 5) {
      lastPlayedWarningSecRef.current = null;
    }
  }, [activeQuiz?.id, activeQuiz?.mode, activeQuiz?.currentQuestionIndex, liveTimer?.phase, liveTimer?.remainingSeconds, liveTimer?.isPaused, liveTimer?.enabled, soundEnabled]);

  async function joinQuiz(quizId: string) {
    unlockAudio();
    setError('');
    try {
      sessionStorage.setItem('activeQuizId', quizId);
      const data = await api<{ quiz: ActiveQuiz }>(`/api/student/quizzes/${quizId}`);
      setActiveQuiz(data.quiz);
      if (data.quiz.timer !== undefined) setLiveTimer(data.quiz.timer);
      setAnswers(Object.fromEntries((data.quiz.attempt?.answers ?? []).map((answer) => [answer.questionId, answer.optionId])));
      setQuestionIndex(data.quiz.currentQuestionIndex);
      submittedRef.current = data.quiz.attempt?.status === 'SUBMITTED';
    } catch (cause) {
      sessionStorage.removeItem('activeQuizId');
      setError(cause instanceof Error ? cause.message : 'Unable to join this quiz.');
    }
  }

  async function loadQuizzes() {
    setLoading(true);
    try {
      const data = await api<{ quizzes: StudentQuiz[] }>('/api/student/quizzes');
      setQuizzes(data.quizzes);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load quizzes.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadQuizzes(); }, []);
  useEffect(() => {
    const socket = io({ withCredentials: true, transports: ['websocket', 'polling'] });
    socket.on('quiz:lobby_updated', () => {
      void api<{ quizzes: StudentQuiz[] }>('/api/student/quizzes').then((data) => {
        setQuizzes(data.quizzes);
        const currentActive = activeQuizRef.current;
        // If the student has already submitted, do not reset their active view
        if (currentActive && currentActive.attempt?.status !== 'SUBMITTED') {
          const fresh = data.quizzes.find((q) => q.id === currentActive.id);
          if (!fresh || fresh.status === 'DRAFT' || !fresh.attempt) {
            setAnswers({});
            setQuestionIndex(0);
            submittedRef.current = false;
            setLiveTimer(null);
            setActiveQuiz((prev) => prev ? {
              ...prev,
              status: fresh ? fresh.status : 'DRAFT',
              currentQuestionIndex: 0,
              currentAnswerRevealed: false,
              attempt: null,
            } : null);
          }
        }
      }).catch(() => undefined);
    });
    socket.on('quiz:attempt_reset', (data: { quizId: string; studentId: string; studentName: string }) => {
      if (user.id && user.id !== data.studentId) return;
      setNotice('Your teacher has reset this quiz so you can try again!');
      setAnswers({});
      setQuestionIndex(0);
      submittedRef.current = false;
      setLiveTimer(null);
      sessionStorage.removeItem('activeQuizId');
      setActiveQuiz(null);
      setTab('open');
      void loadQuizzes();
    });
    return () => { socket.disconnect(); };
  }, [user.id]);
  useEffect(() => {
    if (activeQuiz) return;
    const timer = window.setInterval(() => {
      void api<{ quizzes: StudentQuiz[] }>('/api/student/quizzes').then((data) => setQuizzes(data.quizzes)).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeQuiz?.id]);
  useEffect(() => { if (notice) { const timer = window.setTimeout(() => setNotice(''), 3000); return () => window.clearTimeout(timer); } }, [notice]);

  useEffect(() => {
    const currentQuiz = activeQuizRef.current;
    if (!currentQuiz) return;
    const socket = io({ withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('watch:quiz', currentQuiz.id));

    socket.on('quiz:timer', (timerData: LiveTimerState) => {
      setLiveTimer(timerData);
    });

    socket.on('quiz:restarted', (data: { quizId: string }) => {
      const liveId = activeQuizRef.current?.id;
      if (!liveId || liveId !== data.quizId) return;
      // For kids who have already submitted, nothing should change!
      if (activeQuizRef.current?.attempt?.status === 'SUBMITTED') return;
      // For kids who have not submitted, restart to Question 1:
      setAnswers({});
      setQuestionIndex(0);
      submittedRef.current = false;
      setLiveTimer(null);
      sessionStorage.removeItem('activeQuizId');
      setActiveQuiz((prev) => prev ? {
        ...prev,
        status: 'DRAFT',
        currentQuestionIndex: 0,
        currentAnswerRevealed: false,
        attempt: null,
      } : null);
      void loadQuizzes();
    });

    socket.on('quiz:attempt_reset', (data: { quizId: string; studentId: string; studentName: string }) => {
      const liveId = activeQuizRef.current?.id;
      if (!liveId || liveId !== data.quizId) return;
      if (user.id && user.id !== data.studentId) return;
      setNotice('Your teacher has reset this quiz so you can try again!');
      setAnswers({});
      setQuestionIndex(0);
      submittedRef.current = false;
      setLiveTimer(null);
      sessionStorage.removeItem('activeQuizId');
      setActiveQuiz(null);
      void loadQuizzes();
    });

    socket.on('quiz:state', (state: any) => {
      const liveId = activeQuizRef.current?.id;
      if (state?.timer !== undefined) {
        setLiveTimer(state.timer);
      }
      if (state.status === 'CLOSED' && liveId) {
        sessionStorage.removeItem('activeQuizId');
        setLiveTimer(null);
        void api<{ quiz: ActiveQuiz }>(`/api/student/quizzes/${liveId}`).then(({ quiz }) => {
          setActiveQuiz(quiz);
          if (quiz.attempt?.answers) {
            setAnswers(Object.fromEntries(quiz.attempt.answers.map((ans) => [ans.questionId, ans.optionId])));
          }
          submittedRef.current = quiz.attempt?.status === 'SUBMITTED';
        }).catch(() => undefined);
        void loadQuizzes();
        return;
      }
      if (state.status === 'DRAFT' && liveId) {
        // Teacher restarted quiz to DRAFT
        if (activeQuizRef.current?.attempt?.status === 'SUBMITTED') {
          // Submitted kids: nothing changes
          return;
        }
        setAnswers({});
        setQuestionIndex(0);
        submittedRef.current = false;
        setLiveTimer(null);
        setActiveQuiz((prev) => prev ? {
          ...prev,
          status: 'DRAFT',
          currentQuestionIndex: 0,
          currentAnswerRevealed: false,
          attempt: null,
        } : null);
        void loadQuizzes();
        return;
      }
      if (activeQuizRef.current?.mode === 'LIVE') {
        setActiveQuiz((current) => {
          if (!current) return current;
          if (current.attempt?.status === 'SUBMITTED' || current.status === 'CLOSED') {
            return { ...current, status: state.status, currentQuestionIndex: state.currentQuestionIndex, currentAnswerRevealed: state.currentAnswerRevealed };
          }
          const questions = state.question ? [state.question] : current.questions;
          return {
            ...current,
            status: state.status,
            currentQuestionIndex: state.currentQuestionIndex,
            currentAnswerRevealed: state.currentAnswerRevealed,
            questionCount: state.questionCount ?? current.questionCount,
            totalMarks: state.totalMarks ?? current.totalMarks,
            questions
          };
        });
      }
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [activeQuiz?.id]);

  useEffect(() => {
    if (!activeQuiz) return;
    const isFinished = activeQuiz.attempt?.status === 'SUBMITTED' || activeQuiz.status === 'CLOSED';
    const hasIncompleteQuestions = isFinished && activeQuiz.questionCount && activeQuiz.questions.length < activeQuiz.questionCount;
    if (isFinished && (hasIncompleteQuestions || (activeQuiz.questions.length <= 1 && (activeQuiz.questionCount ?? 0) > 1))) {
      void api<{ quiz: ActiveQuiz }>(`/api/student/quizzes/${activeQuiz.id}`).then(({ quiz }) => {
        setActiveQuiz(quiz);
        if (quiz.attempt?.answers) {
          setAnswers((prev) => ({
            ...prev,
            ...Object.fromEntries(quiz.attempt!.answers.map((ans) => [ans.questionId, ans.optionId]))
          }));
        }
      }).catch(() => undefined);
    }
  }, [activeQuiz?.id, activeQuiz?.attempt?.status, activeQuiz?.status, activeQuiz?.questions.length, activeQuiz?.questionCount]);

  useEffect(() => {
    if (!activeQuiz?.attempt?.deadlineAt || activeQuiz.attempt.status !== 'IN_PROGRESS') { setRemaining(null); return; }
    const update = () => setRemaining(Math.max(0, Math.ceil((new Date(activeQuiz.attempt!.deadlineAt!).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz?.attempt?.deadlineAt, activeQuiz?.attempt?.status]);

  const currentQuestion = activeQuiz?.mode === 'LIVE' ? activeQuiz.questions[0] : activeQuiz?.questions[questionIndex];
  const isSubmitted = activeQuiz?.attempt?.status === 'SUBMITTED';

  async function saveAnswer(questionId: string, optionId: string) {
    unlockAudio();
    if (!activeQuiz || isSubmitted) return;
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setSaving(true);
    try { await api(`/api/student/quizzes/${activeQuiz.id}/answers`, { method: 'PUT', body: JSON.stringify({ questionId, optionId }) }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your answer could not be saved.'); }
    finally { setSaving(false); }
  }

  async function submitQuiz(skipConfirm = false) {
    if (!activeQuiz || submitting || submittedRef.current) return;
    if (!skipConfirm && !window.confirm('Do you want to submit the quiz?')) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await api<{ score: number | null }>(`/api/student/quizzes/${activeQuiz.id}/submit`, { method: 'POST' });
      const data = await api<{ quiz: ActiveQuiz }>(`/api/student/quizzes/${activeQuiz.id}`);
      setActiveQuiz(data.quiz);
      if (data.quiz.attempt?.answers) {
        setAnswers((prev) => ({
          ...prev,
          ...Object.fromEntries(data.quiz.attempt!.answers.map((ans) => [ans.questionId, ans.optionId]))
        }));
      }
      await loadQuizzes();
    } catch (cause) { submittedRef.current = false; setError(cause instanceof Error ? cause.message : 'Unable to submit your quiz.'); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { if (remaining === 0 && activeQuiz?.mode === 'SELF_PACED' && !isSubmitted) void submitQuiz(true); }, [remaining, activeQuiz?.mode, isSubmitted]);

  const isFinished = activeQuiz?.attempt?.status === 'SUBMITTED' || activeQuiz?.status === 'CLOSED';
  const openQuizzes = quizzes.filter((q) => q.status === 'ACTIVE' && q.attempt?.status !== 'SUBMITTED');
  const historyQuizzes = quizzes.filter((q) => q.attempt?.status === 'SUBMITTED' || (q.status === 'CLOSED' && q.attempt !== null));

  if (activeQuiz) {
    const questionList = activeQuiz.questions;
    const total = activeQuiz.mode === 'LIVE' ? Math.max(activeQuiz.currentQuestionIndex + 1, questionList.length) : questionList.length;
    const totalPossibleMarks = (activeQuiz.totalMarks && activeQuiz.totalMarks > 0)
      ? activeQuiz.totalMarks
      : activeQuiz.questions.reduce((sum, q) => sum + (q.marks ?? 1), 0);

    return <main className="student-shell"><header className="student-topbar"><div className="student-brand"><span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span><span>EduAshram</span></div><div className="student-top-right"><ClassroomChatHeaderButton /><span className="student-name"><span className="avatar avatar-small">{user.name?.slice(0, 1).toUpperCase()}</span>{user.name}</span><button className="button button-secondary" style={{ fontSize: '13px', padding: '5px 12px', minHeight: '34px', gap: '6px' }} onClick={() => { setActiveQuiz(null); sessionStorage.removeItem('activeQuizId'); void loadQuizzes(); }}><ArrowLeft size={14} /> Back to Classroom</button></div></header>
      <div className="student-quiz-wrap">{isFinished ? (
        <div className="student-review-shell">
          <div className="submitted-card review-header-card">
            <div className="submitted-icon"><Check size={28} /></div>
            <span className="overline">Quiz Results</span>
            <h1>{activeQuiz.title}</h1>
            <p>{activeQuiz.status === 'CLOSED' ? 'This quiz has been closed by your teacher.' : 'Here is your performance breakdown.'}</p>
            {activeQuiz.showResults && activeQuiz.attempt?.score !== null && activeQuiz.attempt?.score !== undefined && (
              <div className="score-display">
                <strong>{activeQuiz.attempt.score}</strong>
                <span>/ {totalPossibleMarks} {totalPossibleMarks === 1 ? 'point' : 'points'}</span>
              </div>
            )}
          </div>

          <div className="student-review-list">
            <h3 style={{ font: '700 22px Fredoka, sans-serif', color: 'var(--ink)', margin: '32px 0 16px' }}>Question Breakdown</h3>
            {activeQuiz.questions.map((question, qIndex) => {
              const studentOptionId = answers[question.id ?? ''];
              const studentOption = question.options.find((o) => o.id === studentOptionId);
              const isStudentCorrect = studentOption?.isCorrect;

              return (
                <div key={question.id ?? qIndex} className={`review-question-card ${isStudentCorrect ? 'review-correct' : 'review-wrong'}`}>
                  <div className="review-question-header">
                    <span className="review-q-num">Q{qIndex + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong>{question.prompt}</strong>
                        <QuestionTypeBadge type={question.type} />
                      </div>
                    </div>
                    <span className={`review-points-badge ${isStudentCorrect ? 'pts-correct' : 'pts-wrong'}`}>
                      {isStudentCorrect ? `+${question.marks} pt` : `0 / ${question.marks} pts`}
                    </span>
                  </div>

                  {question.imageUrl && (
                    <div className="question-image-box" style={{ marginTop: '10px' }}>
                      <img src={question.imageUrl} alt="Question diagram" className="question-image" />
                    </div>
                  )}

                  <div className="review-options-list">
                    {question.options.map((option, optIndex) => {
                      const isChosen = studentOptionId === option.id;
                      const isOptionCorrect = Boolean(option.isCorrect);

                      let optionClass = 'review-option-item';
                      if (isChosen && isOptionCorrect) optionClass += ' choice-correct';
                      else if (isChosen && !isOptionCorrect) optionClass += ' choice-wrong';
                      else if (isOptionCorrect) optionClass += ' answer-key-correct';

                      return (
                        <div key={option.id ?? optIndex} className={optionClass}>
                          <span className="student-option-letter">{String.fromCharCode(65 + optIndex)}</span>
                          <span style={{ flex: 1 }}>{option.text}</span>
                          {isChosen && (
                            <span className={`choice-badge ${isOptionCorrect ? 'badge-good' : 'badge-bad'}`}>
                              {isOptionCorrect ? 'Your answer (Correct)' : 'Your answer (Incorrect)'}
                            </span>
                          )}
                          {!isChosen && isOptionCorrect && (
                            <span className="choice-badge badge-good"><Check size={13} /> Correct answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <button className="button button-primary" onClick={() => { setActiveQuiz(null); sessionStorage.removeItem('activeQuizId'); void loadQuizzes(); }}>
              Return to Classroom
            </button>
          </div>
        </div>
      ) : <>
        <div className="student-quiz-heading"><div><span className="overline">{activeQuiz.mode === 'LIVE' ? <><i className="live-dot" /> Live classroom</> : activeQuiz.timeLimitSeconds !== null ? 'Timed practice' : 'Self-paced practice'}</span><h1>{activeQuiz.title}</h1></div>{activeQuiz.mode === 'SELF_PACED' && activeQuiz.timeLimitSeconds !== null && <div className={`timer-chip ${remaining !== null && remaining < 60 ? 'timer-warning' : ''}`}><Clock3 size={16} /><span>{remaining === null ? '--:--' : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`}</span></div>}{activeQuiz.mode === 'LIVE' && liveTimer && liveTimer.enabled && <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><div className={`timer-chip ${liveTimer.phase === 'gap' ? 'timer-gap' : liveTimer.phase === 'revealing' ? 'timer-gap' : liveTimer.isPaused ? 'timer-paused' : liveTimer.remainingSeconds <= 5 ? 'timer-warning' : ''}`} style={{ minWidth: '180px', padding: '0 22px' }}>{liveTimer.phase === 'gap' ? <><CheckCircle2 size={16} /><span>Next in {Math.max(1, liveTimer.gapRemainingSeconds)}s</span></> : liveTimer.phase === 'revealing' ? <><CheckCircle2 size={16} /><span>Revealing...</span></> : liveTimer.phase === 'advancing' ? <><Clock3 size={16} /><span>Loading...</span></> : liveTimer.isPaused ? <><Pause size={16} /><span>Paused ({Math.max(0, liveTimer.remainingSeconds)}s)</span></> : <><Clock3 size={16} /><span>{Math.max(0, liveTimer.remainingSeconds)}s</span></>}</div><button type="button" className="icon-button" style={{ height: '48px', width: '48px', borderRadius: '14px', background: soundEnabled ? '#ecfdf5' : '#f1f5f9', borderColor: soundEnabled ? '#a7f3d0' : '#cbd5e1', color: soundEnabled ? '#059669' : '#64748b' }} title={soundEnabled ? '5-second countdown warning sound is ON. Click to mute / test.' : '5-second countdown warning sound is OFF. Click to unmute.'} onClick={() => { unlockAudio(); const next = !soundEnabled; setSoundEnabled(next); setQuizSoundEnabled(next); if (next) { playTestSound(); } }}>{soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}</button></div>}</div>
        <div className="student-progress"><span>Question {activeQuiz.mode === 'LIVE' ? activeQuiz.currentQuestionIndex + 1 : questionIndex + 1} <i>of {activeQuiz.mode === 'LIVE' ? total : questionList.length}</i></span><div className="progress-track"><div style={{ width: `${(activeQuiz.mode === 'LIVE' ? (activeQuiz.currentQuestionIndex + 1) / total : (questionIndex + 1) / questionList.length) * 100}%` }} /></div><span className="saved-label">{saving ? 'Saving...' : answers[currentQuestion?.id ?? ''] ? 'Answer saved' : 'Not answered'}</span></div>
        {liveTimer && liveTimer.enabled && liveTimer.phase === 'revealing' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 18px',
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '14px',
              color: '#92400e',
              marginBottom: '16px',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
            }}
          >
            <Clock3 size={20} color="#d97706" />
            <span>Time's up! Revealing correct answer...</span>
          </div>
        )}
        {liveTimer && liveTimer.enabled && liveTimer.phase === 'gap' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 18px',
              background: '#ecfdf5',
              border: '2px solid #10b981',
              borderRadius: '14px',
              color: '#065f46',
              marginBottom: '16px',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#059669" />
              <span>Time’s up! Correct answer is revealed below</span>
            </div>
            <span
              style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Next question in {Math.max(1, liveTimer.gapRemainingSeconds)}s...
            </span>
          </div>
        )}
        {liveTimer && liveTimer.enabled && liveTimer.isPaused && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: '#fffbeb',
              border: '1.5px solid #f59e0b',
              borderRadius: '12px',
              color: '#92400e',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Pause size={17} color="#d97706" />
            <span>Teacher has paused the timer on this question. Take your time!</span>
          </div>
        )}
        {currentQuestion ? <div className="student-question-card">
          <div className="question-card-top">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              QUESTION {String(activeQuiz.mode === 'LIVE' ? activeQuiz.currentQuestionIndex + 1 : questionIndex + 1).padStart(2, '0')}
              <QuestionTypeBadge type={currentQuestion.type} />
            </span>
            <span>{currentQuestion.marks} point{currentQuestion.marks === 1 ? '' : 's'}</span>
          </div>

          <h2>{currentQuestion.prompt}</h2>

          {currentQuestion.imageUrl && (
            <div className="question-image-box">
              <img src={currentQuestion.imageUrl} alt="Question diagram" className="question-image" />
            </div>
          )}

          {currentQuestion.type === 'FILL_BLANK' && (
            <div className="callout-box fb-callout">
              <PenTool size={16} /> <span>Select the answer choice below to complete the blank:</span>
            </div>
          )}

          {currentQuestion.type === 'SOLVE' && (
            <div className="callout-box solve-callout">
              <Calculator size={16} /> <span>Solve & Select your answer choice:</span>
            </div>
          )}

          <div className={`student-options ${currentQuestion.type === 'TRUE_FALSE' ? 'options-grid-tf' : ''}`}>
            {currentQuestion.options.map((option, index) => {
              const chosen = answers[currentQuestion.id ?? ''] === option.id;
              const correct = Boolean(option.isCorrect);
              const isLocked = activeQuiz.currentAnswerRevealed || saving || Boolean(liveTimer?.enabled && (liveTimer?.phase === 'revealing' || liveTimer?.phase === 'gap' || liveTimer?.phase === 'advancing'));
              return <button key={option.id ?? index} className={`student-option ${chosen ? 'option-selected' : ''} ${activeQuiz.currentAnswerRevealed && correct ? 'option-revealed' : ''}`} onClick={() => void saveAnswer(currentQuestion.id!, option.id!)} disabled={isLocked}><span className="student-option-letter">{String.fromCharCode(65 + index)}</span><span>{option.text}</span>{chosen && <span className="option-check"><Check size={15} /></span>}{activeQuiz.currentAnswerRevealed && correct && <span className="correct-label">Correct</span>}</button>;
            })}
          </div>
          {activeQuiz.currentAnswerRevealed && (
            <div className="answer-revealed-note">
              <CheckCircle2 size={15} />{' '}
              {liveTimer && liveTimer.enabled && liveTimer.phase === 'gap'
                ? `Time's up! Answer revealed · Next question in ${Math.max(1, liveTimer.gapRemainingSeconds)}s`
                : liveTimer && liveTimer.enabled && liveTimer.phase === 'revealing'
                  ? `Time's up! Answer revealed to classroom`
                  : 'Your teacher revealed the answer'}
            </div>
          )}
        </div> : <div className="waiting-card"><div className="waiting-pulse"><Radio size={22} /></div><h2>You're in.</h2><p>Your teacher will bring up the first question in a moment.</p><span className="waiting-label"><i /> Waiting for the teacher</span></div>}
        {activeQuiz.mode === 'SELF_PACED' ? <><div className="question-jump"><span>Jump to</span>{questionList.map((question, index) => <button className={`${questionIndex === index ? 'jump-current' : ''} ${answers[question.id ?? ''] ? 'jump-answered' : ''}`} key={question.id ?? index} onClick={() => setQuestionIndex(index)}>{index + 1}</button>)}<span className="jump-legend"><i /> Answered</span></div><div className="student-nav"><button className="button button-secondary" onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))} disabled={questionIndex === 0}><ArrowLeft size={16} /> Previous</button>{questionIndex < questionList.length - 1 ? <button className="button button-primary" onClick={() => setQuestionIndex(Math.min(questionList.length - 1, questionIndex + 1))}>Next question <ArrowRight size={16} /></button> : <button className="button button-primary" onClick={() => void submitQuiz()} disabled={submitting || saving}>{submitting ? 'Submitting...' : <>Submit quiz <Send size={15} /></>}</button>}</div></> : <div className="live-student-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '12px 18px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '20px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><i className="live-dot" /> {liveTimer && liveTimer.enabled ? (liveTimer.phase === 'gap' ? `Next question loading in ${Math.max(1, liveTimer.gapRemainingSeconds)}s...` : liveTimer.phase === 'revealing' ? 'Revealing answer to classroom...' : liveTimer.phase === 'advancing' ? 'Loading next question...' : liveTimer.isPaused ? 'Timer is paused by teacher.' : `Auto-advance timer: ${Math.max(0, liveTimer.remainingSeconds)}s remaining.`) : 'Your teacher controls the next question.'}</span><span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> Your answer is saved automatically.</span></div>}
      </>}{error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: '#fffbeb',
            border: '1.5px solid #f59e0b',
            borderRadius: '12px',
            color: '#92400e',
            marginTop: '16px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
          }}
          role="alert"
        >
          <Clock3 size={17} color="#d97706" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#b45309',
              padding: '2px 4px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Dismiss"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}</div><footer className="student-footer">Take a breath. You’ve got this.</footer></main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark"><img src="/logo.png" alt="EduAshram" className="brand-logo" /></span>
          <span>EduAshram</span>
          <span className="brand-dot" />
        </div>
        <div className="sidebar-label">STUDENT DASHBOARD</div>
        <nav className="side-nav" aria-label="Student navigation">
          <NavItem
            active={tab === 'open'}
            icon={<BookOpenCheck size={17} />}
            label="Open Classroom"
            count={openQuizzes.length}
            onClick={() => setTab('open')}
          />
          <NavItem
            active={tab === 'whiteboard'}
            icon={<PenTool size={17} />}
            label={liveWhiteboardInfo?.isLive ? 'Live Whiteboard' : 'Whiteboard'}
            count={liveWhiteboardInfo?.isLive ? 'LIVE' : undefined}
            onClick={() => setTab('whiteboard')}
          />
          <NavItem
            active={tab === 'quiz_history'}
            icon={<Clock3 size={17} />}
            label="Quiz History"
            count={historyQuizzes.length}
            onClick={() => setTab('quiz_history')}
          />
          <NavItem
            active={tab === 'paper_history'}
            icon={<FileText size={17} />}
            label="Question Papers History"
            onClick={() => setTab('paper_history')}
          />
          <NavItem
            active={tab === 'calendar'}
            icon={<Calendar size={17} />}
            label="Class Calendar"
            onClick={() => setTab('calendar')}
          />
          {onViewPortal && (
            <NavItem
              active={false}
              icon={<BookOpen size={17} />}
              label="Study Material Hub"
              onClick={onViewPortal}
            />
          )}
          {onOpenUserGuide && (
            <NavItem
              active={false}
              icon={<BookOpen size={17} />}
              label="User Guide"
              onClick={onOpenUserGuide}
            />
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="teacher-profile">
            <div className="avatar avatar-green">{(user.name ?? 'S').slice(0, 1).toUpperCase()}</div>
            <div className="profile-copy">
              <strong>{user.name}</strong>
              <span title={user.teacherName ? `Teacher: ${user.teacherName}` : undefined}>{user.teacherName ? `Teacher: ${user.teacherName}` : (user.grade ? `${user.grade} · Student` : 'Student account')}</span>
            </div>
            <button className="icon-button quiet" title="Sign out" aria-label="Sign out" onClick={onSignOut}>
              <LogOut size={16} />
            </button>
          </div>
          <div className="sidebar-footnote">Learn at your own rhythm.</div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Your classroom <span>/</span> <strong>{tab === 'open' ? 'Open Classroom' : tab === 'whiteboard' ? 'Live Whiteboard' : tab === 'quiz_history' ? 'Quiz History' : tab === 'paper_history' ? 'Question Papers History' : 'Class Calendar & Reminders'}</strong>
          </div>
          <div className="topbar-actions">
            {onViewPortal && (
              <button className="button button-secondary" style={{ fontSize: '13px', padding: '5px 12px', minHeight: '34px', gap: '6px' }} onClick={onViewPortal} title="Browse public revision notes, videos & formulas">
                <BookOpen size={14} /> Study Materials Hub
              </button>
            )}
            {onOpenUserGuide && (
              <button
                className="button button-secondary guide-topbar-btn"
                onClick={onOpenUserGuide}
                title="Open Complete User Guide (Public Portal, Teacher's Space, Student's Space)"
              >
                <BookOpen size={14} /> User Guide
              </button>
            )}
            {tab !== 'open' ? (
              <button className="button button-secondary" style={{ fontSize: '13px', padding: '5px 12px', minHeight: '34px', gap: '6px' }} onClick={() => setTab('open')}>
                <ArrowLeft size={14} /> Back to Classroom
              </button>
            ) : (
              <button className="button button-secondary" style={{ fontSize: '13px', padding: '5px 12px', minHeight: '34px', gap: '6px' }} onClick={onSignOut}>
                <LogOut size={14} /> Logout
              </button>
            )}
            <ClassroomChatHeaderButton />
            <span className="today-label">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <button className="icon-button" title="Refresh classroom" aria-label="Refresh classroom" onClick={() => void loadQuizzes()} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </header>

        <section className={tab === 'calendar' ? 'content-area student-home-content--calendar' : tab === 'whiteboard' ? 'content-area content-area--whiteboard' : 'student-home-content'}>
          {error && <div className="inline-error" style={{ marginBottom: '20px' }}>{error}</div>}

          {loading ? (
            <div className="student-loading"><RefreshCw size={17} className="spin" /> Loading...</div>
          ) : (
            <>
              {/* 1. OPEN CLASSROOM (Open Quizzes & Open Question Papers) */}
              {tab === 'open' && (
                <>
                  <div className="student-welcome" style={{ marginBottom: '28px' }}>
                    <div>
                      <span className="overline">Your classroom</span>
                      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        Hi, {user.name?.split(' ')[0]}.
                        <span style={{ fontSize: '13px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                          {user.grade || 'Grade 6'}
                        </span>
                      </h1>
                      <p>Active quizzes and worksheets ready for you to take</p>
                    </div>
                    <div className="welcome-mark"><Sparkles size={25} /></div>
                  </div>

                  {/* Live Whiteboard Announcement Banner (if Teacher is Broadcasting) */}
                  {liveWhiteboardInfo?.isLive && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
                      border: '1.5px solid #fecdd3',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '24px',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#ef4444',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
                          flexShrink: 0
                        }}>
                          <PenTool size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span className="live-pill-indicator">
                              <span className="live-pulse-dot" /> LIVE CLASS IN PROGRESS
                            </span>
                            {liveWhiteboardInfo.grade && (
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: '#e0f2fe', color: '#0369a1' }}>
                                {liveWhiteboardInfo.grade === 'ALL' ? 'All Grades' : liveWhiteboardInfo.grade}
                              </span>
                            )}
                          </div>
                          <strong style={{ fontSize: '15px', color: '#881337', display: 'block' }}>
                            {liveWhiteboardInfo.teacherName || 'Teacher'} is teaching live on the Whiteboard
                          </strong>
                          <span style={{ fontSize: '12.5px', color: '#9f1239' }}>
                            Open the live whiteboard tab to view real-time notes and drawings alongside your Zoom meeting.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ background: '#dc2626', borderColor: '#b91c1c', color: '#ffffff', padding: '8px 18px', fontWeight: 700, whiteSpace: 'nowrap', minHeight: '38px', borderRadius: '8px' }}
                        onClick={() => setTab('whiteboard')}
                      >
                        Join Live Board →
                      </button>
                    </div>
                  )}

                  {/* Open Quizzes */}
                  <div className="student-quiz-list">
                    <div className="section-heading">
                      <div>
                        <h2>Open Quizzes and Worksheets</h2>
                        <p>Active quizzes ready for you to take</p>
                      </div>
                      <button className="icon-button" title="Refresh quizzes" onClick={() => void loadQuizzes()}>
                        <RefreshCw size={16} />
                      </button>
                    </div>
                    {openQuizzes.length ? (
                      openQuizzes.map((quiz) => (
                        <button className="student-quiz-tile" key={quiz.id} onClick={() => void joinQuiz(quiz.id)}>
                          <span className={`quiz-mode-icon ${quiz.mode === 'LIVE' ? 'mode-live' : 'mode-timed'}`}>
                            {quiz.mode === 'LIVE' ? <Radio size={20} /> : <Clock3 size={20} />}
                          </span>
                          <span className="student-tile-copy">
                            <strong>{quiz.title}</strong>{' '}
                            <span>{quiz.mode === 'LIVE' ? (quiz.timeLimitSeconds ? `${quiz.timeLimitSeconds}s timer · Live classroom` : 'Live classroom · Teacher-led') : quiz.timeLimitSeconds !== null ? `${Math.round((quiz.timeLimitSeconds ?? 0) / 60)} minutes · Self-paced` : 'Self-paced · No time limit'}</span>
                          </span>
                          <span className="tile-start">
                            {quiz.attempt?.status === 'IN_PROGRESS' ? 'Continue' : 'Join'} <ArrowRight size={15} />
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="student-waiting-home">
                        <div className="waiting-pulse"><BookOpenCheck size={22} /></div>
                        <h2>No open quizzes right now.</h2>
                        <p>When your teacher opens a quiz, it will appear here.</p>
                      </div>
                    )}
                  </div>

                  {/* Open Question Papers & Worksheets */}
                  <div style={{ marginTop: '36px' }}>
                    <StudentOpenWorksheetsSection setNotice={setNotice} />
                  </div>
                </>
              )}

              {/* 2. LIVE CLASSES */}
              {/* 3. QUIZ HISTORY */}
              {tab === 'quiz_history' && (
                <div className="student-quiz-list" style={{ marginTop: '0' }}>
                  <div className="section-heading">
                    <div>
                      <h2>Quiz History</h2>
                      <p>Your completed quizzes and scores</p>
                    </div>
                    <button className="icon-button" title="Refresh history" onClick={() => void loadQuizzes()}>
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  {historyQuizzes.length ? (
                    historyQuizzes.map((quiz) => (
                      <div className="student-quiz-tile history-tile" key={quiz.id} onClick={() => void joinQuiz(quiz.id)}>
                        <span className="quiz-mode-icon mode-history"><BookOpenCheck size={20} /></span>
                        <span className="student-tile-copy">
                          <strong>{quiz.title}</strong>{' '}
                          <span>{quiz.mode === 'LIVE' ? 'Live round' : 'Self-paced practice'} · {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'}</span>
                        </span>
                        {quiz.attempt?.score !== null && quiz.attempt?.score !== undefined && (
                          <span className="history-score-pill">Score: <strong>{quiz.attempt.score}</strong> / {quiz.totalMarks ?? 0}</span>
                        )}
                        <span className="tile-start text-button" style={{ fontSize: '14px' }}>Review <ArrowRight size={14} /></span>
                      </div>
                    ))
                  ) : (
                    <div className="student-waiting-home">
                      <BookOpenCheck size={22} color="#94a3b8" />
                      <h2>No completed quizzes yet.</h2>
                      <p>When you complete live or self-paced quizzes, your results will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. QUESTION PAPERS HISTORY */}
              {tab === 'paper_history' && (
                <div style={{ marginTop: '0' }}>
                  <StudentWorksheetHistorySection setNotice={setNotice} />
                </div>
              )}

              {/* 4. CLASS CALENDAR & REMINDERS */}
              {tab === 'calendar' && (
                <div style={{ marginTop: '0' }}>
                  <ClassroomCalendar user={user} readOnly={true} />
                </div>
              )}

              {/* 5. LIVE WHITEBOARD */}
              {tab === 'whiteboard' && (
                <div style={{ marginTop: '0', width: '100%' }}>
                  <StudentLiveWhiteboard
                    studentId={user.id}
                    studentName={user.name || 'Student'}
                    studentGrade={user.grade || 'Grade 10'}
                    teacherId={user.teacherId}
                    setNotice={setNotice}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* ==========================================================================
   WORKBOOK ANSWER SHEETS & QUESTION PAPERS COMPONENTS
   ========================================================================== */

function WorksheetsPanel({ setNotice, teacherName, onNavigateToAISettings, onNavigateToArchive }: { setNotice: (msg: string) => void; teacherName?: string | null; onNavigateToAISettings?: () => void; onNavigateToArchive?: () => void }) {
  const [worksheets, setWorksheets] = useState<WorksheetPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPaper, setEditingPaper] = useState<Partial<WorksheetPaper> | null>(null);
  const [viewingPaper, setViewingPaper] = useState<WorksheetPaper | null>(null);
  const [checkingSubmissions, setCheckingSubmissions] = useState<WorksheetPaper | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  const activeWorksheets = worksheets.filter((p) => p.status !== 'ARCHIVED');
  const archivedWorksheets = worksheets.filter((p) => p.status === 'ARCHIVED');

  async function loadWorksheets() {
    setLoading(true);
    try {
      const data = await api<{ worksheets: WorksheetPaper[] }>('/api/worksheets');
      setWorksheets(data.worksheets);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to load worksheets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadWorksheets(); }, []);

  async function savePaper(paper: Partial<WorksheetPaper>) {
    try {
      if (paper.id) {
        await api(`/api/worksheets/${paper.id}`, { method: 'PATCH', body: JSON.stringify(paper) });
        setNotice(paper.status === 'DRAFT' ? '📝 Question paper saved in Draft mode.' : '🚀 Question paper published!');
      } else {
        await api('/api/worksheets', { method: 'POST', body: JSON.stringify(paper) });
        setNotice(paper.status === 'DRAFT' ? '📝 Question paper saved in Draft mode.' : '🚀 Question paper created and published!');
      }
      setEditingPaper(null);
      await loadWorksheets();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save question paper.');
    }
  }

  async function deletePaper(id: string) {
    if (!window.confirm('Are you sure you want to delete this question paper and all student submissions?')) return;
    try {
      await api(`/api/worksheets/${id}`, { method: 'DELETE' });
      setNotice('Question paper deleted.');
      await loadWorksheets();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete paper.');
    }
  }

  if (showAIModal) {
    return (
      <section className="view-enter">
        <div className="page-heading compact-heading">
          <div>
            <button className="back-link" onClick={() => setShowAIModal(false)}>
              <ArrowLeft size={15} /> All Question Papers
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span className="ai-badge" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', color: '#0369a1', borderColor: '#7dd3fc' }}>
                <Sparkles size={15} /> AI Word-Style Generator
              </span>
            </div>
            <h1 style={{ marginTop: '4px' }}>Generate Question Paper</h1>
          </div>
        </div>

        <div className="ai-page-card" style={{ boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)' }}>
          <AIWorksheetModal
            onClose={() => setShowAIModal(false)}
            onGenerated={async () => {
              setShowAIModal(false);
              setNotice('✨ AI Question Paper generated and published!');
              await loadWorksheets();
            }}
            onNavigateToAISettings={onNavigateToAISettings}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="view-enter">
      <div className="page-heading">
        <div>
          <span className="overline">QUESTION PAPERS</span>
          <h1>Question Papers</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="button button-primary" onClick={() => setShowAIModal(true)}>
            <Sparkles size={16} /> Generate with AI
          </button>
          <button
            className="button button-secondary"
            onClick={() => {
              const defSubj = getDefaultSubject();
              const defGrd = getDefaultGrade();
              setEditingPaper({
                title: 'New Question Paper',
                subject: defSubj,
                grade: defGrd,
                totalMarks: 100,
                status: 'DRAFT',
                content: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; width: 100%;">
  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px;">
    <h1 style="margin: 0; font-size: 22px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">${defSubj.toUpperCase()} WORKSHEET PAPER</h1>
    <h3 style="margin: 4px 0 0 0; color: #475569; font-weight: 500; font-size: 15px;">${defGrd} &nbsp;|&nbsp; Subject: ${defSubj}</h3>
    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-weight: 600; font-size: 13px; color: #334155;">
      <span>Time Allowed: 60 Mins</span>
      <span>Total Marks: 100</span>
    </div>
  </div>

  <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 10px 14px; margin-bottom: 18px; font-size: 13px; border-radius: 4px;">
    <strong style="color: #0369a1;">Instructions for Students:</strong>
    <ul style="margin: 4px 0 0 18px; padding-left: 16px; color: #334155;">
      <li>Solve all questions neatly in your physical workbook.</li>
      <li>Write your full name, class, and clear question numbers on your answer sheet.</li>
      <li>Upload clear photos/scans of your answer sheets when completed.</li>
    </ul>
  </div>

  <div style="display: flex; flex-direction: column; gap: 12px;">
    <p style="margin: 0 0 12px 0; font-size: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
      <strong>Q1.</strong> Explain the process of photosynthesis in plants. <span style="color: #64748b; font-size: 13px;">[10 Marks]</span>
    </p>

    <p style="margin: 0 0 12px 0; font-size: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
      <strong>Q2.</strong> List three key differences between physical and chemical changes. <span style="color: #64748b; font-size: 13px;">[10 Marks]</span>
    </p>
  </div>
</div>`.trim(),
              });
            }}
          >
            <Plus size={16} /> Create Word Paper
          </button>
          {onNavigateToArchive && (
            <button className="button button-secondary" onClick={onNavigateToArchive}>
              <Archive size={16} /> View Archive
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="roster-empty">Loading question papers...</div>
      ) : activeWorksheets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><FileText size={26} /></span>
          <h3>No Active Question Papers.</h3>
          <p style={{ margin: '0 0 16px', color: '#64748b' }}>
            {archivedWorksheets.length > 0
              ? 'All completed question papers are safely preserved in your Archive.'
              : 'Create Word-style question papers for students to solve on physical paper and upload answer sheets.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="button button-primary" onClick={() => setShowAIModal(true)}>
              <Sparkles size={16} /> Generate with AI
            </button>
            {onNavigateToArchive && (
              <button className="button button-secondary" onClick={onNavigateToArchive}>
                <Archive size={15} /> View Archive
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="worksheet-grid">
          {activeWorksheets.map((paper) => (
            <div className="worksheet-card" key={paper.id}>
              <div>
                <div className="worksheet-card-meta">
                  <span className={`worksheet-badge ${paper.status === 'PUBLISHED' ? 'badge-published' : paper.status === 'ARCHIVED' ? 'badge-subject' : 'badge-draft'}`}>
                    {paper.status === 'ARCHIVED' ? '✓ COMPLETED' : paper.status}
                  </span>
                  {paper.subject && <span className="worksheet-badge badge-subject">{paper.subject}</span>}
                  {paper.grade && <span className="worksheet-badge badge-draft">{paper.grade}</span>}
                </div>
                <h3>{paper.title}</h3>
                <div className="worksheet-card-stats">
                  <span>Marks: <strong>{paper.totalMarks}</strong></span>
                  <span>Created: <strong>{new Date(paper.createdAt).toLocaleDateString()}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="button button-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 10px' }}
                    title="Edit in Question Paper Studio"
                    onClick={async () => {
                      const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${paper.id}`);
                      setEditingPaper(full.worksheet);
                    }}
                  >
                    <Pencil size={13} /> Edit Studio
                  </button>
                  <button
                    className="button button-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 10px' }}
                    onClick={() => setViewingPaper(paper)}
                  >
                    <Eye size={13} /> View Paper
                  </button>
                  {paper.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: '12.5px', padding: '6px 10px', color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5', whiteSpace: 'nowrap' }}
                      title="Share question paper / homework announcement on WhatsApp"
                      onClick={() => {
                        const text = generateWorksheetAnnouncementMessage({
                          paperTitle: paper.title,
                          subject: paper.subject,
                          grade: paper.grade,
                          totalMarks: paper.totalMarks,
                          teacherName,
                        });
                        openWhatsAppChat(null, text);
                      }}
                    >
                      <MessageCircle size={13} color="#059669" /> WhatsApp
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', width: '100%' }}>
                  <button
                    className="button button-primary"
                    style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', whiteSpace: 'nowrap' }}
                    onClick={async () => {
                      const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${paper.id}`);
                      setCheckingSubmissions(full.worksheet);
                    }}
                  >
                    <CheckSquare size={13} /> Submissions ({paper._count?.submissions ?? 0})
                  </button>

                  {paper.status === 'PUBLISHED' && (
                    <button
                      className="button button-secondary"
                      style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5', whiteSpace: 'nowrap' }}
                      title="Mark all student answer sheet submissions complete"
                      onClick={async () => {
                        await api(`/api/worksheets/${paper.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'ARCHIVED' }),
                        });
                        setNotice('✓ Question paper marked complete and moved to Archive.');
                        await loadWorksheets();
                      }}
                    >
                      <CheckCircle2 size={13} color="#047857" /> Mark Complete
                    </button>
                  )}
                  {paper.status === 'ARCHIVED' && (
                    <button
                      className="button button-secondary"
                      style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', whiteSpace: 'nowrap' }}
                      title="Re-open submissions for students"
                      onClick={async () => {
                        await api(`/api/worksheets/${paper.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'PUBLISHED' }),
                        });
                        setNotice('Submissions re-opened for students.');
                        await loadWorksheets();
                      }}
                    >
                      <RotateCcw size={13} /> Re-open
                    </button>
                  )}
                  {paper.status === 'DRAFT' && (
                    <button
                      className="button button-secondary"
                      style={{ flex: '1 1 auto', fontSize: '12px', padding: '6px 8px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', whiteSpace: 'nowrap' }}
                      title="Publish question paper for students"
                      onClick={async () => {
                        await api(`/api/worksheets/${paper.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'PUBLISHED' }),
                        });
                        setNotice('🚀 Question paper published for students!');
                        await loadWorksheets();
                      }}
                    >
                      <Send size={13} color="#0284c7" /> Publish
                    </button>
                  )}
                  <button
                    className="icon-button danger-hover"
                    title="Delete Paper"
                    style={{ padding: '6px 8px', height: '30px', minWidth: '32px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => void deletePaper(paper.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPaper && (
        <WordDocEditorModal
          paper={editingPaper}
          onClose={() => setEditingPaper(null)}
          onSave={(updated) => void savePaper(updated)}
        />
      )}

      {viewingPaper && <PaperPreviewModal paper={viewingPaper} onClose={() => setViewingPaper(null)} />}

      {checkingSubmissions && (
        <WorksheetSubmissionsModal
          paper={checkingSubmissions}
          onClose={() => setCheckingSubmissions(null)}
          onRefresh={async () => {
            const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${checkingSubmissions.id}`);
            setCheckingSubmissions(full.worksheet);
            await loadWorksheets();
          }}
          setNotice={setNotice}
        />
      )}
    </section>
  );
}

const WORKSHEET_SUBJECTS = ALL_ACADEMIC_SUBJECTS;

const WORKSHEET_GRADES = [
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Other / Custom Grade',
];

const FONT_FAMILY_OPTIONS = [
  { label: 'Arial (Default)', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier New (Mono)', value: '"Courier New", Courier, monospace' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
];

const FONT_SIZE_OPTIONS = [
  { label: '12px (Small)', value: '12px' },
  { label: '14px (Compact)', value: '14px' },
  { label: '16px (Normal)', value: '16px' },
  { label: '18px (Medium)', value: '18px' },
  { label: '20px (Large)', value: '20px' },
  { label: '24px (Subhead)', value: '24px' },
  { label: '28px (H2 Section)', value: '28px' },
  { label: '32px (H1 Title)', value: '32px' },
  { label: '36px (Big Title)', value: '36px' },
  { label: '42px (Jumbo)', value: '42px' },
];

const FONT_SIZE_STEPS = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '42px'];

function WordDocEditorModal({
  paper,
  onClose,
  onSave,
}: {
  paper: Partial<WorksheetPaper>;
  onClose: () => void;
  onSave: (paper: Partial<WorksheetPaper>) => void;
}) {
  const [title, setTitle] = useState(paper.title || 'New Question Paper');

  const isPredefinedSubject = WORKSHEET_SUBJECTS.includes(paper.subject || '') && paper.subject !== 'Other / Custom Subject';
  const [subjectOption, setSubjectOption] = useState<string>(() => {
    if (!paper.subject) return getDefaultSubject();
    return isPredefinedSubject ? paper.subject : 'Other / Custom Subject';
  });
  const [customSubject, setCustomSubject] = useState<string>(() => {
    return isPredefinedSubject ? '' : (paper.subject || '');
  });

  const normalizeGradeVal = (g?: string | null) => {
    if (!g) return getDefaultGrade();
    const match = g.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/i);
    if (match) return `Grade ${match[1]}`;
    return g;
  };

  const initialGradeNormalized = normalizeGradeVal(paper.grade);
  const isPredefinedGrade = WORKSHEET_GRADES.includes(initialGradeNormalized) && initialGradeNormalized !== 'Other / Custom Grade';
  const [gradeOption, setGradeOption] = useState<string>(() => {
    if (!paper.grade) return getDefaultGrade();
    return isPredefinedGrade ? initialGradeNormalized : 'Other / Custom Grade';
  });
  const [customGrade, setCustomGrade] = useState<string>(() => {
    return isPredefinedGrade ? '' : (paper.grade || '');
  });

  const [totalMarks, setTotalMarks] = useState(paper.totalMarks || 100);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(paper.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgWidth, setImgWidth] = useState<string>('100%');
  const [imgHeight, setImgHeight] = useState<string>('auto');
  const [imgAlign, setImgAlign] = useState<'left' | 'center' | 'right'>('center');

  const [currentFontFamily, setCurrentFontFamily] = useState('Arial, sans-serif');
  const [currentFontSize, setCurrentFontSize] = useState('16px');

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastActiveCellRef = useRef<HTMLTableCellElement | null>(null);
  const isDraggingColRef = useRef(false);

  const [selectedTableInfo, setSelectedTableInfo] = useState<{
    table: HTMLTableElement;
    cell: HTMLTableCellElement;
    colIndex: number;
    totalCols: number;
    currentWidth: string;
  } | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && canvasRef.current) {
      const range = sel.getRangeAt(0);
      if (canvasRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (canvasRef.current) {
      canvasRef.current.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }
    }
  };

  const updateToolbarFromSelection = () => {
    saveSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && canvasRef.current) {
      const range = sel.getRangeAt(0);
      if (canvasRef.current.contains(range.commonAncestorContainer)) {
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        const elem = node as HTMLElement | null;
        if (elem && elem !== canvasRef.current) {
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
          } catch {
            // quiet
          }
        }
      }
    }
  };

  const applyFontFamily = (fontVal: string) => {
    setCurrentFontFamily(fontVal);
    if (!canvasRef.current) return;
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

      const targets = Array.from(canvasRef.current.querySelectorAll(`font[face], font`));
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
        const spanTargets = Array.from(canvasRef.current.querySelectorAll(`span[style*="font-family"]`));
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
      if (currentElem && canvasRef.current.contains(currentElem) && currentElem !== canvasRef.current) {
        currentElem.style.fontFamily = fontVal;
      }
    }

    saveSelection();
  };

  const applyFontSize = (sizeVal: string) => {
    setCurrentFontSize(sizeVal);
    if (!canvasRef.current) return;
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

      const targets = Array.from(canvasRef.current.querySelectorAll('font[size="7"], font[size="xxx-large"], [style*="-webkit-xxx-large"]'));
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
      if (currentElem && canvasRef.current.contains(currentElem) && currentElem !== canvasRef.current) {
        currentElem.style.fontSize = sizeVal;
      }
    }

    saveSelection();
  };

  const stepFontSize = (delta: number) => {
    let activeSize = currentFontSize;
    const sel = window.getSelection();
    const range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : savedRangeRef.current;
    if (range && canvasRef.current) {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const elem = node as HTMLElement | null;
      if (elem && canvasRef.current.contains(elem)) {
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

  const getActiveTableCell = (): HTMLTableCellElement | null => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node !== canvasRef.current) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        return node as HTMLTableCellElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  const updateTableSelection = (cell: HTMLTableCellElement | null) => {
    if (!cell) {
      if (canvasRef.current) {
        canvasRef.current.querySelectorAll('.cell-active-col').forEach((c) => c.classList.remove('cell-active-col'));
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

    if (canvasRef.current) {
      canvasRef.current.querySelectorAll('.cell-active-col').forEach((c) => c.classList.remove('cell-active-col'));
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
  };

  const applyColWidth = (widthVal: string) => {
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
  };

  const equalizeColWidths = () => {
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
  };

  const stepColWidth = (deltaPercent: number) => {
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
  };

  const insertTable = () => {
    if (!canvasRef.current) return;
    canvasRef.current.focus();
    restoreSelection();
    const tableHtml =
      '<table style="width: 100%; border-collapse: collapse; margin: 14px 0; border: 1px solid #cbd5e1; table-layout: fixed;">' +
      '<thead>' +
      '<tr style="background: #f1f5f9;">' +
      '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 33.33%;">Question / Section</th>' +
      '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 33.33%;">Description / Details</th>' +
      '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 33.34%;">Marks</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      '<tr>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Q1</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Solve the equations below</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.34%;">5 Marks</td>' +
      '</tr>' +
      '<tr>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Q2</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.33%;">Explain the core principle</td>' +
      '<td style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 33.34%;">5 Marks</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>' +
      '<p><br></p>';

    try {
      document.execCommand('insertHTML', false, tableHtml);
    } catch {
      canvasRef.current.innerHTML += tableHtml;
    }

    setTimeout(() => {
      if (canvasRef.current) {
        const lastTable = canvasRef.current.querySelector('table:last-of-type');
        const firstCell = lastTable?.querySelector('td');
        if (firstCell) updateTableSelection(firstCell as HTMLTableCellElement);
      }
    }, 50);
  };

  const addTableRow = (direction: 'above' | 'below' = 'below') => {
    if (!canvasRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (canvasRef.current.querySelector('tbody tr:last-child td, tr:last-child td, tr:last-child th') as HTMLTableCellElement | null);
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

    const colCount = Math.max(currentRow.children.length, table.rows[0]?.children.length || 3);
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
  };

  const deleteTableRow = () => {
    if (!canvasRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (canvasRef.current.querySelector('tbody tr:last-child td, tr:last-child td') as HTMLTableCellElement | null);
    if (!cell) return;
    const currentRow = cell.closest('tr');
    const table = cell.closest('table');
    if (!table || !currentRow) return;

    if (table.rows.length <= 1) {
      table.remove();
      updateTableSelection(null);
      return;
    }

    currentRow.remove();
    const nextActive = table.querySelector('tbody tr:last-child td, tr:last-child td') as HTMLTableCellElement | null;
    updateTableSelection(nextActive);
  };

  const addTableColumn = (direction: 'left' | 'right' = 'right') => {
    if (!canvasRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (canvasRef.current.querySelector('tr td:last-child, tr th:last-child') as HTMLTableCellElement | null);
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
  };

  const deleteTableColumn = () => {
    if (!canvasRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || (canvasRef.current.querySelector('tr td:last-child, tr th:last-child') as HTMLTableCellElement | null);
    if (!cell) return;
    const table = cell.closest('table');
    const currentRow = cell.closest('tr');
    if (!table || !currentRow) return;

    const colIndex = Array.from(currentRow.children).indexOf(cell);
    const totalCols = currentRow.children.length;

    if (totalCols <= 1) {
      table.remove();
      updateTableSelection(null);
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
  };

  const deleteTable = () => {
    if (!canvasRef.current) return;
    const cell = getActiveTableCell() || lastActiveCellRef.current || canvasRef.current.querySelector('table');
    if (!cell) return;
    const table = cell.tagName === 'TABLE' ? (cell as HTMLTableElement) : cell.closest('table');
    if (table) {
      table.remove();
      updateTableSelection(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingColRef.current) return;
    const target = e.target as HTMLElement;
    const cell = target.closest('td, th') as HTMLTableCellElement | null;
    if (cell && canvasRef.current?.contains(cell)) {
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
    if (cell && canvasRef.current?.contains(cell)) {
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
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return;
      }
    }

    if (cell && canvasRef.current?.contains(cell)) {
      updateTableSelection(cell);
      if (selectedImg) {
        if (canvasRef.current) canvasRef.current.querySelectorAll('img').forEach((i) => i.classList.remove('img-selected'));
        setSelectedImg(null);
      }
    } else if (!target.closest('.word-doc-table-toolbar')) {
      updateTableSelection(null);
    }
  };

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
  };

  const setupInsertedImage = () => {
    setTimeout(() => {
      if (!canvasRef.current) return;
      const imgs = canvasRef.current.querySelectorAll('img');
      if (imgs.length > 0) {
        const lastImg = imgs[imgs.length - 1] as HTMLImageElement;
        imgs.forEach((i) => i.classList.remove('img-selected'));
        lastImg.classList.add('img-selected');
        lastImg.style.display = 'block';
        lastImg.style.marginLeft = 'auto';
        lastImg.style.marginRight = 'auto';
        lastImg.style.maxWidth = '100%';
        setSelectedImg(lastImg);
        setImgWidth(lastImg.style.width || '100%');
        setImgHeight(lastImg.style.height || 'auto');
        setImgAlign('center');
      }
    }, 50);
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && canvasRef.current) {
        canvasRef.current.focus();
        document.execCommand('insertImage', false, dataUrl);
        setupInsertedImage();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      if (canvasRef.current) {
        canvasRef.current.querySelectorAll('img').forEach((i) => i.classList.remove('img-selected'));
      }
      img.classList.add('img-selected');
      setSelectedImg(img);
      updateTableSelection(null);

      const styleW = img.style.width || (img.getAttribute('width') ? `${img.getAttribute('width')}px` : '100%');
      const styleH = img.style.height || (img.getAttribute('height') ? `${img.getAttribute('height')}px` : 'auto');
      setImgWidth(styleW);
      setImgHeight(styleH);

      const ml = img.style.marginLeft;
      const mr = img.style.marginRight;
      if (ml === 'auto' && mr === 'auto') {
        setImgAlign('center');
      } else if (ml === 'auto' && (mr === '0px' || mr === '0')) {
        setImgAlign('right');
      } else if ((ml === '0px' || ml === '0') && mr === 'auto') {
        setImgAlign('left');
      } else {
        setImgAlign('center');
      }
    } else {
      if (canvasRef.current) {
        canvasRef.current.querySelectorAll('img').forEach((i) => i.classList.remove('img-selected'));
      }
      setSelectedImg(null);
      const cell = target.closest('td, th') as HTMLTableCellElement | null;
      if (cell && canvasRef.current?.contains(cell)) {
        updateTableSelection(cell);
      }
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
        document.execCommand('styleWithCSS', false, 'false');
      } catch {
        // ignore
      }
    }
  }, []);

  function execCmd(e: React.MouseEvent, command: string, value: string | undefined = undefined) {
    e.preventDefault();
    if (canvasRef.current) canvasRef.current.focus();
    try {
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand(command, false, value);
    } catch {
      // ignore
    }
  }

  function handleSave(targetStatus?: 'DRAFT' | 'PUBLISHED') {
    const finalStatus = targetStatus || status;
    const htmlContent = canvasRef.current?.innerHTML || paper.content || '';
    const finalSubject = subjectOption === 'Other / Custom Subject'
      ? (customSubject.trim() || 'General')
      : subjectOption;
    const finalGrade = gradeOption === 'Other / Custom Grade'
      ? (customGrade.trim() || 'General')
      : gradeOption;

    onSave({
      ...paper,
      title,
      subject: finalSubject,
      grade: finalGrade,
      totalMarks: Number(totalMarks),
      status: finalStatus,
      content: htmlContent,
    });
  }

  return createPortal(
    <div className="word-doc-modal-overlay">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleLocalImageUpload}
      />
      <div className="word-doc-modal-container full-editor">
        <div className="word-doc-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="button button-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={onClose}>
              <ArrowLeft size={16} /> Back to Papers
            </button>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#0284c7" /> Question Paper Studio
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="button button-secondary" onClick={onClose}><X size={16} /> Cancel</button>
            <button className="button button-secondary" onClick={() => handleSave('DRAFT')}>
              <Save size={16} /> Save as Draft
            </button>
            <button className="button button-primary" onClick={() => handleSave('PUBLISHED')}>
              <Check size={16} /> Save & Publish Paper
            </button>
          </div>
        </div>

        <div className="word-doc-meta-bar">
          <div className="word-doc-meta-row">
            <label className="field compact-field title-field">
              <span>Paper Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Science Mid-Term Exam Paper" />
            </label>
            <label className="field compact-field">
              <span>Subject</span>
              <select
                value={subjectOption}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubjectOption(val);
                }}
              >
                {getActiveSubjects().length > 0 && (
                  <optgroup label="Teaching Subjects">
                    {getActiveSubjects().map((subj) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Other Subjects">
                  {WORKSHEET_SUBJECTS.filter((subj) => !getActiveSubjects().includes(subj)).map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </optgroup>
              </select>
            </label>
            {subjectOption === 'Other / Custom Subject' && (
              <label className="field compact-field">
                <span>Custom Subject Name</span>
                <input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. French, Robotics"
                  required
                />
              </label>
            )}
            <label className="field compact-field">
              <span>Grade / Class</span>
              <select
                value={gradeOption}
                onChange={(e) => {
                  const val = e.target.value;
                  setGradeOption(val);
                }}
              >
                {getActiveGrades().length > 0 && (
                  <optgroup label="Active Classes">
                    {getActiveGrades().map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                )}
                {WORKSHEET_GRADES.filter((g) => !getActiveGrades().includes(g)).length > 0 && (
                  <optgroup label="Other Classes">
                    {WORKSHEET_GRADES.filter((g) => !getActiveGrades().includes(g)).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            {gradeOption === 'Other / Custom Grade' && (
              <label className="field compact-field">
                <span>Custom Grade Name</span>
                <input
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  placeholder="e.g. Class 10 - Batch A"
                  required
                />
              </label>
            )}
            <label className="field compact-field">
              <span>Total Marks</span>
              <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
            </label>
            <label className="field compact-field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </label>
          </div>
        </div>

        <div className="word-doc-toolbar">
          {/* Font Family Selector */}
          <div className="word-doc-toolbar-group" title="Text Font Style">
            <Type size={14} color="#64748b" style={{ flexShrink: 0 }} />
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

          {/* Font Size Selector */}
          <div className="word-doc-toolbar-group" title="Text Size">
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

          {/* Font Step Buttons A- / A+ */}
          <button
            type="button"
            title="Decrease Font Size (A-)"
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
            onMouseDown={(e) => {
              e.preventDefault();
              stepFontSize(1);
            }}
          >
            A+
          </button>

          <div className="word-doc-toolbar-divider" />

          {/* Text Style Commands */}
          <button type="button" title="Bold" onMouseDown={(e) => execCmd(e, 'bold')}><b>B</b> Bold</button>
          <button type="button" title="Italic" onMouseDown={(e) => execCmd(e, 'italic')}><i>I</i> Italic</button>
          <button type="button" title="Underline" onMouseDown={(e) => execCmd(e, 'underline')}><u>U</u> Underline</button>

          <div className="word-doc-toolbar-divider" />

          {/* Headings & Structure */}
          <button type="button" title="H1 Title" onMouseDown={(e) => execCmd(e, 'formatBlock', '<h1>')}>H1 Title</button>
          <button type="button" title="H2 Section" onMouseDown={(e) => execCmd(e, 'formatBlock', '<h2>')}>H2 Section</button>
          <button type="button" title="H3 Subhead" onMouseDown={(e) => execCmd(e, 'formatBlock', '<h3>')}>H3 Subhead</button>
          <button type="button" title="Bullet List" onMouseDown={(e) => execCmd(e, 'insertUnorderedList')}>• Bullet List</button>
          <button type="button" title="Numbered List" onMouseDown={(e) => execCmd(e, 'insertOrderedList')}>1. Numbered</button>
          <button type="button" title="Line Divider" onMouseDown={(e) => execCmd(e, 'insertHorizontalRule')}>― Line Divider</button>

          <div className="word-doc-toolbar-divider" />

          {/* Table Tools */}
          <button
            type="button"
            title="Insert Table"
            onMouseDown={(e) => {
              e.preventDefault();
              insertTable();
            }}
          >
            <Table size={14} color="#0284c7" /> Table
          </button>
          <button
            type="button"
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
            title="Delete table"
            style={{ color: '#ef4444' }}
            onMouseDown={(e) => {
              e.preventDefault();
              deleteTable();
            }}
          >
            <Trash2 size={13} /> Table
          </button>

          <div className="word-doc-toolbar-divider" />

          {/* Image Upload & Extras */}
          <button
            type="button"
            title="Upload Image from Local System"
            onMouseDown={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            <UploadCloud size={14} /> Upload Local Image
          </button>
          <button
            type="button"
            title="Insert Image from Web URL"
            onMouseDown={(e) => {
              e.preventDefault();
              const url = window.prompt('Enter Image URL to insert:');
              if (url) {
                if (canvasRef.current) canvasRef.current.focus();
                document.execCommand('insertImage', false, url);
                setupInsertedImage();
              }
            }}
          >
            <Paperclip size={14} /> Image URL
          </button>
          <button type="button" title="Clear Formatting" onMouseDown={(e) => execCmd(e, 'removeFormat')}>Clear Format</button>
          <button type="button" className="btn-print" title="Print Preview" onClick={() => {
            if (canvasRef.current) printHtmlContent(canvasRef.current.innerHTML);
          }}><Printer size={14} /> Print Preview</button>
        </div>

        {selectedImg && (
          <div className="word-doc-image-toolbar">
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
                placeholder="e.g. 300px"
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
                placeholder="e.g. 200px"
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
                    selectedImg.remove();
                    setSelectedImg(null);
                  }
                }}
              >
                <Trash2 size={13} /> Delete Image
              </button>
              <button
                type="button"
                className="btn-close-img-tool"
                onClick={() => {
                  if (canvasRef.current) {
                    canvasRef.current.querySelectorAll('img').forEach((i) => i.classList.remove('img-selected'));
                  }
                  setSelectedImg(null);
                }}
              >
                <X size={14} /> Done
              </button>
            </div>
          </div>
        )}

        {selectedTableInfo && (
          <div className="word-doc-table-toolbar">
            <div className="table-toolbar-label">
              <Table size={14} color="#059669" />
              <strong>Table Column:</strong>
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

        <div className="word-doc-canvas-wrapper">
          <div
            ref={canvasRef}
            className="word-doc-canvas"
            contentEditable
            suppressContentEditableWarning
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={() => {
              updateToolbarFromSelection();
              const cell = getActiveTableCell();
              if (cell) updateTableSelection(cell);
            }}
            onKeyUp={() => {
              updateToolbarFromSelection();
              const cell = getActiveTableCell();
              if (cell) updateTableSelection(cell);
            }}
            onSelect={saveSelection}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                const sel = window.getSelection();
                const anchorNode = sel?.anchorNode;
                const parentElem = anchorNode ? (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode as HTMLElement) : null;

                if (parentElem?.closest('li')) {
                  // Inside list item <li>, allow browser native bullet creation!
                  return;
                }

                e.preventDefault();
                try {
                  document.execCommand('insertParagraph', false, undefined);
                } catch {
                  document.execCommand('insertHTML', false, '<p><br></p>');
                }
              }
            }}
            dangerouslySetInnerHTML={{ __html: paper.content || '<p>Type your question paper here...</p>' }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

function AIWorksheetModal({ onClose, onGenerated, onNavigateToAISettings }: { onClose: () => void; onGenerated: () => void; onNavigateToAISettings?: () => void }) {
  const [selectedSubject, setSelectedSubject] = useState(() => getDefaultSubject());
  const [customSubject, setCustomSubject] = useState('');
  const [grade, setGrade] = useState(() => getDefaultGrade());
  const [topic, setTopic] = useState('');
  const [subtopics, setSubtopics] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [totalMarks, setTotalMarks] = useState(100);
  const [details, setDetails] = useState('');
  const [sourceFiles, setSourceFiles] = useState<UploadedSourceFile[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [hasTeacherKey, setHasTeacherKey] = useState<boolean | null>(null);

  const provider = localStorage.getItem('livequiz_ai_provider') || 'auto';
  const activeSubject = selectedSubject === 'Other / Custom Subject' ? (customSubject.trim() || 'General') : selectedSubject;
  const isHindi = activeSubject.toLowerCase().includes('hindi') || activeSubject.includes('हिंदी') || activeSubject.includes('हिन्दी');

  useEffect(() => {
    localStorage.removeItem('livequiz_ai_key');
    fetch('/api/teacher/profile', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setHasTeacherKey(Boolean(d.teacher?.apiKey || d.teacher?.hasApiKey)))
      .catch(() => setHasTeacherKey(false));
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError('Please enter a main topic.'); return; }
    if (selectedSubject === 'Other / Custom Subject' && !customSubject.trim()) {
      setError('Please enter your custom subject name.');
      return;
    }
    if (strictMode && sourceFiles.length === 0) {
      setError('Please upload at least one sample paper, chapter scan, or image to generate strictly from uploaded content.');
      return;
    }
    if (hasTeacherKey === false) {
      setError('Every teacher must add their own unique personal AI API Key in AI Settings before generating question papers. Duplication or sharing of keys is not allowed.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      await api('/api/worksheets/ai-generate', {
        method: 'POST',
        body: JSON.stringify({
          subject: activeSubject,
          grade,
          topic,
          subtopics,
          questionCount,
          totalMarks,
          details,
          provider,
          strictSourceContent: strictMode,
          uploadedFiles: sourceFiles.length > 0 ? sourceFiles : undefined,
        }),
      });
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={generate} className="ai-form-grid">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: hasTeacherKey === false ? '#fffbeb' : '#f0f9ff', border: hasTeacherKey === false ? '1px solid #fde68a' : '1px solid #bae6fd', borderRadius: '12px', color: hasTeacherKey === false ? '#92400e' : '#0369a1', fontSize: '13.5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} />
          <span>AI Engine Settings: <strong>{provider === 'gemini' ? 'Google Gemini AI' : provider === 'openai' ? 'ChatGPT (OpenAI)' : provider === 'deepseek' ? 'DeepSeek AI' : 'Auto Select'}</strong> {hasTeacherKey ? '(Personal Key Active ✓)' : '(No Key Configured ⚠️)'}</span>
        </div>
        {onNavigateToAISettings && (
          <button type="button" className="text-button" style={{ fontSize: '12.5px', color: hasTeacherKey === false ? '#b45309' : '#0284c7', fontWeight: 600, padding: 0 }} onClick={onNavigateToAISettings}>
            {hasTeacherKey === false ? 'Add Your API Key →' : 'Configure AI Settings →'}
          </button>
        )}
      </div>

      {error && <div className="inline-error">{error}</div>}
      <div className="form-grid-2">
        <label className="field compact-field">
          <span>Subject</span>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            {getActiveSubjects().length > 0 && (
              <optgroup label="Teaching Subjects">
                {getActiveSubjects().map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </optgroup>
            )}
            <optgroup label="Other Subjects">
              {WORKSHEET_SUBJECTS.filter((subj) => !getActiveSubjects().includes(subj)).map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="field compact-field">
          <span>Grade / Class</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            {getActiveGrades().length > 0 && (
              <optgroup label="Active Classes">
                {getActiveGrades().map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </optgroup>
            )}
            {WORKSHEET_GRADES.filter((g) => !getActiveGrades().includes(g)).length > 0 && (
              <optgroup label="Other Classes">
                {WORKSHEET_GRADES.filter((g) => !getActiveGrades().includes(g)).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>

      {selectedSubject === 'Other / Custom Subject' && (
        <label className="field compact-field">
          <span>Custom Subject Name <span className="required-star">*</span></span>
          <input
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="e.g. Astronomy, Statistics, French"
            required
          />
        </label>
      )}

      {isHindi && (
        <div style={{
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '1px solid #fed7aa',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#9a3412',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500
        }}>
          <span style={{ fontSize: '16px' }}>🇮🇳</span>
          <span>
            <strong>Hindi Subject Active:</strong> Teacher can enter topics and subtopics in <em>Hinglish</em> (e.g. <em>"Sandhi aur Samas"</em>, <em>"Vachan badlo"</em>). The entire question paper and instructions will be generated <strong>strictly in pure Hindi (देवनागरी लिपि)</strong> with authentic CBSE formatting.
          </span>
        </div>
      )}

      <label className="field compact-field">
        <span>Main Topic <span className="required-star">*</span></span>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={isHindi ? "e.g. Karak aur uske bhed, Sandhi vichhed, Surdas ke Pad (Hinglish/Hindi)" : "e.g. Electricity, Cell Structure, Geometry"}
          required
        />
      </label>

      <label className="field compact-field">
        <span>Sub-topics (Optional)</span>
        <input
          value={subtopics}
          onChange={(e) => setSubtopics(e.target.value)}
          placeholder={isHindi ? "e.g. Niyam, udaharan, paribhasha (Hinglish/Hindi)" : "e.g. Circuits, Resistance, Ohm Law"}
        />
      </label>

      <div className="form-grid-2">
        <label className="field compact-field">
          <span>Number of Questions</span>
          <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
            <option value={25}>25 Questions</option>
            <option value={30}>30 Questions</option>
          </select>
        </label>
        <label className="field compact-field">
          <span>Total Marks</span>
          <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
        </label>
      </div>

      {/* Upload Study Materials, Chapter Scans, Sample Papers & Strict Toggle */}
      <ContentSourceUploadSection
        files={sourceFiles}
        onFilesChange={setSourceFiles}
        strictMode={strictMode}
        onStrictModeChange={setStrictMode}
        onPreviewImage={setPreviewImage}
      />

      <label className="field compact-field">
        <span>Special Instructions for AI (Optional)</span>
        <textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. Include 2 problem solving questions and clear student instructions." />
      </label>

      <div className="compact-modal-actions">
        <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={generating}>
          {generating ? <><RefreshCw size={16} className="spin" /> Generating Paper...</> : <><Sparkles size={16} /> Generate Question Paper</>}
        </button>
      </div>

      {previewImage && (
        <div className="word-doc-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Uploaded material preview" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} />
          <button className="icon-button quiet" style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} onClick={() => setPreviewImage(null)}>
            <X size={18} />
          </button>
        </div>
      )}
    </form>
  );
}

async function compressImageFile(file: File, maxDim = 2048, quality = 0.90): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) return resolve('');
      const img = new Image();
      img.onerror = () => resolve(rawData);
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size < 800 * 1024) {
          return resolve(rawData);
        }
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(rawData);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  });
}

function WorksheetSubmissionsModal({
  paper,
  onClose,
  onRefresh,
  setNotice,
}: {
  paper: WorksheetPaper;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  setNotice: (msg: string) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [gradingState, setGradingState] = useState<Record<string, { score: number; remarks: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState<Record<string, boolean>>({});

  // Teacher manual upload on behalf of student
  const [students, setStudents] = useState<Array<{ id: string; name: string; grade?: string | null }>>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [teacherImages, setTeacherImages] = useState<string[]>([]);
  const [isUploadingTeacher, setIsUploadingTeacher] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);

  const submissions = paper.submissions || [];

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await api<{ students: Array<{ id: string; name: string; grade?: string | null }> }>('/api/students');
        if (res.students) setStudents(res.students);
      } catch {
        // quiet
      }
    }
    void loadStudents();
  }, []);

  async function handleTeacherFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadError('');

    for (const file of files) {
      try {
        const compressed = await compressImageFile(file);
        if (compressed) {
          setTeacherImages((prev) => [...prev, compressed]);
        }
      } catch {
        // quiet
      }
    }
  }

  async function handleTeacherUpload() {
    if (!selectedStudentId) {
      setUploadError('Please select a student from the dropdown list.');
      return;
    }
    if (teacherImages.length === 0) {
      setUploadError('Please select or capture at least one photo of the student’s notebook / answer sheet.');
      return;
    }

    setIsUploadingTeacher(true);
    setUploadError('');
    try {
      const res = await api<{ ok: boolean; submission: any }>(`/api/worksheets/${paper.id}/teacher-upload`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          images: teacherImages,
        }),
      });

      if (res.submission) {
        setGradingState((prev) => ({
          ...prev,
          [res.submission.id]: {
            score: res.submission.aiDraftScore ?? res.submission.score ?? 0,
            remarks: res.submission.aiDraftRemarks ?? res.submission.remarks ?? '',
          },
        }));
      }

      setNotice('✨ Student notebook photos uploaded & AI auto-evaluation complete! Review draft marks below.');
      setTeacherImages([]);
      setSelectedStudentId('');
      setShowUploadForm(false);
      await onRefresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Teacher upload failed.');
    } finally {
      setIsUploadingTeacher(false);
    }
  }

  async function handleGrade(submissionId: string) {
    const sub = submissions.find((s) => s.id === submissionId);
    const defaultScore = sub?.status === 'GRADED'
      ? (sub.score ?? 0)
      : (sub?.aiDraftScore !== null && sub?.aiDraftScore !== undefined ? sub.aiDraftScore : (sub?.score ?? 0));
    const defaultRemarks = sub?.status === 'GRADED'
      ? (sub.remarks ?? '')
      : (sub?.aiDraftRemarks || sub?.remarks || '');

    const currentScore = gradingState[submissionId]?.score ?? defaultScore;
    const currentRemarks = gradingState[submissionId]?.remarks ?? defaultRemarks;

    setSavingId(submissionId);
    try {
      await api(`/api/worksheets/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        body: JSON.stringify({ score: Number(currentScore), remarks: currentRemarks }),
      });
      setNotice('✓ Grade & remarks saved for student!');
      await onRefresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save grade.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleEvaluateAI(submissionId: string) {
    setEvaluatingId(submissionId);
    try {
      const res = await api<{ ok: boolean; result: any }>(`/api/worksheets/submissions/${submissionId}/ai-evaluate`, {
        method: 'POST',
      });
      if (res.result) {
        setGradingState((prev) => ({
          ...prev,
          [submissionId]: {
            score: res.result.aiDraftScore ?? prev[submissionId]?.score ?? 0,
            remarks: res.result.aiDraftRemarks ?? prev[submissionId]?.remarks ?? '',
          },
        }));
      }
      setNotice('✨ AI auto-check complete! Suggested score & feedback filled in draft mode.');
      await onRefresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'AI evaluation failed.');
    } finally {
      setEvaluatingId(null);
    }
  }

  async function handleDeleteImages(submissionId: string, studentName: string) {
    if (!window.confirm(`Delete uploaded answer sheet images for ${studentName}? (The student's score and remarks will be retained).`)) return;
    try {
      await api(`/api/worksheets/submissions/${submissionId}/images`, { method: 'DELETE' });
      setNotice(`Uploaded answer sheet images deleted for ${studentName}.`);
      await onRefresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete images.');
    }
  }

  async function handleResetSubmission(submissionId: string, studentName: string) {
    if (!window.confirm(`Reset answer sheet submission for ${studentName}?\n\nThis will completely delete the student's uploaded notebook photos, recorded score, remarks, and AI evaluation, unlocking the worksheet so the student can submit anew.`)) {
      return;
    }
    setResettingId(submissionId);
    try {
      await api(`/api/worksheets/submissions/${submissionId}`, { method: 'DELETE' });
      setNotice(`✓ Answer sheet submission reset for ${studentName}. The student can now upload anew.`);
      await onRefresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not reset submission.');
    } finally {
      setResettingId(null);
    }
  }

  return createPortal(
    <div
      className="word-doc-modal-overlay submissions-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="word-doc-modal-container submissions-modal-container"
        style={{ maxWidth: '920px', width: '92%', margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="word-doc-modal-header submissions-modal-header"
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'nowrap',
            minHeight: '68px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 auto' }}>
            <CheckSquare size={22} color="#059669" style={{ flexShrink: 0 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Student Answer Sheet Submissions - {paper.title}
            </h3>
          </div>

          <div className="submissions-modal-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'nowrap' }}>
            <button
              type="button"
              className="button button-primary"
              style={{
                fontSize: '13px',
                height: '36px',
                padding: '0 14px',
                background: showUploadForm ? '#e0f2fe' : '#0284c7',
                borderColor: showUploadForm ? '#7dd3fc' : '#0284c7',
                color: showUploadForm ? '#0369a1' : '#ffffff',
                borderRadius: '9px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: showUploadForm ? 'none' : '0 2px 6px rgba(2, 132, 199, 0.22)',
                whiteSpace: 'nowrap',
              }}
              title="Upload student notebook photos"
              onClick={() => {
                setShowUploadForm((prev) => !prev);
                setUploadError('');
              }}
            >
              <Camera size={15} />
              <span>{showUploadForm ? 'Close Upload' : 'Upload Student Work'}</span>
            </button>

            {paper.status === 'PUBLISHED' ? (
              <button
                type="button"
                className="button button-secondary"
                style={{
                  fontSize: '13px',
                  height: '36px',
                  padding: '0 14px',
                  color: '#047857',
                  borderColor: '#a7f3d0',
                  background: '#ecfdf5',
                  borderRadius: '9px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
                title="Mark all student answer sheet submissions complete"
                onClick={async () => {
                  await api(`/api/worksheets/${paper.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'ARCHIVED' }),
                  });
                  setNotice('✓ Submissions marked complete for this question paper.');
                  await onRefresh();
                }}
              >
                <CheckCircle2 size={15} color="#047857" />
                <span>Mark Complete</span>
              </button>
            ) : paper.status === 'ARCHIVED' ? (
              <span className="worksheet-badge badge-published" style={{ background: '#dcfce7', color: '#15803d', height: '36px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: '5px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                <CheckCircle2 size={14} /> Completed
              </span>
            ) : null}

            <button
              type="button"
              className="icon-button quiet"
              style={{ width: '36px', height: '36px', borderRadius: '9px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              onClick={onClose}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, maxHeight: 'calc(90vh - 80px)' }}>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13.5px', lineHeight: '1.5' }}>
            AI automatically evaluates students' uploaded workbook answer sheet photos in draft mode. Review the suggested scores, customize feedback, and click <strong>"Save Score & Remarks"</strong> to finalize.
          </p>

          {/* Teacher Upload Form for Mobile/WhatsApp Notebook Photos */}
          {showUploadForm && (
            <div
              style={{
                marginBottom: '24px',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '2px solid #38bdf8',
                borderRadius: '16px',
                padding: '20px 22px',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={18} color="#0284c7" />
                    <span>Upload Student Answer Sheet (From Notebook / WhatsApp / Mobile)</span>
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#0c4a6e' }}>
                    Select the student and attach photos of their handwritten notebook work. AI will inspect the solution steps, calculate marks, and fill in draft evaluation.
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-button quiet"
                  style={{ color: '#0369a1', background: '#ffffff', borderRadius: '8px', width: '28px', height: '28px' }}
                  onClick={() => setShowUploadForm(false)}
                >
                  <X size={15} />
                </button>
              </div>

              {uploadError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    marginBottom: '14px',
                  }}
                >
                  {uploadError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 2fr', gap: '16px', alignItems: 'start' }}>
                {/* Student Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    Select Student: <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #7dd3fc',
                      background: '#ffffff',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      fontWeight: 500,
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((st) => {
                      const existingSub = submissions.find((s) => s.studentId === st.id);
                      const statusLabel = existingSub
                        ? existingSub.status === 'GRADED'
                          ? ` [Graded: ${existingSub.score}/${paper.totalMarks}]`
                          : ' [Already Submitted]'
                        : '';
                      return (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.grade ? `(${st.grade})` : ''}{statusLabel}
                        </option>
                      );
                    })}
                  </select>
                  <div style={{ fontSize: '11.5px', color: '#0369a1', marginTop: '4px' }}>
                    {selectedStudentId && submissions.some((s) => s.studentId === selectedStudentId) ? (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>⚠️ This student already has a submission. Uploading will replace photos & re-evaluate.</span>
                    ) : (
                      'Select the student whose notebook work you are uploading.'
                    )}
                  </div>
                </div>

                {/* File Upload / Camera Photos */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    Notebook / Answer Sheet Photos: <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                      border: '2px dashed #38bdf8',
                      borderRadius: '12px',
                      background: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <Camera size={26} color="#0284c7" />
                    <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 600, color: '#0369a1' }}>
                      Click to Browse or Take Photos of Notebook Pages
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      Supports multiple photos (Page 1, Page 2, Page 3...)
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleTeacherFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Attached Images Preview */}
              {teacherImages.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#0369a1' }}>
                      Selected Notebook Pages ({teacherImages.length} Page{teacherImages.length === 1 ? '' : 's'}):
                    </strong>
                    <button
                      type="button"
                      className="text-button"
                      style={{ fontSize: '12px', color: '#e11d48' }}
                      onClick={() => setTeacherImages([])}
                    >
                      Clear All Photos
                    </button>
                  </div>
                  <div className="image-preview-strip">
                    {teacherImages.map((img, idx) => (
                      <div
                        className="image-preview-thumb"
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        title="Click to zoom page"
                      >
                        <img src={img} alt={`Page ${idx + 1}`} />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            fontSize: '10px',
                            textAlign: 'center',
                            padding: '2px',
                            fontWeight: 600,
                          }}
                        >
                          Page {idx + 1}
                        </div>
                        <button
                          type="button"
                          title="Remove page"
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: '#e11d48',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeacherImages((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ fontSize: '13px', padding: '7px 14px', borderRadius: '10px' }}
                  disabled={isUploadingTeacher}
                  onClick={() => {
                    setShowUploadForm(false);
                    setTeacherImages([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  style={{
                    fontSize: '13px',
                    padding: '7px 18px',
                    background: '#059669',
                    borderColor: '#059669',
                    borderRadius: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                  }}
                  disabled={isUploadingTeacher || !selectedStudentId || teacherImages.length === 0}
                  onClick={() => void handleTeacherUpload()}
                >
                  {isUploadingTeacher ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Analyzing Notebook & Evaluating with AI... (~5-8s)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Upload & Run AI Auto-Check</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {submissions.length === 0 ? (
            <div className="roster-empty" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#64748b' }}>
                No students have uploaded answer sheets for this paper yet.
              </p>
              {!showUploadForm && (
                <button
                  type="button"
                  className="button button-primary"
                  style={{ fontSize: '13px', padding: '8px 18px', borderRadius: '10px', margin: '0 auto', background: '#0284c7', borderColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setShowUploadForm(true)}
                >
                  <UploadCloud size={16} /> Upload Student Answer Sheet (From Notebook / WhatsApp)
                </button>
              )}
            </div>
          ) : (
            submissions.map((sub) => {
              let images: string[] = [];
              try { images = JSON.parse(sub.images || '[]'); } catch { images = []; }

              const defaultScore = sub.status === 'GRADED'
                ? (sub.score ?? 0)
                : (sub.aiDraftScore !== null && sub.aiDraftScore !== undefined ? sub.aiDraftScore : (sub.score ?? 0));
              const defaultRemarks = sub.status === 'GRADED'
                ? (sub.remarks ?? '')
                : (sub.aiDraftRemarks || sub.remarks || '');

              const currentScore = gradingState[sub.id]?.score ?? defaultScore;
              const currentRemarks = gradingState[sub.id]?.remarks ?? defaultRemarks;

              let breakdownList: any[] = [];
              try {
                if (sub.aiDraftBreakdown) breakdownList = JSON.parse(sub.aiDraftBreakdown);
              } catch { breakdownList = []; }

              const isEvaluating = sub.aiStatus === 'EVALUATING' || evaluatingId === sub.id;

              return (
                <div className="submission-detail-card" key={sub.id}>
                  <div className="submission-header">
                    <div>
                      <span className="student-name-tag">👤 {sub.student?.name || 'Student'}</span>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Submitted on {new Date(sub.submittedAt).toLocaleString()}
                        {sub.status === 'GRADED' ? (
                          <span style={{ marginLeft: '10px', color: '#059669', fontWeight: 'bold' }}>✓ GRADED BY TEACHER</span>
                        ) : sub.aiStatus === 'COMPLETED' ? (
                          <span style={{ marginLeft: '10px', color: '#0284c7', fontWeight: 'bold' }}>✨ AI DRAFT READY (Needs Review)</span>
                        ) : isEvaluating ? (
                          <span style={{ marginLeft: '10px', color: '#d97706', fontWeight: 'bold' }}>⏳ AI CHECKING PHOTOS...</span>
                        ) : (
                          <span style={{ marginLeft: '10px', color: '#64748b' }}>⏳ PENDING TEACHER REVIEW</span>
                        )}
                      </div>
                    </div>
                    {sub.score !== null && sub.score !== undefined && sub.status === 'GRADED' ? (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                          {sub.score} / {paper.totalMarks}
                        </span>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Final Verified Score</div>
                      </div>
                    ) : sub.aiDraftScore !== null && sub.aiDraftScore !== undefined ? (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0284c7' }}>
                          {sub.aiDraftScore} / {paper.totalMarks}
                        </span>
                        <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>AI Suggested Draft</div>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#334155' }}>
                        Uploaded Answer Sheets ({images.length} Page{images.length === 1 ? '' : 's'}):
                      </strong>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="button button-quiet"
                          style={{ fontSize: '12px', padding: '4px 10px', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}
                          title="Evaluate or re-check student photos with AI"
                          disabled={isEvaluating}
                          onClick={() => void handleEvaluateAI(sub.id)}
                        >
                          {isEvaluating ? (
                            <><RefreshCw size={12} className="spin" /> Checking with AI...</>
                          ) : (
                            <><Sparkles size={12} /> {sub.aiDraftScore !== null ? 'Re-check with AI' : 'Evaluate with AI'}</>
                          )}
                        </button>
                        {images.length > 0 && (
                          <button
                            type="button"
                            className="button danger-hover"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => void handleDeleteImages(sub.id, sub.student?.name || 'Student')}
                          >
                            <Trash2 size={13} /> Delete Answer Sheets After Checking
                          </button>
                        )}
                        <button
                          type="button"
                          className="button danger-hover"
                          style={{ fontSize: '12px', padding: '4px 10px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 600 }}
                          title="Reset submission: completely clears student's uploaded work, score and remarks, allowing student to re-submit"
                          disabled={resettingId === sub.id}
                          onClick={() => void handleResetSubmission(sub.id, sub.student?.name || 'Student')}
                        >
                          {resettingId === sub.id ? (
                            <><RefreshCw size={12} className="spin" /> Resetting...</>
                          ) : (
                            <><RotateCcw size={12} /> Reset Submission</>
                          )}
                        </button>
                      </div>
                    </div>

                    {images.length === 0 ? (
                      <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '13px' }}>
                        No answer sheet images stored (or deleted after checking).
                      </div>
                    ) : (
                      <div className="image-preview-strip">
                        {images.map((imgUrl, idx) => (
                          <div
                            className="image-preview-thumb"
                            key={idx}
                            onClick={() => setSelectedImage(imgUrl)}
                            style={{ cursor: 'pointer' }}
                            title="Click to view full image"
                          >
                            <img src={imgUrl} alt={`Page ${idx + 1}`} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '3px 2px', fontWeight: 600 }}>
                              Page {idx + 1} (Click)
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Evaluation Draft Banner */}
                  {isEvaluating ? (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        borderRadius: '12px',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <RefreshCw size={16} className="spin" color="#d97706" />
                      <span>AI is inspecting student's handwritten solutions & scoring against question paper... (Takes ~5-8s)</span>
                    </div>
                  ) : sub.aiStatus === 'COMPLETED' && sub.aiDraftScore !== null ? (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '14px 18px',
                        background: '#f0fdf4',
                        border: '1.5px solid #86efac',
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ background: '#dcfce7', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={18} color="#059669" />
                          </span>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#065f46' }}>
                              AI Draft Evaluation: {sub.aiDraftScore} / {paper.totalMarks} marks
                            </span>
                            <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                              Pre-filled below in draft mode. You can edit the score & remarks anytime, then click "Save Score & Remarks".
                            </div>
                          </div>
                        </div>

                        {breakdownList.length > 0 && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: '12px', padding: '5px 12px', background: '#ffffff', borderColor: '#86efac', color: '#047857', borderRadius: '8px', fontWeight: 600 }}
                            onClick={() => setShowBreakdown((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                          >
                            {showBreakdown[sub.id] ? 'Hide Question Breakdown' : `View AI Breakdown (${breakdownList.length} Questions)`}
                          </button>
                        )}
                      </div>

                      {/* Expandable Question-by-Question Breakdown */}
                      {showBreakdown[sub.id] && breakdownList.length > 0 && (
                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #86efac' }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Question-by-Question Step & Marking Analysis
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {breakdownList.map((item, bIdx) => {
                              const isCorrect = item.status === 'CORRECT';
                              const isPartial = item.status === 'PARTIAL';
                              const badgeBg = isCorrect ? '#ecfdf5' : isPartial ? '#fffbeb' : '#fef2f2';
                              const badgeColor = isCorrect ? '#047857' : isPartial ? '#b45309' : '#b91c1c';
                              const badgeBorder = isCorrect ? '#a7f3d0' : isPartial ? '#fde68a' : '#fecaca';

                              return (
                                <div
                                  key={bIdx}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid #d1fae5',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    fontSize: '12.5px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <strong style={{ color: '#0f172a' }}>{item.question || `Question ${bIdx + 1}`}</strong>
                                    <span
                                      style={{
                                        background: badgeBg,
                                        color: badgeColor,
                                        border: `1px solid ${badgeBorder}`,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '11px',
                                      }}
                                    >
                                      {item.marksAwarded ?? 0} / {item.maxMarks ?? '?'} marks · {item.status || 'CHECKED'}
                                    </span>
                                  </div>
                                  {item.studentWorking && (
                                    <div style={{ color: '#334155', fontSize: '12.5px', marginBottom: '3px' }}>
                                      <span style={{ fontWeight: 600, color: '#475569' }}>Student Answer: </span>
                                      <span style={{ fontWeight: isCorrect ? 600 : 500, color: isCorrect ? '#047857' : '#991b1b' }}>{item.studentWorking}</span>
                                    </div>
                                  )}
                                  {item.correctAnswer && (
                                    <div style={{ color: '#0369a1', fontSize: '12px', marginBottom: '3px' }}>
                                      <span style={{ fontWeight: 600, color: '#0284c7' }}>Correct Answer: </span>
                                      <span>{item.correctAnswer}</span>
                                    </div>
                                  )}
                                  {item.feedback && (
                                    <div style={{ color: isCorrect ? '#047857' : isPartial ? '#b45309' : '#b91c1c', fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>
                                      <span style={{ fontWeight: 600 }}>Examiner Feedback: </span>
                                      {item.feedback}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : sub.aiStatus === 'FAILED' ? (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '10px 16px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        color: '#991b1b',
                        fontSize: '12.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <span>AI auto-check note: {sub.aiDraftRemarks || 'Could not complete auto-check.'}</span>
                      <button
                        type="button"
                        className="button button-quiet"
                        style={{ fontSize: '12px', padding: '2px 8px', color: '#991b1b' }}
                        onClick={() => void handleEvaluateAI(sub.id)}
                      >
                        Retry AI
                      </button>
                    </div>
                  ) : null}

                  <div className="grading-panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0 }}>Teacher Assessment & Remarks</h4>
                      {sub.status === 'GRADED' ? (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>✓ Score is saved & verified</span>
                      ) : sub.aiDraftScore !== null && sub.aiDraftScore !== undefined ? (
                        <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>Draft pre-filled by AI · Click Save to confirm</span>
                      ) : null}
                    </div>

                    <div className="form-grid-2">
                      <label className="field compact-field">
                        <span>Final Score (Out of {paper.totalMarks})</span>
                        <input
                          type="number"
                          min={0}
                          max={paper.totalMarks}
                          value={currentScore}
                          onChange={(e) =>
                            setGradingState({
                              ...gradingState,
                              [sub.id]: { score: Number(e.target.value), remarks: currentRemarks },
                            })
                          }
                        />
                      </label>
                      <label className="field compact-field">
                        <span>Teacher Remarks / Feedback for Student & Parent</span>
                        <input
                          value={currentRemarks}
                          onChange={(e) =>
                            setGradingState({
                              ...gradingState,
                              [sub.id]: { score: currentScore, remarks: e.target.value },
                            })
                          }
                          placeholder="e.g. Excellent work on Q1-Q3! Neat handwriting."
                        />
                      </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        className="button danger-hover"
                        style={{ fontSize: '12.5px', padding: '6px 12px', color: '#dc2626', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        title="Reset submission: completely clears student's uploaded work, score and remarks, unlocking submission for student"
                        disabled={resettingId === sub.id}
                        onClick={() => void handleResetSubmission(sub.id, sub.student?.name || 'Student')}
                      >
                        {resettingId === sub.id ? (
                          <><RefreshCw size={13} className="spin" /> Resetting Submission...</>
                        ) : (
                          <><RotateCcw size={13} /> Reset Submission for {sub.student?.name || 'Student'}</>
                        )}
                      </button>

                      <button
                        className="button button-primary"
                        style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '10px' }}
                        disabled={savingId === sub.id}
                        onClick={() => void handleGrade(sub.id)}
                      >
                        {savingId === sub.id ? 'Saving...' : <><Check size={14} /> Save Score & Remarks</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedImage && createPortal(
        <div
          className="word-doc-modal-overlay"
          style={{ zIndex: 100001, background: 'rgba(15, 23, 42, 0.65)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '92vh', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Answer sheet full view" style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', background: '#fff' }} />
            <button className="icon-button quiet" style={{ position: 'absolute', top: '-14px', right: '-14px', background: '#e11d48', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} onClick={() => setSelectedImage(null)}>
              <X size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
}

function StudentOpenWorksheetsSection({ setNotice }: { setNotice: (msg: string) => void }) {
  const [worksheets, setWorksheets] = useState<WorksheetPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePaper, setActivePaper] = useState<WorksheetPaper | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ worksheets: WorksheetPaper[] }>('/api/worksheets');
      setWorksheets(data.worksheets);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const openWorksheets = worksheets.filter(
    (p) => p.status !== 'ARCHIVED' && !p.submission
  );

  return (
    <div className="student-quiz-list" style={{ marginTop: '40px' }}>
      <div className="section-heading">
        <div>
          <h2>Open Question Papers</h2>
          <p>Solve these in your workbook and upload your answer sheet photos</p>
        </div>
        <button className="icon-button" title="Refresh worksheets" onClick={() => void load()}>
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="student-loading"><RefreshCw size={16} className="spin" /> Loading papers...</div>
      ) : openWorksheets.length === 0 ? (
        <div className="student-waiting-home">
          <FileText size={22} color="#94a3b8" />
          <h2>No open question papers assigned yet.</h2>
          <p>Your teacher will post printable worksheets and question papers here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {openWorksheets.map((paper) => (
            <div
              key={paper.id}
              className="student-quiz-tile"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={async () => {
                const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${paper.id}`);
                setActivePaper(full.worksheet);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="quiz-mode-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  <FileText size={20} />
                </span>
                <div>
                  <strong style={{ fontSize: '16px', display: 'block', color: '#0f172a' }}>{paper.title}</strong>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {paper.subject} • {paper.grade} • Total Marks: {paper.totalMarks}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="tile-start">
                  Open Paper & Upload <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePaper && (
        <StudentPaperModal
          paper={activePaper}
          onClose={() => setActivePaper(null)}
          onSubmitted={async () => {
            setNotice('Your workbook answer sheet has been submitted to your teacher!');
            const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${activePaper.id}`);
            setActivePaper(full.worksheet);
            await load();
          }}
        />
      )}
    </div>
  );
}

function StudentWorksheetHistorySection({ setNotice }: { setNotice: (msg: string) => void }) {
  const [worksheets, setWorksheets] = useState<WorksheetPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePaper, setActivePaper] = useState<WorksheetPaper | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ worksheets: WorksheetPaper[] }>('/api/worksheets');
      setWorksheets(data.worksheets);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const historyWorksheets = worksheets.filter(
    (p) => Boolean(p.submission) || p.status === 'ARCHIVED'
  );

  return (
    <div className="student-quiz-list" style={{ marginTop: '0' }}>
      <div className="section-heading">
        <div>
          <h2>Question Papers History</h2>
          <p>Your submitted question papers, answer sheets, and teacher evaluation scores</p>
        </div>
        <button className="icon-button" title="Refresh history" onClick={() => void load()}>
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="student-loading"><RefreshCw size={16} className="spin" /> Loading history...</div>
      ) : historyWorksheets.length === 0 ? (
        <div className="student-waiting-home">
          <FileText size={22} color="#94a3b8" />
          <h2>No completed question papers yet.</h2>
          <p>When your teacher grades your submitted answer sheets, your score and evaluation feedback will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historyWorksheets.map((paper) => {
            const sub = paper.submission;
            const isGraded = sub?.status === 'GRADED';
            const isSubmitted = sub?.status === 'SUBMITTED';

            return (
              <div
                key={paper.id}
                className={`student-quiz-tile ${isGraded ? 'history-tile' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={async () => {
                  const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${paper.id}`);
                  setActivePaper(full.worksheet);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`quiz-mode-icon ${isGraded ? 'mode-history' : ''}`} style={!isGraded ? { background: '#e0f2fe', color: '#0369a1' } : undefined}>
                    <FileText size={20} />
                  </span>
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block', color: '#0f172a' }}>{paper.title}</strong>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {paper.subject} • {paper.grade} • Total Marks: {paper.totalMarks}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isGraded ? (
                    <div style={{ textAlign: 'right' }}>
                      <span className="history-score-pill" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 'bold' }}>
                        Score: <strong>{sub?.score}</strong> / {paper.totalMarks} ({Math.round(((sub?.score ?? 0) / (paper.totalMarks || 1)) * 100)}%)
                      </span>
                      <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', marginTop: '2px' }}>✓ EVALUATION COMPLETE</div>
                    </div>
                  ) : isSubmitted ? (
                    <span className="history-score-pill" style={{ background: '#fef3c7', color: '#b45309' }}>
                      Submitted (Pending Grade)
                    </span>
                  ) : paper.status === 'ARCHIVED' ? (
                    <span className="worksheet-badge badge-archived">Completed Paper</span>
                  ) : (
                    <span className="tile-start">
                      Open Paper & Upload <ArrowRight size={14} />
                    </span>
                  )}
                  <span className="tile-start text-button" style={{ fontSize: '14px' }}>
                    Review <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activePaper && (
        <StudentPaperModal
          paper={activePaper}
          onClose={() => setActivePaper(null)}
          onSubmitted={async () => {
            setNotice('Your workbook answer sheet has been submitted to your teacher!');
            const full = await api<{ worksheet: WorksheetPaper }>(`/api/worksheets/${activePaper.id}`);
            setActivePaper(full.worksheet);
            await load();
          }}
        />
      )}
    </div>
  );
}

function StudentPaperModal({
  paper,
  onClose,
  onSubmitted,
}: {
  paper: WorksheetPaper;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [showStudentBreakdown, setShowStudentBreakdown] = useState(false);

  const sub = paper.submission;
  let existingImages: string[] = [];
  try { existingImages = JSON.parse(sub?.images || '[]'); } catch { existingImages = []; }

  let studentBreakdownList: any[] = [];
  try {
    if (sub?.aiDraftBreakdown) studentBreakdownList = JSON.parse(sub.aiDraftBreakdown);
  } catch {
    studentBreakdownList = [];
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');

    for (const file of files) {
      try {
        const compressed = await compressImageFile(file);
        if (compressed) {
          setImages((prev) => [...prev, compressed]);
        }
      } catch {
        // quiet
      }
    }
  }

  async function handleSubmit() {
    if (images.length === 0) {
      setError('Please select at least one photo/scan of your workbook page.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await api(`/api/worksheets/${paper.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ images }),
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setUploading(false);
    }
  }

  return createPortal(
    <div className="word-doc-modal-overlay">
      <div className="word-doc-modal-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="word-doc-modal-header">
          <h3><FileText size={20} color="#0284c7" /> {paper.title}</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button button-secondary" onClick={() => printHtmlContent(paper.content)}>
              <Printer size={15} /> Print Paper
            </button>
            <button className="icon-button quiet" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {sub?.status === 'GRADED' && (
            <div style={{ background: '#ecfdf5', border: '2px solid #a7f3d0', borderRadius: '14px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(5,150,105,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluation Result & Assessment</span>
                  <h2 style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#065f46', fontWeight: 800 }}>
                    🏆 Score: {sub.score} / {paper.totalMarks} <span style={{ fontSize: '16px', fontWeight: 600, color: '#059669' }}>({Math.round(((sub.score ?? 0) / (paper.totalMarks || 1)) * 100)}%)</span>
                  </h2>
                </div>
                <span className="worksheet-badge badge-published" style={{ background: '#059669', color: '#fff', padding: '6px 14px', fontSize: '13px', borderRadius: '20px' }}>
                  ✓ Graded by Teacher
                </span>
              </div>
              {sub.remarks ? (
                <div style={{ marginTop: '14px', background: '#ffffff', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '14px 16px', color: '#064e3b' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#047857', marginBottom: '4px' }}>💬 Teacher Feedback / Remarks for Student & Parent:</strong>
                  <p style={{ margin: 0, fontSize: '15px', fontStyle: 'italic', color: '#0f172a', lineHeight: '1.5' }}>"{sub.remarks}"</p>
                </div>
              ) : (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#047857' }}>
                  No written remarks provided by teacher.
                </div>
              )}

              {studentBreakdownList.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 14px', background: '#ffffff', borderColor: '#6ee7b7', color: '#047857', borderRadius: '9px', fontWeight: 600 }}
                    onClick={() => setShowStudentBreakdown((prev) => !prev)}
                  >
                    {showStudentBreakdown ? 'Hide Question-by-Question Analysis' : `View Question-by-Question Analysis (${studentBreakdownList.length} Questions)`}
                  </button>
                  {showStudentBreakdown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {studentBreakdownList.map((item: any, bIdx: number) => {
                        const isCorrect = item.status === 'CORRECT';
                        const isPartial = item.status === 'PARTIAL';
                        const badgeBg = isCorrect ? '#ecfdf5' : isPartial ? '#fffbeb' : '#fef2f2';
                        const badgeColor = isCorrect ? '#047857' : isPartial ? '#b45309' : '#b91c1c';
                        const badgeBorder = isCorrect ? '#a7f3d0' : isPartial ? '#fde68a' : '#fecaca';
                        return (
                          <div key={bIdx} style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <strong style={{ color: '#0f172a' }}>{item.question || `Question ${bIdx + 1}`}</strong>
                              <span style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '11px' }}>
                                {item.marksAwarded ?? 0} / {item.maxMarks ?? '?'} marks · {item.status || 'CHECKED'}
                              </span>
                            </div>
                            {item.studentWorking && (
                              <div style={{ color: '#334155', fontSize: '12px', marginBottom: '3px' }}>
                                <span style={{ fontWeight: 600, color: '#475569' }}>Your Answer: </span>
                                <span style={{ fontWeight: isCorrect ? 600 : 500, color: isCorrect ? '#047857' : '#991b1b' }}>{item.studentWorking}</span>
                              </div>
                            )}
                            {item.correctAnswer && (
                              <div style={{ color: '#0369a1', fontSize: '12px', marginBottom: '3px' }}>
                                <span style={{ fontWeight: 600, color: '#0284c7' }}>Correct Answer: </span>
                                <span>{item.correctAnswer}</span>
                              </div>
                            )}
                            {item.feedback && (
                              <div style={{ color: isCorrect ? '#047857' : isPartial ? '#b45309' : '#b91c1c', fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>
                                <span style={{ fontWeight: 600 }}>Examiner Feedback: </span>
                                {item.feedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {sub?.status === 'SUBMITTED' && (
            <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase' }}>Submission Status</span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', color: '#92400e' }}>⏳ Answer Sheets Submitted (Pending Teacher Evaluation)</h3>
                </div>
                <span className="worksheet-badge badge-draft" style={{ background: '#f59e0b', color: '#fff', padding: '6px 12px' }}>
                  Under Review
                </span>
              </div>
            </div>
          )}

          {paper.status === 'ARCHIVED' && sub?.status !== 'GRADED' && sub?.status !== 'SUBMITTED' && (
            <div style={{ background: '#f1f5f9', border: '2px solid #cbd5e1', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Question Paper Status</span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#334155' }}>✓ Question Paper Marked Completed by Teacher</h3>
                </div>
                <span className="worksheet-badge badge-archived">Archived</span>
              </div>
            </div>
          )}

          <div className="word-doc-canvas" style={{ margin: '0 auto 30px auto', boxShadow: 'none' }} dangerouslySetInnerHTML={{ __html: paper.content }} />

          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
            {sub?.status === 'GRADED' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '12px', color: '#065f46' }}>
                  <div style={{ background: '#dcfce7', borderRadius: '50%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={20} color="#059669" />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block', color: '#064e3b' }}>
                      Answer Sheet Evaluated & Submissions Closed
                    </strong>
                    <span style={{ fontSize: '12.5px', color: '#047857' }}>
                      Your teacher has evaluated your work and recorded the official score and remarks above. Further submissions for this paper are locked.
                    </span>
                  </div>
                </div>

                {existingImages.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '8px' }}>
                      Your Evaluated Answer Sheet Pages ({existingImages.length} Page{existingImages.length === 1 ? '' : 's'}):
                    </strong>
                    <div className="image-preview-strip">
                      {existingImages.map((img, idx) => (
                        <div className="image-preview-thumb" key={idx} onClick={() => setPreviewImg(img)} style={{ cursor: 'pointer' }}>
                          <img src={img} alt={`Page ${idx + 1}`} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '2px' }}>
                            Page {idx + 1} (Click)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UploadCloud size={18} color="#0284c7" /> {sub?.status === 'SUBMITTED' ? 'Your Submitted Answer Sheets' : 'Upload Your Workbook Answer Sheets'}
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                  {sub?.status === 'SUBMITTED'
                    ? 'Review your uploaded answer sheet pages below or attach additional photos.'
                    : 'Solve the questions on paper in your physical workbook, take clear photos of your pages, and upload them here for your teacher to check.'}
                </p>

                {error && <div className="inline-error" style={{ marginBottom: '12px' }}>{error}</div>}

                <label className="upload-box">
                  <UploadCloud size={32} color="#0284c7" />
                  <p>Click or Tap to Select/Take Photos of Answer Sheet Pages</p>
                  <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>

                {images.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '13px', color: '#334155' }}>Selected Pages to Submit ({images.length}):</strong>
                    <div className="image-preview-strip">
                      {images.map((img, idx) => (
                        <div className="image-preview-thumb" key={idx} onClick={() => setPreviewImg(img)} style={{ cursor: 'pointer' }}>
                          <img src={img} alt={`Page ${idx + 1}`} />
                          <button type="button" title="Remove page" onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, i) => i !== idx)); }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="button button-primary" onClick={() => void handleSubmit()} disabled={uploading}>
                        {uploading ? <><RefreshCw size={16} className="spin" /> Submitting...</> : <><Send size={15} /> Submit Answer Sheets to Teacher</>}
                      </button>
                    </div>
                  </div>
                )}

                {existingImages.length > 0 && images.length === 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong style={{ fontSize: '13px', color: '#059669', display: 'block', marginBottom: '8px' }}>
                      ✓ Previously Submitted Pages ({existingImages.length} Page{existingImages.length === 1 ? '' : 's'}):
                    </strong>
                    <div className="image-preview-strip">
                      {existingImages.map((img, idx) => (
                        <div className="image-preview-thumb" key={idx} onClick={() => setPreviewImg(img)} style={{ cursor: 'pointer' }}>
                          <img src={img} alt={`Page ${idx + 1}`} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '2px' }}>
                            Page {idx + 1} (Click)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
              <Lock size={14} color="#059669" /> Your answer sheet photos are private and only visible to you and your teacher.
            </div>
          </div>
        </div>

        {previewImg && (
          <div className="word-doc-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setPreviewImg(null)}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <img src={previewImg} alt="Answer sheet full view" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
              <button className="icon-button quiet" style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#e11d48', color: '#fff', borderRadius: '50%' }} onClick={() => setPreviewImg(null)}>
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function PaperPreviewModal({
  paper,
  onClose,
  onOpenInLiveCanvas,
}: {
  paper: WorksheetPaper;
  onClose: () => void;
  onOpenInLiveCanvas?: (paper: { title: string; content: string; grade?: string | null; subject?: string | null }) => void;
}) {
  const isHtml = paper.content && paper.content.includes('<') && paper.content.includes('>');
  const renderedHtml = isHtml
    ? paper.content
    : (paper.content || '')
      .split('\n')
      .map((line) => {
        if (line.startsWith('# ')) return `<h2>${line.replace('# ', '')}</h2>`;
        if (line.startsWith('## ')) return `<h3>${line.replace('## ', '')}</h3>`;
        if (line.startsWith('### ')) return `<h4>${line.replace('### ', '')}</h4>`;
        if (line.startsWith('- ')) return `<li>${line.replace('- ', '')}</li>`;
        if (!line.trim()) return '<br/>';
        return `<p>${line}</p>`;
      })
      .join('');

  return createPortal(
    <div className="word-doc-modal-overlay">
      <div className="word-doc-modal-container" style={{ maxWidth: '850px' }}>
        <div className="word-doc-modal-header">
          <h3><Eye size={18} /> {paper.title}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onOpenInLiveCanvas && (
              <button
                type="button"
                className="button button-primary"
                style={{ fontSize: '12.5px', padding: '6px 12px', gap: '6px', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', borderColor: '#0284c7' }}
                onClick={() => {
                  onClose();
                  onOpenInLiveCanvas(paper);
                }}
              >
                <Sparkles size={14} /> Open in Live Teaching Canvas
              </button>
            )}
            <button className="button button-secondary" onClick={() => printHtmlContent(renderedHtml)}>
              <Printer size={15} /> Print Paper
            </button>
            <button className="icon-button quiet" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div className="word-doc-canvas" style={{ margin: '0 auto', boxShadow: 'none' }} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default App;
