
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
            <DialogContent className="max-w-4xl bg-background text-foreground border-border shadow-lg">
                 <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                       <Brain className="w-8 h-8 text-primary"/> SAARTHI's Simulation Overview
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
                    {reportData.simulationSummary && (
                        <div className="bg-secondary/50 p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">Summary of Simulation</h4>
                            <p className="text-muted-foreground">{reportData.simulationSummary}</p>
                        </div>
                    )}

                    {reportData.detailedProcessLog && reportData.detailedProcessLog.length > 0 && (
                        <div className="bg-secondary/50 p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">Detailed Process Log</h4>
                            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                                {reportData.detailedProcessLog.map((log: any, index: number) => <li key={index}><strong>{log.step}:</strong> {log.description}</li>)}
                            </ul>
                        </div>
                    )}

                    {reportData.candidateOutcomesAnalysis && reportData.candidateOutcomesAnalysis.length > 0 && (
                        <div className="bg-secondary/50 p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">Candidate Outcomes Analysis</h4>
                            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                                {reportData.candidateOutcomesAnalysis.map((analysis: any, index: number) => <li key={index}><strong>{analysis.candidateName || 'Unnamed Candidate'}:</strong> {analysis.outcomeDetails}</li>)}
                            </ul>
                        </div>
                    )}

                    {reportData.roleManagementInsights && reportData.roleManagementInsights.length > 0 && (
                        <div className="bg-secondary/50 p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">Role Management Insights</h4>
                            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                                 {reportData.roleManagementInsights.map((insight: string, index: number) => <li key={index}>{insight}</li>)}
                            </ul>
                        </div>
                    )}

                    {reportData.systemLearningAndFutureImprovements && (
                        <div className="bg-secondary/50 p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">System Learning & Future Improvements</h4>
                            <p className="text-muted-foreground">{reportData.systemLearningAndFutureImprovements}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
