
'use client';

import {
  FilterX,
  PlusCircle,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useMemo } from 'react';
import type { Candidate, KanbanStatus, JobRole } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BulkUploadDialog } from './bulk-upload-dialog';
import { db } from '@/lib/firebase';
import { writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const KANBAN_COLUMNS: KanbanStatus[] = [
  'Sourcing',
  'Screening',
  'Manual Review',
  'Interview',
  'Hired',
];

interface CandidatePoolTabProps {
    candidates: Candidate[];
    roles: JobRole[];
    onUpload: (files: FileList | null, companyType: 'startup' | 'enterprise') => void;
    onStimulateFullPipeline: () => void;
    filteredRole: JobRole | null;
    onClearFilter: () => void;
    onUpdateCandidate: (candidate: Candidate) => void;
    onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>, candidateToUpdate: Candidate) => void;
    onDeleteCandidate: (candidateId: string) => void;
}

export function CandidatePoolTab({
    candidates,
    roles,
    onUpload,
    onStimulateFullPipeline,
    filteredRole,
    onClearFilter,
    onUpdateCandidate,
    onAddRole,
    onDeleteCandidate,
}: CandidatePoolTabProps) {
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCardClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSheetOpen(true);
  };
  
  const onOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedCandidate(null);
    }
  }

  const displayedCandidates = useMemo(() => {
    const activeCandidates = candidates.filter(c => !c.archived);
    if (!filteredRole) {
      return activeCandidates;
    }
    return activeCandidates.filter(c => c.role === filteredRole.title);
  }, [candidates, filteredRole]);


  const columns = KANBAN_COLUMNS.map((status: KanbanStatus) => ({
    title: status,
    candidates: displayedCandidates.filter((c) => c.status === status),
  }));

  const handleDeleteAllInStatus = async (status: KanbanStatus) => {
    const candidatesToDelete = columns.find(col => col.title === status)?.candidates;
    if (!candidatesToDelete || candidatesToDelete.length === 0) {
      toast({ title: 'Nothing to delete', description: `There are no candidates in the "${status}" column.` });
      return;
    }

    try {
      const batch = writeBatch(db);
      const candidatesCollection = collection(db, 'candidates');
      const q = query(candidatesCollection, where('status', '==', status));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast({ title: 'Success', description: `Successfully deleted ${querySnapshot.size} candidates from "${status}".` });
    } catch (error) {
      console.error(`Failed to delete candidates from ${status}:`, error);
      toast({ title: 'Error', description: 'Could not delete candidates. See console for details.', variant: 'destructive' });
    }
  };


  return (
    <DndProvider backend={HTML5Backend}>
        <div className="fade-in-slide-up">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className='flex flex-col'>
            <h2 className="text-3xl font-bold tracking-tighter">
                Candidate Pipeline
            </h2>
            {filteredRole ? (
                <div className='flex items-center gap-2 mt-1'>
                    <span className='text-sm text-muted-foreground'>Filtering for:</span>
                    <span className='font-medium text-foreground'>{filteredRole.title}</span>
                    <Button variant="ghost" size="icon" className='h-6 w-6 text-muted-foreground hover:text-foreground' onClick={onClearFilter}>
                        <FilterX className='h-4 w-4'/>
                    </Button>
                </div>
            ) : (
                <p className='text-muted-foreground mt-1'>Manage candidates by dragging them through the hiring stages.</p>
            )}
            </div>
            
            <div className="flex items-center gap-2">
                <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Candidates
                </Button>
                
                <Button onClick={onStimulateFullPipeline} variant="secondary">
                  <Zap className="w-4 h-4 mr-2" /> Stimulate Pipeline
                </Button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {columns.map((col) => (
            <KanbanColumn
                key={col.title}
                title={col.title}
                candidates={col.candidates}
                onCardClick={handleCardClick}
                onUpdateCandidate={onUpdateCandidate}
                onDeleteCandidate={onDeleteCandidate}
                onDeleteAll={handleDeleteAllInStatus}
            />
            ))}
        </div>

        <BulkUploadDialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen} onUpload={onUpload} />

        <CandidateDetailSheet 
            open={isSheetOpen} 
            onOpenChange={onOpenChange} 
            candidate={selectedCandidate}
            roles={roles}
            onUpdateCandidate={onUpdateCandidate}
            onAddRole={onAddRole}
            onDeleteCandidate={onDeleteCandidate}
            />
        </div>
    </DndProvider>
  );
}
