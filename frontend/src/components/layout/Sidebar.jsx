import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

export const Sidebar = () => {
    const navItems = [
        { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { path: '/heatmap', icon: 'grid_view', label: 'Bias Heatmap' },
        { path: '/mitigation', icon: 'science', label: 'Mitigation Lab' },
        { path: '/report', icon: 'description', label: 'Compliance Report' },
        { path: '/history', icon: 'history', label: 'Audit History' }
    ];

    return (
        <aside className="h-screen w-64 flex flex-col p-4 space-y-2 bg-slate-50 border-r border-slate-200 z-50 shrink-0">
            <div className="mb-10 px-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-[20px]">troubleshoot</span>
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tighter">FairLens</span>
            </div>
            
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center px-3 py-2 space-x-3 text-sm font-medium transition-all duration-200 ease-in-out rounded-lg",
                            isActive 
                                ? "bg-white text-primary shadow-sm" 
                                : "text-on-surface-variant hover:bg-slate-200/50"
                        )}
                    >
                        <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            
            <div className="pt-4 border-t border-outline-variant/20 space-y-1">
                <button className="flex items-center w-full px-3 py-2 space-x-3 text-sm font-medium text-on-surface-variant hover:bg-slate-200/50 transition-all duration-200 ease-in-out rounded-lg">
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    );
};
