
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
}


export function RolesTab({ roles, setRoles, onViewCandidates }: RolesTabProps) {
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
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100">Client Roles & Job Descriptions</h2>
                <Button onClick={() => setIsJdDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Synthesize New JD
                </Button>
            </div>

            {roles.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {roles.map(role => (
                        <RoleCard key={role.id} role={role} onViewCandidates={onViewCandidates} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 glass-card rounded-lg">
                    <FolderSearch className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300">No client roles defined yet.</h3>
                    <p className="text-slate-400 mt-2">Use the button above to synthesize a new Job Description.</p>
                </div>
            )}
            <GenerateJdDialog open={isJdDialogOpen} onOpenChange={setIsJdDialogOpen} onSave={handleAddRole} />
        </div>
    )
}
