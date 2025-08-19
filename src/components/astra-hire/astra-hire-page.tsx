
'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Briefcase, Users, Loader2, Shield, X, Search, HelpCircle, MessageSquare, Notebook, UserCog, Megaphone, Bell } from 'lucide-react';
import { AstraHireHeader } from './astra-hire-header';
import { CandidatePoolTab } from '../kanban/candidate-pool-tab';
import { RolesTab } from '../roles/roles-tab';
import { AnalyticsTab } from '../analytics/analytics-tab';
import type { Candidate, JobRole, KanbanStatus, LogEntry, RubricChange, RoleMatch, ProactiveSourcingNotification, Announcement } from '@/lib/types';
import { automatedResumeScreening } from '@/ai/flows/automated-resume-screening';
import { SaarthiReportModal } from './saarthi-report-modal';
import { useToast } from '@/hooks/use-toast';
import { synthesizeJobDescription } from '@/ai/flows/automated-job-description-synthesis';
import { nanoid } from 'nanoid';
import { reEngageCandidate } from '@/ai/flows/re-engage-candidate';
import { finalInterviewReview } from '@/ai/flows/final-interview-review';
import { draftOfferLetter } from '@/ai/flows/autonomous-offer-drafting';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, getDocs, query, where, arrayUnion, getDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { GauntletPortalTab } from '../gauntlet/gauntlet-portal-tab';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { MatchedCandidatesDialog } from '../roles/matched-candidates-dialog';
import { ProspectingTab } from '../prospecting/prospecting-tab';
import { bulkMatchCandidatesToRoles } from '@/ai/flows/bulk-match-candidates';
import { useRouter } from 'next/navigation';
import { AdminTab } from '../admin/admin-tab';
import { AnnouncementsTab } from '../announcements/announcements-tab';


// --- Helper Functions ---
function convertFileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

const addLog = async (candidateId: string, logEntry: Omit<LogEntry, 'timestamp'>) => {
    const candidateRef = doc(db, 'candidates', candidateId);
    await updateDoc(candidateRef, {
        log: arrayUnion({
            ...logEntry,
            timestamp: new Date().toISOString(),
        })
    });
};

export interface BackgroundTask {
    id: string;
    type: 'Screening' | 'Simulation' | 'Audit' | 'Matching' | 'BulkMatching';
    status: 'in-progress' | 'complete' | 'error';
    progress: number;
    total: number;
    message: string;
}

