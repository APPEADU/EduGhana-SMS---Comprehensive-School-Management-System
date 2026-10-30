import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SchoolProfile,
  UserAccount,
  Student,
  AdmissionApplication,
  ClassRoom,
  Subject,
  AttendanceRecord,
  StaffAttendanceRecord,
  ExamResult,
  FeeItem,
  FeePayment,
  SchoolTransaction,
  StaffMember,
  TimetablePeriod,
  LibraryBook,
  BookLoan,
  SchoolAsset,
  TransportRoute,
  BoardingHouse,
  HealthIncident,
  SchoolAnnouncement,
  RoleType,
  CustomFeatureRequest,
  ResearchArticle,
  AuthorizedSignatory,
  ProfessionalProgramme,
  ProgrammeCourse,
  CandidateProfile,
  CandidateCourseAssessment,
  CertificateTemplateConfig,
  IssuedCredential,
  CertificateValidityStatus,
  GraduateAlumniRecord,
  CertificateReplacementRequest,
  InstitutionalAccreditation,
  EmployerVerificationLog,
  BiometricGateLog,
  isInstituteLevelType,
  INSTITUTE_CERTIFICATE_LEVEL,
  formatInstituteLevelShort,
} from '../types';
import {
  getDefaultModulesForSchool,
  getDefaultModulesForLevelType,
  INITIAL_CUSTOM_REQUESTS,
} from '../data/featureCatalog';
import { INITIAL_SUBJECTS } from '../data/seedData';
import {
  SchoolTenantData,
  EMPTY_WORKSPACE_SCHOOL,
  getInitialTenantData,
} from '../data/multiSchoolSeeds';
import {
  getDefaultSignatoriesForSchool,
  makeCalligraphicSignatureSvg,
} from '../data/professionalSeeds';
import { getInitialResearchArticles } from '../data/researchSeeds';
import { calculateWassceGrade } from '../utils/academicCalculations';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  isBenignAbortError,
  isTransientOfflineOrTokenError,
  FirebaseUser,
} from '../lib/firebase';
import {
  REMOVED_SAMPLE_SCHOOL_IDS,
  isRemovedSampleSchoolId,
  isBootstrappedAdminUser,
  syncAuthenticatedUserProfile,
  upsertSchoolInCloud,
  deleteSchoolInCloud,
  upsertSchoolMemberInCloud,
  deleteSchoolMemberAndProfileInCloud,
  upsertSignatoryInCloud,
  deleteSignatoryInCloud,
  upsertProgrammeInCloud,
  deleteProgrammeInCloud,
  upsertCourseInCloud,
  deleteCourseInCloud,
  upsertStudentInCloud,
  deleteStudentInCloud,
  upsertCandidateInCloud,
  upsertAssessmentInCloud,
  upsertExamResultInCloud,
  createFeePaymentInCloud,
  issueOrUpdateCredentialAtomicInCloud,
  upsertGraduateInCloud,
  createReplacementRequestInCloud,
  updateReplacementRequestInCloud,
  createVerificationLogInCloud,
  upsertResearchArticleInCloud,
  incrementArticleMetricInCloud,
  deleteResearchArticleInCloud,
  fetchPublicCloudRegistry,
  lookupPublicCredentialInCloud,
  purgeSampleInstitutionsFromCloud,
  subscribeToCloudWorkspace,
} from '../lib/firestoreSync';

const TENANT_STORAGE_PREFIX = 'edughana_tenant_';
const SCHOOLS_STORAGE_KEY = 'edughana_schools_v3';
const ACTIVE_SCHOOL_KEY = 'edughana_active_school_id_v3';
const LEGACY_STORAGE_KEY = 'kingdom_royal_institute_sis_v2';
const EMPTY_SCHOOL_ID = 'sch-uninitialized';

const EMPTY_FALLBACK_USER: UserAccount = {
  id: 'usr-unassigned',
  name: 'Platform Administrator',
  email: 'owner@edughana.sis',
  role: 'proprietor',
  title: 'Platform Owner',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  schoolId: EMPTY_SCHOOL_ID,
};

export interface CandidateProgressionEvaluation {
  candidateId: string;
  currentLevel: number;
  maxProgrammeLevel: number;
  mandatoryCoursesCount: number;
  passedOrExemptCount: number;
  resitRequiredCourses: string[];
  deferredOrPendingCourses: string[];
  feeBalance: number;
  feeClearedForProgression: boolean;
  feeClearedForGraduation: boolean;
  identityVerified: boolean;
  eligibleForNextLevel: boolean;
  eligibleForGraduation: boolean;
  statusSummary: string;
}

// Strict privacy-preserving public verification payload (never exposes marks, finances, or private contacts)
export interface PublicCredentialVerificationResult {
  found: boolean;
  queriedReference: string;
  verifiedAt: string;
  status?: CertificateValidityStatus;
  certificateNumber?: string;
  verificationCode?: string;
  recipientFullName?: string;
  candidateNumber?: string;
  issuingInstitutionName?: string;
  issuingInstitutionCode?: string;
  issuingInstitutionCrest?: string;
  awardingAuthorityName?: string;
  professionalBodyAffiliationNote?: string;
  credentialType?: string;
  programmeTitle?: string;
  qualificationAwarded?: string;
  levelCompletedLabel?: string;
  honoursOrDistinction?: string;
  issueDate?: string;
  expiryDate?: string;
  replacedByCertificateNumber?: string;
  revocationOrStatusReason?: string;
}

interface SchoolContextType {
  // Multi-Tenancy & School Partitioning
  schools: SchoolProfile[];
  activeSchoolId: string;
  school: SchoolProfile;
  switchSchool: (schoolId: string) => void;
  registerSchool: (
    schoolData: Omit<SchoolProfile, 'id'>,
    adminCredentials: { name: string; email: string; password?: string; title?: string; role?: RoleType }
  ) => { school: SchoolProfile; admin: UserAccount };
  deleteSchool: (schoolId: string) => boolean;

  // Active School Data (Strictly Isolated to Active School)
  currentUser: UserAccount;
  users: UserAccount[];
  students: Student[];
  classes: ClassRoom[];
  subjects: Subject[];
  admissions: AdmissionApplication[];
  examResults: ExamResult[];
  feeItems: FeeItem[];
  feePayments: FeePayment[];
  transactions: SchoolTransaction[];
  staff: StaffMember[];
  staffAttendance: StaffAttendanceRecord[];
  timetable: TimetablePeriod[];
  attendance: AttendanceRecord[];
  libraryBooks: LibraryBook[];
  bookLoans: BookLoan[];
  assets: SchoolAsset[];
  routes: TransportRoute[];
  boardingHouses: BoardingHouse[];
  healthRecords: HealthIncident[];
  announcements: SchoolAnnouncement[];
  researchArticles: ResearchArticle[];
  allPublicResearchArticles: ResearchArticle[];

  // Signatures, Professional Programmes, Credentials, Alumni & Verification
  signatories: AuthorizedSignatory[];
  programmes: ProfessionalProgramme[];
  programmeCourses: ProgrammeCourse[];
  candidates: CandidateProfile[];
  candidateAssessments: CandidateCourseAssessment[];
  certificateTemplates: CertificateTemplateConfig[];
  issuedCredentials: IssuedCredential[];
  graduateRecords: GraduateAlumniRecord[];
  replacementRequests: CertificateReplacementRequest[];
  accreditations: InstitutionalAccreditation[];
  verificationLogs: EmployerVerificationLog[];
  biometricGateLogs: BiometricGateLog[];
  recordBiometricGateEvent: (
    event: Omit<BiometricGateLog, 'id' | 'schoolId' | 'date' | 'timestamp'> & {
      date?: string;
      timestamp?: string;
    }
  ) => BiometricGateLog;
  allPublicDirectoryGraduates: (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[];
  samplePublicCredentials: { label: string; certificateNumber: string; verificationCode: string; status: CertificateValidityStatus; institutionCode: string }[];

  // Signature & Signatory Actions
  saveUserSignature: (
    userId: string,
    signatureDataUrl: string,
    method: 'drawn' | 'uploaded',
    signatoryRole?: AuthorizedSignatory['role'],
    customTitle?: string
  ) => void;
  upsertSignatory: (sig: Omit<AuthorizedSignatory, 'id' | 'updatedAt'> & { id?: string }) => AuthorizedSignatory;
  removeSignatory: (id: string) => void;

  // Programme, Course, Candidate & Progression Actions
  addProgramme: (prog: Omit<ProfessionalProgramme, 'id' | 'schoolId'>) => ProfessionalProgramme;
  updateProgramme: (id: string, data: Partial<ProfessionalProgramme>) => void;
  deleteProgramme: (id: string) => void;
  addProgrammeCourse: (course: Omit<ProgrammeCourse, 'id' | 'schoolId'>) => ProgrammeCourse;
  updateProgrammeCourse: (id: string, data: Partial<ProgrammeCourse>) => void;
  deleteProgrammeCourse: (id: string) => void;
  registerCandidate: (data: Omit<CandidateProfile, 'id' | 'schoolId' | 'candidateNumber' | 'enrollmentDate'> & { candidateNumber?: string }) => CandidateProfile;
  updateCandidate: (id: string, data: Partial<CandidateProfile>) => void;
  saveCandidateAssessment: (assessment: Omit<CandidateCourseAssessment, 'id'> & { id?: string }) => void;
  evaluateCandidateProgression: (candidateId: string) => CandidateProgressionEvaluation | null;
  promoteCandidateToNextLevel: (candidateId: string) => boolean;

  // Certificate Template, Issuance, Audit, Alumni & Verification Actions
  saveCertificateTemplate: (tpl: Omit<CertificateTemplateConfig, 'id' | 'schoolId'> & { id?: string }) => CertificateTemplateConfig;
  issueDigitalCredential: (
    payload: Omit<
      IssuedCredential,
      | 'id'
      | 'schoolId'
      | 'schoolName'
      | 'schoolCode'
      | 'schoolCrest'
      | 'certificateNumber'
      | 'verificationCode'
      | 'auditTrail'
    > & { certificateNumber?: string; approvalNote?: string }
  ) => { success: boolean; credential?: IssuedCredential; error?: string };
  updateCredentialStatus: (
    credentialId: string,
    newStatus: CertificateValidityStatus,
    reason: string,
    replacedByCertificateNumber?: string
  ) => void;
  submitReplacementRequest: (
    req: Omit<CertificateReplacementRequest, 'id' | 'schoolId' | 'requestedDate' | 'status'>
  ) => CertificateReplacementRequest;
  processReplacementRequest: (requestId: string, approve: boolean, adminNote: string) => IssuedCredential | null;
  updateGraduateProfile: (graduateId: string, data: Partial<Pick<GraduateAlumniRecord, 'email' | 'phone' | 'directoryConsent' | 'currentEmployerOrRole'>>) => void;
  addAccreditation: (acc: Omit<InstitutionalAccreditation, 'id' | 'schoolId'>) => InstitutionalAccreditation;
  updateAccreditation: (id: string, data: Partial<InstitutionalAccreditation>) => void;
  verifyCredentialPublic: (
    query: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ) => PublicCredentialVerificationResult;
  verifyCredentialPublicAsync: (
    query: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ) => Promise<PublicCredentialVerificationResult>;
  verifyCredentialsBatch: (
    queries: string[],
    verifierMeta: { organization: string; contactName: string; purpose: string }
  ) => PublicCredentialVerificationResult[];

  // App & Navigation State
  activeModule: string;
  setActiveModule: (module: string) => void;
  setCurrentUser: (user: UserAccount) => void;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;
  addStudent: (data: any) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  addAdmission: (data: any) => void;
  updateAdmissionStatus: (id: string, status: AdmissionApplication['status']) => void;
  recordAttendance: (classId: string, date: string, studentStatuses: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>) => void;
  saveExamResult: (result: Partial<ExamResult> & { studentId: string; subjectId: string; classId: string; classScore: number; examScore: number }) => void;
  publishResults: (classId: string) => void;
  recordFeePayment: (payment: Omit<FeePayment, 'id' | 'receiptNumber' | 'date'>) => FeePayment;
  recordTransaction: (txn: Omit<SchoolTransaction, 'id' | 'date'>) => void;
  addStaff: (data: Omit<StaffMember, 'id' | 'staffId'>) => void;
  updateStaff: (id: string, data: Partial<StaffMember>) => void;
  issueBookLoan: (bookId: string, studentId: string, dueDate: string) => void;
  returnBookLoan: (loanId: string) => void;
  addAsset: (asset: Omit<SchoolAsset, 'id'>) => void;
  addHealthRecord: (record: Omit<HealthIncident, 'id'>) => void;
  sendAnnouncement: (announcement: Omit<SchoolAnnouncement, 'id' | 'sentDate'>) => void;

  // Research & Academic Journal Press (Contribution to Knowledge)
  publishResearchArticle: (articleData: Omit<ResearchArticle, 'id' | 'publicationDate' | 'viewsCount' | 'downloadsCount' | 'citationsCount' | 'doi'>) => ResearchArticle;
  updateResearchArticle: (id: string, data: Partial<ResearchArticle>) => void;
  deleteResearchArticle: (id: string) => void;
  recordArticleView: (id: string) => void;
  recordArticleDownload: (id: string) => void;
  recordArticleCitation: (id: string) => void;

  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  isCloudSynced: boolean;
  isPlatformAdmin: boolean;
  signInWithGoogle: (
    preferredMode?: 'staff' | 'student'
  ) => Promise<{ success: boolean; isPlatformAdmin?: boolean; message?: string }>;
  loginWithEmail: (identifier: string, password?: string, targetSchoolId?: string, loginMode?: 'staff' | 'student') => { success: boolean; message?: string };
  logout: () => void;
  updateUser: (userId: string, data: Partial<UserAccount>) => void;
  updateCurrentUserAvatar: (newAvatar: string) => void;
  addUserAccount: (user: Omit<UserAccount, 'id'>) => UserAccount;
  deleteUserAccount: (userId: string) => void;
  deleteStudent: (id: string) => void;
  deleteStaff: (id: string) => void;
  deleteAdmission: (id: string) => void;
  deleteAnnouncement: (id: string) => void;
  deleteAsset: (id: string) => void;
  deleteBook: (id: string) => void;
  resetToDemoData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;

  // Modular Features & Bespoke Add-ons (Per-School Isolation)
  isModuleEnabled: (moduleId: string) => boolean;
  toggleSchoolModule: (moduleId: string) => void;
  customFeatureRequests: CustomFeatureRequest[];
  requestCustomFeature: (req: { title: string; category: string; description: string; urgency?: 'Standard' | 'Priority' | 'Critical Bespoke' }) => void;
}

const SchoolContext = createContext<SchoolContextType | null>(null);

const generateVerificationCode = (prefix: string): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  const clean = prefix.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase() || 'VRF';
  return `VRF-${clean}${part1.slice(0, 2)}-${part2}`;
};

