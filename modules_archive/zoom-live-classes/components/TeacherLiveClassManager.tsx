import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  Video,
  Users,
  Copy,
  Trash2,
  Check,
  Play,
  CheckCircle2,
  Lock,
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  FileText,
  Layers,
  Zap,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CalendarClock,
} from 'lucide-react';
import type { LiveClass, TeacherZoomStatus, ZoomJoinInfo } from '../types/liveClass';
import { ALL_ACADEMIC_SUBJECTS, ALL_STUDENT_GRADES } from '../App';
import './ZoomLiveClassroom.css';

interface TeacherLiveClassManagerProps {
  onLaunchClassroom: (joinInfo: ZoomJoinInfo) => void;
  setNotice: (msg: string) => void;
  teacherName?: string;
  defaultGrade?: string;
  defaultSubject?: string;
}

export const TeacherLiveClassManager: React.FC<TeacherLiveClassManagerProps> = ({
  onLaunchClassroom,
  setNotice,
  teacherName,
  defaultGrade,
  defaultSubject,
}) => {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [zoomStatus, setZoomStatus] = useState<TeacherZoomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [savingClass, setSavingClass] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [launchingClassId, setLaunchingClassId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState(defaultGrade || 'Grade 10');
  const [subject, setSubject] = useState(defaultSubject || 'Mathematics');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingMode, setMeetingMode] = useState<'auto' | 'manual'>('auto');
  const [manualMeetingId, setManualMeetingId] = useState('');
  const [manualPasscode, setManualPasscode] = useState('');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showScheduleModal) {
        setShowScheduleModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showScheduleModal]);

  // Quick Datetime Presets
  const setQuickTime = (minutesFromNow: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesFromNow);
    setScheduledAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  const setTomorrowTime = (hour: number, minute: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    setScheduledAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  // Load classes and Zoom status
  const loadData = async () => {
    try {
      setRefreshing(true);
      const [classesRes, statusRes] = await Promise.all([
        fetch('/api/live-classes', { credentials: 'same-origin' }),
        fetch('/api/teacher/zoom/status', { credentials: 'same-origin' }),
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.classes || []);
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setZoomStatus(data);
        if (!data.connected) {
          setMeetingMode('manual');
        } else {
          setMeetingMode('auto');
        }
      }
    } catch (err: any) {
      setNotice(err?.message || 'Failed to load Zoom live classes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check URL query parameters for Zoom OAuth return feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('zoom_connected') === '1') {
      setNotice('✓ Your personal Zoom account has been connected successfully!');
      // Clean query parameter
      window.history.replaceState({}, '', window.location.pathname);
      loadData();
    } else if (params.get('zoom_error')) {
      setNotice(`Zoom connection notice: ${params.get('zoom_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Connect Zoom OAuth
  const handleConnectZoom = async () => {
    try {
      const res = await fetch('/api/teacher/zoom/auth-url', { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate Zoom authorization link.');
      window.location.href = data.authUrl;
    } catch (err: any) {
      setNotice(err?.message || 'Unable to start Zoom connection.');
    }
  };

  // Disconnect Zoom
  const handleDisconnectZoom = async () => {
    if (!window.confirm('Disconnect your Zoom account from EduAshram? Existing scheduled meetings will remain, but automatic meeting generation will be paused.')) {
      return;
    }
    try {
      const res = await fetch('/api/teacher/zoom/disconnect', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setNotice('Zoom account disconnected.');
        await loadData();
      }
    } catch (err: any) {
      setNotice(err?.message || 'Failed to disconnect Zoom account.');
    }
  };

  // Create / Schedule Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setNotice('Please provide a class topic title.');
      return;
    }

    if (meetingMode === 'manual') {
      const cleanId = manualMeetingId.replace(/[\s-]/g, '');
      if (!cleanId || !manualPasscode.trim()) {
        setNotice('Please provide your Zoom Meeting ID and Passcode.');
        return;
      }
      if (cleanId === '78912345678' || cleanId === '1234567890' || cleanId === '123456789') {
        setNotice('⚠️ "789 1234 5678" is only a placeholder example. Please enter your real 10 or 11-digit Zoom Personal Meeting ID (PMI) from your Zoom app profile.');
        return;
      }
      if (cleanId.length < 9 || cleanId.length > 11 || !/^\d+$/.test(cleanId)) {
        setNotice('Please enter a valid 9 to 11-digit Zoom Meeting ID (numbers only).');
        return;
      }
    }

    setSavingClass(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        grade,
        subject,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
      };

      if (meetingMode === 'manual') {
        payload.manualMeetingId = manualMeetingId.replace(/[\s-]/g, '');
        payload.manualPasscode = manualPasscode.trim();
      }

      const res = await fetch('/api/teacher/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create live class.');

      setNotice(`✓ Live class "${data.liveClass.title}" scheduled successfully!`);
      setShowScheduleModal(false);
      setTitle('');
      setDescription('');
      setManualMeetingId('');
      setManualPasscode('');
      await loadData();
    } catch (err: any) {
      setNotice(err?.message || 'Unable to schedule live class.');
    } finally {
      setSavingClass(false);
    }
  };

  // Start or Join Class
  const handleLaunchClass = async (liveClass: LiveClass) => {
    try {
      setLaunchingClassId(liveClass.id);

      // If scheduled, mark as LIVE first
      if (liveClass.status === 'SCHEDULED') {
        await fetch(`/api/live-classes/${liveClass.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ status: 'LIVE' }),
        });
      }

      // Fetch Join Info with SDK signature and ZAK token
      const res = await fetch(`/api/live-classes/${liveClass.id}/join-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          displayName: teacherName ? `${teacherName} (Teacher)` : 'Teacher',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate Zoom classroom session.');

      onLaunchClassroom(data);
    } catch (err: any) {
      setNotice(err?.message || 'Unable to launch Zoom live class.');
    } finally {
      setLaunchingClassId(null);
    }
  };

  // End Class
  const handleEndClass = async (classId: string) => {
    if (!window.confirm('Are you sure you want to conclude and end this live class?')) return;
    try {
      const res = await fetch(`/api/live-classes/${classId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) {
        setNotice('Live class marked as completed.');
        await loadData();
      }
    } catch (err: any) {
      setNotice(err?.message || 'Failed to update class status.');
    }
  };

  // Delete Class
  const handleDeleteClass = async (classId: string, classTitle: string) => {
    if (!window.confirm(`Delete live class "${classTitle}"?`)) return;
    try {
      const res = await fetch(`/api/live-classes/${classId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setNotice('Live class removed.');
        await loadData();
      }
    } catch (err: any) {
      setNotice(err?.message || 'Failed to delete class.');
    }
  };

  // Copy Invite
  const handleCopyInvite = (c: LiveClass) => {
    const inviteUrl = c.joinUrl || `https://zoom.us/j/${c.meetingId}?pwd=${c.passcode}`;
    const text = `Join EduAshram Live Class!\nTopic: ${c.title}\nSubject: ${c.subject || 'N/A'}\nGrade: ${c.grade || 'All'}\nDate & Time: ${new Date(c.scheduledAt).toLocaleString()}\nMeeting ID: ${c.meetingId}\nPasscode: ${c.passcode}\nDirect Student Link: ${inviteUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2500);
    setNotice('✓ Student invite link & details copied to clipboard!');
  };

  const filteredClasses = classes.filter((c) => {
    if (activeFilter === 'active') return c.status === 'LIVE' || c.status === 'SCHEDULED';
    if (activeFilter === 'completed') return c.status === 'COMPLETED' || c.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="view-enter teacher-zoom-manager">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="overline">Interactive Online Teaching</span>
          <h1>Zoom Live Classes</h1>
          <p>Host live interactive sessions with embedded Zoom video and split-screen whiteboard.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="button button-primary"
            onClick={() => setShowScheduleModal(true)}
          >
            <Plus size={16} /> Schedule Live Class
          </button>
          <button
            className="button button-secondary"
            onClick={loadData}
            disabled={refreshing}
            title="Refresh classes"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Zoom Integration Status Banner */}
      <div className="zoom-status-card">
        <div className="zoom-status-left">
          <div className="zoom-logo-box">
            <Video size={24} color="#0284c7" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Zoom Account Integration</h3>
              {zoomStatus?.connected ? (
                <span className="badge badge-published" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Connected
                </span>
              ) : (
                <span className="badge badge-draft">Personal Account / Manual Ready</span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              {zoomStatus?.connected
                ? `Linked to Zoom email: ${zoomStatus.zoomEmail || 'Active'}. Classes are created automatically using your personal Zoom account.`
                : 'Connect your personal Zoom account to auto-generate meeting links and host live classes seamlessly, or use your Personal Meeting ID (PMI) manually.'}
            </p>
          </div>
        </div>

        <div className="zoom-status-actions">
          {zoomStatus?.connected ? (
            <button
              className="button button-secondary"
              onClick={handleDisconnectZoom}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Disconnect Zoom
            </button>
          ) : (
            <button
              className="button button-primary"
              onClick={handleConnectZoom}
              style={{ background: '#0284c7', borderColor: '#0284c7', fontSize: '13px' }}
            >
              <Video size={15} /> Connect Zoom Account
            </button>
          )}
        </div>
      </div>

      {/* Class Filters */}
      <div className="zoom-filter-tabs">
        <button
          className={`zoom-filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          Scheduled & Live ({classes.filter((c) => c.status === 'LIVE' || c.status === 'SCHEDULED').length})
        </button>
        <button
          className={`zoom-filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          Completed Classes ({classes.filter((c) => c.status === 'COMPLETED').length})
        </button>
        <button
          className={`zoom-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Classes ({classes.length})
        </button>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="empty-state" style={{ minHeight: '180px' }}>
          <RefreshCw className="spin" size={24} color="#0284c7" />
          <p style={{ marginTop: '12px' }}>Loading your live classes...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="empty-state" style={{ padding: '36px 20px', minHeight: '180px' }}>
          <span className="empty-icon">
            <Video size={28} color="#0284c7" />
          </span>
          <h3>No live classes found in this view.</h3>
          <p>Schedule your first live Zoom classroom with split-screen whiteboard for students.</p>
          <button
            className="button button-primary"
            onClick={() => setShowScheduleModal(true)}
            style={{ marginTop: '12px' }}
          >
            <Plus size={16} /> Schedule Live Class
          </button>
        </div>
      ) : (
        <div className="zoom-class-grid">
          {filteredClasses.map((c) => {
            const isLive = c.status === 'LIVE';
            const isScheduled = c.status === 'SCHEDULED';
            const isCompleted = c.status === 'COMPLETED';

            return (
              <div
                key={c.id}
                className={`zoom-card ${isLive ? 'zoom-card--live' : ''}`}
              >
                {/* Header & Badges */}
                <div className="zoom-card-header">
                  <div className="zoom-card-badges">
                    {isLive && (
                      <span className="zoom-badge-live">
                        <span className="zoom-pulse-dot" /> LIVE NOW
                      </span>
                    )}
                    {isScheduled && (
                      <span className="zoom-badge-scheduled">Scheduled</span>
                    )}
                    {isCompleted && (
                      <span className="zoom-badge-completed">Completed</span>
                    )}
                    {c.subject && <span className="worksheet-badge badge-subject">{c.subject}</span>}
                    {c.grade && <span className="worksheet-badge badge-draft">{c.grade}</span>}
                  </div>
                  <button
                    className="icon-button quiet"
                    onClick={() => handleDeleteClass(c.id, c.title)}
                    title="Delete Class"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className="zoom-card-title">{c.title}</h3>
                {c.description && <p className="zoom-card-desc">{c.description}</p>}

                {/* Meta details */}
                <div className="zoom-card-meta">
                  <div className="zoom-meta-row">
                    <Calendar size={14} color="#64748b" />
                    <span>{new Date(c.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="zoom-meta-row">
                    <Clock size={14} color="#64748b" />
                    <span>{c.durationMinutes} Minutes</span>
                  </div>
                  <div className="zoom-meta-row">
                    <Lock size={14} color="#64748b" />
                    <span>Meeting ID: <strong>{c.meetingId}</strong> (Passcode: <code>{c.passcode}</code>)</span>
                  </div>
                  {c._count?.attendances !== undefined && (
                    <div className="zoom-meta-row">
                      <Users size={14} color="#64748b" />
                      <span>{c._count.attendances} student check-in{c._count.attendances === 1 ? '' : 's'}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="zoom-card-actions">
                  {isLive && (
                    <>
                      <button
                        className="button button-primary"
                        onClick={() => handleLaunchClass(c)}
                        disabled={launchingClassId === c.id}
                        style={{ flex: '2 1 auto', background: '#e11d48', borderColor: '#e11d48' }}
                      >
                        {launchingClassId === c.id ? (
                          <RefreshCw className="spin" size={15} />
                        ) : (
                          <Video size={15} />
                        )}
                        <span>Join Live Classroom (Split-Screen)</span>
                      </button>
                      <button
                        className="button button-secondary"
                        onClick={() => handleEndClass(c.id)}
                        title="Conclude and end class"
                      >
                        End Class
                      </button>
                    </>
                  )}

                  {isScheduled && (
                    <>
                      <button
                        className="button button-primary"
                        onClick={() => handleLaunchClass(c)}
                        disabled={launchingClassId === c.id}
                        style={{ flex: '2 1 auto' }}
                      >
                        {launchingClassId === c.id ? (
                          <RefreshCw className="spin" size={15} />
                        ) : (
                          <Play size={15} />
                        )}
                        <span>Start Live Class</span>
                      </button>
                    </>
                  )}

                  {/* Share Invite */}
                  <button
                    className="button button-secondary"
                    onClick={() => handleCopyInvite(c)}
                    title="Copy Student Invite Details"
                  >
                    {copiedId === c.id ? (
                      <Check size={14} color="#10b981" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedId === c.id ? 'Copied' : 'Invite'}</span>
                  </button>

                  {/* Open in Native Zoom App */}
                  <a
                    href={c.startUrl || c.joinUrl || `https://zoom.us/j/${c.meetingId}?pwd=${c.passcode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-secondary"
                    title="Open in Zoom Desktop App"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule / Quick Launch Modal */}
      {showScheduleModal && typeof document !== 'undefined' && createPortal(
        <div
          className="zoom-sched-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowScheduleModal(false);
          }}
        >
          <div className="zoom-sched-modal" role="dialog" aria-modal="true">
            <div className="zoom-sched-top-accent" />

            {/* Header */}
            <div className="zoom-sched-header">
              <div className="zoom-sched-header-left">
                <div className="zoom-sched-icon-badge">
                  <Video size={22} />
                </div>
                <div>
                  <h2 className="zoom-sched-title">Schedule Zoom Live Class</h2>
                  <p className="zoom-sched-subtitle">
                    Create an interactive live session with embedded whiteboard & screen sharing
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="zoom-sched-close-btn"
                onClick={() => setShowScheduleModal(false)}
                title="Close modal (Esc)"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateClass} style={{ display: 'contents' }}>
              <div className="zoom-sched-body">
                {/* Class Topic / Title */}
                <div className="zoom-form-group">
                  <label className="zoom-form-label">
                    <span className="zoom-label-left">
                      <Sparkles size={14} color="#0284c7" />
                      <span>Class Topic / Title</span>
                      <span className="zoom-req-mark">*</span>
                    </span>
                    <span className="zoom-label-right">What will be taught</span>
                  </label>
                  <input
                    type="text"
                    className="zoom-input"
                    placeholder="e.g. Chapter 4: Quadratic Equations - Live Problem Solving"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* Subject & Grade Grid */}
                <div className="zoom-form-row zoom-form-row-2">
                  <div className="zoom-form-group">
                    <label className="zoom-form-label">
                      <span className="zoom-label-left">
                        <BookOpen size={14} color="#0284c7" />
                        <span>Subject</span>
                      </span>
                    </label>
                    <select
                      className="zoom-select"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      {ALL_ACADEMIC_SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="zoom-form-group">
                    <label className="zoom-form-label">
                      <span className="zoom-label-left">
                        <GraduationCap size={14} color="#0284c7" />
                        <span>Grade Level</span>
                      </span>
                    </label>
                    <select
                      className="zoom-select"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      {ALL_STUDENT_GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Time + Duration Grid */}
                <div className="zoom-form-row zoom-form-row-datetime">
                  <div className="zoom-form-group">
                    <label className="zoom-form-label">
                      <span className="zoom-label-left">
                        <CalendarClock size={14} color="#0284c7" />
                        <span>Scheduled Date & Time</span>
                        <span className="zoom-req-mark">*</span>
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      className="zoom-input"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      required
                    />
                    <div className="zoom-quick-pills">
                      <span style={{ fontSize: '11px', color: '#64748b', marginRight: '2px' }}>Quick set:</span>
                      <button
                        type="button"
                        className="zoom-quick-pill"
                        onClick={() => setQuickTime(5)}
                      >
                        In 5 min
                      </button>
                      <button
                        type="button"
                        className="zoom-quick-pill"
                        onClick={() => setQuickTime(30)}
                      >
                        In 30 min
                      </button>
                      <button
                        type="button"
                        className="zoom-quick-pill"
                        onClick={() => setTomorrowTime(10, 0)}
                      >
                        Tomorrow 10 AM
                      </button>
                      <button
                        type="button"
                        className="zoom-quick-pill"
                        onClick={() => setTomorrowTime(16, 0)}
                      >
                        Tomorrow 4 PM
                      </button>
                    </div>
                  </div>

                  <div className="zoom-form-group">
                    <label className="zoom-form-label">
                      <span className="zoom-label-left">
                        <Clock size={14} color="#0284c7" />
                        <span>Duration</span>
                      </span>
                    </label>
                    <select
                      className="zoom-select"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes (1 hr)</option>
                      <option value={90}>90 Minutes (1.5 hrs)</option>
                      <option value={120}>120 Minutes (2 hrs)</option>
                    </select>
                  </div>
                </div>

                {/* Meeting Generation Mode */}
                <div className="zoom-form-group">
                  <label className="zoom-form-label">
                    <span className="zoom-label-left">
                      <Layers size={14} color="#0284c7" />
                      <span>Meeting Generation Mode</span>
                    </span>
                    <span className="zoom-label-right">Choose how room is hosted</span>
                  </label>

                  <div className="zoom-mode-grid">
                    {/* Auto Zoom API Card */}
                    <div
                      className={`zoom-mode-card ${meetingMode === 'auto' ? 'selected' : ''} ${!zoomStatus?.connected ? 'disabled' : ''}`}
                      onClick={() => {
                        if (zoomStatus?.connected) {
                          setMeetingMode('auto');
                        } else {
                          setNotice('Please connect your Zoom account first using the banner above, or use Personal Meeting ID (PMI).');
                        }
                      }}
                    >
                      <div className="zoom-mode-radio-wrap">
                        <div className="zoom-custom-radio">
                          <div className="zoom-custom-radio-dot" />
                        </div>
                      </div>
                      <div className="zoom-mode-info">
                        <div className="zoom-mode-title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Zap size={14} color="#0284c7" />
                          <span>Auto via Zoom API</span>
                        </div>
                        <div className="zoom-mode-desc">
                          Automatically generates Zoom room & passcode via linked Zoom account
                        </div>
                        {zoomStatus?.connected ? (
                          <span className="zoom-mode-tag zoom-mode-tag-ready">
                            <Check size={11} /> Connected & Ready
                          </span>
                        ) : (
                          <span className="zoom-mode-tag zoom-mode-tag-warn">
                            <AlertCircle size={11} /> Connect Zoom First
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Personal Meeting ID Card */}
                    <div
                      className={`zoom-mode-card ${meetingMode === 'manual' ? 'selected' : ''}`}
                      onClick={() => setMeetingMode('manual')}
                    >
                      <div className="zoom-mode-radio-wrap">
                        <div className="zoom-custom-radio">
                          <div className="zoom-custom-radio-dot" />
                        </div>
                      </div>
                      <div className="zoom-mode-info">
                        <div className="zoom-mode-title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <KeyRound size={14} color="#0284c7" />
                          <span>Personal Meeting ID (PMI)</span>
                        </div>
                        <div className="zoom-mode-desc">
                          Use your fixed Zoom Meeting ID and passcode from your Zoom app
                        </div>
                        <span className="zoom-mode-tag zoom-mode-tag-manual">
                          <KeyRound size={11} /> Always Available
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual PMI Input Section */}
                {meetingMode === 'manual' && (
                  <div className="zoom-pmi-box">
                    <div className="zoom-pmi-header">
                      <ShieldCheck size={16} className="zoom-pmi-header-icon" />
                      <span>Enter your personal Zoom meeting room credentials:</span>
                    </div>

                    <div className="zoom-form-row zoom-form-row-2">
                      <div className="zoom-form-group">
                        <label className="zoom-form-label">
                          <span className="zoom-label-left">
                            <Video size={13} color="#0284c7" />
                            <span>Zoom Meeting ID / PMI</span>
                            <span className="zoom-req-mark">*</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          className="zoom-input"
                          placeholder="Your 10 or 11-digit Zoom PMI"
                          value={manualMeetingId}
                          onChange={(e) => setManualMeetingId(e.target.value)}
                          required={meetingMode === 'manual'}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          Find in Zoom app &gt; Profile / Meetings &gt; Personal Meeting ID (PMI). Do not use dummy numbers.
                        </span>
                      </div>

                      <div className="zoom-form-group">
                        <label className="zoom-form-label">
                          <span className="zoom-label-left">
                            <Lock size={13} color="#0284c7" />
                            <span>Meeting Passcode</span>
                            <span className="zoom-req-mark">*</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          className="zoom-input"
                          placeholder="Your Zoom passcode (e.g. 123456)"
                          value={manualPasscode}
                          onChange={(e) => setManualPasscode(e.target.value)}
                          required={meetingMode === 'manual'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Class Description / Preparation Notes */}
                <div className="zoom-form-group">
                  <label className="zoom-form-label">
                    <span className="zoom-label-left">
                      <FileText size={14} color="#0284c7" />
                      <span>Class Description / Preparation Notes</span>
                    </span>
                    <span className="zoom-label-right">Optional</span>
                  </label>
                  <textarea
                    className="zoom-textarea"
                    rows={2}
                    placeholder="e.g. Keep your NCERT Chapter 4 textbook and notebook ready. We will solve practice problems together."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="zoom-sched-footer">
                <div className="zoom-sched-footer-hint">
                  <CheckCircle2 size={15} color="#10b981" />
                  <span>Class appears instantly on student dashboard</span>
                </div>

                <div className="zoom-sched-footer-actions">
                  <button
                    type="button"
                    className="zoom-btn-modal-cancel"
                    onClick={() => setShowScheduleModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="zoom-btn-modal-submit"
                    disabled={savingClass}
                  >
                    {savingClass ? <RefreshCw className="spin" size={16} /> : <Plus size={16} />}
                    <span>{savingClass ? 'Scheduling...' : 'Schedule Live Class'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
