
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Video, Brain, AlertTriangle, Send, CheckCircle, XCircle, LogOut, Settings2 } from 'lucide-react';
import type { Candidate } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { proctorTechnicalExam } from '@/ai/flows/proctor-technical-exam';
import { generateSystemDesignQuestion } from '@/ai/flows/generate-system-design-question';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { detectFaces } from '@/ai/flows/face-detection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type InterviewPhase = 'Technical' | 'SystemDesign' | 'FinalInterview'; // FinalInterview is legacy but kept for type safety
type PreFlightStatus = 'Pending' | 'Success' | 'Error';

interface InterviewGauntletProps {
    candidate: Candidate;
    initialPhase: InterviewPhase;
    onPhaseComplete: (phase: 'Technical' | 'SystemDesign', report: string) => void;
    onLogout: () => void;
}

const FACEDETECTION_INTERVAL_MS = 10000; // Run face detection every 10 seconds

export function InterviewGauntlet({ candidate, initialPhase, onPhaseComplete, onLogout }: InterviewGauntletProps) {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const [isPreFlight, setIsPreFlight] = useState(true);
    const [devices, setDevices] = useState<{ video: MediaDeviceInfo[], audio: MediaDeviceInfo[] }>({ video: [], audio: [] });
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [phase, setPhase] = useState<InterviewPhase>(initialPhase);
    const [technicalQuestion, setTechnicalQuestion] = useState<string>('');
    const [systemDesignQuestion, setSystemDesignQuestion] = useState<string>('');
    const [writtenAnswer, setWrittenAnswer] = useState('');
    const [proctoringLog, setProctoringLog] = useState<string[]>([]);
    const [ambientTranscript, setAmbientTranscript] = useState('');

    const answerSaveKey = `gauntlet_answer_${candidate.id}_${phase}`;
    
    // --- Device Management ---
    useEffect(() => {
        const getDevices = async () => {
            try {
                // We must get user media permission first to enumerate devices
                await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                const audioDevices = allDevices.filter(d => d.kind === 'audioinput');
                setDevices({ video: videoDevices, audio: audioDevices });
                if (videoDevices.length > 0) setSelectedVideoDevice(videoDevices[0].deviceId);
                if (audioDevices.length > 0) setSelectedAudioDevice(audioDevices[0].deviceId);
            } catch (err) {
                 console.error("Error enumerating devices:", err);
                 toast({ variant: 'destructive', title: "Device Error", description: "Could not access camera or microphone. Please check permissions."});
            }
        };
        getDevices();

        return () => { // Cleanup function
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
             if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
        };

    }, [toast]);

    useEffect(() => {
        const startStream = async () => {
            if (selectedVideoDevice && selectedAudioDevice) {
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                }
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: selectedVideoDevice },
                        audio: { deviceId: selectedAudioDevice },
                    });
                    mediaStreamRef.current = stream;
                    if (videoRef.current) videoRef.current.srcObject = stream;
                } catch (err) {
                    console.error("Error starting media stream:", err);
                }
            }
        };
        startStream();
    }, [selectedVideoDevice, selectedAudioDevice]);
    
    // --- Face Detection Proctoring ---
    useEffect(() => {
        if (!isPreFlight) {
            faceDetectionIntervalRef.current = setInterval(async () => {
                if (videoRef.current && videoRef.current.readyState >= 3) {
                    const canvas = document.createElement('canvas');
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    const dataUri = canvas.toDataURL('image/jpeg');

                    try {
                        const result = await detectFaces({ imageDataUri: dataUri });
                        const logEntry = `[${new Date().toISOString()}] Face detection check: ${result.faceCount} face(s) found.`;
                        setProctoringLog(prev => [...prev, logEntry]);
                        if (result.faceCount === 0 || result.faceCount > 1) {
                            toast({ variant: "destructive", title: "Proctoring Alert", description: `Detected ${result.faceCount} faces. Please ensure you are alone and visible.` });
                        }
                    } catch (error) {
                        console.error("Face detection failed:", error);
                    }
                }
            }, FACEDETECTION_INTERVAL_MS);
        }
        return () => {
            if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
        }
    }, [isPreFlight, toast]);
    

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
    
     const startMicrophone = () => {
        try {
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
                recognition.start();
                recognitionRef.current = recognition;
            }
        } catch (error) {
            console.error("Speech recognition failed:", error);
        }
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
        if(!isPreFlight) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [isPreFlight, toast]);

    useEffect(() => {
        const fetchQuestion = async () => {
            if (isPreFlight) return;
            setIsLoading(true);
            try {
                const result = await generateSystemDesignQuestion({ jobTitle: candidate.role });
                if (phase === 'Technical') {
                    setTechnicalQuestion(result.question);
                } else if (phase === 'SystemDesign') {
                    setSystemDesignQuestion(result.question);
                }
                 startMicrophone();
            } catch (error) {
                toast({ title: 'Error', description: 'Could not generate interview questions.', variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestion();
    }, [candidate.role, phase, toast, isPreFlight]);

    const handleSubmitAnswer = async () => {
        if (writtenAnswer.trim() === '') {
            toast({ title: "Answer Required", description: "Please provide an answer before submitting.", variant: 'destructive'});
            return;
        }
        setIsProcessing(true);
        recognitionRef.current?.stop();
        if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
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

    if (isPreFlight) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings2 /> Gauntlet Pre-flight Check</CardTitle>
                        <CardDescription>Select and test your camera and microphone before we begin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-video bg-black rounded-lg">
                            <video ref={videoRef} className="w-full h-full rounded-md" autoPlay muted />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="video-device">Camera</Label>
                                <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                                    <SelectTrigger id="video-device"><SelectValue placeholder="Select camera..." /></SelectTrigger>
                                    <SelectContent>
                                        {devices.video.map(d => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="audio-device">Microphone</Label>
                                <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                                    <SelectTrigger id="audio-device"><SelectValue placeholder="Select microphone..." /></SelectTrigger>
                                    <SelectContent>
                                        {devices.audio.map(d => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button className="w-full h-11" disabled={!selectedAudioDevice || !selectedVideoDevice} onClick={() => setIsPreFlight(false)}> Begin Gauntlet </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const currentQuestionText = phase === 'Technical' ? technicalQuestion : systemDesignQuestion;

    if (isLoading && !currentQuestionText) {
         return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /><p className='ml-4'>Generating a role-specific question for {phase} phase...</p></div>
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl">
                <CardHeader className="text-center relative">
                    <CardTitle className="text-3xl text-primary flex items-center justify-center gap-3"><Brain /> AI Interview Gauntlet</CardTitle>
                    <CardDescription>Candidate: {candidate.name} | Role: {candidate.role} | Phase: {phase}</CardDescription>
                    <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-muted-foreground" onClick={onLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
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
