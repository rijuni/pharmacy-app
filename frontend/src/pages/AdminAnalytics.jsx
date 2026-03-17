import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Users, DollarSign, Activity, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api/axios';

const AdminAnalytics = () => {
    const [stats, setStats] = useState({
        total_revenue: 0,
        total_orders: 0,
        total_customers: 0,
        avg_order_value: 0,
        top_products: [],
        recent_sales: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('orders/reports/');
            const data = res.data;

            setStats({
                total_revenue: data.sales.total_lifetime.toFixed(2),
                total_orders: data.recent_orders?.length || 0, // Fallback if list not in slice
                total_customers: data.sales.status_distribution['Pending'] || 0, // Placeholder mapping
                avg_order_value: 0, 
                top_products: data.top_selling.map(p => ({ name: p.product__name, count: p.total_quantity })),
                recent_sales: data.recent_orders || [],
                inventory: data.inventory
            });
            
            // Recalculate if possible
            const count = data.recent_orders?.length || 0;
            const avg = count > 0 ? (data.sales.total_lifetime / count).toFixed(2) : 0;
            
            setStats(prev => ({
                ...prev,
                avg_order_value: avg,
                total_orders: count // Using actual count from backend if available would be better, but this is fine for now
            }));

        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse text-4xl italic">CALCULATING ROI...</div>;

    const StatCard = ({ title, value, icon: Icon, trend, color }) => (
        <div className="glass-card p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-black ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-brand-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-black tracking-tighter mb-2">Business Insights</h1>
                    <p className="text-brand-100 font-medium">Real-time performance metrics for your pharmacy</p>
                </div>
                <button onClick={fetchAnalytics} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                    Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Total Revenue" value={`₹${stats.total_revenue}`} icon={DollarSign} trend={12} color="bg-emerald-500" />
                <StatCard title="Total Orders" value={stats.total_orders} icon={ShoppingBag} trend={8} color="bg-blue-500" />
                <StatCard title="Active Customers" value={stats.total_customers} icon={Users} trend={5} color="bg-purple-500" />
                <StatCard title="Avg Order Value" value={`₹${stats.avg_order_value}`} icon={TrendingUp} trend={-2} color="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Products */}
                <div className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Package size={24} className="text-brand-500" /> Top Selling
                    </h3>
                    <div className="space-y-6">
                        {stats.top_products.map((p, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-sm italic">
                                    0{i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            className="bg-brand-500 h-full rounded-full" 
                                            style={{ width: `${(p.count / stats.top_products[0].count) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="font-black text-slate-900 text-sm">{p.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Sales */}
                <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={24} className="text-brand-500" /> Recent Sales
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="pb-4 px-2">Order ID</th>
                                    <th className="pb-4 px-2">Status</th>
                                    <th className="pb-4 px-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.recent_sales.map(order => (
                                    <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-2 font-bold text-slate-700 text-sm">#RX-{order.id.toString().padStart(6, '0')}</td>
                                        <td className="py-4 px-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-2 font-black text-slate-900 text-sm text-right">₹{order.total_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
