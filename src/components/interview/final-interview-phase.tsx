
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bot, Send } from 'lucide-react';
import type { Candidate } from '@/lib/types';
import { conductFinalInterview } from '@/ai/flows/final-interview';
import { ScrollArea } from '../ui/scroll-area';

interface FinalInterviewPhaseProps {
    candidate: Candidate;
    onComplete: (report: string) => void;
}

// NOTE: This component is now effectively deprecated by the new flow.
// It is kept in the codebase for potential future use or alternative interview paths,
// but it is no longer called by the main Gauntlet component.

export function FinalInterviewPhase({ candidate, onComplete }: FinalInterviewPhaseProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [interviewData, setInterviewData] = useState<any | null>(null);

    useEffect(() => {
        const startInterview = async () => {
            setIsLoading(true);
            try {
                const result = await conductFinalInterview({
                    jobTitle: candidate.role,
                    jobDescription: "A demanding role requiring strong problem-solving and communication skills.",
                    candidateNarrative: candidate.narrative,
                });
                setInterviewData(result);
            } catch (error) {
                console.error("Failed to start final interview", error);
                toast({ title: 'Error', description: 'Could not generate the final interview.', variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        startInterview();
    }, [candidate, toast]);

    const handleCompleteInterview = () => {
        if (interviewData?.finalReport) {
            onComplete(interviewData.finalReport);
        } else {
            toast({ title: 'Error', description: 'Interview data is not available.', variant: 'destructive' });
        }
    };
    
    if (isLoading) {
        return (
           <div className="flex items-center justify-center h-screen bg-background text-foreground">
               <Loader2 className="animate-spin h-10 w-10 text-primary" />
               <p className='ml-4'>Preparing Final Interview with ARYA...</p>
           </div>
       )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl text-primary flex items-center justify-center gap-3"><Bot /> Final AI Interview</CardTitle>
                    <CardDescription>This is a simulated conversational interview with our AI, ARYA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">The AI has generated a series of questions and evaluated your simulated responses based on your profile.</p>
                    <ScrollArea className="h-72 w-full rounded-md border p-4 bg-secondary/50">
                       <div className="space-y-4">
                           {interviewData?.interviewTranscript.map((turn: any, index: number) => (
                               <div key={index}>
                                   <p className="font-semibold text-primary">ARYA: "{turn.question}"</p>
                                   <div className="mt-2 p-2 text-xs bg-background rounded-md border border-dashed">
                                       <p><strong>AI Evaluation:</strong> {turn.evaluation}</p>
                                       <p><strong>Score:</strong> {turn.score}/10</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                    </ScrollArea>
                    <Button onClick={handleCompleteInterview} className="w-full h-12 text-lg">
                        <Send className="mr-2 h-5 w-5" />
                        Acknowledge & Complete Final Phase
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

    