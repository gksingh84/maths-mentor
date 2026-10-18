/**
 * Helper utilities for teacher active classes & subjects preferences
 * Stored in localStorage by ClassSubjectSettingsPanel
 */

export const DEFAULT_GRADES_FALLBACK = [
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

export const DEFAULT_SUBJECTS_FALLBACK = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
];

/**
 * Returns the array of classes/grades selected by the teacher in Class and Subject settings.
 */
export function getActiveGrades(): string[] {
  try {
    const saved = localStorage.getItem('teacher_pref_grades');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback if parse fails
  }
  return DEFAULT_GRADES_FALLBACK;
}

/**
 * Returns the primary/default grade based on teacher's active classes.
 */
export function getDefaultGrade(): string {
  const active = getActiveGrades();
  return active[0] || 'Grade 6';
}

/**
 * Returns the array of teaching subjects selected by the teacher in Class and Subject settings.
 */
export function getActiveSubjects(): string[] {
  try {
    const saved = localStorage.getItem('teacher_pref_subjects');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback if parse fails
  }
  return DEFAULT_SUBJECTS_FALLBACK;
}

/**
 * Returns the primary/default subject based on teacher's teaching subjects.
 */
export function getDefaultSubject(): string {
  const active = getActiveSubjects();
  return active[0] || 'Mathematics';
}
