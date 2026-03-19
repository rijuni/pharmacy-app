import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Users, DollarSign, Activity, Package, ArrowUpRight, ArrowDownRight, Download, PieChart as PieIcon, BarChart as BarIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import api from '../api/axios';

const AdminAnalytics = () => {
    const [stats, setStats] = useState({
        total_revenue: 0,
        today_revenue: 0,
        total_orders: 0,
        total_customers: 0,
        avg_order_value: 0,
        top_products: [],
        inventory: {
            total_items: 0,
            low_stock_count: 0,
            out_of_stock_count: 0
        },
        status_distribution: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('orders/reports/');
            const data = res.data;

            // Prepare status distribution for PieChart
            const statusData = Object.keys(data.sales.status_distribution).map(key => ({
                name: key,
                value: data.sales.status_distribution[key]
            }));

            setStats({
                total_revenue: data.sales.total_lifetime,
                today_revenue: data.sales.today,
                total_orders: Object.values(data.sales.status_distribution).reduce((a, b) => a + b, 0),
                total_customers: data.sales.status_distribution['Pending'] || 0, // Simplified
                avg_order_value: (data.sales.total_lifetime / (Object.values(data.sales.status_distribution).reduce((a, b) => a + b, 0) || 1)).toFixed(2),
                top_products: data.top_selling.map(p => ({ 
                    name: p.product__name, 
                    quantity: p.total_quantity,
                    revenue: p.total_revenue
                })),
                inventory: data.inventory,
                status_distribution: statusData
            });

        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportInventory = async () => {
        try {
            const response = await api.get('orders/reports/export-inventory/', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventory_report.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export inventory", err);
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse text-4xl italic">CALCULATING ROI...</div>;

    const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

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
                    <p className="text-brand-100 font-medium">Pharmacy Performance Dashboard</p>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={handleExportInventory} className="bg-white text-brand-600 hover:bg-brand-50 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2">
                        <Download size={16} /> Export CSV
                    </button>
                    <button onClick={fetchAnalytics} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Lifetime Sales" value={`₹${stats.total_revenue.toLocaleString()}`} icon={DollarSign} trend={12} color="bg-emerald-500" />
                <StatCard title="Today's Sales" value={`₹${stats.today_revenue.toLocaleString()}`} icon={Activity} trend={8} color="bg-blue-500" />
                <StatCard title="Total Orders" value={stats.total_orders} icon={ShoppingBag} trend={5} color="bg-purple-500" />
                <StatCard title="Avg Order Value" value={`₹${stats.avg_order_value}`} icon={TrendingUp} trend={-2} color="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Sales Performance Chart */}
                <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 min-h-[400px]">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                        <BarIcon size={24} className="text-brand-500" /> Top Products Revenue
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.top_products}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#F1F5F9' }}
                                />
                                <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                                    {stats.top_products.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 min-h-[400px]">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                        <PieIcon size={24} className="text-brand-500" /> Order Status Distribution
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.status_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.status_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {stats.status_distribution.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inventory Health */}
                <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 h-full">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                        <Package size={24} className="text-brand-500" /> Inventory Health
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Products</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.inventory.total_items}</p>
                            </div>
                            <Package size={32} className="text-slate-200" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Low Stock</p>
                                <p className="text-2xl font-black text-amber-700 tracking-tighter">{stats.inventory.low_stock_count}</p>
                            </div>
                            <ArrowDownRight size={32} className="text-amber-200" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <div>
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Out of Stock</p>
                                <p className="text-2xl font-black text-rose-700 tracking-tighter">{stats.inventory.out_of_stock_count}</p>
                            </div>
                            <Activity size={32} className="text-rose-200" />
                        </div>
                    </div>
                </div>

                {/* Top Selling Table */}
                <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                        <TrendingUp size={24} className="text-brand-500" /> Top Selling Medications
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="pb-4 px-2">Medicine Name</th>
                                    <th className="pb-4 px-2 text-center">Qty Sold</th>
                                    <th className="pb-4 px-2 text-right">Revenue (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.top_products.map((p, i) => (
                                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-2 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-black italic">
                                                #{i+1}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                                        </td>
                                        <td className="py-4 px-2 text-center font-black text-slate-500 text-sm">{p.quantity}</td>
                                        <td className="py-4 px-2 font-black text-slate-900 text-sm text-right">₹{p.revenue.toLocaleString()}</td>
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
