import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Truck, ShieldCheck, Mail } from 'lucide-react';

const OrderSuccess = () => {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4">
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full -mr-48 -mt-48 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-50 rounded-full -ml-48 -mb-48 blur-3xl opacity-50"></div>
                
                <div className="relative z-10 p-12 md:p-20 text-center flex flex-col items-center">
                    <div className="relative mb-10">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                        <div className="bg-emerald-500 text-white p-8 rounded-full shadow-2xl shadow-emerald-500/40 relative">
                            <CheckCircle size={64} strokeWidth={3} />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 italic leading-none">
                        ORDER SECURED. <br/> <span className="text-emerald-500">HEALTH RESTORED.</span>
                    </h1>
                    
                    <p className="text-slate-500 text-xl font-medium max-w-lg mx-auto mb-12 leading-relaxed italic">
                        Your clinical request has been successfully validated. <br/> 
                        Our pharmacists are currently preparing your prescription with precision.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all">
                            <Package className="text-emerald-600 mb-4 mx-auto group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">State</h4>
                            <p className="font-black text-slate-800 uppercase tracking-tighter text-sm italic">Processing</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all">
                            <Truck className="text-emerald-600 mb-4 mx-auto group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transit</h4>
                            <p className="font-black text-slate-800 uppercase tracking-tighter text-sm italic">ETA 24-48h</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all">
                            <Mail className="text-emerald-600 mb-4 mx-auto group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notices</h4>
                            <p className="font-black text-slate-800 uppercase tracking-tighter text-sm italic">Email Sent</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link to="/orders" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2">
                            Trace My Meds <ArrowRight size={18} />
                        </Link>
                        <Link to="/medicines" className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            Return to Clinic
                        </Link>
                    </div>
                    
                    <div className="mt-16 flex items-center justify-center gap-2 text-slate-300">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Genuineness Verified by HealthMeds Labs</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
