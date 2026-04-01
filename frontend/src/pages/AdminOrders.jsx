import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, XCircle, Clock, ExternalLink, Filter, Search, User } from 'lucide-react';
import api from '../api/axios';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('orders/orders/');
            setOrders(response.data.results || response.data || []);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.patch(`orders/orders/${id}/`, { status: newStatus });
            fetchOrders();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const filteredOrders = filter === 'All' 
        ? orders 
        : orders.filter(o => o.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'Processing': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'Shipped': return 'text-purple-600 bg-purple-50 border-purple-100';
            case 'Delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'Cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse">LOADING ORDERS...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <Package size={36} className="text-brand-400" /> Order Fulfillment
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Manage pharmacy deliveries and order lifecycles</p>
                </div>
                
                <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl relative z-10 backdrop-blur-md">
                    {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map(s => (
                        <button 
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-slate-300 hover:text-white'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="glass-card rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all group">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                            {/* Order Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">#RX-{order.id.toString().padStart(6, '0')}</span>
                                </div>

                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                                        <User className="text-slate-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">Customer Details</h3>
                                        <p className="text-xs text-slate-500 font-medium italic">{order.address_details}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Items</h4>
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">{item.quantity}x {item.product.name}</span>
                                            <span className="text-slate-400">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-brand-600 font-black">
                                        <span>Total Revenue</span>
                                        <span>₹{order.total_price}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="md:w-64 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Update Pipeline</h4>
                                
                                {order.status === 'Pending' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, 'Processing')}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Mark Processing
                                    </button>
                                )}
                                
                                {['Pending', 'Processing'].includes(order.status) && (
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, 'Shipped')}
                                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        Handover to Courier
                                    </button>
                                )}
                                
                                {order.status === 'Shipped' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        Mark Delivered
                                    </button>
                                )}

                                {['Pending', 'Processing'].includes(order.status) && (
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, 'Cancelled')}
                                        className="w-full bg-white hover:bg-rose-50 text-rose-500 border-2 border-rose-100 font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all"
                                    >
                                        Cancel Order
                                    </button>
                                )}

                                <div className="mt-4 text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${order.payment_status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                    Payment: {order.payment_status.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
                        <div className="text-7xl mb-6 grayscale opacity-30">📦</div>
                        <h3 className="text-2xl font-black text-slate-300 uppercase italic">No orders in this category</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
