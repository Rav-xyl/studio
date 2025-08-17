import type { Candidate } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, Star, Users, Briefcase, CheckCircle, ShieldAlert, Video, Trash2 } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface KanbanCardProps {
  candidate: Candidate;
  onClick: () => void;
  onDelete: (candidateId: string) => void;
  className?: string;
}

const getInitials = (name: string) => {
    if (!name) return '??';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

const StatusInfo = ({ status, candidate }: { status: string, candidate: Candidate }) => {
    const hasFailedGauntlet = candidate.gauntletState?.phase === 'Failed';

    if (hasFailedGauntlet) {
        return <><ShieldAlert className="h-3 w-3 text-destructive"/><span>Gauntlet Failed</span></>;
    }

    switch (status) {
        case 'Sourcing': return <><Users className="h-3 w-3"/><span>New Candidate</span></>;
        case 'Screening': return <><CheckCircle className="h-3 w-3 text-green-500"/><span>Screening Passed</span></>;
        case 'Interview': return <><Video className="h-3 w-3 text-blue-500"/><span>AI Video Interview</span></>;
        default: return <><Clock className='h-3 w-3'/><span>{new Date(candidate.lastUpdated).toLocaleDateString()}</span></>;
    }
};

export function KanbanCard({ candidate, onClick, onDelete, className }: KanbanCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'candidate',
    item: { candidate },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const hasFailedGauntlet = candidate.gauntletState?.phase === 'Failed';
  
  return (
    <Card
      ref={drag}
      className={cn(
        'bg-card group relative cursor-pointer hover:border-primary/50 transition-all border',
        isDragging ? 'opacity-30' : 'opacity-100',
        hasFailedGauntlet && 'border-destructive/50 bg-destructive/10',
        className
        )}
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete {candidate.name}'s profile. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete(candidate.id); }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div onClick={onClick}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={candidate.avatarUrl} alt={candidate.name} data-ai-hint="person" />
              <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground truncate">{candidate.name}</p>
              <p className="text-sm text-muted-foreground">{candidate.role}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
            {candidate.skills.length > 3 && (
              <Badge variant="secondary">+{candidate.skills.length - 3}</Badge>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className='flex items-center gap-1.5'>
                  <StatusInfo status={candidate.status} candidate={candidate} />
              </div>
              {candidate.aiInitialScore && (
                  <div className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="h-3 w-3" />
                      <span>{Math.round(candidate.aiInitialScore)}</span>
                  </div>
              )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
