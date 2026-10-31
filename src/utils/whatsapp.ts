/**
 * WhatsApp Helper Utilities for Indian Mobile Numbers (+91)
 */

export function cleanIndianPhoneNumber(rawPhone?: string | null): { isValid: boolean; digits: string; formatted: string; fullWithCountry: string } {
  if (!rawPhone) return { isValid: false, digits: '', formatted: '', fullWithCountry: '' };
  
  // Remove all non-digits
  let digits = rawPhone.replace(/\D/g, '');

  // If starts with 91 and has 12 digits (91 + 10 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If starts with 0 and has 11 digits (0 + 10 digits)
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Indian mobile numbers must be 10 digits starting with 6, 7, 8, or 9
  const isValid = digits.length === 10 && /^[6-9]/.test(digits);
  const formatted = digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
  const fullWithCountry = isValid ? `91${digits}` : '';

  return {
    isValid,
    digits,
    formatted,
    fullWithCountry,
  };
}

export function getStudentPortalUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // Don't use localhost or loopback in WhatsApp messages meant for parents
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('0.0.0.0')) {
      return origin;
    }
  }
  return 'https://maths-mentor-32kc.onrender.com';
}

export const STUDENT_PORTAL_URL = 'https://maths-mentor-32kc.onrender.com';

export function openWhatsAppChat(
  phone: string | null | undefined,
  text: string,
  onNotice?: ((msg: string) => void) | null
) {
  const { fullWithCountry, isValid } = cleanIndianPhoneNumber(phone);

  // 1. Copy complete message to clipboard as an instant fallback
  // If WhatsApp Desktop or Web has handoff issues and drops the text,
  // the teacher can immediately press Ctrl+V to paste the complete announcement.
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  // 2. Strict RFC 3986 encoding
  const encodedText = encodeURIComponent(text);
  
  // 3. Always use official modern wa.me universal link (avoid legacy api.whatsapp.com which drops text)
  const url = isValid && fullWithCountry
    ? `https://wa.me/${fullWithCountry}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (onNotice) {
    onNotice('✓ WhatsApp opened & announcement copied to clipboard! (Press Ctrl+V in WhatsApp if text was not auto-filled)');
  }
}

export function generateScorecardMessage({
  studentName,
  parentName,
  quizTitle,
  score,
  totalMarks,
  submittedAt,
  correctCount,
  totalQuestions,
  teacherName,
}: {
  studentName: string;
  parentName?: string | null;
  quizTitle: string;
  score: number | null;
  totalMarks: number;
  submittedAt?: string | null;
  correctCount?: number;
  totalQuestions?: number;
  teacherName?: string | null;
}): string {
  const finalScore = score ?? 0;
  const percentage = totalMarks > 0 ? Math.round((finalScore / totalMarks) * 100) : 0;
  
  let gradeBadge = 'Good Effort';
  if (percentage >= 90) gradeBadge = 'Outstanding Performance 🌟';
  else if (percentage >= 75) gradeBadge = 'Excellent Work ⭐';
  else if (percentage >= 60) gradeBadge = 'Very Good Progress 👍';
  else if (percentage >= 40) gradeBadge = 'Satisfactory - Keep Practicing ✍️';
  else gradeBadge = 'Needs Extra Practice & Revision 📖';

  const dateStr = submittedAt
    ? new Date(submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const greeting = parentName ? `Dear ${parentName},` : `Dear Parent,`;
  const teacherSign = teacherName ? `Teacher: ${teacherName}` : 'Maths Mentor Classroom';
  const portalUrl = getStudentPortalUrl();

  return `*📊 STUDENT ASSESSMENT REPORT*
━━━━━━━━━━━━━━━━━━━━━
${greeting}
Here is the performance update for *${studentName}* in the recent classroom assessment:

📝 *Quiz / Test:* ${quizTitle}
🎯 *Score Obtained:* ${finalScore} / ${totalMarks} (${percentage}%)
🏆 *Performance:* ${gradeBadge}
${typeof correctCount === 'number' && typeof totalQuestions === 'number' ? `✅ *Correct Answers:* ${correctCount} / ${totalQuestions}\n` : ''}📅 *Date:* ${dateStr}

━━━━━━━━━━━━━━━━━━━━━
💡 *Teacher Note:*
Consistent revision and problem-solving build strong foundations. Please encourage *${studentName}* to review questions and continue the good work.

🌐 *Student Portal:*
${portalUrl}

Best regards,
*${teacherSign}*`;
}

export function generateQuizAnnouncementMessage({
  quizTitle,
  grade,
  mode,
  questionCount,
  timeMinutes,
  teacherName,
}: {
  quizTitle: string;
  grade?: string | null;
  mode: string;
  questionCount: number;
  timeMinutes?: number | null;
  teacherName?: string | null;
}): string {
  const modeLabel = mode === 'LIVE' ? 'Live Interactive Quiz' : (timeMinutes ? `Timed Practice (${timeMinutes} mins)` : 'Self-Paced Practice');
  const teacherSign = teacherName ? `Teacher: ${teacherName}` : 'Maths Mentor Classroom';
  const portalUrl = getStudentPortalUrl();

  return `*📢 NEW CLASSROOM ASSESSMENT ANNOUNCEMENT*
━━━━━━━━━━━━━━━━━━━━━
Dear Parents and Students,

A new assessment is now active on Maths Mentor:

📝 *Assessment:* ${quizTitle}
🎓 *Class / Grade:* ${grade || 'Classroom'}
⏱️ *Format:* ${modeLabel}
❓ *Questions:* ${questionCount} questions

🌐 *Student Portal:*
${portalUrl}

🔑 *Instructions:*
Students can sign in to the portal using their registered passkey to begin. Please ensure timely completion.

Best regards,
*${teacherSign}*`;
}

export function generateWorksheetAnnouncementMessage({
  paperTitle,
  subject,
  grade,
  totalMarks,
  teacherName,
}: {
  paperTitle: string;
  subject?: string | null;
  grade?: string | null;
  totalMarks: number;
  teacherName?: string | null;
}): string {
  const teacherSign = teacherName ? `Teacher: ${teacherName}` : 'Maths Mentor Classroom';
  const portalUrl = getStudentPortalUrl();

  return `*📚 NEW HOMEWORK / QUESTION PAPER ASSIGNED*
━━━━━━━━━━━━━━━━━━━━━
Dear Parents and Students,

A new question paper has been assigned for practice:

📋 *Topic:* ${paperTitle}
📖 *Subject and Class:* ${subject || 'General'} - ${grade || 'Classroom'}
🎯 *Total Marks:* ${totalMarks} Marks

📝 *Instructions for Students:*
1. Solve questions neatly in your physical notebook / register.
2. When finished, take clear photos of your solution pages.
3. Upload the photos to the student portal for teacher review.

🌐 *Student Portal:*
${portalUrl}

Best regards,
*${teacherSign}*`;
}
