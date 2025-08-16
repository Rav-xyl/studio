'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, Briefcase, Users, Loader2, Shield, Bell, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { GauntletMonitorTable } from '@/components/admin/gauntlet-monitor-table';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isSendingCommunications, setIsSendingCommunications] = useState(false);

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('admin-auth');
        if (isAdmin !== 'true') {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'You must be logged in as an admin to view this page.',
            });
            router.replace('/admin/login');
            return;
        }

        const candidatesUnsub = onSnapshot(collection(db, "candidates"), (snapshot) => {
            const candidatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Candidate[];
            setCandidates(candidatesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore connection error:", error);
            toast({
                title: "Connection Error",
                description: "Could not connect to the database.",
                variant: "destructive"
            });
            setIsLoading(false);
        });

        return () => candidatesUnsub();

    }, [router, toast]);

    const handleSendCommunications = async () => {
        setIsSendingCommunications(true);
        toast({ title: 'Initiating Communications', description: 'AI is processing candidates who have completed the Gauntlet...' });

        const completedCandidates = candidates.filter(c => c.gauntletState?.phase === 'Complete' && !c.communicationSent);
        
        if (completedCandidates.length === 0) {
            toast({ title: 'No New Communications Needed', description: 'No candidates have recently completed the Gauntlet.' });
            setIsSendingCommunications(false);
            return;
        }

        let hiredCount = 0;
        let rejectedCount = 0;

        try {
            const communicationPromises = completedCandidates.map(c => {
                const isHired = c.gauntletState?.finalReview?.finalRecommendation === 'Strong Hire';
                const stage = isHired ? 'Offer Extended' : 'Rejected';
                if (isHired) hiredCount++; else rejectedCount++;

                return aiDrivenCandidateEngagement({
                    candidateName: c.name,
                    candidateStage: stage,
                    jobTitle: c.role,
                    companyName: 'AstraHire',
                    recruiterName: 'The Hiring Team',
                    candidateSkills: c.skills.join(', '),
                    rejectionReason: 'After careful consideration of the final interview, we have decided to move forward with other candidates.'
                });
            });
            
            await Promise.all(communicationPromises);

            toast({
                title: 'Communications Sent!',
                description: `AI has sent ${hiredCount} offer emails and ${rejectedCount} rejection notices.`
            });

        } catch (error) {
            console.error('Failed to send communications:', error);
            toast({ variant: 'destructive', title: 'Communication Failed', description: 'Could not send emails. Check console for details.' });
        } finally {
            setIsSendingCommunications(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="ml-4">Loading Admin Dashboard...</p>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-secondary/50">
            <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-10 h-10 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Command Center</h1>
                        <p className="text-sm text-muted-foreground">
                            Oversee the entire talent acquisition pipeline.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSendCommunications} disabled={isSendingCommunications}>
                        {isSendingCommunications ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        Send Final Communications
                    </Button>
                </div>
            </header>
            
            <main className="space-y-8">
                <GauntletMonitorTable candidates={candidates} />
                {/* Other admin components like full reporting, user management etc. can be added here */}
            </main>
        </div>
    );
}
