'use client';

import { useState } from 'react';
import { Loader2, Shield, Send, Bell, UserCheck, LogOut, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, updateDoc, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch, getDoc, arrayUnion } from 'firebase/firestore';
import type { Candidate, JobRole, ProactiveSourcingNotification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { GauntletMonitorTable } from '@/components/admin/gauntlet-monitor-table';
import { AllCandidatesTable } from '@/components/admin/all-candidates-table';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { proactiveCandidateSourcing } from '@/ai/flows/proactive-candidate-sourcing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminTabProps {
    allCandidates: Candidate[];
    roles: JobRole[];
    notifications: ProactiveSourcingNotification[];
    onLogout: () => void;
    onNavigateToApp: () => void;
}

export function AdminTab({ allCandidates, roles, notifications, onLogout, onNavigateToApp }: AdminTabProps) {
    const { toast } = useToast();
    const [isSendingCommunications, setIsSendingCommunications] = useState(false);
    const [isSourcing, setIsSourcing] = useState(false);

    const handleProactiveSourcing = async () => {
        setIsSourcing(true);
        toast({ title: "AI Sourcing Agent Activated", description: "Scanning for high-potential, unassigned candidates..." });
        try {
            const pendingNotificationsQuery = query(collection(db, "notifications"), where("status", "==", "pending"));
            const pendingNotificationsSnapshot = await getDocs(pendingNotificationsQuery);
            if (!pendingNotificationsSnapshot.empty) {
                const batch = writeBatch(db);
                pendingNotificationsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }

            const unassignedCandidates = allCandidates.filter(c => c.role === 'Unassigned' && !c.archived);
            const result = await proactiveCandidateSourcing({
                candidates: unassignedCandidates,
                roles: roles
            });

            if (result.notifications.length > 0) {
                 for (const notification of result.notifications) {
                    const notificationRef = doc(db, 'notifications', `${notification.candidateId}-${notification.roleId}`);
                    await setDoc(notificationRef, { ...notification, id: notificationRef.id }, { merge: true });
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
            const candidateRef = doc(db, 'candidates', notification.candidateId);
            const candidateDoc = await getDoc(candidateRef);

            if (!candidateDoc.exists()) {
                toast({
                    variant: 'destructive',
                    title: 'Ghost Candidate Detected',
                    description: `Candidate ${notification.candidateName} no longer exists. Deleting stale notification.`,
                });
                await deleteDoc(doc(db, 'notifications', notification.id));
                return;
            }

            await updateDoc(candidateRef, {
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

                const emailResult = await aiDrivenCandidateEngagement({
                    candidateName: c.name,
                    candidateStage: stage,
                    jobTitle: c.role,
                    companyName: 'AstraHire',
                    recruiterName: 'The Hiring Team',
                    candidateSkills: c.skills.join(', '),
                    rejectionReason: 'After careful consideration of the final interview, we have decided to move forward with other candidates.'
                });
                
                await updateDoc(doc(db, 'candidates', c.id), { 
                    communicationSent: true,
                    log: arrayUnion({
                        timestamp: new Date().toISOString(),
                        event: `AI Email Drafted: ${stage}`,
                        details: `Subject: ${emailResult.emailSubject}\nBody: ${emailResult.emailBody}`,
                        author: 'AI',
                    })
                });
            });
            
            await Promise.all(communicationPromises);

            toast({
                title: 'Communications Sent!',
                description: `AI has drafted ${hiredCount} offer emails and ${rejectedCount} rejection notices. Check candidate logs to view content.`
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

          const notificationsQuery = query(collection(db, 'notifications'), where('candidateId', '==', candidateId));
          const querySnapshot = await getDocs(notificationsQuery);

          if (!querySnapshot.empty) {
              const batch = writeBatch(db);
              querySnapshot.forEach((doc) => {
                  batch.delete(doc.ref);
              });
              await batch.commit();
          }

          toast({ title: "Candidate Deleted", description: "The candidate and all related notifications have been permanently removed." });
      } catch (error) {
          console.error("Failed to delete candidate:", error);
          toast({ title: "Deletion Failed", description: "Could not delete the candidate. See console for details.", variant: 'destructive' });
      }
    };

    const candidateIds = new Set(allCandidates.map(c => c.id));
    const pendingNotifications = notifications.filter(n => n.status === 'pending' && candidateIds.has(n.candidateId));

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap justify-between items-center gap-4">
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
                     <Button onClick={onNavigateToApp} variant="outline">
                        <Home className="mr-2 h-4 w-4" />
                        Back to App
                    </Button>
                     <Button onClick={handleProactiveSourcing} variant="outline" disabled={isSourcing}>
                        {isSourcing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserCheck className="mr-2 h-4 w-4" />}
                        Run Sourcing Agent
                    </Button>
                    <Button onClick={handleSendCommunications} disabled={isSendingCommunications}>
                        {isSendingCommunications ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        Send Final Communications
                    </Button>
                     <Button onClick={onLogout} variant="destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Exit Admin Mode
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
