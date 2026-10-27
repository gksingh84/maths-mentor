import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Radio, ChevronLeft, ChevronRight, Download, FileText, Maximize2, Minimize2, Bookmark, CheckCircle2, RefreshCw, Hand, X, Send, PenTool, Eraser } from 'lucide-react';
import jsPDF from 'jspdf';

interface StudentLiveWhiteboardProps {
  studentId?: string;
  studentName?: string;
  studentGrade?: string | null;
  teacherId?: string | null;
  setNotice?: (msg: string) => void;
}

const buildStudentIframeUrl = (src: string, isPlaying: boolean, currentTime?: number): string => {
  try {
    const url = new URL(src);
    if (url.hostname.includes('youtube-nocookie.com')) {
      url.hostname = 'www.youtube.com';
    }
    url.searchParams.set('enablejsapi', '1');
    url.searchParams.set('rel', '0');
    // Lock down video controls: students cannot pause, play, scrub, or open fullscreen on YouTube
    url.searchParams.set('controls', '0');
    url.searchParams.set('disablekb', '1');
    url.searchParams.set('fs', '0');
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('iv_load_policy', '3');
    if (url.hostname.includes('vimeo.com')) {
      url.searchParams.set('controls', '0');
      url.searchParams.set('transparent', '0');
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      url.searchParams.set('origin', window.location.origin);
    }
    if (isPlaying) {
      url.searchParams.set('autoplay', '1');
    }
    // Always start muted so browsers permit autoplay without restriction
    url.searchParams.set('mute', '1');
    // Only set start time on initial load if catching up with an in-progress video (greater than 3s)
    if (typeof currentTime === 'number' && currentTime > 3) {
      url.searchParams.set('start', String(Math.floor(currentTime)));
    }
    return url.toString();
  } catch (_) {
    return src;
  }
};

