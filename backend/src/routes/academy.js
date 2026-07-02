import express from 'express';
import crypto from 'crypto';
import AcademyEnrollment from '../models/AcademyEnrollment.js';
import AcademyCourse from '../models/AcademyCourse.js';
import { requireAuth, requireStaff, requireDeveloper } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import { sendAcademyOtpEmail } from '../utils/email.js';

const router = express.Router();

const SKILL_CATALOG = [
  { key: 'html', title: 'HTML', track: 'Frontend', level: 'basic' },
  { key: 'css', title: 'CSS', track: 'Frontend', level: 'basic' },
  { key: 'javascript', title: 'JavaScript', track: 'Frontend', level: 'basic' },
  { key: 'typescript', title: 'TypeScript', track: 'Frontend', level: 'advanced' },
  { key: 'react', title: 'React', track: 'Frontend', level: 'advanced' },
  { key: 'nextjs', title: 'Next.js', track: 'Frontend', level: 'advanced' },
  { key: 'vue', title: 'Vue.js', track: 'Frontend', level: 'advanced' },
  { key: 'tailwind', title: 'Tailwind CSS', track: 'Frontend', level: 'basic' },
  { key: 'node', title: 'Node.js', track: 'Backend', level: 'basic' },
  { key: 'express', title: 'Express.js', track: 'Backend', level: 'basic' },
  { key: 'node-express', title: 'Node.js + Express', track: 'Backend', level: 'basic' },
  { key: 'mongodb', title: 'MongoDB', track: 'Backend', level: 'advanced' },
  { key: 'postgresql', title: 'PostgreSQL', track: 'Backend', level: 'advanced' },
  { key: 'python', title: 'Python', track: 'Programming', level: 'basic' },
  { key: 'django', title: 'Django', track: 'Backend', level: 'advanced' },
  { key: 'fastapi', title: 'FastAPI', track: 'Backend', level: 'advanced' },
  { key: 'php-laravel', title: 'PHP + Laravel', track: 'Backend', level: 'advanced' },
  { key: 'cpp', title: 'C++', track: 'Programming', level: 'basic' },
  { key: 'java', title: 'Java', track: 'Programming', level: 'advanced' },
  { key: 'springboot', title: 'Spring Boot', track: 'Backend', level: 'advanced' },
  { key: 'csharp', title: 'C#', track: 'Programming', level: 'basic' },
  { key: 'csharp-dotnet', title: 'C# + .NET', track: 'Backend', level: 'basic' },
  { key: 'git-github', title: 'Git + GitHub', track: 'Developer Tools', level: 'basic' },
  { key: 'api-design', title: 'REST API Design', track: 'Backend', level: 'advanced' },
  { key: 'auth-security', title: 'Authentication + Security', track: 'Security', level: 'advanced' },
  { key: 'cloud-render', title: 'Render Cloud Deployment', track: 'Cloud', level: 'basic' },
  { key: 'docker', title: 'Docker', track: 'DevOps', level: 'advanced' },
  { key: 'devops-ci-cd', title: 'CI/CD DevOps', track: 'DevOps', level: 'premium' },
  { key: 'qa-testing', title: 'QA Testing', track: 'Quality', level: 'basic' },
  { key: 'ui-ux', title: 'UI/UX Product Design', track: 'Design', level: 'basic' },
  { key: 'data-analysis', title: 'Data Analysis', track: 'Data', level: 'advanced' },
  { key: 'machine-learning', title: 'Machine Learning', track: 'AI', level: 'premium' },
  { key: 'ai-api-integration', title: 'AI API Integration', track: 'AI', level: 'premium' },
  { key: 'mobile-react-native', title: 'React Native Mobile Apps', track: 'Mobile', level: 'premium' },
  { key: 'fullstack-saas', title: 'Full Stack SaaS Platform', track: 'Premium', level: 'premium' },
  { key: 'job-ready-portfolio', title: 'Job-Ready Portfolio Project', track: 'Premium', level: 'premium' },
  { key: 'html-foundations', title: 'HTML Foundations', track: 'Frontend', level: 'basic' },
  { key: 'css-professional-ui', title: 'CSS Professional UI', track: 'Frontend', level: 'basic' },
  { key: 'javascript-core', title: 'JavaScript Core', track: 'Frontend', level: 'basic' },
  { key: 'python-for-builders', title: 'Python for Builders', track: 'Programming', level: 'basic' },
  { key: 'django-backend', title: 'Django Backend Development', track: 'Backend', level: 'advanced' },
  { key: 'react-frontend', title: 'React Frontend Development', track: 'Frontend', level: 'advanced' },
  { key: 'node-express-api', title: 'Node Express API Development', track: 'Backend', level: 'advanced' },
  { key: 'mongodb-backend', title: 'MongoDB Backend Development', track: 'Backend', level: 'advanced' },
  { key: 'premium-school-1', title: 'Premium School 1', track: 'Premium', level: 'premium' },
  { key: 'premium-school-2', title: 'Premium School 2', track: 'Premium', level: 'premium' },
  { key: 'premium-school-3', title: 'Premium School 3', track: 'Premium', level: 'premium' }
];

