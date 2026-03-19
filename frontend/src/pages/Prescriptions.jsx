import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, FileText, Clock, AlertTriangle, ShieldCheck, User, Calendar, Trash2, Plus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { openAuthModal } from '../store/authSlice';

const Prescriptions = () => {
   const [selectedFile, setSelectedFile] = useState(null);
   const [preview, setPreview] = useState(null);
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);
   const [prescriptions, setPrescriptions] = useState([]);
   const [fetching, setFetching] = useState(true);
   const [showUpload, setShowUpload] = useState(false);
   
   const { isAuthenticated } = useSelector(state => state.auth);
   const navigate = useNavigate();
   const dispatch = useDispatch();

   useEffect(() => {
      if (!isAuthenticated) {
         dispatch(openAuthModal());
         return;
      }
      fetchPrescriptions();
   }, [isAuthenticated]);

   const fetchPrescriptions = async () => {
      try {
         const res = await api.get('orders/prescriptions/');
         setPrescriptions(res.data);
      } catch (err) {
         console.error(err);
      } finally {
         setFetching(false);
      }
   };

   const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         setSelectedFile(file);
         
         const reader = new FileReader();
         reader.onloadend = () => {
            setPreview(reader.result);
         };
         reader.readAsDataURL(file);
      }
   };

   const handleUpload = async () => {
      if (!selectedFile) return;
      
      setLoading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      try {
         await api.post('orders/prescriptions/', formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            }
         });
         setSuccess(true);
         setTimeout(() => {
            setSuccess(false);
            setShowUpload(false);
            setSelectedFile(null);
            setPreview(null);
            fetchPrescriptions();
         }, 2000);
      } catch (err) {
         console.error("Upload failed", err);
      } finally {
         setLoading(false);
      }
   };

   const getStatusStyle = (status) => {
      switch(status) {
         case 'Verified': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
         case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
         case 'Expired': return 'bg-slate-50 text-slate-400 border-slate-100';
         default: return 'bg-amber-50 text-amber-600 border-amber-100';
      }
   };

   if (!isAuthenticated) return (
      <div className="text-center py-20">
         <ShieldCheck size={64} className="mx-auto text-slate-200 mb-6" />
         <h2 className="text-2xl font-black text-slate-900 mb-2">CLINICAL ACCESS RESTRICTED</h2>
         <p className="text-slate-500 mb-8 font-medium italic">Please authenticate to manage your medical records.</p>
         <button onClick={() => dispatch(openAuthModal())} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all transform hover:-translate-y-1">Initialize Session</button>
      </div>
   );

   return (
      <div className="max-w-5xl mx-auto pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">PRESCRIPTION <span className="text-brand-500">VAULT</span></h1>
               <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-500" /> SECURE MEDICAL RECORD STORAGE
               </p>
            </div>
            {!showUpload && (
               <button 
                  onClick={() => setShowUpload(true)}
                  className="bg-brand-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all transform hover:-translate-y-1 active:scale-95"
               >
                  <Plus size={18} /> Digitally File New script
               </button>
            )}
         </div>

         {showUpload && (
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 mb-12 relative animate-in slide-in-from-top duration-500">
               <button onClick={() => setShowUpload(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                  <Trash2 size={24} />
               </button>
               
               <div className="max-w-xl mx-auto">
                  <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                     <UploadCloud size={28} className="text-brand-500" /> Upload Document
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mb-8 italic">Securely transmit your doctor's authorization for clinical review.</p>
                  
                  {!success ? (
                     <div className="space-y-6">
                        <label className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-50/30 hover:border-brand-100 transition-all relative overflow-hidden group min-h-[300px]">
                           <input type="file" className="hidden" accept="image/*, .pdf" onChange={handleFileChange} />
                           
                           {preview ? (
                              <div className="absolute inset-0 w-full h-full p-4">
                                 <img src={preview} alt="Prescription preview" className="w-full h-full object-contain rounded-2xl drop-shadow-2xl" />
                                 <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm rounded-2xl">
                                    <span className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 bg-slate-900/80 px-6 py-3 rounded-full border border-white/20">
                                       <UploadCloud size={18}/> Replace Document
                                    </span>
                                 </div>
                              </div>
                           ) : (
                              <div className="text-center">
                                 <div className="bg-brand-50 p-6 rounded-3xl text-brand-500 mb-6 mx-auto w-fit shadow-inner">
                                    <UploadCloud size={48} />
                                 </div>
                                 <span className="font-black text-slate-900 text-lg block mb-2 tracking-tight">DROP CLINICAL RECORD</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supports JPEGs, PNGs up to 10MB</span>
                              </div>
                           )}
                        </label>
                        
                        <button 
                           disabled={!selectedFile || loading}
                           onClick={handleUpload}
                           className={`w-full py-5 rounded-2xl font-black shadow-2xl transition-all text-white uppercase tracking-widest text-sm transform active:scale-95 ${!selectedFile || loading ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-black shadow-slate-200'}`}
                        >
                           {loading ? 'Transmitting Data...' : 'Submit to Pharmacist'}
                        </button>

                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex gap-4">
                           <AlertTriangle size={24} className="text-blue-500 shrink-0" />
                           <div className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-relaxed">
                              Regulatory Compliance: Ensure the doctor's name, signature, and registration number are visible. Prescription date must be within valid limits.
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="py-20 flex flex-col items-center text-center">
                        <div className="bg-emerald-50 p-6 rounded-full border border-emerald-100 text-emerald-500 mb-6 shadow-xl shadow-emerald-500/20">
                           <CheckCircle size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight italic">TRANSMISSION SUCCESSFUL</h3>
                        <p className="text-slate-500 font-medium italic">Our board-certified pharmacists are initializing the review process.</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fetching ? (
               [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-xl animate-pulse h-64">
                     <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-6"></div>
                     <div className="h-4 bg-slate-100 rounded w-3/4 mb-4"></div>
                     <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </div>
               ))
            ) : prescriptions.length > 0 ? (
               prescriptions.map(px => (
                  <div key={px.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-brand-500/10 transition-all hover:-translate-y-1 group">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${getStatusStyle(px.status)}`}>
                           <FileText size={24} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusStyle(px.status)}`}>
                           {px.status}
                        </span>
                     </div>
                     
                     <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4 uppercase">
                        {px.doctor_name || 'Generic Authorization'}
                     </h3>

                     <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <Calendar size={14} className="text-brand-500" /> Filed: {new Date(px.created_at).toLocaleDateString()}
                        </div>
                        {px.expiry_date && (
                           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <Clock size={14} className="text-rose-400" /> Expires: {new Date(px.expiry_date).toLocaleDateString()}
                           </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <User size={14} className="text-brand-500" /> Ref: HMS-PX-{px.id}
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={px.image} target="_blank" rel="noreferrer" className="text-brand-600 font-black uppercase text-[10px] tracking-widest hover:text-brand-700">View Document</a>
                        {px.is_recurring && (
                           <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">Chronic/Recurring</span>
                        )}
                     </div>
                  </div>
               ))
            ) : (
               <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="bg-white p-6 rounded-full w-fit mx-auto shadow-xl shadow-slate-200/50 text-slate-300 mb-6">
                     <FileText size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-400 tracking-tight italic">NO CLINICAL RECORDS FOUND</h3>
                  <p className="text-slate-400 text-sm font-medium mt-2">Your medical folder is currently empty.</p>
                  <button onClick={() => setShowUpload(true)} className="mt-8 text-brand-500 font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 mx-auto hover:gap-4 transition-all">
                     Initialize vault <Plus size={16} />
                  </button>
               </div>
            )}
         </div>
      </div>
   );
};

export default Prescriptions;

