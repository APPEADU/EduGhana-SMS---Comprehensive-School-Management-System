export type RoleType = 
  | 'proprietor' 
  | 'admin' 
  | 'teacher' 
  | 'accountant' 
  | 'parent' 
  | 'student' 
  | 'graduate'
  | 'librarian' 
  | 'housemaster';

export type InstitutionClassificationType =
  | 'SHS'
  | 'Basic & JHS'
  | 'Combined'
  | 'Professional Institute'
  | 'Vocational Training Centre'
  | 'College / Polytechnic'
  | 'Executive Education';

export type InstitutionCategory = 'institute' | 'basic_school';

export const INSTITUTE_LEVEL_TYPES: readonly InstitutionClassificationType[] = [
  'Professional Institute',
  'Vocational Training Centre',
  'College / Polytechnic',
  'Executive Education',
] as const;

export const BASIC_SCHOOL_LEVEL_TYPES: readonly InstitutionClassificationType[] = [
  'Basic & JHS',
  'SHS',
  'Combined',
] as const;

export const isInstituteLevelType = (levelType?: string): boolean =>
  Boolean(levelType && (INSTITUTE_LEVEL_TYPES as readonly string[]).includes(levelType));

/**
 * Canonical numeric code for standalone / non-chartered Certificate programmes & tracks
 * alongside Level 1 (1), Level 2 (2), and Level 3 (3).
 */
export const INSTITUTE_CERTIFICATE_LEVEL = 4;

export const formatInstituteLevel = (levelNumber: number, customTitle?: string): string => {
  if (customTitle && customTitle.trim().length > 0) {
    return customTitle.trim();
  }
  if (levelNumber === INSTITUTE_CERTIFICATE_LEVEL || levelNumber === 0) {
    return 'Certificate';
  }
  return `Level ${levelNumber}`;
};

export const formatInstituteLevelShort = (levelNumber: number): string => {
  if (levelNumber === INSTITUTE_CERTIFICATE_LEVEL || levelNumber === 0) {
    return 'Certificate';
  }
  return `Level ${levelNumber}`;
};

export interface AuthorizedSignatory {
  id: string;
  userId?: string;
  name: string;
  title: string;
  role: 'Registrar' | 'Head of Institution' | 'Academic Dean' | 'Chief Examiner' | 'Lead Lecturer / Teacher' | 'Council Chair';
  signatureDataUrl: string; // Drawn canvas PNG or uploaded signature PNG/SVG data URL
  signatureMethod: 'drawn' | 'uploaded';
  updatedAt: string;
  active: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: RoleType;
  title: string;
  avatar: string;
  schoolId?: string;
  assignedClassId?: string;
  studentId?: string;
  candidateId?: string;
  graduateId?: string;
  wardStudentIds?: string[];
  signatureDataUrl?: string;
  signatureMethod?: 'drawn' | 'uploaded';
  signatureUpdatedAt?: string;
}

export interface SchoolProfile {
  id: string;
  name: string;
  code: string;
  motto: string;
  crest: string;
  levelType: InstitutionClassificationType;
  region: string;
  district: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
  whatsappEnabled?: boolean;
  email: string;
  currency: string;
  currentAcademicYear: string;
  currentTerm: 'Term 1' | 'Term 2' | 'Term 3' | 'Semester 1' | 'Semester 2';
  termStartDate: string;
  termEndDate: string;
  nextTermBegins: string;
  headmasterName: string;
  headmasterSignature: string;
  headmasterSignatureDataUrl?: string;
  enabledModules?: string[];
  customFeatureRequests?: CustomFeatureRequest[];
  signatories?: AuthorizedSignatory[];
  ownerUid?: string;
}

export interface CustomFeatureRequest {
  id: string;
  schoolId: string;
  schoolName: string;
  title: string;
  category: string;
  description: string;
  urgency: 'Standard' | 'Priority' | 'Critical Bespoke';
  requestedBy: string;
  requestedAt: string;
  status: 'Under Review' | 'In Development' | 'Ready to Deploy' | 'Active';
}

export interface CustomSchoolFeature {
  id: string;
  name: string;
  description: string;
  tagline: string;
  category: 'Operations' | 'Academic' | 'Security & IoT' | 'Finance & Commerce' | 'Community & Alumni';
  icon: string;
  badge?: string;
  tier: 'Core Included' | 'Enterprise Add-On' | 'Bespoke Custom';
  targetAudience: string;
  typicalClients: string;
  moduleId: string;
}


