
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Candidate, GauntletPhase, GauntletState } from '@/lib/types';
import { finalInterviewReview } from '@/ai/flows/final-interview-review';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { skillGapAnalysis } from '@/ai/flows/skill-gap-analysis';

const InterviewGauntlet = dynamic(() => import('@/components/interview/interview-gauntlet').then(mod => mod.InterviewGauntlet), {
    ssr: false,
    loading: () => <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /><p className="ml-4">Loading Gauntlet...</p></div>
});

type StageStatus = 'Locked' | 'Unlocked' | 'Pending' | 'Complete' | 'Failed';

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
        techReview: null,
        systemDesignReport: null,
        designReview: null,
    });
    
    useEffect(() => {
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
                        // Start at technical phase if no state exists
                        setGauntletState(prev => ({...prev, phase: 'Technical' }));
                    }
                } else {
                    console.error("No such candidate!");
                    toast({
                        title: "Candidate Not Found",
                        description: "The provided ID does not match any candidate.",
                        variant: "destructive",
                    });
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

    // This effect is the source of truth for saving state to the DB.
    useEffect(() => {
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

    const handleFailure = async (reason: string) => {
        if (!candidate) return;
        
        const finalFailedState = { ...gauntletState, phase: 'Failed' as GauntletPhase };
        setGauntletState(finalFailedState);

        await aiDrivenCandidateEngagement({
            candidateName: candidate.name,
            candidateStage: 'Rejected',
            jobTitle: candidate.role,
            companyName: 'AstraHire',
            recruiterName: 'The Hiring Team',
            candidateSkills: candidate.skills.join(', '),
            rejectionReason: `After a careful review of the ${reason}, we have decided to move forward with other candidates.`,
        });

        await updateDoc(doc(db, 'candidates', candidate.id), { 
            archived: true, 
            gauntletState: finalFailedState 
        });

        toast({ variant: 'destructive', title: "Gauntlet Ended", description: "After careful review, we will not be proceeding." });
    };

    const handlePhaseComplete = async (phase: 'Technical' | 'SystemDesign', report: string) => {
        setIsProcessing(true);
        toast({ title: `Phase Complete: ${phase}`, description: "Submitting report to the BOSS AI for validation." });
        
        const reportKey = `${phase.charAt(0).toLowerCase() + phase.slice(1)}Report` as keyof GauntletState;
        
        const pendingState = phase === 'Technical' ? 'PendingTechReview' : 'PendingDesignReview';
        setGauntletState(prev => ({ ...prev, phase: pendingState as GauntletPhase, [reportKey]: report }));

        try {
            const result = await finalInterviewReview({ interviewReport: report });
            const reviewKey = phase === 'Technical' ? 'techReview' : 'designReview';
            
            const isPass = result.finalRecommendation === "Strong Hire";

            // Update state with the review result FIRST
            const reviewedState: GauntletState = {
                ...gauntletState,
                phase: pendingState as GauntletPhase,
                [reportKey]: report,
                [reviewKey]: result
            };
            
            if (isPass) {
                if (phase === 'Technical') {
                    setGauntletState({ ...reviewedState, phase: 'SystemDesign' });
                    toast({ title: "Validation Successful!", description: "The BOSS AI has approved you for the next phase." });
                } else { // Passed System Design
                    const finalState: GauntletState = { ...reviewedState, phase: 'Complete' };
                    setGauntletState(finalState);
                    
                    if (candidate) {
                        // This is the FINAL update for a successful Gauntlet run
                        await updateDoc(doc(db, 'candidates', candidate.id), { 
                            status: 'Interview', 
                            gauntletState: finalState 
                        });
                        toast({ title: "Gauntlet Passed!", description: "You have passed the technical assessment. The hiring team has been notified." });
                    }
                }
            } else {
                // Failure at any stage
                await handleFailure(`${phase} Assessment`);
                setGauntletState({ ...reviewedState, phase: 'Failed' });
            }
        } catch (error) {
            console.error("BOSS validation failed", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not get validation from the BOSS AI." });
            const originalPhase = phase as GauntletPhase;
            setGauntletState(prev => ({...prev, phase: originalPhase })); 
        } finally {
            setIsProcessing(false);
        }
    };


    const getGrandReport = () => {
        let report = `GRAND DOSSIER FOR CANDIDATE: ${candidate?.name}\n\n`;
        report += `ROLE: ${candidate?.role}\n`;
        report += `DATE: ${new Date().toLocaleDateString()}\n`;
        report += `==================================================\n\n`;

        report += `--- PHASE 1: TECHNICAL EXAM ---\n`;
        report += gauntletState.technicalReport || "Phase not completed or data not available.";
        report += `\n\n--- BOSS AI VALIDATION (TECHNICAL) ---\n`;
        report += gauntletState.techReview ? `Recommendation: ${gauntletState.techReview.finalRecommendation}\nAssessment: ${gauntletState.techReview.overallAssessment}` : "No validation data.";
        
        report += `\n\n==================================================\n\n`;
        
        report += `--- PHASE 2: SYSTEM DESIGN CHALLENGE ---\n`;
        report += gauntletState.systemDesignReport || "Phase not completed or data not available.";
        report += `\n\n--- BOSS AI VALIDATION (SYSTEM DESIGN) ---\n`;
        report += gauntletState.designReview ? `Recommendation: ${gauntletState.designReview.finalRecommendation}\nAssessment: ${gauntletState.designReview.overallAssessment}` : "Phase not completed.";
        
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
                onPhaseComplete={handlePhaseComplete}
            />
        );
    }

    const stageStatus = (stage: 'Technical' | 'SystemDesign'): StageStatus => {
        if (phase === 'Failed') {
            const techFailed = gauntletState.techReview && gauntletState.techReview.finalRecommendation !== 'Strong Hire';
            const designFailed = gauntletState.designReview && gauntletState.designReview.finalRecommendation !== 'Strong Hire';

            if (stage === 'Technical' && techFailed) return 'Failed';
            if (stage === 'Technical' && !techFailed) return 'Complete';
            if (stage === 'SystemDesign' && designFailed) return 'Failed';
            if (stage === 'SystemDesign' && !designFailed && techFailed) return 'Locked';
            if (stage === 'SystemDesign' && !designFailed && !techFailed) return 'Complete';
            return 'Failed';
        }
        
        if(phase === 'Complete') return 'Complete';

        if(phase === 'Technical' || phase === 'PendingTechReview') {
            return stage === 'Technical' ? 'Unlocked' : 'Locked';
        }
        if(phase === 'SystemDesign' || phase === 'PendingDesignReview') {
             return stage === 'Technical' ? 'Complete' : 'Unlocked';
        }
        
        return 'Locked';
    }

    return (
         <div className="flex items-center justify-center h-screen bg-secondary">
            <Card className="w-full max-w-2xl p-8 text-center">
                <CardHeader>
                    <CardTitle className="text-3xl">Your Gauntlet Progress</CardTitle>
                    <CardDescription>Welcome back, {candidate.name}. Here is your current status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PhaseCard 
                        icon={<BrainCircuit />}
                        title="Phase 1: Technical Exam"
                        description="An AI-driven technical deep-dive based on your skills."
                        status={stageStatus('Technical')}
                    />
                    <PhaseCard 
                        icon={<FileText />}
                        title="Phase 2: System Design Challenge"
                        description="A conceptual challenge to assess your architectural abilities."
                        status={stageStatus('SystemDesign')}
                    />
                     {(phase === 'Complete' || phase === 'Failed') && (
                        <div className={`${phase === 'Complete' ? 'bg-green-100/50 border-green-400' : 'bg-red-100/50 border-red-400'} p-6 rounded-lg border text-left`}>
                           <div className="flex items-center gap-3">
                                {phase === 'Complete' ? <CheckCircle className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
                               <div>
                                   <h4 className={`font-bold text-xl ${phase === 'Complete' ? 'text-green-800' : 'text-red-800'}`}>
                                       Gauntlet {phase === 'Complete' ? 'Complete!' : 'Ended'}
                                   </h4>
                                   <p className={`text-sm mt-1 ${phase === 'Complete' ? 'text-green-700' : 'text-red-700'}`}>
                                       {phase === 'Complete' 
                                           ? "Congratulations! You have passed the technical assessment. The hiring team has been notified and will be in touch with the next steps." 
                                           : "Thank you for your time. After careful consideration, we will not be moving forward with your candidacy for this role."}
                                   </p>
                               </div>
                           </div>
                           <Button variant="outline" className="mt-4 w-full" onClick={() => {
                               const report = getGrandReport();
                               const blob = new Blob([report], { type: 'text/plain' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `Gauntlet_Report_${candidate.name.replace(/\s/g, '_')}.txt`;
                               a.click();
                               URL.revokeObjectURL(url);
                           }}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Your Final Report
                            </Button>
                        </div>
                    )}
                     {(phase.startsWith('Pending')) && (
                         <div className="flex items-center justify-center p-4 bg-yellow-100/50 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
                            <p className="ml-3 text-yellow-700 font-medium">Processing your submission... The BOSS AI is reviewing your performance.</p>
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
        Failed: "bg-red-600/80 text-white"
    };
    
    let statusIcon = null;
    if(status === 'Complete') statusIcon = <CheckCircle className="h-4 w-4" />;
    if(status === 'Failed') statusIcon = <XCircle className="h-4 w-4" />;

    return (
        <div className={`p-4 rounded-lg flex items-center gap-4 border text-left ${statusStyles[status]}`}>
            <div className="text-2xl">{icon}</div>
            <div className="flex-grow">
                <h3 className="font-bold">{title}</h3>
                <p className="text-xs opacity-80">{description}</p>
            </div>
             <div className="flex items-center gap-2">
                {statusIcon}
                <span className="text-sm font-medium opacity-90">{status}</span>
             </div>
        </div>
    )
}
