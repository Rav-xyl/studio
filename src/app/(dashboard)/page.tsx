import { KanbanBoard } from '@/components/kanban/kanban-board';

export default function PipelinePage() {
  return (
    <div className="flex h-full flex-col">
      <KanbanBoard />
    </div>
  );
}
