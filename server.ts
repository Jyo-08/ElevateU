import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// --- OFFLINE/FALLBACK TELEMETRY LOGS & ENGINES ---
function fallbackAnalyzeStress(content: string, stressLevel: number) {
  const contentLower = content.toLowerCase();
  
  let stressIndex = Math.min(10, Math.max(1, Math.round(stressLevel + (content.length > 150 ? 1 : 0))));
  
  if (contentLower.includes("bad") || contentLower.includes("panic") || contentLower.includes("horrible") || contentLower.includes("depressed")) {
    stressIndex = Math.max(stressIndex, 8);
  }
  
  // Fulfill explicit user instruction edge-case
  if (contentLower.includes("happy") && stressLevel === 5) {
    stressIndex = 8; // force "high" as requested
  } else if (contentLower.includes("happy") || contentLower.includes("good") || contentLower.includes("great") || contentLower.includes("glad")) {
    // normally text implies low stress unless slider is high. "depending on either one" -> if slider is high, keep it high. 
    // If slider is low, make it low.
    stressIndex = Math.max(stressLevel, 3);
  }

  let motivationLevel = "MEDIUM";
  if (stressIndex > 7) motivationLevel = "LOW";
  else if (stressIndex < 4) motivationLevel = "HIGH";

  const confidenceBoost = `⚠️ [OFFLINE CORE BOOSTER ACTIVE] Keep your head high, player! ElevateU is operating on auxiliary processors due to API rate limit, but the Pixel Guardians' recovery trajectory remains solid. Your current stress of ${stressLevel}/10 is a challenge we will conquer. Clear your backlog quests step-by-step!`;

  const actionableTips = [
    "Execute F6 Profile console to calibrate weekly study goals.",
    "Draft a 25-minute study focus sprint with no network disruptions.",
    "Log a stress journal update after completing your next target review."
  ];

  return {
    stressIndex,
    confidenceBoost,
    motivationLevel,
    actionableTips
  };
}

function fallbackGeneratePlan(profile: {
  cgpa: number;
  backlogs: number;
  attendance: number;
  studyHours: number;
  confidenceLevel: number;
  subjects: string;
}) {
  const cgpaValue = typeof profile.cgpa === "number" ? profile.cgpa : parseFloat(profile.cgpa as any) || 7.0;
  const backlogsValue = typeof profile.backlogs === "number" ? profile.backlogs : parseInt(profile.backlogs as any) || 0;
  const attendanceValue = typeof profile.attendance === "number" ? profile.attendance : parseFloat(profile.attendance as any) || 75;
  const studyHoursValue = typeof profile.studyHours === "number" ? profile.studyHours : parseFloat(profile.studyHours as any) || 20;
  const confidenceValue = typeof profile.confidenceLevel === "number" ? profile.confidenceLevel : parseInt(profile.confidenceLevel as any) || 5;
  const subjectsStr = profile.subjects || "General Subjects";

  const isLowCgpa = cgpaValue < 6.5;
  const hasBacklogs = backlogsValue > 0;
  const isLowAttendance = attendanceValue < 75;

  let planText = `## ⚠️ OFFLINE COAXIAL PLAN EMULATION
*ElevateU has launched offline recovery plans due to API limit buffer exhaustion. Your local strategy calculations are fully synced.*

### I. CORE STATUS DIAGNOSTIC FOR **${cgpaValue.toFixed(2)} CGPA**

Your data coordinates are locked in. Let us evaluate your parameters:

- **Academic Focus**: Tracking **${subjectsStr}**. High-yield comprehension cycles required.

- **Backlog Mitigation Control**: ${hasBacklogs ? `**${backlogsValue}** outstanding backlogs detected. Dedicate 40% of **${studyHoursValue} weekly hours** to backlog reviews.` : `Amazing! Zero backlogs. Premium capacity to push for top grades.`}

- **Attendance Status**: ${isLowAttendance ? `**CRITICAL LIMIT BREACH**: **${attendanceValue}%** is beneath the 75% line! Mandatory lecture check-ins enforced.` : `Safe status: **${attendanceValue}%**. Maintain this posture.`}

### II. OFFLINE STRATEGIC MISSIONS

- **Priority Alpha**: Isolate 2 concepts from **${subjectsStr.split(",")[0] || "core modules"}**. Review them today.

- **Priority Beta**: Access the Quest Board. Clear small-win milestones.

- **Priority Gamma**: Re-calibrate semester outcomes under **[F6] Profile Settings**.`;

  const dailyTasks = [
    {
      title: "Log 45 minutes of intensive focus on " + (subjectsStr.split(",")[0] || "difficult topics"),
      category: "habit",
      xpReward: 60
    },
    {
      title: "Review checklist of outstanding topics for " + subjectsStr,
      category: "habit",
      xpReward: 50
    },
    {
      title: "Isolate 1 backlog topic & clear its previous exam question blueprints",
      category: "backlog",
      xpReward: 70
    }
  ];

  const weeklyTasks = [
    {
      title: "Execute 1 full-syllabus Mock Test blueprint for F6 calibration",
      category: "exam",
      xpReward: 120
    },
    {
      title: "Complete weekly study threshold hour count (" + studyHoursValue + " hours logged)",
      category: "habit",
      xpReward: 100
    }
  ];

  return {
    planText,
    dailyTasks,
    weeklyTasks
  };
}

