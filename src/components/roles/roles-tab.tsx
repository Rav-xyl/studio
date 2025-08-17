
'use client'
import type { Candidate, JobRole } from '@/lib/types';
import { PlusCircle, FolderSearch, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { GenerateJdDialog } from './generate-jd-dialog';
import { RoleCard } from './role-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { findPotentialCandidates } from '@/ai/flows/find-potential-candidates';
import { MatchedCandidatesDialog } from './matched-candidates-dialog';

interface RolesTabProps {
    roles: JobRole[];
    candidates: Candidate[];
    onViewCandidates: (role: JobRole) => void;
    onReEngage: (role: JobRole) => void;
    onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>) => void;
    onDeleteRole: (roleId: string, roleTitle: string) => void;
    onUpdateCandidate: (candidate: Candidate) => void;
}


export function RolesTab({ roles, candidates, onViewCandidates, onReEngage, onAddRole, onDeleteRole, onUpdateCandidate }: RolesTabProps) {
    const [isJdDialogOpen, setIsJdDialogOpen] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [isMatchesDialogOpen, setIsMatchesDialogOpen] = useState(false);
    const [matchedCandidates, setMatchedCandidates] = useState<any[]>([]);
    const [selectedRoleForMatching, setSelectedRoleForMatching] = useState<JobRole | null>(null);
    const { toast } = useToast();

    const handleFindTopMatches = async (role: JobRole) => {
        setIsMatching(true);
        setSelectedRoleForMatching(role);
        try {
            const availableCandidates = candidates.filter(c => c.role === 'Unassigned' && !c.archived && c.status === 'Screening');
            if (availableCandidates.length === 0) {
                toast({
                    title: "No available candidates to match",
                    description: "No 'Unassigned' candidates were found in the 'Screening' column.",
                    variant: "destructive"
                });
                return;
            }

            const result = await findPotentialCandidates({
                jobRole: role,
                candidates: availableCandidates.map(c => ({
                    id: c.id,
                    name: c.name,
                    skills: c.skills,
                    narrative: c.narrative,
                })),
            });
            
            setMatchedCandidates(result.matches);
            setIsMatchesDialogOpen(true);

        } catch (error) {
            console.error("Failed to find top candidates:", error);
            toast({ title: 'Error', description: "Could not find potential candidates.", variant: 'destructive' });
        } finally {
            setIsMatching(false);
        }
    }

    const handleFindAllQualified = (role: JobRole) => {
        setSelectedRoleForMatching(role);
        const qualifiedCandidates = candidates.filter(c =>
            c.role === 'Unassigned' &&
            !c.archived &&
            c.status === 'Screening' &&
            (c.aiInitialScore || 0) >= 70
        );

        if (qualifiedCandidates.length === 0) {
            toast({
                title: "No Qualified Candidates Found",
                description: "No 'Unassigned' candidates in 'Screening' meet the 70+ score requirement.",
            });
            return;
        }

        const matches = qualifiedCandidates.map(c => ({
            candidateId: c.id,
            candidateName: c.name,
            justification: `Qualified with AI Score: ${Math.round(c.aiInitialScore || 0)}`,
            confidenceScore: Math.round(c.aiInitialScore || 0),
        })).sort((a, b) => b.confidenceScore - a.confidenceScore); // Sort by score descending

        setMatchedCandidates(matches);
        setIsMatchesDialogOpen(true);
    };

    const handleAssignRole = (candidateId: string) => {
        if (!selectedRoleForMatching) return;
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            onUpdateCandidate({ ...candidate, role: selectedRoleForMatching.title });
            toast({ title: "Role Assigned!", description: `${candidate.name} has been assigned to ${selectedRoleForMatching.title}.` });
        }
        // Also remove the assigned candidate from the dialog list
        setMatchedCandidates(prev => prev.filter(m => m.candidateId !== candidateId));
    };

    const handleAssignAllRoles = (matchesToAssign: any[]) => {
        if (!selectedRoleForMatching) return;
        
        matchesToAssign.forEach(match => {
            const candidate = candidates.find(c => c.id === match.candidateId);
            if (candidate) {
                onUpdateCandidate({ ...candidate, role: selectedRoleForMatching.title });
            }
        });

        toast({
            title: "Bulk Assignment Complete!",
            description: `Assigned ${matchesToAssign.length} candidates to the ${selectedRoleForMatching.title} role.`
        });
        
        setIsMatchesDialogOpen(false);
        setMatchedCandidates([]);
    };
    
    return (
        <div className="fade-in-slide-up">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter">Client Roles</h2>
                    <p className="text-muted-foreground mt-1">Manage and create new job roles for your clients.</p>
                </div>
                <Button onClick={() => setIsJdDialogOpen(true)} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add New Role
                </Button>
            </div>

            {roles.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-in">
                    {roles.map((role, index) => (
                        <div className="relative group" key={role.id}>
                            <RoleCard 
                                role={role} 
                                onViewCandidates={onViewCandidates} 
                                onReEngage={onReEngage}
                                onFindTopMatches={handleFindTopMatches}
                                onFindAllQualified={handleFindAllQualified}
                                isMatching={isMatching && selectedRoleForMatching?.id === role.id}
                                style={{ '--stagger-index': index } as React.CSSProperties}
                            />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete "{role.title}"?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the role and unassign any candidates currently in this role.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDeleteRole(role.id, role.title)}>Confirm Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-secondary/30 rounded-lg">
                    <FolderSearch className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No client roles defined yet.</h3>
                    <p className="text-muted-foreground mt-2">Use the button above to add a new role.</p>
                </div>
            )}
            <GenerateJdDialog open={isJdDialogOpen} onOpenChange={setIsJdDialogOpen} onSave={onAddRole} />
            <MatchedCandidatesDialog
                isOpen={isMatchesDialogOpen}
                onClose={() => setIsMatchesDialogOpen(false)}
                matches={matchedCandidates}
                roleTitle={selectedRoleForMatching?.title || ''}
                onAssign={handleAssignRole}
                onAssignAll={handleAssignAllRoles}
            />
        </div>
    )
}
