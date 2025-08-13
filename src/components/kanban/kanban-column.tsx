import type { Candidate, KanbanStatus } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '../ui/scroll-area';
import { useDrop } from 'react-dnd';

interface KanbanColumnProps {
  title: KanbanStatus;
  candidates: Candidate[];
  onCardClick: (candidate: Candidate) => void;
  onUpdateCandidate: (candidate: Candidate) => void;
}

export function KanbanColumn({ title, candidates, onCardClick, onUpdateCandidate }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'candidate',
    drop: (item: { candidate: Candidate }) => {
      onUpdateCandidate({ ...item.candidate, status: title });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));


  return (
    <div ref={drop} className={`flex flex-col rounded-lg flex-shrink-0 w-[300px] transition-colors ${isOver ? 'bg-primary/20' : 'bg-secondary/30'}`}>
      <div className="p-3 sticky top-0 bg-secondary/30 backdrop-blur-sm z-10">
        <h3 className="font-semibold text-foreground">
          {title} <span className="text-sm font-normal text-muted-foreground">{candidates.length}</span>
        </h3>
      </div>
      <ScrollArea className="h-[calc(100vh-25rem)]">
        <div className="flex flex-1 flex-col gap-3 p-3 pt-0">
            {candidates.length > 0 ? candidates.map((candidate) => (
            <KanbanCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => onCardClick(candidate)}
            />
            )) : (
                <div className='flex items-center justify-center h-40'>
                    <p className='text-sm text-muted-foreground'>No candidates</p>
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
