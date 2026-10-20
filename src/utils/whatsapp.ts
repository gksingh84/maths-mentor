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

export function openWhatsAppChat(phone: string | null | undefined, text: string) {
  const { fullWithCountry, isValid } = cleanIndianPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  
  // If valid 10-digit Indian phone is provided, open specific chat with wa.me/91...
  // Otherwise open WhatsApp with prefilled text so teacher can choose any chat/group
  const url = isValid && fullWithCountry
    ? `https://wa.me/${fullWithCountry}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
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
  if (percentage >= 90) gradeBadge = 'Outstanding Performance';
  else if (percentage >= 75) gradeBadge = 'Excellent Work';
  else if (percentage >= 60) gradeBadge = 'Very Good Progress';
  else if (percentage >= 40) gradeBadge = 'Satisfactory - Keep Practicing';
  else gradeBadge = 'Needs Extra Practice & Revision';

  const dateStr = submittedAt
    ? new Date(submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const greeting = parentName ? `Dear ${parentName},` : `Dear Parent,`;
  const teacherSign = teacherName ? `Teacher: ${teacherName}` : 'Maths Mentor Classroom';

  return `STUDENT ASSESSMENT REPORT
----------------------------------------
${greeting}
Here is the performance update for ${studentName} in the recent classroom assessment:

Quiz / Test: ${quizTitle}
Score Obtained: ${finalScore} / ${totalMarks} (${percentage}%)
Performance: ${gradeBadge}
${typeof correctCount === 'number' && typeof totalQuestions === 'number' ? `Correct Answers: ${correctCount} / ${totalQuestions}\n` : ''}Date: ${dateStr}

----------------------------------------
Teacher Note:
Consistent revision and problem-solving build strong foundations. Please encourage ${studentName} to review questions and continue the good work.

Best regards,
${teacherSign}`;
}

export const STUDENT_PORTAL_URL = 'https://maths-mentor-32kc.onrender.com';

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

  return `NEW CLASSROOM ASSESSMENT ANNOUNCEMENT
----------------------------------------
Dear Parents & Students,

A new assessment is now available for your class:

Assessment: ${quizTitle}
Class / Grade: ${grade || 'Classroom'}
Format: ${modeLabel}
Questions: ${questionCount} questions

Student Portal: ${STUDENT_PORTAL_URL}
Students can sign in with their registered student passkey. Please ensure timely completion.

Best regards,
${teacherSign}`;
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

  return `NEW HOMEWORK / QUESTION PAPER ASSIGNED
----------------------------------------
Dear Parents & Students,

A new question paper has been assigned for practice:

Topic: ${paperTitle}
Subject & Class: ${subject || 'General'} - ${grade || 'Classroom'}
Total Marks: ${totalMarks} Marks

Instructions for Students:
1. Write all answers neatly in your physical notebook / workbook.
2. When finished, take clear photos and upload them via the student portal.

Student Portal: ${STUDENT_PORTAL_URL}

Best regards,
${teacherSign}`;
}
