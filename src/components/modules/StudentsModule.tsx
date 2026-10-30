import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { StudentIdCardModal } from '../modals/StudentIdCardModal';
import { ReportCardModal } from '../modals/ReportCardModal';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Award,
  Filter,
  Eye,
  Phone,
  Mail,
  Home,
  HeartPulse,
  X,
  CheckCircle,
  Trash2,
} from 'lucide-react';

export const StudentsModule: React.FC = () => {
  const { students, classes, boardingHouses, addStudent, deleteStudent } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeStudentIdCard, setActiveStudentIdCard] = useState<Student | null>(null);
  const [activeStudentReport, setActiveStudentReport] = useState<Student | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for new student
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '2008-05-15',
    classId: classes[0]?.id || '',
    stream: 'Science A',
    programme: 'General Science',
    boardingStatus: 'Boarding' as 'Boarding' | 'Day',
    houseId: boardingHouses[0]?.id || '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: 'Father',
    emergencyContact: '',
    medicalInfo: 'None',
    nationalIdOrNHIS: 'GHA-',
    previousSchool: '',
    beceAggregate: 8,
  });

  // Filter students
  const filteredStudents = students.filter((stu) => {
    const matchesSearch =
      `${stu.firstName} ${stu.lastName} ${stu.studentNumber}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All' || stu.classId === selectedClass;
    const matchesStatus = selectedStatus === 'All' || stu.boardingStatus === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName || !newStudent.lastName) return;
    addStudent(newStudent);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Student Information & Registry
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive bio-data, national health insurance, guardian contacts, and printable ID cards.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student by name or ID (e.g. ACH-2024)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Class:</span>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="All">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Boarding">Boarding Students</option>
            <option value="Day">Day Students</option>
          </select>
        </div>
      </div>

      {/* Student Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3">Student Number</th>
                <th className="py-3 px-3">Class & Programme</th>
                <th className="py-3 px-3">Boarding / House</th>
                <th className="py-3 px-3">Guardian & Phone</th>
                <th className="py-3 px-4 text-right">Actions & Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((stu) => {
                  const stuClass = classes.find((c) => c.id === stu.classId);
                  const stuHouse = boardingHouses.find((h) => h.id === stu.houseId);
                  return (
                    <tr key={stu.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={stu.photo}
                            alt={stu.firstName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-white block">
                              {stu.lastName}, {stu.firstName} {stu.otherNames || ''}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {stu.gender} • DOB: {stu.dob}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {stu.studentNumber}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">
                          {stuClass?.name || 'SHS 2'}
                        </span>
                        <span className="text-[11px] text-slate-400">{stu.programme}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stu.boardingStatus === 'Boarding'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {stu.boardingStatus}
                        </span>
                        {stuHouse && (
                          <span className="block text-[11px] text-slate-400 mt-0.5 font-medium">
                            {stuHouse.name}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-200 block">{stu.guardianName}</span>
                        <span className="text-[11px] font-mono text-slate-400">{stu.guardianPhone}</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentDetail(stu)}
                            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveStudentIdCard(stu)}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
                            title="Print Student ID Card"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>ID Card</span>
                          </button>
                          <button
                            onClick={() => setActiveStudentReport(stu)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[11px] font-semibold border border-emerald-700/50 transition cursor-pointer"
                            title="Terminal Report Card"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Report</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete student ${stu.firstName} ${stu.lastName} (${stu.studentNumber}) from the school registry? This cannot be undone.`)) {
                                deleteStudent(stu.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-800/40"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Full Detail Drawer / Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setSelectedStudentDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <img
                src={selectedStudentDetail.photo}
                alt={selectedStudentDetail.firstName}
                className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500"
              />
              <div>
                <h3 className="font-bold text-lg text-white">
                  {selectedStudentDetail.firstName} {selectedStudentDetail.lastName}
                </h3>
                <span className="font-mono text-emerald-400 text-xs font-bold">
                  {selectedStudentDetail.studentNumber}
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  {selectedStudentDetail.programme} • {selectedStudentDetail.boardingStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4 text-xs border-b border-slate-800">
              <div>
                <span className="text-slate-400 block">Date of Birth:</span>
                <span className="font-semibold text-white">{selectedStudentDetail.dob}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Ghana NHIS / National ID:</span>
                <span className="font-mono font-semibold text-white">
                  {selectedStudentDetail.nationalIdOrNHIS || 'GHA-718293041-9'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">BECE Aggregate:</span>
                <span className="font-bold text-amber-400 font-mono">
                  Aggregate {selectedStudentDetail.beceAggregate || '6'} (Grade 1s)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Previous Basic School:</span>
                <span className="font-semibold text-white">
                  {selectedStudentDetail.previousSchool || 'Christ the King School'}
                </span>
              </div>
            </div>

            <div className="py-3 text-xs space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-1">
                  Guardian / Contact Information:
                </span>
                <p className="text-white font-medium">
                  {selectedStudentDetail.guardianName} ({selectedStudentDetail.guardianRelationship})
                </p>
                <p className="text-emerald-400 font-mono text-[11px] mt-0.5">
                  {selectedStudentDetail.guardianPhone} • {selectedStudentDetail.guardianEmail}
                </p>
              </div>

              <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-900/40 text-rose-300">
                <span className="font-bold block flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  Medical Alerts & Care Instructions:
                </span>
                <p className="mt-1 text-slate-300">{selectedStudentDetail.medicalInfo}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${selectedStudentDetail.firstName} ${selectedStudentDetail.lastName} (${selectedStudentDetail.studentNumber})? This will remove all their records.`)) {
                    deleteStudent(selectedStudentDetail.id);
                    setSelectedStudentDetail(null);
                  }
                }}
                className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-semibold border border-rose-800/40 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Student</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveStudentIdCard(selectedStudentDetail);
                    setSelectedStudentDetail(null);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Print ID Card
                </button>
                <button
                  onClick={() => {
                    setActiveStudentReport(selectedStudentDetail);
                    setSelectedStudentDetail(null);
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Generate Report Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full text-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-white">Enroll New Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Kwame"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Mensah"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Other Names</label>
                  <input
                    type="text"
                    value={newStudent.otherNames}
                    onChange={(e) => setNewStudent({ ...newStudent, otherNames: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Kwabena"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newStudent.dob}
                    onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Class / Stream</label>
                  <select
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({ ...newStudent, classId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Programme (SHS)</label>
                  <select
                    value={newStudent.programme}
                    onChange={(e) => setNewStudent({ ...newStudent, programme: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="General Science">General Science</option>
                    <option value="General Arts">General Arts</option>
                    <option value="Business">Business</option>
                    <option value="Visual Arts">Visual Arts</option>
                    <option value="Home Economics">Home Economics</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Residential Status</label>
                  <select
                    value={newStudent.boardingStatus}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, boardingStatus: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Boarding">Boarding Student</option>
                    <option value="Day">Day Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Boarding House</label>
                  <select
                    value={newStudent.houseId}
                    onChange={(e) => setNewStudent({ ...newStudent, houseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {boardingHouses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="border-t border-slate-800 pt-3">
                <h4 className="font-bold text-slate-300 mb-2">Guardian / Parent Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.guardianName}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, guardianName: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Alhaji Ibrahim Yakubu"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newStudent.guardianPhone}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, guardianPhone: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. +233 24 456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={newStudent.guardianEmail}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, guardianEmail: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. i.yakubu@gmail.com"
                    />
                  </div>
                </div>
              </div>

              {/* Medical & Ghana ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ghana Card / NHIS Number</label>
                  <input
                    type="text"
                    value={newStudent.nationalIdOrNHIS}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, nationalIdOrNHIS: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="GHA-718293041-9"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Medical / Allergy Notes</label>
                  <input
                    type="text"
                    value={newStudent.medicalInfo}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, medicalInfo: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Asthma, Penicillin allergy"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Register & Assign ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Student ID Card Modal if open */}
      {activeStudentIdCard && (
        <StudentIdCardModal
          student={activeStudentIdCard}
          onClose={() => setActiveStudentIdCard(null)}
        />
      )}

      {/* Render Terminal Report Card Modal if open */}
      {activeStudentReport && (
        <ReportCardModal
          student={activeStudentReport}
          onClose={() => setActiveStudentReport(null)}
        />
      )}
    </div>
  );
};
