import type { Candidate } from '@/lib/types';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  title: string;
  candidates: Candidate[];
  onCardClick: (candidate: Candidate) => void;
}

export function KanbanColumn({ title, candidates, onCardClick }: KanbanColumnProps) {
  return (
    <div className="flex flex-col rounded-lg bg-secondary/50">
      <div className="p-3">
        <h3 className="font-semibold text-foreground">
          {title} <span className="text-sm font-normal text-muted-foreground">{candidates.length}</span>
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3 pt-0 overflow-y-auto">
        {candidates.map((candidate) => (
          <KanbanCard
            key={candidate.id}
            candidate={candidate}
            onClick={() => onCardClick(candidate)}
          />
        ))}
      </div>
    </div>
  );
}
