import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  MessageSquare,
  MessageCircle,
  Users,
  Send,
  X,
  Minus,
  Maximize2,
  Sparkles,
  Smile,
  GraduationCap,
  Star,
  CheckCheck,
  Trash2,
  ChevronDown
} from 'lucide-react';

export interface ChatMessageItem {
  id: string;
  teacherId: string;
  studentId: string | null;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student' | 'admin' | 'superadmin';
  channel: 'everyone' | 'direct';
  content: string;
  createdAt: string;
}

export interface StudentPeer {
  id: string;
  name: string;
  grade?: string | null;
}

export interface TeacherPeer {
  id: string;
  name: string;
  school?: string | null;
  subject?: string | null;
}

export interface ChatNotificationToast {
  id: string;
  senderName: string;
  content: string;
  channel: 'everyone' | 'direct';
  studentId?: string | null;
  timestamp: number;
}

interface ClassroomChatWidgetProps {
  user: {
    id?: string;
    name?: string;
    role: 'admin' | 'teacher' | 'superadmin' | 'student';
    grade?: string | null;
    teacherId?: string | null;
    teacherName?: string | null;
  };
  activeBroadcastGrade?: string | null;
}

const QUICK_REACTIONS = ['👍', '✋', '💡', '❓', '📐', '⭐', '👏', '😊'];

function formatGradeBracket(grade?: string | null): string {
  if (!grade) return '';
  const cleaned = grade.replace(/^grade\s*/i, '').replace(/^gr\.?\s*/i, '').trim();
  return cleaned ? ` (${cleaned})` : '';
}

function normalizeGradeNumber(gradeStr?: string | null): string | null {
  if (!gradeStr) return null;
  const match = gradeStr.match(/\d+/);
  return match ? match[0] : gradeStr.trim().toLowerCase();
}

export function matchesBroadcastGrade(studentGrade?: string | null, targetGrade?: string | null): boolean {
  if (!targetGrade || targetGrade === 'ALL' || targetGrade.toLowerCase() === 'all grades') {
    return true;
  }
  if (!studentGrade) return false;
  const sNorm = normalizeGradeNumber(studentGrade);
  const tNorm = normalizeGradeNumber(targetGrade);
  if (sNorm && tNorm) {
    return sNorm === tNorm;
  }
  return studentGrade.trim().toLowerCase() === targetGrade.trim().toLowerCase();
}

function playChatNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  } catch {
    // browser audio policy silently handled
  }
}

