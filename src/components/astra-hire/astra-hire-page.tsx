
'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Briefcase, Users, Loader2, Shield, X } from 'lucide-react';
import { AstraHireHeader } from './astra-hire-header';
import { CandidatePoolTab } from '../kanban/candidate-pool-tab';
import { RolesTab } from '../roles/roles-tab';
import { AnalyticsTab } from '../analytics/analytics-tab';
import type { Candidate, JobRole, KanbanStatus, LogEntry, RubricChange } from '@/lib/types';
import { automatedResumeScreening } from '@/ai/flows/automated-resume-screening';
import { SaarthiReportModal } from './saarthi-report-modal';
import { useToast } from '@/hooks/use-toast';
import { synthesizeJobDescription } from '@/ai/flows/automated-job-description-synthesis';
import { nanoid } from 'nanoid';
import { reviewCandidate } from '@/ai/flows/ai-assisted-candidate-review';
import { suggestRoleMatches } from '@/ai/flows/suggest-role-matches';
import { analyzeHiringOverride } from '@/ai/flows/self-correcting-rubric';
import { proactiveCandidateSourcing } from '@/ai/flows/proactive-candidate-sourcing';
import { reEngageCandidate } from '@/ai/flows/re-engage-candidate';
import { finalInterviewReview } from '@/ai/flows/final-interview-review';
import { draftOfferLetter } from '@/ai/flows/autonomous-offer-drafting';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, getDocs, query, where, addDoc, serverTimestamp, arrayUnion, deleteDoc } from 'firebase/firestore';
import { GauntletPortalTab } from '../gauntlet/gauntlet-portal-tab';
import { skillGapAnalysis } from '@/ai/flows/skill-gap-analysis';
import { generateOnboardingPlan } from '@/ai/flows/automated-onboarding-plan';
import { findPotentialRoles } from '@/ai/flows/find-potential-roles';
import { findPotentialCandidates } from '@/ai/flows/find-potential-candidates';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

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

const KANBAN_STAGES: KanbanStatus[] = ['Sourcing', 'Screening', 'Interview', 'Hired'];

interface BackgroundTask {
    id: string;
    type: 'Screening' | 'Simulation' | 'Audit';
    status: 'in-progress' | 'complete' | 'error';
    progress: number;
    total: number;
    message: string;
}

