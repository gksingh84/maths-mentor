export type LiveClassStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface LiveClassAttendance {
  id: string;
  liveClassId: string;
  studentId: string;
  joinedAt: string;
  leftAt?: string | null;
  durationMinutes: number;
  student?: {
    id: string;
    name: string;
    grade?: string | null;
  };
}

export interface LiveClass {
  id: string;
  title: string;
  description?: string | null;
  grade?: string | null;
  subject?: string | null;
  teacherId: string;
  teacherName?: string | null;
  teacherEmail?: string | null;
  meetingId: string;
  passcode: string;
  startUrl?: string | null;
  joinUrl?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: LiveClassStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  attendances?: LiveClassAttendance[];
  _count?: {
    attendances: number;
  };
}

export interface ZoomJoinInfo {
  meetingNumber: string;
  passcode: string;
  userName: string;
  userEmail?: string;
  signature: string;
  sdkKey?: string;
  role: number; // 1 for host, 0 for attendee
  zak?: string;
  isHost: boolean;
  liveClass: {
    id: string;
    title: string;
    grade?: string | null;
    subject?: string | null;
    teacherName?: string | null;
    status: LiveClassStatus;
    startUrl?: string | null;
    joinUrl?: string | null;
  };
}

export interface TeacherZoomStatus {
  connected: boolean;
  zoomEmail: string | null;
  zoomAccountId: string | null;
  hasCredentialsConfigured: boolean;
  expiresAt: string | null;
}
