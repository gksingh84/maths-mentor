import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Maximize2,
  PenTool,
  PhoneOff,
  RefreshCw,
  Users,
  Check,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  ShieldAlert,
} from 'lucide-react';
import type { ZoomJoinInfo, LiveClassAttendance } from '../types/liveClass';
import './ZoomLiveClassroom.css';

interface ZoomLiveClassroomProps {
  joinInfo: ZoomJoinInfo;
  onLeave: () => void;
  onClassEnded?: () => void;
  setNotice?: (msg: string) => void;
  currentUserRole: 'teacher' | 'student';
}

type SplitLayout = 'split_equal' | 'zoom_focus' | 'workspace_focus' | 'zoom_full';
type WorkspaceTab = 'whiteboard' | 'notes' | 'attendance' | 'doubts';

export const ZoomLiveClassroom: React.FC<ZoomLiveClassroomProps> = ({
  joinInfo,
  onLeave,
  onClassEnded,
  setNotice,
  currentUserRole,
}) => {
  const [layout, setLayout] = useState<SplitLayout>('split_equal');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('whiteboard');
  const [sdkStatus, setSdkStatus] = useState<'loading' | 'joining' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [joiningSeconds, setJoiningSeconds] = useState(0);
  const [showNativeCanvas, setShowNativeCanvas] = useState(false);
  const [usingNativeApp, setUsingNativeApp] = useState(false);

  // Open native app handler
  const handleOpenNativeApp = () => {
    setUsingNativeApp(true);
    window.open(directZoomUrl, '_blank', 'noopener,noreferrer');
  };

  // Lesson notes state (persisted to localStorage)
  const notesStorageKey = `eduashram_notes_${joinInfo.liveClass.id}`;
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem(notesStorageKey) || '';
  });

  // Doubts / live questions state
  const [doubts, setDoubts] = useState<Array<{ id: string; author: string; text: string; time: string; resolved: boolean }>>([]);
  const [newDoubtText, setNewDoubtText] = useState('');

  // Attendance state
  const [attendees, setAttendees] = useState<LiveClassAttendance[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<any>(null);
  const isJoinedRef = useRef(false);

  // Elapsed meeting timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Joining counter timer
  useEffect(() => {
    let interval: any;
    if (sdkStatus === 'joining') {
      setJoiningSeconds(0);
      interval = setInterval(() => {
        setJoiningSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sdkStatus]);

  // Save notes on edit
  useEffect(() => {
    localStorage.setItem(notesStorageKey, notes);
  }, [notes, notesStorageKey]);

  // Fetch attendees list periodically
  const fetchAttendees = async () => {
    try {
      setLoadingAttendees(true);
      const res = await fetch(`/api/live-classes?classId=${joinInfo.liveClass.id}`);
      if (res.ok) {
        const data = await res.json();
        const currentClass = data.classes?.find((c: any) => c.id === joinInfo.liveClass.id);
        if (currentClass?.attendances) {
          setAttendees(currentClass.attendances);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
    const interval = setInterval(fetchAttendees, 15000);
    return () => clearInterval(interval);
  }, [joinInfo.liveClass.id]);

  // Initialize Zoom Meeting SDK Component View
  useEffect(() => {
    let isCancelled = false;

    async function initZoomClient() {
      if (isJoinedRef.current) return;
      setSdkStatus('loading');
      setErrorMessage(null);

      try {
        // Dynamically import Zoom Meeting SDK embedded to avoid SSR / window issues
        const ZoomMtgEmbeddedModule = await import('@zoom/meetingsdk/embedded');
        const ZoomMtgEmbedded = (ZoomMtgEmbeddedModule as any).default || ZoomMtgEmbeddedModule;

        if (isCancelled || !zoomContainerRef.current) return;

        // Create or get embedded client
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        // Initialize Embedded SDK inside container
        setSdkStatus('loading');
        await client.init({
          zoomAppRoot: zoomContainerRef.current,
          language: 'en-US',
          patchJsMedia: true,
          customize: {
            meetingInfo: ['topic', 'host', 'mn', 'pwd', 'telPwd', 'invite', 'participant', 'dc', 'enctype'],
            toolbar: {
              buttons: [],
            },
          },
        });

        if (isCancelled) return;

        // Listen for connection changes BEFORE initiating join
        client.on('connection-change', (payload: any) => {
          if (payload?.state === 'Connected') {
            if (!isCancelled) {
              isJoinedRef.current = true;
              setSdkStatus('connected');
            }
          } else if (payload?.state === 'Closed' || payload?.state === 'Ended') {
            if (setNotice) setNotice('Zoom meeting has concluded.');
            if (onClassEnded) onClassEnded();
            else onLeave();
          } else if (payload?.state === 'Fail') {
            if (!isCancelled) {
              setSdkStatus('error');
              setErrorMessage(payload?.error || 'Zoom session failed to connect.');
            }
          }
        });

        setSdkStatus('joining');

        // Join meeting
        const cleanMeetingNumber = String(joinInfo.meetingNumber).replace(/[\s-]/g, '');
        const joinPayload: any = {
          meetingNumber: cleanMeetingNumber,
          password: joinInfo.passcode || '',
          passWord: joinInfo.passcode || '',
          userName: joinInfo.userName,
          signature: joinInfo.signature,
        };

        if (joinInfo.userEmail) {
          joinPayload.userEmail = joinInfo.userEmail;
        }

        // Host requires ZAK token
        if (joinInfo.role === 1 && joinInfo.zak) {
          joinPayload.zak = joinInfo.zak;
        }

        try {
          await client.join(joinPayload);
          if (!isCancelled) {
            isJoinedRef.current = true;
            setSdkStatus('connected');
          }
        } catch (joinErr: any) {
          console.warn('Zoom client.join caught notice:', joinErr);
          if (!isCancelled) {
            setSdkStatus('error');
            const errorMsg =
              joinErr?.message ||
              joinErr?.reason ||
              joinErr?.error ||
              'Unable to connect to Zoom meeting. Please ensure you have started the meeting in your Zoom desktop app, or launch directly below.';
            setErrorMessage(errorMsg);
          }
        }
      } catch (err: any) {
        console.warn('Zoom Meeting SDK Embedded connect notice:', err);
        if (!isCancelled) {
          setSdkStatus('error');
          const errorMsg =
            err?.message ||
            err?.reason ||
            'Unable to connect to Zoom Web Component View. Your browser might require WebRTC permissions or you can open the meeting directly in the Zoom app.';
          setErrorMessage(errorMsg);
        }
      }
    }

    initZoomClient();

    return () => {
      isCancelled = true;
      if (clientRef.current && isJoinedRef.current) {
        try {
          clientRef.current.leaveMeeting?.().catch(() => { });
        } catch {
          // Ignore leave meeting errors on unmount
        }
      }
    };
  }, [joinInfo]);

  // Leave meeting handler
  const handleLeave = async () => {
    const isHost = joinInfo.role === 1;
    const confirmText = isHost
      ? 'Do you want to end or leave this live class for everyone?'
      : 'Are you sure you want to leave this live class?';

    if (window.confirm(confirmText)) {
      try {
        if (clientRef.current) {
          await clientRef.current.leaveMeeting?.();
        }
      } catch {
        // Ignore
      }
      onLeave();
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyInvite = () => {
    const inviteUrl =
      joinInfo.liveClass.joinUrl ||
      `https://zoom.us/j/${joinInfo.meetingNumber}?pwd=${joinInfo.passcode}`;
    const text = `Join EduAshram Live Class: ${joinInfo.liveClass.title}\nMeeting ID: ${joinInfo.meetingNumber}\nPasscode: ${joinInfo.passcode}\nDirect Link: ${inviteUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    if (setNotice) setNotice('Live Class invite copied to clipboard!');
  };

  const handlePostDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtText.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      author: joinInfo.userName,
      text: newDoubtText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      resolved: false,
    };
    setDoubts((prev) => [newEntry, ...prev]);
    setNewDoubtText('');
  };

  const toggleDoubtResolve = (id: string) => {
    setDoubts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, resolved: !d.resolved } : d))
    );
  };

  const downloadNotes = () => {
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${joinInfo.liveClass.title.replace(/\s+/g, '_')}_ClassNotes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Determine split widths based on layout
  const getLayoutStyles = () => {
    switch (layout) {
      case 'zoom_focus':
        return { zoomWidth: '70%', workspaceWidth: '30%' };
      case 'workspace_focus':
        return { zoomWidth: '32%', workspaceWidth: '68%' };
      case 'zoom_full':
        return { zoomWidth: '100%', workspaceWidth: '0%' };
      case 'split_equal':
      default:
        return { zoomWidth: '50%', workspaceWidth: '50%' };
    }
  };

  const { zoomWidth, workspaceWidth } = getLayoutStyles();
  const directZoomUrl =
    (joinInfo.role === 1 ? joinInfo.liveClass.startUrl : joinInfo.liveClass.joinUrl) ||
    `https://zoom.us/j/${joinInfo.meetingNumber}?pwd=${joinInfo.passcode}`;

  return (
    <div className="zoom-classroom-root">
      {/* Top Navigation Bar */}
      <header className="zoom-classroom-header">
        <div className="zoom-header-left">
          <button
            className="zoom-btn-back"
            onClick={handleLeave}
            title="Leave Live Class"
          >
            <ChevronLeft size={18} />
            <span>Leave Class</span>
          </button>
          <div className="zoom-live-indicator">
            <span className="zoom-live-dot" />
            <span className="zoom-live-badge">LIVE</span>
            <span className="zoom-timer">{formatTimer(elapsedSeconds)}</span>
          </div>
          <div className="zoom-class-meta">
            <h2 className="zoom-class-title">{joinInfo.liveClass.title}</h2>
            <div className="zoom-class-tags">
              {joinInfo.liveClass.subject && (
                <span className="zoom-tag zoom-tag-subject">{joinInfo.liveClass.subject}</span>
              )}
              {joinInfo.liveClass.grade && (
                <span className="zoom-tag zoom-tag-grade">{joinInfo.liveClass.grade}</span>
              )}
              <span className="zoom-tag zoom-tag-role">
                {joinInfo.role === 1 ? '👑 Host (Teacher)' : '🎓 Student'}
              </span>
            </div>
          </div>
        </div>

        <div className="zoom-header-right">
          {/* Split Screen Layout Controls */}
          <div className="zoom-layout-controls" title="Change Screen Split">
            <button
              className={`zoom-layout-btn ${layout === 'split_equal' ? 'active' : ''}`}
              onClick={() => setLayout('split_equal')}
              title="50/50 Balanced Split"
            >
              50/50
            </button>
            <button
              className={`zoom-layout-btn ${layout === 'zoom_focus' ? 'active' : ''}`}
              onClick={() => setLayout('zoom_focus')}
              title="Zoom Focus (70% Video / 30% Board)"
            >
              Zoom 70%
            </button>
            <button
              className={`zoom-layout-btn ${layout === 'workspace_focus' ? 'active' : ''}`}
              onClick={() => setLayout('workspace_focus')}
              title="Workspace Focus (30% Video / 70% Board)"
            >
              Board 70%
            </button>
            <button
              className={`zoom-layout-btn ${layout === 'zoom_full' ? 'active' : ''}`}
              onClick={() => setLayout('zoom_full')}
              title="Full Screen Video (100%)"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Copy Meeting Invite */}
          <button
            className="zoom-btn-secondary"
            onClick={copyInvite}
            title="Copy Meeting Link & Details"
          >
            {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>

          {/* Direct Launch Fallback */}
          <button
            type="button"
            onClick={handleOpenNativeApp}
            className="zoom-btn-secondary"
            title="Open in Zoom Native Desktop/Mobile App"
          >
            <ExternalLink size={14} />
            <span>Open Zoom App</span>
          </button>

          {/* End / Leave Class Button */}
          <button
            className="zoom-btn-leave"
            onClick={handleLeave}
            title={joinInfo.role === 1 ? 'End Live Meeting' : 'Leave Classroom'}
          >
            <PhoneOff size={15} />
            <span>{joinInfo.role === 1 ? 'End Class' : 'Leave'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="zoom-classroom-body">
        {/* Left Side: Zoom Meeting SDK Embedded Container */}
        <div
          className="zoom-video-container"
          style={{
            width: zoomWidth,
            display: layout === 'workspace_focus' && zoomWidth === '0%' ? 'none' : 'flex',
          }}
        >
          {/* Floating Controls Bar when viewing native Zoom canvas */}
          {showNativeCanvas && (sdkStatus === 'loading' || sdkStatus === 'joining' || sdkStatus === 'error') && (
            <div className="zoom-floating-canvas-bar">
              <span className="zoom-floating-info">
                <Info size={14} />
                <span>Zoom Screen (Meeting ID: <strong>{joinInfo.meetingNumber}</strong>)</span>
              </span>
              <div className="zoom-floating-actions">
                <button
                  type="button"
                  className="zoom-btn-floating"
                  onClick={() => setShowNativeCanvas(false)}
                >
                  <EyeOff size={13} /> Show Connection Panel
                </button>
                <a
                  href={directZoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zoom-btn-floating zoom-btn-floating-accent"
                >
                  <ExternalLink size={13} /> Open in Zoom App
                </a>
                <button
                  type="button"
                  className="zoom-btn-floating zoom-btn-floating-danger"
                  onClick={handleLeave}
                >
                  <PhoneOff size={13} /> Leave
                </button>
              </div>
            </div>
          )}

          {/* Loading Overlay (only during initial SDK JS module load & client.init) */}
          {sdkStatus === 'loading' && (
            <div className="zoom-loading-overlay">
              <div className="zoom-loading-spinner-wrap">
                <RefreshCw className="spin" size={38} color="#0284c7" />
              </div>
              <h3>Connecting to Zoom Classroom...</h3>
              <p>Preparing audio, video and interactive stream for {joinInfo.userName}</p>
              <div className="zoom-joining-details-card" style={{ marginTop: '16px', maxWidth: '340px' }}>
                <div className="zoom-joining-row">
                  <span className="zoom-joining-label">Meeting ID:</span>
                  <span className="zoom-joining-value">{joinInfo.meetingNumber}</span>
                </div>
              </div>
            </div>
          )}

          {/* Zoom Native Desktop Companion Mode */}
          {usingNativeApp && (
            <div className="zoom-native-companion-card">
              <div className="zoom-native-pulse-header">
                <div className="zoom-native-badge">
                  <span className="zoom-pulse-dot" /> ZOOM APP ACTIVE
                </div>
                <h3>Active in Zoom Desktop App</h3>
                <p>
                  Your audio and video are running smoothly in your Zoom desktop app.
                  Use this screen for your interactive whiteboard, class notes, and student questions!
                </p>
              </div>

              <div className="zoom-joining-details-card" style={{ maxWidth: '380px' }}>
                <div className="zoom-joining-row">
                  <span className="zoom-joining-label">Meeting ID:</span>
                  <span className="zoom-joining-value">{joinInfo.meetingNumber}</span>
                  <button
                    type="button"
                    className="zoom-mini-copy-btn"
                    onClick={copyInvite}
                    title="Copy Meeting Info"
                  >
                    {copiedLink ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                </div>
                {joinInfo.passcode && (
                  <div className="zoom-joining-row">
                    <span className="zoom-joining-label">Passcode:</span>
                    <span className="zoom-joining-value">{joinInfo.passcode}</span>
                  </div>
                )}
                <div className="zoom-joining-row">
                  <span className="zoom-joining-label">Elapsed Time:</span>
                  <span className="zoom-joining-value">{formatTimer(elapsedSeconds)}</span>
                </div>
              </div>

              <div className="zoom-native-actions">
                <a
                  href={directZoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zoom-btn-primary"
                >
                  <ExternalLink size={15} /> Re-focus Zoom App
                </a>
                <button
                  type="button"
                  className="zoom-btn-secondary"
                  onClick={() => setLayout('workspace_focus')}
                  title="Expand whiteboard to 70% width"
                >
                  <PenTool size={15} /> Expand Whiteboard (70%)
                </button>
                <button
                  type="button"
                  className="zoom-btn-secondary"
                  onClick={() => setUsingNativeApp(false)}
                  title="Switch back to embedded Web view"
                >
                  <RefreshCw size={14} /> Try Web View
                </button>
              </div>

              <div className="zoom-native-tips">
                <span className="zoom-tip-title">💡 Dual-Screen Teaching Tip:</span>
                <p>
                  Place your Zoom app on one side of your monitor and keep this EduAshram whiteboard on the other side for interactive live teaching!
                </p>
              </div>
            </div>
          )}

          {/* Top Floating Status Bar during Joining (allows native Zoom canvas to remain visible) */}
          {!usingNativeApp && sdkStatus === 'joining' && (
            <div className="zoom-floating-canvas-bar">
              <span className="zoom-floating-info">
                <RefreshCw className="spin" size={14} color="#38bdf8" />
                <span>
                  {joiningSeconds > 15
                    ? `Ready in Zoom App • Meeting ID: ${joinInfo.meetingNumber}`
                    : `Connecting to Zoom (${joinInfo.meetingNumber}) • ${joiningSeconds}s`}
                </span>
              </span>
              <div className="zoom-floating-actions">
                <button
                  type="button"
                  onClick={handleOpenNativeApp}
                  className="zoom-btn-floating zoom-btn-floating-accent"
                  title="Launch in Zoom Desktop/Mobile App"
                >
                  <ExternalLink size={13} /> Open in Zoom App
                </button>
                <button
                  type="button"
                  className="zoom-btn-floating zoom-btn-floating-danger"
                  onClick={handleLeave}
                >
                  <PhoneOff size={13} /> Leave
                </button>
              </div>
            </div>
          )}

          {/* Prompt card if joining takes longer than 15s */}
          {!usingNativeApp && sdkStatus === 'joining' && joiningSeconds > 15 && (
            <div className="zoom-native-prompt-card">
              <div className="zoom-prompt-icon-wrap">
                <ExternalLink size={28} color="#0284c7" />
              </div>
              <h3>Meeting Ready in Zoom App</h3>
              <p>
                Your Zoom meeting (ID: <code>{joinInfo.meetingNumber}</code>) is active! Launch it in your Zoom desktop app for HD audio/video while teaching with the whiteboard here.
              </p>
              <div className="zoom-prompt-actions">
                <button
                  type="button"
                  className="zoom-btn-primary"
                  onClick={handleOpenNativeApp}
                >
                  <ExternalLink size={15} /> Open in Zoom Desktop App
                </button>
                <button
                  type="button"
                  className="zoom-btn-secondary"
                  onClick={() => setJoiningSeconds(0)}
                >
                  <RefreshCw size={14} /> Keep Waiting for Web View
                </button>
              </div>
            </div>
          )}

          {/* Error / Timeout Overlay */}
          {!showNativeCanvas && sdkStatus === 'error' && (
            <div className="zoom-error-overlay">
              <div className="zoom-error-icon-wrap">
                <AlertCircle size={44} color="#f43f5e" />
              </div>
              <h3>Unable to Connect Live Session</h3>
              <p className="zoom-error-desc">{errorMessage}</p>

              {/* Helpful Explanation Box */}
              <div className="zoom-error-help-box">
                <div className="zoom-help-title">
                  <ShieldAlert size={15} color="#fbbf24" />
                  <span>Common reasons for connection issues:</span>
                </div>
                <ul>
                  <li>
                    <strong>Placeholder Meeting ID:</strong> If you entered a test number like <code>78912345678</code>, that meeting does not exist on Zoom. Leave this room and schedule with your actual Zoom Personal Meeting ID.
                  </li>
                  <li>
                    <strong>Meeting Not Started:</strong> For personal Zoom IDs, the host must start the meeting in their Zoom desktop/mobile app.
                  </li>
                  <li>
                    <strong>Native App Fallback:</strong> You can join instantly using your regular Zoom client by clicking below.
                  </li>
                </ul>
              </div>

              <div className="zoom-error-actions">
                <a
                  href={directZoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zoom-btn-primary"
                >
                  <ExternalLink size={16} /> Open in Zoom App / Web
                </a>
                <button
                  type="button"
                  className="zoom-btn-secondary"
                  onClick={() => setShowNativeCanvas(true)}
                >
                  <Eye size={15} /> Inspect Zoom Canvas
                </button>
                <button
                  type="button"
                  className="zoom-btn-secondary"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw size={15} /> Retry
                </button>
                <button
                  type="button"
                  className="zoom-btn-leave-subtle"
                  onClick={handleLeave}
                >
                  <PhoneOff size={14} /> Leave Classroom
                </button>
              </div>
            </div>
          )}

          {/* The DOM element where Zoom Meeting SDK mounts its Component View */}
          <div
            id="zmmtg-root"
            ref={zoomContainerRef}
            className="zoom-embedded-mount-point"
          />
        </div>

        {/* Right Side: EduAshram Interactive Workspace */}
        {layout !== 'zoom_full' && (
          <div className="zoom-workspace-container" style={{ width: workspaceWidth }}>
            {/* Workspace Tab Bar */}
            <nav className="zoom-workspace-tabs" aria-label="Classroom Workspace">
              <button
                className={`zoom-tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('whiteboard')}
              >
                <PenTool size={15} />
                <span>Whiteboard</span>
              </button>
              <button
                className={`zoom-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <FileText size={15} />
                <span>Class Notes</span>
              </button>
              <button
                className={`zoom-tab-btn ${activeTab === 'doubts' ? 'active' : ''}`}
                onClick={() => setActiveTab('doubts')}
              >
                <HelpCircle size={15} />
                <span>Live Doubts ({doubts.filter((d) => !d.resolved).length})</span>
              </button>
              <button
                className={`zoom-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <Users size={15} />
                <span>Attendees ({attendees.length})</span>
              </button>
            </nav>

            {/* Tab 1: Interactive Whiteboard */}
            {activeTab === 'whiteboard' && (
              <div className="zoom-workspace-pane zoom-whiteboard-pane">
                <iframe
                  src="/whiteboard.html"
                  title="EduAshram Interactive Whiteboard"
                  className="zoom-whiteboard-iframe"
                />
              </div>
            )}

            {/* Tab 2: Live Lesson Notes & Scratchpad */}
            {activeTab === 'notes' && (
              <div className="zoom-workspace-pane zoom-notes-pane">
                <div className="zoom-pane-toolbar">
                  <span>Auto-saved to your browser</span>
                  <button
                    className="zoom-btn-small"
                    onClick={downloadNotes}
                    title="Download Notes as Markdown file"
                  >
                    <Download size={13} />
                    <span>Download (.md)</span>
                  </button>
                </div>
                <textarea
                  className="zoom-notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jot down notes, formulas, key concepts, and homework from today's live class..."
                />
              </div>
            )}

            {/* Tab 3: Live Doubt Box */}
            {activeTab === 'doubts' && (
              <div className="zoom-workspace-pane zoom-doubts-pane">
                <form onSubmit={handlePostDoubt} className="zoom-doubt-form">
                  <input
                    type="text"
                    value={newDoubtText}
                    onChange={(e) => setNewDoubtText(e.target.value)}
                    placeholder="Ask a question or raise a doubt..."
                    className="zoom-doubt-input"
                  />
                  <button type="submit" className="zoom-btn-primary" style={{ padding: '0 16px', height: '38px' }}>
                    Ask
                  </button>
                </form>

                <div className="zoom-doubts-list">
                  {doubts.length === 0 ? (
                    <div className="zoom-empty-doubts">
                      <HelpCircle size={32} color="#94a3b8" />
                      <p>No doubts asked yet.</p>
                      <span>Students can post questions here during the live session.</span>
                    </div>
                  ) : (
                    doubts.map((d) => (
                      <div
                        key={d.id}
                        className={`zoom-doubt-item ${d.resolved ? 'resolved' : ''}`}
                      >
                        <div className="zoom-doubt-header">
                          <span className="zoom-doubt-author">{d.author}</span>
                          <span className="zoom-doubt-time">{d.time}</span>
                        </div>
                        <p className="zoom-doubt-text">{d.text}</p>
                        {currentUserRole === 'teacher' && (
                          <button
                            className="zoom-btn-small"
                            onClick={() => toggleDoubtResolve(d.id)}
                            style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                          >
                            <Check size={12} />
                            <span>{d.resolved ? 'Reopen' : 'Mark Solved'}</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: In-Class Attendance List */}
            {activeTab === 'attendance' && (
              <div className="zoom-workspace-pane zoom-attendance-pane">
                <div className="zoom-pane-toolbar">
                  <span>
                    <strong>{attendees.length}</strong> Student
                    {attendees.length === 1 ? '' : 's'} Present
                  </span>
                  <button
                    className="zoom-btn-small"
                    onClick={fetchAttendees}
                    disabled={loadingAttendees}
                    title="Refresh attendance"
                  >
                    <RefreshCw size={13} className={loadingAttendees ? 'spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="zoom-attendance-list">
                  {attendees.length === 0 ? (
                    <div className="zoom-empty-doubts">
                      <Users size={32} color="#94a3b8" />
                      <p>No student check-ins recorded yet.</p>
                      <span>Students will appear automatically as they join the class.</span>
                    </div>
                  ) : (
                    attendees.map((att) => (
                      <div key={att.id} className="zoom-attendee-card">
                        <div className="zoom-attendee-avatar">
                          {(att.student?.name || 'S').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="zoom-attendee-info">
                          <strong>{att.student?.name || 'Student'}</strong>
                          <span>
                            {att.student?.grade ? `${att.student.grade} • ` : ''}
                            Joined at {new Date(att.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="zoom-status-active">Active</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