export interface Student {
  id: string;
  studentNumber: string; // e.g. ACH-2025-0142
  firstName: string;
  lastName: string;
  otherNames?: string;
  gender: 'Male' | 'Female';
  dob: string;
  photo: string;
  classId: string;
  stream: string;
  programme?: string; // e.g. General Science, General Arts, Business
  boardingStatus: 'Boarding' | 'Day';
  houseId?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
  emergencyContact: string;
  medicalInfo: string;
  nationalIdOrNHIS?: string;
  previousSchool?: string;
  beceAggregate?: number;
  admissionDate: string;
  status: 'Active' | 'Withdrawn' | 'Graduated' | 'Suspended';
}

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  applicantName: string;
  gender: 'Male' | 'Female';
  dob: string;
  applyingForClass: string;
  programme?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  previousSchool: string;
  beceScore: number;
  status: 'Pending' | 'Interview' | 'Approved' | 'Enrolled' | 'Rejected';
  submittedDate: string;
  documentsUploaded: string[];
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "SHS 2 Science A", "JHS 3 Gold", "Primary 5"
  level: 'Basic' | 'JHS' | 'SHS';
  form: number;
  stream: string;
  formTutorTeacherId: string;
  roomNumber: string;
  capacity: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Core' | 'Elective';
  level: 'Basic' | 'JHS' | 'SHS';
  department: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  studentId: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  reason?: string;
  recordedByTeacherId: string;
}

export interface StaffAttendanceRecord {
  id: string;
  date: string;
  staffId: string;
  checkInTime: string;
  checkOutTime: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
}

export interface ExamResult {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  term: string;
  academicYear: string;
  classScore: number; // usually 30% or 50%
  examScore: number;  // usually 70% or 50%
  totalScore: number; // 0 - 100
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  remarks: string;
  subjectPosition?: number;
  verified: boolean;
  published: boolean;
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  term: string;
  classLevel: 'All' | 'Basic' | 'JHS' | 'SHS' | 'Boarding Only';
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  amountPaid: number;
  paymentMethod: 'MTN Mobile Money' | 'Telecel Cash' | 'AT Money' | 'Bank Transfer' | 'Cash';
  networkNumber?: string;
  transactionRef: string;
  payerName: string;
  payerPhone: string;
  date: string;
  term: string;
  academicYear: string;
  status: 'Completed' | 'Pending' | 'Failed';
  notes?: string;
}

export interface SchoolTransaction {
  id: string;
  type: 'Income' | 'Expense';
  category: 'School Fees' | 'PTA Levy' | 'Staff Payroll' | 'Utilities & Generator' | 'Laboratory & ICT' | 'Maintenance' | 'Boarding Kitchen' | 'Transport & Fuel';
  amount: number;
  date: string;
  reference: string;
  description: string;
  approvedBy: string;
}

export interface StaffMember {
  id: string;
  staffId: string; // e.g. STF-0012
  fullName: string;
  gender: 'Male' | 'Female';
  role: string; // e.g. Senior Master, Mathematics Teacher, Accountant, Nurse
  department: string;
  qualification: string;
  phone: string;
  email: string;
  hireDate: string;
  ssnitNumber: string;
  tinNumber: string;
  basicSalary: number;
  allowances: number;
  activeStatus: boolean;
  photo?: string;
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  staffId: string;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  ssnitEmployee: number; // 5.5%
  ssnitEmployer: number; // 13%
  graPayeTax: number;
  totalDeductions: number;
  netSalary: number;
  status: 'Paid' | 'Processing';
  paymentDate: string;
}

export interface TimetablePeriod {
  id: string;
  classId: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  periodNumber: number; // 1 to 8
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  room: string;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  strand: string;
  subStrand: string;
  contentStandard: string;
  learningIndicator: string;
  coreCompetencies: string;
  resources: string;
  starterPhase: string;
  mainPhase: string[];
  assessment: string;
  homework: string;
  dateCreated: string;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionsCount: number;
  attachments?: string[];
}

export interface OnlineQuiz {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  timeLimitMinutes: number;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }[];
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
}

export interface BookLoan {
  id: string;
  bookId: string;
  studentId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue';
  fineAmount?: number;
}

