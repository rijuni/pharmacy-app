import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Eye, Check, X, Clock, ExternalLink } from 'lucide-react';
import api from '../api/axios';

const AdminPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState(null);
    const [filter, setFilter] = useState('pending'); // default to pending

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const response = await api.get('orders/prescriptions/');
            setPrescriptions(response.data);
        } catch (err) {
            console.error("Failed to fetch prescriptions", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id, status, isVerified) => {
        try {
            await api.patch(`orders/prescriptions/${id}/`, {
                status: status,
                is_verified: isVerified
            });
            fetchPrescriptions();
        } catch (err) {
            alert("Update failed");
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse">LOADING DASHBOARD...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center justify-between mb-10 bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <ShieldCheck size={36} className="text-brand-400" /> Pharmacist Panel
                    </h1>
                    <p className="text-emerald-100/70 mt-2 font-medium">Verify patient prescriptions and medical documents</p>
                </div>
                <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 opacity-10">
                    <ShieldCheck size={180} />
                </div>
            </div>

            <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl w-fit shadow-sm border border-slate-100">
                <button onClick={() => setFilter('pending')} className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${filter === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-slate-500 hover:bg-slate-50'}`}>Pending</button>
                <button onClick={() => setFilter('verified')} className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${filter === 'verified' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:bg-slate-50'}`}>Verified</button>
                <button onClick={() => setFilter('all')} className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${filter === 'all' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {prescriptions
                    .filter(px => filter === 'all' ? true : filter === 'pending' ? !px.is_verified : px.is_verified)
                    .map((px) => (
                    <div key={px.id} className={`glass-card rounded-[2rem] overflow-hidden border-2 transition-all p-6 ${px.is_verified ? 'border-emerald-100 shadow-emerald-100/50' : 'border-slate-100 shadow-slate-100/50'}`}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                                    <User className="text-slate-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{px.username}</h3>
                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Clock size={12} /> {new Date(px.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${px.is_verified ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                {px.status}
                            </div>
                        </div>

                        <div className="relative group rounded-2xl overflow-hidden cursor-zoom-in bg-slate-100 mb-6 border border-slate-200 h-48 md:h-64" onClick={() => setSelectedImg(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${px.image}`)}>
                            <img 
                                src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${px.image}`} 
                                alt="Prescription" 
                                className="w-full h-full object-contain p-2"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-black flex items-center gap-2 uppercase text-xs tracking-tighter">
                                    <Eye size={16} /> Click to View Full Size
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {!px.is_verified ? (
                                <>
                                    <button 
                                        onClick={() => handleVerify(px.id, 'Verified', true)}
                                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-500/30"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleVerify(px.id, 'Rejected', false)}
                                        className="flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-500 border-2 border-rose-100 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </>
                            ) : (
                                <div className="col-span-full flex items-center justify-center py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-black uppercase text-xs tracking-widest gap-2">
                                    <Check size={16} /> Already Verified
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {prescriptions.filter(px => filter === 'all' ? true : filter === 'pending' ? !px.is_verified : px.is_verified).length === 0 && (
                <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
                    <div className="text-7xl mb-6 grayscale opacity-30">📂</div>
                    <h3 className="text-2xl font-black text-slate-300 uppercase italic">No {filter !== 'all' ? filter : ''} prescriptions</h3>
                </div>
            )}

            {/* Lightbox */}
            {selectedImg && (
                <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-8 backdrop-blur-md" onClick={() => setSelectedImg(null)}>
                    <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
                        <X size={48} />
                    </button>
                    <img src={selectedImg} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                </div>
            )}
        </div>
    );
};

export default AdminPrescriptions;
