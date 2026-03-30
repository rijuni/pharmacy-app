import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, ClipboardList, Activity, Package, ListTree, UserCog } from 'lucide-react';

const AdminLayout = ({ children }) => {
    const navItems = [
        { path: '/admin/prescriptions', name: 'Prescriptions', icon: ShieldCheck },
        { path: '/admin/orders', name: 'Orders', icon: ClipboardList },
        { path: '/admin/inventory', name: 'Inventory', icon: Package },
        { path: '/admin/categories', name: 'Categories', icon: ListTree },
        { path: '/admin/analytics', name: 'Analytics', icon: Activity },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 min-h-[70vh]">
            <aside className="w-full md:w-64 shrink-0 glass-card p-4 rounded-3xl border border-slate-100 self-start sticky top-24">
                <div className="flex items-center gap-3 mb-6 p-2">
                    <UserCog className="text-emerald-600" size={28} />
                    <h2 className="font-black text-slate-800 uppercase tracking-tight text-lg">Admin Panel</h2>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-widest ${
                                    isActive 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                }`
                            }
                        >
                            <item.icon size={18} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 overflow-x-hidden p-1">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
