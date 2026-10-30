import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { LoginScreen } from './auth/LoginScreen';
import { EmployerVerificationPortal } from './modules/EmployerVerificationPortal';
import { ResearchJournalModule } from './modules/ResearchJournalModule';
import { RegisterSchoolModal } from './modals/RegisterSchoolModal';
import {
  WhatsAppLogoIcon,
  PLATFORM_OWNER_WHATSAPP_RAW,
  buildWhatsAppUrl,
} from '../utils/whatsapp';
import { buildPublicShareUrl } from '../utils/shareUrl';
import heroCampusImg from '../assets/images/hero_campus_administration_1793363542493.jpg';
import instituteGraduationImg from '../assets/images/professional_institute_graduation_1793363543705.jpg';
import verificationWorkspaceImg from '../assets/images/digital_verification_workspace_1793363544156.jpg';
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Building2,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  GraduationCap,
  KeyRound,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
} from 'lucide-react';

interface PublicWebsiteLandingProps {
  embeddedInDashboard?: boolean;
}

type PublicSubView = 'website' | 'login' | 'verify' | 'journals';

type StakeholderTab = 'administrators' | 'teachers' | 'parents_students' | 'graduates';

type QualificationTierKey = 'level1' | 'level2' | 'level3' | 'certificate';

type InstitutionSegmentKey = 'basic_secondary' | 'tertiary_university' | 'professional_institute' | 'vocational_online';

interface SubmittedEnquiry {
  id: string;
  institutionName: string;
  institutionType: string;
  contactName: string;
  roleTitle: string;
  email: string;
  phone: string;
  learnerCount: string;
  enquiryType: string;
  notes: string;
  submittedAt: string;
}

const STAKEHOLDER_VIEWS: Record<
  StakeholderTab,
  {
    label: string;
    heading: string;
    summary: string;
    capabilities: string[];
  }
> = {
  administrators: {
    label: 'Proprietors & Registrars',
    heading: 'Centralised institutional governance from admission to graduation',
    summary:
      'Replace disconnected spreadsheets and paper files with unified admissions, class placement, fee billing, statutory HR payroll, and instant executive reporting.',
    capabilities: [
      'Online admission applications, automated student & candidate ID generation, and structured class or cohort placement',
      'Customisable institutional profiles, academic calendars, grading scales, user accounts, and role-based permissions',
      'Fee schedules, invoices, cash, bank transfer, and Mobile Money receipts alongside scholarship, discount, and budget tracking',
      'Staff registry, attendance monitoring, leave approvals, recruitment records, performance appraisals, and SSNIT / PAYE payroll',
    ],
  },
  teachers: {
    label: 'Teachers & Lecturers',
    heading: 'Structured academic planning, continuous assessment & AI teaching tools',
    summary:
      'Organise classes, courses, timetables, lesson notes, and examination diets while reducing manual grading and report writing workload.',
    capabilities: [
      'Class subjects, course syllabi, course flyers, rationale, learning objectives, timetables, and academic calendars',
      'Daily attendance registers, continuous assessment entry, end-of-term or diet examination marks, and automated grading',
      'AI-assisted lesson planning, assessment preparation, learning material drafting, and personalised report card comments',
      'Early identification of attendance patterns and learner academic progression across terms and levels',
    ],
  },
  parents_students: {
    label: 'Parents & Students',
    heading: 'Transparent academic, attendance & financial visibility from any device',
    summary:
      'Dedicated personal portals keep learners and guardians informed across desktop computers, laptops, tablets, and smartphones.',
    capabilities: [
      'Real-time access to daily attendance records, term examination results, continuous assessments, and assignments',
      'Clear visibility into school fee invoices, payment receipts, scholarships, and outstanding tuition balances',
      'Direct delivery of official school announcements, academic calendars, and timetable updates via portal, SMS, email, and WhatsApp',
      'Strict privacy boundaries ensuring students and parents see only their authorised personal records',
    ],
  },
  graduates: {
    label: 'Graduates & Alumni',
    heading: 'Lifelong digital credentials, transcripts & employer verification links',
    summary:
      'Upon formal completion approval, learners transition seamlessly to the institution’s searchable graduate and alumni register.',
    capabilities: [
      'Personal graduate accounts preserving complete academic histories, levels attained, and qualifications awarded',
      'Instant download of tamper-evident digital certificates featuring unique certificate numbers, authorised signatures, and QR codes',
      'Official academic transcript retrieval and multi-qualification portfolio management',
      'Shareable public verification links for prospective employers and agencies without exposing private student account data',
    ],
  },
};

const QUALIFICATION_TIERS: Record<
  QualificationTierKey,
  {
    tabLabel: string;
    title: string;
    subtitle: string;
    description: string;
    highlights: string[];
  }
