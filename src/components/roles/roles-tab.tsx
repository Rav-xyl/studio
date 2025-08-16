'use client'
import type { JobRole } from '@/lib/types';
import { PlusCircle, FolderSearch, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { GenerateJdDialog } from './generate-jd-dialog';
import { RoleCard } from './role-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface RolesTabProps {
    roles: JobRole[];
    onViewCandidates: (role: JobRole) => void;
    onReEngage: (role: JobRole) => void;
    onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>) => void;
    onDeleteRole: (roleId: string, roleTitle: string) => void;
}


export function RolesTab({ roles, onViewCandidates, onReEngage, onAddRole, onDeleteRole }: RolesTabProps) {
    const [isJdDialogOpen, setIsJdDialogOpen] = useState(false);
    
    return (
        <div className="fade-in-slide-up">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter">Client Roles</h2>
                    <p className="text-muted-foreground mt-1">Manage and create new job roles for your clients.</p>
                </div>
                <Button onClick={() => setIsJdDialogOpen(true)} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Synthesize New JD
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
                    <p className="text-muted-foreground mt-2">Use the button above to synthesize a new Job Description.</p>
                </div>
            )}
            <GenerateJdDialog open={isJdDialogOpen} onOpenChange={setIsJdDialogOpen} onSave={onAddRole} />
        </div>
    )
}
