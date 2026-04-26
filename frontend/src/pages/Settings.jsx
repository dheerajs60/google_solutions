import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import clsx from 'clsx';

export const Settings = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState(true);
    const [auditAutoSave, setAuditAutoSave] = useState(true);
    const [theme, setTheme] = useState('light');

    const sections = [
        {
            title: 'Profile Settings',
            icon: 'person',
            description: 'Manage your account information and preferences',
            fields: [
                { label: 'Display Name', value: user?.displayName || 'User', type: 'text' },
                { label: 'Email Address', value: user?.email || 'user@example.com', type: 'email', disabled: true }
            ]
        },
        {
            title: 'Audit Preferences',
            icon: 'shield_with_heart',
            description: 'Configure default behavior for fairness audits',
            fields: [
                { label: 'Auto-save results to BigQuery', value: auditAutoSave, type: 'toggle', onChange: () => setAuditAutoSave(!auditAutoSave) },
                { label: 'Enable AI Forensic Reports by default', value: true, type: 'toggle', disabled: true }
            ]
        },
        {
            title: 'Platform Config',
            icon: 'settings_suggest',
            description: 'Global application monitoring and security',
            fields: [
                { label: 'Email Notifications', value: notifications, type: 'toggle', onChange: () => setNotifications(!notifications) },
                { label: 'Interface Theme', value: theme, type: 'select', options: ['Light', 'Dark', 'System'], onChange: (e) => setTheme(e.target.value.toLowerCase()) }
            ]
        }
    ];

    return (
        <div className="flex flex-col gap-10 w-full animate-in fade-in py-10 pb-12">
            <div className="flex items-end justify-between border-b border-outline-variant/10 pb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-on-surface mb-2">Protocol Settings</h1>
                    <p className="text-on-surface-variant text-sm max-w-lg leading-relaxed">
                        Configure your auditing environment, security protocols, and integration preferences for the FairLens platform.
                    </p>
                </div>
                
                <button className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-4">
                    <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-3xl">verified_user</span>
                            </div>
                            <h3 className="text-xl font-bold mb-1">{user?.displayName || 'Lead Auditor'}</h3>
                            <p className="text-white/50 text-xs font-medium mb-6">{user?.email}</p>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg w-fit">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Active Session</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700">shield</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">System Health</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-on-surface-variant">Firestore Sync</span>
                                <span className="text-emerald-600">ONLINE</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-on-surface-variant">BigQuery Pipeline</span>
                                <span className="text-emerald-600">CONNECTED</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-on-surface-variant">Gemini 1.5 Pro</span>
                                <span className="text-emerald-600">STANDBY</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-10">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-on-surface">{section.title}</h3>
                                    <p className="text-on-surface-variant text-xs">{section.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                                {section.fields.map((field, fIdx) => (
                                    <div key={fIdx} className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">
                                            {field.label}
                                        </label>
                                        {field.type === 'toggle' ? (
                                            <button 
                                                onClick={field.onChange}
                                                disabled={field.disabled}
                                                className={clsx(
                                                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                                                    field.value ? "bg-primary/5 border-primary/20" : "bg-white border-outline-variant/10",
                                                    field.disabled && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <span className="text-xs font-bold text-on-surface">Enable Feature</span>
                                                <div className={clsx(
                                                    "w-10 h-5 rounded-full relative transition-colors",
                                                    field.value ? "bg-primary" : "bg-slate-200"
                                                )}>
                                                    <div className={clsx(
                                                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                        field.value ? "left-6" : "left-1"
                                                    )}></div>
                                                </div>
                                            </button>
                                        ) : field.type === 'select' ? (
                                            <select 
                                                className="w-full p-4 bg-white border border-outline-variant/10 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                onChange={field.onChange}
                                                value={field.value}
                                            >
                                                {field.options.map(opt => <option key={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type={field.type}
                                                defaultValue={field.value}
                                                disabled={field.disabled}
                                                className="w-full p-4 bg-white border border-outline-variant/10 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all disabled:bg-slate-50 disabled:text-on-surface-variant/50"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
