
'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Candidate } from '@/lib/types';
import { finalInterviewReview, type FinalInterviewReviewOutput } from '@/ai/flows/final-interview-review';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { BrainCircuit, FileText, ShieldCheck } from 'lucide-react';

const InterviewGauntlet = dynamic(() => import('@/components/interview/interview-gauntlet').then(mod => mod.InterviewGauntlet), {
    ssr: false,
    loading: () => <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /><p className="ml-4">Loading Gauntlet...</p></div>
});

type GauntletPhase = 'Locked' | 'Technical' | 'PendingReview' | 'SystemDesign' | 'Complete';
type StageStatus = 'Locked' | 'Unlocked' | 'Pending' | 'Complete';

interface GauntletState {
    phase: GauntletPhase;
    technicalReport: string | null;
    systemDesignReport: string | null;
    bossValidation: FinalInterviewReviewOutput | null;
}

export default function CandidatePortalPage({ params }: { params: { id: string } }) {
    const candidateId = use(params).id;
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
        // This effect handles authentication and initial data fetching.
        const authenticatedId = sessionStorage.getItem('gauntlet-auth-id');
        if (authenticatedId !== candidateId) {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'You must log in to access the gauntlet.',
            });
            router.replace('/gauntlet/login');
            return;
        }
        setIsAuthenticated(true);

        const fetchCandidateData = async () => {
            if (!candidateId) return;
            setIsLoading(true);
            try {
                const candidateDocRef = doc(db, 'candidates', candidateId);
                const candidateDoc = await getDoc(candidateDocRef);

                if (candidateDoc.exists()) {
                    const candidateData = { id: candidateDoc.id, ...candidateDoc.data() } as Candidate;
                    setCandidate(candidateData);
                    if (candidateData.gauntletState) {
                        setGauntletState(candidateData.gauntletState);
                    } else {
                        // If no state exists, this is the first entry. Unlock the technical phase.
                        setGauntletState(prev => ({...prev, phase: 'Technical' }));
                    }
                } else {
                    console.error("No such candidate!");
                    setCandidate(null); 
                }
            } catch (error) {
                console.error("Error fetching candidate data:", error);
                toast({
                    title: "Database Error",
                    description: "Could not retrieve candidate information.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchCandidateData();
    }, [candidateId, toast, router]);

    useEffect(() => {
        // This effect handles auto-saving the gauntlet state to Firestore.
        const saveGauntletState = async () => {
            if (candidate && candidate.id && gauntletState.phase !== 'Locked' && isAuthenticated) {
                try {
                    const candidateDocRef = doc(db, 'candidates', candidate.id);
                    await updateDoc(candidateDocRef, {
                        gauntletState: JSON.parse(JSON.stringify(gauntletState)) 
                    });
                } catch (error) {
                    console.error("Failed to save gauntlet state:", error);
                    toast({
                        title: "Save Error",
                        description: "Could not save your progress. Please check your connection.",
                        variant: "destructive",
                    });
                }
            }
        }
        saveGauntletState();
    }, [gauntletState, candidate, toast, isAuthenticated]);


    const handleTechnicalComplete = async (report: string) => {
        setIsProcessing(true);
        toast({ title: "Phase 1 Complete", description: "Submitting report to the BOSS AI for validation." });
        
        setGauntletState(prev => ({...prev, phase: 'PendingReview', technicalReport: report }));

        try {
            const result = await finalInterviewReview({ interviewReport: report });
            
            setGauntletState(prev => {
                const newState = { ...prev, bossValidation: result };
                if (result.finalRecommendation === "Strong Hire" || result.finalRecommendation === "Proceed with Caution") {
                    toast({ title: "Validation Successful!", description: "The BOSS AI has approved you for the next phase." });
                    return { ...newState, phase: 'SystemDesign' };
                } else {
                    toast({ variant: 'destructive', title: "Gauntlet Ended", description: "After careful review, we will not be proceeding to the next phase." });
                    return { ...newState, phase: 'Complete' };
                }
            });

        } catch (error) {
            console.error("BOSS validation failed", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not get validation from the BOSS AI." });
            setGauntletState(prev => ({...prev, phase: 'Technical'})); 
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


    if (isLoading || !isAuthenticated) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /><p className="ml-4">Loading Candidate Portal...</p></div>;
    }

    if (!candidate) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="text-center p-8">
                    <CardHeader><CardTitle>Candidate Not Found</CardTitle></CardHeader>
                    <CardContent>
                        <CardDescription>The candidate ID is invalid or the interview does not exist.</CardDescription>
                        <Button onClick={() => router.push('/gauntlet/login')} className="mt-4">Return to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { phase } = gauntletState;

    if (phase === 'Technical' || phase === 'SystemDesign') {
        return (
            <InterviewGauntlet 
                candidate={candidate} 
                initialPhase={phase}
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
                        <div className="bg-green-100/50 border-green-400 p-4 rounded-lg">
                           <h4 className="font-bold text-green-700">Gauntlet Complete!</h4>
                           <p className="text-sm text-green-600">
                               Thank you for completing all phases. The hiring team will be in touch shortly with the next steps.
                           </p>
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
                        </div>
                    )}
                     {phase !== 'Complete' && isProcessing && (
                         <div className="flex items-center justify-center p-4 bg-yellow-100/50 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
                            <p className="ml-3 text-yellow-700 font-medium">Processing your submission...</p>
                        </div>
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
