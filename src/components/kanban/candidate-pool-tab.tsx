
'use client';

import {
  GitMerge,
  Lightbulb,
  Scan,
  ScanFace,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useState, useRef } from 'react';
import type { Candidate, KanbanStatus } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { KANBAN_COLUMNS } from '@/lib/mock-data';

interface CandidatePoolTabProps {
    candidates: Candidate[];
    onUpload: (files: FileList | null) => void;
    onScreenAll: () => void;
    onAryaReviewAll: () => void;
    onSuggestRoleMatches: () => void;
    onFindPotentialRoles: () => void;
    onStimulateFullPipeline: () => void;
}

export function CandidatePoolTab({
    candidates,
    onUpload,
    onScreenAll,
    onAryaReviewAll,
    onSuggestRoleMatches,
    onFindPotentialRoles,
    onStimulateFullPipeline
}: CandidatePoolTabProps) {
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSheetOpen(true);
  };
  
  const handleUpdateCandidate = (updatedCandidate: Candidate) => {
    // This function will be called from the detail sheet to update the candidate in the main list
    const index = candidates.findIndex(c => c.id === updatedCandidate.id);
    if (index !== -1) {
        const newCandidates = [...candidates];
        newCandidates[index] = updatedCandidate;
        // In a real app, you'd call a state setter here, e.g., setCandidates(newCandidates);
        // For now, we rely on the parent component's state management.
    }
  }

  const onOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedCandidate(null);
    }
  }

  const columns = KANBAN_COLUMNS.map((status: KanbanStatus) => ({
    title: status,
    candidates: candidates.filter((c) => c.status === status),
  }));

  return (
    <div className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold text-slate-100">
          Candidate Screening Pool
        </h2>
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
      
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => onUpload(e.target.files)}
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="btn-secondary px-4 py-2">
          <Upload className="w-5 h-5" /> Upload Resumes
        </Button>

        <Button className="btn-primary px-4 py-2" onClick={onScreenAll}>
          <Scan className="w-5 h-5" /> Screen All Resumes
        </Button>
        <Button className="btn-primary px-4 py-2" onClick={onAryaReviewAll}>
          <ScanFace className="w-5 h-5" /> Arya, Review All
        </Button>

        <Button variant="secondary" className="btn-secondary px-4 py-2" onClick={onSuggestRoleMatches}>
          <GitMerge className="w-5 h-5" /> Suggest Role Matches
        </Button>
        <Button variant="secondary" className="btn-secondary px-4 py-2" onClick={onFindPotentialRoles}>
          <Lightbulb className="w-5 h-5" /> Find Potential Roles
        </Button>
        <Button className="btn-primary px-4 py-2" onClick={onStimulateFullPipeline}>
          <Zap className="w-5 h-5" /> Stimulate Full Pipeline
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
        onUpdateCandidate={handleUpdateCandidate}
        />
    </div>
  );
}

    