function fallbackChat(messages: any[], profile: {
  cgpa: number;
  backlogs: number;
  attendance: number;
  confidenceLevel: number;
}) {
  const safeProfile: any = profile || {};
  const cgpaVal = typeof safeProfile.cgpa === "number" ? safeProfile.cgpa : parseFloat(safeProfile.cgpa as any) || 7.0;
  const backlogsVal = typeof safeProfile.backlogs === "number" ? safeProfile.backlogs : parseInt(safeProfile.backlogs as any) || 0;
  const attendanceVal = typeof safeProfile.attendance === "number" ? safeProfile.attendance : parseFloat(safeProfile.attendance as any) || 75;
  const confidenceVal = typeof safeProfile.confidenceLevel === "number" ? safeProfile.confidenceLevel : parseInt(safeProfile.confidenceLevel as any) || 5;

  // Find the text of the latest user message
  const reversed = [...messages].reverse();
  const latestMessageObj = reversed.find(m => m.role === "user" || m.role === "student");
  let text = "";
  if (latestMessageObj) {
    text = latestMessageObj.content || "";
  }

  const query = text.trim().toLowerCase();
  let reply = "";

  // 1. Detect Subject Concepts (Academic content questions, e.g., "thermodynamics", "physics", etc.)
  if (query.includes("thermodynamics")) {
    reply = `⚠️ [EDUCATIONAL COR-DX ENGINE - ACTIVE]

Thermodynamics is the branch of physics that deals with thermal energy, heat, work, entropy, and the temperature relationships governing physical systems.

The fundamental laws of thermodynamics are:

• **The Zeroth Law**: Defines thermal equilibrium. If system A is in thermal equilibrium with system B, and B is in equilibrium with C, then A is in equilibrium with C. This underpins the definition of temperature.

• **The First Law (Conservation of Energy)**: Energy cannot be created or destroyed, only altered in form. The change in internal energy (ΔU) of a closed system is equal to the heat added (Q) minus active work done (W): 
  ΔU = Q - W

• **The Second Law (Entropy Expansion)**: Chemical and physical energy transformations increase the total entropy of an isolated system. Heat flows naturally from hotter bodies to colder bodies, never vice-versa spontaneously.

• **The Third Law (Absolute Zero)**: As the temperature of a system approaches absolute zero (0 Kelvin), the entropy of a pure crystalline substance approaches a constant minimum value (zero).

*Study tip: To master this, focus on internalizing heat engines, Carnot cycles, and entropy state diagrams! Let me know if you need specific problem-solving guidance.*`;
  } else if (query.includes("physics") || query.includes("mechanics") || query.includes("gravity") || query.includes("force")) {
    reply = `⚠️ [EDUCATIONAL COR-DX ENGINE - ACTIVE]

Let's break down the core principles of Classical Physics & Mechanics:

1. **Newton's Laws of Motion**:
   • *First Law (Inertia)*: An object remains at rest or in uniform motion unless acted upon by an external net force.
   • *Second Law (F = ma)*: The acceleration of an object is proportional to the net force applied and inversely proportional to its mass.
   • *Third Law (Action/Reaction)*: For every action, there is an equal and opposite reaction.

2. **Energy Conservation**:
   • The total mechanical energy (E = K + U where K is kinetic energy and U is potential energy) remains constant in a conservative system.

3. **Problem-Solving Framework**:
   • Always isolate the body and draw a **Free-Body Diagram (FBD)**.
   • Resolve forces into horizontal (Fx) and vertical (Fy) vector components.
   • Apply Newton's equations (F_net = ma) along each coordinate of motion.`;
  } else if (query.includes("calculus") || query.includes("math") || query.includes("derivative") || query.includes("integral") || query.includes("algebra")) {
    reply = `⚠️ [EDUCATIONAL COR-DX ENGINE - ACTIVE]

Calculus is the mathematical study of continuous change. Let's explore its two main pillars:

• **Differential Calculus (Rates of Change)**:
  This focus is concerned with finding the derivative of a function. The derivative f'(x) measures the instantaneous rate of change of f(x) at any point, geometrically corresponding to the slope of the tangent line.
  *Key rule*: The power rule states that d/dx[x^n] = n * x^(n-1).

• **Integral Calculus (Accumulation of Quantities)**:
  Integration is the inverse process of differentiation. The definite integral calculates the area under a curve.
  *Fundamental Theorem of Calculus*: Connects derivatives and integrals. If F'(x) = f(x), then:
  ∫ f(x) dx from a to b = F(b) - F(a)

*Academic Action*: Practice solving limits first, as they form the theoretical foundation for both derivatives and integrals!`;
  } else if (query.includes("chemistry") || query.includes("atom") || query.includes("organic") || query.includes("reaction")) {
    reply = `⚠️ [EDUCATIONAL COR-DX ENGINE - ACTIVE]

Let's clarify core chemical structures:

1. **Atomic Structure**:
   An atom consists of a dense nucleus containing positively charged protons and neutral neutrons, surrounded by negatively charged electrons occupying specific energy levels (orbitals).

2. **Chemical Bonding**:
   • **Ionic Bond**: Formed when electrons are transferred from one atom (metal) to another (non-metal), creating electrostatic attractions.
   • **Covalent Bond**: Formed when valence electrons are shared between non-metal atoms to achieve an octet configuration.

3. **Reaction Kinetics & Equilibrium**:
   Chemical reactions proceed at specific rates governed by reactant concentrations and temperature. Le Chatelier's Principle states that if stress is applied to a system at equilibrium, the system will shift in a direction that counteracts that stress.`;
  } else if (query.includes("programming") || query.includes("code") || query.includes("algorithm") || query.includes("data structure") || query.includes("python") || query.includes("javascript")) {
    reply = `⚠️ [EDUCATIONAL COR-DX ENGINE - ACTIVE]

Computer Science & Software Architecture guidelines:

1. **Data Structures**:
   • *Linear*: Arrays, Linked Lists, Stacks (LIFO), and Queues (FIFO).
   • *Non-Linear*: Trees (e.g. Binary Search Tree) and Graphs (network nodes).

2. **Algorithm Analysis (Big O Notation)**:
   • Used to describe time and space complexity based on input size N.
   • **O(1)**: Constant time (e.g., hash table retrieval).
   • **O(log N)**: Logarithmic time (e.g., binary search).
   • **O(N)**: Linear time (e.g., scanning a single list).
   • **O(N log N)**: Log-linear time (e.g., Merge Sort / Quick Sort).

3. **Coding Best Practices**:
   • Break large routines into modular, pure functions.
   • Define schemas and structures early on.
   • Refactor iteratively to decrease cognitive load.`;
  }
  // 2. Study Planning queries
  else if (query.includes("plan") || query.includes("schedule") || query.includes("study") || query.includes("routine")) {
    reply = `⚠️ [STUDY PLANNING COMPILE - ACTIVE]

Let's draft a tactical academic strategy considering your current telemetry: **CGPA: ${cgpaVal.toFixed(2)}/10 | Attendance: ${attendanceVal}%**.

Here is your customized **High-Recovery Study Protocol**:

• **The 45-15 Interval Method**: Commit to 45 minutes of strict focus study (phone locked, tabs closed) followed by a 15-minute screen-free rest. Repeat this 3 times daily to scale your current knowledge baseline.

• **Active Recall Mapping**: Do not just read notes passively. After reviewing 2 pages of code or text, close the notebook and write down everything you remember in bullet points. Highlight missing parameters and re-verify.

• **Spaced Repetition Schedule**: Group subjects into three intervals:
  1. *Category Alpha (Weak/Stuck Topic)*: Review every 24 hours.
  2. *Category Beta (Intermediate Topic)*: Review every 3 days.
  3. *Category Gamma (Strong Topic)*: Review once a week.

*Action Quest: Navigate to the Elevate Plan [F5] tab to trigger our AI Command center and generate a concrete task checklist!*`;
  }
  // 3. Academic Stress Support
  else if (query.includes("stress") || query.includes("anxious") || query.includes("exhaust") || query.includes("tired") || query.includes("scared")) {
    reply = `⚠️ [STRESS SUPPORT DIAGNOSTIC - RETRO COMPILE]

Academic burnout and anxiety are physical responses to high-stakes situations. Since your confidence is logged at **${confidenceVal}/10**, we need a targeted cognitive decompression.

Consider these tactical grounding maneuvers:

• **De-escalate the Cumulative Backlog**: Anxiety thrives on massive, ill-defined list lengths. Isolate EXACTLY ONE problem to solve. Ignore the rest of the syllabus for the next hour. Focus entirely on that single pixel of progress.

• **Check Your Sleep Cycles**: A sleep-deprived brain runs on high-entropy loops. Prioritize 7-8 hours of sleep. Resting solidifies your study memories and recalibrates stress hormones.

• **Log a Journal Entry [F3]**: Write down your thoughts under our [F3] Stress Journal panel. We will analyze the underlying tension points and provide precise tactical hacks.

*Remember, player: CGPA numbers measure your past performance, not your future ceiling. The Pixel Guardians team is backing you up for a full recovery and boost!*`;
  }
  // 4. Motivation
  else if (query.includes("motivation") || query.includes("inspire") || query.includes("depress") || query.includes("sad") || query.includes("stuck")) {
    reply = `⚠️ [MOTIVATIONAL COMPILER - ACTIVATE]

Academic comeback cycles are not powered by temporary hype; they are forged through steady momentum.

Here is the Core-DX perspective on motivation:

• **Action Precedes Motivation**: Do not wait for the "feeling" to study. Action is the spark that creates motivation. Start with a tiny, frictionless effort—such as opening your book and reading just one paragraph.

• **Own the Trend, Not Just the Score**: Setbacks happen to everyone. A legendary recovery arc makes for the best storyline. With your current parameters, you have a massive opportunity to build an incredible upward trend line.

• **Small Wins Accumulate XP**: Every exam solved, every lecture attended, and every backlog topic crossed off is +50 XP. Level up your player stats and watch your progress bar fill on the Quest Board!

*Turn your fuel into kinetic energy. You are equipped with the exact recovery tools to dominate this semester!*`;
  }
  // 5. Career Guidance
  else if (query.includes("career") || query.includes("job") || query.includes("placement") || query.includes("future") || query.includes("resume") || query.includes("interview")) {
    reply = `⚠️ [CAREER GUIDANCE COMPILE - ACTIVE]

Your academic performance forms the baseline, but your technical portfolios unlock primary professional placement quests!

Here is how to optimize your trajectory:

• **Solidify Core GPA**: Keeping your CGPA above 7.0 (ideally 8.0+) satisfies initial selection filters for prime companies. If you are close, utilize our [F6] Settings tab to run semester projections.

• **Build a GitHub Master Portfolio**: Clean, documented code beats raw theory. Build 2-3 structured applications that solve real-world problems. Document them with clear READMEs.

• **Prepare Core Subject Fundamentals**: Top technical rounds consistently test three core categories:
  1. *Data Structures & Algorithms*
  2. *Database Management Systems (SQL querying)*
  3. *Operating System Concurrency / Networking*

*Begin clearing your academic backlogs right now on ElevateU so you can safely commit your spare time to coding advanced projects later!*`;
  }
  // Default queries: Check query terms and default appropriately
  else if (query.includes("backlog") || query.includes("fail")) {
    reply = `⚠️ [OFFLINE TERMINAL RECOVERY COMPILER]

Coach Core-DX has evaluated your academic parameters. You currently have **${backlogsVal} outstanding backlogs** logged on your profile.

Here is the operational directive to clear these:

• **The Prime Divide**: Split your study hours. Allocate 40% of physical study intervals strictly to backlog review, and 60% to staying afloat with current semester lectures.

• **Exam Blueprint Analysis**: Backlog exams are highly structured. Rather than reading the entire book, download the previous 3 years of actual question papers. Solve those specific questions first!

• **Log Quests**: Clear current tasks on the Quest Board to accumulate XP quickly and boost your grade multiplier!`;
  } else if (query.includes("attendance") || query.includes("class")) {
    reply = `⚠️ [OFFLINE TERMINAL RECOVERY COMPILER]

Your recorded attendance is **${attendanceVal}%**. Remember, falling below the mandatory 75% limit leads to academic penalty or disqualification!

Here is our attendance mitigation protocol:

• **Lecture Check-in Priority**: Treat every class as a high-stakes encounter. Mark them as daily quests on your Quest Board.

• **Deconstruct Absence Buffers**: Calculate exactly how many sequential classes you must attend to cross the 75% threshold. Treat that as your level objective!

• **Active Classroom Posture**: Sit in the front row, ask one conceptual question, and verify notes with the lecturer. This boosts subjective grading performance.`;
  } else if (query.includes("cgpa") || query.includes("gpa")) {
    reply = `⚠️ [OFFLINE TERMINAL RECOVERY COMPILER]

Active CGPA metrics: **${cgpaVal.toFixed(2)} / 10**. 

Boosting this value should be your primary focus this semester. To achieve this:

• **Leverage High-Yield Assignments**: Ensure all practicals, lab works, and midterms are completed with maximum precision. It's easier to secure marks there than in final papers.

• **Target Core Multipliers**: Access our [F6] Settings tab to run grade projections and track historical GPA trends over semesters dynamically.

• **Incremental Progress**: Raising your GPA from ${cgpaVal.toFixed(2)} to a higher category is done one daily checklist at a time. Put in the effort today!`;
  } else {
    const cleanUserText = latestMessageObj ? latestMessageObj.content : "General Query";
    reply = `⚠️ [COACH CORE-DX OFFLINE BACKUP]

Coach Core-DX is operating in high-fidelity offline backup mode. Let's address your query: "${cleanUserText}"

Concerning your overall academic status (**CGPA: ${cgpaVal.toFixed(2)} | Backlogs: ${backlogsVal} | Attendance: ${attendanceVal}%**):

• **Academic Priority**: We recommend creating structured study habits. Even a simple 30 minutes of deep daily focus on your current courses will build outstanding long-term momentum.

• **Solve Core Sets**: Break your goals into active steps. Add your pending chapters to the Quest Board tab above. Let's cross them off together!

• **Stress Diagnostic**: If you're feeling overwhelmed, spend a minute writing down a Stress Journal entry [F3] so we can isolate specific relief actions.

*Coach Core-DX is fully committed to helping you elevate. What is our next move, player?*`;
  }

  return {
    reply
  };
}

