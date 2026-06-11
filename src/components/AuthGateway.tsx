import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { Shield, Lock, User, Sparkles, Scale, CircleAlert, Eye, EyeOff, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthGatewayProps {
  onSuccess: () => void;
  onContinueAsGuest: () => void;
}

export default function AuthGateway({ onSuccess, onContinueAsGuest }: AuthGatewayProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper to standardise usernames into Firebase email format
  const formatEmail = (val: string): string => {
    const trimmed = val.trim();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    // Convert direct username to an email space
    return `${trimmed.toLowerCase()}@ragnarschallenge.com`;
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Allow popups for Google Auth
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to sign in with Google. Please try again.";
      if (err.code === 'auth/popup-blocked') {
        errMsg = "Popup blocked! Please enable popups in your browser settings to continue with Google Sign-In.";
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = "Network error. Please check your internet connection and try again.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        errMsg = "The sign-in popup was closed before completion.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError("Please enter a username or email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const email = formatEmail(trimmedId);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      let errMsg = "An unexpected error occurred. Please try again.";
      
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = "Custom Email/Password registration is currently disabled for this Firebase project. Please use 'Continue with Google' instead—it is fully supported and works instantly without configuration! Alternatively, you can run in offline Guest Mode.";
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = "Incorrect password or username. Please check your credentials.";
      } else if (err.code === 'auth/user-not-found') {
        errMsg = "No account found with this username or email.";
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = "This username or email is already registered.";
      } else if (err.code === 'auth/invalid-email') {
        errMsg = "Invalid username format. Use alphanumeric characters.";
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = "Network error. Please check your internet connection.";
      }
      
      setError(errMsg);
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
              Cloud Synchronization Gateway
            </div>
          </div>
        </div>

        {/* Instantly Configured Google Sign-In */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl font-sans cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg active:scale-[0.99]"
            id="auth-google-btn"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <p className="text-[9px] text-zinc-400 text-center leading-relaxed font-medium">
            💡 <strong className="text-lime-400">Recommended:</strong> Works instantly on all phones. No registry/owner setup required.
          </p>

          <div className="flex items-center pt-2">
            <div className="flex-grow border-t border-zinc-900"></div>
            <span className="px-3 text-[9px] font-mono text-zinc-650 uppercase tracking-widest whitespace-nowrap">Or custom credentials</span>
            <div className="flex-grow border-t border-zinc-900"></div>
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
              Username or Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isLogin ? "e.g. ragnar123" : "Choose username or email"}
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
              <span>Sign In Securely</span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Onboarding info note */}
        <div className="text-[10px] text-zinc-500 space-y-1.5 leading-relaxed bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
          <p className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3 h-3 text-lime-400" />
            <strong className="text-zinc-300 uppercase tracking-wide">Multi-Phone Sync:</strong>
          </p>
          <p>
            Storing your metrics on the cloud allows accessing your challenge, photo logs, and daily macros from any device instantly, without losing your active profile settings!
          </p>
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