export function ClassroomChatWidget({ user, activeBroadcastGrade }: ClassroomChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'everyone' | 'direct' | 'other_grades'>('everyone');
  const [height, setHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(localStorage.getItem('classroom_chat_height'));
      if (saved >= 340 && saved <= 800) return saved;
    }
    return 490;
  });

  const [classroomTeacher, setClassroomTeacher] = useState<TeacherPeer | null>(null);
  const [students, setStudents] = useState<StudentPeer[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedOtherStudentId, setSelectedOtherStudentId] = useState<string | null>(null);

  // Floating Notification Toasts for incoming student messages
  const [toasts, setToasts] = useState<ChatNotificationToast[]>([]);
  const [broadcastGrade, setBroadcastGrade] = useState<string | null>(() => {
    if (activeBroadcastGrade) return activeBroadcastGrade;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('teacher_broadcast_grade');
        if (saved) return saved;
      } catch (_) {}
    }
    return null;
  });
  const [isBroadcastLive, setIsBroadcastLive] = useState(false);

  useEffect(() => {
    if (activeBroadcastGrade !== undefined && activeBroadcastGrade !== null) {
      setBroadcastGrade(activeBroadcastGrade);
    }
  }, [activeBroadcastGrade]);

  useEffect(() => {
    const handleBroadcastChange = (e: Event) => {
      const detail = (e as CustomEvent<{ isLive?: boolean; grade?: string | null }>).detail;
      if (detail) {
        if (typeof detail.isLive === 'boolean') {
          setIsBroadcastLive(detail.isLive);
        }
        if (detail.grade !== undefined && detail.grade !== null) {
          setBroadcastGrade(detail.grade);
        }
      }
    };
    window.addEventListener('classroom-broadcast-change', handleBroadcastChange);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'teacher_broadcast_grade' && e.newValue) {
        setBroadcastGrade(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('classroom-broadcast-change', handleBroadcastChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const studentsRef = useRef<StudentPeer[]>(students);
  studentsRef.current = students;
  const toastedMessageIdsRef = useRef<Set<string>>(new Set());

  // Grade-scoped student list when teacher's live broadcast is active for a specific grade
  const isBroadcastGradeFiltered = Boolean(
    broadcastGrade &&
    broadcastGrade !== 'ALL' &&
    broadcastGrade.toLowerCase() !== 'all grades'
  );

  const filteredStudents = React.useMemo(() => {
    if (!isBroadcastGradeFiltered) {
      return students;
    }
    return students.filter((st) => matchesBroadcastGrade(st.grade, broadcastGrade));
  }, [students, isBroadcastGradeFiltered, broadcastGrade]);

  const otherStudents = React.useMemo(() => {
    if (!isBroadcastGradeFiltered) {
      return [];
    }
    return students.filter((st) => !matchesBroadcastGrade(st.grade, broadcastGrade));
  }, [students, isBroadcastGradeFiltered, broadcastGrade]);

  const [studentEnrolledGrade, setStudentEnrolledGrade] = useState<string | null>(user.grade || null);

  // Check if current user is a student from a grade different from the active broadcast class
  const effectiveStudentGrade = user.grade || studentEnrolledGrade;
  const isStudentFromOtherGrade = Boolean(
    user.role === 'student' &&
    isBroadcastGradeFiltered &&
    effectiveStudentGrade &&
    !matchesBroadcastGrade(effectiveStudentGrade, broadcastGrade)
  );

  // If student is from another grade, they get only One to One option (not Everyone)
  useEffect(() => {
    if (isStudentFromOtherGrade && activeTab === 'everyone') {
      setActiveTab('direct');
    }
  }, [isStudentFromOtherGrade, activeTab]);

  const isBroadcastGradeFilteredRef = useRef(isBroadcastGradeFiltered);
  isBroadcastGradeFilteredRef.current = isBroadcastGradeFiltered;
  const broadcastGradeRef = useRef(broadcastGrade);
  broadcastGradeRef.current = broadcastGrade;

  const isFromBroadcastClass = useCallback((studentId?: string | null): boolean => {
    if (!isBroadcastGradeFilteredRef.current) return true;
    if (!studentId) return true;
    const st = studentsRef.current.find((s) => s.id === studentId);
    if (!st) return false;
    return matchesBroadcastGrade(st.grade, broadcastGradeRef.current);
  }, []);

  useEffect(() => {
    if (user.role === 'student') return;
    if (filteredStudents.length > 0) {
      const isSelectedInList = filteredStudents.some((st) => st.id === selectedStudentId);
      if (!isSelectedInList) {
        setSelectedStudentId(filteredStudents[0].id);
      }
    } else if (students.length > 0 && isBroadcastGradeFiltered) {
      setSelectedStudentId(null);
    }
  }, [filteredStudents, selectedStudentId, user.role, students.length, isBroadcastGradeFiltered]);

  useEffect(() => {
    if (user.role === 'student') return;
    if (otherStudents.length > 0) {
      const isSelectedInList = otherStudents.some((st) => st.id === selectedOtherStudentId);
      if (!isSelectedInList) {
        setSelectedOtherStudentId(otherStudents[0].id);
      }
    } else {
      setSelectedOtherStudentId(null);
    }
  }, [otherStudents, selectedOtherStudentId, user.role]);

  const triggerToast = useCallback((toastData: {
    id: string;
    senderName: string;
    content: string;
    channel: 'everyone' | 'direct';
    studentId?: string | null;
  }) => {
    if (user.role === 'student') return;
    if (toastData.id && toastedMessageIdsRef.current.has(toastData.id)) return;
    if (toastData.id) {
      toastedMessageIdsRef.current.add(toastData.id);
      if (toastedMessageIdsRef.current.size > 200) {
        const first = toastedMessageIdsRef.current.values().next().value;
        if (first) toastedMessageIdsRef.current.delete(first);
      }
    }

    const newToast: ChatNotificationToast = {
      id: toastData.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderName: toastData.senderName,
      content: toastData.content,
      channel: toastData.channel,
      studentId: toastData.studentId,
      timestamp: Date.now(),
    };

    setToasts((prev) => [newToast, ...prev.filter((t) => t.id !== newToast.id).slice(0, 4)]);
    playChatNotificationSound();
  }, [user.role]);

  // Auto-dismiss oldest toast after 6.5s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, prev.length - 1));
    }, 6500);
    return () => clearTimeout(timer);
  }, [toasts]);

  const handleToastClick = (toast: ChatNotificationToast) => {
    setIsOpen(true);
    setIsMinimized(false);
    if (toast.channel === 'direct' && toast.studentId) {
      const isOther = otherStudents.some((s) => s.id === toast.studentId);
      if (isOther) {
        setActiveTab('other_grades');
        setSelectedOtherStudentId(toast.studentId);
      } else {
        setActiveTab('direct');
        setSelectedStudentId(toast.studentId);
      }
    } else {
      setActiveTab('everyone');
    }
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  const dismissToast = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Independent in-memory caches: instant tab switching with 0ms delay
  const [everyoneMessages, setEveryoneMessages] = useState<ChatMessageItem[]>([]);
  const [directMessagesMap, setDirectMessagesMap] = useState<Record<string, ChatMessageItem[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  // Unread badge counters
  const [unreadEveryone, setUnreadEveryone] = useState(0);
  const [unreadDirect, setUnreadDirect] = useState(0);
  const [unreadOtherGrades, setUnreadOtherGrades] = useState(0);
  const [studentUnreadMap, setStudentUnreadMap] = useState<Record<string, number>>({});

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartHRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const loadedTabsRef = useRef<Set<string>>(new Set());

  // Refs for persistent socket listeners
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const isMinimizedRef = useRef(isMinimized);
  isMinimizedRef.current = isMinimized;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const selectedStudentIdRef = useRef(selectedStudentId);
  selectedStudentIdRef.current = selectedStudentId;
  const selectedOtherStudentIdRef = useRef(selectedOtherStudentId);
  selectedOtherStudentIdRef.current = selectedOtherStudentId;

  // Active direct message key (studentId for teacher, 'teacher' for student)
  const activeDirectKey = user.role === 'student'
    ? 'teacher'
    : (activeTab === 'other_grades' ? (selectedOtherStudentId || '') : (selectedStudentId || ''));
  const rawMessages = activeTab === 'everyone'
    ? everyoneMessages
    : (activeDirectKey ? (directMessagesMap[activeDirectKey] || []) : []);

  // Filter out any duplicate messages by id or temp duplicates
  const currentMessages = React.useMemo(() => {
    const seen = new Set<string>();
    const result: ChatMessageItem[] = [];
    for (const m of rawMessages) {
      if (!m.id) continue;
      // If we see a temp message but we already have a real message with the same sender and content, skip temp
      if (m.id.startsWith('temp_')) {
        const hasRealDuplicate = rawMessages.some(
          (other) => !other.id.startsWith('temp_') && other.senderId === m.senderId && other.content === m.content
        );
        if (hasRealDuplicate) continue;
      }
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      result.push(m);
    }
    return result;
  }, [rawMessages]);

  // 1. Fetch Classroom Peers (Teacher & Students)
  const loadPeers = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/peers', { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data) {
        if (data.teacher) setClassroomTeacher(data.teacher);
        if (data.studentGrade) setStudentEnrolledGrade(data.studentGrade);
        if (data.activeBroadcastGrade !== undefined) {
          if (data.isBroadcastLive) {
            setBroadcastGrade(data.activeBroadcastGrade);
            setIsBroadcastLive(true);
          } else {
            setBroadcastGrade(null);
            setIsBroadcastLive(false);
          }
        }
        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);
          if (data.students.length > 0 && !selectedStudentIdRef.current) {
            setSelectedStudentId(data.students[0].id);
          }
        }
      }
    } catch {
      // offline or silent fallback
    }
  }, []);

  useEffect(() => {
    void loadPeers();
  }, [loadPeers]);

  // 2. Fetch Messages for a specific channel
  const fetchChannelMessages = useCallback(async (channel: 'everyone' | 'direct', studentId?: string | null) => {
    const key = channel === 'everyone' ? 'everyone' : `direct:${user.role === 'student' ? 'teacher' : (studentId || '')}`;
    const isFirstLoad = !loadedTabsRef.current.has(key);

    if (isFirstLoad) {
      setLoadingMessages(true);
    }

    try {
      let url = `/api/chat/messages?channel=${channel}&limit=80`;
      if (channel === 'direct' && user.role !== 'student' && studentId) {
        url += `&studentId=${encodeURIComponent(studentId)}`;
      }
      const res = await fetch(url, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.messages)) {
        if (channel === 'everyone') {
          setEveryoneMessages(data.messages);
          setUnreadEveryone(0);
        } else {
          const mapKey = user.role === 'student' ? 'teacher' : (studentId || '');
          if (mapKey) {
            setDirectMessagesMap((prev) => ({ ...prev, [mapKey]: data.messages }));
            if (activeTabRef.current === 'direct') {
              setUnreadDirect(0);
            } else if (activeTabRef.current === 'other_grades') {
              setUnreadOtherGrades(0);
            }
            if (studentId) {
              setStudentUnreadMap((prev) => ({ ...prev, [studentId]: 0 }));
            }
          }
        }
        loadedTabsRef.current.add(key);
      }
    } catch {
      // silent
    } finally {
      setLoadingMessages(false);
    }
  }, [user.role]);

  // Trigger background load whenever tab or selected student changes
  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (activeTab === 'everyone') {
        void fetchChannelMessages('everyone');
      } else if (activeTab === 'direct') {
        if (user.role === 'student' || selectedStudentId) {
          void fetchChannelMessages('direct', selectedStudentId);
        }
      } else if (activeTab === 'other_grades') {
        if (selectedOtherStudentId) {
          void fetchChannelMessages('direct', selectedOtherStudentId);
        }
      }
    }
  }, [isOpen, isMinimized, activeTab, selectedStudentId, selectedOtherStudentId, fetchChannelMessages, user.role]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && !isMinimized && currentMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length, isOpen, isMinimized]);

  // 3. Socket.io Real-time connection (Persistent across tab switches)
  useEffect(() => {
    const socket = io({ withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('chat:message', (newMsg: ChatMessageItem) => {
      // Trigger pop-up toast with student name and message preview for teacher ONLY if student belongs to active broadcast grade
      if (user.role !== 'student' && newMsg.senderRole === 'student') {
        const fromBroadcast = isFromBroadcastClass(newMsg.studentId);
        if (fromBroadcast) {
          triggerToast({
            id: newMsg.id,
            senderName: newMsg.senderName,
            content: newMsg.content,
            channel: newMsg.channel,
            studentId: newMsg.studentId,
          });
        }
      }

      if (newMsg.channel === 'everyone') {
        setEveryoneMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          // Reconcile optimistic temp message sent by me
          const tempIdx = prev.findIndex(
            (m) => m.id.startsWith('temp_') && m.senderId === newMsg.senderId && m.content === newMsg.content
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = newMsg;
            return next;
          }
          return [...prev, newMsg];
        });
        if (!isOpenRef.current || isMinimizedRef.current || activeTabRef.current !== 'everyone') {
          setUnreadEveryone((c) => c + 1);
        }
      } else if (newMsg.channel === 'direct') {
        const key = user.role === 'student' ? 'teacher' : (newMsg.studentId || 'unknown');
        setDirectMessagesMap((prev) => {
          const list = prev[key] || [];
          if (list.some((m) => m.id === newMsg.id)) return prev;
          // Reconcile optimistic temp message sent by me
          const tempIdx = list.findIndex(
            (m) => m.id.startsWith('temp_') && m.senderId === newMsg.senderId && m.content === newMsg.content
          );
          if (tempIdx !== -1) {
            const next = [...list];
            next[tempIdx] = newMsg;
            return { ...prev, [key]: next };
          }
          return { ...prev, [key]: [...list, newMsg] };
        });

        const fromBroadcast = isFromBroadcastClass(newMsg.studentId);
        if (user.role !== 'student' && !fromBroadcast) {
          const isViewingOther =
            isOpenRef.current &&
            !isMinimizedRef.current &&
            activeTabRef.current === 'other_grades' &&
            selectedOtherStudentIdRef.current === newMsg.studentId;

          if (!isViewingOther) {
            setUnreadOtherGrades((c) => c + 1);
            if (newMsg.studentId) {
              setStudentUnreadMap((prev) => ({
                ...prev,
                [newMsg.studentId!]: (prev[newMsg.studentId!] || 0) + 1,
              }));
            }
          }
        } else {
          const isViewing =
            isOpenRef.current &&
            !isMinimizedRef.current &&
            activeTabRef.current === 'direct' &&
            (user.role === 'student' || selectedStudentIdRef.current === newMsg.studentId);

          if (!isViewing) {
            setUnreadDirect((c) => c + 1);
            if (newMsg.studentId) {
              setStudentUnreadMap((prev) => ({
                ...prev,
                [newMsg.studentId!]: (prev[newMsg.studentId!] || 0) + 1,
              }));
            }
          }
        }
      }
    });

    socket.on('chat:cleared', () => {
      setEveryoneMessages([]);
      setDirectMessagesMap({});
      setUnreadEveryone(0);
      setUnreadDirect(0);
      setUnreadOtherGrades(0);
      setStudentUnreadMap({});
      loadedTabsRef.current.clear();
    });

    socket.on('chat:cleared_student', ({ studentId }: { studentId?: string }) => {
      if (user.role === 'student') {
        if (!studentId || studentId === user.id) {
          setEveryoneMessages([]);
          setDirectMessagesMap({});
          setUnreadEveryone(0);
          setUnreadDirect(0);
          setUnreadOtherGrades(0);
          setStudentUnreadMap({});
          loadedTabsRef.current.clear();
        }
      } else if (studentId) {
        setDirectMessagesMap((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
        setStudentUnreadMap((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
        setToasts((prev) => prev.filter((t) => t.studentId !== studentId));
        loadedTabsRef.current.delete(`direct:${studentId}`);
      }
    });

    socket.on('chat:student_cleared', ({ studentId }: { studentId?: string }) => {
      if (studentId) {
        setEveryoneMessages((prev) => prev.filter((m) => m.senderId !== studentId));
        if (user.role !== 'student') {
          setDirectMessagesMap((prev) => {
            const next = { ...prev };
            delete next[studentId];
            return next;
          });
          setStudentUnreadMap((prev) => {
            const next = { ...prev };
            delete next[studentId];
            return next;
          });
          setToasts((prev) => prev.filter((t) => t.studentId !== studentId));
          loadedTabsRef.current.delete(`direct:${studentId}`);
        }
      }
    });

    socket.on('chat:message_deleted', ({ messageId, channel, studentId }: { messageId: string; channel: string; studentId?: string | null }) => {
      if (channel === 'everyone') {
        setEveryoneMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else {
        const key = user.role === 'student' ? 'teacher' : (studentId || '');
        if (key) {
          setDirectMessagesMap((prev) => ({
            ...prev,
            [key]: (prev[key] || []).filter((m) => m.id !== messageId),
          }));
        } else {
          setDirectMessagesMap((prev) => {
            const next = { ...prev };
            for (const k of Object.keys(next)) {
              next[k] = (next[k] || []).filter((m) => m.id !== messageId);
            }
            return next;
          });
        }
      }
    });

    socket.on('chat:direct_notification', ({ studentId, message }: { studentId: string; message?: ChatMessageItem }) => {
      if (user.role !== 'student') {
        if (message && message.id) {
          setDirectMessagesMap((prev) => {
            const list = prev[studentId] || [];
            if (list.some((m) => m.id === message.id)) return prev;
            return { ...prev, [studentId]: [...list, message] };
          });
        }

        const fromBroadcast = isFromBroadcastClass(studentId);
        // Only trigger pop-up toast if the student belongs to active broadcast grade
        if (fromBroadcast) {
          const senderName = message?.senderName || studentsRef.current.find((s) => s.id === studentId)?.name || 'Student';
          const content = message?.content || 'Sent you a private message';
          triggerToast({
            id: message?.id || `notif_${studentId}_${Date.now()}`,
            senderName,
            content,
            channel: 'direct',
            studentId,
          });
        }

        if (!fromBroadcast) {
          const isViewingOther =
            isOpenRef.current &&
            !isMinimizedRef.current &&
            activeTabRef.current === 'other_grades' &&
            selectedOtherStudentIdRef.current === studentId;

          if (!isViewingOther) {
            setUnreadOtherGrades((c) => c + 1);
            setStudentUnreadMap((prev) => ({
              ...prev,
              [studentId]: (prev[studentId] || 0) + 1,
            }));
          }
        } else {
          if (!isOpenRef.current || isMinimizedRef.current || activeTabRef.current !== 'direct' || selectedStudentIdRef.current !== studentId) {
            setUnreadDirect((c) => c + 1);
            setStudentUnreadMap((prev) => ({
              ...prev,
              [studentId]: (prev[studentId] || 0) + 1,
            }));
          }
        }
      }
    });

    socket.on('whiteboard:status_update', (data: { grade?: string; teacherId?: string; isLive?: boolean }) => {
      if (data) {
        if (user.role === 'student' && user.teacherId && data.teacherId && data.teacherId !== user.teacherId) {
          return;
        }
        if (typeof data.isLive === 'boolean') {
          setIsBroadcastLive(data.isLive);
          if (data.isLive && data.grade) {
            setBroadcastGrade(data.grade);
          } else if (!data.isLive) {
            setBroadcastGrade(null);
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user.role, user.teacherId, isFromBroadcastClass]);

  // Join direct room for teacher when student is selected
  useEffect(() => {
    if (user.role !== 'student' && socketRef.current) {
      if (activeTab === 'other_grades' && selectedOtherStudentId) {
        socketRef.current.emit('chat:join_direct', selectedOtherStudentId);
      } else if (selectedStudentId) {
        socketRef.current.emit('chat:join_direct', selectedStudentId);
      }
    }
  }, [user.role, selectedStudentId, selectedOtherStudentId, activeTab]);

  // 4. Send Message Handler with Instant Optimistic UI
  async function handleSendMessage(textToSend?: string) {
    const msg = (textToSend ?? inputText).trim();
    if (!msg || sending) return;

    if (activeTab === 'direct' && user.role !== 'student' && !selectedStudentId) {
      alert('Please select a student from the list to send a direct message.');
      return;
    }
    if (activeTab === 'other_grades' && user.role !== 'student' && !selectedOtherStudentId) {
      alert('Please select a student from other grades to send a direct message.');
      return;
    }

    const isDirect = activeTab === 'direct' || activeTab === 'other_grades';
    const targetStudentId = isDirect
      ? (user.role === 'student' ? user.id || null : (activeTab === 'other_grades' ? selectedOtherStudentId : selectedStudentId))
      : null;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      teacherId: classroomTeacher?.id || user.teacherId || '',
      studentId: targetStudentId,
      senderId: user.id || 'me',
      senderName: user.name || (user.role === 'student' ? 'Kid' : 'Teacher'),
      senderRole: user.role === 'student' ? 'student' : 'teacher',
      channel: isDirect ? 'direct' : 'everyone',
      content: msg,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update memory state immediately (0ms delay)
    if (activeTab === 'everyone') {
      setEveryoneMessages((prev) => [...prev, optimisticMsg]);
    } else if (activeDirectKey) {
      setDirectMessagesMap((prev) => ({
        ...prev,
        [activeDirectKey]: [...(prev[activeDirectKey] || []), optimisticMsg],
      }));
    }

    if (!textToSend) setInputText('');
    setShowEmojis(false);
    setSending(true);

    try {
      const payload: any = {
        channel: isDirect ? 'direct' : 'everyone',
        content: msg,
      };
      if (isDirect && user.role !== 'student' && targetStudentId) {
        payload.studentId = targetStudentId;
      }

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        // Reconcile optimistic message with server id
        if (activeTab === 'everyone') {
          setEveryoneMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) {
              return prev.filter((m) => m.id !== tempId);
            }
            return prev.map((m) => (m.id === tempId ? data.message : m));
          });
        } else if (activeDirectKey) {
          setDirectMessagesMap((prev) => {
            const list = prev[activeDirectKey] || [];
            if (list.some((m) => m.id === data.message.id)) {
              return {
                ...prev,
                [activeDirectKey]: list.filter((m) => m.id !== tempId),
              };
            }
            return {
              ...prev,
              [activeDirectKey]: list.map((m) => (m.id === tempId ? data.message : m)),
            };
          });
        }
      } else {
        // Revert optimistic message on error
        if (activeTab === 'everyone') {
          setEveryoneMessages((prev) => prev.filter((m) => m.id !== tempId));
        } else if (activeDirectKey) {
          setDirectMessagesMap((prev) => ({
            ...prev,
            [activeDirectKey]: (prev[activeDirectKey] || []).filter((m) => m.id !== tempId),
          }));
        }
        alert(data.error || 'Failed to send message.');
      }
    } catch {
      // Revert optimistic message on network error
      if (activeTab === 'everyone') {
        setEveryoneMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else if (activeDirectKey) {
        setDirectMessagesMap((prev) => ({
          ...prev,
          [activeDirectKey]: (prev[activeDirectKey] || []).filter((m) => m.id !== tempId),
        }));
      }
      alert('Network error: unable to send message.');
    } finally {
      setSending(false);
    }
  }

  // 5. Clear All Chats Handler (Teacher / Admin)
  async function handleClearAllChats() {
    if (!window.confirm('Delete all messages in this chatroom? All chats will be deleted for everyone.')) return;
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setEveryoneMessages([]);
        setDirectMessagesMap({});
        setUnreadEveryone(0);
        setUnreadDirect(0);
        setUnreadOtherGrades(0);
        setStudentUnreadMap({});
        loadedTabsRef.current.clear();
      }
    } catch {
      alert('Failed to clear chat messages.');
    }
  }

  // Delete individual message (Teachers/admins can delete any/own message, kids can delete own messages sent by mistake)
  async function handleDeleteMessage(msg: ChatMessageItem) {
    if (!msg.id) return;
    const isTemp = msg.id.startsWith('temp_');
    if (!window.confirm('Delete this message?')) return;

    // Optimistically remove from state immediately
    if (msg.channel === 'everyone') {
      setEveryoneMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } else {
      const key = user.role === 'student' ? 'teacher' : (msg.studentId || selectedStudentId || '');
      if (key) {
        setDirectMessagesMap((prev) => ({
          ...prev,
          [key]: (prev[key] || []).filter((m) => m.id !== msg.id),
        }));
      }
    }

    if (isTemp) return;

    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(msg.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete message.');
        // Re-fetch to sync state if deletion failed
        const channelToFetch = activeTab === 'everyone' ? 'everyone' : 'direct';
        const studentToFetch = activeTab === 'other_grades' ? selectedOtherStudentId : selectedStudentId;
        void fetchChannelMessages(channelToFetch, studentToFetch);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  }

  // 6. Drag Handle for Height Adjustment
  function handleDragStart(e: React.PointerEvent) {
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartHRef.current = height;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    function onPointerMove(ev: PointerEvent) {
      if (!isDraggingRef.current) return;
      const deltaY = ev.clientY - dragStartYRef.current;
      const newH = Math.max(340, Math.min(window.innerHeight - 40, dragStartHRef.current - deltaY));
      setHeight(newH);
      localStorage.setItem('classroom_chat_height', String(Math.round(newH)));
    }

    function onPointerUp(ev: PointerEvent) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(ev.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  // Quick height preset toggling
  function cycleHeightPreset() {
    let nextH = 490;
    if (height < 420) nextH = 490;
    else if (height < 600) nextH = 680;
    else nextH = 360;
    setHeight(nextH);
    localStorage.setItem('classroom_chat_height', String(nextH));
  }

  const totalUnread = unreadEveryone + unreadDirect + unreadOtherGrades;
  const teacherDisplayName = classroomTeacher?.name || user.teacherName || 'Teacher';

  // Broadcast unread count to topbar button
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('classroom-chat-unread-change', { detail: totalUnread }));
  }, [totalUnread]);

  // Listen for open/toggle/close events from topbar button
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    const handleToggle = () => {
      setIsOpen((prev) => {
        if (!prev) setIsMinimized(false);
        return !prev;
      });
    };
    const handleClose = () => {
      setIsOpen(false);
    };
    window.addEventListener('open-classroom-chat', handleOpen);
    window.addEventListener('toggle-classroom-chat', handleToggle);
    window.addEventListener('close-classroom-chat', handleClose);
    return () => {
      window.removeEventListener('open-classroom-chat', handleOpen);
      window.removeEventListener('toggle-classroom-chat', handleToggle);
      window.removeEventListener('close-classroom-chat', handleClose);
    };
  }, []);

  return (
    <>
      {/* Floating Chat Popup Card (Only displayed when opened from topbar Chat button) */}
      {isOpen && (
        <div
          className={`chat-popup-card ${isMinimized ? 'chat-popup-card--minimized' : ''}`}
          style={{ height: isMinimized ? 'auto' : `${height}px` }}
        >
          {/* Top Resizable Grab Handle */}
          {!isMinimized && (
            <div
              className="chat-card-drag-handle"
              onPointerDown={handleDragStart}
              title="Drag up or down to adjust chat height"
            >
              <div className="chat-drag-pill" />
            </div>
          )}

          {/* Card Header: Simple "Chatroom" */}
          <div className="chat-card-header">
            <div className="chat-header-title-wrap">
              <div className="chat-online-dot" title="Live Classroom Connection Active" />
              <div>
                <h3 className="chat-header-title">Chatroom</h3>
              </div>
            </div>

            <div className="chat-header-actions">
              {(user.role === 'teacher' || user.role === 'admin' || user.role === 'superadmin') && !isMinimized && (
                <button
                  type="button"
                  className="chat-header-btn"
                  onClick={handleClearAllChats}
                  title="Clear all chat messages"
                >
                  <Trash2 size={13} />
                </button>
              )}
              {!isMinimized && (
                <button
                  type="button"
                  className="chat-header-btn"
                  onClick={cycleHeightPreset}
                  title="Cycle card size (Compact / Normal / Tall)"
                >
                  <Maximize2 size={14} />
                </button>
              )}
              <button
                type="button"
                className="chat-header-btn"
                onClick={() => setIsMinimized((v) => !v)}
                title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                className="chat-header-btn chat-header-btn--close"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Channel Tabs: Everyone vs One to One vs Messages */}
              <div className="chat-tabs-bar">
                {!isStudentFromOtherGrade && (
                  <button
                    type="button"
                    className={`chat-tab-btn ${activeTab === 'everyone' ? 'chat-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('everyone')}
                  >
                    <Users size={14} />
                    <span>Everyone</span>
                    {unreadEveryone > 0 && (
                      <span className="chat-tab-badge">{unreadEveryone}</span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  className={`chat-tab-btn ${activeTab === 'direct' ? 'chat-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('direct')}
                >
                  <MessageCircle size={14} />
                  <span>
                    {user.role !== 'student' && isBroadcastGradeFiltered
                      ? broadcastGrade
                      : 'One to One'}
                  </span>
                  {unreadDirect > 0 && (
                    <span className="chat-tab-badge">{unreadDirect}</span>
                  )}
                </button>

                {user.role !== 'student' && isBroadcastGradeFiltered && (
                  <button
                    type="button"
                    className={`chat-tab-btn ${activeTab === 'other_grades' ? 'chat-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('other_grades')}
                    title="Direct messages from other students"
                  >
                    <MessageSquare size={14} />
                    <span>Messages</span>
                    {unreadOtherGrades > 0 && (
                      <span className="chat-tab-badge">{unreadOtherGrades}</span>
                    )}
                  </button>
                )}
              </div>

              {/* Sub-Header for One to One Tab */}
              {activeTab === 'direct' && (
                <div className="chat-sub-channel-bar">
                  {user.role === 'student' ? (
                    <div className="chat-direct-student-info">
                      <Star size={13} className="text-amber-500" />
                      <span>
                        Private conversation with <strong>{teacherDisplayName}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="chat-direct-teacher-selector">
                      <div className="chat-selector-row">
                        <label htmlFor="chatStudentSelect" className="chat-selector-label">
                          Student:
                        </label>
                        {filteredStudents.length === 0 ? (
                          <span className="chat-no-students-label">
                            {isBroadcastGradeFiltered
                              ? `No students in ${broadcastGrade}`
                              : 'No students enrolled yet'}
                          </span>
                        ) : (
                          <div className="chat-student-select-wrap">
                            <select
                              id="chatStudentSelect"
                              className="chat-student-dropdown"
                              value={selectedStudentId || ''}
                              onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                              {filteredStudents.map((st) => {
                                const unread = studentUnreadMap[st.id] || 0;
                                const unreadLabel = unread > 0 ? ` [${unread} new]` : '';
                                const gradeLabel = formatGradeBracket(st.grade);
                                return (
                                  <option key={st.id} value={st.id}>
                                    {st.name}{gradeLabel}{unreadLabel}
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown size={13} className="chat-select-chevron" />
                          </div>
                        )}
                        {isBroadcastGradeFiltered && (
                          <span
                            className="chat-broadcast-grade-badge"
                            title={`Showing students of Broadcast Class selected in Whiteboard: ${broadcastGrade}`}
                          >
                            {isBroadcastLive ? `📡 Live (${broadcastGrade})` : `🎓 ${broadcastGrade}`}
                          </span>
                        )}
                        {selectedStudentId && (studentUnreadMap[selectedStudentId] || 0) > 0 ? (
                          <span className="chat-selected-unread-badge" title="Unread messages from this student">
                            {studentUnreadMap[selectedStudentId]} new
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Header for Other Grades Tab */}
              {activeTab === 'other_grades' && (
                <div className="chat-sub-channel-bar chat-sub-channel-bar--other">
                  <div className="chat-direct-teacher-selector">
                    <div className="chat-selector-row">
                      <label htmlFor="chatOtherStudentSelect" className="chat-selector-label">
                        Student:
                      </label>
                      {otherStudents.length === 0 ? (
                        <span className="chat-no-students-label">No students from other grades</span>
                      ) : (
                        <div className="chat-student-select-wrap">
                          <select
                            id="chatOtherStudentSelect"
                            className="chat-student-dropdown"
                            value={selectedOtherStudentId || ''}
                            onChange={(e) => setSelectedOtherStudentId(e.target.value)}
                          >
                            {otherStudents.map((st) => {
                              const unread = studentUnreadMap[st.id] || 0;
                              const unreadLabel = unread > 0 ? ` [${unread} new]` : '';
                              const gradeLabel = formatGradeBracket(st.grade);
                              return (
                                <option key={st.id} value={st.id}>
                                  {st.name}{gradeLabel}{unreadLabel}
                                </option>
                              );
                            })}
                          </select>
                          <ChevronDown size={13} className="chat-select-chevron" />
                        </div>
                      )}
                      <span
                        className="chat-other-grade-tag"
                        title="Messages from other classes stay quietly here without interrupting your live session"
                      >
                        Messages
                      </span>
                      {selectedOtherStudentId && (studentUnreadMap[selectedOtherStudentId] || 0) > 0 ? (
                        <span className="chat-selected-unread-badge" title="Unread messages from this student">
                          {studentUnreadMap[selectedOtherStudentId]} new
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* Message List Area */}
              <div className="chat-messages-container">
                {loadingMessages && currentMessages.length === 0 ? (
                  <div className="chat-loading-state">
                    <div className="chat-spinner" />
                    <span>Loading conversation...</span>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="chat-empty-state">
                    <div className="chat-empty-icon-wrap">
                      <Sparkles size={24} color="#0284c7" />
                    </div>
                    <h4>
                      {activeTab === 'everyone'
                        ? 'Welcome to the Chatroom!'
                        : activeTab === 'other_grades'
                        ? 'Messages'
                        : user.role === 'student'
                        ? `Direct Chat with ${teacherDisplayName}`
                        : 'Direct Student Chat'}
                    </h4>
                    <p>
                      {activeTab === 'everyone'
                        ? 'Kids and teacher can ask questions, share answers, and collaborate here.'
                        : activeTab === 'other_grades'
                        ? 'Private messages sent by students outside the current broadcast class stay quietly here.'
                        : user.role === 'student'
                        ? 'Ask your teacher any question privately. Only you and your teacher can view this.'
                        : 'Have a private 1-on-1 discussion or offer individual math guidance.'}
                    </p>
                    <div className="chat-starter-pills">
                      <button
                        type="button"
                        onClick={() => handleSendMessage('Hello! 👋')}
                      >
                        Hello! 👋
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage('How can I help you today?')}
                      >
                        How can I help you?
                      </button>
                    </div>
                  </div>
                ) : (
                  currentMessages.map((m, idx) => {
                    const isMine = m.senderId === user.id;
                    const isTeacherMsg = m.senderRole === 'teacher';
                    const canDelete = isMine || user.role === 'teacher' || user.role === 'admin' || user.role === 'superadmin';
                    const timeStr = new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={m.id || idx}
                        className={`chat-message-row ${isMine ? 'chat-message-row--mine' : 'chat-message-row--theirs'}`}
                      >
                        {!isMine && (
                          <div
                            className={`chat-avatar ${isTeacherMsg ? 'chat-avatar--teacher' : 'chat-avatar--student'}`}
                            title={m.senderName}
                          >
                            {m.senderName.slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        <div className="chat-bubble-wrap">
                          {!isMine && (
                            <div className="chat-sender-header">
                              <span className="chat-sender-name">{m.senderName}</span>
                              {isTeacherMsg ? (
                                <span className="chat-badge chat-badge--teacher">
                                  Teacher <Star size={10} />
                                </span>
                              ) : (
                                <span className="chat-badge chat-badge--student">
                                  Kid <GraduationCap size={10} />
                                </span>
                              )}
                            </div>
                          )}

                          <div className="chat-bubble-and-actions">
                            {isMine && canDelete && (
                              <button
                                type="button"
                                className="chat-msg-delete-btn"
                                onClick={() => handleDeleteMessage(m)}
                                title="Delete message sent by mistake"
                                aria-label="Delete message sent by mistake"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                            <div className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
                              <p className="chat-text">{m.content}</p>
                              <span className="chat-time">
                                {timeStr}
                                {isMine && <CheckCheck size={11} className="chat-check" />}
                              </span>
                            </div>

                            {!isMine && canDelete && (
                              <button
                                type="button"
                                className="chat-msg-delete-btn"
                                onClick={() => handleDeleteMessage(m)}
                                title="Delete message"
                                aria-label="Delete message"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reactions Bar */}
              {showEmojis && (
                <div className="chat-quick-emojis">
                  {QUICK_REACTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="chat-emoji-btn"
                      onClick={() => handleSendMessage(em)}
                      title={`Send ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Input Area */}
              <div className="chat-input-bar">
                <button
                  type="button"
                  className={`chat-icon-action-btn ${showEmojis ? 'chat-icon-action-btn--active' : ''}`}
                  onClick={() => setShowEmojis((v) => !v)}
                  title="Quick reactions"
                >
                  <Smile size={18} />
                </button>

                <input
                  type="text"
                  className="chat-text-input"
                  placeholder={
                    activeTab === 'everyone'
                      ? 'Message everyone in class...'
                      : user.role === 'student'
                      ? `Message ${teacherDisplayName}...`
                      : activeTab === 'other_grades'
                      ? 'Type a message...'
                      : 'Type a private reply...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  maxLength={1500}
                />

                <button
                  type="button"
                  className="chat-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={sending || !inputText.trim()}
                  title="Send message (Enter)"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Incoming Student Message Notification Pop-up Toasts */}
      {toasts.length > 0 && (
        <div className="chat-toast-container">
          {toasts.map((toast) => {
            const initials =
              toast.senderName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'ST';
            return (
              <div
                key={toast.id}
                className="chat-toast-card"
                onClick={() => handleToastClick(toast)}
                title="Click to view message and open chat"
              >
                <div className="chat-toast-avatar">{initials}</div>
                <div className="chat-toast-body">
                  <div className="chat-toast-header">
                    <span className="chat-toast-sender">{toast.senderName}</span>
                    <span className="chat-toast-tag">
                      {toast.channel === 'direct' ? 'One-to-One' : 'Classroom'}
                    </span>
                  </div>
                  <div className="chat-toast-msg">{toast.content}</div>
                  <div className="chat-toast-action-hint">Click to open chat 💬</div>
                </div>
                <button
                  type="button"
                  className="chat-toast-close"
                  onClick={(e) => dismissToast(toast.id, e)}
                  title="Dismiss notification"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function ClassroomChatHeaderButton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<number>).detail;
      setUnread(typeof count === 'number' ? count : 0);
    };
    window.addEventListener('classroom-chat-unread-change', handler);
    return () => window.removeEventListener('classroom-chat-unread-change', handler);
  }, []);

  return (
    <button
      type="button"
      className={`topbar-chat-btn ${className || ''}`}
      style={style}
      onClick={() => window.dispatchEvent(new CustomEvent('toggle-classroom-chat'))}
      title="Classroom Chatroom"
      aria-label="Classroom Chatroom"
    >
      <div className="topbar-chat-icon-wrap">
        <MessageSquare size={16} />
        {unread > 0 && (
          <span className="topbar-chat-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </div>
      <span>Chat</span>
    </button>
  );
}
