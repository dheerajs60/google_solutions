import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useUploadStore } from '../../store/useUploadStore';

export const Topbar = () => {
    const { file } = useUploadStore();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Focused onboarding flow: hide sidebar on upload and selection screens
    const isFocusedFlow = ['/upload', '/attribute-selection', '/'].includes(location.pathname);

    return (
        <header className={`sticky top-0 h-16 px-8 flex items-center justify-between z-40 transition-colors duration-300 ${isFocusedFlow ? 'bg-slate-50/80 backdrop-blur-xl dark:bg-slate-950/80' : 'bg-white border-b border-outline-variant/10 dark:bg-slate-900 dark:border-slate-800'}`}>
            <div className="flex items-center space-x-6">
                {!isFocusedFlow ? (
                    <>
                        <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 space-x-2 dark:text-slate-500">
                             <Link to="/" className="hover:text-slate-900 transition-colors dark:hover:text-white">FairLens</Link>
                             <span className="text-slate-200 dark:text-slate-700">/</span>
                             <span className="text-slate-900 dark:text-slate-200"> {location.pathname.split('/').pop() || 'Dashboard'}</span>
                        </div>
                        <div className="h-4 w-[1px] bg-outline-variant/30 dark:bg-slate-800"></div>
                        <div className="flex items-center bg-surface-container-high px-3 py-1.5 rounded-full space-x-2 dark:bg-slate-800">
                            <span className="material-symbols-outlined text-[16px] dark:text-primary">database</span>
                            <span className="text-[11px] font-bold tracking-tight text-on-surface-variant truncate max-w-[200px] dark:text-slate-300">
                                {file ? file.name : "No Dataset"}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="text-2xl font-bold tracking-tighter text-indigo-700 dark:text-primary">FairLens</div>
                )}
            </div>
            
            <div className="flex items-center space-x-6">
                {!isFocusedFlow && (
                    <button 
                        onClick={() => navigate('/upload')}
                        className="flex items-center px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-white text-[11px] font-bold rounded-lg hover:scale-95 transition-transform shadow-md"
                    >
                        Run new audit
                    </button>
                )}
                
                <div className="flex items-center space-x-4">
                    <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors dark:text-slate-400 dark:hover:text-primary">notifications</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-on-surface-variant hidden md:block dark:text-slate-400">Setup Wizard</span>
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant/30 flex items-center justify-center bg-surface-container-lowest dark:bg-slate-800 dark:border-slate-700">
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px] dark:text-slate-400">person</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
