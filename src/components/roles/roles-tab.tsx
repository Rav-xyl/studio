
'use client'
import type { Candidate, JobRole } from '@/lib/types';
import { PlusCircle, FolderSearch, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { GenerateJdDialog } from './generate-jd-dialog';
import { RoleCard } from './role-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface RolesTabProps {
    roles: JobRole[];
    candidates: Candidate[];
    onViewCandidates: (role: JobRole) => void;
    onReEngage: (role: JobRole) => void;
    onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>) => void;
    onDeleteRole: (roleId: string, roleTitle: string) => void;
    onFindMatches: (role: JobRole, mode: 'top' | 'qualified') => void;
}

type SortKey = 'title' | 'openings';

export function RolesTab({ roles, candidates, onViewCandidates, onReEngage, onAddRole, onDeleteRole, onFindMatches }: RolesTabProps) {
    const [isJdDialogOpen, setIsJdDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('title');

    const filteredAndSortedRoles = useMemo(() => {
        return roles
            .filter(role => role.title.toLowerCase().includes(searchTerm.toLowerCase()) || role.description.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sortKey === 'title') {
                    return a.title.localeCompare(b.title);
                }
                return b.openings - a.openings;
            });
    }, [roles, searchTerm, sortKey]);
    
    return (
        <div className="fade-in-slide-up">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter">Client Roles</h2>
                    <p className="text-muted-foreground mt-1">Manage and create new job roles for your clients.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search roles..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select onValueChange={(value) => setSortKey(value as SortKey)} defaultValue="title">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="title">Sort by Title</SelectItem>
                            <SelectItem value="openings">Sort by Openings</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsJdDialogOpen(true)} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Add New Role
                    </Button>
                </div>
            </div>

            {filteredAndSortedRoles.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-in">
                    {filteredAndSortedRoles.map((role, index) => (
                        <div className="relative group" key={role.id}>
                            <RoleCard 
                                role={role} 
                                onViewCandidates={onViewCandidates} 
                                onReEngage={onReEngage}
                                onFindMatches={onFindMatches}
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
                    <h3 className="text-xl font-semibold text-foreground">No Roles Found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search or add a new role.</p>
                </div>
            )}
            <GenerateJdDialog open={isJdDialogOpen} onOpenChange={setIsJdDialogOpen} onSave={onAddRole} />
        </div>
    )
}
