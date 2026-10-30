import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { isInstituteLevelType } from '../types';
import {
  Bell,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Menu,
  X,
  UserCheck,
  Building2,
  ChevronDown,
  LogOut,
  Camera,
  ShieldCheck,
  PlusCircle,
  Lock,
  Share2,
  Check,
} from 'lucide-react';
import { buildPublicShareUrl } from '../utils/shareUrl';
import {
  WhatsAppLogoIcon,
  PLATFORM_OWNER_WHATSAPP_RAW,
  PLATFORM_OWNER_WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  getSchoolWhatsAppContact,
} from '../utils/whatsapp';
import { UpdateAdminPhotoModal } from './modals/UpdateAdminPhotoModal';
import { ImageUploadModal } from './modals/ImageUploadModal';
import { RegisterSchoolModal } from './modals/RegisterSchoolModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const {
    school,
    schools,
    activeSchoolId,
    switchSchool,
    currentUser,
    users,
    setCurrentUser,
    announcements,
    students,
    resetToDemoData,
    exportDatabaseJSON,
    importDatabaseJSON,
    firebaseUser,
    isPlatformAdmin,
    signInWithGoogle,
    logout,
    updateSchoolProfile,
    activeModule,
    setActiveModule,
  } = useSchool();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showSchoolMenu, setShowSchoolMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCrestModal, setShowCrestModal] = useState(false);
  const [showRegisterSchoolModal, setShowRegisterSchoolModal] = useState(false);
  const [ownerAuthPending, setOwnerAuthPending] = useState(false);
  const [ownerAuthError, setOwnerAuthError] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [confirmClearRecords, setConfirmClearRecords] = useState(false);

  const handleCopyPortalLink = () => {
    const publicLink = buildPublicShareUrl();
    navigator.clipboard?.writeText(publicLink);
    setCopiedPortalLink(true);
    setTimeout(() => setCopiedPortalLink(false), 2400);
  };

  const handleOwnerVerifyAndRegister = async () => {
    setOwnerAuthError(null);
    setOwnerAuthPending(true);
    try {
      const res = await signInWithGoogle('staff');
      if (res.success && res.isPlatformAdmin) {
        setShowSchoolMenu(false);
        setShowRegisterSchoolModal(true);
      } else if (res.success && !res.isPlatformAdmin) {
        setOwnerAuthError('Only the verified Platform Owner account can register new schools.');
      } else if (res.message) {
        setOwnerAuthError(res.message);
      }
    } finally {
      setOwnerAuthPending(false);
    }
  };

  const handleExport = () => {
    const json = exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edughana_backup_${school.code}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importDatabaseJSON(importText);
    if (ok) {
      setImportStatus('Database successfully restored from JSON!');
      setTimeout(() => {
        setShowBackupModal(false);
        setImportStatus(null);
        setImportText('');
      }, 1200);
    } else {
      setImportStatus('Invalid JSON format. Please verify the backup file.');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <button
                type="button"
                onClick={() => setShowCrestModal(true)}
                className="w-10 h-10 rounded-full border border-emerald-400 p-0.5 bg-slate-800 overflow-hidden flex-shrink-0 relative cursor-pointer group-hover:ring-2 group-hover:ring-emerald-400 transition"
                title="Click to update School Crest / Logo"
              >
                <img
                  src={school.crest}
                  alt={school.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Camera className="w-4 h-4 text-emerald-300" />
                </div>
              </button>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSchoolMenu(!showSchoolMenu)}
                  className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5 hover:text-emerald-300 transition cursor-pointer text-left"
                  title="Switch Institution or Branch"
                >
                  <span className="truncate max-w-[160px] sm:max-w-[260px]">{school.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                  {school.code}
                </span>
                {isPlatformAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowRegisterSchoolModal(true)}
                    className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition cursor-pointer shadow-sm"
                    title="Platform Owner: Register a New Institute or Basic School"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Add Institute / School</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">{school.currentAcademicYear}</span>
                <span>•</span>
                <span className="font-semibold text-white">{school.currentTerm}</span>
                <span className="hidden md:inline">
                  • {isInstituteLevelType(school.levelType) ? 'Professional & Certificate Institute' : `${students.length} Enrolled`}
                </span>
              </div>

              {/* School Switcher Dropdown — Separated into Institutes vs Basic/Secondary Schools */}
              {showSchoolMenu && (
                <div className="absolute left-0 mt-2 w-80 sm:w-88 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Switch Institute or School
                      </span>
                      <span className="text-[10px] text-emerald-400">Separated Workspaces &amp; Portals</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
                      {schools.length} Total
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto py-1">
                    {/* Group 1: Professional & Certificate Institutes */}
                    {schools.some((s) => isInstituteLevelType(s.levelType)) && (
                      <div className="space-y-1">
                        <div className="px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center justify-between">
                          <span>Professional &amp; Certificate Institutes</span>
                          <span className="font-mono text-slate-500">
                            {schools.filter((s) => isInstituteLevelType(s.levelType)).length}
                          </span>
                        </div>
                        {schools
                          .filter((s) => isInstituteLevelType(s.levelType))
                          .map((s) => {
                            const isSelected = s.id === activeSchoolId;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  switchSchool(s.id);
                                  setShowSchoolMenu(false);
                                }}
                                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-950/80 text-white border border-emerald-500/50'
                                    : 'hover:bg-slate-800 text-slate-300'
                                }`}
                              >
                                <img
                                  src={s.crest}
                                  alt={s.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-700 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs truncate text-white flex items-center justify-between">
                                    <span className="truncate">{s.name}</span>
                                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    <span className="text-emerald-400 font-mono">{s.code}</span> · {s.levelType} · Lvl 1–3 &amp; Cert
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {/* Group 2: Basic & Secondary Schools */}
                    {schools.some((s) => !isInstituteLevelType(s.levelType)) && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                        <div className="px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                          <span>Basic &amp; Secondary Schools</span>
                          <span className="font-mono text-slate-500">
                            {schools.filter((s) => !isInstituteLevelType(s.levelType)).length}
                          </span>
                        </div>
                        {schools
                          .filter((s) => !isInstituteLevelType(s.levelType))
                          .map((s) => {
                            const isSelected = s.id === activeSchoolId;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  switchSchool(s.id);
                                  setShowSchoolMenu(false);
                                }}
                                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-950/80 text-white border border-emerald-500/50'
                                    : 'hover:bg-slate-800 text-slate-300'
                                }`}
                              >
                                <img
                                  src={s.crest}
                                  alt={s.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-700 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs truncate text-white flex items-center justify-between">
                                    <span className="truncate">{s.name}</span>
                                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    <span className="text-emerald-400 font-mono">{s.code}</span> · {s.levelType}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 mt-1 space-y-1.5">
                    {isPlatformAdmin ? (
                      <>
                        <div className="flex items-center justify-between px-2 py-1 text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-700/40 rounded-lg">
                          <span className="flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Platform Owner Verified
                          </span>
                          <span className="text-slate-400 truncate max-w-[115px]">{firebaseUser?.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSchoolMenu(false);
                            setShowRegisterSchoolModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-md"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>+ Register Institute or School</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>School registration is restricted to the Platform Owner.</span>
                        </div>
                        <button
                          type="button"
                          disabled={ownerAuthPending}
                          onClick={handleOwnerVerifyAndRegister}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 rounded-lg font-semibold text-[11px] transition cursor-pointer disabled:opacity-60"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            {ownerAuthPending
                              ? 'Verifying Owner...'
                              : firebaseUser
                              ? 'Switch to Owner Google Account'
                              : 'Platform Owner? Sign in to Add School'}
                          </span>
                        </button>
                        {ownerAuthError && (
                          <p className="text-[10px] text-rose-400 leading-snug">{ownerAuthError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Icons & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct WhatsApp Logo Contact for School Owner / Platform Owner */}
          {(() => {
            const schoolWA = getSchoolWhatsAppContact(school);
            const targetPhone = schoolWA.enabled ? schoolWA.rawNumber : PLATFORM_OWNER_WHATSAPP_RAW;
            const targetLabel = schoolWA.enabled
              ? `WhatsApp ${school.name} (${schoolWA.rawNumber})`
              : `WhatsApp Platform Owner (${PLATFORM_OWNER_WHATSAPP_DISPLAY})`;
            const prefill = schoolWA.enabled
              ? `Hello ${school.name}, I am reaching out from the ${school.code} portal.`
              : `Hello Platform Owner, I am reaching out from EduGhana SIS.`;
            return (
              <a
                href={buildWhatsAppUrl(targetPhone, prefill)}
                target="_blank"
                rel="noopener noreferrer"
                title={targetLabel}
                aria-label={targetLabel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] rounded-lg text-xs font-semibold border border-[#25D366]/40 transition whitespace-nowrap"
              >
                <WhatsAppLogoIcon className="w-4 h-4 shrink-0" />
                <span className="hidden xl:inline">WhatsApp</span>
              </a>
            );
          })()}

          {/* Copy Public Portal Link */}
          <button
            type="button"
            onClick={handleCopyPortalLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-700/60 transition cursor-pointer"
            title="Copy Shareable Portal Link"
          >
            {copiedPortalLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Share Link</span>
              </>
            )}
          </button>

          {/* Data Export (CSV / PDF) & Backup Center Action (Administrators & Staff) */}
          {currentUser.role !== 'student' &&
            currentUser.role !== 'graduate' &&
            currentUser.role !== 'parent' && (
              <button
                type="button"
                onClick={() => setActiveModule('data-export')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer whitespace-nowrap ${
                  activeModule === 'data-export'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Download Academic, Financial & Student Records (CSV / PDF / JSON Backup)"
              >
                <Database
                  className={`w-4 h-4 shrink-0 ${
                    activeModule === 'data-export' ? 'text-white' : 'text-emerald-400'
                  }`}
                />
                <span className="hidden md:inline">Export &amp; Backup</span>
              </button>
            )}

          {/* Announcements / Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="School Announcements"
            >
              <Bell className="w-5 h-5" />
              {announcements.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-slate-900"></span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-white uppercase tracking-wider">School Announcements</span>
                  <span className="text-emerald-400 font-mono text-[11px]">{announcements.length} active</span>
                </div>
                <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto mt-2 space-y-2">
                  {announcements.map((anc) => (
                    <div key={anc.id} className="pt-2">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="text-amber-400 font-semibold">{anc.channel}</span>
                        <span>{anc.sentDate}</span>
                      </div>
                      <h4 className="font-semibold text-white mt-0.5">{anc.title}</h4>
                      <p className="text-slate-300 mt-1 line-clamp-2">{anc.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multi-Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-400 bg-slate-700 flex-shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1] || ''}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-[10px] text-emerald-400 font-medium capitalize">
                  {currentUser.role}
                </div>
              </div>
            </button>

            {/* Role Switcher Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active User & Role
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Experience {school.name} through different stakeholder viewpoints.
                  </p>
                </div>

                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/80 text-white border border-emerald-600/40'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate text-xs text-white flex items-center justify-between">
                            <span>{u.name}</span>
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate capitalize">
                            {u.title} ({u.role})
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 mt-1 space-y-1.5">
                  {!firebaseUser && (
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        signInWithGoogle(
                          currentUser.role === 'student' || currentUser.role === 'graduate' ? 'student' : 'staff'
                        );
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 bg-white hover:bg-slate-100 text-slate-900 rounded-lg font-bold text-xs transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sign in with Google (Cloud Sync)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      setShowPhotoModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Update Picture & Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Out icon button */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer hidden sm:block"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Database Backup & Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Institution Database Backup & Restore</h3>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <p className="text-slate-400">
                Institutional records sync automatically with Cloud Firestore when signed in with Google, and can also be exported or restored locally as JSON backups.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Export JSON Backup
                </button>
                {confirmClearRecords ? (
                  <div className="flex items-center justify-center gap-1.5 p-2 bg-rose-950/60 border border-rose-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        resetToDemoData();
                        setConfirmClearRecords(false);
                        setImportStatus('Operational records cleared for this institution.');
                        setTimeout(() => {
                          setShowBackupModal(false);
                          setImportStatus(null);
                        }, 1000);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
                    >
                      Confirm Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearRecords(false)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearRecords(true)}
                    className="flex items-center justify-center gap-2 p-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                    <span>Clear Workspace Records</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block font-semibold text-slate-300 mb-1">
                  Import / Restore from Backup JSON:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported JSON payload here..."
                  className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleImport}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition cursor-pointer border border-slate-700"
                >
                  <Upload className="w-4 h-4" />
                  Restore Database
                </button>
                {importStatus && (
                  <p className="mt-2 text-center text-xs font-semibold text-emerald-400">
                    {importStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Admin Picture & Profile Modal */}
      <UpdateAdminPhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
      />

      {/* Update School Crest Modal */}
      <ImageUploadModal
        isOpen={showCrestModal}
        onClose={() => setShowCrestModal(false)}
        targetType="school_crest"
        currentImage={school.crest}
        title="Update School Crest / Institutional Logo"
        subtitle="Upload an official emblem file or choose from curated Ghanaian school heraldry"
        entityName={school.name}
        entityRoleOrCode={school.code}
        onSave={(newCrest) => {
          updateSchoolProfile({ crest: newCrest });
          setShowCrestModal(false);
        }}
      />

      {/* Register New School Modal (Platform Super Admin Only) */}
      {isPlatformAdmin && (
        <RegisterSchoolModal
          isOpen={showRegisterSchoolModal}
          onClose={() => setShowRegisterSchoolModal(false)}
        />
      )}
    </header>
  );
};