const MODULES_BY_LEVEL = {
  basic: ['Foundations', 'Professional Setup', 'Core Syntax', 'Real Examples', 'Forms and Inputs', 'Mini Project', 'Debugging', 'Deployment Basics'],
  advanced: ['Architecture', 'Project Setup', 'Data Flow', 'API Integration', 'Authentication', 'Database/State', 'Testing', 'Performance', 'Production Project', 'Review'],
  premium: ['Business Case', 'System Architecture', 'Backend Build', 'Frontend Build', 'Database Design', 'Auth and Security', 'Payments/Integrations', 'Testing', 'Deployment', 'Documentation', 'Portfolio Defense', 'Certificate Assessment']
};

const COURSE_ALIAS_MAP = {
  'django-backend': 'django-backend',
  'django': 'django',
  'node-express': 'node-express',
  'node-express-api': 'node-express-api',
  'react-frontend': 'react-frontend',
  'mongodb-backend': 'mongodb-backend',
  'html-foundations': 'html-foundations',
  'css-professional-ui': 'css-professional-ui',
  'javascript-core': 'javascript-core',
  'python-for-builders': 'python-for-builders',
  'premium-school-1': 'premium-school-1',
  'premium-school-2': 'premium-school-2',
  'premium-school-3': 'premium-school-3'
};
function resolveCourseId(value = '') {
  const key = String(value || '').trim().toLowerCase();
  return COURSE_ALIAS_MAP[key] || key;
}
async function findPublishedCourse(courseId = '') {
  await ensureAutoCourses();
  const slug = resolveCourseId(courseId);
  const course = await AcademyCourse.findOne({ slug, isPublished: true });
  const skill = SKILL_CATALOG.find(item => item.key === slug);
  if (course && skill && googleAiStudioEnabled()) return enrichCourseFromGoogleAiStudio(course, skill);
  return course;
}

