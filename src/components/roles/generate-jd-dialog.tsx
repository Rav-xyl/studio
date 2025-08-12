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
import { ScrollArea } from '../ui/scroll-area';
import { synthesizeJobDescription } from '@/ai/flows/automated-job-description-synthesis';
import type { JobRole } from '@/lib/types';

interface GenerateJdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newRole: Omit<JobRole, 'id' | 'openings'>) => void;
}


export function GenerateJdDialog({ open, onOpenChange, onSave }: GenerateJdDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [jobTitle, setJobTitle] = useState("");
    const [companyInfo, setCompanyInfo] = useState("");
    const [generatedJd, setGeneratedJd] = useState("");

    const handleGenerate = async () => {
        if(!jobTitle) return;
        setIsLoading(true);
        try {
            const result = await synthesizeJobDescription({ jobTitle, companyInformation: companyInfo });
            setGeneratedJd(result.jobDescription);
        } catch (error) {
            console.error("Failed to synthesize JD:", error);
            // You might want to show a toast notification here
        } finally {
            setIsLoading(false);
        }
    }

    const handleSave = () => {
        if (!generatedJd || !jobTitle) return;
        onSave({
            title: jobTitle,
            department: "Uncategorized", // Default department
            description: generatedJd,
        });
        // Reset state and close
        setJobTitle("");
        setCompanyInfo("");
        setGeneratedJd("");
        onOpenChange(false);
    }
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle>Automated Job Description Synthesis</DialogTitle>
          <DialogDescription>
            Enter a job title and optional company info. AI will analyze public data to synthesize a tailored job description.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className='space-y-4'>
                <div>
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input id="job-title" placeholder="e.g., Senior Frontend Developer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="company-info">Company Information (Optional)</Label>
                    <Textarea id="company-info" placeholder="Paste company website URL, values, or other info here..." className='h-48' value={companyInfo} onChange={(e) => setCompanyInfo(e.target.value)} />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !jobTitle} className='w-full'>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Zap className="mr-2 h-4 w-4" />
                    )}
                    Synthesize Description
                </Button>
            </div>
            <div className='flex flex-col'>
                <Label>Generated Description</Label>
                <ScrollArea className="h-72 w-full rounded-md border bg-secondary/50 p-4 mt-2">
                    {generatedJd ? (
                        <pre className="text-sm whitespace-pre-wrap font-sans">{generatedJd}</pre>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>AI-generated content will appear here.</p>
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!generatedJd}>Save Job Description</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
