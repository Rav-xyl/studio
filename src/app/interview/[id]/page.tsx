
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Video, Download, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateInterviewQuestions } from '@/ai/flows/dynamic-interview-question-generation';
import { evaluateInterviewResponse } from '@/ai/flows/evaluate-interview-response';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { finalInterviewReview } from '@/ai/flows/final-interview-review';

const mockCandidateData = {
    'cand-123': {
        name: 'Aisha Sharma',
        role: 'Senior Frontend Developer',
        narrative: 'Experienced frontend developer with 8 years of experience in React, Next.js, and building scalable web applications. Passionate about user experience and performance.',
        analysis: 'A promising candidate with strong skills in their domain.'
    }
}

const DUMMY_JOB_DESCRIPTION = "Seeking a Senior Frontend Developer with expertise in React, Next.js, and TypeScript. The ideal candidate will have experience building and deploying complex, high-performance web applications. Strong communication and problem-solving skills are a must.";

type ConversationEntry = {
    speaker: 'ARYA' | 'Candidate';
    text: string;
    evaluation?: any;
};

export default function InterviewPage({ params: { id: candidateId } }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    
    const candidate = (mockCandidateData as any)[candidateId]; 

    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings to continue.',
            });
          }
        };
    
        getCameraPermission();
      }, [toast]);

    useEffect(() => {
        if (!candidate) return;
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const result = await generateInterviewQuestions({
                    resumeText: candidate.narrative,
                    jobDescription: DUMMY_JOB_DESCRIPTION,
                    candidateAnalysis: candidate.analysis,
                });
                setQuestions(result.questions);
                if (result.questions.length > 0) {
                    setConversation([{ speaker: 'ARYA', text: result.questions[0] }]);
                }
            } catch (error) {
                console.error("Failed to generate questions", error);
                toast({ title: 'Error', description: 'Could not generate interview questions.', variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [candidate, toast]);

    const handleNextQuestion = async () => {
        const placeholderResponse = "Based on my experience, I would approach this by first analyzing the requirements, then creating a plan and executing it with my team, ensuring clear communication and milestone tracking throughout the project lifecycle.";
        
        // Add candidate response to transcript
        const candidateEntry: ConversationEntry = { speaker: 'Candidate', text: placeholderResponse };
        setConversation(prev => [...prev, candidateEntry]);
        
        setIsLoading(true);
        try {
            const result = await evaluateInterviewResponse({
                question: questions[currentQuestionIndex],
                candidateResponse: placeholderResponse,
                jobDescription: DUMMY_JOB_DESCRIPTION
            });

            // Update conversation with evaluation
            setConversation(prev => {
                const newConversation = [...prev];
                const lastAryaMessageIndex = newConversation.findLastIndex(c => c.speaker === 'ARYA');
                if(lastAryaMessageIndex !== -1) {
                    newConversation[lastAryaMessageIndex] = { ...newConversation[lastAryaMessageIndex], evaluation: result };
                }
                return newConversation;
            });

            if (currentQuestionIndex < questions.length - 1) {
                const nextQuestionIndex = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextQuestionIndex);
                // Add next AI question to transcript
                setConversation(prev => [...prev, { speaker: 'ARYA', text: questions[nextQuestionIndex] }]);
            } else {
                setIsFinished(true);
            }
        } catch (error) {
             console.error("Failed to evaluate response", error);
            toast({ title: 'Error', description: 'Could not evaluate the interview response.', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };

    const generateReport = () => {
        let reportContent = `INTERVIEW REPORT\n\n`;
        reportContent += `Candidate: ${candidate.name}\n`;
        reportContent += `Role: ${candidate.role}\n`;
        reportContent += `Date: ${new Date().toLocaleDateString()}\n\n`;
        reportContent += `--- TRANSCRIPT & EVALUATION ---\n\n`;

        conversation.forEach(entry => {
            if (entry.speaker === 'ARYA') {
                reportContent += `ARYA:\n${entry.text}\n\n`;
                if(entry.evaluation) {
                    reportContent += `EVALUATION:\n`;
                    reportContent += `  - Score: ${entry.evaluation.score}/10\n`;
                    reportContent += `  - Feedback: ${entry.evaluation.evaluation}\n`;
                    if (entry.evaluation.followUpQuestion) {
                        reportContent += `  - Suggested Follow-up: ${entry.evaluation.followUpQuestion}\n`;
                    }
                    reportContent += `\n`;
                }
            } else {
                reportContent += `CANDIDATE:\n${entry.text}\n\n`;
            }
        });
        
        reportContent += `--- END OF REPORT ---`;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview_report_${candidate.name.replace(' ', '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!candidate) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <Card className="glass-card text-center p-8">
                    <AlertTitle>Candidate Not Found</AlertTitle>
                    <AlertDescription>The candidate you are trying to interview does not exist.</AlertDescription>
                    <Button onClick={() => router.push('/')} className="mt-4">Return to Dashboard</Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl glass-card grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardHeader className="lg:col-span-2">
                    <CardTitle className="text-3xl text-primary flex items-center gap-3"><Brain /> DPDG-Compliant AI Video Interview</CardTitle>
                    <p className="text-muted-foreground">with {candidate.name} for the role of {candidate.role}</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                        </div>
                         { !hasCameraPermission && (
                            <Alert variant="destructive">
                                <Video className="h-4 w-4" />
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>Please allow camera access in your browser to use this feature.</AlertDescription>
                            </Alert>
                        )}
                        <div className="pt-4">
                             {isFinished ? (
                                <div className='text-center p-6 bg-secondary rounded-lg'>
                                    <h3 className='text-2xl font-bold text-green-400'>Interview Complete!</h3>
                                    <p className='text-muted-foreground mt-2'>The initial evaluation is finished. Generate the report for final review.</p>
                                    <div className="flex gap-4 justify-center">
                                        <Button onClick={generateReport} className="mt-6">
                                            <Download className="mr-2 h-4 w-4" />
                                            Generate Interview Report
                                        </Button>
                                        <Button onClick={() => router.push('/')} className="mt-6" variant="outline">
                                            Return to Dashboard
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button onClick={handleNextQuestion} disabled={isLoading || !hasCameraPermission} className="w-full h-12 text-lg">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Mic className="mr-2 h-5 w-5" />}
                                    {currentQuestionIndex === questions.length - 1 ? 'Submit Final Answer' : 'Submit Answer & Next Question'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardContent>
                    <h3 className="text-xl font-semibold mb-2 text-center">Live Transcript</h3>
                    <ScrollArea className="h-[60vh] bg-secondary/30 p-4 rounded-lg border border-border">
                        <div className="space-y-6">
                            {conversation.map((entry, index) => (
                                <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'Candidate' ? 'flex-row-reverse' : ''}`}>
                                     <Avatar>
                                        <AvatarFallback className={entry.speaker === 'ARYA' ? 'bg-primary' : 'bg-slate-600'}>
                                            {entry.speaker === 'ARYA' ? 'AI' : 'C'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`p-3 rounded-lg max-w-md ${entry.speaker === 'ARYA' ? 'bg-secondary' : 'bg-primary/80'}`}>
                                        <p className="text-sm">{entry.text}</p>
                                        {entry.evaluation && (
                                            <div className="mt-2 pt-2 border-t border-t-slate-500/50">
                                                <p className="text-xs text-slate-300">
                                                    <strong>Evaluation: </strong>{entry.evaluation.evaluation} (Score: {entry.evaluation.score}/10)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                             {isLoading && conversation.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <Avatar><AvatarFallback className='bg-primary'>AI</AvatarFallback></Avatar>
                                    <div className="p-3 rounded-lg max-w-md bg-secondary animate-pulse">
                                        <p className="text-sm">Evaluating response and preparing next question...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

    