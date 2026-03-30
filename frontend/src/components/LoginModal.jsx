import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, closeAuthModal } from '../store/authSlice';
import api from '../api/axios';
import { ShieldCheck, CheckCircle, X, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';

const LoginModal = () => {
  const { isAuthModalOpen } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [isLogin, setIsLogin] = useState(true);
  const [isOtpStep, setIsOtpStep] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Forgot password state
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [forgotPassStep, setForgotPassStep] = useState(1);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const getRecaptchaVerifier = async () => {
    // Recreate verifier each time to avoid stale widget/session issues across modal flows.
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (_) {
        // Ignore cleanup errors and create a new verifier.
      }
      window.recaptchaVerifier = null;
    }

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });

    await verifier.render();
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  if (!isAuthModalOpen) return null;

  // ─── Resend cooldown ────────────────────────────────────────────────────────
  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    const iv = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setSuccessMsg('');
    try {
      const verifier = await getRecaptchaVerifier();
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setSuccessMsg('New OTP sent to your phone via Firebase.');
      startCooldown();
    } catch (err) {
      console.error(err);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  // ─── Main submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // ── 0. FORGOT PASSWORD ───────────────────────────────────────────────────
      if (isForgotPass) {
        if (forgotPassStep === 1) {
          if (!phone.trim()) {
            setError('Phone number is required.');
            setIsLoading(false);
            return;
          }
          const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
          if (formattedPhone.length < 12) {
            setError('Please enter a valid phone number with country code (e.g., +919876543210).');
            setIsLoading(false);
            return;
          }
          const verifier = await getRecaptchaVerifier();
          setSuccessMsg('Sending OTP...');
          const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
          setConfirmationResult(result);
          setSuccessMsg('OTP sent to your phone via Firebase.');
          setForgotPassStep(2);
          startCooldown();

        } else if (forgotPassStep === 2) {
          if (!confirmationResult) {
            setError('No OTP session found.');
            setIsLoading(false);
            return;
          }
          await confirmationResult.confirm(otpCode);
          setSuccessMsg('✅ Phone verified! Please enter your new password.');
          setForgotPassStep(3);

        } else if (forgotPassStep === 3) {
          if (!newPassword.trim()) {
            setError('Please provide a new password.');
            setIsLoading(false);
            return;
          }
          await api.post('users/reset-password-phone/', {
            phone_number: phone,
            new_password: newPassword
          });
          setSuccessMsg('✅ Password has been reset! You can now log in.');
          setTimeout(() => {
            setIsForgotPass(false);
            setForgotPassStep(1);
            setIsLogin(true);
            setNewPassword('');
            setPhone('');
            setOtpCode('');
            setSuccessMsg('');
          }, 2000);
        }
      }
      // ── 1. LOGIN ────────────────────────────────────────────────────────────
      else if (isLogin) {
        const res = await api.post('users/login/', { username, password });
        const profile = await api.get('users/profile/', {
          headers: { Authorization: `Bearer ${res.data.access}` },
        });
        dispatch(loginSuccess({
          user: profile.data,
          token: res.data.access,
          refresh: res.data.refresh,
        }));
        dispatch(closeAuthModal());

        // ── 2. VERIFY OTP ───────────────────────────────────────────────────────
      } else if (isOtpStep) {
        if (!confirmationResult) {
          setError('No OTP session found. Please try registering again.');
          setIsLoading(false);
          return;
        }

        await confirmationResult.confirm(otpCode);

        // After successful Firebase phone verify, register the user to backend
        // Backend handles creating the user and marks is_verified=True automatically now
        await api.post('users/register/', {
          username,
          password,
          email: email || undefined,
          phone_number: phone,
        });

        setSuccessMsg('✅ Phone verified! Redirecting to login…');
        setTimeout(() => {
          setIsOtpStep(false);
          setIsLogin(true);
          setOtpCode('');
          setSuccessMsg('');
        }, 1500);

        // ── 3. REGISTER ─────────────────────────────────────────────────────────
      } else {
        // Phone is required
        if (!phone.trim()) {
          setError('Phone number is required for OTP verification.');
          setIsLoading(false);
          return;
        }

        // Validate phone number length (must be at least 10 digits + country code)
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        if (formattedPhone.length < 12) {
          setError('Please enter a valid phone number with country code (e.g., +919876543210).');
          setIsLoading(false);
          return;
        }

        const verifier = await getRecaptchaVerifier();

        setSuccessMsg('Sending OTP...');
        const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        setConfirmationResult(result);
        setSuccessMsg('OTP sent to your phone via Firebase.');
        setIsOtpStep(true);
        startCooldown();
      }

    } catch (err) {
      console.error('Auth error:', err);

      // Clear reCAPTCHA if it failed so the user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      if (err.code === 'auth/invalid-app-credential') {
        setError('Firebase setup error: Please ensure "reCAPTCHA Enterprise API" is enabled in Google Cloud Console for this project and "localhost" is an authorized domain.');
        return;
      }

      const data = err.response?.data;
      if (data?.detail) {
        setError(data.detail);
      } else if (data) {
        const key = Object.keys(data)[0];
        const val = data[key];
        setError(Array.isArray(val) ? val[0] : String(val));
      } else {
        setError(isLogin ? 'Invalid credentials.' : (err.message || 'Something went wrong.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (_) {
        // Ignore cleanup errors when closing modal.
      }
      window.recaptchaVerifier = null;
    }

    dispatch(closeAuthModal());
    setIsForgotPass(false);
    setForgotPassStep(1);
    setResetToken('');
    setNewPassword('');
    setOtpCode('');
  };

  // ─── Derived UI labels ──────────────────────────────────────────────────────
  const heading = isForgotPass ? 'Reset Password' : isOtpStep ? 'Verify Mobile' : isLogin ? 'Welcome Back' : 'Create Account';
  const subtext = isForgotPass
    ? (forgotPassStep === 1 ? 'Enter your registered mobile number.' : forgotPassStep === 2 ? `Enter the 6-digit code sent to ${phone || 'your number'}` : "Set a secure new password.")
    : isOtpStep
      ? `Enter the 6-digit code sent to ${phone || 'your number'}`
      : isLogin
        ? 'Secure access to your health data.'
        : "Enter your mobile — we'll send an OTP to verify.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Close */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-10 pb-8 bg-brand-50 border-b border-brand-100/50">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            {heading}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">{subtext}</p>
        </div>

        {/* Body */}
        <div className="p-10 pt-8">

          {/* Error */}
          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl mb-5 text-xs font-black uppercase tracking-widest border border-rose-100 flex items-start gap-3">
              <ShieldCheck size={18} className="text-rose-500 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl mb-5 text-xs font-bold border border-emerald-100 flex items-start gap-3">
              <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Forgot Password ── */}
            {isForgotPass ? (
              <div className="animate-in zoom-in-95 duration-300 space-y-5">
                {forgotPassStep === 1 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Registered Mobile <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold"
                        placeholder="+919876543210"
                      />
                    </div>
                  </div>
                ) : forgotPassStep === 2 ? (
                  <div className="space-y-4 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      6-Digit SMS Code
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      inputMode="numeric"
                      autoFocus
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full text-center tracking-[0.6em] text-3xl font-black bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-6 focus:bg-white focus:border-brand-500 transition-all outline-none"
                      placeholder="000000"
                    />
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Didn't receive it?{' '}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0}
                        className="inline-flex items-center gap-1 font-black text-brand-500 hover:underline disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <RefreshCw size={11} />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button
                  type="button"
                  className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
                  onClick={() => { setIsForgotPass(false); setForgotPassStep(1); setError(null); setSuccessMsg(''); }}
                >
                  ← Back to Login
                </button>
              </div>

              /* ── OTP Step ── */
            ) : isOtpStep ? (
              <div className="animate-in zoom-in-95 duration-300 space-y-6">

                {/* Phone icon */}
                <div className="flex justify-center">
                  <div className="bg-brand-50 p-5 rounded-3xl shadow-inner">
                    <Smartphone size={40} className="text-brand-500" />
                  </div>
                </div>

                {/* OTP input */}
                <div className="space-y-3 text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    6-Digit SMS Code
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    inputMode="numeric"
                    autoFocus
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full text-center tracking-[0.6em] text-3xl font-black bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-6 focus:bg-white focus:border-brand-500 transition-all outline-none"
                    placeholder="000000"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Didn't receive it?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      className="inline-flex items-center gap-1 font-black text-brand-500 hover:underline disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw size={11} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </p>
                </div>

                {/* Back */}
                <button
                  type="button"
                  className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => { setIsOtpStep(false); setOtpCode(''); setError(null); setSuccessMsg(''); }}
                >
                  ← Back to registration
                </button>
              </div>

            ) : (
              /* ── Login / Register ── */
              <div className="space-y-5 animate-in fade-in duration-200">

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold"
                    placeholder="health_user_01"
                  />
                </div>

                {/* Registration-only fields */}
                {!isLogin && (
                  <div className="space-y-5 animate-in slide-in-from-top-4 duration-300">

                    {/* Phone (required) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Mobile Number <span className="text-rose-500">*</span>
                        <span className="text-slate-300 font-normal normal-case ml-1">— OTP sent here</span>
                      </label>
                      <div className="relative">
                        <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          required={!isLogin}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold"
                          placeholder="+919876543210"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 px-1 font-semibold">Include country code, e.g. +91 for India</p>
                    </div>

                    {/* Email (optional) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Email
                        <span className="text-slate-300 font-normal normal-case ml-1">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    {isLogin && <button type="button" onClick={() => { setIsForgotPass(true); setError(null); setSuccessMsg(''); }} className="text-[10px] text-brand-500 font-bold hover:underline">Forgot?</button>}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold"
                    placeholder={isLogin ? '••••••••' : 'Min. 8 characters'}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 uppercase tracking-widest text-xs mt-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isForgotPass
                    ? (forgotPassStep === 1 ? 'Send OTP' : forgotPassStep === 2 ? 'Verify OTP' : 'Set New Password')
                    : isOtpStep
                      ? 'Verify Code'
                      : isLogin
                        ? 'Sign In'
                        : 'Register & Send OTP'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em]">
            {isLogin ? (
              <span className="text-slate-400">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(''); }}
                  className="text-brand-500 underline decoration-2 underline-offset-4"
                >
                  Create Account
                </button>
              </span>
            ) : (
              <span className="text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(null); setIsOtpStep(false); setSuccessMsg(''); }}
                  className="text-brand-500 underline decoration-2 underline-offset-4"
                >
                  Log In
                </button>
              </span>
            )}
          </div>

          <div id="recaptcha-container"></div>


        </div>
      </div>
    </div>
  );
};

export default LoginModal;