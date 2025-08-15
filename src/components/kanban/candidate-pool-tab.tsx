
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useRef, useMemo } from 'react';
import type { Candidate, KanbanStatus, JobRole } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { KANBAN_COLUMNS } from '@/lib/mock-data';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Simple filter: Check if candidate role matches the filtered role title.
    return candidates.filter(c => c.role === filteredRole.title);
  }, [candidates, filteredRole]);


  const columns = KANBAN_COLUMNS.map((status: KanbanStatus) => ({
    title: status,
    candidates: displayedCandidates.filter((c) => c.status === status),
  }));

  return (
    <DndProvider backend={HTML5Backend}>
        <div className="fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className='flex flex-col'>
            <h2 className="text-3xl font-bold text-slate-100">
                Candidate Screening Pool
            </h2>
            {filteredRole && (
                <div className='flex items-center gap-2 mt-2'>
                <span className='text-sm text-muted-foreground'>Filtering for:</span>
                <span className='font-semibold text-primary'>{filteredRole.title}</span>
                <Button variant="ghost" size="icon" className='h-6 w-6' onClick={onClearFilter}>
                    <FilterX className='h-4 w-4'/>
                </Button>
                </div>
            )}
            </div>
            <div className="flex items-center gap-2">
            <label
                htmlFor="company-type-select-main"
                className="text-slate-100 text-sm"
            >
                Hiring For:
            </label>
            <Select defaultValue="startup">
                <SelectTrigger
                id="company-type-select-main"
                className="bg-slate-700 border-slate-600 w-[200px]"
                >
                <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="startup">Startup (Versatile)</SelectItem>
                <SelectItem value="enterprise">Enterprise (Specialized)</SelectItem>
                </SelectContent>
            </Select>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => onUpload(e.target.files)}
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
              <Upload className="w-4 h-4" /> Upload Resumes
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="btn-primary">
                  <Zap className="w-4 h-4" /> AI Actions <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                <DropdownMenuItem onClick={onScreenAll}><Scan className="w-4 h-4 mr-2" />Screen All New Resumes</DropdownMenuItem>
                <DropdownMenuItem onClick={onAryaReviewAll}><ScanFace className="w-4 h-4 mr-2" />Arya, Review All</DropdownMenuItem>
                <DropdownMenuItem onClick={onProactiveSourcing}><PlusCircle className="w-4 h-4 mr-2" />Proactive Sourcing</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-600"/>
                <DropdownMenuItem onClick={onSuggestRoleMatches}><GitMerge className="w-4 h-4 mr-2" />Suggest Role Matches</DropdownMenuItem>
                <DropdownMenuItem onClick={onFindPotentialRoles}><Lightbulb className="w-4 h-4 mr-2" />Find Potential Roles</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-600"/>
                 <DropdownMenuItem onClick={onStimulateFullPipeline}><Zap className="w-4 h-4 mr-2 text-yellow-400" />Stimulate Full Pipeline</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

        </div>
        <div className="flex gap-6 overflow-x-auto pb-4">
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
