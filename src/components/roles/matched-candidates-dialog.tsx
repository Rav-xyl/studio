'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { PlusCircle, UserSearch } from 'lucide-react';

interface MatchedCandidatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matches: any[];
  roleTitle: string;
  onAssign: (candidateId: string) => void;
}

export function MatchedCandidatesDialog({ isOpen, onClose, matches, roleTitle, onAssign }: MatchedCandidatesDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Top Candidate Matches for "{roleTitle}"</DialogTitle>
          <DialogDescription>
            The AI has identified these candidates as a strong fit for this role.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4 border rounded-md p-2 bg-secondary/30">
            <div className='p-4 space-y-4'>
            {matches.length > 0 ? (
                matches.map(match => (
                    <div key={match.candidateId} className="p-4 rounded-lg bg-background border flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{match.candidateName}</h3>
                                <Badge variant="secondary">Score: {match.confidenceScore}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{match.justification}</p>
                        </div>
                        <Button size="sm" onClick={() => onAssign(match.candidateId)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Assign to Role
                        </Button>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
                    <UserSearch className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">No Strong Matches Found</h3>
                    <p className="mt-2">The AI could not find any suitable candidates in the "Unassigned" pool for this role.</p>
                </div>
            )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
