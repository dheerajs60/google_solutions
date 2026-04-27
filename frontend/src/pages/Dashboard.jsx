import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuditStore } from '../store/useAuditStore';
import { MetricCard } from '../components/shared/MetricCard';
import { HeatmapCell } from '../components/shared/HeatmapCell';
import { BiasLineage } from '../components/dashboard/BiasLineage';
import { geminiService } from '../services/geminiService';
import { Activity } from 'lucide-react';
import { auditService } from '../services/auditService';

export const Dashboard = () => {
    const { 
        overallScore, 
        metrics, 
        heatmap, 
        lineage, 
        geminiExplanation, 
        auditId: currentAuditId, 
        fetchAudit, 
        fetchAIAnalysis,
        isLoading, 
        isAIAnalysing,
        aiAnalysisFailed,
        error,
        mitigationActive 
    } = useAuditStore();
    
    const location = useLocation();
    const [typedExplanation, setTypedExplanation] = useState('');
    const explanationRef = useRef('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlAuditId = params.get('auditId');
        
        if (urlAuditId && urlAuditId !== currentAuditId) {
            fetchAudit(urlAuditId);
        } else if (currentAuditId && !metrics && !isLoading && !error) {
            fetchAudit(currentAuditId);
        }
    }, [location.search, currentAuditId, metrics, isLoading, error, fetchAudit]);

    // Automatically trigger AI analysis if missing
    useEffect(() => {
        if (metrics && !geminiExplanation && !isAIAnalysing && !aiAnalysisFailed && currentAuditId) {
            fetchAIAnalysis(currentAuditId);
        }
    }, [metrics, geminiExplanation, isAIAnalysing, aiAnalysisFailed, currentAuditId, fetchAIAnalysis]);

    if (isLoading) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-6 animate-pulse">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-3xl">troubleshoot</span>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-on-surface dark:text-white">Analyzing bias patterns...</h3>
                    <p className="text-sm text-on-surface-variant dark:text-slate-400">Our forensic engine is evaluating demographic parity and error equity.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-3xl bg-error/5 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-error/10 blur-2xl rounded-full animate-pulse"></div>
                    <span className="material-symbols-outlined text-error text-5xl relative z-10">error_med</span>
                </div>
                
                <div className="text-center max-w-md space-y-3">
                    <h2 className="text-2xl font-black tracking-tight text-on-surface dark:text-white">Audit Integrity Compromised</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed dark:text-slate-400">
                        {error}. Ensure your dataset configuration matches the schema requirements.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => fetchAudit(currentAuditId)}
                        className="px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all"
                    >
                        Retry Audit Trace
                    </button>
                    <Link 
                        to="/upload"
                        className="px-8 py-4 bg-white border border-outline-variant/20 text-on-surface rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
                    >
                        Start New Protocol
                    </Link>
                </div>
            </div>
        );
    }

    if (!metrics && !currentAuditId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full opacity-50"></div>
                    <span className="material-symbols-outlined text-primary text-5xl relative z-10">biotech</span>
                </div>
                
                <div className="text-center max-w-md space-y-3">
                    <h2 className="text-2xl font-black tracking-tight text-on-surface dark:text-white">Awaiting Audit Stream</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed dark:text-slate-400">
                        No active fairness evaluation detected in the pipeline. Initialize a new audit by uploading a dataset.
                    </p>
                </div>

                <Link 
                    to="/upload"
                    className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:-translate-y-1 active:scale-95 transition-all dark:bg-primary"
                >
                    <span className="material-symbols-outlined text-[20px]">upload_file</span>
                    Initialize New Audit
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-12 w-full animate-in fade-in duration-700 transition-colors">
            {/* Educational Header */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-start gap-4 dark:bg-slate-900 dark:border-slate-800">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                <div>
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Audit Protocol: How it works</h3>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed max-w-3xl font-medium dark:text-slate-400">
                        This dashboard provides a high-fidelity overview of your model's fairness signature. The <strong>Integrity Score</strong> is a weighted average of three critical dimensions: <strong>Selection Parity</strong> (are outcomes balanced?), <strong>Error Equity</strong> (are mistakes distributed fairly?), and <strong>Impact Ratios</strong> (long-term societal effects). 
                        <br/><br/>
                        Use the <strong>Bias Lineage</strong> trace on the right to track how decisions moved through the audit pipe, and review the <strong>Lead Auditor's Report</strong> below for AI-driven clinical insights.
                    </p>
                </div>
            </div>

            {/* Summary Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Overall Fairness" 
                    score={overallScore} 
                    description="Aggregate score across all metrics"
                />
                <MetricCard 
                    title="Demographic Parity" 
                    score={metrics?.demographic_parity?.value} 
                    description={metrics?.demographic_parity?.description}
                />
                <MetricCard 
                    title="Equal Opportunity" 
                    score={metrics?.equal_opportunity?.value} 
                    description={metrics?.equal_opportunity?.description}
                />
                <MetricCard 
                    title="Disparate Impact" 
                    score={metrics?.disparate_impact?.value} 
                    description={metrics?.disparate_impact?.description}
                />
            </div>

            {/* Row 2: Gemini Analysis and Lineage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gemini AI Explanation Panel */}
                <div className="lg:col-span-2 card-layer border-l-4 border-l-primary p-6 relative overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center space-x-1.5 bg-primary/5 px-3 py-1 rounded-full dark:bg-primary/10">
                            <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            <span className="text-[10px] font-bold text-primary tracking-tight uppercase">Vertex AI • Gemini 1.5 Pro</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-on-surface mb-4 dark:text-white">Forensic Bias Analysis</h2>
                    <div className="space-y-4 max-w-2xl min-h-[140px]">
                        {isAIAnalysing && !geminiExplanation ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-2.5 bg-slate-100 rounded-full w-48 dark:bg-slate-800"></div>
                                <div className="h-2 bg-slate-100 rounded-full max-w-[480px] dark:bg-slate-800"></div>
                                <div className="h-2 bg-slate-100 rounded-full max-w-[400px] dark:bg-slate-800"></div>
                                <div className="h-2 bg-slate-100 rounded-full max-w-[440px] dark:bg-slate-800"></div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-4">Forensic Auditor is thinking...</p>
                            </div>
                        ) : geminiExplanation ? (
                            <>
                                <p className="text-on-surface-variant leading-relaxed text-sm dark:text-slate-300">
                                    {geminiExplanation}
                                    {isAIAnalysing && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse"></span>}
                                </p>
                                <div className="flex items-center gap-4 mt-6">
                                    <Link to="/heatmap" className="inline-flex items-center text-primary font-bold text-xs hover:underline">
                                        View full analysis
                                        <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                    </Link>
                                </div>
                            </>
                        ) : aiAnalysisFailed ? (
                            <div className="py-4 px-4 bg-error/10 border border-error/20 rounded-xl">
                                <p className="text-xs text-error font-medium mb-3">
                                    <strong>AI Quota Exceeded:</strong> The Gemini AI service is currently rate limited or unavailable. The core audit metrics above are fully calculated and mathematically sound.
                                </p>
                                <button 
                                    onClick={() => fetchAIAnalysis(currentAuditId)}
                                    className="px-4 py-2 bg-error text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-error/90 active:scale-95 transition-all"
                                >
                                    Retry AI Report
                                </button>
                            </div>
                        ) : (
                            <div className="py-2">
                                <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed mb-4">
                                    The Lead Auditor is ready to investigate the audit traces and identify statistical drivers for the detected bias.
                                </p>
                                <button 
                                    onClick={() => fetchAIAnalysis(currentAuditId)}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest group active:scale-95 transition-all shadow-lg shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                                    Generate Forensic Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bias Lineage */}
                <div className="lg:col-span-1">
                    <BiasLineage stages={lineage} />
                </div>
            </div>
        </div>
    );
};
