import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Lock,
  RefreshCw,
  Video,
} from 'lucide-react';
import type { LiveClass, ZoomJoinInfo } from '../types/liveClass';
import './ZoomLiveClassroom.css';

interface StudentLiveClassManagerProps {
  studentName: string;
  studentGrade?: string | null;
  onJoinClassroom: (joinInfo: ZoomJoinInfo) => void;
  setNotice: (msg: string) => void;
}

export const StudentLiveClassManager: React.FC<StudentLiveClassManagerProps> = ({
  studentName,
  studentGrade: _studentGrade,
  onJoinClassroom,
  setNotice,
}) => {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);

  const loadClasses = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/live-classes', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (err: any) {
      setNotice(err?.message || 'Unable to load live classes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClasses();
    const interval = setInterval(loadClasses, 20000); // Polling every 20s to detect when teacher starts meeting
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (liveClass: LiveClass) => {
    try {
      setJoiningClassId(liveClass.id);
      const res = await fetch(`/api/live-classes/${liveClass.id}/join-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          displayName: studentName || 'Student',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join Zoom classroom.');

      onJoinClassroom(data);
    } catch (err: any) {
      setNotice(err?.message || 'Unable to join live class.');
    } finally {
      setJoiningClassId(null);
    }
  };

  const activeLiveClasses = classes.filter((c) => c.status === 'LIVE');
  const upcomingClasses = classes.filter((c) => c.status === 'SCHEDULED');
  const pastClasses = classes.filter((c) => c.status === 'COMPLETED');

  return (
    <div className="view-enter student-zoom-manager">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="overline">Interactive Online Classes</span>
          <h1>Live Classes with Zoom</h1>
          <p>Join interactive live sessions with your teacher, ask doubts, and use the interactive whiteboard.</p>
        </div>
        <button
          className="button button-secondary"
          onClick={loadClasses}
          disabled={refreshing}
          title="Refresh class list"
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Active Live Class Prominent Banner */}
      {activeLiveClasses.length > 0 && (
        <div className="zoom-student-live-banner">
          <div className="zoom-live-pulse-ring" />
          <div className="zoom-student-banner-content">
            <div className="zoom-banner-badge">
              <span className="zoom-pulse-dot" /> LIVE CLASS IN SESSION
            </div>
            <h2>{activeLiveClasses[0].title}</h2>
            <div className="zoom-banner-meta">
              <span>Teacher: <strong>{activeLiveClasses[0].teacherName || 'Teacher'}</strong></span>
              {activeLiveClasses[0].subject && <span>• Subject: <strong>{activeLiveClasses[0].subject}</strong></span>}
              {activeLiveClasses[0].grade && <span>• Grade: <strong>{activeLiveClasses[0].grade}</strong></span>}
            </div>
          </div>
          <div className="zoom-student-banner-actions">
            <button
              className="zoom-btn-banner-join"
              onClick={() => handleJoin(activeLiveClasses[0])}
              disabled={joiningClassId === activeLiveClasses[0].id}
            >
              {joiningClassId === activeLiveClasses[0].id ? (
                <RefreshCw className="spin" size={17} />
              ) : (
                <Video size={17} />
              )}
              <span>Join Live Class (Split-Screen)</span>
            </button>
            <a
              href={activeLiveClasses[0].joinUrl || `https://zoom.us/j/${activeLiveClasses[0].meetingId}?pwd=${activeLiveClasses[0].passcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="zoom-btn-banner-external"
              title="Open in Zoom Native App"
            >
              <ExternalLink size={14} /> Open in Zoom App
            </a>
          </div>
        </div>
      )}

      {/* Scheduled Classes */}
      <div className="section-heading" style={{ marginTop: '28px' }}>
        <div>
          <h2>Upcoming Scheduled Classes</h2>
          <p>Live classes planned by your teachers</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ minHeight: '160px' }}>
          <RefreshCw className="spin" size={24} color="#0284c7" />
          <p style={{ marginTop: '12px' }}>Checking for scheduled classes...</p>
        </div>
      ) : upcomingClasses.length === 0 && activeLiveClasses.length === 0 ? (
        <div className="empty-state" style={{ padding: '36px 20px', minHeight: '160px' }}>
          <span className="empty-icon">
            <Video size={28} color="#0284c7" />
          </span>
          <h3>No Live Classes currently scheduled.</h3>
          <p>Check back later or watch for notifications from your teacher.</p>
        </div>
      ) : (
        <div className="zoom-class-grid">
          {upcomingClasses.map((c) => (
            <div key={c.id} className="zoom-card">
              <div className="zoom-card-header">
                <div className="zoom-card-badges">
                  <span className="zoom-badge-scheduled">Scheduled</span>
                  {c.subject && <span className="worksheet-badge badge-subject">{c.subject}</span>}
                  {c.grade && <span className="worksheet-badge badge-draft">{c.grade}</span>}
                </div>
              </div>

              <h3 className="zoom-card-title">{c.title}</h3>
              {c.description && <p className="zoom-card-desc">{c.description}</p>}

              <div className="zoom-card-meta">
                <div className="zoom-meta-row">
                  <Calendar size={14} color="#64748b" />
                  <span>{new Date(c.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="zoom-meta-row">
                  <Clock size={14} color="#64748b" />
                  <span>Duration: {c.durationMinutes} Minutes</span>
                </div>
                <div className="zoom-meta-row">
                  <Lock size={14} color="#64748b" />
                  <span>Meeting ID: <strong>{c.meetingId}</strong></span>
                </div>
              </div>

              <div className="zoom-card-actions">
                <button
                  className="button button-primary"
                  onClick={() => handleJoin(c)}
                  disabled={joiningClassId === c.id}
                  style={{ flex: '1 1 auto' }}
                >
                  {joiningClassId === c.id ? (
                    <RefreshCw className="spin" size={15} />
                  ) : (
                    <Video size={15} />
                  )}
                  <span>Join Class</span>
                </button>
                <a
                  href={c.joinUrl || `https://zoom.us/j/${c.meetingId}?pwd=${c.passcode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-secondary"
                  title="Open directly in Zoom application"
                >
                  <ExternalLink size={14} /> Zoom App
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Completed Classes */}
      {pastClasses.length > 0 && (
        <>
          <div className="section-heading" style={{ marginTop: '36px' }}>
            <div>
              <h2>Past Classes</h2>
              <p>Previously conducted live sessions</p>
            </div>
          </div>
          <div className="zoom-class-grid">
            {pastClasses.slice(0, 6).map((c) => (
              <div key={c.id} className="zoom-card" style={{ opacity: 0.8 }}>
                <div className="zoom-card-header">
                  <div className="zoom-card-badges">
                    <span className="zoom-badge-completed">Completed</span>
                    {c.subject && <span className="worksheet-badge badge-subject">{c.subject}</span>}
                  </div>
                </div>
                <h3 className="zoom-card-title">{c.title}</h3>
                <div className="zoom-card-meta">
                  <div className="zoom-meta-row">
                    <Calendar size={14} color="#64748b" />
                    <span>{new Date(c.scheduledAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
