# EduAshram / Maths Mentor — Complete User Guide
### A Step-by-Step Practical Manual for Teachers, Students & School Administrators

Welcome to **EduAshram (Maths Mentor)**! This platform is designed to make classroom teaching, quizzes, offline paper grading, student progress tracking, fee records, and parent communication effortless, interactive, and modern.

This user guide is divided into three comprehensive parts:
1. **[Part 1: The Public Portal](#part-1-the-public-portal)** — What visitors, parents, and students see before signing in.
2. **[Part 2: Teacher's Space](#part-2-teachers-space)** — A complete operational manual for educators covering signup, AI assistants, live quizzes, question paper builder, WhatsApp reports, attendance, fees, and analytics.
3. **[Part 3: Student's Space](#part-3-students-space)** — A simple guide for students on how to join with their 6-character passkey, take live tests, and upload handwritten workbook sheets.

---

# Part 1: The Public Portal

The Public Portal is the homepage accessible at your classroom URL (e.g., `https://maths-mentor-32kc.onrender.com` or `http://localhost:4000`). It is designed to be welcoming, fast, and easy to navigate for parents, new students, and visitors.

### 1.1 Header & Quick Navigation
- **Platform Brand Logo & Title**: Displays **EduAshram** and the school/classroom motto (*"Understand Better. Achieve More"*).
- **Portal Switcher / Sign In Buttons**:
  - **Student Login**: Click to open the simple 6-character passkey prompt.
  - **Teacher Login**: Click to access the educator dashboard with email & password.
  - **Classroom Chat / Ask AI Widget**: An accessible quick-help button located in the corner for instant assistance.

### 1.2 Feature Showcase
Visitors can explore interactive overview cards explaining the core strengths of the classroom:
- **Interactive Live Quizzes**: Explaining how live classroom rounds work in real-time.
- **Word-Style Question Papers**: Information on printed/digital exam papers and workbook answer sheet submission.
- **AI Teaching Assistant**: How artificial intelligence powers custom question generation and step-by-step math explanations.
- **Student Progress & Fee Registers**: Transparent academic session record-keeping.

### 1.3 Interactive Sandbox & Demo Practice
- Students and parents can preview sample questions without signing in to get familiar with the test format.
- Click any sample option to test instant answer checking and explanations.

### 1.4 How to Enter Your Space from the Public Portal
- **If you are a Teacher**: Click **"Teacher Login"** in the top-right corner.
- **If you are a Student**: Click **"Student Login"** or enter your 6-character passkey directly in the student sign-in modal.

---

# Part 2: Teacher's Space

The **Teacher's Space** is your complete digital classroom command center. Once logged in, you can manage everything from curriculum generation to parent communications.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TEACHER'S DASHBOARD                           │
├──────────────┬─────────────────────────────────────────────────────────┤
│ Overview     │ Summary metrics, quick action launcher, recent tests    │
│ AI Assistant │ Live teaching canvas, LaTeX formula solver, AI quiz gen │
│ Calendar     │ Class test schedules, assignment deadlines, holidays    │
│ Whiteboard   │ Multi-page infinite canvas, geometry tools, Live Stream │
│ Quizzes      │ Live classroom rounds, sound FX, classroom monitor      │
│ Papers       │ Word-like exam builder, printing, AI Auto-Evaluation    │
│ Materials    │ Study Materials Hub, revision notes, AI Image Studio    │
│ Students     │ Directory, WhatsApp parent chat, attendance, fees       │
│ Results      │ Assessment analytics, answer review, WhatsApp scorecard │
│ Archive      │ Completed quizzes & papers safely preserved             │
│ Settings     │ Personal AI API Key, school name, active grade levels   │
└──────────────┴─────────────────────────────────────────────────────────┘
```

---

## 2.1 Teacher Sign Up & Sign In

### How to Sign Up (First-Time Teacher)
1. On the homepage, click **Teacher Login**.
2. If self-registration is enabled, click **"Create an Account"**.
3. Fill in:
   - **Full Name**: e.g., *Gaurav Kumar Singh* (this name appears on printed student papers, progress reports, and WhatsApp messages).
   - **Email Address**: Your official or personal email (e.g., `teacher@school.com`).
   - **Password**: Create a secure password (minimum 8 characters).
   - **School / Coaching Institute Name**: e.g., *EduAshram Central*.
   - **Subject**: e.g., *Mathematics*, *Science*, etc.
4. Click **Create Teacher Account**. You will be logged in immediately.

### How to Sign In
1. Go to **Teacher Login**.
2. Enter your registered email address and password.
3. Click **Sign In**.
4. *Tip*: If you stay logged in on your personal laptop, your session is saved securely via encrypted HTTP-only session cookies.

### Forgot Password & Account Recovery (Self-Service via Email)
If you forget your teacher account password:
1. On the **Teacher Login** popup, click the **"Forgot Password?"** link.
2. Enter your registered teacher email address and click **"Send Reset Code"**.
3. A secure, time-sensitive 6-digit OTP verification code is dispatched immediately to your email inbox via the platform's SMTP mail service (valid for 15 minutes).
4. Enter the 6-digit verification code and type your new secure password (minimum 8 characters).
5. Click **"Reset Password"**. Your credentials update instantly and you can log in immediately.
- *Administrator Assistance*: School SuperAdmins also have administrative authority to reset passwords or verify teacher accounts directly inside the **SuperAdmin Console**.

---

## 2.2 Teacher Overview & Classroom Dashboard
The Overview tab gives you an immediate bird's-eye view of your teaching day:
- **Metrics Bar**:
  - **Total Enrolled Students** (click to jump to Student Directory).
  - **Live / Active Quizzes** (click to view running monitors).
  - **Open Question Papers** (click to check student submissions).
  - **Today's Attendance Rate** (percentage of students present).
- **Quick Action Launcher**:
  - **"Launch Live Quiz"**: Start an interactive round in 1 click.
  - **"New Question Paper"**: Open the Word-style exam builder.
  - **"AI Teaching Assistant"**: Generate lesson notes and problems.

---

## 2.3 AI Teaching Assistant & Live Teaching Canvas

The AI Assistant is your 24/7 pedagogical partner. It can solve complex math problems, generate step-by-step explanations, and draft whole test papers from your syllabus.

### Setting Up Your Free AI Key (One-Time Setup)
1. In the sidebar, click **Settings** (or **AI Settings**).
2. Choose your preferred AI Provider:
   - **Google Gemini** (*Recommended* — very fast, supports free API keys).
   - **OpenAI (ChatGPT)**.
   - **Groq** (ultra-fast open models).
   - **Anthropic Claude** or **DeepSeek**.
3. Paste your API Key into the **API Key** input.
4. Click **Save AI Configuration**. Your key is securely encrypted and never shared.

### Using the Live Teaching Canvas
1. In the sidebar, click **AI Teaching Assistant**.
2. Type or paste any math problem, concept, or curriculum topic (e.g., *"Explain quadratic formula with visual steps and 3 word problems for Grade 9"*).
3. The AI renders rich LaTeX formulas, highlighted steps, and pedagogical diagrams.
4. **Action Buttons**:
   - **Copy Formula**: Copies clean text for worksheets.
   - **Save as Draft in Question Papers**: Instantly turns the generated lesson into a physical or online worksheet.
   - **Export to Study Materials**: Publishes it to your classroom reference library.

---

## 2.4 Quizzes & Worksheets Management

EduAshram supports **three distinct test modes** to fit every teaching scenario:

| Mode | How it Works | Best Used For |
| :--- | :--- | :--- |
| **Live Classroom** | Teacher controls the screen question-by-question. Students answer simultaneously. Teacher reveals answers with real-time bar graphs. | In-class revision, competitive rounds, Friday quizzes. |
| **Timed Practice** | Student has an individual countdown timer (e.g., 20 mins). Auto-submits when time expires. | Mock tests, weekly chapter tests. |
| **Self-Paced** | No time limit. Students can solve problems at their own pace and return later. | Homework, weekend assignments. |

### Creating a Quiz Manually
1. Go to **Quizzes and Worksheets** and click **Create manually**.
2. Enter the **Quiz Title** (e.g., *Fractions & Decimals Diagnostic Test*).
3. Select the target **Class/Grade** (e.g., *Grade 6*).
4. Choose the **Mode** (`Live`, `Timed`, or `Self-Paced`).
5. For each question:
   - Type the question prompt.
   - Set marks (e.g., 1 mark, 2 marks).
   - Add options (A, B, C, D) and mark the green checkmark on the correct option.
   - *(Optional)* Add a diagram or image URL.
6. Click **Save Quiz**.

### Generating a Quiz Instantly with AI
1. Click **Generate with AI** in the top-right corner.
2. Select:
   - Grade / Class level.
   - Academic Subject & Chapter Topic (e.g., *Linear Equations*).
   - Difficulty Level (Easy, Medium, Challenging).
   - Number of Questions (e.g., 10 questions).
   - **Language Selection**: Choose **English**, **Pure Hindi (हिन्दी माध्यम)**, or **Bilingual**. When selecting Pure Hindi, mathematical terms, question instructions, and multiple-choice options are generated in clean Devanagari script suited for Hindi-medium state boards and CBSE curriculum.
3. Click **Generate Quiz with AI**.
4. Review the generated questions, edit any wording if desired, and click **Publish Quiz**.

### Running a Live Classroom Quiz
1. On the quiz card, click **Start Live Quiz**.
2. The **Classroom Monitor** opens at the top of your screen:
   - You will see the current question prompt and live counter: *"X students answered"*.
   - A live distribution bar shows how many students picked Option A, B, C, or D.
3. Click **Reveal Answer**: Students' screens will flash green for correct and red for incorrect, showing explanations.
4. Click **Next Question** to broadcast the next problem to all connected student screens.
5. Click **End Quiz** when finished. All student attempts are safely finalized and transferred to Results.

### Live Quiz Sound Effects & Audio Countdown
- **Audio Experience**: Live classroom quizzes feature dynamic Web Audio sound effects including suspenseful countdown ticks, celebratory fanfares for correct answers, and gentle chimes for round transitions.
- **Audio Toggle**: Teachers and students can mute or unmute quiz audio at any time via the sound icon on the live monitor.

---

## 2.5 Word-Style Question Papers Studio

For formal exams, descriptive math tests, and printable physical worksheets, EduAshram provides a built-in **Word-like Question Paper Builder**.

### Creating & Formatting a Question Paper
1. In the sidebar, click **Question Papers**.
2. Click **Create manually** or **Generate with AI**.
3. In the Paper Studio:
   - Set **Paper Title** (e.g., *Mid-Term Mathematics Examination*).
   - Set **Subject**, **Grade**, **Time Allowed** (e.g., *90 Mins*), and **Total Marks** (e.g., *80*).
   - Write or customize the **Instructions for Students** (e.g., *"Write all steps neatly in your workbook"*).
   - Type or paste your questions with section headers (Section A: 1-mark MCQs, Section B: 3-mark descriptive proofs, etc.).
4. Click **Save as Draft** while working, or **Publish** when ready for students.

### Viewing & Printing Physical Papers
1. On any paper card, click **View Paper**.
2. A formal, printable examination paper is displayed on an A4-proportioned paper layout with school header and student details lines (`Name: _________`, `Roll No: _________`).
3. Click **Print Paper** in the top-right corner:
   - The browser print preview automatically strips all website menus and prints a clean, black-and-white exam paper ready for classroom photocopying.

### Checking Student Answer Sheets & Assigning Marks
1. When students write answers in physical notebooks and upload photos, click **Submissions** on the paper card.
2. Select any student who submitted their work:
   - You will see the high-resolution photos of their physical answer sheets.
   - Use the **Zoom** and **Rotate** buttons to inspect handwriting.
3. Enter the **Score Obtained** (e.g., `45 / 50`).
4. Enter **Teacher Remarks** (e.g., *"Good presentation. Pay attention to signs in Question 4"*).
5. Click **Save Grade & Feedback**. The student can now see their evaluated paper in their portal.

### AI Auto-Evaluation of Handwritten Answer Sheets
1. On any submitted student answer sheet, click **"Auto-Evaluate with AI"**.
2. The AI Vision model scans the handwritten workbook pages against the question paper and answer key:
   - Accurately reads mathematical steps, equations, and diagrams.
   - Checks calculations, identifies mistakes, and recommends marks for each problem.
   - Automatically drafts constructive teacher feedback highlighting student strengths and areas to review.
3. Teachers can review the score breakdown, edit remarks, and approve the evaluation in 1 click.

### Teacher Mobile Camera Uploads (via QR Code)
For offline tests where students hand in paper sheets in class:
1. In the submissions screen, click **"Upload via Mobile Camera"**.
2. A dynamic QR code displays on the screen.
3. Scan the QR code using any smartphone camera:
   - Opens a dedicated mobile upload screen on your phone without requiring any app installation or passwords.
   - Snap photos of student pages directly using your phone's camera.
   - Photos upload immediately and appear in the student's submission gallery on your desktop in real time.

---

## 2.6 Student Management & Directory (Roster)

Click **Students** in the navigation bar to access the student administration suite.

### Adding a New Student
1. In the right-hand sidebar under **"Add to your class"**:
   - **Student Name**: Enter student's full name (e.g., *Vanya Singh*).
   - **Grade / Class**: Select from your active grades (e.g., *Grade 5*).
   - **Date of Joining**: Pick enrollment date (used for monthly attendance and fee ledgers).
   - **Parent WhatsApp No. (India)**: Enter the 10-digit Indian mobile number (e.g., `9876543210`). The `+91` country code is added automatically.
   - **Parent Name (Optional)**: e.g., *Mr. Rajesh Singh*.
2. Click **Add student**.
3. **The 6-Character Passkey** is generated immediately (e.g., `K7M2P9`).
   - Click **Copy passkey** to share with the student or parent.

### Student Roster Actions
On each student row in the Directory:
- **WhatsApp Chat Pill**: Click the green WhatsApp pill to open an instant chat with the parent.
- **Progress Report**: Quick shortcut to view the student's April–March academic history.
- **Fees Ledger**: Quick shortcut to view their 12-month payment record.
- **Passkey Reveal (`••••••`)**: Click **Show** to view their passkey or **Copy** to clipboard.
- **Pencil Icon (Edit)**: Update student's name, class, joining date, or parent WhatsApp number.
- **Refresh Icon (Reset Passkey)**: Creates a new 6-character passkey if a student forgets theirs.
- **Pause Access (User Check/X)**: Temporarily disables student login without deleting their records.
- **Trash Icon**: Permanently removes student profile.

---

## 2.7 WhatsApp Parent Notifications & Instant Scorecards

EduAshram includes native, zero-cost WhatsApp sharing for Indian phone numbers (`+91`):

### 1. Sending an Individual Student Quiz Scorecard
1. Go to **Quiz Results & Answer Analytics**.
2. Select any completed quiz.
3. Next to any student's name, click the green **WhatsApp** button:
   - **If Parent Phone is already saved**: WhatsApp Web (or Desktop app) opens instantly with the student's clean, pre-filled report card.
   - **If Parent Phone is missing**: A clean modal prompts: *"Send Scorecard for [Student Name]"*. Enter the 10-digit number and click **Save & Open WhatsApp**. It saves the number to the student's profile for the future and opens WhatsApp immediately.
4. Click **Send** in WhatsApp!

#### What the Parent Receives:
```text
STUDENT ASSESSMENT REPORT
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
Teacher: Gaurav Kumar Singh
```

### 2. Sharing New Quiz or Homework Announcements to Class Groups
- **On Quiz Cards**: Click the **WhatsApp** button to copy a ready-to-send announcement with test format and login link (`https://maths-mentor-32kc.onrender.com`).
- **On Question Paper Cards**: Click **WhatsApp** next to **View Paper** to announce new homework to parents.

---

## 2.8 Attendance Register
1. In the **Students** tab, click **Attendance Register**.
2. Select the **Class Date** (defaults to today).
3. For each student, click:
   - **P (Present)** — Green
   - **A (Absent)** — Red
   - **L (Late)** — Amber
   - **E (Excused)** — Blue
4. Click **"Mark All Present"** for 1-click fast attendance on full-attendance days.
5. The top summary automatically calculates:
   - *Total Present*, *Absentees*, and *Monthly Attendance Rate (%)*.

---

## 2.9 Monthly Fees Ledger (April to March Session)
EduAshram manages school and tuition fees across the standard Indian academic session (April – March).

1. In the **Students** tab, click **Monthly Fees (Apr–Mar)**.
2. Select any student from the dropdown or click **Fees Ledger** from the Directory.
3. You will see a 12-month table from **April to March**:
   - **Due Date** & **Monthly Fee Amount (₹)**.
   - **Payment Status**: `PAID`, `PENDING`, `OVERDUE`, or `PARTIAL`.
   - **Payment Mode**: Cash, UPI / GPay, Bank Transfer, Cheque.
   - **Receipt Generator**: Click **Print Receipt** on any paid month to generate a formal fee slip complete with receipt number, school logo, student name, and teacher signature line.

---

## 2.10 Academic Progress Reports & Year-Long Scorecards
1. In the **Students** tab, click **Progress Reports**.
2. Pick any student to inspect their comprehensive annual academic record:
   - Average score percentage across all quizzes and worksheets.
   - Total tests attempted, passed, and outstanding marks.
   - Month-by-month progress graph showing performance trajectory.
   - Topic-wise breakdown (identifying strong chapters and areas needing revision).
3. Click **"Print Formal Progress Report Card"** to generate a signed annual performance report ready for parent-teacher meetings.

---

## 2.11 Quiz Results & Answer Analytics
1. In the sidebar, click **Results** (or **Results & Assessments** in Student Manager).
2. **Month Filter**:
   - Use the **Month Dropdown** or **Calendar Month Picker** in the top-right corner to see quizzes conducted in any specific month (e.g., *October 2026*).
   - Or select **"All Months"** to see full history.
3. Select a quiz:
   - **Scoreboard**: See student names, submission status (`Submitted` vs `In progress`), and marks (`8 / 10`).
   - **Answer Review**: Click on any student row to expand and inspect their question-by-question responses (green checkmark for correct, red cross for incorrect).
   - **Class Answer Patterns**: View question-by-question response distribution to see which specific problems the class struggled with.
   - **Export CSV**: Click **Export CSV** in the top-right corner to download an Excel-friendly file with student names, marks, submission times, and parent contact numbers.
   - **Reset Attempt**: If a student faced network trouble or needs to retake a quiz, click **Restart Quiz** next to their name.

---

## 2.12 Classroom Archive
When a quiz or question paper is completed:
1. Click **Mark Finished** on the quiz card, or **Mark Complete** on the paper card.
2. It moves safely to the **Archive** tab:
   - This keeps your active workspace clean and uncluttered.
   - Past score records, answers, and student attempt histories remain 100% preserved forever.
   - You can re-open an archived paper or review past questions anytime by clicking **Archive** in the sidebar.

---

## 2.13 Online Teaching Whiteboard & Live Class Broadcasting

The built-in **EduAshram Whiteboard** is a modern, infinite vertical digital canvas designed specifically for mathematics and science instruction.

### Core Canvas Features:
- **Infinite Vertical Scrolling**: Expand the page downwards without running out of writing room.
- **Board Backgrounds**: Toggle between **Ruled Notebook** (standard lined paper), **Square Grid** (for geometry & algebra), **Dot Grid**, **Dark Blackboard** (chalkboard aesthetic), and **Coordinate Cartesian Graph** with customizable intervals.
- **Geometry & Drawing Instruments**:
  - Virtual Ruler with millimeter/inch markings.
  - Compass for accurate circle drawing.
  - 180° / 360° Protractor for angle measurement.
  - 45° and 60° Set Squares.
- **Drawing Tools**: Pressure-sensitive pens, multi-color highlighters, geometric shape auto-detection, text boxes, sticky notes, LaTeX equation insertion, and image upload.
- **Single-Page Infinite Canvas for PDF & PPT Imports**:
  - When importing multi-page documents (PDF worksheets, exam papers, textbooks) or PowerPoint presentations (PPT / PPTX slides), all pages and slides are automatically imported onto a **Single Continuous Page with Infinite Scroll enabled**.
  - Pages and slides are arranged and stacked vertically in sequential order. You can smoothly scroll down the whiteboard, annotate problems, and solve equations right alongside the slide content without having to switch tabs.
- **Embedded Educational Video Widgets**:
  - Embed YouTube, Vimeo, or direct MP4/local video files directly into the whiteboard.
  - The teacher retains complete playback control (Play, Pause, Scrub/Seek timeline, 16:9 ratio lock, Resize, Minimize, and Close).
- **Standalone Window (Split-Screen)**: Click **"Open in Window"** to detach the whiteboard into a standalone browser window, allowing you to position it side-by-side with Zoom meetings, reference materials, or browser tabs.

### Live Broadcasting to Students
1. At the top of the whiteboard, select your target audience from the dropdown:
   - Specific grade level (e.g., *Grade 6*, *Grade 10*), or
   - **All Grades**.
2. Click **Go Live** (green button):
   - Real-time vector strokes, eraser actions, page transitions, background grid changes, and vertical scroll positions are broadcast immediately to connected students.
   - A live viewer counter shows how many students are currently tuned into your board.
3. **Synchronized Video Playback with Sub-Second Precision**:
   - When the teacher plays, pauses, or seeks a video on the whiteboard, all student whiteboards follow in real-time.
   - **Zero Startup Lag**: When clicking play, student videos instantly jump to the active timestamp instead of buffering from zero.
   - **Exact-Frame Freeze**: When the teacher pauses the video to explain a formula, theorem, or diagram, student screens freeze on the exact same frame.
   - **Automated Drift Correction**: High-frequency timestamp delivery and 1-second broadcast cycles automatically correct any playback drift over 1.2 seconds, ensuring all students watch in tight sync.
4. **Universal Anytime Student Join**:
   - Any number of students can join the live broadcast at any point during the lecture (even mid-class or during video playback).
   - The server instantly transmits the complete active board state (drawings, geometry figures, scroll position, and current video playback timestamp) so newly joined students catch up with zero delay.
5. **Background Session Persistence**:
   - If you need to switch tabs to check an attendance record, view a quiz submission, or check the calendar, the live whiteboard **continues broadcasting in the background**.
   - A green banner across other teacher tabs reminds you: *"Your Live Whiteboard is broadcasting to students in the background"* with an instant **"Return to Whiteboard"** button.
6. Click **Stop Live** when you are ready to conclude the live broadcast.

---

## 2.14 Public Study Materials Hub & AI Article Image Studio

EduAshram includes a content authoring suite allowing teachers to publish rich academic notes, formula guides, and video lessons accessible to students and the public.

### Creating & Publishing Study Materials:
1. In the sidebar, click **Study Materials** (or access via the top bar).
2. Click **New Article / Material**:
   - Enter **Title**, **Grade / Class**, **Academic Subject**, and **Chapter Name**.
   - Write structured explanations using rich headings, bullet lists, callout boxes, and formatted math formulas.
   - Insert embedded YouTube video lessons directly into the text.
3. **Custom Image Formats**: Choose between **Thumbnail Card** or **Wide Hero Banner** for how the article displays on student and public portal feeds.
4. Click **Publish** to make it available to your classroom and public visitors.

### AI Article Image Studio
Generate custom pedagogical diagrams and concept illustrations without searching the web or using stock photos:
1. Inside the material editor, click **"Generate Image with AI"**.
2. Type a descriptive educational prompt (e.g., *"3D visual of a cylinder showing radius and height with cross-section"*).
3. The AI generates a sharp, classroom-ready mathematical diagram.
4. Click **Insert into Article** to embed it directly at your cursor position.

---

# Part 3: Student's Space

The **Student's Space** is clean, distraction-free, and designed so that children of all ages (Grades 1 to 12) can participate without confusion.

```
┌─────────────────────────────────────────────────────────┐
│                     STUDENT PORTAL                      │
├─────────────────┬───────────────────────────────────────┤
│ Open Classroom  │ Active live quizzes & open worksheets │
│ Live Whiteboard │ Real-time teacher board notes & PDF   │
│ Quiz History    │ Past quiz scores, reviews & answers   │
│ Paper History   │ Graded workbook sheets & remarks      │
│ Class Calendar  │ Upcoming tests & homework deadlines   │
└─────────────────┴───────────────────────────────────────┘
```

---

## 3.1 How Students Sign In (No Email Required)

Students do **not** need to remember complicated emails or passwords.

1. Open the classroom link (e.g., `https://maths-mentor-32kc.onrender.com`).
2. Click **Student Login** (or **Join with Passkey**).
3. Enter your **6-character Student Passkey** given by your teacher (e.g., `K7M2P9`).
4. Click **Enter Classroom**.
5. You will see a personalized welcome: *"Welcome back, [Student Name]! Ready for today's math practice?"*

---

## 3.2 Taking a Live Classroom Quiz

1. When your teacher starts a live round, the quiz appears under **Open Quizzes and Worksheets** with a red **"● LIVE NOW"** indicator.
2. Click **Join Quiz**.
3. **During the Live Quiz**:
   - The question appears on your screen in large, readable text with options **A, B, C, D**.
   - Tap or click your answer choice.
   - You will see a confirmation: *"Answer submitted! Waiting for teacher to reveal..."*
4. **Answer Reveal**:
   - When the teacher reveals the answer, your screen shows immediately whether your choice was **Correct** (green) or **Incorrect** (red), along with the explanation.
   - The teacher will then advance to the next question automatically.

---

## 3.3 Taking a Self-Paced or Timed Quiz

1. Under **Open Classroom**, look for practice quizzes.
2. If it is **Timed**: You will see a countdown timer at the top (e.g., `18:42 remaining`).
3. If it is **Self-Paced**: There is no timer; solve questions calmly at your own pace.
4. Select your answer for each question and click **Next**.
5. You can click **Previous** to change any answer before final submission.
6. Click **Submit Quiz**:
   - Your score is calculated instantly (e.g., `10 / 10 - 100%`).
   - You can review all correct answers and step-by-step solutions immediately.

---

## 3.4 Solving Question Papers & Uploading Workbook Photos

For descriptive homework and exam papers:

1. In the **Open Classroom** tab, scroll down to **Open Question Papers & Worksheets**.
2. Click **View Paper**:
   - Read the instructions, total marks, and questions.
3. **Solve on Physical Paper**:
   - Take out your real classroom notebook / workbook.
   - Write your name, class, date, and neat step-by-step answers for each question number.
4. **Upload Your Answer Sheets**:
   - Click **"Upload Answer Sheet Photos"**.
   - If using a mobile phone or tablet, you can take photos directly with your camera.
   - If using a computer, select the saved photo files.
   - You can upload multiple pages (Page 1, Page 2, Page 3).
5. Click **Submit Answer Sheets**:
   - You will see a confirmation badge: *"Submitted · Awaiting Teacher Evaluation"*.

---

## 3.5 Checking Past Scores & Teacher Feedback

### Reviewing Past Quizzes (`Quiz History`)
1. In the student menu, tap **Quiz History**.
2. You will see a chronological list of every test you have completed.
3. Click on any quiz to review:
   - Total marks achieved.
   - Exactly which questions you answered correctly.
   - Explanations for questions you missed.

### Reviewing Graded Question Papers (`Paper History`)
1. Tap **Paper History**.
2. When your teacher finishes grading your workbook upload:
   - You will see your assigned marks (e.g., `45 / 50`).
   - Read your teacher's personalized advice and remarks.

---

## 3.6 Student Calendar & Reminders
1. Tap **Class Calendar & Reminders**.
2. View dates for upcoming quizzes, homework submission deadlines, and school holidays marked by your teacher.

---

## 3.7 Student Live Whiteboard & Notes PDF Export

When your teacher conducts a live lecture using the digital whiteboard, students can follow along live from any computer, tablet, or mobile phone.

### 1. Joining the Live Whiteboard:
- When a live class begins, a prominent **"LIVE CLASS IN PROGRESS"** banner appears on your dashboard, and a **Live Whiteboard** tab appears in the sidebar.
- Click **"Join Live Board →"** to enter the live stream.

### 2. Live Interaction & Viewing:
- **Real-Time Synchronisation**: Every stroke, formula, geometric diagram, and page change made by the teacher appears instantly on your screen.
- **Follow Teacher Mode**: By default, your screen automatically scrolls and follows where the teacher is writing.
- **Independent Exploration**: You can temporarily disable "Follow Teacher" to scroll back up or inspect previous pages at your own reading speed. Click **"Jump to Teacher"** at any time to re-sync.
- **Zoom & View Controls**: Use the Zoom (+ / -) or Fit-to-Width controls to adjust the board size to your device.

### 3. Synchronized Educational Video Playback:
- When the teacher plays an educational video on the board, it streams in tight real-time synchronization on your screen.
- **Teacher-Led Playback**: Students cannot accidentally pause, skip, or scrub the video timeline, keeping the whole classroom focused on the teacher's lesson.
- **Personal Audio & Mute Controls**: Students have a dedicated **Mute / Unmute** toggle and volume slider so you can listen comfortably on your earphones or device speakers without disrupting others.

### 4. Join Anytime & Catch-Up:
- You can join the Live Whiteboard at any moment during the class (even mid-lecture or while a video is playing). As soon as you join, the server immediately synchronizes all previous drawings, geometry figures, active slide pages, and running video timestamps to your screen with zero delay.

### 5. One-Click PDF Export:
- At any point during or after the lecture, click **"Download PDF"** in the top-right corner.
- All whiteboard pages and notes are instantly saved to your device as a crisp, multi-page vector PDF for easy offline homework and revision.

---

# Frequently Asked Questions (FAQ)

### For Teachers:
- **Q: What if I forget my teacher password?**
  - *A:* Click **"Teacher Login"** and tap **"Forgot Password?"**. Enter your registered email address to receive an instant 6-digit OTP verification code via SMTP email (valid for 15 minutes). Type the code and your new password to restore access immediately. School SuperAdmins can also reset teacher passwords or verify accounts in the SuperAdmin Console.
- **Q: How does video playback work on the Live Whiteboard?**
  - *A:* Teachers can embed YouTube, Vimeo, or MP4 video files directly on the whiteboard canvas. Playback is synchronized across all students with sub-second precision. When you pause the video, all student screens freeze on the exact same frame to allow step-by-step concept explanations. Students cannot interrupt playback, but can control their own audio mute/unmute.
- **Q: How are multi-page PDFs and PPT slides imported into the whiteboard?**
  - *A:* When you import a multi-page PDF or PowerPoint presentation, all pages/slides are automatically placed and vertically stacked on a **Single Page with Infinite Scroll enabled**. This allows you to scroll down continuously and solve problems next to each slide without breaking the class flow.
- **Q: Can quizzes and question papers be generated in Hindi?**
  - *A:* Yes! When generating quizzes or question papers using the AI Teaching Assistant, select **Pure Hindi (हिन्दी माध्यम)**. Questions, mathematical instructions, theorems, and MCQ options are generated in clean Devanagari Hindi terminology aligned with Hindi-medium state boards and CBSE curriculum.
- **Q: Can I use this on my mobile phone?**
  - *A:* Yes! The entire teacher dashboard and student portal are fully responsive and work seamlessly on mobile browsers, tablets, laptops, and smart classroom boards.
- **Q: Does WhatsApp sharing cost any money?**
  - *A:* No. Phase 1 uses direct WhatsApp Web links (`wa.me`). It is 100% free, requires no business API verification, and connects directly with Indian phone numbers (+91).
- **Q: Can parents see other students' marks?**
  - *A:* No. When clicking WhatsApp next to a student's name, the scorecard is sent exclusively to that individual child's parent number.
- **Q: What happens if a student accidentally closes their browser during a timed quiz?**
  - *A:* Their progress is saved automatically on the server. When they re-enter their 6-character passkey, they resume right where they left off with their remaining time intact.
- **Q: Does the live whiteboard consume heavy internet data?**
  - *A:* No. Unlike video screen sharing which transmits heavy video streams, EduAshram streams lightweight vector strokes and coordinates via WebSockets. It works smoothly even on standard 4G and mobile hotspot connections.
- **Q: How accurate is AI Auto-Evaluation for student handwriting?**
  - *A:* EduAshram uses Google Gemini Vision fine-tuned for mathematics. It accurately transcribes mathematical steps and fractions from clean phone camera photos. The teacher always has full control to review, edit, or adjust marks before final approval.

### For Students:
- **Q: Can I join the Live Whiteboard if I am late to class?**
  - *A:* Yes! You can join at any time. When you click **Join Live Board**, your screen immediately catches up with the teacher's current drawing, active slide notes, and video position.
- **Q: Why can't I pause or scrub the video on the whiteboard?**
  - *A:* Video controls are managed exclusively by your teacher so that the whole class stays on the same concept together. You can freely use the **Mute / Unmute** button and volume slider to adjust your device's audio.
- **Q: I forgot my passkey. How can I log in?**
  - *A:* Ask your teacher! In the teacher's Student Directory, your teacher can view or regenerate your passkey in 1 click.
- **Q: Can other students see my scores?**
  - *A:* No. Passkeys are private to each student. Other students can never view your scores or submitted workbook photos.
- **Q: Can I download the teacher's whiteboard notes if I missed something?**
  - *A:* Yes! Click **"Download PDF"** at any time during or after the live session to download the complete set of whiteboard pages to your device.

---

*EduAshram — Empowering Teachers. Inspiring Students.*

