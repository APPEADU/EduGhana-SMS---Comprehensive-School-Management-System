import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

let cachedAiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!cachedAiClient) {
    cachedAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

// AI Endpoint: Academic Performance & Attendance Analytics
app.post('/api/gemini/academic-insights', async (req: Request, res: Response) => {
  try {
    const { schoolName, classData, studentsData } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        analysis: "Demo AI Mode: Strong academic progress observed. Recommended interventions: Form 2 Science needs additional practical sessions in Elective Chemistry; 3 students flagged for attendance below 80%. Overall pass rate is 88.4% across Core Mathematics and Integrated Science.",
        recommendations: [
          "Organize targeted math clinics for students with class scores below 18/30",
          "Acknowledge top performing students in WASSCE mock evaluations",
          "Send automated SMS alerts to parents of students with >3 consecutive absences"
        ]
      });
    }

    const prompt = `You are an expert Ghanaian educational psychologist and Senior High School / Basic School academic consultant for "${schoolName || 'Ghanaian Institution'}".
Analyze the following student performance and attendance data:
${JSON.stringify({ classData, studentsData })}

Provide a concise, practical evaluation report in structured JSON format with:
1. "summary": Executive summary of academic strengths and weaknesses
2. "atRiskStudents": List of students needing immediate remedial intervention with reason
3. "curriculumInsights": Specific subjects needing syllabus reinforcement
4. "actionableRecommendations": 3-5 concrete steps for the Headmaster, HODs, and PTA.

Return ONLY valid JSON.`;

    const response = await getAiClient().models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini academic-insights error:', error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// AI Endpoint: GES Lesson Plan Builder (Ghana Education Service / NaCCA standard)
app.post('/api/gemini/lesson-plan', async (req: Request, res: Response) => {
  try {
    const { subject, classLevel, topic, duration, strand, subStrand } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        subject: subject || 'Integrated Science',
        classLevel: classLevel || 'JHS 2 / Form 2',
        strand: strand || 'Diversity of Matter',
        subStrand: subStrand || 'Elements, Compounds and Mixtures',
        contentStandard: `B8.1.1.1: Demonstrate an understanding of atomic structure and chemical combinations.`,
        learningIndicator: `B8.1.1.1.2: Differentiate between elements, compounds and chemical mixtures with Ghanaian everyday examples (e.g., brass, gari and water, air).`,
        coreCompetencies: 'Critical Thinking and Problem Solving, Collaboration and Communication, Digital Literacy',
        resources: 'Samples of salt, iron filings, sulphur, water, beaker, magnet, projector',
        starterPhase: '5 mins: Show learners a bowl of gari mix and pure water. Ask learners which can be separated physically.',
        mainPhase: [
          'Step 1 (15 mins): Teacher explains definitions of pure elements vs compounds vs mixtures with atomic diagrams.',
          'Step 2 (20 mins): Group activity where learners separate iron filings from sand using magnets.',
          'Step 3 (10 mins): Presentation of group findings and table summary.'
        ],
        assessment: 'Formative quiz: Classify 5 substances into element, compound, or mixture (Table salt, Oxygen, Shito sauce, Bronze, Water).',
        homework: 'List five mixtures found in your kitchen at home and explain how each can be separated.'
      });
    }

    const prompt = `Generate a comprehensive Ghana Education Service (GES) and National Council for Curriculum and Assessment (NaCCA) standard lesson plan note.
Subject: ${subject}
Class Level: ${classLevel}
Topic: ${topic}
Duration: ${duration || '60 minutes'}
Strand: ${strand || 'Relevant GES Strand'}
Sub-strand: ${subStrand || 'Relevant GES Sub-strand'}

Respond in JSON with the exact fields:
- "strand": string
- "subStrand": string
- "contentStandard": string (GES code e.g. B7.2.1.1 or SHS standard)
- "learningIndicator": string
- "coreCompetencies": string
- "resources": string
- "starterPhase": string
- "mainPhase": array of strings (Step 1, Step 2, Step 3)
- "assessment": string
- "homework": string`;

    const response = await getAiClient().models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini lesson-plan error:', error);
    return res.status(500).json({ error: error.message || 'AI lesson plan generation failed' });
  }
});