export interface SchoolAsset {
  id: string;
  name: string;
  category: 'Furniture' | 'IT Equipment' | 'Science Lab' | 'Vehicles' | 'Sports' | 'Facilities';
  quantity: number;
  location: string;
  condition: 'Good' | 'Fair' | 'Needs Repair' | 'Condemned';
  purchaseDate: string;
  custodian: string;
}

export interface TransportRoute {
  id: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  assignedStudentsCount: number;
  stops: string[];
}

export interface BoardingHouse {
  id: string;
  name: string;
  housemasterName: string;
  capacity: number;
  currentBoardersCount: number;
  gender: 'Boys' | 'Girls' | 'Mixed';
  motto: string;
}

export interface HealthIncident {
  id: string;
  studentId: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  nurseName: string;
  parentNotified: boolean;
}

export interface SafeguardingRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'Disciplinary' | 'Counseling' | 'Welfare Support' | 'Bullying Report';
  description: string;
  actionTaken: string;
  counselorName: string;
  status: 'Open' | 'Resolved' | 'Under Review';
}

export interface SchoolAnnouncement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Parents' | 'Students' | 'Staff';
  channel: 'In-App' | 'SMS Notice' | 'WhatsApp Notice';
  sentDate: string;
  author: string;
}

export interface ResearchArticleAuthor {
  name: string;
  role: string;
  affiliation: string;
  email?: string;
  isCorresponding?: boolean;
}

export interface ResearchArticleSection {
  heading: string;
  content: string;
}

export interface ResearchArticle {
  id: string;
  schoolId: string;
  title: string;
  subtitle?: string;
  abstract: string;
  authors: ResearchArticleAuthor[];
  category:
    | 'STEM & Applied Science'
    | 'Education & Pedagogy'
    | 'African History & Heritage'
    | 'Environmental & Climate Studies'
    | 'Economics & Commerce'
    | 'ICT, AI & Robotics'
    | 'Literature & Cultural Studies';
  keywords: string[];
  publicationDate: string;
  volume: string;
  doi: string;
  issn?: string;
  status: 'Published Open Access' | 'Peer Reviewed' | 'Faculty Working Paper' | 'Student Capstone' | 'Under Review';
  peerReviewNotes?: string;
  viewsCount: number;
  downloadsCount: number;
  citationsCount: number;
  license: string;
  sections: ResearchArticleSection[];
  references: string[];
  isOpenToPublic: boolean;
  featured?: boolean;
}

// ============================================================================
// PROFESSIONAL INSTITUTION, CERTIFICATE PROGRAMME & DIGITAL CREDENTIAL MODULE
// ============================================================================

export type ProgrammeCategoryType =
  | 'Professional Qualification'
  | 'Diploma Programme'
  | 'Certificate Programme'
  | 'Executive Education'
  | 'Vocational & Technical'
  | 'Short Course'
  | 'Secondary / Basic Completion';

export type AwardingAuthorityModel =
  | 'Institution Direct Award'
  | 'Affiliated Awarding Body'
  | 'Dual: Institution Award + Professional Body Designation';

export interface ProgrammeLevelConfig {
  levelNumber: number; // e.g., 1, 2, 3
  levelTitle: string; // e.g., "Level 1 (Foundation)", "Level 2 (Intermediate / Managerial)", "Level 3 (Advanced / Professional)"
  creditHoursRequired: number;
  passMarkPercent: number;
  maxAllowedResits: number;
  levelFeeAmount: number;
  awardOnLevelCompletion?: string; // e.g., "Foundation Certificate in Tax Administration"
}

export interface ProfessionalProgramme {
  id: string;
  schoolId: string;
  code: string; // e.g., "CTLFA-PRO"
  title: string; // e.g., "Chartered Tax Law & Forensic Accounting"
  category: ProgrammeCategoryType;
  qualificationAwarded: string; // Institutional qualification awarded
  professionalDesignation?: string; // Separate professional body designation, e.g. "ACTL (Associate Chartered Tax & Forensic Accountant)"
  affiliatedProfessionalBody?: string; // e.g., "Chartered Institute of Taxation & Forensic Auditors (Statutory Body)"
  awardingAuthorityModel: AwardingAuthorityModel;
  durationLabel: string; // e.g., "3 Levels (18 - 36 Months)"
  totalCreditHours: number;
  entryRequirements: string;
  assessmentMethods: string;
  examinationRegulations: string;
  progressionRules: string;
  completionRequirements: string;
  feeClearanceRequired: boolean;
  levels: ProgrammeLevelConfig[];
  status: 'Active' | 'Review' | 'Archived';
}

