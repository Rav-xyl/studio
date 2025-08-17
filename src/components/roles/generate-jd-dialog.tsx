
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
import { Zap, Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { synthesizeJobDescription } from '@/ai/flows/automated-job-description-synthesis';
import type { JobRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface GenerateJdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newRole: Omit<JobRole, 'id' | 'openings'>) => void;
}

export function GenerateJdDialog({ open, onOpenChange, onSave }: GenerateJdDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [jobTitle, setJobTitle] = useState("");
    const [jd, setJd] = useState("");
    const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);

    const handleGenerate = async () => {
        if(!jd) {
            toast({title: "Job Description Required", description: "Please paste a job description to be analyzed.", variant: "destructive"});
            return;
        };
        setIsLoading(true);
        setSuggestedTitles([]);
        setJobTitle("");
        try {
            const result = await synthesizeJobDescription({
                jobDescriptionText: jd
            });
            setJd(result.formattedDescription);
            setSuggestedTitles(result.suggestedTitles);
            if (result.suggestedTitles.length > 0) {
                setJobTitle(result.suggestedTitles[0]); // pre-select the first suggestion
            }
            toast({title: "AI Analysis Complete", description: "Job description has been formatted and titles have been suggested."});
        } catch (error) {
            console.error("Failed to synthesize JD:", error);
            toast({title: "Error", description: "Could not analyze the job description.", variant: "destructive"});
        } finally {
            setIsLoading(false);
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
        setSuggestedTitles([]);
        onOpenChange(false);
    }
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client Role with AI</DialogTitle>
          <DialogDescription>
            Paste a job description below. The AI will standardize it and suggest relevant titles.
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
             <Button className="w-full" onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Analyze & Format JD
            </Button>
            {suggestedTitles.length > 0 && (
                <div className='space-y-2'>
                    <Label htmlFor="job-title">Suggested Job Titles</Label>
                    <Select onValueChange={setJobTitle} value={jobTitle}>
                        <SelectTrigger id="job-title">
                            <SelectValue placeholder="Select an AI-suggested title..." />
                        </SelectTrigger>
                        <SelectContent>
                            {suggestedTitles.map((title, index) => (
                                <SelectItem key={index} value={title}>{title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!jobTitle || !jd}>
            Save New Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
