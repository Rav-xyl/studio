'use client';

import { useMemo, useState } from "react";
import type { Candidate, LogEntry } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, ShieldQuestion, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateLogDialog } from "./candidate-log-dialog";

interface GauntletMonitorTableProps {
    candidates: Candidate[];
}

export function GauntletMonitorTable({ candidates }: GauntletMonitorTableProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

    const gauntletCandidates = useMemo(() => {
        return candidates.filter(c => (c.aiInitialScore || 0) >= 70 && !c.archived);
    }, [candidates]);

    const handleViewLog = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setIsLogDialogOpen(true);
    };

    const getGauntletStatus = (candidate: Candidate) => {
        if (!candidate.gauntletState) return { text: 'Not Started', value: 0 };
        const { phase } = candidate.gauntletState;
        if (phase === 'Complete') return { text: 'Complete', value: 100 };
        if (phase === 'SystemDesign') return { text: 'Phase 2: System Design', value: 66 };
        if (phase === 'PendingReview') return { text: 'Phase 1: Under BOSS Review', value: 33 };
        if (phase === 'Technical') return { text: 'Phase 1: In Progress', value: 10 };
        return { text: 'Not Started', value: 0 };
    };

    const getDaysRemaining = (candidate: Candidate) => {
        if (!candidate.gauntletStartDate || candidate.gauntletState?.phase === 'Complete') return { text: 'N/A', isUrgent: false, isExpired: false };
        const now = new Date();
        const startDate = new Date(candidate.gauntletStartDate);
        const deadline = new Date(startDate.setDate(startDate.getDate() + 7));
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
                                    <TableHead className="text-center">AI Score</TableHead>
                                    <TableHead>Gauntlet Progress</TableHead>
                                    <TableHead className="text-center">Time Remaining</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gauntletCandidates.length > 0 ? (
                                    gauntletCandidates.map(candidate => {
                                        const status = getGauntletStatus(candidate);
                                        const deadline = getDaysRemaining(candidate);
                                        return (
                                            <TableRow key={candidate.id}>
                                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">{Math.round(candidate.aiInitialScore || 0)}</Badge>
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
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewLog(candidate)}>
                                                        <FileText className="mr-2 h-4 w-4" /> View Log
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
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
