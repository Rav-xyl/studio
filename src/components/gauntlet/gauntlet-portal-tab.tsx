
'use client';

import type { Candidate } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Copy, ShieldQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";
import { Progress } from "../ui/progress";

interface GauntletPortalTabProps {
    candidates: Candidate[];
}

export function GauntletPortalTab({ candidates }: GauntletPortalTabProps) {
    const { toast } = useToast();

    const shortlistedCandidates = useMemo(() => {
        return candidates.filter(c => (c.aiInitialScore || 0) >= 70 && !c.archived);
    }, [candidates]);

    const getGauntletStatus = (candidate: Candidate) => {
        if (!candidate.gauntletState) return { text: 'Not Started', value: 0 };
        const { phase } = candidate.gauntletState;
        if (phase === 'Complete') return { text: 'Complete', value: 100 };
        if (phase === 'SystemDesign') return { text: 'Phase 2: System Design', value: 66 };
        if (phase === 'PendingReview') return { text: 'Phase 1: Under Review', value: 33 };
        if (phase === 'Technical') return { text: 'Phase 1: In Progress', value: 10 };
        return { text: 'Not Started', value: 0 };
    }

    const handleCopyLink = (candidateId: string) => {
        const interviewUrl = `${window.location.origin}/candidate/${candidateId}`;
        navigator.clipboard.writeText(interviewUrl);
        toast({
            title: "Gauntlet Link Copied!",
            description: `The unique interview link has been copied to your clipboard.`
        });
    }

    return (
        <div className="fade-in-slide-up">
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tighter">Gauntlet Portal</h2>
                <p className="text-muted-foreground mt-1">
                    Only candidates with an AI screening score of 70+ are shortlisted for the Gauntlet.
                </p>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead className="text-center">AI Score</TableHead>
                            <TableHead>Gauntlet Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shortlistedCandidates.length > 0 ? (
                            shortlistedCandidates.map(candidate => {
                                const status = getGauntletStatus(candidate);
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
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleCopyLink(candidate.id)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Gauntlet Link
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <ShieldQuestion className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                                    No candidates have been shortlisted for the Gauntlet yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