export function AstraHirePage() {
  const [activeTab, setActiveTab] = useState('pool');

  // --- State Management ---
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [lastSaarthiReport, setLastSaarthiReport] = useState<any>(null);
  const [filteredRole, setFilteredRole] = useState<JobRole | null>(null);
  const [suggestedChanges, setSuggestedChanges] = useState<RubricChange[]>([]);
  const [backgroundTask, setBackgroundTask] = useState<BackgroundTask | null>(null);


  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaarthiReportOpen, setIsSaarthiReportOpen] = useState(false);
  const { toast } = useToast();

  // --- Firestore Data Fetching ---
  useEffect(() => {
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

    // Cleanup subscription on unmount
    return () => {
        candidatesUnsub();
        rolesUnsub();
    };
  }, [toast]);


  // --- Core Logic ---
    const handleUpdateCandidate = async (updatedCandidate: Candidate) => {
        const originalCandidate = candidates.find(c => c.id === updatedCandidate.id);
        if (!originalCandidate) return;

        // --- Divine Law & Order: Gauntlet Validation ---
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
                author: 'System',
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


  const handleBulkUpload = async (files: FileList | null, isAudit = false) => {
    if (!files) return;

    if (isAudit) {
        await handleSystemAudit(files);
        return;
    }

    const filesToProcess = Array.from(files).filter(file => 
        !candidates.some(c => c.name === file.name.split('.').slice(0, -1).join('.'))
    );

    if (filesToProcess.length === 0) {
        toast({ title: "No new resumes to add", description: "All selected files were already in the pool." });
        return;
    }
    
    toast({ title: "Upload Successful", description: `Starting to screen ${filesToProcess.length} new resumes in the background.` });
    
    const taskId = `task-${nanoid(5)}`;
    const task: BackgroundTask = {
        id: taskId,
        type: 'Screening',
        status: 'in-progress',
        progress: 0,
        total: filesToProcess.length,
        message: 'Screening Resumes...'
    };
    setBackgroundTask(task);
    
    let processedCount = 0;
    let failedCount = 0;

    for (const file of filesToProcess) {
        try {
            const resumeDataUri = await convertFileToDataUri(file);
            const result = await automatedResumeScreening({ resumeDataUri, companyType: 'startup' });
            
            const candidateId = `cand-${nanoid(10)}`;
            const newCandidate: Candidate = {
                id: candidateId,
                ...result.extractedInformation,
                status: 'Screening' as KanbanStatus, 
                role: 'Unassigned',
                aiInitialScore: result.candidateScore,
                lastUpdated: new Date().toISOString(),
                log: [{
                    timestamp: new Date().toISOString(),
                    event: 'Resume Uploaded',
                    details: `Candidate profile created from file: ${file.name}`,
                    author: 'System'
                }, {
                    timestamp: new Date().toISOString(),
                    event: 'AI Screening Complete',
                    details: `Automated screening finished. Initial score: ${result.candidateScore}`,
                    author: 'AI'
                }]
            };
            await setDoc(doc(db, "candidates", newCandidate.id), newCandidate);
            processedCount++;
        } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
            failedCount++;
        }

        setBackgroundTask(prev => prev ? ({ ...prev, progress: processedCount + failedCount }) : null);
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }
      
    setBackgroundTask(prev => prev ? ({ ...prev, status: 'complete', message: `Screening complete. ${failedCount > 0 ? `${failedCount} failed.` : ''}` }) : null);
    
    // Automatically hide the task monitor after a delay
    setTimeout(() => {
        setBackgroundTask(null);
    }, 5000);
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
            
            let candidatesForSim = [...candidates];
            let sourced = false;
            if (candidatesForSim.filter(c => c.status === 'Sourcing' || c.status === 'Screening').length === 0) {
              log("Proactive Sourcing", "Candidate pool is empty. Generating fictional candidates.");
              sourced = true;
              const sourcingResult = await proactiveCandidateSourcing({
                  openRoles: roles.length > 0 ? roles : [{ title: "Senior Software Engineer", description: "Lead development of our core platform." }],
                  numberOfCandidates: 5
              });
              const sourcedCandidates: Candidate[] = sourcingResult.sourcedCandidates.map(sc => ({
                  id: `cand-${nanoid(10)}`, name: sc.name, role: sc.role, skills: sc.skills, narrative: sc.narrative, inferredSkills: sc.inferredSkills, status: 'Screening', aiInitialScore: Math.floor(Math.random() * 20) + 75, avatarUrl: '', lastUpdated: new Date().toISOString()
              }));
              const batch = writeBatch(db);
              sourcedCandidates.forEach(c => batch.set(doc(db, 'candidates', c.id), c));
              await batch.commit();
              candidatesForSim = [...candidatesForSim, ...sourcedCandidates];
              log("Proactive Sourcing Complete", `Generated and saved ${sourcedCandidates.length} new candidates.`);
            }

            setBackgroundTask(prev => prev ? ({ ...prev, progress: 2, message: 'Phase 2/5: Identifying Talent...' }) : null);
            const topCandidate = candidatesForSim
                .filter(c => c.status === 'Screening' && !c.archived)
                .sort((a,b) => (b.aiInitialScore || 0) - (a.aiInitialScore || 0))[0];

            if(!topCandidate) {
                throw new Error("Simulation ended: No qualified candidates found in 'Screening'.");
            }
            log("Talent Identification", `Identified top talent: ${topCandidate.name} (Score: ${topCandidate.aiInitialScore}).`);
            
            const roleSuggestions = await suggestRoleMatches({
                candidateName: topCandidate.name, candidateSkills: topCandidate.skills.join(', '), candidateNarrative: topCandidate.narrative, candidateInferredSkills: topCandidate.inferredSkills.join(', '),
            });
            const targetRoleTitle = roleSuggestions.roles[0]?.roleTitle || "Lead Software Engineer";
            log("Role Suggestion", `AI suggested role: '${targetRoleTitle}' for ${topCandidate.name}.`);

            const jdResult = await synthesizeJobDescription({ jobTitle: targetRoleTitle, companyInformation: "A fast-growing tech startup in the AI space." });
            const newRole: JobRole = { id: `role-${nanoid(10)}`, title: targetRoleTitle, description: jdResult.jobDescription, department: "Engineering", openings: 1 };
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
                simulationSummary: `The end-to-end simulation successfully processed the pipeline. ${sourced ? `It proactively sourced new talent, then identified` : 'It identified'} ${topCandidate.name} as a top candidate, synthesized the role of '${newRole.title}', validated them through the Gauntlet, and autonomously hired them.`,
                detailedProcessLog: currentSimulationLog,
            });
            setIsSaarthiReportOpen(true);
            setBackgroundTask(prev => prev ? ({ ...prev, status: 'complete', message: 'Simulation complete!' }) : null);


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
  
    const handleSystemAudit = async (files: FileList) => {
        // This can also be converted to a background task
        setIsLoading(true);
        const auditLog: any[] = [];
        const log = (step: string, description: string, status: 'Success' | 'Failure' | 'Info' = 'Info') => {
            console.log(`[AUDIT LOG] ${step} (${status}): ${description}`);
            auditLog.push({ step, description, status });
        };
        
        try {
            log("Start Audit", `Starting system audit with ${files.length} resumes.`);
            
            const screeningPromises = Array.from(files).map(async file => {
                try {
                    const resumeDataUri = await convertFileToDataUri(file);
                    const result = await automatedResumeScreening({ resumeDataUri, companyType: 'startup' });
                    log("Automated Resume Screening", `Successfully screened ${file.name}. Score: ${result.candidateScore}`, "Success");
                    return { id: `audit-${nanoid(10)}`, ...result.extractedInformation, aiInitialScore: result.candidateScore, role: 'Unassigned', status: 'Screening' as KanbanStatus, lastUpdated: new Date().toISOString() };
                } catch(e) {
                    log("Automated Resume Screening", `Failed to screen ${file.name}. Error: ${e instanceof Error ? e.message : 'Unknown'}`, "Failure");
                    return null;
                }
            });
            const auditCandidates = (await Promise.all(screeningPromises)).filter(Boolean) as Candidate[];
            
            if (auditCandidates.length === 0) {
                throw new Error("Audit failed: No resumes could be screened successfully.");
            }

            const topCandidate = auditCandidates.sort((a,b) => (b.aiInitialScore || 0) - (a.aiInitialScore || 0))[0];
            
            try {
                const roleSuggestions = await suggestRoleMatches({
                    candidateName: topCandidate.name,
                    candidateSkills: topCandidate.skills.join(', '),
                    candidateNarrative: topCandidate.narrative,
                    candidateInferredSkills: topCandidate.inferredSkills.join(', '),
                });
                const suggestedRole = roleSuggestions.roles[0];
                log("Suggest Role Matches", `Successfully suggested role '${suggestedRole.roleTitle}' for ${topCandidate.name}`, "Success");

                const jdResult = await synthesizeJobDescription({ jobTitle: suggestedRole.roleTitle, companyInformation: "A test company." });
                log("Job Description Synthesis", `Successfully synthesized JD for '${suggestedRole.roleTitle}'`, "Success");
                const testRole: JobRole = { id: 'audit-role', title: suggestedRole.roleTitle, description: jdResult.jobDescription, department: "Audit", openings: 1};

                const review = await reviewCandidate({ candidateData: topCandidate.narrative, jobDescription: testRole.description, companyType: 'enterprise' });
                log("AI-Assisted Candidate Review", `Successfully reviewed ${topCandidate.name} for role. Recommendation: ${review.recommendation}`, "Success");

                const skillGap = await skillGapAnalysis({ candidateSkills: topCandidate.skills, jobDescription: testRole.description });
                log("Skill Gap Analysis", `Successfully analyzed skill gap. Found ${skillGap.skillGaps.length} gaps.`, "Success");

                const offer = await draftOfferLetter({ ...topCandidate, roleTitle: testRole.title, candidateExperience: topCandidate.narrative, companyName: 'Audit Inc', companySalaryBands: '100k-120k', simulatedMarketData: 'Avg 110k' });
                log("Autonomous Offer Drafting", `Successfully drafted offer with salary ${offer.suggestedSalary}`, "Success");
                
                const onboarding = await generateOnboardingPlan({ candidateName: topCandidate.name, roleTitle: testRole.title, roleResponsibilities: '...', candidateStrengths: topCandidate.skills, companyCulture: 'test' });
                log("Automated Onboarding Plan", `Successfully generated onboarding plan.`, "Success");

            } catch (e) {
                 log("Mid-Audit Failure", `An error occurred during the main audit sequence: ${e instanceof Error ? e.message : 'Unknown'}`, "Failure");
            }
            
            log("Audit Complete", "SAARTHI has completed the system audit.");
             setLastSaarthiReport({
                reportType: "System Audit",
                simulationSummary: `The system audit processed ${files.length} resumes and tested the core AI pipeline on the best candidate. See the log for detailed results of each feature test.`,
                detailedProcessLog: auditLog,
            });
            setIsSaarthiReportOpen(true);


        } catch(e) {
            log("Fatal Audit Error", `The audit could not be completed. Error: ${e instanceof Error ? e.message : 'Unknown'}`, "Failure");
            toast({ title: "Audit Failed", description: "A critical error occurred. Check the SAARTHI report and console for details.", variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }

    }

    const handleDeleteRole = async (roleId: string, roleTitle: string) => {
        try {
            await deleteDoc(doc(db, "roles", roleId));

            const q = query(collection(db, 'candidates'), where('role', '==', roleTitle));
            const querySnapshot = await getDocs(q);

            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { role: "Unassigned" });
            });
            await batch.commit();
            
            toast({ title: "Role Deleted", description: `"${roleTitle}" has been deleted and associated candidates are now 'Unassigned'.` });

        } catch (error) {
            console.error("Error deleting role: ", error);
            toast({ title: "Error", description: "Could not delete role.", variant: "destructive" });
        }
    }

    const handleDeleteCandidate = async (candidateId: string) => {
      try {
          await deleteDoc(doc(db, 'candidates', candidateId));
          toast({ title: "Candidate Deleted", description: "The candidate has been permanently removed." });
      } catch (error) {
          console.error("Failed to delete candidate:", error);
          toast({ title: "Deletion Failed", description: "Could not delete the candidate. See console for details.", variant: 'destructive' });
      }
    }

    const handleViewCandidatesForRole = (role: JobRole) => {
        setFilteredRole(role);
        setActiveTab('pool');
    };

    const handleReEngageForRole = async (role: JobRole) => {
        setIsLoading(true);
        
        const archivedCandidatesQuery = query(collection(db, 'candidates'), where('archived', '==', true));
        const querySnapshot = await getDocs(archivedCandidatesQuery);
        const archivedCandidates = querySnapshot.docs.map(d => ({id: d.id, ...d.data()} as Candidate));

        if (archivedCandidates.length === 0) {
            toast({
                title: 'No Archived Candidates',
                description: 'There are no archived candidates to re-engage.',
            });
            setIsLoading(false);
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
                    description: `Found ${strongMatches.map(m => m.candidate.name).join(', ')}. Check the console for details.`,
                });
                console.log("Re-engagement opportunities:", strongMatches);
            } else {
                toast({
                    title: 'No Matches Found',
                    description: `The AI did not find any strong matches in the archives for the ${role.title} role.`,
                });
            }
        } catch (error) {
            console.error('Re-engagement failed:', error);
            toast({
                title: 'Re-engagement Error',
                description: 'An AI error occurred. Please check the console.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
  
  const renderActiveTabView = () => {
    switch (activeTab) {
      case 'roles':
        return <RolesTab roles={roles} candidates={candidates} onUpdateCandidate={handleUpdateCandidate} onViewCandidates={handleViewCandidatesForRole} onReEngage={handleReEngageForRole} onAddRole={handleAAddRole} onDeleteRole={handleDeleteRole} />;
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
       case 'gauntlet':
        return <GauntletPortalTab candidates={candidates} />;
      case 'analytics':
        return <AnalyticsTab roles={roles} candidates={candidates} suggestedChanges={suggestedChanges} setSuggestedChanges={setSuggestedChanges} />;
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

      <AstraHireHeader onReportClick={() => {
          if (lastSaarthiReport) {
              setIsSaarthiReportOpen(true);
          } else {
              toast({ title: "No SAARTHI report available yet.", description: "Please run a simulation or audit first." });
          }
      }} />
      <main>
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-2">
            <button
              className={`tab-btn ${activeTab === 'pool' ? 'active' : ''}`}
              onClick={() => setActiveTab('pool')}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Candidate Pool
            </button>
             <button
              className={`tab-btn ${activeTab === 'gauntlet' ? 'active' : ''}`}
              onClick={() => { setActiveTab('gauntlet'); setFilteredRole(null); }}
            >
              <Shield className="inline-block w-4 h-4 mr-2" />
              Gauntlet Portal
            </button>
            <button
              className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
              onClick={() => { setActiveTab('roles'); setFilteredRole(null); }}
            >
              <Briefcase className="inline-block w-4 h-4 mr-2" />
              Client Roles
            </button>
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => { setActiveTab('analytics'); setFilteredRole(null); }}
            >
              <BarChart2 className="inline-block w-4 h-4 mr-2" />
              Analytics
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


    