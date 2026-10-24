/* ==========================================================================
   ARCHIVED ZOOM LIVE CLASSROOM & MEETING SDK MODULE
   Extracted from EduAshram server/index.ts for future integration.
   ========================================================================== */

import type { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import { z } from 'zod';

export function toBase64Url(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getZoomCredentials() {
  const clientId = process.env.ZOOM_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim() || '';
  const sdkKey = process.env.ZOOM_SDK_KEY?.trim() || clientId;
  const sdkSecret = process.env.ZOOM_SDK_SECRET?.trim() || clientSecret;
  return { clientId, clientSecret, sdkKey, sdkSecret };
}

export function generateZoomSdkSignature(meetingNumber: string, role: 0 | 1): string {
  const { sdkKey, sdkSecret } = getZoomCredentials();
  if (!sdkKey || !sdkSecret) {
    throw new Error('Zoom SDK credentials are not configured in server .env (ZOOM_SDK_KEY and ZOOM_SDK_SECRET).');
  }

  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hours validity

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    appKey: sdkKey,
    sdkKey: sdkKey,
    mn: meetingNumber.replace(/[\s-]/g, ''),
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp,
  };

  const sHeader = toBase64Url(JSON.stringify(header));
  const sPayload = toBase64Url(JSON.stringify(payload));
  const signature = toBase64Url(
    createHmac('sha256', sdkSecret)
      .update(`${sHeader}.${sPayload}`)
      .digest()
  );

  return `${sHeader}.${sPayload}.${signature}`;
}

export async function getValidTeacherZoomToken(db: any, teacherId: string): Promise<string> {
  const { clientId, clientSecret } = getZoomCredentials();
  if (!clientId || !clientSecret) {
    throw new Error('Zoom App credentials (ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET) are not set in the server .env.');
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      zoomAccessToken: true,
      zoomRefreshToken: true,
      zoomTokenExpiresAt: true,
    },
  });

  if (!teacher?.zoomRefreshToken) {
    throw new Error('Your Zoom account is not connected yet. Please connect your Zoom account in Live Class settings.');
  }

  if (teacher.zoomTokenExpiresAt && new Date(teacher.zoomTokenExpiresAt).getTime() > Date.now() + 5 * 60 * 1000 && teacher.zoomAccessToken) {
    return teacher.zoomAccessToken;
  }

  // Refresh expired access token
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const refreshResp = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: teacher.zoomRefreshToken,
    }),
  });

  const data: any = await refreshResp.json().catch(() => ({}));
  if (!refreshResp.ok || !data.access_token) {
    throw new Error(data.error_description || data.message || 'Failed to refresh Zoom token. Please reconnect your Zoom account.');
  }

  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
  await db.teacher.update({
    where: { id: teacherId },
    data: {
      zoomAccessToken: data.access_token,
      zoomRefreshToken: data.refresh_token || teacher.zoomRefreshToken,
      zoomTokenExpiresAt: expiresAt,
    },
  });

  return data.access_token;
}

