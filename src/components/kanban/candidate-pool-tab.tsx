
'use client';

import {
  GitMerge,
  Lightbulb,
  Scan,
  ScanFace,
  Upload,
  Zap,
  FilterX,
  PlusCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useState, useRef, useMemo } from 'react';
import type { Candidate, KanbanStatus, JobRole } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { KANBAN_COLUMNS } from '@/lib/mock-data';

interface CandidatePoolTabProps {
    candidates: Candidate[];
    roles: JobRole[];
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
    roles,
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
    // A more complex filter could check for skill overlap.
    return candidates.filter(c => c.role === filteredRole.title);
  }, [candidates, filteredRole]);


  const columns = KANBAN_COLUMNS.map((status: KanbanStatus) => ({
    title: status,
    candidates: displayedCandidates.filter((c) => c.status === status),
  }));

  return (
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

        <Button className="btn-primary" onClick={onScreenAll}>
          <Scan className="w-4 h-4" /> Screen All
        </Button>
        <Button className="btn-primary" onClick={onAryaReviewAll}>
          <ScanFace className="w-4 h-4" /> Arya, Review All
        </Button>
         <Button variant="secondary" onClick={onProactiveSourcing}>
            <PlusCircle className="w-4 h-4" /> Proactive Sourcing
        </Button>

        <div className="flex-grow"></div>

        <Button variant="outline" onClick={onSuggestRoleMatches}>
          <GitMerge className="w-4 h-4" /> Suggest Role Matches
        </Button>
        <Button variant="outline" onClick={onFindPotentialRoles}>
          <Lightbulb className="w-4 h-4" /> Find Potential Roles
        </Button>
        <Button className="btn-primary" onClick={onStimulateFullPipeline}>
          <Zap className="w-4 h-4" /> Stimulate Full Pipeline
        </Button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.title}
            title={col.title}
            candidates={col.candidates}
            onCardClick={handleCardClick}
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
  );
}
