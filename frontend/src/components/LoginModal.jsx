import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, closeAuthModal } from '../store/authSlice';
import api from '../api/axios';
import { ShieldCheck, CheckCircle, X, Smartphone, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const LoginModal = () => {
  const { isAuthModalOpen } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const recaptchaRef = useRef(null);

  const [isLogin, setIsLogin] = useState(true);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize ReCAPTCHA
  useEffect(() => {
    if (isAuthModalOpen && !isLogin && !isOtpStep) {
      // Small delay to ensure the DOM element exists if visible
      setTimeout(() => {
        if (!window.recaptchaVerifier && document.getElementById('recaptcha-container')) {
           window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
               // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
          });
        }
      }, 500);
    }
    return () => {
       if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
       }
    };
  }, [isAuthModalOpen, isLogin, isOtpStep]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        const response = await api.post('users/login/', { username, password });
        
        const userResponse = await api.get('users/profile/', {
          headers: { Authorization: `Bearer ${response.data.access}` }
        });

        dispatch(loginSuccess({
          user: userResponse.data,
          token: response.data.access
        }));
        dispatch(closeAuthModal());
      } else {
        if (isOtpStep) {
          // Verify OTP Flow (Still here if user manually enters this state, but normally bypassed)
          await api.post('users/verify-otp/', { 
            username, 
            otp_code: otpCode 
          });
          setSuccessMsg("Mobile verified successfully! You can now log in.");
          setIsOtpStep(false);
          setIsLogin(true);
          setPassword('');
        } else {
          // Registration Flow
          await api.post('users/register/', { 
             username, 
             password, 
             email, 
             phone_number: phone 
          });
          
          // BYPASSED for development:
          // const appVerifier = window.recaptchaVerifier;
          // const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
          // setConfirmationResult(confirmation);
          
          setSuccessMsg("Account created with Auto-Verification (Dev)! Please log in.");
          setIsLogin(true);
          setPassword('');
          // setIsOtpStep(true); 
        }
      }
    } catch (err) {
       console.error("Auth Error:", err);
       if (err.response && err.response.data) {
          const firstKey = Object.keys(err.response.data)[0];
          const errItem = err.response.data[firstKey];
          setError(Array.isArray(errItem) ? errItem[0] : (err.response.data.detail || "Verification failed"));
       } else if (err.code === 'auth/invalid-phone-number') {
          setError("Invalid phone number format (use +91XXXXXXXXXX)");
       } else {
          setError(isLogin ? "Invalid credentials. Please try again." : (err.message || "Action failed"));
       }
    } finally {
       setIsLoading(false);
    }
  };

  const closeModal = () => {
     dispatch(closeAuthModal());
     setIsOtpStep(false);
     setIsLogin(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal}></div>
       
       <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <button onClick={closeModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors z-10">
             <X size={20} />
          </button>

          <div className="p-10 pb-8 bg-brand-50 border-b border-brand-100/50 italic">
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                {isOtpStep ? "Real Verification" : isLogin ? "Welcome Back" : "Clinical Signup"}
             </h2>
             <p className="text-sm text-slate-500 font-medium mt-1">
                {isOtpStep ? "Firebase SMS sent." : isLogin ? "Secure access to health data." : "Verify your mobile to start shopping."}
             </p>
          </div>

          <div className="p-10 pt-8">
             {error && (
                <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest border border-rose-100 flex items-start gap-3">
                   <ShieldCheck size={18} className="text-rose-500 shrink-0"/>
                   {error}
                </div>
             )}
             
             {successMsg && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-start gap-3">
                   <CheckCircle size={18} className="text-emerald-500 shrink-0"/>
                   {successMsg}
                </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-6">
                <div id="recaptcha-container"></div>
                {!isOtpStep ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Username</label>
                      <input 
                        type="text" 
                        value={username} onChange={(e) => setUsername(e.target.value)} required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold" 
                        placeholder="health_user_01" 
                      />
                    </div>
                    
                    {!isLogin && (
                      <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number (with +91) <span className="text-rose-500 font-bold">*</span></label>
                            <input 
                              type="tel" 
                              value={phone} onChange={(e) => setPhone(e.target.value)} required={!isLogin}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold" 
                              placeholder="+919876543210" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email <span className="text-slate-300 font-normal lowercase">(optional)</span></label>
                            <input 
                              type="email" 
                              value={email} onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold" 
                              placeholder="dr.smith@clinic.com" 
                            />
                         </div>
                      </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                       <input 
                         type="password" 
                         value={password} onChange={(e) => setPassword(e.target.value)} required
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-500 transition-all outline-none text-sm font-bold" 
                         placeholder={isLogin ? "••••••••" : "Min. 8 characters"} 
                       />
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-center mb-4 text-slate-300">
                      <Smartphone size={48} />
                    </div>
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firebase SMS OTP</label>
                      <input 
                        type="text" 
                        maxLength="6"
                        value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required
                        className="w-full text-center tracking-[0.5em] text-3xl font-black bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-6 focus:bg-white focus:border-brand-500 transition-all outline-none" 
                        placeholder="000000" 
                      />
                    </div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                >
                  {isLoading ? (
                     <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                     <>{isOtpStep ? "Confirm Real SMS" : isLogin ? "Initiate Session" : "Verify & Create"} <ArrowRight size={16}/></>
                  )}
                </button>
             </form>

             <div className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em]">
                {isLogin ? (
                   <span className="text-slate-400">
                      Join HealthMeds <button type="button" onClick={() => {setIsLogin(false); setError(null);}} className="text-brand-500 underline decoration-2 underline-offset-4">Register</button>
                   </span>
                ) : (
                   <span className="text-slate-400">
                      Already Verified? <button type="button" onClick={() => {setIsLogin(true); setError(null); setIsOtpStep(false);}} className="text-brand-500 underline decoration-2 underline-offset-4">Log In</button>
                   </span>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default LoginModal;

