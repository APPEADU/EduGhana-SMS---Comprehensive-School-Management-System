import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { isInstituteLevelType } from '../types';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  Wallet,
  DollarSign,
  HeartHandshake,
  Bus,
  BookOpen,
  Send,
  Sparkles,
  Settings,
  Shield,
  UtensilsCrossed,
  ShieldCheck,
  Landmark,
  BookOpenCheck,
  Award,
  BadgeCheck,
  Database,
  Globe,
} from 'lucide-react';

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { school, activeModule, setActiveModule, currentUser, admissions, isModuleEnabled } = useSchool();

  const isInstitute = isInstituteLevelType(school.levelType);
  const pendingAdmissions = admissions.filter((a) => a.status === 'Pending').length;
  const isLearnerOrGraduate =
    currentUser.role === 'student' || currentUser.role === 'graduate' || currentUser.role === 'parent';

  const basicAcademicItems: SidebarMenuItem[] = [
    { id: 'academics', label: 'Curriculum & Timetable', icon: GraduationCap },
    { id: 'attendance', label: 'Student & Staff Attendance', icon: CalendarCheck },
    { id: 'examinations', label: 'Examinations & Report Cards', icon: FileSpreadsheet },
    {
      id: 'research-journal',
      label: 'Research & Journal Press',
      icon: BookOpenCheck,
    },
  ];
  if (isModuleEnabled('cambridge_curriculum')) {
    basicAcademicItems.push({
      id: 'cambridge-curriculum',
      label: 'Cambridge & IGCSE Stream',
      icon: GraduationCap,
    });
  }

  const financeItems: SidebarMenuItem[] = [
    { id: 'finance', label: isInstitute ? 'Tuition & MoMo Billing' : 'Fees & Mobile Money', icon: Wallet },
    { id: 'payroll', label: 'Staff & SSNIT/GRA Payroll', icon: DollarSign },
  ];
  if (!isInstitute && isModuleEnabled('canteen_pos')) {
    financeItems.push({
      id: 'canteen-pos',
      label: 'Canteen & Meal Card POS',
      icon: UtensilsCrossed,
    });
  }

  const basicOperationsItems: SidebarMenuItem[] = [
    { id: 'welfare-transport', label: 'Boarding, Health & Transport', icon: Bus },
    { id: 'library-inventory', label: 'Library & School Assets', icon: BookOpen },
    {
      id: 'ai-analytics',
      label: 'Academic Analytics & Exams',
      icon: Sparkles,
    },
  ];
  if (isModuleEnabled('biometric_gate')) {
    basicOperationsItems.push({
      id: 'biometric-gate',
      label: 'Biometric Turnstiles & Gate',
      icon: ShieldCheck,
    });
  }
  if (isModuleEnabled('alumni_endowment')) {
    basicOperationsItems.push({
      id: 'alumni-endowment',
      label: 'Alumni Endowment Hub',
      icon: Landmark,
    });
  }

  const instituteStaffSections = [
    {
      title: 'Institute Governance',
      items: [
        { id: 'dashboard', label: 'Institute Executive Overview', icon: LayoutDashboard },
        { id: 'school-settings', label: 'Institute Profile & Modules', icon: Settings },
        { id: 'data-export', label: 'Data Export & Backups', icon: Database },
        { id: 'platform-website', label: 'Platform Website & About', icon: Globe },
      ],
    },
    {
      title: 'Levels 1–3, Certificate & Courses',
      items: [
        {
          id: 'professional-credentials',
          label: 'Programmes, Courses & Certs',
          icon: Award,
        },
        {
          id: 'employer-verification',
          label: 'Employer Verification Portal',
          icon: BadgeCheck,
        },
        {
          id: 'research-journal',
          label: 'Research & Journal Press',
          icon: BookOpenCheck,
        },
      ],
    },
    {
      title: 'Candidates & Admissions',
      items: [
        { id: 'students', label: 'Candidate & Learner Registry', icon: Users },
        {
          id: 'admissions',
          label: 'Intake & Applications',
          icon: UserPlus,
          badge: pendingAdmissions > 0 ? `${pendingAdmissions}` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
      ],
    },
    {
      title: 'Tuition, HR & Portals',
      items: [
        ...financeItems,
        { id: 'parent-portal', label: 'Candidate & Graduate Portal', icon: HeartHandshake },
        { id: 'communication', label: 'Institute Bulletins & SMS', icon: Send },
        ...(isModuleEnabled('alumni_endowment')
          ? [{ id: 'alumni-endowment', label: 'Alumni Endowment Hub', icon: Landmark }]
          : []),
      ],
    },
  ];

  const basicSchoolStaffSections = [
    {
      title: 'Overview & Administration',
      items: [
        { id: 'dashboard', label: 'School Executive Dashboard', icon: LayoutDashboard },
        { id: 'school-settings', label: 'School Profile & Modules', icon: Settings },
        { id: 'data-export', label: 'Data Export & Backups', icon: Database },
        { id: 'platform-website', label: 'Platform Website & About', icon: Globe },
      ],
    },
    ...(isModuleEnabled('professional_credentials')
      ? [
          {
            title: 'Certificates & Verification',
            items: [
              {
                id: 'professional-credentials',
                label: 'Programmes, Signatures & Certs',
                icon: Award,
              },
              {
                id: 'employer-verification',
                label: 'Employer Verification Portal',
                icon: BadgeCheck,
              },
            ],
          },
        ]
      : []),
    {
      title: 'Student Life & Admissions',
      items: [
        { id: 'students', label: 'Student Registry & IDs', icon: Users },
        {
          id: 'admissions',
          label: 'Admissions Pipeline',
          icon: UserPlus,
          badge: pendingAdmissions > 0 ? `${pendingAdmissions}` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        },
      ],
    },
    {
      title: 'Academic Management',
      items: basicAcademicItems,
    },
    {
      title: 'Finance & Human Resources',
      items: financeItems,
    },
    {
      title: 'Community Portals',
      items: [
        { id: 'parent-portal', label: 'Student & Parent Portal', icon: HeartHandshake },
        { id: 'communication', label: 'Broadcasts & Notices', icon: Send },
        ...(!isModuleEnabled('professional_credentials')
          ? [{ id: 'employer-verification', label: 'Public Certificate Verification', icon: BadgeCheck }]
          : []),
      ],
    },
    {
      title: 'Welfare, IoT & Operations',
      items: basicOperationsItems,
    },
  ];

  const menuSections = isLearnerOrGraduate
    ? [
        {
          title: isInstitute ? 'Candidate & Graduate Portal' : 'Student & Parent Portal',
          items: [
            {
              id: 'parent-portal',
              label:
                currentUser.role === 'graduate'
                  ? 'My Graduate & Credentials Vault'
                  : isInstitute
                  ? 'My Courses, Flyers & Certificates'
                  : 'My Academic & Report Portal',
              icon: GraduationCap,
            },
            {
              id: 'employer-verification',
              label: 'Public Credential Verification',
              icon: BadgeCheck,
            },
            {
              id: 'research-journal',
              label: 'Research & Journal Press',
              icon: BookOpenCheck,
            },
            {
              id: 'communication',
              label: isInstitute ? 'Institute Notices & Diets' : 'School Notices & Bulletins',
              icon: Send,
            },
            {
              id: 'platform-website',
              label: 'About & Platform Overview',
              icon: Globe,
            },
          ],
        },
      ]
    : isInstitute
    ? instituteStaffSections
    : basicSchoolStaffSections;

  const handleSelect = (id: string) => {
    setActiveModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {menuSections.map((sec) => (
            <div key={sec.title}>
              <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                {sec.title}
              </h3>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                          : 'hover:bg-slate-900 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1 flex-shrink-0 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Role Footer Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5 p-2 bg-slate-900 rounded-xl border border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Active Session</span>
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
