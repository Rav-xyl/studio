import type { Candidate } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface KanbanCardProps {
  candidate: Candidate;
  onClick: () => void;
  className?: string;
}

export function KanbanCard({ candidate, onClick, className }: KanbanCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <Card
      onClick={onClick}
      className={cn('glass-card cursor-pointer hover:border-primary/80 transition-all', className)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={candidate.avatarUrl} alt={candidate.name} data-ai-hint="person" />
            <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{candidate.name}</p>
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
            <div className='flex items-center gap-1'>
                <Clock className='h-3 w-3'/>
                <span>{candidate.lastUpdated}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
