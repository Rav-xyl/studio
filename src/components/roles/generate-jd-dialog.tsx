'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, Lightbulb } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { synthesizeJobDescription } from '@/ai/flows/automated-job-description-synthesis';
import type { JobRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { suggestRoleMatches } from '@/ai/flows/suggest-role-matches'; // This is a bit of a hack, but it can extract titles.

interface GenerateJdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newRole: Omit<JobRole, 'id' | 'openings'>) => void;
}

export function GenerateJdDialog({ open, onOpenChange, onSave }: GenerateJdDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [jobTitle, setJobTitle] = useState("");
    const [jd, setJd] = useState("");

    const handleSuggestTitle = async () => {
        if(!jd) return;
        setIsSuggesting(true);
        try {
            // We use suggestRoleMatches as a proxy to get a title from a description.
            const result = await suggestRoleMatches({
                candidateName: "Fictional Candidate",
                candidateSkills: "",
                candidateNarrative: jd,
                candidateInferredSkills: "",
            });
            if(result.roles.length > 0) {
                setJobTitle(result.roles[0].roleTitle);
                toast({title: "AI Suggestion", description: "Job title has been suggested based on the description."});
            } else {
                toast({title: "Could not suggest a title.", variant: "destructive"});
            }
        } catch (error) {
            console.error("Failed to suggest title:", error);
            toast({title: "Error", description: "Could not suggest a title.", variant: "destructive"});
        } finally {
            setIsSuggesting(false);
        }
    }

    const handleSave = () => {
        if (!jd || !jobTitle) {
             toast({title: "Missing Information", description: "Please ensure both Job Title and Description are filled.", variant: "destructive"});
            return;
        }
        onSave({
            title: jobTitle,
            department: "Uncategorized", // Default department
            description: jd,
        });
        // Reset state and close
        setJobTitle("");
        setJd("");
        onOpenChange(false);
    }
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client Role</DialogTitle>
          <DialogDescription>
            Provide a job description to create a new role. You can use the AI to suggest a title.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className='space-y-2'>
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea 
                    id="job-description" 
                    placeholder="Paste the full job description here..." 
                    className='h-48 font-mono text-xs' 
                    value={jd} 
                    onChange={(e) => setJd(e.target.value)} 
                />
            </div>
            <div className='space-y-2'>
                <div className="flex items-center justify-between">
                    <Label htmlFor="job-title">Job Title</Label>
                    <Button variant="ghost" size="sm" onClick={handleSuggestTitle} disabled={isSuggesting || !jd}>
                         {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                        Suggest Title from JD
                    </Button>
                </div>
                <Input 
                    id="job-title" 
                    placeholder="e.g., Senior Frontend Developer" 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)} 
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save New Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