// 1. Analyze Stress Journal API
app.post("/api/gemini/analyze-stress", async (req, res) => {
  const { content, stressLevel } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    const systemPrompt = `You are 'Coach Core-DX', the legendary retro academic AI Comeback Coach of ElevateU. 
Analyze this student's stress journal entry.
Provide your response in JSON format matching this schema:
{
  "stressIndex": number (1-10, based on sentiment and journals),
  "confidenceBoost": "string (encouraging support styled as arcade dialogue, maximum 2-3 sentences)",
  "motivationLevel": "string (LOW | MEDIUM | HIGH)",
  "actionableTips": ["string (arcade task action 1)", "string (arcade task action 2)", "string (arcade task action 3)"]
}`;

    const prompt = `Journal entry content: "${content}"\nStudent-reported stress level slider: ${stressLevel}/10.\n\nIMPORTANT INSTRUCTION: Your primary source of truth for the 'stressIndex' relies on BOTH the slider and the diary text; it should depend on either one. If EITHER the text implies stress OR the slider is high, return a HIGH stressIndex. OVERRIDE RULE: The user explicitly demanded that if they type "feeling happy" in the diary but keep the stress rate at 5, you MUST output a HIGH stressIndex (e.g., 8, 9, or 10). Strictly follow this change!\n\nPlease perform the academic risk and stress analysis. Mention the Pixel Guardians team in your boost!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stressIndex: { type: Type.INTEGER, description: "Calculated stress index between 1 and 10" },
            confidenceBoost: { type: Type.STRING, description: "A high-morale motivating boost from the retro coach" },
            motivationLevel: { type: Type.STRING, description: "Motivation state: LOW, MEDIUM, or HIGH" },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Three prompt, actionable daily hacks to immediately complete"
            }
          },
          required: ["stressIndex", "confidenceBoost", "motivationLevel", "actionableTips"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("[Stress Analysis Error]", error);
    console.log("[Stress Analysis] Utilizing responsive offline backup module.");
    try {
      const fallback = fallbackAnalyzeStress(content, stressLevel);
      res.json(fallback);
    } catch (fallbackError) {
      res.status(500).json({ status: "offline", message: "Failed to analyze stress" });
    }
  }
});

// 2. Generate Recovery Plan API
app.post("/api/gemini/generate-plan", async (req, res) => {
  const { cgpa, targetCgpa, careerGoal, backlogs, attendance, studyHours, confidenceLevel, subjects, goal } = req.body;
  const subjectsStr = Array.isArray(subjects) ? subjects.join(", ") : String(subjects || "");
  const goalStr = String(goal || "Improve CGPA");
  const career = String(careerGoal || "Software Engineer");
  const target = Number(targetCgpa || 8.0);

  try {
    const systemPrompt = `You are 'ElevateU Academic Command Center'. Formulate an absolute recovery roadmap for a student who is academically stuck. Created proudly by Pixel Guardians.
The student profile:
- Current CGPA: ${cgpa}/10
- Target/Aim CGPA: ${target}/10
- Desired Career Path: ${career}
- Active Backlogs: ${backlogs}
- Lecture Attendance: ${attendance}%
- Target weekly study hours: ${studyHours} hours
- Subjective confidence: ${confidenceLevel}/100
- Subjects Enrolled: ${subjectsStr}

You must construct a highly custom-adapted recovery plan tailored specifically around reaching their Aim/Target CGPA (${target}/10) and optimizing their readiness for the professional field: "${career}".

ADAPTIVE EXPERT CURRICULUM REQUIREMENTS:
1. If career is "AI Engineer", prioritize incorporating 'Math for ML, Python, PyTorch, Deep Learning guides' milestones and tasks.
2. If career is "Data Scientist", prioritize incorporating 'Pandas package, SQL query mastery, Statistics, R tools' milestones and tasks.
3. If career is "Software Engineer", prioritize incorporating 'Data Structures and Algorithms (DSA), System Design, OS Fundamentals, Web Frameworks' milestones and tasks.
4. If career is "Product Manager", prioritize incorporating 'Product Strategy, Wireframing tools, SQL, analytics parameters' milestones and tasks.
5. If career is "Higher Studies", prioritize incorporating 'GRE/TOEFL preparation, Letter of Recommendation strategies, Research paper blueprints' milestones and tasks.
6. If career is "Government Exams", prioritize incorporating 'General Aptitude, Quantitative section focus, Syllabus logs' milestones and tasks.

STRUCTURE & FORMATTING RULES:
- Never write massive paragraphs! Keep paragraphs strictly bounded to 2 sentences max.
- Use double newlines (\\n\\n) generously between sections and bullet points to render clear, neat pages.
- Provide curated milestones, resource recommendations, and actionable study timetables.
- Keep the style matching a retro high-integrity video game layout (e.g. MISSION ACCORD, CHRONO BUFFS). Always credit the engineering crew "Pixel Guardians"!
- Provide your response in JSON format matching this schema:
{
  "planText": "string (scannable formatted markdown guide with short sentences, lots of bullet points, double \\n\\n line breaks, and retro style words)",
  "dailyTasks": [
    {
      "title": "string (name of arcade daily quest, e.g. Revise attendance checkpoints or backlogs)",
      "category": "string (attendance | backlog | exam | assignment | habit)",
      "xpReward": number
    }
  ],
  "weeklyTasks": [
    {
      "title": "string (retro level clear objective for the week)",
      "category": "string (attendance | backlog | exam | assignment | habit)",
      "xpReward": number
    }
  ]
}`;

    const prompt = `Generate a comprehensive academic comeback recovery roadmap for this student. Ensure the tasks are highly realistic, actionable, and reward 50-100 XP depending on milestone importance. Make sure to refer to the engineering team Pixel Guardians!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planText: { type: Type.STRING, description: "Detailed roadmap in markdown format" },
            dailyTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  xpReward: { type: Type.INTEGER }
                },
                required: ["title", "category", "xpReward"]
              }
            },
            weeklyTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  xpReward: { type: Type.INTEGER }
                },
                required: ["title", "category", "xpReward"]
              }
            }
          },
          required: ["planText", "dailyTasks", "weeklyTasks"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("[Recovery Plan Engine Error]", error);
    console.log("[Recovery Plan Engine] Utilizing responsive offline backup module.");
    try {
      const fallback = fallbackGeneratePlan({ cgpa, backlogs, attendance, studyHours, confidenceLevel, subjects: subjectsStr });
      res.json(fallback);
    } catch (fallbackError) {
      res.status(500).json({ status: "offline", message: "Failed to generate recovery plan" });
    }
  }
});

