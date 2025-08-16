
'use client';

import { useMemo, useState } from "react";
import type { Candidate } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, ShieldQuestion, Timer, MoreHorizontal, Archive, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateLogDialog } from "./candidate-log-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GauntletMonitorTableProps {
    candidates: Candidate[];
}

const getGrandReport = (candidate: Candidate) => {
    let report = `GRAND REPORT FOR CANDIDATE: ${candidate?.name}\n\n`;
    if (!candidate.gauntletState) return report + "No gauntlet data available.";
    
    const { gauntletState } = candidate;
    
    report += `--- PHASE 1: TECHNICAL GAUNTLET ---\n`;
    report += gauntletState.technicalReport || "No data.";
    report += `\n\n--- BOSS AI VALIDATION (TECHNICAL) ---\n`;
    report += gauntletState.techReview ? `Recommendation: ${gauntletState.techReview.finalRecommendation}\nAssessment: ${gauntletState.techReview.overallAssessment}` : "No validation data.";
    
    report += `\n\n--- PHASE 2: SYSTEM DESIGN CHALLENGE ---\n`;
    report += gauntletState.systemDesignReport || "Phase not completed.";
    report += `\n\n--- BOSS AI VALIDATION (SYSTEM DESIGN) ---\n`;
    report += gauntletState.designReview ? `Recommendation: ${gauntletState.designReview.finalRecommendation}\nAssessment: ${gauntletState.designReview.overallAssessment}` : "Phase not completed.";
    
    report += `\n\n--- END OF REPORT ---`;
    return report;
}


const downloadReport = (candidate: Candidate) => {
    const report = getGrandReport(candidate);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grand_report_${candidate.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

const RecommendationBadge = ({ recommendation }: { recommendation: string | undefined }) => {
    if (!recommendation) return <Badge variant="secondary">In Progress</Badge>;

    switch (recommendation) {
        case 'Strong Hire':
            return <Badge className="bg-green-600/80 text-white"><CheckCircle className="mr-1 h-3 w-3" /> Strong Hire</Badge>;
        case 'Proceed with Caution':
            return <Badge className="bg-amber-500/80 text-white"><AlertCircle className="mr-1 h-3 w-3" /> Proceed with Caution</Badge>;
        case 'Do Not Hire':
            return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Do Not Hire</Badge>;
        default:
            return <Badge variant="secondary">{recommendation}</Badge>;
    }
};


export function GauntletMonitorTable({ candidates }: GauntletMonitorTableProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
    const { toast } = useToast();

    const gauntletCandidates = useMemo(() => {
        // Show candidates who are eligible for gauntlet (score >= 70) and not archived
        return candidates.filter(c => (c.aiInitialScore || 0) >= 70 && !c.archived);
    }, [candidates]);

    const handleViewLog = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setIsLogDialogOpen(true);
    };
    
    const handleArchiveCandidate = async (candidateId: string) => {
        try {
            const candidateRef = doc(db, 'candidates', candidateId);
            await updateDoc(candidateRef, { archived: true });
            toast({ title: 'Candidate Archived', description: 'The candidate has been moved to the archives.' });
        } catch (error) {
            console.error('Failed to archive candidate:', error);
            toast({ title: 'Error', description: 'Could not archive the candidate.', variant: 'destructive' });
        }
    };

    const getGauntletStatus = (candidate: Candidate) => {
        if (!candidate.gauntletState) return { text: 'Not Started', value: 0 };
        const { phase } = candidate.gauntletState;
        if (phase === 'Complete') return { text: 'Complete', value: 100 };
        if (phase === 'Failed') return { text: 'Failed', value: 0 };
        if (phase === 'SystemDesign' || phase === 'PendingDesignReview') return { text: 'Phase 2: System Design', value: 50 };
        if (phase === 'Technical' || phase === 'PendingTechReview') return { text: 'Phase 1: Technical', value: 10 };
        return { text: 'Not Started', value: 0 };
    };

    const getDaysRemaining = (candidate: Candidate) => {
        if (!candidate.gauntletStartDate || candidate.gauntletState?.phase === 'Complete' || candidate.gauntletState?.phase === 'Failed') return { text: 'N/A', isUrgent: false, isExpired: false };
        const now = new Date();
        const startDate = new Date(candidate.gauntletStartDate);
        const deadline = new Date(new Date(startDate).setDate(startDate.getDate() + 7));
        const daysRemaining = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);

        if (daysRemaining < 0) return { text: 'Expired', isUrgent: false, isExpired: true };
        if (daysRemaining <= 3) return { text: `${Math.ceil(daysRemaining)} days left`, isUrgent: true, isExpired: false };
        return { text: `${Math.ceil(daysRemaining)} days left`, isUrgent: false, isExpired: false };
    };
    

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gauntlet Candidates Monitor</CardTitle>
                    <CardDescription>
                        Track shortlisted candidates invited to the AI Gauntlet. Deadlines are 7 days from their start date.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead className="text-center">Pipeline Status</TableHead>
                                    <TableHead>Gauntlet Progress</TableHead>
                                    <TableHead className="text-center">Time Remaining</TableHead>
                                    <TableHead className="text-center">Final Recommendation</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gauntletCandidates.length > 0 ? (
                                    gauntletCandidates.map(candidate => {
                                        const status = getGauntletStatus(candidate);
                                        const deadline = getDaysRemaining(candidate);
                                        const isCompleteOrFailed = candidate.gauntletState?.phase === 'Complete' || candidate.gauntletState?.phase === 'Failed';
                                        
                                        // Use the last recommendation available
                                        const finalRecommendation = candidate.gauntletState?.designReview?.finalRecommendation || candidate.gauntletState?.techReview?.finalRecommendation;
                                        
                                        return (
                                            <TableRow key={candidate.id}>
                                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                                <TableCell className="text-center">
                                                     <Badge variant={candidate.status === 'Interview' ? 'default' : 'secondary'} className={candidate.status === 'Interview' ? 'bg-blue-600/80' : ''}>{candidate.status}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-muted-foreground">{status.text}</span>
                                                        <Progress value={status.value} className="h-2" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`text-center font-medium ${deadline.isUrgent ? 'text-amber-500' : ''} ${deadline.isExpired ? 'text-destructive' : ''}`}>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Timer className="h-4 w-4" />
                                                        {deadline.text}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <RecommendationBadge recommendation={isCompleteOrFailed ? finalRecommendation : undefined} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewLog(candidate)}>
                                                                <FileText className="mr-2 h-4 w-4" /> View Full Log
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => downloadReport(candidate)} disabled={!isCompleteOrFailed}>
                                                                <Download className="mr-2 h-4 w-4" /> Download Report
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleArchiveCandidate(candidate.id)}>
                                                                <Archive className="mr-2 h-4 w-4" /> Archive Candidate
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <ShieldQuestion className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                                            No candidates have been shortlisted for the Gauntlet yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <CandidateLogDialog
                isOpen={isLogDialogOpen}
                onClose={() => setIsLogDialogOpen(false)}
                candidate={selectedCandidate}
            />
        </>
    );
}

    