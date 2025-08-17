'use client';

import type { Candidate, JobRole } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { findPotentialRoles } from "@/ai/flows/find-potential-roles";
import { useState } from "react";
import { Loader2, Search, UserSearch, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle } from "lucide-react";


const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

interface ProspectingTabProps {
    candidates: Candidate[];
    roles: JobRole[];
    onUpdateCandidate: (candidate: Candidate) => void;
    onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>, candidateToUpdate: Candidate) => void;
}

export function ProspectingTab({ candidates, roles, onUpdateCandidate, onAddRole }: ProspectingTabProps) {
    const [matchResults, setMatchResults] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    
    const handleFindMatches = async (candidate: Candidate) => {
        setIsLoading(prev => ({ ...prev, [candidate.id]: true }));
        try {
            const result = await findPotentialRoles({
                candidateProfile: {
                    skills: candidate.skills,
                    narrative: candidate.narrative,
                },
                jobRoles: roles,
            });
            setMatchResults(prev => ({ ...prev, [candidate.id]: result.matches }));
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
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tighter">Prospecting Hub</h2>
                <p className="text-muted-foreground mt-1">
                    Discover and assign your top unassigned talent to open roles.
                </p>
            </div>
            
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Candidate</TableHead>
                            <TableHead className="w-[20%] text-center">AI Score</TableHead>
                            <TableHead>Top Skills</TableHead>
                            <TableHead className="text-center">Role Matches (AI)</TableHead>
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
                                    <TableCell className="text-center">
                                        {matches.length > 0 ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline">View Matches ({matches.length})</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Top Role Matches</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {matches.map(match => (
                                                        <DropdownMenuItem key={match.roleId} onClick={() => handleAssignRole(candidate, match.roleTitle)}>
                                                            <div className="flex justify-between w-full">
                                                                <span>{match.roleTitle}</span>
                                                                <Badge variant="secondary">{match.confidenceScore}</Badge>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => handleFindMatches(candidate)} disabled={loading}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                                Find Matches
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
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