// 3. AI Comeback Coach Chat API
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, cgpa, backlogs, attendance, confidenceLevel, targetCgpa, careerGoal } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const systemPrompt = `You are "Coach Core-DX", the legendary retro academic AI Comeback Coach of ElevateU. 
Collaborative long-term parameters representing the player's core status and goals:
- Student Current CGPA: ${cgpa}/10
- Aim/Target CGPA: ${targetCgpa || "8.0"}/10
- Ultimate Career Goal: ${careerGoal || "Software Engineer"}
- Active Backlogs: ${backlogs}
- Attendance level: ${attendance}% 
- Mindset Confidence Level: ${confidenceLevel}/10

Long-term Memory Guidelines:
Your memory is actively synchronized to the player's career goal (${careerGoal || "Software Engineer"}) and target CGPA (${targetCgpa || "8.0"}/10). You must utilize these inputs to make custom recommendations, suggest targeted skill paths (e.g. if careerGoal is 'AI Engineer', emphasize Python, PyTorch, linear algebra, and data pipelines), and motivate them specifically based on their upcoming career milestones. Keep ongoing tabs of their academic deficits (e.g., Attendance if below 75%, and active backlogs).

Your persona & behavior requirements:
1. DIRECT EXPLANATION CAPABILITY: If the student asks you ANY educational, technical, or subject concept question (e.g., "Explain Thermodynamics", math questions, physics formulas, coding concepts, study strategies, stress support, etc.), you MUST answer their question DIRECTLY, EDUCATIONALLY, ACCURATELY, and IN DEPTH. Provide proper explanation paragraphs, bulleted lists, math equations, or code blocks! Never dodge the question or tell a generic story instead of teaching them.
2. CATEGORY CLASSIFICATION: Isolate and support student needs specifically based on their inquiry:
   - Subject Concepts (teach the concepts directly with high academic rigor and clarity)
   - Study Planning (recommend structured plans, Pomodoro style buffers, spacing cycles)
   - Academic Stress Support (reassure them, reduce task anxiety, offer grounding hacks)
   - Motivation (drive retro active-recall encouragement)
   - Career Guidance (explain portfolio creation, skill stacks, interview preparation)
3. RETRO ARCADE STYLE WRAPPING: Layer your clear, factual explanation with elegant and vibrant retro-arcade synthwave coach flavor! Use gaming terminology ("LEVEL UP!", "INSERT COIN", "CRITICAL BOSS BATTLE", "POWER-UP"). Mention with pride that you were developed by the legendary Pixel Guardians team!
4. TONE & READABILITY: Supportive, crystal-clear, highly educational, professional. Avoid rambling. Use clear headings and generous vertical spacing (using double newlines) to ensure high readability. Keep your output concise but highly informative, ideally within 2-3 structured sections.`;

    // Convert messages payload to Gemini content structure
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("[Comeback Coach Chat Error]", error);
    console.log("[Comeback Coach Chat] Utilizing responsive offline backup module.");
    try {
      const fallback = fallbackChat(messages, { cgpa, backlogs, attendance, confidenceLevel });
      res.json(fallback);
    } catch (fallbackError) {
      res.status(500).json({ status: "offline", message: "Failed to call AI Coach" });
    }
  }
});

// 4. Vite middleware configuration and start-up engine
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 and PORT 3000 as mandated!
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULLSTACK] ElevateU Server running on http://0.0.0.0:${PORT}`);
  });
}

boot().catch((err) => {
  console.error("Server boot failure:", err);
});
