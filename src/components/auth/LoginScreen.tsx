import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Building2,
  KeyRound,
  ChevronDown,
  Globe,
  BookOpenCheck,
  GraduationCap,
  Award,
  IdCard,
  PlusCircle,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { ResearchJournalModule } from '../modules/ResearchJournalModule';
import { EmployerVerificationPortal } from '../modules/EmployerVerificationPortal';
import { RegisterSchoolModal } from '../modals/RegisterSchoolModal';
import {
  WhatsAppLogoIcon,
  PLATFORM_OWNER_WHATSAPP_RAW,
  PLATFORM_OWNER_WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  getSchoolWhatsAppContact,
} from '../../utils/whatsapp';

interface LoginScreenProps {
  onBackToWebsite?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBackToWebsite }) => {
  const {
    school,
    schools,
    activeSchoolId,
    switchSchool,
    users,
    students,
    candidates,
    graduateRecords,
    signInWithGoogle,
    loginWithEmail,
    logout,
    firebaseUser,
    allPublicResearchArticles,
    samplePublicCredentials,
    isPlatformAdmin,
  } = useSchool();

  const initialVerifyParam = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('verify') || '';
    } catch {
      return '';
    }
  }, []);

  const hasSchools = schools.length > 0;

  const [selectedSchoolId, setSelectedSchoolId] = useState(activeSchoolId);
  const [loginMode, setLoginMode] = useState<'staff' | 'student'>('staff');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showRegisterSchoolModal, setShowRegisterSchoolModal] = useState(false);
  const [showPublicJournals, setShowPublicJournals] = useState(false);
  const schoolWhatsApp = hasSchools
    ? getSchoolWhatsAppContact(school)
    : { enabled: false, rawNumber: '', digits: '' };
  const [showPublicVerification, setShowPublicVerification] = useState<boolean>(Boolean(initialVerifyParam));

  const staffUsers = useMemo(
    () => users.filter((u) => u.role !== 'student' && u.role !== 'graduate' && u.role !== 'parent'),
    [users]
  );

  // Build quick-select Student, Candidate & Graduate accounts for the active institution
  const learnerQuickAccounts = useMemo(() => {
    const items: {
      key: string;
      name: string;
      identifier: string;
      subtitle: string;
      badge: string;
      avatar: string;
    }[] = [];

    users
      .filter((u) => u.role === 'student' || u.role === 'graduate')
      .forEach((u) => {
        items.push({
          key: `u-${u.id}`,
          name: u.name,
          identifier: u.email,
          subtitle: u.title,
          badge: u.role === 'graduate' ? 'Graduate' : 'Student',
          avatar: u.avatar,
        });
      });

    candidates.slice(0, 4).forEach((c) => {
      if (!items.some((it) => it.name === `${c.firstName} ${c.lastName}`)) {
        items.push({
          key: `cand-${c.id}`,
          name: `${c.firstName} ${c.lastName}`,
          identifier: c.candidateNumber,
          subtitle: `${c.candidateNumber} · Level ${c.currentLevel}`,
          badge: c.status === 'Completed / Graduated' ? 'Graduate' : 'Candidate',
          avatar: c.photo,
        });
      }
    });

    students.slice(0, 3).forEach((s) => {
      if (!items.some((it) => it.name === `${s.firstName} ${s.lastName}`)) {
        items.push({
          key: `stu-${s.id}`,
          name: `${s.firstName} ${s.lastName}`,
          identifier: s.studentNumber,
          subtitle: `${s.studentNumber} · Enrolled Student`,
          badge: 'Student',
          avatar: s.photo,
        });
      }
    });

    graduateRecords.slice(0, 2).forEach((g) => {
      if (!items.some((it) => it.name === g.fullName)) {
        items.push({
          key: `grad-${g.id}`,
          name: g.fullName,
          identifier: g.candidateNumber,
          subtitle: `${g.candidateNumber} · ${g.qualificationAwarded}`,
          badge: 'Alumni',
          avatar: g.photo,
        });
      }
    });

    return items.slice(0, 5);
  }, [users, candidates, students, graduateRecords]);

  // Sync default identifier when school or mode changes
  useEffect(() => {
    setSelectedSchoolId(activeSchoolId);
    if (!hasSchools) {
      setIdentifier('');
      setErrorMessage(null);
      return;
    }
    if (loginMode === 'staff') {
      const primaryStaff = staffUsers[0] || users[0];
      if (primaryStaff) {
        setIdentifier(primaryStaff.email);
        setPassword(primaryStaff.password || 'admin123');
      } else {
        setIdentifier('');
      }
    } else {
      const firstLearner = learnerQuickAccounts[0];
      setIdentifier(firstLearner ? firstLearner.identifier : '');
      setPassword('student123');
    }
    setErrorMessage(null);
  }, [activeSchoolId, hasSchools, loginMode, staffUsers.length, learnerQuickAccounts.length]);

  const handleSchoolChange = (newSchoolId: string) => {
    setSelectedSchoolId(newSchoolId);
    switchSchool(newSchoolId);
    setShowSchoolDropdown(false);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage(
        loginMode === 'student'
          ? 'Please enter your Student / Candidate ID or email address.'
          : 'Please enter your official staff or administrator email address.'
      );
      return;
    }
    const result = loginWithEmail(identifier, password, selectedSchoolId, loginMode);
    if (!result.success) {
      setErrorMessage(result.message || 'Login failed. Please verify your credentials.');
    }
  };

  const handleQuickLogin = (presetId: string, mode: 'staff' | 'student', presetPassword?: string) => {
    setIdentifier(presetId);
    const result = loginWithEmail(
      presetId,
      presetPassword || (mode === 'student' ? 'student123' : 'admin123'),
      selectedSchoolId,
      mode
    );
    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle(hasSchools ? loginMode : 'staff');
      if (res.success && res.isPlatformAdmin && schools.length === 0) {
        setShowRegisterSchoolModal(true);
      } else if (!res.success && res.message) {
        setErrorMessage(res.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (showPublicVerification) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <EmployerVerificationPortal
            publicStandaloneMode={true}
            initialQuery={initialVerifyParam}
            onBackToLogin={() => {
              if (window.location.search.includes('verify=')) {
                window.history.replaceState({}, '', window.location.pathname);
              }
              setShowPublicVerification(false);
            }}
          />
        </div>
      </div>
    );
  }

  if (showPublicJournals) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <ResearchJournalModule
            readOnlyPublicMode={true}
            onBackToLogin={() => setShowPublicJournals(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-lg space-y-5">
        {onBackToWebsite && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToWebsite}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Website Overview</span>
            </button>
            <span className="text-[11px] text-slate-500">Portal Access</span>
          </div>
        )}

        {!hasSchools ? (
          <>
            {/* Platform Charter Empty-State Onboarding Header */}
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 mx-auto rounded-2xl border border-emerald-500/60 p-3 bg-slate-900 flex items-center justify-center text-emerald-400">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-400 mb-1">
                  One Platform · Every Institution · Complete Management
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                  All-in-One School &amp; Institution Portal
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Schools · Colleges &amp; Universities · Professional &amp; Certificate Institutes
                </p>
              </div>
            </div>

            {/* Clean Zero-Schools Onboarding Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs space-y-5">
              {isPlatformAdmin ? (
                <>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-sm text-white truncate">
                        Platform Owner Verified
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 truncate max-w-[200px]">
                      {firebaseUser?.email}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    Your workspace is clean with zero sample institutions. Register your first{' '}
                    <strong className="text-white">Professional / Certificate Institute</strong> (Levels 1, 2, 3 &amp; Certificate) or{' '}
                    <strong className="text-white">Basic / Secondary School</strong> to launch its dedicated portal and administrator profile.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowRegisterSchoolModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4 shrink-0" />
                    <span>+ Register First Institute or School</span>
                  </button>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Signed in as Platform Charter Owner</span>
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 font-semibold transition cursor-pointer whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="font-bold text-sm text-white">
                      No Institutions Registered Yet
                    </h2>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Institutional portals appear here once registered by the Platform Owner. If you are the Platform Owner, sign in with Google below to create your first Institute or School.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                      />
                    </svg>
                    <span>
                      {isGoogleLoading
                        ? 'Connecting to Google...'
                        : 'Sign In with Google (Platform Owner)'}
                    </span>
                  </button>

                  <div className="pt-2 border-t border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>
                      Want to onboard your school or professional institute? Contact the Platform Owner directly on WhatsApp below.
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Top Multi-Institution Switcher Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-400 font-medium whitespace-nowrap">Institution:</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-emerald-500 text-white font-semibold transition cursor-pointer"
                  >
                    <img
                      src={school.crest}
                      alt={school.name}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                    <span className="truncate max-w-[140px] sm:max-w-[190px]">{school.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {showSchoolDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                      <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 mb-1 tabular-nums">
                        Registered Institutions ({schools.length})
                      </div>
                      {schools.map((s) => {
                        const isSelected = s.id === activeSchoolId;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSchoolChange(s.id)}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/80 text-white border border-emerald-500/50'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <img
                              src={s.crest}
                              alt={s.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs truncate text-white">{s.name}</p>
                              <p className="text-[11px] text-emerald-400 font-mono tabular-nums truncate">
                                {s.code} · {s.levelType}
                              </p>
                            </div>
                          </button>
                        );
                      })}

                      <div className="pt-1.5 border-t border-slate-800 mt-1">
                        {isPlatformAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowSchoolDropdown(false);
                              setShowRegisterSchoolModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Register New School</span>
                          </button>
                        ) : (
                          <p className="px-2 py-1 text-[10px] text-slate-400 flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Only the Platform Owner (via Google Sign-In) can add schools.</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isPlatformAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowRegisterSchoolModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer whitespace-nowrap"
                    title="Platform Owner: Register New School"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add School</span>
                  </button>
                )}
              </div>
            </div>

            {/* Institution Branding Header */}
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 mx-auto rounded-2xl border border-emerald-500/60 p-1 bg-slate-900 overflow-hidden flex items-center justify-center">
                <img
                  src={school.crest}
                  alt={school.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-1">
                  <span>{school.levelType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-emerald-400 tabular-nums">{school.code}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                  {school.name}
                </h1>
                <p className="text-xs text-slate-400 mt-1">"{school.motto}"</p>
              </div>
            </div>

            {/* Main Authentication Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs space-y-5">
              {/* Segmented Role Mode Selector: Staff/Admin vs Student/Graduate */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoginMode('staff')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                    loginMode === 'staff'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span>Staff &amp; Admin Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('student')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                    loginMode === 'student'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>Student &amp; Graduate Login</span>
                </button>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <h2 className="font-bold text-sm text-white">
                  {loginMode === 'student'
                    ? 'Student, Candidate & Graduate Personal Portal'
                    : 'Teacher, Registrar & Administrator Sign-In'}
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {loginMode === 'student'
                    ? 'Sign in with Google or your Student / Candidate ID to view courses, results, fee balances, eligibility, and digital certificates.'
                    : `Sign in with Google to sync ${school.name} programmes, assessments, digital signatures, and certificates across devices.`}
                </p>
              </div>

              {/* Primary Verified Cloud Authentication (Google Sign-In) */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  <span>
                    {isGoogleLoading
                      ? 'Connecting to Google...'
                      : loginMode === 'student'
                      ? 'Continue with Google (Student / Graduate)'
                      : 'Continue with Google (Staff / Administrator)'}
                  </span>
                </button>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span>or sign in with institutional credentials</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    {loginMode === 'student'
                      ? 'Student / Candidate ID or Official Email'
                      : 'Staff / Administrator Official Email'}
                  </label>
                  <div className="relative">
                    {loginMode === 'student' ? (
                      <IdCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    )}
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder={
                        loginMode === 'student'
                          ? `e.g. ${school.code}-2025-0001 or student@school.edu.gh`
                          : 'admin@school.edu.gh'
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Portal Password / PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                >
                  <span>
                    {loginMode === 'student'
                      ? 'Sign In to My Student / Graduate Portal'
                      : `Sign In to ${school.code} Workspace`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick-Select Accounts for Selected Institution */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {loginMode === 'student'
                      ? `Enrolled Student & Graduate Accounts (${school.code})`
                      : `Staff, Teacher & Registrar Accounts (${school.code})`}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">Quick Select</span>
                </div>

                {loginMode === 'staff' ? (
                  staffUsers.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-2">
                      No staff accounts listed for {school.code}. Sign in with Google as Platform Owner to manage administrators.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {staffUsers.slice(0, 4).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleQuickLogin(u.email, 'staff', u.password)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 transition text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-white block text-xs truncate">{u.name}</span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {u.title} · <span className="font-mono text-emerald-400">{u.email}</span>
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-semibold capitalize shrink-0 ml-2">
                            {u.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                ) : learnerQuickAccounts.length === 0 ? (
                  <p className="text-[11px] text-slate-500 py-2">
                    No students registered in this institution yet. Sign in as Staff to enroll students or candidates.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {learnerQuickAccounts.map((acc) => (
                      <button
                        key={acc.key}
                        type="button"
                        onClick={() => handleQuickLogin(acc.identifier, 'student')}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 transition text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white block text-xs truncate">{acc.name}</span>
                            <span className="text-[11px] text-emerald-400 font-mono tabular-nums truncate block">
                              {acc.subtitle}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-300 font-semibold shrink-0 ml-2">
                          {acc.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Tenant Isolation Assurance */}
              <div className="pt-2 border-t border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Multi-Tenant Isolation:</strong> Academic records, signatures, and finances for{' '}
                  <span className="text-emerald-300 font-semibold">{school.name}</span> are strictly partitioned.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Public Portals (No Login Required): Employer Credential Verification + Research Press */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowPublicVerification(true)}
            className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition truncate">
                  Verify Certificate
                </div>
                <p className="text-[11px] text-slate-400 truncate tabular-nums">
                  Employer &amp; QR Lookup ({samplePublicCredentials.length} active)
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0 ml-2 transition" />
          </button>

          <button
            type="button"
            onClick={() => setShowPublicJournals(true)}
            className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-3.5 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <BookOpenCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition flex items-center gap-1 truncate">
                  <span className="truncate">Research &amp; Journals</span>
                  <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 truncate tabular-nums">
                  Open-access press ({allPublicResearchArticles.length} papers)
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0 ml-2 transition" />
          </button>
        </div>

        {/* Direct Visitor WhatsApp Links: Platform Owner (+233 207615941) & Selected School/Institute Owner */}
        <div className={`grid grid-cols-1 ${schoolWhatsApp.enabled ? 'sm:grid-cols-2' : ''} gap-3`}>
          <a
            href={buildWhatsAppUrl(
              PLATFORM_OWNER_WHATSAPP_RAW,
              `Hello Platform Owner, I am visiting EduGhana SIS and would like to inquire about registering a school/institute or platform services.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-[#25D366]/60 rounded-xl p-3.5 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0 group-hover:bg-[#25D366] group-hover:text-slate-950 transition">
                <WhatsAppLogoIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white group-hover:text-[#25D366] transition truncate">
                  WhatsApp Platform Owner
                </div>
                <p className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                  {PLATFORM_OWNER_WHATSAPP_DISPLAY} · Add School / Support
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#25D366] shrink-0 ml-2 transition" />
          </a>

          {schoolWhatsApp.enabled && (
            <a
              href={buildWhatsAppUrl(
                schoolWhatsApp.rawNumber,
                `Hello ${school.name}, I am visiting your EduGhana SIS portal and would like to make an inquiry.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-[#25D366]/60 rounded-xl p-3.5 flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0 group-hover:bg-[#25D366] group-hover:text-slate-950 transition">
                  <WhatsAppLogoIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-[#25D366] transition truncate">
                    WhatsApp {school.code} Owner
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums truncate">
                    {schoolWhatsApp.rawNumber}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#25D366] shrink-0 ml-2 transition" />
            </a>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500">
          EduGhana SIS &amp; Credential Charter · Ghana Data Protection Act 2012 (Act 843) Compliant
        </p>
      </div>

      {isPlatformAdmin && (
        <RegisterSchoolModal
          isOpen={showRegisterSchoolModal}
          onClose={() => setShowRegisterSchoolModal(false)}
        />
      )}
    </div>
  );
};
