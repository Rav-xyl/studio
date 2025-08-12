'use client';

import { useState } from 'react';
import { KANBAN_COLUMNS, mockCandidates } from '@/lib/mock-data';
import { KanbanColumn } from './kanban-column';
import type { Candidate, KanbanStatus } from '@/lib/types';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { Button } from '../ui/button';
import { Plus, Upload } from 'lucide-react';
import { BulkUploadDialog } from './bulk-upload-dialog';

export function KanbanBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleCardClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSheetOpen(true);
  };
  
  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedCandidate(null);
    }
  };

  const columns = KANBAN_COLUMNS.map((status: KanbanStatus) => ({
    id: status,
    title: status,
    candidates: candidates.filter((c) => c.status === status),
  }));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">All Candidates</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-flow-col auto-cols-[280px] gap-4 pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              title={column.title}
              candidates={column.candidates}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>
      <CandidateDetailSheet 
        open={isSheetOpen}
        onOpenChange={handleSheetChange}
        candidate={selectedCandidate}
      />
      <BulkUploadDialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </>
  );
}