function slugify(value = '') {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function lessonBody(skill, moduleTitle, index) {
  return `${moduleTitle} for ${skill.title}: read the concept, follow the guided example, complete the practical coding task, test the result in the practice terminal, and save your progress. This lesson is generated by the Tyna Coding Academy auto-learning provider, so every individual course page can load real structured lessons without manual upload.`;
}

function quizFor(skill) {
  return [
    { question: `What is the professional goal of the ${skill.title} course?`, options: ['Build usable production skill', 'Only read theory', 'Skip practice'], answerIndex: 0, explanation: 'Tyna Coding Academy courses focus on real project skill and certificate readiness.' },
    { question: `What should a student do after studying a ${skill.title} lesson?`, options: ['Practice and save progress', 'Delete the course', 'Ignore the project'], answerIndex: 0, explanation: 'Progress tracking proves learning activity before certificate review.' }
  ];
}


function googleAiStudioKey() {
  return process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '';
}
function googleAiStudioEnabled() {
  return String(process.env.ACADEMY_USE_GOOGLE_AI_STUDIO || 'true').toLowerCase() !== 'false' && Boolean(googleAiStudioKey());
}
function safeJsonFromText(text = '') {
  const clean = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}
async function generateCourseWithGoogleAiStudio(skill) {
  if (!googleAiStudioEnabled()) return null;
  const model = process.env.GOOGLE_AI_STUDIO_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(googleAiStudioKey())}`;
  const modules = MODULES_BY_LEVEL[skill.level] || MODULES_BY_LEVEL.basic;
  const prompt = `Create a professional Tyna Coding Academy course for ${skill.title}. Return only valid JSON with description, lessons array, quiz array and outcomes array. Lessons must match these module titles: ${modules.join(', ')}. Each lesson item needs title, body, assignment and order. Quiz needs 3 questions with options, answerIndex, explanation. Make it practical for students and business builders.`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.GOOGLE_AI_STUDIO_TIMEOUT_MS || 9000));
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.45, responseMimeType: 'application/json' } })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || 'Google AI Studio generation failed');
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';
    const parsed = safeJsonFromText(text);
    if (!parsed) return null;
    const lessons = (parsed.lessons || []).slice(0, modules.length).map((lesson, i) => ({
      title: String(lesson.title || `${modules[i] || 'Lesson'}: ${skill.title}`).trim(),
      order: Number(lesson.order || i + 1),
      body: String(`${lesson.body || ''}\n\nAssignment: ${lesson.assignment || 'Build and explain a working example for this lesson.'}`).trim(),
      isPublished: true
    }));
    return {
      description: String(parsed.description || '').trim(),
      outcomes: Array.isArray(parsed.outcomes) ? parsed.outcomes.slice(0, 6).map(String) : undefined,
      lessons: lessons.length ? lessons : undefined,
      quiz: Array.isArray(parsed.quiz) ? parsed.quiz.slice(0, 5) : undefined,
      aiProvider: 'Google AI Studio Gemini',
      providerStatus: 'active',
      lastProviderSyncAt: new Date()
    };
  } catch (error) {
    console.warn('Google AI Studio course generation fallback:', error.message);
    return null;
  } finally { clearTimeout(timer); }
}

async function enrichCourseFromGoogleAiStudio(course, skill) {
  if (!course || course.source === 'google-ai-studio') return course;
  const generated = await generateCourseWithGoogleAiStudio(skill);
  if (!generated) return course;
  if (generated.description) course.description = generated.description;
  if (generated.lessons?.length) course.lessons = generated.lessons;
  if (generated.quiz?.length) course.quiz = generated.quiz;
  course.provider = 'google-ai-studio-gemini';
  course.source = 'google-ai-studio';
  course.providerStatus = 'active';
  course.lastProviderSyncAt = new Date();
  await course.save();
  return course;
}

function autoCoursePayload(skill) {
  const modules = MODULES_BY_LEVEL[skill.level] || MODULES_BY_LEVEL.basic;
  return {
    slug: skill.key,
    title: `${skill.title} Professional Course`,
    track: skill.track,
    level: skill.level,
    description: `Auto-generated ${skill.level} learning path for ${skill.title}. Students can start learning immediately, complete lessons, track progress, and qualify for Tyna Coding Academy certificate review.` ,
    provider: googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api',
    source: 'auto',
    certificatePath: true,
    isPublished: true,
    lessons: modules.map((title, i) => ({ title: `${title}: ${skill.title}`, order: i + 1, body: lessonBody(skill, title, i + 1), isPublished: true })),
    quiz: quizFor(skill)
  };
}

async function syncAutoLearningCatalog() {
  const ops = SKILL_CATALOG.map(skill => {
    const insertPayload = autoCoursePayload(skill);
    return {
      updateOne: {
        filter: { slug: skill.key },
        update: {
          $setOnInsert: insertPayload,
          $set: {
            providerStatus: 'active',
            lastProviderSyncAt: new Date()
          }
        },
        upsert: true
      }
    };
  });
  if (ops.length) await AcademyCourse.bulkWrite(ops, { ordered: false });
}

async function ensureAutoCourses() {
  const count = await AcademyCourse.countDocuments({ source: 'auto' });
  if (count < SKILL_CATALOG.length) await syncAutoLearningCatalog();
}

function certificateSafeName(name = 'STUDENT') {
  return String(name || 'STUDENT').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'STUDENT';
}

function generateCertificateId(student) {
  const year = new Date().getFullYear();
  const namePart = certificateSafeName(student.name || student.user?.name || 'STUDENT');
  const unique = String(student._id).slice(-6).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TYNA-CODING-${year}-${namePart}-${unique}${random}`;
}

