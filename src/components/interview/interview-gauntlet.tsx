
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Video, Download, Brain, Zap, Square, Lightbulb } from 'lucide-react';
import { generateInterviewQuestions } from '@/ai/flows/dynamic-interview-question-generation';
import { evaluateInterviewResponse } from '@/ai/flows/evaluate-interview-response';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Candidate } from '@/lib/types';
import { generateSystemDesignQuestion } from '@/ai/flows/generate-system-design-question';

const DUMMY_JOB_DESCRIPTION = "Seeking a Senior Frontend Developer with expertise in React, Next.js, and TypeScript. The ideal candidate will have experience building and deploying complex, high-performance web applications. Strong communication and problem-solving skills are a must.";

type ConversationEntry = {
    speaker: 'ARYA' | 'Candidate';
    text: string;
    evaluation?: any;
    phase: 'Technical' | 'System Design';
};

type InterviewPhase = 'Technical' | 'System Design';

// Speech Recognition setup
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

interface InterviewGauntletProps {
    candidate: Candidate;
    initialPhase: InterviewPhase;
    onTechnicalComplete: (report: string) => void;
    onSystemDesignComplete: (report: string) => void;
}

export function InterviewGauntlet({ candidate, initialPhase, onTechnicalComplete, onSystemDesignComplete }: InterviewGauntletProps) {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const [phase, setPhase] = useState<InterviewPhase>(initialPhase);
    const [questions, setQuestions] = useState<string[]>([]);
    const [systemDesignQuestion, setSystemDesignQuestion] = useState<string>('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [transcript, setTranscript] = useState('');

    useEffect(() => {
        const getCameraAndMicPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing media devices:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Permission Denied',
              description: 'Please enable camera and microphone permissions to continue.',
            });
          }
        };
    
        getCameraAndMicPermission();
      }, [toast]);

    useEffect(() => {
        const fetchQuestionsForPhase = async () => {
            setIsLoading(true);
            try {
                if (initialPhase === 'Technical') {
                    const result = await generateInterviewQuestions({
                        resumeText: candidate.narrative,
                        jobDescription: DUMMY_JOB_DESCRIPTION,
                        candidateAnalysis: 'A promising candidate with strong skills in their domain.',
                    });
                    setQuestions(result.questions);
                    if (result.questions.length > 0) {
                        setConversation([{ speaker: 'ARYA', text: result.questions[0], phase: 'Technical' }]);
                    }
                } else if (initialPhase === 'SystemDesign') {
                    const result = await generateSystemDesignQuestion({ jobTitle: candidate.role });
                    setSystemDesignQuestion(result.question);
                    setConversation([{ speaker: 'ARYA', text: result.question, phase: 'System Design' }]);
                }
            } catch (error) {
                console.error("Failed to generate questions", error);
                toast({ title: 'Error', description: 'Could not generate interview questions.', variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestionsForPhase();
    }, [candidate, initialPhase, toast]);

    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript + '. ');
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            toast({ title: 'Speech Recognition Error', description: 'There was an issue with the speech recognition.', variant: 'destructive' });
            setIsRecording(false);
        };
    }, [toast]);

    const handleToggleRecording = () => {
        if (!recognition) {
            toast({ title: 'Not Supported', description: 'Speech recognition is not supported in your browser.', variant: 'destructive' });
            return;
        }
        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
            handleSubmitAnswer();
        } else {
            setTranscript('');
            recognition.start();
            setIsRecording(true);
        }
    };
    
    const handleSubmitAnswer = async () => {
        if (transcript.trim() === '') {
            toast({ title: 'No answer detected', description: 'Please provide an answer before submitting.', variant: 'destructive' });
            return;
        };
        
        const currentPhase = phase;
        const candidateEntry: ConversationEntry = { speaker: 'Candidate', text: transcript, phase: currentPhase };
        
        setIsProcessing(true);
        const updatedConversation = [...conversation, candidateEntry];
        setConversation(updatedConversation);

        try {
            const currentQuestion = phase === 'Technical' ? questions[currentQuestionIndex] : systemDesignQuestion;
            const result = await evaluateInterviewResponse({
                question: currentQuestion,
                candidateResponse: transcript,
                jobDescription: DUMMY_JOB_DESCRIPTION
            });

            const finalConversation = updatedConversation.map((entry, index) => {
                if (index === updatedConversation.length - 2) { // The ARYA question before the candidate's answer
                    return { ...entry, evaluation: result };
                }
                return entry;
            });
            setConversation(finalConversation);

            if (phase === 'Technical') {
                if (currentQuestionIndex < questions.length - 1) {
                    const nextQuestionIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextQuestionIndex);
                    setConversation(prev => [...prev, { speaker: 'ARYA', text: questions[nextQuestionIndex], phase: 'Technical' }]);
                } else {
                    // End of Technical phase
                    const report = generateReport(finalConversation);
                    onTechnicalComplete(report);
                }
            } else if (phase === 'SystemDesign') {
                // End of System Design phase
                const report = generateReport(finalConversation);
                onSystemDesignComplete(report);
            }
        } catch (error) {
             console.error("Failed to process response", error);
            toast({ title: 'Error', description: 'Could not process the interview response.', variant: 'destructive'});
        } finally {
            setIsProcessing(false);
            setTranscript('');
        }
    };

    const generateReport = (finalConversation: ConversationEntry[]) => {
        let reportContent = `PHASE REPORT: ${phase.toUpperCase()}\n\n`;
        finalConversation.forEach(entry => {
            if (entry.speaker === 'ARYA') {
                reportContent += `ARYA:\n${entry.text}\n\n`;
                if(entry.evaluation) {
                    reportContent += `EVALUATION: Score: ${entry.evaluation.score}/10 - ${entry.evaluation.evaluation}\n\n`;
                }
            } else {
                reportContent += `CANDIDATE:\n${entry.text}\n\n`;
            }
        });
        return reportContent;
    }

    if (isLoading && conversation.length === 0) {
         return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
                <p className='ml-4'>Preparing Gauntlet Phase: {phase}...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardHeader className="lg:col-span-2">
                    <CardTitle className="text-3xl text-primary flex items-center gap-3"><Brain /> AI Interview Gauntlet</CardTitle>
                    <p className="text-muted-foreground">Candidate: {candidate.name} | Role: {candidate.role}</p>
                    <div className="flex items-center gap-4 text-sm pt-2">
                        <span className={`flex items-center gap-2 ${phase === 'Technical' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                           <Lightbulb className='h-4 w-4'/> Phase: {phase}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative">
                            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                            {isRecording && <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/80 text-white px-3 py-1 rounded-full text-sm animate-pulse"><div className='h-2 w-2 rounded-full bg-white'></div>REC</div>}
                        </div>
                         { !hasCameraPermission && (
                            <Alert variant="destructive">
                                <Video className="h-4 w-4" />
                                <AlertTitle>Camera & Mic Access Required</AlertTitle>
                                <AlertDescription>Please allow camera and microphone access in your browser to use this feature.</AlertDescription>
                            </Alert>
                        )}
                        <div className="pt-4">
                             <Button onClick={handleToggleRecording} disabled={isProcessing || !hasCameraPermission || (phase === 'Technical' && questions.length === 0)} className={`w-full h-12 text-lg ${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}>
                                {isProcessing ? <Loader2 className="animate-spin" /> : (isRecording ? <Square className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />)}
                                {isRecording ? 'Stop & Submit Answer' : `Answer ${phase} Question`}
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardContent>
                    <h3 className="text-xl font-semibold mb-2 text-center">Live Transcript & Analysis</h3>
                    <ScrollArea className="h-[60vh] bg-secondary/30 rounded-lg border border-border">
                        <div className="space-y-6 p-4">
                            {conversation.map((entry, index) => (
                                <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'Candidate' ? 'flex-row-reverse' : ''}`}>
                                     <Avatar>
                                        <AvatarFallback className={entry.speaker === 'ARYA' ? 'bg-primary' : 'bg-slate-600'}>
                                            {entry.speaker === 'ARYA' ? 'AI' : candidate.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`p-3 rounded-lg max-w-md ${entry.speaker === 'ARYA' ? 'bg-secondary' : 'bg-primary/80'}`}>
                                        <p className="font-bold text-xs uppercase tracking-wider mb-1 opacity-70">{entry.phase}</p>
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
                            {isRecording && (
                                <div className="flex items-start gap-3 flex-row-reverse">
                                    <Avatar><AvatarFallback className='bg-slate-600'>{candidate.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div className="p-3 rounded-lg max-w-md bg-primary/50 border border-dashed border-primary">
                                        <p className="text-sm italic text-slate-200">{transcript || 'Listening...'}</p>
                                    </div>
                                </div>
                            )}
                             {isProcessing && (
                                <div className="flex items-start gap-3">
                                    <Avatar><AvatarFallback className='bg-primary'>AI</AvatarFallback></Avatar>
                                    <div className="p-3 rounded-lg max-w-md bg-secondary animate-pulse">
                                        <p className="text-sm">Evaluating response and preparing next phase...</p>
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

