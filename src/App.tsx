import React, { useState, useEffect } from "react";
import { ArcadeCabinet } from "./components/ArcadeCabinet";
import { ProfileForm } from "./components/ProfileForm";
import { DashboardStats } from "./components/DashboardStats";
import { QuestBoard } from "./components/QuestBoard";
import { StressJournal } from "./components/StressJournal";
import { AICoachChat } from "./components/AICoachChat";
import { Markdown } from "./components/Markdown";
import { ProfileSettings } from "./components/ProfileSettings";
import { StudentProfile, JournalEntry, RecoveryPlan, AcademicTask, ChatMessage } from "./types";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { playCoinSound, playLevelUpSound, playClickSound, playBuzzerSound, playPowerUp } from "./utils/audio";
import { Gamepad2, Sparkles, UserCheck, Play, Award, HelpCircle, BookOpen, ChevronRight, Activity, Cpu, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";

export default function App() {
  // Global Session state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Core Data models
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);

  // Navigation & Control
  const [activeTab, setActiveTab ] = useState<"dashboard" | "quests" | "journal" | "coach" | "roadmap" | "settings">("dashboard");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [toasts, setToasts] = useState<{id: number, msg: string}[]>([]);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Progressive Web App (PWA) Event Controls & Statuses
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      console.log("[PWA] beforeinstallprompt event captured!");
    };
    
    const handleOnlineStatus = () => {
      setIsOnline(true);
      addToast("SYSTEM ONLINE. BACKEND SYNC ACTIVE!");
    };
    
    const handleOfflineStatus = () => {
      setIsOnline(false);
      addToast("SYSTEM RUNNING OFFLINE. LOCAL DISK STORAGE ENGAGED!");
    };

    const detectStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (detectStandalone) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOfflineStatus);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    playClickSound();
    installPromptEvent.prompt();
    try {
      const { outcome } = await installPromptEvent.userChoice;
      console.log(`[PWA] Install status choice outcome: ${outcome}`);
      if (outcome === "accepted") {
        setInstallPromptEvent(null);
        setIsInstalled(true);
        addToast("ELEVATEU DOCKED TO YOUR HOME SCREEN!");
      }
    } catch (err) {
      console.error("[PWA] Client install failed:", err);
    }
  };

  const addToast = (msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Authentication observer link
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setLoadingAuth(true);
      if (fbUser) {
        setIsGuestMode(false);
        setCurrentUser(fbUser);
        await syncLiveFirebaseData(fbUser.uid);
      } else {
        // Try fallback to local Guest state if saved previously
        const storedGuest = localStorage.getItem("elevateu_guest_user");
        if (storedGuest) {
          setIsGuestMode(true);
          setCurrentUser({ uid: "guest_player_dx", email: "guest@pixelguardians.dev", displayName: "GUEST PLAYER" });
          syncGuestModeData();
        } else {
          setCurrentUser(null);
          clearLocalStates();
        }
      }
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  // Syncing functions - LIVE Firebase Integration
  const syncLiveFirebaseData = async (uid: string) => {
    try {
      // 1. Profile
      const profRef = doc(db, "profiles", uid);
      const profSnap = await getDoc(profRef);
      if (profSnap.exists()) {
        setProfile(profSnap.data() as StudentProfile);
      } else {
        setProfile(null); // Triggers creation wizard
      }

      // 2. Journals
      const qJournals = query(collection(db, "journals"), where("userId", "==", uid));
      const journalsSnap = await getDocs(qJournals);
      const journalsList: JournalEntry[] = [];
      journalsSnap.forEach((doc) => {
        journalsList.push(doc.data() as JournalEntry);
      });
      // Sort chronologically desc
      journalsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJournals(journalsList);

      // 3. Tasks / Quests
      const qTasks = query(collection(db, "tasks"), where("userId", "==", uid));
      const tasksSnap = await getDocs(qTasks);
      const tasksList: AcademicTask[] = [];
      tasksSnap.forEach((doc) => {
        tasksList.push(doc.data() as AcademicTask);
      });
      // Sort
      tasksList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(tasksList);

      // 4. Comeback Plan
      const planRef = doc(db, "recoveryPlans", uid);
      const planSnap = await getDoc(planRef);
      if (planSnap.exists()) {
        setPlan(planSnap.data() as RecoveryPlan);
      } else {
        setPlan(null);
      }

      // 5. Coach communication chat logs
      const chatRef = doc(db, "coachChats", uid);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const payload = chatSnap.data();
        if (payload?.messages) {
          setChats(JSON.parse(payload.messages));
        }
      } else {
        setChats([]);
      }

    } catch (err) {
      console.error("Firebase syncing failed", err);
    }
  };

  // Syncing functions - GUEST localStorage integration
  const syncGuestModeData = () => {
    const prof = localStorage.getItem("g_profile");
    if (prof) setProfile(JSON.parse(prof));

    const jList = localStorage.getItem("g_journals");
    if (jList) setJournals(JSON.parse(jList));

    const tList = localStorage.getItem("g_tasks");
    if (tList) setTasks(JSON.parse(tList));

    const rPlan = localStorage.getItem("g_plan");
    if (rPlan) setPlan(JSON.parse(rPlan));

    const cHistory = localStorage.getItem("g_chats");
    if (cHistory) setChats(JSON.parse(cHistory));
  };

  const clearLocalStates = () => {
    setProfile(null);
    setJournals([]);
    setTasks([]);
    setPlan(null);
    setChats([]);
  };

  const handleGoogleLogin = async () => {
    try {
      playLevelUpSound();
    } catch (e) {
      console.warn("Audio blocked by browser, continuing login flow.");
    }
    setLoginError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failure:", err);
      // Detailed error logging to help identify iframe/popup issues
      setLoginError(err.message || "Failed to initialize popup. Please ensure popups are permitted, or try opening the app in a new tab.");
    }
  };

  const handleGuestStart = () => {
    playPowerUp();
    localStorage.setItem("elevateu_guest_user", "true");
    setIsGuestMode(true);
    setCurrentUser({ uid: "guest_player_dx", email: "guest@pixelguardians.dev", displayName: "GUEST PLAYER" });

    // Bootstrap sandbox defaults
    const defaultProfile: StudentProfile = {
      userId: "guest_player_dx",
      displayName: "CHIP_DEFENDER",
      cgpa: 5.8,
      backlogs: 3,
      attendance: 64,
      studyHours: 40,
      confidenceLevel: 3,
      xp: 220,
      streak: 1,
      subjects: "Compiler Construction, Calculus III, Computer Architecture",
      goal: "Improve CGPA",
    };
    localStorage.setItem("g_profile", JSON.stringify(defaultProfile));

    const defaultTasks: AcademicTask[] = [
      { id: "t1", userId: "guest_player_dx", title: "Complete Calculus unit review", category: "backlog", done: false, xpReward: 80, createdAt: new Date().toISOString() },
      { id: "t2", userId: "guest_player_dx", title: "Check off 100% study schedule clock today", category: "habit", done: false, xpReward: 50, createdAt: new Date().toISOString() },
      { id: "t3", userId: "guest_player_dx", title: "Email instructor regarding attendance records", category: "attendance", done: true, xpReward: 50, createdAt: new Date().toISOString() },
    ];
    localStorage.setItem("g_tasks", JSON.stringify(defaultTasks));

    syncGuestModeData();
  };

  const handleLogout = async () => {
    if (isGuestMode) {
      localStorage.removeItem("elevateu_guest_user");
      setIsGuestMode(false);
      setCurrentUser(null);
      clearLocalStates();
    } else {
      await signOut(auth);
    }
  };

  // Actions: Save Profile Core Metadata
  const handleSaveProfile = async (newProfileData: Omit<StudentProfile, "xp" | "streak">) => {
    const fullProfile: StudentProfile = {
      ...newProfileData,
      xp: profile?.xp || 0,
      streak: profile?.streak || 1,
    };

    if (isGuestMode) {
      localStorage.setItem("g_profile", JSON.stringify(fullProfile));
      setProfile(fullProfile);
    } else {
      const path = `profiles/${currentUser.uid}`;
      try {
        await setDoc(doc(db, "profiles", currentUser.uid), {
          ...fullProfile,
          createdAt: profile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setProfile(fullProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // Automatically trigger an AI recovery plan construct right upon initial check to deploy tasks
    await handleTriggerAIComputation(fullProfile);
  };

  // Actions: Trigger Gemini Recovery Plan Engine
  const handleTriggerAIComputation = async (activeProf = profile) => {
    if (!activeProf) return;
    setIsGeneratingPlan(true);

    try {
      const res = await fetch("/api/gemini/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cgpa: activeProf.cgpa,
          targetCgpa: activeProf.targetCgpa,
          careerGoal: activeProf.careerGoal,
          backlogs: activeProf.backlogs,
          attendance: activeProf.attendance,
          studyHours: activeProf.studyHours,
          confidenceLevel: activeProf.confidenceLevel,
          subjects: activeProf.subjects,
          goal: activeProf.goal,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${res.status}`);
      }

      if (data.error) throw new Error(data.error);

      // Create structured recovery program
      const recoveryProgram: RecoveryPlan = {
        userId: currentUser.uid,
        planText: data.planText || "Your strategy is currently compiling. For now, focus on the immediate daily missions provided below.",
        dailyTasks: data.dailyTasks || [],
        weeklyTasks: data.weeklyTasks || [],
        updatedAt: new Date().toISOString(),
      };

      // Transform tasks array to local Task schema
      const deployedQuests: AcademicTask[] = [];
      
      const dailyTasksList = Array.isArray(data.dailyTasks) ? data.dailyTasks : [];
      dailyTasksList.forEach((dt: any, ix: number) => {
        if (activeProf.backlogs === 0 && (dt.category === "backlog" || dt.title?.toLowerCase().includes("backlog"))) {
          return;
        }
        deployedQuests.push({
          id: `daily_${Date.now()}_${ix}`,
          userId: currentUser.uid,
          title: dt.title || "Daily Academic Quest",
          category: dt.category || "habit",
          done: false,
          xpReward: dt.xpReward || 50,
          createdAt: new Date().toISOString(),
        });
      });

      const weeklyTasksList = Array.isArray(data.weeklyTasks) ? data.weeklyTasks : [];
      weeklyTasksList.forEach((wt: any, ix: number) => {
        if (activeProf.backlogs === 0 && (wt.category === "backlog" || wt.title?.toLowerCase().includes("backlog"))) {
          return;
        }
        deployedQuests.push({
          id: `weekly_${Date.now()}_${ix}`,
          userId: currentUser.uid,
          title: wt.title || "Weekly Academic Milestone",
          category: wt.category || "backlog",
          done: false,
          xpReward: wt.xpReward || 100,
          createdAt: new Date().toISOString(),
        });
      });

      if (isGuestMode) {
        localStorage.setItem("g_plan", JSON.stringify(recoveryProgram));
        localStorage.setItem("g_tasks", JSON.stringify(deployedQuests));
        setPlan(recoveryProgram);
        setTasks(deployedQuests);
      } else {
        // Save to Live Firestore with proper catch wraps
        await setDoc(doc(db, "recoveryPlans", currentUser.uid), recoveryProgram);
        
        // Write generated tasks sequentially
        for (const q of deployedQuests) {
          await setDoc(doc(db, "tasks", q.id), q);
        }
        await syncLiveFirebaseData(currentUser.uid);
      }

      playLevelUpSound();
      setActiveTab("roadmap");

    } catch (err: any) {
      console.error("Plan Generation Error:", err);
      const errMsg = err.message || String(err);
      if (errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("key is missing") || errMsg.toLowerCase().includes("fallback") || errMsg.toLowerCase().includes("401") || errMsg.toLowerCase().includes("unauthorized")) {
        alert("GRID ANALYSIS INTERRUPTED: The Gemini API key is missing, unauthorized, or empty. Please ensure GEMINI_API_KEY is configured inside your local environment (.env file) or Settings > Secrets panel before re-triggering.");
      } else {
        alert(`GRID ANALYSIS INTERRUPTED: ${errMsg}`);
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Actions: Toggle Complete task & increment XP
  const handleToggleTask = async (taskId: string, isChecked: boolean, xpReward: number) => {
    // 1. Calculate XP increment/decrement
    let currentXp = profile?.xp || 0;
    let newXp = isChecked ? currentXp + xpReward : Math.max(0, currentXp - xpReward);

    const levelBefore = Math.floor(currentXp / 500) + 1;
    const levelAfter = Math.floor(newXp / 500) + 1;

    let confidenceInc = 0;
    
    if (isChecked) {
       confidenceInc = 3;
    }

    if (levelAfter > levelBefore) {
      playLevelUpSound();
      addToast(`LEVEL UP! You are now Level ${levelAfter}`);
    } else if (isChecked) {
      playCoinSound();
    }

    const safeTasksList = tasks || [];
    const updatedTasks = safeTasksList.map((t) => {
      if (t.id === taskId) return { ...t, done: isChecked };
      return t;
    });

    if (profile) {
      let currentConfidence = profile.confidenceLevel <= 10 ? profile.confidenceLevel * 10 : profile.confidenceLevel;
      let newConfidence = isChecked ? Math.min(100, currentConfidence + confidenceInc) : currentConfidence;
      
      const targetTask = safeTasksList.find(t => t.id === taskId);
      if (isChecked && confidenceInc > 0 && targetTask) {
         addToast(`Confidence +${confidenceInc}% — ${targetTask.title} Completed`);
      }

      const updatedProfile = { ...profile, xp: newXp, confidenceLevel: newConfidence };

      if (isGuestMode) {
        localStorage.setItem("g_tasks", JSON.stringify(updatedTasks));
        localStorage.setItem("g_profile", JSON.stringify(updatedProfile));
        setTasks(updatedTasks);
        setProfile(updatedProfile);
      } else {
        try {
          const matchedOrig = safeTasksList.find((t) => t.id === taskId);
          if (matchedOrig) {
            await setDoc(doc(db, "tasks", taskId), { ...matchedOrig, done: isChecked });
          }
          await setDoc(doc(db, "profiles", currentUser.uid), {
            ...updatedProfile,
            updatedAt: new Date().toISOString(),
          });
          setTasks(updatedTasks);
          setProfile(updatedProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `tasks/${taskId}`);
        }
      }
    }
  };

  // Actions: Add custom task manual
  const handleAddTaskManual = async (title: string, category: AcademicTask["category"], xpReward: number) => {
    const freshTask: AcademicTask = {
      id: `custom_${Date.now()}`,
      userId: currentUser.uid,
      title,
      category,
      done: false,
      xpReward,
      createdAt: new Date().toISOString(),
    };

    const safeTasksList = tasks || [];
    const newTasksList = [freshTask, ...safeTasksList];

    if (isGuestMode) {
      localStorage.setItem("g_tasks", JSON.stringify(newTasksList));
      setTasks(newTasksList);
    } else {
      try {
        await setDoc(doc(db, "tasks", freshTask.id), freshTask);
        setTasks(newTasksList);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tasks/${freshTask.id}`);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const safeTasksList = tasks || [];
    const filteredTasks = safeTasksList.filter((t) => t.id !== taskId);

    if (isGuestMode) {
      localStorage.setItem("g_tasks", JSON.stringify(filteredTasks));
      setTasks(filteredTasks);
    } else {
      try {
        await deleteDoc(doc(db, "tasks", taskId));
        setTasks(filteredTasks);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      }
    }
  };

  // Actions: Add Stress Journal entry with Gemini analysis proxy
  const handleAddJournal = async (content: string, stressLevel: number) => {
    try {
      // Submit to server for stress thermal evaluation
      const res = await fetch("/api/gemini/analyze-stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, stressLevel }),
      });
      const analysisResult = await res.json();

      if (!res.ok) {
        throw new Error(analysisResult.message || analysisResult.error || `HTTP error! status: ${res.status}`);
      }

      if (analysisResult.error) throw new Error(analysisResult.error);

      const freshJournal: JournalEntry = {
        id: `journal_${Date.now()}`,
        userId: currentUser.uid,
        content,
        stressLevel,
        analysis: analysisResult,
        createdAt: new Date().toISOString(),
      };

      const newJournalsList = [freshJournal, ...journals];

      if (isGuestMode) {
        localStorage.setItem("g_journals", JSON.stringify(newJournalsList));
        setJournals(newJournalsList);
      } else {
        try {
          await setDoc(doc(db, "journals", freshJournal.id), freshJournal);
          setJournals(newJournalsList);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `journals/${freshJournal.id}`);
        }
      }

      // Award bonus 100 XP for keeping track of your emotional thermal score!
      if (profile) {
        const curXp = profile.xp;
        const updatedProfile = { ...profile, xp: curXp + 100 };
        if (isGuestMode) {
          localStorage.setItem("g_profile", JSON.stringify(updatedProfile));
          setProfile(updatedProfile);
        } else {
          await setDoc(doc(db, "profiles", currentUser.uid), {
            ...updatedProfile,
            updatedAt: new Date().toISOString(),
          });
          setProfile(updatedProfile);
        }
      }
      playCoinSound();
    } catch (err: any) {
      console.error("Stress Journal Creation Error:", err);
      const errMsg = err.message || String(err);
      if (errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("key is missing") || errMsg.toLowerCase().includes("fallback") || errMsg.toLowerCase().includes("401") || errMsg.toLowerCase().includes("unauthorized")) {
        alert("JOURNAL SYNC HALTED: The Gemini API key is missing or unauthorized. Please ensure GEMINI_API_KEY is configured inside your local environment (.env file) or Settings > Secrets panel before submitting.");
      } else {
        alert(`JOURNAL SYNC HALTED: ${errMsg}`);
      }
    }
  };

  const handleDeleteJournal = async (journalId: string) => {
    const filtered = journals.filter((j) => j.id !== journalId);
    if (isGuestMode) {
      localStorage.setItem("g_journals", JSON.stringify(filtered));
      setJournals(filtered);
    } else {
      try {
        await deleteDoc(doc(db, "journals", journalId));
        setJournals(filtered);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `journals/${journalId}`);
      }
    }
    addToast("JOURNAL DELETED. MEMORY PURGED.");
  };

  const handleEditJournal = async (journalId: string, newContent: string, newStressLevel: number) => {
    const res = await fetch("/api/gemini/analyze-stress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent, stressLevel: newStressLevel }),
    });
    const analysisResult = await res.json();
    if (analysisResult.error) throw new Error(analysisResult.error);

    const updatedJournals = journals.map((j) => {
      if (j.id === journalId) {
        return {
          ...j,
          content: newContent,
          stressLevel: newStressLevel,
          analysis: analysisResult,
          updatedAt: new Date().toISOString()
        };
      }
      return j;
    });

    if (isGuestMode) {
      localStorage.setItem("g_journals", JSON.stringify(updatedJournals));
      setJournals(updatedJournals);
    } else {
      try {
        const targetJournal = updatedJournals.find((j) => j.id === journalId);
        if (targetJournal) {
          await setDoc(doc(db, "journals", journalId), targetJournal);
        }
        setJournals(updatedJournals);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `journals/${journalId}`);
      }
    }
    playCoinSound();
    addToast("JOURNAL MODIFIED. ANALYSIS RE-CALCULATED!");
  };

  const handleRestartJourney = async () => {
    if (profile) {
      const resetProfile: StudentProfile = {
        userId: profile.userId,
        displayName: profile.displayName || "GUEST PLAYER",
        cgpa: 5.0,
        targetCgpa: 8.0,
        careerGoal: "Software Engineer",
        backlogs: 0,
        attendance: 75,
        studyHours: 15,
        confidenceLevel: 50,
        subjects: "Database Systems, OS, Software Engineering",
        goal: "placement",
        xp: 0,
        streak: 0,
        cgpaHistory: []
      };

      const initialTasks: AcademicTask[] = [
        { id: "t1", userId: currentUser?.uid || "guest_player_dx", title: "Complete academic onboarding check-in setup matrix", category: "habit", done: false, xpReward: 100, createdAt: new Date().toISOString() },
        { id: "t2", userId: currentUser?.uid || "guest_player_dx", title: "Complete initial stress thermal scanner run", category: "habit", done: false, xpReward: 100, createdAt: new Date().toISOString() }
      ];

      if (isGuestMode) {
        localStorage.setItem("g_profile", JSON.stringify(resetProfile));
        localStorage.setItem("g_tasks", JSON.stringify(initialTasks));
        localStorage.setItem("g_journals", JSON.stringify([]));
        localStorage.removeItem("g_plan");
        setProfile(resetProfile);
        setTasks(initialTasks);
        setJournals([]);
        setPlan(null);
      } else if (currentUser) {
        try {
          await setDoc(doc(db, "profiles", currentUser.uid), resetProfile);
          await setDoc(doc(db, "recoveryPlans", currentUser.uid), {});
          
          for (const t of tasks) {
            await deleteDoc(doc(db, "tasks", t.id));
          }
          for (const t of initialTasks) {
            await setDoc(doc(db, "tasks", t.id), t);
          }
          for (const j of journals) {
            await deleteDoc(doc(db, "journals", j.id));
          }
          setProfile(resetProfile);
          setTasks(initialTasks);
          setJournals([]);
          setPlan(null);
        } catch (err: any) {
          console.error("Firebase Reset Error:", err);
        }
      }
    }
    playLevelUpSound();
    setShowResetModal(false);
    setActiveTab("dashboard");
    addToast("JOURNEY REBOOT COMPLETE. CODE BASE SECURED.");
  };

  // Actions: Send Dialog text to AI Comeback Coach
  const handleSendMessageToCoach = async (text: string) => {
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextChats = [...chats, userMsg];
    setChats(nextChats);
    setChatLoading(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextChats,
          cgpa: profile?.cgpa || 7.0,
          targetCgpa: profile?.targetCgpa || 8.0,
          careerGoal: profile?.careerGoal || "Software Engineer",
          backlogs: profile?.backlogs || 0,
          attendance: profile?.attendance || 75,
          confidenceLevel: profile?.confidenceLevel || 5,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${res.status}`);
      }

      if (data.error) throw new Error(data.error);

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalChats = [...nextChats, aiMsg];
      setChats(finalChats);

      if (isGuestMode) {
        localStorage.setItem("g_chats", JSON.stringify(finalChats));
      } else {
        await setDoc(doc(db, "coachChats", currentUser.uid), {
          id: currentUser.uid,
          userId: currentUser.uid,
          messages: JSON.stringify(finalChats),
          updatedAt: new Date().toISOString(),
        });
      }

      playCoinSound();

    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      let assistantMsgContent = "COACH TERMINAL OVERLOAD. DETECTED BROKEN INTERACTION PORT CORES.";
      if (errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("key is missing") || errMsg.toLowerCase().includes("fallback") || errMsg.toLowerCase().includes("401") || errMsg.toLowerCase().includes("unauthorized")) {
        assistantMsgContent = "⚠️ DIRECTIVE ERROR: The Gemini API key is missing or unauthorized. Please verify that GEMINI_API_KEY is configured inside your local environment (.env file) or Settings > Secrets panel before resuming communication.";
      }
      setChats([
        ...nextChats,
        { role: "assistant", content: assistantMsgContent, timestamp: "SYSTEM" },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetCoachChat = () => {
    setChats([]);
    if (isGuestMode) {
      localStorage.removeItem("g_chats");
    } else {
      deleteDoc(doc(db, "coachChats", currentUser.uid)).catch(console.error);
    }
  };

  // Main UI Loader Screen
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#020617] text-[#00ffff] flex flex-col justify-center items-center font-mono border-8 border-[#1e293b]">
        <div className="flex flex-col items-center gap-4">
          <Gamepad2 className="w-12 h-12 text-[#ff00ff] animate-spin" />
          <h2 className="text-sm font-bold text-[#00ffff] uppercase tracking-widest animate-pulse font-mono">
            LOADING MEMORY CARTRIDGES...
          </h2>
        </div>
      </div>
    );
  }

  // 1. Splash / Login state
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#020617] text-neutral-100 flex flex-col justify-center items-center font-mono relative p-4 selection:bg-[#ff00ff] border-8 border-[#1e293b]">
        <div className="absolute inset-0 bg-[radial-gradient(#00ffff_0.5px,transparent_1.5px)] [background-size:32px_32px] opacity-15" />
        
        {/* Glowing Neo Cabinet Frame */}
        <div className="w-full max-w-lg border-4 border-[#ff00ff] bg-[#0f172a] rounded-xl relative overflow-hidden shadow-[6px_6px_0_0_#4a044e] p-6 md:p-8 text-center flex flex-col items-center">
          
          <div className="absolute top-2 right-2 animate-ping rounded-full h-3 w-3 bg-[#00ffff]" />
          
          {/* Team Marquee badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ff00ff]/15 border-2 border-[#ff00ff] text-[#ff00ff] text-xs font-black uppercase mb-4 tracking-widest">
            ENGINEERED BY PIXEL GUARDIANS
          </div>

          {/* Logo Brand */}
          <div className="bg-gradient-to-tr from-[#ff00ff] to-[#00ffff] p-4 border-2 border-white mb-4 shadow-[4px_4px_0_0_#ffffff] animate-bounce">
            <TrendingUp className="w-12 h-12 text-black" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-[#00ffff] uppercase tracking-tighter italic">
            ElevateU
          </h1>
          <p className="text-[10px] text-[#00ffff] tracking-widest font-extrabold uppercase mt-2">
            AI-POWERED ACADEMIC BOOST & RECOVERY SYSTEM
          </p>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed uppercase max-w-sm font-sans mx-auto font-medium">
            Early detection of academic decline, mental load scans, personalized comeback quest roadmaps, with 8-bit motivational dialogues.
          </p>

          {/* Authentic login loops */}
          <div className="mt-8 space-y-4 w-full">
            {loginError && (
              <div className="w-full p-3 border-2 border-rose-500 bg-rose-950/40 text-rose-400 text-xs font-mono font-bold uppercase rounded shadow-[4px_4px_0_0_#4a044e]">
                <p className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> AUTHENTICATION ERROR</p>
                <p className="mt-1 opacity-80 text-[10px] break-words">{loginError}</p>
                <p className="mt-1 opacity-80 text-[10px] italic">Tip: If popups are blocked by your browser or the iframe, try opening the preview in a new tab.</p>
              </div>
            )}

            <>
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 border-4 border-[#00ffff] bg-cyan-950/20 text-[#00ffff] font-black tracking-widest text-xs rounded hover:bg-[#00ffff] hover:text-black uppercase cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#0ea5e9] active:translate-y-0.5"
              >
                <Cpu className="w-4 h-4" />
                <span>INSERT COIN: LOGIN VIA GOOGLE</span>
              </button>

              <button
                onClick={handleGuestStart}
                className="w-full py-3 border-4 border-[#ff00ff] bg-pink-950/20 text-[#ff00ff] font-black tracking-widest text-xs rounded hover:bg-[#ff00ff] hover:text-black uppercase cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#4a044e] active:translate-y-0.5"
              >
                <Play className="w-4 h-4" />
                <span>START SANDBOX GAME (GUEST MODE)</span>
              </button>
            </>
          </div>

          {/* Hackathon metadata badges */}
          <div className="mt-8 grid grid-cols-2 gap-3 w-full border-t border-slate-800 pt-5 text-[9px] text-slate-500 uppercase">
            <div className="bg-[#020617] p-2 border border-slate-800 rounded">
              <span className="font-bold text-slate-450">STATUS:</span> MVP_VER_1.0
            </div>
            <div className="bg-[#020617] p-2 border border-slate-800 rounded">
              <span className="font-bold text-slate-455">DATABASE:</span> FIRESTORE
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 2. Profile Setup / Character Creator wizard
  if (!profile) {
    return (
      <ArcadeCabinet user={currentUser} onLogout={handleLogout}>
        <ProfileForm userId={currentUser.uid} onSave={handleSaveProfile} />
      </ArcadeCabinet>
    );
  }

  // 3. Main Dashboard UI Tab grid
  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="bg-[#0f172a] border-2 border-[#ff00ff] text-[#00ffff] font-mono text-[10px] px-3 py-2 rounded shadow-[4px_4px_0_0_#4a044e] font-black uppercase flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#ff00ff]" />
            {t.msg}
          </div>
        ))}
      </div>
      <ArcadeCabinet
        user={currentUser}
        onLogout={handleLogout}
        displayName={profile.displayName}
        xp={profile.xp}
        streak={profile.streak}
        level={Math.floor(profile.xp / 500) + 1}
        goal={profile.goal}
      >
      <div className="flex-1 flex flex-col md:flex-row bg-[#020617] items-stretch">
        
        {/* Sidebar Arcade Tab list controllers */}
        <div className="md:w-65 border-r-4 border-slate-900 bg-[#0f172a]/50 p-4.5 space-y-1.5 text-xs shrink-0 md:h-[680px] overflow-y-auto scrollbar-thin">
          <div className="text-[9px] text-[#00ffff] font-extrabold uppercase tracking-widest mb-3 px-1 font-mono">
            CONTROL CONSOLE:
          </div>

          <button
            onClick={() => { playClickSound(); setActiveTab("dashboard"); }}
            className={`w-full text-left px-3.5 py-3 rounded uppercase font-black flex items-center justify-between border-2 select-none hover:bg-slate-800/20 ${
              activeTab === "dashboard"
                ? "bg-[#ff00ff]/10 border-[#ff00ff] text-[#ff00ff]"
                : "border-transparent text-slate-400"
            }`}
          >
            <span>[F1] HUD Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { playClickSound(); setActiveTab("quests"); }}
            className={`w-full text-left px-3.5 py-3 rounded uppercase font-black flex items-center justify-between border-2 select-none hover:bg-slate-800/20 ${
              activeTab === "quests"
                ? "bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff]"
                : "border-transparent text-slate-400"
            }`}
          >
            <span>[F2] Quests Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { playClickSound(); setActiveTab("journal"); }}
            className={`w-full text-left px-3.5 py-3 rounded uppercase font-black flex items-center justify-between border-2 select-none hover:bg-slate-800/20 ${
              activeTab === "journal"
                ? "bg-pink-500/10 border-pink-500 text-pink-500"
                : "border-transparent text-slate-400"
            }`}
          >
            <span>[F3] Stress Journal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { playClickSound(); setActiveTab("coach"); }}
            className={`w-full text-left px-3.5 py-3 rounded uppercase font-black flex items-center justify-between border-2 select-none hover:bg-slate-800/20 ${
              activeTab === "coach"
                ? "bg-emerald-500/10 border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400"
            }`}
          >
            <span>[F4] Coach Chat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { playClickSound(); setActiveTab("roadmap"); }}
            className={`w-full text-left px-3.5 py-3 rounded uppercase font-black flex items-center justify-between border-2 select-none hover:bg-slate-800/20 ${
              activeTab === "roadmap"
                ? "bg-purple-500/10 border-purple-500 text-purple-400"
                : "border-transparent text-slate-400"
            }`}
          >
            <span>[F5] Elevate Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { playClickSound(); setActiveTab("settings"); }}
            className={`w-full text-left px-3.5 py-3 rounded uppercase font-black flex items-center justify-between border-2 select-none hover:bg-slate-800/20 ${
              activeTab === "settings"
                ? "bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff]"
                : "border-transparent text-slate-400"
            }`}
          >
            <span>[F6] Profile & CGPA</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="pt-6 border-t border-slate-900 mt-6 space-y-3.5 font-mono">
            <div className="text-[9px] text-[#00ffff] font-extrabold uppercase px-1">
              Active Parameters:
            </div>
            <div className="bg-slate-950 px-3 py-2 rounded text-[10px] space-y-1 border border-slate-800 uppercase">
              <div className="flex justify-between">
                <span className="text-slate-500">CGPA:</span>
                <span className="text-[#ff00ff] font-extrabold">{profile.cgpa.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Backlogs:</span>
                <span className="text-red-500 font-extrabold">{profile.backlogs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attendance:</span>
                <span className="text-[#00ffff] font-extrabold">{profile.attendance}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Study plan:</span>
                <span className="text-emerald-400 font-extrabold">{profile.studyHours}H</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between">
                <span className="text-slate-400 font-bold">LEVEL:</span>
                <span className="text-[#ff00ff] font-black">{Math.floor(profile.xp / 500) + 1}</span>
              </div>
            </div>

            <button
              onClick={() => {
                playClickSound();
                setShowResetModal(true);
              }}
              className="w-full py-2 bg-red-950/40 hover:bg-red-900/30 border-2 border-red-500/50 hover:border-red-500 rounded uppercase font-bold text-[9px] tracking-wider text-red-400 text-center block cursor-pointer select-none transition-all duration-150 active:translate-y-0.5"
            >
              Restart Journey
            </button>
          </div>

        </div>

        {/* Content staging area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto md:h-[680px] bg-[#020617] scrollbar-thin">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Header block */}
              <div className="flex items-center gap-3">
                <div className="p-1 px-2.5 bg-[#ff00ff]/10 border-2 border-[#ff00ff] text-[#ff00ff] text-xs font-black uppercase rounded font-mono select-none">
                  HUD
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Academic Recovery Center</h2>
                  <p className="text-[10px] uppercase text-slate-400 font-mono">
                    Real-time index updates calculated on physical backlog weight and subjective attendance logs
                  </p>
                </div>
              </div>

              <DashboardStats
                profile={profile}
                completedQuests={(tasks || []).filter((t) => t && t.done).length}
                totalQuests={(tasks || []).length}
              />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
                <div className="xl:col-span-7 flex flex-col">
                  <QuestBoard
                    tasks={tasks}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTaskManual}
                    onDeleteTask={handleDeleteTask}
                    onGenerateAIPlan={() => handleTriggerAIComputation()}
                    generatingPlan={isGeneratingPlan}
                    profile={profile}
                  />
                </div>

                <div className="xl:col-span-5 flex flex-col">
                  <AICoachChat
                    profile={profile}
                    messages={chats.slice(-10)} // display recent 10 messages
                    onSendMessage={handleSendMessageToCoach}
                    loading={chatLoading}
                    onResetChat={handleResetCoachChat}
                  />
                </div>
              </div>

            </div>
          )}

          {activeTab === "quests" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1 px-2.5 bg-[#00ffff]/10 border-2 border-[#00ffff] text-[#00ffff] text-xs font-black uppercase rounded font-mono select-none">
                  LOG
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Active Academic Quests</h2>
                  <p className="text-[10px] uppercase text-slate-400 font-mono">
                    Check off tasks to gain high score multipliers and level up your player profile.
                  </p>
                </div>
              </div>

              <QuestBoard
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTaskManual}
                onDeleteTask={handleDeleteTask}
                onGenerateAIPlan={() => handleTriggerAIComputation()}
                generatingPlan={isGeneratingPlan}
                profile={profile}
              />
            </div>
          )}

          {activeTab === "journal" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1 px-2.5 bg-pink-500/10 border-2 border-pink-500 text-pink-400 text-xs font-black uppercase rounded font-mono select-none">
                  JOURNAL
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Stress Thermal Journal Scanner</h2>
                  <p className="text-[10px] uppercase text-slate-400 font-mono">
                    Scribble thermal mental load barriers to initiate sentiment checks and load custom hacks.
                  </p>
                </div>
              </div>

              <StressJournal 
                journals={journals} 
                onAddJournal={handleAddJournal} 
                onDeleteJournal={handleDeleteJournal}
                onEditJournal={handleEditJournal}
              />
            </div>
          )}

          {activeTab === "coach" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1 px-2.5 bg-emerald-500/10 border-2 border-emerald-400 text-emerald-400 text-xs font-black uppercase rounded font-mono select-none">
                  CHAT
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">AI Comeback Coach terminal</h2>
                  <p className="text-[10px] uppercase text-slate-400 font-mono">
                    Get premium guidance from Coach Core-DX. Programmed for study morale stability.
                  </p>
                </div>
              </div>

              <AICoachChat
                profile={profile}
                messages={chats}
                onSendMessage={handleSendMessageToCoach}
                loading={chatLoading}
                onResetChat={handleResetCoachChat}
              />
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-1 px-2.5 bg-[#ff00ff]/10 border-2 border-[#ff00ff] text-[#ff00ff] text-xs font-black uppercase rounded font-mono select-none">
                    PLAN
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">AI Academic Recovery Regimen</h2>
                    <p className="text-[10px] uppercase text-slate-450 font-mono">
                      Ultimate academic recovery program formulated specially for you by Gemini intelligence.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playPowerUp();
                    handleTriggerAIComputation();
                  }}
                  disabled={isGeneratingPlan}
                  className="px-3.5 py-2 border-2 border-white bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black font-extrabold text-xs uppercase rounded cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 active:translate-y-0.5 shadow-[2px_2px_0_0_#ffffff] transition-all duration-150 hover:-translate-y-0.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? "animate-spin" : ""}`} />
                  {isGeneratingPlan ? "RE-CALCULATING PLAN..." : "RE-BOOT ROADMAP"}
                </button>
              </div>

              {plan ? (
                <div className="border-4 border-[#ff00ff] bg-[#0f172a] rounded p-6 shadow-[6px_6px_0_0_#4a044e] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-[#020617] border-l-2 border-b-2 border-slate-800 text-[10px] text-[#ff00ff] font-extrabold uppercase rounded-bl font-mono">
                    LAST DEPLOY: {new Date(plan.updatedAt).toLocaleDateString()}
                  </div>

                  <div className="text-sm text-slate-300 font-medium hover:text-white transition-colors duration-150">
                    <Markdown text={plan.planText.replace(/Rebound AI|Rebound/gi, "ElevateU")} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-950 border-4 border-dashed border-[#ff00ff]/30 rounded">
                  <p className="text-sm text-slate-500 uppercase tracking-widest mb-4 font-mono">
                    NO ACTIVE RECOVERY PLAN DETECTED. LET'S COMPUTE ONE NOW.
                  </p>
                  <button
                    onClick={() => handleTriggerAIComputation()}
                    disabled={isGeneratingPlan}
                    className="px-6 py-2.5 border-2 border-white bg-gradient-to-r from-[#ff01ff] to-[#01ffff] text-black font-black uppercase text-xs rounded cursor-pointer shadow-[4px_4px_0_0_#ffffff] active:translate-y-0.5 transition-all duration-150 hover:scale-105"
                  >
                    DEPLOY COGNITIVE GRID RADIALS
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <ProfileSettings
              profile={profile}
              onSave={handleSaveProfile}
              isGeneratingPlan={isGeneratingPlan}
            />
          )}
        </div>

      </div>
    </ArcadeCabinet>

    {/* Restart Journey Confirmation Modal */}
    {showResetModal && (
      <div className="fixed inset-0 z-50 bg-[#020617]/95 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
        <div className="w-full max-w-md border-4 border-red-500 bg-[#0f172a] rounded shadow-[8px_8px_0_0_#450a0a] p-6 space-y-6">
          <div className="flex items-center gap-3 text-red-500 border-b-2 border-red-950 pb-3">
            <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce shrink-0" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider leading-tight">REBOOT PLAYER PROGRESS</h3>
              <p className="text-[9px] text-slate-500 uppercase font-mono">SYS_ADMIN CONFIRMATION MATRIX REQUIRED</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium uppercase">
            WARNING: You are about to initiate a terminal hard-reboot. Doing so will completely wipe:
          </p>

          <ul className="text-[10px] text-red-400 space-y-1.5 uppercase font-bold pl-2 bg-red-950/20 p-3 border border-red-900/40 rounded">
            <li>&gt; CURRENT LEVEL &amp; EXPERIENCE COUNTERS</li>
            <li>&gt; ACADEMIC PLAN ROADMAP SCHEMATIC FILES</li>
            <li>&gt; ACTIVE PROGRESS AND COMPLETED QUEST RECORDS</li>
            <li>&gt; HISTORICAL STRESS THERMAL SCANNER BULLETINS</li>
          </ul>

          <div className="p-3 border border-slate-850 rounded bg-[#020617] text-[10px] text-slate-400 uppercase leading-relaxed font-mono">
            🛡️ <span className="text-emerald-400 font-bold">CREDENTIAL SECURITY:</span> YOUR AUTHENTICATED SYSTEM ACCESS WILL BE FULLY PRESERVED INCURRING NO IDENTITY LOSS.
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => { playClickSound(); setShowResetModal(false); }}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border-2 border-slate-700 font-black text-xs uppercase rounded cursor-pointer duration-100 text-center"
            >
              HALT REBOOT
            </button>
            <button
              onClick={() => { playPowerUp(); handleRestartJourney(); }}
              className="flex-1 py-2.5 bg-red-950/30 hover:bg-red-500 hover:text-black text-red-500 border-2 border-red-500 font-black text-xs uppercase rounded cursor-pointer duration-100 shadow-[2px_2px_0_0_#ef4444] text-center"
            >
              EXECUTE RESTART
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