export default function AstraHirePage() {
  const [activeTab, setActiveTab] = useState('roles');
  const router = useRouter();

  // --- State Management ---
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notifications, setNotifications] = useState<ProactiveSourcingNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [lastSaarthiReport, setLastSaarthiReport] = useState<any>(null);
  const [filteredRole, setFilteredRole] = useState<JobRole | null>(null);
  const [suggestedChanges, setSuggestedChanges] = useState<RubricChange[]>([]);
  const [backgroundTask, setBackgroundTask] = useState<BackgroundTask | null>(null);
  const [isMatchesDialogOpen, setIsMatchesDialogOpen] = useState(false);
  const [matchedCandidates, setMatchedCandidates] = useState<RoleMatch[]>([]);
  const [selectedRoleForMatching, setSelectedRoleForMatching] = useState<JobRole | null>(null);
  const [matchResults, setMatchResults] = useState<Record<string, any[]>>({});
  const [isAdmin, setIsAdmin] = useState(false);


  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaarthiReportOpen, setIsSaarthiReportOpen] = useState(false);
  const { toast } = useToast();

  // --- Firestore Data Fetching ---
  useEffect(() => {
     // Check for admin auth
    const authData = localStorage.getItem('admin-auth');
    if (authData) {
        setIsAdmin(true);
        setActiveTab('admin');
    }
    
    const candidatesUnsub = onSnapshot(collection(db, "candidates"), (snapshot) => {
        const candidatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Candidate[];
        setCandidates(candidatesData);
        setIsLoading(false);
    }, (error) => {
        console.error("Firestore connection error:", error);
        toast({
            title: "Connection Error",
            description: "Could not connect to the database. Please check your connection and refresh.",
            variant: "destructive"
        });
        setIsLoading(false);
    });

    const rolesUnsub = onSnapshot(collection(db, "roles"), (snapshot) => {
        const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobRole[];
        setRoles(rolesData);
    });

     const notificationsUnsub = onSnapshot(collection(db, "notifications"), (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProactiveSourcingNotification[]);
    });
    
    const announcementsQuery = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const announcementsUnsub = onSnapshot(announcementsQuery, (snapshot) => {
        const allAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        setAnnouncements(allAnnouncements);

        const lastReadTimestamp = localStorage.getItem('lastReadAnnouncementTimestamp');
        if (lastReadTimestamp && allAnnouncements.length > 0) {
            const newAnnouncements = allAnnouncements.filter(ann => ann.createdAt && ann.createdAt.toDate().toISOString() > lastReadTimestamp);
            setUnreadAnnouncements(newAnnouncements.length);
        } else {
            setUnreadAnnouncements(allAnnouncements.length);
        }
    });

    // Cleanup subscription on unmount
    return () => {
        candidatesUnsub();
        rolesUnsub();
        notificationsUnsub();
        announcementsUnsub();
    };
  }, [toast]);


  // --- Core Logic ---
    const handleUpdateCandidate = async (updatedCandidate: Candidate) => {
        const originalCandidate = candidates.find(c => c.id === updatedCandidate.id);
        if (!originalCandidate) return;
        
        // --- Divine Law & Order: Gauntlet Validation (OVERRIDDEN for Admins) ---
        if (!isAdmin) {
            const hasFailedGauntlet = originalCandidate.gauntletState?.phase === 'Failed';
            if (hasFailedGauntlet && (updatedCandidate.status === 'Interview' || updatedCandidate.status === 'Hired')) {
                toast({
                    variant: 'destructive',
                    title: 'Action Blocked by Divine Law',
                    description: 'This candidate has failed the Gauntlet and cannot be moved forward.'
                });
                return; // Halt execution
            }

            const isGauntletRequired = (originalCandidate.aiInitialScore || 0) >= 70;
            const isGauntletComplete = originalCandidate.gauntletState?.phase === 'Complete';
            if (isGauntletRequired && updatedCandidate.status === 'Hired' && !isGauntletComplete) {
                toast({
                    variant: 'destructive',
                    title: 'Action Blocked by Divine Law',
                    description: 'A candidate with a high score must pass the Gauntlet to be hired.'
                });
                return; // Halt execution
            }
        }
        
        // Optimistically update UI
        setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));

        // Persist to Firestore
        const { id, ...candidateData } = updatedCandidate;
        if (!id) {
            console.error("Candidate ID is missing. Cannot update.");
            return;
        }

        if (originalCandidate.status !== updatedCandidate.status) {
            await addLog(id, {
                event: 'Status Change',
                details: `Candidate moved from ${originalCandidate.status} to ${updatedCandidate.status}`,
                author: isAdmin ? 'Admin' : 'System',
            });
        }

        const candidateDocRef = doc(db, 'candidates', id);
        try {
            await updateDoc(candidateDocRef, candidateData);
        } catch (error) {
            console.error("Failed to update candidate:", error);
            // Revert optimistic update on failure
            setCandidates(prev => prev.map(c => c.id === originalCandidate.id ? originalCandidate : c));
            toast({ title: "Update Failed", description: "Could not save candidate changes.", variant: "destructive" });
        }
    };
    
  const handleAddRole = async (newRole: Omit<JobRole, 'id' | 'openings'>, candidateToUpdate?: Candidate) => {
    
    const existingRole = roles.find(role => role.title.toLowerCase() === newRole.title.toLowerCase());
    if(existingRole) {
        toast({
            title: 'Role Already Exists',
            description: `A role named "${newRole.title}" already exists.`,
            variant: 'destructive'
        });
        if (candidateToUpdate) {
            await handleUpdateCandidate({ ...candidateToUpdate, role: existingRole.title });
            await addLog(candidateToUpdate.id, {
                event: 'Role Assigned',
                details: `Candidate manually assigned to existing role: ${existingRole.title}`,
                author: 'System'
            });
        }
        return;
    }
    
    const newRoleRef = doc(collection(db, 'roles'));
    const fullNewRole: JobRole = {
        id: newRoleRef.id,
        ...newRole,
        openings: 1,
    };
    
    if (candidateToUpdate) {
        await setDoc(newRoleRef, fullNewRole);
        // We call handleUpdateCandidate to ensure all logic/logging is applied
        await handleUpdateCandidate({ ...candidateToUpdate, role: fullNewRole.title });
        
        await addLog(candidateToUpdate.id, {
            event: 'Role Assigned',
            details: `Candidate assigned to newly created role: ${fullNewRole.title}`,
            author: 'AI'
        });
        toast({ title: 'Role Added & Assigned', description: `Successfully added ${fullNewRole.title} and assigned to ${candidateToUpdate.name}.` });
    } else {
        await setDoc(newRoleRef, fullNewRole);
        toast({ title: 'Role Added', description: `Successfully added ${fullNewRole.title}.` });
    }
  };


    const handleBulkUpload = async (files: FileList | null, companyType: 'startup' | 'enterprise') => {
        if (!files || files.length === 0) return;

        const taskId = `task-${nanoid(5)}`;
        setBackgroundTask({
            id: taskId, type: 'Screening', status: 'in-progress',
            progress: 0, total: files.length, message: 'Starting uploads...',
        });

        const filesToProcess = Array.from(files);
        let processedCount = 0;
        let successfulCount = 0;
        let skippedCount = 0;

        const currentCandidatesSnapshot = await getDocs(collection(db, 'candidates'));
        const existingCandidateNames = new Set(currentCandidatesSnapshot.docs.map(doc => doc.data().name?.toLowerCase()));

        const processFile = async (file: File) => {
            try {
                // 1. AI Screening
                const resumeDataUri = await convertFileToDataUri(file);
                const result = await automatedResumeScreening({ resumeDataUri, fileName: file.name, companyType });
                
                // 2. Duplicate Check
                if (existingCandidateNames.has(result.extractedInformation.name.toLowerCase())) {
                    skippedCount++;
                    toast({
                        title: 'Duplicate Skipped',
                        description: `A candidate named ${result.extractedInformation.name} already exists.`,
                    });
                    return; // Stop processing this file
                }

                // 3. File Upload to Storage
                const candidateId = `cand-${nanoid(10)}`;
                const storageRef = ref(storage, `resumes/${candidateId}/${file.name}`);
                await uploadBytes(storageRef, file);
                const resumeUrl = await getDownloadURL(storageRef);

                // 4. Create and Save Candidate to Database
                const status: KanbanStatus = result.candidateScore < 40 ? 'Sourcing' : 'Screening';
                const archived = result.candidateScore < 40;
                
                const newCandidate: Omit<Candidate, 'id'> = {
                    ...result.extractedInformation,
                    status,
                    role: 'Unassigned',
                    aiInitialScore: result.candidateScore,
                    lastUpdated: new Date().toISOString(),
                    archived,
                    resumeUrl, // The crucial link
                    log: [{
                        timestamp: new Date().toISOString(),
                        event: 'Resume Uploaded & Screened',
                        details: `Profile created from ${file.name}. Initial score: ${result.candidateScore}.`,
                        author: 'AI',
                    }],
                };

                await setDoc(doc(db, "candidates", candidateId), newCandidate);
                successfulCount++;
                existingCandidateNames.add(newCandidate.name.toLowerCase()); // Update the set to prevent duplicates within the same batch

            } catch (error) {
                console.error(`Failed to process ${file.name}:`, error);
                toast({
                    title: `Processing Error`, description: `Could not process ${file.name}.`,
                    variant: 'destructive',
                });
            } finally {
                processedCount++;
                setBackgroundTask(prev => prev ? { ...prev, progress: processedCount, message: `Screening: ${file.name}` } : null);
            }
        };

        // Run all file processing in parallel
        await Promise.all(filesToProcess.map(file => processFile(file)));

        let completionMessage = `Screening complete. ${successfulCount} new candidate(s) added.`;
        if (skippedCount > 0) completionMessage += ` ${skippedCount} duplicate(s) skipped.`;
        
        toast({ title: "Bulk Upload Finished", description: completionMessage });
        setBackgroundTask(prev => prev ? { ...prev, status: 'complete', message: completionMessage } : null);
        setTimeout(() => setBackgroundTask(null), 5000);
    };
  
    const handleStimulateFullPipeline = async () => {
        const taskId = `task-${nanoid(5)}`;
        const task: BackgroundTask = {
            id: taskId,
            type: 'Simulation',
            status: 'in-progress',
            progress: 0,
            total: 5,
            message: 'Starting pipeline simulation...'
        };
        setBackgroundTask(task);

        const currentSimulationLog: any[] = [];
        
        const log = (step: string, description: string) => {
            console.log(`[SAARTHI LOG] ${step}: ${description}`);
            currentSimulationLog.push({ step, description });
        };

        try {
            log("Start Simulation", "Beginning autonomous pipeline simulation.");
            setBackgroundTask(prev => prev ? ({ ...prev, progress: 1, message: 'Phase 1/5: Sourcing...' }) : null);
            
            const candidatesForSim = [...candidates];
            const topCandidate = candidatesForSim
                .filter(c => c.status === 'Screening' && !c.archived)
                .sort((a,b) => (b.aiInitialScore || 0) - (a.aiInitialScore || 0))[0];

            if(!topCandidate) {
                throw new Error("Simulation ended: No qualified candidates found in 'Screening'. Add some candidates to run a simulation.");
            }
            log("Talent Identification", `Identified top talent: ${topCandidate.name} (Score: ${topCandidate.aiInitialScore}).`);

            setBackgroundTask(prev => prev ? ({ ...prev, progress: 2, message: 'Phase 2/5: Synthesizing Role...' }) : null);
            
            const targetRoleTitle = "Lead Software Engineer";
            log("Role Suggestion", `AI suggested a role similar to '${targetRoleTitle}' for ${topCandidate.name}.`);

            const jdResult = await synthesizeJobDescription({ jobDescriptionText: `Seeking a candidate for ${targetRoleTitle} with skills like ${topCandidate.skills.join(', ')}.` });
            const newRole: JobRole = { id: `role-${nanoid(10)}`, title: targetRoleTitle, description: jdResult.formattedDescription, department: "Engineering", openings: 1 };
            await setDoc(doc(db, 'roles', newRole.id), newRole);
            log("Role Synthesis Complete", `Created and saved new role: '${newRole.title}'.`);

            setBackgroundTask(prev => prev ? ({ ...prev, progress: 3, message: 'Phase 3/5: Simulating Gauntlet...' }) : null);
            log("Gauntlet Simulation", `Simulating technical gauntlet for ${topCandidate.name}.`);
            const bossReview = await finalInterviewReview({interviewReport: "Simulated Technical and System Design phases. The candidate demonstrated exceptional problem-solving skills and a strong grasp of architectural principles."});
            
            if (bossReview.finalRecommendation !== "Strong Hire") {
                await updateDoc(doc(db, 'candidates', topCandidate.id), { archived: true, 'gauntletState.phase': 'Failed' });
                throw new Error(`Simulation ended: Top candidate ${topCandidate.name} did not pass the Gauntlet. Recommendation: ${bossReview.finalRecommendation}.`);
            }
            log("BOSS Validation", `BOSS AI approved ${topCandidate.name} with recommendation: ${bossReview.finalRecommendation}.`);

            setBackgroundTask(prev => prev ? ({ ...prev, progress: 4, message: 'Phase 4/5: Promoting to Interview...' }) : null);
            await updateDoc(doc(db, 'candidates', topCandidate.id), { 
                status: 'Interview', 
                role: newRole.title,
                'gauntletState.phase': 'Complete'
            });
            log("Pipeline Progression", `Moved ${topCandidate.name} to 'Interview' and assigned role '${newRole.title}'.`);

            setBackgroundTask(prev => prev ? ({ ...prev, progress: 5, message: 'Phase 5/5: Drafting Offer & Hiring...' }) : null);
            const offer = await draftOfferLetter({
               candidateName: topCandidate.name, roleTitle: newRole.title, candidateSkills: topCandidate.skills, candidateExperience: topCandidate.narrative, companyName: "AstraHire Client", companySalaryBands: "Senior: $120k-$150k", simulatedMarketData: "Market avg: $135k"
            });
            log("Offer Drafted", `Market-aware offer drafted for ${topCandidate.name} with salary ${offer.suggestedSalary}.`);
            
            await updateDoc(doc(db, 'candidates', topCandidate.id), { status: 'Hired' });
            log("Hiring Decision", `Autonomously hired ${topCandidate.name} for the role of ${newRole.title}.`);
            
            setLastSaarthiReport({
                reportType: "Pipeline Simulation",
                simulationSummary: `The end-to-end simulation successfully processed the pipeline. It identified ${topCandidate.name} as a top candidate, synthesized the role of '${newRole.title}', validated them through the Gauntlet, and autonomously hired them.`,
                detailedProcessLog: currentSimulationLog,
            });
            setIsSaarthiReportOpen(true);
            setBackgroundTask(prev => prev ? { ...prev, status: 'complete', message: 'Simulation complete!' } : null);


        } catch (error) {
            console.error("Full pipeline simulation failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast({ title: "Simulation Error", description: errorMessage, variant: "destructive"});
            log("Error", `The simulation was interrupted: ${errorMessage}`);
            setBackgroundTask(prev => prev ? ({ ...prev, status: 'error', message: 'Simulation failed.' }) : null);
        } finally {
             setTimeout(() => { setBackgroundTask(null); }, 5000);
        }
    };

    const handleDeleteRole = async (roleId: string, roleTitle: string) => {
        try {
            const batch = writeBatch(db);

            // 1. Unassign all candidates from this role
            const q = query(collection(db, 'candidates'), where('role', '==', roleTitle));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { role: "Unassigned" });
            });

            // 2. Delete the role document itself
            const roleRef = doc(db, "roles", roleId);
            batch.delete(roleRef);
            
            await batch.commit();
            
            toast({ title: "Role Deleted", description: `"${roleTitle}" has been deleted and associated candidates are now 'Unassigned'.` });

        } catch (error) {
            console.error("Error deleting role: ", error);
            toast({ title: "Error", description: "Could not delete role.", variant: "destructive" });
        }
    }

    const handleDeleteCandidate = async (candidateId: string) => {
      try {
          const candidateToDelete = candidates.find(c => c.id === candidateId);
          if (!candidateToDelete) {
              toast({ title: 'Error', description: 'Candidate not found.', variant: 'destructive' });
              return;
          }

          const batch = writeBatch(db);

          // 1. Delete Firestore document
          const candidateRef = doc(db, 'candidates', candidateId);
          batch.delete(candidateRef);

          // 2. Delete resume from Storage
          if (candidateToDelete.resumeUrl) {
              try {
                  const storageRef = ref(storage, candidateToDelete.resumeUrl);
                  await deleteObject(storageRef);
              } catch (storageError: any) {
                  // If file doesn't exist, we can ignore the error, but log others
                  if (storageError.code !== 'storage/object-not-found') {
                      console.error("Error deleting resume from storage:", storageError);
                  }
              }
          }

          // 3. Delete related notifications
          const notificationsQuery = query(collection(db, 'notifications'), where('candidateId', '==', candidateId));
          const notificationsSnapshot = await getDocs(notificationsQuery);
          notificationsSnapshot.forEach((doc) => {
              batch.delete(doc.ref);
          });
          
          // 4. Clean up role match caches
          const rolesSnapshot = await getDocs(collection(db, 'roles'));
          rolesSnapshot.forEach(roleDoc => {
              const roleData = roleDoc.data() as JobRole;
              if (roleData.roleMatches && roleData.roleMatches.some(m => m.candidateId === candidateId)) {
                  const updatedMatches = roleData.roleMatches.filter(m => m.candidateId !== candidateId);
                  batch.update(roleDoc.ref, { roleMatches: updatedMatches });
              }
          });

          await batch.commit();
          
          toast({ title: "Candidate Deleted", description: "The candidate has been permanently removed from all records." });
      } catch (error) {
          console.error("Failed to delete candidate and associated data:", error);
          toast({ title: "Deletion Failed", description: "Could not delete the candidate. See console for details.", variant: 'destructive' });
      }
    };

    const handleViewCandidatesForRole = (role: JobRole) => {
        setFilteredRole(role);
        setActiveTab('pool');
    };

    const handleReEngageForRole = async (role: JobRole) => {
        const taskId = `task-${nanoid(5)}`;
        setBackgroundTask({ id: taskId, type: 'Matching', status: 'in-progress', progress: 0, total: 1, message: 'Scanning archives...' });
        
        const archivedCandidatesQuery = query(collection(db, 'candidates'), where('archived', '==', true));
        const querySnapshot = await getDocs(archivedCandidatesQuery);
        const archivedCandidates = querySnapshot.docs.map(d => ({id: d.id, ...d.data()} as Candidate));

        if (archivedCandidates.length === 0) {
            toast({ title: 'No Archived Candidates', description: 'There are no archived candidates to re-engage.' });
            setBackgroundTask(null);
            return;
        }

        try {
            const reEngagePromises = archivedCandidates.map(c => 
                reEngageCandidate({
                    candidateName: c.name,
                    candidateSkills: c.skills,
                    candidateNarrative: c.narrative,
                    newJobTitle: role.title,
                    newJobDescription: role.description,
                    companyName: "AstraHire"
                }).then(result => ({ ...result, candidate: c }))
            );
            
            const results = await Promise.all(reEngagePromises);
            const strongMatches = results.filter(r => r.isMatch);

            if (strongMatches.length > 0) {
                 toast({
                    title: `Found ${strongMatches.length} Potential Matches!`,
                    description: `Found ${strongMatches.map(m => m.candidate.name).join(', ')}.`,
                });
                console.log("Re-engagement opportunities:", strongMatches);
            } else {
                toast({
                    title: 'No Matches Found',
                    description: `The AI did not find any strong matches in the archives for the ${role.title} role.`,
                });
            }
            setBackgroundTask(prev => prev ? { ...prev, status: 'complete', progress: 1, message: 'Archive scan complete.' } : null);
        } catch (error) {
            console.error('Re-engagement failed:', error);
            toast({ title: 'Re-engagement Error', description: 'An AI error occurred. Please check the console.', variant: 'destructive' });
            setBackgroundTask(prev => prev ? { ...prev, status: 'error', message: 'Error scanning archives.' } : null);
        } finally {
            setTimeout(() => { setBackgroundTask(null); }, 5000);
        }
    };
  
    const handleFindMatches = (role: JobRole, mode: 'top' | 'qualified') => {
        setSelectedRoleForMatching(role);

        const cachedMatches = role.roleMatches || [];

        if (cachedMatches.length === 0) {
            toast({
                title: "Cache is Empty",
                description: "Run the 'AI Match for All' in the Prospecting Hub first to generate matches."
            });
            return;
        }

        let matchesToShow = cachedMatches;
        if (mode === 'qualified') {
            matchesToShow = cachedMatches.filter(match => match.confidenceScore >= 70);
        } else { // 'top'
            matchesToShow = cachedMatches.slice(0, 10);
        }

        setMatchedCandidates(matchesToShow);
        setIsMatchesDialogOpen(true);
    };
    
    const handleAssignRole = async (candidateId: string, roleTitle: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            await handleUpdateCandidate({ ...candidate, role: roleTitle, status: 'Interview' });
            
            setMatchedCandidates(prev => prev.filter(m => m.candidateId !== candidateId));
            
            toast({ title: "Role Assigned!", description: `${candidate.name} has been assigned to ${roleTitle} and moved to Interview.` });
        }
    };

    const handleAssignAllRoles = async (matchesToAssign: any[]) => {
        if (!selectedRoleForMatching) return;
        
        const batch = writeBatch(db);

        matchesToAssign.forEach(match => {
            const candidateRef = doc(db, 'candidates', match.candidateId);
            batch.update(candidateRef, { role: selectedRoleForMatching.title, status: 'Interview' });
        });

        const roleRef = doc(db, 'roles', selectedRoleForMatching.id);
        batch.update(roleRef, { roleMatches: [] });

        await batch.commit();

        toast({
            title: "Bulk Assignment Complete!",
            description: `Assigned ${matchesToAssign.length} candidates to the ${selectedRoleForMatching.title} role and cleared cache.`
        });
        
        setIsMatchesDialogOpen(false);
        setMatchedCandidates([]);
    };

    const handleRunBulkMatch = async () => {
        const unassignedCandidates = candidates.filter(c => c.role === 'Unassigned' && !c.archived);
        if (unassignedCandidates.length === 0 || roles.length === 0) {
            toast({ title: "Nothing to Match", description: "Ensure there are unassigned candidates and open roles." });
            return;
        }

        const taskId = `task-bulk-${nanoid(5)}`;
        setBackgroundTask({
            id: taskId,
            type: 'BulkMatching',
            status: 'in-progress',
            progress: 0,
            total: 1,
            message: `Matching ${unassignedCandidates.length} candidates...`
        });
        
        toast({ title: "AI Sourcing Started", description: `Analyzing ${unassignedCandidates.length} candidates against ${roles.length} roles. This is a background task.` });

        try {
            const result = await bulkMatchCandidatesToRoles({
                candidates: unassignedCandidates.map(c => ({
                    id: c.id,
                    skills: c.skills,
                    narrative: c.narrative
                })),
                jobRoles: roles,
            });

            const matchesByRole: Record<string, RoleMatch[]> = roles.reduce((acc, role) => ({ ...acc, [role.id]: [] }), {});

            const newMatchResults: Record<string, any[]> = {};

            result.results.forEach(candidateResult => {
                 const bestMatchForCandidate = candidateResult.matches
                    .sort((a, b) => b.confidenceScore - a.confidenceScore)[0];

                if(bestMatchForCandidate) {
                     newMatchResults[candidateResult.candidateId] = [bestMatchForCandidate];
                }

                candidateResult.matches.forEach(match => {
                    if (matchesByRole[match.roleId]) {
                        matchesByRole[match.roleId].push({
                            candidateId: candidateResult.candidateId,
                            candidateName: unassignedCandidates.find(c => c.id === candidateResult.candidateId)?.name || 'Unknown',
                            justification: match.justification,
                            confidenceScore: match.confidenceScore,
                        });
                    }
                });
            });

            setMatchResults(newMatchResults);

            const batch = writeBatch(db);
            roles.forEach(role => {
                const roleRef = doc(db, 'roles', role.id);
                const sortedMatches = matchesByRole[role.id].sort((a, b) => b.confidenceScore - a.confidenceScore);
                batch.update(roleRef, { roleMatches: sortedMatches, lastMatched: new Date().toISOString() });
            });
            await batch.commit();

            toast({ title: "Analysis Complete!", description: "AI role matching has been completed for all candidates and results are cached." });
            setBackgroundTask(prev => prev ? { ...prev, status: 'complete', message: 'Bulk matching complete!' } : null);

        } catch (error) {
            console.error("Failed to run bulk match:", error);
            toast({ title: "Bulk Match Error", description: "An error occurred during the bulk analysis. Please check the console.", variant: "destructive"});
             setBackgroundTask(prev => prev ? { ...prev, status: 'error', message: 'Bulk matching failed.' } : null);
        } finally {
            setTimeout(() => { setBackgroundTask(null); }, 5000);
        }
    };
  
    const handleOpenManual = () => {
        setLastSaarthiReport({
            reportType: "User Manual",
        });
        setIsSaarthiReportOpen(true);
    };

    const handleOpenReport = () => {
         setLastSaarthiReport({
            reportType: "No Report",
            simulationSummary: "No simulation has been run yet. Click 'Stimulate Pipeline' in the Candidate Pool tab to generate a report."
        });
        setIsSaarthiReportOpen(true);
    }
    
    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
        setFilteredRole(null);
        if (tab === 'announcements') {
            if (announcements.length > 0) {
                const latestTimestamp = announcements[0].createdAt?.toDate().toISOString();
                localStorage.setItem('lastReadAnnouncementTimestamp', latestTimestamp);
            }
            setUnreadAnnouncements(0);
        }
    };

  const renderActiveTabView = () => {
    switch (activeTab) {
      case 'roles':
        return <RolesTab 
            roles={roles} 
            candidates={candidates} 
            onViewCandidates={handleViewCandidatesForRole} 
            onReEngage={handleReEngageForRole} 
            onAddRole={handleAddRole} 
            onDeleteRole={handleDeleteRole} 
            onFindMatches={handleFindMatches}
        />;
      case 'pool':
        return (
            <CandidatePoolTab 
                candidates={candidates}
                roles={roles}
                onUpload={handleBulkUpload}
                onStimulateFullPipeline={handleStimulateFullPipeline}
                onUpdateCandidate={handleUpdateCandidate}
                filteredRole={filteredRole}
                onClearFilter={() => setFilteredRole(null)}
                onAddRole={handleAddRole}
                onDeleteCandidate={handleDeleteCandidate}
            />
        );
       case 'prospecting':
        return <ProspectingTab 
            candidates={candidates.filter(c => c.role === 'Unassigned' && !c.archived)}
            roles={roles}
            onUpdateCandidate={handleUpdateCandidate}
            onDeleteCandidate={handleDeleteCandidate}
            onRunBulkMatch={handleRunBulkMatch}
            matchResults={matchResults}
        />;
       case 'gauntlet':
        return <GauntletPortalTab candidates={candidates} />;
      case 'analytics':
        return <AnalyticsTab roles={roles} candidates={candidates} suggestedChanges={suggestedChanges} setSuggestedChanges={setSuggestedChanges} />;
       case 'announcements':
        return <AnnouncementsTab announcements={announcements} />;
       case 'admin':
        if (!isAdmin) return null;
        return <AdminTab allCandidates={candidates} roles={roles} notifications={notifications} />;
      default:
        return null;
    }
  };

  if (isLoading && candidates.length === 0) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
              <p className="text-muted-foreground">Connecting to the Divine Realm...</p>
          </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-background text-foreground">
      <SaarthiReportModal 
        isOpen={isSaarthiReportOpen}
        onClose={() => setIsSaarthiReportOpen(false)}
        reportData={lastSaarthiReport}
      />

      <MatchedCandidatesDialog
        isOpen={isMatchesDialogOpen}
        onClose={() => setIsMatchesDialogOpen(false)}
        matches={matchedCandidates}
        roleTitle={selectedRoleForMatching?.title || ''}
        onAssign={handleAssignRole}
        onAssignAll={handleAssignAllRoles}
      />


      <AstraHireHeader 
        onReportClick={handleOpenReport}
        onManualClick={handleOpenManual}
        unreadCount={unreadAnnouncements}
        onBellClick={() => handleTabClick('announcements')}
      />
      <main>
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-2">
            {isAdmin && (
                 <button
                    className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                    onClick={() => handleTabClick('admin')}
                    >
                    <UserCog className="inline-block w-4 h-4 mr-2" />
                    Admin
                </button>
            )}
            <button
              className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
              onClick={() => handleTabClick('roles')}
            >
              <Briefcase className="inline-block w-4 h-4 mr-2" />
              Client Roles
            </button>
            <button
              className={`tab-btn ${activeTab === 'pool' ? 'active' : ''}`}
              onClick={() => handleTabClick('pool')}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Candidate Pool
            </button>
             <button
              className={`tab-btn ${activeTab === 'prospecting' ? 'active' : ''}`}
              onClick={() => handleTabClick('prospecting')}
            >
              <Search className="inline-block w-4 h-4 mr-2" />
              Prospecting
            </button>
             <button
              className={`tab-btn ${activeTab === 'gauntlet' ? 'active' : ''}`}
              onClick={() => handleTabClick('gauntlet')}
            >
              <Shield className="inline-block w-4 h-4 mr-2" />
              Gauntlet Portal
            </button>
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => handleTabClick('analytics')}
            >
              <BarChart2 className="inline-block w-4 h-4 mr-2" />
              Analytics
            </button>
            <button
                className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                onClick={() => handleTabClick('announcements')}
            >
                <Megaphone className="inline-block w-4 h-4 mr-2" />
                Announcements
            </button>
            <button
              className={`tab-btn`}
              onClick={() => router.push('/feedback/login')}
            >
              <Notebook className="inline-block w-4 h-4 mr-2" />
              Feedback Notes
            </button>
          </nav>
        </div>
        <div id="tab-content" className="fade-in">
            {renderActiveTabView()}
        </div>
      </main>

       {backgroundTask && (
          <Card className="fixed bottom-4 right-4 w-80 shadow-2xl z-50 fade-in-slide-up">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{backgroundTask.message}</h4>
                {backgroundTask.status === 'in-progress' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                   <button onClick={() => setBackgroundTask(null)} className="text-muted-foreground hover:text-foreground">
                       <X className="h-5 w-5" />
                   </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {backgroundTask.progress} / {backgroundTask.total} completed
              </p>
              <Progress value={(backgroundTask.progress / backgroundTask.total) * 100} className="h-2 mt-2" />
            </CardContent>
          </Card>
        )}
    </div>
  );
}
