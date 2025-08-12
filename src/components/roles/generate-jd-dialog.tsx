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

interface GenerateJdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const placeholderJd = `## About the Role

As a Senior Frontend Developer at [Your Company], you will be a key player in shaping the user experience of our flagship products. We're looking for someone who is passionate about building beautiful, performant, and accessible user interfaces that delight our customers. You'll work within a talented, cross-functional team to bring our vision to life.

## Responsibilities

- Develop and maintain web applications using React, TypeScript, and Next.js.
- Collaborate with Product Managers, UX Designers, and Backend Engineers to translate requirements into well-crafted features.
- Uphold high standards for code quality, performance, and accessibility.
- Mentor junior developers and contribute to our growing component library.

## Qualifications

- 5+ years of professional experience in frontend development.
- Expertise in modern JavaScript frameworks, particularly React.
- Strong proficiency with TypeScript.
- Experience with GraphQL and data-fetching libraries.
...
`;


export function GenerateJdDialog({ open, onOpenChange }: GenerateJdDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedJd, setGeneratedJd] = useState("");

    const handleGenerate = () => {
        setIsLoading(true);
        setTimeout(() => {
            setGeneratedJd(placeholderJd);
            setIsLoading(false);
        }, 1500);
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
                    <Input id="job-title" placeholder="e.g., Senior Frontend Developer" />
                </div>
                <div>
                    <Label htmlFor="company-info">Company Information (Optional)</Label>
                    <Textarea id="company-info" placeholder="Paste company website URL, values, or other info here..." className='h-48'/>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading} className='w-full'>
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
          <Button type="submit" disabled={!generatedJd}>Save Job Description</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
