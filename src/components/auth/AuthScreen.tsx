/**
 * Presentation Layer: First Impression & Complete Authentication System
 * 
 * CORE PRODUCT PRINCIPLE:
 * The first screen should primarily contain:
 * - Onfolio logo
 * - ONFOLIO
 * Then:
 * - Continue with Google
 * - Continue with Email
 * 
 * Complies with official Google OAuth and Web Crypto PBKDF2 authentication flows.
 */

import React, { useState } from 'react';
import { OnfolioLogo } from '../brand/OnfolioLogo.tsx';
import { useOnfolio } from '../../state/OnfolioContext.tsx';
import { authService } from '../../auth/authService.ts';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import { ArrowLeft, AlertCircle, Check, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  sessionExpired?: boolean;
}

type AuthView = 'root' | 'email_signin' | 'email_signup' | 'forgot_password' | 'verify_email';

export const AuthScreen: React.FC<AuthScreenProps> = ({ sessionExpired = false }) => {
  const { loginUser } = useOnfolio();
  const [view, setView] = useState<AuthView>('root');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [receivedCodeHint, setReceivedCodeHint] = useState<string | null>(null);

  // Clear feedback when switching views
  const switchView = (newView: AuthView) => {
    setError(null);
    setNotice(null);
    setView(newView);
  };

  // 1. Google OAuth Flow
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const { user } = await authService.signInWithGoogle();
      await loginUser(user.username, user.email);
    } catch (err: any) {
      const msg = err.message || 'Google sign-in unavailable';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signInWithEmail(email, password);
      await loginUser(user.username, user.email);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Email Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { verificationCode: code } = await authService.signUpWithEmail(email, password, displayName);
      setReceivedCodeHint(code);
      setNotice(`Verification code sent to ${email}`);
      setView('verify_email');
    } catch (err: any) {
      setError(err.message || 'Could not create account.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Email Verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Enter the 6-digit code.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.verifyEmailCode(email, verificationCode);
      await loginUser(user.username, user.email);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Password Reset Request & Completion
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { resetCode } = await authService.requestPasswordReset(email);
      setReceivedCodeHint(resetCode);
      setNotice(`Reset code sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Reset request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || !newPassword) {
      setError('Enter reset code and new password.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await authService.completePasswordReset(email, verificationCode, newPassword);
      setNotice('Password updated. Please sign in.');
      setPassword(newPassword);
      setView('email_signin');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#161C24] flex flex-col items-center justify-center p-6 selection:bg-[#D4683B] selection:text-white">
      {/* Session Expired Banner */}
      {sessionExpired && (
        <div className="mb-6 px-4 py-2.5 bg-[#FAF0EA] border border-[#D4683B]/30 rounded-xl text-xs text-[#161C24] flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-[#D4683B] shrink-0" />
          <span>Session expired. Please sign in again.</span>
        </div>
      )}

      {/* Main Centered Container */}
      <div className="w-full max-w-[340px] flex flex-col items-center text-center">
        {/* =========================================================================
            VIEW 1: ROOT FIRST IMPRESSION
            ========================================================================= */}
        {view === 'root' && (
          <div className="w-full flex flex-col items-center space-y-8 animate-in fade-in duration-200">
            {/* Logo Mark & Name Only */}
            <div className="flex flex-col items-center space-y-3">
              <OnfolioLogo size={56} iconOnly />
              <h1 className="text-xl font-bold tracking-tight text-[#161C24] uppercase">
                ONFOLIO
              </h1>
            </div>

            {/* Error or Notice Alert */}
            {error && (
              <div className="w-full p-2.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-xs text-[#A82A2A] text-left flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {notice && (
              <div className="w-full p-2.5 bg-[#EAF6EE] border border-[#1B7A4F]/20 rounded-xl text-xs text-[#1B7A4F] text-left flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="w-full space-y-3">
              {/* Google Button: Official OAuth Flow */}
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
                text="continue"
              />

              {/* Email Button */}
              <button
                type="button"
                onClick={() => switchView('email_signin')}
                disabled={isLoading}
                className="w-full h-12 bg-[#161C24] hover:bg-[#2B333E] active:bg-[#0E1217] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-60"
              >
                <span>Continue with Email</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: EMAIL SIGN IN
            ========================================================================= */}
        {view === 'email_signin' && (
          <form onSubmit={handleEmailSignIn} className="w-full space-y-4 animate-in fade-in text-left">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchView('root')}
                className="p-1 -ml-1 text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[#161C24]">Sign In</span>
              <div className="w-4" />
            </div>

            {error && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-xs text-[#A82A2A]">
                {error}
              </div>
            )}

            {notice && (
              <div className="p-2.5 bg-[#EAF6EE] border border-[#1B7A4F]/20 rounded-xl text-xs text-[#1B7A4F]">
                {notice}
              </div>
            )}

            {/* Google Sign In alternative */}
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              isLoading={isLoading}
              text="signin"
            />

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E4DD]" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-[#FAF8F5] px-2 text-[#8C97A5]">or sign in with email</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[#5E6978] block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  autoFocus
                  className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-medium text-[#5E6978]">Password</label>
                  <button
                    type="button"
                    onClick={() => switchView('forgot_password')}
                    className="text-[11px] text-[#5E6978] hover:text-[#161C24] cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchView('email_signup')}
                className="text-xs text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                No account? <span className="font-semibold text-[#161C24]">Sign up</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            VIEW 3: EMAIL SIGN UP
            ========================================================================= */}
        {view === 'email_signup' && (
          <form onSubmit={handleEmailSignUp} className="w-full space-y-4 animate-in fade-in text-left">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchView('email_signin')}
                className="p-1 -ml-1 text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[#161C24]">Create Account</span>
              <div className="w-4" />
            </div>

            {error && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-xs text-[#A82A2A]">
                {error}
              </div>
            )}

            {/* Google Sign Up alternative */}
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              isLoading={isLoading}
              text="signup"
            />

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E4DD]" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-[#FAF8F5] px-2 text-[#8C97A5]">or register with email</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[#5E6978] block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  autoFocus
                  className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#5E6978] block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#5E6978] block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Create Account'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchView('email_signin')}
                className="text-xs text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                Already have an account? <span className="font-semibold text-[#161C24]">Sign in</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            VIEW 4: EMAIL VERIFICATION
            ========================================================================= */}
        {view === 'verify_email' && (
          <form onSubmit={handleVerifyEmail} className="w-full space-y-4 animate-in fade-in text-left">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchView('email_signup')}
                className="p-1 -ml-1 text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[#161C24]">Verify Email</span>
              <div className="w-4" />
            </div>

            <p className="text-xs text-[#5E6978]">
              Enter the 6-digit code sent to <span className="font-medium text-[#161C24]">{email}</span>.
            </p>

            {receivedCodeHint && (
              <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] flex items-center justify-between">
                <span className="text-[#8C97A5]">Code:</span>
                <span className="font-mono font-bold tracking-widest text-[#D4683B]">{receivedCodeHint}</span>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-xs text-[#A82A2A]">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="w-full h-11 px-3 bg-white border border-[#E8E4DD] rounded-xl text-center text-base font-mono tracking-widest text-[#161C24] focus:outline-none focus:border-[#D4683B]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Confirm & Continue'}
            </button>
          </form>
        )}

        {/* =========================================================================
            VIEW 5: FORGOT PASSWORD
            ========================================================================= */}
        {view === 'forgot_password' && (
          <div className="w-full space-y-4 animate-in fade-in text-left">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchView('email_signin')}
                className="p-1 -ml-1 text-[#5E6978] hover:text-[#161C24] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[#161C24]">Reset Password</span>
              <div className="w-4" />
            </div>

            {error && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-xs text-[#A82A2A]">
                {error}
              </div>
            )}

            {notice && (
              <div className="p-2.5 bg-[#EAF6EE] border border-[#1B7A4F]/20 rounded-xl text-xs text-[#1B7A4F]">
                {notice}
              </div>
            )}

            {!notice ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <p className="text-xs text-[#5E6978]">Enter your email to receive a password reset code.</p>
                <div>
                  <label className="text-[11px] font-medium text-[#5E6978] block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    required
                    autoFocus
                    className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Send Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-3">
                {receivedCodeHint && (
                  <div className="p-2 bg-[#FAF8F5] border border-[#E8E4DD] rounded-lg text-xs flex justify-between">
                    <span className="text-[#8C97A5]">Reset Code:</span>
                    <span className="font-mono font-bold text-[#D4683B]">{receivedCodeHint}</span>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-medium text-[#5E6978] block mb-1">Reset Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit code"
                    required
                    className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs font-mono text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#5E6978] block mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    className="w-full h-10 px-3 bg-white border border-[#E8E4DD] rounded-xl text-xs text-[#161C24] focus:outline-none focus:border-[#D4683B]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#161C24] hover:bg-[#2B333E] text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