const levelRank = { basic: 1, advanced: 2, premium: 3 };
function canAccess(courseLevel, accessLevel='basic') { return true; } // Academy learning is free/open for all signed-in students and users.
function publicCourse(course, enrollment) {
  const obj = course.toObject ? course.toObject() : course;
  const lessons = obj.lessons || [];
  return {
    id: obj.slug,
    slug: obj.slug,
    title: obj.title,
    track: obj.track,
    level: obj.level,
    provider: obj.provider || (googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api'),
    source: obj.source || 'auto',
    lessons: lessons.filter(l => l.isPublished !== false).length,
    lessonItems: lessons.filter(l => l.isPublished !== false).sort((a,b)=>(a.order||0)-(b.order||0)),
    quiz: obj.quiz || [],
    description: obj.description,
    certificatePath: obj.certificatePath !== false,
    locked: false
  };
}
function publicEnrollment(e) {
  if (!e) return null;
  return { id: e._id, user: e.user, name: e.name, email: e.email, accessLevel: e.accessLevel, status: e.status, verificationStatus: e.verificationStatus || 'unverified', verificationMethod: e.verificationMethod || 'none', schoolEmail: e.schoolEmail || '', schoolName: e.schoolName || '', verificationNotes: e.verificationNotes || '', premiumSchoolStage: e.premiumSchoolStage, certificateStatus: e.certificateStatus, certificateId: e.certificateId, certificateAwardedAt: e.certificateAwardedAt, progress: e.progress, notes: e.notes, createdAt: e.createdAt, updatedAt: e.updatedAt };
}
function isAllowedSchoolEmail(email=''){
  const value=String(email||'').toLowerCase().trim();
  const domain=value.split('@')[1]||'';
  if(!value.includes('@') || !domain) return false;
  const configured=String(process.env.ACADEMY_SCHOOL_EMAIL_DOMAINS||'').toLowerCase().split(',').map(v=>v.trim()).filter(Boolean);
  if(configured.includes(domain)) return true;
  return domain.endsWith('.edu') || domain.includes('.edu.') || domain.includes('.ac.') || domain === 'byui.edu';
}
function last4(value=''){ return String(value||'').replace(/\D/g,'').slice(-4); }
function generateOtp(){ return String(Math.floor(100000 + Math.random() * 900000)); }
function hashOtp(value=''){ return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function emailOtpEnabled(){ return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && !String(process.env.SMTP_PASS).includes('PASTE_')); }

async function ensureEnrollment(user) {
  let enrollment = await AcademyEnrollment.findOne({ user: user._id || user.id });
  if (!enrollment) enrollment = await AcademyEnrollment.create({ user: user._id || user.id, name: user.name || '', email: user.email, accessLevel: 'premium', status: 'active', verificationStatus: 'verified', verificationMethod: 'open_learning' });
  if (enrollment.status !== 'active' || enrollment.accessLevel !== 'premium' || enrollment.verificationStatus !== 'verified') {
    enrollment.status = 'active';
    enrollment.accessLevel = 'premium';
    enrollment.verificationStatus = 'verified';
    enrollment.verificationMethod = enrollment.verificationMethod || 'open_learning';
    await enrollment.save();
  }
  return enrollment;
}
async function listCourses(enrollment = null) {
  await ensureAutoCourses();
  const courses = await AcademyCourse.find({ isPublished: true }).sort({ level: 1, track: 1, title: 1 });
  return courses.map(c => publicCourse(c, enrollment));
}


router.get('/', async (req, res, next) => { try { res.json({ provider: googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api', mode: 'auto', courses: await listCourses() }); } catch (err) { next(err); } });
router.get('/courses', async (req, res, next) => { try { res.json({ provider: googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api', mode: 'auto', courses: await listCourses() }); } catch (err) { next(err); } });
router.get('/provider/status', async (req, res, next) => { try { await ensureAutoCourses(); const total = await AcademyCourse.countDocuments({ isPublished: true }); res.json({ mode: 'auto', provider: googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api', googleAiStudioConnected: googleAiStudioEnabled(), manualCourseCreation: false, totalCourses: total, message: googleAiStudioEnabled() ? 'Google AI Studio Gemini learning API is connected. Courses can be enriched automatically from the backend provider.' : 'Auto-learning fallback is active. Add GOOGLE_AI_STUDIO_API_KEY or GEMINI_API_KEY to enable Google AI Studio.' }); } catch (err) { next(err); } });
router.get('/certificates/verify/:certificateId', async (req, res, next) => { try { const student = await AcademyEnrollment.findOne({ certificateId: req.params.certificateId, certificateStatus: 'awarded' }); if (!student) return res.status(404).json({ valid: false, message: 'Certificate not found.' }); res.json({ valid: true, certificate: publicEnrollment(student) }); } catch (err) { next(err); } });

// Public individual course endpoints stay before requireAuth so each learning page can load course content reliably.
router.get('/course/:courseId', async (req, res, next) => {
  try {
    const course = await findPublishedCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const payload = publicCourse(course);
    res.json({ course: payload, lessons: payload.lessonItems, quiz: payload.quiz || [] });
  } catch (err) { next(err); }
});
router.get('/course/:courseId/lessons', async (req, res, next) => {
  try {
    const course = await findPublishedCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const payload = publicCourse(course);
    res.json({ course: payload, lessons: payload.lessonItems });
  } catch (err) { next(err); }
});
router.get('/course/:courseId/quiz', async (req, res, next) => {
  try {
    const course = await findPublishedCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const payload = publicCourse(course);
    res.json({ course: payload, quiz: payload.quiz || [] });
  } catch (err) { next(err); }
});
router.get('/:courseId', async (req, res, next) => {
  try {
    const reserved = new Set(['me','enroll','progress','admin','developer','provider','verify','certificates','courses']);
    if (reserved.has(String(req.params.courseId || '').toLowerCase())) return next();
    const course = await findPublishedCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const payload = publicCourse(course);
    res.json({ course: payload, lessons: payload.lessonItems, quiz: payload.quiz || [] });
  } catch (err) { next(err); }
});

// Authenticated academy dashboard/student routes must stay after public course endpoints.
router.use(requireAuth);

router.post('/provider/sync', requireStaff, async (req, res, next) => { try { await syncAutoLearningCatalog(); const total = await AcademyCourse.countDocuments({ isPublished: true }); res.json({ message: googleAiStudioEnabled() ? 'Google AI Studio academy provider synced successfully.' : 'Auto-learning catalog synced successfully.', provider: googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api', totalCourses: total }); } catch (err) { next(err); } });
router.get('/me', async (req, res, next) => { try { const enrollment = await ensureEnrollment(req.currentUser); res.json({ enrollment: publicEnrollment(enrollment), provider: googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api', mode: 'auto', courses: await listCourses(enrollment) }); } catch (err) { next(err); } });
router.post('/enroll', async (req, res, next) => { try { const enrollment = await ensureEnrollment(req.currentUser); await logActivity(req, { type: 'academy_enrollment', user: req.currentUser._id, name: req.currentUser.name, email: req.currentUser.email, title: 'Coding Academy enrollment', detail: `${req.currentUser.name} opened auto-learning Academy access.` }); res.status(201).json({ message: 'Student academy profile is active.', enrollment: publicEnrollment(enrollment) }); } catch (err) { next(err); } });

router.post('/verify/school-email', async (req, res, next) => {
  try {
    const schoolEmail = String(req.body.schoolEmail || '').toLowerCase().trim();
    const enrollment = await ensureEnrollment(req.currentUser);
    if (!isAllowedSchoolEmail(schoolEmail)) return res.status(400).json({ message: 'Please use a valid school email. If you do not have one, submit school ID, NIN-supported verification, national ID, or passport for admin review.' });
    if (!emailOtpEnabled()) return res.status(503).json({ message: 'School email OTP is not ready because SMTP email is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS in Render, or use ID/NIN verification for admin review.' });
    const otpCode = generateOtp();
    enrollment.schoolEmail = schoolEmail;
    enrollment.verificationMethod = 'school_email';
    enrollment.verificationStatus = 'pending';
    enrollment.schoolEmailOtpHash = hashOtp(otpCode);
    enrollment.schoolEmailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await enrollment.save();
    const sent = await sendAcademyOtpEmail(schoolEmail, otpCode, req.currentUser.name || 'Student');
    if (sent?.error || sent?.skipped) return res.status(503).json({ message: 'OTP could not be sent. Check SMTP email settings in Render, or submit ID/NIN for admin review.' });
    await logActivity(req, { type: 'academy_verification', user: req.currentUser._id, name: req.currentUser.name, email: req.currentUser.email, title: 'Student school email OTP sent', detail: `${req.currentUser.name} requested school email OTP for ${schoolEmail}.` });
    res.json({ message: 'OTP sent to your school email. Enter the 6-digit code to open the learning page.', enrollment: publicEnrollment(enrollment) });
  } catch (err) { next(err); }
});

router.post('/verify/school-email/confirm', async (req, res, next) => {
  try {
    const schoolEmail = String(req.body.schoolEmail || '').toLowerCase().trim();
    const otpCode = String(req.body.otpCode || '').trim();
    const enrollment = await ensureEnrollment(req.currentUser);
    if (!schoolEmail || schoolEmail !== enrollment.schoolEmail) return res.status(400).json({ message: 'School email does not match the OTP request.' });
    if (!otpCode || !enrollment.schoolEmailOtpHash) return res.status(400).json({ message: 'Request an OTP first.' });
    if (!enrollment.schoolEmailOtpExpiresAt || enrollment.schoolEmailOtpExpiresAt.getTime() < Date.now()) return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    if (hashOtp(otpCode) !== enrollment.schoolEmailOtpHash) return res.status(400).json({ message: 'Invalid OTP code.' });
    enrollment.verificationMethod = 'school_email';
    enrollment.verificationStatus = 'verified';
    enrollment.verifiedAt = new Date();
    enrollment.schoolEmailOtpHash = '';
    enrollment.schoolEmailOtpExpiresAt = undefined;
    await enrollment.save();
    await logActivity(req, { type: 'academy_verification', user: req.currentUser._id, name: req.currentUser.name, email: req.currentUser.email, title: 'Student school email verified', detail: `${req.currentUser.name} verified academy access with ${schoolEmail}.` });
    res.json({ message: 'School email verified. Learning page access is now open.', enrollment: publicEnrollment(enrollment) });
  } catch (err) { next(err); }
});

router.post('/verify/id', async (req, res, next) => {
  try {
    const idType = String(req.body.idType || 'school_id').trim();
    const allowed = ['school_id', 'nin', 'national_id', 'passport'];
    if (!allowed.includes(idType)) return res.status(400).json({ message: 'Invalid verification type.' });
    const enrollment = await ensureEnrollment(req.currentUser);
    enrollment.verificationMethod = idType;
    enrollment.verificationStatus = 'pending';
    enrollment.schoolName = String(req.body.schoolName || '').trim();
    enrollment.idReferenceLast4 = last4(req.body.idReference || '');
    enrollment.verificationNotes = String(req.body.verificationNotes || '').trim();
    await enrollment.save();
    await logActivity(req, { type: 'academy_verification', user: req.currentUser._id, name: req.currentUser.name, email: req.currentUser.email, title: 'Student ID verification pending', detail: `${req.currentUser.name} submitted ${idType} verification for admin review.` });
    res.status(201).json({ message: 'Verification submitted for admin review. Full NIN or ID number is not stored.', enrollment: publicEnrollment(enrollment) });
  } catch (err) { next(err); }
});

async function saveProgress(req, res, next) {
  try {
    await ensureAutoCourses();
    const course = await AcademyCourse.findOne({ slug: resolveCourseId(req.params.courseId) });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const enrollment = await ensureEnrollment(req.currentUser);
    // Free academy: students and users can save progress without extra verification or approval.
    const totalLessons = course.lessons.filter(l => l.isPublished !== false).length || 1;
    const completedLessons = Math.max(0, Math.min(Number(req.body.completedLessons ?? totalLessons), totalLessons));
    const existing = enrollment.progress.find(p => p.courseId === course.slug);
    const status = completedLessons >= totalLessons ? 'completed' : (completedLessons > 0 ? 'in_progress' : 'not_started');
    if (existing) Object.assign(existing, { completedLessons, totalLessons, status, updatedAt: new Date() });
    else enrollment.progress.push({ courseId: course.slug, completedLessons, totalLessons, status });
    const completedPremium = enrollment.progress.filter(p => String(p.courseId || '').includes('premium') && p.status === 'completed').length;
    enrollment.premiumSchoolStage = Math.max(enrollment.premiumSchoolStage || 0, Math.min(3, completedPremium));
    if ((course.level === 'premium' || completedPremium >= 3) && status === 'completed') {
      if (completedPremium >= 3 || course.slug === 'fullstack-saas' || course.slug === 'job-ready-portfolio') {
        enrollment.premiumSchoolStage = 3;
        if (enrollment.certificateStatus === 'not_eligible') enrollment.certificateStatus = 'eligible';
      }
    }
    await enrollment.save();
    await logActivity(req, { type: 'academy_progress', user: req.currentUser._id, name: req.currentUser.name, email: req.currentUser.email, title: 'Academy progress updated', detail: `${req.currentUser.name} updated progress for ${course.title}.` });
    res.json({ message: 'Progress updated.', enrollment: publicEnrollment(enrollment) });
  } catch (err) { next(err); }
}
router.patch('/progress/:courseId', saveProgress);

async function getStudentsPayload() { const students = await AcademyEnrollment.find().populate('user', 'name email role status').sort({ updatedAt: -1 }).limit(500); return { provider: googleAiStudioEnabled() ? 'google-ai-studio-gemini' : 'tyna-auto-learning-api', mode: 'auto', students: students.map(publicEnrollment), courses: await listCourses() }; }
async function updateStudent(req, res, next) { try { const updates = {}; if (req.body.accessLevel && ['basic', 'advanced', 'premium'].includes(req.body.accessLevel)) updates.accessLevel = req.body.accessLevel; if (req.body.status && ['active', 'paused', 'blocked'].includes(req.body.status)) updates.status = req.body.status; if (req.body.verificationStatus && ['unverified','pending','verified','rejected'].includes(req.body.verificationStatus)) { updates.verificationStatus = req.body.verificationStatus; if (req.body.verificationStatus === 'verified') updates.verifiedAt = new Date(); updates.verifiedBy = req.currentUser._id || req.currentUser.id; } if (req.body.notes !== undefined) updates.notes = String(req.body.notes || ''); if (req.body.premiumSchoolStage !== undefined) updates.premiumSchoolStage = Math.max(0, Math.min(3, Number(req.body.premiumSchoolStage || 0))); const student = await AcademyEnrollment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }); if (!student) return res.status(404).json({ message: 'Student academy record not found.' }); await logActivity(req, { type: 'academy_admin_update', user: student.user, name: student.name, email: student.email, title: 'Academy access updated', detail: `${req.currentUser.name} updated ${student.email}.` }); res.json({ message: 'Student academy access updated.', student: publicEnrollment(student) }); } catch (err) { next(err); } }
async function awardCertificate(req, res, next) { try { const student = await AcademyEnrollment.findById(req.params.id); if (!student) return res.status(404).json({ message: 'Student academy record not found.' }); if (student.premiumSchoolStage < 3) return res.status(400).json({ message: 'Student must complete Premium School 3 or an approved premium capstone before certificate award.' }); student.certificateStatus = 'awarded'; student.certificateAwardedAt = new Date(); student.name = (req.body.fullName || student.name || '').trim() || student.name; student.certificateId = student.certificateId || generateCertificateId(student); await student.save(); await logActivity(req, { type: 'academy_certificate', user: student.user, name: student.name, email: student.email, title: 'Coding Academy certificate awarded', detail: `${student.email} received certificate ${student.certificateId}.` }); res.json({ message: 'Certificate awarded by Tyna Coding Academy.', student: publicEnrollment(student) }); } catch (err) { next(err); } }

router.get('/admin/students', requireStaff, async (req, res, next) => { try { res.json(await getStudentsPayload()); } catch (err) { next(err); } });
router.patch('/admin/students/:id', requireStaff, updateStudent);
router.patch('/admin/students/:id/verification', requireStaff, updateStudent);
router.post('/admin/students/:id/certificate', requireStaff, awardCertificate);
router.post('/admin/courses', requireStaff, async (req, res) => res.status(410).json({ message: 'Manual course creation is disabled. Tyna Coding Academy now uses the auto-learning API/provider. Use /api/academy/provider/sync to refresh auto courses.' }));
router.get('/developer/students', requireDeveloper, async (req, res, next) => { try { res.json(await getStudentsPayload()); } catch (err) { next(err); } });
router.patch('/developer/students/:id', requireDeveloper, updateStudent);
router.patch('/developer/students/:id/verification', requireDeveloper, updateStudent);
router.post('/developer/students/:id/certificate', requireDeveloper, awardCertificate);


export default router;
