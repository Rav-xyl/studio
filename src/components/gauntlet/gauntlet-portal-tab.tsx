
'use client';

import type { Candidate } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { ShieldQuestion, Info, Link as LinkIcon, Send, Loader2, Search, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { aiDrivenCandidateEngagement } from "@/ai/flows/ai-driven-candidate-engagement";
import { Input } from "../ui/input";

interface GauntletPortalTabProps {
    candidates: Candidate[];
}

type SortKey = 'name' | 'role' | 'aiInitialScore';

export function GauntletPortalTab({ candidates }: GauntletPortalTabProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSendingReminders, setIsSendingReminders] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'aiInitialScore', direction: 'descending' });


    const shortlistedCandidates = useMemo(() => {
        // A candidate is eligible for the Gauntlet only if they have a high score, are not archived, AND have been assigned a role.
        return candidates.filter(c => 
            (c.aiInitialScore || 0) >= 70 && 
            !c.archived && 
            c.role !== 'Unassigned'
        );
    }, [candidates]);

    const filteredAndSortedCandidates = useMemo(() => {
        let sortableCandidates = [...shortlistedCandidates].filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.role.toLowerCase().includes(searchTerm.toLowerCase())
        );

        sortableCandidates.sort((a, b) => {
            const aValue = a[sortConfig.key] || 0;
            const bValue = b[sortConfig.key] || 0;
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortableCandidates;
    }, [shortlistedCandidates, searchTerm, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

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
    
    const handleSendReminders = async () => {
        setIsSendingReminders(true);
        const candidatesToRemind = shortlistedCandidates.filter(c => {
             if (!c.gauntletStartDate || c.gauntletState?.phase === 'Complete' || c.gauntletState?.phase === 'Failed') return false;
            const now = new Date();
            const startDate = new Date(c.gauntletStartDate);
            const deadline = new Date(new Date(startDate).setDate(startDate.getDate() + 7));
            const daysRemaining = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);
            return daysRemaining > 0 && daysRemaining <= 3; // Nudge candidates with 3 or fewer days left
        });

        if (candidatesToRemind.length === 0) {
            toast({ title: "No Reminders Needed", description: "No candidates are currently within the 3-day deadline window." });
            setIsSendingReminders(false);
            return;
        }

        toast({ title: `Sending ${candidatesToRemind.length} Reminders`, description: "The AI is drafting personalized emails..." });

        try {
            const reminderPromises = candidatesToRemind.map(c => 
                aiDrivenCandidateEngagement({
                    candidateName: c.name,
                    candidateStage: 'Gauntlet Deadline Approaching',
                    jobTitle: c.role,
                    companyName: 'AstraHire',
                    recruiterName: 'The Hiring Team',
                    candidateSkills: c.skills.join(', '),
                })
            );
            await Promise.all(reminderPromises);
            toast({ title: "Reminders Sent!", description: "AI has successfully drafted and sent all reminders." });
        } catch (error) {
            console.error("Failed to send reminders:", error);
            toast({ title: "Error", description: "Could not send AI reminders. Check console for details.", variant: "destructive" });
        } finally {
            setIsSendingReminders(false);
        }
    };


    return (
        <div className="fade-in-slide-up">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter">Gauntlet Portal</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage and monitor candidates who have been shortlisted for the AI Gauntlet.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or role..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSendReminders} disabled={isSendingReminders}>
                        {isSendingReminders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send AI Reminders
                    </Button>
                </div>
            </div>
            
            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Instructions for Recruiters</AlertTitle>
                <AlertDescription>
                   Only candidates with an AI Score of 70+ and an assigned role will appear here. Use the "Copy Credentials" button to get their unique login details for the candidate portal.
                </AlertDescription>
            </Alert>


            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('name')}>
                                    Candidate <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('role')}>
                                    Assigned Role <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-center">
                                <Button variant="ghost" onClick={() => requestSort('aiInitialScore')}>
                                    AI Score <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedCandidates.length > 0 ? (
                            filteredAndSortedCandidates.map(candidate => {
                                const status = getGauntletStatus(candidate);
                                return (
                                <TableRow key={candidate.id}>
                                    <TableCell className="font-medium">{candidate.name} <br/> <span className="text-xs text-muted-foreground">{candidate.id}</span></TableCell>
                                    <TableCell>
                                        <Badge>{candidate.role}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{Math.round(candidate.aiInitialScore || 0)}</Badge>
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
                                    No candidates match your search.
                                    <p className="text-xs text-muted-foreground">Ensure candidates have a score of 70+ and are assigned to a role.</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
