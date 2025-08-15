
'use client'
import type { JobRole } from '@/lib/types';
import { PlusCircle, FolderSearch } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { GenerateJdDialog } from './generate-jd-dialog';
import { RoleCard } from './role-card';

interface RolesTabProps {
    roles: JobRole[];
    setRoles: React.Dispatch<React.SetStateAction<JobRole[]>>;
    onViewCandidates: (role: JobRole) => void;
    onReEngage: (role: JobRole) => void;
}


export function RolesTab({ roles, setRoles, onViewCandidates, onReEngage }: RolesTabProps) {
    const [isJdDialogOpen, setIsJdDialogOpen] = useState(false);

    const handleAddRole = (newRole: Omit<JobRole, 'id' | 'openings'>) => {
        const fullNewRole: JobRole = {
            id: `role-${Date.now()}`,
            ...newRole,
            openings: 1, // Start with 1 opening by default
        };
        setRoles(prev => [...prev, fullNewRole]);
    }

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
                        <RoleCard 
                            key={role.id} 
                            role={role} 
                            onViewCandidates={onViewCandidates} 
                            onReEngage={onReEngage}
                            style={{ '--stagger-index': index } as React.CSSProperties}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-secondary/30 rounded-lg">
                    <FolderSearch className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No client roles defined yet.</h3>
                    <p className="text-muted-foreground mt-2">Use the button above to synthesize a new Job Description.</p>
                </div>
            )}
            <GenerateJdDialog open={isJdDialogOpen} onOpenChange={setIsJdDialogOpen} onSave={handleAddRole} />
        </div>
    )
}
