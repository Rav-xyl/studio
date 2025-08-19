'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Candidate, LogEntry } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, FileText, Bot, UserCog, Mail } from "lucide-react";

interface CandidateLogDialogProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: Candidate | null;
}

const getIconForAuthor = (log: LogEntry) => {
    if (log.event.includes('Email Drafted')) {
        return <Mail className="h-5 w-5 text-blue-500" />;
    }
    switch(log.author) {
        case 'AI': return <Bot className="h-5 w-5 text-primary" />;
        case 'Admin': return <UserCog className="h-5 w-5 text-amber-500" />;
        default: return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
}

export function CandidateLogDialog({ isOpen, onClose, candidate }: CandidateLogDialogProps) {
    if (!candidate) return null;

    const logs = candidate.log || [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <FileText /> Detailed Log for {candidate.name}
                    </DialogTitle>
                    <DialogDescription>
                        A point-by-point history of every action and event for this candidate.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] mt-4 border rounded-md p-2 bg-secondary/30">
                    <div className="p-4 space-y-4">
                        {logs.length > 0 ? (
                            logs.slice().reverse().map((log, index) => (
                               <div key={index} className="flex items-start gap-4">
                                   <div className="flex flex-col items-center">
                                        <span className="p-2 bg-background rounded-full border">
                                            {getIconForAuthor(log)}
                                        </span>
                                        {index < logs.length - 1 && <div className="w-px h-16 bg-border mt-2"></div>}
                                   </div>
                                   <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-foreground">{log.event}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{log.details}</p>
                                   </div>
                               </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <p>No log entries found for this candidate yet.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
