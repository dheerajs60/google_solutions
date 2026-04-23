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

    useEffect(() => {
        if (geminiExplanation && !isLoading && !isAIAnalysing) {
            setTypedExplanation('');
            explanationRef.current = '';
            const cleanup = geminiService.typewriteText(geminiExplanation, (text) => {
                setTypedExplanation(text);
            }, null, 25);
            return cleanup;
        }
    }, [geminiExplanation, isLoading, isAIAnalysing]);

    if (isLoading) {
        return <div className="flex h-[400px] flex-col items-center justify-center text-on-surface-variant font-medium gap-3">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            <span>Analyzing dataset for bias patterns...</span>
        </div>;
    }

    if (error) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center text-error font-medium gap-3">
                <span className="material-symbols-outlined text-4xl">error</span>
                <span>{error}</span>
                <div className="flex gap-4 mt-4">
                    <button 
                        onClick={() => fetchAudit()}
                        className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md hover:shadow-primary/20"
                    >
                        Retry Audit
                    </button>
                    <Link 
                        to="/upload"
                        className="px-6 py-2 border border-primary/20 text-primary hover:bg-primary/5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
                    >
                        Start New Audit
                    </Link>
                </div>
            </div>
        );
    }

    if (!metrics && !currentAuditId) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center text-on-surface-variant font-medium gap-3">
                <span className="material-symbols-outlined text-4xl text-outline-variant">analytics</span>
                <span>No active audit found. Please upload a dataset to begin.</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-12 w-full animate-in fade-in duration-700">
            {/* Educational Header */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                <div>
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Audit Protocol: How it works</h3>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed max-w-3xl font-medium">
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
                <div className="lg:col-span-2 card-layer border-l-4 border-l-primary p-6 relative overflow-hidden bg-white">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center space-x-1.5 bg-primary/5 px-3 py-1 rounded-full">
                            <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            <span className="text-[10px] font-bold text-primary tracking-tight uppercase">Powered by Gemini 1.5 Pro</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-on-surface mb-4">Why bias was detected</h2>
                    <div className="space-y-4 max-w-2xl min-h-[140px]">
                        {isAIAnalysing && !typedExplanation ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-2.5 bg-slate-100 rounded-full w-48"></div>
                                <div className="h-2 bg-slate-100 rounded-full max-w-[480px]"></div>
                                <div className="h-2 bg-slate-100 rounded-full max-w-[400px]"></div>
                                <div className="h-2 bg-slate-100 rounded-full max-w-[440px]"></div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-4">Forensic Auditor is thinking...</p>
                            </div>
                        ) : typedExplanation ? (
                            <>
                                <p className="text-on-surface-variant leading-relaxed text-sm">
                                    {typedExplanation}
                                    {isAIAnalysing && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse"></span>}
                                </p>
                                <Link to="/heatmap" className="inline-flex items-center text-primary font-bold text-xs hover:underline mt-2">
                                    View full analysis
                                    <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                </Link>
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
