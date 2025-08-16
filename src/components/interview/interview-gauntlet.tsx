
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Video, Brain, AlertTriangle, Send, CheckCircle, XCircle } from 'lucide-react';
import type { Candidate } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { proctorTechnicalExam } from '@/ai/flows/proctor-technical-exam';
import { generateSystemDesignQuestion } from '@/ai/flows/generate-system-design-question';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';

type InterviewPhase = 'Technical' | 'SystemDesign' | 'FinalInterview'; // FinalInterview is legacy but kept for type safety
type PreFlightStatus = 'Pending' | 'Success' | 'Error';

interface InterviewGauntletProps {
    candidate: Candidate;
    initialPhase: InterviewPhase;
    onPhaseComplete: (phase: 'Technical' | 'SystemDesign', report: string) => void;
}

export function InterviewGauntlet({ candidate, initialPhase, onPhaseComplete }: InterviewGauntletProps) {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    
    const [cameraStatus, setCameraStatus] = useState<PreFlightStatus>('Pending');
    const [micStatus, setMicStatus] = useState<PreFlightStatus>('Pending');
    const [isPreFlightComplete, setIsPreFlightComplete] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [phase, setPhase] = useState<InterviewPhase>(initialPhase);
    const [technicalQuestion, setTechnicalQuestion] = useState<string>('');
    const [systemDesignQuestion, setSystemDesignQuestion] = useState<string>('');
    const [writtenAnswer, setWrittenAnswer] = useState('');
    const [proctoringLog, setProctoringLog] = useState<string[]>([]);
    const [ambientTranscript, setAmbientTranscript] = useState('');

    const answerSaveKey = `gauntlet_answer_${candidate.id}_${phase}`;

    useEffect(() => {
        const runPreFlightChecks = async () => {
            // Check Camera
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) videoRef.current.srcObject = videoStream;
                setCameraStatus('Success');
            } catch (error) { setCameraStatus('Error'); }

            // Check Microphone
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.onresult = (event: any) => {
                        let finalTranscript = '';
                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                        }
                        if (finalTranscript) setAmbientTranscript(prev => prev + finalTranscript + '. ');
                    };
                    recognitionRef.current = recognition;
                    setMicStatus('Success');
                } else { setMicStatus('Error'); }
            } catch (error) { setMicStatus('Error'); }
        };
        runPreFlightChecks();
    }, []);
    
    useEffect(() => {
        const savedAnswer = localStorage.getItem(answerSaveKey);
        if (savedAnswer) {
            setWrittenAnswer(savedAnswer);
        } else {
            setWrittenAnswer('');
        }
    }, [phase, answerSaveKey]);

    const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newAnswer = e.target.value;
        setWrittenAnswer(newAnswer);
        localStorage.setItem(answerSaveKey, newAnswer);
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                const logEntry = `[${new Date().toISOString()}] Candidate switched tabs or minimized the window.`;
                setProctoringLog(prev => [...prev, logEntry]);
                toast({
                    title: "Proctoring Alert",
                    description: "Leaving the tab is logged and will be reported.",
                    variant: "destructive"
                });
            }
        };
        if(isPreFlightComplete) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [isPreFlightComplete, toast]);

    useEffect(() => {
        const fetchQuestion = async () => {
            if (!isPreFlightComplete) return;
            setIsLoading(true);
            try {
                if (phase === 'Technical') {
                    setTechnicalQuestion("Given a list of integers, write a function to find the first missing positive integer. For example, for [3, 4, -1, 1], the answer is 2. For [1, 2, 0], the answer is 3. Your solution should run in O(n) time and use constant extra space.");
                    recognitionRef.current?.start();
                } else if (phase === 'SystemDesign') {
                    const result = await generateSystemDesignQuestion({ jobTitle: candidate.role });
                    setSystemDesignQuestion(result.question);
                     recognitionRef.current?.start();
                }
            } catch (error) {
                toast({ title: 'Error', description: 'Could not generate interview questions.', variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestion();
    }, [candidate.role, phase, toast, isPreFlightComplete]);

    const handleSubmitAnswer = async () => {
        if (writtenAnswer.trim() === '') {
            toast({ title: "Answer Required", description: "Please provide an answer before submitting.", variant: 'destructive'});
            return;
        }
        setIsProcessing(true);
        recognitionRef.current?.stop();
        localStorage.removeItem(answerSaveKey);

        try {
            if (phase === 'Technical') {
                const result = await proctorTechnicalExam({
                    question: technicalQuestion,
                    candidateAnswer: writtenAnswer,
                    proctoringLog: proctoringLog,
                    ambientAudioTranscript: ambientTranscript,
                });
                const report = generateProctoringReport(technicalQuestion, writtenAnswer, result);
                onPhaseComplete('Technical', report);
            } else if (phase === 'SystemDesign') {
                const report = `SYSTEM DESIGN REPORT\n\nQuestion: ${systemDesignQuestion}\n\nCandidate Answer:\n${writtenAnswer}`;
                onPhaseComplete('SystemDesign', report);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Could not process your answer.', variant: 'destructive'});
            setIsProcessing(false);
        }
    };
    
    const generateProctoringReport = (question: string, answer: string, result: any) => {
        let reportContent = `PHASE REPORT: TECHNICAL (PROCTORED)\n\n`;
        reportContent += `QUESTION: ${question}\n\n`;
        reportContent += `CANDIDATE ANSWER:\n${answer}\n\n`;
        reportContent += `--- AI EVALUATION & PROCTORING ---\n`;
        reportContent += `SCORE: ${result.score}/100\n`;
        reportContent += `PASS/FAIL: ${result.isPass ? 'Pass' : 'Fail'}\n\n`;
        reportContent += `EVALUATION:\n${result.evaluation}\n\n`;
        reportContent += `PROCTORING SUMMARY:\n${result.proctoringSummary}\n\n`;
        reportContent += `FULL LOG:\n${proctoringLog.map(l => `- ${l}`).join('\n') || 'No events logged.'}\n`;
        reportContent += `AMBIENT AUDIO TRANSCRIPT:\n${ambientTranscript || 'None detected.'}\n`;
        return reportContent;
    }

    if (!isPreFlightComplete) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Gauntlet Pre-flight Check</CardTitle>
                        <CardDescription>We need to check your camera and microphone before we begin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={`flex items-center justify-between p-3 rounded-md ${cameraStatus === 'Pending' ? 'bg-secondary' : cameraStatus === 'Success' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className="flex items-center gap-2"> <Video /> <span className="font-medium">Camera</span> </div>
                            {cameraStatus === 'Pending' && <Loader2 className="animate-spin" />}
                            {cameraStatus === 'Success' && <CheckCircle className="text-green-600" />}
                            {cameraStatus === 'Error' && <XCircle className="text-red-600" />}
                        </div>
                         <div className={`flex items-center justify-between p-3 rounded-md ${micStatus === 'Pending' ? 'bg-secondary' : micStatus === 'Success' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className="flex items-center gap-2"> <Mic /> <span className="font-medium">Microphone</span> </div>
                            {micStatus === 'Pending' && <Loader2 className="animate-spin" />}
                            {micStatus === 'Success' && <CheckCircle className="text-green-600" />}
                            {micStatus === 'Error' && <XCircle className="text-red-600" />}
                        </div>
                        <Button className="w-full h-11" disabled={cameraStatus !== 'Success' || micStatus !== 'Success'} onClick={() => setIsPreFlightComplete(true)}> Begin Gauntlet </Button>
                        {(cameraStatus === 'Error' || micStatus === 'Error') && <p className="text-xs text-center text-destructive">Please check your browser permissions and ensure your devices are connected.</p>}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const currentQuestionText = phase === 'Technical' ? technicalQuestion : systemDesignQuestion;

    if (isLoading && !currentQuestionText) {
         return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /><p className='ml-4'>Preparing Gauntlet Phase: {phase}...</p></div>
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl text-primary flex items-center justify-center gap-3"><Brain /> AI Interview Gauntlet</CardTitle>
                    <CardDescription>Candidate: {candidate.name} | Role: {candidate.role} | Phase: {phase}</CardDescription>
                </CardHeader>

                <CardContent className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative">
                            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                            <div className="absolute bottom-2 right-2 flex items-center gap-4">
                                <Badge variant="secondary"><Video className="mr-2 h-3 w-3" /> Camera ON</Badge>
                                <Badge variant="secondary"><Mic className="mr-2 h-3 w-3" /> Mic ON</Badge>
                            </div>
                        </div>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Proctoring is Active</AlertTitle>
                            <AlertDescription> Your camera, microphone, and browser tab are being monitored. Please remain on this tab and ensure no one else is in the room. </AlertDescription>
                        </Alert>
                    </div>

                    <div className="lg:col-span-3 flex flex-col">
                        <div className="flex-grow space-y-4">
                             <div>
                                <Label htmlFor="question" className="text-sm font-semibold text-muted-foreground"> Question </Label>
                                <Card id="question" className="p-4 bg-secondary/50 mt-1"> <p className="font-semibold">{currentQuestionText}</p> </Card>
                            </div>
                            <div>
                                <Label htmlFor="answer" className="text-sm font-semibold text-muted-foreground">Your Answer</Label>
                                <Textarea id="answer" placeholder="Write your code or detailed answer here..." className="h-64 font-mono text-sm" value={writtenAnswer} onChange={handleAnswerChange} disabled={isProcessing} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button onClick={handleSubmitAnswer} disabled={isProcessing || !currentQuestionText} className="w-full h-12 text-lg">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                                Submit & Complete Phase
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    