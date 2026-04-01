import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, MapPin, Calendar, ReceiptText } from 'lucide-react';
import api from '../api/axios';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchOrders();
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Clock className="text-amber-500" size={18} />;
            case 'Processing': return <Package className="text-blue-500" size={18} />;
            case 'Shipped': return <Truck className="text-purple-500" size={18} />;
            case 'Delivered': return <CheckCircle className="text-emerald-500" size={18} />;
            case 'Cancelled': return <XCircle className="text-rose-500" size={18} />;
            default: return <Clock size={14} />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Shipped': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="animate-pulse space-y-6">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="h-48 bg-slate-100 rounded-3xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Orders</h1>
                    <p className="text-slate-500 mt-2">Track and manage your recent pharmacy purchases</p>
                </div>
                <div className="bg-brand-50 p-4 rounded-2xl">
                    <ReceiptText className="text-brand-600" size={32} />
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-[3rem] border-dashed border-2 border-slate-200">
                    <div className="text-6xl mb-6">📦</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No orders yet</h3>
                    <p className="text-slate-400">Your purchase history will appear here once you place an order.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="glass-card rounded-4xl overflow-hidden border border-slate-100 hover:shadow-xl transition-shadow">
                            {/* Order Header */}
                            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order ID</p>
                                        <p className="text-sm font-bold text-slate-900">#RX-{order.id.toString().padStart(6, '0')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                        <div className="flex items-center gap-1 text-sm font-bold text-slate-700">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                        <p className="text-sm font-black text-brand-600">₹{order.total_price}</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${getStatusClass(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                </div>
                            </div>

                            {/* Order Content */}
                            <div className="p-6">
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Items List */}
                                    <div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Meds & Items</h4>
                                        <div className="space-y-3">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                                                        {item.product.image ? <img src={item.product.image} className="w-full h-full object-cover" /> : '💊'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                                                        <p className="text-[10px] text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Delivery Info */}
                                    <div className="bg-slate-50/50 rounded-2xl p-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                            <MapPin size={12} /> Delivery Address
                                        </h4>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            {order.address_details}
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                                            <p className="text-sm font-bold text-slate-700 uppercase">{order.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Card Payment'}</p>
                                            <p className={`text-[10px] mt-1 font-bold ${order.payment_status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                Status: {order.payment_status.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
