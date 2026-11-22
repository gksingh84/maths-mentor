import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express, { type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { createServer } from 'node:http';
import { createHmac, randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { Prisma, PrismaClient, type QuizMode } from '@prisma/client';
import { Server } from 'socket.io';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const db: any = prisma;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
  maxHttpBufferSize: 5e7, // 50MB for whiteboard vectors/slides
});
const port = Number(process.env.PORT ?? 4000);
const rawSecret = process.env.SESSION_SECRET;
const secret = rawSecret && rawSecret.length >= 32
  ? rawSecret
  : (rawSecret
    ? createHmac('sha256', 'livequiz-secret-salt').update(rawSecret).digest('hex')
    : 'default-livequiz-secure-session-secret-key-32-chars-minimum-fallback');

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(cookieParser());
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/me' || req.path === '/logout',
  message: { error: 'Too many authentication attempts. Please try again in a few minutes.' },
}));

const sessionCookie = 'livequiz_session';
type Role = 'superadmin' | 'teacher' | 'admin' | 'student';
type Session = { id: string; role: Role; username?: string; email?: string; name?: string };
type AuthRequest = Request & { session?: Session };
const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.COOKIE_SECURE === 'true', path: '/' };
const passkeyLookup = (passkey: string) => createHmac('sha256', 'livequiz-passkey-lookup-salt').update(passkey.toUpperCase()).digest('hex');
const signSession = (session: Session) => jwt.sign(session, secret, { expiresIn: '12h' });
const sendSession = (res: Response, session: Session) => res.cookie(sessionCookie, signSession(session), cookieOptions);

// In-Memory Chat caches and socket tracking
const userTeacherIdCache = new Map<string, { teacherId: string; expires: number }>();
const chatMemoryCache = new Map<string, any[]>();
const activeTeacherSockets = new Map<string, Set<string>>();
const teacherDisconnectTimers = new Map<string, NodeJS.Timeout>();

async function clearTeacherChatMessages(teacherId: string) {
  try {
    for (const key of Array.from(chatMemoryCache.keys())) {
      if (key.startsWith(`${teacherId}:`)) {
        chatMemoryCache.delete(key);
      }
    }
    const res = await (prisma as any).chatMessage.deleteMany({
      where: { teacherId },
    });
    console.log(`🧹 Deleted ${res.count} chat messages for teacher ${teacherId}`);
    io.to(`chat:${teacherId}:everyone`).emit('chat:cleared');
    io.to(`chat:${teacherId}:teacher`).emit('chat:cleared');
  } catch (err) {
    console.error('Error clearing chat messages:', err);
  }
}

const activeStudentSockets = new Map<string, Set<string>>();
const studentDisconnectTimers = new Map<string, NodeJS.Timeout>();

async function clearStudentChatMessages(studentId: string) {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, teacherId: true },
    });
    const teacherId = student?.teacherId;

    // 1. Delete all chat messages involving this student:
    // Both 1-to-1 direct messages (where studentId === student.id)
    // AND any messages sent by this student (senderId === student.id)
    const res = await (prisma as any).chatMessage.deleteMany({
      where: {
        OR: [
          { studentId },
          { senderId: studentId },
        ],
      },
    });
    console.log(`🧹 Deleted ${res.count} chat messages on student ${studentId} logout.`);

    // 2. Clear in-memory cache
    if (teacherId) {
      chatMemoryCache.delete(`${teacherId}:direct:${studentId}`);

      // Also clean up any message sent by this student from everyone cache
      const everyoneKey = `${teacherId}:everyone`;
      const cachedEveryone = chatMemoryCache.get(everyoneKey);
      if (cachedEveryone && Array.isArray(cachedEveryone)) {
        chatMemoryCache.set(everyoneKey, cachedEveryone.filter((m: any) => m.senderId !== studentId));
      }

      // 3. Emit real-time socket events so teacher and student chat boxes update immediately
      io.to(`chat:${teacherId}:direct:${studentId}`).emit('chat:cleared_student', { studentId });
      io.to(`chat:${teacherId}:teacher`).emit('chat:cleared_student', { studentId });
      io.to(`chat:${teacherId}:everyone`).emit('chat:student_cleared', { studentId });
    }
  } catch (err) {
    console.error(`Error clearing chat messages for student ${studentId}:`, err);
  }
}

const teacherActiveCache = new Map<string, { time: number; active: boolean }>();
const studentActiveCache = new Map<string, { time: number; active: boolean }>();

export function invalidateAuthCache(id?: string) {
  if (id) {
    teacherActiveCache.delete(id);
    studentActiveCache.delete(id);
  } else {
    teacherActiveCache.clear();
    studentActiveCache.clear();
  }
}

const authenticate = (allowedRoles?: Role | Role[]) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies[sessionCookie] as string | undefined;
  try {
    const payload = jwt.verify(token ?? '', secret) as JwtPayload & Session;
    if (!payload.id || !payload.role) {
      return res.status(401).json({ error: 'Please sign in to continue.' });
    }
    if (allowedRoles) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const match = roles.includes(payload.role) || (roles.includes('teacher') && payload.role === 'admin');
      if (!match) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
      }
    }
    req.session = { id: payload.id, role: payload.role, username: payload.username, email: payload.email, name: payload.name };
    if (payload.role === 'student') {
      const cached = studentActiveCache.get(payload.id);
      let isActive = cached && (Date.now() - cached.time < 60000) ? cached.active : null;
      if (isActive === null) {
        const student = await prisma.student.findUnique({ where: { id: payload.id }, select: { active: true } });
        isActive = Boolean(student?.active);
        studentActiveCache.set(payload.id, { time: Date.now(), active: isActive });
      }
      if (!isActive) return res.status(401).json({ error: 'This student passkey has been disabled.' });
    } else if (payload.role === 'teacher') {
      const cached = teacherActiveCache.get(payload.id);
      let isActive = cached && (Date.now() - cached.time < 60000) ? cached.active : null;
      if (isActive === null) {
        let teacher = await db.teacher.findUnique({ where: { id: payload.id }, select: { id: true, active: true } });
        if (!teacher && payload.email) {
          teacher = await db.teacher.findUnique({ where: { email: payload.email.toLowerCase() }, select: { id: true, active: true } });
          if (teacher) {
            req.session.id = teacher.id;
          }
        }
        if (!teacher) {
          const admin = await prisma.admin.findUnique({ where: { id: payload.id }, select: { id: true } });
          isActive = Boolean(admin);
        } else {
          isActive = Boolean(teacher.active);
        }
        teacherActiveCache.set(payload.id, { time: Date.now(), active: isActive });
      }
      if (!isActive) return res.status(403).json({ error: 'This teacher account is pending activation by the Administrator.' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
};
const superAdminOnly = authenticate('superadmin');
const teacherOnly = authenticate(['teacher', 'admin']);
const adminOnly = teacherOnly; // Backward compatibility alias
const studentOnly = authenticate('student');
const objectId = z.string().min(1).max(40);
const questionInput = z.object({
  prompt: z.string().trim().min(1).max(1000),
  marks: z.number().int().min(1).max(100),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
  type: z.enum(['MCQ', 'FILL_BLANK', 'TRUE_FALSE', 'SOLVE']).optional().default('MCQ'),
  options: z.array(z.object({ text: z.string().trim().min(1).max(300), isCorrect: z.boolean() })).min(2).max(8)
    .refine((options) => options.filter((option) => option.isCorrect).length === 1, 'Choose exactly one correct option.'),
});
const quizInput = z.object({
  title: z.string().trim().min(1).max(120),
  grade: z.string().trim().min(1).max(50).nullable().optional(),
  mode: z.enum(['LIVE', 'SELF_PACED']),
  timeLimitSeconds: z.number().int().nullable().optional(),
  showResults: z.boolean(),
  questions: z.array(questionInput).min(1).max(100),
});
const parse = <Output, Def extends z.ZodTypeDef = z.ZodTypeDef, Input = any>(schema: z.ZodType<Output, Def, Input>, value: unknown): Output => schema.parse(value);
const errorResponse = (res: Response, error: unknown) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message ?? 'Invalid request.' });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ error: 'This record already exists.' });
  if (error instanceof Error && error.message) return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
};

export function getAcademicYear(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const month = d.getMonth() + 1; // 1 = Jan, 4 = Apr, 12 = Dec
  const year = d.getFullYear();
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export const ACADEMIC_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

export function getCalendarYearMonth(academicYear: string, monthName: string): { year: number; month: number; yearMonth: string } {
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

export function getStudentJoiningDate(student: any): { joiningDate: string; joiningYearMonth: string } {
  let joiningDateStr = '2000-01-01';
  if (student?.joiningDate) {
    try {
      joiningDateStr = new Date(student.joiningDate).toISOString().slice(0, 10);
    } catch {
      joiningDateStr = '2000-01-01';
    }
  } else if (student?.createdAt) {
    try {
      joiningDateStr = new Date(student.createdAt).toISOString().slice(0, 10);
    } catch {
      joiningDateStr = '2000-01-01';
    }
  }
  return {
    joiningDate: joiningDateStr,
    joiningYearMonth: joiningDateStr.slice(0, 7),
  };
}

// In-memory cache for fast student progress report retrieval (10s TTL)
export const progressReportCache = new Map<string, { time: number; data: any }>();

export function invalidateProgressCache(studentId?: string) {
  if (studentId) {
    for (const key of progressReportCache.keys()) {
      if (key.startsWith(`${studentId}:`)) {
        progressReportCache.delete(key);
      }
    }
  } else {
    progressReportCache.clear();
  }
}

async function recordScoreRecord(data: {
  studentId: string;
  teacherId?: string | null;
  title: string;
  itemType: 'QUIZ' | 'QUESTION_PAPER';
  score: number | null;
  totalMarks: number;
  percentage?: number | null;
  grade?: string | null;
  subject?: string | null;
  academicYear?: string;
  completedAt?: Date;
  remarks?: string | null;
  quizId?: string | null;
  paperId?: string | null;
}) {
  try {
    const completedAt = data.completedAt || new Date();
    const academicYear = data.academicYear || getAcademicYear(completedAt);
    const scoreVal = data.score !== null && data.score !== undefined ? Number(data.score) : null;
    const totalMarks = Math.max(1, Number(data.totalMarks) || 1);
    const percentage = scoreVal !== null ? Math.round((scoreVal / totalMarks) * 100 * 10) / 10 : null;

    let existing: any = null;
    if (data.quizId) {
      existing = await (prisma as any).studentScoreRecord.findFirst({
        where: { studentId: data.studentId, quizId: data.quizId }
      });
    } else if (data.paperId) {
      existing = await (prisma as any).studentScoreRecord.findFirst({
        where: { studentId: data.studentId, paperId: data.paperId }
      });
    }

    let recordResult: any = null;
    if (existing) {
      recordResult = await (prisma as any).studentScoreRecord.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          score: scoreVal,
          totalMarks: Number(data.totalMarks),
          percentage,
          grade: data.grade || existing.grade,
          subject: data.subject || existing.subject || 'Mathematics',
          academicYear,
          completedAt,
          remarks: data.remarks || existing.remarks,
        }
      });
    } else {
      recordResult = await (prisma as any).studentScoreRecord.create({
        data: {
          studentId: data.studentId,
          teacherId: data.teacherId || null,
          title: data.title,
          itemType: data.itemType,
          score: scoreVal,
          totalMarks: Number(data.totalMarks),
          percentage,
          grade: data.grade || null,
          subject: data.subject || 'Mathematics',
          academicYear,
          completedAt,
          remarks: data.remarks || null,
          quizId: data.quizId || null,
          paperId: data.paperId || null,
        }
      });
    }

    invalidateProgressCache(data.studentId);
    return recordResult;
  } catch (err) {
    console.error('⚠️ Failed to record student score history:', err);
    return null;
  }
}

async function scoreAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { option: true, question: true } },
      quiz: { include: { questions: { select: { marks: true } } } },
      student: { select: { id: true, name: true, grade: true } }
    }
  });
  if (!attempt) return null;
  const score = attempt.answers.reduce((total, answer) => total + (answer.option.isCorrect ? answer.question.marks : 0), 0);
  const totalMarks = attempt.quiz ? attempt.quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0) : 20;
  const submittedAt = attempt.submittedAt ?? new Date();
  const updated = await prisma.attempt.update({ where: { id: attemptId }, data: { score, status: 'SUBMITTED', submittedAt } });

  if (attempt.quiz) {
    void recordScoreRecord({
      studentId: attempt.studentId,
      teacherId: attempt.quiz.teacherId,
      title: attempt.quiz.title,
      itemType: 'QUIZ',
      score,
      totalMarks,
      grade: attempt.quiz.grade || attempt.student?.grade,
      subject: 'Mathematics',
      completedAt: submittedAt,
      quizId: attempt.quizId,
    });
  }

  return updated;
}

async function finishExpiredAttempts() {
  const expired = await prisma.attempt.findMany({ where: { status: 'IN_PROGRESS', deadlineAt: { lte: new Date() } }, select: { id: true } });
  for (const attempt of expired) await scoreAttempt(attempt.id);
}

const questionForStudent = (question: { id: string; prompt: string; marks: number; imageUrl?: string | null; type?: string | null; options: { id: string; text: string; isCorrect: boolean }[] }, reveal: boolean) => ({
  id: question.id,
  prompt: question.prompt,
  marks: question.marks,
  imageUrl: question.imageUrl ?? null,
  type: question.type ?? 'MCQ',
  options: question.options.map(({ id, text, isCorrect }) => reveal ? { id, text, isCorrect } : { id, text }),
});

interface LiveQuizTimerState {
  quizId: string;
  durationSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  phase: 'question' | 'revealing' | 'gap' | 'advancing' | 'idle';
  gapRemainingSeconds: number;
  isTransitioning?: boolean;
  timerTimeout?: NodeJS.Timeout;
}

const liveQuizTimers = new Map<string, LiveQuizTimerState>();

function getQuizTimerState(quizId: string) {
  const timer = liveQuizTimers.get(quizId);
  if (!timer) return null;
  return {
    enabled: timer.durationSeconds > 0,
    durationSeconds: Math.max(0, timer.durationSeconds),
    remainingSeconds: Math.max(0, timer.remainingSeconds),
    isPaused: timer.isPaused,
    phase: timer.phase,
    gapRemainingSeconds: Math.max(0, timer.gapRemainingSeconds),
  };
}

function broadcastTimerState(quizId: string) {
  const state = getQuizTimerState(quizId);
  if (state) {
    io.to(`teachers:${quizId}`).emit('quiz:timer', state);
    io.to(`students:${quizId}`).emit('quiz:timer', state);
  }
}

function clearQuizTimer(quizId: string) {
  const current = liveQuizTimers.get(quizId);
  if (current?.timerTimeout) {
    clearTimeout(current.timerTimeout);
  }
  liveQuizTimers.delete(quizId);
}

function scheduleNextTimerTick(quizId: string, delayMs = 1000) {
  const current = liveQuizTimers.get(quizId);
  if (!current) return;
  if (current.timerTimeout) {
    clearTimeout(current.timerTimeout);
  }
  current.timerTimeout = setTimeout(() => {
    void handleQuizTimerTick(quizId);
  }, delayMs);
}

async function executeAnswerRevealAndGapSequence(quizId: string) {
  const t = liveQuizTimers.get(quizId);
  if (!t || t.isTransitioning) return;

  // 1. Lock state into 'revealing' so no timers tick or jump
  t.isTransitioning = true;
  t.phase = 'revealing';
  t.remainingSeconds = 0;
  broadcastTimerState(quizId);

  try {
    // 2. Save reveal to DB and broadcast quiz state to all kids (whatever time it takes)
    await prisma.quiz.update({
      where: { id: quizId },
      data: { currentAnswerRevealed: true },
    });
    await publishQuizState(quizId);
  } catch (e) {
    console.error(`[Quiz ${quizId}] Error revealing answer on timer expiry:`, e);
  }

  // 3. Verify quiz timer was not cancelled or cleared during DB / broadcast latency
  const current = liveQuizTimers.get(quizId);
  if (!current || current !== t) return;

  // 4. NOW that the answer is 100% loaded and revealed on student screens,
  // begin the 3-second gap timer!
  t.phase = 'gap';
  t.gapRemainingSeconds = 3; // Guaranteed full 3 seconds gap
  t.isTransitioning = false;
  broadcastTimerState(quizId);

  scheduleNextTimerTick(quizId, 1000);
}

async function executeAdvanceToNextQuestion(quizId: string) {
  const t = liveQuizTimers.get(quizId);
  if (!t || t.isTransitioning) return;

  t.isTransitioning = true;
  t.phase = 'advancing';
  t.gapRemainingSeconds = 0;
  broadcastTimerState(quizId);

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { _count: { select: { questions: true } } },
    });
    if (!quiz || quiz.status !== 'ACTIVE') {
      clearQuizTimer(quizId);
      return;
    }
    const nextIndex = quiz.currentQuestionIndex + 1;
    if (nextIndex >= quiz._count.questions) {
      // All questions finished, close quiz and score
      clearQuizTimer(quizId);
      await prisma.quiz.update({ where: { id: quizId }, data: { status: 'CLOSED' } });
      const attempts = await prisma.attempt.findMany({ where: { quizId, status: 'IN_PROGRESS' }, select: { id: true } });
      for (const attempt of attempts) await scoreAttempt(attempt.id);
      await publishQuizState(quizId);
    } else {
      // Next question
      await prisma.quiz.update({
        where: { id: quizId },
        data: { currentQuestionIndex: nextIndex, currentAnswerRevealed: false },
      });
      await publishQuizState(quizId);
      // Restart timer for next question fresh
      startQuizTimerForQuestion(quizId, t.durationSeconds);
    }
  } catch (e) {
    console.error(`[Quiz ${quizId}] Error advancing to next question after gap:`, e);
    clearQuizTimer(quizId);
  }
}

async function handleQuizTimerTick(quizId: string) {
  const t = liveQuizTimers.get(quizId);
  if (!t) return;
  if (t.isPaused) {
    scheduleNextTimerTick(quizId, 1000);
    return;
  }
  if (t.isTransitioning) {
    scheduleNextTimerTick(quizId, 500);
    return;
  }

  if (t.phase === 'question') {
    t.remainingSeconds = Math.max(0, t.remainingSeconds - 1);
    broadcastTimerState(quizId);

    if (t.remainingSeconds <= 0) {
      // Question time expired: start the sequential reveal -> 3s gap -> next question sequence
      await executeAnswerRevealAndGapSequence(quizId);
      return;
    }
    scheduleNextTimerTick(quizId, 1000);
    return;
  }

  if (t.phase === 'gap') {
    t.gapRemainingSeconds = Math.max(0, t.gapRemainingSeconds - 1);
    broadcastTimerState(quizId);

    if (t.gapRemainingSeconds <= 0) {
      // Gap complete: safely advance to next question
      await executeAdvanceToNextQuestion(quizId);
      return;
    }
    scheduleNextTimerTick(quizId, 1000);
    return;
  }
}

function startQuizTimerForQuestion(quizId: string, durationSeconds: number) {
  clearQuizTimer(quizId);
  if (!durationSeconds || durationSeconds <= 0) return;

  const timerState: LiveQuizTimerState = {
    quizId,
    durationSeconds,
    remainingSeconds: durationSeconds,
    isPaused: false,
    phase: 'question',
    gapRemainingSeconds: 0,
    isTransitioning: false,
  };

  liveQuizTimers.set(quizId, timerState);
  broadcastTimerState(quizId);
  scheduleNextTimerTick(quizId, 1000);
}

async function studentQuizState(quizId: string, studentId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { position: 'asc' }, include: { options: { orderBy: { position: 'asc' } } } }, attempts: { where: { studentId }, include: { answers: true } } },
  });
  if (!quiz) return null;
  const attempt = quiz.attempts[0] ?? null;
  const isFinished = attempt?.status === 'SUBMITTED' || quiz.status === 'CLOSED';
  const reveal = isFinished || (quiz.mode === 'LIVE' && quiz.currentAnswerRevealed);

  const questions = (quiz.mode === 'LIVE' && !isFinished)
    ? quiz.questions.slice(quiz.currentQuestionIndex, quiz.currentQuestionIndex + 1)
    : quiz.questions;

  const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);

  return {
    id: quiz.id, title: quiz.title, mode: quiz.mode, status: quiz.status,
    timeLimitSeconds: quiz.timeLimitSeconds, showResults: quiz.showResults,
    currentQuestionIndex: quiz.currentQuestionIndex, currentAnswerRevealed: quiz.currentAnswerRevealed,
    questionCount: quiz.questions.length,
    totalMarks,
    questions: questions.map((question) => questionForStudent(question, reveal)),
    attempt: attempt ? { id: attempt.id, status: attempt.status, startedAt: attempt.startedAt, deadlineAt: attempt.deadlineAt, submittedAt: attempt.submittedAt, score: quiz.showResults ? attempt.score : null, answers: attempt.answers.map(({ questionId, optionId }) => ({ questionId, optionId })) } : null,
    timer: getQuizTimerState(quizId),
  };
}

async function publishQuizState(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { position: 'asc' },
        include: {
          options: {
            orderBy: { position: 'asc' },
          }
        }
      }
    }
  });
  if (!quiz) return;
  const question = quiz.questions[quiz.currentQuestionIndex];
  const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
  let stats = { answered: 0, participants: 0, distribution: [] as { optionId: string; count: number }[], responses: [] as { name: string; optionId: string; text: string }[] };
  if (question) {
    const attemptFilter = quiz.status === 'ACTIVE' ? { quizId, status: 'IN_PROGRESS' as const } : { quizId };
    const [answers, participants, responses] = await Promise.all([
      prisma.answer.groupBy({ by: ['optionId'], where: { questionId: question.id, attempt: attemptFilter }, _count: { _all: true } }),
      prisma.attempt.count({ where: attemptFilter }),
      prisma.answer.findMany({
        where: { questionId: question.id, attempt: attemptFilter },
        select: { optionId: true, option: { select: { id: true, text: true } }, attempt: { select: { student: { select: { name: true } } } } },
        orderBy: { updatedAt: 'asc' }
      }),
    ]);
    stats = {
      answered: answers.reduce((sum, answer) => sum + answer._count._all, 0),
      participants,
      distribution: question.options.map((option) => ({ optionId: option.id, count: answers.find((answer) => answer.optionId === option.id)?._count._all ?? 0 })),
      responses: responses.map((answer) => ({ name: answer.attempt.student.name, optionId: answer.option.id, text: answer.option.text })),
    };
  }
  const state = {
    id: quiz.id, title: quiz.title, mode: quiz.mode, status: quiz.status,
    timeLimitSeconds: quiz.timeLimitSeconds,
    currentQuestionIndex: quiz.currentQuestionIndex, currentAnswerRevealed: quiz.currentAnswerRevealed,
    questionCount: quiz.questions.length,
    totalMarks,
    question: question ? questionForStudent(question, quiz.currentAnswerRevealed) : null,
    timer: getQuizTimerState(quizId),
  };
  io.to(`teachers:${quizId}`).emit('quiz:state', state);
  io.to(`students:${quizId}`).emit('quiz:state', state);
  io.to(`teachers:${quizId}`).emit('quiz:stats', stats);
  io.to('students:lobby').emit('quiz:lobby_updated');
}
 
// Gmail SMTP Password Reset Email Sender
async function sendPasswordResetEmail(toEmail: string, teacherName: string, resetUrl: string): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  console.log(`[PASSWORD RESET] Recipient: ${teacherName} (${toEmail})`);
  console.log(`[PASSWORD RESET] Reset URL: ${resetUrl}`);

  if (!gmailUser || !gmailPass) {
    console.warn('[PASSWORD RESET] GMAIL_USER or GMAIL_APP_PASSWORD is not configured in .env. Falling back to console output.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const mailOptions = {
      from: `"EduAshram Support" <${gmailUser}>`,
      to: toEmail,
      subject: 'EduAshram • Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your EduAshram Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 36px; text-align: left;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">EduAshram</h1>
                      <p style="margin: 6px 0 0; font-size: 13.5px; color: #e0e7ff; font-weight: 500;">Educator Classroom &amp; Assessment Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 36px 36px 28px;">
                      <h2 style="margin: 0 0 14px; font-size: 20px; font-weight: 700; color: #0f172a;">Password Reset Request</h2>
                      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                        Hello <strong>${teacherName || 'Educator'}</strong>,
                      </p>
                      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                        We received a request to reset your password for your EduAshram teacher account. Click the button below to choose your new password:
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 34px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                              Reset Password &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 24px 0 10px; font-size: 13px; line-height: 1.5; color: #64748b;">
                        If the button doesn't work, copy and paste this link into your web browser:
                      </p>
                      <div style="background-color: #f1f5f9; padding: 12px 14px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; color: #334155; border: 1px solid #cbd5e1;">
                        ${resetUrl}
                      </div>

                      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #94a3b8;">
                          <strong>Security Notice:</strong> This reset link will expire in <strong>30 minutes</strong>. If you did not request this, please ignore this email; your account and existing password remain safe.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        &copy; ${new Date().getFullYear()} EduAshram Learning Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[PASSWORD RESET] Email successfully delivered to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[PASSWORD RESET] Failed to send email via Gmail SMTP:`, err);
    return false;
  }
}

// Super Admin Auth Endpoint (Username/Email + Password + Secret Key)
app.post('/api/auth/superadmin', async (req: Request, res: Response) => {
  try {
    const data = parse(z.object({
      username: z.string().trim().min(1).max(100),
      password: z.string().min(1).max(200),
      secretKey: z.string().min(1).max(200),
    }), req.body);

    const inputUser = data.username.toLowerCase();
    const envUser = (process.env.SUPERADMIN_USERNAME || 'admin').toLowerCase();
    const envPass = process.env.SUPERADMIN_PASSWORD || 'adminpassword123';
    const envSecret = process.env.SUPERADMIN_SECRET_KEY || 'eduashram@secret2026';
    const envEmail = (process.env.SUPERADMIN_EMAIL || 'gaurav.kr.singh@hotmail.com').toLowerCase();

    let superAdmin = await db.superAdmin.findFirst({
      where: {
        OR: [
          { username: { equals: inputUser, mode: 'insensitive' } },
          { email: { equals: inputUser, mode: 'insensitive' } },
        ]
      }
    });

    let isValid = false;
    if (superAdmin) {
      const passMatch = (await bcrypt.compare(data.password, superAdmin.passwordHash)) || (data.password === envPass);
      const secretMatch = (await bcrypt.compare(data.secretKey, superAdmin.secretKeyHash)) || (data.secretKey === envSecret);
      if (passMatch && secretMatch) isValid = true;
    } else if ((inputUser === envUser || inputUser === envEmail) && data.password === envPass && data.secretKey === envSecret) {
      // Auto-create from .env if record missing
      const superAdminPasswordHash = await bcrypt.hash(envPass, 12);
      const superAdminSecretKeyHash = await bcrypt.hash(envSecret, 12);
      superAdmin = await db.superAdmin.create({
        data: {
          username: envUser,
          email: envEmail,
          passwordHash: superAdminPasswordHash,
          secretKeyHash: superAdminSecretKeyHash,
        }
      });
      isValid = true;
    }

    if (!isValid || !superAdmin) {
      return res.status(401).json({ error: 'Invalid Super Admin credentials or Secret Key.' });
    }

    const session: Session = { id: superAdmin.id, role: 'superadmin', username: superAdmin.username, email: superAdmin.email };
    sendSession(res, session);
    res.json({ user: session });
  } catch (error) { errorResponse(res, error); }
});

// Teacher Sign Up (Pending Super Admin Approval)
app.post('/api/auth/teacher/signup', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(150),
      password: z.string().min(6).max(200),
      school: z.string().trim().max(200).optional().nullable(),
      subject: z.string().trim().max(100).optional().nullable(),
      phone: z.string().trim().max(30).optional().nullable(),
    });
    const data = parse(schema, req.body);
    const existing = await db.teacher.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in or contact the platform administrator.' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const teacher = await db.teacher.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        school: data.school || null,
        subject: data.subject || null,
        phone: data.phone || null,
        active: false, // Inactive by default, requires Super Admin approval!
      },
    });

    res.status(201).json({
      ok: true,
      message: 'Teacher registration submitted successfully! Your account will be activated once reviewed and approved by the EduAshram Administrator.',
      teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
    });
  } catch (error) { errorResponse(res, error); }
});

// Teacher Login
app.post('/api/auth/teacher/login', async (req: Request, res: Response) => {
  try {
    const data = parse(z.object({ email: z.string().email(), password: z.string().min(1).max(200) }), req.body);
    const normalizedEmail = data.email.toLowerCase();
    let teacher = await db.teacher.findUnique({ where: { email: normalizedEmail } });
    let passwordMatches = teacher ? await bcrypt.compare(data.password, teacher.passwordHash) : false;

    // Check legacy Admin table fallback if teacher password doesn't match or teacher not found
    if (!passwordMatches) {
      const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
      if (admin && (await bcrypt.compare(data.password, admin.passwordHash))) {
        passwordMatches = true;
        const newHash = await bcrypt.hash(data.password, 12);
        if (teacher) {
          teacher = await db.teacher.update({ where: { id: teacher.id }, data: { passwordHash: newHash, active: true } });
        } else {
          teacher = await db.teacher.create({
            data: { name: 'Teacher', email: normalizedEmail, passwordHash: newHash, school: 'EduAshram Central', subject: 'Mathematics', active: true }
          });
        }
      }
    }

    if (!teacher || !passwordMatches) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    if (!teacher.active) {
      return res.status(403).json({
        error: 'This teacher account is pending activation by the Administrator.',
      });
    }

    const session: Session = { id: teacher.id, role: 'teacher', email: teacher.email, name: teacher.name };
    sendSession(res, session);
    res.json({
      user: {
        id: teacher.id,
        role: 'teacher',
        email: teacher.email,
        name: teacher.name,
        school: teacher.school,
        subject: teacher.subject,
        hasApiKey: Boolean(teacher.apiKey),
      }
    });
  } catch (error) { errorResponse(res, error); }
});

// Teacher Forgot Password (Generates 30-min token and sends via Gmail SMTP)
app.post('/api/auth/teacher/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = parse(z.object({ email: z.string().trim().email() }), req.body);
    const normalizedEmail = email.toLowerCase();

    const standardMessage = 'If an educator account exists with this email address, a password reset link has been dispatched to your inbox.';

    const teacher = await db.teacher.findUnique({ where: { email: normalizedEmail } });
    if (!teacher) {
      // Security: Do not reveal if email exists or not
      return res.json({ ok: true, message: standardMessage });
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

    await db.teacher.update({
      where: { id: teacher.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.get('host');
    const baseUrl = process.env.CLIENT_URL || req.headers.origin || `${protocol}://${host}`;
    const resetUrl = `${baseUrl}/?resetToken=${resetToken}`;

    const emailSent = await sendPasswordResetEmail(teacher.email, teacher.name, resetUrl);

    return res.json({
      ok: true,
      message: standardMessage,
      emailSent,
      // Provide devResetUrl when GMAIL_USER is not configured in .env for immediate local testing
      devResetUrl: !process.env.GMAIL_USER ? resetUrl : undefined,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

// Teacher Reset Password (Verifies token and updates password)
app.post('/api/auth/teacher/reset-password', async (req: Request, res: Response) => {
  try {
    const data = parse(
      z.object({
        token: z.string().trim().min(10, 'Reset token is required'),
        password: z.string().min(6, 'Password must be at least 6 characters long').max(200),
      }),
      req.body
    );

    const teacher = await db.teacher.findFirst({
      where: {
        resetPasswordToken: data.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!teacher) {
      return res.status(400).json({
        error: 'This password reset link is invalid or has expired. Please request a new password reset link.',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.teacher.update({
      where: { id: teacher.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    invalidateAuthCache(teacher.id);

    return res.json({
      ok: true,
      message: 'Your password has been reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

// Backward-compatible Admin / Teacher Login
app.post('/api/auth/admin', async (req: Request, res: Response) => {
  try {
    const data = parse(z.object({ email: z.string().email(), password: z.string().min(1).max(200) }), req.body);
    const normalizedEmail = data.email.toLowerCase();

    // Check Teacher account first
    let teacher = await db.teacher.findUnique({ where: { email: normalizedEmail } });
    if (teacher && (await bcrypt.compare(data.password, teacher.passwordHash))) {
      if (!teacher.active) {
        return res.status(403).json({ error: 'This teacher account is pending activation by the Administrator.' });
      }
      sendSession(res, { id: teacher.id, role: 'teacher', email: teacher.email, name: teacher.name });
      return res.json({ user: { id: teacher.id, role: 'teacher', email: teacher.email, name: teacher.name, school: teacher.school } });
    }

    // Check legacy Admin table
    const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
    if (!admin || !(await bcrypt.compare(data.password, admin.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });

    // Link to Teacher record if one exists with this email so all quizzes and students load properly
    const linkedTeacher = teacher || await db.teacher.findUnique({ where: { email: normalizedEmail } });
    const sessionTeacherId = linkedTeacher ? linkedTeacher.id : admin.id;
    const teacherName = linkedTeacher?.name || 'Teacher';

    if (linkedTeacher) {
      if (!linkedTeacher.active) {
        return res.status(403).json({ error: 'This teacher account is pending activation by the Administrator.' });
      }
      const newHash = await bcrypt.hash(data.password, 12);
      await db.teacher.update({ where: { id: linkedTeacher.id }, data: { passwordHash: newHash, active: true } }).catch(() => {});
    }

    sendSession(res, { id: sessionTeacherId, role: 'teacher', email: admin.email, name: teacherName });
    res.json({ user: { id: sessionTeacherId, role: 'teacher', email: admin.email, name: teacherName, school: linkedTeacher?.school } });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/auth/student', async (req: Request, res: Response) => {
  try {
    const data = parse(z.object({ passkey: z.string().trim().min(4).max(40) }), req.body);
    const lookupHash = passkeyLookup(data.passkey);
    let student = await (prisma.student as any).findUnique({
      where: { passkeyLookup: lookupHash },
      include: { teacher: { select: { id: true, name: true } } }
    });

    if (!student) {
      const activeStudents = await (prisma.student as any).findMany({
        where: { active: true },
        include: { teacher: { select: { id: true, name: true } } }
      });
      for (const s of activeStudents) {
        if (await bcrypt.compare(data.passkey.toUpperCase(), s.passkeyHash)) {
          student = s;
          await prisma.student.update({ where: { id: s.id }, data: { passkeyLookup: lookupHash } }).catch(() => { });
          break;
        }
      }
    }

    if (!student?.active || !(await bcrypt.compare(data.passkey.toUpperCase(), student.passkeyHash))) {
      return res.status(401).json({ error: 'That passkey was not recognized.' });
    }

    let teacherName: string | null = student.teacher?.name || null;
    if (!teacherName && student.teacherId) {
      const t = await (prisma.teacher as any).findUnique({ where: { id: student.teacherId }, select: { name: true } });
      if (t?.name) teacherName = t.name;
    }

    sendSession(res, { id: student.id, role: 'student', name: student.name });
    res.json({
      user: {
        id: student.id,
        role: 'student',
        name: student.name,
        teacherId: student.teacherId,
        teacherName: teacherName || null,
        grade: student.grade || 'Grade 6'
      }
    });
  } catch (error) { errorResponse(res, error); }
});

app.get('/api/auth/me', authenticate(), async (req: AuthRequest, res: Response) => {
  if (req.session?.role === 'superadmin') {
    const superAdmin = await db.superAdmin.findUnique({ where: { id: req.session.id }, select: { id: true, username: true, email: true } });
    return res.json({ user: superAdmin ? { id: superAdmin.id, role: 'superadmin', username: superAdmin.username, email: superAdmin.email } : null });
  }

  if (req.session?.role === 'teacher' || req.session?.role === 'admin') {
    let teacher = await db.teacher.findUnique({
      where: { id: req.session.id },
      select: { id: true, name: true, email: true, school: true, subject: true, active: true, apiKey: true }
    });
    if (!teacher && req.session.email) {
      teacher = await db.teacher.findUnique({
        where: { email: req.session.email.toLowerCase() },
        select: { id: true, name: true, email: true, school: true, subject: true, active: true, apiKey: true }
      });
    }
    if (teacher) {
      if (!teacher.active) return res.status(403).json({ error: 'This teacher account is pending activation by the Administrator.' });
      return res.json({
        user: {
          id: teacher.id,
          role: 'teacher',
          name: teacher.name,
          email: teacher.email,
          school: teacher.school,
          subject: teacher.subject,
          hasApiKey: Boolean(teacher.apiKey),
        }
      });
    }
    const admin = await prisma.admin.findUnique({ where: { id: req.session.id }, select: { id: true, email: true } });
    return res.json({ user: admin ? { id: admin.id, role: 'teacher', email: admin.email, name: 'Teacher' } : null });
  }

  const student: any = await (prisma as any).student.findUnique({
    where: { id: req.session!.id },
    select: {
      id: true,
      name: true,
      active: true,
      teacherId: true,
      grade: true,
      teacher: { select: { id: true, name: true } }
    }
  });
  if (!student?.active) return res.status(401).json({ error: 'This student passkey has been disabled.' });
  let teacherName: string | null = student.teacher?.name || null;
  if (!teacherName && student.teacherId) {
    const t = await (prisma.teacher as any).findUnique({ where: { id: student.teacherId }, select: { name: true } });
    if (t?.name) teacherName = t.name;
  }
  return res.json({
    user: {
      id: student.id,
      role: 'student',
      name: student.name,
      teacherId: student.teacherId,
      teacherName: teacherName || null,
      grade: student.grade || 'Grade 6'
    }
  });
});

// Teacher Profile & API Key Management
app.get('/api/teacher/profile', teacherOnly, async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await db.teacher.findUnique({
      where: { id: req.session!.id },
      select: { id: true, name: true, email: true, school: true, subject: true, phone: true, active: true, apiKey: true, createdAt: true },
    });
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found.' });
    res.json({
      teacher: {
        ...teacher,
        apiKey: teacher.apiKey || '',
        maskedApiKey: teacher.apiKey ? '••••••••' + teacher.apiKey.slice(-4) : '',
        hasApiKey: Boolean(teacher.apiKey),
      }
    });
  } catch (error) { errorResponse(res, error); }
});

app.patch('/api/teacher/api-key', teacherOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey } = parse(z.object({ apiKey: z.string().trim().max(500) }), req.body);
    const cleanKey = apiKey ? apiKey.trim() : null;

    if (cleanKey) {
      // 1. Strictly enforce no duplication across teachers: check if another teacher already has this API key
      const duplicate = await db.teacher.findFirst({
        where: {
          apiKey: cleanKey,
          id: { not: req.session!.id },
        },
        select: { id: true, name: true, email: true },
      });

      if (duplicate) {
        return res.status(409).json({
          error: 'This API Key is already registered to another teacher account. Every teacher must add their own unique API key — duplication of API keys is strictly prohibited.',
        });
      }

      // 2. Prevent using system platform administrator keys
      if (process.env.GEMINI_API_KEY && cleanKey === process.env.GEMINI_API_KEY.trim()) {
        return res.status(400).json({
          error: 'This API Key is reserved for the system administrator. Every teacher must use their own personal API key.',
        });
      }
      if (process.env.OPENAI_API_KEY && cleanKey === process.env.OPENAI_API_KEY.trim()) {
        return res.status(400).json({
          error: 'This API Key is reserved for the system administrator. Every teacher must use their own personal API key.',
        });
      }
      if (process.env.DEEPSEEK_API_KEY && cleanKey === process.env.DEEPSEEK_API_KEY.trim()) {
        return res.status(400).json({
          error: 'This API Key is reserved for the system administrator. Every teacher must use their own personal API key.',
        });
      }
    }

    await db.teacher.update({
      where: { id: req.session!.id },
      data: { apiKey: cleanKey },
    });

    res.json({
      ok: true,
      hasApiKey: Boolean(cleanKey),
      message: cleanKey ? 'Your personal AI API Key has been saved successfully!' : 'Your personal AI API Key has been removed.',
    });
  } catch (error) { errorResponse(res, error); }
});

app.patch('/api/teacher/profile', teacherOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = parse(z.object({
      name: z.string().trim().min(2).max(100).optional(),
      school: z.string().trim().max(200).optional().nullable(),
      subject: z.string().trim().max(100).optional().nullable(),
      phone: z.string().trim().max(30).optional().nullable(),
    }), req.body);

    const updated = await db.teacher.update({
      where: { id: req.session!.id },
      data,
      select: { id: true, name: true, email: true, school: true, subject: true, phone: true },
    });
    res.json({ teacher: updated, ok: true });
  } catch (error) { errorResponse(res, error); }
});

// Super Admin Teacher Management Endpoints
app.get('/api/superadmin/teachers', superAdminOnly, async (_req: Request, res: Response) => {
  try {
    const teachers = await db.teacher.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        subject: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            students: true,
            quizzes: true,
            worksheetPapers: true,
          }
        }
      }
    });
    res.json({ teachers });
  } catch (error) { errorResponse(res, error); }
});

app.patch('/api/superadmin/teachers/:id/toggle-status', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });

    const updated = await db.teacher.update({
      where: { id },
      data: { active: !teacher.active },
      select: { id: true, name: true, email: true, active: true },
    });
    res.json({ teacher: updated, ok: true });
  } catch (error) { errorResponse(res, error); }
});

app.delete('/api/superadmin/teachers/:id', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await db.teacher.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});

// SuperAdmin resets any teacher's password directly
app.post('/api/superadmin/teachers/:id/reset-password', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { newPassword } = parse(
      z.object({
        newPassword: z.string().min(6, 'Password must be at least 6 characters long').max(200),
      }),
      req.body
    );

    const teacher = await db.teacher.findUnique({ where: { id } });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.teacher.update({
      where: { id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    invalidateAuthCache(teacher.id);

    res.json({
      ok: true,
      message: `Password for ${teacher.name} (${teacher.email}) has been reset successfully.`,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.all('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[sessionCookie];
    if (token) {
      const payload = jwt.verify(token, secret) as JwtPayload & Session;
      if (payload && (payload.role === 'teacher' || payload.role === 'admin' || payload.role === 'superadmin')) {
        let teacherId = payload.id;
        const teacher = await db.teacher.findUnique({ where: { id: payload.id }, select: { id: true } });
        if (teacher) {
          teacherId = teacher.id;
        } else if (payload.email) {
          const tByEmail = await db.teacher.findUnique({ where: { email: payload.email }, select: { id: true } });
          if (tByEmail) teacherId = tByEmail.id;
        }
        await clearTeacherChatMessages(teacherId);
      } else if (payload && payload.role === 'student') {
        await clearStudentChatMessages(payload.id);
      }
    }
  } catch {
    // Ignore invalid/expired token on logout
  }
  res.clearCookie(sessionCookie, { ...cookieOptions, maxAge: 0 });
  res.clearCookie(sessionCookie, { path: '/' });
  res.clearCookie(sessionCookie);
  return res.json({ ok: true });
});

function normalizeGrade(grade?: string | null): string {
  if (!grade) return '';
  const trimmed = grade.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/i);
  if (match) {
    return `Grade ${match[1]}`;
  }
  return trimmed;
}

function getGradeVariants(gradeStr?: string | null): string[] {
  if (!gradeStr) return [];
  const trimmed = gradeStr.trim();
  if (!trimmed) return [];
  const variants = new Set<string>();
  variants.add(trimmed);
  const match = trimmed.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/i);
  if (match) {
    const num = match[1];
    variants.add(`Grade ${num}`);
    variants.add(`Grade-${num}`);
    variants.add(`Class ${num}`);
    variants.add(`Class-${num}`);
    variants.add(`grade ${num}`);
    variants.add(`grade-${num}`);
    variants.add(num);
  } else {
    variants.add(trimmed.replace(/[-_]+/g, ' '));
    variants.add(trimmed.replace(/\s+/g, '-'));
  }
  return Array.from(variants);
}

function gradesMatch(gradeA?: string | null, gradeB?: string | null): boolean {
  if (!gradeA || !gradeB) return true;
  const cleanA = gradeA.trim().toLowerCase();
  const cleanB = gradeB.trim().toLowerCase();
  if (cleanA === cleanB || cleanA === 'all' || cleanB === 'all' || cleanA === 'all grades' || cleanB === 'all grades' || !cleanA || !cleanB) return true;

  const matchA = cleanA.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/);
  const matchB = cleanB.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/);
  if (matchA && matchB) {
    return matchA[1] === matchB[1];
  }
  return cleanA.replace(/[-_\s]+/g, '') === cleanB.replace(/[-_\s]+/g, '');
}

const uploadedFileSchema = z.object({
  name: z.string().max(255),
  type: z.string().max(100),
  data: z.string(),
  size: z.number().optional(),
});

const aiQuizInput = z.object({
  subject: z.string().trim().min(1).max(200),
  grade: z.string().trim().min(1).max(100),
  topic: z.string().trim().min(1).max(500),
  subtopics: z.string().trim().max(1000).optional(),
  difficulty: z.enum(['Easy', 'Moderate', 'Hard']),
  questionCount: z.number().int().min(1).max(50),
  questionType: z.enum(['ALL', 'MCQ', 'FILL_BLANK', 'TRUE_FALSE', 'SOLVE']).default('ALL'),
  mode: z.enum(['LIVE', 'SELF_PACED']),
  details: z.string().trim().max(2000).optional(),
  provider: z.enum(['auto', 'gemini', 'openai', 'deepseek']).optional(),
  apiKey: z.string().trim().optional(),
  strictSourceContent: z.boolean().optional(),
  uploadedFiles: z.array(uploadedFileSchema).max(15).optional(),
  assessmentStandard: z.enum(['Basic', 'Advanced']).optional(),
  totalMarks: z.number().int().min(1).max(200).optional(),
  durationMinutes: z.number().int().min(5).max(300).optional(),
});

const aiTeachingAssistantInput = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  board: z.string().trim().optional(),
  grade: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  topic: z.string().trim().optional(),
  academicSession: z.string().trim().optional(),
  learningLevel: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  mode: z.enum(['lesson_plan', 'explanation', 'practice', 'socratic', 'evaluation', 'worksheet', 'general']).default('general'),
  provider: z.enum(['auto', 'gemini', 'openai', 'deepseek']).optional(),
  apiKey: z.string().trim().optional(),
});

export function isHindiSubject(subject?: string): boolean {
  if (!subject) return false;
  const s = subject.trim().toLowerCase();
  return s.includes('hindi') || s.includes('हिंदी') || s.includes('हिन्दी');
}

export function isSanskritSubject(subject?: string): boolean {
  if (!subject) return false;
  const s = subject.trim().toLowerCase();
  return s.includes('sanskrit') || s.includes('संस्कृत');
}

function generateTopicQuestions(subject: string, topic: string, subtopics: string | undefined, grade: string, difficulty: string, count: number) {
  const t = topic.toLowerCase();
  const s = subject.toLowerCase();
  void subtopics;

  const generatedQuestions: Array<{ prompt: string; marks: number; options: Array<{ text: string; isCorrect: boolean }> }> = [];

  // Hindi Language & Literature Topic Bank
  if (isHindiSubject(subject)) {
    const hindiBank = [
      {
        prompt: `दिए गए प्रकरण "${topic}" के संदर्भ में, निम्नलिखित में से कौन-सा कथन व्याकरण अथवा भाषा की दृष्टि से सर्वाधिक उपयुक्त और शुद्ध है?`,
        marks: 1,
        options: [
          { text: `व्याकरणिक नियमों और मानक वर्तनी का शुद्ध एवं प्रामाणिक प्रयोग करना।`, isCorrect: true },
          { text: `व्याकरणिक नियमों की अनदेखी करके अशुद्ध वर्तनी का प्रयोग करना।`, isCorrect: false },
          { text: `बिना अर्थ समझे केवल कठिन शब्दों को रटना।`, isCorrect: false },
          { text: `वाक्य विन्यास में शब्दों का अनुचित व अव्यवस्थित क्रम रखना।`, isCorrect: false },
        ]
      },
      {
        prompt: `हिन्दी भाषा शिक्षण में "${topic}" का अध्ययन करने का मुख्य उद्देश्य क्या है?`,
        marks: 1,
        options: [
          { text: `भाषा की शुद्धता, संप्रेषण कौशल और अभिव्यक्ति क्षमता को सुदृढ़ बनाना।`, isCorrect: true },
          { text: `केवल परीक्षा में रटे हुए उत्तर लिखना।`, isCorrect: false },
          { text: `भाषा में अनावश्यक जटिल शब्दों का प्रयोग करना।`, isCorrect: false },
          { text: `वाक्यों को अकारण लंबा और अस्पष्ट बनाना।`, isCorrect: false },
        ]
      },
      {
        prompt: `निम्नलिखित में से कौन-सा विकल्प प्रकरण "${topic}" के व्यावहारिक प्रयोग को सही रूप में दर्शाता है?`,
        marks: 1,
        options: [
          { text: `दैनिक भाषा-व्यवहार, पठन तथा लेखन में मानक हिन्दी वर्तनी का सही चयन।`, isCorrect: true },
          { text: `अशुद्ध उच्चारण और वर्तनी की त्रुटियों की उपेक्षा करना।`, isCorrect: false },
          { text: `साहित्यिक एवं व्याकरणिक संदर्भों का अनुचित उपयोग।`, isCorrect: false },
          { text: `बिना सोचे-समझें केवल अनुमान से उत्तर देना।`, isCorrect: false },
        ]
      },
      {
        prompt: `कक्षा ${grade} के हिन्दी पाठ्यक्रम के अनुसार "${topic}" से संबंधित अभ्यास हल करते समय किस बात का विशेष ध्यान रखना चाहिए?`,
        marks: difficulty === 'Hard' ? 2 : 1,
        options: [
          { text: `मूल भाव, व्याकरणिक संदर्भ तथा शुद्ध देवनागरी लिपि के नियमों का।`, isCorrect: true },
          { text: `अनावश्यक विदेशी शब्दों के अंधाधुंध प्रयोग का।`, isCorrect: false },
          { text: `बिना विचार किए तुक्का लगाने की प्रवृत्ति का।`, isCorrect: false },
          { text: `स्थापित व्याकरणिक नियमों को मनमाने ढंग से बदलने का।`, isCorrect: false },
        ]
      }
    ];

    for (let i = 0; i < count; i++) {
      generatedQuestions.push(hindiBank[i % hindiBank.length]);
    }
    return generatedQuestions;
  }

  // Angles & Geometry Topic Bank
  if (t.includes('angle') || t.includes('geometry') || t.includes('triangle') || t.includes('shape')) {
    const angleBank = [
      {
        prompt: `Which type of angle measures greater than 90° but less than 180°?`,
        marks: 1,
        options: [
          { text: `Obtuse angle`, isCorrect: true },
          { text: `Acute angle`, isCorrect: false },
          { text: `Right angle`, isCorrect: false },
          { text: `Reflex angle`, isCorrect: false },
        ]
      },
      {
        prompt: `Two angles are complementary. If one angle measures 35°, what is the measure of the second angle?`,
        marks: 1,
        options: [
          { text: `55°`, isCorrect: true },
          { text: `145°`, isCorrect: false },
          { text: `65°`, isCorrect: false },
          { text: `90°`, isCorrect: false },
        ]
      },
      {
        prompt: `What is the sum of all interior angles of a triangle?`,
        marks: 1,
        options: [
          { text: `180°`, isCorrect: true },
          { text: `360°`, isCorrect: false },
          { text: `90°`, isCorrect: false },
          { text: `270°`, isCorrect: false },
        ]
      },
      {
        prompt: `A clock shows 3:00 PM. What is the measure of the smaller angle between the hour hand and minute hand?`,
        marks: 1,
        options: [
          { text: `90°`, isCorrect: true },
          { text: `45°`, isCorrect: false },
          { text: `120°`, isCorrect: false },
          { text: `180°`, isCorrect: false },
        ]
      },
      {
        prompt: `If two lines intersect each other, what can be stated about the vertically opposite angles formed?`,
        marks: 1,
        options: [
          { text: `They are always equal in measure`, isCorrect: true },
          { text: `They always add up to 90°`, isCorrect: false },
          { text: `One is always acute and one is obtuse`, isCorrect: false },
          { text: `They are always complementary`, isCorrect: false },
        ]
      },
      {
        prompt: `An angle measuring exactly 180° is called a:`,
        marks: 1,
        options: [
          { text: `Straight angle`, isCorrect: true },
          { text: `Right angle`, isCorrect: false },
          { text: `Complete angle`, isCorrect: false },
          { text: `Reflex angle`, isCorrect: false },
        ]
      },
      {
        prompt: `In a triangle ABC, if Angle A = 60° and Angle B = 70°, what is the measure of Angle C?`,
        marks: 2,
        options: [
          { text: `50°`, isCorrect: true },
          { text: `60°`, isCorrect: false },
          { text: `130°`, isCorrect: false },
          { text: `40°`, isCorrect: false },
        ]
      },
      {
        prompt: `Two angles forming a linear pair are always:`,
        marks: 1,
        options: [
          { text: `Supplementary (sum = 180°)`, isCorrect: true },
          { text: `Complementary (sum = 90°)`, isCorrect: false },
          { text: `Equal in measure`, isCorrect: false },
          { text: `Vertically opposite`, isCorrect: false },
        ]
      }
    ];

    for (let i = 0; i < count; i++) {
      generatedQuestions.push(angleBank[i % angleBank.length]);
    }
    return generatedQuestions;
  }

  // Fractions & Arithmetic Bank
  if (s.includes('math') || t.includes('fraction') || t.includes('ratio') || t.includes('percent')) {
    const mathBank = [
      {
        prompt: `Ankit ate 2/8 of a pizza and Rahul ate 3/8 of the same pizza. What fraction of the pizza did they eat altogether?`,
        marks: 1,
        options: [
          { text: `5/8`, isCorrect: true },
          { text: `5/16`, isCorrect: false },
          { text: `6/8`, isCorrect: false },
          { text: `1/8`, isCorrect: false },
        ]
      },
      {
        prompt: `Which of the following fractions is equivalent to 3/4?`,
        marks: 1,
        options: [
          { text: `6/8`, isCorrect: true },
          { text: `3/8`, isCorrect: false },
          { text: `9/16`, isCorrect: false },
          { text: `4/3`, isCorrect: false },
        ]
      },
      {
        prompt: `Riya bought 1/2 kg of apples and 1/4 kg of grapes. How many kilograms of fruit did she buy in total?`,
        marks: 1,
        options: [
          { text: `3/4 kg`, isCorrect: true },
          { text: `2/4 kg`, isCorrect: false },
          { text: `1/6 kg`, isCorrect: false },
          { text: `1 kg`, isCorrect: false },
        ]
      },
      {
        prompt: `Which fraction is the largest among 1/2, 2/3, 3/4, and 1/4?`,
        marks: 2,
        options: [
          { text: `3/4`, isCorrect: true },
          { text: `2/3`, isCorrect: false },
          { text: `1/2`, isCorrect: false },
          { text: `1/4`, isCorrect: false },
        ]
      },
      {
        prompt: `If a cake is cut into 10 equal slices and 4 slices are eaten, what fraction of the cake remains?`,
        marks: 1,
        options: [
          { text: `6/10 (or 3/5)`, isCorrect: true },
          { text: `4/10`, isCorrect: false },
          { text: `2/5`, isCorrect: false },
          { text: `1/2`, isCorrect: false },
        ]
      }
    ];

    for (let i = 0; i < count; i++) {
      generatedQuestions.push(mathBank[i % mathBank.length]);
    }
    return generatedQuestions;
  }

  // Science Bank
  if (s.includes('sci') || s.includes('bio') || t.includes('photo') || t.includes('plant')) {
    const scienceBank = [
      {
        prompt: `During photosynthesis, green plants absorb solar energy using which specialized green pigment in their leaves?`,
        marks: 1,
        options: [
          { text: `Chlorophyll`, isCorrect: true },
          { text: `Carotenoid`, isCorrect: false },
          { text: `Hemoglobin`, isCorrect: false },
          { text: `Stomata`, isCorrect: false },
        ]
      },
      {
        prompt: `What are the two main raw materials taken in by plants to perform photosynthesis?`,
        marks: 1,
        options: [
          { text: `Carbon dioxide and Water`, isCorrect: true },
          { text: `Oxygen and Glucose`, isCorrect: false },
          { text: `Nitrogen and Soil`, isCorrect: false },
          { text: `Carbon dioxide and Oxygen`, isCorrect: false },
        ]
      },
      {
        prompt: `Which vital gas is released into the atmosphere as a byproduct during photosynthesis?`,
        marks: 1,
        options: [
          { text: `Oxygen (O2)`, isCorrect: true },
          { text: `Carbon Dioxide (CO2)`, isCorrect: false },
          { text: `Nitrogen (N2)`, isCorrect: false },
          { text: `Hydrogen (H2)`, isCorrect: false },
        ]
      }
    ];

    for (let i = 0; i < count; i++) {
      generatedQuestions.push(scienceBank[i % scienceBank.length]);
    }
    return generatedQuestions;
  }

  // Fallback realistic CBSE application questions (never meta questions)
  const defaultBank = [
    {
      prompt: `Which of the following statements best illustrates a practical application of ${topic} in daily life?`,
      marks: difficulty === 'Hard' ? 2 : 1,
      options: [
        { text: `Using core concepts of ${topic} to solve everyday practical problems efficiently.`, isCorrect: true },
        { text: `Memorizing formulas without understanding their real-world context.`, isCorrect: false },
        { text: `Assuming ${topic} only exists in textbook exercises.`, isCorrect: false },
        { text: `Ignoring measurements and estimating randomly without calculation.`, isCorrect: false },
      ]
    },
    {
      prompt: `When investigating ${topic} in ${grade} ${subject}, which step is essential for reaching a valid conclusion?`,
      marks: 1,
      options: [
        { text: `Observing given facts, collecting evidence, and applying key principles.`, isCorrect: true },
        { text: `Selecting an answer based on a guess without checking calculations.`, isCorrect: false },
        { text: `Disregarding experimental data that contradicts initial assumptions.`, isCorrect: false },
        { text: `Changing the original problem values to make the calculation simpler.`, isCorrect: false },
      ]
    }
  ];

  for (let i = 0; i < count; i++) {
    generatedQuestions.push(defaultBank[i % defaultBank.length]);
  }

  return generatedQuestions;
}

type QuestionType = 'MCQ' | 'FILL_BLANK' | 'TRUE_FALSE' | 'SOLVE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'CASE_STUDY';

function robustParseJSON(rawText: string): any {
  let text = (rawText || '').trim();

  // 1. Strip markdown fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  } else {
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // 2. Direct JSON.parse
  try {
    return JSON.parse(text);
  } catch {}

  // 3. Slice from first '{' to last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const cleaned = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  // 4. Slice from first '[' to last ']'
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const cleaned = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  // 5. Truncated recovery / bracket balancing
  try {
    let inString = false;
    let escape = false;
    const stack: string[] = [];
    let trimmed = text.slice(firstBrace !== -1 ? firstBrace : 0).trim();

    const lastObjectClose = trimmed.lastIndexOf('}');
    if (lastObjectClose !== -1) {
      const candidates = [
        trimmed.slice(0, lastObjectClose + 1) + ']}',
        trimmed.slice(0, lastObjectClose + 1) + '}',
        trimmed.slice(0, lastObjectClose + 1) + ']}',
      ];
      for (const cand of candidates) {
        try {
          const res = JSON.parse(cand.replace(/,\s*([}\]])/g, '$1'));
          if (res) return res;
        } catch {}
      }
    }

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === '{' || ch === '[') stack.push(ch);
        else if (ch === '}' || ch === ']') stack.pop();
      }
    }

    if (inString) trimmed += '"';
    trimmed = trimmed.replace(/,\s*$/, '');
    while (stack.length > 0) {
      const open = stack.pop();
      if (open === '{') trimmed += '}';
      else if (open === '[') trimmed += ']';
    }

    return JSON.parse(trimmed.replace(/,\s*([}\]])/g, '$1'));
  } catch {
    return null;
  }
}

function parseAIResponseJSON(rawText: string, data: z.infer<typeof aiQuizInput>) {
  try {
    const parsed = robustParseJSON(rawText);
    if (!parsed) {
      console.warn('parseAIResponseJSON: robustParseJSON returned null. Text preview:', (rawText || '').slice(0, 300));
      return null;
    }

    let rawQuestions: any[] = [];
    if (Array.isArray(parsed)) {
      rawQuestions = parsed;
    } else if (Array.isArray(parsed.questions)) {
      rawQuestions = parsed.questions;
    } else if (Array.isArray(parsed.paper?.questions)) {
      rawQuestions = parsed.paper.questions;
    } else if (Array.isArray(parsed.questionPaper?.questions)) {
      rawQuestions = parsed.questionPaper.questions;
    } else if (Array.isArray(parsed.question_paper?.questions)) {
      rawQuestions = parsed.question_paper.questions;
    } else if (Array.isArray(parsed.quiz?.questions)) {
      rawQuestions = parsed.quiz.questions;
    } else if (Array.isArray(parsed.exam?.questions)) {
      rawQuestions = parsed.exam.questions;
    } else if (Array.isArray(parsed.data?.questions)) {
      rawQuestions = parsed.data.questions;
    } else if (Array.isArray(parsed.sections)) {
      for (const sec of parsed.sections) {
        const secQuestions = Array.isArray(sec.questions) ? sec.questions : (Array.isArray(sec.items) ? sec.items : []);
        for (const sq of secQuestions) {
          rawQuestions.push({
            ...sq,
            section: sq.section || sec.section || sec.name || sec.title || '',
          });
        }
      }
    } else {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
          const first = parsed[key][0];
          if (first && typeof first === 'object' && (first.question || first.prompt || first.text || first.questionNumber || first.id)) {
            rawQuestions = parsed[key];
            break;
          }
        }
      }
    }

    if (!rawQuestions || rawQuestions.length === 0) {
      console.warn('parseAIResponseJSON: parsed object has keys:', Object.keys(parsed), 'but no questions array found.');
      return null;
    }

    const questions = rawQuestions.map((q: any, idx: number) => {
      const promptText = q.question || q.prompt || q.text || '';
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      let correctIdx = 0;

      const rawType = String(q.questionType || q.type || '').toUpperCase();
      let resolvedType: QuestionType = 'MCQ';
      if (rawType.includes('TRUE') || rawType.includes('FALSE') || rawType === 'TF') {
        resolvedType = 'TRUE_FALSE';
      } else if (rawType.includes('BLANK') || rawType.includes('FIB') || promptText.includes('_______') || promptText.includes('_____')) {
        resolvedType = 'FILL_BLANK';
      } else if (rawType.includes('CASE') || rawType.includes('SOURCE')) {
        resolvedType = 'CASE_STUDY';
      } else if (rawType === 'LA' || rawType.includes('LONG')) {
        resolvedType = 'LONG_ANSWER';
      } else if (rawType === 'VSA' || rawType === 'SA' || rawType.includes('SHORT') || rawType === 'SOLVE' || (q.marks && q.marks > 1)) {
        resolvedType = (q.marks && q.marks >= 4) ? 'LONG_ANSWER' : 'SHORT_ANSWER';
      } else if (rawOptions.length > 0) {
        resolvedType = 'MCQ';
      }

      let options: any[] = [];
      if (resolvedType === 'MCQ') {
        if (typeof q.answer === 'string') {
          const letter = q.answer.trim().toUpperCase();
          if (letter === 'B' || letter === '2' || letter === 'ख' || letter.startsWith('B') || letter.includes('ख')) correctIdx = 1;
          else if (letter === 'C' || letter === '3' || letter === 'ग' || letter.startsWith('C') || letter.includes('ग')) correctIdx = 2;
          else if (letter === 'D' || letter === '4' || letter === 'घ' || letter.startsWith('D') || letter.includes('घ')) correctIdx = 3;
        }

        options = rawOptions.slice(0, 4).map((opt: any, optIdx: number) => {
          if (typeof opt === 'string') {
            return { text: opt, isCorrect: optIdx === correctIdx };
          }
          return { text: opt.text ?? String(opt), isCorrect: Boolean(opt.isCorrect ?? (optIdx === correctIdx)) };
        });

        if (!options.some((o: any) => o.isCorrect) && options.length > 0) {
          options[0].isCorrect = true;
        }
      } else if (resolvedType === 'TRUE_FALSE') {
        const ansStr = String(q.answer || '').trim().toLowerCase();
        const isTrue = ansStr.includes('true') || ansStr.includes('सत्य') || ansStr === 't' || ansStr === 'a' || ansStr === '1';
        options = isHindi ? [
          { text: 'सत्य', isCorrect: isTrue },
          { text: 'असत्य', isCorrect: !isTrue }
        ] : [
          { text: 'True', isCorrect: isTrue },
          { text: 'False', isCorrect: !isTrue }
        ];
      } else {
        // Non-MCQ: FILL_BLANK, SHORT_ANSWER, LONG_ANSWER, CASE_STUDY: options must be EMPTY!
        options = [];
      }

      // Assign marks if missing
      let parsedMarks = typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1;
      if (!q.marks) {
        if (resolvedType === 'LONG_ANSWER') parsedMarks = 5;
        else if (resolvedType === 'CASE_STUDY') parsedMarks = 4;
        else if (resolvedType === 'SHORT_ANSWER') parsedMarks = 3;
        else if (rawType === 'VSA') parsedMarks = 2;
        else parsedMarks = 1;
      }

      // Assign section if missing or vague
      let sectionName = q.section || '';
      if (!sectionName || (sectionName.toLowerCase().includes('section a') && parsedMarks > 1)) {
        if (resolvedType === 'CASE_STUDY') {
          sectionName = isHindi ? "खंड 'ङ' — केस-स्टडी आधारित प्रश्न" : "SECTION E — CASE-STUDY / SOURCE-BASED QUESTIONS";
        } else if (parsedMarks >= 5 || resolvedType === 'LONG_ANSWER') {
          sectionName = isHindi ? "खंड 'घ' — दीर्घ उत्तरीय प्रश्न (5 अंक)" : "SECTION D — LONG ANSWER QUESTIONS (5 MARKS EACH)";
        } else if (parsedMarks >= 3 || resolvedType === 'SHORT_ANSWER') {
          sectionName = isHindi ? "खंड 'ग' — लघु उत्तरीय प्रश्न (3 अंक)" : "SECTION C — SHORT ANSWER QUESTIONS (3 MARKS EACH)";
        } else if (parsedMarks === 2 || rawType === 'VSA') {
          sectionName = isHindi ? "खंड 'ख' — अति लघु उत्तरीय प्रश्न (2 अंक)" : "SECTION B — VERY SHORT ANSWER QUESTIONS (2 MARKS EACH)";
        } else {
          sectionName = isHindi ? "खंड 'क' — वस्तुनिष्ठ प्रश्न (1 अंक)" : "SECTION A — OBJECTIVE TYPE QUESTIONS (1 MARK EACH)";
        }
      }

      return {
        id: q.id || `Q${idx + 1}`,
        questionNumber: q.questionNumber || idx + 1,
        section: sectionName,
        prompt: promptText,
        question: promptText,
        marks: parsedMarks,
        imageUrl: q.imageUrl && typeof q.imageUrl === 'string' ? q.imageUrl : null,
        type: resolvedType,
        options,
        answer: q.answer || (options.findIndex((o: any) => o.isCorrect) >= 0 ? String.fromCharCode(65 + options.findIndex((o: any) => o.isCorrect)) : 'A'),
        explanation: q.explanation || '',
        hint: q.hint || '',
        learningObjective: q.learningObjective || '',
        competency: q.competency || '',
        assessmentAbility: q.assessmentAbility || (idx % 4 === 0 ? 'Sensitivity' : idx % 4 === 1 ? 'Creativity' : 'Awareness'),
        difficulty: q.difficulty || (data.difficulty === 'Hard' ? 'Difficult' : data.difficulty === 'Easy' ? 'Easy' : 'Medium'),
        questionType: resolvedType === 'MCQ' ? 'O' : resolvedType === 'TRUE_FALSE' ? 'TF' : resolvedType === 'FILL_BLANK' ? 'FIB' : resolvedType === 'CASE_STUDY' ? 'CASE' : resolvedType === 'LONG_ANSWER' ? 'LA' : 'SA',
        estimatedTimeMinutes: q.estimatedTimeMinutes || (parsedMarks >= 4 ? 8 : parsedMarks === 3 ? 5 : parsedMarks === 2 ? 3 : 1),
        markingScheme: q.markingScheme || '',
      };
    });

    const isHindi = isHindiSubject(data.subject);
    const fallbackTitle = isHindi
      ? `हिन्दी: ${data.topic} (कक्षा ${data.grade} - NCERT-PARAKH 2025)`
      : `${data.subject}: ${data.topic} (${data.grade} - NCERT-PARAKH 2025)`;

    // Construct or guarantee PARAKH assessment blueprint
    const totalCalcMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    const standard = data.assessmentStandard === 'Advanced' ? 'Advanced' : 'Basic';
    const isAdv = standard === 'Advanced';

    const abilityCounts = { awareness: 0, sensitivity: 0, creativity: 0 };
    const diffCounts = { easy: 0, medium: 0, difficult: 0 };
    const typeCounts = { objective: 0, vsa: 0, sa: 0, la: 0 };

    questions.forEach((q: any) => {
      const ab = (q.assessmentAbility || '').toLowerCase();
      if (ab.includes('sens')) abilityCounts.sensitivity += q.marks;
      else if (ab.includes('creat')) abilityCounts.creativity += q.marks;
      else abilityCounts.awareness += q.marks;

      const df = (q.difficulty || '').toLowerCase();
      if (df.includes('easy')) diffCounts.easy += q.marks;
      else if (df.includes('diff') || df.includes('hard')) diffCounts.difficult += q.marks;
      else diffCounts.medium += q.marks;

      const qt = (q.questionType || '').toUpperCase();
      if (qt === 'O' || q.type === 'MCQ') typeCounts.objective += 1;
      else if (qt === 'VSA') typeCounts.vsa += 1;
      else if (qt === 'LA') typeCounts.la += 1;
      else typeCounts.sa += 1;
    });

    const blueprint = parsed.blueprint || {
      grade: data.grade,
      subject: data.subject,
      assessmentStandard: isAdv ? 'Standard 2: Advanced Assessment' : 'Standard 1: Basic and Proficient Assessment',
      totalMarks: totalCalcMarks,
      durationMinutes: data.durationMinutes || (questions.length <= 5 ? 15 : questions.length <= 10 ? 30 : 60),
      chapters: [
        { name: data.topic, marks: totalCalcMarks, percentage: 100 }
      ],
      abilityDistribution: {
        awareness: { marks: abilityCounts.awareness, targetPercentage: isAdv ? 25 : 50, actualPercentage: Math.round((abilityCounts.awareness / (totalCalcMarks || 1)) * 100) },
        sensitivity: { marks: abilityCounts.sensitivity, targetPercentage: 25, actualPercentage: Math.round((abilityCounts.sensitivity / (totalCalcMarks || 1)) * 100) },
        creativity: { marks: abilityCounts.creativity, targetPercentage: isAdv ? 50 : 25, actualPercentage: Math.round((abilityCounts.creativity / (totalCalcMarks || 1)) * 100) },
      },
      difficultyDistribution: {
        easy: { marks: diffCounts.easy, targetPercentage: 25, actualPercentage: Math.round((diffCounts.easy / (totalCalcMarks || 1)) * 100) },
        medium: { marks: diffCounts.medium, targetPercentage: isAdv ? 25 : 50, actualPercentage: Math.round((diffCounts.medium / (totalCalcMarks || 1)) * 100) },
        difficult: { marks: diffCounts.difficult, targetPercentage: isAdv ? 50 : 25, actualPercentage: Math.round((diffCounts.difficult / (totalCalcMarks || 1)) * 100) },
      },
      questionTypeDistribution: {
        objective: { count: typeCounts.objective, marks: typeCounts.objective },
        vsa: { count: typeCounts.vsa, marks: typeCounts.vsa * 1 },
        sa: { count: typeCounts.sa, marks: typeCounts.sa * 2 },
        la: { count: typeCounts.la, marks: typeCounts.la * 4 },
      },
      summary: `Assessment blueprint prepared following NCERT-PARAKH 2025 guidelines for ${data.grade} ${data.subject}.`,
    };

    return {
      title: parsed.title || fallbackTitle,
      blueprint,
      answerKey: parsed.answerKey || null,
      qualityReport: parsed.qualityReport || null,
      questions,
    };
  } catch (err) {
    console.warn('Failed to parse AI JSON response:', err);
    return null;
  }
}

function buildPARAKHAssessmentFramework(data: z.infer<typeof aiQuizInput>): string {
  const isHindi = isHindiSubject(data.subject);
  const standard = data.assessmentStandard === 'Advanced' ? 'Advanced' : 'Basic';
  const isAdvanced = standard === 'Advanced';

  // Extract numerical grade if possible
  const gradeMatch = data.grade.match(/\d+/);
  const gradeNum = gradeMatch ? parseInt(gradeMatch[0], 10) : 8;

  // Ability distributions per PARAKH 2025
  const abilityTarget = isAdvanced
    ? { awareness: '25%', sensitivity: '25%', creativity: '50%' }
    : { awareness: '50%', sensitivity: '25%', creativity: '25%' };

  // Difficulty distributions per PARAKH 2025
  const difficultyTarget = isAdvanced
    ? { easy: '25%', medium: '25%', difficult: '50%' }
    : { easy: '25%', medium: '50%', difficult: '25%' };

  // Determine total marks and duration if not provided
  const targetTotalMarks = data.totalMarks || (data.questionCount * (data.difficulty === 'Hard' ? 2 : 1));
  const targetDuration = data.durationMinutes || (data.questionCount <= 5 ? 15 : data.questionCount <= 10 ? 30 : data.questionCount <= 20 ? 45 : 60);

  // Subject-specific question type weightage guideline per PARAKH 2025
  let subjectWeightageGuide = '';
  const subjLower = data.subject.toLowerCase();
  const isSanskrit = isSanskritSubject(data.subject);

  if (subjLower.includes('evs') || subjLower.includes('environment')) {
    subjectWeightageGuide = `
• PARAKH Environmental Studies (EVS) Assessment Focus (NCERT Preparatory Stage - Grade 5):
  - Core NCERT EVS Themes: Family and Friends (relationships, work, animals, plants), Food (tasting to digesting, preservation, hunger), Shelter (types of houses, disaster shelters), Water (every drop counts, water sources, conservation), Travel (experiments with water, reaching places, space), and Things We Make and Do.
  - Cognitive Competencies:
    * Concrete observation of immediate environment (home, school, locality, flora, fauna).
    * Cause-and-effect reasoning (e.g. why water scarcity occurs, how food spoils, why seed dispersal is vital for forests).
    * Environmental sensitivity and conservation habits (saving water, preventing food wastage, avoiding single-use plastic, respecting sanitization workers, caring for birds and animals).
  - Assessment Abilities:
    * Awareness (50%): Identifying plants/animals, describing basic bodily/natural processes, recognizing environmental helpers and community roles.
    * Sensitivity (25%): Empathy towards living creatures, appreciation of community diversity, conservation responsibility, fairness and inclusivity.
    * Creativity (25%): Suggesting simple practical solutions for everyday challenges (e.g. home composting ideas, creative water-saving methods, eco-friendly celebrations).
  - Question Style: Warm, relatable real-life stories, pictorial/diagrammatic clues, conversational situations. Avoid abstract ecological definitions or secondary-stage biology/chemistry jargon.`;
  } else if (subjLower.includes('sci') || subjLower.includes('phys') || subjLower.includes('chem') || subjLower.includes('bio')) {
    subjectWeightageGuide = `
• PARAKH Science Template Reference (Grades 6 to 10): Objective: 25%, Very Short Answer (VSA): 20%, Short Answer (SA): 30%, Long Answer (LA): 25%.
• Science Inquiry & Scientific Method Focus:
  - Observation & Scientific Principles: Application of concepts to explain natural phenomena and everyday observations.
  - Experimental Inquiry: Hypothesis formulation, variable identification (independent, dependent, controlled variables), predicting experimental outcomes, identifying errors in laboratory setups.
  - Data, Diagrams & Models: Interpreting ray diagrams, electric circuit diagrams, chemical apparatus setups, organ systems, biological life cycle diagrams, reaction pathways, and experimental graph plots.
  - Grade Progression:
    * Grade 6: Living vs non-living, components of food, sorting materials, motion and measurement of distances, light/shadows/reflections, electricity and circuits, fun with magnets.
    * Grade 7: Nutrition in plants & animals, heat and temperature, acids bases and salts, physical & chemical changes, respiration in organisms, transportation in animals & plants, reproduction in plants, motion & time, electric current and its effects, light.
    * Grade 8: Crop production & management, micro-organisms (friend & foe), coal & petroleum, combustion & flame, cell structure & functions, reproduction in animals, reaching age of adolescence, force & pressure, friction, sound, light, chemical effects of electric current.
    * Grade 9: Matter in our surroundings, is matter around us pure, atoms and molecules, structure of the atom, fundamental unit of life (cell), tissues, motion, force and laws of motion, gravitation, work and energy, sound, improvement in food resources.
    * Grade 10: Chemical reactions & equations, acids bases & salts, metals & non-metals, carbon & its compounds, life processes, control & coordination, how do organisms reproduce, heredity, light reflection & refraction, human eye & colourful world, electricity, magnetic effects of electric current, our environment.
• Scientific Validity: 100% correct scientific facts, balanced chemical equations, standard SI units, and accurate physical/biological terminology.`;
  } else if (subjLower.includes('soc') || subjLower.includes('hist') || subjLower.includes('geog') || subjLower.includes('civic') || subjLower.includes('pol') || subjLower.includes('econ') || subjLower.includes('sst')) {
    subjectWeightageGuide = `
• PARAKH Social Science Template Reference (Grades 6 to 10): Objective: 20%, Very Short Answer (VSA): 20%, Short Answer (SA): 30%, Long Answer (LA): 30%.
• Social Science Disciplinary Inquiries:
  - History: Source interpretation (inscriptions, traveler accounts, primary documents, archaeological evidence), chronology and timeline understanding, cause-and-consequence analysis, continuity and change over historical periods.
  - Geography: Map reading and spatial analysis, weather/climate data, resource management, sustainable development, physical landforms, agricultural patterns, and human-environment interactions.
  - Political Science / Civics: Constitutional values, democratic institutions, Fundamental Rights and Duties, diversity and inclusion, local self-government (Panchayati Raj / Municipalities), rule of law, and civic decision-making in real-world scenarios.
  - Economics (Grades 9-10): Economic concepts (development indicators, sectors of the Indian economy, money and credit, food security, poverty as a challenge, globalization), data interpretation from tables and bar charts.
• Move beyond rote textbook recall: Demand analysis, comparison, and evaluation rather than reproducing memorised paragraphs.`;
  } else if (subjLower.includes('eng') || subjLower.includes('hindi') || subjLower.includes('language') || subjLower.includes('sanskrit')) {
    subjectWeightageGuide = `
• PARAKH Language Template Reference (R2 Standard - Grades 5 to 10): Objective: 20%, Very Short Answer (VSA): 15%, Short Answer (SA): 30%, Long Answer (LA): 35%.
• Language Competencies:
  - Reading Comprehension: Identifying central themes, factual retrieval, inferential reasoning, context clues for vocabulary, authorial intent, tone, and critical appreciation.
  - Applied Contextual Grammar: Sentence transformation, editing/omission, correct usage of tenses, voice, modals, determiners, clauses, and conjunctions in communicative sentences rather than dry rote definition memorisation.
  - Creative & Functional Expression: Clear criteria for content relevance, logical organisation, coherence, style, and grammatical accuracy (notices, letters, analytical paragraphs, dialogues).
${isHindi ? `  - MANDATORY FOR HINDI (हिन्दी): 100% Pure Standard Hindi in Devanagari script (देवनागरी लिपि). All titles, questions, options, explanations, and hints must be strictly in Devanagari Hindi. Convert Hinglish inputs into proper Devanagari terminology. Cover अपठित गद्यांश, व्यावहारिक व्याकरण (वर्ण, संज्ञा, सर्वनाम, विशेषण, क्रिया, काल, कारक, संधि, समास, मुहावरे-लोकोक्तियाँ), और रचनात्मक अभिव्यक्ति।` : ''}
${isSanskrit ? `  - MANDATORY FOR SANSKRIT (संस्कृतम्): Strictly in Devanagari script (देवनागरी लिपि). Focus on अपठित-अवबोधनम्, चित्रवर्णनम्/पत्रलेखनम्, सन्धिः, शब्दरूपाणि, धातुरूपाणि, उपपदविभक्तयः, प्रत्ययाः, श्लोकान्वयः, and contextual translation.` : ''}`;
  } else if (subjLower.includes('comput') || subjLower.includes('it') || subjLower.includes('information technology') || subjLower.includes('ai') || subjLower.includes('coding')) {
    subjectWeightageGuide = `
• PARAKH Computer Science & Information Technology Focus (Grades 5 to 10):
  - Computational Thinking: Algorithmic problem-solving, stepwise logic, flowcharts, pseudocode, and debugging.
  - Programming Fundamentals: Block-based programming concepts (Scratch) for lower grades; Python syntax, variables, conditionals, loops, lists, and functions for Grades 8-10.
  - Digital Literacy & Tools: Office productivity (documents, spreadsheets, presentations), operating systems, search strategies.
  - Cyber Ethics & Safety: Digital citizenship, cyberbullying awareness, data privacy, password security, phishing protection, intellectual property rights, and ethical AI usage.`;
  } else if (subjLower.includes('gk') || subjLower.includes('general knowledge') || subjLower.includes('moral') || subjLower.includes('ethic')) {
    subjectWeightageGuide = `
• General Knowledge & Value Education Focus:
  - Critical awareness of current global and national events, scientific discoveries, geography, sports, cultural heritage, and constitutional values.
  - Moral dilemmas, empathy, respect for diversity, environmental stewardship, conflict resolution, and ethical decision-making.`;
  } else {
    // Mathematics / general
    subjectWeightageGuide = `
• PARAKH Mathematics Assessment Focus (Grades 5 to 10):
  - Conceptual understanding, direct numerical calculations, application word problems, mathematical reasoning, multi-step problem solving, and higher-order thinking (HOTS).
  - Curriculum Progression:
    * Grade 5: Number operations up to large numbers, factors & multiples (HCF/LCM basics), fractions, decimals, unitary method, measurement (length, weight, capacity, time, money), perimeter and area of rectangles/squares, volume using unit cubes, 2D/3D shapes, symmetry, angles, pictographs and simple bar charts.
    * Grade 6: Knowing our numbers, whole numbers, playing with numbers, basic geometrical ideas, understanding elementary shapes, integers, fractions, decimals, data handling, mensuration, algebra introduction, ratio and proportion.
    * Grade 7: Integers, fractions and decimals, data handling, simple equations, lines and angles, the triangle and its properties, comparing quantities (percentage, profit/loss, simple interest), rational numbers, perimeter and area, algebraic expressions, exponents and powers.
    * Grade 8: Rational numbers, linear equations in one variable, understanding quadrilaterals, data handling (bar graphs, pie charts, probability), squares and square roots, cubes and cube roots, comparing quantities (compound interest), algebraic expressions and identities, mensuration, exponents and powers, direct and inverse proportions, factorisation, introduction to graphs.
    * Grade 9: Number systems, polynomials, coordinate geometry, linear equations in two variables, introduction to Euclid's geometry, lines and angles, triangles, quadrilaterals, circles, Heron's formula, surface areas and volumes, statistics.
    * Grade 10: Real numbers, polynomials, pair of linear equations in two variables, quadratic equations, arithmetic progressions, triangles, coordinate geometry, introduction to trigonometry, some applications of trigonometry (heights and distances), circles, areas related to circles, surface areas and volumes, statistics, probability.
  - MANDATORY INDEPENDENT CALCULATION VERIFICATION: Every single numerical problem MUST have a mathematically verified, exact solution. Calculations, formulas, substitutions, and units MUST be 100% correct. Ensure exactly ONE option is correct. Avoid concepts from higher grades.`;
  }

  // Grade progression guideline
  let gradeProgressionGuide = '';
  if (gradeNum <= 5) {
    gradeProgressionGuide = `
• GRADE 5 FOCUS (Preparatory Stage - NCERT Classes 3 to 5):
  - Primary focus: Concrete conceptual understanding, experiential and observational learning, foundational literacy and numeracy, intuitive problem-solving using familiar everyday contexts (home, family, neighborhood, nature, playground).
  - Question characteristics:
    * Clear, warm, child-friendly vocabulary; avoid dense academic jargon.
    * Concrete, relatable real-life scenarios; use visual/pictorial representations or diagrams where appropriate.
    * Direct single-step or straightforward two-step operations.
    * Gentle inquiry asking "what do you observe?", "how would you find?", or "which is the best way?".
  - Strictly avoid: Abstract algebraic variables (like x, y), complex multi-clause sentences, advanced formulas, or multi-step theoretical deductions beyond Grade 5 NCERT syllabus.`;
  } else if (gradeNum === 6) {
    gradeProgressionGuide = `
• GRADE 6 FOCUS (Middle Stage Transition - Foundation & Understanding):
  - Primary focus: Smooth transition from primary/EVS to formal subject disciplines (Mathematics, Science, History, Civics, Geography). Basic conceptual understanding, knowledge and recall, recognition and identification, simple application, basic logical reasoning, familiar real-life examples.
  - Question characteristics: Clear and simple language, short and understandable situations, direct application of textbook concepts, simple numerical calculations, basic interpretation of diagrams and tables, introductory competency-based questions.
  - Strictly avoid: Excessively complicated case studies, abstract reasoning beyond the syllabus, advanced terminology, or unnecessarily lengthy prompts.`;
  } else if (gradeNum === 7) {
    gradeProgressionGuide = `
• GRADE 7 FOCUS (Middle Stage - Application & Relational Reasoning):
  - Primary focus: Conceptual understanding, application of previously learned knowledge to familiar and moderately unfamiliar situations, comparison and classification, logical reasoning, simple problem-solving.
  - Question characteristics: Questions requiring students to explain "how" and "why", multi-step calculations appropriate to the syllabus, interpretation of diagrams, tables, and graphical information, introductory analytical questions.`;
  } else if (gradeNum === 8) {
    gradeProgressionGuide = `
• GRADE 8 FOCUS (Middle Stage - Analysis & Higher Application):
  - Primary focus: Strong conceptual understanding, application in diverse contexts, analytical thinking, logical reasoning, multi-step problem solving, interpretation and evaluation of information.
  - Question characteristics: Case-based questions, real-life applications, data interpretation, questions requiring explanations and justifications, integration of concepts from different chapters, higher-order thinking questions.`;
  } else if (gradeNum === 9) {
    gradeProgressionGuide = `
• GRADE 9 FOCUS (Secondary-Stage Competency Development):
  - Primary focus: Disciplinary rigour, independent application, analytical reasoning, conceptual integration, problem-solving, evaluation of information, application of subject knowledge to unfamiliar situations.
  - Question characteristics: Competency-based questions, case and source-based questions, numerical problems requiring multiple connected steps, data interpretation, scientific reasoning and experimental analysis, analytical and explanatory questions.`;
  } else if (gradeNum === 10) {
    gradeProgressionGuide = `
• GRADE 10 FOCUS (Advanced Board Competency & Analysis):
  - Primary focus: Comprehensive conceptual understanding, higher-order thinking (HOTS), complex real-world application, critical analysis, multi-concept integration, independent problem-solving, evaluation and justification aligned with CBSE Board Examination standards.
  - Question characteristics: Challenging competency-based questions, complex real-life applications, case-based and source-based questions, multi-step numerical problems, questions requiring structured and logically justified answers.`;
  } else {
    gradeProgressionGuide = `
• GRADE ${gradeNum} PEDAGOGICAL PROGRESSION:
  - Maintain rigorous age-appropriate cognitive demand matching NCERT/CBSE curriculum standards for ${data.grade}. Balance foundational conceptual clarity with analytical problem-solving.`;
  }
  return `
================================================================================
# MINISTRY OF EDUCATION / NCERT-PARAKH 2025 ASSESSMENT GUIDELINES
================================================================================
Reference Standard: "Guidelines for Setting Balanced Question Papers to Promote Equivalence in Assessment Practices of School Boards" (NCERT/PARAKH, 2025).

You are acting as a Senior Curriculum Designer, NCERT-PARAKH Assessment Specialist, and Chief Board Examination Question Author.
All questions must strictly embody the NCERT-PARAKH 2025 competency-based assessment philosophy:

### 1. CORE ASSESSMENT PHILOSOPHY
Move completely beyond traditional memory and rote textbook recall. A question paper must assess authentic student competencies:
1. Recall and understand knowledge.
2. Apply knowledge in familiar and unfamiliar situations.
3. Analyse information and identify relationships.
4. Solve problems using logical reasoning.
5. Evaluate information and justify conclusions.
6. Generate creative ideas and explore alternative solutions.

### 2. THREE ASSESSMENT ABILITIES & MANDATORY WEIGHTAGES
Every question must be explicitly mapped to one of the three PARAKH assessment abilities:
A. **AWARENESS** (${abilityTarget.awareness} weightage):
   - Knowledge and recall; understanding of concepts and definitions; understanding of processes and sequences; recognition and identification; explanation of concepts and relationships.
B. **SENSITIVITY** (${abilityTarget.sensitivity} weightage):
   - Conflict resolution; open-mindedness; collaboration; consideration of different perspectives; critical evaluation of information and data; logical decision-making.
C. **CREATIVITY** (${abilityTarget.creativity} weightage):
   - Generating innovative ideas; flexibility in approaching problems; fluency in producing relevant ideas; exploration of alternative solutions; combining different concepts; applying knowledge in new and unfamiliar situations.
   *(Note: Do not classify a question as Creative merely because it contains a real-life situation. Its actual cognitive demand must justify the classification.)*

Assessment Standard Selected: **${standard === 'Advanced' ? 'Standard 2: Advanced Assessment' : 'Standard 1: Basic and Proficient Assessment (Default)'}**
• Target Ability Distribution: Awareness = ${abilityTarget.awareness}, Sensitivity = ${abilityTarget.sensitivity}, Creativity = ${abilityTarget.creativity}.
• Total Marks: ${targetTotalMarks} | Examination Duration: ${targetDuration} Minutes.

### 3. DIFFICULTY LEVEL DISTRIBUTION (COGNITIVE DEMAND)
Difficulty level must be determined by the actual cognitive demand of the question, NOT simply by its marks or answer length:
• **EASY** (${difficultyTarget.easy} target): Direct conceptual understanding, simple recall and identification, straightforward applications, familiar examples, single-step calculations.
• **MEDIUM** (${difficultyTarget.medium} target): Application of concepts, questions requiring logical reasoning, comparison and classification, two or more connected steps, interpretation of tables/graphs/diagrams, application in moderately unfamiliar situations.
• **DIFFICULT** (${difficultyTarget.difficult} target): Multi-step problem-solving, higher-order reasoning, analysis of unfamiliar situations, integration of multiple concepts, evaluation and justification, complex data interpretation, creative application of knowledge.
• Target Difficulty Distribution: Easy = ${difficultyTarget.easy}, Medium = ${difficultyTarget.medium}, Difficult = ${difficultyTarget.difficult}.

### 4. GRADE-WISE PROGRESSION (${data.grade})
${gradeProgressionGuide}

### 5. SUBJECT-SPECIFIC ASSESSMENT REQUIREMENTS (${data.subject})
${subjectWeightageGuide}

### 6. QUESTION TYPES & MULTI-SECTION EXAMINATION STRUCTURE
${data.mode === 'LIVE'
  ? `• Live Classroom Mode: Generate questions as single-correct Multiple Choice Questions (MCQs) with 4 options each (A, B, C, D), suitable for live interactive screen response.`
  : `• ACTUAL COMPLETE EXAMINATION PAPER STRUCTURE (MANDATORY DIVERSITY):
You MUST formulate an authentic, multi-section school examination paper containing ALL of the following diverse question types:

1. SECTION A — OBJECTIVE TYPE QUESTIONS (1 Mark each):
   - Multiple Choice Questions (MCQ): 4 options [A, B, C, D] with exactly one correct option.
   - Fill in the Blanks (FILL_IN_THE_BLANKS): Prompt MUST contain a blank space "_______". The "options" field MUST BE AN EMPTY ARRAY ([]). The "answer" field must state the exact missing word/term/formula.
   - True / False (TRUE_FALSE): Statement where students evaluate truth or falsity. The "options" field MUST contain exactly ["True", "False"] (or ["सत्य", "असत्य"] for Hindi).
   - Assertion & Reason: Statements testing conceptual cause-and-effect with 4 standard options.

2. SECTION B — VERY SHORT ANSWER (VSA) QUESTIONS (2 Marks each):
   - Direct conceptual questions, 2-step calculations, or definitions with examples.
   - The "options" field MUST BE AN EMPTY ARRAY ([]).
   - "marks": 2.

3. SECTION C — SHORT ANSWER (SA) QUESTIONS (3 Marks each):
   - Explanations, comparative distinctions, formulas with working steps, or 3-step numerical problems.
   - The "options" field MUST BE AN EMPTY ARRAY ([]).
   - "marks": 3.

4. SECTION D — LONG ANSWER (LA) QUESTIONS (5 Marks each):
   - In-depth multi-part questions (e.g. part (a) and (b)), derivations, geometric proofs, or complex problem-solving.
   - The "options" field MUST BE AN EMPTY ARRAY ([]).
   - "marks": 5.

5. SECTION E — CASE-STUDY / SOURCE-BASED QUESTIONS (4 or 5 Marks each):
   - A real-world context paragraph, scenario, experiment report, or data table, followed by 2 to 3 sub-questions: (i), (ii), (iii).
   - The "options" field MUST BE AN EMPTY ARRAY ([]).
   - "marks": 4 or 5.

CRITICAL MANDATORY RULE: DO NOT generate all questions as MCQs! An actual question paper MUST have a balanced distribution across Section A (MCQs, Fill in Blanks, True/False), Section B (VSA 2M), Section C (SA 3M), Section D (LA 5M), and Section E (Case Study 4M/5M).`
}

### 7. MULTIPLE CHOICE DISTRACTOR DESIGN (FOR MCQS ONLY)
• For questions that are MCQs, provide 4 plausible options: A, B, C, D. Exactly ONE option must be correct. Distractors must bust common misconceptions.
• For Fill in the Blanks, VSA, SA, LA, and Case Study questions: "options" MUST BE AN EMPTY ARRAY []. Do NOT invent artificial options for non-MCQ questions.

### 8. TWO-STAGE GENERATION MANDATE:
**STAGE 1 — ASSESSMENT BLUEPRINT (PREPARED FIRST):**
Before generating any questions, you MUST internally construct and output a comprehensive Assessment Blueprint:
- Total Marks: ${targetTotalMarks} | Duration: ${targetDuration} Minutes
- Chapter/Topic weightage
- Ability distribution (Awareness ${abilityTarget.awareness}, Sensitivity ${abilityTarget.sensitivity}, Creativity ${abilityTarget.creativity})
- Difficulty distribution (Easy ${difficultyTarget.easy}, Medium ${difficultyTarget.medium}, Difficult ${difficultyTarget.difficult})
- Question type distribution (O, VSA, SA, LA)
- Pedagogical summary of the blueprint

**STAGE 2 — QUESTION GENERATION & QUALITY CONTROL:**
- Generate exactly ${data.questionCount} questions strictly mapped to your prepared blueprint.
- Provide full question-level metadata for every question (Learning Objective, Competency, Assessment Ability, Difficulty, Question Type, Marks, Estimated Time).
- Independently verify calculations, units, and scientific accuracy.
- Formulate a detailed Answer Key and step-wise Marking Scheme.
`;
}

function buildUploadedContentPrompt(data: z.infer<typeof aiQuizInput>) {
  const isStrict = Boolean(data.strictSourceContent);
  const fileCount = data.uploadedFiles?.length || 0;
  const isHindi = isHindiSubject(data.subject);
  const parakhFramework = buildPARAKHAssessmentFramework(data);
  const targetTotalMarks = data.totalMarks || (data.questionCount * (data.difficulty === 'Hard' ? 2 : 1));
  const targetDuration = data.durationMinutes || (data.questionCount <= 5 ? 15 : data.questionCount <= 10 ? 30 : data.questionCount <= 20 ? 45 : 60);

  let textDocs = '';
  if (data.uploadedFiles) {
    for (const file of data.uploadedFiles) {
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        try {
          let text = file.data;
          if (text.includes(';base64,')) {
            text = Buffer.from(text.split(';base64,')[1], 'base64').toString('utf-8');
          } else if (!text.startsWith('data:')) {
            const dec = Buffer.from(text, 'base64').toString('utf-8');
            if (/[\x20-\x7E\r\n\t]{10,}/.test(dec)) text = dec;
          }
          textDocs += `\n\n--- [ATTACHED TEXT DOCUMENT: "${file.name}"] ---\n${text.slice(0, 25000)}\n--- [END OF "${file.name}"] ---\n`;
        } catch {
          // ignore
        }
      }
    }
  }

  return `# CRITICAL ASSESSMENT MISSION: PARAKH 2025 QUESTION PAPER GENERATION FROM UPLOADED MATERIAL

You are an expert curriculum designer, CBSE master teacher, and senior question paper author strictly aligned with the Ministry of Education & NCERT-PARAKH 2025 Assessment Guidelines.
You have been provided with ${fileCount} attached file(s) (scanned textbook pages, chapter photographs, sample papers, or lesson notes).

${parakhFramework}

${isHindi ? `
======================================================================
# MANDATORY LANGUAGE REQUIREMENT: PURE HINDI (देवनागरी लिपि)
======================================================================
CRITICAL RULES FOR HINDI SUBJECT (MANDATORY & STRICT):
1. The subject being assessed is HINDI (हिन्दी).
2. The ENTIRE output — including the quiz title, ALL question prompts, ALL options, ALL explanations, hints, and marking schemes — MUST BE WRITTEN EXCLUSIVELY IN PURE HINDI IN DEVANAGARI SCRIPT (देवनागरी लिपि).
3. HINGLISH INPUT TRANSLATION: If the teacher entered the topic, subtopics, or instructions in Hinglish (e.g. "Karak aur uske bhed", "Sandhi vichhed", "Surdas ke Pad"), convert these inputs into their authentic Devanagari Hindi terminology and formulate all questions entirely in Devanagari Hindi.
4. STRICT PROHIBITION: NO English words, NO Romanized/Hinglish text, and NO mixed scripts.
5. All grammatical terminology, rules, definitions, and literary references must strictly follow CBSE/NCERT Hindi standards.
======================================================================
` : ''}

---

## SOURCE MATERIAL INVENTORY & COMPREHENSIVE TOPIC COVERAGE
The attached files are your PRIMARY SOURCE OF KNOWLEDGE. You must:
1. **Examine every attached image, scan, and page systematically**: Carefully read all headings, definitions, diagrams, charts, worked examples, and footnotes visible across ALL attached files.
2. **Comprehensive Topic Coverage (NO TOPIC OMITTED)**: Identify every distinct concept, topic, and sub-topic across the uploaded material. Distribute the ${data.questionCount} questions proportionally across ALL topics present. Do NOT concentrate all questions on just one page or opening paragraph.
3. **Strict Content Boundary**:
   ${isStrict
      ? '• STRICT MODE IS ACTIVE: All questions, correct answers, and options MUST be grounded exclusively in the concepts, laws, terms, and phenomena present in the uploaded material. DO NOT introduce topics from unattached chapters or external unmentioned syllabi.'
      : '• REFERENCE MODE: Use the uploaded pages as the central anchor of truth, while leveraging curriculum context to create polished, age-appropriate questions for Grade ' + data.grade + '.'
    }

---

## TRANSFORM HOW QUESTIONS ARE ASKED (DO NOT MERELY COPY THE FORMAT)
CRITICAL INSTRUCTION: Do NOT simply duplicate or rephrase rote back-of-the-chapter exercise questions!
Instead, transform topics from the uploaded pages into FRESH, NOVEL, AND COMPETENCY-BASED questions:
1. Reframe abstract concepts into real-world scenarios or classroom experiments described in the text.
2. Test cause-and-effect and the "Why" and "How" behind processes.
3. Require comparative and analytical thinking between related concepts.
4. Use diagnostic distractors busting authentic student misconceptions.

---

## ASSESSMENT SPECIFICATIONS
- Subject: ${data.subject}
- Target Grade: ${data.grade}
- Topic: ${data.topic}${data.subtopics ? ` (Subtopics: ${data.subtopics})` : ''}
- Total Questions: ${data.questionCount}
- Difficulty Level: ${data.difficulty}
- Assessment Standard: ${data.assessmentStandard || 'Basic'}
- Language: ${isHindi ? 'HINDI ONLY (देवनागरी लिपि - Pure Devanagari Hindi)' : 'ENGLISH'}
- Target Question Type: ${data.questionType || 'ALL'}
- Teacher Instructions: ${data.details || 'None specified'}
${textDocs}

---

## OUTPUT FORMAT (STRICT RAW JSON ONLY)
Respond ONLY with a valid raw JSON object matching the exact schema below. The root object MUST contain the "questions" array directly at top-level. Do not wrap in markdown code blocks or add introductory/concluding text:
{
  "title": "${isHindi ? `हिन्दी: ${data.topic} (कक्षा ${data.grade} - PARAKH 2025)` : `${data.subject}: ${data.topic} (${data.grade} - NCERT-PARAKH 2025)`}",
  "blueprint": {
    "grade": "${data.grade}",
    "subject": "${data.subject}",
    "assessmentStandard": "${data.assessmentStandard === 'Advanced' ? 'Standard 2: Advanced Assessment' : 'Standard 1: Basic and Proficient Assessment'}",
    "totalMarks": ${targetTotalMarks},
    "durationMinutes": ${targetDuration},
    "chapters": [
      { "name": "${data.topic}", "marks": ${targetTotalMarks}, "percentage": 100 }
    ],
    "abilityDistribution": {
      "awareness": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.25 : 0.50))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50} },
      "sensitivity": { "marks": ${Math.round(targetTotalMarks * 0.25)}, "targetPercentage": 25, "actualPercentage": 25 },
      "creativity": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.50 : 0.25))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25} }
    },
    "difficultyDistribution": {
      "easy": { "marks": ${Math.round(targetTotalMarks * 0.25)}, "targetPercentage": 25, "actualPercentage": 25 },
      "medium": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.25 : 0.50))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50} },
      "difficult": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.50 : 0.25))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25} }
    },
    "questionTypeDistribution": {
      "objective": { "count": ${data.questionCount}, "marks": ${targetTotalMarks} }
    },
    "summary": "Assessment blueprint prepared strictly following NCERT-PARAKH 2025 guidelines from uploaded material."
  },
  "questions": [
    {
      "id": "Q1",
      "questionNumber": 1,
      "section": "${isHindi ? 'खंड क - वस्तुनिष्ठ प्रश्न' : 'Section A - Objective Type'}",
      "learningObjective": "Specific learning outcome tested...",
      "competency": "Specific competency assessed...",
      "assessmentAbility": "Awareness",
      "difficulty": "Easy",
      "questionType": "MCQ",
      "marks": 1,
      "estimatedTimeMinutes": 1,
      "question": "${isHindi ? 'निम्नलिखित में से कौन-सा कथन सत्य है?' : 'Which of the following is correct?'}",
      "options": [
        "${isHindi ? 'विकल्प (क)' : 'Option A'}",
        "${isHindi ? 'विकल्प (ख)' : 'Option B'}",
        "${isHindi ? 'विकल्प (ग)' : 'Option C'}",
        "${isHindi ? 'विकल्प (घ)' : 'Option D'}"
      ],
      "answer": "A",
      "explanation": "Detailed explanation...",
      "hint": "Pedagogical hint...",
      "markingScheme": "1 mark for correct option"
    },
    {
      "id": "Q2",
      "questionNumber": 2,
      "section": "${isHindi ? 'खंड क - वस्तुनिष्ठ प्रश्न' : 'Section A - Objective Type'}",
      "learningObjective": "Recall and exact identification...",
      "competency": "Factual and conceptual precision...",
      "assessmentAbility": "Awareness",
      "difficulty": "Easy",
      "questionType": "FILL_IN_THE_BLANKS",
      "marks": 1,
      "estimatedTimeMinutes": 1,
      "question": "${isHindi ? 'रिक्त स्थान की पूर्ति कीजिए: जल का रासायनिक सूत्र _______ है।' : 'Fill in the blank: The SI unit of force is _______.'}",
      "options": [],
      "answer": "${isHindi ? 'H2O' : 'Newton (N)'}",
      "explanation": "Explanation of the term...",
      "hint": "Clue for student...",
      "markingScheme": "1 mark for correct term"
    },
    {
      "id": "Q3",
      "questionNumber": 3,
      "section": "${isHindi ? 'खंड क - वस्तुनिष्ठ प्रश्न' : 'Section A - Objective Type'}",
      "learningObjective": "Evaluating validity...",
      "competency": "Critical conceptual judgment...",
      "assessmentAbility": "Sensitivity",
      "difficulty": "Medium",
      "questionType": "TRUE_FALSE",
      "marks": 1,
      "estimatedTimeMinutes": 1,
      "question": "${isHindi ? 'सत्य अथवा असत्य बताइए: घर्षण बल गति की दिशा में कार्य करता है।' : 'State True or False: Friction always acts in the direction of motion.'}",
      "options": [
        "${isHindi ? 'सत्य' : 'True'}",
        "${isHindi ? 'असत्य' : 'False'}"
      ],
      "answer": "${isHindi ? 'असत्य' : 'False'}",
      "explanation": "Friction opposes motion...",
      "hint": "Think of opposing forces...",
      "markingScheme": "1 mark for correct judgment"
    },
    {
      "id": "Q4",
      "questionNumber": 4,
      "section": "${isHindi ? 'खंड ख - अति लघु उत्तरीय प्रश्न' : 'Section B - Very Short Answer'}",
      "learningObjective": "Concise conceptual explanation...",
      "competency": "Application of principles...",
      "assessmentAbility": "Awareness",
      "difficulty": "Medium",
      "questionType": "VSA",
      "marks": 2,
      "estimatedTimeMinutes": 3,
      "question": "${isHindi ? 'पादप कोशिका एवं जन्तु कोशिका में कोई दो मुख्य अंतर लिखिए।' : 'State two main differences between physical and chemical changes with examples.'}",
      "options": [],
      "answer": "Concise 2-point model answer...",
      "explanation": "Detailed explanation...",
      "hint": "Compare key characteristics...",
      "markingScheme": "1 mark for each valid point"
    },
    {
      "id": "Q5",
      "questionNumber": 5,
      "section": "${isHindi ? 'खंड ग - लघु उत्तरीय प्रश्न' : 'Section C - Short Answer'}",
      "learningObjective": "Analytical derivation or multi-step reasoning...",
      "competency": "Problem-solving and reasoning...",
      "assessmentAbility": "Creativity",
      "difficulty": "Medium",
      "questionType": "SA",
      "marks": 3,
      "estimatedTimeMinutes": 5,
      "question": "${isHindi ? 'कारण सहित समझाइए कि...' : 'Explain with working steps and formulas how...'}",
      "options": [],
      "answer": "Step-by-step solution / 3-point explanation...",
      "explanation": "Detailed explanation...",
      "hint": "Apply the core theorem/formula...",
      "markingScheme": "1 mark for principle, 1 mark for substitution, 1 mark for answer"
    },
    {
      "id": "Q6",
      "questionNumber": 6,
      "section": "${isHindi ? 'खंड घ - दीर्घ उत्तरीय प्रश्न' : 'Section D - Long Answer'}",
      "learningObjective": "In-depth multi-concept synthesis...",
      "competency": "Comprehensive problem-solving...",
      "assessmentAbility": "Creativity",
      "difficulty": "Difficult",
      "questionType": "LA",
      "marks": 5,
      "estimatedTimeMinutes": 8,
      "question": "${isHindi ? '(क) ... के नियम की व्याख्या कीजिए। (ख) दिए गए परिपथ/स्थिति में गणना कीजिए...' : '(a) State and prove... (b) A particle of mass... calculate...'}",
      "options": [],
      "answer": "Comprehensive multi-part solution with all steps...",
      "explanation": "Detailed derivation and calculation...",
      "hint": "Break into part (a) and part (b)...",
      "markingScheme": "3 marks for part (a), 2 marks for part (b)"
    },
    {
      "id": "Q7",
      "questionNumber": 7,
      "section": "${isHindi ? 'खंड ङ - केस-स्टडी आधारित प्रश्न' : 'Section E - Case Study'}",
      "learningObjective": "Application to real-world context...",
      "competency": "Case analysis and critical evaluation...",
      "assessmentAbility": "Sensitivity",
      "difficulty": "Difficult",
      "questionType": "CASE_STUDY",
      "marks": 4,
      "estimatedTimeMinutes": 8,
      "question": "${isHindi ? 'केस-स्टडी: एक गाँव में किसानों ने देखा कि... इस संदर्भ के आधार पर निम्नलिखित प्रश्नों के उत्तर दीजिए: (i)... (ii)... (iii)...' : 'Case Study: Read the passage below and answer the following questions: A laboratory technician tests... (i) What causes...? (ii) Calculate the...? (iii) What precaution should be taken?'}",
      "options": [],
      "answer": "(i) Answer to part i (1 mark). (ii) Answer to part ii (1.5 marks). (iii) Answer to part iii (1.5 marks).",
      "explanation": "Detailed context analysis...",
      "hint": "Refer to the case data given in the prompt...",
      "markingScheme": "1 mark for (i), 1.5 marks for (ii), 1.5 marks for (iii)"
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "correctOption": "A",
      "answer": "${isHindi ? 'पहला विकल्प' : 'First option'}",
      "solutionSteps": "${isHindi ? 'चरणबद्ध हल अथवा तार्किक व्याख्या।' : 'Step-by-step reasoning or mathematical solution.'}",
      "valuePoints": "${isHindi ? 'सही उत्तर का चयन (1 अंक)' : 'Selection of correct option (1 mark)'}"
    }
  ],
  "qualityReport": {
    "totalMarksValid": true,
    "syllabusValid": true,
    "difficultyValid": true,
    "abilityDistributionValid": true,
    "calculationsVerified": true,
    "deviations": "None. Fully compliant with NCERT-PARAKH 2025 guidelines."
  }
}

Ensure the questions array contains EXACTLY ${data.questionCount} questions covering all sections of the uploaded pages.`;
}

function buildMasterCBSEPrompt(data: z.infer<typeof aiQuizInput>) {
  const isHindi = isHindiSubject(data.subject);
  const parakhFramework = buildPARAKHAssessmentFramework(data);
  const targetTotalMarks = data.totalMarks || (data.questionCount * (data.difficulty === 'Hard' ? 2 : 1));
  const targetDuration = data.durationMinutes || (data.questionCount <= 5 ? 15 : data.questionCount <= 10 ? 30 : data.questionCount <= 20 ? 45 : 60);

  let uploadedContext = '';
  if (data.uploadedFiles && data.uploadedFiles.length > 0) {
    const fileSummary = data.uploadedFiles.map((f, i) => `  ${i + 1}. "${f.name}" (${f.type})`).join('\n');
    if (data.strictSourceContent) {
      uploadedContext = `\n\n======================================================================
# MANDATORY STRICT UPLOADED SOURCE CONTENT REQUIREMENT (STRICT MODE IS ACTIVE)
The teacher has attached ${data.uploadedFiles.length} file(s) (sample question papers, textbook chapter scans, or exercise notes):
${fileSummary}

CRITICAL STRICT RULES (MANDATORY):
1. You MUST generate ALL questions, options, and explanations STRICTLY AND EXCLUSIVELY based on the facts, concepts, problems, and questions found in the uploaded content provided.
2. DO NOT introduce external topics, unmentioned formulas, or concepts from other chapters that do not appear in the uploaded source content.
3. If the uploaded material contains specific sample questions or textbook exercises, adapt, paraphrase, or faithfully format them into the requested question structure.
4. If a fact or question is not supported by the uploaded files, DO NOT invent or extrapolate it.
======================================================================\n`;
    } else {
      uploadedContext = `\n\n----------------------------------------------------------------------
# REFERENCE MATERIAL ATTACHED (STANDARD LLM KNOWLEDGE MODE)
The teacher has attached ${data.uploadedFiles.length} file(s) for reference and guidance:
${fileSummary}

INSTRUCTIONS:
You may generate questions using your broader AI pedagogical knowledge and curriculum understanding for ${data.grade} ${data.subject}, while using the uploaded documents and images as helpful reference, context, and inspiration.
----------------------------------------------------------------------\n`;
    }

    for (const file of data.uploadedFiles) {
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        try {
          let text = file.data;
          if (text.includes(';base64,')) {
            text = Buffer.from(text.split(';base64,')[1], 'base64').toString('utf-8');
          } else if (!text.startsWith('data:')) {
            const dec = Buffer.from(text, 'base64').toString('utf-8');
            if (/[\x20-\x7E\r\n\t]{10,}/.test(dec)) text = dec;
          }
          uploadedContext += `\n\n--- CONTENT OF UPLOADED DOCUMENT: ${file.name} ---\n${text.slice(0, 20000)}\n--- END OF ${file.name} ---\n`;
        } catch {
          // skip binary decode
        }
      }
    }
  }

  return `# CRITICAL ASSESSMENT MISSION: NCERT-PARAKH 2025 QUESTION PAPER GENERATOR

You are an expert curriculum designer, CBSE master teacher, and senior question paper author strictly aligned with the Ministry of Education & NCERT-PARAKH 2025 Assessment Guidelines.

${parakhFramework}

---

# INPUTS FOR THIS ASSESSMENT

Class/Grade: ${data.grade}
Subject: ${data.subject}
Chapter/Topic: ${data.topic}
Sub-Topics: ${data.subtopics || 'Core chapter concepts'}
Number of Questions: ${data.questionCount}
Target Difficulty: ${data.difficulty}
Assessment Standard: ${data.assessmentStandard || 'Basic'}
Quiz Delivery Mode: ${data.mode === 'LIVE' ? 'LIVE TEACHER-LED CLASSROOM' : 'COMPLETE TIMED ASSESSMENT'}
Language: ${isHindi ? 'HINDI (देवनागरी लिपि - PURE DEVANAGARI HINDI ONLY)' : 'ENGLISH'}
Question Type Selected: ${data.questionType || 'ALL'}
Teacher Additional Details: ${data.details || 'None'}
Strict Mode (Generate Strictly from Uploaded Content): ${data.strictSourceContent ? 'YES - STRICTLY FROM UPLOADED CONTENT ONLY' : 'NO - STANDARD LLM KNOWLEDGE'}
Uploaded Files Count: ${data.uploadedFiles?.length || 0}
${uploadedContext}

${isHindi ? `
======================================================================
# MANDATORY LANGUAGE REQUIREMENT: PURE HINDI (देवनागरी लिपि)
======================================================================
CRITICAL RULES FOR HINDI SUBJECT (STRICT):
1. SUBJECT IS HINDI (हिन्दी).
2. The entire output — quiz title, blueprint summary, EVERY question prompt, ALL options, ALL explanations, hints, and marking schemes — MUST BE WRITTEN EXCLUSIVELY IN AUTHENTIC HINDI IN DEVANAGARI SCRIPT (देवनागरी लिपि).
3. HINGLISH INPUT TRANSLATION: If the teacher provided the Chapter/Topic ("${data.topic}"), Sub-Topics ("${data.subtopics || ''}"), or Additional Details in Hinglish (e.g. "Karak aur uske bhed", "Sandhi vichhed", "Samas", "Surdas ke Pad", "Netaji ka Chashma"), automatically interpret and convert these inputs into authentic Devanagari Hindi equivalents (e.g. "कारक और उसके भेद", "संधि विच्छेद", "समास", "सूरदास के पद") and generate all questions, options, and explanations in proper Devanagari Hindi.
4. STRICT PROHIBITION: NO English words, NO Romanized/Hinglish text, and NO mixed scripts anywhere in questions, options, explanations, or title.
5. CURRICULUM ALIGNMENT: Strictly align with CBSE Hindi Course A / Course B curriculum and CBSE Hindi Vyakaran (व्याकरण).
======================================================================
` : ''}

---

# QUALITY & INTEGRITY VALIDATION CHECKLIST (STAGE 2)
Before returning the final JSON object, review every single question against these non-negotiable rules:
1. **Syllabus & Grade Accuracy:** Every question must strictly fall within the syllabus of ${data.grade} for ${data.subject}. Do NOT introduce higher-grade concepts just to add difficulty.
2. **Mathematical & Scientific Precision:** Every numerical calculation must be double-checked and mathematically verified. Ensure all values and units are realistic and correct.
3. **Plurality & Plausibility:** Every question must have exactly ONE unambiguous correct answer (or designated key). Distractors must bust common misconceptions.
4. **Competency Mapping:** Every question must have complete metadata (Learning Objective, Competency, Assessment Ability: Awareness/Sensitivity/Creativity, Difficulty: Easy/Medium/Difficult, Question Type: O/VSA/SA/LA, Marks, Estimated Time, Marking Scheme).
5. **Detailed Answer Key:** Provide step-wise solutions, value points, formulas, substitutions, and partial marks criteria.

---

# OUTPUT FORMAT (STRICT RAW JSON ONLY)

Return ONLY a valid raw JSON object (no markdown formatting, no code block fences, no conversational text before or after JSON). The root object MUST have the "questions" array directly at top-level. Use this exact schema:
{
  "title": "${isHindi ? `हिन्दी: ${data.topic} (कक्षा ${data.grade} - PARAKH 2025)` : `${data.subject}: ${data.topic} (${data.grade} - NCERT-PARAKH 2025)`}",
  "blueprint": {
    "grade": "${data.grade}",
    "subject": "${data.subject}",
    "assessmentStandard": "${data.assessmentStandard === 'Advanced' ? 'Standard 2: Advanced Assessment' : 'Standard 1: Basic and Proficient Assessment'}",
    "totalMarks": ${targetTotalMarks},
    "durationMinutes": ${targetDuration},
    "chapters": [
      { "name": "${data.topic}", "marks": ${targetTotalMarks}, "percentage": 100 }
    ],
    "abilityDistribution": {
      "awareness": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.25 : 0.50))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50} },
      "sensitivity": { "marks": ${Math.round(targetTotalMarks * 0.25)}, "targetPercentage": 25, "actualPercentage": 25 },
      "creativity": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.50 : 0.25))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25} }
    },
    "difficultyDistribution": {
      "easy": { "marks": ${Math.round(targetTotalMarks * 0.25)}, "targetPercentage": 25, "actualPercentage": 25 },
      "medium": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.25 : 0.50))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 25 : 50} },
      "difficult": { "marks": ${Math.round(targetTotalMarks * (data.assessmentStandard === 'Advanced' ? 0.50 : 0.25))}, "targetPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25}, "actualPercentage": ${data.assessmentStandard === 'Advanced' ? 50 : 25} }
    },
    "questionTypeDistribution": {
      "objective": { "count": ${data.questionCount}, "marks": ${targetTotalMarks} }
    },
    "summary": "Assessment blueprint prepared strictly following NCERT-PARAKH 2025 guidelines."
  },
  "questions": [
    {
      "id": "Q1",
      "questionNumber": 1,
      "section": "${isHindi ? 'खंड क - वस्तुनिष्ठ प्रश्न' : 'Section A - Objective Type'}",
      "learningObjective": "Specific learning outcome tested...",
      "competency": "Specific competency assessed...",
      "assessmentAbility": "Awareness",
      "difficulty": "Easy",
      "questionType": "MCQ",
      "marks": 1,
      "estimatedTimeMinutes": 1,
      "question": "${isHindi ? 'निम्नलिखित में से कौन-सा कथन सत्य है?' : 'Which of the following is correct?'}",
      "options": [
        "${isHindi ? 'विकल्प (क)' : 'Option A'}",
        "${isHindi ? 'विकल्प (ख)' : 'Option B'}",
        "${isHindi ? 'विकल्प (ग)' : 'Option C'}",
        "${isHindi ? 'विकल्प (घ)' : 'Option D'}"
      ],
      "answer": "A",
      "explanation": "Detailed explanation...",
      "hint": "Pedagogical hint...",
      "markingScheme": "1 mark for correct option"
    },
    {
      "id": "Q2",
      "questionNumber": 2,
      "section": "${isHindi ? 'खंड क - वस्तुनिष्ठ प्रश्न' : 'Section A - Objective Type'}",
      "learningObjective": "Recall and exact identification...",
      "competency": "Factual and conceptual precision...",
      "assessmentAbility": "Awareness",
      "difficulty": "Easy",
      "questionType": "FILL_IN_THE_BLANKS",
      "marks": 1,
      "estimatedTimeMinutes": 1,
      "question": "${isHindi ? 'रिक्त स्थान की पूर्ति कीजिए: जल का रासायनिक सूत्र _______ है।' : 'Fill in the blank: The SI unit of force is _______.'}",
      "options": [],
      "answer": "${isHindi ? 'H2O' : 'Newton (N)'}",
      "explanation": "Explanation of the term...",
      "hint": "Clue for student...",
      "markingScheme": "1 mark for correct term"
    },
    {
      "id": "Q3",
      "questionNumber": 3,
      "section": "${isHindi ? 'खंड क - वस्तुनिष्ठ प्रश्न' : 'Section A - Objective Type'}",
      "learningObjective": "Evaluating validity...",
      "competency": "Critical conceptual judgment...",
      "assessmentAbility": "Sensitivity",
      "difficulty": "Medium",
      "questionType": "TRUE_FALSE",
      "marks": 1,
      "estimatedTimeMinutes": 1,
      "question": "${isHindi ? 'सत्य अथवा असत्य बताइए: घर्षण बल गति की दिशा में कार्य करता है।' : 'State True or False: Friction always acts in the direction of motion.'}",
      "options": [
        "${isHindi ? 'सत्य' : 'True'}",
        "${isHindi ? 'असत्य' : 'False'}"
      ],
      "answer": "${isHindi ? 'असत्य' : 'False'}",
      "explanation": "Friction opposes motion...",
      "hint": "Think of opposing forces...",
      "markingScheme": "1 mark for correct judgment"
    },
    {
      "id": "Q4",
      "questionNumber": 4,
      "section": "${isHindi ? 'खंड ख - अति लघु उत्तरीय प्रश्न' : 'Section B - Very Short Answer'}",
      "learningObjective": "Concise conceptual explanation...",
      "competency": "Application of principles...",
      "assessmentAbility": "Awareness",
      "difficulty": "Medium",
      "questionType": "VSA",
      "marks": 2,
      "estimatedTimeMinutes": 3,
      "question": "${isHindi ? 'पादप कोशिका एवं जन्तु कोशिका में कोई दो मुख्य अंतर लिखिए।' : 'State two main differences between physical and chemical changes with examples.'}",
      "options": [],
      "answer": "Concise 2-point model answer...",
      "explanation": "Detailed explanation...",
      "hint": "Compare key characteristics...",
      "markingScheme": "1 mark for each valid point"
    },
    {
      "id": "Q5",
      "questionNumber": 5,
      "section": "${isHindi ? 'खंड ग - लघु उत्तरीय प्रश्न' : 'Section C - Short Answer'}",
      "learningObjective": "Analytical derivation or multi-step reasoning...",
      "competency": "Problem-solving and reasoning...",
      "assessmentAbility": "Creativity",
      "difficulty": "Medium",
      "questionType": "SA",
      "marks": 3,
      "estimatedTimeMinutes": 5,
      "question": "${isHindi ? 'कारण सहित समझाइए कि...' : 'Explain with working steps and formulas how...'}",
      "options": [],
      "answer": "Step-by-step solution / 3-point explanation...",
      "explanation": "Detailed explanation...",
      "hint": "Apply the core theorem/formula...",
      "markingScheme": "1 mark for principle, 1 mark for substitution, 1 mark for answer"
    },
    {
      "id": "Q6",
      "questionNumber": 6,
      "section": "${isHindi ? 'खंड घ - दीर्घ उत्तरीय प्रश्न' : 'Section D - Long Answer'}",
      "learningObjective": "In-depth multi-concept synthesis...",
      "competency": "Comprehensive problem-solving...",
      "assessmentAbility": "Creativity",
      "difficulty": "Difficult",
      "questionType": "LA",
      "marks": 5,
      "estimatedTimeMinutes": 8,
      "question": "${isHindi ? '(क) ... के नियम की व्याख्या कीजिए। (ख) दिए गए परिपथ/स्थिति में गणना कीजिए...' : '(a) State and prove... (b) A particle of mass... calculate...'}",
      "options": [],
      "answer": "Comprehensive multi-part solution with all steps...",
      "explanation": "Detailed derivation and calculation...",
      "hint": "Break into part (a) and part (b)...",
      "markingScheme": "3 marks for part (a), 2 marks for part (b)"
    },
    {
      "id": "Q7",
      "questionNumber": 7,
      "section": "${isHindi ? 'खंड ङ - केस-स्टडी आधारित प्रश्न' : 'Section E - Case Study'}",
      "learningObjective": "Application to real-world context...",
      "competency": "Case analysis and critical evaluation...",
      "assessmentAbility": "Sensitivity",
      "difficulty": "Difficult",
      "questionType": "CASE_STUDY",
      "marks": 4,
      "estimatedTimeMinutes": 8,
      "question": "${isHindi ? 'केस-स्टडी: एक गाँव में किसानों ने देखा कि... इस संदर्भ के आधार पर निम्नलिखित प्रश्नों के उत्तर दीजिए: (i)... (ii)... (iii)...' : 'Case Study: Read the passage below and answer the following questions: A laboratory technician tests... (i) What causes...? (ii) Calculate the...? (iii) What precaution should be taken?'}",
      "options": [],
      "answer": "(i) Answer to part i (1 mark). (ii) Answer to part ii (1.5 marks). (iii) Answer to part iii (1.5 marks).",
      "explanation": "Detailed context analysis...",
      "hint": "Refer to the case data given in the prompt...",
      "markingScheme": "1 mark for (i), 1.5 marks for (ii), 1.5 marks for (iii)"
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "correctOption": "A",
      "answer": "${isHindi ? 'पहला विकल्प' : 'Option A text'}",
      "solutionSteps": "${isHindi ? 'चरणबद्ध हल अथवा तार्किक व्याख्या।' : 'Step-by-step reasoning or mathematical solution.'}",
      "valuePoints": "${isHindi ? 'सही उत्तर का चयन (1 अंक)' : 'Selection of correct option (1 mark)'}"
    }
  ],
  "qualityReport": {
    "totalMarksValid": true,
    "syllabusValid": true,
    "difficultyValid": true,
    "abilityDistributionValid": true,
    "calculationsVerified": true,
    "deviations": "None. Fully compliant with NCERT-PARAKH 2025 guidelines."
  }
}

Ensure the questions array contains EXACTLY ${data.questionCount} questions strictly mapped to the assessment blueprint.`;
}


async function generateAIQuiz(data: z.infer<typeof aiQuizInput>) {
  const customKey = data.apiKey?.trim();
  let selectedProvider = data.provider || 'auto';

  // Smart provider auto-detection if teacher's key format is unambiguous
  if (customKey) {
    if (customKey.startsWith('AIza')) {
      selectedProvider = 'gemini';
    } else if (customKey.startsWith('sk-')) {
      if (selectedProvider !== 'deepseek') {
        selectedProvider = 'openai';
      }
    }
  }

  const geminiKey = selectedProvider === 'gemini'
    ? (customKey?.startsWith('AIza') ? customKey : process.env.GEMINI_API_KEY)
    : (selectedProvider === 'auto' ? (customKey?.startsWith('AIza') ? customKey : process.env.GEMINI_API_KEY) : undefined);

  const openaiKey = selectedProvider === 'openai'
    ? (customKey?.startsWith('sk-') ? customKey : (process.env.OPENAI_API_KEY || customKey))
    : (selectedProvider === 'auto' ? (customKey?.startsWith('sk-') ? customKey : process.env.OPENAI_API_KEY) : undefined);

  const deepseekKey = selectedProvider === 'deepseek'
    ? (customKey || process.env.DEEPSEEK_API_KEY)
    : undefined;

  // Enforce API Key requirements per provider selection
  if (selectedProvider === 'gemini' && !geminiKey) {
    throw new Error('Google Gemini API Key is required. Please paste your Gemini API Key in AI Settings or set GEMINI_API_KEY in your server .env file.');
  }
  if (selectedProvider === 'openai' && !openaiKey) {
    throw new Error('ChatGPT (OpenAI) API Key is required. Please paste your OpenAI API Key in AI Settings or set OPENAI_API_KEY in your server .env file.');
  }
  if (selectedProvider === 'deepseek' && !deepseekKey) {
    throw new Error('DeepSeek API Key is required. Please paste your DeepSeek API Key in AI Settings or set DEEPSEEK_API_KEY in your server .env file.');
  }
  if (selectedProvider === 'auto' && !geminiKey && !openaiKey && !deepseekKey) {
    throw new Error('API Key is required for AI Quiz Generation. Please select Google Gemini, ChatGPT, or DeepSeek in AI Settings and paste your API key.');
  }

  const isHindi = isHindiSubject(data.subject);
  const isSanskrit = isSanskritSubject(data.subject);
  const hasUploadedFiles = Boolean(data.uploadedFiles && data.uploadedFiles.length > 0);
  const standardLabel = data.assessmentStandard === 'Advanced' ? 'Standard 2: Advanced Assessment (25% Aware, 25% Sens, 50% Creat)' : 'Standard 1: Basic & Proficient Assessment (50% Aware, 25% Sens, 25% Creat)';
  const systemRole = isHindi
    ? `You are an expert CBSE Hindi master teacher, senior board examiner, and Hindi language assessment specialist strictly aligned with the Ministry of Education & NCERT-PARAKH 2025 Assessment Guidelines ("Guidelines for Setting Balanced Question Papers to Promote Equivalence in Assessment Practices of School Boards"). Assessment standard: ${standardLabel}. You construct an internal assessment blueprint before generating questions, ensuring balanced competency mapping across Awareness (50%/25%), Sensitivity (25%/25%), and Creativity (25%/50%). All titles, question prompts, options, explanations, hints, and marking schemes must be generated strictly and exclusively in pure Hindi in Devanagari script (देवनागरी लिपि). Interpret Hinglish inputs into proper Devanagari Hindi.`
    : (isSanskrit
      ? `You are an expert CBSE Sanskrit master teacher, senior board examiner, and Sanskrit language assessment specialist strictly aligned with the Ministry of Education & NCERT-PARAKH 2025 Assessment Guidelines ("Guidelines for Setting Balanced Question Papers to Promote Equivalence in Assessment Practices of School Boards"). Assessment standard: ${standardLabel}. You construct an internal assessment blueprint before generating questions. All titles, question prompts, options, explanations, hints, and marking schemes must be generated strictly in Devanagari script (देवनागरी लिपि).`
      : (hasUploadedFiles
        ? `You are an expert curriculum designer, CBSE question paper author and senior pedagogical assessment specialist strictly aligned with the Ministry of Education & NCERT-PARAKH 2025 Assessment Guidelines. Assessment standard: ${standardLabel}. Inspect all attached chapter pages, formulate a balanced assessment blueprint first, and generate fresh, transformed, competency-based questions mapping Awareness, Sensitivity, and Creativity without copying rote textbook questions.`
        : `You are an experienced CBSE examination question-paper author, senior curriculum designer, and assessment specialist strictly aligned with the NCERT-PARAKH 2025 Assessment Guidelines ("Guidelines for Setting Balanced Question Papers to Promote Equivalence in Assessment Practices of School Boards"). Assessment standard: ${standardLabel}. You construct an internal assessment blueprint first, then generate balanced, competency-driven questions assessing Awareness, Sensitivity, and Creativity across Easy, Medium, and Difficult cognitive tiers, independently verifying all calculations.`));
  const prompt = hasUploadedFiles
    ? buildUploadedContentPrompt(data)
    : buildMasterCBSEPrompt(data);

  if (selectedProvider === 'openai' || (selectedProvider === 'auto' && openaiKey)) {
    let userContent: any = prompt;
    if (data.uploadedFiles && data.uploadedFiles.length > 0) {
      const imageFiles = data.uploadedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        userContent = [
          ...imageFiles.map(f => {
            const raw = f.data.trim();
            const url = raw.startsWith('data:') ? raw : `data:${f.type || 'image/jpeg'};base64,${raw}`;
            return {
              type: 'image_url',
              image_url: { url, detail: 'high' }
            };
          }),
          { type: 'text', text: prompt }
        ];
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `${systemRole}\n\nCRITICAL MANDATORY JSON OUTPUT INSTRUCTION: Return a single valid JSON object. The root object MUST have the 'questions' array directly at top level: { "title": "...", "blueprint": {...}, "questions": [...] }. Do not wrap questions in sub-objects.` },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 8192,
        temperature: 0.3,
      })
    });
    const jsonResult: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errMessage = jsonResult?.error?.message ?? response.statusText;
      throw new Error(`ChatGPT OpenAI Error: ${errMessage}`);
    }
    const content = jsonResult.choices?.[0]?.message?.content;
    if (content) {
      const parsed = parseAIResponseJSON(content, data);
      if (parsed && parsed.questions.length > 0) return parsed;
      console.error('ChatGPT OpenAI returned unparseable content. First 1500 chars:');
      console.error(content.slice(0, 1500));
    }
    throw new Error('ChatGPT returned an unparseable response. Please try again.');
  }

  if (selectedProvider === 'deepseek' || (selectedProvider === 'auto' && deepseekKey && !openaiKey)) {
    const candidateModels = ['deepseek-chat', 'deepseek-reasoner'];
    let lastError = '';

    for (const model of candidateModels) {
      try {
        const bodyPayload: any = {
          model,
          messages: [
            { role: 'system', content: systemRole },
            { role: 'user', content: prompt }
          ]
        };
        if (model === 'deepseek-chat') {
          bodyPayload.response_format = { type: 'json_object' };
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify(bodyPayload)
        });

        const jsonResult: any = await response.json().catch(() => ({}));
        if (!response.ok) {
          lastError = jsonResult?.error?.message ?? response.statusText;
          continue;
        }

        const content = jsonResult.choices?.[0]?.message?.content;
        if (content) {
          const parsed = parseAIResponseJSON(content, data);
          if (parsed && parsed.questions.length > 0) return parsed;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    throw new Error(`DeepSeek API Error: ${lastError || 'DeepSeek returned an unparseable response. Please try again.'}`);
  }

  if (selectedProvider === 'gemini' || (selectedProvider === 'auto' && geminiKey && !openaiKey && !deepseekKey)) {
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
    ];
    let lastError = '';

    const parts: Array<any> = [];

    if (data.uploadedFiles && data.uploadedFiles.length > 0) {
      for (const file of data.uploadedFiles) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          let pureBase64 = file.data;
          if (pureBase64.includes(';base64,')) {
            pureBase64 = pureBase64.split(';base64,')[1];
          }
          pureBase64 = pureBase64.replace(/\s+/g, '');
          const mimeType = file.type === 'application/pdf' ? 'application/pdf' : (file.type || 'image/jpeg');

          // Standard Google Gemini REST API requires camelCase inlineData:
          parts.push({
            inlineData: {
              mimeType,
              data: pureBase64,
            }
          });
        }
      }
    }

    parts.push({ text: `${systemRole}\n\n${prompt}` });

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });
        const jsonResult: any = await response.json().catch(() => ({}));
        if (!response.ok) {
          lastError = jsonResult?.error?.message ?? response.statusText;
          if (lastError.includes('not found') || lastError.includes('no longer available') || response.status === 404) {
            continue;
          }
          throw new Error(`Google Gemini Error: ${lastError}`);
        }
        const textOutput = jsonResult.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          const parsed = parseAIResponseJSON(textOutput, data);
          if (parsed && parsed.questions.length > 0) return parsed;
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('Google Gemini Error:')) {
          throw err;
        }
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    throw new Error(`Google Gemini Error: ${lastError || 'No supported Gemini model found for your API Key.'}`);
  }

  const questions = generateTopicQuestions(data.subject, data.topic, data.subtopics, data.grade, data.difficulty, data.questionCount);
  return {
    title: isHindi ? `हिन्दी: ${data.topic} (कक्षा ${data.grade} - सीबीएसई)` : `${data.subject}: ${data.topic} (${data.grade} - CBSE NEP)`,
    blueprint: null,
    answerKey: null,
    qualityReport: null,
    questions,
  };
}

app.post('/api/ai/generate-quiz', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = parse(aiQuizInput, req.body);

    // If client provided an inline key, ensure it does not belong to another teacher
    if (data.apiKey && req.session?.id && req.session.role !== 'superadmin') {
      const duplicate = await db.teacher.findFirst({
        where: {
          apiKey: data.apiKey.trim(),
          id: { not: req.session.id },
        },
        select: { id: true },
      });
      if (duplicate) {
        return res.status(403).json({
          error: 'This API Key is registered to another teacher account. Duplication of API keys is strictly prohibited. Please configure your own unique API key in AI Settings.',
        });
      }
    }

    // Load teacher's own saved apiKey from database if not supplied
    if (!data.apiKey && req.session?.id) {
      const teacher = await db.teacher.findUnique({ where: { id: req.session.id }, select: { apiKey: true } });
      if (teacher?.apiKey) {
        data.apiKey = teacher.apiKey;
      }
    }

    // Require each teacher to have their own API key configured
    if (!data.apiKey && req.session?.role !== 'superadmin') {
      return res.status(400).json({
        error: 'API Key missing. Every teacher must add their own unique Gemini, OpenAI, or DeepSeek API Key in AI Settings before generating quizzes.',
      });
    }

    const quizResult = await generateAIQuiz(data);
    res.json(quizResult);
  } catch (error) { errorResponse(res, error); }
});

function buildEduAshramAITeachingAssistantPrompt(data: z.infer<typeof aiTeachingAssistantInput>): string {
  const board = data.board || 'CBSE (NEP 2026 Aligned)';
  const grade = data.grade || 'Grade 8';
  const subject = data.subject || 'Mathematics';
  const academicSession = data.academicSession || '2026-2027';
  const topic = data.topic || 'Classroom Curriculum';
  const learningLevel = data.learningLevel || 'Mixed Ability (Differentiated)';
  const duration = data.duration || '45 minutes';
  const mode = data.mode || 'general';

  return `# EDUASHRAM — AI TEACHING ASSISTANT
## Master System Prompt

### 1. ROLE AND IDENTITY

You are EduAshram AI Teaching Assistant, an expert teacher, instructional designer, subject-matter specialist and educational content creator.

Your primary responsibility is to help teachers prepare high-quality lessons, explain concepts, create educational resources, generate questions, evaluate student responses and provide constructive feedback.

You must behave like an experienced schoolteacher who understands child development, classroom teaching, assessment design and different learning abilities.

Your content must be accurate, age-appropriate, engaging, well-structured and aligned with the teacher's selected curriculum.

### 2. TEACHING CONTEXT

Use the following context provided by EduAshram's interface:

- Board/Curriculum: ${board}
- Grade/Class: ${grade}
- Subject: ${subject}
- Academic Session: ${academicSession}
- Chapter/Topic: ${topic}
- Language: ${isHindiSubject(subject) ? 'Hindi (देवनागरी लिपि - Pure Hindi). Formulate lesson plans, teaching notes, questions, and explanations strictly in standard Hindi. Understand topics input in Hinglish.' : 'English (with intuitive bilingual/Hinglish analogies where helpful for conceptual clarity)'}
- Student Learning Level: ${learningLevel}
- Lesson Duration: ${duration}
- Interface Mode: ${mode}

Use the information supplied by EduAshram's interface as the primary context. Do not ask teachers to re-enter information already provided.

If essential information is missing, ask concise clarifying questions. If the missing information is not essential, make a reasonable assumption and state it briefly.

### 3. CURRICULUM ALIGNMENT AND ACCURACY

Follow these rules strictly:

1. Align content with the selected board (${board}), grade (${grade}), subject (${subject}) and applicable curriculum.
2. For CBSE content, use the applicable official syllabus, curriculum documents and examination guidance wherever available.
3. Never invent official syllabus requirements, textbook references, chapter names, examination rules or curriculum standards.
4. If official curriculum information is unavailable, clearly state that the content is a general educational draft requiring teacher verification.
5. Use terminology and complexity appropriate to the selected grade (${grade}).
6. Verify factual consistency, calculations, formulas, examples and answer keys before presenting the output.
7. Distinguish established facts from interpretations, estimates and examples.
8. Use Indian English conventions when the selected context is Indian schooling.
9. Do not claim that generated content is officially approved by CBSE or another board unless such approval is established.
10. Do not reproduce entire copyrighted textbooks or proprietary educational resources. Create original explanations and examples.

### 4. CORE CAPABILITIES & TWO-PART LESSON STRUCTURE

MANDATORY INSTRUCTION ON OUTPUT ARCHITECTURE:
Whenever preparing a lesson plan or classroom preparation for ${topic} (${grade} ${subject}), you MUST ALWAYS organize the output into TWO DISTINCT, PROMINENT PARTS:

================================================================================
# 🧑‍🏫 PART 1 — TEACHER INSTRUCTIONS & PEDAGOGICAL BLUEPRINT (BEFORE CLASS)
================================================================================
(This section is exclusively for the teacher's lesson planning, timing, competencies and pedagogical readiness)

Include:
1. **Curriculum & Lesson Context:**
   - **Grade/Class:** ${grade}
   - **Subject:** ${subject}
   - **Chapter/Topic:** ${topic}
   - **Board/Curriculum:** ${board}
   - **Lesson Duration:** ${duration}
   - **Academic Session:** ${academicSession}
   - **Student Learning Level:** ${learningLevel}

2. **Prerequisite Knowledge:**
   - Specific prior concepts students should already understand before starting this lesson.

3. **Learning Objectives (Bloom's Taxonomy / NEP 2026):**
   - **Remember:** Specific recall goal.
   - **Understand:** Conceptual grasp and connection to previous knowledge.
   - **Apply:** Procedural and real-world calculation/problem-solving goal.
   - **Analyze / HOTS:** Identifying patterns, error-checking, or deeper connections.

4. **Expected Learning Outcomes (Measurable Competencies):**
   - 3-4 observable, measurable competency statements ("Students will be able to...").

5. **Teaching-Learning Materials (TLMs / EduAshram Whiteboard tools):**
   - Tangible/visual aids (e.g., currency coins, fraction bars, grid paper).
   - Digital whiteboard tools and place-value charts.

6. **Classroom Procedure & Time Allotment (Must be a clean Markdown Table):**
   Use this exact table format:
   | Stage & Time | Teacher Activities (Pedagogical Strategy) | Student Activities (Active Learning) | Formative Check |
   | :--- | :--- | :--- | :--- |
   | **A. Warm-Up Hook** (5 min) | ... | ... | ... |
   | **B. Direct Instruction ("I Do")** (15 min) | ... | ... | ... |
   | **C. Guided Practice ("We Do")** (10 min) | ... | ... | ... |
   | **D. Independent Practice ("You Do")** (7 min) | ... | ... | ... |
   | **E. Exit Ticket Assessment** (3 min) | ... | ... | ... |
   | **F. Summary & Recap** (3 min) | ... | ... | ... |
   | **G. Homework & Extension** (2 min) | ... | ... | ... |

7. **Anticipated Misconceptions & Diagnostic Traps:**
   - State top 2-3 common student misconceptions.
   - Provide the exact diagnostic remediation teacher should use immediately when students stumble.

8. **Differentiated Learning Matrix:**
   - **Remedial / Foundation Support:** Scaffolding, visual aids, concrete analogies.
   - **Advanced / HOTS Extension:** Higher cognitive challenge, Olympiad reasoning, fraction-decimal conversions.

================================================================================
# 🏫 PART 2 — ACTUAL TEACHING CONTENT & CLASSROOM SCRIPT (WHAT TO TEACH)
================================================================================
(This section contains the ready-to-teach classroom content, exact spoken words, worked examples, and student exercises)

Include:
1. **The 5-Minute Classroom Hook & Spoken Script:**
   - Exact words the teacher can speak out loud: "🗣️ Teacher Script: ..."
   - Engaging real-world scenario (e.g., money ₹ and Paise, sports scores, cooking measurements).
   - Interactive classroom provocation question.

2. **Concept Breakdown & Teacher Talk ("I Do"):**
   - Step-by-step intuitive conceptual explanation in conversational, engaging teacher language.
   - Everyday analogies that demystify the abstract math/science.

3. **Worked Step-by-Step Problem Examples:**
   - 3-4 fully solved illustrative examples with clear step-by-step mathematical reasoning.

4. **Guided Practice ("We Do") — Turn & Talk Prompts:**
   - 2-3 partner discussion problems with quick guiding questions for peer interaction.

5. **Independent Practice ("You Do") — Tiered Problems:**
   - **🟢 Tier 1: Foundation (Direct recall & place value identification)**
   - **🟡 Tier 2: Standard (Multi-step problems & conversions)**
   - **🔴 Tier 3: HOTS / Challenge (Critical thinking & Olympiad problems)**
   - Provide complete step-by-step solutions for teacher reference.

6. **3-Minute Exit Ticket (Printable / Displayable):**
   - 3 rapid diagnostic questions to test if students met today's learning outcomes.
   - Full answer key.

7. **Homework & Real-World Discovery Activity:**
   - 3 structured notebook problems.
   - 1 real-world home observation task (e.g., find 3 items at home with decimals, explain what digits mean).

#### A. AI LESSON PLANNER (Active when mode is "lesson_plan" or requested)
Follow the two-part structure above strictly. Ensure realistic timings totaling ${duration}. Make every explanation practical, age-appropriate for ${grade}, and engaging.

#### B. CONCEPT EXPLANATION (Active when mode is "explanation" or requested)
When asked to explain a topic:
1. Begin with a simple, engaging introduction.
2. Explain the concept in logical steps.
3. Use age-appropriate language tailored to ${grade}.
4. Include relatable examples and vivid analogies from everyday life.
5. Explain important terminology clearly.
6. Use analogies where they improve understanding.
7. Include formulas, equations, tables or ASCII diagrams when necessary.
8. Highlight top 3 student misconceptions and how to bust them.
9. End with a concise recap.
10. Include short comprehension check questions.

Adjust the explanation to ${grade}. Do not use advanced terminology without explaining it.
For younger students, prioritize simple language, concrete examples and visual explanations. For higher grades, include greater conceptual depth, subject-specific terminology and analytical reasoning.

#### C. QUESTION GENERATOR & WORKSHEETS (Active when mode is "practice", "worksheet", or requested)
Generate questions according to the teacher's selected requirements:
- Multiple-choice questions (MCQs with plausible distractors).
- Multiple-select questions, True/False, Fill in the blanks.
- Assertion and Reasoning (Standard CBSE format: A, B, C, D).
- Case-based questions & Competency-based scenarios.
- Tiered practice problems:
  - 🟢 Tier 1: Foundation / Direct Recall (2-3 questions)
  - 🟡 Tier 2: Proficiency / Multi-step Word Problems (2-3 questions)
  - 🔴 Tier 3: HOTS / Real-world Application / Olympiad (2 questions)

For every question, provide:
1. Question statement and number.
2. Question type and marks.
3. Difficulty tier.
4. Correct answer with complete step-by-step worked solutions.
5. Explanation and teacher marking rubric guidance.

For worksheets: Provide a clean student-facing printable format with clear instructions, followed by a separate Teacher Answer Key.

#### D. QUESTION PAPER GENERATOR
When creating an examination paper, follow the blueprint:
- Total marks & duration.
- Chapters and topics covered.
- Section structure (Section A: MCQs, Section B: Short Answer, Section C: Long Answer, Section D: Case-based).
- Difficulty distribution (Easy, Moderate, HOTS).
- Internal choices where appropriate.
- Verify marks add up exactly to the total.
- Separate Marking Scheme and Answer Key.

#### E. AI ANSWER EVALUATION AND FEEDBACK (Active when mode is "evaluation" or requested)
When evaluating student responses:
1. Use the teacher-provided question, expected answer, marking scheme and rubric wherever available.
2. Identify correct concepts, partially correct reasoning and errors.
3. Award suggested marks according to the stated criteria.
4. Give credit for valid alternative answers and intermediate mathematical steps.
5. Avoid penalizing students solely for different wording.
6. Explain mistakes in a supportive, constructive and understandable manner.
7. Suggest a specific improvement or next step.
8. Flag ambiguous answers or cases requiring human judgment.

Provide feedback in this exact format:
- **What you did well:** (Identify the correct concepts or effective work)
- **What needs improvement:** (Explain the error or missing element)
- **How to improve:** (Give a clear, actionable suggestion)
- **Suggested marks:** (Show marks awarded and the maximum marks)
- **Practice recommendation:** (Suggest a relevant exercise if useful)

AI-generated marks must be treated as recommendations for teacher review. Never claim that an evaluation is infallible.

#### F. STUDENT DIFFERENTIATION
Adapt content to different learning needs without labeling or discouraging students:
- Foundation-level explanations and guided examples.
- Grade-level practice.
- Advanced application and reasoning tasks.
- Alternative explanations for difficult concepts.
- Step-by-step scaffolding.
- Additional practice for identified misconceptions.
- Extension activities for students who have mastered the topic.

#### G. TEACHER FEEDBACK AND COMMUNICATION
Help teachers write constructive, specific, respectful, encouraging and evidence-based feedback for assignments, projects, report cards and classroom participation.

### 5. LEARNING OBJECTIVES AND COGNITIVE LEVELS

When appropriate, design activities and questions across Bloom's Cognitive Levels:
- Remember: Recall facts and definitions.
- Understand: Explain ideas in one's own words.
- Apply: Use knowledge in familiar or new situations.
- Analyze: Identify relationships, patterns and differences.
- Evaluate: Justify conclusions using evidence.
- Create: Develop a solution, model, explanation or original product.

### 6. DIAGRAMS, IMAGES, TABLES AND GRAPHS

Use visual resources when they improve learning:
- Use clean Markdown tables for comparisons, classifications, place-value charts, and structured summaries.
- Label axes, units, legends and values correctly.
- Do NOT generate ASCII blackboard / chalkboard diagrams or board layout boxes. Focus on structured pedagogical tables and worked examples.

### 7. CONTENT FORMATTING (FOR LIVE TEACHING CANVAS & PRINT)

Generate content in clean, professional, ready-to-edit Markdown suitable for EduAshram's Live Teaching Canvas and print-ready classroom materials:
- Clear headings (#, ##, ###).
- Short paragraphs.
- Numbered steps for procedures.
- Bulleted lists for key points.
- Tables for structured information.
- Properly formatted equations and mathematical symbols.
- Consistent numbering for questions.
- Separate answer keys and marking schemes.
- Captions for diagrams and tables.

Avoid unnecessary repetition, excessively long introductions, and decorative clutter.

### 8. INTERACTIVE TEACHING SUPPORT

When helping a teacher prepare for a live class, provide:
- 5-Minute provocation hook / opening question.
- Socratic debate prompts and peer turn-and-talk questions.
- Demonstration instructions.
- 3-Minute exit ticket.
- Misconceptions to watch for in real-time.
- Suggest ways to use EduAshram's whiteboard, quizzes, worksheets and study material where relevant.

### 9. QUALITY CONTROL BEFORE RESPONDING

Before presenting any generated educational content, verify:
- The content matches ${grade} ${subject} (${board}).
- The explanation is factually and mathematically correct.
- Calculations, units, formulas, and answer keys are independently verified.
- MCQ options contain plausible distractors and exactly one correct answer.
- The tone is supportive, pedagogically sound, and age-appropriate.

### 10. RESPONSIBLE AND SAFE USE

Protect student privacy. Do not request unnecessary personal information.
Do not diagnose disorders or make derogatory judgments.
Keep the teacher in control of publishing lessons, assigning work, communicating feedback and finalizing grades.

### 11. RESPONSE BEHAVIOUR

1. Be professional, supportive and practical.
2. Provide the requested deliverable directly first, formatted for immediate editing in the Live Teaching Canvas.
3. Make generated content editable and easy to reuse.
4. Separate student-facing content from teacher-only notes, answers and marking guidance.
5. Treat the teacher as the final decision-maker.
6. CRITICAL RULE: NEVER generate or include any "Blackboard / Whiteboard Layout" or ASCII chalkboard diagrams anywhere in the output. Focus strictly on conceptual explanations, step-by-step worked solutions, and practice exercises.

### 12. FINAL OBJECTIVE

Your goal is to reduce teachers' preparation time while improving the quality, accuracy, engagement and effectiveness of teaching.
Always prioritize educational accuracy, student understanding, teacher control and practical classroom usefulness.`;
}

async function generateAITeachingAssistance(data: z.infer<typeof aiTeachingAssistantInput>) {
  const customKey = data.apiKey?.trim();
  let selectedProvider = data.provider || 'auto';

  // Smart provider auto-detection if teacher's key format is unambiguous
  if (customKey) {
    if (customKey.startsWith('AIza')) {
      selectedProvider = 'gemini';
    } else if (customKey.startsWith('sk-')) {
      if (selectedProvider !== 'deepseek') {
        selectedProvider = 'openai';
      }
    }
  }

  const geminiKey = selectedProvider === 'gemini'
    ? (customKey?.startsWith('AIza') ? customKey : process.env.GEMINI_API_KEY)
    : (selectedProvider === 'auto' ? (customKey?.startsWith('AIza') ? customKey : process.env.GEMINI_API_KEY) : undefined);

  const openaiKey = selectedProvider === 'openai'
    ? (customKey?.startsWith('sk-') ? customKey : (process.env.OPENAI_API_KEY || customKey))
    : (selectedProvider === 'auto' ? (customKey?.startsWith('sk-') ? customKey : process.env.OPENAI_API_KEY) : undefined);

  const deepseekKey = selectedProvider === 'deepseek'
    ? (customKey || process.env.DEEPSEEK_API_KEY)
    : undefined;

  const systemRole = buildEduAshramAITeachingAssistantPrompt(data);

  const conversationMessages = [
    { role: 'system', content: systemRole },
    ...data.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  if (selectedProvider === 'openai' || (selectedProvider === 'auto' && openaiKey)) {
    if (!openaiKey) throw new Error('ChatGPT (OpenAI) API Key is missing. Configure it in Settings > AI Settings.');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
      }),
    });
    const jsonResult: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`OpenAI Error: ${jsonResult?.error?.message ?? response.statusText}`);
    }
    const content = jsonResult.choices?.[0]?.message?.content;
    if (content) return { reply: content };
    throw new Error('ChatGPT returned an empty response.');
  }

  if (selectedProvider === 'deepseek' || (selectedProvider === 'auto' && deepseekKey && !openaiKey)) {
    if (!deepseekKey) throw new Error('DeepSeek API Key is missing. Configure it in Settings > AI Settings.');
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: conversationMessages,
      }),
    });
    const jsonResult: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`DeepSeek Error: ${jsonResult?.error?.message ?? response.statusText}`);
    }
    const content = jsonResult.choices?.[0]?.message?.content;
    if (content) return { reply: content };
    throw new Error('DeepSeek returned an empty response.');
  }

  if (selectedProvider === 'gemini' || (selectedProvider === 'auto' && geminiKey && !openaiKey && !deepseekKey)) {
    if (!geminiKey) throw new Error('Google Gemini API Key is missing. Configure it in Settings > AI Settings.');
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
    ];
    let lastError = '';

    const contents = data.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (contents.length > 0 && contents[0].role === 'user') {
      contents[0].parts[0].text = `${systemRole}\n\nTeacher Request:\n${contents[0].parts[0].text}`;
    } else {
      contents.unshift({
        role: 'user',
        parts: [{ text: `${systemRole}\n\nPlease greet the teacher and ask what topic they would like to prepare.` }],
      });
    }

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        });
        const jsonResult: any = await response.json().catch(() => ({}));
        if (!response.ok) {
          lastError = jsonResult?.error?.message ?? response.statusText;
          if (lastError.includes('not found') || lastError.includes('no longer available') || response.status === 404) continue;
          throw new Error(`Google Gemini Error: ${lastError}`);
        }
        const textOutput = jsonResult.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) return { reply: textOutput };
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('Google Gemini Error:')) throw err;
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    throw new Error(`Google Gemini Error: ${lastError || 'No supported Gemini model found for your key.'}`);
  }

  return {
    reply: `# 📘 Lesson Plan Preview: ${data.topic || 'Fundamental Concepts'} (${data.grade || 'Grade 8'} ${data.subject || 'Mathematics'})\n\n## 🎯 Learning Objectives (NEP 2026 Aligned)\n- **Recall & Identify:** Students will define core terms and recognize standard notation.\n- **Understand & Explain:** Students will articulate the conceptual logic behind ${data.topic || 'the topic'}.\n- **Apply & Solve:** Students will independently solve foundational and application-based word problems.\n\n## 💡 5-Minute Class Hook\n*Start with this question on the board:* "If you double your speed, does it take half the time or double the time?" Invite quick partner discussions before formal definitions.\n\n## 🧭 45-Minute Lesson Flow\n- **Phase 1: Direct Instruction (10 mins):** Introduce key formulas and graphical mental models.\n- **Phase 2: Guided Practice (15 mins):** Solve 2 collaborative problems on the board with student participation.\n- **Phase 3: Differentiated Practice (15 mins):** Distribute 3 difficulty levels (Foundation, Standard, HOTS).\n- **Phase 4: Exit Ticket (5 mins):** 1 diagnostic question to check understanding before the bell rings.\n\n*Note: To generate dynamic live AI responses tailored to any topic, configure your Gemini, OpenAI, or DeepSeek API key in Settings > AI Settings.*`,
  };
}

app.post('/api/ai/teaching-assistant', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = parse(aiTeachingAssistantInput, req.body);

    // Require Chapter / Topic to be mentioned before generating educational content
    const cleanTopic = (data.topic || '').trim();
    if (!cleanTopic) {
      return res.json({
        reply: `👋 **EduAshram AI Teaching Assistant**\n\nPlease mention the **Chapter or Topic** for **${data.grade || 'your class'} ${data.subject || ''}** to begin.\n\nContent generation will start as soon as a chapter or topic is specified!`,
      });
    }

    // Load teacher's own saved apiKey from database if not supplied
    if (!data.apiKey && req.session?.id) {
      const teacher = await db.teacher.findUnique({ where: { id: req.session.id }, select: { apiKey: true } });
      if (teacher?.apiKey) {
        data.apiKey = teacher.apiKey;
      }
    }

    const result = await generateAITeachingAssistance(data);
    res.json(result);
  } catch (error) { errorResponse(res, error); }
});

app.get('/api/quizzes', adminOnly, async (req: AuthRequest, res: Response) => {
  const teacherId = req.session!.id;
  const where: any = req.session?.role === 'superadmin' ? {} : { teacherId };
  const quizzes = await prisma.quiz.findMany({ where, orderBy: { updatedAt: 'desc' }, include: { questions: { orderBy: { position: 'asc' }, include: { options: { orderBy: { position: 'asc' } } } }, _count: { select: { questions: true, attempts: true } } } });
  res.json({ quizzes });
});

app.post('/api/quizzes', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = parse(quizInput, req.body);
    const teacherId = req.session!.id;
    const quiz = await prisma.$transaction(async (tx) => {
      const createdQuiz = await (tx as any).quiz.create({
        data: {
          title: data.title,
          grade: data.grade || null,
          mode: data.mode as QuizMode,
          timeLimitSeconds: data.timeLimitSeconds ?? null,
          showResults: data.showResults,
          teacherId,
        },
      });

      if (data.questions.length > 0) {
        const createdQuestions = await tx.question.createManyAndReturn({
          data: data.questions.map((question, position) => ({
            quizId: createdQuiz.id,
            prompt: question.prompt,
            marks: question.marks,
            imageUrl: question.imageUrl ?? null,
            type: question.type ?? 'MCQ',
            position,
          })),
          select: { id: true, position: true },
        });

        const allOptions = createdQuestions.flatMap((createdQ) => {
          const originalQ = data.questions[createdQ.position];
          return (originalQ?.options ?? []).map((option, optionPosition) => ({
            questionId: createdQ.id,
            position: optionPosition,
            text: option.text,
            isCorrect: option.isCorrect,
          }));
        });

        if (allOptions.length > 0) {
          await tx.option.createMany({
            data: allOptions,
          });
        }
      }

      return createdQuiz;
    }, { timeout: 60000, maxWait: 20000 });
    res.status(201).json({ quiz });
  } catch (error) { errorResponse(res, error); }
});
app.get('/api/quizzes/:id/detail', adminOnly, async (req: Request, res: Response) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: parse(objectId, req.params.id) }, include: { questions: { orderBy: { position: 'asc' }, include: { options: { orderBy: { position: 'asc' } } } } } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    res.json({ quiz });
  } catch (error) { errorResponse(res, error); }
});
app.put('/api/quizzes/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const data = parse(quizInput, req.body);
    const existing = await prisma.quiz.findUnique({ where: { id }, include: { _count: { select: { attempts: true } } } });
    if (!existing) return res.status(404).json({ error: 'Quiz not found.' });
    if (existing.status === 'ACTIVE') return res.status(409).json({ error: 'Please stop or close the active quiz before editing.' });
    await prisma.$transaction(async (tx) => {
      if (existing._count.attempts > 0) {
        const attempts = await tx.attempt.findMany({ where: { quizId: id }, select: { id: true } });
        const attemptIds = attempts.map((attempt) => attempt.id);
        if (attemptIds.length > 0) {
          await tx.answer.deleteMany({ where: { attemptId: { in: attemptIds } } });
          await tx.attempt.deleteMany({ where: { quizId: id } });
        }
      }

      // Delete existing questions (and cascaded options)
      await tx.question.deleteMany({ where: { quizId: id } });

      // Update quiz metadata without heavy nested writes
      await (tx.quiz as any).update({
        where: { id },
        data: {
          title: data.title,
          grade: data.grade || null,
          mode: data.mode as QuizMode,
          timeLimitSeconds: data.timeLimitSeconds ?? null,
          showResults: data.showResults,
          currentQuestionIndex: 0,
          currentAnswerRevealed: false,
        },
      });

      // Bulk insert questions in a single query
      if (data.questions.length > 0) {
        const createdQuestions = await tx.question.createManyAndReturn({
          data: data.questions.map((question, position) => ({
            quizId: id,
            prompt: question.prompt,
            marks: question.marks,
            imageUrl: question.imageUrl ?? null,
            type: question.type ?? 'MCQ',
            position,
          })),
          select: { id: true, position: true },
        });

        // Bulk insert all options across questions in a single query
        const allOptions = createdQuestions.flatMap((createdQ) => {
          const originalQ = data.questions[createdQ.position];
          return (originalQ?.options ?? []).map((option, optionPosition) => ({
            questionId: createdQ.id,
            position: optionPosition,
            text: option.text,
            isCorrect: option.isCorrect,
          }));
        });

        if (allOptions.length > 0) {
          await tx.option.createMany({
            data: allOptions,
          });
        }
      }
    }, { timeout: 60000, maxWait: 20000 });
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});

app.patch('/api/quizzes/:id/mode', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const { mode, timeLimitSeconds } = parse(z.object({
      mode: z.enum(['LIVE', 'SELF_PACED']),
      timeLimitSeconds: z.number().int().nullable().optional(),
    }), req.body);

    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    await prisma.quiz.update({
      where: { id },
      data: {
        mode: mode as QuizMode,
        timeLimitSeconds: timeLimitSeconds !== undefined ? timeLimitSeconds : quiz.timeLimitSeconds,
      }
    });

    res.json({ ok: true });
    void publishQuizState(id);
  } catch (error) { errorResponse(res, error); }
});
app.delete('/api/quizzes/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: { select: { marks: true } },
        attempts: { where: { status: 'SUBMITTED', score: { not: null } } }
      }
    });
    if (quiz) {
      const totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      for (const a of quiz.attempts) {
        await recordScoreRecord({
          studentId: a.studentId,
          teacherId: quiz.teacherId,
          title: quiz.title,
          itemType: 'QUIZ',
          score: a.score,
          totalMarks,
          grade: quiz.grade,
          completedAt: a.submittedAt || new Date(),
          quizId: quiz.id,
        });
      }
    }
    clearQuizTimer(id);
    await prisma.quiz.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});
app.patch('/api/quizzes/:id/status', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const { action } = parse(z.object({ action: z.enum(['start', 'stop', 'reopen']) }), req.body);
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    if (action === 'start') {
      if (quiz.mode !== 'SELF_PACED') return res.status(400).json({ error: 'Use live controls for a classroom quiz.' });
      if (quiz.status !== 'DRAFT') return res.status(409).json({ error: 'Only a draft quiz can be opened.' });
      await prisma.quiz.update({ where: { id }, data: { status: 'ACTIVE' } });
    } else if (action === 'stop') {
      clearQuizTimer(id);
      await prisma.quiz.update({ where: { id }, data: { status: 'CLOSED' } });
      const attempts = await prisma.attempt.findMany({ where: { quizId: id, status: 'IN_PROGRESS' }, select: { id: true } });
      for (const attempt of attempts) await scoreAttempt(attempt.id);
    } else if (action === 'reopen') {
      clearQuizTimer(id);
      await prisma.quiz.update({ where: { id }, data: { status: 'DRAFT', currentQuestionIndex: 0, currentAnswerRevealed: false } });
    }

    res.json({ ok: true });
    void publishQuizState(id);
  } catch (error) { errorResponse(res, error); }
});
app.patch('/api/quizzes/:id/control', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const { action, seconds } = parse(z.object({
      action: z.enum(['start', 'next', 'reveal', 'stop', 'pause_timer', 'resume_timer', 'set_timer', 'add_time']),
      seconds: z.number().int().min(0).max(600).nullable().optional(),
    }), req.body);
    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { _count: { select: { questions: true } } } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    if (quiz.mode !== 'LIVE') return res.status(400).json({ error: 'Only live quizzes have teacher controls.' });

    if (action === 'pause_timer') {
      const t = liveQuizTimers.get(id);
      if (t) {
        t.isPaused = true;
        broadcastTimerState(id);
      }
      return res.json({ ok: true, isPaused: true });
    } else if (action === 'resume_timer') {
      const t = liveQuizTimers.get(id);
      if (t) {
        t.isPaused = false;
        broadcastTimerState(id);
        scheduleNextTimerTick(id, 1000);
      }
      return res.json({ ok: true, isPaused: false });
    } else if (action === 'add_time') {
      const t = liveQuizTimers.get(id);
      if (t && t.phase === 'question') {
        const extra = seconds || 10;
        t.remainingSeconds += extra;
        t.durationSeconds = Math.max(t.durationSeconds, t.remainingSeconds);
        broadcastTimerState(id);
      }
      return res.json({ ok: true });
    } else if (action === 'set_timer') {
      const newSeconds = seconds && seconds > 0 ? seconds : null;
      await prisma.quiz.update({ where: { id }, data: { timeLimitSeconds: newSeconds } });
      if (newSeconds && newSeconds > 0) {
        if (quiz.status === 'ACTIVE') {
          startQuizTimerForQuestion(id, newSeconds);
        }
      } else {
        clearQuizTimer(id);
        broadcastTimerState(id);
      }
      void publishQuizState(id);
      return res.json({ ok: true, timeLimitSeconds: newSeconds });
    } else if (action === 'start') {
      if (quiz.status !== 'DRAFT') return res.status(409).json({ error: 'Only a draft quiz can be started.' });
      await prisma.quiz.update({ where: { id }, data: { status: 'ACTIVE', currentQuestionIndex: 0, currentAnswerRevealed: false } });
      if (quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0) {
        startQuizTimerForQuestion(id, quiz.timeLimitSeconds);
      } else {
        clearQuizTimer(id);
      }
    } else if (action === 'next') {
      if (quiz.status !== 'ACTIVE') return res.status(409).json({ error: 'This quiz is not active.' });
      const nextIndex = quiz.currentQuestionIndex + 1;
      if (nextIndex >= quiz._count.questions) {
        clearQuizTimer(id);
        await prisma.quiz.update({ where: { id }, data: { status: 'CLOSED' } });
        const attempts = await prisma.attempt.findMany({ where: { quizId: id, status: 'IN_PROGRESS' }, select: { id: true } });
        for (const attempt of attempts) await scoreAttempt(attempt.id);
      } else {
        await prisma.quiz.update({ where: { id }, data: { currentQuestionIndex: nextIndex, currentAnswerRevealed: false } });
        if (quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0) {
          startQuizTimerForQuestion(id, quiz.timeLimitSeconds);
        } else {
          clearQuizTimer(id);
        }
      }
    } else if (action === 'reveal') {
      if (quiz.status !== 'ACTIVE') return res.status(409).json({ error: 'This quiz is not active.' });
      const t = liveQuizTimers.get(id);
      if (t && t.durationSeconds > 0) {
        void executeAnswerRevealAndGapSequence(id);
      } else {
        await prisma.quiz.update({ where: { id }, data: { currentAnswerRevealed: true } });
        void publishQuizState(id);
      }
      return res.json({ ok: true });
    } else {
      clearQuizTimer(id);
      await prisma.quiz.update({ where: { id }, data: { status: 'CLOSED' } });
      const attempts = await prisma.attempt.findMany({ where: { quizId: id, status: 'IN_PROGRESS' }, select: { id: true } });
      for (const attempt of attempts) await scoreAttempt(attempt.id);
    }
    res.json({ ok: true });
    void publishQuizState(id);
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/quizzes/:id/restart', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    clearQuizTimer(id);

    await prisma.$transaction(async (tx) => {
      // Find ONLY unsubmitted attempts (IN_PROGRESS).
      // Completed student submissions (status: 'SUBMITTED') must remain untouched and preserved!
      const unsubmittedAttempts = await tx.attempt.findMany({
        where: { quizId: id, status: 'IN_PROGRESS' },
        select: { id: true, status: true },
      });
      const attemptIds = unsubmittedAttempts
        .filter((attempt) => attempt.status === 'IN_PROGRESS')
        .map((attempt) => attempt.id);

      if (attemptIds.length > 0) {
        await tx.answer.deleteMany({ where: { attemptId: { in: attemptIds } } });
        await tx.attempt.deleteMany({ where: { id: { in: attemptIds } } });
      }
      await tx.quiz.update({
        where: { id },
        data: {
          status: 'DRAFT',
          currentQuestionIndex: 0,
          currentAnswerRevealed: false,
        },
      });
    }, { timeout: 30000, maxWait: 10000 });

    await publishQuizState(id);
    io.to(`students:${id}`).emit('quiz:restarted', { quizId: id });
    io.to('students:lobby').emit('quiz:lobby_updated');
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});

function generateShortPasskey(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

app.get('/api/students', adminOnly, async (req: AuthRequest, res: Response) => {
  const teacherId = req.session!.id;
  const where: any = req.session?.role === 'superadmin' ? {} : { teacherId };
  const students: any[] = await (prisma.student as any).findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      grade: true,
      passkey: true,
      parentPhone: true,
      parentName: true,
      active: true,
      joiningDate: true,
      createdAt: true,
      _count: { select: { attempts: true } }
    }
  });
  for (const student of students) {
    if (!student.passkey) {
      const passkey = generateShortPasskey();
      await (prisma.student as any).update({
        where: { id: student.id },
        data: { passkey, passkeyHash: await bcrypt.hash(passkey, 12), passkeyLookup: passkeyLookup(passkey) },
      });
      student.passkey = passkey;
    }
  }
  res.json({ students });
});
app.post('/api/students', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = parse(z.object({
      name: z.string().trim().min(1).max(100),
      grade: z.string().trim().min(1).max(50).optional().default('Grade 6'),
      joiningDate: z.string().optional(),
      parentPhone: z.string().trim().max(30).optional().nullable(),
      parentName: z.string().trim().max(100).optional().nullable(),
    }), req.body);
    const passkey = generateShortPasskey();
    const teacherId = req.session!.id;
    const joiningDate = data.joiningDate ? new Date(data.joiningDate) : new Date();
    const student = await (prisma.student as any).create({
      data: {
        name: data.name,
        grade: data.grade || 'Grade 6',
        joiningDate,
        passkey,
        passkeyHash: await bcrypt.hash(passkey, 12),
        passkeyLookup: passkeyLookup(passkey),
        teacherId,
        parentPhone: data.parentPhone ? data.parentPhone.trim() : null,
        parentName: data.parentName ? data.parentName.trim() : null,
      },
      select: { id: true, name: true, grade: true, passkey: true, parentPhone: true, parentName: true, active: true, joiningDate: true, createdAt: true }
    });
    res.status(201).json({ student, passkey });
  } catch (error) { errorResponse(res, error); }
});
app.patch('/api/students/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const data = parse(z.object({
      active: z.boolean().optional(),
      name: z.string().trim().min(1).max(100).optional(),
      grade: z.string().trim().min(1).max(50).optional(),
      joiningDate: z.string().optional().nullable(),
      parentPhone: z.string().trim().max(30).optional().nullable(),
      parentName: z.string().trim().max(100).optional().nullable(),
      resetPasskey: z.boolean().optional(),
    }), req.body);
    const passkey = data.resetPasskey ? generateShortPasskey() : null;
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing || (req.session?.role !== 'superadmin' && (existing as any).teacherId !== req.session!.id)) {
      return res.status(404).json({ error: 'Student not found in your classroom.' });
    }
    const student = await (prisma.student as any).update({
      where: { id },
      data: {
        active: data.active,
        name: data.name,
        grade: data.grade,
        ...(data.joiningDate !== undefined ? { joiningDate: data.joiningDate ? new Date(data.joiningDate) : null } : {}),
        ...(data.parentPhone !== undefined ? { parentPhone: data.parentPhone ? data.parentPhone.trim() : null } : {}),
        ...(data.parentName !== undefined ? { parentName: data.parentName ? data.parentName.trim() : null } : {}),
        ...(passkey ? { passkey, passkeyHash: await bcrypt.hash(passkey, 12), passkeyLookup: passkeyLookup(passkey) } : {})
      },
      select: { id: true, name: true, grade: true, passkey: true, parentPhone: true, parentName: true, active: true, joiningDate: true, createdAt: true }
    });
    invalidateProgressCache(id);
    res.json({ student, ...(passkey ? { passkey } : {}) });
  } catch (error) { errorResponse(res, error); }
});
app.delete('/api/students/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing || (req.session?.role !== 'superadmin' && (existing as any).teacherId !== req.session!.id)) {
      return res.status(404).json({ error: 'Student not found in your classroom.' });
    }
    await prisma.student.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});
app.get('/api/quizzes/:id/results', adminOnly, async (req: Request, res: Response) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: parse(objectId, req.params.id) }, include: { questions: { orderBy: { position: 'asc' }, include: { options: { orderBy: { position: 'asc' } } } }, attempts: { include: { student: { select: { id: true, name: true, parentPhone: true, parentName: true } as any }, answers: { include: { question: true, option: true } } }, orderBy: { startedAt: 'asc' } } } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    const totalMarks = quiz.questions.reduce((sum, question) => sum + question.marks, 0);
    const results = quiz.attempts.map((attempt: any) => ({ id: attempt.id, studentId: attempt.studentId, name: attempt.student?.name || 'Student', parentPhone: attempt.student?.parentPhone || null, parentName: attempt.student?.parentName || null, status: attempt.status, startedAt: attempt.startedAt, submittedAt: attempt.submittedAt, score: attempt.score, totalMarks, answers: attempt.answers.map((answer: any) => ({ questionId: answer.questionId, question: answer.question.prompt, response: answer.option.text, correct: answer.option.isCorrect, marks: answer.question.marks })) }));
    const distribution = quiz.questions.map((question) => ({ question: question.prompt, options: question.options.map((option) => ({ text: option.text, correct: option.isCorrect, count: quiz.attempts.reduce((count, attempt) => count + attempt.answers.filter((answer) => answer.optionId === option.id).length, 0) })) }));
    res.json({ quiz: { id: quiz.id, title: quiz.title, mode: quiz.mode, status: quiz.status }, results, distribution });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/quizzes/:quizId/attempts/:attemptId/reset', adminOnly, async (req: Request, res: Response) => {
  try {
    const quizId = parse(objectId, req.params.quizId);
    const attemptId = parse(objectId, req.params.attemptId);

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        student: { select: { id: true, name: true } },
        quiz: { select: { id: true, title: true } },
      },
    });

    if (!attempt || attempt.quizId !== quizId) {
      return res.status(404).json({ error: 'Quiz attempt not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { attemptId } });
      await tx.attempt.delete({ where: { id: attemptId } });
    });

    void publishQuizState(quizId);
    io.to('students:lobby').emit('quiz:lobby_updated');
    io.to('students:lobby').to(`students:${quizId}`).emit('quiz:attempt_reset', {
      quizId,
      studentId: attempt.student.id,
      studentName: attempt.student.name,
    });

    res.json({
      ok: true,
      message: `Quiz attempt for ${attempt.student.name} has been reset. They can now retry the quiz.`
    });
  } catch (error) { errorResponse(res, error); }
});

app.get('/api/student/quizzes', studentOnly, async (req: AuthRequest, res: Response) => {
  const studentId = req.session!.id;
  const student: any = await (prisma as any).student.findUnique({ where: { id: studentId }, select: { teacherId: true, grade: true } });
  const teacherFilter: any = student?.teacherId ? { teacherId: student.teacherId } : {};
  const studentGrade = student?.grade || 'Grade 6';
  const gradeVariants = getGradeVariants(studentGrade);

  const quizzes = await (prisma.quiz as any).findMany({
    where: {
      ...teacherFilter,
      AND: [
        {
          OR: [
            { grade: null },
            { grade: '' },
            { grade: 'All Grades' },
            { grade: { in: gradeVariants } },
          ]
        },
        {
          OR: [
            { status: 'ACTIVE' },
            { attempts: { some: { studentId } } },
          ]
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: {
      questions: { select: { marks: true } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId }, select: { status: true, deadlineAt: true, score: true, submittedAt: true } }
    }
  });
  res.json({
    quizzes: quizzes.map((quiz: any) => {
      const totalMarks = quiz.questions.reduce((sum: number, q: any) => sum + q.marks, 0);
      return {
        id: quiz.id,
        title: quiz.title,
        grade: quiz.grade,
        mode: quiz.mode,
        status: quiz.status,
        timeLimitSeconds: quiz.timeLimitSeconds,
        questionCount: quiz._count.questions,
        totalMarks,
        attempt: quiz.attempts[0] ?? null
      };
    })
  });
});
app.get('/api/student/quizzes/:id', studentOnly, async (req: AuthRequest, res: Response) => {
  try {
    const id = parse(objectId, req.params.id);
    const quiz: any = await (prisma.quiz as any).findUnique({ where: { id }, select: { id: true, status: true, mode: true, timeLimitSeconds: true, grade: true } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    const student: any = await (prisma.student as any).findUnique({ where: { id: req.session!.id }, select: { grade: true } });
    const studentGrade = student?.grade || 'Grade 6';
    if (quiz.grade && !gradesMatch(quiz.grade, studentGrade)) {
      return res.status(403).json({ error: `This quiz is assigned for ${quiz.grade} students only.` });
    }

    let attempt = await prisma.attempt.findUnique({ where: { quizId_studentId: { quizId: id, studentId: req.session!.id } } });
    if (!attempt && quiz.status === 'ACTIVE') {
      const now = new Date();
      attempt = await prisma.attempt.upsert({
        where: { quizId_studentId: { quizId: id, studentId: req.session!.id } },
        update: {},
        create: { quizId: id, studentId: req.session!.id, deadlineAt: (quiz.mode === 'SELF_PACED' && quiz.timeLimitSeconds !== null) ? new Date(now.getTime() + quiz.timeLimitSeconds * 1000) : null },
      });
    }
    const state = await studentQuizState(id, req.session!.id);
    if (!state) return res.status(404).json({ error: 'Quiz details not found.' });
    res.json({ quiz: state });
  } catch (error) { errorResponse(res, error); }
});
app.put('/api/student/quizzes/:id/answers', studentOnly, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parse(objectId, req.params.id);
    const { questionId, optionId } = parse(z.object({ questionId: objectId, optionId: objectId }), req.body);
    const [quiz, attempt, option] = await Promise.all([
      prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true, status: true, mode: true, currentQuestionIndex: true, currentAnswerRevealed: true } }),
      prisma.attempt.findUnique({ where: { quizId_studentId: { quizId, studentId: req.session!.id } }, select: { id: true, status: true } }),
      prisma.option.findUnique({ where: { id: optionId }, select: { id: true, questionId: true } }),
    ]);
    if (!quiz || !attempt || attempt.status !== 'IN_PROGRESS' || quiz.status !== 'ACTIVE') return res.status(409).json({ error: 'This quiz is no longer accepting answers.' });
    if (!option || option.questionId !== questionId) return res.status(400).json({ error: 'That answer does not belong to this question.' });
    if (quiz.mode === 'LIVE' && quiz.currentAnswerRevealed) return res.status(409).json({ error: 'The live question has been revealed.' });
    await prisma.answer.upsert({ where: { attemptId_questionId: { attemptId: attempt.id, questionId } }, create: { attemptId: attempt.id, questionId, optionId }, update: { optionId } });
    res.json({ ok: true });
    if (quiz.mode === 'LIVE') void publishQuizState(quizId);
  } catch (error) { errorResponse(res, error); }
});
app.post('/api/student/quizzes/:id/submit', studentOnly, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = parse(objectId, req.params.id);
    const attempt = await prisma.attempt.findUnique({ where: { quizId_studentId: { quizId, studentId: req.session!.id } } });
    if (!attempt) return res.status(404).json({ error: 'Quiz attempt not found.' });
    const submitted = attempt.status === 'SUBMITTED' ? attempt : await scoreAttempt(attempt.id);
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { showResults: true } });
    res.json({ submitted: true, score: quiz?.showResults ? submitted?.score : null });
  } catch (error) { errorResponse(res, error); }
});

io.use(async (socket, next) => {
  const cookie = socket.handshake.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookie}=`));
  try {
    const token = cookie?.slice(sessionCookie.length + 1) ?? '';
    const payload = jwt.verify(token, secret) as JwtPayload & Session;
    if (!payload.id || (!['admin', 'teacher', 'superadmin', 'student'].includes(payload.role))) return next(new Error('Unauthorized'));
    if (payload.role === 'student' && !(await prisma.student.findFirst({ where: { id: payload.id, active: true }, select: { id: true } }))) return next(new Error('Unauthorized'));
    socket.data.session = { id: payload.id, role: payload.role } satisfies Session;
    next();
  } catch { next(new Error('Unauthorized')); }
});

export interface LiveWhiteboardSession {
  teacherId: string;
  broadcasterSocketId?: string;
  teacherName: string;
  grade: string;
  isLive: boolean;
  activePageIndex: number;
  pages: any[];
  startedAt: number;
  viewers: Set<string>;
  viewerDetails: Map<string, { socketId: string; studentId: string; studentName: string; joinedAt: number }>;
  raisedHands: Map<string, { socketId: string; studentId: string; studentName: string; note?: string; timestamp: number }>;
  delegatedStudent: { socketId: string; studentId: string; studentName: string; permission: 'pointer' | 'chalk' } | null;
  reactions: Array<{ studentName: string; type: 'understood' | 'confused' | 'slower' | 'faster'; emoji?: string; label?: string; timestamp: number }>;
  scrollTop?: number;
  scrollRatio?: number;
  isPeriodicTableOpen?: boolean;
  periodicTableElementZ?: number;
}
const activeWhiteboardSessions = new Map<string, LiveWhiteboardSession>();
const whiteboardDisconnectTimers = new Map<string, NodeJS.Timeout>();
const studentDelegationRevokeTimers = new Map<string, NodeJS.Timeout>();

function broadcastDoubtsUpdate(sessionObj: LiveWhiteboardSession) {
  const doubtsList = Array.from(sessionObj.raisedHands.values());
  io.to(`whiteboard:teacher:${sessionObj.teacherId}`).emit('whiteboard:doubts_update', {
    doubts: doubtsList,
    count: doubtsList.length,
  });
}

function broadcastViewersUpdate(sessionObj: LiveWhiteboardSession) {
  const list = Array.from(sessionObj.viewerDetails.values());
  io.to(`whiteboard:teacher:${sessionObj.teacherId}`).emit('whiteboard:viewers_roster', {
    viewers: list,
    count: sessionObj.viewers.size,
  });
  io.to(`whiteboard:${sessionObj.grade}`).emit('whiteboard:viewer_count', { count: sessionObj.viewers.size });
  io.to(`whiteboard:teacher:${sessionObj.teacherId}`).emit('whiteboard:viewer_count', { count: sessionObj.viewers.size });
}

function broadcastSentimentUpdate(sessionObj: LiveWhiteboardSession) {
  const now = Date.now();
  sessionObj.reactions = sessionObj.reactions.filter((r) => now - r.timestamp < 60000);
  const total = sessionObj.reactions.length;
  let understood = 0;
  let confused = 0;
  let slower = 0;
  let faster = 0;
  for (const r of sessionObj.reactions) {
    if (r.type === 'understood') understood++;
    else if (r.type === 'confused') confused++;
    else if (r.type === 'slower') slower++;
    else if (r.type === 'faster') faster++;
  }
  const comprehensionRate = total > 0 ? Math.round((understood / total) * 100) : 100;
  io.to(`whiteboard:teacher:${sessionObj.teacherId}`).emit('whiteboard:sentiment_update', {
    total,
    totalCount: total,
    understood,
    positiveCount: understood,
    confused,
    questionCount: confused,
    slower,
    slowDownCount: slower,
    faster,
    speedUpCount: faster,
    comprehensionRate,
    recent: sessionObj.reactions.slice(-10),
  });
}

function findActiveWhiteboardSession(options: { grade?: string | null; teacherId?: string | null }): LiveWhiteboardSession | undefined {
  const { grade, teacherId } = options;

  // 1. If a specific student grade is provided, the session MUST match that grade (or be broadcast to 'ALL')
  if (grade && grade !== 'ALL' && grade.toLowerCase() !== 'all grades') {
    for (const sess of activeWhiteboardSessions.values()) {
      if (!sess.isLive) continue;
      const teacherMatches = !teacherId || sess.teacherId === teacherId;
      const gradeMatches = sess.grade === 'ALL' || sess.grade.toLowerCase() === 'all grades' || gradesMatch(sess.grade, grade);
      if (teacherMatches && gradeMatches) {
        return sess;
      }
    }
    return undefined;
  }

  // 2. If no grade restriction is requested (or 'ALL'), match by teacherId
  if (teacherId) {
    for (const sess of activeWhiteboardSessions.values()) {
      if (sess.teacherId === teacherId && sess.isLive) {
        return sess;
      }
    }
  }

  // 3. Fallback to global broadcast for 'ALL'
  const allSess = activeWhiteboardSessions.get('ALL');
  if (allSess && allSess.isLive) return allSess;

  return undefined;
}

io.on('connection', (socket) => {
  const session = socket.data.session as Session;
  if (session.role === 'student') {
    socket.join('students:lobby');
    prisma.student.findUnique({ where: { id: session.id }, select: { teacherId: true } })
      .then((st) => {
        if (st?.teacherId) {
          socket.join(`chat:${st.teacherId}:everyone`);
          socket.join(`chat:${st.teacherId}:direct:${session.id}`);
        }

        // If student had a pending disconnect timer (e.g. refreshed the page), cancel it
        if (studentDisconnectTimers.has(session.id)) {
          clearTimeout(studentDisconnectTimers.get(session.id)!);
          studentDisconnectTimers.delete(session.id);
          console.log(`Student ${session.id} reconnected; cancelled chat auto-clear timer.`);
        }

        let sockSet = activeStudentSockets.get(session.id);
        if (!sockSet) {
          sockSet = new Set();
          activeStudentSockets.set(session.id, sockSet);
        }
        sockSet.add(socket.id);

        socket.on('disconnect', () => {
          const set = activeStudentSockets.get(session.id);
          if (set) {
            set.delete(socket.id);
            if (set.size === 0) {
              activeStudentSockets.delete(session.id);
              // Wait 10 seconds before clearing chat to avoid wiping on page reload (F5)
              const timer = setTimeout(async () => {
                studentDisconnectTimers.delete(session.id);
                if (!activeStudentSockets.has(session.id)) {
                  console.log(`Student ${session.id} closed browser / disconnected. Auto-deleting student chats.`);
                  await clearStudentChatMessages(session.id);
                }
              }, 10000);
              studentDisconnectTimers.set(session.id, timer);
            }
          }
        });
      })
      .catch(() => { });
  } else if (session.role === 'teacher' || session.role === 'admin' || session.role === 'superadmin') {
    db.teacher.findUnique({ where: { id: session.id }, select: { id: true } })
      .then((t: any) => (t ? (t.id as string) : session.id))
      .then((teacherId: string) => {
        socket.join(`chat:${teacherId}:everyone`);
        socket.join(`chat:${teacherId}:teacher`);

        // If teacher had a pending disconnect timer (e.g. refreshed the page), cancel it
        if (teacherDisconnectTimers.has(teacherId)) {
          clearTimeout(teacherDisconnectTimers.get(teacherId)!);
          teacherDisconnectTimers.delete(teacherId);
          console.log(`Teacher ${teacherId} reconnected; cancelled chat auto-clear timer.`);
        }

        let sockSet = activeTeacherSockets.get(teacherId);
        if (!sockSet) {
          sockSet = new Set();
          activeTeacherSockets.set(teacherId, sockSet);
        }
        sockSet.add(socket.id);

        socket.on('disconnect', () => {
          const set = activeTeacherSockets.get(teacherId);
          if (set) {
            set.delete(socket.id);
            if (set.size === 0) {
              activeTeacherSockets.delete(teacherId);
              // Wait 10 seconds before clearing chat to avoid wiping on page reload (F5)
              const timer = setTimeout(async () => {
                teacherDisconnectTimers.delete(teacherId);
                if (!activeTeacherSockets.has(teacherId)) {
                  console.log(`Teacher ${teacherId} closed browser / disconnected. Auto-deleting classroom chats.`);
                  await clearTeacherChatMessages(teacherId);
                }
              }, 10000);
              teacherDisconnectTimers.set(teacherId, timer);
            }
          }
        });
      })
      .catch(() => { });
  }

  socket.on('chat:join_direct', (studentId: string) => {
    if (typeof studentId !== 'string') return;
    if (session.role === 'teacher' || session.role === 'admin' || session.role === 'superadmin') {
      db.teacher.findUnique({ where: { id: session.id }, select: { id: true } })
        .then((t: any) => (t ? (t.id as string) : session.id))
        .then((teacherId: string) => {
          socket.join(`chat:${teacherId}:direct:${studentId}`);
        })
        .catch(() => { });
    }
  });

  socket.on('watch:quiz', async (quizId: string) => {
    if (typeof quizId !== 'string') return;
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true, status: true } });
    if (!quiz) return;
    if (session.role === 'admin' || session.role === 'teacher' || session.role === 'superadmin') socket.join(`teachers:${quizId}`);
    else if (session.role === 'student') socket.join(`students:${quizId}`);
    await publishQuizState(quizId);
  });

  // --- LIVE WHITEBOARD BROADCAST SOCKET HANDLERS ---
  socket.on('whiteboard:start_broadcast', (data: { grade: string; pages: any[]; activePageIndex?: number; teacherName?: string }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();

    // Cancel any previous sessions and disconnect timers for this teacher
    for (const [g, sess] of activeWhiteboardSessions.entries()) {
      if (sess.teacherId === session.id) {
        activeWhiteboardSessions.delete(g);
        if (whiteboardDisconnectTimers.has(g)) {
          clearTimeout(whiteboardDisconnectTimers.get(g)!);
          whiteboardDisconnectTimers.delete(g);
        }
      }
    }
    if (whiteboardDisconnectTimers.has(grade)) {
      clearTimeout(whiteboardDisconnectTimers.get(grade)!);
      whiteboardDisconnectTimers.delete(grade);
    }

    const sessionObj: LiveWhiteboardSession = {
      teacherId: session.id,
      broadcasterSocketId: socket.id,
      teacherName: data.teacherName || 'Teacher',
      grade: grade,
      isLive: true,
      activePageIndex: typeof data.activePageIndex === 'number' ? data.activePageIndex : 0,
      pages: Array.isArray(data.pages) ? data.pages : [],
      startedAt: Date.now(),
      viewers: new Set(),
      viewerDetails: new Map(),
      raisedHands: new Map(),
      delegatedStudent: null,
      reactions: [],
    };
    activeWhiteboardSessions.set(grade, sessionObj);
    socket.join(`whiteboard:${grade}`);
    socket.join(`whiteboard:teacher:${session.id}`);
    for (const v of getGradeVariants(grade)) {
      socket.join(`whiteboard:${v}`);
    }

    io.emit('whiteboard:status_update', {
      grade: grade,
      teacherId: session.id,
      isLive: true,
      teacherName: sessionObj.teacherName
    });

    // Immediately push full pages state to all students in this grade, 'ALL', and teacher's room
    socket.to(`whiteboard:${grade}`).emit('whiteboard:full_sync', {
      pages: sessionObj.pages,
      activePageIndex: sessionObj.activePageIndex
    });
    if (grade !== 'ALL') {
      socket.to('whiteboard:ALL').emit('whiteboard:full_sync', {
        pages: sessionObj.pages,
        activePageIndex: sessionObj.activePageIndex
      });
    }
    socket.to(`whiteboard:teacher:${session.id}`).emit('whiteboard:full_sync', {
      pages: sessionObj.pages,
      activePageIndex: sessionObj.activePageIndex
    });
  });

  const findTeacherSession = (grade?: string): LiveWhiteboardSession | undefined => {
    for (const sess of activeWhiteboardSessions.values()) {
      if (sess.broadcasterSocketId === socket.id && sess.isLive) {
        return sess;
      }
    }
    if (grade) {
      const trimmed = grade.trim();
      const byGrade = activeWhiteboardSessions.get(trimmed);
      if (byGrade && byGrade.teacherId === session.id) return byGrade;
    }
    for (const sess of activeWhiteboardSessions.values()) {
      if (sess.teacherId === session.id && sess.isLive) {
        return sess;
      }
    }
    if (grade) {
      for (const sess of activeWhiteboardSessions.values()) {
        if (sess.isLive && (sess.teacherId === session.id || gradesMatch(sess.grade, grade))) {
          return sess;
        }
      }
    }
    const liveSessions = Array.from(activeWhiteboardSessions.values()).filter((s) => s.isLive);
    if (liveSessions.length === 1) {
      return liveSessions[0];
    }
    if (grade) {
      return activeWhiteboardSessions.get(grade.trim());
    }
    return activeWhiteboardSessions.get('ALL');
  };

  const getTeacherBroadcastRooms = (targetGrade: string): string[] => {
    const rooms = new Set<string>();
    rooms.add(`whiteboard:${targetGrade}`);
    if (targetGrade !== 'ALL') {
      rooms.add('whiteboard:ALL');
    }
    rooms.add(`whiteboard:teacher:${session.id}`);
    for (const v of getGradeVariants(targetGrade)) {
      rooms.add(`whiteboard:${v}`);
    }
    return Array.from(rooms);
  };

  socket.on('whiteboard:stop_broadcast', (data: { grade: string }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data?.grade || 'ALL').trim();
    if (whiteboardDisconnectTimers.has(grade)) {
      clearTimeout(whiteboardDisconnectTimers.get(grade)!);
      whiteboardDisconnectTimers.delete(grade);
    }
    activeWhiteboardSessions.delete(grade);
    for (const [g, sess] of activeWhiteboardSessions.entries()) {
      if (sess.teacherId === session.id) {
        activeWhiteboardSessions.delete(g);
        if (whiteboardDisconnectTimers.has(g)) {
          clearTimeout(whiteboardDisconnectTimers.get(g)!);
          whiteboardDisconnectTimers.delete(g);
        }
        if (studentDelegationRevokeTimers.has(sess.teacherId)) {
          clearTimeout(studentDelegationRevokeTimers.get(sess.teacherId)!);
          studentDelegationRevokeTimers.delete(sess.teacherId);
        }
      }
    }
    if (studentDelegationRevokeTimers.has(session.id)) {
      clearTimeout(studentDelegationRevokeTimers.get(session.id)!);
      studentDelegationRevokeTimers.delete(session.id);
    }
    io.to(getTeacherBroadcastRooms(grade)).emit('whiteboard:broadcast_stopped', { grade });
    io.emit('whiteboard:status_update', {
      grade: grade,
      teacherId: session.id,
      isLive: false
    });
  });

  socket.on('whiteboard:board_type', (data: { grade: string; boardType: string; pageIndex?: number }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active) {
      const pIndex = typeof data.pageIndex === 'number' ? data.pageIndex : active.activePageIndex;
      if (active.pages[pIndex]) {
        active.pages[pIndex].boardType = data.boardType;
      }
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:board_type', {
      boardType: data.boardType,
      pageIndex: data.pageIndex
    });
  });

  socket.on('whiteboard:stroke', (data: { grade: string; pageIndex: number; stroke: any }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active) {
      if (!active.pages[data.pageIndex]) {
        active.pages[data.pageIndex] = { strokes: [], shapes: [], texts: [], widgets: [] };
      }
      if (!active.pages[data.pageIndex].strokes) active.pages[data.pageIndex].strokes = [];
      active.pages[data.pageIndex].strokes.push(data.stroke);
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:stroke', {
      pageIndex: data.pageIndex,
      stroke: data.stroke
    });
  });

  socket.on('whiteboard:page_changed', (data: { grade: string; activePageIndex: number; boardType?: string }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active) {
      active.activePageIndex = data.activePageIndex;
      if (data.boardType && active.pages[data.activePageIndex]) {
        active.pages[data.activePageIndex].boardType = data.boardType;
      }
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:teacher_page_changed', {
      activePageIndex: data.activePageIndex,
      boardType: data.boardType
    });
  });

  socket.on('whiteboard:clear_page', (data: { grade: string; pageIndex: number }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    const pIdx = typeof data.pageIndex === 'number' ? data.pageIndex : 0;
    if (active && active.pages[pIdx]) {
      active.pages[pIdx].strokes = [];
      active.pages[pIdx].shapes = [];
      active.pages[pIdx].texts = [];
      if (Array.isArray(active.pages[pIdx].widgets)) {
        active.pages[pIdx].widgets = active.pages[pIdx].widgets.filter(
          (w: any) => w.type === 'clock' || w.type === 'timer' || w.type === 'stopwatch'
        );
      }
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:clear_page', {
      pageIndex: pIdx
    });
  });

  socket.on('whiteboard:grid', (data: { grade: string; pageIndex: number; gridVisible: boolean }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active && active.pages[data.pageIndex]) {
      active.pages[data.pageIndex].gridVisible = data.gridVisible;
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:grid', {
      pageIndex: data.pageIndex,
      gridVisible: data.gridVisible
    });
  });

  socket.on('whiteboard:graph', (data: { grade: string; pageIndex: number; graphVisible: boolean }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active && active.pages[data.pageIndex]) {
      active.pages[data.pageIndex].graphVisible = data.graphVisible;
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:graph', {
      pageIndex: data.pageIndex,
      graphVisible: data.graphVisible
    });
  });

  socket.on('whiteboard:full_sync', (data: { grade: string; pages: any[]; activePageIndex: number }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active) {
      active.pages = Array.isArray(data.pages) ? data.pages : [];
      active.activePageIndex = typeof data.activePageIndex === 'number' ? data.activePageIndex : 0;
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:full_sync', {
      pages: data.pages,
      activePageIndex: data.activePageIndex
    });
  });

  socket.on('whiteboard:page_update', (data: { grade: string; pageIndex: number; page: any }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    const pIdx = typeof data.pageIndex === 'number' ? data.pageIndex : 0;
    if (active) {
      if (!Array.isArray(active.pages)) active.pages = [];
      active.pages[pIdx] = data.page;
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:page_update', {
      pageIndex: pIdx,
      page: data.page
    });
  });

  socket.on('whiteboard:scroll', (data: { grade: string; pageIndex: number; scrollTop: number; scrollRatio?: number; zoom?: number }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active) {
      active.scrollTop = data.scrollTop;
      active.scrollRatio = data.scrollRatio;
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:scroll', {
      pageIndex: data.pageIndex,
      scrollTop: data.scrollTop,
      scrollRatio: data.scrollRatio,
      zoom: data.zoom
    });
  });

  socket.on('whiteboard:page_height', (data: { grade: string; pageIndex: number; height: number }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    if (active && active.pages[data.pageIndex]) {
      active.pages[data.pageIndex].height = data.height;
    }
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:page_height', {
      pageIndex: data.pageIndex,
      height: data.height
    });
  });

  socket.on('whiteboard:periodic_table_action', (data: { grade?: string; action: string; elementZ?: number }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    for (const sess of activeWhiteboardSessions.values()) {
      if (sess.teacherId === session.id) {
        sess.isPeriodicTableOpen = data.action === 'open';
        if (typeof data.elementZ === 'number') {
          sess.periodicTableElementZ = data.elementZ;
        }
      }
    }
    if (active) {
      active.isPeriodicTableOpen = data.action === 'open';
      if (typeof data.elementZ === 'number') {
        active.periodicTableElementZ = data.elementZ;
      }
    }
    const targetGrade = active?.grade || grade;
    const broadcastRooms = getTeacherBroadcastRooms(targetGrade);
    for (const r of broadcastRooms) {
      io.to(r).emit('whiteboard:periodic_table_action', data);
    }
    if (active && active.viewers) {
      for (const vId of active.viewers) {
        io.to(vId).emit('whiteboard:periodic_table_action', data);
      }
    }
    io.to('whiteboard:ALL').emit('whiteboard:periodic_table_action', data);
    if (grade && grade !== 'ALL') {
      io.to(`whiteboard:${grade}`).emit('whiteboard:periodic_table_action', data);
    }
  });

  socket.on('whiteboard:video_action', (data: { grade: string; pageIndex: number; action: string; widgetId?: string; currentTime?: number; playing?: boolean; [key: string]: any }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const grade = (data.grade || 'ALL').trim();
    const active = findTeacherSession(grade);
    const widgetId = data.widgetId || data.widget?.id;
    const pIdx = typeof data.pageIndex === 'number' ? data.pageIndex : 0;
    if (active) {
      if (!Array.isArray(active.pages)) active.pages = [];
      while (active.pages.length <= pIdx) {
        active.pages.push({ strokes: [], shapes: [], texts: [], widgets: [] });
      }
      const page = active.pages[pIdx];
      if (page) {
        if (!Array.isArray(page.widgets)) page.widgets = [];
        if (data.action === 'add' && data.widget) {
          const idx = page.widgets.findIndex((w: any) => w.id === (widgetId || data.widget.id));
          if (idx >= 0) {
            page.widgets[idx] = data.widget;
          } else {
            page.widgets.push(data.widget);
          }
        } else if (data.action === 'remove' && widgetId) {
          page.widgets = page.widgets.filter((w: any) => w.id !== widgetId);
        } else if ((data.action === 'move' || data.action === 'resize') && widgetId) {
          const w = page.widgets.find((item: any) => item.id === widgetId);
          if (w) {
            if (typeof data.x === 'number') w.x = data.x;
            if (typeof data.y === 'number') w.y = data.y;
            if (typeof data.w === 'number') w.w = data.w;
            if (typeof data.h === 'number') w.h = data.h;
          }
        } else if (widgetId) {
          active.pages.forEach((p: any) => {
            if (p && Array.isArray(p.widgets)) {
              const w = p.widgets.find((item: any) => item.id === widgetId);
              if (w) {
                if (data.action === 'play') w.playing = true;
                if (data.action === 'pause') w.playing = false;
                if (typeof data.currentTime === 'number') w.currentTime = data.currentTime;
                if (typeof data.playing === 'boolean') w.playing = data.playing;
              }
            }
          });
        }
      }
      if (data.action === 'remove' && widgetId) {
        active.pages.forEach((p: any) => {
          if (p && Array.isArray(p.widgets)) {
            p.widgets = p.widgets.filter((w: any) => w.id !== widgetId);
          }
        });
      }
    }
    const broadcastPayload = { ...data, widgetId, pageIndex: pIdx };
    const targetGrade = active?.grade || grade;
    socket.to(getTeacherBroadcastRooms(targetGrade)).emit('whiteboard:video_action', broadcastPayload);
  });

  socket.on('whiteboard:join', async (data: { grade?: string; teacherId?: string; studentName?: string; studentId?: string }) => {
    let studentTeacherId = data?.teacherId;
    let studentGrade = data?.grade;
    let studentName = data?.studentName;
    let studentId = data?.studentId || session.id;
    if (session.role === 'student' && (!studentGrade || !studentTeacherId || !studentName)) {
      try {
        const student = await db.student.findUnique({ where: { id: session.id }, select: { name: true, grade: true, teacherId: true } });
        if (student) {
          if (!studentGrade) studentGrade = student.grade || undefined;
          if (!studentTeacherId) studentTeacherId = student.teacherId || undefined;
          if (!studentName) studentName = student.name || undefined;
        }
      } catch (_) {}
    }

    const finalStudentName = studentName || (session.name && session.name !== 'Student' ? session.name : undefined) || 'Student';
    const grade = (studentGrade || 'ALL').trim();
    socket.join(`whiteboard:${grade}`);
    socket.join('whiteboard:ALL');
    for (const v of getGradeVariants(grade)) {
      socket.join(`whiteboard:${v}`);
    }

    const active = findActiveWhiteboardSession({ grade: studentGrade, teacherId: studentTeacherId });

    if (active && active.isLive) {
      active.viewers.add(socket.id);
      active.viewerDetails.set(socket.id, {
        socketId: socket.id,
        studentId: studentId,
        studentName: finalStudentName,
        joinedAt: Date.now(),
      });
      socket.join(`whiteboard:${active.grade}`);
      for (const v of getGradeVariants(active.grade)) {
        socket.join(`whiteboard:${v}`);
      }

      // If this student was delegated, rebind their new socketId and cancel disconnect timer
      if (
        active.delegatedStudent &&
        ((active.delegatedStudent.studentId && studentId && active.delegatedStudent.studentId === studentId) ||
          (active.delegatedStudent.studentName && active.delegatedStudent.studentName.trim().toLowerCase() === finalStudentName.trim().toLowerCase()))
      ) {
        active.delegatedStudent.socketId = socket.id;
        if (studentDelegationRevokeTimers.has(active.teacherId)) {
          clearTimeout(studentDelegationRevokeTimers.get(active.teacherId)!);
          studentDelegationRevokeTimers.delete(active.teacherId);
        }
      }

      socket.emit('whiteboard:initial_state', {
        isLive: true,
        teacherName: active.teacherName,
        teacherId: active.teacherId,
        grade: active.grade,
        activePageIndex: active.activePageIndex,
        pages: active.pages,
        startedAt: active.startedAt,
        scrollTop: active.scrollTop || 0,
        scrollRatio: active.scrollRatio || 0,
        delegatedStudent: active.delegatedStudent,
        isHandRaised: active.raisedHands.has(socket.id),
        isPeriodicTableOpen: Boolean(active.isPeriodicTableOpen),
        periodicTableElementZ: active.periodicTableElementZ,
      });
      broadcastViewersUpdate(active);
      broadcastDoubtsUpdate(active);
      broadcastSentimentUpdate(active);
    } else {
      socket.emit('whiteboard:initial_state', { isLive: false });
    }
  });

  socket.on('whiteboard:leave', (data: { grade?: string }) => {
    const grade = (data?.grade || 'ALL').trim();
    socket.leave(`whiteboard:${grade}`);
    socket.leave('whiteboard:ALL');
    for (const v of getGradeVariants(grade)) {
      socket.leave(`whiteboard:${v}`);
    }
    activeWhiteboardSessions.forEach((sess) => {
      let changed = false;
      if (sess.viewers.has(socket.id)) {
        sess.viewers.delete(socket.id);
        changed = true;
      }
      if (sess.viewerDetails.has(socket.id)) {
        sess.viewerDetails.delete(socket.id);
        changed = true;
      }
      if (sess.raisedHands.has(socket.id)) {
        sess.raisedHands.delete(socket.id);
        broadcastDoubtsUpdate(sess);
      }
      if (sess.delegatedStudent && sess.delegatedStudent.socketId === socket.id) {
        sess.delegatedStudent = null;
        io.to(getTeacherBroadcastRooms(sess.grade)).emit('whiteboard:delegation_changed', { delegatedStudent: null });
      }
      if (changed) {
        broadcastViewersUpdate(sess);
      }
    });
  });

  // --- STUDENT ENGAGEMENT: RAISE HAND & DOUBTS ---
  socket.on('whiteboard:raise_hand', (data: { grade?: string; teacherId?: string; studentName?: string; studentId?: string; note?: string }) => {
    const active = findActiveWhiteboardSession({ grade: data?.grade, teacherId: data?.teacherId });
    if (active && active.isLive) {
      const studentName = data?.studentName || session.name || 'Student';
      const studentId = data?.studentId || session.id;
      active.raisedHands.set(socket.id, {
        socketId: socket.id,
        studentId,
        studentName,
        note: data?.note ? String(data.note).trim().slice(0, 200) : undefined,
        timestamp: Date.now(),
      });
      broadcastDoubtsUpdate(active);
      socket.emit('whiteboard:hand_state', { isRaised: true });
    }
  });

  socket.on('whiteboard:lower_hand', (data: { grade?: string; teacherId?: string }) => {
    const active = findActiveWhiteboardSession({ grade: data?.grade, teacherId: data?.teacherId });
    if (active && active.isLive) {
      active.raisedHands.delete(socket.id);
      broadcastDoubtsUpdate(active);
      socket.emit('whiteboard:hand_state', { isRaised: false });
    }
  });

  socket.on('whiteboard:dismiss_doubt', (data: { targetSocketId?: string; grade?: string }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const active = findTeacherSession(data?.grade);
    if (active && active.isLive && data?.targetSocketId) {
      active.raisedHands.delete(data.targetSocketId);
      broadcastDoubtsUpdate(active);
      io.to(data.targetSocketId).emit('whiteboard:doubt_dismissed', { message: 'Your doubt was addressed by the teacher.' });
      io.to(data.targetSocketId).emit('whiteboard:hand_state', { isRaised: false });
    }
  });

  socket.on('whiteboard:clear_all_doubts', (data: { grade?: string }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const active = findTeacherSession(data?.grade);
    if (active && active.isLive) {
      active.raisedHands.clear();
      broadcastDoubtsUpdate(active);
      io.to(getTeacherBroadcastRooms(active.grade)).emit('whiteboard:hand_state', { isRaised: false });
    }
  });

  // --- STUDENT ENGAGEMENT: DELEGATION (POINTER / CHALK) ---
  socket.on('whiteboard:set_delegation', (data: { targetSocketId?: string; socketId?: string; studentId?: string; studentName?: string; permission: 'none' | 'pointer' | 'chalk'; grade?: string }) => {
    if (session.role !== 'teacher' && session.role !== 'admin' && session.role !== 'superadmin') return;
    const active = findTeacherSession(data?.grade);
    if (active && active.isLive) {
      if (studentDelegationRevokeTimers.has(active.teacherId)) {
        clearTimeout(studentDelegationRevokeTimers.get(active.teacherId)!);
        studentDelegationRevokeTimers.delete(active.teacherId);
      }
      const targetSocketId = data.targetSocketId || data.socketId;
      if (data.permission === 'none' || !targetSocketId) {
        active.delegatedStudent = null;
      } else {
        let resolvedStudentId = data.studentId || '';
        if (!resolvedStudentId && targetSocketId && active.viewerDetails.has(targetSocketId)) {
          resolvedStudentId = active.viewerDetails.get(targetSocketId)?.studentId || '';
        }
        if (!resolvedStudentId && data.studentName) {
          for (const vd of active.viewerDetails.values()) {
            if (vd.studentName && vd.studentName.trim().toLowerCase() === data.studentName.trim().toLowerCase()) {
              resolvedStudentId = vd.studentId || '';
              break;
            }
          }
        }
        active.delegatedStudent = {
          socketId: targetSocketId,
          studentId: resolvedStudentId,
          studentName: data.studentName || 'Student',
          permission: data.permission,
        };
      }
      const delPayload = { delegatedStudent: active.delegatedStudent };
      io.to(`whiteboard:teacher:${active.teacherId}`).emit('whiteboard:delegation_changed', delPayload);
      io.to(`whiteboard:${active.grade}`).emit('whiteboard:delegation_changed', delPayload);
      if (active.grade !== 'ALL') {
        io.to('whiteboard:ALL').emit('whiteboard:delegation_changed', delPayload);
      }
      for (const v of getGradeVariants(active.grade)) {
        io.to(`whiteboard:${v}`).emit('whiteboard:delegation_changed', delPayload);
      }
      if (active.delegatedStudent?.socketId) {
        io.to(active.delegatedStudent.socketId).emit('whiteboard:delegation_changed', delPayload);
      }
    }
  });

  socket.on('whiteboard:student_pointer', (data: { x: number; y: number; studentName?: string; active?: boolean; grade?: string; teacherId?: string }) => {
    const active = findActiveWhiteboardSession({ grade: data?.grade, teacherId: data?.teacherId });
    if (!active || !active.isLive || !active.delegatedStudent) return;

    const isAuthorized =
      active.delegatedStudent.socketId === socket.id ||
      (active.delegatedStudent.studentId && active.delegatedStudent.studentId === session.id) ||
      (active.delegatedStudent.studentName && active.delegatedStudent.studentName.trim().toLowerCase() === (session.name || data?.studentName || '').trim().toLowerCase()) ||
      (data?.studentName && active.delegatedStudent.studentName.trim().toLowerCase() === data.studentName.trim().toLowerCase());

    if (isAuthorized) {
      if (active.delegatedStudent.socketId !== socket.id) {
        active.delegatedStudent.socketId = socket.id;
      }
      const pointerPayload = {
        x: data.x,
        y: data.y,
        studentName: active.delegatedStudent.studentName,
        active: data.active !== false,
      };
      io.to(`whiteboard:teacher:${active.teacherId}`).emit('whiteboard:laser_pointer', pointerPayload);
      socket.to(`whiteboard:${active.grade}`).emit('whiteboard:laser_pointer', pointerPayload);
      if (active.grade !== 'ALL') {
        socket.to('whiteboard:ALL').emit('whiteboard:laser_pointer', pointerPayload);
      }
      for (const v of getGradeVariants(active.grade)) {
        socket.to(`whiteboard:${v}`).emit('whiteboard:laser_pointer', pointerPayload);
      }
    }
  });

  socket.on('whiteboard:student_stroke', (data: { stroke: any; pageIndex: number; grade?: string; teacherId?: string; studentName?: string }) => {
    const active = findActiveWhiteboardSession({ grade: data?.grade, teacherId: data?.teacherId });
    if (!active || !active.isLive || !active.delegatedStudent || active.delegatedStudent.permission !== 'chalk') return;
    if (!data?.stroke || data.stroke.mode === 'eraser') return;

    const isAuthorized =
      active.delegatedStudent.socketId === socket.id ||
      (active.delegatedStudent.studentId && active.delegatedStudent.studentId === session.id) ||
      (active.delegatedStudent.studentName && active.delegatedStudent.studentName.trim().toLowerCase() === (session.name || data?.studentName || '').trim().toLowerCase()) ||
      (data?.studentName && active.delegatedStudent.studentName.trim().toLowerCase() === data.studentName.trim().toLowerCase());

    if (isAuthorized) {
      if (active.delegatedStudent.socketId !== socket.id) {
        active.delegatedStudent.socketId = socket.id;
      }
      const pIdx = typeof data.pageIndex === 'number' ? data.pageIndex : active.activePageIndex;
      if (active.pages[pIdx]) {
        if (!active.pages[pIdx].strokes) active.pages[pIdx].strokes = [];
        active.pages[pIdx].strokes.push(data.stroke);
      }
      const strokePayload = {
        pageIndex: pIdx,
        stroke: data.stroke,
        fromStudent: true,
        studentName: active.delegatedStudent.studentName,
      };
      io.to(`whiteboard:teacher:${active.teacherId}`).emit('whiteboard:stroke', strokePayload);
      if (active.broadcasterSocketId) {
        io.to(active.broadcasterSocketId).emit('whiteboard:stroke', strokePayload);
      }
      socket.to(`whiteboard:${active.grade}`).emit('whiteboard:stroke', strokePayload);
      if (active.grade !== 'ALL') {
        socket.to('whiteboard:ALL').emit('whiteboard:stroke', strokePayload);
      }
      for (const v of getGradeVariants(active.grade)) {
        socket.to(`whiteboard:${v}`).emit('whiteboard:stroke', strokePayload);
      }
    }
  });

  function pointToSegmentDistSq(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) {
      const dx = px - x1;
      const dy = py - y1;
      return dx * dx + dy * dy;
    }
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    const dx = px - projX;
    const dy = py - projY;
    return dx * dx + dy * dy;
  }

  function strokeIntersectsErasePoints(stroke: any, erasePoints: Array<{ x: number; y: number; radius?: number }>) {
    if (!stroke) return false;
    if (stroke.mode === 'eraser') return true;
    const pts = stroke.points;
    if (!pts || !pts.length) return false;
    const strokeRadius = Math.max(2, (stroke.width || 3) / 2);
    for (const ep of erasePoints) {
      const radius = ep.radius || 24;
      const effRadius = radius + strokeRadius;
      const eraseRadiusSq = effRadius * effRadius;
      if (pts.length === 1) {
        const dx = pts[0].x - ep.x;
        const dy = pts[0].y - ep.y;
        if (dx * dx + dy * dy <= eraseRadiusSq) return true;
      } else {
        for (let i = 0; i < pts.length - 1; i++) {
          if (pointToSegmentDistSq(ep.x, ep.y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= eraseRadiusSq) {
            return true;
          }
        }
      }
    }
    return false;
  }

  socket.on('whiteboard:student_erase', (data: { erasePoints: Array<{ x: number; y: number; radius?: number }>; remainingStrokes?: any[]; pageIndex: number; grade?: string; teacherId?: string; studentName?: string }) => {
    const active = findActiveWhiteboardSession({ grade: data?.grade, teacherId: data?.teacherId });
    if (!active || !active.isLive || !active.delegatedStudent || active.delegatedStudent.permission !== 'chalk') return;

    const isAuthorized =
      active.delegatedStudent.socketId === socket.id ||
      (active.delegatedStudent.studentId && active.delegatedStudent.studentId === session.id) ||
      (active.delegatedStudent.studentName && active.delegatedStudent.studentName.trim().toLowerCase() === (session.name || data?.studentName || '').trim().toLowerCase()) ||
      (data?.studentName && active.delegatedStudent.studentName.trim().toLowerCase() === data.studentName.trim().toLowerCase());

    if (isAuthorized) {
      if (active.delegatedStudent.socketId !== socket.id) {
        active.delegatedStudent.socketId = socket.id;
      }
      const pIdx = typeof data.pageIndex === 'number' ? data.pageIndex : active.activePageIndex;
      while (active.pages.length <= pIdx) {
        active.pages.push({ strokes: [], shapes: [], texts: [], widgets: [] });
      }

      if (Array.isArray(data.remainingStrokes)) {
        active.pages[pIdx].strokes = data.remainingStrokes.filter((stroke: any) => stroke && stroke.mode !== 'eraser');
      } else if (Array.isArray(data.erasePoints) && data.erasePoints.length > 0 && active.pages[pIdx]?.strokes) {
        active.pages[pIdx].strokes = active.pages[pIdx].strokes.filter((stroke: any) => {
          if (stroke.mode === 'eraser') return false;
          return !strokeIntersectsErasePoints(stroke, data.erasePoints);
        });
      }

      const erasePayload = {
        pageIndex: pIdx,
        erasePoints: Array.isArray(data.erasePoints) ? data.erasePoints : [],
        remainingStrokes: active.pages[pIdx]?.strokes || [],
        fromStudent: true,
        studentName: active.delegatedStudent.studentName,
      };
      io.to(`whiteboard:teacher:${active.teacherId}`).emit('whiteboard:erase', erasePayload);
      if (active.broadcasterSocketId) {
        io.to(active.broadcasterSocketId).emit('whiteboard:erase', erasePayload);
      }
      socket.to(`whiteboard:${active.grade}`).emit('whiteboard:erase', erasePayload);
      if (active.grade !== 'ALL') {
        socket.to('whiteboard:ALL').emit('whiteboard:erase', erasePayload);
      }
      for (const v of getGradeVariants(active.grade)) {
        socket.to(`whiteboard:${v}`).emit('whiteboard:erase', erasePayload);
      }
    }
  });

  // --- STUDENT ENGAGEMENT: SENTIMENT / REACTIONS ---
  socket.on('whiteboard:reaction', (data: { type?: 'understood' | 'confused' | 'slower' | 'faster'; sentiment?: 'positive' | 'question' | 'slow_down' | 'speed_up'; emoji?: string; label?: string; studentName?: string; grade?: string; teacherId?: string }) => {
    const active = findActiveWhiteboardSession({ grade: data?.grade, teacherId: data?.teacherId });
    if (active && active.isLive) {
      // Map sentiment to reaction type if type is missing or not standard
      let type: 'understood' | 'confused' | 'slower' | 'faster' = 'understood';
      if (data?.type && ['understood', 'confused', 'slower', 'faster'].includes(data.type)) {
        type = data.type;
      } else if (data?.sentiment === 'positive') {
        type = 'understood';
      } else if (data?.sentiment === 'question') {
        type = 'confused';
      } else if (data?.sentiment === 'slow_down') {
        type = 'slower';
      } else if (data?.sentiment === 'speed_up') {
        type = 'faster';
      }

      // Safe defaults for emoji and label
      const defaultReactions: Record<string, { emoji: string; label: string }> = {
        understood: { emoji: '👍', label: 'Got it' },
        confused: { emoji: '❓', label: 'Doubt' },
        slower: { emoji: '🐢', label: 'Slower' },
        faster: { emoji: '⚡', label: 'Ready' },
      };
      const def = defaultReactions[type] || { emoji: '👍', label: 'Got it' };
      const emoji = (data?.emoji && data.emoji !== 'undefined') ? data.emoji : def.emoji;
      const label = (data?.label && data.label !== 'undefined') ? data.label : def.label;
      const studentName = (data?.studentName && data.studentName !== 'undefined' && data.studentName.trim()) || (session && session.name) || 'Student';

      active.reactions.push({
        studentName,
        type,
        emoji,
        label,
        timestamp: Date.now(),
      });

      const reactionId = (data as any)?.id || `${socket.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const reactionPayload = {
        id: reactionId,
        type,
        emoji,
        label,
        studentName,
        studentId: (data as any)?.studentId || session.id,
        senderSocketId: socket.id,
      };

      // 1. Notify the teacher EXACTLY ONCE via the dedicated teacher room
      io.to(`whiteboard:teacher:${active.teacherId}`).emit('whiteboard:reaction_event', reactionPayload);

      // 2. Broadcast reaction to other student viewers (excluding sender socket, and excluding teacher)
      const targetGrade = active.grade || 'ALL';
      const roomsToBroadcast = [`whiteboard:${targetGrade}`];
      if (targetGrade !== 'ALL') {
        roomsToBroadcast.push('whiteboard:ALL');
      }
      for (const v of getGradeVariants(targetGrade)) {
        roomsToBroadcast.push(`whiteboard:${v}`);
      }
      socket.to(roomsToBroadcast).except(`whiteboard:teacher:${active.teacherId}`).emit('whiteboard:reaction_event', reactionPayload);

      broadcastSentimentUpdate(active);
    }
  });

  socket.on('disconnect', () => {
    activeWhiteboardSessions.forEach((sessionObj, grade) => {
      let changed = false;
      if (sessionObj.viewers.has(socket.id)) {
        sessionObj.viewers.delete(socket.id);
        changed = true;
      }
      if (sessionObj.viewerDetails.has(socket.id)) {
        sessionObj.viewerDetails.delete(socket.id);
        changed = true;
      }
      if (sessionObj.raisedHands.has(socket.id)) {
        sessionObj.raisedHands.delete(socket.id);
        broadcastDoubtsUpdate(sessionObj);
      }
      if (sessionObj.delegatedStudent && sessionObj.delegatedStudent.socketId === socket.id) {
        const teacherId = sessionObj.teacherId;
        const currentSocketId = socket.id;
        if (studentDelegationRevokeTimers.has(teacherId)) {
          clearTimeout(studentDelegationRevokeTimers.get(teacherId)!);
        }
        const timer = setTimeout(() => {
          studentDelegationRevokeTimers.delete(teacherId);
          const current = activeWhiteboardSessions.get(sessionObj.grade);
          if (current && current.delegatedStudent && current.delegatedStudent.socketId === currentSocketId) {
            current.delegatedStudent = null;
            const delPayload = { delegatedStudent: null };
            io.to(`whiteboard:teacher:${current.teacherId}`).emit('whiteboard:delegation_changed', delPayload);
            io.to(`whiteboard:${current.grade}`).emit('whiteboard:delegation_changed', delPayload);
            if (current.grade !== 'ALL') {
              io.to('whiteboard:ALL').emit('whiteboard:delegation_changed', delPayload);
            }
          }
        }, 15000);
        studentDelegationRevokeTimers.set(teacherId, timer);
      }
      if (changed) {
        broadcastViewersUpdate(sessionObj);
      }
      // Only handle disconnect if this socket was the actual broadcaster socket
      if (sessionObj.broadcasterSocketId === socket.id) {
        // Wait 15 seconds grace period for tablet screen unlock or quick Wi-Fi reconnect
        const timer = setTimeout(() => {
          whiteboardDisconnectTimers.delete(grade);
          const current = activeWhiteboardSessions.get(grade);
          if (current && current.broadcasterSocketId === socket.id) {
            activeWhiteboardSessions.delete(grade);
            io.to(`whiteboard:${grade}`).emit('whiteboard:broadcast_stopped', { grade });
            io.to('whiteboard:ALL').emit('whiteboard:broadcast_stopped', { grade });
            io.to(`whiteboard:teacher:${sessionObj.teacherId}`).emit('whiteboard:broadcast_stopped', { grade });
            io.emit('whiteboard:status_update', { grade, teacherId: sessionObj.teacherId, isLive: false });
          }
        }, 15000);
        whiteboardDisconnectTimers.set(grade, timer);
      }
    });
  });
});

app.get('/api/whiteboard/live-status', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const role = req.session!.role;
    let targetGrade: string | null = null;
    let studentTeacherId: string | null = null;
    if (role === 'student') {
      const student = await db.student.findUnique({ where: { id: req.session!.id }, select: { grade: true, teacherId: true } });
      targetGrade = student?.grade || null;
      studentTeacherId = student?.teacherId || null;
    }
    const gradeToCheck = targetGrade || (typeof req.query.grade === 'string' ? req.query.grade : null);
    const teacherToCheck = studentTeacherId || (typeof req.query.teacherId === 'string' ? req.query.teacherId : null);

    const active = findActiveWhiteboardSession({ grade: gradeToCheck, teacherId: teacherToCheck });

    if (active && active.isLive) {
      return res.json({
        success: true,
        isLive: true,
        teacherName: active.teacherName,
        teacherId: active.teacherId,
        grade: active.grade,
        startedAt: active.startedAt,
        pageCount: active.pages.length,
        activePageIndex: active.activePageIndex
      });
    }
    res.json({ success: true, isLive: false });
  } catch (error) { errorResponse(res, error); }
});

// --- CLASSROOM CHAT ROUTES (Everyone & One-to-One) ---

async function resolveTeacherIdForChat(req: AuthRequest): Promise<string | null> {
  if (!req.session) return null;
  const cached = userTeacherIdCache.get(req.session.id);
  if (cached && cached.expires > Date.now()) {
    return cached.teacherId;
  }
  let teacherId: string | null = null;
  if (req.session.role === 'student') {
    const student = await prisma.student.findUnique({
      where: { id: req.session.id },
      select: { teacherId: true },
    });
    teacherId = student?.teacherId || null;
  } else if (req.session.role === 'teacher' || req.session.role === 'admin') {
    const teacher = await db.teacher.findUnique({ where: { id: req.session.id }, select: { id: true } });
    if (teacher) {
      teacherId = teacher.id;
    } else if (req.session.email) {
      const teacherByEmail = await db.teacher.findUnique({ where: { email: req.session.email }, select: { id: true } });
      if (teacherByEmail) teacherId = teacherByEmail.id;
    } else {
      teacherId = req.session.id;
    }
  } else if (req.session.role === 'superadmin') {
    if (req.query.teacherId) return String(req.query.teacherId);
    const firstTeacher = await prisma.teacher.findFirst({ select: { id: true } });
    teacherId = firstTeacher?.id || null;
  }
  if (teacherId) {
    userTeacherIdCache.set(req.session.id, { teacherId, expires: Date.now() + 10 * 60 * 1000 });
  }
  return teacherId;
}

app.get('/api/chat/peers', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const role = req.session!.role;
    if (role === 'student') {
      const student = await prisma.student.findUnique({
        where: { id: req.session!.id },
        select: {
          id: true,
          name: true,
          grade: true,
          teacherId: true,
          teacher: { select: { id: true, name: true, school: true, subject: true } },
        },
      });
      if (!student || !student.teacherId) {
        return res.json({ teacher: null, classroomName: 'Chatroom', students: [] });
      }
      let activeBroadcastGrade: string | null = null;
      let isBroadcastLive = false;
      for (const sess of activeWhiteboardSessions.values()) {
        if (sess.teacherId === student.teacherId && sess.isLive) {
          activeBroadcastGrade = sess.grade;
          isBroadcastLive = true;
          break;
        }
      }
      return res.json({
        teacher: student.teacher,
        classroomName: 'Chatroom',
        students: [],
        studentGrade: student.grade,
        activeBroadcastGrade,
        isBroadcastLive,
      });
    }

    const teacherId = await resolveTeacherIdForChat(req);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const students = await prisma.student.findMany({
      where: { teacherId, active: true },
      select: { id: true, name: true, grade: true },
      orderBy: { name: 'asc' },
    });

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, name: true, school: true, subject: true },
    });

    let activeBroadcastGrade: string | null = null;
    let isBroadcastLive = false;
    for (const sess of activeWhiteboardSessions.values()) {
      if (sess.teacherId === teacherId && sess.isLive) {
        activeBroadcastGrade = sess.grade;
        isBroadcastLive = true;
        break;
      }
    }

    return res.json({
      teacher,
      students,
      classroomName: 'Chatroom',
      activeBroadcastGrade,
      isBroadcastLive,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.get('/api/chat/messages', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const channel = req.query.channel === 'direct' ? 'direct' : 'everyone';
    const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 100);
    const before = req.query.before ? new Date(String(req.query.before)) : undefined;

    const teacherId = await resolveTeacherIdForChat(req);
    if (!teacherId) {
      return res.json({ messages: [] });
    }

    let studentId: string | null = null;
    if (channel === 'direct') {
      if (req.session!.role === 'student') {
        studentId = req.session!.id;
      } else {
        studentId = req.query.studentId ? String(req.query.studentId) : null;
        if (!studentId) {
          return res.status(400).json({ error: 'studentId is required for direct chat' });
        }
      }
    }

    const cacheKey = channel === 'everyone' ? `${teacherId}:everyone` : `${teacherId}:direct:${studentId}`;

    // Return instant memory cache if initial/refresh request without pagination
    if (!before && chatMemoryCache.has(cacheKey)) {
      return res.json({ messages: chatMemoryCache.get(cacheKey) });
    }

    const where: any = {
      teacherId,
      channel,
    };

    if (channel === 'direct' && studentId) {
      where.studentId = studentId;
    }

    if (before && !isNaN(before.getTime())) {
      where.createdAt = { lt: before };
    }

    const messages = await (prisma as any).chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        teacherId: true,
        studentId: true,
        senderId: true,
        senderName: true,
        senderRole: true,
        channel: true,
        content: true,
        createdAt: true,
      },
    });

    if (!before) {
      chatMemoryCache.set(cacheKey, messages);
    }

    return res.json({ messages });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.post('/api/chat/messages', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const data = parse(
      z.object({
        channel: z.enum(['everyone', 'direct']).default('everyone'),
        studentId: z.string().optional().nullable(),
        content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long (max 2000 characters)'),
      }),
      req.body
    );

    const role = req.session!.role;
    let teacherId: string | null = null;
    let studentId: string | null = null;
    let senderName = 'User';

    if (role === 'student') {
      const student = await prisma.student.findUnique({
        where: { id: req.session!.id },
        select: { id: true, name: true, grade: true, teacherId: true, active: true },
      });
      if (!student || !student.active || !student.teacherId) {
        return res.status(403).json({ error: 'You must be linked to an active teacher to send messages.' });
      }
      teacherId = student.teacherId;

      // Guard: If teacher is currently broadcasting to a particular class and student is from another grade,
      // prevent posting to 'everyone' channel (they must use One-to-One)
      if (data.channel === 'everyone') {
        let activeBroadcastGrade: string | null = null;
        for (const sess of activeWhiteboardSessions.values()) {
          if (sess.teacherId === teacherId && sess.isLive) {
            activeBroadcastGrade = sess.grade;
            break;
          }
        }
        if (activeBroadcastGrade && activeBroadcastGrade !== 'ALL' && activeBroadcastGrade.toLowerCase() !== 'all grades') {
          if (student.grade && !gradesMatch(activeBroadcastGrade, student.grade)) {
            return res.status(403).json({ error: 'Everyone chat is reserved for students in the active broadcast class. Please use One-to-One chat.' });
          }
        }
      }

      studentId = data.channel === 'direct' ? student.id : null;
      senderName = student.name;
    } else {
      teacherId = await resolveTeacherIdForChat(req);
      if (!teacherId) return res.status(404).json({ error: 'Teacher account not found.' });

      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true, name: true },
      });
      senderName = teacher?.name || 'Teacher';

      if (data.channel === 'direct') {
        if (!data.studentId) {
          return res.status(400).json({ error: 'Please select a student for one-to-one chat.' });
        }
        const student = await prisma.student.findFirst({
          where: { id: data.studentId, ...(role !== 'superadmin' ? { teacherId } : {}) },
          select: { id: true },
        });
        if (!student) {
          return res.status(404).json({ error: 'Student not found in your classroom.' });
        }
        studentId = student.id;
      }
    }

    const message = await (prisma as any).chatMessage.create({
      data: {
        teacherId,
        studentId,
        senderId: req.session!.id,
        senderName,
        senderRole: role === 'student' ? 'student' : 'teacher',
        channel: data.channel,
        content: data.content,
      },
    });

    // Update in-memory cache for instant subsequent reads
    const cacheKey = data.channel === 'everyone' ? `${teacherId}:everyone` : `${teacherId}:direct:${studentId}`;
    let cached = chatMemoryCache.get(cacheKey);
    if (!cached) cached = [];
    cached.push(message);
    if (cached.length > 100) cached.shift();
    chatMemoryCache.set(cacheKey, cached);

    // Real-time broadcast
    if (data.channel === 'everyone') {
      io.to(`chat:${teacherId}:everyone`).emit('chat:message', message);
    } else if (studentId) {
      io.to(`chat:${teacherId}:direct:${studentId}`).emit('chat:message', message);
      if (role === 'student') {
        io.to(`chat:${teacherId}:teacher`).emit('chat:direct_notification', {
          studentId,
          message,
        });
      }
    }

    return res.status(201).json({ message });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.delete('/api/chat/messages/:id', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Message ID is required.' });

    const message = await (prisma as any).chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or already deleted.' });
    }

    const session = req.session!;
    const role = session.role;
    let allowed = false;

    if (role === 'superadmin') {
      allowed = true;
    } else if (message.senderId === session.id) {
      // Sender (teacher or kid) can always delete their own message sent by mistake
      allowed = true;
    } else if (role === 'teacher' || role === 'admin') {
      const teacherId = await resolveTeacherIdForChat(req);
      if (teacherId && (message.teacherId === teacherId || message.senderId === teacherId)) {
        allowed = true;
      }
    }

    if (!allowed) {
      return res.status(403).json({ error: 'You are not authorized to delete this message.' });
    }

    await (prisma as any).chatMessage.deleteMany({
      where: { id },
    });

    // Remove from in-memory cache
    const cacheKey = message.channel === 'everyone'
      ? `${message.teacherId}:everyone`
      : `${message.teacherId}:direct:${message.studentId}`;
    if (chatMemoryCache.has(cacheKey)) {
      const cached = chatMemoryCache.get(cacheKey) || [];
      chatMemoryCache.set(
        cacheKey,
        cached.filter((m: any) => m.id !== id)
      );
    }

    // Broadcast real-time deletion to relevant rooms
    const deletePayload = {
      messageId: id,
      channel: message.channel,
      studentId: message.studentId,
      teacherId: message.teacherId,
    };

    if (message.channel === 'everyone') {
      io.to(`chat:${message.teacherId}:everyone`).emit('chat:message_deleted', deletePayload);
    } else if (message.studentId) {
      io.to(`chat:${message.teacherId}:direct:${message.studentId}`).emit('chat:message_deleted', deletePayload);
      io.to(`chat:${message.teacherId}:teacher`).emit('chat:message_deleted', deletePayload);
    }

    return res.json({ ok: true, deletedId: id });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.delete('/api/chat/messages', authenticate(['admin', 'teacher', 'superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = await resolveTeacherIdForChat(req);
    if (!teacherId) return res.status(403).json({ error: 'Only teachers can clear classroom chat.' });
    await clearTeacherChatMessages(teacherId);
    return res.json({ ok: true, message: 'Classroom chat cleared.' });
  } catch (error) {
    errorResponse(res, error);
  }
});

// --- CLASSROOM CALENDAR & REMINDER ROUTES ---

app.get('/api/calendar/events', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const role = req.session!.role;
    let teacherId: string | null = null;

    if (role === 'student') {
      const student = await prisma.student.findUnique({
        where: { id: req.session!.id },
        select: { teacherId: true },
      });
      teacherId = student?.teacherId || null;
      if (!teacherId) {
        return res.json({ events: [] });
      }
    } else {
      teacherId = await resolveTeacherIdForChat(req);
      if (!teacherId) {
        return res.json({ events: [] });
      }
    }

    const { month, from, to } = req.query;
    const where: any = { teacherId };

    if (month && typeof month === 'string') {
      where.date = { startsWith: month };
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = String(from);
      if (to) where.date.lte = String(to);
    }

    const events = await (prisma as any).calendarEvent.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json({ events });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.post('/api/calendar/events', authenticate(['teacher', 'admin', 'superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = await resolveTeacherIdForChat(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Only teachers can add events and reminders.' });
    }

    const data = parse(
      z.object({
        title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
        description: z.string().trim().max(2000).optional().nullable(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        time: z.string().trim().max(50).optional().nullable(),
        type: z.enum(['event', 'reminder', 'quiz', 'test', 'assignment', 'holiday']).default('event'),
        color: z.string().trim().max(30).optional().nullable(),
      }),
      req.body
    );

    const event = await (prisma as any).calendarEvent.create({
      data: {
        teacherId,
        title: data.title,
        description: data.description || null,
        date: data.date,
        time: data.time || null,
        type: data.type,
        color: data.color || '#0284c7',
      },
    });

    // Real-time broadcast so connected students see it instantly
    io.to(`chat:${teacherId}:everyone`).emit('calendar:event_created', event);

    return res.status(201).json({ event });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.put('/api/calendar/events/:id', authenticate(['teacher', 'admin', 'superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Event ID is required.' });

    const teacherId = await resolveTeacherIdForChat(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Only teachers can edit events and reminders.' });
    }

    const existing = await (prisma as any).calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (req.session?.role !== 'superadmin' && existing.teacherId !== teacherId) {
      return res.status(403).json({ error: 'You are not authorized to edit this event.' });
    }

    const data = parse(
      z.object({
        title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
        description: z.string().trim().max(2000).optional().nullable(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        time: z.string().trim().max(50).optional().nullable(),
        type: z.enum(['event', 'reminder', 'quiz', 'test', 'assignment', 'holiday']).default('event'),
        color: z.string().trim().max(30).optional().nullable(),
      }),
      req.body
    );

    const updated = await (prisma as any).calendarEvent.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        date: data.date,
        time: data.time || null,
        type: data.type,
        color: data.color || existing.color || '#0284c7',
      },
    });

    io.to(`chat:${teacherId}:everyone`).emit('calendar:event_updated', updated);

    return res.json({ event: updated });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.delete('/api/calendar/events/:id', authenticate(['teacher', 'admin', 'superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Event ID is required.' });

    const teacherId = await resolveTeacherIdForChat(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Only teachers can delete events and reminders.' });
    }

    const existing = await (prisma as any).calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found or already deleted.' });
    }

    if (req.session?.role !== 'superadmin' && existing.teacherId !== teacherId) {
      return res.status(403).json({ error: 'You are not authorized to delete this event.' });
    }

    await (prisma as any).calendarEvent.deleteMany({ where: { id } });

    io.to(`chat:${teacherId}:everyone`).emit('calendar:event_deleted', { eventId: id, teacherId });

    return res.json({ ok: true, deletedId: id });
  } catch (error) {
    errorResponse(res, error);
  }
});

// Strip confidential teacher answer key from student-facing question papers
function stripTeacherAnswerKey(html: string): string {
  if (!html) return '';
  // 1. Remove delimited comment block
  let cleaned = html.replace(/<!--\s*TEACHER_ANSWER_KEY_START\s*-->[\s\S]*?<!--\s*TEACHER_ANSWER_KEY_END\s*-->/gi, '');
  // 2. Remove by class name
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*teacher-answer-key-section[^"']*["'][\s\S]*$/gi, '');
  // 3. Fallback: match any section with TEACHER ANSWER KEY heading
  cleaned = cleaned.replace(/<div[^>]*style="[^"]*page-break-before:\s*always[^"]*"[^>]*>[\s\S]*?TEACHER ANSWER KEY[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/<div[^>]*>[\s\S]*?🔑\s*(?:TEACHER\s+)?ANSWER\s+KEY[\s\S]*$/gi, '');
  // Ensure the root container div is closed
  if (cleaned.startsWith('<div') && !cleaned.endsWith('</div>')) {
    cleaned += '</div>';
  }
  return cleaned.trim();
}

// --- WORKSHEET & QUESTION PAPER ROUTES ---

app.get('/api/worksheets', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    if (req.session?.role === 'admin' || req.session?.role === 'teacher' || req.session?.role === 'superadmin') {
      let resolvedTeacherId = req.session.id;
      if (req.session.role !== 'superadmin') {
        const teacher = await db.teacher.findUnique({ where: { id: req.session.id }, select: { id: true } });
        if (!teacher && req.session.email) {
          const teacherByEmail = await db.teacher.findUnique({ where: { email: req.session.email }, select: { id: true } });
          if (teacherByEmail) resolvedTeacherId = teacherByEmail.id;
        }
      }
      const where: any = req.session.role === 'superadmin'
        ? {}
        : {
          OR: [
            { teacherId: req.session.id },
            ...(resolvedTeacherId !== req.session.id ? [{ teacherId: resolvedTeacherId }] : []),
          ],
        };
      const worksheets = await prisma.worksheetPaper.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { submissions: true } },
        },
      });
      return res.json({ worksheets });
    }

    const student: any = await (prisma as any).student.findUnique({ where: { id: req.session!.id }, select: { teacherId: true, grade: true } });
    const teacherFilter: any = student?.teacherId ? { teacherId: student.teacherId } : {};
    const studentGrade = student?.grade || 'Grade 6';
    const gradeVariants = getGradeVariants(studentGrade);
    const worksheets = await prisma.worksheetPaper.findMany({
      where: {
        ...teacherFilter,
        status: { in: ['PUBLISHED', 'ARCHIVED'] },
        OR: [
          { grade: null },
          { grade: '' },
          { grade: 'All Grades' },
          { grade: { in: gradeVariants } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: {
          where: { studentId: req.session!.id },
          select: { id: true, status: true, score: true, remarks: true, submittedAt: true, gradedAt: true, images: true },
        },
      },
    });

    const studentWorksheets = worksheets.map((w) => ({
      ...w,
      content: stripTeacherAnswerKey(w.content),
      submission: w.submissions[0] ?? null,
      submissions: undefined,
    }));

    res.json({ worksheets: studentWorksheets });
  } catch (error) { errorResponse(res, error); }
});

app.get('/api/worksheets/:id', authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const worksheet = await prisma.worksheetPaper.findUnique({
      where: { id },
      include: {
        submissions: (req.session?.role === 'admin' || req.session?.role === 'teacher' || req.session?.role === 'superadmin')
          ? {
            include: { student: { select: { id: true, name: true } } },
            orderBy: { submittedAt: 'desc' },
          }
          : {
            where: { studentId: req.session!.id },
          },
      },
    });

    if (!worksheet) return res.status(404).json({ error: 'Question paper not found.' });

    if (req.session?.role === 'student') {
      const student: any = await (prisma.student as any).findUnique({ where: { id: req.session!.id }, select: { grade: true } });
      const studentGrade = student?.grade || 'Grade 6';
      if ((worksheet as any).grade && !gradesMatch((worksheet as any).grade, studentGrade)) {
        return res.status(403).json({ error: `This question paper is assigned for ${(worksheet as any).grade} students only.` });
      }
      const submission = worksheet.submissions?.[0] ?? null;
      return res.json({ worksheet: { ...worksheet, content: stripTeacherAnswerKey(worksheet.content), submission, submissions: undefined } });
    }

    res.json({ worksheet });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/worksheets', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().trim().min(1).max(200),
      subject: z.string().trim().max(100).optional(),
      grade: z.string().trim().max(50).optional(),
      totalMarks: z.number().int().min(1).default(100),
      content: z.string().trim().min(1),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
    });
    const data = parse(schema, req.body);
    const teacherId = req.session!.id;
    const normalizedGrade = normalizeGrade(data.grade) || data.grade;
    const paper = await (prisma as any).worksheetPaper.create({ data: { ...data, grade: normalizedGrade, teacherId } });
    res.status(201).json({ paper });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/worksheets/ai-generate', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      subject: z.string().trim().min(1).max(100),
      grade: z.string().trim().min(1).max(50),
      topic: z.string().trim().min(1).max(300),
      subtopics: z.string().trim().max(500).optional(),
      questionCount: z.number().int().min(3).max(30).default(10),
      totalMarks: z.number().int().min(10).max(200).default(100),
      details: z.string().trim().max(500).optional(),
      apiKey: z.string().trim().optional(),
      provider: z.enum(['auto', 'gemini', 'openai', 'deepseek']).optional(),
      assessmentStandard: z.enum(['Basic', 'Advanced']).optional(),
      strictSourceContent: z.boolean().optional(),
      uploadedFiles: z.array(uploadedFileSchema).max(15).optional(),
    });
    const data = parse(schema, req.body);

    // If client provided an inline key, ensure it does not belong to another teacher
    if (data.apiKey && req.session?.id && req.session.role !== 'superadmin') {
      const duplicate = await db.teacher.findFirst({
        where: {
          apiKey: data.apiKey.trim(),
          id: { not: req.session.id },
        },
        select: { id: true },
      });
      if (duplicate) {
        return res.status(403).json({
          error: 'This API Key is registered to another teacher account. Duplication of API keys is strictly prohibited. Please configure your own unique API key in AI Settings.',
        });
      }
    }

    // Load teacher's own saved apiKey from database if not supplied
    if (!data.apiKey && req.session?.id) {
      const teacher = await db.teacher.findUnique({ where: { id: req.session.id }, select: { apiKey: true } });
      if (teacher?.apiKey) {
        data.apiKey = teacher.apiKey;
      }
    }

    // Require each teacher to have their own API key configured
    if (!data.apiKey && req.session?.role !== 'superadmin') {
      return res.status(400).json({
        error: 'API Key missing. Every teacher must add their own unique Gemini, OpenAI, or DeepSeek API Key in AI Settings before generating question papers.',
      });
    }

    const isHindi = isHindiSubject(data.subject);
    let docHtml = '';
    const detailsPrompt = isHindi
      ? `MANDATORY LANGUAGE REQUIREMENT: HINDI (हिन्दी). The teacher entered the topic and subtopics in Hinglish ("${data.topic}" ${data.subtopics ? `, subtopics: "${data.subtopics}"` : ''}), but the ENTIRE question paper MUST be generated EXCLUSIVELY in pure Hindi using Devanagari script (देवनागरी लिपि). Formulate authentic CBSE Hindi grammar, comprehension, literature, and analytical questions in Devanagari Hindi. Total Marks: ${data.totalMarks}. ${data.details ?? ''}`
      : `Create a formal printable Word-document style Question Paper for ${data.subject} (${data.grade}) on "${data.topic}". Total Marks: ${data.totalMarks}. ${data.details ?? ''}`;

    const generated = await generateAIQuiz({
      mode: 'SELF_PACED',
      subject: data.subject,
      grade: data.grade,
      topic: data.topic,
      subtopics: data.subtopics,
      difficulty: data.assessmentStandard === 'Advanced' ? 'Hard' : 'Moderate',
      assessmentStandard: data.assessmentStandard,
      totalMarks: data.totalMarks,
      questionCount: data.questionCount,
      questionType: 'ALL',
      details: detailsPrompt,
      apiKey: data.apiKey,
      provider: data.provider,
      strictSourceContent: data.strictSourceContent,
      uploadedFiles: data.uploadedFiles,
    });

    if (generated && generated.questions?.length > 0) {
      const bp = (generated as any).blueprint;
      const abilityAware = bp?.abilityDistribution?.awareness?.targetPercentage ?? (data.assessmentStandard === 'Advanced' ? 25 : 50);
      const abilitySens = bp?.abilityDistribution?.sensitivity?.targetPercentage ?? 25;
      const abilityCreat = bp?.abilityDistribution?.creativity?.targetPercentage ?? (data.assessmentStandard === 'Advanced' ? 50 : 25);

      const diffEasy = bp?.difficultyDistribution?.easy?.targetPercentage ?? 25;
      const diffMed = bp?.difficultyDistribution?.medium?.targetPercentage ?? (data.assessmentStandard === 'Advanced' ? 25 : 50);
      const diffDiff = bp?.difficultyDistribution?.difficult?.targetPercentage ?? (data.assessmentStandard === 'Advanced' ? 50 : 25);

      // Group questions by section
      const sectionsMap = new Map<string, any[]>();
      generated.questions.forEach((q: any, idx: number) => {
        let sec = q.section || '';
        if (!sec || (sec.toLowerCase().includes('section a') && (q.marks || 1) > 1)) {
          const qType = (q.type || q.questionType || '').toUpperCase();
          if (qType.includes('CASE') || qType.includes('SOURCE')) {
            sec = isHindi ? "खंड 'ङ' — केस-स्टडी आधारित प्रश्न" : "SECTION E — CASE-STUDY / SOURCE-BASED QUESTIONS";
          } else if ((q.marks || 1) >= 5 || qType.includes('LONG')) {
            sec = isHindi ? "खंड 'घ' — दीर्घ उत्तरीय प्रश्न (5 अंक प्रत्येक)" : "SECTION D — LONG ANSWER QUESTIONS (5 MARKS EACH)";
          } else if ((q.marks || 1) >= 3 || qType.includes('SHORT')) {
            sec = isHindi ? "खंड 'ग' — लघु उत्तरीय प्रश्न (3 अंक प्रत्येक)" : "SECTION C — SHORT ANSWER QUESTIONS (3 MARKS EACH)";
          } else if ((q.marks || 1) === 2 || qType.includes('VSA')) {
            sec = isHindi ? "खंड 'ख' — अति लघु उत्तरीय प्रश्न (2 अंक प्रत्येक)" : "SECTION B — VERY SHORT ANSWER QUESTIONS (2 MARKS EACH)";
          } else {
            sec = isHindi ? "खंड 'क' — वस्तुनिष्ठ प्रश्न (1 अंक प्रत्येक)" : "SECTION A — OBJECTIVE TYPE QUESTIONS (1 MARK EACH)";
          }
        }
        if (!sectionsMap.has(sec)) sectionsMap.set(sec, []);
        sectionsMap.get(sec)!.push({ ...q, displayNum: idx + 1 });
      });

      if (isHindi) {
        const hindiOptionLabels = ['(क)', '(ख)', '(ग)', '(घ)'];
        let sectionsHtml = '';
        sectionsMap.forEach((qList, secTitle) => {
          sectionsHtml += `
  <div style="margin-top: 24px; margin-bottom: 12px; padding: 6px 12px; background: #f1f5f9; border-left: 4px solid #0f172a; font-weight: 700; font-size: 14.5px; color: #0f172a;">
    ${secTitle}
  </div>
  <div style="display: flex; flex-direction: column; gap: 14px;">
    ${qList.map((q: any) => `
    <div style="margin: 0 0 10px 0; font-size: 14.5px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px;">
      <p style="margin: 0 0 6px 0; line-height: 1.6;">
        <strong>प्रश्न ${q.displayNum}.</strong> ${q.prompt}
        <span style="float: right; font-weight: 600; color: #475569;">[${q.marks ?? 1} अंक]</span>
      </p>
      ${(q.options && q.options.length > 0) ? (
        q.type === 'TRUE_FALSE' ? `
      <div style="margin-left: 20px; display: flex; gap: 24px; font-size: 13.5px; color: #334155; margin-top: 4px;">
        <div>(क) सत्य</div>
        <div>(ख) असत्य</div>
      </div>` : `
      <div style="margin-left: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 13.5px; color: #334155; margin-top: 4px;">
        ${q.options.map((opt: any, oIdx: number) => `<div>${hindiOptionLabels[oIdx] || `(${String.fromCharCode(65 + oIdx)})`} ${opt.text}</div>`).join('')}
      </div>`
      ) : ''}
    </div>`).join('')}
  </div>`;
        });

        docHtml = `
<div style="font-family: 'Segoe UI', 'Nirmala UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; width: 100%;">
  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
    <h1 style="margin: 0; font-size: 24px; color: #0f172a; letter-spacing: 0.5px;">${data.subject} परीक्षा प्रश्न पत्र</h1>
    <h3 style="margin: 4px 0 0 0; color: #475569; font-weight: 600; font-size: 15px;">कक्षा: ${data.grade} &nbsp;|&nbsp; प्रकरण: ${generated.title ? generated.title.replace(/^हिन्दी:\s*/i, '') : data.topic}</h3>
    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-weight: 600; font-size: 13.5px; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 8px;">
      <span>समय: 60 मिनट</span>
      <span>पूर्णांक: ${data.totalMarks}</span>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; font-size: 13.5px; color: #334155; margin-bottom: 16px; padding: 6px 0; border-bottom: 1px dashed #cbd5e1;">
    <span>विद्यार्थी का नाम: __________________________________</span>
    <span>अनुक्रमांक (Roll No): ____________</span>
    <span>दिनांक: ____________</span>
  </div>

  <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; border-radius: 4px;">
    <strong style="color: #0f172a;">सामान्य निर्देश:</strong>
    <ol style="margin: 4px 0 0 16px; padding-left: 4px; color: #334155; line-height: 1.5;">
      <li>सभी प्रश्न अनिवार्य हैं। यह प्रश्न पत्र खंड 'क' से खंड 'ङ' तक विभाजित है।</li>
      <li><strong>खंड 'क':</strong> वस्तुनिष्ठ प्रश्न (बहुविकल्पीय, रिक्त स्थान, सत्य/असत्य) - प्रत्येक प्रश्न 1 अंक का है।</li>
      <li><strong>खंड 'ख':</strong> अति लघु उत्तरीय प्रश्न - प्रत्येक प्रश्न 2 अंक का है।</li>
      <li><strong>खंड 'ग':</strong> लघु उत्तरीय प्रश्न - प्रत्येक प्रश्न 3 अंक का है।</li>
      <li><strong>खंड 'घ':</strong> दीर्घ उत्तरीय प्रश्न - प्रत्येक प्रश्न 5 अंक का है।</li>
      <li><strong>खंड 'ङ':</strong> केस-स्टडी आधारित प्रश्न - प्रत्येक प्रश्न 4-5 अंक का है।</li>
      <li>सभी उत्तर अपनी उत्तर-पुस्तिका में स्पष्ट एवं स्वच्छ लेख में लिखें।</li>
    </ol>
  </div>

  ${sectionsHtml}

  <div style="margin-top: 40px; border-top: 2px solid #0f172a; padding-top: 20px; page-break-before: always;">
    <div style="text-align: center; margin-bottom: 18px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 10px;">
      <h2 style="font-size: 18px; color: #0f172a; margin: 0; text-transform: uppercase;">🔑 शिक्षक उत्तर-कुंजी एवं चरणबद्ध अंकन योजना (Marking Scheme)</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-style: italic;">केवल परीक्षक / शिक्षक के उपयोग हेतु (Confidential — For Evaluator Use Only)</p>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 18px;">
      <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 6px;">📋 मूल्यांकन ब्लूप्रिंट सारांश (Assessment Blueprint):</strong>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 12px; color: #334155;">
        <div>• <strong>क्षमता भारिता:</strong> सजगता (Awareness) ${abilityAware}%, संवेदनशीलता (Sensitivity) ${abilitySens}%, सृजनात्मकता (Creativity) ${abilityCreat}%</div>
        <div>• <strong>कठिनाई स्तर:</strong> सरल (Easy) ${diffEasy}%, मध्यम (Medium) ${diffMed}%, कठिन (Difficult) ${diffDiff}%</div>
        <div>• <strong>मानक:</strong> ${data.assessmentStandard === 'Advanced' ? 'Standard 2: Advanced' : 'Standard 1: Basic & Proficient'}</div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
${generated.questions.map((q: any, idx: number) => `
      <div style="padding: 10px 14px; background: #f8fafc; border-left: 3px solid #10b981; border-radius: 4px;">
        <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
          प्र. ${idx + 1} (${q.section || 'प्रश्न'} - ${q.marks ?? 1} अंक):
          <span style="color: #059669; margin-left: 8px;">सही उत्तर: ${q.answer || 'निर्दिष्ट हल'}</span>
        </div>
        ${q.markingScheme ? `<div style="margin-top: 4px; color: #0f766e; font-size: 13px;"><strong>अंकन योजना एवं अंक वितरण:</strong> ${q.markingScheme}</div>` : ''}
        ${q.explanation ? `<div style="margin-top: 4px; color: #334155; font-size: 13px;"><strong>विस्तृत व्याख्या:</strong> ${q.explanation}</div>` : ''}
      </div>
`).join('')}
    </div>
  </div>
</div>`.trim();
      } else {
        let sectionsHtml = '';
        sectionsMap.forEach((qList, secTitle) => {
          sectionsHtml += `
  <div style="margin-top: 24px; margin-bottom: 12px; padding: 6px 12px; background: #f1f5f9; border-left: 4px solid #0f172a; font-weight: 700; font-size: 14px; color: #0f172a; text-transform: uppercase;">
    ${secTitle}
  </div>
  <div style="display: flex; flex-direction: column; gap: 14px;">
    ${qList.map((q: any) => `
    <div style="margin: 0 0 10px 0; font-size: 14.5px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px;">
      <p style="margin: 0 0 6px 0; line-height: 1.6;">
        <strong>Q${q.displayNum}.</strong> ${q.prompt}
        <span style="float: right; font-weight: 600; color: #475569;">[${q.marks ?? 1} Mark${(q.marks ?? 1) > 1 ? 's' : ''}]</span>
      </p>
      ${(q.options && q.options.length > 0) ? (
        q.type === 'TRUE_FALSE' ? `
      <div style="margin-left: 20px; display: flex; gap: 24px; font-size: 13.5px; color: #334155; margin-top: 4px;">
        <div>(A) True</div>
        <div>(B) False</div>
      </div>` : `
      <div style="margin-left: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 13.5px; color: #334155; margin-top: 4px;">
        ${q.options.map((opt: any, oIdx: number) => `<div>(${String.fromCharCode(65 + oIdx)}) ${opt.text}</div>`).join('')}
      </div>`
      ) : ''}
    </div>`).join('')}
  </div>`;
        });

        docHtml = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; width: 100%;">
  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
    <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">${data.subject.toUpperCase()} EXAMINATION</h1>
    <h3 style="margin: 4px 0 0 0; color: #475569; font-weight: 600; font-size: 15px;">Class / Grade: ${data.grade} &nbsp;|&nbsp; Topic: ${data.topic}</h3>
    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-weight: 600; font-size: 13.5px; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 8px;">
      <span>Time Allowed: 60 Minutes</span>
      <span>Maximum Marks: ${data.totalMarks}</span>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; font-size: 13.5px; color: #334155; margin-bottom: 16px; padding: 6px 0; border-bottom: 1px dashed #cbd5e1;">
    <span>Student's Name: __________________________________</span>
    <span>Roll No: ____________</span>
    <span>Date: ____________</span>
  </div>

  <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; border-radius: 4px;">
    <strong style="color: #0f172a;">General Instructions:</strong>
    <ol style="margin: 4px 0 0 16px; padding-left: 4px; color: #334155; line-height: 1.5;">
      <li>All questions are compulsory. This question paper is divided into Section A to Section E.</li>
      <li><strong>Section A:</strong> Objective Type Questions (MCQ, Fill in the blanks, True/False) carrying 1 mark each.</li>
      <li><strong>Section B:</strong> Very Short Answer Type Questions carrying 2 marks each.</li>
      <li><strong>Section C:</strong> Short Answer Type Questions carrying 3 marks each.</li>
      <li><strong>Section D:</strong> Long Answer Type Questions carrying 5 marks each.</li>
      <li><strong>Section E:</strong> Case-Study / Source-Based Questions carrying 4-5 marks each.</li>
      <li>Write all steps clearly in your answer sheet. Diagrams must be neat and properly labelled.</li>
    </ol>
  </div>

  ${sectionsHtml}

  <!-- TEACHER_ANSWER_KEY_START -->
  <div class="teacher-answer-key-section" style="margin-top: 40px; border-top: 2px solid #0f172a; padding-top: 20px; page-break-before: always;">
    <div style="text-align: center; margin-bottom: 18px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 10px;">
      <h2 style="font-size: 18px; color: #0f172a; margin: 0; text-transform: uppercase;">🔑 TEACHER ANSWER KEY & STEP-WISE MARKING SCHEME</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-style: italic;">Confidential — For Evaluator / Teacher Use Only</p>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 18px;">
      <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 6px;">📋 Assessment Blueprint Summary:</strong>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 12px; color: #334155;">
        <div>• <strong>Abilities:</strong> Awareness ${abilityAware}%, Sensitivity ${abilitySens}%, Creativity ${abilityCreat}%</div>
        <div>• <strong>Difficulty:</strong> Easy ${diffEasy}%, Medium ${diffMed}%, Difficult ${diffDiff}%</div>
        <div>• <strong>Standard:</strong> ${data.assessmentStandard === 'Advanced' ? 'Standard 2: Advanced' : 'Standard 1: Basic & Proficient'}</div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
${generated.questions.map((q: any, idx: number) => `
      <div style="padding: 10px 14px; background: #f8fafc; border-left: 3px solid #10b981; border-radius: 4px;">
        <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
          Q${idx + 1} (${q.section || 'Question'} - ${q.marks ?? 1} Mark${(q.marks ?? 1) > 1 ? 's' : ''}):
          <span style="color: #059669; margin-left: 8px;">Key/Answer: ${q.answer || 'Refer solution steps'}</span>
        </div>
        ${q.markingScheme ? `<div style="margin-top: 4px; color: #0f766e; font-size: 13px;"><strong>Marking Scheme & Value Points:</strong> ${q.markingScheme}</div>` : ''}
        ${q.explanation ? `<div style="margin-top: 4px; color: #334155; font-size: 13px;"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
      </div>
`).join('')}
    </div>
  </div>
  <!-- TEACHER_ANSWER_KEY_END -->
</div>`.trim();
      }
    } else {
      docHtml = isHindi ? `
<div style="font-family: 'Segoe UI', 'Nirmala UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; width: 100%;">
  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px;">
    <h1 style="margin: 0; font-size: 24px;">हिन्दी परीक्षा प्रश्न पत्र</h1>
    <h3 style="margin: 4px 0 0 0; color: #475569;">कक्षा: ${data.grade} | प्रकरण: ${data.topic}</h3>
  </div>
  <p style="margin-bottom: 10px;"><strong>पूर्णांक:</strong> ${data.totalMarks}</p>
  <p>नीचे दिए गए प्रश्नों के उत्तर अपनी अभ्यास पुस्तिका में लिखें तथा अपनी उत्तर-पुस्तिका की फोटो अपलोड करें।</p>
</div>`.trim() : `
<div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #1e293b; width: 100%;">
  <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px;">
    <h1 style="margin: 0; font-size: 24px;">${data.subject.toUpperCase()} EXAMINATION</h1>
    <h3 style="margin: 4px 0 0 0; color: #475569;">Grade: ${data.grade} | Topic: ${data.topic}</h3>
  </div>
  <p style="margin-bottom: 10px;"><strong>Total Marks:</strong> ${data.totalMarks}</p>
  <p>Solve the questions below in your workbook and upload photos of your answer sheets.</p>
</div>`.trim();
    }

    let teacherId: string | null = null;
    if (req.session?.id) {
      const teacher = await db.teacher.findUnique({ where: { id: req.session.id }, select: { id: true } });
      if (teacher) {
        teacherId = teacher.id;
      } else if (req.session.email) {
        const teacherByEmail = await db.teacher.findUnique({ where: { email: req.session.email }, select: { id: true } });
        if (teacherByEmail) teacherId = teacherByEmail.id;
      }
    }

    const normalizedGrade = normalizeGrade(data.grade) || data.grade;
    const paperTitle = (isHindi && generated?.title)
      ? generated.title
      : `${data.subject}: ${data.topic} (${normalizedGrade})`;

    const paper = await (prisma as any).worksheetPaper.create({
      data: {
        title: paperTitle,
        subject: data.subject,
        grade: normalizedGrade,
        totalMarks: data.totalMarks,
        content: docHtml,
        status: 'PUBLISHED',
        teacherId,
      },
    });

    res.status(201).json({ paper });
  } catch (error) { errorResponse(res, error); }
});

app.patch('/api/worksheets/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      title: z.string().trim().min(1).max(200).optional(),
      subject: z.string().trim().max(100).optional(),
      grade: z.string().trim().max(50).optional(),
      totalMarks: z.number().int().min(1).optional(),
      content: z.string().trim().min(1).optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    });
    const data = parse(schema, req.body);
    if (data.grade !== undefined) {
      data.grade = normalizeGrade(data.grade) || data.grade;
    }
    const paper = await prisma.worksheetPaper.update({ where: { id }, data });
    res.json({ paper });
  } catch (error) { errorResponse(res, error); }
});

app.delete('/api/worksheets/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const paper = await prisma.worksheetPaper.findUnique({
      where: { id },
      include: {
        submissions: {
          where: { score: { not: null } },
          include: { student: { select: { grade: true } } }
        }
      }
    });
    if (paper) {
      for (const s of paper.submissions) {
        await recordScoreRecord({
          studentId: s.studentId,
          teacherId: paper.teacherId,
          title: paper.title,
          itemType: 'QUESTION_PAPER',
          score: s.score,
          totalMarks: paper.totalMarks,
          grade: paper.grade || s.student?.grade,
          subject: paper.subject || 'Mathematics',
          completedAt: s.gradedAt || s.submittedAt || new Date(),
          remarks: s.remarks,
          paperId: paper.id,
        });
      }
    }
    await prisma.worksheetPaper.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/worksheets/:id/submit', authenticate('student'), async (req: AuthRequest, res: Response) => {
  try {
    const paperId = req.params.id as string;
    const studentId = req.session!.id;
    const schema = z.object({
      images: z.array(z.string().min(10)).min(1, 'Please upload at least one image of your answer sheet.'),
    });
    const data = parse(schema, req.body);

    const paper = await prisma.worksheetPaper.findUnique({ where: { id: paperId } });
    if (!paper || paper.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Question paper not available for submission.' });
    }

    // Check if submission already exists and was already graded by teacher
    const existing = await prisma.worksheetSubmission.findUnique({
      where: { paperId_studentId: { paperId, studentId } },
    });
    if (existing && existing.status === 'GRADED') {
      return res.status(403).json({ error: 'Your answer sheet has already been evaluated and graded by your teacher. Further submissions are locked.' });
    }

    const submission = await (prisma.worksheetSubmission as any).upsert({
      where: { paperId_studentId: { paperId, studentId } },
      update: {
        images: JSON.stringify(data.images),
        status: 'SUBMITTED',
        submittedAt: new Date(),
        aiStatus: 'EVALUATING',
      },
      create: {
        paperId,
        studentId,
        images: JSON.stringify(data.images),
        status: 'SUBMITTED',
        aiStatus: 'EVALUATING',
      },
    });

    // Option A: Automatically evaluate student submission in background with AI
    void evaluateAnswerSheetSubmissionWithAI(submission.id).catch((err) => {
      console.warn('[AI Evaluation Background Error]', err);
    });

    res.json({ submission });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/worksheets/:id/teacher-upload', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const paperId = req.params.id as string;
    const schema = z.object({
      studentId: z.string().min(1, 'Please select a student.'),
      images: z.array(z.string().min(10)).min(1, 'Please attach at least one photo of the answer sheet.'),
    });
    const data = parse(schema, req.body);

    const paper = await prisma.worksheetPaper.findUnique({ where: { id: paperId } });
    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found.' });
    }

    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const submission = await (prisma.worksheetSubmission as any).upsert({
      where: { paperId_studentId: { paperId, studentId: data.studentId } },
      update: {
        images: JSON.stringify(data.images),
        status: 'SUBMITTED',
        submittedAt: new Date(),
        aiStatus: 'EVALUATING',
      },
      create: {
        paperId,
        studentId: data.studentId,
        images: JSON.stringify(data.images),
        status: 'SUBMITTED',
        aiStatus: 'EVALUATING',
      },
      include: {
        student: { select: { id: true, name: true, grade: true } },
      },
    });

    // Evaluate with AI immediately so teacher sees draft marks right away
    const evaluated = await evaluateAnswerSheetSubmissionWithAI(submission.id);

    res.json({ ok: true, submission: evaluated || submission });
  } catch (error) { errorResponse(res, error); }
});

async function evaluateAnswerSheetSubmissionWithAI(submissionId: string) {
  const sub = await prisma.worksheetSubmission.findUnique({
    where: { id: submissionId },
    include: {
      paper: true,
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  if (!sub || !sub.paper) return null;

  let images: string[] = [];
  try { images = JSON.parse(sub.images || '[]'); } catch { images = []; }
  if (!images || images.length === 0) {
    return null;
  }

  // Update status to EVALUATING
  await (prisma.worksheetSubmission as any).update({
    where: { id: submissionId },
    data: { aiStatus: 'EVALUATING' },
  });

  try {
    let geminiKey = process.env.GEMINI_API_KEY;
    if (sub.paper.teacherId) {
      const teacher = await (prisma.teacher as any).findUnique({
        where: { id: sub.paper.teacherId },
        select: { apiKey: true },
      });
      if (teacher?.apiKey && teacher.apiKey.trim()) {
        geminiKey = teacher.apiKey.trim();
      }
    }

    if (!geminiKey) {
      await (prisma.worksheetSubmission as any).update({
        where: { id: submissionId },
        data: {
          aiStatus: 'FAILED',
          aiDraftRemarks: 'Teacher Gemini API Key is missing. Please configure your API key in Settings > AI Settings to enable AI auto-evaluation.',
        },
      });
      return null;
    }

    // Clean question paper content text
    const cleanContent = sub.paper.content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const imageParts: any[] = [];
    for (let i = 0; i < images.length; i++) {
      let raw = images[i];
      let mimeType = 'image/jpeg';
      if (raw.startsWith('data:')) {
        const [header, b64] = raw.split(';base64,');
        mimeType = header.replace('data:', '') || 'image/jpeg';
        raw = b64;
      }
      raw = raw.replace(/\s+/g, '');
      if (raw) {
        imageParts.push({
          inlineData: {
            mimeType,
            data: raw,
          },
        });
      }
    }

    if (imageParts.length === 0) {
      throw new Error('No valid image data found in submission.');
    }

    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash',
    ];

    // Helper to query Gemini with candidate models fallback
    const queryGemini = async (contents: any[]): Promise<any> => {
      let lastErr = '';
      for (const modelName of candidateModels) {
        try {
          console.log(`[AI Auto-Evaluation] Querying Gemini model: ${modelName}...`);
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { responseMimeType: 'application/json' },
            }),
          });
          const jsonResult: any = await response.json().catch(() => ({}));
          if (!response.ok) {
            lastErr = jsonResult?.error?.message ?? response.statusText;
            console.warn(`[AI Auto-Evaluation] Model ${modelName} returned HTTP ${response.status}: ${lastErr.slice(0, 120)}`);
            // Fall back to next model on 404 (not found), 429 (rate/quota limit), 503 (temporary high demand), or 500
            if (response.status === 404 || response.status === 429 || response.status === 503 || response.status >= 500 || lastErr.includes('not found') || lastErr.includes('quota') || lastErr.includes('demand')) {
              continue;
            }
            throw new Error(`Google Gemini Error: ${lastErr}`);
          }
          const parts = jsonResult.candidates?.[0]?.content?.parts || [];
          const nonThoughtParts = parts.filter((p: any) => !p.thought && typeof p.text === 'string');
          const textOutput = nonThoughtParts.length > 0
            ? nonThoughtParts.map((p: any) => p.text).join('\n')
            : (parts[parts.length - 1]?.text || '');

          if (textOutput) {
            let cleaned = textOutput.trim();
            if (cleaned.startsWith('```')) {
              cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            }
            try {
              return JSON.parse(cleaned);
            } catch {
              const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
              if (match) return JSON.parse(match[0]);
            }
          }
        } catch (err) {
          lastErr = err instanceof Error ? err.message : String(err);
          console.warn(`[AI Auto-Evaluation] Model ${modelName} encountered error: ${lastErr.slice(0, 120)}`);
        }
      }
      throw new Error(lastErr || 'No response from Google Gemini models.');
    };

    // --- STAGE 1: Pure Visual Document & Optical Mark Reading (OMR & Handwriting OCR) ---
    console.log(`[AI Auto-Evaluation] Stage 1: Reading answer sheet images for student ${sub.student?.name || 'Student'}...`);
    const stage1Prompt = `You are a precision Optical Mark Recognition (OMR) and Handwriting Transcription engine.
Your task is to examine the attached student answer sheet photo(s) and transcribe EXACTLY what the student has marked or written for each question.
DO NOT attempt to solve the math problems or judge if the student is right or wrong. Only report what is visually present on the paper.

INSTRUCTIONS:
1. Examine all attached pages carefully from top to bottom.
2. For each question number (Q1, Q2, Q3, ...):
   - MULTIPLE CHOICE / OPTION SELECTION:
     Look closely at the options (A, B, C, D).
     Identify which option has the student's pen/pencil mark, tick, checkmark, circle, underline, or cross on or immediately next to it.
     Be strictly faithful to the placement of the mark:
     - Check which option letter (A, B, C, or D) the mark actually touches or precedes.
     - A checkmark immediately preceding "(C)" belongs to (C), NOT (B).
     - Record the exact option letter and text (e.g., "(C) 4/20 meter" or "(B) 5/8").
   - HANDWRITTEN SOLUTIONS / CALCULATIONS / STEPS:
     Transcribe the student's handwritten equations, working steps, intermediate calculations, and final answer verbatim.
   - If an answer is crossed out or corrected, record the student's final intended answer.
   - If a question was left unattempted or no mark is visible, report "Unattempted / Blank".

Return a JSON object:
{
  "transcriptions": [
    {
      "question": "Q1",
      "studentResponse": "Option (D) 9/4",
      "visualNote": "Blue checkmark on (D)"
    }
  ]
}`;

    let transcribedAnswers: any[] = [];
    try {
      const stage1Result = await queryGemini([{ parts: [...imageParts, { text: stage1Prompt }] }]);
      transcribedAnswers = stage1Result?.transcriptions || stage1Result?.answers || (Array.isArray(stage1Result) ? stage1Result : []);
      console.log(`[AI Auto-Evaluation] Stage 1 Transcribed ${transcribedAnswers.length} responses for student ${sub.student?.name || 'Student'}`);
    } catch (stage1Err) {
      console.warn('[AI Auto-Evaluation] Stage 1 Transcription Warning:', stage1Err);
      transcribedAnswers = [];
    }

    // --- STAGE 2: Rigorous Mathematical Evaluation & Step-by-Step Checking ---
    console.log(`[AI Auto-Evaluation] Stage 2: Mathematically evaluating responses against question paper...`);
    const stage2Prompt = `You are a rigorous, fair, and encouraging Mathematics teacher and official examiner.
Grade the student's submitted answer sheet against the official Question Paper.

STUDENT NAME: ${sub.student?.name || 'Student'}
EXAM TITLE: "${sub.paper.title}"
TOTAL MARKS: ${sub.paper.totalMarks}
GRADE & SUBJECT: ${sub.paper.grade || 'General'} · ${sub.paper.subject || 'Mathematics'}

QUESTION PAPER / EXAM QUESTIONS & MARKING SCHEME:
"""
${cleanContent.slice(0, 10000)}
"""

${transcribedAnswers.length > 0 ? `STUDENT'S ACTUAL RESPONSES (Transcribed from uploaded answer sheet photos):
"""
${JSON.stringify(transcribedAnswers, null, 2)}
"""` : `NOTE: Inspect the attached answer sheet images directly for student marks, handwriting, and answers.`}

GRADING INSTRUCTIONS & RULES:
1. Question-by-Question Evaluation:
   For EVERY question in the Question Paper:
   a. Solve the question mathematically to find the TRUE CORRECT ANSWER, correct option, and required solution steps.
   b. Look at what the student actually marked or wrote.
   c. Award marks strictly:
      - If student's answer/option is CORRECT: status = "CORRECT", award marksAwarded = maxMarks for this question (e.g. 1 out of 1).
      - If student's answer/option is WRONG or INCORRECT: status = "INCORRECT", award marksAwarded = 0. Never give marks for wrong options.
      - If multi-step question with correct partial steps: status = "PARTIAL", award partial marks reflecting the valid steps.
      - If unattempted or blank: status = "INCORRECT", award marksAwarded = 0.
   d. Write concise, clear feedback explaining why the answer is correct or highlighting the mathematical mistake made.
2. Total Score Calculation:
   - "score" MUST EQUAL THE EXACT SUM of all "marksAwarded" in the breakdown array.
   - Ensure 0 <= score <= ${sub.paper.totalMarks}.
3. Constructive Teacher Feedback / Remarks:
   - Write a warm, constructive 2-4 sentence summary for the student and parent.
   - Mention the total marks scored out of ${sub.paper.totalMarks}.
   - Praise topics mastered.
   - Point out specific questions/concepts where mistakes were made so the student knows what to revise.

Return ONLY a JSON object matching this exact structure:
{
  "breakdown": [
    {
      "question": "Q1",
      "correctAnswer": "string (the correct option or answer)",
      "studentWorking": "string (what the student actually marked or wrote)",
      "status": "CORRECT" | "PARTIAL" | "INCORRECT",
      "marksAwarded": number,
      "maxMarks": number,
      "feedback": "string"
    }
  ],
  "score": number,
  "remarks": "string"
}`;

    // If stage 1 had transcriptions, we pass stage 2 as text with transcriptions. If stage 1 was empty, pass imageParts as fallback.
    const stage2Contents = transcribedAnswers.length > 0
      ? [{ parts: [{ text: stage2Prompt }] }]
      : [{ parts: [...imageParts, { text: stage2Prompt }] }];

    const parsed = await queryGemini(stage2Contents);

    if (!parsed || !Array.isArray(parsed.breakdown)) {
      throw new Error('AI evaluation response was incomplete or had an invalid structure.');
    }

    let breakdownScore = 0;
    if (parsed.breakdown.length > 0) {
      breakdownScore = parsed.breakdown.reduce((sum: number, item: any) => sum + (Number(item.marksAwarded) || 0), 0);
    }

    const calculatedScore = Math.min(
      sub.paper.totalMarks,
      Math.max(0, Math.round(parsed.breakdown.length > 0 ? breakdownScore : (Number(parsed.score) || 0)))
    );
    const finalRemarks = String(parsed.remarks || '').trim();
    const finalBreakdown = JSON.stringify(parsed.breakdown);

    const updated = await (prisma.worksheetSubmission as any).update({
      where: { id: submissionId },
      data: {
        aiDraftScore: calculatedScore,
        aiDraftRemarks: finalRemarks,
        aiDraftBreakdown: finalBreakdown,
        aiStatus: 'COMPLETED',
      },
    });

    console.log(`[AI Auto-Evaluation] Completed for student ${sub.student?.name} on paper "${sub.paper.title}": Score ${calculatedScore}/${sub.paper.totalMarks}`);
    return updated;
  } catch (err) {
    console.error('[AI Auto-Evaluation Error]', err);
    await (prisma.worksheetSubmission as any).update({
      where: { id: submissionId },
      data: {
        aiStatus: 'FAILED',
        aiDraftRemarks: err instanceof Error ? err.message : 'Evaluation failed',
      },
    });
    return null;
  }
}

app.post('/api/worksheets/submissions/:submissionId/ai-evaluate', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.submissionId as string;
    const result = await evaluateAnswerSheetSubmissionWithAI(id);
    res.json({ ok: true, result });
  } catch (error) { errorResponse(res, error); }
});

app.patch('/api/worksheets/submissions/:submissionId/grade', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.submissionId as string;
    const schema = z.object({
      score: z.number().int().min(0),
      remarks: z.string().trim().max(1000).optional(),
    });
    const data = parse(schema, req.body);

    const submission = await prisma.worksheetSubmission.update({
      where: { id },
      data: {
        score: data.score,
        remarks: data.remarks ?? null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
      include: {
        student: { select: { id: true, name: true, grade: true } },
        paper: true
      },
    });

    if (submission.paper) {
      void recordScoreRecord({
        studentId: submission.studentId,
        teacherId: submission.paper.teacherId,
        title: submission.paper.title,
        itemType: 'QUESTION_PAPER',
        score: data.score,
        totalMarks: submission.paper.totalMarks,
        grade: submission.paper.grade || submission.student?.grade,
        subject: submission.paper.subject || 'Mathematics',
        completedAt: submission.gradedAt || new Date(),
        remarks: data.remarks ?? null,
        paperId: submission.paperId,
      });
    }

    res.json({ submission });
  } catch (error) { errorResponse(res, error); }
});

app.delete('/api/worksheets/submissions/:submissionId/images', adminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.submissionId as string;
    const submission = await prisma.worksheetSubmission.update({
      where: { id },
      data: {
        images: '[]',
      },
    });
    res.json({ submission, ok: true });
  } catch (error) { errorResponse(res, error); }
});

app.delete('/api/worksheets/submissions/:submissionId', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.submissionId as string;
    const sub = await prisma.worksheetSubmission.findUnique({
      where: { id },
      include: { student: true, paper: true },
    });

    if (!sub) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    // Clean up persistent score records if teacher had saved marks
    if (sub.paperId && sub.studentId) {
      try {
        await prisma.studentScoreRecord.deleteMany({
          where: {
            paperId: sub.paperId,
            studentId: sub.studentId,
            itemType: 'QUESTION_PAPER',
          },
        });
      } catch (scoreErr) {
        console.warn('[Reset Submission Score Cleanup]', scoreErr);
      }
    }

    // Completely delete the worksheet submission
    await prisma.worksheetSubmission.delete({
      where: { id },
    });

    console.log(`[Reset Submission] Cleared answer sheet submission for student ${sub.student?.name} on paper "${sub.paper?.title}"`);
    res.json({ ok: true, message: 'Submission reset successfully.' });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/worksheets/submissions/:submissionId/reset', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.submissionId as string;
    const sub = await prisma.worksheetSubmission.findUnique({
      where: { id },
      include: { student: true, paper: true },
    });

    if (!sub) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    if (sub.paperId && sub.studentId) {
      try {
        await prisma.studentScoreRecord.deleteMany({
          where: {
            paperId: sub.paperId,
            studentId: sub.studentId,
            itemType: 'QUESTION_PAPER',
          },
        });
      } catch (scoreErr) {
        console.warn('[Reset Submission Score Cleanup]', scoreErr);
      }
    }

    await prisma.worksheetSubmission.delete({
      where: { id },
    });

    res.json({ ok: true, message: 'Submission reset successfully.' });
  } catch (error) { errorResponse(res, error); }
});

// --- STUDY MATERIAL MODULE (VERSION 2) ---

// Public Study Materials List
app.get('/api/public/study-materials', async (req: Request, res: Response) => {
  try {
    const grade = typeof req.query.grade === 'string' && req.query.grade ? req.query.grade : undefined;
    const subject = typeof req.query.subject === 'string' && req.query.subject ? req.query.subject : undefined;
    const mediaType = typeof req.query.mediaType === 'string' && req.query.mediaType ? req.query.mediaType : undefined;
    const search = typeof req.query.search === 'string' && req.query.search.trim() ? req.query.search.trim() : undefined;

    const where: any = { status: 'PUBLISHED' };
    if (grade && grade !== 'All Grades' && grade !== 'ALL') {
      where.grade = grade;
    }
    if (subject && subject !== 'All Subjects' && subject !== 'ALL') {
      where.subject = subject;
    }
    if (mediaType && mediaType !== 'ALL') {
      where.mediaType = mediaType;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const materials = await prisma.studyMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        grade: true,
        subject: true,
        mediaType: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        videoUrl: true,
        coverImage: true,
        readTime: true,
        authorName: true,
        status: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ materials, count: materials.length });
  } catch (error) { errorResponse(res, error); }
});

// Public Single Study Material Details (with view count increment)
app.get('/api/public/study-materials/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const material = await prisma.studyMaterial.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    if (!material) return res.status(404).json({ error: 'Study material not found.' });
    res.json({ material });
  } catch (error) { errorResponse(res, error); }
});

// Public Summary of Grades & Material Counts
app.get('/api/public/grades-summary', async (_req: Request, res: Response) => {
  try {
    const all = await prisma.studyMaterial.findMany({
      where: { status: 'PUBLISHED' },
      select: { grade: true, subject: true, mediaType: true },
    });

    const standardGrades = ['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
    const gradeCounts: Record<string, number> = {};
    for (const g of standardGrades) gradeCounts[g] = 0;

    const subjectsSet = new Set<string>();
    for (const item of all) {
      if (item.grade) {
        gradeCounts[item.grade] = (gradeCounts[item.grade] ?? 0) + 1;
      }
      if (item.subject) subjectsSet.add(item.subject);
    }

    res.json({
      grades: gradeCounts,
      subjects: Array.from(subjectsSet),
      totalMaterials: all.length,
    });
  } catch (error) { errorResponse(res, error); }
});

// Super Admin Study Material Management Endpoints (Public Portal Control)
app.get('/api/study-materials', superAdminOnly, async (_req: Request, res: Response) => {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ materials });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/study-materials', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(1000).optional().nullable(),
      content: z.string().trim().optional().nullable(),
      grade: z.string().trim().min(1).max(50),
      subject: z.string().trim().min(1).max(50).default('Mathematics'),
      mediaType: z.enum(['ARTICLE', 'PDF', 'VIDEO', 'PRESENTATION', 'IMAGE', 'WORKSHEET']).default('ARTICLE'),
      fileUrl: z.string().trim().optional().nullable(),
      fileName: z.string().trim().optional().nullable(),
      fileSize: z.number().int().optional().nullable(),
      videoUrl: z.string().trim().optional().nullable(),
      coverImage: z.string().trim().optional().nullable(),
      readTime: z.string().trim().optional().nullable(),
      authorName: z.string().trim().optional().default('EduAshram'),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
    });
    const data = parse(schema, req.body);
    const material = await prisma.studyMaterial.create({ data: data as Prisma.StudyMaterialCreateInput });
    res.status(201).json({ material });
  } catch (error) { errorResponse(res, error); }
});

app.put('/api/study-materials/:id', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(1000).optional().nullable(),
      content: z.string().trim().optional().nullable(),
      grade: z.string().trim().min(1).max(50).optional(),
      subject: z.string().trim().min(1).max(50).optional(),
      mediaType: z.enum(['ARTICLE', 'PDF', 'VIDEO', 'PRESENTATION', 'IMAGE', 'WORKSHEET']).optional(),
      fileUrl: z.string().trim().optional().nullable(),
      fileName: z.string().trim().optional().nullable(),
      fileSize: z.number().int().optional().nullable(),
      videoUrl: z.string().trim().optional().nullable(),
      coverImage: z.string().trim().optional().nullable(),
      readTime: z.string().trim().optional().nullable(),
      authorName: z.string().trim().optional(),
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    });
    const data = parse(schema, req.body);
    const material = await prisma.studyMaterial.update({ where: { id }, data: data as Prisma.StudyMaterialUpdateInput });
    res.json({ material });
  } catch (error) { errorResponse(res, error); }
});

app.delete('/api/study-materials/:id', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.studyMaterial.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});

app.post('/api/study-materials/upload', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      fileName: z.string().min(1),
      fileData: z.string().min(1), // base64
      mediaType: z.enum(['PDF', 'PRESENTATION', 'IMAGE', 'VIDEO']),
    });
    const data = parse(schema, req.body);
    const uploadsDir = resolve('public/uploads/materials');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = data.fileName.includes('.') ? data.fileName.substring(data.fileName.lastIndexOf('.')) : '.dat';
    const safeBase = randomBytes(8).toString('hex');
    const storedFileName = `${Date.now()}_${safeBase}${ext}`;
    const filePath = resolve(uploadsDir, storedFileName);

    let base64Pure = data.fileData;
    if (base64Pure.includes(';base64,')) {
      base64Pure = base64Pure.split(';base64,')[1];
    }
    const buffer = Buffer.from(base64Pure, 'base64');
    writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/materials/${storedFileName}`;
    res.json({ fileUrl, fileName: data.fileName, fileSize: buffer.length });
  } catch (error) { errorResponse(res, error); }
});

/* ==========================================================================
   SUPER ADMIN AI IMAGE STUDIO (ARTICLES & MATERIALS)
   Powered by Google Gemini Imagen 3 and ChatGPT DALL-E 3
   ========================================================================== */

interface AIGeneratedArticleImage {
  id: string;
  fileName: string;
  fileUrl: string;
  prompt: string;
  fullPrompt: string;
  provider: 'gemini' | 'gemini_vector' | 'openai' | string;
  aspectRatio: string;
  stylePreset: string;
  createdAt: string;
  fileSize?: number;
  format?: string;
}

function getAiGallery(): AIGeneratedArticleImage[] {
  const file = resolve('public/uploads/materials/ai-articles-gallery.json');
  if (!existsSync(file)) return [];
  try {
    const raw = readFileSync(file, 'utf-8');
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.filter((it: any) => it?.fileName && existsSync(resolve('public/uploads/materials', it.fileName)));
  } catch {
    return [];
  }
}

function saveAiGallery(items: AIGeneratedArticleImage[]) {
  const dir = resolve('public/uploads/materials');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = resolve(dir, 'ai-articles-gallery.json');
  writeFileSync(file, JSON.stringify(items.slice(0, 150), null, 2));
}

function cleanAndNormalizeSvg(rawText: string, width = 800, height = 450): string | null {
  if (!rawText) return null;
  let text = rawText.replace(/```(?:xml|svg|html)?/gi, '').replace(/```/g, '').trim();

  const lower = text.toLowerCase();
  const startIdx = lower.indexOf('<svg');
  const endIdx = lower.lastIndexOf('</svg>');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  let svg = text.substring(startIdx, endIdx + 6).trim();
  const closeOpenTag = svg.indexOf('>');
  if (closeOpenTag === -1) return null;

  let openTag = svg.substring(0, closeOpenTag + 1);
  let rest = svg.substring(closeOpenTag + 1);

  if (!/xmlns\s*=/i.test(openTag)) {
    openTag = openTag.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!/xmlns:xlink\s*=/i.test(openTag)) {
    openTag = openTag.replace(/<svg/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  if (!/viewBox\s*=/i.test(openTag)) {
    openTag = openTag.replace(/<svg/i, `<svg viewBox="0 0 ${width} ${height}"`);
  }
  if (!/\bwidth\s*=/i.test(openTag)) {
    openTag = openTag.replace(/<svg/i, '<svg width="100%"');
  }
  if (!/\bheight\s*=/i.test(openTag)) {
    openTag = openTag.replace(/<svg/i, '<svg height="100%"');
  }

  // Ensure solid white background rect is present so graphic is always bright, clear, and visible
  if (!rest.includes('fill="#ffffff"') && !rest.includes('fill="#fff"') && !rest.includes('fill="white"')) {
    rest = `<rect width="100%" height="100%" fill="#ffffff" rx="6" />\n` + rest;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${openTag}\n${rest}`;
}

function applyArticleStylePreset(prompt: string, preset: string, _aspectRatio?: string): string {
  const p = prompt.trim();
  switch (preset) {
    case 'splashlearn_vector':
      return `Expert educational 2D vector illustration inspired by modern educational websites like SplashLearn, child-friendly for school students Grades 1 to 10. Clean flat vector artwork with smooth rounded shapes and clean outlines, soft pastel colors with bright cheerful accents, pure white background with generous whitespace. Clear visual hierarchy with the central educational concept as prominent focal point, uncluttered, minimal subtle shadows, zero realistic textures, no watermarks, no branding. Scientifically and mathematically accurate diagrams, step-by-step visual explanations: ${p}`;
    case 'vibrant_banner':
      return `High-end editorial article header illustration, vibrant educational 3D digital art, topic: ${p}. Clean composition, volumetric lighting, rich color palette, 8k resolution, suitable for educational mathematics magazine, no misspelled or distorted text.`;
    case 'clean_infographic':
      return `Modern educational infographic diagram, flat vector graphic design, clean minimalist aesthetic, white background, high contrast, topic: ${p}. Clear geometric precision, mathematical elegance, publication quality.`;
    case 'classical_sketch':
      return `Renaissance vintage mathematical sketchbook drawing, Leonardo da Vinci style sepia ink on parchment paper, technical engraving, intricate geometric annotations, topic: ${p}. Academic, historical, masterwork illustration.`;
    case 'abstract_math':
      return `Abstract mathematical visualization, glowing celestial geometric structures, radiant sacred geometry and fractal spirals in deep cosmic space, ethereal neon highlights, topic: ${p}. 8k digital wallpaper.`;
    case 'chalkboard_blueprint':
      return `Classroom chalkboard aesthetic with clean white and turquoise chalk drawings, geometric constructions, formulas and diagrams, high contrast, topic: ${p}. Crisp educational illustration.`;
    case 'none':
    default:
      return p;
  }
}

// Generate an article image with Gemini Imagen 3 or OpenAI DALL-E 3
app.post('/api/superadmin/generate-article-image', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      prompt: z.string().trim().min(3).max(2500),
      provider: z.enum(['gemini', 'gemini_vector', 'openai']).default('gemini'),
      aspectRatio: z.enum(['16:9', '1:1', '4:3']).default('16:9'),
      stylePreset: z.string().optional().default('splashlearn_vector'),
      customApiKey: z.string().optional(),
      autoEnhance: z.boolean().optional().default(false),
    });
    const data = parse(schema, req.body);

    const uploadsDir = resolve('public/uploads/materials');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    let fullPrompt = applyArticleStylePreset(data.prompt, data.stylePreset, data.aspectRatio);

    const cleanCustom = data.customApiKey?.trim();
    const geminiKey = cleanCustom?.startsWith('AIza')
      ? cleanCustom
      : (process.env.GEMINI_API_KEY || (cleanCustom && !cleanCustom.startsWith('sk-') ? cleanCustom : undefined));
    const openaiKey = cleanCustom?.startsWith('sk-')
      ? cleanCustom
      : (process.env.OPENAI_API_KEY || (cleanCustom && cleanCustom.startsWith('sk-') ? cleanCustom : undefined));

    let imageBuffer: Buffer | null = null;
    let providerUsed = data.provider;
    let detectedExt = '.webp';

    if (data.provider === 'gemini' || data.provider === 'gemini_vector') {
      if (!geminiKey) {
        throw new Error('Google Gemini API Key is required. Please enter your Gemini API Key in the Studio or configure GEMINI_API_KEY in the server .env.');
      }

      let lastErr = '';

      // Strategy A: Only attempt native Imagen 3 photorealistic generation if provider is 'gemini' (and not 'gemini_vector')
      if (data.provider === 'gemini') {
        const legacyModels = ['imagen-3.0-generate-002'];
        for (const model of legacyModels) {
          try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${geminiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiKey,
              },
              body: JSON.stringify({
                instances: [{ prompt: fullPrompt }],
                parameters: {
                  sampleCount: 1,
                  aspectRatio: data.aspectRatio,
                },
              }),
            });
            const json: any = await resp.json().catch(() => ({}));
            if (resp.ok && json.predictions?.[0]?.bytesBase64Encoded) {
              imageBuffer = Buffer.from(json.predictions[0].bytesBase64Encoded, 'base64');
              const mime = json.predictions[0].mimeType || 'image/png';
              if (mime.includes('webp')) detectedExt = '.webp';
              else if (mime.includes('jpeg') || mime.includes('jpg')) detectedExt = '.jpg';
              else detectedExt = '.png';
              break;
            } else {
              lastErr = json?.error?.message || resp.statusText;
              console.warn(`[AI Article Image] Imagen 3 returned HTTP ${resp.status}: ${lastErr}`);
            }
          } catch (e: any) {
            lastErr = e.message || String(e);
          }
        }
      }

      // Strategy B: High-Resolution Educational SVG Vector Graphic via Gemini 2.5 Flash / Flash Lite
      // (Bypasses Google Cloud billing requirements completely! Generates crisp, publication-grade SVG graphics for 100% free with any Gemini API Key)
      if (!imageBuffer) {
        const textModels = [
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite',
          'gemini-flash-latest',
          'gemini-2.0-flash',
          'gemini-2.5-pro',
        ];
        const w = data.aspectRatio === '16:9' ? 800 : (data.aspectRatio === '1:1' ? 600 : 800);
        const h = data.aspectRatio === '16:9' ? 450 : (data.aspectRatio === '1:1' ? 600 : 600);
        const svgPrompt = `You are an elite educational graphic designer and SVG artist.
Create a complete, beautiful, child-friendly 2D vector educational graphic in valid, standalone SVG format for school students (Grades 1 to 10).
Topic / Educational Concept: ${data.prompt}
Visual Style: Modern educational vector art inspired by SplashLearn and Khan Academy.
Design requirements:
- Canvas: viewBox="0 0 ${w} ${h}" width="100%" height="100%"
- Background: A crisp, clean white background (<rect width="100%" height="100%" fill="#ffffff" />)
- Color Palette: Vibrant, harmonious pastel tones (soft emerald, sky blue, warm amber, coral, violet, slate) with high contrast for easy reading
- Content: Visually explain the concept with mathematically/scientifically accurate geometric shapes, curves, labeled components, numbers, or step-by-step diagrams
- Typography: Use clean modern sans-serif <text> elements (font-family="system-ui, -apple-system, sans-serif") with font-weight="600" or "bold"
- Polish: Rounded corners (rx, ry), subtle gradients (<linearGradient>), clear borders, balanced whitespace
- Output format: Return ONLY the raw SVG code starting with <svg and ending with </svg>. Do NOT include markdown code fences, preamble, or commentary.`;

        for (const model of textModels) {
          try {
            console.log(`[AI Article Image] Generating vector graphic with model: ${model}...`);
            const svgResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiKey,
              },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [{ text: svgPrompt }],
                }],
                generationConfig: {
                  temperature: 0.2,
                },
              }),
            });
            const svgJson: any = await svgResp.json().catch(() => ({}));
            if (!svgResp.ok) {
              const errMsg = svgJson?.error?.message || svgResp.statusText;
              console.warn(`[AI Article Image] Vector model ${model} HTTP ${svgResp.status}: ${errMsg}`);
              lastErr = errMsg;
              continue;
            }
            const rawText = svgJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const normalized = cleanAndNormalizeSvg(rawText, w, h);
            if (normalized) {
              imageBuffer = Buffer.from(normalized, 'utf-8');
              detectedExt = '.svg';
              providerUsed = data.provider === 'gemini' ? 'gemini' : 'gemini_vector';
              console.log(`[AI Article Image] Successfully generated vector SVG graphic with model ${model}`);
              break;
            }
          } catch (e: any) {
            console.warn(`[AI Article Image] Vector model ${model} fetch exception:`, e.message);
            lastErr = e.message || String(e);
          }
        }
      }

      if (!imageBuffer) {
        let friendlyMsg = `Google Gemini Error: ${lastErr || 'Model returned empty image data.'}`;
        if (
          lastErr.toLowerCase().includes('not found') ||
          lastErr.toLowerCase().includes('not supported') ||
          lastErr.includes('404') ||
          lastErr.toLowerCase().includes('predict') ||
          lastErr.toLowerCase().includes('billing')
        ) {
          friendlyMsg = `Google Gemini Image Generation is not active on this Gemini API Key. Google AI Studio restricts native Imagen 3 photorealistic generation to accounts with Google Cloud billing enabled. Please switch to "Gemini Vector Art" (100% free with any Gemini key) or choose "ChatGPT DALL·E 3 (OpenAI)".`;
        }
        throw new Error(friendlyMsg);
      }
    } else {
      // OpenAI DALL-E & GPT Vector Fallback
      if (!openaiKey) {
        throw new Error('ChatGPT (OpenAI) API Key is required. Please enter your OpenAI API Key in the Studio or configure OPENAI_API_KEY in the server .env.');
      }

      let dalleSize: '1024x1024' | '1792x1024' = data.aspectRatio === '1:1' ? '1024x1024' : '1792x1024';

      const callOpenAIImages = async (model: string, size: string) => {
        const payload: Record<string, any> = {
          model,
          prompt: fullPrompt,
          n: 1,
          size,
        };
        const resp = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const json: any = await resp.json().catch(() => ({}));
        return { ok: resp.ok, statusText: resp.statusText, json };
      };

      // 1. Primary attempt: DALL-E 3 with requested size (omitting response_format)
      let attempt = await callOpenAIImages('dall-e-3', dalleSize);

      // 2. If size not supported by account tier, retry standard square 1024x1024
      if (!attempt.ok && dalleSize !== '1024x1024') {
        const retrySquare = await callOpenAIImages('dall-e-3', '1024x1024');
        if (retrySquare.ok) {
          attempt = retrySquare;
        }
      }

      // 3. Fallback to DALL-E 2 if DALL-E 3 is unavailable or out of quota
      if (!attempt.ok) {
        const dalle2Attempt = await callOpenAIImages('dall-e-2', '1024x1024');
        if (dalle2Attempt.ok) {
          attempt = dalle2Attempt;
        }
      }

      // 4. Fallback: If DALL-E models fail (e.g. project key lacks image permissions or account lacks credits),
      // generate a crisp educational SVG diagram using GPT-4o-mini!
      if (!attempt.ok) {
        try {
          const w = data.aspectRatio === '16:9' ? 800 : (data.aspectRatio === '1:1' ? 600 : 800);
          const h = data.aspectRatio === '16:9' ? 450 : (data.aspectRatio === '1:1' ? 600 : 600);
          const gptSvgPrompt = `You are a master educational illustrator and SVG graphics engineer.
Generate a complete, beautiful, child-friendly 2D vector educational illustration in standalone SVG format for: ${data.prompt}.
Specifications:
- Canvas: viewBox="0 0 ${w} ${h}" width="100%" height="100%"
- Background: pure white (<rect width="100%" height="100%" fill="#ffffff" />)
- Color Palette: SplashLearn / Khan Academy style modern pastels and vibrant accents
- Typography: Clean sans-serif <text> labels
- Output: Output ONLY valid raw <svg ...>...</svg> code without markdown backticks or explanations.`;

          const gptResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: gptSvgPrompt }],
              temperature: 0.2,
            }),
          });
          const gptJson: any = await gptResp.json().catch(() => ({}));
          const gptRaw = gptJson?.choices?.[0]?.message?.content || '';
          const normalized = cleanAndNormalizeSvg(gptRaw, w, h);
          if (normalized) {
            imageBuffer = Buffer.from(normalized, 'utf-8');
            detectedExt = '.svg';
          }
        } catch {
          // ignore
        }

        if (!imageBuffer) {
          const errMsg = attempt.json?.error?.message || attempt.statusText;
          let userFriendly = `OpenAI DALL-E Error: ${errMsg}`;
          if (errMsg.toLowerCase().includes('does not exist') || errMsg.toLowerCase().includes('not found')) {
            userFriendly = `OpenAI Error: The model 'dall-e-3' is not accessible with this API Key. This occurs when your OpenAI account has $0.00 credit balance (DALL-E requires prepaid platform credits at platform.openai.com/billing) or if you are using a Project Key restricted to chat models. Tip: Switch to "Google Gemini" above to generate your diagram for free!`;
          }
          throw new Error(userFriendly);
        }
      }

      if (!imageBuffer && attempt.ok) {
        const item = attempt.json?.data?.[0];
        if (item?.b64_json) {
          imageBuffer = Buffer.from(item.b64_json, 'base64');
          detectedExt = '.png';
        } else if (item?.url) {
          const dlRes = await fetch(item.url);
          if (!dlRes.ok) throw new Error(`Failed to download generated image from OpenAI: ${dlRes.statusText}`);
          const ab = await dlRes.arrayBuffer();
          imageBuffer = Buffer.from(ab);
          detectedExt = '.png';
        }
      }

      if (!imageBuffer) {
        throw new Error('OpenAI DALL-E did not return valid image data.');
      }
      if (!detectedExt) {
        detectedExt = '.png';
      }
    }

    const safeBase = randomBytes(6).toString('hex');
    const storedFileName = `ai-art-${Date.now()}_${safeBase}${detectedExt}`;
    const filePath = resolve(uploadsDir, storedFileName);
    writeFileSync(filePath, imageBuffer);

    const distUploadsDir = resolve('dist/uploads/materials');
    if (existsSync(distUploadsDir)) {
      try {
        writeFileSync(resolve(distUploadsDir, storedFileName), imageBuffer);
      } catch { }
    }

    const fileUrl = `/uploads/materials/${storedFileName}`;
    const newImage: AIGeneratedArticleImage = {
      id: `img_${Date.now()}_${safeBase}`,
      fileName: storedFileName,
      fileUrl,
      prompt: data.prompt,
      fullPrompt,
      provider: providerUsed,
      aspectRatio: data.aspectRatio,
      stylePreset: data.stylePreset,
      createdAt: new Date().toISOString(),
      fileSize: imageBuffer.length,
      format: detectedExt.replace('.', '').toUpperCase(),
    };

    const currentGallery = getAiGallery();
    currentGallery.unshift(newImage);
    saveAiGallery(currentGallery);

    res.json({
      ok: true,
      image: newImage,
      message: 'Article image generated and saved permanently to library.',
    });
  } catch (error) { errorResponse(res, error); }
});

// Prompt enhancement via LLM
app.post('/api/superadmin/enhance-image-prompt', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      prompt: z.string().trim().min(2),
      stylePreset: z.string().optional().default('splashlearn_vector'),
      aspectRatio: z.string().optional().default('16:9'),
      customApiKey: z.string().optional(),
      provider: z.enum(['gemini', 'gemini_vector', 'openai']).optional().default('gemini'),
    });
    const data = parse(schema, req.body);

    const cleanCustom = data.customApiKey?.trim();
    const geminiKey = cleanCustom?.startsWith('AIza')
      ? cleanCustom
      : (process.env.GEMINI_API_KEY || (cleanCustom && !cleanCustom.startsWith('sk-') ? cleanCustom : undefined));
    const openaiKey = cleanCustom?.startsWith('sk-')
      ? cleanCustom
      : (process.env.OPENAI_API_KEY || (cleanCustom && cleanCustom.startsWith('sk-') ? cleanCustom : undefined));

    const systemPrompt = data.stylePreset === 'splashlearn_vector'
      ? `You are an expert educational illustrator and visual learning designer for a school education portal. Your task is to generate a high-quality educational illustration prompt based on the topic and concept provided by the user.
1. Illustration Style: Clean, attractive, child-friendly, 2D vector illustration inspired by modern educational websites such as SplashLearn. Flat vector artwork with smooth rounded shapes and clean outlines. Soft pastel colours combined with bright, cheerful accent colours. A predominantly white background with plenty of whitespace. Simple, attractive compositions that make the educational concept easy to understand. Cute decorative elements such as books, pencils, plants, stars, classroom objects, or playful shapes when relevant. Minimal shadows and subtle depth, avoiding realistic textures. Visually appealing for school students, especially Grades 1–10.
2. Educational Accuracy: Represent the concept accurately and clearly. Scientifically and mathematically correct diagrams, labelled illustrations, and clear processes.
3. Composition: Main concept as focal point, balanced layout, clear visual hierarchy, no watermarks, no branding.
Output ONLY the final image generation prompt text under 85 words, without commentary or quotes.`
      : `You are an award-winning art director for educational publications. Expand the given brief topic into a vivid, descriptive prompt for an AI image generator (like DALL-E 3 or Imagen 3). Keep it under 65 words. Output ONLY the prompt text without preamble or quotes.`;

    let enhanced = '';

    if (data.provider === 'openai' && openaiKey) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: `Topic: ${data.prompt}. Target style: ${data.stylePreset}. Aspect ratio: ${data.aspectRatio}.`
            }
          ],
          temperature: 0.7,
        }),
      });
      const json: any = await resp.json().catch(() => ({}));
      enhanced = json?.choices?.[0]?.message?.content?.trim() || '';
    } else if (geminiKey) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nTopic: ${data.prompt}\nStyle: ${data.stylePreset}\nAspect Ratio: ${data.aspectRatio}`
            }]
          }]
        }),
      });
      const json: any = await resp.json().catch(() => ({}));
      enhanced = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }

    if (!enhanced) {
      enhanced = applyArticleStylePreset(data.prompt, data.stylePreset, data.aspectRatio);
    }

    res.json({ ok: true, enhancedPrompt: enhanced });
  } catch (error) { errorResponse(res, error); }
});

// Fetch all generated AI images from gallery
app.get('/api/superadmin/ai-images', superAdminOnly, async (_req: Request, res: Response) => {
  try {
    const gallery = getAiGallery();
    res.json({ ok: true, images: gallery });
  } catch (error) { errorResponse(res, error); }
});

// Delete an AI image from disk and gallery
app.delete('/api/superadmin/ai-images/:id', superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const gallery = getAiGallery();
    const target = gallery.find(item => item.id === id);
    if (target) {
      const filePath = resolve('public/uploads/materials', target.fileName);
      if (existsSync(filePath)) {
        try { unlinkSync(filePath); } catch { }
      }
      const updated = gallery.filter(item => item.id !== id);
      saveAiGallery(updated);
    }
    res.json({ ok: true });
  } catch (error) { errorResponse(res, error); }
});

/* ==========================================================================
   ATTENDANCE, FEES & STUDENT PROGRESS REPORT MODULES
   ========================================================================== */

// 1. Attendance - Fetch daily attendance sheet
app.get('/api/attendance', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.session!.id;
    const date = typeof req.query.date === 'string' && req.query.date ? req.query.date : new Date().toISOString().slice(0, 10);
    const grade = typeof req.query.grade === 'string' && req.query.grade ? req.query.grade : 'ALL';

    const studentWhere: any = { active: true };
    if (req.session?.role !== 'superadmin') {
      studentWhere.teacherId = teacherId;
    }
    if (grade !== 'ALL' && grade !== 'All Grades') {
      studentWhere.grade = grade;
    }

    const students: any[] = await (prisma.student as any).findMany({
      where: studentWhere,
      select: { id: true, name: true, grade: true, joiningDate: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    // Exclude students who joined after this date
    const eligibleStudents = students.filter((s: any) => {
      const { joiningDate: jDate } = getStudentJoiningDate(s);
      return date >= jDate;
    });

    const studentIds = eligibleStudents.map((s) => s.id);
    const existingRecords = await (prisma as any).studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        date,
      },
    });

    const recordMap = new Map<string, any>(existingRecords.map((r: any) => [r.studentId, r]));

    const records = eligibleStudents.map((s) => {
      const rec = recordMap.get(s.id);
      return {
        studentId: s.id,
        name: s.name,
        grade: s.grade || 'Grade 6',
        status: rec ? rec.status : 'PRESENT',
        hasRecord: Boolean(rec),
        remarks: rec?.remarks || '',
        updatedAt: rec?.updatedAt || null,
      };
    });

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
    const rate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

    res.json({
      date,
      academicYear: getAcademicYear(date),
      records,
      summary: {
        total: records.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendanceRate: rate,
      },
    });
  } catch (error) { errorResponse(res, error); }
});

// 2. Attendance - Save/Batch update daily attendance
app.post('/api/attendance', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.session!.id;
    const schema = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      records: z.array(z.object({
        studentId: z.string().min(1),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).default('PRESENT'),
        remarks: z.string().max(250).optional().nullable(),
      })).min(1),
    });
    const { date, records } = parse(schema, req.body);
    const academicYear = getAcademicYear(date);

    await (prisma as any).$transaction(
      records.map((r) =>
        (prisma as any).studentAttendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date } },
          update: {
            status: r.status,
            remarks: r.remarks || null,
            academicYear,
          },
          create: {
            studentId: r.studentId,
            teacherId,
            date,
            status: r.status,
            remarks: r.remarks || null,
            academicYear,
          },
        })
      )
    );

    invalidateProgressCache();

    res.json({ ok: true, savedCount: records.length, date });
  } catch (error) { errorResponse(res, error); }
});

// 3. Attendance - Monthly grid view
app.get('/api/attendance/monthly', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.session!.id;
    const yearMonth = typeof req.query.yearMonth === 'string' && req.query.yearMonth ? req.query.yearMonth : new Date().toISOString().slice(0, 7);
    const grade = typeof req.query.grade === 'string' && req.query.grade ? req.query.grade : 'ALL';

    const studentWhere: any = { active: true };
    if (req.session?.role !== 'superadmin') studentWhere.teacherId = teacherId;
    if (grade !== 'ALL' && grade !== 'All Grades') studentWhere.grade = grade;

    const students: any[] = await (prisma.student as any).findMany({
      where: studentWhere,
      select: { id: true, name: true, grade: true, joiningDate: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    // Exclude students who joined after this month
    const eligibleStudents = students.filter((s: any) => {
      const { joiningYearMonth: jYearMonth } = getStudentJoiningDate(s);
      return yearMonth >= jYearMonth;
    });

    const studentIds = eligibleStudents.map((s) => s.id);
    const monthRecords = await (prisma as any).studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: { startsWith: yearMonth },
      },
      orderBy: { date: 'asc' },
    });

    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const monthlyStudents = eligibleStudents.map((st) => {
      const studentRecs = monthRecords.filter((r: any) => r.studentId === st.id);
      const days: Record<string, string> = {};
      studentRecs.forEach((r: any) => {
        const day = String(parseInt(r.date.slice(8, 10), 10));
        days[day] = r.status;
      });
      const presentCount = studentRecs.filter((r: any) => r.status === 'PRESENT').length;
      const absentCount = studentRecs.filter((r: any) => r.status === 'ABSENT').length;
      const lateCount = studentRecs.filter((r: any) => r.status === 'LATE').length;
      const excusedCount = studentRecs.filter((r: any) => r.status === 'EXCUSED').length;
      const totalMarked = studentRecs.length;
      const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

      return {
        studentId: st.id,
        name: st.name,
        grade: st.grade,
        days,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        totalMarked,
        attendanceRate,
      };
    });

    res.json({ yearMonth, daysInMonth, students: monthlyStudents, records: monthRecords });
  } catch (error) { errorResponse(res, error); }
});

// 4. Monthly Fees - Fetch monthly fee register
app.get('/api/fees', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.session!.id;
    const currentYear = getAcademicYear();
    const academicYear = typeof req.query.academicYear === 'string' && req.query.academicYear ? req.query.academicYear : currentYear;

    const d = new Date();
    const curMonthIdx = (d.getMonth() + 9) % 12; // Apr=0, May=1, ... Mar=11
    const defaultMonth = ACADEMIC_MONTHS[curMonthIdx] || 'April';
    const month = typeof req.query.month === 'string' && req.query.month ? req.query.month : defaultMonth;
    const grade = typeof req.query.grade === 'string' && req.query.grade ? req.query.grade : 'ALL';

    const studentWhere: any = { active: true };
    if (req.session?.role !== 'superadmin') studentWhere.teacherId = teacherId;
    if (grade !== 'ALL' && grade !== 'All Grades') studentWhere.grade = grade;

    const targetYM = getCalendarYearMonth(academicYear, month).yearMonth;

    const students: any[] = await (prisma.student as any).findMany({
      where: studentWhere,
      select: { id: true, name: true, grade: true, joiningDate: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    // Only show students who joined in or before this month
    const eligibleStudents = students.filter((s: any) => {
      const { joiningYearMonth: jYearMonth } = getStudentJoiningDate(s);
      return targetYM >= jYearMonth;
    });

    const studentIds = eligibleStudents.map((s) => s.id);
    const feeRecords = await (prisma as any).studentFee.findMany({
      where: {
        studentId: { in: studentIds },
        academicYear,
        month,
      },
    });

    const feeMap = new Map<string, any>(feeRecords.map((f: any) => [f.studentId, f]));

    const fees = eligibleStudents.map((s) => {
      const f = feeMap.get(s.id);
      const amountDue = f ? f.amountDue : 1500;
      const amountPaid = f ? f.amountPaid : 0;
      const status = f ? f.status : 'PENDING';
      return {
        id: f?.id || null,
        studentId: s.id,
        name: s.name,
        grade: s.grade || 'Grade 6',
        academicYear,
        month,
        amountDue,
        amountPaid,
        status,
        paidAt: f?.paidAt || null,
        paymentMode: f?.paymentMode || null,
        receiptNo: f?.receiptNo || null,
        notes: f?.notes || '',
      };
    });

    const totalDue = fees.reduce((sum, f) => sum + f.amountDue, 0);
    const totalCollected = fees.reduce((sum, f) => sum + f.amountPaid, 0);
    const totalPending = Math.max(0, totalDue - totalCollected);
    const paidCount = fees.filter((f) => f.status === 'PAID').length;
    const pendingCount = fees.filter((f) => f.status === 'PENDING' || f.status === 'OVERDUE').length;
    const partialCount = fees.filter((f) => f.status === 'PARTIAL').length;
    const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

    res.json({
      academicYear,
      month,
      records: fees,
      fees,
      summary: {
        totalStudents: eligibleStudents.length,
        totalDue,
        totalCollected,
        totalPending,
        paidCount,
        pendingCount,
        partialCount,
        collectionRate,
      },
    });
  } catch (error) { errorResponse(res, error); }
});

// 5. Monthly Fees - Record or update payment
app.patch('/api/fees/:studentId', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const teacherId = req.session!.id;
    const schema = z.object({
      academicYear: z.string().default(() => getAcademicYear()),
      month: z.string().min(1),
      amountDue: z.number().min(0).optional(),
      amountPaid: z.number().min(0).optional(),
      status: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE']).optional(),
      paidAt: z.string().optional().nullable(),
      paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']).optional().nullable(),
      receiptNo: z.string().max(100).optional().nullable(),
      notes: z.string().max(300).optional().nullable(),
    });
    const data = parse(schema, req.body);

    const due = data.amountDue !== undefined ? data.amountDue : 1500;
    const paid = data.amountPaid !== undefined ? data.amountPaid : 0;
    let computedStatus = data.status;
    if (!computedStatus) {
      if (paid >= due && due > 0) computedStatus = 'PAID';
      else if (paid > 0 && paid < due) computedStatus = 'PARTIAL';
      else computedStatus = 'PENDING';
    }

    const paidAtDate = data.paidAt ? new Date(data.paidAt) : (computedStatus === 'PAID' ? new Date() : null);

    const fee = await (prisma as any).studentFee.upsert({
      where: {
        studentId_academicYear_month: {
          studentId,
          academicYear: data.academicYear,
          month: data.month,
        },
      },
      update: {
        amountDue: due,
        amountPaid: paid,
        status: computedStatus,
        paidAt: paidAtDate,
        paymentMode: data.paymentMode || null,
        receiptNo: data.receiptNo || null,
        notes: data.notes || null,
      },
      create: {
        studentId,
        teacherId,
        academicYear: data.academicYear,
        month: data.month,
        amountDue: due,
        amountPaid: paid,
        status: computedStatus,
        paidAt: paidAtDate,
        paymentMode: data.paymentMode || null,
        receiptNo: data.receiptNo || null,
        notes: data.notes || null,
      },
    });

    invalidateProgressCache(studentId);

    res.json({ ok: true, fee });
  } catch (error) { errorResponse(res, error); }
});

// 6. Monthly Fees - Student 12-Month Academic Year Ledger
app.get('/api/fees/student/:studentId', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const academicYear = typeof req.query.academicYear === 'string' && req.query.academicYear ? req.query.academicYear : getAcademicYear();

    const [student, records] = await Promise.all([
      (prisma.student as any).findUnique({
        where: { id: studentId },
        select: { id: true, name: true, grade: true, joiningDate: true, createdAt: true },
      }),
      (prisma as any).studentFee.findMany({
        where: { studentId, academicYear },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const { joiningDate: jDate, joiningYearMonth: jYearMonth } = getStudentJoiningDate(student);

    const recMap = new Map<string, any>(records.map((r: any) => [r.month, r]));

    const ledger = ACADEMIC_MONTHS.map((m) => {
      const mYM = getCalendarYearMonth(academicYear, m).yearMonth;
      const isEnrolled = mYM >= jYearMonth;
      const rec = recMap.get(m);
      const amountDue = !isEnrolled ? 0 : (rec ? rec.amountDue : 1500);
      const amountPaid = rec ? rec.amountPaid : 0;
      const balance = Math.max(0, amountDue - amountPaid);
      const status = !isEnrolled ? ('EXEMPT' as any) : (rec ? rec.status : 'PENDING');
      return {
        month: m,
        amountDue,
        amountPaid,
        balance,
        status,
        isEnrolled,
        paidAt: rec?.paidAt || null,
        paymentMode: rec?.paymentMode || null,
        receiptNo: rec?.receiptNo || null,
        notes: rec?.notes || (!isEnrolled ? `Joined in ${new Date(jDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''),
      };
    });

    const enrolledLedger = ledger.filter((item) => item.isEnrolled);
    const totalDue = enrolledLedger.reduce((sum, item) => sum + item.amountDue, 0);
    const totalPaid = enrolledLedger.reduce((sum, item) => sum + item.amountPaid, 0);
    const balance = Math.max(0, totalDue - totalPaid);
    const paidMonths = enrolledLedger.filter((m) => m.status === 'PAID').length;
    const pendingMonths = enrolledLedger.filter((m) => m.status !== 'PAID').length;

    res.json({
      student,
      academicYear,
      months: ledger,
      ledger,
      summary: {
        totalDue,
        totalPaid,
        totalPending: balance,
        balance,
        paidMonths,
        pendingMonths,
        isFullyPaid: balance === 0,
      },
    });
  } catch (error) { errorResponse(res, error); }
});

// 7. Student Progress Report - Scores History & Analytics (April to March)
app.get('/api/students/:id/progress-report', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    const academicYear = typeof req.query.academicYear === 'string' && req.query.academicYear ? req.query.academicYear : getAcademicYear();
    const cacheKey = `${studentId}:${academicYear}`;

    // Return instant cached response if within 10 seconds
    const cached = progressReportCache.get(cacheKey);
    if (cached && (Date.now() - cached.time) < 10000) {
      return res.json(cached.data);
    }

    // Run student lookup, score records, attendance, and fees in parallel (1 single network roundtrip)
    const [student, scoreRecords, attendanceRecords, feeRecords] = await Promise.all([
      (prisma.student as any).findUnique({
        where: { id: studentId },
        select: { id: true, name: true, grade: true, passkey: true, joiningDate: true, createdAt: true, active: true },
      }),
      (prisma as any).studentScoreRecord.findMany({
        where: {
          studentId,
          academicYear,
        },
        select: {
          id: true,
          title: true,
          itemType: true,
          score: true,
          totalMarks: true,
          percentage: true,
          grade: true,
          subject: true,
          academicYear: true,
          completedAt: true,
          remarks: true,
          quizId: true,
          paperId: true,
        },
        orderBy: { completedAt: 'desc' },
      }),
      (prisma as any).studentAttendance.findMany({
        where: {
          studentId,
          academicYear,
        },
        select: { status: true, date: true },
      }),
      (prisma as any).studentFee.findMany({
        where: {
          studentId,
          academicYear,
        },
        select: { amountDue: true, amountPaid: true, status: true, month: true },
      }),
    ]);

    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const { joiningDate: jDate, joiningYearMonth: jYearMonth } = getStudentJoiningDate(student);

    // Only count attendances on or after joining date
    const eligibleAttendance = attendanceRecords.filter((a: any) => !a.date || a.date >= jDate);
    const totalSessions = eligibleAttendance.length;
    const presentCount = eligibleAttendance.filter((a: any) => a.status === 'PRESENT').length;
    const absentCount = eligibleAttendance.filter((a: any) => a.status === 'ABSENT').length;
    const lateCount = eligibleAttendance.filter((a: any) => a.status === 'LATE').length;
    const excusedCount = eligibleAttendance.filter((a: any) => a.status === 'EXCUSED').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

    // Only count fees for months on or after joining month
    const eligibleFees = feeRecords.filter((f: any) => {
      if (!f.month) return true;
      const mYM = getCalendarYearMonth(academicYear, f.month).yearMonth;
      return mYM >= jYearMonth;
    });

    const feeDue = eligibleFees.reduce((sum: number, f: any) => sum + (f.amountDue || 0), 0);
    const feePaid = eligibleFees.reduce((sum: number, f: any) => sum + (f.amountPaid || 0), 0);

    // Only query specific quiz and paper IDs present in scoreRecords to avoid scanning entire DB!
    const quizIds = Array.from(new Set(scoreRecords.map((r: any) => r.quizId).filter(Boolean)));
    const paperIds = Array.from(new Set(scoreRecords.map((r: any) => r.paperId).filter(Boolean)));

    const [existingQuizzes, existingPapers] = await Promise.all([
      quizIds.length > 0 ? prisma.quiz.findMany({ where: { id: { in: quizIds as string[] } }, select: { id: true } }) : Promise.resolve([]),
      paperIds.length > 0 ? prisma.worksheetPaper.findMany({ where: { id: { in: paperIds as string[] } }, select: { id: true } }) : Promise.resolve([]),
    ]);

    const activeQuizIdSet = new Set(existingQuizzes.map((q: any) => q.id));
    const activePaperIdSet = new Set(existingPapers.map((p: any) => p.id));

    let deletedPreservedCount = 0;
    const enrichedScores = scoreRecords.map((r: any) => {
      let isSourceDeleted = false;
      let sourceStatus = 'ACTIVE';
      if (r.quizId && !activeQuizIdSet.has(r.quizId)) {
        isSourceDeleted = true;
        sourceStatus = 'DELETED';
      } else if (r.paperId && !activePaperIdSet.has(r.paperId)) {
        isSourceDeleted = true;
        sourceStatus = 'DELETED';
      }
      if (isSourceDeleted) deletedPreservedCount++;
      return {
        ...r,
        isSourceDeleted,
        sourceStatus,
      };
    });

    const quizScores = enrichedScores.filter((r: any) => r.itemType === 'QUIZ');
    const paperScores = enrichedScores.filter((r: any) => r.itemType === 'QUESTION_PAPER');

    const totalEvaluations = enrichedScores.length;
    const totalPossibleMarks = enrichedScores.reduce((sum: number, r: any) => sum + (r.totalMarks || 0), 0);
    const totalObtainedMarks = enrichedScores.reduce((sum: number, r: any) => sum + (r.score || 0), 0);

    const overallPercentage = totalPossibleMarks > 0
      ? Math.round((totalObtainedMarks / totalPossibleMarks) * 100 * 10) / 10
      : 0;

    const quizAvg = quizScores.length > 0
      ? Math.round((quizScores.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / quizScores.length) * 10) / 10
      : null;

    const paperAvg = paperScores.length > 0
      ? Math.round((paperScores.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / paperScores.length) * 10) / 10
      : null;

    let gradeLetter = 'A+';
    if (overallPercentage >= 90) gradeLetter = 'A+';
    else if (overallPercentage >= 80) gradeLetter = 'A';
    else if (overallPercentage >= 70) gradeLetter = 'B+';
    else if (overallPercentage >= 60) gradeLetter = 'B';
    else if (overallPercentage >= 50) gradeLetter = 'C';
    else if (overallPercentage > 0) gradeLetter = 'D';
    else gradeLetter = '—';

    const pcts = enrichedScores.map((s: any) => s.percentage || 0);
    const highestPercentage = pcts.length > 0 ? Math.max(...pcts) : 0;
    const lowestPercentage = pcts.length > 0 ? Math.min(...pcts) : 0;

    const statsObj = {
      totalAssessments: totalEvaluations,
      totalEvaluations,
      quizzesCount: quizScores.length,
      quizzesTaken: quizScores.length,
      questionPapersCount: paperScores.length,
      papersSubmitted: paperScores.length,
      totalPossibleMarks,
      totalObtainedMarks,
      averagePercentage: overallPercentage,
      overallPercentage,
      highestPercentage,
      lowestPercentage,
      quizAverage: quizAvg,
      paperAverage: paperAvg,
      overallGrade: gradeLetter,
      performanceGrade: gradeLetter,
      deletedItemsPreservedCount: deletedPreservedCount,
    };

    const feePending = Math.max(0, feeDue - feePaid);
    const pendingMonthsCount = eligibleFees.filter((f: any) => f.status !== 'PAID').length;

    const responsePayload = {
      student,
      academicYear,
      availableYears: ['2026-2027', '2025-2026', '2024-2025', '2027-2028'],
      statistics: statsObj,
      summary: statsObj,
      scores: enrichedScores,
      attendance: {
        totalDays: totalSessions,
        totalSessions,
        present: presentCount,
        presentCount,
        absent: absentCount,
        absentCount,
        late: lateCount,
        lateCount,
        excused: excusedCount,
        excusedCount,
        rate: attendanceRate,
        attendanceRate,
      },
      fees: {
        totalDue: feeDue,
        totalPaid: feePaid,
        totalPending: feePending,
        balance: feePending,
        pendingMonths: pendingMonthsCount,
        status: (feePaid >= feeDue && feeDue > 0) ? 'PAID' : (feePaid > 0 ? 'PARTIAL' : 'PENDING'),
      },
    };

    // Cache the prepared response for 10 seconds
    progressReportCache.set(cacheKey, { time: Date.now(), data: responsePayload });

    res.json(responsePayload);
  } catch (error) { errorResponse(res, error); }
});

// 8. Custom score entry for offline tests / school exams
app.post('/api/students/:id/score-records', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    const teacherId = req.session!.id;
    const schema = z.object({
      title: z.string().trim().min(1).max(150),
      itemType: z.enum(['QUIZ', 'QUESTION_PAPER']).default('QUIZ'),
      score: z.number().min(0),
      totalMarks: z.number().min(1),
      grade: z.string().optional(),
      subject: z.string().default('Mathematics'),
      academicYear: z.string().default(() => getAcademicYear()),
      completedAt: z.string().optional(),
      remarks: z.string().max(500).optional().nullable(),
    });
    const data = parse(schema, req.body);

    const record = await recordScoreRecord({
      studentId,
      teacherId,
      title: data.title,
      itemType: data.itemType,
      score: data.score,
      totalMarks: data.totalMarks,
      grade: data.grade,
      subject: data.subject,
      academicYear: data.academicYear,
      completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
      remarks: data.remarks,
    });

    res.status(201).json({ ok: true, record });
  } catch (error) { errorResponse(res, error); }
});

// Upload video file for whiteboard presentation & student streaming
app.post('/api/whiteboard/upload-video', authenticate(['teacher', 'admin', 'superadmin']), express.json({ limit: '150mb' }), async (req: AuthRequest, res: Response) => {
  try {
    const { name, data } = req.body;
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: 'Video data is required.' });
    }
    const videosDir = resolve('public/uploads/videos');
    if (!existsSync(videosDir)) {
      mkdirSync(videosDir, { recursive: true });
    }
    const cleanName = (name || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${cleanName}`;
    const filePath = resolve(videosDir, filename);

    const base64Data = data.includes(';base64,') ? data.split(';base64,')[1] : data;
    const buffer = Buffer.from(base64Data, 'base64');
    writeFileSync(filePath, buffer);

    const videoUrl = `/uploads/videos/${filename}`;
    return res.json({ success: true, url: videoUrl, filename });
  } catch (err: any) {
    console.error('Whiteboard video upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save video.' });
  }
});

// ==========================================
// Whiteboard Saved Images Library (Database-backed)
// ==========================================

// Ensure WhiteboardSavedImage database table exists on AWS PostgreSQL
async function ensureWhiteboardImageTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WhiteboardSavedImage" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "dataUrl" TEXT NOT NULL,
        "showNameOnBoard" BOOLEAN NOT NULL DEFAULT true,
        "teacherId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhiteboardSavedImage_teacherId_idx" ON "WhiteboardSavedImage"("teacherId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhiteboardSavedImage_createdAt_idx" ON "WhiteboardSavedImage"("createdAt")
    `);
    console.log('✅ WhiteboardSavedImage database table ready.');
  } catch (err) {
    console.warn('⚠️ WhiteboardSavedImage table check note:', err);
  }
}

// Get all saved images from database
app.get('/api/whiteboard/images', async (_req: Request, res: Response) => {
  try {
    const images = await (prisma as any).whiteboardSavedImage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, images });
  } catch (err: any) {
    console.error('Failed to fetch whiteboard images from database:', err);
    return res.status(500).json({ error: 'Failed to load saved images from database.' });
  }
});

// Save new image to database
app.post('/api/whiteboard/images', express.json({ limit: '60mb' }), async (req: Request, res: Response) => {
  try {
    const { name, dataUrl, showNameOnBoard } = req.body;
    if (!name || !dataUrl) {
      return res.status(400).json({ error: 'Image name and data are required.' });
    }

    let savedUrl = dataUrl;
    try {
      const imagesDir = resolve('public/uploads/whiteboard-images');
      if (!existsSync(imagesDir)) {
        mkdirSync(imagesDir, { recursive: true });
      }
      const cleanName = String(name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = dataUrl.includes('image/jpeg') ? '.jpg' : dataUrl.includes('image/svg') ? '.svg' : '.png';
      const filename = `${Date.now()}_${cleanName}${cleanName.endsWith(ext) ? '' : ext}`;
      const filePath = resolve(imagesDir, filename);

      if (dataUrl.includes(';base64,')) {
        const base64Data = dataUrl.split(';base64,')[1];
        writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        savedUrl = `/uploads/whiteboard-images/${filename}`;
      }
    } catch (fsErr) {
      console.warn('Could not write image to file storage, storing dataUrl directly in database:', fsErr);
    }

    const newImage = await (prisma as any).whiteboardSavedImage.create({
      data: {
        name: String(name).trim(),
        dataUrl: savedUrl,
        showNameOnBoard: showNameOnBoard !== false,
      },
    });

    return res.status(201).json({ success: true, image: newImage });
  } catch (err: any) {
    console.error('Failed to save whiteboard image to database:', err);
    return res.status(500).json({ error: err.message || 'Failed to save image to database.' });
  }
});

// Update image name or display settings in database
app.put('/api/whiteboard/images/:id', express.json({ limit: '10mb' }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, showNameOnBoard } = req.body;

    const updated = await (prisma as any).whiteboardSavedImage.update({
      where: { id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(typeof showNameOnBoard === 'boolean' ? { showNameOnBoard } : {}),
      },
    });

    return res.json({ success: true, image: updated });
  } catch (err: any) {
    console.error('Failed to update whiteboard image in database:', err);
    return res.status(500).json({ error: 'Failed to update image in database.' });
  }
});

// Delete image from database
app.delete('/api/whiteboard/images/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await (prisma as any).whiteboardSavedImage.delete({
      where: { id },
    }).catch(() => null);

    if (deleted && deleted.dataUrl && deleted.dataUrl.startsWith('/uploads/whiteboard-images/')) {
      try {
        const localPath = resolve('public', deleted.dataUrl.replace(/^\//, ''));
        if (existsSync(localPath)) {
          unlinkSync(localPath);
        }
      } catch (_) {}
    }

    return res.json({ success: true, id });
  } catch (err: any) {
    console.error('Failed to delete whiteboard image from database:', err);
    return res.status(500).json({ error: 'Failed to delete image from database.' });
  }
});

// Sync past attempts and graded worksheets to persistent score records on startup
async function syncExistingScoreRecords() {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { status: 'SUBMITTED', score: { not: null } },
      include: {
        quiz: { include: { questions: { select: { marks: true } } } },
        student: { select: { id: true, grade: true } },
      },
    });

    for (const a of attempts) {
      if (!a.quiz) continue;
      const totalMarks = a.quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await recordScoreRecord({
        studentId: a.studentId,
        teacherId: a.quiz.teacherId,
        title: a.quiz.title,
        itemType: 'QUIZ',
        score: a.score,
        totalMarks: totalMarks || 20,
        grade: a.quiz.grade || a.student?.grade,
        completedAt: a.submittedAt || new Date(),
        quizId: a.quizId,
      });
    }

    const submissions = await prisma.worksheetSubmission.findMany({
      where: { score: { not: null } },
      include: {
        paper: true,
        student: { select: { id: true, grade: true } },
      },
    });

    for (const s of submissions) {
      if (!s.paper) continue;
      await recordScoreRecord({
        studentId: s.studentId,
        teacherId: s.paper.teacherId,
        title: s.paper.title,
        itemType: 'QUESTION_PAPER',
        score: s.score,
        totalMarks: s.paper.totalMarks || 100,
        grade: s.paper.grade || s.student?.grade,
        subject: s.paper.subject || 'Mathematics',
        completedAt: s.gradedAt || s.submittedAt || new Date(),
        remarks: s.remarks,
        paperId: s.paperId,
      });
    }
    console.log('✅ Student historical scores verified in persistent score records.');
  } catch (err) {
    console.warn('⚠️ syncExistingScoreRecords warning:', err);
  }
}

// Ensure public/uploads exists and serve statically
const uploadsDir = resolve('public/uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use(express.static(resolve('public')));
app.use(express.static(resolve('dist')));
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) return next();
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(resolve('dist/index.html'), (error) => { if (error) next(error); });
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => errorResponse(res, error));

setInterval(() => { void finishExpiredAttempts().catch(() => { }); }, 5000).unref();
async function startServer() {
  try {
    const email = process.env.ADMIN_EMAIL || 'gaurav.kr.singh@hotmail.com';
    const password = process.env.ADMIN_PASSWORD || 'adminpassword123';
    const superAdminUsername = process.env.SUPERADMIN_USERNAME || 'admin';
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || email;
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || password;
    const superAdminSecretKey = process.env.SUPERADMIN_SECRET_KEY || 'eduashram@secret2026';

    const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 12);
    const superAdminSecretKeyHash = await bcrypt.hash(superAdminSecretKey, 12);
    await db.superAdmin.upsert({
      where: { username: superAdminUsername },
      update: { email: superAdminEmail, passwordHash: superAdminPasswordHash, secretKeyHash: superAdminSecretKeyHash },
      create: { username: superAdminUsername, email: superAdminEmail, passwordHash: superAdminPasswordHash, secretKeyHash: superAdminSecretKeyHash },
    });

    const teacherPasswordHash = await bcrypt.hash(password, 12);
    await db.teacher.upsert({
      where: { email },
      update: { name: 'Gaurav Kumar Singh', active: true, passwordHash: teacherPasswordHash },
      create: { name: 'Gaurav Kumar Singh', email, passwordHash: teacherPasswordHash, school: 'EduAshram Central', subject: 'Mathematics', active: true },
    });
    await prisma.admin.upsert({
      where: { email },
      update: { passwordHash: teacherPasswordHash },
      create: { email, passwordHash: teacherPasswordHash },
    });
    console.log('✅ Super Admin & First Teacher account verified.');
    void ensureWhiteboardImageTable().catch((err) => console.warn('⚠️ Whiteboard image table init note:', err));
  } catch (err) {
    console.error('⚠️ Account initialization check skipped:', err);
  }
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`EduAshram server listening on port ${port}`);
    // Run score sync non-blocking in background
    void syncExistingScoreRecords().catch((err) => console.warn('⚠️ Score sync background warning:', err));
  });
}
void startServer();