> = {
  level1: {
    tabLabel: 'Level 1 · Foundation',
    title: 'Level 1 (Foundation Qualification Stage)',
    subtitle: 'Candidate onboarding · Core foundational papers · Exemption assessment',
    description:
      'Designed for new entrants into chartered and professional programmes. Manage candidate registration, foundational course syllabi, lecturer assignments, prior-learning exemptions, and diet examination sittings.',
    highlights: [
      'Structured course creation with detailed course descriptions, rationale, objectives, and downloadable course flyers',
      'Automated candidate numbering, entry qualification review, and paper-by-paper exemption recording',
      'Examination diet scheduling, continuous assessment weighting, and resit eligibility tracking',
    ],
  },
  level2: {
    tabLabel: 'Level 2 · Intermediate',
    title: 'Level 2 (Intermediate / Managerial Stage)',
    subtitle: 'Applied professional papers · Progression rules · Resit management',
    description:
      'Supports candidates advancing from foundational studies or entering with accredited diploma exemptions. Tracks multi-diet progression, lecturer allocations, and intermediate competency completion.',
    highlights: [
      'Prerequisite enforcement between Level 1 completion and Level 2 examination registration',
      'Comprehensive mark entry, moderation logs, and candidate progression audits across diets',
      'Dedicated candidate portal displaying passed papers, remaining credits, and tuition clearance status',
    ],
  },
  level3: {
    tabLabel: 'Level 3 · Advanced',
    title: 'Level 3 (Advanced / Final Professional Stage)',
    subtitle: 'Chartered & fellowship readiness · Graduation audit · Alumni induction',
    description:
      'Governs final-stage professional qualifying examinations, capstone assessments, formal graduation eligibility verification, digital certification, and induction into the graduate register.',
    highlights: [
      'Automated graduation eligibility checks verifying academic credits and financial clearance',
      'Digital certificate issuance with authorised executive signatures, unique serials, and scannable QR verification',
      'Formal transfer of approved completers to the searchable Graduate & Alumni Register by year and qualification',
    ],
  },
  certificate: {
    tabLabel: 'Certificate & Executive',
    title: 'Standalone Certificate, Diploma & Executive Programmes',
    subtitle: 'Non-chartered certificates · Vocational & short-course cohorts',
    description:
      'Caters specifically to certificate-awarding organisations, vocational centres, and executive training programmes that issue standalone certificates or diplomas outside multi-level chartered tracks.',
    highlights: [
      'Dedicated Certificate level distinct from Levels 1–3 and completely separated from basic school workspaces',
      'Customisable programme durations, modular assessments, and promotional course flyers for public intake',
      'Full QR-verifiable digital certificate issuance and alumni registry inclusion upon completion',
    ],
  },
};

const INSTITUTION_SEGMENTS: Record<
  InstitutionSegmentKey,
  {
    label: string;
    audience: string;
    summary: string;
    modules: string;
  }
> = {
  basic_secondary: {
    label: 'Nursery, Primary, JHS & SHS',
    audience: 'School Proprietors, Headteachers & Principals',
    summary:
      'Complete termly administration covering admissions, class placement, GES / BECE / WASSCE & Cambridge grading, daily attendance, biometric gate logs, boarding & transport welfare, parent portals, and Mobile Money fee collection.',
    modules: 'Admissions · Class & Subject Timetables · Report Cards · Fees & MoMo · Boarding & Transport · Parent Portal',
  },
  tertiary_university: {
    label: 'Colleges & Universities',
    audience: 'Vice-Chancellors, Provosts, Deans & Academic Registrars',
    summary:
      'Departmental and faculty organisation, semester credit-hour tracking, lecturer course assignments, open-access academic research & journal publishing, transcript generation, HR payroll, and alumni endowment management.',
    modules: 'Semester Registries · Course Credits · Research & Journal Press · Transcripts · HR & Payroll · Alumni Register',
  },
  professional_institute: {
    label: 'Professional & Chartered Institutes',
    audience: 'Institute Directors, Council Registrars & Examination Controllers',
    summary:
      'Purpose-built workspace separated from basic schools—supporting Level 1, Level 2, Level 3, and Certificate programmes, course rationale & flyer uploads, examination diets, exemptions, resits, and QR-verified digital credentials.',
    modules: 'Levels 1–3 & Certificate · Course Flyers · Exam Diets & Resits · Digital Signatures · QR Certificate Verification',
  },
  vocational_online: {
    label: 'Technical, Vocational & Online Centres',
    audience: 'Training Centre Managers & Programme Coordinators',
    summary:
      'Flexible cohort scheduling, practical competency assessments, modular fee plans, multi-device learner portals across smartphones and laptops, and verifiable completion certificates that employers can confirm online.',
    modules: 'Cohort Intakes · Practical Assessments · Flexible Billing · Multi-Device Portal · Online Credential Verification',
  },
};

