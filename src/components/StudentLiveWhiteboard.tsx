import React, { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Radio, ChevronLeft, ChevronRight, Download, FileText, Maximize2, Minimize2, Bookmark, CheckCircle2, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';

interface StudentLiveWhiteboardProps {
  studentName?: string;
  studentGrade?: string | null;
  teacherId?: string | null;
  setNotice?: (msg: string) => void;
}

export const StudentLiveWhiteboard: React.FC<StudentLiveWhiteboardProps> = ({
  studentGrade = 'Grade 10',
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const followTeacherRef = useRef(followTeacher);
  useEffect(() => {
    followTeacherRef.current = followTeacher;
  }, [followTeacher]);
  const teacherScrollRef = useRef<{ scrollTop: number; scrollRatio: number }>({ scrollTop: 0, scrollRatio: 0 });

  const effectiveGrade = studentGrade || 'Grade 10';

  // Connect to Socket.IO and join whiteboard room
  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'], withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('whiteboard:join', { grade: effectiveGrade, teacherId });
    });

    socket.on('whiteboard:initial_state', (data: any) => {
      if (data?.isLive) {
        setIsLive(true);
        setTeacherName(data.teacherName || 'Teacher');
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
      }
    });

    socket.on('whiteboard:status_update', (data: any) => {
      const matchesGrade = data.grade === effectiveGrade || data.grade === 'ALL';
      const matchesTeacher = teacherId && data.teacherId === teacherId;
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
      if (setNotice) setNotice('Teacher concluded the live whiteboard session.');
    });

    socket.on('whiteboard:stroke', (data: { pageIndex: number; stroke: any }) => {
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
            texts: []
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

    return () => {
      socket.emit('whiteboard:leave', { grade: effectiveGrade });
      socket.disconnect();
    };
  }, [effectiveGrade]);

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

  // Render current viewing page on canvas
  const drawCurrentPage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const page = pages[viewingPageIndex];
    const container = containerRef.current || (canvas.closest('.student-whiteboard-canvas-wrap') as HTMLElement | null);
    const displayWidth = container ? Math.max(container.clientWidth - 24, 1000) : 1000;

    // 1. Determine canvas height: respect teacher's infinite scroll height (default 2400 for infinite scroll, or page.height)
    let computedHeight = (page && typeof page.height === 'number' && page.height > 0)
      ? page.height
      : (page?.infiniteScroll !== false ? 2400 : (container ? container.clientHeight : 800));

    // 2. Scan strokes, shapes, and texts to ensure no drawn content is ever cut off
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
  };

  useEffect(() => {
    drawCurrentPage();
  }, [pages, viewingPageIndex, isLive]);

  // Window resize observer for canvas auto-scaling
  useEffect(() => {
    const handleResize = () => drawCurrentPage();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pages, viewingPageIndex]);

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

  // Export all pages as PDF
  const handleExportPDF = () => {
    if (!pages.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1000, 720] });
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 1000, 720);
    pdf.save(`EduAshram_Live_Class_Notes_Grade_${effectiveGrade.replace(/\s+/g, '_')}.pdf`);
    if (setNotice) setNotice('Class notes downloaded as PDF.');
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

        {/* Action Tools */}
        <div className="student-actions-group">
          {pages.length > 0 && (
            <>
              <button
                type="button"
                className="button button-secondary student-action-btn"
                onClick={handleExportPNG}
                title="Save current page as PNG image"
              >
                <Download size={14} /> Save Page
              </button>
              <button
                type="button"
                className="button button-secondary student-action-btn"
                onClick={handleExportPDF}
                title="Save notes as PDF"
              >
                <FileText size={14} /> PDF Notes
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

      {/* Main Board View */}
      <div ref={containerRef} className="student-whiteboard-canvas-wrap">
        {isLive ? (
          <canvas
            ref={canvasRef}
            className="student-whiteboard-canvas"
            style={{ pointerEvents: 'none', display: 'block' }}
          />
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
          <span>Live synchronization active • View-only mode • You can freely browse pages without affecting the teacher's view</span>
        </div>
      )}
    </div>
  );
};
