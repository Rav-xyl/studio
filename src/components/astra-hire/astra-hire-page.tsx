'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Briefcase, Users, Loader2, Shield } from 'lucide-react';
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

export function AstraHirePage() {
  const [activeTab, setActiveTab] = useState('pool');

  // --- State Management ---
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [lastSaarthiReport, setLastSaarthiReport] = useState<any>(null);
  const [filteredRole, setFilteredRole] = useState<JobRole | null>(null);
  const [suggestedChanges, setSuggestedChanges] = useState<RubricChange[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [isSaarthiReportOpen, setIsSaarthiReportOpen] = useState(false);
  const { toast } = useToast();

  // --- Firestore Data Fetching ---
  useEffect(() => {
    setLoadingText('Connecting to the database...');
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
    const { id, ...candidateData } = updatedCandidate;
    if (!id) {
        console.error("Candidate ID is missing. Cannot update.");
        return;
    }

    const originalCandidate = candidates.find(c => c.id === id);
    if (!originalCandidate) return;

    // --- Gauntlet Failure Check ---
    if (updatedCandidate.status === 'Interview') {
        const hasFailedGauntlet = originalCandidate.gauntletState?.bossValidation?.finalRecommendation === 'Do Not Hire';
        if (hasFailedGauntlet) {
            toast({
                variant: 'destructive',
                title: 'Action Blocked',
                description: 'This candidate has failed the Gauntlet and cannot proceed to the Interview stage.'
            });
            return; // Halt the update
        }
    }

    if (originalCandidate.status !== updatedCandidate.status) {
         await addLog(id, {
            event: 'Status Change',
            details: `Candidate moved from ${originalCandidate.status} to ${updatedCandidate.status}`,
            author: 'System',
        });
    }

    const candidateDocRef = doc(db, 'candidates', id);
    await updateDoc(candidateDocRef, candidateData);
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
            const candidateRef = doc(db, 'candidates', candidateToUpdate.id);
            await updateDoc(candidateRef, { role: existingRole.title });
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
        const candidateRef = doc(db, 'candidates', candidateToUpdate.id);
        const batch = writeBatch(db);
        batch.set(newRoleRef, fullNewRole);
        batch.update(candidateRef, { role: fullNewRole.title });
        await batch.commit();
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

    let addedCount = 0;

    const screeningPromises = Array.from(files).map(async (file) => {
      const existingCandidate = candidates.find(c => c.name === file.name.split('.').slice(0, -1).join('.'));
      if (existingCandidate) {
          return null; 
      }
      
      addedCount++;
      try {
        const resumeDataUri = await convertFileToDataUri(file);
        // We'll default to 'startup' for now, this could be a user choice in the dialog later.
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
        return newCandidate;
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        return {
          id: `cand-${nanoid(10)}`,
          name: file.name,
          status: 'Sourcing' as KanbanStatus,
          role: 'Unassigned',
          narrative: 'AI screening failed.',
          skills: [],
          inferredSkills: [],
          lastUpdated: new Date().toISOString(),
          log: [{
              timestamp: new Date().toISOString(),
              event: 'Upload Failed',
              details: `AI screening failed for file: ${file.name}`,
              author: 'System'
          }]
        };
      }
    });
      
    if (addedCount > 0) {
      toast({ title: "Upload Successful", description: `${addedCount} new resumes added. Screening automatically...` });
      
      setIsLoading(true);
      setLoadingText(`Screening ${addedCount} new resumes...`);
      
      const processedCandidates = (await Promise.all(screeningPromises)).filter(Boolean) as Candidate[];
      
      const batch = writeBatch(db);
      processedCandidates.forEach(candidate => {
        const docRef = doc(db, "candidates", candidate.id);
        batch.set(docRef, candidate);
      });
      await batch.commit();

      setIsLoading(false);
      toast({ title: 'Screening Complete', description: `Processed and saved ${processedCandidates.length} resumes.` });

    } else {
      toast({ title: "No new resumes added", description: "All selected files were already in the pool.", variant: "destructive" });
    }
  };
  
  const handleStimulateFullPipeline = async () => {
        setIsLoading(true);
        const currentSimulationLog: any[] = [];
        
        const log = (step: string, description: string) => {
            console.log(`[SAARTHI LOG] ${step}: ${description}`);
            currentSimulationLog.push({ step, description });
        };

        try {
            log("Start Simulation", "Beginning autonomous pipeline simulation.");
            
            let candidatesForSim = [...candidates];
            if (candidatesForSim.filter(c => c.status === 'Sourcing' || c.status === 'Screening').length === 0) {
              setLoadingText("Phase 1/5: No candidates found. Proactively sourcing talent...");
              log("Proactive Sourcing", "Candidate pool is empty. Generating fictional candidates to demonstrate pipeline.");
              const sourcingResult = await proactiveCandidateSourcing({
                  openRoles: roles.length > 0 ? roles : [{ title: "Senior Software Engineer", description: "Lead development of our core platform." }],
                  numberOfCandidates: 5
              });

              const sourcedCandidates: Candidate[] = sourcingResult.sourcedCandidates.map(sc => ({
                  id: `cand-${nanoid(10)}`,
                  name: sc.name,
                  role: sc.role,
                  skills: sc.skills,
                  narrative: sc.narrative,
                  inferredSkills: sc.inferredSkills,
                  status: 'Screening',
                  aiInitialScore: Math.floor(Math.random() * 20) + 75,
                  avatarUrl: '',
                  lastUpdated: new Date().toISOString()
              }));
              
              const batch = writeBatch(db);
              sourcedCandidates.forEach(c => {
                  const docRef = doc(db, 'candidates', c.id);
                  batch.set(docRef, c);
              });
              await batch.commit();
              candidatesForSim = [...candidatesForSim, ...sourcedCandidates];

              log("Proactive Sourcing Complete", `Generated and saved ${sourcedCandidates.length} new candidates.`);
            }

            setLoadingText("Phase 2/5: Synthesizing role and matching candidates...");
            const topCandidate = candidatesForSim.filter(c => c.status === 'Screening').sort((a,b) => (b.aiInitialScore || 0) - (a.aiInitialScore || 0))[0];
            
            if(topCandidate) {
                const roleSuggestions = await suggestRoleMatches({
                    candidateName: topCandidate.name,
                    candidateSkills: topCandidate.skills.join(', '),
                    candidateNarrative: topCandidate.narrative,
                    candidateInferredSkills: topCandidate.inferredSkills.join(', '),
                });

                const targetRoleTitle = roleSuggestions.roles[0]?.roleTitle || "Lead Software Engineer";
                log("Role Synthesis", `Identified top talent. Synthesizing role for: '${targetRoleTitle}'`);

                const jdResult = await synthesizeJobDescription({
                    jobTitle: targetRoleTitle,
                    companyInformation: "A fast-growing tech startup in the AI space, focused on innovation and agile development."
                });
                const newRoleRef = doc(collection(db, 'roles'));
                const newRole: JobRole = { id: newRoleRef.id, title: targetRoleTitle, description: jdResult.jobDescription, department: "Engineering", openings: 1 };
                await setDoc(newRoleRef, newRole);
                
                log("Role Synthesis Complete", `Created and saved new role: '${newRole.title}'.`);
                
                const candidatesToReview = candidatesForSim.filter(c => c.status === 'Screening');
                const reviewPromises = candidatesToReview.map(async (c) => {
                    const review = await reviewCandidate({ candidateData: c.narrative, jobDescription: newRole.description, companyType: 'startup' });
                    if (review.recommendation === 'Hire' || review.recommendation === 'Maybe') {
                        return { ...c, status: 'Interview' as KanbanStatus, role: newRole.title };
                    }
                    return c;
                });

                const reviewedCandidates = await Promise.all(reviewPromises);
                
                const batch = writeBatch(db);
                reviewedCandidates.forEach(c => {
                    if (c.id) {
                        const { id, ...data } = c;
                        batch.update(doc(db, 'candidates', id), data);
                    }
                });
                await batch.commit();
                
                const matchedCount = reviewedCandidates.filter(c => c.status === 'Interview').length;
                log("Candidate Review Complete", `Matched ${matchedCount} candidates to '${newRole.title}' and moved to 'Interview'.`);

                const interviewCandidate = reviewedCandidates.find(c => c.status === 'Interview');
                if (interviewCandidate) {
                    setLoadingText("Phase 3/5: Simulating AI Gauntlet...");
                    log("Gauntlet Simulation", `Simulating gauntlet for ${interviewCandidate.name}.`);
                    const bossReview = await finalInterviewReview({interviewReport: "Simulated Technical and System Design phases."});

                    if (bossReview.finalRecommendation === "Strong Hire") {
                        setLoadingText("Phase 4/5: BOSS AI approved. Drafting offer...");
                        log("BOSS Validation", `BOSS AI approved ${interviewCandidate.name} with recommendation: ${bossReview.finalRecommendation}.`);
                        
                        const offer = await draftOfferLetter({
                           candidateName: interviewCandidate.name,
                           roleTitle: interviewCandidate.role,
                           candidateSkills: interviewCandidate.skills,
                           candidateExperience: interviewCandidate.narrative,
                           companyName: "AstraHire Client",
                           companySalaryBands: "For a senior role, the band is typically between $120,000 and $150,000.",
                           simulatedMarketData: "Market analysis indicates the average salary for this role with this experience is around $135,000."
                        });

                        log("Offer Drafted", `Market-aware offer drafted for ${interviewCandidate.name} with salary ${offer.suggestedSalary}.`);
                        setLoadingText("Phase 5/5: Hiring candidate...");
                        await updateDoc(doc(db, 'candidates', interviewCandidate.id), { status: 'Hired' });
                        log("Hiring Decision", `Autonomously hired ${interviewCandidate.name} for the role of ${interviewCandidate.role}.`);
                    } else {
                        log("BOSS Validation", `BOSS AI rejected ${interviewCandidate.name}. Ending simulation.`);
                    }
                }
            } else {
                 log("Role Synthesis", "Not enough qualified candidates to synthesize a new role. Ending simulation.");
                 throw new Error("Simulation ended early: No qualified candidates found.");
            }
            
            setLastSaarthiReport({
                reportType: "Pipeline Simulation",
                simulationSummary: `The end-to-end simulation autonomously processed the pipeline. It sourced/screened candidates, created a role, and moved the top candidate through a full gauntlet, validation, and offer process.`,
                detailedProcessLog: currentSimulationLog,
            });
            setIsSaarthiReportOpen(true);

        } catch (error) {
            console.error("Full pipeline simulation failed:", error);
            toast({ title: "Simulation Error", description: "An error occurred. Check the console.", variant: "destructive"});
            log("Error", `The simulation was interrupted by an error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };
  
    const handleSystemAudit = async (files: FileList) => {
        setIsLoading(true);
        const auditLog: any[] = [];
        const log = (step: string, description: string, status: 'Success' | 'Failure' | 'Info' = 'Info') => {
            console.log(`[AUDIT LOG] ${step} (${status}): ${description}`);
            auditLog.push({ step, description, status });
        };
        
        try {
            log("Start Audit", `Starting system audit with ${files.length} resumes.`);
            setLoadingText("Phase 1: Screening...");
            
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
            
            setLoadingText("Phase 2: Role Discovery & Synthesis...");
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

                setLoadingText("Phase 3: Targeted Review & Analysis...");
                const review = await reviewCandidate({ candidateData: topCandidate.narrative, jobDescription: testRole.description, companyType: 'enterprise' });
                log("AI-Assisted Candidate Review", `Successfully reviewed ${topCandidate.name} for role. Recommendation: ${review.recommendation}`, "Success");

                const skillGap = await skillGapAnalysis({ candidateSkills: topCandidate.skills, jobDescription: testRole.description });
                log("Skill Gap Analysis", `Successfully analyzed skill gap. Found ${skillGap.skillGaps.length} gaps.`, "Success");

                setLoadingText("Phase 4: Offer & Onboarding...");
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
        setLoadingText(`Scanning for archived candidates for ${role.title}...`);
        
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
        return <RolesTab roles={roles} onViewCandidates={handleViewCandidatesForRole} onReEngage={handleReEngageForRole} onAddRole={handleAddRole} onDeleteRole={handleDeleteRole} />;
      case 'pool':
        return (
            <CandidatePoolTab 
                candidates={candidates}
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

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-background text-foreground">
       {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-muted-foreground">{loadingText}</p>
                </div>
            </div>
        )}

      <SaarthiReportModal 
        isOpen={isSaarthiReportOpen}
        onClose={() => setIsSaarthiReportOpen(false)}
        reportData={lastSaarthiReport}
      />

      <AstraHireHeader onReportClick={() => {
          if (lastSaarthiReport) {
              setIsSaarthiReportOpen(true);
          } else {
              toast({ title: "No SAARTHI report available yet.", description: "Please run a simulation or audit first.", variant: "destructive" });
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
    </div>
  );
}
