
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { Brain, CheckCircle, X, XCircle } from "lucide-react";

interface SaarthiReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: any;
}

const statusIcon = (status: 'Success' | 'Failure' | 'Info') => {
    switch (status) {
        case 'Success': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'Failure': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return null;
    }
}

export function SaarthiReportModal({ isOpen, onClose, reportData }: SaarthiReportModalProps) {
    if (!reportData) return null;

    const isAudit = reportData.reportType === "System Audit";
    const title = isAudit ? "SAARTHI's System Audit" : "SAARTHI's Simulation Overview";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-background text-foreground border-border shadow-lg">
                 <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                       <Brain className="w-8 h-8 text-primary"/> {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
                    {reportData.simulationSummary && (
                        <div className="bg-secondary/50 p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">Summary</h4>
                            <p className="text-muted-foreground">{reportData.simulationSummary}</p>
                        </div>
                    )}

                    {reportData.detailedProcessLog && reportData.detailedProcessLog.length > 0 && (
                        <div className="bg-secondary/50 p-6 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">Detailed Process Log</h4>
                            <ul className="space-y-3 text-muted-foreground">
                                {reportData.detailedProcessLog.map((log: any, index: number) => (
                                <li key={index} className="flex items-start gap-3">
                                    {isAudit && <span className="mt-1">{statusIcon(log.status)}</span>}
                                    <div>
                                       <span className="font-semibold text-foreground">{log.step}:</span> {log.description}
                                    </div>
                                </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

    