import React, { useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Shield, 
  Lock, 
  User, 
  Sparkles, 
  Scale, 
  CircleAlert, 
  Eye, 
  EyeOff,
  Database,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

interface AuthGatewayProps {
  onLoginSuccess: (user: { uid: string; email: string }) => void;
  onContinueAsGuest: () => void;
}

export default function AuthGateway({ onLoginSuccess, onContinueAsGuest }: AuthGatewayProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async (targetUser: string) => {
    setIsDeleting(true);
    try {
      // 1. Delete all subcoll logs
      const logsRef = collection(db, 'profiles', targetUser, 'logs');
      const logsSnap = await getDocs(logsRef);
      for (const logDoc of logsSnap.docs) {
        await deleteDoc(doc(db, 'profiles', targetUser, 'logs', logDoc.id));
      }
      // 2. Delete main doc
      await deleteDoc(doc(db, 'profiles', targetUser));
      
      // Update our list
      await fetchAccounts();
      
      // Clear current form if matched
      if (username.trim().toLowerCase() === targetUser.toLowerCase()) {
        setUsername('');
        setPassword('');
      }
      setDeletingAccount(null);
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      setError("Failed to purge account data. " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    setAccountsError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({
          username: doc.id,
          ...doc.data()
        });
      });
      setAccounts(list);
    } catch (err: any) {
      console.error("Failed to fetch profiles:", err);
      setAccountsError("Could not retrieve accounts library.");
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleToggleAccounts = () => {
    const nextVal = !showAccounts;
    setShowAccounts(nextVal);
    if (nextVal) {
      fetchAccounts();
    }
  };

  // Validate username format (simple alphanumeric + underscores/hyphens to be safe document IDs)
  const isValidUsername = (val: string): boolean => {
    return /^[a-zA-Z0-9_\-]+$/.test(val);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }

    if (!isValidUsername(trimmedUsername)) {
      setError("Username can only contain letters, numbers, underscores (_), and hyphens (-). No spaces or special characters.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, 'profiles', trimmedUsername);
      const userSnap = await getDoc(userRef);

      if (isLogin) {
        // --- SIGN IN MODE ---
        if (!userSnap.exists()) {
          setError("No account found with this username. Please switch to the 'Create Account' tab if you are new.");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        
        // If password is not registered yet (e.g. from guest sync upgrade or blank migration), let's register the current password input!
        if (!userData.password) {
          await setDoc(userRef, { password: password }, { merge: true });
          userData.password = password;
        } else if (userData.password !== password) {
          setError("Incorrect password. Please verify your password and try again.");
          setLoading(false);
          return;
        }

        // Successfully logged in!
        const sessionUser = {
          uid: trimmedUsername,
          email: `${trimmedUsername}@ragnarschallenge.com`
        };
        
        // Save session
        localStorage.setItem('ragnars_challenge_session', JSON.stringify(sessionUser));
        onLoginSuccess(sessionUser);

      } else {
        // --- REGISTER MODE ---
        if (userSnap.exists()) {
          setError("This username is already taken. Please choose a different username.");
          setLoading(false);
          return;
        }

        // Create a basic profile document with password and name
        const initialProfile = {
          name: username.trim(),
          password: password,
          age: 30,
          gender: 'male' as const,
          weight: 180,
          weightUnit: 'lbs' as const,
          height: 175,
          waist: 34,
          waistUnit: 'inches' as const,
          activityLevel: 'light' as const,
          bmrPreference: 'auto' as const,
          manualBmr: 1800,
          startDate: new Date().toISOString().split('T')[0],
          fatLossGoal: 10
        };

        await setDoc(userRef, initialProfile);

        const sessionUser = {
          uid: trimmedUsername,
          email: `${trimmedUsername}@ragnarschallenge.com`
        };

        // Save session
        localStorage.setItem('ragnars_challenge_session', JSON.stringify(sessionUser));
        onLoginSuccess(sessionUser);
      }
    } catch (err: any) {
      console.error("Auth helper failure:", err);
      setError(err?.message || "A database synchronization error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12" id="auth-gateway-container">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Mark */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-gradient-to-br from-lime-950/30 to-zinc-950 p-2.5 rounded-2xl border border-lime-400/35 text-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.15)] flex items-center justify-center">
            <div className="relative">
              <Shield className="w-8 h-8 stroke-[2] fill-lime-500/10" />
              <Scale className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-[45%] -translate-y-1/2 text-lime-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-widest uppercase font-sans">
              RAGNAR'S 30 DAYS
            </h1>
            <div className="text-[10px] text-lime-400 font-extrabold tracking-widest mt-1 uppercase">
              Simplified Cloud Authentication
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-zinc-900 p-1 rounded-xl">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              isLogin 
                ? 'bg-zinc-950 text-lime-400 shadow' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="auth-tab-login"
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              !isLogin 
                ? 'bg-zinc-950 text-lime-400 shadow' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="auth-tab-register"
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? "e.g. ragnar123" : "Choose username (letters/numbers only)"}
                className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-lime-500 focus:outline-none text-xs text-white rounded-xl pl-9 pr-4 py-3 placeholder:text-zinc-600 transition"
                id="auth-input-username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-lime-500 focus:outline-none text-xs text-white rounded-xl pl-9 pr-10 py-3 placeholder:text-zinc-600 transition"
                id="auth-input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-900/40 text-rose-400 p-3.5 rounded-xl flex items-start gap-2.5 text-[11px] leading-normal" id="auth-error-box">
              <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black uppercase text-xs tracking-widest py-3.5 rounded-xl font-sans cursor-pointer transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              <span>Sign In</span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Onboarding info note */}
        <div className="text-[10px] text-zinc-500 space-y-1.5 leading-relaxed bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
          <p className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3 h-3 text-lime-400" />
            <strong className="text-zinc-300 uppercase tracking-wide">Instant Cloud Sync:</strong>
          </p>
          <p>
            Storing your metrics on the cloud allows accessing your challenge data, daily macros, and food charts from any device instantly by logging back in.
          </p>
        </div>

        {/* Collapsible Registered Accounts Viewer */}
        <div className="pt-4 border-t border-zinc-900" id="auth-registered-accounts-section">
          <button
            type="button"
            onClick={handleToggleAccounts}
            className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-lime-400 transition uppercase tracking-wider py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 cursor-pointer border border-zinc-900"
            id="auth-accounts-toggle-btn"
          >
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-lime-400" />
              <span>Registered Accounts ({loadingAccounts ? "..." : accounts.length})</span>
            </div>
            {showAccounts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAccounts && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800" id="auth-accounts-list-container">
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-4 gap-2 text-zinc-500 text-[11px] font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-lime-400" />
                  <span>Loading profiles library...</span>
                </div>
              ) : accountsError ? (
                <p className="text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg font-mono">{accountsError}</p>
              ) : accounts.length === 0 ? (
                <p className="text-[10px] text-zinc-500 text-center py-3 font-mono">No accounts created on this cloud database yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {accounts.map((acc) => (
                    <div 
                      key={acc.username}
                      className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900 flex items-center justify-between gap-2 hover:border-zinc-850 hover:bg-zinc-900/65 transition text-[11px]"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-zinc-200 truncate font-mono">{acc.username}</span>
                          {acc.name && acc.name !== acc.username && (
                            <span className="text-[9px] text-zinc-500 truncate">({acc.name})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
                          <span className="bg-zinc-950 px-1 py-0.5 rounded text-[8px] border border-zinc-850/60 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-lime-400"></span>
                            <span>Pass: {acc.password || <em className="text-amber-500 font-sans tracking-tight">Not Set (Auto-Claim!)</em>}</span>
                          </span>
                        </div>
                      </div>
                      {deletingAccount === acc.username ? (
                        <div className="flex items-center gap-1.5 shrink-0 bg-rose-950/15 border border-rose-500/20 px-2 py-1 rounded-xl">
                          <span className="text-[9px] text-rose-300 font-bold uppercase">Purge?</span>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteAccount(acc.username)}
                            className="text-[9px] bg-rose-550 bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-lg transition"
                          >
                            {isDeleting ? "..." : "YES"}
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setDeletingAccount(null)}
                            className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-2 py-0.5 rounded-lg transition"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setUsername(acc.username);
                              setPassword(acc.password || '');
                            }}
                            className="text-[9px] bg-lime-400/5 hover:bg-lime-405 hover:bg-lime-400/10 active:scale-95 text-lime-400 px-2 py-1 rounded-lg border border-lime-400/20 font-bold uppercase tracking-wider transition cursor-pointer shrink-0"
                            title="Auto-fill credentials"
                          >
                            Auto-fill
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAccount(acc.username)}
                            className="p-1 px-1.5 bg-zinc-950/40 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg border border-zinc-900 hover:border-rose-500/20 transition cursor-pointer shrink-0"
                            title="Delete this account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Continuation Options Footer */}
        <div className="pt-2 border-t border-zinc-900 text-center">
          <button
            onClick={onContinueAsGuest}
            type="button"
            className="text-[11px] text-zinc-400 hover:text-lime-400 underline font-medium transition"
            id="auth-guest-btn"
          >
            Continue as Guest (Offline Mode)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
