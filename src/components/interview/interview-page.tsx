'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateInterviewQuestions } from '@/ai/flows/dynamic-interview-question-generation';
import { evaluateInterviewResponse } from '@/ai/flows/evaluate-interview-response';

const mockCandidateData = {
    'cand-123': {
        name: 'Aisha Sharma',
        role: 'Senior Frontend Developer',
        narrative: 'Experienced frontend developer with 8 years of experience in React, Next.js, and building scalable web applications. Passionate about user experience and performance.',
        analysis: 'A promising candidate with strong skills in their domain.'
    }
}

const DUMMY_JOB_DESCRIPTION = "Seeking a Senior Frontend Developer with expertise in React, Next.js, and TypeScript. The ideal candidate will have experience building and deploying complex, high-performance web applications. Strong communication and problem-solving skills are a must.";


export function InterviewPage({ candidateId }: { candidateId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    
    // In a real app, you'd fetch this from your state management or API
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
        // In a real app, you would process the video response here.
        // For this simulation, we'll use a placeholder response.
        const placeholderResponse = "Based on my experience, I would approach this by first analyzing the requirements, then creating a plan and executing it with my team.";

        setIsLoading(true);
        try {
            const result = await evaluateInterviewResponse({
                question: questions[currentQuestionIndex],
                candidateResponse: placeholderResponse,
                jobDescription: DUMMY_JOB_DESCRIPTION
            });
            setEvaluations(prev => [...prev, { question: questions[currentQuestionIndex], ...result }]);

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
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
            <Card className="w-full max-w-4xl glass-card">
                <CardHeader>
                    <CardTitle className="text-3xl text-primary">AI Video Interview</CardTitle>
                    <p className="text-muted-foreground">with {candidate.name} for the role of {candidate.role}</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                        </div>
                         { !hasCameraPermission && (
                            <Alert variant="destructive">
                                <Video className="h-4 w-4" />
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access in your browser to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <div className="space-y-4 flex flex-col justify-between">
                        {isFinished ? (
                            <div className='text-center p-8 bg-secondary rounded-lg'>
                                <h3 className='text-2xl font-bold text-green-400'>Interview Complete!</h3>
                                <p className='text-muted-foreground mt-2'>Thank you for your time. The hiring team will be in touch with the next steps.</p>
                                <p className='text-xs mt-4'>Final Score (Average): { (evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length).toFixed(1) } / 10</p>
                                <Button onClick={() => router.push('/')} className="mt-6">Return to Dashboard</Button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
                                    <h3 className="text-xl font-semibold mt-2">
                                        {isLoading && !questions[currentQuestionIndex] ? 'Generating questions...' : questions[currentQuestionIndex]}
                                    </h3>
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-lg h-32 overflow-y-auto">
                                    {isLoading && evaluations.length < currentQuestionIndex + 1 && <p className='text-sm text-muted-foreground'>Evaluating previous response...</p>}
                                    {evaluations[currentQuestionIndex-1] && (
                                        <div>
                                            <p className='text-sm'><strong className='text-primary'>AI Feedback:</strong> {evaluations[currentQuestionIndex-1].evaluation}</p>
                                            <p className='text-xs text-muted-foreground mt-2'>Score: {evaluations[currentQuestionIndex-1].score}/10</p>
                                        </div>
                                    )}
                                </div>

                                <Button onClick={handleNextQuestion} disabled={isLoading || !hasCameraPermission}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                                    {currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Submit Answer & Next Question'}
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
