'use client';

import {
  FilterX,
  PlusCircle,
  Zap,
  TestTube2,
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
import { deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const KANBAN_COLUMNS: KanbanStatus[] = [
  'Sourcing',
  'Screening',
  'Interview',
  'Hired',
];

interface CandidatePoolTabProps {
    candidates: Candidate[];
    onUpload: (files: FileList | null, isAudit?: boolean) => void;
    onStimulateFullPipeline: () => void;
    filteredRole: JobRole | null;
    onClearFilter: () => void;
    onUpdateCandidate: (candidate: Candidate) => void;
    onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>, candidateToUpdate: Candidate) => void;
}

export function CandidatePoolTab({
    candidates,
    onUpload,
    onStimulateFullPipeline,
    filteredRole,
    onClearFilter,
    onUpdateCandidate,
    onAddRole,
}: CandidatePoolTabProps) {
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isAuditMode, setIsAuditMode] = useState(false);
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

  const handleDeleteCandidate = async (candidateId: string) => {
      try {
          await deleteDoc(doc(db, 'candidates', candidateId));
          toast({ title: "Candidate Deleted", description: "The candidate has been permanently removed." });
      } catch (error) {
          console.error("Failed to delete candidate:", error);
          toast({ title: "Deletion Failed", description: "Could not delete the candidate. See console for details.", variant: 'destructive' });
      }
  }

  const handleOpenUploadDialog = (auditMode = false) => {
      setIsAuditMode(auditMode);
      setUploadDialogOpen(true);
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
                <Button onClick={() => handleOpenUploadDialog(false)} variant="outline">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Candidates
                </Button>
                
                <Button onClick={onStimulateFullPipeline} variant="secondary">
                  <Zap className="w-4 h-4 mr-2" /> Stimulate Pipeline
                </Button>

                <Button onClick={() => handleOpenUploadDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <TestTube2 className="w-4 h-4 mr-2" /> Run SAARTHI Audit
                </Button>
            </div>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 -mx-10 px-10">
            {columns.map((col) => (
            <KanbanColumn
                key={col.title}
                title={col.title}
                candidates={col.candidates}
                onCardClick={handleCardClick}
                onUpdateCandidate={onUpdateCandidate}
            />
            ))}
        </div>

        <BulkUploadDialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen} onUpload={onUpload} isAudit={isAuditMode} />

        <CandidateDetailSheet 
            open={isSheetOpen} 
            onOpenChange={onOpenChange} 
            candidate={selectedCandidate}
            onUpdateCandidate={onUpdateCandidate}
            onAddRole={onAddRole}
            onDeleteCandidate={handleDeleteCandidate}
            />
        </div>
    </DndProvider>
  );
}