export const PublicWebsiteLanding: React.FC<PublicWebsiteLandingProps> = ({
  embeddedInDashboard = false,
}) => {
  const {
    schools,
    isAuthenticated,
    isPlatformAdmin,
    firebaseUser,
    signInWithGoogle,
    allPublicResearchArticles,
    samplePublicCredentials,
    setActiveModule,
  } = useSchool();

  const initialVerifyParam = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('verify') || '';
    } catch {
      return '';
    }
  }, []);

  const [subView, setSubView] = useState<PublicSubView>(
    initialVerifyParam && !embeddedInDashboard ? 'verify' : 'website'
  );
  const [verifySerialQuery, setVerifySerialQuery] = useState(initialVerifyParam);
  const [stakeholderTab, setStakeholderTab] = useState<StakeholderTab>('administrators');
  const [qualificationTier, setQualificationTier] = useState<QualificationTierKey>('level1');
  const [institutionSegment, setInstitutionSegment] = useState<InstitutionSegmentKey>('professional_institute');

  // Image resilience states (Zero-Broken-Image Policy)
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [gradImgFailed, setGradImgFailed] = useState(false);
  const [verifyImgFailed, setVerifyImgFailed] = useState(false);

  // Platform Owner quick registration modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isOwnerSigningIn, setIsOwnerSigningIn] = useState(false);
  const [copiedSiteLink, setCopiedSiteLink] = useState(false);

  // Institutional Registration, Demo & Subscription Enquiry Form state
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('Professional / Chartered Institute');
  const [contactName, setContactName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Proprietor / Director');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [learnerCount, setLearnerCount] = useState('100 – 500 Students / Candidates');
  const [enquiryType, setEnquiryType] = useState('Institutional Registration & Onboarding');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<SubmittedEnquiry | null>(null);

  const formattedOwnerWhatsApp = '+233 207 615 941';

  const handleCopyWebsiteUrl = () => {
    const url = buildPublicShareUrl();
    navigator.clipboard?.writeText(url);
    setCopiedSiteLink(true);
    setTimeout(() => setCopiedSiteLink(false), 2400);
  };

  const handleVerifyLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (embeddedInDashboard) {
      setActiveModule('employer-verification');
      return;
    }
    setSubView('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPortalAction = () => {
    if (embeddedInDashboard) {
      setActiveModule('dashboard');
      return;
    }
    setSubView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOwnerQuickAction = async () => {
    if (isPlatformAdmin) {
      setShowRegisterModal(true);
      return;
    }
    setIsOwnerSigningIn(true);
    try {
      const res = await signInWithGoogle('staff');
      if (res.success && res.isPlatformAdmin) {
        setShowRegisterModal(true);
      } else {
        setSubView('login');
      }
    } finally {
      setIsOwnerSigningIn(false);
    }
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!institutionName.trim() || !contactName.trim()) {
      setFormError('Please provide your institution name and contact person full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid official or personal email address.');
      return;
    }

    const digitsOnly = phone.replace(/[^\d]/g, '');
    if (digitsOnly.length < 9) {
      setFormError('Please enter a valid telephone or WhatsApp number (at least 9 digits).');
      return;
    }

    const payload: SubmittedEnquiry = {
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      institutionName: institutionName.trim(),
      institutionType,
      contactName: contactName.trim(),
      roleTitle,
      email: email.trim(),
      phone: phone.trim(),
      learnerCount,
      enquiryType,
      notes: notes.trim(),
      submittedAt: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    try {
      const existingRaw = localStorage.getItem('edughana_platform_enquiries_v1');
      const existing: SubmittedEnquiry[] = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem(
        'edughana_platform_enquiries_v1',
        JSON.stringify([payload, ...existing].slice(0, 50))
      );
    } catch {
      // Ignore storage quota issues
    }

    setSubmittedEnquiry(payload);
  };

  const handleDownloadBrochureTxt = () => {
    const content = [
      'EDUGHANA SIS — ALL-IN-ONE SCHOOL AND INSTITUTION MANAGEMENT SYSTEM',
      'One Platform. Every Institution. Complete Management.',
      '========================================================================',
      '',
      'OVERVIEW',
      'Our All-in-One School and Institution Management System transforms how schools,',
      'colleges, universities, professional institutes, vocational institutions, and',
      'training centres operate. From student admission to graduation, staff administration',
      'to payroll, and examination management to digital certification, everything is',
      'connected in one secure digital platform.',
      '',
      'INSTITUTIONS SUPPORTED',
      '- Nursery, Kindergarten, Primary, Junior High (JHS) & Senior High Schools (SHS)',
      '- Colleges, Universities & Technical Institutions',
      '- Professional & Chartered Institutes (Level 1, Level 2, Level 3 & Certificate)',
      '- Vocational Institutions & Online Training Centres',
      '',
      'CORE CAPABILITIES',
      '1. Student Admission, Records & Portals (Parent, Student, Candidate & Graduate)',
      '2. Academic Management (Classes, Courses, Flyers, Timetables, Attendance, Exams)',
      '3. Financial & HR Management (Fees, Mobile Money, Budgets, SSNIT/PAYE Payroll)',
      '4. Professional Qualifications (Levels 1–3 & Certificate, Diets, Exemptions, Resits)',
      '5. Digital Certificate Issuance & Online QR / Serial Verification',
      '6. Searchable Graduate & Alumni Register with Personal Credential Accounts',
      '7. Super Administrator Governance, Multi-Tenant Security, AI Analytics & Backups',
      '',
      'OUR VISION',
      'To become a leading digital education and institutional management platform that',
      'transforms educational administration, strengthens academic excellence, and promotes',
      'credible professional certification through innovative technology.',
      '',
      'OUR MISSION',
      'To empower educational institutions and professional training organisations with',
      'secure, intelligent, accessible, and integrated digital solutions that simplify',
      'administration, improve accountability, enhance teaching and learning, and',
      'strengthen the credibility of academic and professional qualifications.',
      '',
      'OUR PROMISE',
      'Simplifying Education. Empowering Institutions. Verifying Excellence.',
      '',
      `DIRECT WHATSAPP ENQUIRIES & DEMO REQUESTS: ${formattedOwnerWhatsApp}`,
      `WEBSITE PORTAL: ${buildPublicShareUrl()}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'All_In_One_Institution_Management_Overview.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sub-views when running as standalone public front door
  if (!embeddedInDashboard && subView === 'login') {
    return <LoginScreen onBackToWebsite={() => setSubView('website')} />;
  }

  if (!embeddedInDashboard && subView === 'verify') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <EmployerVerificationPortal
            publicStandaloneMode={true}
            initialQuery={verifySerialQuery}
            onBackToLogin={() => {
              if (window.location.search.includes('verify=')) {
                window.history.replaceState({}, '', window.location.pathname);
              }
              setSubView('website');
            }}
          />
        </div>
      </div>
    );
  }

  if (!embeddedInDashboard && subView === 'journals') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <ResearchJournalModule
            readOnlyPublicMode={true}
            onBackToLogin={() => setSubView('website')}
          />
        </div>
      </div>
    );
  }

  const activeStakeholder = STAKEHOLDER_VIEWS[stakeholderTab];
  const activeTier = QUALIFICATION_TIERS[qualificationTier];
  const activeSegment = INSTITUTION_SEGMENTS[institutionSegment];

  const enquiryWhatsAppPrefill = submittedEnquiry
    ? [
        `Hello Platform Owner, I have submitted an institutional enquiry (${submittedEnquiry.id}):`,
        `• Institution: ${submittedEnquiry.institutionName} (${submittedEnquiry.institutionType})`,
        `• Contact: ${submittedEnquiry.contactName} (${submittedEnquiry.roleTitle})`,
        `• Size: ${submittedEnquiry.learnerCount}`,
        `• Request: ${submittedEnquiry.enquiryType}`,
        `• Email: ${submittedEnquiry.email} | Tel: ${submittedEnquiry.phone}`,
        submittedEnquiry.notes ? `• Details: ${submittedEnquiry.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : 'Hello Platform Owner, I am visiting your website and would like to enquire about institutional registration, subscription packages, or a product demonstration.';

  return (
    <div
      className={`${
        embeddedInDashboard
          ? 'bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden'
          : 'min-h-screen bg-slate-950 text-slate-100'
      } font-sans selection:bg-emerald-500 selection:text-white`}
    >
      {/* Top Bar — Strict 3-Zone Contract when Standalone Public Website */}
      {!embeddedInDashboard ? (
        <header className="sticky top-0 z-40 h-16 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-8">
            {/* Zone 1: Single text element wordmark */}
            <a
              href="#top"
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
            >
              EduGhana SIS
            </a>

            {/* Zone 2: 5 concise single-line text navigation links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
              <a
                href="#capabilities"
                className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Capabilities
              </a>
              <a
                href="#institutes"
                className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Institutes
              </a>
              <button
                type="button"
                onClick={() => {
                  setVerifySerialQuery('');
                  setSubView('verify');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Verification
              </button>
              <a
                href="#vision"
                className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Vision
              </a>
              <a
                href="#enquiries"
                className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Enquiries
              </a>
            </nav>

            {/* Zone 3: 1 primary action */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={handleOpenPortalAction}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {schools.length > 0 ? 'Portal Sign In' : isPlatformAdmin ? 'Owner Workspace' : 'Portal Sign In'}
              </button>
            </div>
          </div>
        </header>
      ) : (
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Public Website &amp; Institutional Charter</span>
              <span aria-hidden="true">·</span>
              <span>Shared Visitor Landing View</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              All-in-One School and Institution Management System
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyWebsiteUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
            >
              {copiedSiteLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Website Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Copy Public Website Link</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadBrochureTxt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download Overview</span>
            </button>
          </div>
        </div>
      )}

      {/* Platform Owner Active Bar (Only when Owner is signed into Google or has active admin session) */}
      {!embeddedInDashboard && isPlatformAdmin && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Platform Owner session active ({firebaseUser?.email})</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="tabular-nums text-emerald-400">
                {schools.length} registered {schools.length === 1 ? 'institution' : 'institutions'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Register Institute or School
              </button>
              <button
                type="button"
                onClick={() => setSubView('login')}
                className="text-slate-300 hover:text-white underline underline-offset-4 font-medium transition cursor-pointer whitespace-nowrap"
              >
                Open Portal Switcher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          HERO SECTION — 2-Column Balanced Split + Full-Width 4-Column Proof Row
         ===================================================================== */}
      <section id="top" className="px-4 sm:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16 border-b border-slate-900">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Proposition Column */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-400">
                  <span>All-in-One School &amp; Institution Management System</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400">Schools, Universities &amp; Chartered Institutes</span>
                </div>

                <h1 className="font-serif text-[clamp(2.25rem,4vw,3.65rem)] font-bold text-white leading-[1.1] tracking-tight text-balance">
                  One Platform. Every Institution. Complete Management.
                </h1>

                <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed max-w-[65ch]">
                  Welcome to the future of educational and institutional management. Our digital
                  platform brings academic, administrative, financial, human resource, and
                  certification responsibilities together in one secure, intelligent workspace—from
                  student admission to graduation, staff administration to payroll, and examination
                  management to QR-verifiable digital certification.
                </p>

                <p className="text-sm text-slate-400 leading-relaxed max-w-[65ch]">
                  Whether you operate a nursery, kindergarten, primary school, junior high school,
                  senior high school, college, university, technical institution, professional
                  institute, or online training centre, each organisation operates independently
                  within its own customisable digital environment.
                </p>
              </div>

              {/* Focused CTA Decision Block */}
              <div className="space-y-5 pt-2">
                <div className="flex flex-wrap items-center gap-3.5">
                  <a
                    href="#enquiries"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Request Demo or Register Institution</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </a>

                  {!embeddedInDashboard && (
                    <button
                      type="button"
                      onClick={handleOpenPortalAction}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sign In to Portal</span>
                    </button>
                  )}

                  <a
                    href={buildWhatsAppUrl(
                      PLATFORM_OWNER_WHATSAPP_RAW,
                      'Hello Platform Owner, I am visiting your website and would like to enquire about institutional registration, subscription packages, or a product demonstration.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <WhatsAppLogoIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span className="tabular-nums">WhatsApp {formattedOwnerWhatsApp}</span>
                  </a>
                </div>

                {/* Unboxed Institution Coverage Metadata */}
                <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                  <span className="text-slate-200 font-semibold">Designed for: </span>
                  <span>Nursery &amp; KG</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span>Primary, JHS &amp; SHS</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span>Colleges &amp; Universities</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span>Chartered &amp; Certificate Institutes</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span>Vocational &amp; Online Centres</span>
                </div>
              </div>
            </div>

            {/* Right Visual Anchor Column */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex-1 min-h-[290px] sm:min-h-[360px] lg:h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                {!heroImgFailed ? (
                  <img
                    src={heroCampusImg}
                    alt="Institutional administrators collaborating in a modern West African academic campus workspace"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 flex flex-col items-center justify-center p-8 text-center">
                    <Building2 className="w-12 h-12 text-emerald-400 mb-3" />
                    <p className="text-sm font-semibold text-white">
                      Centralised Digital Campus &amp; Institute Workspace
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Admissions · Academics · Finance · Certification
                    </p>
                  </div>
                )}

                {/* Measured Contrast Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-6">
                  <p className="text-xs text-emerald-300 font-medium">
                    Our Promise
                  </p>
                  <p className="text-base sm:text-lg font-serif font-bold text-white mt-0.5">
                    Simplifying Education. Empowering Institutions. Verifying Excellence.
                  </p>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Accessible on desktop computers, laptops, tablets, and smartphones with strict
                    multi-tenant security and role-based permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Architectural Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-slate-400">Institutional Scope</div>
              <div className="text-xl font-bold text-white tabular-nums">10+ Institution Types</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                From nursery and basic schools to universities, chartered bodies, and vocational centres.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-slate-400">Professional Progression</div>
              <div className="text-xl font-bold text-white tabular-nums">Levels 1–3 &amp; Cert</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Foundation, Intermediate, Advanced, and standalone Certificate &amp; Diploma tracks.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-slate-400">Digital Credentials</div>
              <div className="text-xl font-bold text-white tabular-nums">QR &amp; Serial Lookup</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorised digital signatures, unique certificate numbers, and instant employer verification.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-slate-400">Governance &amp; Continuity</div>
              <div className="text-xl font-bold text-white tabular-nums">CSV · PDF · Cloud</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Independent multi-tenant records, encrypted sync, activity logs, and complete data exports.
              </p>
            </div>
          </div>

          {/* Public Self-Service Access Strip (Certificate Verification, Research Press, Portal Login) */}
          {!embeddedInDashboard && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="text-xs text-emerald-400 font-medium">
                  Immediate Public &amp; Member Access
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Sign in to an institution, verify a graduate’s certificate, or read academic publications
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setVerifySerialQuery('');
                    setSubView('verify');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition cursor-pointer whitespace-nowrap"
                >
                  <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="tabular-nums">
                    Verify Certificate ({samplePublicCredentials.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubView('journals');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition cursor-pointer whitespace-nowrap"
                >
                  <BookOpenCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="tabular-nums">
                    Research &amp; Journals ({allPublicResearchArticles.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleOwnerQuickAction}
                  disabled={isOwnerSigningIn}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isOwnerSigningIn
                      ? 'Connecting...'
                      : isPlatformAdmin
                      ? 'Register New Institution'
                      : 'Platform Owner Sign In'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 01 — CENTRALISED CAPABILITIES (Asymmetric Bento + Role Views)
         ===================================================================== */}
      <section id="capabilities" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-medium text-emerald-400">
              Centralised Institutional Operations
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
              Eliminate disconnected spreadsheets, paper files, and fragmented administration
            </h2>
            <p className="text-[15px] text-slate-300 leading-relaxed">
              Managing an educational institution involves student registration, academic planning,
              attendance monitoring, examination administration, financial management, human
              resource administration, communication, and institutional reporting. Our platform
              connects every department in one accurate, accountable system.
            </p>
          </div>

          {/* Interactive Stakeholder Perspective Explorer (Marquee Full-Width Surface) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Dedicated Portals for Every Institutional Stakeholder
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a role below to inspect how proprietors, teachers, parents, students, and graduates work together.
                </p>
              </div>

              {/* Functional Segmented Filter Control */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                {(Object.keys(STAKEHOLDER_VIEWS) as StakeholderTab[]).map((key) => {
                  const isSelected = stakeholderTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStakeholderTab(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {STAKEHOLDER_VIEWS[key].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-3">
                <h4 className="text-lg sm:text-xl font-bold text-white text-balance">
                  {activeStakeholder.heading}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeStakeholder.summary}
                </p>
                {!embeddedInDashboard && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleOpenPortalAction}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer whitespace-nowrap"
                    >
                      <span>Access {activeStakeholder.label} Portal</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeStakeholder.capabilities.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs text-slate-300 leading-relaxed"
                  >
                    <span className="font-mono text-emerald-400 font-semibold tabular-nums mr-1.5">
                      0{idx + 1}.
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Asymmetric Bento Grid — 6 Numbered Institutional Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 01 — col-span-2 on large screens */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                01. Student Admission, Records &amp; Academic Administration
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Receive online applications, register learners, generate unique identification
                numbers, maintain complete student profiles, manage class placement, record academic
                histories, and monitor progression from intake to completion.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Administrators and teachers organise classes, subjects, timetables, lesson notes,
                assignments, academic calendars, attendance registers, continuous assessments, and
                end-of-term examination marks in one unified workflow.
              </p>
            </div>

            {/* 02 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                02. Financial &amp; Mobile Money Billing
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Manage school fees, invoices, receipts, outstanding balances, scholarships,
                discounts, expenditure, and institutional budgets. Record cash payments, bank
                transfers, and approved electronic transactions including Mobile Money integrations.
              </p>
            </div>

            {/* 03 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                03. Human Resources &amp; Statutory Payroll
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Maintain comprehensive staff records, monitor daily attendance, manage leave
                applications, organise recruitment, conduct performance appraisals, and administer
                monthly salaries with automated statutory deductions and payslips.
              </p>
            </div>

            {/* 04 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                04. Library, Transport, Boarding &amp; Welfare
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Coordinate essential campus operations including library cataloguing and borrowing,
                institutional asset inventory, school bus routes, boarding house allocation, canteen
                point-of-sale, biometric turnstile gate logs, and student health welfare.
              </p>
            </div>

            {/* 05 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                05. AI Assistance &amp; Management Analytics
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Support teachers with lesson planning, assessment preparation, learning materials,
                and report comments—while giving leaders real-time analytics on student performance,
                attendance trends, fee collection rates, and downloadable CSV or PDF reports.
              </p>
            </div>

            {/* 06 — Full-width Super Admin & Security Governance Banner */}
            <div className="md:col-span-2 lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  06. Super Administrator Oversight &amp; Delegated Governance
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Through the dedicated Super Administrator control plane, the Platform Owner
                  registers institutions, approves applications, manages flexible subscription
                  packages, monitors platform activity, and configures system settings. Specific
                  responsibilities—institutional registration, customer support, technical
                  assistance, financial administration, and certificate management—can be assigned,
                  updated, suspended, reactivated, or revoked without compromising the Platform
                  Owner’s ultimate authority.
                </p>
              </div>

              <div className="space-y-2.5 lg:border-l lg:border-slate-800 lg:pl-6">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  07. Multi-Tenant Security, Data Protection &amp; Recovery
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Each institution operates within its own isolated workspace so student, staff,
                  financial, and examination records remain protected from unauthorised access by
                  other organisations. Role-based permissions, authenticated cloud sessions,
                  activity logs, and instant CSV, PDF, and JSON backup/restore mechanisms safeguard
                  institutional accountability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 02 — PROFESSIONAL INSTITUTES, DIGITAL CERTIFICATES & ALUMNI
         ===================================================================== */}
      <section id="institutes" className="px-4 sm:px-8 py-14 sm:py-20 bg-slate-900/30 border-b border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-medium text-emerald-400">
                  Chartered Bodies, Certificate Organisations &amp; Vocational Centres
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                  Specialised academic progression from Foundation Level 1 to QR-verified graduation
                </h2>
                <p className="text-[15px] text-slate-300 leading-relaxed">
                  Beyond conventional school administration, our platform provides a dedicated
                  environment for professional institutions, chartered institutes,
                  certificate-awarding organisations, and vocational training centres—cleanly
                  separated from basic school workspaces.
                </p>
              </div>

              {/* Qualification Level Interactive Explorer */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  {(Object.keys(QUALIFICATION_TIERS) as QualificationTierKey[]).map((tierKey) => {
                    const isSelected = qualificationTier === tierKey;
                    return (
                      <button
                        key={tierKey}
                        type="button"
                        onClick={() => setQualificationTier(tierKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {QUALIFICATION_TIERS[tierKey].tabLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs text-emerald-400 font-medium">
                    {activeTier.subtitle}
                  </div>
                  <h3 className="text-lg font-bold text-white">{activeTier.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeTier.description}
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-slate-800">
                    {activeTier.highlights.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase — Institute Graduation */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex-1 min-h-[280px] lg:h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                {!gradImgFailed ? (
                  <img
                    src={instituteGraduationImg}
                    alt="Professional institute fellows and graduates holding official embossed qualification certificates"
                    referrerPolicy="no-referrer"
                    onError={() => setGradImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                    <GraduationCap className="w-12 h-12 text-emerald-400 mb-3" />
                    <p className="text-sm font-semibold text-white">
                      Professional Qualifications &amp; Graduate Register
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6">
                  <div className="text-xs text-emerald-300 font-medium">
                    Searchable Graduate &amp; Alumni Register
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">
                    Organised by programme, qualification, level attained, and year of completion
                  </p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Approved completers receive personal alumni accounts to download certificates,
                    obtain transcripts, and share verification links with employers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Digital Certificate Verification Interactive Bar + Visual */}
          <div
            id="verification"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8"
          >
            <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[230px]">
              {!verifyImgFailed ? (
                <img
                  src={verificationWorkspaceImg}
                  alt="Registrar verification portal displaying an academic record next to a QR-sealed certificate"
                  referrerPolicy="no-referrer"
                  onError={() => setVerifyImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <QrCode className="w-10 h-10 text-emerald-400 mb-2" />
                  <span className="text-xs font-semibold text-white">
                    QR &amp; Certificate Serial Verification
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="text-xs font-medium text-emerald-400">
                  Digital Certificate Issuance &amp; Employer Verification
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white text-balance">
                  Instant online verification by QR code or certificate number
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Institutions issue professionally designed digital certificates containing unique
                  certificate numbers, authorised signatures, and scannable QR codes. Employers,
                  recruitment agencies, universities, and embassies can confirm qualification
                  authenticity directly against official issuing records without exposing a
                  graduate’s confidential academic account.
                </p>
              </div>

              <form onSubmit={handleVerifyLookupSubmit} className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Verify an Official Certificate Number Online
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={verifySerialQuery}
                      onChange={(e) => setVerifySerialQuery(e.target.value)}
                      placeholder="Enter certificate serial number or candidate ID..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>Open Verification Portal</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 03 — VISION, MISSION, PROMISE & INSTITUTION TYPES
         ===================================================================== */}
      <section id="vision" className="px-4 sm:px-8 py-14 sm:py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-3">
              <div className="text-xs font-semibold text-emerald-400">Our Vision</div>
              <h3 className="font-serif text-xl font-bold text-white">
                Transforming Educational Administration &amp; Certification
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                To become a leading digital education and institutional management platform that
                transforms educational administration, strengthens academic excellence, and promotes
                credible professional certification through innovative technology.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-3">
              <div className="text-xs font-semibold text-emerald-400">Our Mission</div>
              <h3 className="font-serif text-xl font-bold text-white">
                Secure, Intelligent &amp; Accessible Institutional Solutions
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                To empower educational institutions and professional training organisations with
                secure, intelligent, accessible, and integrated digital solutions that simplify
                administration, improve accountability, enhance teaching and learning, and
                strengthen the credibility of academic and professional qualifications.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-emerald-400">Our Promise</div>
                <h3 className="font-serif text-2xl font-bold text-white leading-snug text-balance">
                  Simplifying Education. Empowering Institutions. Verifying Excellence.
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Flexible subscription arrangements and configurable service packages tailored to
                  your institution’s size, student population, active users, and required modules.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
                SMS · Email · WhatsApp · Mobile Money · Cloud Sync
              </div>
            </div>
          </div>

          {/* Built for Every Institutional Leader — Interactive Segment Selector */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Tailored for Every Educational &amp; Training Institution
                </h3>
                <p className="text-xs text-slate-400">
                  Are you a school proprietor, headteacher, principal, university administrator, professional institute director, or training centre manager?
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                {(Object.keys(INSTITUTION_SEGMENTS) as InstitutionSegmentKey[]).map((segKey) => {
                  const isSelected = institutionSegment === segKey;
                  return (
                    <button
                      key={segKey}
                      type="button"
                      onClick={() => setInstitutionSegment(segKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {INSTITUTION_SEGMENTS[segKey].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-2.5">
                <div className="text-xs font-medium text-emerald-400">
                  Built for {activeSegment.audience}
                </div>
                <h4 className="text-lg font-bold text-white">{activeSegment.label}</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{activeSegment.summary}</p>
                <p className="text-xs text-slate-400 pt-1">{activeSegment.modules}</p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <a
                  href="#enquiries"
                  onClick={() => {
                    setInstitutionType(activeSegment.label);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition whitespace-nowrap"
                >
                  <span>Enquire for {activeSegment.label.split(',')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={handleDownloadBrochureTxt}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Download Platform Summary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 04 — INSTITUTIONAL REGISTRATION, SUBSCRIPTION & DEMO ENQUIRIES
         ===================================================================== */}
      <section id="enquiries" className="px-4 sm:px-8 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Direct Contact & Onboarding Guidance */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-medium text-emerald-400">
                Onboarding, Demonstrations &amp; Subscriptions
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                Ready to transform your institution? Let us help you manage smarter, operate better, and achieve more.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Whether you are establishing a new institution or transforming an existing one, we
                are ready to support your digital journey. Contact us to discuss your institutional
                requirements, request a product demonstration, explore available features, and
                select a suitable subscription package.
              </p>
            </div>

            {/* Direct WhatsApp Card (+233 207 615 941) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                  <WhatsAppLogoIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Direct WhatsApp Registration &amp; Support Desk
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    For institutional registration, subscription enquiries, product demonstrations,
                    and further information, contact us directly through WhatsApp:
                  </p>
                  <p className="text-base font-mono font-bold text-[#25D366] tabular-nums pt-0.5">
                    {formattedOwnerWhatsApp}
                  </p>
                </div>
              </div>

              <a
                href={buildWhatsAppUrl(PLATFORM_OWNER_WHATSAPP_RAW, enquiryWhatsAppPrefill)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition whitespace-nowrap"
              >
                <WhatsAppLogoIcon className="w-4 h-4 shrink-0" />
                <span className="tabular-nums">Chat on WhatsApp ({formattedOwnerWhatsApp})</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">What happens when you enquire:</p>
              <p>01. Consultation on your academic structure, levels, and required modules.</p>
              <p>02. Live product demonstration for your proprietor, board, or academic team.</p>
              <p>03. Provisioning of your isolated institutional portal and administrator accounts.</p>
            </div>
          </div>

          {/* Right Validated Enquiry & Demo Request Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
            {submittedEnquiry ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 pb-4 border-b border-slate-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-mono text-emerald-400 tabular-nums">
                      Reference {submittedEnquiry.id} · {submittedEnquiry.submittedAt}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Institutional Enquiry Prepared
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Thank you, {submittedEnquiry.contactName}. Your details for{' '}
                      <strong className="text-white">{submittedEnquiry.institutionName}</strong> are
                      ready. Click below to send this formatted brief directly to our team on
                      WhatsApp ({formattedOwnerWhatsApp}) for immediate onboarding assistance.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5 text-slate-300">
                  <div>
                    <span className="text-slate-500">Institution: </span>
                    <span className="font-semibold text-white">{submittedEnquiry.institutionName}</span>
                    <span> · {submittedEnquiry.institutionType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact: </span>
                    <span>
                      {submittedEnquiry.contactName} ({submittedEnquiry.roleTitle})
                    </span>
                  </div>
                  <div className="tabular-nums">
                    <span className="text-slate-500">Email &amp; Phone: </span>
                    <span>
                      {submittedEnquiry.email} · {submittedEnquiry.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Enquiry &amp; Scale: </span>
                    <span>
                      {submittedEnquiry.enquiryType} · {submittedEnquiry.learnerCount}
                    </span>
                  </div>
                  {submittedEnquiry.notes && (
                    <div className="pt-1 text-slate-400">
                      <span className="text-slate-500">Notes: </span>
                      {submittedEnquiry.notes}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={buildWhatsAppUrl(PLATFORM_OWNER_WHATSAPP_RAW, enquiryWhatsAppPrefill)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-xs font-bold transition whitespace-nowrap"
                  >
                    <WhatsAppLogoIcon className="w-4 h-4 shrink-0" />
                    <span className="tabular-nums">Send Enquiry via WhatsApp ({formattedOwnerWhatsApp})</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setSubmittedEnquiry(null)}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    Edit or Submit Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Request a Product Demonstration or Institutional Registration
                  </h3>
                  <p className="text-slate-400 mt-0.5">
                    Complete your institutional details below to prepare an onboarding or subscription package request.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="e.g. Chartered Institute of Management / Royal Academy"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Institution Category *
                    </label>
                    <select
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Professional / Chartered Institute">
                        Professional / Chartered Institute (Levels 1–3 &amp; Certificate)
                      </option>
                      <option value="Certificate / Vocational Training Centre">
                        Certificate / Vocational / Online Training Centre
                      </option>
                      <option value="Nursery, Primary & Junior High School">
                        Nursery, Kindergarten, Primary &amp; JHS
                      </option>
                      <option value="Senior High / International School">
                        Senior High / International School
                      </option>
                      <option value="College / University">
                        College / University / Tertiary Institution
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full name of contact person"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Leadership Role
                    </label>
                    <select
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Proprietor / School Owner">Proprietor / School Owner</option>
                      <option value="Institute Director / Registrar">Institute Director / Registrar</option>
                      <option value="Headteacher / Principal">Headteacher / Principal</option>
                      <option value="University / College Administrator">University / College Administrator</option>
                      <option value="Training Centre Manager">Training Centre Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@institution.edu.gh"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +233 24 000 0000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Estimated Student / Candidate Population
                    </label>
                    <select
                      value={learnerCount}
                      onChange={(e) => setLearnerCount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Under 100 Learners">Under 100 Learners</option>
                      <option value="100 – 500 Students / Candidates">100 – 500 Students / Candidates</option>
                      <option value="500 – 1,500 Students / Candidates">500 – 1,500 Students / Candidates</option>
                      <option value="1,500+ Multi-Campus / National Cohort">1,500+ Multi-Campus / National Cohort</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Primary Enquiry Type
                    </label>
                    <select
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Institutional Registration & Onboarding">
                        Institutional Registration &amp; Onboarding
                      </option>
                      <option value="Live Product Demonstration">Live Product Demonstration</option>
                      <option value="Subscription Package & Pricing Quote">
                        Subscription Package &amp; Pricing Quote
                      </option>
                      <option value="Digital Certificate & Verification Setup">
                        Digital Certificate &amp; Verification Setup
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Institutional Requirements or Questions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share your programmes, academic levels, or specific operational goals..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                    {formError}
                  </div>
                )}

                <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                  >
                    <span>Submit Institutional Enquiry</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <span className="text-[11px] text-slate-500">
                    Protected under Ghana Data Protection Act, 2012 (Act 843)
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          QUIET EDITORIAL FOOTER
         ===================================================================== */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 sm:px-8 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="text-sm font-bold text-white">
              EduGhana SIS · One Platform. Every Institution. Complete Management.
            </div>
            <p className="text-slate-400">
              Simplifying Education. Empowering Institutions. Verifying Excellence.
            </p>
            <p className="text-[11px] text-slate-500 tabular-nums">
              Direct WhatsApp Enquiries: {formattedOwnerWhatsApp} · Multi-Tenant Institutional Cloud
            </p>
          </div>

          {!embeddedInDashboard && (
            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-300">
              <a href="#capabilities" className="hover:text-white transition whitespace-nowrap">
                Capabilities
              </a>
              <a href="#institutes" className="hover:text-white transition whitespace-nowrap">
                Professional Institutes
              </a>
              <button
                type="button"
                onClick={() => {
                  setVerifySerialQuery('');
                  setSubView('verify');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition cursor-pointer whitespace-nowrap"
              >
                Verify Certificate
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubView('journals');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition cursor-pointer whitespace-nowrap"
              >
                Research Journals
              </button>
              <button
                type="button"
                onClick={handleOpenPortalAction}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer whitespace-nowrap"
              >
                {isAuthenticated && schools.length > 0 ? 'Return to Dashboard' : 'Portal Sign In'}
              </button>
            </div>
          )}
        </div>
      </footer>

      {isPlatformAdmin && (
        <RegisterSchoolModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
};
