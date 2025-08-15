
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, X } from "lucide-react";

interface SaarthiReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: any;
}

export function SaarthiReportModal({ isOpen, onClose, reportData }: SaarthiReportModalProps) {
    if (!reportData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl glass-card text-foreground">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                       <Brain className="w-8 h-8"/> SAARTHI's Simulation Overview
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto pr-4 space-y-6">
                    {reportData.simulationSummary && (
                        <div className="glass-card p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-slate-100 mb-3">Summary of Simulation</h4>
                            <p className="text-slate-300">{reportData.simulationSummary}</p>
                        </div>
                    )}

                    {reportData.detailedProcessLog && reportData.detailedProcessLog.length > 0 && (
                        <div className="glass-card p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-slate-100 mb-3">Detailed Process Log</h4>
                            <ul className="list-disc list-inside space-y-3 text-slate-300">
                                {reportData.detailedProcessLog.map((log: any, index: number) => <li key={index}><strong>{log.step}:</strong> {log.description}</li>)}
                            </ul>
                        </div>
                    )}

                    {reportData.candidateOutcomesAnalysis && reportData.candidateOutcomesAnalysis.length > 0 && (
                        <div className="glass-card p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-slate-100 mb-3">Candidate Outcomes Analysis</h4>
                            <ul className="list-disc list-inside space-y-3 text-slate-300">
                                {reportData.candidateOutcomesAnalysis.map((analysis: any, index: number) => <li key={index}><strong>{analysis.candidateName || 'Unnamed Candidate'}:</strong> {analysis.outcomeDetails}</li>)}
                            </ul>
                        </div>
                    )}

                    {reportData.roleManagementInsights && reportData.roleManagementInsights.length > 0 && (
                        <div className="glass-card p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-slate-100 mb-3">Role Management Insights</h4>
                            <ul className="list-disc list-inside space-y-3 text-slate-300">
                                 {reportData.roleManagementInsights.map((insight: string, index: number) => <li key={index}>{insight}</li>)}
                            </ul>
                        </div>
                    )}

                    {reportData.systemLearningAndFutureImprovements && (
                        <div className="glass-card p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-slate-100 mb-3">System Learning & Future Improvements</h4>
                            <p className="text-slate-300">{reportData.systemLearningAndFutureImprovements}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
