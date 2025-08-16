'use client';

import type { Candidate } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { ShieldQuestion, Info, Link as LinkIcon } from "lucide-react";
import { useMemo } from "react";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface GauntletPortalTabProps {
    candidates: Candidate[];
}

export function GauntletPortalTab({ candidates }: GauntletPortalTabProps) {
    const { toast } = useToast();
    const router = useRouter();

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

    const copyLoginCredentials = (candidate: Candidate) => {
        const loginUrl = `${window.location.origin}/gauntlet/login`;
        const credentials = `Candidate Portal URL: ${loginUrl}\nCandidate ID: ${candidate.id}\nPassword: TEST1234`;
        navigator.clipboard.writeText(credentials);
        toast({
            title: "Credentials Copied!",
            description: `Login details for ${candidate.name} copied to clipboard.`
        });
    };

    return (
        <div className="fade-in-slide-up">
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tighter">Gauntlet Portal</h2>
                <p className="text-muted-foreground mt-1">
                    Manage and monitor candidates who have been shortlisted for the AI Gauntlet.
                </p>
            </div>
            
            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Instructions for Recruiters</AlertTitle>
                <AlertDescription>
                   Shortlisted candidates (AI Score 70+) appear here. Use the "Copy Credentials" button to get their unique login details for the candidate portal.
                </AlertDescription>
            </Alert>


            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead className="text-center">AI Score</TableHead>
                            <TableHead>Gauntlet Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shortlistedCandidates.length > 0 ? (
                            shortlistedCandidates.map(candidate => {
                                const status = getGauntletStatus(candidate);
                                return (
                                <TableRow key={candidate.id}>
                                    <TableCell className="font-medium">{candidate.name} <br/> <span className="text-xs text-muted-foreground">{candidate.id}</span></TableCell>
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
                                        <Button variant="outline" size="sm" onClick={() => copyLoginCredentials(candidate)}>
                                            <LinkIcon className="mr-2 h-4 w-4"/>
                                            Copy Credentials
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
