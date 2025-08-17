
'use client';

import type { Candidate, JobRole } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { findPotentialCandidates } from "@/ai/flows/find-potential-candidates";
import { useState } from "react";
import { Loader2, Search, Trash2, UserSearch, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";


const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

interface ProspectingTabProps {
    candidates: Candidate[];
    roles: JobRole[];
    onUpdateCandidate: (candidate: Candidate) => void;
    onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>, candidateToUpdate: Candidate) => void;
    onDeleteCandidate: (candidateId: string) => void;
    onRunBulkMatch: () => void;
    matchResults: Record<string, any[]>;
    setMatchResults: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

export function ProspectingTab({ 
    candidates, 
    roles, 
    onUpdateCandidate, 
    onAddRole, 
    onDeleteCandidate,
    onRunBulkMatch,
    matchResults,
    setMatchResults
}: ProspectingTabProps) {
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    
    const handleFindMatches = async (candidate: Candidate) => {
        setIsLoading(prev => ({ ...prev, [candidate.id]: true }));
        try {
            const allMatches: any[] = [];
            // This loop iterates through all available roles to find the best matches for a single candidate.
            // It uses the same unified AI engine as the "Find Top Matches" feature in the Client Roles tab.
            for (const role of roles) {
                const result = await findPotentialCandidates({
                    jobRole: role,
                    candidates: [candidate],
                });
                if (result.matches && result.matches.length > 0) {
                   allMatches.push({
                       roleId: role.id,
                       roleTitle: role.title,
                       ...result.matches[0] // Since we only passed one candidate
                   });
                }
            }
            allMatches.sort((a,b) => b.confidenceScore - a.confidenceScore);
            setMatchResults(prev => ({ ...prev, [candidate.id]: allMatches }));

        } catch (error) {
            console.error("Failed to find potential roles:", error);
            toast({ title: "Error", description: "Could not fetch AI role matches.", variant: "destructive" });
        } finally {
            setIsLoading(prev => ({ ...prev, [candidate.id]: false }));
        }
    };
    
    const handleAssignRole = (candidate: Candidate, roleTitle: string) => {
        onUpdateCandidate({ ...candidate, role: roleTitle });
        toast({ title: "Role Assigned!", description: `${candidate.name} has been assigned to ${roleTitle}.` });
    }

    return (
        <div className="fade-in-slide-up">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter">Prospecting Hub</h2>
                    <p className="text-muted-foreground mt-1">
                        Discover and assign your top unassigned talent to open roles.
                    </p>
                </div>
                 <Button onClick={onRunBulkMatch} disabled={candidates.length === 0}>
                    <Zap className="mr-2 h-4 w-4" />
                    Run AI Match for All
                </Button>
            </div>
            
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Candidate</TableHead>
                            <TableHead className="w-[15%] text-center">AI Score</TableHead>
                            <TableHead>Top Skills</TableHead>
                            <TableHead className="w-[20%]" colSpan={2}>Role Matches (AI)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.length > 0 ? (
                            candidates.map(candidate => {
                                const matches = matchResults[candidate.id] || [];
                                const loading = isLoading[candidate.id];
                                return (
                                <TableRow key={candidate.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={candidate.avatarUrl} data-ai-hint="person" />
                                                <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{candidate.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{Math.round(candidate.aiInitialScore || 0)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {candidate.skills.slice(0, 4).map(skill => (
                                                <Badge key={skill} variant="outline">{skill}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {matches.length > 0 ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline">View Matches ({matches.length})</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Top Role Matches</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {matches.map((match: any) => (
                                                        <DropdownMenuItem key={match.roleId} onClick={() => handleAssignRole(candidate, match.roleTitle)}>
                                                            <div className="flex justify-between w-full items-center gap-2">
                                                                <span>{match.roleTitle}</span>
                                                                <Badge variant="secondary">{match.confidenceScore}</Badge>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => handleFindMatches(candidate)} disabled={loading || roles.length === 0}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                                Find Matches
                                            </Button>
                                        )}
                                    </TableCell>
                                     <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete {candidate.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the candidate's profile. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteCandidate(candidate.id)}>Confirm Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <UserSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold">No Unassigned Candidates</h3>
                                    <p className="text-muted-foreground mt-1">Upload new resumes to the candidate pool to start prospecting.</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