// AI Endpoint: WAEC / WASSCE / BECE Question & Marking Scheme Generator
app.post('/api/gemini/generate-questions', async (req: Request, res: Response) => {
  try {
    const { subject, examType, topic, count, difficulty } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        questions: [
          {
            number: 1,
            type: 'Section A (Objective)',
            question: `In the expansion of (2x - 3)^4, what is the coefficient of x^2?`,
            options: ['A) 216', 'B) -216', 'C) 96', 'D) 108'],
            correctAnswer: 'A) 216',
            markingScheme: 'Using binomial expansion term: 4C2 * (2x)^2 * (-3)^2 = 6 * 4x^2 * 9 = 216x^2. Hence coefficient is 216.'
          },
          {
            number: 2,
            type: 'Section B (Theory / Structured)',
            question: `(a) Define Osmosis in living tissues. (b) Describe an experiment using an Irish potato or yam cup to demonstrate osmosis in concentrated sucrose solution.`,
            markingScheme: '(a) Osmosis is the movement of water molecules from a region of lower solute concentration (higher water potential) to a region of higher solute concentration (lower water potential) across a selectively permeable membrane (3 marks). (b) Peeling potato, cutting cavity, adding sucrose, beaker of water, observation of level change (7 marks).'
          }
        ]
      });
    }

    const prompt = `You are a Senior WAEC (West African Examinations Council) Chief Examiner for Ghanaian schools setting ${examType || 'WASSCE'} questions for:
Subject: ${subject}
Topic: ${topic}
Number of questions: ${count || 3}
Difficulty: ${difficulty || 'Standard WAEC Level'}

Return JSON format with a "questions" array, where each item has:
- "number": number
- "type": "Section A (Multiple Choice)" or "Section B (Theory)"
- "question": string
- "options": optional array of strings (for MCQs)
- "correctAnswer": string
- "markingScheme": detailed marks allocation breakdown`;

    const response = await getAiClient().models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini generate-questions error:', error);
    return res.status(500).json({ error: error.message || 'Question generation failed' });
  }
});

// AI Endpoint: Personalized Terminal Report Card Comments
app.post('/api/gemini/report-comment', async (req: Request, res: Response) => {
  try {
    const { studentName, classLevel, averageScore, attendanceRate, conduct, strengths, weaknesses } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        classTeacherRemark: `${studentName} has shown commendable dedication this term with an average of ${averageScore}%. Maintains a respectful attitude and active participation in class discussions.`,
        headteacherRemark: `An impressive terminal result. Promoted with praise. Keep up the high standard in the coming term.`,
        suggestedIntervention: `Encourage reading wider literature to further refine essay composition.`
      });
    }

    const prompt = `Generate formal, encouraging, constructive school report card comments for a student in a Ghanaian school:
Student: ${studentName}
Class: ${classLevel}
Average Mark: ${averageScore}%
Attendance: ${attendanceRate}%
Conduct: ${conduct || 'Good'}
Strengths: ${strengths || 'Consistent class work, good teamwork'}
Weaknesses / Areas for Improvement: ${weaknesses || 'Needs more focus during end-of-term examinations'}

Return JSON:
- "classTeacherRemark": string (2-3 sentences)
- "headteacherRemark": string (1-2 decisive sentences)
- "suggestedIntervention": string (actionable advice for parents)`;

    const response = await getAiClient().models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini report-comment error:', error);
    return res.status(500).json({ error: error.message || 'Report comment generation failed' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isRunningUnderTsx = process.execArgv.some((arg) => arg.includes('tsx'));
  const isProd = process.env.NODE_ENV === 'production' || !isRunningUnderTsx;
  const isDev = !isProd;
  const httpServer = http.createServer(app);

  if (isDev) {
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        },
        appType: 'spa',
      });
      return vite.middlewares;
    })();

    app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        const middlewares = await viteReady;
        middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