const StudentVideoPlayer: React.FC<{ widget: any; syncEvent?: any }> = ({ widget, syncEvent }) => {
  const [minimized, setMinimized] = useState(Boolean(widget.minimized));
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [isPlaying, setIsPlaying] = useState(Boolean(widget.playing));
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const studentCurrentTimeRef = useRef<number>(0);
  const lastSyncCorrectionRef = useRef<number>(0);

  // Continuously listen to YouTube postMessage to track student's playback currentTime
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      let data = e.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (_) {
          return;
        }
      }
      if (!data || typeof data !== 'object') return;
      if (data.event === 'infoDelivery' && data.info && typeof data.info.currentTime === 'number') {
        if (!data.id || data.id === widget.id) {
          studentCurrentTimeRef.current = data.info.currentTime;
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [widget.id]);

  // CRITICAL: Compute iframe src once when the widget mounts so the browser never reloads the iframe on state updates!
  const initialIframeSrc = useRef<string>('');
  if (!initialIframeSrc.current) {
    initialIframeSrc.current = buildStudentIframeUrl(
      widget.src,
      Boolean(widget.playing),
      typeof widget.currentTime === 'number' && widget.currentTime > 3 ? widget.currentTime : undefined
    );
  }

  useEffect(() => {
    if (typeof widget.minimized === 'boolean') {
      setMinimized(widget.minimized);
    }
  }, [widget.minimized]);

  useEffect(() => {
    if (typeof widget.playing === 'boolean') {
      setIsPlaying(widget.playing);
    }
  }, [widget.playing]);

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: widget.id }), '*');
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
      if (muted) {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: '' }), '*');
      }
      if (widget.playing || isPlaying) {
        if (typeof widget.currentTime === 'number' && widget.currentTime > 0.5) {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [widget.currentTime, true] }), '*');
          studentCurrentTimeRef.current = widget.currentTime;
        }
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
        iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (widget.videoType !== 'youtube' && widget.videoType !== 'vimeo') {
      const vid = videoRef.current;
      if (vid) {
        vid.muted = muted;
        vid.volume = muted ? 0 : volume;
        if (widget.playing || isPlaying) {
          if (typeof widget.currentTime === 'number' && widget.currentTime > 1 && Math.abs(vid.currentTime - widget.currentTime) > 1.5) {
            vid.currentTime = widget.currentTime;
          }
          vid.play().catch(() => {
            vid.muted = true;
            setMuted(true);
            vid.play().catch(() => {});
          });
        }
      }
    }
  }, [widget.videoType]);

  useEffect(() => {
    if (widget.videoType === 'youtube' || widget.videoType === 'vimeo') {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        try {
          if (isPlaying) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
          } else {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
          }
        } catch (_) {}
      }
    } else {
      const vid = videoRef.current;
      if (vid) {
        if (isPlaying) {
          vid.play().catch(() => {
            vid.muted = true;
            setMuted(true);
            vid.play().catch(() => {});
          });
        } else {
          vid.pause();
        }
      }
    }
  }, [isPlaying, widget.videoType]);

  useEffect(() => {
    if (!syncEvent) return;
    if (syncEvent.action === 'minimize') {
      setMinimized(true);
      return;
    }
    if (syncEvent.action === 'expand') {
      setMinimized(false);
      return;
    }
    if (syncEvent.action === 'play') {
      setIsPlaying(true);
      const targetTime = typeof syncEvent.currentTime === 'number' ? syncEvent.currentTime : undefined;
      if (widget.videoType === 'youtube' || widget.videoType === 'vimeo') {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          try {
            if (typeof targetTime === 'number' && targetTime > 0.5) {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [targetTime, true] }), '*');
              iframe.contentWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: targetTime }), '*');
              studentCurrentTimeRef.current = targetTime;
            }
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
          } catch (_) {}
        }
      } else if (videoRef.current) {
        if (typeof targetTime === 'number' && targetTime > 0.5) {
          videoRef.current.currentTime = targetTime;
        }
        videoRef.current.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
      return;
    }
    if (syncEvent.action === 'pause') {
      setIsPlaying(false);
      const targetTime = typeof syncEvent.currentTime === 'number' ? syncEvent.currentTime : undefined;
      if (widget.videoType === 'youtube' || widget.videoType === 'vimeo') {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          try {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
            if (typeof targetTime === 'number') {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [targetTime, true] }), '*');
              iframe.contentWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: targetTime }), '*');
              studentCurrentTimeRef.current = targetTime;
            }
          } catch (_) {}
        }
      } else if (videoRef.current) {
        videoRef.current.pause();
        if (typeof targetTime === 'number') {
          videoRef.current.currentTime = targetTime;
        }
      }
      return;
    }
    // Explicit seek by teacher: jump to the teacher's new position
    if (syncEvent.action === 'seek') {
      if (typeof syncEvent.currentTime === 'number') {
        if (widget.videoType === 'youtube' || widget.videoType === 'vimeo') {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            try {
              iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [syncEvent.currentTime, true] }), '*');
              iframe.contentWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: syncEvent.currentTime }), '*');
              studentCurrentTimeRef.current = syncEvent.currentTime;
            } catch (_) {}
          }
        } else if (videoRef.current) {
          videoRef.current.currentTime = syncEvent.currentTime;
        }
      }
      return;
    }
    // Periodic time sync: tight sync to reduce lag under 1.2 seconds
    if (syncEvent.action === 'time_sync') {
      const teacherTime = typeof syncEvent.currentTime === 'number' ? syncEvent.currentTime : undefined;
      if (typeof teacherTime === 'number' && teacherTime > 0.5) {
        if (widget.videoType === 'youtube' || widget.videoType === 'vimeo') {
          const studentTime = studentCurrentTimeRef.current;
          const drift = Math.abs(studentTime - teacherTime);
          const now = Date.now();
          // Correct whenever drift exceeds 1.2s and at least 2s since last seek
          if (studentTime > 0.3 && drift > 1.2 && now - lastSyncCorrectionRef.current > 2000) {
            lastSyncCorrectionRef.current = now;
            studentCurrentTimeRef.current = teacherTime;
            const iframe = iframeRef.current;
            if (iframe?.contentWindow) {
              try {
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [teacherTime, true] }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'setCurrentTime', value: teacherTime }), '*');
              } catch (_) {}
            }
          }
        } else if (videoRef.current) {
          const drift = Math.abs(videoRef.current.currentTime - teacherTime);
          if (drift > 1.2) {
            videoRef.current.currentTime = teacherTime;
          }
        }
      }
    }
  }, [syncEvent, widget.videoType]);

  useEffect(() => {
    if (widget.videoType === 'youtube' || widget.videoType === 'vimeo') {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        try {
          if (muted) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: '' }), '*');
          } else {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), '*');
          }
        } catch (_) {}
      }
    } else if (videoRef.current) {
      videoRef.current.volume = muted ? 0 : volume;
      videoRef.current.muted = muted;
    }
  }, [muted, volume, widget.videoType]);

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!nextMuted) {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = volume;
        if (isPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), '*');
        } catch (_) {}
      }
    } else {
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
        } catch (_) {}
      }
    }
  };

  return (
    <div
      className={`student-board-video-widget ${minimized ? 'is-minimized' : ''}`}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: minimized ? 'auto' : widget.h,
        zIndex: 10,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'default'
      } as React.CSSProperties}
    >
      <div
        className="video-widget-header"
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        <span
          className="video-widget-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#e2e8f0',
            fontSize: '0.74rem',
            fontWeight: 600,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'default',
            userSelect: 'none'
          }}
        >
          📹 <span>{widget.title || 'Teacher Video'}</span>
          <span style={{
            fontSize: '0.62rem',
            padding: '2px 7px',
            borderRadius: '9999px',
            background: isPlaying ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
            color: isPlaying ? '#4ade80' : '#94a3b8',
            border: isPlaying ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(148, 163, 184, 0.3)',
            marginLeft: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 700
          }}>
            {isPlaying ? '▶ Live Playing' : '⏸ Paused by Teacher'}
          </span>
        </span>
        <div className="video-widget-actions">
          {/* ONLY Mute / Unmute is allowed for students */}
          <button
            type="button"
            className={`student-video-mute-btn ${muted ? 'is-muted' : 'is-unmuted'}`}
            title={muted ? 'Click to Unmute Audio on your device' : 'Click to Mute Audio on your device'}
            onClick={handleToggleMute}
            style={{
              background: muted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
              color: muted ? '#fca5a5' : '#86efac',
              borderColor: muted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(34, 197, 94, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              borderWidth: '1px',
              borderStyle: 'solid',
              transition: 'all 0.15s ease'
            }}
          >
            {muted ? '🔇 Unmute Audio' : '🔊 Sound On (Mute)'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setVolume(val);
              if (val > 0 && muted) {
                setMuted(false);
              }
            }}
            title="Audio Volume"
            style={{ width: '45px', height: '14px', cursor: 'pointer', accentColor: '#38bdf8' }}
          />
        </div>
      </div>
      {!minimized && (
        <div
          className="video-widget-body"
          style={{ position: 'relative', overflow: 'hidden', cursor: 'default' }}
        >
          {/* Transparent shield: intercepts and prevents any click, drag, or pause attempts from students */}
          <div
            className="video-click-blocker-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: 'transparent',
              cursor: 'default',
              userSelect: 'none',
              WebkitUserDrag: 'none'
            } as React.CSSProperties}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            draggable={false}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="Video playback is controlled live by the teacher. Use Unmute/Mute button above to toggle sound."
          />

          {widget.videoType === 'youtube' || widget.videoType === 'vimeo' ? (
            <iframe
              ref={iframeRef}
              src={initialIframeSrc.current}
              title={widget.title || 'Teacher Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={false}
              tabIndex={-1}
              style={{
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
              onLoad={handleIframeLoad}
            />
          ) : (
            <video
              ref={videoRef}
              src={widget.src}
              playsInline
              controls={false}
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              tabIndex={-1}
              style={{
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

function isGradeMatch(gradeA?: string | null, gradeB?: string | null): boolean {
  if (!gradeA || !gradeB) return true;
  const a = gradeA.trim().toLowerCase();
  const b = gradeB.trim().toLowerCase();
  if (a === b || a === 'all' || b === 'all' || a === 'all grades' || b === 'all grades') return true;
  const matchA = a.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/i);
  const matchB = b.match(/(?:grade|class)?\s*[- ]?\s*(\d+)/i);
  if (matchA && matchB) return matchA[1] === matchB[1];
  return a.replace(/[-_\s]+/g, '') === b.replace(/[-_\s]+/g, '');
}

export const StudentLiveWhiteboard: React.FC<StudentLiveWhiteboardProps> = ({
  studentId,
  studentName = 'Student',
  studentGrade = 'Grade 6',
  teacherId,
  setNotice
}) => {
  const [isLive, setIsLive] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [pages, setPages] = useState<any[]>([]);
  const [teacherActivePage, setTeacherActivePage] = useState(0);
  const [viewingPageIndex, setViewingPageIndex] = useState(0);
  const [viewerCount, setViewerCount] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [followTeacher, setFollowTeacher] = useState(true);
  const [videoSyncEvents, setVideoSyncEvents] = useState<Record<string, any>>({});

  // Doubt Queue / Raise Hand state
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showRaiseHandModal, setShowRaiseHandModal] = useState(false);
  const [handNote, setHandNote] = useState('');

  // Temporary Delegation state (Pointer / Chalk)
  const [delegatedStudent, setDelegatedStudent] = useState<any>(null);
  const [laserPointer, setLaserPointer] = useState<{ x: number; y: number; studentName: string } | null>(null);
  const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Student Chalk state
  const [chalkColor, setChalkColor] = useState('#0f172a');
  const [chalkWidth, setChalkWidth] = useState(2.5);
  const [chalkMode, setChalkMode] = useState<'pen' | 'eraser'>('pen');
  const isDrawingChalkRef = useRef(false);
  const chalkStrokeRef = useRef<any>(null);

  // Live Reactions & PDF export state
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const seenReactionsRef = useRef<Set<string>>(new Set());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const followTeacherRef = useRef(followTeacher);
  useEffect(() => {
    followTeacherRef.current = followTeacher;
  }, [followTeacher]);
  const teacherScrollRef = useRef<{ scrollTop: number; scrollRatio: number }>({ scrollTop: 0, scrollRatio: 0 });

  const studentNameRef = useRef(studentName);
  studentNameRef.current = studentName;
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;

  const effectiveGrade = studentGrade || 'Grade 6';

  const checkLiveStatus = useCallback(async () => {
    try {
      const gradeParam = effectiveGrade ? encodeURIComponent(effectiveGrade) : '';
      const teacherParam = teacherId ? encodeURIComponent(teacherId) : '';
      const res = await fetch(`/api/whiteboard/live-status?grade=${gradeParam}&teacherId=${teacherParam}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data?.isLive) {
        setIsLive(true);
        if (data.teacherName) setTeacherName(data.teacherName);
        if (socketRef.current) {
          socketRef.current.emit('whiteboard:join', {
            grade: effectiveGrade,
            teacherId,
            studentName: studentNameRef.current,
            studentId: studentIdRef.current
          });
        }
      }
    } catch (_) {}
  }, [effectiveGrade, teacherId]);

  // Connect to Socket.IO and join whiteboard room
  useEffect(() => {
    void checkLiveStatus();

    const socket = io({ transports: ['websocket', 'polling'], withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('whiteboard:join', {
        grade: effectiveGrade,
        teacherId,
        studentName: studentNameRef.current,
        studentId: studentIdRef.current
      });
      void checkLiveStatus();
    });

    socket.on('whiteboard:initial_state', (data: any) => {
      if (data?.isLive) {
        setIsLive(true);
        setTeacherName(data.teacherName || 'Teacher');
        if (data.delegatedStudent) {
          setDelegatedStudent(data.delegatedStudent);
        }
        if (typeof data.isHandRaised === 'boolean') {
          setIsHandRaised(data.isHandRaised);
        }
        const initialPages = Array.isArray(data.pages) && data.pages.length ? data.pages : [{ strokes: [], shapes: [], texts: [], widgets: [] }];
        setPages(initialPages);
        const tPage = typeof data.activePageIndex === 'number' ? data.activePageIndex : 0;
        setTeacherActivePage(tPage);
        setViewingPageIndex(tPage);
        if (typeof data.scrollTop === 'number') {
          teacherScrollRef.current = {
            scrollTop: data.scrollTop,
            scrollRatio: typeof data.scrollRatio === 'number' ? data.scrollRatio : 0
          };
          setTimeout(() => {
            if (containerRef.current) {
              if (typeof data.scrollRatio === 'number' && data.scrollRatio > 0) {
                const maxScroll = Math.max(0, containerRef.current.scrollHeight - containerRef.current.clientHeight);
                containerRef.current.scrollTop = Math.round(data.scrollRatio * maxScroll);
              } else {
                containerRef.current.scrollTop = data.scrollTop;
              }
            }
          }, 150);
        }
      } else {
        setIsLive(false);
        setPages([]);
        setVideoSyncEvents({});
      }
    });

    socket.on('whiteboard:status_update', (data: any) => {
      const matchesGrade = !data.grade || data.grade === 'ALL' || isGradeMatch(data.grade, effectiveGrade);
      const matchesTeacher = !teacherId || !data.teacherId || data.teacherId === teacherId;
      if (matchesGrade || matchesTeacher) {
        if (data.isLive) {
          setIsLive(true);
          setTeacherName(data.teacherName || 'Teacher');
          socket.emit('whiteboard:join', { grade: effectiveGrade, teacherId });
        } else {
          setIsLive(false);
        }
      }
    });

    socket.on('whiteboard:broadcast_stopped', () => {
      setIsLive(false);
      setPages([]);
      setVideoSyncEvents({});
      if (setNotice) setNotice('Teacher concluded the live whiteboard session.');
    });

    socket.on('whiteboard:stroke', (data: { pageIndex: number; stroke: any }) => {
      setIsLive(true);
      setPages((prevPages) => {
        const next = [...prevPages];
        while (next.length <= data.pageIndex) {
          next.push({ strokes: [], shapes: [], texts: [], widgets: [] });
        }
        const targetPage = { ...next[data.pageIndex] };
        targetPage.strokes = [...(targetPage.strokes || []), data.stroke];
        next[data.pageIndex] = targetPage;
        return next;
      });
    });

    socket.on('whiteboard:board_type', (data: { boardType: string; pageIndex?: number }) => {
      setPages((prevPages) => {
        const next = [...prevPages];
        const targetIdx = typeof data.pageIndex === 'number' ? data.pageIndex : teacherActivePage;
        while (next.length <= targetIdx) {
          next.push({ strokes: [], shapes: [], texts: [], widgets: [], boardType: data.boardType });
        }
        if (next[targetIdx]) {
          next[targetIdx] = {
            ...next[targetIdx],
            boardType: data.boardType
          };
        }
        return next;
      });
    });

    socket.on('whiteboard:teacher_page_changed', (data: { activePageIndex: number; boardType?: string }) => {
      setTeacherActivePage(data.activePageIndex);
      setPages((prevPages) => {
        const next = [...prevPages];
        while (next.length <= data.activePageIndex) {
          next.push({ strokes: [], shapes: [], texts: [], widgets: [], boardType: data.boardType || 'white' });
        }
        if (data.boardType && next[data.activePageIndex]) {
          next[data.activePageIndex] = { ...next[data.activePageIndex], boardType: data.boardType };
        }
        return next;
      });
      if (followTeacherRef.current) {
        setViewingPageIndex(data.activePageIndex);
      }
    });

    socket.on('whiteboard:clear_page', (data: { pageIndex: number }) => {
      setPages((prevPages) => {
        const next = [...prevPages];
        if (next[data.pageIndex]) {
          next[data.pageIndex] = {
            ...next[data.pageIndex],
            strokes: [],
            shapes: (next[data.pageIndex].shapes || []).filter((s: any) => s.isPDFPage || s.isPPTPage),
            texts: [],
            widgets: (next[data.pageIndex].widgets || []).filter((w: any) => w.type === 'clock' || w.type === 'timer' || w.type === 'stopwatch')
          };
        }
        return next;
      });
    });

    socket.on('whiteboard:grid', (data: { pageIndex: number; gridVisible: boolean }) => {
      setPages((prevPages) => {
        const next = [...prevPages];
        if (next[data.pageIndex]) {
          next[data.pageIndex] = { ...next[data.pageIndex], gridVisible: data.gridVisible };
        }
        return next;
      });
    });

    socket.on('whiteboard:graph', (data: { pageIndex: number; graphVisible: boolean }) => {
      setPages((prevPages) => {
        const next = [...prevPages];
        if (next[data.pageIndex]) {
          next[data.pageIndex] = { ...next[data.pageIndex], graphVisible: data.graphVisible };
        }
        return next;
      });
    });

    socket.on('whiteboard:full_sync', (data: { pages: any[]; activePageIndex: number }) => {
      setIsLive(true);
      if (Array.isArray(data.pages) && data.pages.length) {
        setPages(data.pages);
        if (typeof data.activePageIndex === 'number') {
          setTeacherActivePage(data.activePageIndex);
          if (followTeacherRef.current) {
            setViewingPageIndex(data.activePageIndex);
          }
        }
      }
    });

    socket.on('whiteboard:page_update', (data: { pageIndex: number; page: any }) => {
      setIsLive(true);
      if (typeof data?.pageIndex === 'number' && data?.page) {
        setPages((prevPages) => {
          const next = [...prevPages];
          while (next.length <= data.pageIndex) {
            next.push({ strokes: [], shapes: [], texts: [], widgets: [] });
          }
          next[data.pageIndex] = data.page;
          return next;
        });
      }
    });

    socket.on('whiteboard:scroll', (data: { pageIndex: number; scrollTop: number; scrollRatio?: number; zoom?: number }) => {
      teacherScrollRef.current = {
        scrollTop: data.scrollTop,
        scrollRatio: typeof data.scrollRatio === 'number' ? data.scrollRatio : 0
      };
      if (followTeacherRef.current) {
        const container = containerRef.current;
        if (!container) return;
        if (typeof data.scrollRatio === 'number' && data.scrollRatio > 0) {
          const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
          const target = Math.round(data.scrollRatio * maxScroll);
          container.scrollTo({ top: target, behavior: 'smooth' });
        } else if (typeof data.scrollTop === 'number') {
          container.scrollTo({ top: data.scrollTop, behavior: 'smooth' });
        }
      }
    });

    socket.on('whiteboard:page_height', (data: { pageIndex: number; height: number }) => {
      setPages((prevPages) => {
        const next = [...prevPages];
        if (next[data.pageIndex]) {
          next[data.pageIndex] = { ...next[data.pageIndex], height: data.height };
        }
        return next;
      });
    });

    socket.on('whiteboard:viewer_count', (data: { count: number }) => {
      if (typeof data?.count === 'number') {
        setViewerCount(data.count);
      }
    });

    socket.on('whiteboard:video_action', (data: { pageIndex: number; action: string; widgetId?: string; widget?: any; currentTime?: number; playing?: boolean; [key: string]: any }) => {
      const widgetId = data.widgetId || data.widget?.id;
      if (widgetId) {
        if (data.action === 'remove') {
          setVideoSyncEvents((prev) => {
            const copy = { ...prev };
            delete copy[widgetId];
            return copy;
          });
        } else {
          setVideoSyncEvents((prev) => ({ ...prev, [widgetId]: { ...data, widgetId } }));
        }
      }
      if (data.action === 'remove' && widgetId) {
        setPages((prevPages) =>
          prevPages.map((pg) => ({
            ...pg,
            widgets: Array.isArray(pg.widgets) ? pg.widgets.filter((w: any) => w.id !== widgetId) : []
          }))
        );
      } else if (data.action === 'play' || data.action === 'pause' || data.action === 'seek') {
        const isPlay = data.action === 'play';
        const isPause = data.action === 'pause';
        setPages((prevPages) =>
          prevPages.map((pg) => ({
            ...pg,
            widgets: Array.isArray(pg.widgets)
              ? pg.widgets.map((w: any) =>
                  w.id === widgetId
                    ? {
                        ...w,
                        ...(isPlay ? { playing: true } : isPause ? { playing: false } : {}),
                        currentTime: typeof data.currentTime === 'number' && data.currentTime > 0 ? data.currentTime : w.currentTime
                      }
                    : w
                )
              : []
          }))
        );
      } else if (typeof data.pageIndex === 'number') {
        setPages((prevPages) => {
          const next = [...prevPages];
          while (next.length <= data.pageIndex) {
            next.push({ strokes: [], shapes: [], texts: [], widgets: [] });
          }
          const targetPage = { ...next[data.pageIndex] };
          const widgets = Array.isArray(targetPage.widgets) ? [...targetPage.widgets] : [];
          if (data.action === 'add' && data.widget) {
            const idx = widgets.findIndex((w: any) => w.id === (widgetId || data.widget.id));
            if (idx >= 0) {
              widgets[idx] = data.widget;
            } else {
              widgets.push(data.widget);
            }
          } else if ((data.action === 'move' || data.action === 'resize') && widgetId) {
            const idx = widgets.findIndex((w: any) => w.id === widgetId);
            if (idx >= 0) {
              widgets[idx] = {
                ...widgets[idx],
                ...(typeof data.x === 'number' ? { x: data.x } : {}),
                ...(typeof data.y === 'number' ? { y: data.y } : {}),
                ...(typeof data.w === 'number' ? { w: data.w } : {}),
                ...(typeof data.h === 'number' ? { h: data.h } : {})
              };
            }
          }
          targetPage.widgets = widgets;
          next[data.pageIndex] = targetPage;
          return next;
        });
      }
    });

    socket.on('whiteboard:hand_state', (data: { isHandRaised: boolean }) => {
      setIsHandRaised(Boolean(data?.isHandRaised));
    });

    socket.on('whiteboard:doubt_dismissed', () => {
      setIsHandRaised(false);
      if (setNotice) setNotice('Teacher marked your question as addressed.');
    });

    socket.on('whiteboard:delegation_changed', (data: { delegatedStudent: any }) => {
      setDelegatedStudent(data?.delegatedStudent || null);
    });

    socket.on('whiteboard:laser_pointer', (data: { x: number; y: number; studentName: string; active: boolean }) => {
      if (data?.active) {
        setLaserPointer({ x: data.x, y: data.y, studentName: data.studentName });
        if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
        laserTimeoutRef.current = setTimeout(() => {
          setLaserPointer(null);
        }, 2500);
      } else {
        setLaserPointer(null);
      }
    });

    socket.on('whiteboard:reaction_event', (data: { id?: string; emoji?: string; studentName?: string; senderSocketId?: string }) => {
      if (data?.senderSocketId && socketRef.current && data.senderSocketId === socketRef.current.id) {
        return;
      }
      if (data?.id && seenReactionsRef.current.has(data.id)) {
        return;
      }
      if (data?.id) {
        seenReactionsRef.current.add(data.id);
        if (seenReactionsRef.current.size > 200) {
          const first = seenReactionsRef.current.values().next().value;
          if (first) seenReactionsRef.current.delete(first);
        }
      }
      const emoji = (data?.emoji && data.emoji !== 'undefined') ? data.emoji : '👍';
      const newReaction = {
        id: data?.id || `${Date.now()}-${Math.random()}`,
        emoji,
        x: 20 + Math.random() * 60
      };
      setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2400);
    });

    return () => {
      socket.emit('whiteboard:leave', { grade: effectiveGrade });
      socket.disconnect();
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
    };
  }, [effectiveGrade, teacherId]);

  // Image caching helper
  const getCachedImage = (dataUrl: string): HTMLImageElement => {
    if (!imageCacheRef.current.has(dataUrl)) {
      const img = new Image();
      if (!dataUrl.startsWith('data:') && !dataUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = dataUrl;
      img.onload = () => {
        // Trigger repaint when image loads
        drawCurrentPage();
      };
      imageCacheRef.current.set(dataUrl, img);
    }
    return imageCacheRef.current.get(dataUrl)!;
  };

  // Helper to render whiteboard page content (used by both live canvas and PDF export)
  const renderWhiteboardPage = (
    ctx: CanvasRenderingContext2D,
    page: any,
    displayWidth: number,
    displayHeight: number,
    options?: { isExport?: boolean; pageNum?: number; totalPages?: number; watermarkTitle?: string }
  ) => {
    if (!page) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      return;
    }

    // Board background color
    let bgColor = '#ffffff';
    if (page?.boardType === 'black') bgColor = '#020617';
    else if (page?.boardType === 'green') bgColor = '#064e3b';
    else if (page?.boardType === 'ruled') bgColor = '#fefdf6';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Background patterns: Graph > Grid > Ruled (mutually exclusive)
    if (page?.graphVisible) {
      const cx = displayWidth / 2;
      const cy = displayHeight / 2;
      const minorStep = 20;
      const majorStep = 100;
      ctx.save();
      const isDarkGraph = page.boardType === 'black' || page.boardType === 'green';
      // Minor grid
      ctx.strokeStyle = isDarkGraph ? 'rgba(255, 255, 255, 0.12)' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 0.5;
      for (let x = cx; x < displayWidth; x += minorStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayHeight); ctx.stroke();
      }
      for (let x = cx - minorStep; x >= 0; x -= minorStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayHeight); ctx.stroke();
      }
      for (let y = cy; y < displayHeight; y += minorStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(displayWidth, y); ctx.stroke();
      }
      for (let y = cy - minorStep; y >= 0; y -= minorStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(displayWidth, y); ctx.stroke();
      }
      // Major grid
      ctx.strokeStyle = isDarkGraph ? 'rgba(255, 255, 255, 0.3)' : 'rgba(148, 163, 184, 0.8)';
      ctx.lineWidth = 0.9;
      for (let x = cx; x < displayWidth; x += majorStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayHeight); ctx.stroke();
      }
      for (let x = cx - majorStep; x >= 0; x -= majorStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayHeight); ctx.stroke();
      }
      for (let y = cy; y < displayHeight; y += majorStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(displayWidth, y); ctx.stroke();
      }
      for (let y = cy - majorStep; y >= 0; y -= majorStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(displayWidth, y); ctx.stroke();
      }
      // Main axes
      ctx.strokeStyle = isDarkGraph ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(displayWidth, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, displayHeight); ctx.stroke();
      ctx.restore();
    } else if (page?.gridVisible) {
      // 1cm x 1cm Math Grid background (only when graph is not active)
      ctx.save();
      const isDarkGrid = page.boardType === 'black' || page.boardType === 'green';
      ctx.strokeStyle = isDarkGrid ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 0.7;
      const PX_PER_CM = 96 / 2.54; // 1cm standard screen measurement
      for (let x = 0; x <= displayWidth; x += PX_PER_CM) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= displayHeight; y += PX_PER_CM) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (page?.boardType === 'ruled') {
      // Ruled notebook lines (only when grid or graph is not active)
      ctx.save();
      ctx.strokeStyle = 'rgba(14, 116, 144, 0.16)';
      ctx.lineWidth = 0.8;
      const step = 35;
      for (let y = step * 1.5; y <= displayHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(90, 0);
      ctx.lineTo(90, displayHeight);
      ctx.stroke();
      ctx.restore();
    }

    if (!page) return;

    // Draw background image if present (PDF, PPT slide, or imported image)
    if (page.background && page.background.dataUrl) {
      const bgImg = getCachedImage(page.background.dataUrl);
      if (bgImg && bgImg.complete) {
        ctx.drawImage(bgImg, page.background.x || 0, page.background.y || 0, page.background.w || displayWidth, page.background.h || displayHeight);
      }
    }

    const isDark = page.boardType === 'black' || page.boardType === 'green';

    const getContrastColor = (color?: string, fallbackDark = '#ffffff', fallbackLight = '#0f172a') => {
      if (!color) return isDark ? fallbackDark : fallbackLight;
      const c = String(color).toLowerCase().trim();
      if (isDark && (c === '#000000' || c === '#0f172a' || c === '#1e293b' || c === '#020617' || c === 'rgb(0, 0, 0)' || c === 'rgb(15, 23, 42)')) {
        return fallbackDark;
      }
      if (!isDark && (c === '#ffffff' || c === '#fff' || c === 'rgb(255, 255, 255)')) {
        return fallbackLight;
      }
      return color;
    };

    // Helper to render any whiteboard shape or chart
    const renderShape = (sh: any) => {
      const { start, end } = sh;
      if (!start || !end) return;

      const x1 = Math.min(start.x, end.x);
      const y1 = Math.min(start.y, end.y);
      const x2 = Math.max(start.x, end.x);
      const y2 = Math.max(start.y, end.y);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const w = Math.max(1, x2 - x1);
      const h = Math.max(1, y2 - y1);
      const r = Math.min(w, h) / 2;

      const type = sh.type;
      const strokeColor = getContrastColor(sh.color, '#ffffff', '#0284c7');
      const lineWidth = sh.width || 2;
      const isSolid = sh.fillMode === 'solid';
      const fillOpacity = sh.fillOpacity ?? 1;

      if (type === 'group' && sh.children) {
        (sh.children.shapes || []).forEach((cSh: any) => renderShape(cSh));
        (sh.children.texts || []).forEach((cTxt: any) => renderTextItem(cTxt));
        return;
      }

      if (type === 'image' && sh.dataUrl) {
        const img = getCachedImage(sh.dataUrl);
        if (img && img.complete) {
          ctx.drawImage(img, x1, y1, w, h);
        }
        return;
      }

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (type === 'line' || type === 'ray' || type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const headLength = 10 + lineWidth * 1.5;

        if (type === 'ray' || type === 'arrow') {
          const hxEnd = end.x - ux * headLength;
          const hyEnd = end.y - uy * headLength;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(hxEnd - uy * (headLength / 2), hyEnd + ux * (headLength / 2));
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(hxEnd + uy * (headLength / 2), hyEnd - ux * (headLength / 2));
          ctx.stroke();
        }
        if (type === 'arrow') {
          const hxStart = start.x + ux * headLength;
          const hyStart = start.y + uy * headLength;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(hxStart - uy * (headLength / 2), hyStart + ux * (headLength / 2));
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(hxStart + uy * (headLength / 2), hyStart - ux * (headLength / 2));
          ctx.stroke();
        }
      } else if (type === 'rectangle' || type === 'rect') {
        if (isSolid) {
          ctx.save();
          ctx.fillStyle = strokeColor;
          ctx.globalAlpha = fillOpacity;
          ctx.fillRect(x1, y1, w, h);
          ctx.restore();
        }
        ctx.strokeRect(x1, y1, w, h);
      } else if (type === 'circle') {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const rad = Math.sqrt(dx * dx + dy * dy) || r;
        ctx.beginPath();
        ctx.arc(start.x, start.y, rad, 0, Math.PI * 2);
        if (isSolid) {
          ctx.save();
          ctx.fillStyle = strokeColor;
          ctx.globalAlpha = fillOpacity;
          ctx.fill();
          ctx.restore();
        }
        ctx.stroke();
      } else if (type === 'triangle') {
        const midX = (x1 + x2) / 2;
        ctx.beginPath();
        ctx.moveTo(midX, y1);
        ctx.lineTo(x1, y2);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        if (isSolid) { ctx.save(); ctx.fillStyle = strokeColor; ctx.globalAlpha = fillOpacity; ctx.fill(); ctx.restore(); }
        ctx.stroke();
      } else if (type === 'rhombus' || type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(cx, y1);
        ctx.lineTo(x2, cy);
        ctx.lineTo(cx, y2);
        ctx.lineTo(x1, cy);
        ctx.closePath();
        if (isSolid) { ctx.save(); ctx.fillStyle = strokeColor; ctx.globalAlpha = fillOpacity; ctx.fill(); ctx.restore(); }
        ctx.stroke();
      } else if (type === 'parallelogram') {
        const skew = w * 0.25;
        ctx.beginPath();
        ctx.moveTo(x1 + skew, y1);
        ctx.lineTo(x2 + skew, y1);
        ctx.lineTo(x2 - skew, y2);
        ctx.lineTo(x1 - skew, y2);
        ctx.closePath();
        if (isSolid) { ctx.save(); ctx.fillStyle = strokeColor; ctx.globalAlpha = fillOpacity; ctx.fill(); ctx.restore(); }
        ctx.stroke();
      } else if (type === 'trapezium' || type === 'trapezoid') {
        const inset = w * 0.2;
        ctx.beginPath();
        ctx.moveTo(x1 + inset, y1);
        ctx.lineTo(x2 - inset, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.closePath();
        if (isSolid) { ctx.save(); ctx.fillStyle = strokeColor; ctx.globalAlpha = fillOpacity; ctx.fill(); ctx.restore(); }
        ctx.stroke();
      } else if (type === 'pentagon') {
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const angle = -Math.PI / 2 + (2 * Math.PI * k) / 5;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (isSolid) { ctx.save(); ctx.fillStyle = strokeColor; ctx.globalAlpha = fillOpacity; ctx.fill(); ctx.restore(); }
        ctx.stroke();
      } else if (type === 'hexagon') {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const angle = (Math.PI / 2) - (2 * Math.PI * k) / 6;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (isSolid) { ctx.save(); ctx.fillStyle = strokeColor; ctx.globalAlpha = fillOpacity; ctx.fill(); ctx.restore(); }
        ctx.stroke();
      } else if (type === 'star') {
        const innerR = r * 0.4;
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const angle = -Math.PI / 2 + (Math.PI * k) / 5;
          const rad = k % 2 === 0 ? r : innerR;
          const px = cx + rad * Math.cos(angle);
          const py = cy + rad * Math.sin(angle);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (isSolid) { ctx.save(); ctx.fillStyle = strokeColor; ctx.globalAlpha = fillOpacity; ctx.fill(); ctx.restore(); }
        ctx.stroke();
      } else if (type === 'cube' || type === 'cuboid') {
        const depth = Math.min(w, h) * 0.35;
        const dx = depth;
        const dy = -depth * 0.6;
        ctx.strokeRect(x1, y1, w, h);
        ctx.beginPath();
        ctx.moveTo(x1 + dx, y1 + dy);
        ctx.lineTo(x2 + dx, y1 + dy);
        ctx.lineTo(x2 + dx, y2 + dy);
        ctx.lineTo(x1 + dx, y2 + dy);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x1 + dx, y1 + dy);
        ctx.moveTo(x2, y1); ctx.lineTo(x2 + dx, y1 + dy);
        ctx.moveTo(x2, y2); ctx.lineTo(x2 + dx, y2 + dy);
        ctx.moveTo(x1, y2); ctx.lineTo(x1 + dx, y2 + dy);
        ctx.stroke();
      } else if (type === 'cylinder') {
        const rx = w / 2;
        const ry = Math.max(4, h * 0.15);
        const topY = y1 + ry;
        const bottomY = y2 - ry;
        ctx.beginPath();
        ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x1, topY); ctx.lineTo(x1, bottomY);
        ctx.moveTo(x2, topY); ctx.lineTo(x2, bottomY);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, bottomY, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'cone') {
        const rx = w / 2;
        const ry = Math.max(4, w * 0.25);
        ctx.beginPath();
        ctx.moveTo(cx, y1); ctx.lineTo(x1, y2);
        ctx.moveTo(cx, y1); ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, y2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'sphere') {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (type === 'barChart') {
        const data = Array.isArray(sh.data) && sh.data.length ? sh.data : [40, 65, 50, 80, 55];
        const padL = 36, padR = 16, padT = 20, padB = 30;
        const chartW = Math.max(20, w - padL - padR);
        const chartH = Math.max(20, h - padT - padB);
        const maxVal = Math.max(...data, 1);
        const n = data.length;
        const barW = Math.max(8, (chartW / n) * 0.6);
        const gap = (chartW - n * barW) / (n + 1);
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(x1 + padL, y1 + padT, chartW, chartH);
        const barColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#7c3aed'];
        for (let i = 0; i < n; i++) {
          const barH = (data[i] / maxVal) * chartH;
          const bx = x1 + padL + gap + i * (barW + gap);
          const by = y1 + padT + chartH - barH;
          ctx.fillStyle = barColors[i % barColors.length];
          ctx.fillRect(bx, by, barW, barH);
          ctx.strokeStyle = '#1e293b';
          ctx.strokeRect(bx, by, barW, barH);
        }
      } else if (type === 'pieChart') {
        const data = Array.isArray(sh.data) && sh.data.length ? sh.data : [30, 25, 20, 15, 10];
        const total = data.reduce((s: number, v: number) => s + v, 0) || 1;
        const rad = Math.min(w, h) / 2 - 10;
        if (rad > 0) {
          const sliceColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#7c3aed'];
          let startA = -Math.PI / 2;
          for (let i = 0; i < data.length; i++) {
            const sweep = (data[i] / total) * Math.PI * 2;
            const endA = startA + sweep;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, rad, startA, endA);
            ctx.closePath();
            ctx.fillStyle = sliceColors[i % sliceColors.length];
            ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.stroke();
            startA = endA;
          }
        }
      } else if (type === 'horizontalBarChart') {
        const data = Array.isArray(sh.data) && sh.data.length ? sh.data : [40, 65, 50, 80, 55];
        const padL = 25, padR = 20, padT = 25, padB = 35;
        const chartW = Math.max(20, w - padL - padR);
        const chartH = Math.max(20, h - padT - padB);
        const maxVal = Math.max(...data, 1);
        const n = data.length;
        const barH = Math.max(6, (chartH / n) * 0.6);
        const gap = (chartH - n * barH) / (n + 1);
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(x1 + padL, y1 + padT, chartW, chartH);
        const barColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#7c3aed'];
        for (let i = 0; i < n; i++) {
          const bW = (data[i] / maxVal) * chartW;
          const bx = x1 + padL;
          const by = y1 + padT + gap + i * (barH + gap);
          ctx.fillStyle = barColors[i % barColors.length];
          ctx.fillRect(bx, by, bW, barH);
          ctx.strokeStyle = '#1e293b';
          ctx.strokeRect(bx, by, bW, barH);
        }
      } else if (type === 'pictograph') {
        const data = Array.isArray(sh.data) && sh.data.length ? sh.data : [3, 5, 2, 4, 3];
        const padL = 25, padR = 15, padT = 15, padB = 20;
        const chartW = Math.max(20, w - padL - padR);
        const chartH = Math.max(20, h - padT - padB);
        const n = data.length;
        const rowH = chartH / n;
        const maxCount = Math.max(...data, 1);
        const symbolColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#7c3aed'];
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(x1 + padL, y1 + padT, chartW, chartH);
        for (let i = 0; i < n; i++) {
          const count = data[i];
          const cellW = (chartW - 8) / Math.max(maxCount, count);
          const symSize = Math.min(cellW * 0.75, rowH * 0.5, 24);
          const sy = y1 + padT + (i + 0.5) * rowH;
          ctx.fillStyle = symbolColors[i % symbolColors.length];
          for (let j = 0; j < count; j++) {
            const sx = x1 + padL + 4 + j * cellW + (cellW - symSize) / 2;
            const cxS = sx + symSize / 2;
            ctx.beginPath();
            ctx.arc(cxS, sy, symSize / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    };

    // Helper to render text and sticky notes
    const renderTextItem = (txt: any) => {
      if (!txt || txt.text == null || txt.text === '') return;
      ctx.save();
      const fs = txt.fontSize || 20;
      const fontStr = `${txt.bold ? 'bold ' : ''}${txt.italic ? 'italic ' : ''}${fs}px ${txt.fontFamily || "'Plus Jakarta Sans', Arial, sans-serif"}`;
      ctx.font = fontStr;

      if (txt.sticky) {
        const pad = 12;
        const lines = String(txt.text).split('\n');
        let maxLineW = 100;
        lines.forEach((l) => {
          const mw = ctx.measureText(l).width;
          if (mw > maxLineW) maxLineW = mw;
        });
        const stickW = Math.max(120, maxLineW + pad * 2);
        const stickH = Math.max(80, lines.length * (fs * 1.3) + pad * 2);
        const x = txt.x || 0;
        const y = txt.y || 0;
        const fold = 16;

        ctx.save();
        ctx.fillStyle = txt.stickyColor || '#fef08a';
        ctx.globalAlpha = txt.stickyOpacity ?? 0.95;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, stickW, stickH, 6);
        else ctx.rect(x, y, stickW, stickH);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.moveTo(x + stickW - fold, y);
        ctx.lineTo(x + stickW, y);
        ctx.lineTo(x + stickW, y + fold);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.textBaseline = 'top';
        lines.forEach((line, idx) => {
          ctx.fillText(line, x + pad, y + pad + idx * (fs * 1.3));
        });
      } else {
        const textColor = getContrastColor(txt.color, '#ffffff', '#0f172a');
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'top';
        const lines = String(txt.text).split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, txt.x || 0, (txt.y || 0) + idx * (fs * 1.25));
        });
      }
      ctx.restore();
    };

    // 1. Draw shapes & charts
    if (page.shapes && Array.isArray(page.shapes)) {
      page.shapes.forEach((sh: any) => renderShape(sh));
    }

    // 2. Draw texts & sticky notes
    if (page.texts && Array.isArray(page.texts)) {
      page.texts.forEach((txt: any) => renderTextItem(txt));
    }

    // 3. Draw widgets (Clock, Timer, Stopwatch, Poll)
    if (page.widgets && Array.isArray(page.widgets)) {
      page.widgets.forEach((widget: any) => {
        if (widget.type === 'poll') {
          const fs = Math.max(14, widget.fontSize || 18);
          const lineH = fs * 1.3;
          let wy = widget.y || 60;
          const wx = widget.x || 60;
          ctx.save();
          ctx.fillStyle = getContrastColor(widget.color, '#ffffff', '#0f172a');
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          ctx.font = `bold ${fs}px Arial`;
          ctx.fillText(`📊 ${widget.question || 'Poll'}`, wx, wy);
          wy += lineH;
          ctx.font = `${fs}px Arial`;
          (widget.options || []).forEach((opt: any) => {
            const label = opt.text || 'Option';
            const votes = opt.votes ?? 0;
            ctx.fillText(`• ${label}: ${votes} vote(s)`, wx + 10, wy);
            wy += lineH;
          });
          ctx.restore();
        } else {
          let text = '';
          const now = Date.now();
          if (widget.type === 'clock') {
            const d = new Date();
            text = [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
          } else if (widget.type === 'timer') {
            const end = widget.endTime || 0;
            const left = Math.max(0, Math.ceil((end - now) / 1000));
            const m = Math.floor(left / 60);
            const s = left % 60;
            text = `⏳ ${m}:${String(s).padStart(2, '0')}`;
          } else if (widget.type === 'stopwatch') {
            let elapsed = widget.elapsedMs || 0;
            if (widget.running && !widget.ended) elapsed += now - (widget.startTime || now);
            const m = Math.floor(elapsed / 60000);
            const s = Math.floor((elapsed % 60000) / 1000);
            text = `⏱️ ${m}:${String(s).padStart(2, '0')}`;
          }
          if (text) {
            const fs = Math.max(16, widget.fontSize || 28);
            ctx.save();
            ctx.font = `bold ${fs}px Arial`;
            ctx.fillStyle = getContrastColor(widget.color, '#38bdf8', '#0284c7');
            ctx.textBaseline = 'middle';
            ctx.fillText(text, widget.x || 60, widget.y || 60);
            ctx.restore();
          }
        }
      });
    }

    // 4. Draw handwritten strokes
    if (page.strokes && Array.isArray(page.strokes)) {
      page.strokes.forEach((stroke: any) => {
        const pts = stroke.points;
        if (!pts || !pts.length) return;
        ctx.save();
        const strokeColor = getContrastColor(stroke.color, '#ffffff', '#0f172a');
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = stroke.width || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, (stroke.width || 2) / 2, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    // Watermark, Header, & Footer (when exporting class notes as PDF)
    if (options?.isExport) {
      ctx.save();
      // Center diagonal watermark
      ctx.translate(displayWidth / 2, displayHeight / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.font = 'bold 44px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`EduAshram Live Classroom • ${effectiveGrade}`, 0, 0);
      ctx.restore();

      // Header Banner
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, displayWidth, 38);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(
        `📚 EduAshram Class Notes • ${effectiveGrade} • Teacher: ${teacherName} • ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        18,
        19
      );
      ctx.textAlign = 'right';
      ctx.fillText(`Page ${options.pageNum} of ${options.totalPages}`, displayWidth - 18, 19);
      ctx.restore();

      // Footer Banner
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.55)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `EduAshram Digital Teaching System • Notes for ${studentName} • ${new Date().toLocaleDateString('en-GB')}`,
        displayWidth / 2,
        displayHeight - 12
      );
      ctx.restore();
    }
  };

  // Render current viewing page on canvas
  const drawCurrentPage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const page = pages[viewingPageIndex];
    const container = containerRef.current || (canvas.closest('.student-whiteboard-canvas-wrap') as HTMLElement | null);
    const displayWidth = container ? Math.max(container.clientWidth - 24, 1000) : 1000;

    let computedHeight = (page && typeof page.height === 'number' && page.height > 0)
      ? page.height
      : (page?.infiniteScroll !== false ? 2400 : (container ? container.clientHeight : 800));

    if (page?.strokes) {
      for (const st of page.strokes) {
        if (st.points) {
          for (const pt of st.points) {
            if (pt.y + 120 > computedHeight) computedHeight = Math.ceil(pt.y + 120);
          }
        }
      }
    }
    if (page?.shapes) {
      for (const sh of page.shapes) {
        const bottom = Math.max(sh.startY || 0, sh.endY || 0, (sh.y || 0) + (sh.height || 0));
        if (bottom + 120 > computedHeight) computedHeight = Math.ceil(bottom + 120);
      }
    }
    if (page?.texts) {
      for (const tx of page.texts) {
        if ((tx.y || 0) + 120 > computedHeight) computedHeight = Math.ceil((tx.y || 0) + 120);
      }
    }

    const displayHeight = Math.max(computedHeight, container ? container.clientHeight : 720);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderWhiteboardPage(ctx, page, displayWidth, displayHeight);

    // Laser pointer (if active)
    if (laserPointer) {
      ctx.save();
      const lx = laserPointer.x;
      const ly = laserPointer.y;
      const grad = ctx.createRadialGradient(lx, ly, 2, lx, ly, 18);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
      grad.addColorStop(0.35, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 12px sans-serif';
      const label = `🎯 ${laserPointer.studentName || 'Student'}`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      if (ctx.roundRect) ctx.roundRect(lx + 10, ly - 10, tw + 14, 22, 6);
      else ctx.rect(lx + 10, ly - 10, tw + 14, 22);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + 17, ly + 1);
      ctx.restore();
    }
  };

  useEffect(() => {
    drawCurrentPage();
  }, [pages, viewingPageIndex, isLive, laserPointer]);

  // Window resize observer for canvas auto-scaling
  useEffect(() => {
    const handleResize = () => drawCurrentPage();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pages, viewingPageIndex]);

  // Delegation helpers & Pointer Event Handlers
  const lastPointerEmitRef = useRef<number>(0);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
    const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    return { x, y };
  };

  const isMeDelegated = Boolean(
    delegatedStudent &&
      (delegatedStudent.socketId === socketRef.current?.id ||
        (delegatedStudent.studentId && studentId && delegatedStudent.studentId === studentId) ||
        (delegatedStudent.studentName &&
          delegatedStudent.studentName.trim().toLowerCase() === (studentName || '').trim().toLowerCase()))
  );
  const currentPermission = isMeDelegated ? delegatedStudent.permission : null;

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isLive || !currentPermission) return;

    const { x, y } = getCanvasCoords(e);

    // Laser pointer delegation
    if (currentPermission === 'pointer') {
      setLaserPointer({ x, y, studentName: studentName || 'You' });
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
      laserTimeoutRef.current = setTimeout(() => {
        setLaserPointer(null);
      }, 2500);

      const now = Date.now();
      if (now - lastPointerEmitRef.current > 35) {
        lastPointerEmitRef.current = now;
        socketRef.current?.emit('whiteboard:student_pointer', {
          grade: effectiveGrade,
          teacherId,
          x,
          y,
          studentName: studentName || 'Student',
          active: true
        });
      }
      return;
    }

    // Chalk delegation
    if (currentPermission === 'chalk' && isDrawingChalkRef.current && chalkStrokeRef.current) {
      chalkStrokeRef.current.points.push({ x, y });
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.strokeStyle = chalkStrokeRef.current.color;
        ctx.lineWidth = chalkStrokeRef.current.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const pts = chalkStrokeRef.current.points;
        if (pts.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isLive || !currentPermission) return;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    const { x, y } = getCanvasCoords(e);

    if (currentPermission === 'pointer') {
      setLaserPointer({ x, y, studentName: studentName || 'You' });
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
      laserTimeoutRef.current = setTimeout(() => {
        setLaserPointer(null);
      }, 2500);

      socketRef.current?.emit('whiteboard:student_pointer', {
        grade: effectiveGrade,
        teacherId,
        x,
        y,
        studentName: studentName || 'Student',
        active: true
      });
      return;
    }

    if (currentPermission === 'chalk') {
      isDrawingChalkRef.current = true;
      const page = pages[viewingPageIndex];
      const isDark = page?.boardType === 'black' || page?.boardType === 'green';
      const strokeColor =
        chalkMode === 'eraser'
          ? (page?.boardType === 'black' ? '#020617' : page?.boardType === 'green' ? '#064e3b' : '#ffffff')
          : (isDark && chalkColor === '#0f172a' ? '#ffffff' : chalkColor);
      const strokeWidth = chalkMode === 'eraser' ? 24 : chalkWidth;

      chalkStrokeRef.current = {
        color: strokeColor,
        width: strokeWidth,
        mode: chalkMode,
        points: [{ x, y }]
      };

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  const handleCanvasPointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    if (!isLive || !currentPermission) return;

    if (currentPermission === 'chalk' && isDrawingChalkRef.current && chalkStrokeRef.current) {
      isDrawingChalkRef.current = false;
      const finishedStroke = chalkStrokeRef.current;
      chalkStrokeRef.current = null;

      if (finishedStroke.points.length > 0) {
        socketRef.current?.emit('whiteboard:student_stroke', {
          grade: effectiveGrade,
          teacherId,
          pageIndex: viewingPageIndex,
          stroke: finishedStroke,
          studentName: studentName || 'Student'
        });

        setPages((prevPages) => {
          const next = [...prevPages];
          if (next[viewingPageIndex]) {
            next[viewingPageIndex] = {
              ...next[viewingPageIndex],
              strokes: [...(next[viewingPageIndex].strokes || []), finishedStroke]
            };
          }
          return next;
        });
      }
    }
  };

  const handleCanvasPointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentPermission === 'pointer') {
      setLaserPointer(null);
      socketRef.current?.emit('whiteboard:student_pointer', {
        grade: effectiveGrade,
        teacherId,
        studentName: studentName || 'Student',
        active: false
      });
    }
    if (currentPermission === 'chalk') {
      handleCanvasPointerUp(e);
    }
  };

  const handleSendReaction = (emoji: string, label: string, sentiment: 'positive' | 'question' | 'slow_down' | 'speed_up') => {
    if (!socketRef.current || !isLive) return;
    const type = sentiment === 'positive' ? 'understood' : sentiment === 'question' ? 'confused' : sentiment === 'slow_down' ? 'slower' : 'faster';
    const reactionId = `${socketRef.current.id || Date.now()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    seenReactionsRef.current.add(reactionId);

    socketRef.current.emit('whiteboard:reaction', {
      id: reactionId,
      grade: effectiveGrade,
      teacherId,
      emoji,
      label,
      sentiment,
      type,
      studentName: (studentName && studentName.trim()) || 'Student'
    });

    const newReaction = {
      id: reactionId,
      emoji,
      x: 20 + Math.random() * 60
    };
    setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2400);

    if (setNotice) {
      setNotice(`Sent reaction: ${emoji} ${label}`);
    }
  };

  // Export current page as PNG image
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `EduAshram_Whiteboard_Page_${viewingPageIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (setNotice) setNotice(`Downloaded Page ${viewingPageIndex + 1} as PNG.`);
  };

  // One-Click "Export Class Notes as PDF": generates clean, compressed PDF of all pages with watermark
  const handleExportPDF = async () => {
    if (!pages || !pages.length) return;
    setIsExportingPDF(true);
    try {
      const pdfW = 1200;
      const pdfH = 800;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [pdfW, pdfH] });

      const offCanvas = document.createElement('canvas');
      offCanvas.width = pdfW;
      offCanvas.height = pdfH;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      const totalPgs = pages.length;
      for (let i = 0; i < totalPgs; i++) {
        if (i > 0) {
          pdf.addPage([pdfW, pdfH], 'landscape');
        }
        offCtx.clearRect(0, 0, pdfW, pdfH);
        renderWhiteboardPage(offCtx, pages[i], pdfW, pdfH, {
          isExport: true,
          pageNum: i + 1,
          totalPages: totalPgs,
          watermarkTitle: `EduAshram • ${effectiveGrade}`
        });

        const imgData = offCanvas.toDataURL('image/jpeg', 0.88);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeGrade = effectiveGrade.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`EduAshram_Class_Notes_${safeGrade}_${dateStr}.pdf`);
      if (setNotice) setNotice(`Downloaded ${totalPgs}-page Class Notes as PDF.`);
    } catch (err) {
      console.error('Error generating PDF notes:', err);
      if (setNotice) setNotice('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const jumpToTeacher = () => {
    setViewingPageIndex(teacherActivePage);
    setFollowTeacher(true);
    setTimeout(() => {
      if (containerRef.current) {
        if (typeof teacherScrollRef.current.scrollRatio === 'number' && teacherScrollRef.current.scrollRatio > 0) {
          const maxScroll = Math.max(0, containerRef.current.scrollHeight - containerRef.current.clientHeight);
          containerRef.current.scrollTo({ top: Math.round(teacherScrollRef.current.scrollRatio * maxScroll), behavior: 'smooth' });
        } else if (typeof teacherScrollRef.current.scrollTop === 'number') {
          containerRef.current.scrollTo({ top: teacherScrollRef.current.scrollTop, behavior: 'smooth' });
        }
      }
    }, 60);
  };

  const handlePrevPage = () => {
    if (viewingPageIndex > 0) {
      setViewingPageIndex((p) => p - 1);
      setFollowTeacher(false);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (viewingPageIndex < pages.length - 1) {
      setViewingPageIndex((p) => p + 1);
      setFollowTeacher(false);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`student-whiteboard-root ${isFullscreen ? 'student-whiteboard--fullscreen' : ''}`}>
      {/* Control Header */}
      <div className="student-whiteboard-header">
        <div className="student-whiteboard-meta">
          <div className="student-live-status-pill">
            <span className={`student-live-dot ${isLive ? 'active' : ''}`} />
            <span className="student-live-text">{isLive ? 'LIVE' : 'STANDBY'}</span>
          </div>
          <div className="student-teacher-info">
            <strong className="student-teacher-name">{isLive ? teacherName : 'Classroom Whiteboard'}</strong>
            <span className="student-grade-badge">{effectiveGrade}</span>
          </div>
          {isLive && viewerCount > 0 && (
            <span className="student-viewer-badge" title="Students connected">
              👥 {viewerCount} viewing
            </span>
          )}
        </div>

        {/* Independent Page Navigation */}
        {pages.length > 0 && (
          <div className="student-page-nav-group">
            <button
              type="button"
              className="student-page-btn"
              onClick={handlePrevPage}
              disabled={viewingPageIndex <= 0}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="student-page-indicator">
              Page <strong>{viewingPageIndex + 1}</strong> of {pages.length}
            </span>
            <button
              type="button"
              className="student-page-btn"
              onClick={handleNextPage}
              disabled={viewingPageIndex >= pages.length - 1}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>

            {/* Jump to Teacher's Active Page Button or Following status */}
            {isLive && (
              viewingPageIndex !== teacherActivePage ? (
                <button
                  type="button"
                  className="student-jump-teacher-btn"
                  onClick={jumpToTeacher}
                  title="Jump to the page teacher is actively writing on"
                >
                  <Bookmark size={14} /> Jump to Teacher (Page {teacherActivePage + 1})
                </button>
              ) : (
                <button
                  type="button"
                  className="student-jump-teacher-btn"
                  style={followTeacher ? { background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' } : { background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}
                  onClick={() => {
                    if (!followTeacher) {
                      jumpToTeacher();
                    } else {
                      setFollowTeacher(false);
                    }
                  }}
                  title={followTeacher ? "Currently auto-following teacher's page and scroll (Click to pause)" : "Click to auto-follow teacher's page and scroll"}
                >
                  {followTeacher ? '📡 Following Teacher' : '⏸️ Browse Mode (Click to Follow)'}
                </button>
              )
            )}
          </div>
        )}

        {/* Action Tools: Raise Hand, Reactions, PDF Notes & Fullscreen */}
        <div className="student-actions-group">
          {isLive && (
            <>
              {/* Raise Hand & Doubt Button */}
              <button
                type="button"
                className={`student-raise-hand-btn ${isHandRaised ? 'is-raised' : ''}`}
                onClick={() => {
                  if (isHandRaised) {
                    socketRef.current?.emit('whiteboard:lower_hand', { grade: effectiveGrade, teacherId });
                    setIsHandRaised(false);
                    if (setNotice) setNotice('Hand lowered.');
                  } else {
                    setShowRaiseHandModal(true);
                  }
                }}
                title={isHandRaised ? 'Click to lower your hand' : 'Raise hand to ask a question / doubt'}
              >
                <Hand size={15} />
                <span>{isHandRaised ? '✋ Hand Raised' : '✋ Raise Hand'}</span>
              </button>

              {/* Instant Sentiment Reactions */}
              <div className="student-reactions-bar">
                <button
                  type="button"
                  className="student-reaction-btn"
                  onClick={() => handleSendReaction('👍', 'Got it', 'positive')}
                  title="Understood / Got it!"
                >
                  👍 <span>Got it</span>
                </button>
                <button
                  type="button"
                  className="student-reaction-btn"
                  onClick={() => handleSendReaction('❓', 'Doubt', 'question')}
                  title="Need clarification / Have a doubt"
                >
                  ❓ <span>Doubt</span>
                </button>
                <button
                  type="button"
                  className="student-reaction-btn"
                  onClick={() => handleSendReaction('🐢', 'Slower', 'slow_down')}
                  title="Pacing is too fast, please slow down"
                >
                  🐢 <span>Slower</span>
                </button>
                <button
                  type="button"
                  className="student-reaction-btn"
                  onClick={() => handleSendReaction('⚡', 'Ready', 'speed_up')}
                  title="Understood, ready to proceed"
                >
                  ⚡ <span>Ready</span>
                </button>
              </div>
            </>
          )}

          {pages.length > 0 && (
            <>
              <button
                type="button"
                className="button button-secondary student-action-btn"
                onClick={handleExportPNG}
                title="Save current page as PNG image"
              >
                <Download size={14} /> Page
              </button>
              <button
                type="button"
                className="button button-secondary student-action-btn"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                title="Download today's class notes as clean, watermarked PDF"
                style={{ fontWeight: 700 }}
              >
                <FileText size={14} /> {isExportingPDF ? 'Generating...' : 'PDF Notes'}
              </button>
            </>
          )}
          <button
            type="button"
            className="button button-secondary student-action-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Temporary Delegation Notification Banners */}
      {isLive && currentPermission === 'pointer' && (
        <div className="student-delegation-banner student-delegation-banner--pointer">
          <span>🎯 <strong>Teacher delegated Board Pointer to you:</strong> Move your mouse or finger across the whiteboard to point to anything. Everyone can see your laser pointer in real-time.</span>
        </div>
      )}

      {isLive && currentPermission === 'chalk' && (
        <>
          <div className="student-delegation-banner student-delegation-banner--chalk">
            <span>✏️ <strong>Teacher delegated Board Chalk to you:</strong> Solve the problem or write directly on the board! Everyone can see your writing in real-time.</span>
          </div>
          <div className="student-chalk-bar">
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <PenTool size={13} /> Student Chalk:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {['#0f172a', '#2563eb', '#16a34a', '#dc2626', '#ea580c'].map((c) => (
                <span
                  key={c}
                  className={`student-chalk-color-dot ${chalkColor === c && chalkMode === 'pen' ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => { setChalkColor(c); setChalkMode('pen'); }}
                  title={`Color: ${c}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
              {[
                { label: 'Thin', w: 2 },
                { label: 'Medium', w: 4 },
                { label: 'Thick', w: 7 }
              ].map((sz) => (
                <button
                  key={sz.w}
                  type="button"
                  onClick={() => { setChalkWidth(sz.w); setChalkMode('pen'); }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    background: chalkWidth === sz.w && chalkMode === 'pen' ? '#38bdf8' : '#334155',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {sz.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setChalkMode(chalkMode === 'eraser' ? 'pen' : 'eraser')}
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  background: chalkMode === 'eraser' ? '#f43f5e' : '#334155',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px'
                }}
              >
                <Eraser size={12} /> {chalkMode === 'eraser' ? 'Erasing' : 'Eraser'}
              </button>
            </div>
          </div>
        </>
      )}

      {isLive && !isMeDelegated && delegatedStudent && (
        <div className="student-delegation-banner student-delegation-banner--pointer" style={{ background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}>
          <span>👥 Classmate <strong>{delegatedStudent.studentName || 'Student'}</strong> is currently controlling the board {delegatedStudent.permission === 'chalk' ? 'chalk ✏️' : 'pointer 🎯'}.</span>
        </div>
      )}

      {/* Main Board View */}
      <div ref={containerRef} className="student-whiteboard-canvas-wrap">
        {/* Floating Reactions Layer */}
        {floatingReactions.length > 0 && (
          <div className="floating-reactions-container">
            {floatingReactions.map((r) => (
              <div
                key={r.id}
                className="floating-reaction-bubble"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </div>
            ))}
          </div>
        )}

        {isLive ? (
          <div style={{ position: 'relative', margin: '0 auto', flexShrink: 0 }}>
            <canvas
              ref={canvasRef}
              className="student-whiteboard-canvas"
              style={{
                pointerEvents: currentPermission ? 'auto' : 'none',
                cursor: currentPermission === 'pointer' ? 'crosshair' : currentPermission === 'chalk' ? (chalkMode === 'eraser' ? 'cell' : 'crosshair') : 'default',
                display: 'block',
                touchAction: currentPermission ? 'none' : 'auto'
              }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerLeave}
              onPointerCancel={handleCanvasPointerUp}
            />
            {(pages[viewingPageIndex]?.widgets || [])
              .filter((w: any) => w.type === 'video')
              .map((w: any) => (
                <StudentVideoPlayer
                  key={w.id}
                  widget={w}
                  syncEvent={videoSyncEvents[w.id]}
                />
              ))}
          </div>
        ) : (
          <div className="student-whiteboard-standby">
            <div className="student-standby-icon">
              <Radio size={36} color="#0284c7" />
            </div>
            <h2>Whiteboard is in Standby</h2>
            <p>
              Your teacher is not currently broadcasting a live board for <strong>{effectiveGrade}</strong>.
            </p>
            <p className="student-standby-hint">
              Keep this tab open while you join your Zoom audio/video session. As soon as your teacher clicks <strong>Go Live</strong>, the whiteboard will appear here in real-time.
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                if (socketRef.current) {
                  socketRef.current.emit('whiteboard:join', { grade: effectiveGrade, teacherId });
                }
                void checkLiveStatus();
              }}
              style={{ marginTop: '16px', gap: '8px' }}
            >
              <RefreshCw size={14} /> Check for Broadcast
            </button>
          </div>
        )}
      </div>

      {/* Notice footer */}
      {isLive && (
        <div className="student-whiteboard-footer">
          <CheckCircle2 size={14} color="#10b981" />
          <span>
            {currentPermission === 'chalk'
              ? '✏️ Board Chalk Active: Draw or write on the board'
              : currentPermission === 'pointer'
              ? '🎯 Board Pointer Active: Move pointer on the board'
              : 'Live synchronization active • View-only mode • You can freely browse pages'}
          </span>
        </div>
      )}

      {/* Raise Hand & Doubt Modal */}
      {showRaiseHandModal && (
        <div className="doubt-modal-backdrop" onClick={() => setShowRaiseHandModal(false)}>
          <div className="doubt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="doubt-modal-header">
              <h3><Hand size={18} color="#d97706" /> Ask Teacher a Doubt</h3>
              <button
                type="button"
                onClick={() => setShowRaiseHandModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="doubt-modal-body">
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Optional Note / Question:
              </label>
              <textarea
                rows={3}
                value={handNote}
                onChange={(e) => setHandNote(e.target.value)}
                placeholder="e.g., Can you explain step 2 again? / Why did we take x = 5?"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              <p style={{ margin: '8px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                Your question will appear discretely on the teacher's toolbar without interrupting the lesson.
              </p>
            </div>
            <div className="doubt-modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowRaiseHandModal(false)}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  socketRef.current?.emit('whiteboard:raise_hand', {
                    grade: effectiveGrade,
                    teacherId,
                    studentName,
                    note: handNote.trim()
                  });
                  setIsHandRaised(true);
                  setShowRaiseHandModal(false);
                  setHandNote('');
                  if (setNotice) setNotice('Hand raised! Teacher notified in Doubt Queue.');
                }}
                style={{ fontSize: '0.82rem', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} /> Raise Hand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
