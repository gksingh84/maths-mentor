import { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Printer,
  Copy,
  Check,
  GraduationCap,
  Users,
  Smartphone,
  HelpCircle,
  ExternalLink,
  Layers,
  LogIn,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

interface UserGuidePageProps {
  onBack: () => void;
  initialTab?: 'all' | 'public' | 'teacher' | 'student' | 'faq';
  userRole?: 'admin' | 'teacher' | 'superadmin' | 'student' | null;
}

export function UserGuidePage({ onBack, initialTab = 'all', userRole }: UserGuidePageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'teacher' | 'student' | 'faq'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const isSearching = searchQuery.trim().length > 0;
  const effectiveTab = isSearching ? 'all' : activeTab;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const sampleScorecardText = `STUDENT ASSESSMENT REPORT
----------------------------------------
Dear Mr. Rajesh Singh,
Here is the performance update for Vanya in the recent classroom assessment:

Quiz / Test: FRACTIONS
Score Obtained: 10 / 10 (100%)
Performance: Outstanding Performance
Correct Answers: 10 / 10
Date: 19 Oct 2026

----------------------------------------
Teacher Note:
Consistent revision and problem-solving build strong foundations. Please encourage Vanya to review questions and continue the good work.

Best regards,
Teacher: Gaurav Kumar Singh`;

  const sampleHomeworkText = `NEW HOMEWORK / QUESTION PAPER ASSIGNED
----------------------------------------
Dear Parents & Students,

A new question paper has been assigned for practice:

Topic: FRACTIONS & DECIMALS
Subject & Class: Mathematics - Grade 5
Total Marks: 50 Marks

Instructions for Students:
1. Write all answers neatly in your physical notebook / workbook.
2. When finished, take clear photos and upload them via the student portal.

Student Portal: https://maths-mentor-32kc.onrender.com
Best regards,
Teacher: Gaurav Kumar Singh`;

  // Quick jump helper with sticky header offset compensation
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 145; // Height of sticky top header with padding
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
    }
  };

  // Filter guide cards and FAQ cards based on search query
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!contentRef.current) return;

    const root = contentRef.current;
    const cards = root.querySelectorAll<HTMLElement>('.guide-card, .faq-card');
    const sections = root.querySelectorAll<HTMLElement>('.guide-section');
    const tocLinks = document.querySelectorAll<HTMLElement>('.guide-toc-sidebar a');

    if (!q) {
      cards.forEach((card) => {
        card.style.display = '';
        card.classList.remove('search-matched');
      });
      sections.forEach((sec) => {
        sec.style.display = '';
      });
      tocLinks.forEach((link) => {
        link.style.display = '';
      });
      setMatchCount(null);
      return;
    }

    let count = 0;
    cards.forEach((card) => {
      const text = card.innerText.toLowerCase();
      const id = card.id ? card.id.toLowerCase() : '';
      const isMatch = text.includes(q) || id.includes(q);
      if (isMatch) {
        card.style.display = '';
        card.classList.add('search-matched');
        count++;
      } else {
        card.style.display = 'none';
        card.classList.remove('search-matched');
      }
    });

    sections.forEach((sec) => {
      const visibleCards = Array.from(sec.querySelectorAll<HTMLElement>('.guide-card, .faq-card')).filter(
        (c) => c.style.display !== 'none'
      );
      if (visibleCards.length > 0) {
        sec.style.display = '';
      } else {
        sec.style.display = 'none';
      }
    });

    tocLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl && targetEl.style.display !== 'none') {
          link.style.display = '';
        } else {
          link.style.display = 'none';
        }
      }
    });

    setMatchCount(count);
  }, [searchQuery, effectiveTab]);

  return (
    <div className="user-guide-page-root">
      {/* Top Sticky Header */}
      <header className="guide-top-header">
        <div className="guide-header-inner">
          <div className="guide-brand-wrap">
            <button className="guide-back-btn" onClick={onBack} title="Return to previous screen">
              <ArrowLeft size={18} />
              <span>Back {userRole ? 'to Classroom' : 'to Portal'}</span>
            </button>
            <div className="guide-title-box">
              <span className="guide-badge">
                <BookOpen size={14} /> Official Documentation
              </span>
              <h1>EduAshram User Guide</h1>
            </div>
          </div>

          <div className="guide-header-actions">
            <button
              className="button button-secondary guide-action-btn"
              onClick={() => window.print()}
              title="Print full user guide or save as PDF"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Search & Navigation Bar */}
        <div className="guide-nav-bar">
          <div className="guide-tabs">
            <button
              className={`guide-tab-btn ${activeTab === 'all' && !isSearching ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
            >
              <Layers size={15} /> All Sections
            </button>
            <button
              className={`guide-tab-btn ${activeTab === 'public' && !isSearching ? 'active' : ''}`}
              onClick={() => { setActiveTab('public'); setSearchQuery(''); }}
            >
              <ExternalLink size={15} /> Part 1: Public Portal
            </button>
            <button
              className={`guide-tab-btn ${activeTab === 'teacher' && !isSearching ? 'active' : ''}`}
              onClick={() => { setActiveTab('teacher'); setSearchQuery(''); }}
            >
              <Users size={15} /> Part 2: Teacher's Space
            </button>
            <button
              className={`guide-tab-btn ${activeTab === 'student' && !isSearching ? 'active' : ''}`}
              onClick={() => { setActiveTab('student'); setSearchQuery(''); }}
            >
              <GraduationCap size={15} /> Part 3: Student's Space
            </button>
            <button
              className={`guide-tab-btn ${activeTab === 'faq' && !isSearching ? 'active' : ''}`}
              onClick={() => { setActiveTab('faq'); setSearchQuery(''); }}
            >
              <HelpCircle size={15} /> FAQs & Tips
            </button>
          </div>

          <div className="guide-search-wrap">
            <Search size={16} className="guide-search-icon" />
            <input
              type="text"
              placeholder="Search features (e.g. WhatsApp, passkey, fees, video, Hindi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                } else if (e.key === 'Enter') {
                  const firstMatch = contentRef.current?.querySelector<HTMLElement>(
                    '.guide-card:not([style*="display: none"]), .faq-card:not([style*="display: none"])'
                  );
                  if (firstMatch) {
                    const headerOffset = 145;
                    const elementPosition = firstMatch.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                      top: Math.max(0, offsetPosition),
                      behavior: 'smooth',
                    });
                  }
                }
              }}
              className="guide-search-input"
            />
            {searchQuery && (
              <button
                className="guide-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search (Esc)"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="guide-layout">
        {/* Table of Contents Sticky Aside */}
        <aside className="guide-toc-sidebar">
          <div className="guide-toc-card">
            <h3>Table of Contents</h3>

            {(effectiveTab === 'all' || effectiveTab === 'public') && (
              <div className="toc-group">
                <span className="toc-group-title">Part 1: Public Portal</span>
                <a href="#public-nav" onClick={(e) => { e.preventDefault(); scrollToSection('public-nav'); }}>1.1 Header & Quick Navigation</a>
                <a href="#public-showcase" onClick={(e) => { e.preventDefault(); scrollToSection('public-showcase'); }}>1.2 Features Showcase</a>
                <a href="#public-sandbox" onClick={(e) => { e.preventDefault(); scrollToSection('public-sandbox'); }}>1.3 Interactive Sandbox & Demo</a>
                <a href="#public-signin" onClick={(e) => { e.preventDefault(); scrollToSection('public-signin'); }}>1.4 How to Enter Your Space</a>
              </div>
            )}

            {(effectiveTab === 'all' || effectiveTab === 'teacher') && (
              <div className="toc-group">
                <span className="toc-group-title">Part 2: Teacher's Space</span>
                <a href="#teacher-signup" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-signup'); }}>2.1 Teacher Sign Up & Sign In</a>
                <a href="#teacher-overview" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-overview'); }}>2.2 Overview & Metrics</a>
                <a href="#teacher-ai" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-ai'); }}>2.3 AI Teaching Assistant & Key Setup</a>
                <a href="#teacher-quizzes" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-quizzes'); }}>2.4 Quizzes & Live Rounds</a>
                <a href="#teacher-papers" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-papers'); }}>2.5 Word-Style Question Papers Studio</a>
                <a href="#teacher-students" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-students'); }}>2.6 Student Management & Passkeys</a>
                <a href="#teacher-whatsapp" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-whatsapp'); }}>2.7 WhatsApp Parent Notifications</a>
                <a href="#teacher-attendance" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-attendance'); }}>2.8 Daily Attendance Register</a>
                <a href="#teacher-fees" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-fees'); }}>2.9 Monthly Fees (Apr–Mar) & Receipts</a>
                <a href="#teacher-reports" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-reports'); }}>2.10 Academic Progress Reports</a>
                <a href="#teacher-results" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-results'); }}>2.11 Quiz Results & CSV Export</a>
                <a href="#teacher-archive" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-archive'); }}>2.12 Classroom Archive</a>
                <a href="#teacher-whiteboard" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-whiteboard'); }}>2.13 Online Whiteboard & Live Stream</a>
                <a href="#teacher-materials" onClick={(e) => { e.preventDefault(); scrollToSection('teacher-materials'); }}>2.14 Study Materials & AI Image Studio</a>
              </div>
            )}

            {(effectiveTab === 'all' || effectiveTab === 'student') && (
              <div className="toc-group">
                <span className="toc-group-title">Part 3: Student's Space</span>
                <a href="#student-login" onClick={(e) => { e.preventDefault(); scrollToSection('student-login'); }}>3.1 6-Character Passkey Sign In</a>
                <a href="#student-live" onClick={(e) => { e.preventDefault(); scrollToSection('student-live'); }}>3.2 Taking a Live Classroom Quiz</a>
                <a href="#student-practice" onClick={(e) => { e.preventDefault(); scrollToSection('student-practice'); }}>3.3 Timed & Self-Paced Quizzes</a>
                <a href="#student-papers" onClick={(e) => { e.preventDefault(); scrollToSection('student-papers'); }}>3.4 Solving Papers & Uploading Photos</a>
                <a href="#student-history" onClick={(e) => { e.preventDefault(); scrollToSection('student-history'); }}>3.5 Past Scores & Teacher Feedback</a>
                <a href="#student-calendar" onClick={(e) => { e.preventDefault(); scrollToSection('student-calendar'); }}>3.6 Class Calendar & Deadlines</a>
                <a href="#student-whiteboard" onClick={(e) => { e.preventDefault(); scrollToSection('student-whiteboard'); }}>3.7 Live Whiteboard & PDF Export</a>
              </div>
            )}

            {(effectiveTab === 'all' || effectiveTab === 'faq') && (
              <div className="toc-group">
                <span className="toc-group-title">Part 4: FAQs</span>
                <a href="#faq-section" onClick={(e) => { e.preventDefault(); scrollToSection('faq-section'); }}>Frequently Asked Questions</a>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Body */}
        <main className="guide-content-body" ref={contentRef}>
          {/* Welcome Banner */}
          <div className="guide-hero-card">
            <span className="hero-subtitle">Step-by-Step Practical Manual</span>
            <h2>Welcome to EduAshram (Maths Mentor)</h2>
            <p>
              EduAshram is an end-to-end digital teaching platform tailored for school classrooms, coaching centers, and tutors.
              From running high-energy live quiz competitions and creating printable A4 exam papers, to evaluating handwritten student
              notebook photos and sharing instant WhatsApp scorecards with parents — this guide will help you master every feature in minutes.
            </p>
          </div>

          {/* Live Search Feedback Banner */}
          {isSearching && (matchCount ?? 0) > 0 && (
            <div className="guide-search-banner">
              <div className="guide-search-banner-text">
                <Search size={16} />
                <span>
                  Found <strong>{matchCount}</strong> {matchCount === 1 ? 'topic' : 'topics'} matching "<strong>{searchQuery}</strong>"
                </span>
              </div>
              <button className="guide-search-clear-btn" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            </div>
          )}

          {/* Search Empty State */}
          {isSearching && matchCount === 0 && (
            <div className="guide-search-empty-state">
              <div className="guide-search-empty-icon">
                <Search size={36} />
              </div>
              <h3>No topics found for "{searchQuery}"</h3>
              <p>
                Try searching for other keywords like <strong>whiteboard</strong>, <strong>video</strong>, <strong>passkey</strong>, <strong>fees</strong>, <strong>hindi</strong>, or <strong>whatsapp</strong>.
              </p>
              <button className="button button-primary" onClick={() => setSearchQuery('')}>
                Clear Search & View All
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* PART 1: PUBLIC PORTAL */}
          {/* ========================================================== */}
          {(effectiveTab === 'all' || effectiveTab === 'public') && (
            <section className="guide-section" id="part-1-public">
              <div className="section-title-wrap">
                <span className="part-pill">Part 1</span>
                <h2>The Public Portal (For Visitors, Parents & Students)</h2>
              </div>
              <p className="section-intro">
                The Public Portal is the homepage accessible to anyone visiting your classroom URL (such as <code>https://maths-mentor-32kc.onrender.com</code>).
                It requires no login to browse and introduces students, parents, and prospective teachers to your classroom.
              </p>

              {/* 1.1 */}
              <div className="guide-card" id="public-nav">
                <h3><span className="step-num">1.1</span> Header & Quick Navigation</h3>
                <ul>
                  <li><strong>Brand Logo & Name</strong>: Displays <em>EduAshram</em> and the school tagline (<em>Understand Better. Achieve More</em>).</li>
                  <li><strong>All Materials & Grade Hubs</strong>: Allows students to explore study notes, formulas, and dedicated curriculum hubs for Grades 4 through 10.</li>
                  <li><strong>Portal Switcher Buttons</strong>:
                    <div className="inline-tags">
                      <span className="tag-pill tag-blue"><GraduationCap size={13} /> Student Passkey</span>
                      <span className="tag-pill tag-neutral"><LogIn size={13} /> Teacher Sign In</span>
                      <span className="tag-pill tag-purple"><UserPlus size={13} /> Join as Teacher</span>
                    </div>
                  </li>
                  <li><strong>Classroom Chat Widget</strong>: Located at the bottom right corner, offering live classroom assistance.</li>
                </ul>
              </div>

              {/* 1.2 */}
              <div className="guide-card" id="public-showcase">
                <h3><span className="step-num">1.2</span> Classroom Features Showcase</h3>
                <p>Visitors can scroll down the portal to review interactive feature cards explaining the curriculum:</p>
                <div className="feature-grid">
                  <div className="feature-mini-card">
                    <h4>🎯 Interactive Live Quizzes</h4>
                    <p>Real-time classroom games where students answer together and teachers reveal instant bar-chart analytics.</p>
                  </div>
                  <div className="feature-mini-card">
                    <h4>📄 Printable Question Papers</h4>
                    <p>Formal A4 exam papers for offline exams with handwritten student workbook photo submission.</p>
                  </div>
                  <div className="feature-mini-card">
                    <h4>🤖 AI Teaching Assistant</h4>
                    <p>Instant curriculum-aligned lesson generator with rich LaTeX math formulas and step-by-step solutions.</p>
                  </div>
                  <div className="feature-mini-card">
                    <h4>📱 Parent WhatsApp Updates</h4>
                    <p>Single-click assessment scorecards and homework announcements delivered directly to parents' WhatsApp.</p>
                  </div>
                </div>
              </div>

              {/* 1.3 */}
              <div className="guide-card" id="public-sandbox">
                <h3><span className="step-num">1.3</span> Interactive Sandbox & Demo Practice</h3>
                <p>Students and parents can try sample math problems directly on the homepage without entering any credentials:</p>
                <ol className="step-list">
                  <li>Click on any sample problem option (A, B, C, or D).</li>
                  <li>Immediate visual feedback highlights whether your answer is correct (green) or needs review (amber).</li>
                  <li>Read the step-by-step mathematical reasoning displayed beneath the question.</li>
                </ol>
              </div>

              {/* 1.4 */}
              <div className="guide-card" id="public-signin">
                <h3><span className="step-num">1.4</span> How to Enter Your Space</h3>
                <div className="callout callout-info">
                  <p><strong>Are you a Teacher?</strong> Click the <strong>"Teacher Sign In"</strong> button in the top right to access your classroom command center. If you are new, click <strong>"Join as Teacher"</strong> to create your workspace.</p>
                  <p style={{ marginTop: '8px' }}><strong>Are you a Student?</strong> Click the <strong>"Student Passkey"</strong> button and type your private 6-character code given by your teacher.</p>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================== */}
          {/* PART 2: TEACHER'S SPACE */}
          {/* ========================================================== */}
          {(effectiveTab === 'all' || effectiveTab === 'teacher') && (
            <section className="guide-section" id="part-2-teacher">
              <div className="section-title-wrap">
                <span className="part-pill part-pill-teacher">Part 2</span>
                <h2>Teacher's Space (Classroom Management Suite)</h2>
              </div>
              <p className="section-intro">
                The Teacher's Space is your complete teaching operations hub. It provides every tool you need to design tests, conduct live classes, evaluate homework, record fees, and keep parents updated.
              </p>

              {/* 2.1 Sign Up */}
              <div className="guide-card" id="teacher-signup">
                <h3><span className="step-num">2.1</span> Teacher Sign Up & Sign In</h3>
                <h4>How to Register as a New Teacher:</h4>
                <ol className="step-list">
                  <li>On the top navigation bar, click <strong>"Join as Teacher"</strong> (or <strong>"Create an Account"</strong> inside the Sign In modal).</li>
                  <li>Fill in the registration form:
                    <ul>
                      <li><strong>Full Name</strong>: e.g., <em>Gaurav Kumar Singh</em> (this name will appear on student question papers, progress reports, and WhatsApp messages).</li>
                      <li><strong>Email Address</strong>: Your active email (used for login and password recovery).</li>
                      <li><strong>Password</strong>: Choose a secure password (minimum 8 characters).</li>
                      <li><strong>School / Coaching Institute Name</strong>: e.g., <em>EduAshram High School & Coaching Academy</em>.</li>
                      <li><strong>Subject</strong>: e.g., <em>Mathematics</em> or <em>Science</em>.</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Register Teacher Account"</strong>.</li>
                  <li>Once approved by the master administrator, your account is activated and you will have your own isolated teaching workspace!</li>
                </ol>

                <h4 style={{ marginTop: '16px' }}>How to Sign In:</h4>
                <ol className="step-list">
                  <li>Click <strong>"Teacher Sign In"</strong>.</li>
                  <li>Enter your registered email and password.</li>
                  <li>Click <strong>"Sign In"</strong>. Your session is securely preserved with encrypted session cookies so you don't have to retype your password every time.</li>
                </ol>

                <h4 style={{ marginTop: '16px' }}>Forgot Password & Self-Service Account Recovery:</h4>
                <ol className="step-list">
                  <li>On the Teacher Sign In popup, click the <strong>"Forgot Password?"</strong> link.</li>
                  <li>Enter your registered teacher email and click <strong>"Send Reset Code"</strong>.</li>
                  <li>A secure 6-digit verification code is delivered directly to your inbox via the platform's SMTP mailer (valid for 15 minutes).</li>
                  <li>Enter the 6-digit code and choose your new password. Click <strong>"Reset Password"</strong> to regain access immediately.</li>
                  <li>School SuperAdmins can also reset teacher credentials or activate accounts directly from the SuperAdmin Console.</li>
                </ol>
              </div>

              {/* 2.2 Overview */}
              <div className="guide-card" id="teacher-overview">
                <h3><span className="step-num">2.2</span> Teacher Overview & Metrics Dashboard</h3>
                <p>The Overview tab serves as your morning dashboard:</p>
                <ul>
                  <li><strong>Class Metrics Bar</strong>: Instant counts of enrolled students, active live quizzes, pending question paper submissions, and today's attendance rate.</li>
                  <li><strong>Quick Action Launcher</strong>: One-click buttons to launch a live quiz, open the question paper builder, or jump to the AI Teaching Assistant.</li>
                  <li><strong>Recent Assessments Table</strong>: Shows the latest completed tests with student participation rates and highest scores.</li>
                </ul>
              </div>

              {/* 2.3 AI Assistant */}
              <div className="guide-card" id="teacher-ai">
                <h3><span className="step-num">2.3</span> AI Teaching Assistant & API Key Setup</h3>
                <p>The AI Teaching Assistant can draft full quiz sets, write step-by-step problem explanations, and solve complex formulas with LaTeX rendering.</p>
                
                <div className="callout callout-tip">
                  <strong>💡 Setting Up Your Free AI Key (One-Time Setup):</strong>
                  <ol style={{ marginTop: '8px', paddingLeft: '18px' }}>
                    <li>Click <strong>Settings</strong> in the teacher sidebar.</li>
                    <li>Select your AI Provider: <strong>Google Gemini</strong> (Recommended for free, blazing-fast performance), <strong>OpenAI (ChatGPT)</strong>, or <strong>Groq</strong>.</li>
                    <li>Paste your free API Key and click <strong>"Save Configuration"</strong>.</li>
                    <li>Your key is encrypted in your secure teacher profile and never exposed to students.</li>
                  </ol>
                </div>

                <h4 style={{ marginTop: '14px' }}>Using the Teaching Assistant:</h4>
                <ol className="step-list">
                  <li>Click <strong>AI Teaching Assistant</strong> in the sidebar.</li>
                  <li>Type any math prompt (e.g. <em>"Explain the Pythagorean Theorem for Grade 7 with 3 real-world word problems and formulas"</em>).</li>
                  <li>Click <strong>"Generate"</strong>. The AI will output structured explanations with highlighted steps and formulas.</li>
                  <li>Click <strong>"Save as Question Paper"</strong> to turn the explanation directly into a student worksheet!</li>
                </ol>
              </div>

              {/* 2.4 Quizzes */}
              <div className="guide-card" id="teacher-quizzes">
                <h3><span className="step-num">2.4</span> Quizzes & Classroom Live Rounds</h3>
                <p>EduAshram supports three test modes:</p>
                <div className="table-responsive">
                  <table className="guide-table">
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th>How It Works</th>
                        <th>Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Live Classroom</strong></td>
                        <td>The teacher broadcasts questions one by one. Students pick answers on their devices. The teacher reveals the answer with a live bar graph.</td>
                        <td>In-class competitions, revision rounds, Friday math bees.</td>
                      </tr>
                      <tr>
                        <td><strong>Timed Practice</strong></td>
                        <td>Students have a strict countdown timer (e.g., 20 mins). The test auto-submits when time expires.</td>
                        <td>Weekly unit tests, mock exams.</td>
                      </tr>
                      <tr>
                        <td><strong>Self-Paced</strong></td>
                        <td>No timer. Students can solve questions calmly, review their answers, and submit when ready.</td>
                        <td>Homework, weekend revision.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 style={{ marginTop: '16px' }}>How to Run a Live Classroom Quiz:</h4>
                <ol className="step-list">
                  <li>Find any quiz card and click <strong>"Start Live Quiz"</strong>.</li>
                  <li>The <strong>Classroom Monitor</strong> bar appears at the top showing connected students.</li>
                  <li>Students see the active question on their screens and submit their choices.</li>
                  <li>Click <strong>"Reveal Answer"</strong> to show which option is correct, along with student distribution stats.</li>
                  <li>Click <strong>"Next Question"</strong> to advance the whole class together.</li>
                  <li>Click <strong>"End Quiz"</strong> to finalize scores and send results to the analytics ledger.</li>
                </ol>

                <h4 style={{ marginTop: '16px' }}>Live Quiz Sound Effects & Audio Countdown:</h4>
                <p>Live classroom rounds feature energetic sound effects (ticking countdowns, suspense audio, and correct-answer celebrations). Teachers and students can mute or unmute audio at any time via the sound icon on the live monitor.</p>

                <h4 style={{ marginTop: '16px' }}>Pure Hindi (हिन्दी माध्यम) & Bilingual Quiz Generation:</h4>
                <p>When generating quizzes or lesson plans with the AI Assistant, select between <strong>English</strong>, <strong>Pure Hindi (हिन्दी माध्यम)</strong>, or <strong>Bilingual</strong>. For Hindi-medium schools, question prompts, mathematical instructions, theorems, and MCQ options are generated in clean Devanagari Hindi aligned with state boards and CBSE.</p>
              </div>

              {/* 2.5 Word-Style Question Papers */}
              <div className="guide-card" id="teacher-papers">
                <h3><span className="step-num">2.5</span> Word-Style Question Papers Studio</h3>
                <p>For formal school exams, terminal tests, and physical worksheets:</p>
                
                <h4>1. Creating a Question Paper:</h4>
                <ol className="step-list">
                  <li>In the sidebar, click <strong>Question Papers</strong>.</li>
                  <li>Click <strong>"Create manually"</strong> or <strong>"Generate with AI"</strong>.</li>
                  <li>Enter the <strong>Title</strong> (e.g. <em>Half-Yearly Examination 2026</em>), <strong>Class</strong>, <strong>Time Allowed</strong> (e.g. 90 mins), and <strong>Total Marks</strong> (e.g. 80).</li>
                  <li>Add student instructions and formatted questions organized by Section (Section A: 1-mark MCQs, Section B: 3-mark proofs, Section C: 5-mark word problems).</li>
                  <li>Click <strong>"Save as Draft"</strong> or <strong>"Publish"</strong>.</li>
                </ol>

                <h4 style={{ marginTop: '16px' }}>2. Printing A4 Physical Papers for Photocopying:</h4>
                <ol className="step-list">
                  <li>Click <strong>"View Paper"</strong> on any published paper card.</li>
                  <li>A formatted A4 layout opens with school header, student fill-in blanks (<code>Name: _________</code>, <code>Roll No: _________</code>), and clean question margins.</li>
                  <li>Click <strong>"Print Paper"</strong>. The browser automatically strips menus and prints a sharp, black-and-white exam paper ready for the photocopier.</li>
                </ol>

                <h4 style={{ marginTop: '16px' }}>3. Evaluating Handwritten Answer Sheet Photos:</h4>
                <ol className="step-list">
                  <li>When students upload photos of their handwritten notebooks, click <strong>"Submissions"</strong> on the paper card.</li>
                  <li>Select a student from the list to view their uploaded photos.</li>
                  <li>Use the built-in <strong>Zoom</strong> and <strong>Rotate</strong> buttons to inspect handwriting.</li>
                  <li>Enter the <strong>Score Awarded</strong> (e.g., <code>46 / 50</code>) and write personalized <strong>Teacher Remarks</strong>.</li>
                  <li>Click <strong>"Save Grade & Remarks"</strong>. The student immediately sees their evaluated paper in their portal.</li>
                </ol>

                <h4 style={{ marginTop: '16px' }}>4. AI Auto-Evaluation for Handwritten Submissions:</h4>
                <p>Click <strong>"Auto-Evaluate with AI"</strong> on any student submission. Google Gemini Vision analyzes the handwritten steps against the question paper and answer key, grades each problem, detects arithmetic or sign mistakes, and drafts personalized remarks. Teachers can review, tweak marks, and approve in 1 click.</p>

                <h4 style={{ marginTop: '16px' }}>5. Teacher Mobile Uploads via Dynamic QR Code:</h4>
                <p>When collecting offline paper sheets in class, click <strong>"Upload via Mobile Camera"</strong> to generate a dynamic QR code. Scan it with any smartphone camera to snap and upload multiple pages directly from your phone — syncing in real time to the desktop gallery without requiring cable transfer or phone logins.</p>
              </div>

              {/* 2.6 Students & Passkeys */}
              <div className="guide-card" id="teacher-students">
                <h3><span className="step-num">2.6</span> Student Directory & 6-Character Passkeys</h3>
                <h4>Adding a New Student:</h4>
                <ol className="step-list">
                  <li>Go to <strong>Students</strong> in the navigation bar.</li>
                  <li>In the <strong>"Add to your class"</strong> panel:
                    <ul>
                      <li>Enter <strong>Student Name</strong> (e.g. <em>Vanya Singh</em>).</li>
                      <li>Select their <strong>Class / Grade</strong> (e.g. <em>Grade 5</em>).</li>
                      <li>Set <strong>Date of Joining</strong> (used for fee ledger and attendance).</li>
                      <li>Enter <strong>Parent WhatsApp Number</strong> (10-digit Indian mobile number, e.g. <code>9876543210</code>). The <code>+91</code> prefix is automatic.</li>
                      <li><em>(Optional)</em> Enter <strong>Parent Name</strong> (e.g. <em>Mr. Rajesh Singh</em>).</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Add student"</strong>.</li>
                  <li>The system immediately generates a secure <strong>6-character Passkey</strong> (e.g., <code>K7M2P9</code>). Click <strong>"Copy Passkey"</strong> and give it to the student.</li>
                </ol>

                <h4 style={{ marginTop: '14px' }}>Roster Action Icons:</h4>
                <ul>
                  <li><strong>WhatsApp Pill (<Smartphone size={13} />)</strong>: Opens an instant WhatsApp chat with the parent.</li>
                  <li><strong>Show / Copy Passkey</strong>: Reveals or copies the student's 6-character code.</li>
                  <li><strong>Reset Passkey (<RefreshCw size={13} />)</strong>: Generates a fresh passkey if a student forgets theirs.</li>
                  <li><strong>Pause Student Access</strong>: Temporarily disables student sign-in without deleting their data.</li>
                  <li><strong>Delete Student</strong>: Permanently removes the record.</li>
                </ul>
              </div>

              {/* 2.7 WhatsApp */}
              <div className="guide-card" id="teacher-whatsapp">
                <h3><span className="step-num">2.7</span> WhatsApp Parent Notifications & Instant Scorecards</h3>
                <p>
                  EduAshram includes native WhatsApp integration designed specifically for Indian parents. It uses 100% free web links (<code>wa.me</code>) with no API costs or verification delays.
                </p>

                <h4>1. Sending an Individual Quiz Scorecard:</h4>
                <ol className="step-list">
                  <li>Go to <strong>Results</strong> and choose any completed quiz.</li>
                  <li>Next to any student row, click the green <strong>"WhatsApp"</strong> button.</li>
                  <li>If the parent's phone is already saved, WhatsApp Web or Mobile opens instantly with the student's scorecard pre-formatted!</li>
                  <li>If the parent's phone was not yet saved, a quick prompt asks for the 10-digit number, saves it to the student's profile, and opens WhatsApp immediately.</li>
                  <li>Review the message in WhatsApp and tap <strong>Send</strong>.</li>
                </ol>

                <div className="code-sample-box">
                  <div className="code-sample-header">
                    <span>Sample Scorecard Format (Clean ASCII - No broken question marks)</span>
                    <button
                      className="copy-sample-btn"
                      onClick={() => copyToClipboard(sampleScorecardText, 'scorecard')}
                    >
                      {copiedId === 'scorecard' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      {copiedId === 'scorecard' ? 'Copied!' : 'Copy Template'}
                    </button>
                  </div>
                  <pre>{sampleScorecardText}</pre>
                </div>

                <h4 style={{ marginTop: '16px' }}>2. Announcing New Question Papers & Homework:</h4>
                <p>On any Question Paper card, click the <strong>"WhatsApp"</strong> button next to <em>View Paper</em>. This generates a class homework announcement ready to paste into your class parents' WhatsApp group:</p>

                <div className="code-sample-box">
                  <div className="code-sample-header">
                    <span>Sample Homework Announcement</span>
                    <button
                      className="copy-sample-btn"
                      onClick={() => copyToClipboard(sampleHomeworkText, 'homework')}
                    >
                      {copiedId === 'homework' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      {copiedId === 'homework' ? 'Copied!' : 'Copy Template'}
                    </button>
                  </div>
                  <pre>{sampleHomeworkText}</pre>
                </div>
              </div>

              {/* 2.8 Attendance */}
              <div className="guide-card" id="teacher-attendance">
                <h3><span className="step-num">2.8</span> Daily Attendance Register</h3>
                <ol className="step-list">
                  <li>In the <strong>Students</strong> section, click <strong>"Attendance Register"</strong>.</li>
                  <li>Select the date from the date picker (defaults to today).</li>
                  <li>Click <strong>"Mark All Present"</strong> for quick 1-click marking.</li>
                  <li>For absent, late, or excused students, toggle their badge:
                    <div className="inline-tags" style={{ marginTop: '6px' }}>
                      <span className="tag-pill tag-green">P = Present</span>
                      <span className="tag-pill tag-red">A = Absent</span>
                      <span className="tag-pill tag-amber">L = Late</span>
                      <span className="tag-pill tag-blue">E = Excused</span>
                    </div>
                  </li>
                  <li>The summary widget instantly shows the class attendance percentage for the day and the monthly average.</li>
                </ol>
              </div>

              {/* 2.9 Fees */}
              <div className="guide-card" id="teacher-fees">
                <h3><span className="step-num">2.9</span> Monthly Fees Ledger (April to March Session)</h3>
                <p>Manage tuition and school fee records across the standard Indian academic session:</p>
                <ol className="step-list">
                  <li>In the <strong>Students</strong> section, click <strong>"Monthly Fees (Apr–Mar)"</strong>.</li>
                  <li>Select any student to view their 12-month schedule from April through March.</li>
                  <li>Update monthly payment status: <code>PAID</code>, <code>PENDING</code>, <code>OVERDUE</code>, or <code>PARTIAL</code>.</li>
                  <li>Record the payment mode: <strong>Cash</strong>, <strong>UPI / Google Pay</strong>, <strong>Bank Transfer</strong>, or <strong>Cheque</strong>.</li>
                  <li><strong>Print Formal Fee Slip</strong>: Click <strong>"Print Receipt"</strong> on any paid month to generate a formal fee slip complete with receipt number, school logo, student name, amount paid, and teacher signature line.</li>
                </ol>
              </div>

              {/* 2.10 Reports */}
              <div className="guide-card" id="teacher-reports">
                <h3><span className="step-num">2.10</span> Academic Progress Reports & Year-Long Scorecards</h3>
                <ol className="step-list">
                  <li>Click <strong>"Progress Reports"</strong> inside the Students tab.</li>
                  <li>Select a student to view their comprehensive academic profile:
                    <ul>
                      <li>Overall percentage score and grade across all assessments.</li>
                      <li>Month-by-month trajectory graph.</li>
                      <li>Topic-wise mastery breakdown (identifying strong topics and chapters needing revision).</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Print Formal Progress Report Card"</strong> to produce a signed annual report card for parent-teacher meetings.</li>
                </ol>
              </div>

              {/* 2.11 Results */}
              <div className="guide-card" id="teacher-results">
                <h3><span className="step-num">2.11</span> Quiz Results & CSV Analytics Export</h3>
                <ul>
                  <li><strong>Month Filtering</strong>: Use the month picker in the top right corner to filter quizzes conducted in any month (e.g. <em>October 2026</em>) or view <em>All Months</em>.</li>
                  <li><strong>Scoreboard</strong>: View which students completed the quiz, scores achieved, and time spent.</li>
                  <li><strong>Review Individual Answers</strong>: Click any student's name to see their question-by-question answer sheet with green/red answer badges.</li>
                  <li><strong>Class Answer Distribution</strong>: Identify which specific questions had low success rates across the class so you can re-teach that topic.</li>
                  <li><strong>Export to Excel / CSV</strong>: Click <strong>"Export CSV"</strong> to download a spreadsheet with student names, marks, completion times, parent names, and WhatsApp phone numbers.</li>
                  <li><strong>Restart Quiz</strong>: If a student encountered technical difficulty or needs a retest, click <strong>"Restart Quiz"</strong> next to their name.</li>
                </ul>
              </div>

              {/* 2.12 Archive */}
              <div className="guide-card" id="teacher-archive">
                <h3><span className="step-num">2.12</span> Classroom Archive</h3>
                <p>
                  To keep your active workspace uncluttered, click <strong>"Mark Finished"</strong> on any quiz or question paper.
                  It moves to the <strong>Archive</strong> tab. All past student scores, answer sheets, and evaluation records are preserved permanently.
                  You can review or restore archived assessments anytime.
                </p>
              </div>

              {/* 2.13 Online Whiteboard & Live Broadcasting */}
              <div className="guide-card" id="teacher-whiteboard">
                <h3><span className="step-num">2.13</span> Online Teaching Whiteboard & Live Class Broadcasting</h3>
                <p>An infinite vertical digital canvas equipped for mathematical and scientific instruction:</p>
                <ul>
                  <li><strong>Canvas Backgrounds</strong>: Switch between Ruled Notebook, Square Grid (algebra/geometry), Dot Grid, Dark Chalkboard, or Cartesian Graph with custom intervals.</li>
                  <li><strong>Geometry Tools</strong>: Virtual Ruler, Compass, 180°/360° Protractor, and Set Squares for accurate on-screen diagrams.</li>
                  <li><strong>Drawing & Notes</strong>: Freehand pens, highlighters, geometric shape auto-detection, sticky notes, LaTeX math formulas, and image insertion.</li>
                  <li><strong>Single-Page Infinite Canvas for PDF & PPT Imports</strong>: Import multi-page PDF worksheets, question papers, or PowerPoint presentations (PPT/PPTX). All slides and pages are automatically placed and vertically stacked on a <em>Single Continuous Page with Infinite Scroll enabled</em>, allowing you to scroll down smoothly and annotate without switching tabs.</li>
                  <li><strong>Synchronized Educational Video Widgets</strong>: Embed YouTube, Vimeo, or MP4 video files directly on the board. The teacher retains exclusive playback control (Play, Pause, Scrub timeline, 16:9 lock, Resize, Minimize, Remove).</li>
                  <li><strong>Sub-Second Real-Time Playback Synchronization</strong>: When playing or pausing a video, student screens sync in real time with sub-second accuracy. Pausing freezes student screens on the exact same frame, and any drift over 1.2s is automatically corrected.</li>
                  <li><strong>Live Broadcasting</strong>: Select your target grade or <em>All Grades</em> and click <strong>"Go Live"</strong>. Your strokes, pages, background grid changes, and vertical scroll coordinates broadcast in real time to connected students.</li>
                  <li><strong>Universal Anytime Student Join</strong>: Any number of students can join the live broadcast at any point during class; the server instantly delivers the active board state, scroll position, and synchronized video playback with zero delay.</li>
                  <li><strong>Background Session Persistence</strong>: Switching tabs to check calendar, quizzes, or students does not stop your broadcast. A floating banner displays with a quick <em>Return to Whiteboard</em> button.</li>
                  <li><strong>Standalone Pop-Out Window</strong>: Click <em>Open in Window</em> to snap the whiteboard alongside Zoom, reference books, or presentation windows.</li>
                </ul>
              </div>

              {/* 2.14 Study Materials & AI Image Studio */}
              <div className="guide-card" id="teacher-materials">
                <h3><span className="step-num">2.14</span> Public Study Materials Hub & AI Article Image Studio</h3>
                <ul>
                  <li><strong>Publishing Notes & Guides</strong>: Create formatted chapter notes, formula sheets, and video lessons with LaTeX math equations and embedded YouTube videos.</li>
                  <li><strong>AI Article Image Studio</strong>: Click <em>"Generate Image with AI"</em> inside the editor to generate custom mathematical diagrams, 3D geometric visuals, or science figures from text prompts.</li>
                  <li><strong>Custom Card Formats</strong>: Choose between thumbnail cards and wide hero banners for responsive presentation across mobile and desktop.</li>
                  <li><strong>Public & Student Access</strong>: Materials are instantly published to the classroom Study Materials Hub for revision.</li>
                </ul>
              </div>
            </section>
          )}

          {/* ========================================================== */}
          {/* PART 3: STUDENT'S SPACE */}
          {/* ========================================================== */}
          {(effectiveTab === 'all' || effectiveTab === 'student') && (
            <section className="guide-section" id="part-3-student">
              <div className="section-title-wrap">
                <span className="part-pill part-pill-student">Part 3</span>
                <h2>Student's Space (Learning & Practice Portal)</h2>
              </div>
              <p className="section-intro">
                The Student's Space is built to be fast, clear, and distraction-free so children of all age groups can participate effortlessly.
              </p>

              {/* 3.1 Passkey Sign In */}
              <div className="guide-card" id="student-login">
                <h3><span className="step-num">3.1</span> 6-Character Passkey Sign In (No Email Needed)</h3>
                <p>Students do not need to memorize passwords or provide email addresses:</p>
                <ol className="step-list">
                  <li>Open the classroom website (e.g. <code>https://maths-mentor-32kc.onrender.com</code>).</li>
                  <li>Click <strong>"Student Passkey"</strong> (or <strong>"Student Login"</strong>).</li>
                  <li>Type your 6-character passkey provided by your teacher (e.g. <code>K7M2P9</code>).</li>
                  <li>Click <strong>"Enter Classroom"</strong>.</li>
                  <li>You will see your personal dashboard with your name and class practice materials.</li>
                </ol>
              </div>

              {/* 3.2 Live Quiz */}
              <div className="guide-card" id="student-live">
                <h3><span className="step-num">3.2</span> Taking a Live Classroom Quiz</h3>
                <ol className="step-list">
                  <li>When your teacher starts a live test in class, a red <strong>"● LIVE NOW"</strong> banner appears on the quiz card.</li>
                  <li>Click <strong>"Join Quiz"</strong>.</li>
                  <li>The active question appears in large, easy-to-read text with options A, B, C, and D.</li>
                  <li>Tap your choice. Your device shows: <em>"Answer submitted! Waiting for teacher to reveal..."</em></li>
                  <li>When the teacher reveals the answer, your screen flashes green (if correct) or red (if incorrect) with the explanation.</li>
                  <li>The teacher advances the questions until the quiz is completed.</li>
                </ol>
              </div>

              {/* 3.3 Timed & Self-Paced */}
              <div className="guide-card" id="student-practice">
                <h3><span className="step-num">3.3</span> Timed & Self-Paced Practice Quizzes</h3>
                <ol className="step-list">
                  <li>In <strong>Open Classroom</strong>, select any available practice quiz.</li>
                  <li>If <strong>Timed</strong>: A countdown clock displays at the top (e.g., <code>15:30 remaining</code>). Solve questions before the time runs out.</li>
                  <li>If <strong>Self-Paced</strong>: Take all the time you need. Use the <em>Next</em> and <em>Previous</em> buttons to review and modify your answers.</li>
                  <li>Click <strong>"Submit Quiz"</strong>. Your score and step-by-step solutions are shown immediately.</li>
                </ol>
              </div>

              {/* 3.4 Uploading Workbook Photos */}
              <div className="guide-card" id="student-papers">
                <h3><span className="step-num">3.4</span> Solving Question Papers & Uploading Workbook Photos</h3>
                <p>For written homework, problem sets, and descriptive mathematics tests:</p>
                <ol className="step-list">
                  <li>In <strong>Open Classroom</strong>, scroll to <strong>Open Question Papers & Worksheets</strong>.</li>
                  <li>Click <strong>"View Paper"</strong> to read the questions, marks distribution, and time allowed.</li>
                  <li><strong>Solve in Your Physical Notebook</strong>: Write neat step-by-step solutions on paper with question numbers clearly labeled.</li>
                  <li><strong>Take Clear Photos</strong>:
                    <ul>
                      <li>Click <strong>"Upload Answer Sheet Photos"</strong>.</li>
                      <li>On a phone or tablet, your camera opens directly to take photos of Page 1, Page 2, Page 3, etc.</li>
                      <li>On a laptop, select the saved photo files.</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Submit Answer Sheets"</strong>. Your submission is received by your teacher for grading.</li>
                </ol>
              </div>

              {/* 3.5 History & Feedback */}
              <div className="guide-card" id="student-history">
                <h3><span className="step-num">3.5</span> Reviewing Past Scores & Teacher Feedback</h3>
                <ul>
                  <li><strong>Quiz History</strong>: Tap <em>Quiz History</em> to review every past quiz, your score, correct answers, and math solutions.</li>
                  <li><strong>Paper History</strong>: Tap <em>Paper History</em> to see teacher-evaluated written papers. You will see your marks (e.g., <code>45 / 50</code>) and read personal comments and advice written by your teacher.</li>
                </ul>
              </div>

              {/* 3.6 Calendar */}
              <div className="guide-card" id="student-calendar">
                <h3><span className="step-num">3.6</span> Class Calendar & Deadlines</h3>
                <p>
                  Click <strong>"Class Calendar & Reminders"</strong> to check upcoming quiz dates, homework submission deadlines, and school holidays scheduled by your teacher.
                </p>
              </div>

              {/* 3.7 Student Live Whiteboard */}
              <div className="guide-card" id="student-whiteboard">
                <h3><span className="step-num">3.7</span> Live Whiteboard, Video Streaming & Notes PDF Export</h3>
                <p>Follow along with your teacher's digital chalkboard in real time during live lectures:</p>
                <ul>
                  <li><strong>Join Live Stream</strong>: When class starts, click the red <em>"Join Live Board →"</em> banner on your dashboard or the <em>Live Whiteboard</em> tab in the sidebar.</li>
                  <li><strong>Universal Anytime Join</strong>: Join at any moment during the lecture. All previous teacher drawings, geometry shapes, textbook slide annotations, and active video timestamps appear on your screen immediately.</li>
                  <li><strong>Real-Time Notes</strong>: Teacher's strokes, diagrams, formulas, background grid switches, and infinite page scrolling appear on your screen instantly.</li>
                  <li><strong>Follow Teacher Mode</strong>: By default, the screen auto-scrolls to where the teacher is writing. You can disable this to review previous pages and click <em>"Jump to Teacher"</em> when ready.</li>
                  <li><strong>Synchronized Educational Video Viewing</strong>: When the teacher plays a video lesson, it plays on your screen in real time. Video playback is teacher-managed to prevent accidental skipping. Students have an accessible <strong>Mute / Unmute</strong> button and volume slider to adjust audio on their own device.</li>
                  <li><strong>Download PDF</strong>: Click <strong>"Download PDF"</strong> anytime to save all whiteboard pages as an offline study guide on your device.</li>
                </ul>
              </div>
            </section>
          )}

          {/* ========================================================== */}
          {/* PART 4: FAQS */}
          {/* ========================================================== */}
          {(effectiveTab === 'all' || effectiveTab === 'faq') && (
            <section className="guide-section" id="faq-section">
              <div className="section-title-wrap">
                <span className="part-pill part-pill-faq">FAQ</span>
                <h2>Frequently Asked Questions</h2>
              </div>

              <div className="faq-grid">
                <div className="faq-card">
                  <h4>Q: What if a teacher forgets their password?</h4>
                  <p><strong>A:</strong> Click "Teacher Sign In" and click "Forgot Password?". Enter your registered email address to receive an instant 6-digit OTP verification code via SMTP email (valid for 15 minutes). Type the code and your new password to regain access immediately. School SuperAdmins can also reset teacher credentials directly in the SuperAdmin Console.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: How does video playback work on the Live Whiteboard?</h4>
                  <p><strong>A:</strong> Teachers can embed YouTube, Vimeo, or MP4 video files directly on the whiteboard canvas. Playback is synchronized across all students with sub-second precision. When you pause the video, all student screens freeze on the exact same frame. Students cannot interrupt playback, but have personal mute/unmute and volume controls.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: How do multi-page PDFs and PPT presentations load on the whiteboard?</h4>
                  <p><strong>A:</strong> All pages and slides are automatically placed and vertically stacked on a single continuous page with Infinite Scroll enabled. Teachers can scroll down smoothly to teach and annotate without switching tabs.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: Can quizzes and question papers be generated in Hindi?</h4>
                  <p><strong>A:</strong> Yes! When generating quizzes or question papers using the AI Teaching Assistant, select Pure Hindi (हिन्दी माध्यम). Questions, instructions, theorems, and MCQ options are generated in clean Devanagari Hindi terminology aligned with Hindi-medium state boards and CBSE.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: Can students join the Live Whiteboard if they are late to class?</h4>
                  <p><strong>A:</strong> Yes! Students can join at any point. When they click "Join Live Board", the server immediately delivers the complete active board drawings, notes, and running video timestamps so they catch up with zero delay.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: Does sending WhatsApp scorecards cost any money?</h4>
                  <p><strong>A:</strong> No, zero cost. The platform uses standard WhatsApp Web links (<code>wa.me</code>) that launch WhatsApp directly on your device with pre-filled scores. It requires no paid API keys or monthly subscriptions.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: Can students see other students' marks?</h4>
                  <p><strong>A:</strong> No. Each student logs in with their private 6-character passkey. Students can only see their own test papers, answers, and teacher feedback.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: Does the Live Whiteboard consume heavy internet data?</h4>
                  <p><strong>A:</strong> No. Unlike screen-sharing video feeds, EduAshram transmits lightweight vector coordinates via WebSockets, consuming only a fraction of regular data and working smoothly over 4G/hotspot connections.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: How accurate is AI Auto-Evaluation for student handwriting?</h4>
                  <p><strong>A:</strong> Powered by Google Gemini Vision fine-tuned for math, it accurately transcribes equations, step proofs, and fractions from phone photos. Teachers always retain full authority to review, tweak, and approve marks.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: What if a student loses their passkey?</h4>
                  <p><strong>A:</strong> The teacher can open the <em>Students</em> directory, click the eye icon to view the existing passkey, or click the refresh icon to issue a new one in 1 second.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: Does the app work on mobile phones?</h4>
                  <p><strong>A:</strong> Yes! The entire platform is 100% responsive and works smoothly on Android phones, iPhones, iPads, Chromebooks, laptops, and smart classroom boards.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: What happens if a student accidentally closes the browser during a quiz?</h4>
                  <p><strong>A:</strong> Answers are saved in real-time. The student can simply re-enter their passkey and immediately resume where they left off with their remaining time intact.</p>
                </div>

                <div className="faq-card">
                  <h4>Q: Can I print question papers on paper for offline classroom exams?</h4>
                  <p><strong>A:</strong> Yes! Click "View Paper" and then "Print Paper". The system formats the exam into clean black-and-white A4 pages with student header lines ready for photocopying.</p>
                </div>
              </div>
            </section>
          )}

          {/* Bottom Call to Action */}
          <div className="guide-footer-card">
            <div className="footer-card-copy">
              <h3>Ready to start teaching or practising?</h3>
              <p>Return to your classroom or public portal and explore all features live.</p>
            </div>
            <button className="button button-primary" onClick={onBack}>
              <ArrowLeft size={16} /> Return {userRole ? 'to Classroom' : 'to Portal'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
