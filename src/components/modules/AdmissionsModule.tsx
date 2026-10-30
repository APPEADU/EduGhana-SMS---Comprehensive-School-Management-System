import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { AdmissionApplication } from '../../types';
import {
  UserPlus,
  FileCheck,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Search,
  Filter,
  Plus,
  Award,
  Trash2,
} from 'lucide-react';

export const AdmissionsModule: React.FC = () => {
  const { school, admissions, addAdmission, updateAdmissionStatus, deleteAdmission, addStudent, classes } = useSchool();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeAdmissionLetter, setActiveAdmissionLetter] = useState<AdmissionApplication | null>(null);

  // New Application Form
  const [formData, setFormData] = useState({
    applicantName: '',
    gender: 'Male' as 'Male' | 'Female',
    dob: '2010-06-15',
    applyingForClass: 'SHS 1',
    programme: 'General Science',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    previousSchool: '',
    beceScore: 7,
  });

  const filteredAdmissions = admissions.filter((app) => {
    const matchesSearch = `${app.applicantName} ${app.applicationNumber} ${app.parentName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEnrollApplicant = (app: AdmissionApplication) => {
    // Automatically create a student from this approved application
    const names = app.applicantName.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Student';

    addStudent({
      firstName,
      lastName,
      gender: app.gender,
      dob: app.dob,
      classId: classes[0]?.id || 'cls-shs1-sci',
      stream: 'Science A',
      programme: app.programme || 'General Science',
      boardingStatus: 'Boarding',
      guardianName: app.parentName,
      guardianPhone: app.parentPhone,
      guardianEmail: app.parentEmail,
      guardianRelationship: 'Parent',
      emergencyContact: app.parentPhone,
      medicalInfo: 'Standard clearance',
      previousSchool: app.previousSchool,
      beceAggregate: app.beceScore,
    });

    updateAdmissionStatus(app.id, 'Enrolled');
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.parentName) return;
    addAdmission(formData);
    setShowApplyModal(false);
    setFormData({
      applicantName: '',
      gender: 'Male',
      dob: '2010-06-15',
      applyingForClass: 'SHS 1',
      programme: 'General Science',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      previousSchool: '',
      beceScore: 7,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            Student Admission Management & BECE Placement
          </h2>
          <p className="text-xs text-slate-400">
            Track prospective student applications, interview scheduling, document verification, and formal admission letters.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit Online Application
        </button>
      </div>

      {/* Filter and Status Pipeline Badges */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by candidate name or APP number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-slate-400 text-xs">Status:</span>
          {['All', 'Pending', 'Interview', 'Approved', 'Enrolled', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-3">App Number</th>
                <th className="py-3 px-3">Class & Programme</th>
                <th className="py-3 px-3">BECE Aggregate</th>
                <th className="py-3 px-3">Guardian Contact</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions & Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAdmissions.length > 0 ? (
                filteredAdmissions.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{app.applicantName}</div>
                      <div className="text-[11px] text-slate-400">
                        {app.gender} • From {app.previousSchool}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {app.applicationNumber}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-white block">{app.applyingForClass}</span>
                      <span className="text-[11px] text-slate-400">{app.programme}</span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      Aggregate {app.beceScore} (BECE)
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-200 block">{app.parentName}</span>
                      <span className="text-[11px] font-mono text-slate-400">{app.parentPhone}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                            : app.status === 'Enrolled'
                            ? 'bg-blue-950 text-blue-300 border border-blue-700/50'
                            : app.status === 'Interview'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                            : app.status === 'Pending'
                            ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => updateAdmissionStatus(app.id, 'Interview')}
                              className="px-2 py-1 bg-amber-950 text-amber-300 hover:bg-amber-900 rounded-lg text-[11px] font-semibold border border-amber-700/50 transition cursor-pointer"
                            >
                              Call Interview
                            </button>
                            <button
                              onClick={() => updateAdmissionStatus(app.id, 'Approved')}
                              className="px-2 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded-lg text-[11px] font-semibold border border-emerald-700/50 transition cursor-pointer"
                            >
                              Approve
                            </button>
                          </>
                        )}

                        {app.status === 'Interview' && (
                          <button
                            onClick={() => updateAdmissionStatus(app.id, 'Approved')}
                            className="px-2 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded-lg text-[11px] font-semibold border border-emerald-700/50 transition cursor-pointer"
                          >
                            Pass & Admit
                          </button>
                        )}

                        {app.status === 'Approved' && (
                          <>
                            <button
                              onClick={() => setActiveAdmissionLetter(app)}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-emerald-400" />
                              Offer Letter
                            </button>
                            <button
                              onClick={() => handleEnrollApplicant(app)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                            >
                              Enroll into Class
                            </button>
                          </>
                        )}

                        {app.status === 'Enrolled' && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete admission application ${app.applicationNumber} for ${app.applicantName}?`)) {
                              deleteAdmission(app.id);
                            }
                          }}
                          className="p-1 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No admission applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Admission Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full text-slate-200 shadow-2xl my-8">
            <h3 className="font-bold text-lg text-white mb-1">
              Online Admission Form Simulator
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Allows prospective students or parents in Ghana and abroad to apply online.
            </p>

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  placeholder="e.g. Jessica Naa Darko"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Applying For Programme</label>
                  <select
                    value={formData.programme}
                    onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="General Science">General Science</option>
                    <option value="General Arts">General Arts</option>
                    <option value="Business">Business</option>
                    <option value="Visual Arts">Visual Arts</option>
                    <option value="Home Economics">Home Economics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">BECE Aggregate Score (6-30)</label>
                  <input
                    type="number"
                    min="6"
                    max="36"
                    required
                    value={formData.beceScore}
                    onChange={(e) =>
                      setFormData({ ...formData, beceScore: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Previous Basic School</label>
                  <input
                    type="text"
                    required
                    value={formData.previousSchool}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    placeholder="e.g. SOS Hermann Gmeiner School"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="font-bold text-slate-300 mb-2">Parent / Guardian Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Parent Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Mr. Samuel Frimpong"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Parent Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="+233 24 555 1234"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Admission Offer Letter Modal */}
      {activeAdmissionLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full text-slate-900 shadow-2xl my-8">
            <div className="print:hidden flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-700">Official Admission Offer Letter</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Letter
                </button>
                <button
                  onClick={() => setActiveAdmissionLetter(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="text-center border-b-2 border-slate-900 pb-4">
              <img
                src={school.crest}
                alt={school.name}
                className="w-14 h-14 mx-auto rounded-full object-cover mb-2 border border-slate-400"
              />
              <h2 className="text-xl font-serif font-black uppercase text-slate-950 tracking-tight">
                {school.name}
              </h2>
              <p className="text-xs text-slate-600 font-medium">"{school.motto}"</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{school.address} • {school.phone}</p>
              <div className="mt-3 inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded">
                Provisional Offer of Admission — {school.currentAcademicYear}
              </div>
            </div>

            <div className="my-6 space-y-4 text-xs text-slate-800 leading-relaxed">
              <div className="flex justify-between text-slate-600">
                <span>Ref: ADM/{activeAdmissionLetter.applicationNumber}</span>
                <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
              </div>

              <div>
                <p className="font-bold text-sm text-slate-950">
                  Dear {activeAdmissionLetter.applicantName},
                </p>
                <p className="text-slate-500">c/o {activeAdmissionLetter.parentName} ({activeAdmissionLetter.parentPhone})</p>
              </div>

              <p>
                I am delighted to inform you that on the basis of your performance in the Basic Education Certificate Examination (BECE aggregate {activeAdmissionLetter.beceScore}), the Board of Governors has offered you provisional admission to <strong>{school.name}</strong> for the <strong>{school.currentAcademicYear}</strong> academic year.
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div><strong>Admitted Form:</strong> {activeAdmissionLetter.applyingForClass}</div>
                <div><strong>Approved Course of Study:</strong> {activeAdmissionLetter.programme}</div>
                <div><strong>Residential Classification:</strong> Boarding Student</div>
                <div><strong>Term Resumption Date:</strong> {school.termStartDate}</div>
              </div>

              <p>
                Please accept our congratulations. Kindly confirm your acceptance by settling the required term user fees via our approved Mobile Money merchant channels or direct bank deposit into our institutional account on or before the resumption date.
              </p>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                <div>
                  <div className="font-serif italic font-bold text-slate-900 text-sm">
                    {school.headmasterSignature}
                  </div>
                  <div className="font-bold text-slate-800 mt-1">{school.headmasterName}</div>
                  <div className="text-[10px] text-slate-500">Headmistress & Chief Executive</div>
                </div>
                <div className="text-center font-mono font-bold text-red-700 border-2 border-red-700 px-3 py-1 rounded rotate-[-2deg] opacity-80 uppercase text-[9px]">
                  ADMISSIONS APPROVED
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
