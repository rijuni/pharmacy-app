import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, MapPin, ChevronLeft, CreditCard } from 'lucide-react';
import api from '../api/axios';

const OrderTracking = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`orders/orders/${id}/`);
                setOrder(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest">Locating Package...</div>;
    if (!order) return <div className="p-20 text-center text-rose-500 font-bold">Order not found.</div>;

    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(order.status);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Link to="/profile" className="flex items-center gap-2 text-slate-400 hover:text-brand-500 mb-8 font-bold transition-colors">
                <ChevronLeft size={20} /> Back to Profile
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-slate-900 p-10 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Real-time Tracking</span>
                            <h1 className="text-4xl font-black tracking-tighter">Order #{order.id}</h1>
                            <p className="text-slate-400 text-sm mt-1">Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Current Status</span>
                            <span className="text-xl font-black text-brand-400 tracking-tight">{order.status}</span>
                        </div>
                    </div>
                </div>

                <div className="p-10">
                    {/* Stepper */}
                    <div className="relative flex justify-between items-center mb-20 px-4">
                        {/* Progress Line */}
                        <div className="absolute h-1 bg-slate-100 top-1/2 -translate-y-1/2 left-10 right-10 -z-0">
                            <div 
                                className="h-full bg-brand-500 transition-all duration-1000"
                                style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
                            ></div>
                        </div>

                        {statuses.map((s, i) => (
                            <div key={s} className="relative z-10 flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                                    i <= currentStatusIndex 
                                    ? 'bg-brand-500 border-brand-100 text-white shadow-lg shadow-brand-500/30' 
                                    : 'bg-white border-slate-100 text-slate-300'
                                }`}>
                                    {i < currentStatusIndex ? <CheckCircle size={20} /> :
                                     s === 'Shipped' ? <Truck size={20} /> :
                                     s === 'Delivered' ? <Package size={20} /> :
                                     s === 'Processing' ? <Clock size={20} /> :
                                     <Clock size={20} />}
                                </div>
                                <span className={`absolute top-full mt-4 font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${
                                    i <= currentStatusIndex ? 'text-slate-900' : 'text-slate-300'
                                }`}>
                                    {s}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Order Details */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package size={14} /> Item Summary
                                </h3>
                                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl">
                                    {order.items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <span className="font-black text-brand-500 text-xs">{item.quantity}x</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{item.product.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.product.category_name}</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-slate-900 text-sm">₹{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                        <span className="font-black text-slate-900 uppercase tracking-tight">Total Amount</span>
                                        <span className="text-2xl font-black text-brand-600 tracking-tighter italic">₹{order.total_price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping & Payment */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MapPin size={14} /> Shipping To
                                </h3>
                                <div className="bg-slate-50 p-6 rounded-3xl">
                                    {order.address ? (
                                        <>
                                            <p className="font-black text-slate-900 text-sm mb-1">{order.address.street}</p>
                                            <p className="text-xs text-slate-500 font-medium">{order.address.city}, {order.address.state} - {order.address.zip_code}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-rose-500 font-bold italic">Address details unavailable.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <CreditCard size={14} /> Payment Information
                                </h3>
                                <div className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{order.payment_method}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.payment_status}</p>
                                    </div>
                                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                        order.payment_status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {order.payment_status === 'completed' ? 'Paid' : 'Payment Pending'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