export async function getTeacherZakToken(accessToken: string): Promise<string> {
  try {
    const resp = await fetch('https://api.zoom.us/v2/users/me/token?type=zak', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const data: any = await resp.json().catch(() => ({}));
    return data?.token || '';
  } catch {
    return '';
  }
}

/**
 * Register all Zoom routes onto the Express app
 */
export function registerZoomRoutes(app: any, db: any, io: any, teacherOnly: any, errorResponse: any) {
  // 1. Get Zoom OAuth authorization URL for teacher
  app.get('/api/teacher/zoom/auth-url', teacherOnly, async (req: any, res: Response) => {
    try {
      const { clientId } = getZoomCredentials();
      if (!clientId) {
        return res.status(400).json({
          error: 'ZOOM_CLIENT_ID is not configured in server .env. Please configure Zoom credentials to enable OAuth.',
        });
      }

      const host = req.get('host') || 'localhost:4000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const redirectUri = process.env.ZOOM_REDIRECT_URI || `${protocol}://${host}/api/zoom/oauth/callback`;
      const state = req.session!.id;

      const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
      res.json({ ok: true, authUrl });
    } catch (error) { errorResponse(res, error); }
  });

  // 2. Zoom OAuth redirect callback
  app.get('/api/zoom/oauth/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.status(400).send('<h3>Invalid Zoom authorization callback: Missing code or state.</h3>');
    }

    try {
      const { clientId, clientSecret } = getZoomCredentials();
      const host = req.get('host') || 'localhost:4000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const redirectUri = process.env.ZOOM_REDIRECT_URI || `${protocol}://${host}/api/zoom/oauth/callback`;

      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenResp = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData: any = await tokenResp.json().catch(() => ({}));
      if (!tokenResp.ok || !tokenData.access_token) {
        const err = tokenData.error_description || tokenData.message || 'Token exchange failed';
        return res.status(400).send(`<h3>Failed to connect Zoom: ${err}</h3>`);
      }

      // Fetch user profile from Zoom
      let zoomEmail = '';
      let zoomAccountId = '';
      try {
        const userResp = await fetch('https://api.zoom.us/v2/users/me', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const userData: any = await userResp.json().catch(() => ({}));
        zoomEmail = userData.email || '';
        zoomAccountId = userData.account_id || '';
      } catch { }

      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);
      await db.teacher.update({
        where: { id: state },
        data: {
          zoomAccessToken: tokenData.access_token,
          zoomRefreshToken: tokenData.refresh_token,
          zoomTokenExpiresAt: expiresAt,
          zoomEmail: zoomEmail || undefined,
          zoomAccountId: zoomAccountId || undefined,
        },
      });

      console.log(`✅ Teacher ${state} successfully connected Zoom account: ${zoomEmail}`);
      res.redirect('/?zoom_connected=true');
    } catch (err: any) {
      console.error('Zoom OAuth callback error:', err);
      res.status(500).send(`<h3>Error completing Zoom connection: ${err.message}</h3>`);
    }
  });

  // 3. Check Teacher's Zoom Connection Status
  app.get('/api/teacher/zoom/status', teacherOnly, async (req: any, res: Response) => {
    try {
      const teacherId = req.session!.id;
      const { clientId, clientSecret, sdkKey } = getZoomCredentials();
      const teacher = await db.teacher.findUnique({
        where: { id: teacherId },
        select: {
          zoomEmail: true,
          zoomAccessToken: true,
          zoomTokenExpiresAt: true,
        },
      });

      const isConnected = Boolean(teacher?.zoomAccessToken);
      res.json({
        ok: true,
        connected: isConnected,
        email: teacher?.zoomEmail || null,
        expiresAt: teacher?.zoomTokenExpiresAt || null,
        hasServerCredentials: Boolean(clientId && clientSecret),
        hasSdkCredentials: Boolean(sdkKey),
      });
    } catch (error) { errorResponse(res, error); }
  });

  // 4. Disconnect Zoom Account
  app.post('/api/teacher/zoom/disconnect', teacherOnly, async (req: any, res: Response) => {
    try {
      const teacherId = req.session!.id;
      await db.teacher.update({
        where: { id: teacherId },
        data: {
          zoomAccessToken: null,
          zoomRefreshToken: null,
          zoomTokenExpiresAt: null,
          zoomEmail: null,
          zoomAccountId: null,
        },
      });
      res.json({ ok: true, message: 'Zoom account disconnected successfully.' });
    } catch (error) { errorResponse(res, error); }
  });

  // 5. Get Live Classes (Teacher or Student)
  app.get('/api/live-classes', async (req: any, res: Response) => {
    try {
      const role = req.session?.role;
      const userId = req.session?.id;

      let where: any = {};
      if (role === 'teacher' || role === 'admin') {
        where = { teacherId: userId };
      } else if (role === 'student' && userId) {
        const student = await db.student.findUnique({ where: { id: userId }, select: { grade: true, teacherId: true } });
        where = {
          status: { in: ['LIVE', 'SCHEDULED'] },
          OR: [
            { grade: student?.grade || undefined },
            { teacherId: student?.teacherId || undefined },
            { grade: 'All School' },
          ],
        };
      } else {
        where = { status: { in: ['LIVE', 'SCHEDULED'] } };
      }

      const classes = await db.liveClass.findMany({
        where,
        orderBy: [{ status: 'asc' }, { startTime: 'asc' }],
        include: {
          teacher: { select: { id: true, name: true, email: true, school: true } },
          _count: { select: { attendances: true } },
        },
      });

      const mappedClasses = classes.map((c: any) => ({
        ...c,
        meetingId: c.zoomMeetingId,
        passcode: c.zoomMeetingPasscode || '',
        startUrl: c.zoomStartUrl || '',
        joinUrl: c.zoomJoinUrl || '',
        scheduledAt: c.startTime,
        teacherName: c.teacher?.name || '',
        teacherEmail: c.teacher?.email || '',
      }));

      res.json({ ok: true, classes: mappedClasses });
    } catch (error) { errorResponse(res, error); }
  });

  // 6. Create Live Class (Teacher only)
  app.post('/api/teacher/live-classes', teacherOnly, async (req: any, res: Response) => {
    try {
      const teacherId = req.session!.id;
      const schema = z.object({
        title: z.string().trim().min(2).max(150),
        description: z.string().trim().max(1000).optional().nullable(),
        grade: z.string().trim().optional().default('Grade 6'),
        subject: z.string().trim().optional().default('Mathematics'),
        startTime: z.string().optional(),
        scheduledAt: z.string().optional(),
        durationMinutes: z.number().int().min(15).max(300).default(60),
        useManualMeeting: z.boolean().optional(),
        manualMeetingId: z.string().trim().optional(),
        manualPasscode: z.string().trim().optional(),
      });
      const data = schema.parse(req.body);

      const effectiveStartTime = data.scheduledAt || data.startTime || new Date().toISOString();
      const isManual = data.useManualMeeting || Boolean(data.manualMeetingId);

      let meetingId = '';
      let passcode = '';
      let startUrl = '';
      let joinUrl = '';

      if (isManual && data.manualMeetingId) {
        // Manual Zoom PMI / Meeting fallback
        meetingId = data.manualMeetingId.replace(/[\s-]/g, '');
        passcode = data.manualPasscode || '';
        joinUrl = `https://zoom.us/j/${meetingId}${passcode ? `?pwd=${passcode}` : ''}`;
      } else {
        // Automated Zoom REST API Meeting creation under Teacher's account
        const accessToken = await getValidTeacherZoomToken(db, teacherId);
        const startDateTime = new Date(effectiveStartTime).toISOString();

        const zoomResp = await fetch('https://api.zoom.us/v2/users/me/meetings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: data.title,
            type: 2,
            start_time: startDateTime,
            duration: data.durationMinutes,
            agenda: data.description || 'EduAshram Live Classroom',
            settings: {
              host_video: true,
              participant_video: true,
              join_before_host: false,
              mute_upon_entry: true,
              waiting_room: true,
              approval_type: 2,
              audio: 'both',
            },
          }),
        });

        const zoomJson: any = await zoomResp.json().catch(() => ({}));
        if (!zoomResp.ok || !zoomJson.id) {
          throw new Error(zoomJson.message || 'Failed to create meeting on your Zoom account. Please verify your Zoom connection.');
        }

        meetingId = String(zoomJson.id);
        passcode = zoomJson.password || '';
        startUrl = zoomJson.start_url || '';
        joinUrl = zoomJson.join_url || '';
      }

      const liveClass = await db.liveClass.create({
        data: {
          title: data.title,
          description: data.description || null,
          grade: data.grade,
          subject: data.subject,
          zoomMeetingId: meetingId,
          zoomMeetingPasscode: passcode,
          zoomStartUrl: startUrl || null,
          zoomJoinUrl: joinUrl || null,
          startTime: new Date(effectiveStartTime),
          durationMinutes: data.durationMinutes,
          status: 'SCHEDULED',
          teacherId,
        },
        include: {
          teacher: { select: { id: true, name: true, email: true } },
        },
      });

      const mappedLiveClass = {
        ...liveClass,
        meetingId: liveClass.zoomMeetingId,
        passcode: liveClass.zoomMeetingPasscode || '',
        startUrl: liveClass.zoomStartUrl || '',
        joinUrl: liveClass.zoomJoinUrl || '',
        scheduledAt: liveClass.startTime,
        teacherName: liveClass.teacher?.name || '',
        teacherEmail: liveClass.teacher?.email || '',
      };

      io.emit('liveclass:updated');
      res.json({ ok: true, liveClass: mappedLiveClass });
    } catch (error) { errorResponse(res, error); }
  });

  // 7. Get Join SDK Signature & Credentials for Component View
  app.post('/api/live-classes/:id/join-info', async (req: any, res: Response) => {
    try {
      const classId = req.params.id;
      const role = req.session?.role;
      const userId = req.session?.id;

      const liveClass = await db.liveClass.findUnique({
        where: { id: classId },
        include: { teacher: true },
      });
      if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });

      const isHost = (role === 'teacher' || role === 'admin') && userId === liveClass.teacherId;
      let zak = '';
      let sdkRole: 0 | 1 = 0;

      if (isHost) {
        try {
          const token = await getValidTeacherZoomToken(db, liveClass.teacherId);
          zak = await getTeacherZakToken(token);
          if (zak) {
            sdkRole = 1;
          }
        } catch (err) {
          console.warn('Host does not have Zoom OAuth ZAK token; joining as participant (role 0):', (err as any)?.message || err);
          sdkRole = 0;
        }
      }

      const { sdkKey } = getZoomCredentials();
      const signature = generateZoomSdkSignature(liveClass.zoomMeetingId, sdkRole);

      if (role === 'student' && userId) {
        try {
          await db.liveClassAttendance.upsert({
            where: {
              liveClassId_studentId: {
                liveClassId: classId,
                studentId: userId,
              },
            },
            update: {
              joinedAt: new Date(),
            },
            create: {
              liveClassId: classId,
              studentId: userId,
              joinedAt: new Date(),
            },
          });
        } catch { }
      }

      const userName = req.body?.displayName || req.session?.name || (isHost ? liveClass.teacher.name : 'Student');

      res.json({
        ok: true,
        sdkKey,
        signature,
        meetingNumber: liveClass.zoomMeetingId,
        passcode: liveClass.zoomMeetingPasscode || '',
        userName,
        role: sdkRole,
        isHost,
        zak,
        liveClass: {
          id: liveClass.id,
          title: liveClass.title,
          grade: liveClass.grade,
          subject: liveClass.subject,
          teacherName: liveClass.teacher?.name || 'Teacher',
          status: liveClass.status,
          startUrl: liveClass.zoomStartUrl || '',
          joinUrl: liveClass.zoomJoinUrl || '',
        },
      });
    } catch (error) { errorResponse(res, error); }
  });

  // 8. Update Live Class Status (LIVE, COMPLETED, CANCELLED)
  app.patch('/api/live-classes/:id/status', teacherOnly, async (req: any, res: Response) => {
    try {
      const classId = req.params.id;
      const teacherId = req.session!.id;
      const schema = z.object({
        status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']),
      });
      const { status } = schema.parse(req.body);

      const liveClass = await db.liveClass.findUnique({ where: { id: classId } });
      if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });
      if (liveClass.teacherId !== teacherId && req.session?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Permission denied.' });
      }

      const updated = await db.liveClass.update({
        where: { id: classId },
        data: { status },
      });

      io.emit('liveclass:updated');
      io.emit('liveclass:status_changed', { classId, status });
      res.json({ ok: true, liveClass: updated });
    } catch (error) { errorResponse(res, error); }
  });

  // 9. Delete Live Class
  app.delete('/api/live-classes/:id', teacherOnly, async (req: any, res: Response) => {
    try {
      const classId = req.params.id;
      const teacherId = req.session!.id;

      const liveClass = await db.liveClass.findUnique({ where: { id: classId } });
      if (!liveClass) return res.status(404).json({ error: 'Live class not found.' });
      if (liveClass.teacherId !== teacherId && req.session?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Permission denied.' });
      }

      await db.liveClass.delete({ where: { id: classId } });
      io.emit('liveclass:updated');
      res.json({ ok: true, message: 'Live class deleted.' });
    } catch (error) { errorResponse(res, error); }
  });
}
