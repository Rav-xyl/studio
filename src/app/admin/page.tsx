'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, Send, Bell, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Candidate, JobRole, ProactiveSourcingNotification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { GauntletMonitorTable } from '@/components/admin/gauntlet-monitor-table';
import { AllCandidatesTable } from '@/components/admin/all-candidates-table';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { proactiveCandidateSourcing } from '@/ai/flows/proactive-candidate-sourcing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [notifications, setNotifications] = useState<ProactiveSourcingNotification[]>([]);
    const [isSendingCommunications, setIsSendingCommunications] = useState(false);
    const [isSourcing, setIsSourcing] = useState(false);

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

        const unsubscribes: (() => void)[] = [];

        // Fetch ALL candidates, including archived ones
        const candidatesUnsub = onSnapshot(collection(db, "candidates"), (snapshot) => {
            setAllCandidates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Candidate[]);
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore connection error (candidates):", error);
            toast({ title: "Connection Error", description: "Could not connect to candidates.", variant: "destructive" });
        });
        unsubscribes.push(candidatesUnsub);

        const rolesUnsub = onSnapshot(collection(db, "roles"), (snapshot) => {
            setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobRole[]);
        });
        unsubscribes.push(rolesUnsub);
        
        const notificationsUnsub = onSnapshot(collection(db, "notifications"), (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProactiveSourcingNotification[]);
        });
        unsubscribes.push(notificationsUnsub);


        return () => unsubscribes.forEach(unsub => unsub());

    }, [router, toast]);
    
    const handleProactiveSourcing = async () => {
        setIsSourcing(true);
        toast({ title: "AI Sourcing Agent Activated", description: "Scanning for high-potential, unassigned candidates..." });
        try {
            const unassignedCandidates = allCandidates.filter(c => c.role === 'Unassigned' && !c.archived);
            const result = await proactiveCandidateSourcing({
                candidates: unassignedCandidates,
                roles: roles
            });

            if (result.notifications.length > 0) {
                 for (const notification of result.notifications) {
                    const notificationRef = doc(db, 'notifications', `${notification.candidateId}-${notification.roleId}`);
                    await setDoc(notificationRef, notification, { merge: true });
                }
                toast({ title: "Sourcing Complete", description: `AI identified ${result.notifications.length} new high-value opportunities.` });
            } else {
                 toast({ title: "Sourcing Complete", description: "No new high-value opportunities found at this time." });
            }
        } catch (error) {
            console.error("Proactive sourcing failed:", error);
            toast({ title: "Sourcing Error", description: "The AI agent encountered an error.", variant: "destructive" });
        } finally {
            setIsSourcing(false);
        }
    }
    
    const handleAssignCandidate = async (notification: ProactiveSourcingNotification) => {
        try {
            await updateDoc(doc(db, 'candidates', notification.candidateId), {
                role: notification.roleTitle
            });
            await updateDoc(doc(db, 'notifications', notification.id), {
                status: 'actioned'
            });
            toast({ title: "Candidate Assigned!", description: `${notification.candidateName} has been assigned to ${notification.roleTitle}.` });
        } catch (error) {
            console.error("Failed to assign candidate:", error);
            toast({ title: "Assignment Failed", description: "Could not assign the candidate.", variant: "destructive" });
        }
    };


    const handleSendCommunications = async () => {
        setIsSendingCommunications(true);
        toast({ title: 'Initiating Communications', description: 'AI is processing candidates who have completed the Gauntlet...' });

        const completedCandidates = allCandidates.filter(c => c.gauntletState?.phase === 'Complete' && !c.communicationSent);
        
        if (completedCandidates.length === 0) {
            toast({ title: 'No New Communications Needed', description: 'No candidates have recently completed the Gauntlet.' });
            setIsSendingCommunications(false);
            return;
        }

        let hiredCount = 0;
        let rejectedCount = 0;

        try {
            const communicationPromises = completedCandidates.map(async (c) => {
                const isHired = c.gauntletState?.designReview?.finalRecommendation === 'Strong Hire';
                const stage = isHired ? 'Offer Extended' : 'Rejected';
                if (isHired) hiredCount++; else rejectedCount++;

                await aiDrivenCandidateEngagement({
                    candidateName: c.name,
                    candidateStage: stage,
                    jobTitle: c.role,
                    companyName: 'AstraHire',
                    recruiterName: 'The Hiring Team',
                    candidateSkills: c.skills.join(', '),
                    rejectionReason: 'After careful consideration of the final interview, we have decided to move forward with other candidates.'
                });

                // Mark communication as sent
                await updateDoc(doc(db, 'candidates', c.id), { communicationSent: true });
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

    const handleDeleteCandidate = async (candidateId: string) => {
      try {
          await deleteDoc(doc(db, 'candidates', candidateId));
          toast({ title: "Candidate Deleted", description: "The candidate has been permanently removed from the database." });
      } catch (error) {
          console.error("Failed to delete candidate:", error);
          toast({ title: "Deletion Failed", description: "Could not delete the candidate. See console for details.", variant: 'destructive' });
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
    
    const pendingNotifications = notifications.filter(n => n.status === 'pending');

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
                     <Button onClick={handleProactiveSourcing} variant="outline" disabled={isSourcing}>
                        {isSourcing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserCheck className="mr-2 h-4 w-4" />}
                        Run Sourcing Agent
                    </Button>
                    <Button onClick={handleSendCommunications} disabled={isSendingCommunications}>
                        {isSendingCommunications ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        Send Final Communications
                    </Button>
                </div>
            </header>
            
            <main className="space-y-8">
                {pendingNotifications.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                Proactive Sourcing Alerts
                            </CardTitle>
                            <CardDescription>
                                The AI Sourcing Agent has identified high-potential candidates for open roles.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {pendingNotifications.map(notification => (
                                <div key={notification.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                                    <p className="text-sm">
                                        <span className="font-semibold">{notification.candidateName}</span> is a strong match for <span className="font-semibold">{notification.roleTitle}</span> (Score: {notification.confidenceScore})
                                    </p>
                                    <Button size="sm" onClick={() => handleAssignCandidate(notification)}>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Assign Role
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
                <GauntletMonitorTable candidates={allCandidates} />
                <AllCandidatesTable candidates={allCandidates} onDeleteCandidate={handleDeleteCandidate} />
            </main>
        </div>
    );
}