export interface ProgrammeCourse {
  id: string;
  schoolId: string;
  programmeId: string;
  levelNumber: number; // 1 = Level 1, 2 = Level 2, 3 = Level 3, 4 = Certificate
  levelLabel?: string; // e.g., "Level 1", "Level 2", "Level 3", "Certificate"
  code: string; // e.g., "TXF-101"
  title: string; // e.g., "Principles of Direct & Indirect Taxation"
  creditHours: number;
  lecturerName: string;
  lecturerUserId?: string;
  caWeightPercent: number; // e.g., 30
  practicalWeightPercent: number; // e.g., 10 or 0
  examWeightPercent: number; // e.g., 60 or 70
  isMandatory: boolean;
  examScheduleDate: string;
  semesterOrDiet: string; // e.g., "May 2026 Examination Diet"
  courseDetails?: string; // Comprehensive syllabus & module description
  rationale?: string; // Academic & industry rationale for the course
  objectives?: string[]; // Learning objectives list
  flyerDataUrl?: string; // Uploaded or generated promotional course flyer (compressed Data URL or HTTPS URL)
}

export type CandidatePaperStatus =
  | 'Registered'
  | 'Passed'
  | 'Resit Required'
  | 'Exempted'
  | 'Deferred'
  | 'Under Moderation'
  | 'Appeal Lodged';

export interface CandidateCourseAssessment {
  id: string;
  candidateId: string;
  programmeId: string;
  courseId: string;
  levelNumber: number;
  examDiet: string;
  attendancePercent: number;
  caScore: number;
  practicalScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  paperStatus: CandidatePaperStatus;
  exemptionBasis?: string; // e.g., "B.Sc. Accounting (First Class) Exemption"
  invigilationNotes?: string;
  moderated: boolean;
  moderatedBy?: string;
  appealNote?: string;
  resitAttemptCount: number;
}

export type ProfessionalMembershipStatus =
  | 'Registered Student Candidate'
  | 'Affiliate / Technician Member'
  | 'Graduate Member (Institution Complete)'
  | 'Associate Member (Awarded by External Professional Body)'
  | 'Fellow (Awarded by External Professional Body)'
  | 'Not Applicable (Academic / Vocational Only)';

export interface CandidateProfile {
  id: string;
  schoolId: string;
  studentId?: string; // Optional link to school Student record
  candidateNumber: string; // Unique Candidate/Student ID e.g. CIT-2025-0041
  firstName: string;
  lastName: string;
  otherNames?: string;
  gender: 'Male' | 'Female';
  dob: string;
  email: string;
  phone: string;
  photo: string;
  nationalIdNumber: string;
  identityVerified: boolean;
  identityDocumentType: 'Ghana Card (NIA)' | 'Passport' | 'Birth Certificate / GES Index';
  previousQualifications: string;
  programmeId: string;
  currentLevel: number;
  completedLevels: number[];
  enrollmentDate: string;
  status: 'Active' | 'Completed / Graduated' | 'Deferred' | 'Suspended';
  membershipStatus: ProfessionalMembershipStatus;
  membershipNumber?: string;
  totalFeesBilled: number;
  totalFeesPaid: number;
  directoryConsent: boolean; // Consent for Employer Public Graduate Directory
  headlineOrRole?: string;
}

export type CredentialDocumentType =
  | 'Full Qualification Certificate'
  | 'Level Completion Certificate'
  | 'Diploma Certificate'
  | 'Executive Programme Certificate'
  | 'Short Course Certificate'
  | 'Professional Examination Pass Certificate'
  | 'Official Academic Transcript'
  | 'Statement of Results'
  | 'Letter of Completion'
  | 'Digital Credential Badge';

export type CertificateValidityStatus =
  | 'Valid'
  | 'Pending Approval'
  | 'Revoked'
  | 'Replaced'
  | 'Expired';

export interface CertificateAuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  previousStatus: CertificateValidityStatus | 'Draft';
  newStatus: CertificateValidityStatus;
  reason: string;
}

