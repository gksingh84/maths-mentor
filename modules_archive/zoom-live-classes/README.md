# 📹 Archived Zoom Live Classes & Meeting SDK Module

This folder contains the complete, self-contained implementation of the **Zoom Live Classes** module from EduAshram (Maths Mentor), archived for future integration or standalone use.

---

## 📁 Archived Files Overview

```
modules_archive/zoom-live-classes/
├── README.md                              <- This documentation & re-integration guide
├── components/
│   ├── ZoomLiveClassroom.tsx              <- Split-screen live classroom (Zoom Web SDK + Whiteboard + Notes + Doubts)
│   ├── ZoomLiveClassroom.css              <- Glassmorphism styling, animations, modal and overlay layouts
│   ├── TeacherLiveClassManager.tsx        <- Teacher schedule modal, class management list, filter tabs, PMI & OAuth modes
│   └── StudentLiveClassManager.tsx        <- Student live class view, upcoming sessions, and one-click join banner
├── types/
│   └── liveClass.ts                       <- TypeScript interfaces (LiveClass, ZoomJoinInfo, Attendance, Doubts)
├── server/
│   └── zoom-live-class-routes.ts          <- All Express REST endpoints, Zoom OAuth token refresh, ZAK tokens & JWT signature generator
└── scripts/
    └── patch-react.js                     <- React 19 compatibility patch for Zoom Meeting SDK
```

---

## 🚀 How to Re-Integrate This Module in the Future

### 1. Restore Frontend Components
Copy the files from this archive back into `src/`:
- Copy `components/*` into `src/components/`
- Copy `types/liveClass.ts` into `src/types/liveClass.ts`

### 2. Restore Server Endpoints
In `server/index.ts`:
- Import `registerZoomRoutes` from `./zoom-live-class-routes`
- Call:
  ```ts
  import { registerZoomRoutes } from './zoom-live-class-routes';
  // ...
  registerZoomRoutes(app, db, io, teacherOnly, errorResponse);
  ```

### 3. Add Navigation Tabs in `src/App.tsx`
- **Teacher View**:
  Add `live_classes` to `TeacherTab`:
  ```tsx
  <NavItem active={tab === 'live_classes'} icon={<Video size={17} />} label="Zoom Live Classes" onClick={() => setTab('live_classes')} />
  ```
  And render:
  ```tsx
  {tab === 'live_classes' && (
    <TeacherLiveClassManager
      setNotice={setNotice}
      onLaunchClassroom={(joinInfo) => setActiveLiveMeeting(joinInfo)}
      teacherName={user?.name}
    />
  )}
  ```
- **Student View**:
  Add navigation item for `live_classes` and render:
  ```tsx
  {tab === 'live_classes' && (
    <StudentLiveClassManager
      setNotice={setNotice}
      onJoinClassroom={(joinInfo) => setActiveLiveMeeting(joinInfo)}
      studentName={user?.name}
    />
  )}
  ```
- **Fullscreen Classroom Overlay**:
  ```tsx
  {activeLiveMeeting && (
    <ZoomLiveClassroom
      joinInfo={activeLiveMeeting}
      onLeave={() => setActiveLiveMeeting(null)}
      currentUserRole="teacher" // or "student"
      setNotice={setNotice}
    />
  )}
  ```

### 4. Dependencies
If you want to use the embedded Web SDK:
```bash
npm install @zoom/meetingsdk
```
And ensure `package.json` has:
```json
"postinstall": "prisma generate && node scripts/patch-react.js"
```

### 5. Zoom App Marketplace Requirements
In `.env`:
```env
ZOOM_CLIENT_ID="<Your_Zoom_Meeting_SDK_Client_ID>"
ZOOM_CLIENT_SECRET="<Your_Zoom_Meeting_SDK_Client_Secret>"
ZOOM_SDK_KEY="<Your_Zoom_Meeting_SDK_Key>"
ZOOM_SDK_SECRET="<Your_Zoom_Meeting_SDK_Secret>"
ZOOM_REDIRECT_URI="http://localhost:4000/api/zoom/oauth/callback"
```
*Note: Make sure your Zoom app type in `marketplace.zoom.us` is a **Meeting SDK App** (with Web SDK enabled).*
