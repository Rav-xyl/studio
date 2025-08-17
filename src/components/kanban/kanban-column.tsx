
import type { Candidate, KanbanStatus } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '../ui/scroll-area';
import { useDrop } from 'react-dnd';
import { FileQuestion, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface KanbanColumnProps {
  title: KanbanStatus;
  candidates: Candidate[];
  onCardClick: (candidate: Candidate) => void;
  onUpdateCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onDeleteAll: (status: KanbanStatus) => void;
}

export function KanbanColumn({ title, candidates, onCardClick, onUpdateCandidate, onDeleteCandidate, onDeleteAll }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'candidate',
    drop: (item: { candidate: Candidate }) => {
      onUpdateCandidate({ ...item.candidate, status: title });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const canDeleteAll = (title === 'Sourcing' || title === 'Screening') && candidates.length > 0;

  return (
    <div ref={drop} className={`flex flex-col rounded-lg bg-secondary/30 transition-colors ${isOver ? 'bg-secondary' : ''}`}>
      <div className="p-3 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b flex items-center justify-between">
        <h3 className="font-semibold text-foreground tracking-tight">
          {title} <span className="text-sm font-normal text-muted-foreground">{candidates.length}</span>
        </h3>
        {canDeleteAll && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Candidates in "{title}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {candidates.length} candidate(s). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteAll(title)}>Confirm Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <ScrollArea className="h-[calc(100vh-25rem)]">
        <div className="flex flex-1 flex-col gap-3 p-3 pt-0 stagger-in">
            {candidates.length > 0 ? candidates.map((candidate, index) => (
            <KanbanCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => onCardClick(candidate)}
                onDelete={onDeleteCandidate}
                className={`stagger-in-item`}
                style={{ '--stagger-index': index } as React.CSSProperties}
            />
            )) : (
                <div className='flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4'>
                    <FileQuestion className="w-10 h-10 mb-2" />
                    <p className='text-sm font-semibold'>Empty Column</p>
                    <p className='text-xs'>Drag candidates here to change their status.</p>
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
