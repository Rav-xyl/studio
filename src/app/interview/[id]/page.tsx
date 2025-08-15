
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Video, Download, Brain, Zap, Square, Lightbulb, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateInterviewQuestions } from '@/ai/flows/dynamic-interview-question-generation';
import { evaluateInterviewResponse } from '@/ai/flows/evaluate-interview-response';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { finalInterviewReview } from '@/ai/flows/final-interview-review';
import type { Candidate } from '@/lib/types';
import { generateSystemDesignQuestion } from '@/ai/flows/generate-system-design-question';

const DUMMY_JOB_DESCRIPTION = "Seeking a Senior Frontend Developer with expertise in React, Next.js, and TypeScript. The ideal candidate will have experience building and deploying complex, high-performance web applications. Strong communication and problem-solving skills are a must.";

type ConversationEntry = {
    speaker: 'ARYA' | 'Candidate';
    text: string;
    evaluation?: any;
    phase: 'Technical' | 'System Design';
};

type InterviewPhase = 'Technical' | 'System Design' | 'Finished';

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

export default function InterviewPage({ params }: { params: { id: string } }) {
    const { id: candidateId } = params;
    const router = useRouter();
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const [phase, setPhase] = useState<InterviewPhase>('Technical');
    const [questions, setQuestions] = useState<string[]>([]);
    const [systemDesignQuestion, setSystemDesignQuestion] = useState<string>('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [transcript, setTranscript] = useState('');

    const [finalReview, setFinalReview] = useState<any>(null);
    const [interviewReport, setInterviewReport] = useState("");
    

    useEffect(() => {
        const candidateDataString = localStorage.getItem('interviewCandidate');
        if (candidateDataString) {
            const storedCandidate = JSON.parse(candidateDataString);
            if (storedCandidate.id === candidateId) {
                setCandidate(storedCandidate);
            }
        }
    }, [candidateId]);


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
        if (!candidate) {
            setIsLoading(false);
            return;
        }
        const fetchInitialQuestions = async () => {
            setIsLoading(true);
            try {
                const result = await generateInterviewQuestions({
                    resumeText: candidate.narrative,
                    jobDescription: DUMMY_JOB_DESCRIPTION,
                    candidateAnalysis: 'A promising candidate with strong skills in their domain.',
                });
                setQuestions(result.questions);
                if (result.questions.length > 0) {
                    setConversation([{ speaker: 'ARYA', text: result.questions[0], phase: 'Technical' }]);
                }
            } catch (error) {
                console.error("Failed to generate questions", error);
                toast({ title: 'Error', description: 'Could not generate interview questions.', variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialQuestions();
    }, [candidate, toast]);

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
        if (!candidate || transcript.trim() === '') {
            if(transcript.trim() === '') toast({ title: 'No answer detected', description: 'Please provide an answer before submitting.', variant: 'destructive' });
            return;
        };
        
        const currentPhase = phase as 'Technical' | 'System Design';
        const candidateEntry: ConversationEntry = { speaker: 'Candidate', text: transcript, phase: currentPhase };
        
        setIsProcessing(true);
        setConversation(prev => [...prev, candidateEntry]);

        try {
            const currentQuestion = phase === 'Technical' ? questions[currentQuestionIndex] : systemDesignQuestion;
            const result = await evaluateInterviewResponse({
                question: currentQuestion,
                candidateResponse: transcript,
                jobDescription: DUMMY_JOB_DESCRIPTION
            });

            setConversation(prev => {
                const newConversation = [...prev];
                const lastAryaMessageIndex = newConversation.map((c,i) => ({...c, i})).filter(c => c.speaker === 'ARYA').pop()?.i;
                if(lastAryaMessageIndex !== undefined) {
                    newConversation[lastAryaMessageIndex] = { ...newConversation[lastAryaMessageIndex], evaluation: result };
                }
                return newConversation;
            });

            if (phase === 'Technical') {
                if (currentQuestionIndex < questions.length - 1) {
                    const nextQuestionIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextQuestionIndex);
                    setConversation(prev => [...prev, { speaker: 'ARYA', text: questions[nextQuestionIndex], phase: 'Technical' }]);
                } else {
                    // Transition to System Design phase
                    setPhase('System Design');
                    setIsProcessing(true);
                    toast({ title: "Phase 1 Complete", description: "Proceeding to System Design Challenge." });
                    const designQuestionResult = await generateSystemDesignQuestion({ jobTitle: candidate.role });
                    setSystemDesignQuestion(designQuestionResult.question);
                    setConversation(prev => [...prev, { speaker: 'ARYA', text: designQuestionResult.question, phase: 'System Design' }]);
                    setIsProcessing(false);
                }
            } else if (phase === 'System Design') {
                // End of interview
                setPhase('Finished');
                const finalReport = getReportContent(true);
                setInterviewReport(finalReport);
            }
        } catch (error) {
             console.error("Failed to process response", error);
            toast({ title: 'Error', description: 'Could not process the interview response.', variant: 'destructive'});
        } finally {
            setIsProcessing(false);
            setTranscript('');
        }
    };

    const getReportContent = (isFinal: boolean = false) => {
        if (!candidate) return "";

        const currentConversation = conversation;

        let reportContent = `INTERVIEW REPORT\n\n`;
        reportContent += `Candidate: ${candidate.name}\n`;
        reportContent += `Role: ${candidate.role}\n`;
        reportContent += `Date: ${new Date().toLocaleDateString()}\n\n`;
        
        const technicalPhase = currentConversation.filter(e => e.phase === 'Technical');
        const systemDesignPhase = currentConversation.filter(e => e.phase === 'System Design');

        reportContent += `--- PHASE 1: TECHNICAL Q&A ---\n\n`;
        technicalPhase.forEach(entry => {
            if (entry.speaker === 'ARYA') {
                reportContent += `ARYA:\n${entry.text}\n\n`;
                if(entry.evaluation) {
                    reportContent += `EVALUATION: Score: ${entry.evaluation.score}/10 - ${entry.evaluation.evaluation}\n\n`;
                }
            } else {
                reportContent += `CANDIDATE:\n${entry.text}\n\n`;
            }
        });

        reportContent += `--- PHASE 2: SYSTEM DESIGN CHALLENGE ---\n\n`;
        systemDesignPhase.forEach(entry => {
            if (entry.speaker === 'ARYA') {
                reportContent += `ARYA:\n${entry.text}\n\n`;
                if(entry.evaluation) {
                    reportContent += `EVALUATION: Score: ${entry.evaluation.score}/10 - ${entry.evaluation.evaluation}\n\n`;
                }
            } else {
                reportContent += `CANDIDATE:\n${entry.text}\n\n`;
            }
        });
        
        reportContent += `--- END OF REPORT ---`;
        return reportContent;
    }

    const generateReportFile = () => {
        const reportContent = getReportContent();
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview_report_${candidate?.name.replace(' ', '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const runFinalReview = async () => {
        if (!interviewReport) return;
        setIsProcessing(true);
        try {
            const result = await finalInterviewReview({ interviewReport });
            setFinalReview(result);
            toast({ title: "Final Review Complete", description: "The 'BOSS' AI has provided its final assessment." });
        } catch (error) {
            console.error("Final review failed", error);
            toast({ title: "Error", description: "Could not run final AI review.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    }

    if (isLoading && questions.length === 0) {
         return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
                <p className='ml-4'>Preparing Interview...</p>
            </div>
        )
    }

    if (!candidate) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <Card className="text-center p-8">
                    <CardHeader>
                        <CardTitle>Candidate Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AlertDescription>The candidate data could not be loaded. This might happen if you navigated here directly.</AlertDescription>
                        <Button onClick={() => router.push('/')} className="mt-4">Return to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardHeader className="lg:col-span-2">
                    <CardTitle className="text-3xl text-primary flex items-center gap-3"><Brain /> AI Interview Gauntlet</CardTitle>
                    <p className="text-muted-foreground">with {candidate.name} for the role of {candidate.role}</p>
                    <div className="flex items-center gap-4 text-sm pt-2">
                        <span className={`flex items-center gap-2 ${phase === 'Technical' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                           {phase !== 'Technical' ? <CheckCircle className='h-4 w-4 text-green-500'/> : <Loader2 className={`h-4 w-4 ${isProcessing ? '' : 'animate-spin'}`}/>} Phase 1: Technical Q&A
                        </span>
                         <span className={`flex items-center gap-2 ${phase === 'System Design' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                           {phase === 'Finished' ? <CheckCircle className='h-4 w-4 text-green-500'/> : <Lightbulb className='h-4 w-4'/>} Phase 2: System Design
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
                             {phase === 'Finished' ? (
                                <div className='text-center p-6 bg-secondary rounded-lg'>
                                    <h3 className='text-2xl font-bold text-green-400 mb-2'>Interview Gauntlet Complete!</h3>
                                     {finalReview ? (
                                        <div className="mt-4 p-4 rounded-lg bg-background/50 space-y-3 text-left">
                                            <h4 className="font-bold text-lg text-primary">Final Recommendation: {finalReview.finalRecommendation}</h4>
                                            <div>
                                                <h5 className="font-semibold">Overall Assessment</h5>
                                                <p className="text-sm text-muted-foreground">{finalReview.overallAssessment}</p>
                                            </div>
                                            <Button onClick={() => router.push('/')} className="w-full mt-4" variant="outline">
                                                Return to Dashboard
                                            </Button>
                                        </div>
                                     ) : (
                                        <>
                                            <p className='text-muted-foreground mt-2'>The interview is finished. You can now download the report or run the final "BOSS" AI review.</p>
                                            <div className="flex gap-4 justify-center mt-6">
                                                <Button onClick={generateReportFile}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download Report
                                                </Button>
                                                <Button onClick={runFinalReview} disabled={isProcessing}>
                                                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                                                    Run Final "BOSS" Review
                                                </Button>
                                            </div>
                                        </>
                                     )}
                                </div>
                            ) : (
                                <Button onClick={handleToggleRecording} disabled={isProcessing || !hasCameraPermission || (phase === 'Technical' && questions.length === 0)} className={`w-full h-12 text-lg ${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : (isRecording ? <Square className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />)}
                                    {isRecording ? 'Stop & Submit Answer' : `Answer ${phase} Question`}
                                </Button>
                            )}
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
