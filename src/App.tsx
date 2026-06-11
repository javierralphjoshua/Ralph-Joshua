import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DailyLog, FoodLogItem, ChallengeState } from './types';
import Onboarding from './components/Onboarding';
import Charts from './components/Charts';
import FoodDiary from './components/FoodDiary';
import CalorieGoalChart from './components/CalorieGoalChart';
import MathCockpit from './components/MathCockpit';
import AuthGateway from './components/AuthGateway';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
// Custom lightweight user session type
export interface CustomUser {
  uid: string;
  email: string;
}
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Flame, 
  Settings2, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Calendar, 
  Dumbbell, 
  Apple, 
  Scale, 
  Compass, 
  Info,
  CalendarCheck,
  Zap,
  Check,
  Camera,
  BookOpen,
  Download,
  X,
  Share2,
  Copy,
  Cloud,
  LogOut,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Standalone Helper to draw a gorgeous, high-class square social-sharing transformation report card on a 1080x1080 canvas
function renderTransformationCard(profile: UserProfile, stats: any, callback: (dataUrl: string) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return callback('');

  // 1. Solid background - ultra premium dark theme (matching zinc-950)
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // High-end subtle background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1080);
  grad.addColorStop(0, '#111113');
  grad.addColorStop(0.5, '#09090b');
  grad.addColorStop(1, '#0c0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vibrant lime green theme borders (12px bold)
  ctx.strokeStyle = '#a3e635';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  // Helper inside drawing scope for rounded rectangles
  const drawRoundRect = (c: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, rr: number) => {
    c.beginPath();
    c.moveTo(rx + rr, ry);
    c.lineTo(rx + rw - rr, ry);
    c.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
    c.lineTo(rx + rw, ry + rh - rr);
    c.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
    c.lineTo(rx + rr, ry + rh);
    c.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
    c.lineTo(rx, ry + rr);
    c.quadraticCurveTo(rx, ry, rx + rr, ry);
    c.closePath();
  };

  const drawPlaceholder = (c: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number, text: string) => {
    c.fillStyle = '#121214';
    c.fillRect(px, py, pw, ph);
    c.strokeStyle = '#27272a';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + pw, py + ph);
    c.moveTo(px + pw, py);
    c.lineTo(px, py + ph);
    c.stroke();

    c.fillStyle = '#52525b';
    c.font = '900 12px "Inter", sans-serif';
    c.textAlign = 'center';
    c.fillText(text, px + pw / 2, py + ph / 2);
  };

  const drawPhotoCard = (c: CanvasRenderingContext2D, imgElement: HTMLImageElement | null, cx: number, cy: number, cw: number, ch: number, label: string, info: string) => {
    // Outer border frame
    c.fillStyle = '#18181b';
    c.strokeStyle = '#27272a';
    c.lineWidth = 2.5;
    drawRoundRect(c, cx, cy, cw, ch, 16);
    c.fill();
    c.stroke();

    // Image container offset
    const margin = 16;
    const px = cx + margin;
    const py = cy + margin;
    const pw = cw - margin * 2;
    const ph = ch - margin * 2 - 44; // leave footprint for textual footer labels

    c.fillStyle = '#09090b';
    drawRoundRect(c, px, py, pw, ph, 12);
    c.fill();

    if (imgElement && imgElement.complete && imgElement.src) {
      c.save();
      c.beginPath();
      drawRoundRect(c, px, py, pw, ph, 12);
      c.clip();
      
      const imgRatio = imgElement.width / imgElement.height;
      const destRatio = pw / ph;
      let sWidth = imgElement.width;
      let sHeight = imgElement.height;
      let sx = 0;
      let sy = 0;

      if (imgRatio > destRatio) {
        sWidth = imgElement.height * destRatio;
        sx = (imgElement.width - sWidth) / 2;
      } else {
        sHeight = imgElement.width / destRatio;
        sy = (imgElement.height - sHeight) / 2;
      }

      try {
        c.drawImage(imgElement, sx, sy, sWidth, sHeight, px, py, pw, ph);
      } catch (e) {
        console.error(e);
        drawPlaceholder(c, px, py, pw, ph, 'ERROR RENDERING PHOTO');
      }
      c.restore();
    } else {
      drawPlaceholder(c, px, py, pw, ph, '📸 NO PHOTO SPECIFIED');
    }

    // Text labels layout under photo viewport
    c.fillStyle = '#ffffff';
    c.font = '900 14px "Inter", sans-serif';
    c.textAlign = 'left';
    c.fillText(label, cx + margin + 4, cy + ch - 26);

    c.fillStyle = '#a3e635'; // Lime accent
    c.font = '900 15px "Inter", sans-serif';
    c.textAlign = 'right';
    c.fillText(info, cx + cw - margin - 4, cy + ch - 26);
  };

  const drawAllContent = (img1: HTMLImageElement | null, img2: HTMLImageElement | null) => {
    // Top Titles Display
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a3e635';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.fillText('30-DAY METABOLIC RECOMPOSITION', canvas.width / 2, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px "Inter", sans-serif';
    ctx.fillText(`CHALLENGER: ${profile.name.toUpperCase()}`, canvas.width / 2, 110);

    ctx.fillStyle = '#71717a';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillText(`Challenge Roadmap: Started ${profile.startDate} • Created at ${new Date().toISOString().split('T')[0]}`, canvas.width / 2, 140);

    // Photos Setup
    const boxW = 440;
    const boxH = 540;
    const boxY = 180;
    const leftX1 = 70;
    const leftX2 = 570;

    const d1W = profile.day1Weight !== undefined ? profile.day1Weight : profile.weight;
    const d30W = profile.day30Weight;

    drawPhotoCard(ctx, img1, leftX1, boxY, boxW, boxH, 'DAY 1 START', `${d1W} ${profile.weightUnit || 'lbs'}`);
    drawPhotoCard(ctx, img2, leftX2, boxY, boxW, boxH, 'DAY 30 GRADUATION', d30W ? `${d30W} ${profile.weightUnit || 'lbs'}` : 'PENDING');

    // Bottom Victory Summary Banner
    const footerY = 770;
    ctx.fillStyle = '#121214';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 3;
    drawRoundRect(ctx, 70, footerY, 940, 220, 20);
    ctx.fill();
    ctx.stroke();

    const colW = 940 / 3;

    // Metric 1: Accumulated fat reduction (pure metabolic fat loss)
    ctx.fillStyle = '#71717a';
    ctx.font = '900 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('METABOLIC ADIPOSE LOST', 70 + colW / 2, footerY + 50);

    ctx.fillStyle = '#a3e635';
    ctx.font = '900 52px "Inter", sans-serif';
    ctx.fillText(`${stats.fatBurnedLbs} LBS`, 70 + colW / 2, footerY + 115);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillText(`Goal: ${profile.fatLossGoal} lbs Fat Burn`, 70 + colW / 2, footerY + 155);

    // Metric 2: Gravity Scale weight reduction delta
    ctx.fillStyle = '#71717a';
    ctx.font = '900 12px "Inter", sans-serif';
    ctx.fillText('GRAVITY SCALE DIFFERENCE', 70 + colW * 1.5, footerY + 50);

    let scaleDiffText = 'TBD';
    let scaleDiffSub = 'Scale weights pending';
    if (d1W && d30W) {
      const diff = d1W - d30W;
      scaleDiffText = `${diff >= 0 ? '-' : '+'}${Math.abs(Number(diff.toFixed(1)))} ${profile.weightUnit || 'lbs'}`;
      scaleDiffSub = `From ${d1W} to ${d30W} ${profile.weightUnit || 'lbs'}`;
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px "Inter", sans-serif';
    ctx.fillText(scaleDiffText, 70 + colW * 1.5, footerY + 115);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillText(scaleDiffSub, 70 + colW * 1.5, footerY + 155);

    // Metric 3: Protocol Adherence Metrics
    ctx.fillStyle = '#71717a';
    ctx.font = '900 12px "Inter", sans-serif';
    ctx.fillText('CHALLENGE ADHERENCE', 70 + colW * 2.5, footerY + 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px "Inter", sans-serif';
    ctx.fillText(`${stats.daysProgressed}/30`, 70 + colW * 2.5, footerY + 115);

    const meanDeficit = stats.daysProgressed > 0 ? Math.round(stats.totalDeficit / stats.daysProgressed) : 0;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillText(`Deficit: ${meanDeficit} kcal/day`, 70 + colW * 2.5, footerY + 155);

    // Footer Watermark Branding
    ctx.fillStyle = '#52525b';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.fillText('30-DAY FAT LOSS RECOMPOSITION PROTOCOL • LOCKS SYNCED MATHEMATICALLY', canvas.width / 2, footerY + 195);

    callback(canvas.toDataURL('image/jpeg', 0.95));
  };

  // Preload images or execute immediately
  const h1 = profile.day1Photo ? new Image() : null;
  const h2 = profile.day30Photo ? new Image() : null;

  let loadedSteps = 0;
  const targetSteps = (h1 ? 1 : 0) + (h2 ? 1 : 0);

  if (targetSteps === 0) {
    drawAllContent(null, null);
    return;
  }

  const handleStepLoad = () => {
    loadedSteps++;
    if (loadedSteps === targetSteps) {
      drawAllContent(h1, h2);
    }
  };

  if (h1) {
    h1.onload = handleStepLoad;
    h1.onerror = handleStepLoad;
    h1.src = profile.day1Photo;
  }
  if (h2) {
    h2.onload = handleStepLoad;
    h2.onerror = handleStepLoad;
    h2.src = profile.day30Photo;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestMode, setGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('challenge_profile_v1') !== null || localStorage.getItem('guest_mode_preferred') === 'true';
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeTab, setActiveTab ] = useState<'journal' | 'report' | 'info'>('journal');
  const [showSettings, setShowSettings] = useState(false);
  const [activityNote, setActivityNote] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTutorialTab, setActiveTutorialTab] = useState<'onboarding' | 'logging' | 'workouts' | 'locking' | 'reports'>('onboarding');

  const [day1WeightInput, setDay1WeightInput] = useState('');
  const [day30WeightInput, setDay30WeightInput] = useState('');

  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [generatedReportImage, setGeneratedReportImage] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const transFileInputRef = useRef<HTMLInputElement>(null);
  const transPhotoType = useRef<'day1' | 'day30'>('day1');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleUpdateTransformationPhoto = (type: 'day1' | 'day30') => {
    transPhotoType.current = type;
    transFileInputRef.current?.click();
  };

  const handleTransPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const updatedProfile = {
        ...profile,
        [transPhotoType.current === 'day1' ? 'day1Photo' : 'day30Photo']: base64
      };
      setProfile(updatedProfile);
      saveState(updatedProfile, logs); // update cloud and local
    };
    reader.readAsDataURL(file);
  };

  const handleShareTransformation = () => {
    if (!profile) return;
    setIsGeneratingReport(true);
    setToastMessage("Generating your digital transformation report card... 📸");
    
    // Asynchronous canvas drawing to prevent main-thread freezing
    setTimeout(() => {
      renderTransformationCard(profile, stats, (dataUrl) => {
        setGeneratedReportImage(dataUrl);
        setIsGeneratingReport(false);
        setShowTransformationModal(true);
      });
    }, 150);
  };

  const migrateOfflineBackup = () => {
    try {
      const savedProfile = localStorage.getItem('challenge_profile_v1');
      const savedLogs = localStorage.getItem('challenge_logs_v1');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        setProfile(null);
      }
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        setLogs({});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserData = async (user: CustomUser) => {
    setAuthLoading(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      let loadedProfile: UserProfile | null = null;
      let loadedLogs: Record<string, DailyLog> = {};

      if (profileSnap.exists()) {
        loadedProfile = profileSnap.data() as UserProfile;
        
        const logsRef = collection(db, 'profiles', user.uid, 'logs');
        const logsSnap = await getDocs(logsRef);
        logsSnap.forEach((doc) => {
          loadedLogs[doc.id] = doc.data() as DailyLog;
        });

        // Store local cache to make sure they are preserved nicely
        localStorage.setItem('challenge_profile_v1', JSON.stringify(loadedProfile));
        localStorage.setItem('challenge_logs_v1', JSON.stringify(loadedLogs));

        setProfile(loadedProfile);
        setLogs(loadedLogs);
        setToastMessage("Cloud profile downloaded successfully! ☁️");
      } else {
        // Migrate guest/local data to cloud if it exists
        const localProfileStr = localStorage.getItem('challenge_profile_v1');
        const localLogsStr = localStorage.getItem('challenge_logs_v1');

        if (localProfileStr) {
          const localProfile = JSON.parse(localProfileStr);
          const localLogs = localLogsStr ? JSON.parse(localLogsStr) : {};

          const cleanLocalProfile = JSON.parse(JSON.stringify(localProfile));
          try {
            await setDoc(doc(db, 'profiles', user.uid), cleanLocalProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
          }

          for (const [date, log] of Object.entries(localLogs)) {
            const cleanLocalLog = JSON.parse(JSON.stringify(log));
            try {
              await setDoc(doc(db, 'profiles', user.uid, 'logs', date), cleanLocalLog);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}/logs/${date}`);
            }
          }

          setProfile(localProfile);
          setLogs(localLogs);
          setToastMessage("✓ Synced guest challenge metrics to cloud! 🚀");
        } else {
          setProfile(null);
          setLogs({});
        }
      }
    } catch (e) {
      console.error("Firestore sync error", e);
      migrateOfflineBackup();
    } finally {
      setAuthLoading(false);
    }
  };

  // 1. Custom Simplified Session Sync
  useEffect(() => {
    const initSession = async () => {
      const savedSessionStr = localStorage.getItem('ragnars_challenge_session');
      if (savedSessionStr) {
        try {
          const user = JSON.parse(savedSessionStr) as CustomUser;
          setCurrentUser(user);
          await loadUserData(user);
        } catch (e) {
          console.error(e);
          setAuthLoading(false);
          migrateOfflineBackup();
        }
      } else {
        setAuthLoading(false);
        migrateOfflineBackup();
      }
    };

    initSession();
  }, []);

  // 2. Local & Cloud Sync State Persistence
  const saveState = async (newProfile: UserProfile | null, newLogs: Record<string, DailyLog>, dateToSync?: string) => {
    try {
      // Offline backup
      if (newProfile) {
        localStorage.setItem('challenge_profile_v1', JSON.stringify(newProfile));
      } else {
        localStorage.removeItem('challenge_profile_v1');
      }
      localStorage.setItem('challenge_logs_v1', JSON.stringify(newLogs));

      // Cloud backup
      if (currentUser) {
        const cleanProfile = newProfile ? JSON.parse(JSON.stringify(newProfile)) : null;

        if (cleanProfile) {
          try {
            await setDoc(doc(db, 'profiles', currentUser.uid), cleanProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `profiles/${currentUser.uid}`);
          }
        } else {
          try {
            await deleteDoc(doc(db, 'profiles', currentUser.uid));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `profiles/${currentUser.uid}`);
          }
        }

        if (dateToSync) {
          const log = newLogs[dateToSync];
          if (log) {
            const cleanLog = JSON.parse(JSON.stringify(log));
            try {
              await setDoc(doc(db, 'profiles', currentUser.uid, 'logs', dateToSync), cleanLog);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `profiles/${currentUser.uid}/logs/${dateToSync}`);
            }
          } else {
            try {
              await deleteDoc(doc(db, 'profiles', currentUser.uid, 'logs', dateToSync));
            } catch (err) {
              handleFirestoreError(err, OperationType.DELETE, `profiles/${currentUser.uid}/logs/${dateToSync}`);
            }
          }
        } else {
          // Bulk upload (seeding or full sync)
          for (const [date, log] of Object.entries(newLogs)) {
            const cleanLog = JSON.parse(JSON.stringify(log));
            try {
              await setDoc(doc(db, 'profiles', currentUser.uid, 'logs', date), cleanLog);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `profiles/${currentUser.uid}/logs/${date}`);
            }
          }
        }
      }
    } catch (e) {
      console.error('Core save operation failed', e);
      if (currentUser) {
        setToastMessage("Warning: Save failure. Cloud permissions issue? 📡");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('ragnars_challenge_session');
      setCurrentUser(null);
      setProfile(null);
      setLogs({});
      setGuestMode(false);
      localStorage.removeItem('challenge_profile_v1');
      localStorage.removeItem('challenge_logs_v1');
      localStorage.removeItem('guest_mode_preferred');
      setToastMessage("✓ Signed out successfully! 👋");
    } catch (e) {
      console.error(e);
      setToastMessage("Error signing out.");
    }
  };

  const handleContinueAsGuest = () => {
    setGuestMode(true);
    localStorage.setItem('guest_mode_preferred', 'true');
    setToastMessage("Welcome! Browsing in Guest (Offline) Mode 🕶️");
  };

  // 3. Date Utilities
  const getChallengeDateString = (startDateStr: string, dayNum: number): string => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + (dayNum - 1));
    return d.toISOString().split('T')[0];
  };

  const getUncompletedPriorDays = (): number[] => {
    if (!profile) return [];
    const priorDays: number[] = [];
    for (let d = 1; d < selectedDay; d++) {
      const dateStr = getChallengeDateString(profile.startDate, d);
      const log = logs[dateStr];
      if (!log || !log.completed) {
        priorDays.push(d);
      }
    }
    return priorDays;
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate day index from today's date (defaults to Day 1 - 30)
  useEffect(() => {
    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      let todayDayNumber = 1;
      
      for (let i = 1; i <= 30; i++) {
        const dateStr = getChallengeDateString(profile.startDate, i);
        if (dateStr === today) {
          todayDayNumber = i;
          break;
        }
      }
      setSelectedDay(todayDayNumber);
    }
  }, [profile]);

  // Synchronize weight inputs with loaded profile
  useEffect(() => {
    if (profile) {
      setDay1WeightInput(profile.day1Weight !== undefined ? String(profile.day1Weight) : String(profile.weight));
      setDay30WeightInput(profile.day30Weight !== undefined ? String(profile.day30Weight) : '');
    }
  }, [profile]);

  // 4. Handle Save Profile Configuration
  const handleSaveProfile = (updatedProfile: UserProfile) => {
    const finalProfile = { ...updatedProfile };
    if (profile && profile.password) {
      finalProfile.password = profile.password;
    }
    setProfile(finalProfile);
    saveState(finalProfile, logs);
    setShowSettings(false);
  };

  const handleUpdateChallengeWeights = (day1: number | undefined, day30: number | undefined) => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      day1Weight: day1,
      day30Weight: day30
    };
    setProfile(updatedProfile);
    saveState(updatedProfile, logs);
  };

  // 5. Active day logs mutations
  const getActiveDayDate = (): string => {
    if (!profile) return '';
    return getChallengeDateString(profile.startDate, selectedDay);
  };

  const calculateRatingForLog = (log: DailyLog, profileUser: UserProfile): 'good_job' | 'pwede_na' | 'failed' => {
    const caloriesIn = log.foodItems.reduce((acc, curr) => acc + curr.calories, 0);
    const caloriesOut = (log.activityChoice === 'manual_total' && log.totalCaloriesOut !== undefined)
      ? log.totalCaloriesOut
      : (profileUser.manualBmr + log.activeCalories);
    const actualDeficit = caloriesOut - caloriesIn;
    const dailyTargetDeficit = Math.round((profileUser.fatLossGoal * 3500) / 30);
    
    if (actualDeficit >= dailyTargetDeficit) {
      return 'good_job';
    } else if (actualDeficit > 0) {
      return 'pwede_na';
    } else {
      return 'failed';
    }
  };

  const getOrCreateActiveLog = (): DailyLog => {
    const dateStr = getActiveDayDate();
    const existing = logs[dateStr];
    if (existing) {
      if (profile) {
        const computed = calculateRatingForLog(existing, profile);
        if (existing.rating !== computed) {
          existing.rating = computed;
        }
      }
      return existing;
    }

    const defaultLog: DailyLog = {
      date: dateStr,
      dayNumber: selectedDay,
      activeCalories: 150,
      activityChoice: 'low',
      rating: 'pwede_na',
      foodItems: [],
      completed: false,
    };

    if (profile) {
      defaultLog.rating = calculateRatingForLog(defaultLog, profile);
    }
    return defaultLog;
  };

  const updateActiveLog = (updatedFields: Partial<DailyLog>) => {
    if (!profile) return;
    const dateStr = getActiveDayDate();
    const current = getOrCreateActiveLog();
    
    const merged = {
      ...current,
      ...updatedFields,
    };

    merged.rating = calculateRatingForLog(merged, profile);
    
    const newLogs = {
      ...logs,
      [dateStr]: merged,
    };
    
    setLogs(newLogs);
    saveState(profile, newLogs, dateStr);
  };

  const handleAddFoodToActiveDay = (newItem: Omit<FoodLogItem, 'id'>) => {
    const current = getOrCreateActiveLog();
    const foodWithId: FoodLogItem = {
      ...newItem,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    updateActiveLog({
      foodItems: [...current.foodItems, foodWithId],
    });
  };

  const handleRemoveFoodFromActiveDay = (id: string) => {
    const current = getOrCreateActiveLog();
    updateActiveLog({
      foodItems: current.foodItems.filter(item => item.id !== id),
    });
  };

  const handleActiveWorkoutChange = (kcal: number) => {
    updateActiveLog({
      activeCalories: kcal,
    });
  };

  // 6. Aggregate calculations for entire challenge timeline
  const getOverallStats = () => {
    if (!profile) return { totalIn: 0, totalOut: 0, totalDeficit: 0, fatBurnedLbs: 0, daysProgressed: 0, avgCaloriesOut: 0, avgProteinIn: 0 };
    
    let totalIn = 0;
    let totalOut = 0;
    let totalProtein = 0;
    let daysProgressed = 0;

    for (let i = 1; i <= 30; i++) {
      const dateStr = getChallengeDateString(profile.startDate, i);
      const log = logs[dateStr];
      
      const dayBmr = profile.manualBmr;
      const dayIn = log ? log.foodItems.reduce((acc, curr) => acc + curr.calories, 0) : 0;
      const dayProtein = log ? log.foodItems.reduce((acc, curr) => acc + (curr.protein || 0), 0) : 0;
      const dayOut = log
        ? (log.activityChoice === 'manual_total' && log.totalCaloriesOut !== undefined
            ? log.totalCaloriesOut
            : (dayBmr + log.activeCalories))
        : 0;
      
      if (log && log.completed) {
        daysProgressed++;
        totalIn += dayIn;
        totalOut += dayOut;
        totalProtein += dayProtein;
      }
    }

    const totalDeficit = totalOut - totalIn;
    const fatBurnedLbs = Number((totalDeficit / 3500).toFixed(2));
    const avgCaloriesOut = daysProgressed > 0 ? Math.round(totalOut / daysProgressed) : 0;
    const avgProteinIn = daysProgressed > 0 ? Math.round(totalProtein / daysProgressed) : 0;

    return {
      totalIn,
      totalOut,
      totalDeficit,
      fatBurnedLbs,
      daysProgressed,
      avgCaloriesOut,
      avgProteinIn,
    };
  };

  const stats = getOverallStats();

  // 7. Reset workflow
  const handleResetChallenge = () => {
    setShowResetConfirm(true);
  };

  const executeResetChallenge = async () => {
    setProfile(null);
    setLogs({});
    setSelectedDay(1);
    localStorage.removeItem('challenge_profile_v1');
    localStorage.removeItem('challenge_logs_v1');
    
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'profiles', currentUser.uid));
        const logsRef = collection(db, 'profiles', currentUser.uid, 'logs');
        const logsSnap = await getDocs(logsRef);
        for (const d of logsSnap.docs) {
          await deleteDoc(d.ref);
        }
      } catch (e) {
        console.error("Firestore data deletion fail", e);
      }
    }
    
    setShowResetConfirm(false);
    setToastMessage("✓ Challenge progress was successfully reset! 🔄");
  };

  // 8. Demo seeding triggers beautiful preview charts
  const handleSeedMockData = () => {
    if (!profile) return;
    
    const seededLogs: Record<string, DailyLog> = {};
    const mockMeals = [
      { name: "Scrambled Eggs & Avocado Toast", calories: 420, protein: 22, carbs: 28, fat: 22 },
      { name: "Grilled Chicken Rice Bowl & Broccoli", calories: 580, protein: 44, carbs: 62, fat: 12 },
      { name: "Whey Protein Shake & Banana", calories: 280, protein: 28, carbs: 32, fat: 3 },
      { name: "Baked Salmon with Roasted Potatoes", calories: 610, protein: 38, carbs: 45, fat: 24 },
      { name: "Greek Yogurt with Berries and Honey", calories: 210, protein: 18, carbs: 24, fat: 2 },
      { name: "Cheat Dinner: Pepperoni Pizza & Soda", calories: 1250, protein: 35, carbs: 140, fat: 55 },
      { name: "Turkey Wrap & Veggie Chips", calories: 460, protein: 26, carbs: 38, fat: 14 }
    ];

    // Seed logs for the first 12 days
    for (let day = 1; day <= 12; day++) {
      const dateStr = getChallengeDateString(profile.startDate, day);
      
      // Some days are low intake, some cheat days, some high workouts
      let activeWorkoutBurn = 0;
      let mealsSelected: FoodLogItem[] = [];

      let ratingVal: 'good_job' | 'pwede_na' | 'failed' = 'pwede_na';
      let choiceVal: 'low' | 'medium' | 'high' | 'manual' = 'low';

      if (day % 3 === 0) {
        // High cardio day
        activeWorkoutBurn = 600; // high choice
        choiceVal = 'high';
        ratingVal = 'good_job';
        mealsSelected = [
          { id: 'm1', ...mockMeals[0] },
          { id: 'm2', ...mockMeals[1] },
          { id: 'm3', ...mockMeals[4] }
        ];
      } else if (day % 4 === 0) {
        // High calorie intake day
        activeWorkoutBurn = 350; // medium choice
        choiceVal = 'medium';
        ratingVal = 'failed';
        mealsSelected = [
          { id: 'm1', ...mockMeals[5] },
          { id: 'm2', ...mockMeals[2] }
        ];
      } else {
        // Normal training day
        activeWorkoutBurn = 350; // medium choice
        choiceVal = 'medium';
        ratingVal = 'good_job';
        mealsSelected = [
          { id: 'm1', ...mockMeals[0] },
          { id: 'm2', ...mockMeals[3] },
          { id: 'm3', ...mockMeals[6] }
        ];
      }

      seededLogs[dateStr] = {
        date: dateStr,
        dayNumber: day,
        activeCalories: activeWorkoutBurn,
        activityChoice: choiceVal,
        rating: ratingVal,
        foodItems: mealsSelected,
        completed: true,
      };
    }

    setLogs(seededLogs);
    saveState(profile, seededLogs);
    setSelectedDay(13); // jump to day 13
  };

  const activeLog = getOrCreateActiveLog();

  const caloriesInVal = activeLog.foodItems.reduce((acc, curr) => acc + curr.calories, 0);
  const caloriesOutVal = profile
    ? (activeLog.activityChoice === 'manual_total' && activeLog.totalCaloriesOut !== undefined
        ? activeLog.totalCaloriesOut
        : (profile.manualBmr + activeLog.activeCalories))
    : 0;
  const actualDeficitVal = caloriesOutVal - caloriesInVal;
  const dailyDeficitGoalVal = profile ? Math.round((profile.fatLossGoal * 3500) / 30) : 700;
  const userWeightLbs = profile ? (profile.weightUnit === 'lbs' ? profile.weight : profile.weight * 2.2) : 150;
  const proteinGoalVal = Math.round(userWeightLbs * 0.7);
  const proteinGoalMaxVal = Math.round(userWeightLbs * 1.0);
  const uncompletedPriorDays = getUncompletedPriorDays();

  // Screen Loader while computing Cloud Vault permissions
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4" id="app-cloud-loading-screen">
        <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest animate-pulse">Syncing Cloud Vault...</p>
      </div>
    );
  }

  // Credentials Gateway Entry Guard
  if (!currentUser && !guestMode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-zinc-950 font-sans pb-16 antialiased relative" id="app-auth-gateway-screen">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>
        
        <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-lime-400 p-2 rounded-xl text-zinc-950 font-black shadow-[0_0_15px_rgba(163,230,53,0.3)] flex items-center justify-center">
                <Zap className="w-5 h-5 fill-zinc-950 stroke-zinc-950 stroke-[3]" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-widest text-[#a3e635] uppercase leading-none">
                  Ragnar’s 30 Days Challenge
                </h1>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Fat loss is just Math</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <AuthGateway 
            onLoginSuccess={async (user) => {
              setCurrentUser(user);
              setGuestMode(false);
              await loadUserData(user);
            }} 
            onContinueAsGuest={handleContinueAsGuest} 
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-zinc-950 font-sans pb-16 antialiased">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Top Navigation Frame */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div 
            onClick={() => {
              if (profile) {
                setActiveTab('journal');
                setShowSettings(false);
              }
            }}
            className={`flex items-center space-x-3 select-none ${profile ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
            id="header-title-home-brand"
            title={profile ? "Go to Journal Home" : undefined}
          >
            <div className="bg-lime-400 p-2 rounded-xl text-zinc-950 font-black shadow-[0_0_15px_rgba(163,230,53,0.3)] flex items-center justify-center">
              <Zap className="w-5 h-5 fill-zinc-950 stroke-zinc-950 stroke-[3]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-widest text-[#a3e635] uppercase leading-none">
                Ragnar’s 30 Days Challenge
              </h1>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Fat loss is just Math</span>
            </div>
          </div>

          {/* Cloud Sync State Indicators + Settings controls */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl" id="header-authenticated-badge">
                <Cloud className="w-3.5 h-3.5 text-lime-400" />
                <span className="text-[10px] font-bold font-mono text-zinc-300 hidden md:inline">
                  {currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded font-black uppercase tracking-wider hidden sm:inline">
                  Active Cloud
                </span>
                <button
                  onClick={handleSignOut}
                  className="hover:text-rose-400 hover:bg-rose-500/10 text-zinc-400 flex items-center gap-1 transition ml-2 cursor-pointer bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  title="Logout Account"
                  id="header-logout-chevron"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Exit Session</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1.5 rounded-xl" id="header-guest-badge">
                <Cloud className="w-3.5 h-3.5 text-zinc-500 line-through" />
                <span className="text-[10px] font-bold font-mono text-zinc-400 hidden md:inline">
                  Guest Session
                </span>
                <button
                  onClick={() => {
                    setGuestMode(false);
                    localStorage.removeItem('guest_mode_preferred');
                  }}
                  className="text-[9px] text-lime-400 hover:text-lime-300 font-extrabold uppercase tracking-wider transition bg-lime-400/5 hover:bg-lime-400/10 px-2 py-0.5 rounded border border-lime-400/20 cursor-pointer"
                  title="Securely Migrate Draft to Cloud"
                  id="header-guest-upgrade-button"
                >
                  Save Cloud
                </button>
                <button
                  onClick={() => {
                    setGuestMode(false);
                    setProfile(null);
                    setLogs({});
                    localStorage.removeItem('guest_mode_preferred');
                    localStorage.removeItem('challenge_profile_v1');
                    localStorage.removeItem('challenge_logs_v1');
                    setToastMessage("Cleared guest states and exited! 🚪");
                  }}
                  className="text-[9px] text-rose-405 hover:text-rose-400 font-extrabold uppercase tracking-wider transition bg-rose-400/5 hover:bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20 cursor-pointer flex items-center gap-0.5 ml-1"
                  title="Exit Guest Session and clear data"
                  id="header-guest-exit-button"
                >
                  <LogOut className="w-2.5 h-2.5 text-rose-400" />
                  <span>Exit Guest</span>
                </button>
              </div>
            )}

            {profile && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`${
                    showSettings 
                      ? "bg-rose-500/10 border-rose-500/35 text-rose-400 hover:bg-rose-500/20" 
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  } border font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer`}
                >
                  {showSettings ? (
                    <>
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>Exit Settings</span>
                    </>
                  ) : (
                    <>
                      <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="hidden lg:inline">Metabolic settings</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleResetChallenge}
                  className="bg-zinc-900/50 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/20 text-zinc-300 hover:text-rose-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                  title="Reset / Restart Challenge"
                  id="header-restart-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Restart</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <AnimatePresence mode="wait">
          {!profile ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mt-6"
            >
              <Onboarding onSave={handleSaveProfile} />
            </motion.div>
          ) : showSettings ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mt-6 max-w-xl mx-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-lime-400 uppercase tracking-widest">Edit Challenge Profile</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <Onboarding onSave={handleSaveProfile} initialProfile={profile} />
            </motion.div>
          ) : (
            <div className="space-y-8">
              
              {/* Profile Bar Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/50 border border-zinc-900 rounded-xl px-5 py-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-805 border border-zinc-800 flex items-center justify-center font-bold text-lg text-lime-400 font-mono">
                    {profile.name[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase">{profile.name}'s Challenge</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5 space-y-1">
                      <span>Target BMR base: <span className="text-white font-bold">{profile.manualBmr} kcal/day</span> • Fat Loss Goal: <span className="text-white font-bold">{profile.fatLossGoal || 6} lbs</span></span>
                      <span className="block text-lime-400 font-semibold font-mono">⚡ Est. Daily Calorie In to reach goal: {Math.max(800, profile.manualBmr - Math.round(((profile.fatLossGoal || 0) * 3500) / 30))} kcal/day</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-zinc-850 gap-1 sm:gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('journal')}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 focus:outline-none ${
                    activeTab === 'journal'
                      ? 'border-lime-400 text-lime-400 font-extrabold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-lime-400" />
                  <span>30-Day Journal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 focus:outline-none ${
                    activeTab === 'report'
                      ? 'border-lime-400 text-lime-400 font-extrabold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Scale className="w-4 h-4 text-lime-400" />
                  <span>Report Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 focus:outline-none ${
                    activeTab === 'info'
                      ? 'border-lime-400 text-lime-400 font-extrabold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Info className="w-4 h-4 text-lime-400" />
                  <span>Information Guide</span>
                </button>
              </div>

              {activeTab === 'report' && (
                <div className="space-y-6">
                  {uncompletedPriorDays.length > 0 && (
                    <div className="bg-zinc-950 border border-amber-500/15 rounded-xl p-4 text-xs text-zinc-400 flex items-start gap-2.5">
                      <span className="text-amber-500 font-bold">⚠️ Notice:</span>
                      <span>
                        Your progress report is mathematically partial. You failed to track Day(s) <span className="text-amber-400 font-mono font-bold">{uncompletedPriorDays.join(', ')}</span>. Navigate to the 30-Day Journal and complete those logs.
                      </span>
                    </div>
                  )}

                  {/* COMPREHENSIVE REORGANIZED BIOLOGY MATH COCKPIT */}
                  <MathCockpit 
                    profile={profile}
                    stats={stats}
                    logs={logs}
                    onReset={handleResetChallenge}
                    onOpenSettings={() => setShowSettings(true)}
                  />

                  {/* 30-DAY GRADUATION TRANSFORMATION & PROGRESS PHOTO SECTION */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-lime-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-lime-400 lg:inline bg-lime-500/10 px-2.5 py-1 rounded-full border border-lime-500/20">GRADUATION SHOWCASE</span>
                    <h3 className="text-xl font-black text-white uppercase mt-2">🏆 Challenge Transformation Center</h3>
                    <p className="text-xs text-zinc-400 mt-1">Compare progress photos from Day 1 with your Day 30 graduation photo side-by-side</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShareTransformation}
                      className="bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition duration-150 shadow-lg shadow-lime-400/10 flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <span>Share Transformation Report 🚀</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {/* Day 1 Image */}
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-xs font-black text-lime-400 font-mono uppercase tracking-widest">📸 Day 1 Start</span>
                        <span className="text-[10px] text-zinc-500">Starting Point</span>
                      </div>

                      <div className="aspect-square bg-zinc-900/60 border border-zinc-850 rounded-lg overflow-hidden flex items-center justify-center relative min-h-[220px]">
                        {profile?.day1Photo ? (
                          <>
                            <img src={profile.day1Photo} alt="Day 1 Start" className="w-full h-full object-cover" />
                            <button
                              onClick={() => handleUpdateTransformationPhoto('day1')}
                              className="absolute bottom-2 right-2 bg-zinc-950/90 hover:bg-zinc-900 text-zinc-300 text-[10px] uppercase font-black py-1 px-2.5 rounded-lg border border-zinc-800 transition backdrop-blur-sm"
                            >
                              Replace
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-3 text-zinc-650">
                            <Camera className="w-8 h-8 mx-auto stroke-1 text-zinc-500" />
                            <span className="text-[11px] mt-2 block uppercase font-bold text-zinc-400">No Day 1 Photo</span>
                            <button
                              onClick={() => handleUpdateTransformationPhoto('day1')}
                              className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-1 px-3 rounded-xl transition"
                            >
                              Upload Photo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-zinc-900">
                      <label className="text-[10px] font-black uppercase text-zinc-550 tracking-wider block">Day 1 Weight ({profile?.weightUnit || 'lbs'})</label>
                      <input
                        type="number"
                        placeholder="Starting weight"
                        value={day1WeightInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDay1WeightInput(val);
                          handleUpdateChallengeWeights(val ? Number(val) : undefined, profile?.day30Weight);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-400 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none transition font-semibold font-mono"
                      />
                    </div>
                  </div>

                  {/* Day 30 Image */}
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-xs font-black text-lime-400 font-mono uppercase tracking-widest">🏆 Day 30 Graduation</span>
                        <span className="text-[10px] text-zinc-500">Recomposition Goal</span>
                      </div>

                      <div className="aspect-square bg-zinc-900/60 border border-zinc-850 rounded-lg overflow-hidden flex items-center justify-center relative min-h-[220px]">
                        {profile?.day30Photo ? (
                          <>
                            <img src={profile.day30Photo} alt="Day 30 End" className="w-full h-full object-cover" />
                            <button
                              onClick={() => handleUpdateTransformationPhoto('day30')}
                              className="absolute bottom-2 right-2 bg-zinc-950/90 hover:bg-zinc-900 text-zinc-300 text-[10px] uppercase font-black py-1 px-2.5 rounded-lg border border-zinc-800 transition backdrop-blur-sm"
                            >
                              Replace
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-3 text-zinc-650">
                            <Camera className="w-8 h-8 mx-auto stroke-1 text-zinc-505" />
                            <span className="text-[11px] mt-2 block uppercase font-black text-zinc-400">Day 30 Photo Missing</span>
                            <p className="text-[9px] text-zinc-500 px-4 mt-1 leading-normal">Take progress photos in the same light and pose!</p>
                            <button
                              onClick={() => handleUpdateTransformationPhoto('day30')}
                              className="mt-3 bg-lime-400 text-zinc-950 text-[10px] font-black py-1 px-3.5 rounded-xl transition shadow"
                            >
                              Upload Day 30 Photo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-zinc-900">
                      <label className="text-[10px] font-black uppercase text-zinc-550 tracking-wider block">Day 30 Weight ({profile?.weightUnit || 'lbs'})</label>
                      <input
                        type="number"
                        placeholder="Graduation weight"
                        value={day30WeightInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDay30WeightInput(val);
                          handleUpdateChallengeWeights(profile?.day1Weight !== undefined ? profile.day1Weight : profile?.weight, val ? Number(val) : undefined);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-400 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none transition font-semibold font-mono"
                      />
                    </div>
                  </div>

                  {/* Victory report summary statistics card */}
                  <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="space-y-4">
                      <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5 rounded">STATISTICS SUMMATION</span>
                      
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <p className="text-[10.5px] uppercase font-black text-zinc-500">Cumulative body fat burned</p>
                          <p className={`text-4xl font-extrabold font-mono mt-0.5 ${stats.fatBurnedLbs >= 0 ? "text-lime-400" : "text-rose-400"}`}>
                            {stats.fatBurnedLbs} lbs
                          </p>
                          {profile?.fatLossGoal && (
                            <p className="text-[10.5px] text-zinc-400 font-mono mt-1 pt-1 border-t border-zinc-900/50">
                              Target Goal: <span className="text-white font-bold">{profile.fatLossGoal} lbs</span> • {stats.fatBurnedLbs >= (profile.fatLossGoal || 6) ? "🎉 Goal achieved!" : `${Math.max(0, Number(((profile.fatLossGoal || 6) - stats.fatBurnedLbs).toFixed(2)))} lbs to go`}
                            </p>
                          )}
                        </div>

                        <div className="border-t border-zinc-900 pt-2.5 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Challenge Process:</span>
                            <span className="font-mono text-white font-bold">{stats.daysProgressed}/30 Days Logged</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Mean Deficit:</span>
                            <span className="font-mono text-zinc-300 font-bold">
                              {stats.daysProgressed > 0 ? `${Math.round(stats.totalDeficit / stats.daysProgressed)} kcal/day` : '0 kcal/day'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 mt-4 text-[10.5px] text-zinc-400 leading-relaxed flex items-start gap-1.5">
                      <span className="text-base leading-none">🏆</span>
                      <span>
                        {stats.daysProgressed >= 30 
                          ? "Congratulations on completing the full 30-Day burn marathon! Check out your picture recomposition results!" 
                          : `Keep pushing onward! You have finished ${stats.daysProgressed} active days. Complete ${30 - stats.daysProgressed} more days to achieve graduation!`}
                      </span>
                    </div>
                  </div>
                </div>

                <input
                  type="file"
                  id="trans-photo-input"
                  ref={transFileInputRef}
                  onChange={handleTransPhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* INTEGRATED RECHARTS FITNESS VISUALIZATIONS */}
              {stats.daysProgressed > 0 ? (
                <Charts logs={logs} profile={profile} />
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
                  <div className="inline-flex p-3 bg-zinc-950 rounded-full text-zinc-500 mb-2">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase">Your calorie graphs will generate here</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    To populate graph trends, click on "Day 1" below, enter your workout workouts or use the Gemini active food diary.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'journal' && (
            <div className="space-y-6">
              {/* Notice if failed to track prior days */}
              {uncompletedPriorDays.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start animate-pulse">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Notice: Tracking Gaps Detected</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      You failed to track or lock <span className="text-amber-400 font-extrabold font-mono">Day(s) {uncompletedPriorDays.join(', ')}</span>. 
                      To ensure accurate challenge tracking, click these days below and document your daily logs!
                    </p>
                  </div>
                </div>
              )}

              {/* If the current selected day itself has no food items or is incomplete */}
              {!activeLog.completed && activeLog.foodItems.length === 0 && (
                <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-4 flex gap-3 items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <p className="text-xs text-zinc-305 font-bold">
                    <span className="text-amber-400">Unlogged Day:</span> Day {selectedDay} has no meals logged. Document entries to build calorie reports!
                  </p>
                </div>
              )}

              {/* 30-DAY CHALLENGE PROGRESS CALENDAR MAP */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">30 days Challenge Calendar</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Select a day cards to inspect and log workouts / diet</p>
                  </div>
                  <span className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-lime-400" /> Start Date: {profile.startDate}
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 sm:gap-3">
                  {Array.from({ length: 30 }).map((_, index) => {
                    const dayNum = index + 1;
                    const dateStr = getChallengeDateString(profile.startDate, dayNum);
                    const log = logs[dateStr];
                    
                    const isSelected = selectedDay === dayNum;
                    const isLogged = !!log;
                    
                    const caloriesIn = log ? log.foodItems.reduce((acc, curr) => acc + curr.calories, 0) : 0;
                    const caloriesOut = log
                      ? (log.activityChoice === 'manual_total' && log.totalCaloriesOut !== undefined
                          ? log.totalCaloriesOut
                          : (profile.manualBmr + log.activeCalories))
                      : 0;
                    const deficit = caloriesOut - caloriesIn;

                    // Color scheme for day nodes
                    let borderClass = 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700';
                    let textClass = 'text-zinc-500';
                    let badgeNode: React.ReactNode = null;

                    let ratingIndicator = null;
                    if (isSelected) {
                      borderClass = 'border-lime-400 bg-lime-400/5 ring-1 ring-lime-400/30';
                      textClass = 'text-white font-bold';
                    } else if (isLogged) {
                      const netDeficit = deficit >= 0;
                      borderClass = netDeficit ? 'border-lime-500 bg-lime-500/5' : 'border-rose-500/50 bg-rose-500/5';
                      textClass = 'text-zinc-300 font-medium';
                      badgeNode = (
                        <span className={`text-[8.5px] font-mono block leading-none font-bold mt-1 ${netDeficit ? "text-lime-400" : "text-rose-400"}`}>
                          {netDeficit ? `+${deficit}` : `${deficit}`}
                        </span>
                      );

                      const ratingVal = log?.rating || 'pwede_na';
                      if (ratingVal === 'good_job') {
                        ratingIndicator = <span className="text-[10px]" title="Good Job!">🔥</span>;
                      } else if (ratingVal === 'pwede_na') {
                        ratingIndicator = <span className="text-[10px]" title="Pwede Na">😐</span>;
                      } else if (ratingVal === 'failed') {
                        ratingIndicator = <span className="text-[10px]" title="Failed">⚠️</span>;
                      }
                    }

                    return (
                      <button
                        key={dayNum}
                        onClick={() => setSelectedDay(dayNum)}
                        className={`p-2 rounded-xl border text-center transition flex flex-col justify-between items-center min-h-[72px] relative ${borderClass}`}
                      >
                        <div className="absolute top-1.5 right-1.5">
                          {ratingIndicator}
                        </div>
                        <span className="text-[9px] text-zinc-500 uppercase font-black block leading-none pt-1">Day</span>
                        <span className={`text-sm leading-none mt-0.5 ${textClass}`}>{dayNum}</span>
                        {badgeNode || <div className="h-2"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DETAILED DAY WORKOUTS AND FOOD LOG DRAWER */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6">
                
                {/* Header info with BIG Day and Date display */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-800 pb-5 gap-3">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                      Day {selectedDay}
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-350 font-semibold mt-1">
                      {formatDateLabel(getActiveDayDate())}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-[#a3e635] bg-lime-500/10 px-3 py-1 rounded-full border border-lime-500/25 uppercase font-mono">
                      Daily Log Book
                    </span>
                  </div>
                </div>

                {/* Grid Swapped: Calories In FIRST (cols 1-2), Calories Out SECOND (col 3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT SIDE (Taking 2 cols): Calories In (Food Intake Mounted Diary) & Goal Calories Chart */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="border-b border-zinc-850 pb-3">
                      <h4 className="text-2xl font-black uppercase tracking-tight text-white">
                        Calories In
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">Track daily meals and food calorie counts</p>
                    </div>
                    <CalorieGoalChart 
                      caloriesIn={caloriesInVal} 
                      caloriesOut={caloriesOutVal} 
                      deficitGoal={dailyDeficitGoalVal}
                      customGoal={activeLog.customCaloriesInGoal}
                      onUpdateCustomGoal={(val) => updateActiveLog({ customCaloriesInGoal: val })}
                      isCompleted={activeLog.completed}
                    />
                    <FoodDiary 
                      foodItems={activeLog.foodItems}
                      onAddFood={handleAddFoodToActiveDay}
                      onRemoveFood={handleRemoveFoodFromActiveDay}
                      isCompleted={activeLog.completed}
                      proteinGoal={proteinGoalVal}
                    />
                  </div>

                  {/* RIGHT SIDE (Taking 1 col): Calories Out (Outgoing Burn) */}
                  <div className="space-y-6">
                    <div className="border-b border-zinc-850 pb-3">
                      <h4 className="text-2xl font-black uppercase tracking-tight text-white">
                        Calories Out
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">Select personal calorie burning activities</p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 sm:p-5 rounded-xl space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#a3e635] flex items-center gap-1.5 mb-1">
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>Outgoing Exercise Meter</span>
                        </h4>
                        <p className="text-[10px] text-zinc-500">Your total caloric burn baseline plus extra exercise</p>
                      </div>

                    <div className="space-y-4">
                      {/* BMR Base */}
                      <div className="flex justify-between items-center text-xs border-b border-zinc-900 pb-2">
                        <span className="text-zinc-400">Automatic BMR Base:</span>
                        <span className="font-mono text-white font-bold">{profile.manualBmr} kcal</span>
                      </div>

                      {/* Active Exercise Presets */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300">
                          Active Physical Effort
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {(['low', 'medium', 'high', 'manual', 'manual_total'] as const).map((choice) => {
                            const isSelected = activeLog.activityChoice === choice || (!activeLog.activityChoice && choice === 'low');
                            
                            let title = '';
                            let kcals = 0;
                            let desc = '';
                            
                            if (choice === 'low') { 
                              title = "Low Effort"; 
                              kcals = 150; 
                              desc = "Recovery stretch, light walking, everyday light house chores"; 
                            }
                            if (choice === 'medium') { 
                              title = "Medium Effort"; 
                              kcals = 350; 
                              desc = "30-45m cardio, gym weight session, intense bicycle ride"; 
                            }
                            if (choice === 'high') { 
                              title = "High Effort"; 
                              kcals = 600; 
                              desc = "Heavy athletics, lengthy runs, professional training, CrossFit"; 
                            }
                            if (choice === 'manual') { 
                              title = "Manual Active Burn"; 
                              desc = "Manually key in exact tracked fitness device workout burn"; 
                            }
                            if (choice === 'manual_total') { 
                              title = "Manual Total Out"; 
                              desc = "Directly specify entire Calories Out (including basic BMR)"; 
                            }

                            return (
                              <button
                                key={choice}
                                type="button"
                                disabled={activeLog.completed}
                                onClick={() => {
                                  if (choice === 'manual') {
                                    updateActiveLog({ activityChoice: 'manual' });
                                  } else if (choice === 'manual_total') {
                                    const currentVal = activeLog.totalCaloriesOut ?? (profile.manualBmr + activeLog.activeCalories);
                                    updateActiveLog({ activityChoice: 'manual_total', totalCaloriesOut: currentVal });
                                  } else {
                                    updateActiveLog({ activityChoice: choice, activeCalories: kcals });
                                  }
                                }}
                                className={`p-2.5 rounded-lg border text-left transition flex justify-between items-start ${
                                  isSelected 
                                    ? 'border-lime-500 bg-lime-500/5 text-white' 
                                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="pr-2">
                                  <p className="text-[11px] font-black text-white uppercase">{title}</p>
                                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{desc}</p>
                                </div>
                                {choice !== 'manual' && choice !== 'manual_total' && (
                                  <span className={`text-[11px] font-mono font-black shrink-0 ${isSelected ? 'text-lime-400' : 'text-zinc-500'}`}>
                                    +{kcals} kcal
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Manual Entry field (visible only if manual choice active or selected) */}
                      {(activeLog.activityChoice === 'manual') && (
                        <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                            Custom Active Calories (kcal):
                          </label>
                          <div className="flex bg-zinc-900 border border-zinc-850 rounded-lg overflow-hidden focus-within:border-lime-500 transition">
                            <input
                              type="number"
                              min="0"
                              disabled={activeLog.completed}
                              value={activeLog.activeCalories}
                              onChange={(e) => handleActiveWorkoutChange(Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="e.g. 450"
                              className="w-full bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none font-bold font-mono text-center disabled:opacity-50"
                            />
                            <span className="bg-zinc-800 px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-400 flex items-center">
                              kcal
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Manual Entry field (visible only if manual_total choice selected) */}
                      {(activeLog.activityChoice === 'manual_total') && (
                        <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                            Total Calories Out (kcal):
                          </label>
                          <div className="flex bg-zinc-900 border border-zinc-850 rounded-lg overflow-hidden focus-within:border-lime-500 transition">
                            <input
                              type="number"
                              min="0"
                              disabled={activeLog.completed}
                              value={activeLog.totalCaloriesOut ?? (profile.manualBmr + activeLog.activeCalories)}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                updateActiveLog({ totalCaloriesOut: val });
                              }}
                              placeholder="e.g. 2400"
                              className="w-full bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none font-bold font-mono text-center disabled:opacity-50"
                            />
                            <span className="bg-zinc-800 px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-400 flex items-center">
                              kcal
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Aggregate Burned Summary */}
                      <div className="bg-zinc-900/50 p-3.5 rounded-xl border border-dashed border-zinc-800/80 flex justify-between items-center mt-3">
                        <div>
                          <p className="text-[9.5px] text-zinc-500 uppercase leading-none font-bold">Aggregate Outflow</p>
                          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                            {activeLog.activityChoice === 'manual_total' 
                              ? 'Direct Core Outflow Override' 
                              : `${profile.manualBmr} (BMR) + ${activeLog.activeCalories} (Active)`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono text-white">
                            {caloriesOutVal} <span className="text-xs text-zinc-500">kcal</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                </div>

                {/* Mathematical Performance Evaluation Matrix */}
                <div className="space-y-6">
                  <div className="border-b border-zinc-805 pb-3">
                    <h4 className="text-2xl font-black uppercase tracking-tight text-white">
                      Ratings
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">Evaluate your daily calorie deficit and muscle preservation scores</p>
                  </div>
                  
                  <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-start border-b border-zinc-900 pb-2.5">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#a3e635] flex items-center gap-1.5">
                          <span>⚡ Biometric Rating & Evaluation</span>
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Deficit and muscle preservation levels calculated dynamically in real-time</p>
                      </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block animate-pulse">Biometric Targets</span>
                      <span className="text-[10px] font-mono text-zinc-400 block">Deficit: <strong className="text-white">{dailyDeficitGoalVal} kcal</strong> | Protein: <strong className="text-white">{proteinGoalVal}g</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Deficit Tracker Indicator */}
                    <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] uppercase font-bold text-zinc-500">Net Energy Outflow</span>
                          <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono">Target: {dailyDeficitGoalVal} kcal</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className={`text-xl font-black font-mono ${actualDeficitVal >= dailyDeficitGoalVal ? 'text-lime-400' : actualDeficitVal > 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                            {actualDeficitVal > 0 ? '+' : ''}{actualDeficitVal} <span className="text-[10px] font-bold text-zinc-500">kcal</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                          {actualDeficitVal >= dailyDeficitGoalVal 
                            ? `✓ Deficit goal reached! (${actualDeficitVal} kcal >= ${dailyDeficitGoalVal} kcal target)`
                            : actualDeficitVal > 0 
                              ? `⚠️ Deficit goal short by ${dailyDeficitGoalVal - actualDeficitVal} kcal`
                              : `❌ Surplus intake of ${Math.abs(actualDeficitVal)} kcal detected.`}
                        </p>
                      </div>

                      {/* Calorie Deficit Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${actualDeficitVal >= dailyDeficitGoalVal ? 'bg-lime-400' : actualDeficitVal > 0 ? 'bg-amber-400' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, (actualDeficitVal / dailyDeficitGoalVal) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Protein Tracker Indicator */}
                    <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] uppercase font-bold text-zinc-500">Total Protein Intake</span>
                          <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono">Target: {proteinGoalVal}g - {proteinGoalMaxVal}g</span>
                        </div>
                        {(() => {
                          const proteinInVal = activeLog.foodItems.reduce((acc, curr) => acc + (curr.protein || 0), 0);
                          const ratioForDay = userWeightLbs > 0 ? Number((proteinInVal / userWeightLbs).toFixed(2)) : 0;
                          
                          let proteinStatusColor = 'text-rose-500';
                          let proteinStatusText = `❌ Critical. Eat more protein! (${ratioForDay}g/lb)`;
                          
                          if (ratioForDay >= 0.7) {
                            proteinStatusColor = 'text-[#a3e635]';
                            proteinStatusText = `✓ Target Met! (${ratioForDay}g/lb)`;
                          } else if (ratioForDay >= 0.5) {
                            proteinStatusColor = 'text-amber-400';
                            proteinStatusText = `💪 Good enough. (${ratioForDay}g/lb)`;
                          } else if (ratioForDay >= 0.4) {
                            proteinStatusColor = 'text-sky-400';
                            proteinStatusText = `⚠️ Sub-optimal. (${ratioForDay}g/lb)`;
                          }
                          
                          return (
                            <>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className={`text-xl font-black font-mono ${proteinStatusColor}`}>
                                  {proteinInVal} <span className="text-[10px] font-bold text-zinc-500">grams</span>
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                                {proteinStatusText}
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      {/* Protein Progress bar */}
                      <div className="mt-3">
                        {(() => {
                          const proteinInVal = activeLog.foodItems.reduce((acc, curr) => acc + (curr.protein || 0), 0);
                          const ratioForDay = userWeightLbs > 0 ? (proteinInVal / userWeightLbs) : 0;
                          
                          let barColor = 'bg-rose-500';
                          if (ratioForDay >= 0.7) {
                            barColor = 'bg-lime-400';
                          } else if (ratioForDay >= 0.5) {
                            barColor = 'bg-amber-400';
                          } else if (ratioForDay >= 0.4) {
                            barColor = 'bg-sky-450';
                          }
                          
                          return (
                            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${Math.min(100, Math.max(0, (proteinInVal / (proteinGoalMaxVal || 150)) * 100))}%` }}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Automatic Energy Scorecard Grade Card */}
                    <div className={`border p-4 rounded-xl flex flex-col justify-between transition ${
                      activeLog.rating === 'good_job'
                        ? 'border-lime-500/20 bg-lime-500/5'
                        : activeLog.rating === 'pwede_na'
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-rose-500/20 bg-rose-500/5'
                    }`}>
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Calorie Deficit Grade</span>
                        <div className="flex items-center gap-1.5 mt-1.5 font-sans">
                          {activeLog.rating === 'good_job' ? (
                            <>
                              <span className="text-xl">🔥</span>
                              <div>
                                <span className="text-xs font-black text-white uppercase tracking-wider block">GOOD JOB ✓</span>
                                <span className="text-[8.5px] text-lime-400 font-extrabold uppercase leading-none font-mono">Calorie Target Achieved</span>
                              </div>
                            </>
                          ) : activeLog.rating === 'pwede_na' ? (
                            <>
                              <span className="text-xl font-mono">😐</span>
                              <div>
                                <span className="text-xs font-black text-white uppercase tracking-wider block">PWEDE NA ⚠️</span>
                                <span className="text-[8.5px] text-amber-500 font-extrabold uppercase leading-none font-mono">Partial Adherence</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-xl">⚠️</span>
                              <div>
                                <span className="text-xs font-black text-white uppercase tracking-wider block">FAILED ❌</span>
                                <span className="text-[8.5px] text-rose-500 font-extrabold uppercase leading-none font-mono font-bold">Calorie Surplus</span>
                              </div>
                            </>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2.5 leading-relaxed">
                          {activeLog.rating === 'good_job' 
                            ? "Your energy outflow matches your weight goals to guarantee visual fat reduction."
                            : activeLog.rating === 'pwede_na' 
                              ? "Adherence is partial. You avoided gained tissue but remain behind schedule for this day's goal."
                              : "Your intake exceeded your outflow, causing an energy surplus."}
                        </p>
                      </div>
                    </div>

                    {/* Automatic Protein Synthesis Grade Card */}
                    {(() => {
                      const proteinInVal = activeLog.foodItems.reduce((acc, curr) => acc + (curr.protein || 0), 0);
                      const ratioForDay = userWeightLbs > 0 ? Number((proteinInVal / userWeightLbs).toFixed(2)) : 0;
                      const isGood = ratioForDay >= 0.7;
                      const isMediocre = ratioForDay >= 0.5 && ratioForDay < 0.7;
                      const isLow = ratioForDay >= 0.4 && ratioForDay < 0.5;

                      let borderBg = 'border-rose-500/20 bg-rose-500/5';
                      if (isGood) borderBg = 'border-lime-500/20 bg-lime-500/5';
                      else if (isMediocre) borderBg = 'border-amber-500/20 bg-amber-500/5';
                      else if (isLow) borderBg = 'border-sky-500/20 bg-sky-500/5';

                      return (
                        <div className={`border p-4 rounded-xl flex flex-col justify-between transition ${borderBg}`}>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Muscle Preservation Grade</span>
                            <div className="flex items-center gap-1.5 mt-1.5 animate-fade-in font-sans">
                              {isGood ? (
                                <>
                                  <span className="text-xl">💪</span>
                                  <div>
                                    <span className="text-xs font-black text-white uppercase tracking-wider block">GOOD JOB ✓</span>
                                    <span className="text-[8.5px] text-lime-400 font-extrabold uppercase leading-none font-mono">Muscle Protected (Anabolic)</span>
                                  </div>
                                </>
                              ) : isMediocre ? (
                                <>
                                  <span className="text-xl font-mono">🍗</span>
                                  <div>
                                    <span className="text-xs font-black text-white uppercase tracking-wider block">GOOD ENOUGH 💪</span>
                                    <span className="text-[8.5px] text-amber-500 font-extrabold uppercase leading-none font-mono font-black">Basic Safety Met</span>
                                  </div>
                                </>
                              ) : isLow ? (
                                <>
                                  <span className="text-xl font-mono">⚡</span>
                                  <div>
                                    <span className="text-xs font-black text-white uppercase tracking-wider block">SUB-OPTIMAL ⚠️</span>
                                    <span className="text-[8.5px] text-sky-400 font-extrabold uppercase leading-none font-mono font-black">Sub-Optimal Level</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="text-xl">🚨</span>
                                  <div>
                                    <span className="text-xs font-black text-white uppercase tracking-wider block">CRITICAL ⚠️</span>
                                    <span className="text-[8.5px] text-rose-500 font-extrabold uppercase leading-none font-mono font-black animate-pulse">Critical: Eat more protein!</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-2.5 leading-relaxed">
                              {isGood
                                ? `Target protein achieved (${ratioForDay}g/lb >= 0.7g/lb). Sparing active lean skeletal muscle tissue during deficit states.`
                                : isMediocre
                                  ? `Protein intake is ${ratioForDay}g/lb. Muscle preservation status is good enough to prevent breakdown.`
                                  : isLow
                                    ? `Protein is sub-optimal (${ratioForDay}g/lb). Increase protein closer to 0.5g - 0.7g/lb to preserve lean tissue.`
                                    : `Critical protein deficiency (${ratioForDay}g/lb). Deficit triggers muscle cannibalization! Eat more protein to reach the 0.4g/lb threshold.`}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

                {/* Day Net math summary indicator banner */}
                <div className="border-t border-zinc-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-zinc-950 p-2.5 rounded-full border border-zinc-800 text-zinc-400 shrink-0 mt-0.5">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Daily Net Fat Formula</h4>
                      <p className="text-[11px] text-zinc-400 leading-normal max-w-lg mt-0.5">
                        Deficit = Calories Out ({caloriesOutVal} kcal) - Calories In ({caloriesInVal} kcal). Burned deficit will divide by 3,500 to yield pure fat lbs reduced!
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-950 px-5 py-3 rounded-xl border border-zinc-800 text-center sm:text-right min-w-[200px]">
                    <span className="text-[10px] text-zinc-500 uppercase font-black block">Net Deficit Result</span>
                    <span className={`text-2xl font-black font-mono ${(caloriesOutVal - caloriesInVal) >= 0 ? "text-lime-400" : "text-rose-400"}`}>
                      {caloriesOutVal - caloriesInVal} <span className="text-xs">kcal</span>
                    </span>
                  </div>
                </div>

                {/* Day Complete / Lock State Control Panel */}
                <div className="border-t border-zinc-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {activeLog.completed ? (
                      <div className="bg-lime-500/10 text-lime-400 border border-lime-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Day {selectedDay} Complete ✓</span>
                      </div>
                    ) : (
                      <div className="bg-zinc-950 text-amber-500 border border-zinc-800/60 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase font-mono shrink-0">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>In Progress</span>
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {activeLog.completed 
                        ? "This day's calorie burn is officially logged in your cumulative challenge statistics."
                        : "Finish logging meals and physical workouts, then click complete to sync this day to your stats."}
                    </p>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    {activeLog.completed ? (
                      <button
                        onClick={() => updateActiveLog({ completed: false })}
                        className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition border border-zinc-700"
                      >
                        Re-open Day
                      </button>
                    ) : (
                      <button
                        onClick={() => updateActiveLog({ completed: true })}
                        className="w-full sm:w-auto bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition shadow-lg shadow-lime-400/10"
                      >
                        Complete Day {selectedDay} & Lock
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

            {activeTab === 'info' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-[#a3e635] uppercase bg-lime-500/10 px-2.5 py-1 rounded">METABOLIC SCIENCE SPECIFICATIONS</span>
                  <h2 className="text-2xl font-black text-white uppercase mt-3">The Science of 30 Day Challenge</h2>
                  <p className="text-xs text-zinc-400 mt-1">Understanding calorie balance and perfect calorie logging.</p>
                </div>

                {/* INTERACTIVE APPS WALKTHROUGH & TUTORIAL */}
                <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-850 space-y-5">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-[#a3e635] uppercase bg-lime-500/10 px-2.5 py-1 rounded">APPLICATION WALKTHROUGH GUIDE</span>
                    <h3 className="text-lg font-black text-white uppercase mt-2.5 flex items-center gap-1.5">
                      <BookOpen className="w-5 h-5 text-lime-400" /> Complete App Tutorial
                    </h3>
                    <p className="text-xs text-zinc-400">Detailed step-by-step masterclass on how to use every single feature of the tracker to guarantee your biological results.</p>
                  </div>

                  {/* Tab Selector buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-zinc-900 pb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTutorialTab('onboarding')}
                      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition duration-150 border ${
                        activeTutorialTab === 'onboarding'
                          ? 'bg-lime-400 text-zinc-950 border-lime-400'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                    >
                      1. Profile Calibration
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTutorialTab('logging')}
                      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition duration-150 border ${
                        activeTutorialTab === 'logging'
                          ? 'bg-lime-400 text-zinc-950 border-lime-400'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                    >
                      2. Food & Recipes
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTutorialTab('workouts')}
                      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition duration-150 border ${
                        activeTutorialTab === 'workouts'
                          ? 'bg-lime-400 text-zinc-950 border-lime-400'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                    >
                      3. Energy Outflow
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTutorialTab('locking')}
                      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition duration-150 border ${
                        activeTutorialTab === 'locking'
                          ? 'bg-lime-400 text-zinc-950 border-lime-400'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                    >
                      4. Lock Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTutorialTab('reports')}
                      className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition duration-150 border ${
                        activeTutorialTab === 'reports'
                          ? 'bg-lime-400 text-zinc-950 border-lime-400'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                    >
                      5. Reports & Showcase
                    </button>
                  </div>

                  {/* Tab Content rendering */}
                  <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-xl border border-zinc-900 text-xs space-y-3.5 min-h-[180px]">
                    {activeTutorialTab === 'onboarding' && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></span>
                          Phase 1: Calibrating Onboarding Biometrics
                        </h4>
                        <p className="text-zinc-400 leading-relaxed">
                          Your first launch will present the **Scientific Biometrics Calibration Onboarding**. Fill in your Gender, Age, Height, Weight, and general Activity multiplier baseline.
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                          The app uses these details to generate your **Basal Metabolic Rate (BMR)** showing your daily idle energy use. It also sets your mandatory **Muscle Protection Protein Range** (0.7g - 1.0g protein weight per lb of body mass) so you burn pure adipose tissue instead of shrinking functional muscle fibers.
                        </p>
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 text-[11px] font-mono text-zinc-500 leading-relaxed">
                          💡 <strong className="text-zinc-300">Biometric Settings Adjust:</strong> If your starting parameters change, click the <strong className="text-white">Settings Cog ⚙️</strong> in the header to modify BMR or weight preferences without wiping challenge progression!
                        </div>
                      </div>
                    )}

                    {activeTutorialTab === 'logging' && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></span>
                          Phase 2: Food & Meal Calorie Logging
                        </h4>
                        <p className="text-zinc-400 leading-relaxed">
                          Consistent, meticulous nutrient tracking is high essential. Go to the <strong className="text-white">30-Day Journal</strong> tab:
                        </p>
                        <ul className="list-disc pl-5 text-zinc-400 space-y-1.5 leading-relaxed">
                          <li>Click on <strong className="text-white">Add Food Item</strong> to open the meal creator drawer.</li>
                          <li>Search the rich directory for fast items (e.g., chicken breasts 🥩, salmon, hard-boiled eggs, oats, or protein isolate).</li>
                          <li>Or toggle manual food logging to directly key-in a unique meal description, customized calorie count, and exact protein weight in grams.</li>
                          <li>Adjust serving count multipliers to immediately scale and log the overall nutrients in real-time.</li>
                        </ul>
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 text-[11px] font-mono text-zinc-500 leading-relaxed">
                          🥗 <strong className="text-zinc-305">Macro Highlights:</strong> Items boasting high protein-to-calorie proportions automatically gain a meat badge 🥩. Keep your values tracking upwards to maintain skeletal muscle metrics!
                        </div>
                      </div>
                    )}

                    {activeTutorialTab === 'workouts' && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></span>
                          Phase 3: Workout Burn & Override Presets
                        </h4>
                        <p className="text-zinc-400 leading-relaxed">
                          All physical movements enlarge your biological calorie deficit. On your calendar journal view:
                        </p>
                        <ul className="list-disc pl-5 text-zinc-400 space-y-2 leading-relaxed">
                          <li>
                            <strong className="text-white">Physical presets</strong>: Log training levels instantly with standard sliders (Low: 150 kcal baseline, Medium: 350 kcal baseline, High: 600 kcal intense lift).
                          </li>
                          <li>
                            <strong className="text-white">Custom exercise overrides</strong>: Directly fill a custom calorie expenditure (e.g., gym weights session) alongside physical activity notes.
                          </li>
                          <li>
                            <strong className="text-lime-400">Manual Total Out Mode</strong>: Toggle this selection to bypass BMR calculations. This is perfect for wearing Garmin, Fitbit, Apple Watch, Whoop, or Oura Rings—directly punch your tracker's daily aggregate output limit.
                          </li>
                        </ul>
                      </div>
                    )}

                    {activeTutorialTab === 'locking' && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></span>
                          Phase 4: Lock Progress & Check Daily Ratings
                        </h4>
                        <p className="text-zinc-400 leading-relaxed">
                          The app calculates statistics day-by-day. At the end of logging meals or runs, look at your automated day status:
                        </p>
                        <ul className="list-disc pl-5 font-mono text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
                          <li>
                            🏆 <strong className="text-white font-sans font-bold">GOOD JOB ✓</strong>: Active deficit perfectly exceeds or meets your daily target rate.
                          </li>
                          <li>
                            ⚠️ <strong className="text-white font-sans font-bold">PWEDE NA (Partial)</strong>: You avoided fat gain but failed to generate a strong enough deficit.
                          </li>
                          <li>
                            ❌ <strong className="text-white font-sans font-bold">FAILED (Surplus)</strong>: Intake exceeded outburn, causing muscle and tissue storage surplus.
                          </li>
                        </ul>
                        <p className="text-zinc-400 leading-relaxed">
                          Once your logs match reality, click the big <strong className="text-white">Complete Day & Lock</strong> button. This locks the active date block and permanently syncs your energy balance into the master outcome averages!
                        </p>
                      </div>
                    )}

                    {activeTutorialTab === 'reports' && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></span>
                          Phase 5: Performance Reports & Photo Showcase
                        </h4>
                        <p className="text-zinc-400 leading-relaxed">
                          The <strong className="text-white">Report Dashboard</strong> averages and evaluates all locked columns to chart your biological recomposition trajectory:
                        </p>
                        <ul className="list-disc pl-5 text-zinc-400 space-y-1.5 leading-relaxed">
                          <li><span className="text-white font-bold">Total Fat Loss</span>: The formula converts cumulative deficit kcal into real lbs reduced.</li>
                          <li><span className="text-white font-bold">Daily Deficit Performance & Avg Protein</span>: Check averages against target guides in real-time.</li>
                          <li><span className="text-white font-bold">Body Weight Tracking Logs</span>: Enter your Day 1 Starting weight and Day 30 Graduation weight side-by-side.</li>
                          <li><span className="text-white font-bold">Visual Comparison Photos</span>: Upload photographs for Day 1 and Day 30. Then, click <strong className="text-white">Share Transformation Report 🚀</strong> to download a text card summary of your progress!</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* DUAL METRIC REVELATION: FAT LOSS vs WEIGHT LOSS */}
                <div className="bg-gradient-to-r from-lime-950/20 via-zinc-950 to-zinc-950 border border-lime-500/20 rounded-xl p-5 sm:p-6 space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-lime-400/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center gap-2 text-lime-400">
                    <Scale className="w-5 h-5 animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest uppercase bg-lime-500/10 px-2.5 py-1 rounded border border-lime-500/10">CRITICAL METRIC DIFFERENCE</span>
                  </div>
                  
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    ⚠️ FAT LOSS IS NOT THE SAME AS WEIGHT LOSS
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
                    <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-2">
                      <h4 className="font-extrabold text-rose-450 uppercase tracking-wide text-[10px] sm:text-[11px]">📉 Weight Loss (Crude Metric)</h4>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        Weight loss simply measures the reduction of your total raw mass—which includes precious <strong className="text-white">muscle tissue, intracellular water, glycogen, and bone density</strong>. Starvation diets or excessive dehydration trigger massive scale drops, but much of that loss comes from active muscle tissue, slowing your metabolic rate and encouraging rebelling fat gain.
                      </p>
                    </div>
                    <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-2">
                      <h4 className="font-extrabold text-lime-400 uppercase tracking-wide text-[10px] sm:text-[11px]">🔥 Pure Fat Loss (Our Objective)</h4>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        Fat loss targets the selective burning of lipid adipose tissue while **safeguarding or strengthening your lean muscles**. This is achieved by creating a calculated caloric deficit coupled with a **strictly maintained high protein intake** to preserve structural lean fiber density.
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-zinc-500 italic mt-2">
                    "When you protect your muscles with high protein intake, your Basal Metabolic Rate (BMR) remains elevated even as you lean out. This protocol guarantees that every single pound lost over these 30 days represents pure, unmitigated fat."
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850 space-y-3">
                    <h3 className="text-xs font-bold uppercase text-lime-400 tracking-widest flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#a3e635]" /> Core Energy Balance
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Your body obeys simple budget rules: energy cannot appear out of nowhere, only stored or expended. Weight change complies with this simple formula:
                    </p>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-center font-mono text-xs text-white">
                      Δ Stored Energy = Calories Out - Calories In
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      To lose exactly <strong>1 lb</strong> of pure adipose tissue, you must establish an energy deficit of approximately <strong>3,500 kcal</strong>. Daily deficit accumulation guarantees fat conversion to carbon dioxide and water.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850 space-y-3">
                    <h3 className="text-xs font-bold uppercase text-lime-400 tracking-widest flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#a3e635]" /> Basal Metabolic Rate (BMR)
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Your BMR represents the exact caloric consumption required to power basic biological life functions in an idle state (breathing, cellular repair, heartbeat, brain activity).
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This base outflow forms the biological baseline of our equation. It is calculated automatically during onboarding based on your age, weight, and biometric markers.
                    </p>
                    <div className="bg-zinc-900 border border-zinc-800 p-2 text-center text-[11px] font-mono font-bold text-zinc-300 rounded">
                      Your idle BMR: {profile.manualBmr} kcal / day
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850 space-y-3">
                    <h3 className="text-xs font-bold uppercase text-lime-400 tracking-widest flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-[#a3e635]" /> Macronutrient Strategy: Protein
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      When operating in a caloric deficit, your body may look to active lean muscle fibers for energy. To counter muscular breakdown and retain active lean mass, you require high protein intake.
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Our protocol prescribes a target of <strong>0.7g - 1.0g of protein per lb of body weight</strong>. While 0.5g per lb is good enough to prevent muscle loss, dropping below 0.4g per lb is a critical protein deficiency level and you must eat more protein.
                    </p>
                    <div className="bg-zinc-900 border border-zinc-800 p-2 text-center text-[11px] font-mono font-bold text-zinc-300 rounded">
                      Your Protein Goal Range: {proteinGoalVal} - {proteinGoalMaxVal} grams / day
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850 space-y-3">
                    <h3 className="text-xs font-bold uppercase text-lime-400 tracking-widest flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-[#a3e635]" /> Active Workouts & Overrides
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Every physical movement adds to your daily energy outflow. You can choose from effort presets (Low: 150 kcal, Medium: 350 kcal, High: 600 kcal) or manually override active calories.
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      If you utilize smart wearables (Apple Watch, Garmin, Whoop, Oura Ring), select <strong className="text-white">Manual Total Out</strong> to directly overwrite both BMR and active burn for exact biometric sync!
                    </p>
                  </div>
                </div>

                {/* Deficit to Weight Loss Projection Matrix */}
                <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl text-xs space-y-3.5">
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                     <span>📚 Weight Recomposition Projections</span>
                  </h3>
                  <p className="text-zinc-500 font-medium">Deficit accumulation required to achieve your weight loss goals under pure mathematical laws:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-zinc-400">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500">
                          <th className="pb-2 font-black uppercase">Target Weight Reduced</th>
                          <th className="pb-2 font-black uppercase">Equivalent Energy Deficit</th>
                          <th className="pb-2 font-black uppercase">Daily Deficit (30-day span)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-905">
                        <tr>
                          <td className="py-2.5 font-bold text-white">2 lbs</td>
                          <td className="py-2.5 font-semibold text-lime-400">7,000 kcal</td>
                          <td className="py-2.5">233 kcal / day</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-white">4 lbs</td>
                          <td className="py-2.5 font-semibold text-lime-400">14,000 kcal</td>
                          <td className="py-2.5">466 kcal / day</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-white">6 lbs <span className="text-lime-400 leading-none text-[9px] font-black uppercase bg-lime-400/10 px-1 py-0.5 rounded ml-1">Ideal Deficit</span></td>
                          <td className="py-2.5 font-semibold text-lime-400">21,000 kcal</td>
                          <td className="py-2.5">700 kcal / day</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-white">8 lbs</td>
                          <td className="py-2.5 font-semibold text-lime-400">28,000 kcal</td>
                          <td className="py-2.5">933 kcal / day</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-white">10 lbs</td>
                          <td className="py-2.5 font-semibold text-lime-400">35,000 kcal</td>
                          <td className="py-2.5">1,166 kcal / day</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 30-Day Pure Fat Commitment & Guarantee Declaration */}
                <div className="bg-lime-950/15 border border-lime-400/20 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                  <div className="flex gap-4 items-start">
                    <div className="bg-lime-400/10 p-3 rounded-xl border border-lime-400/20 text-lime-400 shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-lime-400 tracking-wider">
                        🛡️ Creator's Guarantee & Pledge
                      </h3>
                      <div className="text-xs text-zinc-300 font-medium leading-relaxed space-y-3">
                        <p className="italic font-sans">
                          "This challenge is not easy. It requires you to eat less, move more, and track your food consistently. Commitment for 30 days is an absolute must."
                        </p>
                        <p className="italic font-sans">
                          "I made this easy for you to follow. Stick to it, and I guarantee you will lose pure fat, maintain or grow your muscle, and change the way you look in just 30 days."
                        </p>
                        <div className="pt-2 font-mono space-y-0.5">
                          <p className="font-extrabold text-[#a3e635] tracking-wide">
                            good luck!
                          </p>
                          <p className="font-black text-zinc-400">
                            - Ragnar.
                          </p>
                        </div>
                      </div>
                      <div className="pt-0.5 flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-lime-400 animate-pulse"></span>
                        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">30-Day Deficit Protocol Pledge</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
        </AnimatePresence>
      </main>

      {/* Floating custom toast alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl max-w-sm flex items-center gap-3"
          >
            <div className="bg-lime-950/20 text-lime-400 p-1.5 rounded-lg border border-lime-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-200 font-bold tracking-wide">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Share Transformation Report Modal */}
      <AnimatePresence>
        {showTransformationModal && generatedReportImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl my-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-lime-950/30 text-lime-400 p-2 rounded-xl border border-lime-500/10">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-lime-400">Your 30-Day transformation</span>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">SHARE TRANSFORMATION REPORT</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransformationModal(false)}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-xl text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Layout for previewing the report card */}
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed text-center sm:text-left">
                  Your official 1080x1080 JPEG poster has been compiled! This shows your day 1 starting photo and day 30 graduation photo side-by-side with your verified metabolic body fat burned.
                </p>

                {/* Poster viewport */}
                <div className="bg-zinc-900 w-full max-w-sm mx-auto aspect-square border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative group">
                  <img
                    src={generatedReportImage}
                    alt="Compiled Transformation Report"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center pointer-events-none">
                    <p className="text-[11px] font-black uppercase text-lime-400 tracking-wider bg-zinc-950/90 py-2 px-4 rounded-xl border border-zinc-800 flex items-center gap-1.5 shadow-xl">
                      <Camera className="w-3.5 h-3.5" /> High-Resolution 1080x1080 JPEG
                    </p>
                  </div>
                </div>

                {/* Download and Share Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href={generatedReportImage}
                    download={`transformation-report-${profile?.name.replace(/\s+/g, '-').toLowerCase() || 'victory'}.jpg`}
                    className="bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition text-center flex items-center justify-center gap-2 shadow-lg shadow-lime-400/10 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Image File</span>
                  </a>

                  <button
                    onClick={() => {
                      if (!profile) return;
                      const textToCopy = `🏆 30-DAY METABOLIC TRANSFORMATION REPORT 🏆\n\n🛡️ Challenger Name: ${profile.name.toUpperCase()}\n📉 Metabolic Fat Loss: ${stats.fatBurnedLbs} lbs of adipose\n⚖️ Day 1 Weight vs Day 30 Weight: ${profile.day1Weight !== undefined ? profile.day1Weight : profile.weight} to ${profile.day30Weight || 'Pending'} ${profile.weightUnit || 'lbs'}\n🔥 Adherence Progress rate: ${stats.daysProgressed}/30 lock blocks\n\nCalculated and logged mathematically on the 30 Day Challenge cockpit tracker! 🚀`;
                      navigator.clipboard.writeText(textToCopy)
                        .then(() => setToastMessage("✓ Plaintext summary copied to clipboard!"))
                        .catch(err => {
                          console.error(err);
                          setToastMessage("Plaintext copy failed");
                        });
                    }}
                    className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 font-mono cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Text Summary</span>
                  </button>
                </div>

                {/* Mobile Friendly instructions footer */}
                <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">📱 Saving on mobile devices (iOS / Android)</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                    If direct download doesn’t automatically add the poster to your local photo library, just <strong className="text-white">tap and hold the image preview</strong> above until your browser option pops up, then select <strong className="text-lime-400">"Save Image"</strong> or <strong className="text-lime-400">"Add to Photos"</strong>.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom embedded confirmation dialog for restart */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex gap-3 items-start">
                <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-rose-400 shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Hazard protocol warning</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Restart 30 Day Challenge?</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                    This will permanently delete all your daily log inputs, target protein preferences, logged menus, calories, body weights, and progress photographs.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">System Warning Status</span>
                <p className="text-xs text-zinc-300 font-medium">This operation cannot be undone. You will revert back to Day 1 onboarding stage.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs transition uppercase tracking-wider font-mono text-center shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeResetChallenge}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition uppercase tracking-wider font-mono text-center shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Restart Challenge</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