export interface CertificateTemplateConfig {
  id: string;
  schoolId: string;
  name: string;
  themeStyle: 'emerald-gold' | 'royal-navy' | 'crimson-charter' | 'classic-ivory';
  orientation: 'landscape' | 'portrait';
  headerSubtitle: string;
  sealLabel: string;
  showQrCode: boolean;
  showCandidateId: boolean;
  showLevelCompleted: boolean;
  showCreditHours: boolean;
  showAuthorityDisclaimer: boolean;
  authorityDisclaimerText: string;
  primarySignatoryId?: string;
  secondarySignatoryId?: string;
  tertiarySignatoryId?: string;
}

export interface IssuedCredential {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  schoolCrest: string;
  certificateNumber: string; // Unique serial e.g. CITLFA-CERT-2025-00108
  verificationCode: string; // Secure code e.g. VRF-8X9M-K24P
  candidateId: string;
  candidateNumber: string;
  recipientFullName: string;
  programmeId: string;
  programmeTitle: string;
  credentialType: CredentialDocumentType;
  qualificationAwarded: string;
  levelCompletedLabel: string; // e.g., "Level 3 (Advanced / Final) - Full Programme"
  honoursOrDistinction?: string; // e.g., "With Distinction", "Merit", "Pass"
  creditHoursCompleted: number;
  issueDate: string;
  expiryDate?: string; // Optional for renewable compliance certificates
  status: CertificateValidityStatus;
  replacedByCertificateNumber?: string;
  revocationOrStatusReason?: string;
  awardingAuthorityName: string;
  professionalBodyAffiliationNote?: string;
  templateId: string;
  signatoriesSnapshot: {
    name: string;
    title: string;
    signatureDataUrl: string;
  }[];
  auditTrail: CertificateAuditEntry[];
}

export interface GraduateAlumniRecord {
  id: string;
  schoolId: string;
  candidateId: string;
  candidateNumber: string;
  fullName: string;
  email: string;
  phone: string;
  photo: string;
  programmeId: string;
  programmeTitle: string;
  qualificationAwarded: string;
  levelAttained: string;
  graduationYear: number;
  completionApprovedDate: string;
  certificateNumber: string;
  verificationCode: string;
  certificateStatus: CertificateValidityStatus;
  membershipStatus: ProfessionalMembershipStatus;
  professionalBodyDesignation?: string;
  directoryConsent: boolean;
  currentEmployerOrRole?: string;
}

export interface CertificateReplacementRequest {
  id: string;
  schoolId: string;
  candidateId: string;
  originalCertificateId: string;
  originalCertificateNumber: string;
  requesterName: string;
  reason: 'Damaged Physical Copy' | 'Legal Name Correction' | 'Lost Credential Re-issue' | 'Signatory / Administrative Update';
  details: string;
  requestedDate: string;
  status: 'Pending Review' | 'Approved & Re-issued' | 'Declined';
  newCertificateNumber?: string;
}

export interface InstitutionalAccreditation {
  id: string;
  schoolId: string;
  authorityName: string; // e.g., "Ghana Tertiary Education Commission (GTEC)", "CTVET", "GES / WAEC", "ICAG"
  accreditationType: 'Institutional Registration' | 'Programme Accreditation' | 'Professional Body Affiliation' | 'Examination Charter';
  referenceNumber: string;
  scopeOrProgramme: string;
  awardingPowerSummary: string;
  issueDate: string;
  renewalDate: string;
  status: 'Active' | 'Renewal Due' | 'Expired';
}

export interface EmployerVerificationLog {
  id: string;
  schoolId: string;
  timestamp: string;
  queriedReference: string; // Certificate serial or verification code
  matchedCertificateNumber?: string;
  recipientName?: string;
  verifierOrganization: string;
  verifierContactName: string;
  verificationPurpose: string;
  lookupMode: 'Single Lookup / QR Scan' | 'Employer Batch Verification';
  resultStatus: CertificateValidityStatus | 'Not Found';
}

export interface BiometricGateLog {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD (current day filterable)
  timestamp: string; // e.g., '07:28:14 AM'
  personName: string;
  personIdentifier: string; // Student/Candidate ID or Unrecognized Card/PIN
  personRole: 'Student' | 'Candidate' | 'Staff' | 'Visitor / Guardian';
  gateName: string;
  direction: 'Ingress (Entry)' | 'Egress (Exit)';
  method: 'Facial Recognition' | 'Biometric Fingerprint' | 'RFID Turnstile' | 'Guardian QR Pass';
  status: 'Authorized' | 'Denied';
  failureReason?: string;
  guardianName?: string;
  notes?: string;
}
