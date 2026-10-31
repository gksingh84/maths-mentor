import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Radio, ChevronLeft, ChevronRight, Download, FileText, Maximize2, Minimize2, Bookmark, CheckCircle2, RefreshCw, Hand, X, Send, PenTool, Eraser } from 'lucide-react';
import jsPDF from 'jspdf';
import { ClassroomChatHeaderButton } from './ClassroomChatWidget';

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

function pointToSegmentDistSq(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
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

function interpolatePoints(p1: { x: number; y: number }, p2: { x: number; y: number }, step = 14): Array<{ x: number; y: number }> {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= step) return [p2];
  const n = Math.ceil(dist / step);
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    out.push({ x: Math.round(p1.x + dx * t), y: Math.round(p1.y + dy * t) });
  }
  return out;
}

function strokeIntersectsErasePoint(stroke: any, px: number, py: number, radius = 22): boolean {
  if (!stroke) return false;
  if (stroke.mode === 'eraser') return true;
  const pts = stroke.points;
  if (!pts || !pts.length) return false;
  const strokeRadius = Math.max(2, (stroke.width || 3) / 2);
  const effRadius = radius + strokeRadius;
  const eraseRadiusSq = effRadius * effRadius;
  if (pts.length === 1) {
    const dx = pts[0].x - px;
    const dy = pts[0].y - py;
    return (dx * dx + dy * dy) <= eraseRadiusSq;
  }
  for (let i = 0; i < pts.length - 1; i++) {
    if (pointToSegmentDistSq(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= eraseRadiusSq) {
      return true;
    }
  }
  return false;
}

function strokeIntersectsErasePoints(stroke: any, erasePoints: Array<{ x: number; y: number; radius?: number }>): boolean {
  if (!stroke) return false;
  if (stroke.mode === 'eraser') return true;
  for (const ep of erasePoints) {
    if (strokeIntersectsErasePoint(stroke, ep.x, ep.y, ep.radius || 22)) {
      return true;
    }
  }
  return false;
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

  const toggleStudentFullscreen = useCallback(() => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    try {
      if (next && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!next && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNative = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isNative && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

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
  const erasePointsBatchRef = useRef<Array<{ x: number; y: number; radius: number }>>([]);
  const lastErasePosRef = useRef<{ x: number; y: number } | null>(null);
  const lastEraseEmitRef = useRef<number>(0);

  // Live Reactions & PDF export state
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const seenReactionsRef = useRef<Set<string>>(new Set());
  const lastReactionTimeRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const followTeacherRef = useRef(followTeacher);
  useEffect(() => {
    followTeacherRef.current = followTeacher;
  }, [followTeacher]);
  const pagesRef = useRef<any[]>(pages);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
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
      const matchesGrade = !data?.grade || data.grade === 'ALL' || data.grade.toLowerCase() === 'all grades' || isGradeMatch(data.grade, effectiveGrade);
      if (data?.isLive && matchesGrade) {
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
      } else {
        setIsLive(false);
        setPages([]);
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
        const rawPages = Array.isArray(data.pages) && data.pages.length ? data.pages : [{ strokes: [], shapes: [], texts: [], widgets: [] }];
        const initialPages = rawPages.map((p: any) => ({
          ...p,
          strokes: (p.strokes || []).filter((s: any) => s && s.mode !== 'eraser')
        }));
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
      const matchesGrade = !data.grade || data.grade === 'ALL' || data.grade.toLowerCase() === 'all grades' || isGradeMatch(data.grade, effectiveGrade);
      const matchesTeacher = !teacherId || !data.teacherId || data.teacherId === teacherId;
      if (data?.isLive && matchesGrade && matchesTeacher) {
        setIsLive(true);
        setTeacherName(data.teacherName || 'Teacher');
        socket.emit('whiteboard:join', { grade: effectiveGrade, teacherId });
      } else {
        setIsLive(false);
        setPages([]);
        setVideoSyncEvents({});
      }
    });

    socket.on('whiteboard:broadcast_stopped', () => {
      setIsLive(false);
      setPages([]);
      setVideoSyncEvents({});
      if (setNotice) setNotice('Teacher concluded the live whiteboard session.');
    });

    socket.on('whiteboard:stroke', (data: { pageIndex: number; stroke: any }) => {
      if (!data?.stroke || data.stroke.mode === 'eraser') return;
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

    socket.on('whiteboard:erase', (data: { pageIndex: number; erasePoints: Array<{ x: number; y: number; radius?: number }>; remainingStrokes?: any[] }) => {
      if (!data) return;
      const pIdx = typeof data.pageIndex === 'number' ? data.pageIndex : 0;
      setPages((prevPages) => {
        const next = [...prevPages];
        if (next[pIdx]) {
          if (Array.isArray(data.remainingStrokes)) {
            next[pIdx] = {
              ...next[pIdx],
              strokes: data.remainingStrokes.filter((stroke: any) => stroke && stroke.mode !== 'eraser')
            };
          } else if (Array.isArray(data.erasePoints) && next[pIdx].strokes) {
            next[pIdx] = {
              ...next[pIdx],
              strokes: next[pIdx].strokes.filter((stroke: any) => {
                if (stroke.mode === 'eraser') return false;
                return !strokeIntersectsErasePoints(stroke, data.erasePoints);
              })
            };
          }
        }
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
        const cleanedPages = data.pages.map((p: any) => ({
          ...p,
          strokes: (p.strokes || []).filter((s: any) => s && s.mode !== 'eraser')
        }));
        setPages(cleanedPages);
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
          const cleanPage = {
            ...data.page,
            strokes: (data.page?.strokes || []).filter((s: any) => s && s.mode !== 'eraser')
          };
          next[data.pageIndex] = cleanPage;
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

    socket.on('whiteboard:reaction_event', (data: { id?: string; emoji?: string; studentName?: string; studentId?: string; senderSocketId?: string }) => {
      // 1. Drop if this event originated from our own socket
      if (data?.senderSocketId && socketRef.current?.id && data.senderSocketId === socketRef.current.id) {
        return;
      }
      // 2. Drop if this event has our studentId
      if (data?.studentId && studentId && data.studentId === studentId) {
        return;
      }
      // 3. Drop if this event matches our studentName
      if (data?.studentName && studentName && data.studentName.trim().toLowerCase() === studentName.trim().toLowerCase()) {
        return;
      }
      // 4. Drop if already seen/rendered
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

  const ensureImageLoaded = (dataUrl?: string): Promise<HTMLImageElement | null> => {
    if (!dataUrl) return Promise.resolve(null);
    const cached = imageCacheRef.current.get(dataUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
    return new Promise((resolve) => {
      const img = new Image();
      if (!dataUrl.startsWith('data:') && !dataUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        imageCacheRef.current.set(dataUrl, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  };

  // Render Educational Instruments (Ruler) synced from teacher
  const drawStudentRuler = (ctx: CanvasRenderingContext2D, r: any) => {
    if (!r || !r.visible) return;
    const lengthCm = typeof r.lengthCm === 'number' ? r.lengthCm : 15;
    const pxPerCm = typeof r.pxPerCm === 'number' ? r.pxPerCm : 36;
    const totalPx = Math.round(lengthCm * pxPerCm);
    const w = totalPx + 40;
    const h = 72;
    const x = typeof r.x === 'number' ? r.x : 200;
    const y = typeof r.y === 'number' ? r.y : 150;
    const angle = typeof r.angle === 'number' ? r.angle : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    // Frosted acrylic ruler body
    ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
    ctx.lineWidth = 1.5;

    const left = -w / 2;
    const top = -h / 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(left, top, w, h, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.rect(left, top, w, h);
      ctx.fill();
      ctx.stroke();
    }

    // Clear shadow for markings
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 1. Metric cm & mm ticks on TOP edge
    const totalMm = Math.round(lengthCm * 10);
    const startX = -totalPx / 2;
    for (let i = 0; i <= totalMm; i++) {
      const tx = startX + i * (pxPerCm / 10);
      if (i % 10 === 0) {
        const cmNum = i / 10;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, top);
        ctx.lineTo(tx, top + 18);
        ctx.stroke();

        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(cmNum), tx, top + 21);
      } else if (i % 5 === 0) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(tx, top);
        ctx.lineTo(tx, top + 12);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(tx, top);
        ctx.lineTo(tx, top + 7);
        ctx.stroke();
      }
    }

    // cm label
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#0284c7';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('cm', totalPx / 2 + 6, top + 10);

    // 2. Inch ticks on BOTTOM edge
    const pxPerInch = pxPerCm * 2.54;
    const totalInches = Math.floor(totalPx / pxPerInch);
    const bottom = top + h;
    for (let inIdx = 0; inIdx <= totalInches; inIdx++) {
      const ix = startX + inIdx * pxPerInch;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ix, bottom);
      ctx.lineTo(ix, bottom - 16);
      ctx.stroke();

      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(inIdx), ix, bottom - 18);

      const halfIx = ix + pxPerInch / 2;
      if (halfIx <= totalPx / 2) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(halfIx, bottom);
        ctx.lineTo(halfIx, bottom - 10);
        ctx.stroke();
      }
    }

    // in label
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('in', totalPx / 2 + 6, bottom - 6);

    // Center badge pill
    const normAngle = ((angle % 360) + 360) % 360;
    const badgeText = `📏 ${lengthCm.toFixed(1)} cm • ${normAngle.toFixed(1)}°`;
    ctx.font = 'bold 10px monospace';
    const tw = ctx.measureText(badgeText).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    const pw = tw + 16;
    const ph = 20;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 999);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.rect(-pw / 2, -ph / 2, pw, ph);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#0284c7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 0, 0);

    ctx.restore();
  };

  // Render Educational Instruments (Protractor) synced from teacher
  const drawStudentProtractor = (ctx: CanvasRenderingContext2D, p: any) => {
    if (!p || !p.visible) return;
    const isFull = !!p.isFullCircle;
    const isInner = p.scaleMode === 'inner';
    const r = typeof p.radius === 'number' ? p.radius : 210;
    const x = typeof p.x === 'number' ? p.x : 250;
    const y = typeof p.y === 'number' ? p.y : 200;
    const angle = typeof p.angle === 'number' ? p.angle : 45;
    const baseRotation = typeof p.baseRotation === 'number' ? p.baseRotation : 0;
    const scale = typeof p.scale === 'number' && p.scale > 0.1 ? p.scale : 1.0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((baseRotation * Math.PI) / 180);
    if (scale !== 1.0) {
      ctx.scale(scale, scale);
    }

    // Frosted acrylic background
    ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.strokeStyle = isInner ? 'rgba(234, 88, 12, 0.65)' : 'rgba(2, 132, 199, 0.6)';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    if (isFull) {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else {
      // Semicircle above baseline: from 0 counter-clockwise to PI, then close back to (r, 0)
      ctx.arc(0, 0, r, 0, Math.PI, true);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    // Clear shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Dynamic Angle Sector Highlight (swept wedge for Inner or Outer scale)
    if (angle > 0) {
      ctx.save();
      if (isInner) {
        const cartesianDeg = 180 - angle;
        const angleRad = (cartesianDeg * Math.PI) / 180;
        ctx.fillStyle = 'rgba(234, 88, 12, 0.22)';
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-r, 0);
        ctx.arc(0, 0, r, Math.PI, -angleRad, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        const angleRad = (angle * Math.PI) / 180;
        ctx.fillStyle = 'rgba(2, 132, 199, 0.20)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r, 0);
        ctx.arc(0, 0, r, 0, -angleRad, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Degree ticks & labels
    const maxDeg = isFull ? 360 : 180;
    for (let deg = 0; deg <= maxDeg; deg++) {
      const rad = (deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const isPrimary = (deg % 10 === 0);
      const isMid = (deg % 5 === 0 && !isPrimary);

      const tickLen = isPrimary ? 16 : (isMid ? 10 : 5);
      const x1 = r * cos;
      const y1 = -r * sin;
      const x2 = (r - tickLen) * cos;
      const y2 = -(r - tickLen) * sin;

      ctx.strokeStyle = isPrimary ? '#0f172a' : (isMid ? '#334155' : '#94a3b8');
      ctx.lineWidth = isPrimary ? 1.4 : (isMid ? 1 : 0.6);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Labels every 10 degrees
      if (isPrimary && deg < maxDeg) {
        // Outer scale (counter-clockwise 0 -> 180)
        const textR1 = r - 26;
        const tx1 = textR1 * cos;
        const ty1 = -textR1 * sin;
        ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(deg), tx1, ty1);

        // Inner scale (clockwise 180 -> 0)
        if (!isFull) {
          const textR2 = r - 42;
          const tx2 = textR2 * cos;
          const ty2 = -textR2 * sin;
          const innerDeg = 180 - deg;
          ctx.font = '600 8px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#c2410c';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(innerDeg), tx2, ty2);
        }
      }
    }

    // Origin crosshair & center hole
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(0, 24);
    ctx.stroke();
    ctx.restore();

    // Angle needle ray line
    const cartesianDeg = isInner ? (180 - angle) : angle;
    const needleRad = (cartesianDeg * Math.PI) / 180;
    const wedgeX = r * Math.cos(needleRad);
    const wedgeY = -r * Math.sin(needleRad);
    ctx.save();
    ctx.strokeStyle = isInner ? '#ea580c' : '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wedgeX, wedgeY);
    ctx.stroke();

    // Knob indicator at needle tip
    ctx.setLineDash([]);
    ctx.fillStyle = isInner ? '#ea580c' : '#0284c7';
    ctx.beginPath();
    ctx.arc(wedgeX, wedgeY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(wedgeX, wedgeY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Angle readout badge near the swept sector
    const badgeDist = r * 0.52;
    const midAngleRad = isInner ? (Math.PI + needleRad) / 2 : needleRad / 2;
    const bx = badgeDist * Math.cos(midAngleRad);
    const by = -badgeDist * Math.sin(midAngleRad);
    const badgeText = `${angle.toFixed(1)}° (${isInner ? 'Inner' : 'Outer'})`;
    ctx.font = 'bold 10px monospace';
    const btw = ctx.measureText(badgeText).width;
    ctx.fillStyle = isInner ? '#ea580c' : '#0284c7';
    const pw = btw + 14;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(bx - pw / 2, by - 9, pw, 18, 4);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.rect(bx - pw / 2, by - 9, pw, 18);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bx, by);
    ctx.restore();

    ctx.restore();
  };

  // Render Educational Instruments (Compass) synced from teacher
  const drawStudentCompass = (ctx: CanvasRenderingContext2D, c: any) => {
    if (!c || !c.visible) return;
    const x = typeof c.x === 'number' ? c.x : 280;
    const y = typeof c.y === 'number' ? c.y : 220;
    const r = typeof c.radiusPx === 'number' ? c.radiusPx : 144;
    const angle = typeof c.angle === 'number' ? c.angle : 45;
    const rad = (angle * Math.PI) / 180;
    const px = r * Math.cos(rad);
    const py = r * Math.sin(rad);

    ctx.save();
    ctx.translate(x, y);

    // Subtle radius dashed guide circle
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hinge calculation
    const armLength = Math.max(160, r * 0.95);
    const halfR = r / 2;
    const hDist = Math.sqrt(Math.max(400, armLength * armLength - halfR * halfR));
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    const hx = (px / 2) + nx * hDist;
    const hy = (py / 2) + ny * hDist;

    // Shadow
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Needle arm (H to 0,0)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Needle tip
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx * 0.15, hy * 0.15);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Pencil arm (H to px,py)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(px * 0.75 + hx * 0.25, py * 0.75 + hy * 0.25);
    ctx.stroke();

    // Pencil body & wood cone
    const cx1 = px * 0.65 + hx * 0.35;
    const cy1 = py * 0.65 + hy * 0.35;
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(px * 0.95 + hx * 0.05, py * 0.95 + hy * 0.05);
    ctx.stroke();

    // Pencil lead tip
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px * 0.98 + hx * 0.02, py * 0.98 + hy * 0.02);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Hinge knob
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hx, hy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center anchor pin O
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Radius badge
    const radiusCm = typeof c.radiusCm === 'number' ? c.radiusCm : (r / 36);
    const badgeText = `🧭 r = ${radiusCm.toFixed(1)} cm • ${angle.toFixed(1)}°`;
    ctx.font = 'bold 10px monospace';
    const btw = ctx.measureText(badgeText).width;
    const pw = btw + 14;
    const bx = px / 2;
    const by = py / 2 - 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(bx - pw / 2, by - 9, pw, 18, 4); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.rect(bx - pw / 2, by - 9, pw, 18); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#0284c7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bx, by);

    ctx.restore();
  };

  // Render Educational Instruments (Set Square) synced from teacher
  const drawStudentSetSquare = (ctx: CanvasRenderingContext2D, sq: any) => {
    if (!sq || !sq.visible) return;
    const x = typeof sq.x === 'number' ? sq.x : 240;
    const y = typeof sq.y === 'number' ? sq.y : 180;
    const angle = typeof sq.angle === 'number' ? sq.angle : 0;
    const is3060 = sq.type === '30-60-90';
    const pxPerCm = typeof sq.pxPerCm === 'number' ? sq.pxPerCm : 36;
    const sizeCm = typeof sq.sizeCm === 'number' && sq.sizeCm >= 3 ? sq.sizeCm : (is3060 ? 6 : 7);
    const wPx = sizeCm * pxPerCm;
    const hPx = is3060 ? Math.round(wPx * Math.sqrt(3)) : wPx;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    ctx.shadowColor = 'rgba(15, 23, 42, 0.2)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    // Corner A is at origin (0, 0), vertex B along x-axis, vertex C along y-axis
    const pA = { x: 0, y: 0 };
    const pB = { x: wPx, y: 0 };
    const pC = { x: 0, y: hPx };

    const innerInset = 28;
    const ipA = { x: innerInset, y: innerInset };
    const ipB = { x: Math.max(20, wPx - innerInset * 2.2), y: innerInset };
    const ipC = { x: innerInset, y: Math.max(20, hPx - innerInset * 2.2) };

    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.moveTo(ipA.x, ipA.y);
    ctx.lineTo(ipB.x, ipB.y);
    ctx.lineTo(ipC.x, ipC.y);
    ctx.closePath();

    ctx.fillStyle = 'rgba(240, 253, 250, 0.85)';
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.8)';
    ctx.lineWidth = 2.2;
    ctx.fill('evenodd');
    ctx.stroke();

    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, 0, 14, 14);

    const totalMmH = Math.round((wPx / pxPerCm) * 10);
    for (let i = 0; i <= totalMmH; i++) {
      const tx = i * (pxPerCm / 10);
      if (i % 10 === 0) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, 12); ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(String(i / 10), tx, 14);
      } else if (i % 5 === 0) {
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, 8); ctx.stroke();
      } else {
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, 5); ctx.stroke();
      } 
    }

    const totalMmV = Math.round((hPx / pxPerCm) * 10);
    for (let j = 0; j <= totalMmV; j++) {
      const ty = j * (pxPerCm / 10);
      if (j % 10 === 0) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(12, ty); ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(j / 10), 14, ty);
      } else if (j % 5 === 0) {
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(8, ty); ctx.stroke();
      } else {
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(5, ty); ctx.stroke();
      }
    }

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('90°', 16, 26);
    if (is3060) {
      ctx.fillText('60°', pB.x - 24, 16);
      ctx.fillText('30°', 6, pC.y - 12);
    } else {
      ctx.fillText('45°', pB.x - 24, 16);
      ctx.fillText('45°', 6, pC.y - 12);
    }


    const badgeText = `📐 ${is3060 ? '30°-60°-90°' : '45°-45°-90°'} • ${angle.toFixed(1)}°`;
    ctx.font = 'bold 9px monospace';
    const tw = ctx.measureText(badgeText).width;
    const pw = tw + 12;
    const bx = (pB.x + pC.x) / 2 + 10;
    const by = (pB.y + pC.y) / 2 + 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(bx - pw / 2, by - 8, pw, 16, 4); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.rect(bx - pw / 2, by - 8, pw, 16); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#047857';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bx, by);

    ctx.restore();
  };

  // --- Educational Diagram Renderers (Phase 4B) ---
  const drawStudentNumberLine = (ctx: CanvasRenderingContext2D, shape: any, strokeColor: string, lineWidth: number) => {
    const { start, end } = shape;
    if (!start || !end) return;
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    const cy = (y1 + y2) / 2;
    const w = x2 - x1 || 300;
    const color = strokeColor || shape.color || '#0f172a';

    const min = typeof shape.min === 'number' ? shape.min : -5;
    const max = typeof shape.max === 'number' ? shape.max : 5;
    const step = typeof shape.step === 'number' && shape.step > 0 ? shape.step : 1;
    const count = Math.max(1, Math.round((max - min) / step));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth || shape.width || 2;
    ctx.lineCap = 'round';

    // Main axis line
    ctx.beginPath();
    ctx.moveTo(x1 + 16, cy);
    ctx.lineTo(x2 - 16, cy);
    ctx.stroke();

    // Arrows on left and right
    const head = 10;
    ctx.beginPath();
    ctx.moveTo(x1 + 16, cy);
    ctx.lineTo(x1 + 16 + head, cy - 5);
    ctx.moveTo(x1 + 16, cy);
    ctx.lineTo(x1 + 16 + head, cy + 5);
    ctx.moveTo(x2 - 16, cy);
    ctx.lineTo(x2 - 16 - head, cy - 5);
    ctx.moveTo(x2 - 16, cy);
    ctx.lineTo(x2 - 16 - head, cy + 5);
    ctx.stroke();

    // Equidistant tick marks and numeric labels
    const leftMargin = 32;
    const usableW = Math.max(20, w - leftMargin * 2);
    const dx = usableW / count;

    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= count; i++) {
      const val = min + i * step;
      const tx = x1 + leftMargin + i * dx;
      const isZero = Math.abs(val) < 0.0001;

      ctx.beginPath();
      ctx.strokeStyle = isZero ? '#0284c7' : color;
      ctx.lineWidth = isZero ? (lineWidth || 2) + 1 : (lineWidth || 2);
      const tickH = isZero ? 13 : 8;
      ctx.moveTo(tx, cy - tickH);
      ctx.lineTo(tx, cy + tickH);
      ctx.stroke();

      // Value label
      ctx.fillStyle = isZero ? '#0284c7' : color;
      let labelText = String(Math.round(val * 100) / 100);
      if (shape.stylePreset === 'fractions') {
        if (val === 0) labelText = '0';
        else if (val === 1) labelText = '1';
        else if (val === 0.5) labelText = '1/2';
        else if (val === 0.25) labelText = '1/4';
        else if (val === 0.75) labelText = '3/4';
      }
      ctx.fillText(labelText, tx, cy + 14);
    }

    // Plotted point marker if specified
    if (typeof shape.pointVal === 'number') {
      const clamped = Math.max(min, Math.min(max, shape.pointVal));
      const px = x1 + leftMargin + ((clamped - min) / (max - min)) * usableW;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(px, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawStudentCoordinateAxes = (ctx: CanvasRenderingContext2D, shape: any, strokeColor: string, lineWidth: number, isDark = false) => {
    const { start, end } = shape;
    if (!start || !end) return;
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    const w = x2 - x1 || 240;
    const h = y2 - y1 || 240;
    const color = strokeColor || shape.color || '#0f172a';
    const isPos = shape.mode === 'positiveQuadrant';

    const originX = isPos ? x1 + 24 : (x1 + x2) / 2;
    const originY = isPos ? y2 - 24 : (y1 + y2) / 2;

    ctx.save();

    // 1. Optional background grid (similar to whiteboard grid, increased visibility by 20%)
    if (shape.gridVisible !== false) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.24)';
      ctx.lineWidth = 0.9;
      const stepX = isPos ? (w - 32) / 6 : (w / 2 - 16) / 5;
      const stepY = isPos ? (h - 32) / 6 : (h / 2 - 16) / 5;

      if (isPos) {
        for (let x = originX; x <= x2 - 10; x += stepX) {
          ctx.beginPath(); ctx.moveTo(x, y1 + 10); ctx.lineTo(x, originY); ctx.stroke();
        }
        for (let y = originY; y >= y1 + 10; y -= stepY) {
          ctx.beginPath(); ctx.moveTo(originX, y); ctx.lineTo(x2 - 10, y); ctx.stroke();
        }
      } else {
        for (let x = originX; x <= x2 - 10; x += stepX) {
          ctx.beginPath(); ctx.moveTo(x, y1 + 10); ctx.lineTo(x, y2 - 10); ctx.stroke();
        }
        for (let x = originX - stepX; x >= x1 + 10; x -= stepX) {
          ctx.beginPath(); ctx.moveTo(x, y1 + 10); ctx.lineTo(x, y2 - 10); ctx.stroke();
        }
        for (let y = originY; y <= y2 - 10; y += stepY) {
          ctx.beginPath(); ctx.moveTo(x1 + 10, y); ctx.lineTo(x2 - 10, y); ctx.stroke();
        }
        for (let y = originY - stepY; y >= y1 + 10; y -= stepY) {
          ctx.beginPath(); ctx.moveTo(x1 + 10, y); ctx.lineTo(x2 - 10, y); ctx.stroke();
        }
      }
    }

    // 2. Main Axes with Arrows
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || shape.width || 2;
    ctx.lineCap = 'round';

    // X-axis
    ctx.beginPath();
    ctx.moveTo(isPos ? originX : x1 + 8, originY);
    ctx.lineTo(x2 - 8, originY);
    ctx.stroke();

    // X arrow
    ctx.beginPath();
    ctx.moveTo(x2 - 8, originY);
    ctx.lineTo(x2 - 18, originY - 5);
    ctx.moveTo(x2 - 8, originY);
    ctx.lineTo(x2 - 18, originY + 5);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(originX, isPos ? originY : y2 - 8);
    ctx.lineTo(originX, y1 + 8);
    ctx.stroke();

    // Y arrow
    ctx.beginPath();
    ctx.moveTo(originX, y1 + 8);
    ctx.lineTo(originX - 5, y1 + 18);
    ctx.moveTo(originX, y1 + 8);
    ctx.lineTo(originX + 5, y1 + 18);
    ctx.stroke();

    // Labels
    ctx.font = 'bold 13px serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', x2 + 2, originY);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('y', originX, y1 + 4);

    // Origin label "0"
    ctx.font = 'italic 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', originX - 4, originY + 3);

    ctx.restore();
  };

  const drawStudentVennDiagram = (ctx: CanvasRenderingContext2D, shape: any, _strokeColor: string, lineWidth: number) => {
    const { start, end } = shape;
    if (!start || !end) return;
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const w = Math.max(20, x2 - x1);
    const h = Math.max(20, y2 - y1);
    const is3Sets = shape.sets === 3;

    ctx.save();

    // Universal Set box U
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(1.5, Math.min(3.5, w * 0.005));
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x1, y1, w, h, 8);
      ctx.stroke();
    } else {
      ctx.strokeRect(x1, y1, w, h);
    }

    const uFontSize = Math.max(12, Math.min(32, Math.round(Math.min(w, h) * 0.065)));
    ctx.font = `bold ${uFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(shape.labelU || 'U', x1 + 12, y1 + 10);

    if (!is3Sets) {
      // 2-Set Venn Diagram
      // Dynamically scale circle radius to fill the box proportionately without arbitrary caps
      const maxRw = (w - 36) / 3.2;
      const maxRh = (h - 48) / 2.2;
      const r = Math.max(12, Math.min(maxRw, maxRh));
      const offset = r * 0.58;
      const setLineWidth = Math.max(1.8, Math.min(4.5, lineWidth || (r * 0.024)));

      // Set A
      ctx.save();
      ctx.fillStyle = 'rgba(2, 132, 199, 0.16)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = setLineWidth;
      ctx.beginPath();
      ctx.arc(cx - offset, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Set B
      ctx.save();
      ctx.fillStyle = 'rgba(234, 88, 12, 0.16)';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = setLineWidth;
      ctx.beginPath();
      ctx.arc(cx + offset, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Set Labels scaled with radius
      const setFontSize = Math.max(12, Math.min(36, Math.round(r * 0.18)));
      ctx.font = `bold ${setFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#0284c7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(shape.labelA || 'A', cx - offset - r * 0.45, cy - r * 0.6);

      ctx.fillStyle = '#ea580c';
      ctx.fillText(shape.labelB || 'B', cx + offset + r * 0.45, cy - r * 0.6);

      // Intersection notation hint scaled with radius
      const interFontSize = Math.max(10, Math.min(26, Math.round(r * 0.14)));
      ctx.font = `bold ${interFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#475569';
      ctx.textBaseline = 'middle';
      ctx.fillText('A ∩ B', cx, cy);
    } else {
      // 3-Set Venn Diagram
      // Dynamically scale circle radius to fill the box proportionately without arbitrary caps
      const maxRw = (w - 36) / 3.3;
      const maxRh = (h - 52) / 3.0;
      const r = Math.max(12, Math.min(maxRw, maxRh));
      const topY = cy - r * 0.45;
      const botY = cy + r * 0.45;
      const offset = r * 0.6;
      const setLineWidth = Math.max(1.6, Math.min(4, lineWidth || (r * 0.024)));

      // Set A (top)
      ctx.save();
      ctx.fillStyle = 'rgba(2, 132, 199, 0.14)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = setLineWidth;
      ctx.beginPath();
      ctx.arc(cx, topY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Set B (bottom left)
      ctx.save();
      ctx.fillStyle = 'rgba(234, 88, 12, 0.14)';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = setLineWidth;
      ctx.beginPath();
      ctx.arc(cx - offset, botY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Set C (bottom right)
      ctx.save();
      ctx.fillStyle = 'rgba(22, 163, 74, 0.14)';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = setLineWidth;
      ctx.beginPath();
      ctx.arc(cx + offset, botY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Labels scaled with radius
      const setFontSize = Math.max(11, Math.min(32, Math.round(r * 0.18)));
      ctx.font = `bold ${setFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#0284c7';
      ctx.textAlign = 'center';
      ctx.fillText(shape.labelA || 'A', cx, topY - r - 3);

      ctx.fillStyle = '#ea580c';
      ctx.fillText(shape.labelB || 'B', cx - offset - r * 0.7, botY + r * 0.4);

      ctx.fillStyle = '#16a34a';
      ctx.fillText(shape.labelC || 'C', cx + offset + r * 0.7, botY + r * 0.4);
    }

    ctx.restore();
  };

  const drawStudentFractionModel = (ctx: CanvasRenderingContext2D, shape: any, strokeColor: string, lineWidth: number) => {
    const { start, end } = shape;
    if (!start || !end) return;
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const w = x2 - x1 || 200;
    const h = y2 - y1 || 200;
    const total = Math.max(1, shape.totalParts || 4);
    const shaded = Math.max(0, Math.min(total, shape.shadedParts !== undefined ? shape.shadedParts : 3));
    const color = strokeColor || shape.color || '#0f172a';
    const fillColor = shape.fillColor || '#0284c7';

    ctx.save();

    if (shape.modelType === 'bar') {
      // Rectangular Fraction Strip
      const barH = Math.min(h * 0.55, 60);
      const barY = cy - barH / 2 - 8;
      const colW = w / total;

      for (let i = 0; i < total; i++) {
        const bx = x1 + i * colW;
        if (i < shaded) {
          ctx.fillStyle = fillColor;
          ctx.fillRect(bx, barY, colW, barH);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth || 1.6;
        ctx.strokeRect(bx, barY, colW, barH);
      }

      // Fraction label below scaled with strip height
      const fs = Math.max(12, Math.min(28, Math.round(barH * 0.35)));
      ctx.font = `bold ${fs}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${shaded} / ${total}`, cx, barY + barH + 8);
    } else {
      // Circular Fraction Pie
      const r = Math.max(15, Math.min(w, h) / 2 - 18);
      const sliceAngle = (2 * Math.PI) / total;

      for (let i = 0; i < total; i++) {
        const startAng = -Math.PI / 2 + i * sliceAngle;
        const endAng = startAng + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAng, endAng);
        ctx.closePath();

        if (i < shaded) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth || 1.6;
        ctx.stroke();
      }

      // Fraction label below scaled with radius
      const fs = Math.max(12, Math.min(32, Math.round(r * 0.22)));
      ctx.font = `bold ${fs}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${shaded} / ${total}`, cx, cy + r + 8);
    }

    ctx.restore();
  };

  const drawStudentGeometricDiagram = (ctx: CanvasRenderingContext2D, shape: any, strokeColor: string, lineWidth: number) => {
    const { start, end } = shape;
    if (!start || !end) return;
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const color = strokeColor || shape.color || '#0f172a';
    const width = lineWidth || shape.width || 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (shape.geoType === 'rightTriangle') {
      // Right-angled triangle (A at top-left, C at bottom-left, B at bottom-right)
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.stroke();

      // Right angle square marker at (x1, y2)
      const sq = 14;
      ctx.strokeRect(x1, y2 - sq, sq, sq);

      // Labels
      ctx.font = 'italic 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('a', x1 - 6, (y1 + y2) / 2);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('b', (x1 + x2) / 2, y2 + 6);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('c', (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 4);
    } else if (shape.geoType === 'equilateralTriangle') {
      // Equilateral triangle with side ticks and 60° angle marks
      const apexX = cx;
      const apexY = y1;
      const leftX = x1;
      const leftY = y2;
      const rightX = x2;
      const rightY = y2;

      ctx.beginPath();
      ctx.moveTo(apexX, apexY);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.stroke();

      // Equal length side tick marks
      const drawTick = (mx: number, my: number, ang: number) => {
        const tLen = 6;
        ctx.beginPath();
        ctx.moveTo(mx - tLen * Math.cos(ang), my - tLen * Math.sin(ang));
        ctx.lineTo(mx + tLen * Math.cos(ang), my + tLen * Math.sin(ang));
        ctx.stroke();
      };
      drawTick((apexX + leftX) / 2, (apexY + leftY) / 2, 0.5);
      drawTick((apexX + rightX) / 2, (apexY + rightY) / 2, -0.5);
      drawTick(cx, y2, Math.PI / 2);

      // Angle arc marks
      ctx.strokeStyle = '#0284c7';
      ctx.beginPath(); ctx.arc(leftX, leftY, 20, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(rightX, rightY, 20, Math.PI, Math.PI + Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(apexX, apexY, 20, Math.PI / 3, Math.PI - Math.PI / 3); ctx.stroke();
    } else if (shape.geoType === 'circleRadius') {
      // Circle with center O and radius line OP
      const r = Math.min((x2 - x1), (y2 - y1)) / 2 - 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Center point O
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Radius line from O to (cx + r, cy)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();

      // Point P on circumference
      ctx.beginPath();
      ctx.arc(cx + r, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('O', cx - 7, cy);

      ctx.textAlign = 'left';
      ctx.fillText('P', cx + r + 6, cy);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#0284c7';
      ctx.fillText('r', cx + r / 2, cy - 4);
    } else if (shape.geoType === 'unitCircle') {
      const r = Math.min((x2 - x1), (y2 - y1)) / 2 - 20;

      // X and Y Axes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x1 + 6, cy); ctx.lineTo(x2 - 6, cy);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(x2 - 6, cy); ctx.lineTo(x2 - 12, cy - 3.5); ctx.lineTo(x2 - 12, cy + 3.5); ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, y2 - 6); ctx.lineTo(cx, y1 + 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, y1 + 6); ctx.lineTo(cx - 3.5, y1 + 12); ctx.lineTo(cx + 3.5, y1 + 12); ctx.fill();

      ctx.font = 'italic 11px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right'; ctx.fillText('x', x2 - 14, cy - 6);
      ctx.textAlign = 'left'; ctx.fillText('y', cx + 6, y1 + 16);
      ctx.fillText('O', cx - 12, cy + 12);

      // Unit Circle
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      const keyAngles = [
        { deg: 0, rad: '0, 2π' },
        { deg: 30, rad: 'π/6' },
        { deg: 45, rad: 'π/4' },
        { deg: 60, rad: 'π/3' },
        { deg: 90, rad: 'π/2' },
        { deg: 120, rad: '2π/3' },
        { deg: 135, rad: '3π/4' },
        { deg: 150, rad: '5π/6' },
        { deg: 180, rad: 'π' },
        { deg: 210, rad: '7π/6' },
        { deg: 225, rad: '5π/4' },
        { deg: 240, rad: '4π/3' },
        { deg: 270, rad: '3π/2' },
        { deg: 300, rad: '5π/3' },
        { deg: 315, rad: '7π/4' },
        { deg: 330, rad: '11π/6' }
      ];

      keyAngles.forEach((ka) => {
        const radVal = (ka.deg * Math.PI) / 180;
        const px = cx + r * Math.cos(radVal);
        const py = cy - r * Math.sin(radVal);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = (ka.deg % 90 === 0) ? '#0284c7' : '#0f172a';
        ctx.beginPath();
        ctx.arc(px, py, (ka.deg % 90 === 0) ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        const labelDist = r + 13;
        const lx = cx + labelDist * Math.cos(radVal);
        const ly = cy - labelDist * Math.sin(radVal);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = (ka.deg % 90 === 0) ? '#0369a1' : '#475569';
        ctx.textAlign = (Math.cos(radVal) > 0.3) ? 'left' : (Math.cos(radVal) < -0.3 ? 'right' : 'center');
        ctx.textBaseline = (Math.sin(radVal) > 0.3) ? 'bottom' : (Math.sin(radVal) < -0.3 ? 'top' : 'middle');
        ctx.fillText(`${ka.deg}° (${ka.rad})`, lx, ly);
      });
    }

    ctx.restore();
  };

  const drawStudent3dSolid = (ctx: CanvasRenderingContext2D, shape: any, strokeColor: string, lineWidth: number) => {
    const { start, end, solidType } = shape;
    if (!start || !end) return;
    const x1 = Math.min(start.x, end.x);
    const x2 = Math.max(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const y2 = Math.max(start.y, end.y);
    const w = x2 - x1;
    const h = y2 - y1;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const color = strokeColor || shape.color || '#0f172a';
    const width = lineWidth || shape.width || 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (solidType === 'cube') {
      const s = Math.min(w, h) * 0.72;
      const dx = s * 0.38;
      const dy = -s * 0.35;
      const fx = cx - s / 2 - dx / 2;
      const fy = cy - s / 2 - dy / 2;

      ctx.beginPath();
      ctx.rect(fx, fy, s, s);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + dx, fy + dy);
      ctx.lineTo(fx + s + dx, fy + dy);
      ctx.lineTo(fx + s, fy);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fx + s, fy);
      ctx.lineTo(fx + s + dx, fy + dy);
      ctx.lineTo(fx + s + dx, fy + s + dy);
      ctx.lineTo(fx + s, fy + s);
      ctx.closePath();
      ctx.stroke();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.beginPath();
      ctx.moveTo(fx, fy + s);
      ctx.lineTo(fx + dx, fy + s + dy);
      ctx.lineTo(fx + dx, fy + dy);
      ctx.moveTo(fx + dx, fy + s + dy);
      ctx.lineTo(fx + s + dx, fy + s + dy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'italic 12px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText('s', fx + s / 2, fy + s + 15);
    } else if (solidType === 'cuboid') {
      const l = w * 0.72;
      const hc = h * 0.65;
      const dx = w * 0.28;
      const dy = -h * 0.3;
      const fx = cx - l / 2 - dx / 2;
      const fy = cy - hc / 2 - dy / 2;

      ctx.beginPath();
      ctx.rect(fx, fy, l, hc);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + dx, fy + dy);
      ctx.lineTo(fx + l + dx, fy + dy);
      ctx.lineTo(fx + l, fy);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fx + l, fy);
      ctx.lineTo(fx + l + dx, fy + dy);
      ctx.lineTo(fx + l + dx, fy + hc + dy);
      ctx.lineTo(fx + l, fy + hc);
      ctx.closePath();
      ctx.stroke();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.beginPath();
      ctx.moveTo(fx, fy + hc);
      ctx.lineTo(fx + dx, fy + hc + dy);
      ctx.lineTo(fx + dx, fy + dy);
      ctx.moveTo(fx + dx, fy + hc + dy);
      ctx.lineTo(fx + l + dx, fy + hc + dy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'italic 11px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText('l', fx + l / 2, fy + hc + 14);
      ctx.textAlign = 'left';
      ctx.fillText('h', fx + l + dx + 6, fy + hc / 2 + dy / 2);
      ctx.textAlign = 'center';
      ctx.fillText('b', fx + l + dx / 2 + 8, fy + dy / 2 - 4);
    } else if (solidType === 'cylinder') {
      const rx = w / 2 - 10;
      const ry = rx * 0.32;
      const topCy = y1 + ry + 6;
      const botCy = y2 - ry - 6;

      ctx.beginPath();
      ctx.ellipse(cx, topCy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - rx, topCy);
      ctx.lineTo(cx - rx, botCy);
      ctx.moveTo(cx + rx, topCy);
      ctx.lineTo(cx + rx, botCy);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, botCy, rx, ry, 0, 0, Math.PI);
      ctx.stroke();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx, botCy, rx, ry, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, topCy);
      ctx.lineTo(cx, botCy);
      ctx.moveTo(cx, topCy);
      ctx.lineTo(cx + rx, topCy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'italic 11px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText('r', cx + rx / 2, topCy - 5);
      ctx.textAlign = 'left';
      ctx.fillText('h', cx + 8, (topCy + botCy) / 2);
    } else if (solidType === 'cone') {
      const rx = w / 2 - 10;
      const ry = rx * 0.32;
      const apexY = y1 + 8;
      const botCy = y2 - ry - 6;

      ctx.beginPath();
      ctx.moveTo(cx, apexY);
      ctx.lineTo(cx - rx, botCy);
      ctx.moveTo(cx, apexY);
      ctx.lineTo(cx + rx, botCy);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, botCy, rx, ry, 0, 0, Math.PI);
      ctx.stroke();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx, botCy, rx, ry, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, apexY);
      ctx.lineTo(cx, botCy);
      ctx.moveTo(cx, botCy);
      ctx.lineTo(cx + rx, botCy);
      ctx.stroke();

      const sq = 8;
      ctx.strokeRect(cx, botCy - sq, sq, sq);
      ctx.setLineDash([]);

      ctx.font = 'italic 11px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText('h', cx - 6, (apexY + botCy) / 2);
      ctx.textAlign = 'center';
      ctx.fillText('r', cx + rx / 2, botCy - 5);
      ctx.textAlign = 'left';
      ctx.fillText('l', cx + rx / 2 + 8, (apexY + botCy) / 2 - 4);
    } else if (solidType === 'sphere') {
      const r = Math.min(w, h) / 2 - 10;
      const ry = r * 0.32;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, r, ry, 0, 0, Math.PI);
      ctx.stroke();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, ry, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'italic 11px sans-serif';
      ctx.fillText('O', cx - 8, cy - 6);
      ctx.textAlign = 'center';
      ctx.fillText('r', cx + r / 2, cy - 6);
    } else if (solidType === 'triangularPrism') {
      const fw = w * 0.62;
      const fh = h * 0.7;
      const dx = w * 0.35;
      const dy = -h * 0.28;

      const fA = { x: x1 + fw / 2, y: y2 - fh };
      const fB = { x: x1, y: y2 };
      const fC = { x: x1 + fw, y: y2 };

      ctx.beginPath();
      ctx.moveTo(fA.x, fA.y);
      ctx.lineTo(fB.x, fB.y);
      ctx.lineTo(fC.x, fC.y);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fA.x, fA.y);
      ctx.lineTo(fA.x + dx, fA.y + dy);
      ctx.lineTo(fC.x + dx, fC.y + dy);
      ctx.lineTo(fC.x, fC.y);
      ctx.moveTo(fA.x + dx, fA.y + dy);
      ctx.lineTo(fB.x + dx, fB.y + dy);
      ctx.stroke();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.beginPath();
      ctx.moveTo(fB.x, fB.y);
      ctx.lineTo(fB.x + dx, fB.y + dy);
      ctx.lineTo(fC.x + dx, fC.y + dy);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (solidType === 'squarePyramid') {
      const bw = w * 0.8;
      const bh = h * 0.36;
      const apexY = y1 + 8;
      const baseCenterY = y2 - bh / 2;

      const pA = { x: cx - bw / 2 + 16, y: y2 - bh };
      const pB = { x: cx + bw / 2, y: y2 - bh };
      const pC = { x: cx + bw / 2 - 16, y: y2 };
      const pD = { x: cx - bw / 2, y: y2 };

      ctx.beginPath();
      ctx.moveTo(pD.x, pD.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(pB.x, pB.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, apexY); ctx.lineTo(pD.x, pD.y);
      ctx.moveTo(cx, apexY); ctx.lineTo(pC.x, pC.y);
      ctx.moveTo(cx, apexY); ctx.lineTo(pB.x, pB.y);
      ctx.stroke();

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.beginPath();
      ctx.moveTo(pD.x, pD.y); ctx.lineTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y);
      ctx.moveTo(cx, apexY); ctx.lineTo(pA.x, pA.y);
      ctx.moveTo(cx, apexY); ctx.lineTo(cx, baseCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'italic 11px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText('h', cx - 6, (apexY + baseCenterY) / 2);
    }

    ctx.restore();
  };

  // Helper to render whiteboard page content (used by both live canvas and PDF export)
  const renderWhiteboardPage = (
    ctx: CanvasRenderingContext2D,
    page: any,
    displayWidth: number,
    displayHeight: number,
    options?: {
      isExport?: boolean;
      pageNum?: number;
      totalPages?: number;
      watermarkTitle?: string;
      watermarkOnly?: boolean;
      offsetX?: number;
      offsetY?: number;
    }
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

    const hasOffset = Boolean(options?.offsetX || options?.offsetY);
    if (hasOffset) {
      ctx.save();
      ctx.translate(options?.offsetX || 0, options?.offsetY || 0);
    }

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
      let { start, end } = sh;
      if ((!start || !end) && Array.isArray(sh.points) && sh.points.length >= 2) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        sh.points.forEach((p: any) => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
        start = { x: minX, y: minY };
        end = { x: maxX, y: maxY };
        sh.start = start;
        sh.end = end;
      }
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

      if ((type === 'image' || type === 'equation') && (sh.dataUrl || sh.svgDataUrl)) {
        const img = getCachedImage(sh.dataUrl || sh.svgDataUrl);
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

      if (sh.rotation && typeof sh.rotation === 'number' && sh.rotation !== 0) {
        const rotRad = (sh.rotation * Math.PI) / 180;
        ctx.translate(cx, cy);
        ctx.rotate(rotRad);
        ctx.translate(-cx, -cy);
      }

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

        // Endpoint dots (matching teacher whiteboard)
        const dotRadius = Math.max(2, lineWidth * 1.2);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(start.x, start.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        if (type === 'line' || type === 'arrow') {
          ctx.beginPath();
          ctx.arc(end.x, end.y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'angleArc' || type === 'arc') {
        const vx = (sh.vertex && typeof sh.vertex.x === 'number') ? sh.vertex.x : cx;
        const vy = (sh.vertex && typeof sh.vertex.y === 'number') ? sh.vertex.y : cy;
        const arcR = sh.radius || 38;
        const sAngle = typeof sh.startAngle === 'number' ? sh.startAngle : 0;
        const eAngle = typeof sh.endAngle === 'number' ? sh.endAngle : Math.PI / 2;
        const anticlockwise = sh.anticlockwise !== undefined ? sh.anticlockwise : false;

        if (sh.fill && sh.fill !== 'transparent') {
          ctx.save();
          ctx.fillStyle = sh.fill;
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.arc(vx, vy, arcR, sAngle, eAngle, anticlockwise);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(vx, vy, arcR, sAngle, eAngle, anticlockwise);
        ctx.stroke();
      } else if (type === 'numberLine') {
        drawStudentNumberLine(ctx, sh, strokeColor, lineWidth);
      } else if (type === 'coordinateAxes') {
        drawStudentCoordinateAxes(ctx, sh, strokeColor, lineWidth, isDark);
      } else if (type === 'vennDiagram') {
        drawStudentVennDiagram(ctx, sh, strokeColor, lineWidth);
      } else if (type === 'fractionModel') {
        drawStudentFractionModel(ctx, sh, strokeColor, lineWidth);
      } else if (type === 'geometricDiagram') {
        drawStudentGeometricDiagram(ctx, sh, strokeColor, lineWidth);
      } else if (type === '3dSolid') {
        drawStudent3dSolid(ctx, sh, strokeColor, lineWidth);
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
      } else if (type === 'polygon' && Array.isArray(sh.points) && sh.points.length >= 3) {
        ctx.beginPath();
        sh.points.forEach((pt: any, idx: number) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        if (isSolid) {
          ctx.save();
          ctx.fillStyle = strokeColor;
          ctx.globalAlpha = fillOpacity;
          ctx.fill();
          ctx.restore();
        }
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
        const rawData = Array.isArray(sh.data) && sh.data.length ? sh.data : [40, 65, 50, 80, 55];
        const data = rawData.map((v: any) => Math.max(0, Number(v) || 0));
        const labels = Array.isArray(sh.labels) && sh.labels.length ? sh.labels : (sh.categories || []);
        const title = (sh.title || '').trim();
        const xAxisLabel = (sh.xAxisLabel || '').trim();
        const yAxisLabel = (sh.yAxisLabel || '').trim();
        const showValues = sh.showValues !== false;
        const showAxisLabels = sh.showAxisLabels !== false;

        const keyText = (sh.keyText || '').trim();
        const hasTitle = Boolean(title);
        const hasXLabel = Boolean(xAxisLabel && showAxisLabels);
        const hasYLabel = Boolean(yAxisLabel && showAxisLabels);
        const hasKey = Boolean(keyText);

        const padL = Math.max(hasYLabel ? 56 : 42, Math.min(75, w * 0.16));
        const padR = 20;
        const padT = hasTitle ? Math.max(34, Math.min(50, h * 0.15)) : 22;
        const padB = Math.max(hasXLabel ? (hasKey ? 64 : 48) : (hasKey ? 48 : 34), Math.min(80, h * 0.22));
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;

        if (chartW > 0 && chartH > 0) {
          const getNiceMax = (val: number) => {
            if (val <= 5) return 5;
            if (val <= 10) return 10;
            if (val <= 20) return 20;
            if (val <= 25) return 25;
            if (val <= 50) return 50;
            if (val <= 100) return 100;
            const p = Math.pow(10, Math.floor(Math.log10(val)));
            const factor = val / p;
            if (factor <= 2) return 2 * p;
            if (factor <= 5) return 5 * p;
            return 10 * p;
          };

          const maxVal = Math.max(...data, 1);
          const tickMax = getNiceMax(maxVal);
          const n = data.length;
          const barW = Math.max(8, (chartW / n) * 0.58);
          const gap = (chartW - n * barW) / (n + 1);

          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x1 + padL, y1 + padT, chartW, chartH);

          if (hasTitle) {
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#111827';
            ctx.fillText(title, x1 + w / 2, y1 + 8);
          }

          const numTicks = 4;
          ctx.font = '10px "Segoe UI", sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          for (let t = 0; t <= numTicks; t++) {
            const frac = t / numTicks;
            const valNum = Math.round(tickMax * frac);
            const gy = y1 + padT + chartH - frac * chartH;
            ctx.beginPath();
            ctx.strokeStyle = t === 0 ? strokeColor : 'rgba(156, 163, 175, 0.3)';
            ctx.lineWidth = t === 0 ? 1.5 : 1;
            ctx.moveTo(x1 + padL, gy);
            ctx.lineTo(x1 + padL + chartW, gy);
            ctx.stroke();

            if (showAxisLabels) {
              ctx.fillStyle = '#4b5563';
              ctx.fillText(String(valNum), x1 + padL - 6, gy);
            }
          }

          if (hasYLabel) {
            ctx.save();
            ctx.translate(x1 + 14, y1 + padT + chartH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.font = 'bold 11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#374151';
            ctx.fillText(yAxisLabel, 0, 0);
            ctx.restore();
          }

          const barColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#8b5cf6', '#06b6d4', '#ec4899'];
          for (let i = 0; i < n; i++) {
            const barH = (data[i] / tickMax) * chartH;
            const bx = x1 + padL + gap + i * (barW + gap);
            const by = y1 + padT + chartH - barH;

            ctx.fillStyle = barColors[i % barColors.length];
            ctx.fillRect(bx, by, barW, barH);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, barW, barH);

            if (showValues) {
              ctx.font = 'bold 11px "Segoe UI", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = '#1e293b';
              ctx.fillText(String(data[i]), bx + barW / 2, by - 3);
            }

            const cat = (labels[i] !== undefined && labels[i] !== '') ? String(labels[i]) : String(i + 1);
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#374151';
            ctx.fillText(cat, bx + barW / 2, y1 + padT + chartH + 5);
          }

          if (hasXLabel) {
            ctx.font = 'bold 11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#374151';
            ctx.fillText(xAxisLabel, x1 + padL + chartW / 2, y1 + padT + chartH + 22);
          }

          if (hasKey) {
            ctx.font = 'italic 10.5px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#6b7280';
            const keyY = hasXLabel ? (y1 + padT + chartH + 38) : (y1 + padT + chartH + 20);
            ctx.fillText(keyText, x1 + padL + chartW / 2, keyY);
          }

          ctx.restore();
        }
      } else if (type === 'pieChart') {
        const rawData = Array.isArray(sh.data) && sh.data.length ? sh.data : [30, 25, 20, 15, 10];
        const data = rawData.map((v: any) => Math.max(0, Number(v) || 0));
        const labels = Array.isArray(sh.labels) && sh.labels.length ? sh.labels : (sh.categories || []);
        const title = (sh.title || '').trim();
        const showValues = sh.showValues !== false;
        const total = data.reduce((s: number, v: number) => s + v, 0) || 1;

        const keyText = (sh.keyText || '').trim();
        const hasTitle = Boolean(title);
        const hasKey = Boolean(keyText);
        const topOffset = hasTitle ? 28 : 10;
        const bottomOffset = hasKey ? 24 : 10;
        const availableH = h - topOffset - bottomOffset;
        const rad = Math.min(w - 24, availableH) / 2 - 8;

        if (rad > 0) {
          const pieCx = cx;
          const pieCy = y1 + topOffset + availableH / 2;

          ctx.save();
          if (hasTitle) {
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#111827';
            ctx.fillText(title, cx, y1 + 8);
          }

          const sliceColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];
          let startA = -Math.PI / 2;

          for (let i = 0; i < data.length; i++) {
            const sweep = (data[i] / total) * Math.PI * 2;
            const endA = startA + sweep;
            const midA = startA + sweep / 2;

            ctx.beginPath();
            ctx.moveTo(pieCx, pieCy);
            ctx.arc(pieCx, pieCy, rad, startA, endA);
            ctx.closePath();
            ctx.fillStyle = sliceColors[i % sliceColors.length];
            ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.stroke();

            const val = data[i];
            const pct = Math.round((val / total) * 100);
            const cat = (labels[i] !== undefined && labels[i] !== '') ? String(labels[i]) : ('Item ' + (i + 1));

            let labelText = '';
            if (showValues) {
              labelText = cat ? (cat + ': ' + val + ' (' + pct + '%)') : (val + ' (' + pct + '%)');
            } else {
              labelText = cat ? (cat + ' (' + pct + '%)') : (pct + '%');
            }

            if (sweep >= 0.28) {
              const textR = rad * 0.65;
              const tx = pieCx + Math.cos(midA) * textR;
              const ty = pieCy + Math.sin(midA) * textR;

              ctx.save();
              ctx.font = 'bold 11px "Segoe UI", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
              ctx.shadowBlur = 3;
              ctx.fillStyle = '#ffffff';
              const renderStr = sweep < 0.5 ? (pct + '%') : labelText;
              ctx.fillText(renderStr, tx, ty);
              ctx.restore();
            } else if (sweep > 0.05) {
              const lx1 = pieCx + Math.cos(midA) * rad;
              const ly1 = pieCy + Math.sin(midA) * rad;
              const lx2 = pieCx + Math.cos(midA) * (rad + 12);
              const ly2 = pieCy + Math.sin(midA) * (rad + 12);

              ctx.beginPath();
              ctx.strokeStyle = '#4b5563';
              ctx.lineWidth = 1;
              ctx.moveTo(lx1, ly1);
              ctx.lineTo(lx2, ly2);
              ctx.stroke();

              ctx.font = '10px "Segoe UI", sans-serif';
              ctx.textAlign = Math.cos(midA) >= 0 ? 'left' : 'right';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#1e293b';
              ctx.fillText(pct + '%', lx2 + (Math.cos(midA) >= 0 ? 3 : -3), ly2);
            }

            startA = endA;
          }

          if (hasKey) {
            ctx.font = 'italic 10.5px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = '#6b7280';
            ctx.fillText(keyText, cx, y1 + h - 4);
          }

          ctx.restore();
        }
      } else if (type === 'horizontalBarChart') {
        const rawData = Array.isArray(sh.data) && sh.data.length ? sh.data : [40, 65, 50, 80, 55];
        const data = rawData.map((v: any) => Math.max(0, Number(v) || 0));
        const labels = Array.isArray(sh.labels) && sh.labels.length ? sh.labels : (sh.categories || []);
        const title = (sh.title || '').trim();
        const xAxisLabel = (sh.xAxisLabel || '').trim();
        const yAxisLabel = (sh.yAxisLabel || '').trim();
        const showValues = sh.showValues !== false;
        const showAxisLabels = sh.showAxisLabels !== false;

        const keyText = (sh.keyText || '').trim();
        const hasTitle = Boolean(title);
        const hasXLabel = Boolean(xAxisLabel && showAxisLabels);
        const hasYLabel = Boolean(yAxisLabel && showAxisLabels);
        const hasKey = Boolean(keyText);

        const padL = Math.max(hasYLabel ? 65 : 48, Math.min(85, w * 0.22));
        const padR = showValues ? 38 : 20;
        const padT = hasTitle ? Math.max(34, Math.min(50, h * 0.15)) : 22;
        const padB = Math.max(hasXLabel ? (hasKey ? 58 : 45) : (hasKey ? 42 : 30), Math.min(75, h * 0.20));
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;

        if (chartW > 0 && chartH > 0) {
          const getNiceMax = (val: number) => {
            if (val <= 5) return 5;
            if (val <= 10) return 10;
            if (val <= 20) return 20;
            if (val <= 25) return 25;
            if (val <= 50) return 50;
            if (val <= 100) return 100;
            const p = Math.pow(10, Math.floor(Math.log10(val)));
            const factor = val / p;
            if (factor <= 2) return 2 * p;
            if (factor <= 5) return 5 * p;
            return 10 * p;
          };

          const maxVal = Math.max(...data, 1);
          const tickMax = getNiceMax(maxVal);
          const n = data.length;
          const barH = Math.max(6, (chartH / n) * 0.58);
          const gap = (chartH - n * barH) / (n + 1);

          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x1 + padL, y1 + padT, chartW, chartH);

          if (hasTitle) {
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#111827';
            ctx.fillText(title, x1 + w / 2, y1 + 8);
          }

          const numTicks = 4;
          ctx.font = '10px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          for (let t = 0; t <= numTicks; t++) {
            const frac = t / numTicks;
            const valNum = Math.round(tickMax * frac);
            const gx = x1 + padL + frac * chartW;

            ctx.beginPath();
            ctx.strokeStyle = t === 0 ? strokeColor : 'rgba(156, 163, 175, 0.3)';
            ctx.lineWidth = t === 0 ? 1.5 : 1;
            ctx.moveTo(gx, y1 + padT);
            ctx.lineTo(gx, y1 + padT + chartH);
            ctx.stroke();

            if (showAxisLabels) {
              ctx.fillStyle = '#4b5563';
              ctx.fillText(String(valNum), gx, y1 + padT + chartH + 4);
            }
          }

          if (hasYLabel) {
            ctx.save();
            ctx.translate(x1 + 14, y1 + padT + chartH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.font = 'bold 11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#374151';
            ctx.fillText(yAxisLabel, 0, 0);
            ctx.restore();
          }

          const barColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#8b5cf6', '#06b6d4', '#ec4899'];
          for (let i = 0; i < n; i++) {
            const barW = (data[i] / tickMax) * chartW;
            const bx = x1 + padL;
            const by = y1 + padT + gap + i * (barH + gap);

            ctx.fillStyle = barColors[i % barColors.length];
            ctx.fillRect(bx, by, barW, barH);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, barW, barH);

            const cat = (labels[i] !== undefined && labels[i] !== '') ? String(labels[i]) : String(i + 1);
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#374151';
            ctx.fillText(cat, bx - 6, by + barH / 2);

            if (showValues) {
              ctx.font = 'bold 11px "Segoe UI", sans-serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#1e293b';
              ctx.fillText(String(data[i]), bx + barW + 5, by + barH / 2);
            }
          }

          if (hasXLabel) {
            ctx.font = 'bold 11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#374151';
            ctx.fillText(xAxisLabel, x1 + padL + chartW / 2, y1 + padT + chartH + 18);
          }

          if (hasKey) {
            ctx.font = 'italic 10.5px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#6b7280';
            const keyY = hasXLabel ? (y1 + padT + chartH + 34) : (y1 + padT + chartH + 18);
            ctx.fillText(keyText, x1 + padL + chartW / 2, keyY);
          }

          ctx.restore();
        }
      } else if (type === 'pictograph') {
        const rawData = Array.isArray(sh.data) && sh.data.length ? sh.data : [3, 5, 2, 4, 3];
        const data = rawData.map((v: any) => Math.max(0, Math.round(Number(v) || 0)));
        const labels = Array.isArray(sh.labels) && sh.labels.length ? sh.labels : (sh.categories || []);
        const title = (sh.title || '').trim();
        const showValues = sh.showValues !== false;

        const keyText = sh.keyText !== undefined ? (sh.keyText || '').trim() : 'Key: 1 symbol = 1 item';
        const hasTitle = Boolean(title);
        const hasKey = Boolean(keyText);
        const padL = 60;
        const padR = showValues ? 34 : 16;
        const padT = hasTitle ? 32 : 18;
        const padB = hasKey ? 26 : 14;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;

        if (chartW > 0 && chartH > 0) {
          const n = data.length;
          const rowH = chartH / n;
          const maxCount = Math.max(...data, 1);
          const symbolColors = ['#2563eb', '#16a34a', '#eab308', '#ea580c', '#8b5cf6', '#06b6d4', '#ec4899'];
          const symbolShape = sh.symbolShape || 'circle';

          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x1 + padL, y1 + padT, chartW, chartH);

          if (hasTitle) {
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#111827';
            ctx.fillText(title, x1 + w / 2, y1 + 8);
          }

          for (let i = 0; i < n; i++) {
            const count = data[i];
            const sy = y1 + padT + (i + 0.5) * rowH;

            if (i > 0) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(156, 163, 175, 0.25)';
              ctx.lineWidth = 1;
              ctx.moveTo(x1 + padL, y1 + padT + i * rowH);
              ctx.lineTo(x1 + padL + chartW, y1 + padT + i * rowH);
              ctx.stroke();
            }

            const cat = (labels[i] !== undefined && labels[i] !== '') ? String(labels[i]) : ('Item ' + (i + 1));
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#374151';
            ctx.fillText(cat, x1 + padL - 8, sy);

            const cellW = (chartW - 8) / Math.max(maxCount, count, 1);
            const symSize = Math.min(cellW * 0.75, rowH * 0.52, 26);
            ctx.fillStyle = symbolColors[i % symbolColors.length];

            for (let j = 0; j < count; j++) {
              const sx = x1 + padL + 4 + j * cellW + (cellW - symSize) / 2;
              const cxS = sx + symSize / 2;
              const r = symSize / 2;

              ctx.beginPath();
              if (symbolShape === 'circle') {
                ctx.arc(cxS, sy, r, 0, Math.PI * 2);
              } else if (symbolShape === 'square') {
                ctx.rect(cxS - r, sy - r, symSize, symSize);
              } else if (symbolShape === 'triangle') {
                const th = r * Math.sqrt(3);
                ctx.moveTo(cxS, sy - r);
                ctx.lineTo(cxS - r, sy + th * 0.5);
                ctx.lineTo(cxS + r, sy + th * 0.5);
                ctx.closePath();
              } else if (symbolShape === 'star') {
                const spikes = 5;
                const outer = r;
                const inner = r * 0.4;
                for (let k = 0; k < spikes * 2; k++) {
                  const rad = k % 2 === 0 ? outer : inner;
                  const angle = -Math.PI / 2 + (Math.PI * k) / spikes;
                  const px = cxS + rad * Math.cos(angle);
                  const py = sy + rad * Math.sin(angle);
                  if (k === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
              } else if (symbolShape === 'diamond') {
                ctx.moveTo(cxS, sy - r);
                ctx.lineTo(cxS + r, sy);
                ctx.lineTo(cxS, sy + r);
                ctx.lineTo(cxS - r, sy);
                ctx.closePath();
              } else {
                ctx.arc(cxS, sy, r, 0, Math.PI * 2);
              }
              ctx.fill();
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }

            if (showValues) {
              ctx.font = 'bold 11px "Segoe UI", sans-serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#1e293b';
              ctx.fillText(String(count), x1 + padL + chartW + 8, sy);
            }
          }

          if (hasKey) {
            ctx.font = 'italic 10.5px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#6b7280';
            ctx.fillText(keyText, x1 + padL + chartW / 2, y1 + padT + chartH + 7);
          }

          ctx.restore();
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
        if (!stroke || stroke.mode === 'eraser') return;
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

    // 5. Draw active Educational Instruments (Ruler & Protractor synced from teacher)
    if (!options?.isExport && page?.eduInstruments) {
      if (page.eduInstruments.ruler && page.eduInstruments.ruler.visible) {
        drawStudentRuler(ctx, page.eduInstruments.ruler);
      }
      if (page.eduInstruments.protractor && page.eduInstruments.protractor.visible) {
        drawStudentProtractor(ctx, page.eduInstruments.protractor);
      }
      if (page.eduInstruments.compass && page.eduInstruments.compass.visible) {
        drawStudentCompass(ctx, page.eduInstruments.compass);
      }
      if (page.eduInstruments.setSquare && page.eduInstruments.setSquare.visible) {
        drawStudentSetSquare(ctx, page.eduInstruments.setSquare);
      }
    }

    if (hasOffset) {
      ctx.restore();
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

      if (!options?.watermarkOnly) {
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
    if (page?.eduInstruments?.ruler?.visible && typeof page.eduInstruments.ruler.y === 'number') {
      if (page.eduInstruments.ruler.y + 120 > computedHeight) computedHeight = Math.ceil(page.eduInstruments.ruler.y + 120);
    }
    if (page?.eduInstruments?.protractor?.visible && typeof page.eduInstruments.protractor.y === 'number') {
      const pScale = typeof page.eduInstruments.protractor.scale === 'number' && page.eduInstruments.protractor.scale > 0.1 ? page.eduInstruments.protractor.scale : 1.0;
      if (page.eduInstruments.protractor.y + 260 * pScale > computedHeight) computedHeight = Math.ceil(page.eduInstruments.protractor.y + 260 * pScale);
    }
    if (page?.eduInstruments?.compass?.visible && typeof page.eduInstruments.compass.y === 'number') {
      if (page.eduInstruments.compass.y + 200 > computedHeight) computedHeight = Math.ceil(page.eduInstruments.compass.y + 200);
    }
    if (page?.eduInstruments?.setSquare?.visible && typeof page.eduInstruments.setSquare.y === 'number') {
      const sqSizeCm = typeof page.eduInstruments.setSquare.sizeCm === 'number' && page.eduInstruments.setSquare.sizeCm >= 3 ? page.eduInstruments.setSquare.sizeCm : 7;
      const sqHeight = sqSizeCm * 36 * 1.8;
      if (page.eduInstruments.setSquare.y + sqHeight > computedHeight) computedHeight = Math.ceil(page.eduInstruments.setSquare.y + sqHeight);
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
    if (currentPermission === 'chalk' && isDrawingChalkRef.current) {
      if (chalkMode === 'eraser') {
        const lastP = lastErasePosRef.current || { x, y };
        const newPoints = interpolatePoints(lastP, { x, y }, 12);
        lastErasePosRef.current = { x, y };

        for (const pt of newPoints) {
          erasePointsBatchRef.current.push({ x: pt.x, y: pt.y, radius: 24 });
        }

        let updatedRemaining: any[] = [];
        setPages((prevPages) => {
          const next = [...prevPages];
          const page = next[viewingPageIndex];
          if (page && page.strokes) {
            const initialCount = page.strokes.length;
            const filtered = page.strokes.filter(
              (s: any) => s.mode !== 'eraser' && !strokeIntersectsErasePoints(s, newPoints)
            );
            if (filtered.length !== initialCount) {
              next[viewingPageIndex] = { ...page, strokes: filtered };
            }
            updatedRemaining = filtered;
          }
          return next;
        });

        const now = Date.now();
        if (now - lastEraseEmitRef.current > 40 && erasePointsBatchRef.current.length > 0) {
          lastEraseEmitRef.current = now;
          const batch = [...erasePointsBatchRef.current];
          erasePointsBatchRef.current = [];
          socketRef.current?.emit('whiteboard:student_erase', {
            grade: effectiveGrade,
            teacherId,
            pageIndex: viewingPageIndex,
            erasePoints: batch,
            remainingStrokes: updatedRemaining,
            studentName: studentName || 'Student'
          });
        }
        return;
      }

      if (chalkStrokeRef.current) {
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
      if (chalkMode === 'eraser') {
        isDrawingChalkRef.current = true;
        lastErasePosRef.current = { x, y };
        erasePointsBatchRef.current = [{ x, y, radius: 24 }];

        let updatedRemaining: any[] = [];
        setPages((prevPages) => {
          const next = [...prevPages];
          const page = next[viewingPageIndex];
          if (page && page.strokes) {
            const initialCount = page.strokes.length;
            const filtered = page.strokes.filter(
              (s: any) => s.mode !== 'eraser' && !strokeIntersectsErasePoint(s, x, y, 24)
            );
            if (filtered.length !== initialCount) {
              next[viewingPageIndex] = { ...page, strokes: filtered };
            }
            updatedRemaining = filtered;
          }
          return next;
        });

        lastEraseEmitRef.current = Date.now();
        socketRef.current?.emit('whiteboard:student_erase', {
          grade: effectiveGrade,
          teacherId,
          pageIndex: viewingPageIndex,
          erasePoints: [{ x, y, radius: 24 }],
          remainingStrokes: updatedRemaining,
          studentName: studentName || 'Student'
        });
        return;
      }

      isDrawingChalkRef.current = true;
      const page = pages[viewingPageIndex];
      const isDark = page?.boardType === 'black' || page?.boardType === 'green';
      const strokeColor = isDark && chalkColor === '#0f172a' ? '#ffffff' : chalkColor;
      const strokeWidth = chalkWidth;

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

    if (currentPermission === 'chalk' && isDrawingChalkRef.current) {
      isDrawingChalkRef.current = false;
      lastErasePosRef.current = null;

      if (chalkMode === 'eraser') {
        const batch = erasePointsBatchRef.current.length > 0 ? [...erasePointsBatchRef.current] : [];
        erasePointsBatchRef.current = [];
        const pageStrokes = pagesRef.current[viewingPageIndex]?.strokes || [];
        const remaining = pageStrokes.filter((s: any) => s && s.mode !== 'eraser');

        socketRef.current?.emit('whiteboard:student_erase', {
          grade: effectiveGrade,
          teacherId,
          pageIndex: viewingPageIndex,
          erasePoints: batch,
          remainingStrokes: remaining,
          studentName: studentName || 'Student'
        });
        return;
      }

      if (chalkStrokeRef.current) {
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

    // Cooldown throttle to prevent rapid double-click duplication
    const now = Date.now();
    if (now - lastReactionTimeRef.current < 600) return;
    lastReactionTimeRef.current = now;

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
      studentName: (studentName && studentName.trim()) || 'Student',
      studentId
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

  // One-Click "Export Class Notes as PDF": generates clean, complete PDF of all pages without cropping
  const handleExportPDF = async () => {
    if (!pages || !pages.length) return;
    setIsExportingPDF(true);
    try {
      const totalPgs = pages.length;
      let pdf: jsPDF | null = null;

      for (let i = 0; i < totalPgs; i++) {
        const page = pages[i];
        if (!page) continue;

        // 1. Preload any background or shape images
        if (page.background?.dataUrl) {
          await ensureImageLoaded(page.background.dataUrl);
        }
        if (page.shapes && Array.isArray(page.shapes)) {
          for (const sh of page.shapes) {
            if ((sh?.type === 'image' || sh?.type === 'equation') && (sh.dataUrl || sh.svgDataUrl)) {
              await ensureImageLoaded(sh.dataUrl || sh.svgDataUrl);
            }
          }
        }

        // 2. Measure the exact bounding box of all strokes, shapes, texts, widgets, and background
        let minX = Infinity;
        let maxX = 0;
        let minY = Infinity;
        let maxY = 0;
        let hasContent = false;

        if (page.strokes && Array.isArray(page.strokes)) {
          for (const st of page.strokes) {
            if (!st || st.mode === 'eraser' || !st.points) continue;
            const halfW = Math.max(1, ((st.width || 2) / 2) + 2);
            for (const pt of st.points) {
              if (typeof pt.x === 'number' && typeof pt.y === 'number') {
                hasContent = true;
                if (pt.x - halfW < minX) minX = pt.x - halfW;
                if (pt.x + halfW > maxX) maxX = pt.x + halfW;
                if (pt.y - halfW < minY) minY = pt.y - halfW;
                if (pt.y + halfW > maxY) maxY = pt.y + halfW;
              }
            }
          }
        }

        if (page.shapes && Array.isArray(page.shapes)) {
          for (const sh of page.shapes) {
            if (!sh) continue;
            hasContent = true;
            const strokeHalf = Math.max(1, ((sh.width || 2) / 2) + 2);
            const x1 = Math.min(sh.start?.x ?? sh.x ?? 0, sh.end?.x ?? (sh.x || 0) + (sh.width || 0)) - strokeHalf;
            const x2 = Math.max(sh.start?.x ?? sh.x ?? 0, sh.end?.x ?? (sh.x || 0) + (sh.width || 0)) + strokeHalf;
            const y1 = Math.min(sh.start?.y ?? sh.y ?? 0, sh.end?.y ?? (sh.y || 0) + (sh.height || 0)) - strokeHalf;
            const y2 = Math.max(sh.start?.y ?? sh.y ?? 0, sh.end?.y ?? (sh.y || 0) + (sh.height || 0)) + strokeHalf;
            if (x1 < minX) minX = x1;
            if (x2 > maxX) maxX = x2;
            if (y1 < minY) minY = y1;
            if (y2 > maxY) maxY = y2;
          }
        }

        if (page.texts && Array.isArray(page.texts)) {
          for (const tx of page.texts) {
            if (!tx || tx.text == null || tx.text === '') continue;
            hasContent = true;
            const x = tx.x || 0;
            const y = tx.y || 0;
            const fs = tx.fontSize || 20;
            const lines = String(tx.text).split('\n');
            const linesCount = lines.length;
            let maxLineChars = 10;
            lines.forEach((l) => { if (l.length > maxLineChars) maxLineChars = l.length; });
            const approxW = tx.sticky ? Math.max(140, maxLineChars * (fs * 0.7) + 30) : Math.max(100, maxLineChars * (fs * 0.65) + 20);
            const textH = linesCount * (fs * 1.35) + 30;
            if (x < minX) minX = x;
            if (x + approxW > maxX) maxX = x + approxW;
            if (y < minY) minY = y;
            if (y + textH > maxY) maxY = y + textH;
          }
        }

        if (page.widgets && Array.isArray(page.widgets)) {
          for (const w of page.widgets) {
            if (!w) continue;
            hasContent = true;
            const x = w.x || 60;
            const y = w.y || 60;
            const wWidth = w.type === 'poll' ? 360 : 260;
            const wHeight = w.type === 'poll' ? 220 : 80;
            if (x < minX) minX = x;
            if (x + wWidth > maxX) maxX = x + wWidth;
            if (y < minY) minY = y;
            if (y + wHeight > maxY) maxY = y + wHeight;
          }
        }

        if (page.background && page.background.dataUrl) {
          hasContent = true;
          const bg = page.background;
          const bx = bg.x || 0;
          const by = bg.y || 0;
          const bw = bg.w || 1200;
          const bh = bg.h || 800;
          if (bx < minX) minX = bx;
          if (bx + bw > maxX) maxX = bx + bw;
          if (by < minY) minY = by;
          if (by + bh > maxY) maxY = by + bh;
        }

        // Shift content if coordinates are negative
        const offsetX = (hasContent && minX < 0) ? Math.ceil(-minX + 24) : 0;
        const offsetY = (hasContent && minY < 0) ? Math.ceil(-minY + 24) : 0;

        const contentMaxX = hasContent ? Math.ceil(maxX + offsetX) : 1200;
        const contentMaxY = hasContent ? Math.ceil(maxY + offsetY) : 800;

        // Base dimensions: at least standard 1200 x 800, expanding dynamically to encompass all content
        const baseW = 1200;
        const baseH = (typeof page.height === 'number' && page.height > 0 && page.height <= 1200) ? page.height : 800;

        const whiteboardW = Math.max(baseW, contentMaxX + 40);
        const whiteboardH = Math.max(baseH, contentMaxY + 50);

        const HEADER_HEIGHT = 40;
        const FOOTER_HEIGHT = 30;

        const pageW = whiteboardW;
        const pageH = HEADER_HEIGHT + whiteboardH + FOOTER_HEIGHT;

        // Render at 1.5x scale for sharp text and fine pen strokes without massive memory footprint
        const exportScale = 1.5;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = Math.round(pageW * exportScale);
        offCanvas.height = Math.round(pageH * exportScale);
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) continue;

        offCtx.scale(exportScale, exportScale);

        // 1. Draw Header Banner in dedicated top zone
        offCtx.fillStyle = '#0f172a';
        offCtx.fillRect(0, 0, pageW, HEADER_HEIGHT);
        offCtx.fillStyle = '#f8fafc';
        offCtx.font = 'bold 13px "Plus Jakarta Sans", Arial, sans-serif';
        offCtx.textBaseline = 'middle';
        offCtx.textAlign = 'left';
        offCtx.fillText(
          `📚 EduAshram Class Notes • ${effectiveGrade} • Teacher: ${teacherName} • ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          18,
          HEADER_HEIGHT / 2
        );
        offCtx.textAlign = 'right';
        offCtx.fillText(`Page ${i + 1} of ${totalPgs}`, pageW - 18, HEADER_HEIGHT / 2);

        // 2. Draw Whiteboard Area with zero overlap from header/footer
        offCtx.save();
        offCtx.translate(0, HEADER_HEIGHT);
        renderWhiteboardPage(offCtx, page, whiteboardW, whiteboardH, {
          isExport: true,
          watermarkOnly: true,
          offsetX,
          offsetY,
        });
        offCtx.restore();

        // 3. Draw Footer Banner in dedicated bottom zone
        const isDark = page.boardType === 'black' || page.boardType === 'green';
        offCtx.fillStyle = isDark ? (page.boardType === 'black' ? '#090d16' : '#033327') : '#f8fafc';
        offCtx.fillRect(0, HEADER_HEIGHT + whiteboardH, pageW, FOOTER_HEIGHT);

        offCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';
        offCtx.lineWidth = 1;
        offCtx.beginPath();
        offCtx.moveTo(0, HEADER_HEIGHT + whiteboardH);
        offCtx.lineTo(pageW, HEADER_HEIGHT + whiteboardH);
        offCtx.stroke();

        offCtx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(15, 23, 42, 0.65)';
        offCtx.font = '10px "Plus Jakarta Sans", Arial, sans-serif';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(
          `EduAshram Digital Teaching System • Notes for ${studentName} • ${new Date().toLocaleDateString('en-GB')}`,
          pageW / 2,
          HEADER_HEIGHT + whiteboardH + FOOTER_HEIGHT / 2
        );

        // 4. Add Page to PDF with exact page format
        const orientation = pageW >= pageH ? 'landscape' : 'portrait';
        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [pageW, pageH],
            hotfixes: ['px_scaling'],
          });
        } else {
          pdf.addPage([pageW, pageH], orientation);
        }

        const imgData = offCanvas.toDataURL('image/jpeg', 0.94);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
      }

      if (!pdf) {
        if (setNotice) setNotice('No pages available to export.');
        return;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeGrade = effectiveGrade.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`EduAshram_Class_Notes_${safeGrade}_${dateStr}.pdf`);
      if (setNotice) setNotice(`Downloaded ${totalPgs}-page complete Class Notes as PDF.`);
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
          {isFullscreen && (
            <ClassroomChatHeaderButton style={{ minHeight: '30px', padding: '4px 10px', fontSize: '0.8rem' }} />
          )}
          <button
            type="button"
            className="button button-secondary student-action-btn"
            onClick={toggleStudentFullscreen}
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
                cursor: currentPermission === 'pointer' ? 'crosshair' : currentPermission === 'chalk' ? (chalkMode === 'eraser' ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23f43f5e' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='9' stroke-dasharray='3 3'/%3E%3Ccircle cx='12' cy='12' r='2' fill='%23f43f5e'/%3E%3C/svg%3E\") 12 12, crosshair" : 'crosshair') : 'default',
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
