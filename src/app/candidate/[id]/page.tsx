
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, ShieldCheck, BrainCircuit, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Candidate } from '@/lib/types';
import { finalInterviewReview, type FinalInterviewReviewOutput } from '@/ai/flows/final-interview-review';
import { InterviewGauntlet } from '@/components/interview/interview-gauntlet';

type GauntletPhase = 'Locked' | 'Technical' | 'PendingReview' | 'SystemDesign' | 'Complete';
type StageStatus = 'Locked' | 'Unlocked' | 'Pending' | 'Complete';

interface GauntletState {
    phase: GauntletPhase;
    technicalReport: string | null;
    systemDesignReport: string | null;
    bossValidation: FinalInterviewReviewOutput | null;
}

export default function CandidatePortalPage({ params }: { params: { id: string } }) {
    const { id: candidateId } = params;
    const router = useRouter();
    const { toast } = useToast();
    
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [gauntletState, setGauntletState] = useState<GauntletState>({
        phase: 'Locked',
        technicalReport: null,
        systemDesignReport: null,
        bossValidation: null,
    });
    
    useEffect(() => {
        // In a real app, you'd fetch this from a DB. We'll use localStorage for this prototype.
        const allCandidatesString = localStorage.getItem('candidates');
        if (allCandidatesString) {
            const allCandidates: Candidate[] = JSON.parse(allCandidatesString);
            const foundCandidate = allCandidates.find(c => c.id === candidateId);
            if (foundCandidate) {
                setCandidate(foundCandidate);
                // Load saved state
                const savedState = localStorage.getItem(`gauntlet_${candidateId}`);
                if (savedState) {
                    setGauntletState(JSON.parse(savedState));
                }
            }
        }
        setIsLoading(false);
    }, [candidateId]);

    useEffect(() => {
        // Save state to localStorage whenever it changes
        if(candidate) {
            localStorage.setItem(`gauntlet_${candidate.id}`, JSON.stringify(gauntletState));
        }
    }, [gauntletState, candidate]);


    const handleLogin = () => {
        // This is a simulated login for the prototype.
        setIsAuthenticated(true);
        setGauntletState(prev => ({...prev, phase: prev.phase === 'Locked' ? 'Technical' : prev.phase }));
    };

    const handleTechnicalComplete = async (report: string) => {
        setIsProcessing(true);
        toast({ title: "Phase 1 Complete", description: "Submitting report to the BOSS AI for validation." });
        
        setGauntletState(prev => ({...prev, phase: 'PendingReview', technicalReport: report }));

        try {
            const result = await finalInterviewReview({ interviewReport: report });
            setGauntletState(prev => ({ ...prev, bossValidation: result }));
            
            if (result.finalRecommendation === "Strong Hire" || result.finalRecommendation === "Proceed with Caution") {
                toast({ title: "Validation Successful!", description: "The BOSS AI has approved you for the next phase." });
                setGauntletState(prev => ({ ...prev, phase: 'SystemDesign' }));
            } else {
                toast({ variant: 'destructive', title: "Gauntlet Ended", description: "After careful review, we will not be proceeding to the next phase." });
                setGauntletState(prev => ({ ...prev, phase: 'Complete' }));
            }
        } catch (error) {
            console.error("BOSS validation failed", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not get validation from the BOSS AI." });
            setGauntletState(prev => ({...prev, phase: 'Technical'})); // Revert to retry
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSystemDesignComplete = (report: string) => {
        toast({ title: "Gauntlet Complete!", description: "Thank you for your time. Your full report has been generated." });
        setGauntletState(prev => ({ ...prev, phase: 'Complete', systemDesignReport: report }));
    };

    const getGrandReport = () => {
        let report = `GRAND REPORT FOR CANDIDATE: ${candidate?.name}\n\n`;
        report += `--- PHASE 1: TECHNICAL GAUNTLET ---\n`;
        report += gauntletState.technicalReport || "No data.";
        report += `\n\n--- BOSS AI VALIDATION ---\n`;
        if (gauntletState.bossValidation) {
            report += `Recommendation: ${gauntletState.bossValidation.finalRecommendation}\n`;
            report += `Assessment: ${gauntletState.bossValidation.overallAssessment}\n`;
        } else {
            report += "No validation data.";
        }
        report += `\n\n--- PHASE 2: SYSTEM DESIGN CHALLENGE ---\n`;
        report += gauntletState.systemDesignReport || "Phase not completed or data unavailable.";
        report += `\n\n--- END OF REPORT ---`;
        return report;
    }


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }

    if (!candidate) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="text-center p-8">
                    <CardHeader><CardTitle>Candidate Not Found</CardTitle></CardHeader>
                    <CardContent>
                        <AlertDescription>The candidate ID is invalid or the interview does not exist.</AlertDescription>
                        <Button onClick={() => router.push('/')} className="mt-4">Return to Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen bg-secondary">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl">AstraHire Gauntlet</CardTitle>
                        <CardDescription>Welcome, {candidate.name}. Please log in to begin your intelligent assessment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={handleLogin} className="w-full h-12 text-lg">
                            <Key className="mr-2" /> Use ID: {candidate.id}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">This is a unique, secure portal for your interview process.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { phase } = gauntletState;

    if (phase === 'Technical' || phase === 'SystemDesign') {
        return (
            <InterviewGauntlet 
                candidate={candidate} 
                initialPhase={phase === 'Technical' ? 'Technical' : 'System Design'}
                onTechnicalComplete={handleTechnicalComplete}
                onSystemDesignComplete={handleSystemDesignComplete}
            />
        );
    }

    const stageStatus = (stage: GauntletPhase): StageStatus => {
        if (phase === 'Complete' || (phase === 'SystemDesign' && stage !== 'SystemDesign') || (phase === 'PendingReview' && stage === 'Technical')) return 'Complete';
        if (phase === stage) return 'Unlocked';
        if (phase === 'PendingReview' && stage === 'SystemDesign') return 'Pending';
        return 'Locked';
    }

    return (
         <div className="flex items-center justify-center h-screen bg-secondary">
            <Card className="w-full max-w-2xl p-8">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Your Gauntlet Progress</CardTitle>
                    <CardDescription>Welcome back, {candidate.name}. Here is your current status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PhaseCard 
                        icon={<BrainCircuit />}
                        title="Phase 1: Technical Gauntlet"
                        description="An AI-driven technical deep-dive based on your skills and the role requirements."
                        status={stageStatus('Technical')}
                    />
                    <PhaseCard 
                        icon={<ShieldCheck />}
                        title="Phase 2: BOSS AI Validation"
                        description="Our supervisory AI is reviewing your performance to determine eligibility for the next phase."
                        status={stageStatus('PendingReview')}
                    />
                     <PhaseCard 
                        icon={<FileText />}
                        title="Phase 3: System Design Challenge"
                        description="A conceptual challenge to assess your architectural and problem-solving abilities."
                        status={stageStatus('SystemDesign')}
                    />
                     {phase === 'Complete' && (
                        <Alert variant="default" className="bg-green-100/50 border-green-400">
                           <AlertTitle className="font-bold text-green-700">Gauntlet Complete!</AlertTitle>
                           <AlertDescription className="text-green-600">
                               Thank you for completing all phases. The hiring team will be in touch shortly with the next steps.
                           </AlertDescription>
                           <Button className="mt-4" onClick={() => {
                               const report = getGrandReport();
                               const blob = new Blob([report], { type: 'text/plain' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `grand_report_${candidate.name}.txt`;
                               a.click();
                               URL.revokeObjectURL(url);
                           }}>Download Your Grand Report</Button>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


const PhaseCard = ({ icon, title, description, status }: { icon: React.ReactNode, title: string, description: string, status: StageStatus }) => {
    const statusStyles = {
        Locked: "bg-secondary text-muted-foreground opacity-60",
        Unlocked: "bg-primary text-primary-foreground",
        Pending: "bg-yellow-500/80 text-white animate-pulse",
        Complete: "bg-green-600/80 text-white",
    }
    return (
        <div className={`p-4 rounded-lg flex items-center gap-4 border ${statusStyles[status]}`}>
            <div className="text-2xl">{icon}</div>
            <div>
                <h3 className="font-bold">{title} - <span className="text-sm font-medium opacity-90">{status}</span></h3>
                <p className="text-xs opacity-80">{description}</p>
            </div>
        </div>
    )
}
