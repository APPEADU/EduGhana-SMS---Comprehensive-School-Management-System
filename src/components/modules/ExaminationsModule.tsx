import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student, ExamResult } from '../../types';
import { calculateWassceGrade, formatOrdinal } from '../../utils/academicCalculations';
import { ReportCardModal } from '../modals/ReportCardModal';
import {
  FileSpreadsheet,
  CheckCircle,
  Award,
  Printer,
  ShieldCheck,
  Search,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const ExaminationsModule: React.FC = () => {
  const {
    school,
    classes,
    subjects,
    students,
    examResults,
    saveExamResult,
    publishResults,
  } = useSchool();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [activeReportStudent, setActiveReportStudent] = useState<Student | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filter students for chosen class
  const classStudents = students.filter((s) => s.classId === selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Temporary local state for editable marks
  const [marksState, setMarksState] = useState<Record<string, { classScore: number; examScore: number }>>(() => {
    const map: Record<string, { classScore: number; examScore: number }> = {};
    classStudents.forEach((stu) => {
      const existing = examResults.find(
        (r) =>
          r.studentId === stu.id &&
          r.subjectId === selectedSubjectId &&
          r.term === school.currentTerm &&
          r.academicYear === school.currentAcademicYear
      );
      map[stu.id] = {
        classScore: existing ? existing.classScore : 25,
        examScore: existing ? existing.examScore : 55,
      };
    });
    return map;
  });

  const handleScoreChange = (stuId: string, field: 'classScore' | 'examScore', val: number) => {
    const clamped = Math.max(0, Math.min(field === 'classScore' ? 30 : 70, val || 0));
    setMarksState((prev) => ({
      ...prev,
      [stuId]: {
        ...prev[stuId],
        [field]: clamped,
      },
    }));
  };

  const handleSaveAllMarks = () => {
    classStudents.forEach((stu) => {
      const entry = marksState[stu.id] || { classScore: 25, examScore: 50 };
      saveExamResult({
        studentId: stu.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        term: school.currentTerm,
        academicYear: school.currentAcademicYear,
        classScore: entry.classScore,
        examScore: entry.examScore,
      });
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const [publishNotice, setPublishNotice] = useState(false);
  const handlePublishClassResults = () => {
    publishResults(selectedClassId);
    setPublishNotice(true);
    setTimeout(() => setPublishNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Examination & Results Management (WASSCE / GES)
          </h2>
          <p className="text-xs text-slate-400">
            Standard 30% Continuous Assessment + 70% Terminal Exam scoring, automated grading, and verified publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {publishNotice && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-3 py-1.5 rounded-lg">
              Marks verified &amp; published to Student Portal
            </span>
          )}
          <button
            onClick={handlePublishClassResults}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify &amp; Publish to Portal
          </button>
        </div>
      </div>

      {/* Selector Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Class / Stream:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Subject:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Assessment Term:</label>
            <span className="block px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-semibold">
              {school.currentTerm} ({school.currentAcademicYear})
            </span>
          </div>
        </div>

        <button
          onClick={handleSaveAllMarks}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer self-end md:self-auto"
        >
          <CheckCircle className="w-4 h-4" />
          {saveSuccess ? 'Marks Saved!' : 'Save & Compute Grades'}
        </button>
      </div>

      {/* Marks Entry Spreadsheet Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              {selectedSubject?.name} — Mark Sheet
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
              WAEC Grading Matrix Active
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Class Score (Max 30) + Terminal Exam (Max 70) = Total (100)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-2">Student ID</th>
                <th className="py-3 px-2 text-center">Class Score (30%)</th>
                <th className="py-3 px-2 text-center">Exam Score (70%)</th>
                <th className="py-3 px-2 text-center font-bold">Total (100%)</th>
                <th className="py-3 px-2 text-center font-bold">WASSCE Grade</th>
                <th className="py-3 px-2 text-center">Interpretation</th>
                <th className="py-3 px-4 text-right">Individual Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {classStudents.map((stu) => {
                const entry = marksState[stu.id] || { classScore: 25, examScore: 50 };
                const total = entry.classScore + entry.examScore;
                const gradeInfo = calculateWassceGrade(total);

                return (
                  <tr key={stu.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={stu.photo}
                        alt={stu.firstName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white">
                          {stu.firstName} {stu.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{stu.programme}</div>
                      </div>
                    </td>

                    <td className="py-3 px-2 font-mono text-emerald-400 font-semibold">
                      {stu.studentNumber}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={entry.classScore}
                        onChange={(e) =>
                          handleScoreChange(stu.id, 'classScore', parseInt(e.target.value, 10))
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg py-1 px-2 text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="70"
                        value={entry.examScore}
                        onChange={(e) =>
                          handleScoreChange(stu.id, 'examScore', parseInt(e.target.value, 10))
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg py-1 px-2 text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-black text-sm text-white">
                      {total}
                    </td>

                    <td className="py-3 px-2 text-center font-black">
                      <span className={`px-2 py-0.5 rounded text-xs border ${gradeInfo.badgeColor}`}>
                        {gradeInfo.grade}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center text-slate-300 font-medium">
                      {gradeInfo.interpretation}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveReportStudent(stu)}
                        className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                        title="View Official Terminal Report Card"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Report Card</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Terminal Report Card if student is selected */}
      {activeReportStudent && (
        <ReportCardModal
          student={activeReportStudent}
          onClose={() => setActiveReportStudent(null)}
        />
      )}
    </div>
  );
};