function mergeById<T extends { id: string }>(localItems: T[], cloudItems: T[]): T[] {
  if (!cloudItems || cloudItems.length === 0) return localItems;
  const cloudMap = new Map<string, T>();
  for (const item of cloudItems) {
    cloudMap.set(item.id, item);
  }
  const merged = localItems.map((loc) => (cloudMap.has(loc.id) ? { ...loc, ...cloudMap.get(loc.id)! } : loc));
  const existingIds = new Set(localItems.map((loc) => loc.id));
  const brandNew = cloudItems.filter((c) => !existingIds.has(c.id));
  return [...brandNew, ...merged];
}

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize registered schools directory (purging all legacy sample schools)
  const loadSchoolsList = (): SchoolProfile[] => {
    try {
      // Permanently purge legacy sample school caches from localStorage
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      for (const sampleId of REMOVED_SAMPLE_SCHOOL_IDS) {
        localStorage.removeItem(TENANT_STORAGE_PREFIX + sampleId);
      }

      const stored = localStorage.getItem(SCHOOLS_STORAGE_KEY);
      if (stored) {
        const parsed: SchoolProfile[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned: SchoolProfile[] = parsed
            .filter(
              (s) =>
                Boolean(s && s.id && s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id))
            )
            .map((s): SchoolProfile => ({
              ...s,
              whatsappNumber: s.whatsappNumber ?? s.phone ?? '',
              whatsappEnabled: s.whatsappEnabled ?? true,
            }));

          localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Error loading schools list', e);
    }
    return [];
  };

  const [schools, setSchools] = useState<SchoolProfile[]>(loadSchoolsList);

  const loadInitialSchoolId = (availableSchools: SchoolProfile[]): string => {
    if (availableSchools.length === 0) {
      try {
        localStorage.removeItem(ACTIVE_SCHOOL_KEY);
      } catch {
        // Ignore storage errors
      }
      return EMPTY_SCHOOL_ID;
    }
    try {
      const stored = localStorage.getItem(ACTIVE_SCHOOL_KEY);
      if (
        stored &&
        !isRemovedSampleSchoolId(stored) &&
        availableSchools.some((s) => s.id === stored)
      ) {
        return stored;
      }
    } catch (e) {
      console.error('Error loading active school id', e);
    }
    return availableSchools[0].id;
  };

  const [activeSchoolId, setActiveSchoolId] = useState<string>(() => loadInitialSchoolId(schools));

  const hydrateProfessionalFields = (schoolId: string, data: SchoolTenantData): SchoolTenantData => {
    if (!schoolId || schoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(schoolId)) {
      return getInitialTenantData(EMPTY_SCHOOL_ID);
    }

    const signatories = Array.isArray(data.school?.signatories)
      ? data.school.signatories
      : getDefaultSignatoriesForSchool(data.school);

    return {
      ...data,
      school: {
        ...data.school,
        whatsappNumber: data.school.whatsappNumber ?? data.school.phone ?? '',
        whatsappEnabled: data.school.whatsappEnabled ?? true,
        signatories,
        headmasterSignatureDataUrl:
          data.school.headmasterSignatureDataUrl ||
          signatories[0]?.signatureDataUrl ||
          makeCalligraphicSignatureSvg(data.school.headmasterSignature || data.school.headmasterName),
      },
      classes: Array.isArray(data.classes) ? data.classes : [],
      users: Array.isArray(data.users) ? data.users : [],
      students: Array.isArray(data.students) ? data.students : [],
      subjects: Array.isArray(data.subjects) && data.subjects.length > 0 ? data.subjects : INITIAL_SUBJECTS,
      admissions: Array.isArray(data.admissions) ? data.admissions : [],
      examResults: Array.isArray(data.examResults) ? data.examResults : [],
      feeItems: Array.isArray(data.feeItems) ? data.feeItems : [],
      feePayments: Array.isArray(data.feePayments) ? data.feePayments : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      staff: Array.isArray(data.staff) ? data.staff : [],
      staffAttendance: Array.isArray(data.staffAttendance) ? data.staffAttendance : [],
      timetable: Array.isArray(data.timetable) ? data.timetable : [],
      attendance: Array.isArray(data.attendance) ? data.attendance : [],
      libraryBooks: Array.isArray(data.libraryBooks) ? data.libraryBooks : [],
      bookLoans: Array.isArray(data.bookLoans) ? data.bookLoans : [],
      assets: Array.isArray(data.assets) ? data.assets : [],
      routes: Array.isArray(data.routes) ? data.routes : [],
      boardingHouses: Array.isArray(data.boardingHouses) ? data.boardingHouses : [],
      healthRecords: Array.isArray(data.healthRecords) ? data.healthRecords : [],
      announcements: Array.isArray(data.announcements) ? data.announcements : [],
      researchArticles: Array.isArray(data.researchArticles) ? data.researchArticles : [],
      programmes: Array.isArray(data.programmes) ? data.programmes : [],
      programmeCourses: Array.isArray(data.programmeCourses) ? data.programmeCourses : [],
      candidates: Array.isArray(data.candidates) ? data.candidates : [],
      candidateAssessments: Array.isArray(data.candidateAssessments) ? data.candidateAssessments : [],
      certificateTemplates: Array.isArray(data.certificateTemplates) ? data.certificateTemplates : [],
      issuedCredentials: Array.isArray(data.issuedCredentials) ? data.issuedCredentials : [],
      graduateRecords: Array.isArray(data.graduateRecords) ? data.graduateRecords : [],
      replacementRequests: Array.isArray(data.replacementRequests) ? data.replacementRequests : [],
      accreditations: Array.isArray(data.accreditations) ? data.accreditations : [],
      verificationLogs: Array.isArray(data.verificationLogs) ? data.verificationLogs : [],
      biometricGateLogs: Array.isArray(data.biometricGateLogs) ? data.biometricGateLogs : [],
    };
  };

  // 3. Load tenant data for active school
  const loadTenantData = (schoolId: string): SchoolTenantData => {
    if (!schoolId || schoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(schoolId)) {
      return getInitialTenantData(EMPTY_SCHOOL_ID);
    }

    try {
      const storedStr = localStorage.getItem(TENANT_STORAGE_PREFIX + schoolId);
      if (storedStr) {
        const stored: SchoolTenantData = JSON.parse(storedStr);
        if (stored && stored.school && stored.school.id === schoolId) {
          return hydrateProfessionalFields(schoolId, stored);
        }
        localStorage.removeItem(TENANT_STORAGE_PREFIX + schoolId);
      }
    } catch (e) {
      console.error('Error reading tenant data', e);
    }

    const matchingSchool = schools.find((s) => s.id === schoolId);
    const emptyBase = getInitialTenantData(schoolId);
    if (matchingSchool) {
      emptyBase.school = matchingSchool;
    }
    return hydrateProfessionalFields(schoolId, emptyBase);
  };

  const initialTenant = loadTenantData(activeSchoolId);

  // Tenant-scoped state
  const [school, setSchool] = useState<SchoolProfile>(initialTenant.school);
  const [users, setUsers] = useState<UserAccount[]>(initialTenant.users);
  const [currentUser, setCurrentUser] = useState<UserAccount>(initialTenant.users[0] || EMPTY_FALLBACK_USER);
  const [students, setStudents] = useState<Student[]>(initialTenant.students);
  const [classes, setClasses] = useState<ClassRoom[]>(initialTenant.classes);
  const [subjects, setSubjects] = useState<Subject[]>(initialTenant.subjects);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(initialTenant.admissions);
  const [examResults, setExamResults] = useState<ExamResult[]>(initialTenant.examResults);
  const [feeItems, setFeeItems] = useState<FeeItem[]>(initialTenant.feeItems);
  const [feePayments, setFeePayments] = useState<FeePayment[]>(initialTenant.feePayments);
  const [transactions, setTransactions] = useState<SchoolTransaction[]>(initialTenant.transactions);
  const [staff, setStaff] = useState<StaffMember[]>(initialTenant.staff);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceRecord[]>(initialTenant.staffAttendance);
  const [timetable, setTimetable] = useState<TimetablePeriod[]>(initialTenant.timetable);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialTenant.attendance);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(initialTenant.libraryBooks);
  const [bookLoans, setBookLoans] = useState<BookLoan[]>(initialTenant.bookLoans);
  const [assets, setAssets] = useState<SchoolAsset[]>(initialTenant.assets);
  const [routes, setRoutes] = useState<TransportRoute[]>(initialTenant.routes);
  const [boardingHouses, setBoardingHouses] = useState<BoardingHouse[]>(initialTenant.boardingHouses);
  const [healthRecords, setHealthRecords] = useState<HealthIncident[]>(initialTenant.healthRecords);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>(initialTenant.announcements);
  const [researchArticles, setResearchArticles] = useState<ResearchArticle[]>(
    initialTenant.researchArticles || getInitialResearchArticles(activeSchoolId)
  );

  // Professional & Credential Module State
  const [programmes, setProgrammes] = useState<ProfessionalProgramme[]>(initialTenant.programmes || []);
  const [programmeCourses, setProgrammeCourses] = useState<ProgrammeCourse[]>(initialTenant.programmeCourses || []);
  const [candidates, setCandidates] = useState<CandidateProfile[]>(initialTenant.candidates || []);
  const [candidateAssessments, setCandidateAssessments] = useState<CandidateCourseAssessment[]>(initialTenant.candidateAssessments || []);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplateConfig[]>(initialTenant.certificateTemplates || []);
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>(initialTenant.issuedCredentials || []);
  const [graduateRecords, setGraduateRecords] = useState<GraduateAlumniRecord[]>(initialTenant.graduateRecords || []);
  const [replacementRequests, setReplacementRequests] = useState<CertificateReplacementRequest[]>(initialTenant.replacementRequests || []);
  const [accreditations, setAccreditations] = useState<InstitutionalAccreditation[]>(initialTenant.accreditations || []);
  const [verificationLogs, setVerificationLogs] = useState<EmployerVerificationLog[]>(initialTenant.verificationLogs || []);
  const [biometricGateLogs, setBiometricGateLogs] = useState<BiometricGateLog[]>(
    initialTenant.biometricGateLogs || []
  );

  // Start unauthenticated when no schools exist yet or when ?verify= query param is present
  const hasVerifyQueryOnBoot = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('verify');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => schools.length > 0 && initialTenant.users.length > 0 && !hasVerifyQueryOnBoot
  );
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [cloudPublicCreds, setCloudPublicCreds] = useState<Record<string, any>[]>([]);
  const [cloudPublicGraduates, setCloudPublicGraduates] = useState<
    (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[]
  >([]);
  const [cloudPublicArticles, setCloudPublicArticles] = useState<ResearchArticle[]>([]);
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [publicNetworkRevision, setPublicNetworkRevision] = useState(0);

  const getEffectiveSchoolOwnerUid = (targetSchoolId = activeSchoolId): string | undefined => {
    if (school.id === targetSchoolId && school.ownerUid) return school.ownerUid;
    return schools.find((s) => s.id === targetSchoolId)?.ownerUid;
  };

  const canWriteSchoolAdminInCloud = (targetSchoolId = activeSchoolId): boolean => {
    if (!targetSchoolId || targetSchoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(targetSchoolId)) {
      return false;
    }
    const fb = auth.currentUser;
    if (!fb || !fb.emailVerified) return false;
    if (isBootstrappedAdminUser(fb)) return true;
    const ownerUid = getEffectiveSchoolOwnerUid(targetSchoolId);
    return Boolean(ownerUid && ownerUid === fb.uid);
  };

  const isCloudSynced = Boolean(firebaseUser && firebaseUser.emailVerified);
  const isPlatformAdmin = Boolean(firebaseUser && firebaseUser.emailVerified && isBootstrappedAdminUser(firebaseUser));

  const runCloudTask = (promise: Promise<unknown>) => {
    promise.catch((err) => {
      if (isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
      console.error('Cloud Firestore operation rejected:', err);
    });
  };

  // Boot fetch of public cloud registries (institutions, public QR verification credentials, graduates, journals)
  useEffect(() => {
    let cancelled = false;
    fetchPublicCloudRegistry()
      .then((registry) => {
        if (cancelled) return;
        const validCloudSchools = registry.schools.filter((s) => !isRemovedSampleSchoolId(s.id));
        if (validCloudSchools.length > 0) {
          setSchools((prev) => {
            const merged = mergeById(
              prev.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
              validCloudSchools
            );
            return merged;
          });
          setActiveSchoolId((prevId) => {
            if (!prevId || prevId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(prevId)) {
              const firstCloud = validCloudSchools[0];
              setSchool((prevSch) => ({
                ...prevSch,
                ...firstCloud,
                signatories: firstCloud.signatories || getDefaultSignatoriesForSchool(firstCloud),
              }));
              return firstCloud.id;
            }
            const activeCloud = validCloudSchools.find((s) => s.id === prevId);
            if (activeCloud) {
              setSchool((prevSch) => ({ ...prevSch, ...activeCloud, signatories: prevSch.signatories }));
            }
            return prevId;
          });
        }
        setCloudPublicCreds(registry.publicCreds);
        setCloudPublicGraduates(registry.publicGraduates);
        setCloudPublicArticles(registry.publicArticles);
        setPublicNetworkRevision((r) => r + 1);
      })
      .catch((err) => {
        if (cancelled || isBenignAbortError(err) || isTransientOfflineOrTokenError(err)) return;
        console.error('Initial public cloud registry sync error:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Firebase Auth listener & sample school cloud purge
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          await fbUser.getIdToken();
        } catch (tokenErr) {
          if (isTransientOfflineOrTokenError(tokenErr)) {
            setFirebaseUser(null);
            setAuthReady(true);
            return;
          }
        }
      }

      setFirebaseUser(fbUser);
      setAuthReady(true);

      if (fbUser && fbUser.emailVerified && fbUser.email) {
        runCloudTask(syncAuthenticatedUserProfile(fbUser, activeSchoolId));
        if (isBootstrappedAdminUser(fbUser)) {
          runCloudTask(
            purgeSampleInstitutionsFromCloud(fbUser).then(() =>
              fetchPublicCloudRegistry().then((reg) => {
                const validSchools = reg.schools.filter((s) => !isRemovedSampleSchoolId(s.id));
                setSchools((prev) =>
                  mergeById(
                    prev.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
                    validSchools
                  )
                );
                setCloudPublicCreds(reg.publicCreds);
                setCloudPublicGraduates(reg.publicGraduates);
                setCloudPublicArticles(reg.publicArticles);
                setPublicNetworkRevision((r) => r + 1);
              })
            )
          );
        }
      }
    });
    return () => unsubAuth();
  }, []);

  const effectiveActiveOwnerUid = getEffectiveSchoolOwnerUid(activeSchoolId);
  const hasAdminListenerScope = Boolean(
    isPlatformAdmin || (firebaseUser?.uid && effectiveActiveOwnerUid && effectiveActiveOwnerUid === firebaseUser.uid)
  );

  // Real-time Firestore workspace listeners (only active when authReady && verified user)
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) {
      return;
    }

    const unsubWorkspace = subscribeToCloudWorkspace({
      fbUser: firebaseUser,
      activeSchoolId,
      schoolOwnerUid: effectiveActiveOwnerUid,
      onPublicSchools: (cloudSchools) => {
        const validCloudSchools = cloudSchools.filter((s) => !isRemovedSampleSchoolId(s.id));
        if (validCloudSchools.length > 0) {
          setSchools((prev) =>
            mergeById(
              prev.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
              validCloudSchools
            )
          );
          const activeCloud = validCloudSchools.find((s) => s.id === activeSchoolId);
          if (activeCloud) {
            setSchool((prev) => ({ ...prev, ...activeCloud, signatories: prev.signatories }));
          }
        }
      },
      onPublicCredentials: (creds) => {
        setCloudPublicCreds(creds);
        setPublicNetworkRevision((r) => r + 1);
      },
      onPublicGraduates: (grads) => {
        setCloudPublicGraduates(grads);
        setPublicNetworkRevision((r) => r + 1);
      },
      onPublicArticles: (articles) => {
        setCloudPublicArticles(articles);
        const forActive = articles.filter((a) => a.schoolId === activeSchoolId);
        if (forActive.length > 0) {
          setResearchArticles((prev) => mergeById(prev, forActive));
        }
        setPublicNetworkRevision((r) => r + 1);
      },
      onSchoolSignatories: (sigs) => {
        setSchool((prev) => ({ ...prev, signatories: mergeById(prev.signatories || [], sigs) }));
      },
      onSchoolProgrammes: (progs) => {
        setProgrammes((prev) => mergeById(prev, progs));
      },
      onSchoolCourses: (courses) => {
        setProgrammeCourses((prev) => mergeById(prev, courses));
      },
      onSchoolStudents: (cloudStudents) => {
        setStudents((prev) => mergeById(prev, cloudStudents));
      },
      onSchoolCandidates: (cloudCandidates) => {
        setCandidates((prev) => mergeById(prev, cloudCandidates));
      },
      onSchoolAssessments: (cloudAssessments) => {
        setCandidateAssessments((prev) => mergeById(prev, cloudAssessments));
      },
      onSchoolExamResults: (cloudResults) => {
        setExamResults((prev) => mergeById(prev, cloudResults));
      },
      onSchoolFeePayments: (cloudPayments) => {
        setFeePayments((prev) => mergeById(prev, cloudPayments));
      },
      onSchoolCredentials: (cloudCreds) => {
        setIssuedCredentials((prev) => mergeById(prev, cloudCreds));
      },
      onSchoolGraduates: (cloudGrads) => {
        setGraduateRecords((prev) => mergeById(prev, cloudGrads));
      },
      onSchoolReplacementRequests: (cloudReqs) => {
        setReplacementRequests((prev) => mergeById(prev, cloudReqs));
      },
    });

    return () => {
      unsubWorkspace();
    };
  }, [authReady, firebaseUser?.uid, firebaseUser?.emailVerified, activeSchoolId, hasAdminListenerScope]);

  const signatories: AuthorizedSignatory[] = React.useMemo(
    () => (Array.isArray(school.signatories) ? school.signatories : []),
    [school]
  );

  const buildCurrentTenantSnapshot = (): SchoolTenantData => ({
    school,
    users,
    students,
    classes,
    subjects,
    admissions,
    examResults,
    feeItems,
    feePayments,
    transactions,
    staff,
    staffAttendance,
    timetable,
    attendance,
    libraryBooks,
    bookLoans,
    assets,
    routes,
    boardingHouses,
    healthRecords,
    announcements,
    researchArticles,
    programmes,
    programmeCourses,
    candidates,
    candidateAssessments,
    certificateTemplates,
    issuedCredentials,
    graduateRecords,
    replacementRequests,
    accreditations,
    verificationLogs,
    biometricGateLogs,
  });

  useEffect(() => {
    try {
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(schools));
      if (!activeSchoolId || activeSchoolId === EMPTY_SCHOOL_ID || isRemovedSampleSchoolId(activeSchoolId)) {
        return;
      }
      if (school.id !== activeSchoolId) {
        return;
      }

      const currentTenantData = buildCurrentTenantSnapshot();
      localStorage.setItem(TENANT_STORAGE_PREFIX + activeSchoolId, JSON.stringify(currentTenantData));
      localStorage.setItem(ACTIVE_SCHOOL_KEY, activeSchoolId);
    } catch (e) {
      console.error('Failed to sync tenant data to localStorage', e);
    }
  }, [
    activeSchoolId,
    schools,
    school,
    users,
    currentUser,
    students,
    classes,
    subjects,
    admissions,
    examResults,
    feeItems,
    feePayments,
    transactions,
    staff,
    staffAttendance,
    timetable,
    attendance,
    libraryBooks,
    bookLoans,
    assets,
    routes,
    boardingHouses,
    healthRecords,
    announcements,
    researchArticles,
    programmes,
    programmeCourses,
    candidates,
    candidateAssessments,
    certificateTemplates,
    issuedCredentials,
    graduateRecords,
    replacementRequests,
    accreditations,
    verificationLogs,
    biometricGateLogs,
    isAuthenticated,
  ]);

  const applyTenantState = (targetSchoolId: string, targetTenant: SchoolTenantData, safeSchool: SchoolProfile) => {
    setActiveSchoolId(targetSchoolId);
    setSchool(safeSchool);
    setUsers(targetTenant.users);
    setCurrentUser(targetTenant.users[0] || EMPTY_FALLBACK_USER);
    setStudents(targetTenant.students);
    setClasses(targetTenant.classes);
    setSubjects(targetTenant.subjects);
    setAdmissions(targetTenant.admissions);
    setExamResults(targetTenant.examResults);
    setFeeItems(targetTenant.feeItems);
    setFeePayments(targetTenant.feePayments);
    setTransactions(targetTenant.transactions);
    setStaff(targetTenant.staff);
    setStaffAttendance(targetTenant.staffAttendance);
    setTimetable(targetTenant.timetable);
    setAttendance(targetTenant.attendance);
    setLibraryBooks(targetTenant.libraryBooks);
    setBookLoans(targetTenant.bookLoans);
    setAssets(targetTenant.assets);
    setRoutes(targetTenant.routes);
    setBoardingHouses(targetTenant.boardingHouses);
    setHealthRecords(targetTenant.healthRecords);
    setAnnouncements(targetTenant.announcements);
    setResearchArticles(targetTenant.researchArticles || []);
    setProgrammes(targetTenant.programmes || []);
    setProgrammeCourses(targetTenant.programmeCourses || []);
    setCandidates(targetTenant.candidates || []);
    setCandidateAssessments(targetTenant.candidateAssessments || []);
    setCertificateTemplates(targetTenant.certificateTemplates || []);
    setIssuedCredentials(targetTenant.issuedCredentials || []);
    setGraduateRecords(targetTenant.graduateRecords || []);
    setReplacementRequests(targetTenant.replacementRequests || []);
    setAccreditations(targetTenant.accreditations || []);
    setVerificationLogs(targetTenant.verificationLogs || []);
    setBiometricGateLogs(targetTenant.biometricGateLogs || []);
  };

  const switchSchool = (targetSchoolId: string) => {
    if (targetSchoolId === activeSchoolId && school.id === targetSchoolId) return;

    const targetSchoolProfile = schools.find((s) => s.id === targetSchoolId);
    if (!targetSchoolProfile) {
      console.error('Target school not found:', targetSchoolId);
      return;
    }

    if (school.id === activeSchoolId) {
      try {
        localStorage.setItem(TENANT_STORAGE_PREFIX + activeSchoolId, JSON.stringify(buildCurrentTenantSnapshot()));
      } catch (e) {
        console.error('Error saving current tenant before switch', e);
      }
    }

    const targetTenant = loadTenantData(targetSchoolId);
    const safeSchool: SchoolProfile = {
      ...targetSchoolProfile,
      ...targetTenant.school,
      id: targetSchoolId,
      name: targetSchoolProfile.name,
      code: targetSchoolProfile.code,
    };

    applyTenantState(targetSchoolId, targetTenant, safeSchool);
    const targetIsInstitute = isInstituteLevelType(safeSchool.levelType);
    if (
      (!targetIsInstitute &&
        activeModule === 'professional-credentials' &&
        !(safeSchool.enabledModules || []).includes('professional_credentials')) ||
      (targetIsInstitute &&
        ['academics', 'attendance', 'examinations', 'welfare-transport', 'library-inventory'].includes(activeModule))
    ) {
      setActiveModule('dashboard');
    }

    try {
      localStorage.setItem(ACTIVE_SCHOOL_KEY, targetSchoolId);
      localStorage.setItem(TENANT_STORAGE_PREFIX + targetSchoolId, JSON.stringify({ ...targetTenant, school: safeSchool }));
    } catch (e) {
      console.error('Failed to write target school to localStorage', e);
    }
  };

  const registerSchool = (
    schoolData: Omit<SchoolProfile, 'id'>,
    adminCredentials: { name: string; email: string; password?: string; title?: string; role?: RoleType }
  ): { school: SchoolProfile; admin: UserAccount } => {
    const fb = auth.currentUser;
    if (!fb || !fb.emailVerified || !isBootstrappedAdminUser(fb)) {
      throw new Error(
        'Unauthorized: Visitors and schools are not permitted to add or register a new school. Only the Platform Administrator can onboard institutions.'
      );
    }

    const newSchoolId = `sch-${Date.now()}`;
    const isInst = isInstituteLevelType(schoolData.levelType);
    const defaultSigUrl = makeCalligraphicSignatureSvg(adminCredentials.name);
    const newAdminId = `usr-admin-${Date.now()}`;
    const initialSignatories: AuthorizedSignatory[] = [
      {
        id: `sig-${newSchoolId}-head`,
        userId: newAdminId,
        name: adminCredentials.name,
        title: adminCredentials.title || (isInst ? 'Rector & Registrar' : 'Headmaster & Principal'),
        role: 'Head of Institution',
        signatureDataUrl: defaultSigUrl,
        signatureMethod: 'drawn',
        updatedAt: new Date().toISOString().split('T')[0],
        active: true,
      },
    ];

    const creatorUid = fb.uid;
    const defaultMods =
      schoolData.enabledModules && schoolData.enabledModules.length > 0
        ? schoolData.enabledModules
        : getDefaultModulesForLevelType(schoolData.levelType);

    const newSchool: SchoolProfile = {
      ...schoolData,
      id: newSchoolId,
      ownerUid: creatorUid,
      whatsappNumber: schoolData.whatsappNumber?.trim() || schoolData.phone?.trim() || '',
      whatsappEnabled: schoolData.whatsappEnabled ?? true,
      headmasterSignatureDataUrl: defaultSigUrl,
      signatories: initialSignatories,
      enabledModules: isInst ? Array.from(new Set(['professional_credentials', ...defaultMods])) : defaultMods,
    };

    const newAdmin: UserAccount = {
      id: newAdminId,
      name: adminCredentials.name,
      email: adminCredentials.email.trim().toLowerCase(),
      password: adminCredentials.password || 'admin123',
      role: adminCredentials.role || 'proprietor',
      title: adminCredentials.title || (isInst ? 'Rector & Super Administrator' : 'Headmaster & Super Administrator'),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      schoolId: newSchoolId,
      signatureDataUrl: defaultSigUrl,
      signatureMethod: 'drawn',
      signatureUpdatedAt: new Date().toISOString().split('T')[0],
    };

    const starterClasses: ClassRoom[] = [];
    if (isInst) {
      starterClasses.push(
        { id: `cls-${newSchoolId}-l1`, name: 'Level 1 (Foundation) Cohort', level: 'SHS', form: 1, stream: 'Foundation', formTutorTeacherId: newAdmin.id, roomNumber: 'Hall A1', capacity: 60 },
        { id: `cls-${newSchoolId}-l2`, name: 'Level 2 (Intermediate) Cohort', level: 'SHS', form: 2, stream: 'Intermediate', formTutorTeacherId: newAdmin.id, roomNumber: 'Hall B1', capacity: 50 },
        { id: `cls-${newSchoolId}-l3`, name: 'Level 3 (Advanced / Final) Cohort', level: 'SHS', form: 3, stream: 'Professional', formTutorTeacherId: newAdmin.id, roomNumber: 'Hall C1', capacity: 45 },
        { id: `cls-${newSchoolId}-cert`, name: 'Certificate Programme (Non-Chartered) Cohort', level: 'SHS', form: 4, stream: 'Certificate', formTutorTeacherId: newAdmin.id, roomNumber: 'Executive Suite D1', capacity: 55 }
      );
    } else {
      if (newSchool.levelType === 'SHS' || newSchool.levelType === 'Combined') {
        starterClasses.push(
          { id: `cls-${newSchoolId}-1`, name: 'SHS 1 General Science', level: 'SHS', form: 1, stream: 'Science', formTutorTeacherId: newAdmin.id, roomNumber: 'Block A - 01', capacity: 45 },
          { id: `cls-${newSchoolId}-2`, name: 'SHS 2 General Arts', level: 'SHS', form: 2, stream: 'Arts', formTutorTeacherId: newAdmin.id, roomNumber: 'Block A - 02', capacity: 45 }
        );
      }
      if (newSchool.levelType === 'Basic & JHS' || newSchool.levelType === 'Combined') {
        starterClasses.push(
          { id: `cls-${newSchoolId}-p6`, name: 'Primary 6', level: 'Basic', form: 6, stream: 'General', formTutorTeacherId: newAdmin.id, roomNumber: 'Junior Wing 6', capacity: 35 },
          { id: `cls-${newSchoolId}-j3`, name: 'JHS 3 BECE Candidate Class', level: 'JHS', form: 3, stream: 'Finalists', formTutorTeacherId: newAdmin.id, roomNumber: 'Senior Wing 3', capacity: 40 }
        );
      }
    }

    const codePrefix = (newSchool.code || 'INST').split('-')[0].toUpperCase();
    const starterProgrammes: ProfessionalProgramme[] = isInst
      ? [
          {
            id: `prog-${newSchoolId}-01`,
            schoolId: newSchoolId,
            code: `${codePrefix}-QUAL-01`,
            title: `${newSchool.name} Chartered & Certificate Programme`,
            category: 'Professional Qualification',
            qualificationAwarded: `Professional Qualification & Certificate (${newSchool.code})`,
            awardingAuthorityModel: 'Institution Direct Award',
            durationLabel: 'Levels 1–3 & Certificate Track',
            totalCreditHours: 48,
            entryRequirements: 'Standard academic or practitioner entry qualification.',
            assessmentMethods: 'Continuous assessment, practical portfolio, and final examination.',
            examinationRegulations: 'Institutional examination board moderation and integrity rules.',
            progressionRules: 'Complete mandatory courses at each level or complete the standalone Certificate level.',
            completionRequirements: 'Pass required modules and satisfy institutional fee clearance.',
            feeClearanceRequired: true,
            status: 'Active',
            levels: [
              {
                levelNumber: 1,
                levelTitle: 'Level 1 (Foundation)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 1500,
                awardOnLevelCompletion: 'Level 1 Foundation Statement',
              },
              {
                levelNumber: 2,
                levelTitle: 'Level 2 (Intermediate)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 1800,
                awardOnLevelCompletion: 'Level 2 Intermediate Diploma',
              },
              {
                levelNumber: 3,
                levelTitle: 'Level 3 (Advanced / Final)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 2200,
                awardOnLevelCompletion: 'Full Professional Qualification',
              },
              {
                levelNumber: INSTITUTE_CERTIFICATE_LEVEL,
                levelTitle: 'Certificate (Standalone Non-Chartered)',
                creditHoursRequired: 12,
                passMarkPercent: 50,
                maxAllowedResits: 3,
                levelFeeAmount: 1200,
                awardOnLevelCompletion: 'Institutional Certificate of Competence',
              },
            ],
          },
        ]
      : [];

    const starterTemplates: CertificateTemplateConfig[] = [
      {
        id: `tpl-${newSchoolId}-01`,
        schoolId: newSchoolId,
        name: `${newSchool.name} Official Award Certificate`,
        themeStyle: 'emerald-gold',
        orientation: 'landscape',
        headerSubtitle: `${newSchool.name} · Official Academic & Professional Credential`,
        sealLabel: `OFFICIAL SEAL · ${newSchool.code}`,
        showQrCode: true,
        showCandidateId: true,
        showLevelCompleted: true,
        showCreditHours: true,
        showAuthorityDisclaimer: true,
        authorityDisclaimerText: `Issued under the seal and authority of ${newSchool.name} (${newSchool.code}). Verify online via certificate number or QR code.`,
        primarySignatoryId: initialSignatories[0]?.id,
      },
    ];

    const newTenantData: SchoolTenantData = {
      school: newSchool,
      users: [newAdmin],
      students: [],
      classes: starterClasses,
      subjects: INITIAL_SUBJECTS,
      admissions: [],
      examResults: [],
      feeItems: [
        { id: `fee-${newSchoolId}-1`, name: 'Tuition & Registration Fee', amount: 1850, term: newSchool.currentTerm, classLevel: 'All' },
      ],
      feePayments: [],
      transactions: [],
      staff: [],
      staffAttendance: [],
      timetable: [],
      attendance: [],
      libraryBooks: [],
      bookLoans: [],
      assets: [],
      routes: [],
      boardingHouses: [],
      healthRecords: [],
      announcements: [],
      researchArticles: [],
      programmes: starterProgrammes,
      programmeCourses: [],
      candidates: [],
      candidateAssessments: [],
      certificateTemplates: starterTemplates,
      issuedCredentials: [],
      graduateRecords: [],
      replacementRequests: [],
      accreditations: [],
      verificationLogs: [],
      biometricGateLogs: [],
    };

    localStorage.setItem(TENANT_STORAGE_PREFIX + newSchoolId, JSON.stringify(newTenantData));

    const updatedSchools = [
      ...schools.filter((s) => s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)),
      newSchool,
    ];
    setSchools(updatedSchools);
    localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(updatedSchools));
    localStorage.setItem(ACTIVE_SCHOOL_KEY, newSchoolId);

    applyTenantState(newSchoolId, newTenantData, newSchool);
    setCurrentUser(newAdmin);
    setIsAuthenticated(true);
    setActiveModule(isInst ? 'professional-credentials' : 'dashboard');

    if (auth.currentUser?.emailVerified) {
      const uid = auth.currentUser.uid;
      runCloudTask(
        (async () => {
          await upsertSchoolInCloud(newSchool, uid);
          await upsertSchoolMemberInCloud(newSchoolId, uid, {
            uid: newAdmin.id,
            name: newAdmin.name,
            role: newAdmin.role,
            title: newAdmin.title,
            avatar: newAdmin.avatar,
          });
          for (const sig of initialSignatories) {
            await upsertSignatoryInCloud(newSchoolId, uid, sig);
          }
          for (const prog of starterProgrammes) {
            await upsertProgrammeInCloud(newSchoolId, uid, prog);
          }
        })()
      );
    }

    return { school: newSchool, admin: newAdmin };
  };

  const deleteSchool = (schoolId: string): boolean => {
    const fb = auth.currentUser;
    if (!fb || !fb.emailVerified || !isBootstrappedAdminUser(fb)) {
      return false;
    }

    runCloudTask(deleteSchoolInCloud(schoolId));

    const filteredSchools = schools.filter(
      (s) => s.id !== schoolId && s.id !== EMPTY_SCHOOL_ID && !isRemovedSampleSchoolId(s.id)
    );
    setSchools(filteredSchools);
    setCloudPublicCreds((prev) => prev.filter((c) => c.schoolId !== schoolId));
    setCloudPublicGraduates((prev) => prev.filter((g) => g.schoolId !== schoolId));
    setCloudPublicArticles((prev) => prev.filter((a) => a.schoolId !== schoolId));
    setPublicNetworkRevision((r) => r + 1);

    try {
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(filteredSchools));
      localStorage.removeItem(TENANT_STORAGE_PREFIX + schoolId);
    } catch (e) {
      console.error('Error removing deleted school from localStorage', e);
    }

    if (filteredSchools.length === 0) {
      try {
        localStorage.removeItem(ACTIVE_SCHOOL_KEY);
      } catch {
        // Ignore storage errors
      }
      const emptyTenant = getInitialTenantData(EMPTY_SCHOOL_ID);
      applyTenantState(EMPTY_SCHOOL_ID, emptyTenant, EMPTY_WORKSPACE_SCHOOL);
      setIsAuthenticated(false);
    } else if (activeSchoolId === schoolId) {
      const nextSchool = filteredSchools[0];
      const nextTenant = loadTenantData(nextSchool.id);
      const safeNextSchool: SchoolProfile = {
        ...nextSchool,
        ...nextTenant.school,
        id: nextSchool.id,
        name: nextSchool.name,
        code: nextSchool.code,
      };
      applyTenantState(nextSchool.id, nextTenant, safeNextSchool);
      try {
        localStorage.setItem(ACTIVE_SCHOOL_KEY, nextSchool.id);
      } catch {
        // Ignore storage errors
      }
    }

    return true;
  };

  const updateSchoolProfile = (profile: Partial<SchoolProfile>) => {
    setSchool((prev) => {
      const updated = { ...prev, ...profile };
      setSchools((allSchools) =>
        allSchools.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      if (canWriteSchoolAdminInCloud(updated.id)) {
        const ownerUid = updated.ownerUid || auth.currentUser!.uid;
        runCloudTask(upsertSchoolInCloud(updated, ownerUid));
      }
      return updated;
    });
  };

  const updateUser = (userId: string, data: Partial<UserAccount>) => {
    let updatedUserRef: UserAccount | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const merged = { ...u, ...data };
        updatedUserRef = merged;
        return merged;
      })
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...data }));
    }
    if (updatedUserRef && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const u = updatedUserRef as UserAccount;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(
        upsertSchoolMemberInCloud(activeSchoolId, ownerUid, {
          uid: u.id,
          name: u.name,
          role: u.role,
          title: u.title,
          avatar: u.avatar,
        })
      );
    }
  };

  const updateCurrentUserAvatar = (newAvatar: string) => {
    updateUser(currentUser.id, { avatar: newAvatar });
  };

  const addUserAccount = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: activeSchoolId,
    };
    setUsers((prev) => {
      const next = [newUser, ...prev];
      if (prev.length === 0 || currentUser.id === EMPTY_FALLBACK_USER.id) {
        setCurrentUser(newUser);
      }
      return next;
    });
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(
        upsertSchoolMemberInCloud(activeSchoolId, ownerUid, {
          uid: newUser.id,
          name: newUser.name,
          role: newUser.role,
          title: newUser.title,
          avatar: newUser.avatar,
        })
      );
    }
    return newUser;
  };

  const deleteUserAccount = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const remainingUsers = users.filter((u) => u.id !== userId);
    setUsers(remainingUsers);

    // Also remove any linked digital signatory & staff profile for this admin/user
    const currentSigs = Array.isArray(school.signatories) ? school.signatories : [];
    const removedSigs = currentSigs.filter(
      (s) =>
        s.userId === userId ||
        (targetUser && s.name.trim().toLowerCase() === targetUser.name.trim().toLowerCase())
    );
    const remainingSigs = currentSigs.filter((s) => !removedSigs.some((rem) => rem.id === s.id));

    if (removedSigs.length > 0 || (targetUser && school.headmasterName === targetUser.name)) {
      const nextAdmin =
        remainingUsers.find((u) => u.role === 'proprietor' || u.role === 'admin') || remainingUsers[0];
      const profilePatch: Partial<SchoolProfile> = {
        signatories: remainingSigs,
      };
      if (targetUser && school.headmasterName === targetUser.name) {
        profilePatch.headmasterName = nextAdmin?.name || 'Administrator';
        profilePatch.headmasterSignature = nextAdmin?.name || 'Administrator';
        profilePatch.headmasterSignatureDataUrl =
          remainingSigs[0]?.signatureDataUrl ||
          makeCalligraphicSignatureSvg(nextAdmin?.name || 'Administrator');
      }
      updateSchoolProfile(profilePatch);
    }

    if (targetUser) {
      const targetEmailLower = targetUser.email.trim().toLowerCase();
      setStaff((prev) => prev.filter((st) => st.email.trim().toLowerCase() !== targetEmailLower));
    }

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(
        deleteSchoolMemberAndProfileInCloud(
          activeSchoolId,
          userId,
          removedSigs.map((s) => s.id)
        )
      );
    }

    // Handle active session cleanly if the deleted account was currently active
    if (currentUser.id === userId) {
      const nextSessionUser =
        remainingUsers.find((u) => u.role === 'proprietor' || u.role === 'admin') || remainingUsers[0];
      if (nextSessionUser) {
        setCurrentUser(nextSessionUser);
      } else if (isPlatformAdmin && firebaseUser?.email) {
        setCurrentUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Platform Owner',
          email: firebaseUser.email.toLowerCase(),
          role: 'proprietor',
          title: 'Platform Owner (No School Admin Assigned)',
          avatar:
            firebaseUser.photoURL ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          schoolId: activeSchoolId,
        });
      } else {
        setCurrentUser(EMPTY_FALLBACK_USER);
        setIsAuthenticated(false);
      }
    }
  };

  // ============================================================================
  // DIGITAL SIGNATURES & SIGNATORY ACTIONS
  // ============================================================================

  const saveUserSignature = (
    userId: string,
    signatureDataUrl: string,
    method: 'drawn' | 'uploaded',
    signatoryRole?: AuthorizedSignatory['role'],
    customTitle?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const targetUser = users.find((u) => u.id === userId) || currentUser;

    updateUser(userId, {
      signatureDataUrl,
      signatureMethod: method,
      signatureUpdatedAt: today,
    });

    const currentSigs = [...signatories];
    const existingIdx = currentSigs.findIndex((s) => s.userId === userId || s.name === targetUser.name);
    const derivedRole: AuthorizedSignatory['role'] =
      signatoryRole ||
      (targetUser.role === 'proprietor'
        ? 'Head of Institution'
        : targetUser.role === 'admin'
        ? 'Registrar'
        : 'Lead Lecturer / Teacher');

    const entry: AuthorizedSignatory = {
      id: existingIdx >= 0 ? currentSigs[existingIdx].id : `sig-${Date.now()}`,
      userId,
      name: targetUser.name,
      title: customTitle || targetUser.title,
      role: derivedRole,
      signatureDataUrl,
      signatureMethod: method,
      updatedAt: today,
      active: true,
    };

    if (existingIdx >= 0) {
      currentSigs[existingIdx] = entry;
    } else {
      currentSigs.push(entry);
    }

    const headUpdate: Partial<SchoolProfile> = { signatories: currentSigs };
    if (derivedRole === 'Head of Institution' || targetUser.role === 'proprietor') {
      headUpdate.headmasterSignatureDataUrl = signatureDataUrl;
      headUpdate.headmasterName = targetUser.name;
    }
    updateSchoolProfile(headUpdate);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertSignatoryInCloud(activeSchoolId, ownerUid, entry));
    }
  };

  const upsertSignatory = (sig: Omit<AuthorizedSignatory, 'id' | 'updatedAt'> & { id?: string }): AuthorizedSignatory => {
    const today = new Date().toISOString().split('T')[0];
    const currentSigs = [...signatories];
    const entry: AuthorizedSignatory = {
      ...sig,
      id: sig.id || `sig-${Date.now()}`,
      updatedAt: today,
    };
    const idx = currentSigs.findIndex((s) => s.id === entry.id);
    if (idx >= 0) {
      currentSigs[idx] = entry;
    } else {
      currentSigs.push(entry);
    }
    updateSchoolProfile({ signatories: currentSigs });
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertSignatoryInCloud(activeSchoolId, ownerUid, entry));
    }
    return entry;
  };

  const removeSignatory = (id: string) => {
    updateSchoolProfile({ signatories: signatories.filter((s) => s.id !== id) });
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteSignatoryInCloud(activeSchoolId, id));
    }
  };

  // ============================================================================
  // MULTI-LEVEL PROGRAMMES, COURSES, CANDIDATES & PROGRESSION ENGINE
  // ============================================================================

  const addProgramme = (progData: Omit<ProfessionalProgramme, 'id' | 'schoolId'>): ProfessionalProgramme => {
    const newProg: ProfessionalProgramme = {
      ...progData,
      id: `prog-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setProgrammes((prev) => [newProg, ...prev]);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertProgrammeInCloud(activeSchoolId, ownerUid, newProg));
    }
    return newProg;
  };

  const updateProgramme = (id: string, data: Partial<ProfessionalProgramme>) => {
    setProgrammes((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertProgrammeInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
  };

  const deleteProgramme = (id: string) => {
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
    setProgrammeCourses((prev) => prev.filter((c) => c.programmeId !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteProgrammeInCloud(activeSchoolId, id));
    }
  };

  const addProgrammeCourse = (courseData: Omit<ProgrammeCourse, 'id' | 'schoolId'>): ProgrammeCourse => {
    const newCourse: ProgrammeCourse = {
      ...courseData,
      id: `crs-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setProgrammeCourses((prev) => [...prev, newCourse]);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const parentProg = programmes.find((p) => p.id === newCourse.programmeId);
      runCloudTask(
        (async () => {
          if (parentProg) {
            await upsertProgrammeInCloud(activeSchoolId, ownerUid, parentProg);
          }
          await upsertCourseInCloud(activeSchoolId, ownerUid, newCourse);
        })()
      );
    }
    return newCourse;
  };

  const updateProgrammeCourse = (id: string, data: Partial<ProgrammeCourse>) => {
    setProgrammeCourses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertCourseInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
  };

  const deleteProgrammeCourse = (id: string) => {
    setProgrammeCourses((prev) => prev.filter((c) => c.id !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteCourseInCloud(activeSchoolId, id));
    }
  };

  const registerCandidate = (
    data: Omit<CandidateProfile, 'id' | 'schoolId' | 'candidateNumber' | 'enrollmentDate'> & { candidateNumber?: string }
  ): CandidateProfile => {
    const prefix = school.code.split('-')[0] || 'CAND';
    const year = new Date().getFullYear();
    const seq = String(candidates.length + 45).padStart(4, '0');
    const candidateNumber = data.candidateNumber?.trim() || `${prefix}-CAND-${year}-${seq}`;
    const newCand: CandidateProfile = {
      ...data,
      id: `cand-${Date.now()}`,
      schoolId: activeSchoolId,
      candidateNumber,
      enrollmentDate: new Date().toISOString().split('T')[0],
    };
    setCandidates((prev) => [newCand, ...prev]);

    // Automatically create a portal login account for the candidate if one doesn't exist
    const cleanEmail =
      newCand.email.trim().toLowerCase() ||
      `${newCand.firstName.toLowerCase()}.${newCand.lastName.toLowerCase()}@candidate.${prefix.toLowerCase()}.edu.gh`;
    if (!users.some((u) => u.email.toLowerCase() === cleanEmail || u.candidateId === newCand.id)) {
      const prog = programmes.find((p) => p.id === newCand.programmeId);
      addUserAccount({
        name: `${newCand.firstName} ${newCand.lastName}`,
        email: cleanEmail,
        password: 'student123',
        role: 'student',
        title: `${formatInstituteLevelShort(newCand.currentLevel)} Candidate (${prog?.code || 'Programme'})`,
        avatar: newCand.photo,
        candidateId: newCand.id,
        studentId: newCand.studentId,
      });
    }

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const parentProg = programmes.find((p) => p.id === newCand.programmeId);
      runCloudTask(
        (async () => {
          if (parentProg) {
            await upsertProgrammeInCloud(activeSchoolId, ownerUid, parentProg);
          }
          await upsertCandidateInCloud(activeSchoolId, ownerUid, { ...newCand, email: cleanEmail });
        })()
      );
    }

    return newCand;
  };

  const updateCandidate = (id: string, data: Partial<CandidateProfile>) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...data };
        const fb = auth.currentUser;
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb!.uid;
          runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updated, false));
        } else if (
          fb &&
          fb.emailVerified &&
          fb.email &&
          c.email.toLowerCase() === fb.email.toLowerCase()
        ) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb.uid;
          runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updated, true));
        }
        return updated;
      })
    );
  };

  const saveCandidateAssessment = (assessmentData: Omit<CandidateCourseAssessment, 'id'> & { id?: string }) => {
    let savedRecord: CandidateCourseAssessment | null = null;
    setCandidateAssessments((prev) => {
      const idx = prev.findIndex(
        (a) =>
          (assessmentData.id && a.id === assessmentData.id) ||
          (a.candidateId === assessmentData.candidateId && a.courseId === assessmentData.courseId)
      );
      const record: CandidateCourseAssessment = {
        ...assessmentData,
        id: idx >= 0 ? prev[idx].id : assessmentData.id || `ass-${Date.now()}`,
      };
      savedRecord = record;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, record];
    });

    if (savedRecord && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const rec = savedRecord as CandidateCourseAssessment;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const cand = candidates.find((c) => c.id === rec.candidateId);
      const crs = programmeCourses.find((c) => c.id === rec.courseId);
      const prog = programmes.find((p) => p.id === rec.programmeId);
      runCloudTask(
        (async () => {
          if (prog) await upsertProgrammeInCloud(activeSchoolId, ownerUid, prog);
          if (crs) await upsertCourseInCloud(activeSchoolId, ownerUid, crs);
          if (cand) await upsertCandidateInCloud(activeSchoolId, ownerUid, cand);
          await upsertAssessmentInCloud(
            activeSchoolId,
            ownerUid,
            rec,
            cand?.email || 'candidate@institute.edu.gh'
          );
        })()
      );
    }
  };

  const evaluateCandidateProgression = (candidateId: string): CandidateProgressionEvaluation | null => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return null;
    const prog = programmes.find((p) => p.id === cand.programmeId);
    const isCertificateTrack = cand.currentLevel === INSTITUTE_CERTIFICATE_LEVEL;
    const charteredLevels = (prog?.levels || []).filter((l) => l.levelNumber !== INSTITUTE_CERTIFICATE_LEVEL);
    const maxLevel = isCertificateTrack
      ? INSTITUTE_CERTIFICATE_LEVEL
      : charteredLevels.length > 0
      ? Math.max(...charteredLevels.map((l) => l.levelNumber))
      : 3;

    const currentLevelCourses = programmeCourses.filter(
      (c) => c.programmeId === cand.programmeId && c.levelNumber === cand.currentLevel && c.isMandatory
    );
    const candAssess = candidateAssessments.filter(
      (a) => a.candidateId === cand.id && a.levelNumber === cand.currentLevel
    );

    let passedOrExemptCount = 0;
    const resitRequiredCourses: string[] = [];
    const deferredOrPendingCourses: string[] = [];

    for (const crs of currentLevelCourses) {
      const rec = candAssess.find((a) => a.courseId === crs.id);
      if (!rec) {
        deferredOrPendingCourses.push(`${crs.code}: ${crs.title} (Awaiting Exam)`);
      } else if (rec.paperStatus === 'Passed' || rec.paperStatus === 'Exempted') {
        passedOrExemptCount += 1;
      } else if (rec.paperStatus === 'Resit Required') {
        resitRequiredCourses.push(`${crs.code} (${rec.totalScore}% - Resit)`);
      } else {
        deferredOrPendingCourses.push(`${crs.code} (${rec.paperStatus})`);
      }
    }

    const allMandatorySatisfied =
      currentLevelCourses.length > 0
        ? passedOrExemptCount >= currentLevelCourses.length
        : candAssess.some((a) => a.paperStatus === 'Passed' || a.paperStatus === 'Exempted');

    const feeBalance = Math.max(0, cand.totalFeesBilled - cand.totalFeesPaid);
    const feeRatio = cand.totalFeesBilled > 0 ? cand.totalFeesPaid / cand.totalFeesBilled : 1;
    const feeClearedForProgression = !prog?.feeClearanceRequired || feeRatio >= 0.8;
    const feeClearedForGraduation = !prog?.feeClearanceRequired || feeBalance === 0;

    const isAtFinalLevel = isCertificateTrack || cand.currentLevel >= maxLevel;
    const eligibleForNextLevel =
      !isAtFinalLevel && allMandatorySatisfied && feeClearedForProgression && resitRequiredCourses.length === 0;
    const eligibleForGraduation =
      isAtFinalLevel &&
      allMandatorySatisfied &&
      feeClearedForGraduation &&
      cand.identityVerified &&
      resitRequiredCourses.length === 0;

    let statusSummary = 'In Progress';
    if (cand.status === 'Completed / Graduated') {
      statusSummary = 'Graduated & Transferred to Alumni Register';
    } else if (eligibleForGraduation) {
      statusSummary = isCertificateTrack
        ? 'Certificate Track Complete — Eligible for Certificate Issuance'
        : 'Eligible for Final Graduation & Credential Issuance';
    } else if (eligibleForNextLevel) {
      statusSummary = `Eligible to Progress to Level ${cand.currentLevel + 1}`;
    } else if (resitRequiredCourses.length > 0) {
      statusSummary = `Restricted: ${resitRequiredCourses.length} Resit Paper(s) Outstanding`;
    } else if (!feeClearedForProgression) {
      statusSummary = `Fee Clearance Pending (Balance: ${school.currency} ${feeBalance.toLocaleString()})`;
    } else if (deferredOrPendingCourses.length > 0) {
      statusSummary = `${deferredOrPendingCourses.length} Mandatory Paper(s) Pending Assessment`;
    }

    return {
      candidateId: cand.id,
      currentLevel: cand.currentLevel,
      maxProgrammeLevel: isCertificateTrack ? 1 : maxLevel,
      mandatoryCoursesCount: currentLevelCourses.length,
      passedOrExemptCount,
      resitRequiredCourses,
      deferredOrPendingCourses,
      feeBalance,
      feeClearedForProgression,
      feeClearedForGraduation,
      identityVerified: cand.identityVerified,
      eligibleForNextLevel,
      eligibleForGraduation,
      statusSummary,
    };
  };

  const promoteCandidateToNextLevel = (candidateId: string): boolean => {
    const evalResult = evaluateCandidateProgression(candidateId);
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand || !evalResult || !evalResult.eligibleForNextLevel) return false;

    const nextLevel = cand.currentLevel + 1;
    const prog = programmes.find((p) => p.id === cand.programmeId);
    const nextLevelConfig = prog?.levels.find((l) => l.levelNumber === nextLevel);

    const promotedCand: CandidateProfile = {
      ...cand,
      completedLevels: Array.from(new Set([...cand.completedLevels, cand.currentLevel])),
      currentLevel: nextLevel,
      totalFeesBilled: cand.totalFeesBilled + (nextLevelConfig?.levelFeeAmount || 0),
    };

    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? promotedCand : c)));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, promotedCand));
    }
    return true;
  };

  // ============================================================================
  // CERTIFICATE TEMPLATES, ISSUANCE, AUDIT LOG & ALUMNI TRANSFER
  // ============================================================================

  const saveCertificateTemplate = (
    tplData: Omit<CertificateTemplateConfig, 'id' | 'schoolId'> & { id?: string }
  ): CertificateTemplateConfig => {
    const record: CertificateTemplateConfig = {
      ...tplData,
      id: tplData.id || `tpl-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setCertificateTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
    return record;
  };

  const transferCandidateToGraduateRegister = (
    cand: CandidateProfile,
    cred: IssuedCredential
  ) => {
    const gradYear = new Date(cred.issueDate || new Date().toISOString()).getFullYear();
    const prog = programmes.find((p) => p.id === cand.programmeId);
    const fullName = `${cand.firstName} ${cand.otherNames ? cand.otherNames + ' ' : ''}${cand.lastName}`;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === cand.id
          ? {
              ...c,
              status: 'Completed / Graduated',
              completedLevels: prog
                ? prog.levels.map((l) => l.levelNumber)
                : Array.from(new Set([...c.completedLevels, c.currentLevel])),
              membershipStatus:
                c.membershipStatus === 'Registered Student Candidate'
                  ? 'Graduate Member (Institution Complete)'
                  : c.membershipStatus,
            }
          : c
      )
    );

    if (cand.studentId) {
      setStudents((prev) =>
        prev.map((s) => (s.id === cand.studentId ? { ...s, status: 'Graduated' } : s))
      );
    }

    let createdGrad: GraduateAlumniRecord | null = null;
    setGraduateRecords((prev) => {
      if (prev.some((g) => g.certificateNumber === cred.certificateNumber)) {
        return prev;
      }
      const newGrad: GraduateAlumniRecord = {
        id: `grad-${Date.now()}`,
        schoolId: activeSchoolId,
        candidateId: cand.id,
        candidateNumber: cand.candidateNumber,
        fullName,
        email: cand.email,
        phone: cand.phone,
        photo: cand.photo,
        programmeId: cand.programmeId,
        programmeTitle: cred.programmeTitle,
        qualificationAwarded: cred.qualificationAwarded,
        levelAttained: cred.levelCompletedLabel,
        graduationYear: gradYear,
        completionApprovedDate: cred.issueDate,
        certificateNumber: cred.certificateNumber,
        verificationCode: cred.verificationCode,
        certificateStatus: cred.status,
        membershipStatus:
          cand.membershipStatus === 'Registered Student Candidate'
            ? 'Graduate Member (Institution Complete)'
            : cand.membershipStatus,
        professionalBodyDesignation: prog?.professionalDesignation,
        directoryConsent: cand.directoryConsent,
        currentEmployerOrRole: cand.headlineOrRole || 'Verified Graduate',
      };
      createdGrad = newGrad;
      return [newGrad, ...prev];
    });

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const updatedCandObj: CandidateProfile = {
        ...cand,
        status: 'Completed / Graduated',
        completedLevels: prog
          ? prog.levels.map((l) => l.levelNumber)
          : Array.from(new Set([...cand.completedLevels, cand.currentLevel])),
        membershipStatus:
          cand.membershipStatus === 'Registered Student Candidate'
            ? 'Graduate Member (Institution Complete)'
            : cand.membershipStatus,
      };
      runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updatedCandObj));
      if (createdGrad) {
        runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, createdGrad));
      }
    }
  };

  const issueDigitalCredential = (
    payload: Omit<
      IssuedCredential,
      | 'id'
      | 'schoolId'
      | 'schoolName'
      | 'schoolCode'
      | 'schoolCrest'
      | 'certificateNumber'
      | 'verificationCode'
      | 'auditTrail'
    > & { certificateNumber?: string; approvalNote?: string }
  ): { success: boolean; credential?: IssuedCredential; error?: string } => {
    const prefix = school.code.split('-')[0] || 'SCH';
    const year = new Date().getFullYear();
    const seq = String(issuedCredentials.length + 120).padStart(5, '0');
    const certNumber = (payload.certificateNumber?.trim() || `${prefix}-${year}-CERT-${seq}`).toUpperCase();

    // Prevent duplicate certificate serial numbers
    if (issuedCredentials.some((c) => c.certificateNumber.toUpperCase() === certNumber)) {
      return {
        success: false,
        error: `Duplicate Certificate Serial Number (${certNumber}) blocked by central register.`,
      };
    }

    const verificationCode = generateVerificationCode(prefix);
    const nowStamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    const newCred: IssuedCredential = {
      ...payload,
      id: `cred-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
      schoolName: school.name,
      schoolCode: school.code,
      schoolCrest: school.crest,
      certificateNumber: certNumber,
      verificationCode,
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: nowStamp,
          actorName: currentUser.name,
          actorRole: currentUser.title || currentUser.role,
          previousStatus: 'Draft',
          newStatus: payload.status,
          reason:
            payload.approvalNote ||
            (payload.status === 'Valid'
              ? 'Academic, examination, and financial graduation requirements verified and approved for official issuance.'
              : 'Submitted to central credential register pending final executive sign-off.'),
        },
      ],
    };

    setIssuedCredentials((prev) => [newCred, ...prev]);
    setPublicNetworkRevision((r) => r + 1);

    const cand = candidates.find((c) => c.id === payload.candidateId);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(
        issueOrUpdateCredentialAtomicInCloud(
          activeSchoolId,
          ownerUid,
          newCred,
          cand?.email || 'graduate@institute.edu.gh'
        )
      );
    }

    // Automatic transfer to Alumni / Graduate Register when full qualification is approved as Valid
    if (
      cand &&
      payload.status === 'Valid' &&
      (payload.credentialType === 'Full Qualification Certificate' ||
        payload.credentialType === 'Diploma Certificate' ||
        payload.credentialType === 'Executive Programme Certificate')
    ) {
      transferCandidateToGraduateRegister(cand, newCred);
    }

    return { success: true, credential: newCred };
  };

  const updateCredentialStatus = (
    credentialId: string,
    newStatus: CertificateValidityStatus,
    reason: string,
    replacedByCertificateNumber?: string
  ) => {
    const nowStamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    let approvedTargetCred: IssuedCredential | null = null;
    let mutatedCred: IssuedCredential | null = null;

    setIssuedCredentials((prev) =>
      prev.map((cred) => {
        if (cred.id !== credentialId) return cred;
        const updated: IssuedCredential = {
          ...cred,
          status: newStatus,
          revocationOrStatusReason:
            newStatus === 'Revoked' || newStatus === 'Expired' || newStatus === 'Replaced'
              ? reason
              : cred.revocationOrStatusReason,
          replacedByCertificateNumber: replacedByCertificateNumber || cred.replacedByCertificateNumber,
          auditTrail: [
            ...cred.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: nowStamp,
              actorName: currentUser.name,
              actorRole: currentUser.title || currentUser.role,
              previousStatus: cred.status,
              newStatus,
              reason,
            },
          ],
        };
        mutatedCred = updated;
        if (cred.status !== 'Valid' && newStatus === 'Valid') {
          approvedTargetCred = updated;
        }
        return updated;
      })
    );

    if (mutatedCred && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const credObj = mutatedCred as IssuedCredential;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const cand = candidates.find((c) => c.id === credObj.candidateId);
      runCloudTask(
        issueOrUpdateCredentialAtomicInCloud(
          activeSchoolId,
          ownerUid,
          credObj,
          cand?.email || 'graduate@institute.edu.gh'
        )
      );
    }

    // Sync status in Graduate Register (preserving historical record!)
    setGraduateRecords((prev) =>
      prev.map((g) => {
        const target = issuedCredentials.find((c) => c.id === credentialId);
        if (target && g.certificateNumber === target.certificateNumber) {
          const updatedGrad = { ...g, certificateStatus: newStatus };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad));
          }
          return updatedGrad;
        }
        return g;
      })
    );

    if (approvedTargetCred) {
      const credObj = approvedTargetCred as IssuedCredential;
      const cand = candidates.find((c) => c.id === credObj.candidateId);
      if (cand) {
        transferCandidateToGraduateRegister(cand, credObj);
      }
    }

    setPublicNetworkRevision((r) => r + 1);
  };

  const submitReplacementRequest = (
    reqData: Omit<CertificateReplacementRequest, 'id' | 'schoolId' | 'requestedDate' | 'status'>
  ): CertificateReplacementRequest => {
    const newReq: CertificateReplacementRequest = {
      ...reqData,
      id: `rep-${Date.now()}`,
      schoolId: activeSchoolId,
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
    };
    setReplacementRequests((prev) => [newReq, ...prev]);

    const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId);
    if (auth.currentUser?.emailVerified && ownerUid) {
      runCloudTask(createReplacementRequestInCloud(activeSchoolId, ownerUid, newReq));
    }

    return newReq;
  };

  const processReplacementRequest = (
    requestId: string,
    approve: boolean,
    adminNote: string
  ): IssuedCredential | null => {
    const req = replacementRequests.find((r) => r.id === requestId);
    if (!req) return null;

    if (!approve) {
      const declinedReq: CertificateReplacementRequest = { ...req, status: 'Declined' };
      setReplacementRequests((prev) =>
        prev.map((r) => (r.id === requestId ? declinedReq : r))
      );
      if (canWriteSchoolAdminInCloud(activeSchoolId)) {
        runCloudTask(updateReplacementRequestInCloud(activeSchoolId, declinedReq));
      }
      return null;
    }

    const originalCred = issuedCredentials.find((c) => c.id === req.originalCertificateId);
    if (!originalCred) return null;

    const prefix = school.code.split('-')[0] || 'SCH';
    const year = new Date().getFullYear();
    const newSerial = `${prefix}-${year}-REPL-${String(issuedCredentials.length + 201).padStart(4, '0')}`;

    // Mark original credential as Replaced (preserved in register!)
    updateCredentialStatus(
      originalCred.id,
      'Replaced',
      `Officially replaced by ${newSerial} (${req.reason}: ${adminNote})`,
      newSerial
    );

    const res = issueDigitalCredential({
      certificateNumber: newSerial,
      candidateId: originalCred.candidateId,
      candidateNumber: originalCred.candidateNumber,
      recipientFullName: req.requesterName || originalCred.recipientFullName,
      programmeId: originalCred.programmeId,
      programmeTitle: originalCred.programmeTitle,
      credentialType: originalCred.credentialType,
      qualificationAwarded: originalCred.qualificationAwarded,
      levelCompletedLabel: originalCred.levelCompletedLabel,
      honoursOrDistinction: originalCred.honoursOrDistinction,
      creditHoursCompleted: originalCred.creditHoursCompleted,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: originalCred.expiryDate,
      status: 'Valid',
      awardingAuthorityName: originalCred.awardingAuthorityName,
      professionalBodyAffiliationNote: originalCred.professionalBodyAffiliationNote,
      templateId: originalCred.templateId,
      signatoriesSnapshot: signatories.slice(0, 3).map((s) => ({
        name: s.name,
        title: s.title,
        signatureDataUrl: s.signatureDataUrl,
      })),
      approvalNote: `Authorised Replacement Credential superseding ${originalCred.certificateNumber}. ${adminNote}`,
    });

    if (res.credential) {
      const approvedReq: CertificateReplacementRequest = {
        ...req,
        status: 'Approved & Re-issued',
        newCertificateNumber: res.credential.certificateNumber,
      };
      setReplacementRequests((prev) =>
        prev.map((r) => (r.id === requestId ? approvedReq : r))
      );
      if (canWriteSchoolAdminInCloud(activeSchoolId)) {
        runCloudTask(updateReplacementRequestInCloud(activeSchoolId, approvedReq));
      }

      setGraduateRecords((prev) =>
        prev.map((g) => {
          if (g.certificateNumber !== originalCred.certificateNumber) return g;
          const updatedGrad: GraduateAlumniRecord = {
            ...g,
            fullName: res.credential!.recipientFullName,
            certificateNumber: res.credential!.certificateNumber,
            verificationCode: res.credential!.verificationCode,
            certificateStatus: 'Valid',
          };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad));
          }
          return updatedGrad;
        })
      );
      return res.credential;
    }
    return null;
  };

  const updateGraduateProfile = (
    graduateId: string,
    data: Partial<Pick<GraduateAlumniRecord, 'email' | 'phone' | 'directoryConsent' | 'currentEmployerOrRole'>>
  ) => {
    const targetGrad = graduateRecords.find((g) => g.id === graduateId);
    setGraduateRecords((prev) => prev.map((g) => (g.id === graduateId ? { ...g, ...data } : g)));
    if (targetGrad) {
      const updatedGrad = { ...targetGrad, ...data };
      const fb = auth.currentUser;
      if (canWriteSchoolAdminInCloud(activeSchoolId)) {
        const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb!.uid;
        runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad, false));
      } else if (
        fb &&
        fb.emailVerified &&
        fb.email &&
        targetGrad.email.toLowerCase() === fb.email.toLowerCase()
      ) {
        const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || fb.uid;
        runCloudTask(upsertGraduateInCloud(activeSchoolId, ownerUid, school.name, school.code, updatedGrad, true));
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === targetGrad.candidateId
            ? {
                ...c,
                email: data.email ?? c.email,
                phone: data.phone ?? c.phone,
                directoryConsent: data.directoryConsent ?? c.directoryConsent,
                headlineOrRole: data.currentEmployerOrRole ?? c.headlineOrRole,
              }
            : c
        )
      );
    }
    setPublicNetworkRevision((r) => r + 1);
  };

  const addAccreditation = (accData: Omit<InstitutionalAccreditation, 'id' | 'schoolId'>): InstitutionalAccreditation => {
    const newAcc: InstitutionalAccreditation = {
      ...accData,
      id: `acc-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
    };
    setAccreditations((prev) => [newAcc, ...prev]);
    return newAcc;
  };

  const updateAccreditation = (id: string, data: Partial<InstitutionalAccreditation>) => {
    setAccreditations((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };

  // ============================================================================
  // CROSS-INSTITUTION PUBLIC EMPLOYER CREDENTIAL VERIFICATION & DIRECTORY
  // ============================================================================

  const getAllCredentialsAcrossNetwork = (): { cred: IssuedCredential; schoolId: string }[] => {
    const seenCertNumbers = new Set<string>();
    const results: { cred: IssuedCredential; schoolId: string }[] = [];

    // 1. Live Cloud Firestore public credentials (global source of truth across devices)
    for (const pc of cloudPublicCreds) {
      const certNum = String(pc.certificateNumber || '').toUpperCase();
      if (!certNum || seenCertNumbers.has(certNum)) continue;
      seenCertNumbers.add(certNum);
      results.push({
        schoolId: pc.schoolId || activeSchoolId,
        cred: {
          id: pc.credentialId || pc.certificateKey,
          schoolId: pc.schoolId || activeSchoolId,
          schoolName: pc.issuingInstitutionName || school.name,
          schoolCode: pc.issuingInstitutionCode || school.code,
          schoolCrest: pc.issuingInstitutionCrest || school.crest,
          certificateNumber: pc.certificateNumber,
          verificationCode: pc.verificationCode,
          candidateId: '',
          candidateNumber: pc.candidateNumber || '',
          recipientFullName: pc.recipientFullName,
          programmeId: '',
          programmeTitle: pc.programmeTitle,
          credentialType: pc.credentialType,
          qualificationAwarded: pc.qualificationAwarded,
          levelCompletedLabel: pc.levelCompletedLabel,
          honoursOrDistinction: pc.honoursOrDistinction,
          creditHoursCompleted: 0,
          issueDate: pc.issueDate,
          expiryDate: pc.expiryDate,
          status: pc.status,
          replacedByCertificateNumber: pc.replacedByCertificateNumber,
          revocationOrStatusReason: pc.revocationOrStatusReason,
          awardingAuthorityName: pc.awardingAuthorityName,
          professionalBodyAffiliationNote: pc.professionalBodyAffiliationNote,
          templateId: '',
          signatoriesSnapshot: [],
          auditTrail: [],
        },
      });
    }

    // 2. Active school credentials
    issuedCredentials.forEach((cred) => {
      const certNum = cred.certificateNumber.toUpperCase();
      if (!seenCertNumbers.has(certNum)) {
        seenCertNumbers.add(certNum);
        results.push({ cred, schoolId: activeSchoolId });
      }
    });

    // 3. Other local seeded/cached schools
    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      const tenant = loadTenantData(s.id);
      (tenant.issuedCredentials || []).forEach((cred) => {
        const certNum = cred.certificateNumber.toUpperCase();
        if (!seenCertNumbers.has(certNum)) {
          seenCertNumbers.add(certNum);
          results.push({ cred, schoolId: s.id });
        }
      });
    }
    return results;
  };

  const appendVerificationLogToSchool = (targetSchoolId: string, logEntry: EmployerVerificationLog) => {
    if (targetSchoolId === activeSchoolId) {
      setVerificationLogs((prev) => [logEntry, ...prev]);
    } else {
      try {
        const tenant = loadTenantData(targetSchoolId);
        const updatedLogs = [logEntry, ...(tenant.verificationLogs || [])];
        localStorage.setItem(
          TENANT_STORAGE_PREFIX + targetSchoolId,
          JSON.stringify({ ...tenant, verificationLogs: updatedLogs })
        );
      } catch (e) {
        console.error('Error recording cross-school verification log', e);
      }
    }

    const ownerUid = getEffectiveSchoolOwnerUid(targetSchoolId);
    if (auth.currentUser?.emailVerified && ownerUid) {
      runCloudTask(createVerificationLogInCloud(targetSchoolId, ownerUid, logEntry));
    }
  };

  const verifyCredentialPublic = (
    query: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ): PublicCredentialVerificationResult => {
    const cleanQuery = query.trim().toUpperCase();
    const verifiedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const allCreds = getAllCredentialsAcrossNetwork();

    const matched = allCreds.find(
      ({ cred }) =>
        cred.certificateNumber.toUpperCase() === cleanQuery ||
        cred.verificationCode.toUpperCase() === cleanQuery
    );

    const logEntry: EmployerVerificationLog = {
      id: `vlog-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      schoolId: matched ? matched.schoolId : activeSchoolId,
      timestamp: verifiedAt.slice(0, 16) + ' UTC',
      queriedReference: cleanQuery,
      matchedCertificateNumber: matched?.cred.certificateNumber,
      recipientName: matched?.cred.recipientFullName,
      verifierOrganization: verifierMeta?.organization?.trim() || 'Public Portal / QR Verification',
      verifierContactName: verifierMeta?.contactName?.trim() || 'Unauthenticated Third-Party Verifier',
      verificationPurpose: verifierMeta?.purpose?.trim() || 'Credential Authenticity Check',
      lookupMode: verifierMeta?.mode || 'Single Lookup / QR Scan',
      resultStatus: matched ? matched.cred.status : 'Not Found',
    };

    appendVerificationLogToSchool(matched ? matched.schoolId : activeSchoolId, logEntry);

    if (!matched) {
      return {
        found: false,
        queriedReference: cleanQuery,
        verifiedAt,
      };
    }

    const c = matched.cred;
    // Check automatic expiry if expiryDate is past
    let effectiveStatus = c.status;
    if (c.status === 'Valid' && c.expiryDate && new Date(c.expiryDate) < new Date()) {
      effectiveStatus = 'Expired';
    }

    return {
      found: true,
      queriedReference: cleanQuery,
      verifiedAt,
      status: effectiveStatus,
      certificateNumber: c.certificateNumber,
      verificationCode: c.verificationCode,
      recipientFullName: c.recipientFullName,
      candidateNumber: c.candidateNumber,
      issuingInstitutionName: c.schoolName,
      issuingInstitutionCode: c.schoolCode,
      issuingInstitutionCrest: c.schoolCrest,
      awardingAuthorityName: c.awardingAuthorityName,
      professionalBodyAffiliationNote: c.professionalBodyAffiliationNote,
      credentialType: c.credentialType,
      programmeTitle: c.programmeTitle,
      qualificationAwarded: c.qualificationAwarded,
      levelCompletedLabel: c.levelCompletedLabel,
      honoursOrDistinction: c.honoursOrDistinction,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      replacedByCertificateNumber: c.replacedByCertificateNumber,
      revocationOrStatusReason: c.revocationOrStatusReason,
    };
  };

  const verifyCredentialPublicAsync = async (
    queryStr: string,
    verifierMeta?: {
      organization?: string;
      contactName?: string;
      purpose?: string;
      mode?: EmployerVerificationLog['lookupMode'];
    }
  ): Promise<PublicCredentialVerificationResult> => {
    const cloudRes = await lookupPublicCredentialInCloud(queryStr);
    if (cloudRes && cloudRes.found) {
      return cloudRes;
    }
    return verifyCredentialPublic(queryStr, verifierMeta);
  };

  const verifyCredentialsBatch = (
    queries: string[],
    verifierMeta: { organization: string; contactName: string; purpose: string }
  ): PublicCredentialVerificationResult[] => {
    const cleaned = Array.from(
      new Set(
        queries
          .map((q) => q.trim())
          .filter(Boolean)
      )
    );
    return cleaned.map((q) =>
      verifyCredentialPublic(q, {
        ...verifierMeta,
        mode: 'Employer Batch Verification',
      })
    );
  };

  const allPublicDirectoryGraduates = React.useMemo(() => {
    const seenCerts = new Set<string>();
    const list: (GraduateAlumniRecord & { institutionName: string; institutionCode: string })[] = [];

    for (const cg of cloudPublicGraduates) {
      const key = cg.certificateNumber.toUpperCase();
      if (!seenCerts.has(key)) {
        seenCerts.add(key);
        list.push(cg);
      }
    }

    graduateRecords
      .filter((g) => g.directoryConsent && g.certificateStatus === 'Valid')
      .forEach((g) => {
        const key = g.certificateNumber.toUpperCase();
        if (!seenCerts.has(key)) {
          seenCerts.add(key);
          list.push({ ...g, institutionName: school.name, institutionCode: school.code });
        }
      });

    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      const tenant = loadTenantData(s.id);
      (tenant.graduateRecords || [])
        .filter((g) => g.directoryConsent && g.certificateStatus === 'Valid')
        .forEach((g) => {
          const key = g.certificateNumber.toUpperCase();
          if (!seenCerts.has(key)) {
            seenCerts.add(key);
            list.push({ ...g, institutionName: s.name, institutionCode: s.code });
          }
        });
    }
    return list;
  }, [cloudPublicGraduates, graduateRecords, schools, activeSchoolId, school.name, school.code, publicNetworkRevision]);

  const samplePublicCredentials = React.useMemo(() => {
    const all = getAllCredentialsAcrossNetwork();
    return all.slice(0, 6).map(({ cred }) => ({
      label: `${cred.recipientFullName} (${cred.status})`,
      certificateNumber: cred.certificateNumber,
      verificationCode: cred.verificationCode,
      status: cred.status,
      institutionCode: cred.schoolCode,
    }));
  }, [cloudPublicCreds, issuedCredentials, schools, activeSchoolId, publicNetworkRevision]);

  // ============================================================================
  // AUTHENTICATION (SUPPORTS STAFF, TEACHERS, STUDENTS & GRADUATES)
  // ============================================================================

  const matchUserOrStudentInTenant = (
    tenant: SchoolTenantData,
    rawIdentifier: string
  ): UserAccount | null => {
    const trimmed = rawIdentifier.trim().toLowerCase();

    // 1. Direct email match in users
    const byEmail = tenant.users.find((u) => u.email.toLowerCase() === trimmed);
    if (byEmail) return byEmail;

    // 2. Match by Candidate Number
    const matchedCand = (tenant.candidates || []).find(
      (c) => c.candidateNumber.toLowerCase() === trimmed || c.email.toLowerCase() === trimmed
    );
    if (matchedCand) {
      const existingUser = tenant.users.find(
        (u) => u.candidateId === matchedCand.id || u.studentId === matchedCand.studentId
      );
      if (existingUser) return existingUser;
      return {
        id: `usr-cand-${matchedCand.id}`,
        name: `${matchedCand.firstName} ${matchedCand.lastName}`,
        email: matchedCand.email,
        role: matchedCand.status === 'Completed / Graduated' ? 'graduate' : 'student',
        title:
          matchedCand.status === 'Completed / Graduated'
            ? `Graduate (${matchedCand.candidateNumber})`
            : `Level ${matchedCand.currentLevel} Candidate (${matchedCand.candidateNumber})`,
        avatar: matchedCand.photo,
        schoolId: tenant.school.id,
        candidateId: matchedCand.id,
        studentId: matchedCand.studentId,
      };
    }

    // 3. Match by Student Number (e.g., KRI-2025-0001, PRE-2025-0101, MSS-2025-001)
    const matchedStu = tenant.students.find((s) => s.studentNumber.toLowerCase() === trimmed);
    if (matchedStu) {
      const existingUser = tenant.users.find((u) => u.studentId === matchedStu.id);
      if (existingUser) return existingUser;
      return {
        id: `usr-stu-${matchedStu.id}`,
        name: `${matchedStu.firstName} ${matchedStu.lastName}`,
        email: `${matchedStu.firstName.toLowerCase()}.${matchedStu.lastName.toLowerCase()}@student.edu.gh`,
        role: matchedStu.status === 'Graduated' ? 'graduate' : 'student',
        title: `Student (${matchedStu.studentNumber})`,
        avatar: matchedStu.photo,
        schoolId: tenant.school.id,
        studentId: matchedStu.id,
        assignedClassId: matchedStu.classId,
      };
    }

    return null;
  };

  const routeLandingModuleForRole = (role: RoleType) => {
    if (role === 'student' || role === 'graduate' || role === 'parent') {
      setActiveModule('parent-portal');
    } else if (school.levelType === 'Professional Institute') {
      setActiveModule('professional-credentials');
    } else {
      setActiveModule('dashboard');
    }
  };

  const loginWithEmail = (
    identifier: string,
    password?: string,
    targetSchoolId?: string,
    loginMode?: 'staff' | 'student'
  ) => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { success: false, message: 'Please enter an email address or Student/Candidate ID.' };
    }

    if (schools.length === 0) {
      return {
        success: false,
        message:
          'No schools or institutes have been registered yet. Sign in with Google as the Platform Owner to register your first institution.',
      };
    }

    const verifyPasswordIfPresent = (account: UserAccount): boolean => {
      if (!account.password || !password) return true;
      return account.password === password;
    };

    // 1. Check specified school first if different from activeSchoolId
    if (targetSchoolId && targetSchoolId !== activeSchoolId) {
      const targetTenant = loadTenantData(targetSchoolId);
      const matchedInTarget = matchUserOrStudentInTenant(targetTenant, trimmed);
      if (matchedInTarget) {
        if (!verifyPasswordIfPresent(matchedInTarget)) {
          return { success: false, message: 'Incorrect password or PIN for this account.' };
        }
        switchSchool(targetSchoolId);
        setCurrentUser(matchedInTarget);
        setIsAuthenticated(true);
        if (matchedInTarget.role === 'student' || matchedInTarget.role === 'graduate' || matchedInTarget.role === 'parent') {
          setActiveModule('parent-portal');
        } else if (isInstituteLevelType(targetTenant.school.levelType)) {
          setActiveModule('professional-credentials');
        } else {
          setActiveModule('dashboard');
        }
        return { success: true };
      }
      switchSchool(targetSchoolId);
    }

    // 2. Check active school
    const activeSnapshot = buildCurrentTenantSnapshot();
    const matchedInActive = matchUserOrStudentInTenant(activeSnapshot, trimmed);
    if (matchedInActive) {
      if (!verifyPasswordIfPresent(matchedInActive)) {
        return { success: false, message: 'Incorrect password or PIN for this account.' };
      }
      if (!users.some((u) => u.id === matchedInActive.id)) {
        setUsers((prev) => [...prev, matchedInActive]);
      }
      setCurrentUser(matchedInActive);
      setIsAuthenticated(true);
      routeLandingModuleForRole(matchedInActive.role);
      return { success: true };
    }

    // 3. Check other registered schools
    for (const otherSchool of schools) {
      if (otherSchool.id === activeSchoolId) continue;
      const otherTenant = loadTenantData(otherSchool.id);
      const matchedInOther = matchUserOrStudentInTenant(otherTenant, trimmed);
      if (matchedInOther) {
        if (!verifyPasswordIfPresent(matchedInOther)) {
          return { success: false, message: 'Incorrect password or PIN for this account.' };
        }
        switchSchool(otherSchool.id);
        setCurrentUser(matchedInOther);
        setIsAuthenticated(true);
        if (matchedInOther.role === 'student' || matchedInOther.role === 'graduate' || matchedInOther.role === 'parent') {
          setActiveModule('parent-portal');
        } else if (isInstituteLevelType(otherTenant.school.levelType)) {
          setActiveModule('professional-credentials');
        } else {
          setActiveModule('dashboard');
        }
        return { success: true };
      }
    }

    return {
      success: false,
      message:
        loginMode === 'student'
          ? 'No matching Student / Candidate ID or email found in this institution.'
          : 'No matching administrator or staff account found for this email. Ask the school owner or Platform Owner to add your administrator profile.',
    };
  };

  const signInWithGoogle = async (
    preferredMode: 'staff' | 'student' = 'staff'
  ): Promise<{ success: boolean; isPlatformAdmin?: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser.email) {
        return { success: false, message: 'Google account did not return an email address.' };
      }

      const verifiedOwner = Boolean(fbUser.emailVerified && isBootstrappedAdminUser(fbUser));
      const emailLower = fbUser.email.toLowerCase();
      await syncAuthenticatedUserProfile(
        fbUser,
        activeSchoolId,
        preferredMode === 'student'
          ? 'Verified Student / Candidate'
          : verifiedOwner
          ? 'Platform Owner & Super Administrator'
          : 'Institutional Administrator'
      );

      // When no schools exist yet, keep the Platform Owner on the onboarding screen ready to register their first school
      if (schools.length === 0) {
        if (verifiedOwner) {
          return { success: true, isPlatformAdmin: true };
        }
        return {
          success: false,
          isPlatformAdmin: false,
          message:
            'No schools or institutes are registered on this platform yet. Please message the Platform Owner on WhatsApp (+233 207615941) for onboarding.',
        };
      }

      // Check if this Google email already matches a user, candidate, or student in active school
      const activeSnapshot = buildCurrentTenantSnapshot();
      const matchedInActive = matchUserOrStudentInTenant(activeSnapshot, emailLower);
      if (matchedInActive) {
        const enriched: UserAccount = {
          ...matchedInActive,
          name: fbUser.displayName || matchedInActive.name,
          avatar: fbUser.photoURL || matchedInActive.avatar,
          role: verifiedOwner && preferredMode !== 'student' ? 'proprietor' : matchedInActive.role,
          title:
            verifiedOwner && preferredMode !== 'student'
              ? 'Platform Owner & Super Administrator'
              : matchedInActive.title,
        };
        setUsers((prev) =>
          prev.some((u) => u.id === enriched.id)
            ? prev.map((u) => (u.id === enriched.id ? enriched : u))
            : [enriched, ...prev]
        );
        setCurrentUser(enriched);
        setIsAuthenticated(true);
        routeLandingModuleForRole(enriched.role);
        return { success: true, isPlatformAdmin: verifiedOwner };
      }

      // Check other institutions for an existing student/candidate/staff match
      if (!verifiedOwner) {
        for (const otherSchool of schools) {
          if (otherSchool.id === activeSchoolId) continue;
          const otherTenant = loadTenantData(otherSchool.id);
          const matchedInOther = matchUserOrStudentInTenant(otherTenant, emailLower);
          if (matchedInOther) {
            switchSchool(otherSchool.id);
            const enriched: UserAccount = {
              ...matchedInOther,
              name: fbUser.displayName || matchedInOther.name,
              avatar: fbUser.photoURL || matchedInOther.avatar,
            };
            setCurrentUser(enriched);
            setIsAuthenticated(true);
            if (enriched.role === 'student' || enriched.role === 'graduate' || enriched.role === 'parent') {
              setActiveModule('parent-portal');
            } else if (isInstituteLevelType(otherTenant.school.levelType)) {
              setActiveModule('professional-credentials');
            } else {
              setActiveModule('dashboard');
            }
            return { success: true, isPlatformAdmin: false };
          }
        }

        if (preferredMode !== 'student') {
          return {
            success: false,
            isPlatformAdmin: false,
            message:
              'Your Google email is not registered as an administrator for this institution. Please sign in with a registered administrator account or contact the Platform Owner.',
          };
        }
      }

      // Provision a verified session account for Platform Owner or verified student learner
      const displayName =
        fbUser.displayName ||
        emailLower.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const assignedRole: RoleType = preferredMode === 'student' && !verifiedOwner ? 'student' : 'proprietor';
      const newGoogleAccount: UserAccount = {
        id: fbUser.uid,
        name: displayName,
        email: emailLower,
        role: assignedRole,
        title:
          assignedRole === 'student'
            ? `Verified Learner (${school.code})`
            : verifiedOwner
            ? 'Platform Owner & Super Administrator'
            : `Institutional Administrator (${school.code})`,
        avatar:
          fbUser.photoURL ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        schoolId: activeSchoolId,
        signatureDataUrl: makeCalligraphicSignatureSvg(displayName),
        signatureMethod: 'drawn',
      };

      setUsers((prev) =>
        prev.some((u) => u.id === newGoogleAccount.id || u.email.toLowerCase() === emailLower)
          ? prev.map((u) =>
              u.id === newGoogleAccount.id || u.email.toLowerCase() === emailLower ? newGoogleAccount : u
            )
          : [newGoogleAccount, ...prev]
      );
      setCurrentUser(newGoogleAccount);
      setIsAuthenticated(true);
      routeLandingModuleForRole(assignedRole);
      return { success: true, isPlatformAdmin: verifiedOwner };
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'Google sign-in popup was closed before completing authentication.' };
      }
      if (code === 'auth/popup-blocked') {
        return { success: false, message: 'Popup was blocked by your browser. Please allow popups for this site and try again.' };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google authentication failed. Please try again.',
      };
    }
  };

  const logout = () => {
    signOut(auth).catch((err) => console.error('Firebase sign-out error:', err));
    setIsAuthenticated(false);
  };

  // ============================================================================
  // EXISTING SCHOOL CRUD OPERATIONS
  // ============================================================================

  const FEATURE_REQUESTS_KEY = 'edughana_feature_requests_v1';
  const [customFeatureRequests, setCustomFeatureRequests] = useState<CustomFeatureRequest[]>(() => {
    try {
      const stored = localStorage.getItem(FEATURE_REQUESTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (r: CustomFeatureRequest) => r && r.schoolId && !isRemovedSampleSchoolId(r.schoolId)
          );
          localStorage.setItem(FEATURE_REQUESTS_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Error loading custom feature requests', e);
    }
    return INITIAL_CUSTOM_REQUESTS;
  });

  const isModuleEnabled = (moduleId: string): boolean => {
    if (school.enabledModules && Array.isArray(school.enabledModules)) {
      return school.enabledModules.includes(moduleId);
    }
    const defaultModules = getDefaultModulesForSchool(school.id);
    return defaultModules.includes(moduleId);
  };

  const toggleSchoolModule = (moduleId: string) => {
    const currentList =
      school.enabledModules && Array.isArray(school.enabledModules)
        ? [...school.enabledModules]
        : getDefaultModulesForSchool(school.id);

    const isCurrentlyOn = currentList.includes(moduleId);
    const updatedList = isCurrentlyOn
      ? currentList.filter((id) => id !== moduleId)
      : [...currentList, moduleId];

    updateSchoolProfile({ enabledModules: updatedList });
  };

  const requestCustomFeature = (req: {
    title: string;
    category: string;
    description: string;
    urgency?: 'Standard' | 'Priority' | 'Critical Bespoke';
  }) => {
    const newReq: CustomFeatureRequest = {
      id: `cfr-${Date.now()}`,
      schoolId: school.id,
      schoolName: school.name,
      title: req.title,
      category: req.category,
      description: req.description,
      urgency: req.urgency || 'Standard',
      requestedBy: currentUser.name || 'School Administrator',
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'Under Review',
    };
    setCustomFeatureRequests((prev) => {
      const updated = [newReq, ...prev];
      localStorage.setItem(FEATURE_REQUESTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addStudent = (data: any): Student => {
    const nextNum = students.length + 1;
    const prefix = school.code.split('-')[0] || 'STU';
    const studentNumber = `${prefix}-2025-${String(nextNum).padStart(4, '0')}`;
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      studentNumber,
      status: 'Active',
      photo: data.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      admissionDate: new Date().toISOString().split('T')[0],
      ...data,
    };
    setStudents((prev) => [newStudent, ...prev]);

    // Also create a Student Login Account automatically so the student can log in and view their portal
    const stuEmail = `${newStudent.firstName.toLowerCase()}.${newStudent.lastName.toLowerCase()}@student.${prefix.toLowerCase()}.edu.gh`;
    addUserAccount({
      name: `${newStudent.firstName} ${newStudent.lastName}`,
      email: stuEmail,
      password: 'student123',
      role: 'student',
      title: `Student (${studentNumber})`,
      avatar: newStudent.photo,
      studentId: newStudent.id,
      assignedClassId: newStudent.classId,
    });

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertStudentInCloud(activeSchoolId, ownerUid, newStudent, stuEmail));
    }

    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertStudentInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setExamResults((prev) => prev.filter((r) => r.studentId !== id));
    setAttendance((prev) => prev.filter((a) => a.studentId !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteStudentInCloud(activeSchoolId, id));
    }
  };

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setStaffAttendance((prev) => prev.filter((a) => a.staffId !== id));
  };

  const deleteAdmission = (id: string) => {
    setAdmissions((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const deleteBook = (id: string) => {
    setLibraryBooks((prev) => prev.filter((b) => b.id !== id));
    setBookLoans((prev) => prev.filter((l) => l.bookId !== id));
  };

  const addAdmission = (data: any) => {
    const nextNum = admissions.length + 1;
    const prefix = school.code.split('-')[0] || 'APP';
    const newApp: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      applicationNumber: `${prefix}-APP-2026-${String(nextNum).padStart(3, '0')}`,
      status: 'Pending',
      submittedDate: new Date().toISOString().split('T')[0],
      documentsUploaded: ['BECE_Result_Slip.pdf', 'Birth_Certificate.pdf'],
      ...data,
    };
    setAdmissions((prev) => [newApp, ...prev]);
  };

  const updateAdmissionStatus = (id: string, status: AdmissionApplication['status']) => {
    setAdmissions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const recordAttendance = (classId: string, date: string, studentStatuses: Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>) => {
    const remaining = attendance.filter((a) => !(a.classId === classId && a.date === date));
    const newRecords: AttendanceRecord[] = Object.entries(studentStatuses).map(([stuId, status]) => ({
      id: `att-${Date.now()}-${stuId}`,
      date,
      classId,
      studentId: stuId,
      status,
      recordedByTeacherId: currentUser.id,
    }));
    setAttendance([...remaining, ...newRecords]);
  };

  const saveExamResult = (resultData: Partial<ExamResult> & { studentId: string; subjectId: string; classId: string; classScore: number; examScore: number }) => {
    const total = Math.min(100, Math.max(0, resultData.classScore + resultData.examScore));
    const gradeDetails = calculateWassceGrade(total);
    let savedRes: ExamResult | null = null;

    setExamResults((prev) => {
      const existingIndex = prev.findIndex(
        (r) =>
          r.studentId === resultData.studentId &&
          r.subjectId === resultData.subjectId &&
          r.term === (resultData.term || school.currentTerm) &&
          r.academicYear === (resultData.academicYear || school.currentAcademicYear)
      );

      const updatedRecord: ExamResult = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `res-${Date.now()}`,
        studentId: resultData.studentId,
        classId: resultData.classId,
        subjectId: resultData.subjectId,
        term: resultData.term || school.currentTerm,
        academicYear: resultData.academicYear || school.currentAcademicYear,
        classScore: resultData.classScore,
        examScore: resultData.examScore,
        totalScore: total,
        grade: gradeDetails.grade,
        remarks: gradeDetails.interpretation,
        verified: resultData.verified ?? false,
        published: resultData.published ?? false,
      };
      savedRes = updatedRecord;

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = updatedRecord;
        return copy;
      }
      return [...prev, updatedRecord];
    });

    if (savedRes && canWriteSchoolAdminInCloud(activeSchoolId)) {
      const rec = savedRes as ExamResult;
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const stu = students.find((s) => s.id === rec.studentId);
      const stuAccount = users.find((u) => u.studentId === rec.studentId);
      runCloudTask(
        (async () => {
          if (stu) await upsertStudentInCloud(activeSchoolId, ownerUid, stu, stuAccount?.email);
          await upsertExamResultInCloud(
            activeSchoolId,
            ownerUid,
            rec,
            stuAccount?.email || 'student@school.edu.gh'
          );
        })()
      );
    }
  };

  const publishResults = (classId: string) => {
    setExamResults((prev) =>
      prev.map((r) => {
        if (r.classId === classId && r.term === school.currentTerm && r.academicYear === school.currentAcademicYear) {
          const publishedRec = { ...r, verified: true, published: true };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            const stuAccount = users.find((u) => u.studentId === r.studentId);
            runCloudTask(
              upsertExamResultInCloud(
                activeSchoolId,
                ownerUid,
                publishedRec,
                stuAccount?.email || 'student@school.edu.gh'
              )
            );
          }
          return publishedRec;
        }
        return r;
      })
    );
  };

  const recordFeePayment = (paymentData: Omit<FeePayment, 'id' | 'receiptNumber' | 'date'>): FeePayment => {
    const nextReceiptNum = feePayments.length + 1;
    const prefix = school.code.split('-')[0] || 'RCP';
    const receiptNumber = `${prefix}-RCP-2025-${String(nextReceiptNum).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newPayment: FeePayment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      date: today,
      ...paymentData,
    };

    setFeePayments((prev) => [newPayment, ...prev]);

    // Also update linked candidate fee balance if applicable
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.studentId === paymentData.studentId || c.id === paymentData.studentId) {
          const updatedCand = { ...c, totalFeesPaid: c.totalFeesPaid + paymentData.amountPaid };
          if (canWriteSchoolAdminInCloud(activeSchoolId)) {
            const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
            runCloudTask(upsertCandidateInCloud(activeSchoolId, ownerUid, updatedCand));
          }
          return updatedCand;
        }
        return c;
      })
    );

    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      const stuAccount = users.find((u) => u.studentId === newPayment.studentId || u.candidateId === newPayment.studentId);
      const cand = candidates.find((c) => c.id === newPayment.studentId || c.studentId === newPayment.studentId);
      runCloudTask(
        createFeePaymentInCloud(
          activeSchoolId,
          ownerUid,
          newPayment,
          cand?.email || stuAccount?.email || 'student@school.edu.gh'
        )
      );
    }

    const newTxn: SchoolTransaction = {
      id: `txn-${Date.now()}`,
      type: 'Income',
      category: 'School Fees',
      amount: newPayment.amountPaid,
      date: today,
      reference: newPayment.transactionRef || receiptNumber,
      description: `Fees received from ${newPayment.payerName} (${newPayment.paymentMethod})`,
      approvedBy: currentUser.name,
    };
    setTransactions((prev) => [newTxn, ...prev]);

    return newPayment;
  };

  const recordTransaction = (txn: Omit<SchoolTransaction, 'id' | 'date'>) => {
    setTransactions((prev) => [
      { id: `txn-${Date.now()}`, date: new Date().toISOString().split('T')[0], ...txn },
      ...prev,
    ]);
  };

  const addStaff = (data: Omit<StaffMember, 'id' | 'staffId'>) => {
    const nextId = staff.length + 1;
    const prefix = school.code.split('-')[0] || 'STF';
    setStaff((prev) => [
      { id: `stf-${Date.now()}`, staffId: `${prefix}-STF-${String(nextId).padStart(3, '0')}`, ...data },
      ...prev,
    ]);
  };

  const updateStaff = (id: string, data: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const issueBookLoan = (bookId: string, studentId: string, dueDate: string) => {
    const newLoan: BookLoan = {
      id: `ln-${Date.now()}`,
      bookId,
      studentId,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'Active',
    };
    setBookLoans((prev) => [newLoan, ...prev]);
    setLibraryBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );
  };

  const returnBookLoan = (loanId: string) => {
    const loan = bookLoans.find((l) => l.id === loanId);
    if (!loan) return;
    setBookLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? { ...l, returnDate: new Date().toISOString().split('T')[0], status: 'Returned' }
          : l
      )
    );
    setLibraryBooks((prev) =>
      prev.map((b) => (b.id === loan.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b))
    );
  };

  const addAsset = (asset: Omit<SchoolAsset, 'id'>) => {
    setAssets((prev) => [{ id: `ast-${Date.now()}`, ...asset }, ...prev]);
  };

  const addHealthRecord = (record: Omit<HealthIncident, 'id'>) => {
    setHealthRecords((prev) => [{ id: `hlt-${Date.now()}`, ...record }, ...prev]);
  };

  const sendAnnouncement = (announcement: Omit<SchoolAnnouncement, 'id' | 'sentDate'>) => {
    setAnnouncements((prev) => [
      { id: `anc-${Date.now()}`, sentDate: new Date().toISOString().split('T')[0], ...announcement },
      ...prev,
    ]);
  };

  const resetToDemoData = () => {
    if (!activeSchoolId || activeSchoolId === EMPTY_SCHOOL_ID) return;
    const cleanSlate = getInitialTenantData(activeSchoolId);
    cleanSlate.school = school;
    cleanSlate.users = users;
    cleanSlate.classes = classes;
    cleanSlate.programmes = programmes;
    cleanSlate.certificateTemplates = certificateTemplates;
    applyTenantState(activeSchoolId, cleanSlate, school);
    try {
      localStorage.setItem(TENANT_STORAGE_PREFIX + activeSchoolId, JSON.stringify(cleanSlate));
    } catch (e) {
      console.error('Error clearing workspace records', e);
    }
  };

  const publishResearchArticle = (
    articleData: Omit<ResearchArticle, 'id' | 'publicationDate' | 'viewsCount' | 'downloadsCount' | 'citationsCount' | 'doi'>
  ): ResearchArticle => {
    const year = new Date().getFullYear();
    const cleanSchoolCode = (school.code || 'SCH').toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const newArticle: ResearchArticle = {
      ...articleData,
      id: `art-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
      publicationDate: new Date().toISOString().split('T')[0],
      doi: `10.5281/edughana.${cleanSchoolCode}.${year}.${randomSeq}`,
      viewsCount: 1,
      downloadsCount: 0,
      citationsCount: 0,
    };
    setResearchArticles((prev) => [newArticle, ...prev]);
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
      runCloudTask(upsertResearchArticleInCloud(activeSchoolId, ownerUid, newArticle));
    }
    return newArticle;
  };

  const updateResearchArticle = (id: string, data: Partial<ResearchArticle>) => {
    setResearchArticles((prev) =>
      prev.map((art) => {
        if (art.id !== id) return art;
        const updated = { ...art, ...data };
        if (canWriteSchoolAdminInCloud(activeSchoolId)) {
          const ownerUid = getEffectiveSchoolOwnerUid(activeSchoolId) || auth.currentUser!.uid;
          runCloudTask(upsertResearchArticleInCloud(activeSchoolId, ownerUid, updated));
        }
        return updated;
      })
    );
  };

  const deleteResearchArticle = (id: string) => {
    setResearchArticles((prev) => prev.filter((art) => art.id !== id));
    if (canWriteSchoolAdminInCloud(activeSchoolId)) {
      runCloudTask(deleteResearchArticleInCloud(id));
    }
  };

  const incrementExternalSchoolMetric = (
    articleId: string,
    field: 'viewsCount' | 'downloadsCount' | 'citationsCount'
  ) => {
    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      try {
        const key = TENANT_STORAGE_PREFIX + s.id;
        const storedStr = localStorage.getItem(key);
        const tenantObj: SchoolTenantData = storedStr
          ? JSON.parse(storedStr)
          : getInitialTenantData(s.id);
        const list = Array.isArray(tenantObj.researchArticles)
          ? tenantObj.researchArticles
          : getInitialResearchArticles(s.id);
        if (list.some((a) => a.id === articleId)) {
          tenantObj.researchArticles = list.map((a) =>
            a.id === articleId ? { ...a, [field]: (a[field] || 0) + 1 } : a
          );
          localStorage.setItem(key, JSON.stringify(tenantObj));
          setPublicNetworkRevision((r) => r + 1);
          return;
        }
      } catch (e) {
        console.error('Error updating cross-school article metric', e);
      }
    }
  };

  const recordArticleView = (id: string) => {
    if (researchArticles.some((art) => art.id === id)) {
      setResearchArticles((prev) =>
        prev.map((art) => (art.id === id ? { ...art, viewsCount: (art.viewsCount || 0) + 1 } : art))
      );
    } else {
      incrementExternalSchoolMetric(id, 'viewsCount');
    }
    if (auth.currentUser?.emailVerified) {
      runCloudTask(incrementArticleMetricInCloud(id, 'viewsCount'));
    }
  };

  const recordArticleDownload = (id: string) => {
    if (researchArticles.some((art) => art.id === id)) {
      setResearchArticles((prev) =>
        prev.map((art) => (art.id === id ? { ...art, downloadsCount: (art.downloadsCount || 0) + 1 } : art))
      );
    } else {
      incrementExternalSchoolMetric(id, 'downloadsCount');
    }
    if (auth.currentUser?.emailVerified) {
      runCloudTask(incrementArticleMetricInCloud(id, 'downloadsCount'));
    }
  };

  const recordArticleCitation = (id: string) => {
    if (researchArticles.some((art) => art.id === id)) {
      setResearchArticles((prev) =>
        prev.map((art) => (art.id === id ? { ...art, citationsCount: (art.citationsCount || 0) + 1 } : art))
      );
    } else {
      incrementExternalSchoolMetric(id, 'citationsCount');
    }
    if (auth.currentUser?.emailVerified) {
      runCloudTask(incrementArticleMetricInCloud(id, 'citationsCount'));
    }
  };

  const allPublicResearchArticles = React.useMemo(() => {
    const map = new Map<string, ResearchArticle>();
    researchArticles.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));

    for (const s of schools) {
      if (s.id === activeSchoolId) continue;
      try {
        const storedStr = localStorage.getItem(TENANT_STORAGE_PREFIX + s.id);
        if (storedStr) {
          const parsed: SchoolTenantData = JSON.parse(storedStr);
          if (parsed && Array.isArray(parsed.researchArticles)) {
            parsed.researchArticles.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));
          }
        } else {
          const seeds = getInitialResearchArticles(s.id);
          seeds.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));
        }
      } catch (e) {
        console.error('Error loading public articles from school', s.id, e);
      }
    }

    // Cloud open-access articles take latest metric precedence
    cloudPublicArticles.filter((a) => a.isOpenToPublic).forEach((a) => map.set(a.id, a));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    );
  }, [cloudPublicArticles, researchArticles, schools, activeSchoolId, publicNetworkRevision]);

  const exportDatabaseJSON = (): string => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      schoolId: activeSchoolId,
      ...buildCurrentTenantSnapshot(),
      currentUser,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.school && parsed.students) {
        const hydrated = hydrateProfessionalFields(parsed.school.id || activeSchoolId, parsed);
        applyTenantState(activeSchoolId, hydrated, hydrated.school);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        return true;
      }
    } catch (e) {
      console.error('Import error', e);
    }
    return false;
  };

  const recordBiometricGateEvent = (
    event: Omit<BiometricGateLog, 'id' | 'schoolId' | 'date' | 'timestamp'> & {
      date?: string;
      timestamp?: string;
    }
  ): BiometricGateLog => {
    const newEntry: BiometricGateLog = {
      ...event,
      id: `bgl-${activeSchoolId}-${Date.now()}`,
      schoolId: activeSchoolId,
      date: event.date || getTodayIsoDate(),
      timestamp:
        event.timestamp ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setBiometricGateLogs((prev) => [newEntry, ...prev].slice(0, 100));
    return newEntry;
  };

  return (
    <SchoolContext.Provider
      value={{
        schools,
        activeSchoolId,
        school,
        switchSchool,
        registerSchool,
        deleteSchool,
        currentUser,
        users,
        students,
        classes,
        subjects,
        admissions,
        examResults,
        feeItems,
        feePayments,
        transactions,
        staff,
        staffAttendance,
        timetable,
        attendance,
        libraryBooks,
        bookLoans,
        assets,
        routes,
        boardingHouses,
        healthRecords,
        announcements,
        researchArticles,
        allPublicResearchArticles,
        signatories,
        programmes,
        programmeCourses,
        candidates,
        candidateAssessments,
        certificateTemplates,
        issuedCredentials,
        graduateRecords,
        replacementRequests,
        accreditations,
        verificationLogs,
        biometricGateLogs,
        recordBiometricGateEvent,
        allPublicDirectoryGraduates,
        samplePublicCredentials,
        saveUserSignature,
        upsertSignatory,
        removeSignatory,
        addProgramme,
        updateProgramme,
        deleteProgramme,
        addProgrammeCourse,
        updateProgrammeCourse,
        deleteProgrammeCourse,
        registerCandidate,
        updateCandidate,
        saveCandidateAssessment,
        evaluateCandidateProgression,
        promoteCandidateToNextLevel,
        saveCertificateTemplate,
        issueDigitalCredential,
        updateCredentialStatus,
        submitReplacementRequest,
        processReplacementRequest,
        updateGraduateProfile,
        addAccreditation,
        updateAccreditation,
        verifyCredentialPublic,
        verifyCredentialPublicAsync,
        verifyCredentialsBatch,
        publishResearchArticle,
        updateResearchArticle,
        deleteResearchArticle,
        recordArticleView,
        recordArticleDownload,
        recordArticleCitation,
        activeModule,
        setActiveModule,
        setCurrentUser,
        updateSchoolProfile,
        updateUser,
        updateCurrentUserAvatar,
        addUserAccount,
        deleteUserAccount,
        addStudent,
        updateStudent,
        addAdmission,
        updateAdmissionStatus,
        recordAttendance,
        saveExamResult,
        publishResults,
        recordFeePayment,
        recordTransaction,
        addStaff,
        updateStaff,
        issueBookLoan,
        returnBookLoan,
        addAsset,
        addHealthRecord,
        sendAnnouncement,
        isAuthenticated,
        firebaseUser,
        authReady,
        isCloudSynced,
        isPlatformAdmin,
        signInWithGoogle,
        loginWithEmail,
        logout,
        deleteStudent,
        deleteStaff,
        deleteAdmission,
        deleteAnnouncement,
        deleteAsset,
        deleteBook,
        resetToDemoData,
        exportDatabaseJSON,
        importDatabaseJSON,
        isModuleEnabled,
        toggleSchoolModule,
        customFeatureRequests,
        requestCustomFeature,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
