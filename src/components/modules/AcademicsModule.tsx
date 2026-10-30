import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Users,
  Sparkles,
  Clock,
  MapPin,
  Check,
  Send,
  Loader2,
  FileText,
} from 'lucide-react';

export const AcademicsModule: React.FC = () => {
  const { classes, subjects, timetable, students, staff } = useSchool();

  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'timetable' | 'lesson-plan'>('classes');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  // AI Lesson Plan State
  const [planSubject, setPlanSubject] = useState('Integrated Science');
  const [planClassLevel, setPlanClassLevel] = useState('SHS 2');
  const [planTopic, setPlanTopic] = useState('Acids, Bases and Salts');
  const [planStrand, setPlanStrand] = useState('Diversity of Matter');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Timetable for selected class
  const classTimetable = timetable.filter((t) => t.classId === selectedClassId);
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const handleGenerateLessonPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/gemini/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: planSubject,
          classLevel: planClassLevel,
          topic: planTopic,
          strand: planStrand,
        }),
      });
      const data = await res.json();
      setGeneratedPlan(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            Academic & Classroom Management
          </h2>
          <p className="text-xs text-slate-400">
            GES curriculum standards, class streams, weekly timetable scheduling, and AI lesson planner.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'classes' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Classes & Streams
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'subjects' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Curriculum & Subjects
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'timetable' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Timetable Grid
          </button>
          <button
            onClick={() => setActiveTab('lesson-plan')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lesson-plan'
                ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            GES Lesson Notes (AI)
          </button>
        </div>
      </div>

      {/* TAB 1: Classes & Streams */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              School Classes & Streams
            </h3>
            {classes.map((cls) => {
              const enrolled = students.filter((s) => s.classId === cls.id).length;
              const tutor = staff.find((st) => st.id === cls.formTutorTeacherId);
              const isSelected = cls.id === selectedClassId;
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-white'
                      : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{cls.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400">
                      {cls.level} Form {cls.form}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                    <span>Room: {cls.roomNumber}</span>
                    <span>
                      Enrolment: <strong className="text-white">{enrolled}</strong> / {cls.capacity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Form Tutor: <span className="text-slate-300">{tutor?.fullName || 'Assigned Tutor'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Class Roster */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">
                  {selectedClass?.name || 'Class Roster'}
                </h3>
                <p className="text-xs text-slate-400">
                  {classStudents.length} Students Assigned • {selectedClass?.roomNumber}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-2">Student ID</th>
                    <th className="py-2.5 px-2">Programme</th>
                    <th className="py-2.5 px-2">Boarding</th>
                    <th className="py-2.5 px-2">Guardian Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <img
                          src={s.photo}
                          alt={s.firstName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        />
                        <span className="font-bold text-white">
                          {s.firstName} {s.lastName}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-emerald-400">{s.studentNumber}</td>
                      <td className="py-2.5 px-2 text-slate-400">{s.programme}</td>
                      <td className="py-2.5 px-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-semibold">
                          {s.boardingStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-400">{s.guardianPhone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Curriculum & Subjects */}
      {activeTab === 'subjects' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">GES & WAEC Curriculum Subjects</h3>
              <p className="text-xs text-slate-400">
                Core compulsory subjects and elective departmental tracks for Ghanaian SHS & Basic schools.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sbj) => (
              <div
                key={sbj.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-emerald-400 font-bold">{sbj.code}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      sbj.category === 'Core'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        : 'bg-blue-950 text-blue-300 border border-blue-800/50'
                    }`}
                  >
                    {sbj.category} Subject
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{sbj.name}</h4>
                <div className="mt-3 pt-2 border-t border-slate-900 text-slate-400 flex items-center justify-between text-[11px]">
                  <span>Department: {sbj.department}</span>
                  <span>Level: {sbj.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Timetable Grid */}
      {activeTab === 'timetable' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-white text-base">Weekly Class Timetable</h3>
              <p className="text-xs text-slate-400">
                Visual interactive timetable for {selectedClass?.name || 'Selected Class'}
              </p>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 self-start sm:self-auto"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {days.map((day) => {
              const dayPeriods = classTimetable.filter((t) => t.dayOfWeek === day);
              return (
                <div key={day} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider mb-3">
                    {day}
                  </h4>
                  {dayPeriods.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {dayPeriods.map((p) => {
                        const sbj = subjects.find((s) => s.id === p.subjectId);
                        return (
                          <div
                            key={p.id}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                          >
                            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                              <span className="font-bold text-white">Period {p.periodNumber}</span>
                              <span className="font-mono text-emerald-400">
                                {p.startTime} - {p.endTime}
                              </span>
                            </div>
                            <div className="font-bold text-white text-xs mt-1">{sbj?.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>{p.room}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      No scheduled teaching periods (Self study / Sports / Extra-curricular)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: AI GES Lesson Planner */}
      {activeTab === 'lesson-plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                GES NaCCA Lesson Note Assistant
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates Ghana Education Service compliant lesson notes with strands, sub-strands, learning indicators, and activities.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <select
                  value={planSubject}
                  onChange={(e) => setPlanSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Integrated Science">Integrated Science</option>
                  <option value="Core Mathematics">Core Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Elective Physics">Elective Physics</option>
                  <option value="Cost Accounting">Cost Accounting</option>
                  <option value="Information & Comms Tech">ICT / Computing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Class / Form</label>
                <select
                  value={planClassLevel}
                  onChange={(e) => setPlanClassLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="SHS 1">SHS 1</option>
                  <option value="SHS 2">SHS 2</option>
                  <option value="SHS 3">SHS 3</option>
                  <option value="JHS 1">JHS 1 (Basic 7)</option>
                  <option value="JHS 2">JHS 2 (Basic 8)</option>
                  <option value="JHS 3">JHS 3 (Basic 9 - BECE)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Topic / Content</label>
                <input
                  type="text"
                  value={planTopic}
                  onChange={(e) => setPlanTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Chemical bonding, Quadratic equations..."
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Curriculum Strand (Optional)</label>
                <input
                  type="text"
                  value={planStrand}
                  onChange={(e) => setPlanStrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Diversity of Matter"
                />
              </div>

              <button
                onClick={handleGenerateLessonPlan}
                disabled={isGeneratingPlan}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating GES Lesson Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Lesson Note
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Lesson Plan View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white text-xs space-y-4">
            {generatedPlan ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Ghana Education Service Lesson Note (Form {generatedPlan.classLevel})
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {generatedPlan.subject} — {planTopic}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-600/40 rounded-lg text-xs font-bold">
                    NaCCA Aligned
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block font-medium">Strand:</span>
                    <span className="font-bold text-white">{generatedPlan.strand}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Sub-strand:</span>
                    <span className="font-bold text-white">{generatedPlan.subStrand}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Content Standard:</span>
                    <span className="font-mono text-emerald-400">{generatedPlan.contentStandard}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Learning Indicator:</span>
                    <span className="text-slate-200">{generatedPlan.learningIndicator}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold block">Core Competencies:</span>
                  <p className="text-slate-300">{generatedPlan.coreCompetencies}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-bold block">Teaching / Learning Resources:</span>
                  <p className="text-slate-300">{generatedPlan.resources}</p>
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Lesson Delivery (Phase Breakdown)
                  </h4>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <strong className="text-emerald-400 block mb-0.5">Starter / Introduction:</strong>
                    <p className="text-slate-300">{generatedPlan.starterPhase}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <strong className="text-emerald-400 block">Main Activities:</strong>
                    {Array.isArray(generatedPlan.mainPhase) ? (
                      generatedPlan.mainPhase.map((step: string, idx: number) => (
                        <p key={idx} className="text-slate-300 pl-2 border-l border-slate-700">
                          {step}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-300">{generatedPlan.mainPhase}</p>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-0.5">Formative Assessment:</strong>
                    <p className="text-slate-300">{generatedPlan.assessment}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <strong className="text-blue-400 block mb-0.5">Learner Homework:</strong>
                    <p className="text-slate-300">{generatedPlan.homework}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                <FileText className="w-12 h-12 mb-3 text-slate-600" />
                <p className="font-semibold text-slate-400">No Lesson Note generated yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select your subject, class level, and topic on the left to instantly generate a standardized GES lesson note.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
