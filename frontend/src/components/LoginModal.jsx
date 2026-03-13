import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, closeAuthModal } from '../store/authSlice';
import api from '../api/axios';
import { ShieldCheck, CheckCircle, X } from 'lucide-react';

const LoginModal = () => {
  const { isAuthModalOpen } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        // Reducer handles closeAuthModal on success, but just to be safe:
        dispatch(closeAuthModal());
      } else {
        // Registration Flow
        await api.post('users/register/', { 
           username, 
           password, 
           email, 
           phone_number: phone 
        });
        
        setSuccessMsg("Account created successfully! Please log in.");
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
       if (err.response && err.response.data) {
          const firstKey = Object.keys(err.response.data)[0];
          const errItem = err.response.data[firstKey];
          setError(Array.isArray(errItem) ? errItem[0] : "An error occurred");
       } else {
          setError(isLogin ? "Invalid credentials. Please try again." : "Registration failed. Try a different username/email.");
       }
    } finally {
       setIsLoading(false);
    }
  };

  const closeModal = () => {
     dispatch(closeAuthModal());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       {/* Background Backdrop */}
       <div 
         className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
         onClick={closeModal}
       ></div>
       
       {/* Modal Content */}
       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <button 
             onClick={closeModal}
             className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors z-10"
          >
             <X size={20} />
          </button>

          <div className="p-8 pb-6 bg-brand-50 border-b border-brand-100/50">
             <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                {isLogin ? "Welcome Back" : "Create Account"}
             </h2>
             <p className="text-sm text-gray-500">
                {isLogin ? "Sign in to access your orders and prescriptions." : "Join us for fast delivery and genuine medicines."}
             </p>
          </div>

          <div className="p-8 pt-6">
             {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-start gap-2">
                   <ShieldCheck size={16} className="text-red-500 mt-0.5 flex-shrink-0"/>
                   {error}
                </div>
             )}
             
             {successMsg && (
                <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-6 text-sm font-medium border border-green-100 flex items-start gap-2">
                   <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0"/>
                   {successMsg}
                </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Username</label>
                   <input 
                     type="text" 
                     value={username} onChange={(e) => setUsername(e.target.value)} required
                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-sm" 
                     placeholder="johndoe123" 
                   />
                </div>
                
                <div className={`grid transition-all duration-300 ease-in-out ${!isLogin ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0px] opacity-0 overflow-hidden'}`}>
                   <div className="space-y-4">
                      <div className="space-y-1 pt-1">
                         <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email</label>
                         <input 
                           type="email" 
                           value={email} onChange={(e) => setEmail(e.target.value)} required={!isLogin}
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-sm" 
                           placeholder="john@example.com" 
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Phone Number <span className="text-gray-400 font-normal lowercase">(optional)</span></label>
                         <input 
                           type="tel" 
                           value={phone} onChange={(e) => setPhone(e.target.value)}
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-sm" 
                           placeholder="+91 98765 43210" 
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Password</label>
                   <input 
                     type="password" 
                     value={password} onChange={(e) => setPassword(e.target.value)} required
                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-sm" 
                     placeholder={isLogin ? "••••••••" : "Create password"} 
                   />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all flex justify-center mt-2 shadow-sm"
                >
                  {isLoading ? (
                     <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                     isLogin ? "Sign In" : "Register Account"
                  )}
                </button>
             </form>

             <div className="mt-6 text-center text-sm">
                {isLogin ? (
                   <span className="text-gray-600">
                      New to HealthMeds? <button type="button" onClick={() => {setIsLogin(false); setError(null);}} className="text-brand-600 font-bold hover:underline">Sign up</button>
                   </span>
                ) : (
                   <span className="text-gray-600">
                      Already have an account? <button type="button" onClick={() => {setIsLogin(true); setError(null);}} className="text-brand-600 font-bold hover:underline">Log In</button>
                   </span>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default LoginModal;
