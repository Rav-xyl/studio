
'use client';

import {
  GitMerge,
  Lightbulb,
  Scan,
  ScanFace,
  Upload,
  Zap,
  FilterX,
  PlusCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useMemo } from 'react';
import type { Candidate, KanbanStatus, JobRole } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { KANBAN_COLUMNS } from '@/lib/mock-data';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BulkUploadDialog } from './bulk-upload-dialog';

interface CandidatePoolTabProps {
    candidates: Candidate[];
    onUpload: (files: FileList | null) => void;
    onScreenAll: () => void;
    onAryaReviewAll: () => void;
    onSuggestRoleMatches: () => void;
    onFindPotentialRoles: () => void;
    onStimulateFullPipeline: () => void;
    onProactiveSourcing: () => void;
    filteredRole: JobRole | null;
    onClearFilter: () => void;
    onUpdateCandidate: (candidate: Candidate) => void;
}

export function CandidatePoolTab({
    candidates,
    onUpload,
    onScreenAll,
    onAryaReviewAll,
    onSuggestRoleMatches,
    onFindPotentialRoles,
    onStimulateFullPipeline,
    onProactiveSourcing,
    filteredRole,
    onClearFilter,
    onUpdateCandidate
}: CandidatePoolTabProps) {
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);

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
    if (!filteredRole) {
      return candidates;
    }
    return candidates.filter(c => c.role === filteredRole.title);
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
                Candidate Screening Pool
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
                <p className='text-muted-foreground mt-1'>Drag & drop candidates to progress them through the hiring pipeline.</p>
            )}
            </div>
            
            <div className="flex items-center gap-2">
                <Button onClick={() => setUploadDialogOpen(true)} variant="outline" className='bg-background hover:bg-secondary'>
                  <Upload className="w-4 h-4 mr-2" /> Upload Resumes
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Zap className="w-4 h-4 mr-2" /> AI Actions <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className="bg-background border-border">
                    <DropdownMenuItem onClick={onScreenAll}><Scan className="w-4 h-4 mr-2" />Screen All New Resumes</DropdownMenuItem>
                    <DropdownMenuItem onClick={onAryaReviewAll}><ScanFace className="w-4 h-4 mr-2" />Arya, Review All</DropdownMenuItem>
                    <DropdownMenuItem onClick={onProactiveSourcing}><PlusCircle className="w-4 h-4 mr-2" />Proactive Sourcing</DropdownMenuItem>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onClick={onSuggestRoleMatches}><GitMerge className="w-4 h-4 mr-2" />Suggest Role Matches</DropdownMenuItem>
                    <DropdownMenuItem onClick={onFindPotentialRoles}><Lightbulb className="w-4 h-4 mr-2" />Find Potential Roles</DropdownMenuItem>
                    <DropdownMenuSeparator/>
                     <DropdownMenuItem onClick={onStimulateFullPipeline}><Zap className="w-4 h-4 mr-2 text-yellow-400" />Stimulate Full Pipeline</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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

        <BulkUploadDialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen} onUpload={onUpload} />

        <CandidateDetailSheet 
            open={isSheetOpen} 
            onOpenChange={onOpenChange} 
            candidate={selectedCandidate}
            onUpdateCandidate={onUpdateCandidate}
            />
        </div>
    </DndProvider>
  );
}
