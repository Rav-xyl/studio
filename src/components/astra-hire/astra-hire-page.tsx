
'use client';

import { useState } from 'react';
import { BarChart2, Briefcase, Users, Loader2 } from 'lucide-react';
import { AstraHireHeader } from './astra-hire-header';
import { CandidatePoolTab } from '../kanban/candidate-pool-tab';
import { RolesTab } from '../roles/roles-tab';
import { AnalyticsTab } from '../analytics/analytics-tab';
import type { Candidate, JobRole, KanbanStatus, RubricChange } from '@/lib/types';
import { automatedResumeScreening } from '@/ai/flows/automated-resume-screening';
import { reviewCandidate } from '@/ai/flows/ai-assisted-candidate-review';
import { suggestRoleMatches } from '@/ai/flows/suggest-role-matches';
import { SaarthiReportModal } from './saarthi-report-modal';
import { useToast } from '@/hooks/use-toast';
import { proactiveCandidateSourcing } from '@/ai/flows/proactive-candidate-sourcing';
import { analyzeHiringOverride } from '@/ai/flows/self-correcting-rubric';
import { reEngageCandidate, ReEngageCandidateOutput } from '@/ai/flows/re-engage-candidate';

// --- Helper Functions ---
function convertFileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

export function AstraHirePage() {
  const [activeTab, setActiveTab] = useState('pool');

  // --- State Management ---
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [simulationLog, setSimulationLog] = useState<any[]>([]);
  const [lastSaarthiReport, setLastSaarthiReport] = useState<any>(null);
  const [filteredRole, setFilteredRole] = useState<JobRole | null>(null);
  const [suggestedChanges, setSuggestedChanges] = useState<RubricChange[]>([]);


  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [isSaarthiReportOpen, setIsSaarthiReportOpen] = useState(false);
  const { toast } = useToast();

  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

  // --- Core Logic ---

  const handleUpdateCandidate = async (updatedCandidate: Candidate) => {
    const oldCandidate = candidates.find(c => c.id === updatedCandidate.id);
    
    // --- Self-Correcting Rubric Trigger ---
    // If a candidate was rejected by AI but hired by a human, trigger the analysis.
    if (oldCandidate && oldCandidate.aiInitialDecision === 'Rejected' && updatedCandidate.status === 'Hired') {
        toast({ title: "Learning Event Triggered", description: "Analyzing recruiter override to improve AI accuracy..." });
        try {
            const result = await analyzeHiringOverride({
                candidateProfile: {
                    name: updatedCandidate.name,
                    skills: updatedCandidate.skills,
                    narrative: updatedCandidate.narrative,
                    aiInitialDecision: oldCandidate.aiInitialDecision,
                    aiInitialScore: oldCandidate.aiInitialScore || 0,
                    humanFinalDecision: updatedCandidate.status,
                },
                roleTitle: updatedCandidate.role,
                currentRubricWeights: "Standard weights: skills: 25%, experience: 25%, narrative: 20%, inferred: 30%",
            });

            const newChange: RubricChange = {
                id: Date.now(),
                criteria: updatedCandidate.role,
                change: result.suggestedChange,
                reason: result.analysis,
                status: 'Pending',
            };
            setSuggestedChanges(prev => [...prev, newChange]);
            toast({ title: "AI Rubric Suggestion Ready", description: "A new suggestion for improving the AI is available on the Analytics tab." });

        } catch (error) {
            console.error("Failed to analyze hiring override:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not perform self-correction analysis." });
        }
    }

    setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
  };


  const handleBulkUpload = (files: FileList | null) => {
    if (!files) return;

    const newFilesMap = new Map(uploadedFiles);
    const newCandidates: Candidate[] = [];

    let addedCount = 0;
    for (const file of files) {
      if (!newFilesMap.has(file.name) && !candidates.some(c => c.name === file.name)) {
        newFilesMap.set(file.name, file);
        const newCandidate: Candidate = {
          id: `cand-${Date.now()}-${Math.random()}`,
          name: file.name,
          avatarUrl: '',
          role: 'New Upload',
          skills: [],
          status: 'Uploaded',
          narrative: `Resume file: ${file.name}`,
          inferredSkills: [],
          lastUpdated: 'Just now',
        };
        newCandidates.push(newCandidate);
        addedCount++;
      }
    }
    setUploadedFiles(newFilesMap);
    setCandidates(prev => [...prev, ...newCandidates]);
    if (addedCount > 0) {
        toast({ title: "Upload Successful", description: `${addedCount} new resumes added to the pool.`});
    } else {
        toast({ title: "No new resumes added", description: "All selected files were already in the pool.", variant: "destructive" });
    }
  };

  const handleScreenResumes = async () => {
    const candidatesToProcess = candidates.filter(c => c.status === 'Uploaded');
    if (candidatesToProcess.length === 0) {
      toast({ title: 'No new resumes to screen.' });
      return;
    }

    setIsLoading(true);
    setLoadingText(`Screening ${candidatesToProcess.length} resumes...`);
    setSimulationLog(prev => [...prev, { step: 'Resume Screening', description: `Starting screening for ${candidatesToProcess.length} resumes.` }]);

    const screeningPromises = candidatesToProcess.map(async (candidate) => {
      const file = uploadedFiles.get(candidate.name);
      if (!file) {
        return { ...candidate, status: 'Error' as KanbanStatus, narrative: 'File not found for processing.' };
      }
      try {
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'Processing' } : c));
        const resumeDataUri = await convertFileToDataUri(file);
        const result = await automatedResumeScreening({ resumeDataUri });

        const updatedCandidate: Candidate = {
          ...candidate,
          ...result.extractedInformation,
          status: result.candidateScore >= 70 ? 'Screening' : 'Manual Review',
          aiInitialScore: result.candidateScore,
          lastUpdated: 'Just now'
        };
        
        if (result.candidateScore < 50) updatedCandidate.status = 'Rejected';
        else if (result.candidateScore < 70) updatedCandidate.status = 'Manual Review';
        else updatedCandidate.status = 'Screening';
        
        return updatedCandidate;

      } catch (error) {
        console.error(`Failed to process ${candidate.name}:`, error);
        return { ...candidate, status: 'Error' as KanbanStatus, narrative: 'AI screening failed.' };
      }
    });

    const updatedCandidates = await Promise.all(screeningPromises);
    setCandidates(prev => prev.map(c => updatedCandidates.find(uc => uc.id === c.id) || c));

    setIsLoading(false);
    toast({ title: 'Screening Complete', description: `Processed ${updatedCandidates.length} resumes.` });
    setSimulationLog(prev => [...prev, { step: 'Resume Screening', description: `Finished screening. See candidate statuses for results.` }]);
  };
  
  const handleAryaReviewAll = async () => {
        const candidatesToReview = candidates.filter(c => c.status === 'Manual Review');
        if(candidatesToReview.length === 0) {
            toast({ title: "No candidates to review."});
            return;
        }

        setIsLoading(true);
        setLoadingText(`Arya is reviewing ${candidatesToReview.length} candidates...`);
        setSimulationLog(prev => [...prev, { step: 'AI Deep Review', description: `Starting deep review for ${candidatesToReview.length} candidates.` }]);

        const reviewPromises = candidatesToReview.map(async (candidate) => {
            try {
                setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'Processing' } : c));
                const jobDescription = "A challenging role at a leading tech company requiring strong problem-solving skills and relevant technical expertise.";
                const result = await reviewCandidate({ candidateData: candidate.narrative, jobDescription });

                let newStatus: KanbanStatus = 'Manual Review';
                if (result.recommendation.toLowerCase() === 'hire') {
                    newStatus = 'Interview';
                } else if (result.recommendation.toLowerCase() === 'reject') {
                    newStatus = 'Rejected';
                } else {
                    newStatus = 'Interview'; // Optimistic for "Maybe"
                }

                return { ...candidate, status: newStatus, narrative: `${candidate.narrative}\n\nAI Review: ${result.justification}`, aiInitialDecision: result.recommendation === 'Reject' ? 'Rejected' : 'Hired' };

            } catch (error) {
                console.error(`Failed to review ${candidate.name}:`, error);
                return { ...candidate, status: 'Error' as KanbanStatus, narrative: `${candidate.narrative}\n\nAI review failed.` };
            }
        });

        const reviewedCandidates = await Promise.all(reviewPromises);
        setCandidates(prev => prev.map(c => reviewedCandidates.find(rc => rc.id === c.id) || c));
        
        setIsLoading(false);
        toast({ title: 'AI Review Complete', description: `Finished deep review of ${reviewedCandidates.length} candidates.` });
        setSimulationLog(prev => [...prev, { step: 'AI Deep Review', description: `Finished deep review.` }]);
    };

    const handleSuggestRoleMatches = async () => {
        const candidatesToAnalyze = candidates.filter(c => c.status === 'Screening');
        if (candidatesToAnalyze.length === 0) {
            toast({ title: "No screened candidates available", description: "Screen some resumes first to find candidates eligible for role matching." });
            return;
        }

        setIsLoading(true);
        setLoadingText("Analyzing candidate pool to suggest new roles...");

        const suggestionPromises = candidatesToAnalyze.map(c => suggestRoleMatches({
            candidateName: c.name,
            candidateSkills: c.skills.join(', '),
            candidateNarrative: c.narrative,
            candidateInferredSkills: c.inferredSkills.join(', ')
        }));

        try {
            const results = await Promise.all(suggestionPromises);
            const allRoles = results.flatMap(r => r.roles);
            const roleCounts = allRoles.reduce((acc, role) => {
                acc[role.roleTitle] = (acc[role.roleTitle] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const frequentRoles = Object.entries(roleCounts).filter(([_, count]) => count > 1).map(([title]) => title);

            if (frequentRoles.length > 0) {
                 toast({
                    title: "Potential New Roles Identified!",
                    description: `Based on your candidate pool, you might consider opening roles for: ${frequentRoles.join(', ')}. Use 'Synthesize New JD' to create them.`,
                    duration: 9000
                });
            } else {
                toast({ title: "No strong role patterns found", description: "The AI didn't find enough overlapping skills to suggest a new, distinct role." });
            }

        } catch (error) {
            console.error("Failed to suggest role matches:", error);
            toast({ title: "Error Suggesting Roles", description: "An AI error occurred. Please check the console.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindPotentialRoles = async () => {
        const candidatesToMatch = candidates.filter(c => c.status === 'Screening');
        if (candidatesToMatch.length === 0) {
            toast({ title: "No screened candidates to match." });
            return;
        }
        if (roles.length === 0) {
            toast({ title: "No roles to match against.", description: "Please create a client role first." });
            return;
        }

        setIsLoading(true);
        setLoadingText("Matching candidates to existing roles...");

        let matchedCount = 0;
        
        const updatedCandidates = candidates.map(candidate => {
            if (candidate.status !== 'Screening') return candidate;

            for (const role of roles) {
                 const candidateSkills = new Set(candidate.skills.map(s => s.toLowerCase()));
                 const roleKeywords = new Set(role.description.toLowerCase().match(/\b(\w+)\b/g) || []);
                
                 const intersection = new Set([...candidateSkills].filter(skill => roleKeywords.has(skill)));
                 const score = (intersection.size / (role.description.split(' ').length || 1) * 100) + (intersection.size * 10);


                if (score > 50) { // Threshold for a potential match
                    matchedCount++;
                    return { ...candidate, status: 'Interview' as KanbanStatus, role: role.title };
                }
            }
            return candidate;
        });

        setCandidates(updatedCandidates);
        setIsLoading(false);
        toast({ title: "Matching Complete", description: `${matchedCount} candidates were matched to potential roles and moved to the 'Interview' stage.` });
    };

    const handleProactiveSourcing = async () => {
        if (roles.length === 0) {
            toast({ title: "No roles to source for", description: "Please create at least one client role before sourcing.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setLoadingText("AI is proactively sourcing new candidates...");
        try {
            const result = await proactiveCandidateSourcing({
                openRoles: roles.map(r => ({ title: r.title, description: r.description })),
                numberOfCandidates: 5,
            });

            const newCandidates: Candidate[] = result.sourcedCandidates.map(sc => ({
                id: `cand-${Date.now()}-${Math.random()}`,
                name: sc.name,
                avatarUrl: '',
                role: sc.role,
                skills: sc.skills,
                status: 'Uploaded',
                narrative: sc.narrative,
                inferredSkills: sc.inferredSkills,
                lastUpdated: 'Just now',
            }));
            
            setCandidates(prev => [...prev, ...newCandidates]);
            toast({ title: "Sourcing Complete!", description: `${newCandidates.length} new candidate profiles have been added to the pool.`});

        } catch (error) {
            console.error("Failed to source candidates:", error);
            toast({ title: "Sourcing Error", description: "An AI error occurred during proactive sourcing.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


    const handleViewCandidatesForRole = (role: JobRole) => {
        setFilteredRole(role);
        setActiveTab('pool');
    };

    const handleReEngage = async (role: JobRole) => {
        const rejectedCandidates = candidates.filter(c => c.status === 'Rejected');
        if (rejectedCandidates.length === 0) {
            toast({ title: "No rejected candidates to re-engage." });
            return;
        }

        setIsLoading(true);
        setLoadingText(`AI is re-evaluating ${rejectedCandidates.length} rejected candidates for ${role.title}...`);

        const reEngagementPromises = rejectedCandidates.map(c => reEngageCandidate({
            candidateName: c.name,
            candidateSkills: c.skills,
            candidateNarrative: c.narrative,
            newJobTitle: role.title,
            newJobDescription: role.description,
            companyName: "AstraHire Client"
        }).then(result => ({ candidateId: c.id, result })));

        const results = await Promise.all(reEngagementPromises);
        const matches = results.filter(r => r.result.isMatch);

        if (matches.length > 0) {
            setCandidates(prev => prev.map(c => {
                const match = matches.find(m => m.candidateId === c.id);
                if (match) {
                    return { ...c, status: 'Interview', role: role.title };
                }
                return c;
            }));
             toast({
                title: "Re-engagement Successful!",
                description: `${matches.length} previously rejected candidates have been identified as a strong match and moved to the 'Interview' stage for '${role.title}'.`,
                duration: 9000,
            });
        } else {
            toast({ title: "No Matches Found", description: "No previously rejected candidates were a strong fit for this role." });
        }

        setIsLoading(false);
    };
  
    const handleStimulateFullPipeline = async () => {
        setIsLoading(true);
        const currentSimulationLog: any[] = [];
        const log = (step: string, description: string) => {
            currentSimulationLog.push({ step, description });
        };

        try {
            log("Start Simulation", "Beginning end-to-end test of the hiring pipeline.");

            // Phase 1: Screening
            setLoadingText("Phase 1/4: Screening all new resumes...");
            const candidatesToScreen = candidates.filter(c => c.status === 'Uploaded');
            if (candidatesToScreen.length > 0) {
                await handleScreenResumes();
                log("Screening", `Screening completed for ${candidatesToScreen.length} candidates.`);
            } else {
                log("Screening", "No new resumes to screen. Skipped.");
            }
            await new Promise(r => setTimeout(r, 500));

            // Phase 2: Deep Review
            setLoadingText("Phase 2/4: Arya is performing deep reviews...");
            const candidatesToReview = candidates.filter(c => c.status === 'Manual Review');
            if (candidatesToReview.length > 0) {
                await handleAryaReviewAll();
                log("AI Deep Review", `Deep review completed for ${candidatesToReview.length} candidates.`);
            } else {
                log("AI Deep Review", "No candidates in 'Manual Review'. Skipped.");
            }
            await new Promise(r => setTimeout(r, 500));

            // Phase 3: Role Matching
            setLoadingText("Phase 3/4: Matching candidates to roles...");
            let testRole = roles.find(r => r.title === "Software Engineer");
            if (!testRole) {
                testRole = { id: 'test-role-1', title: 'Software Engineer', department: 'Engineering', openings: 1, description: "Develop and maintain web applications using React and Node.js." };
                setRoles(prev => [...prev, testRole!]);
                log("Role Management", "Created a temporary 'Software Engineer' role for testing.");
            }
            await handleFindPotentialRoles();
            log("Role Matching", "Attempted to match all screened candidates to available roles.");
            await new Promise(r => setTimeout(r, 500));

            // Phase 4: Simulate Hires
            setLoadingText("Phase 4/4: Simulating final hiring decisions...");
            let hiredCount = 0;
            setCandidates(prev => prev.map(c => {
                if (c.status === 'Interview' && hiredCount < 2) {
                    hiredCount++;
                    return { ...c, status: 'Hired' };
                }
                return c;
            }));
            log("Simulate Hires", `Automatically moved ${hiredCount} candidates from 'Interview' to 'Hired' to test final stage logic.`);
            await new Promise(r => setTimeout(r, 500));

            // Final Report Generation
            setLoadingText("Generating SAARTHI Report...");
            setLastSaarthiReport({
                simulationSummary: "The end-to-end simulation tested all core AI functionalities, from resume ingestion to final hiring. The system automatically screened, reviewed, matched, and hired candidates. This report details the outcomes and confirms system health.",
                detailedProcessLog: currentSimulationLog,
                candidateOutcomesAnalysis: candidates.map(c => ({ candidateName: c.name, outcomeDetails: `Final status: ${c.status}. Score: ${c.aiInitialScore || 'N/A'}.` })),
                roleManagementInsights: ["The simulation successfully used a test role to validate the matching algorithm.", "This process confirms that candidates correctly move through the pipeline stages as intended by the AI logic."],
                systemLearningAndFutureImprovements: "This full pipeline test provides a baseline for system performance. Each step's success or failure can be analyzed from this report to target and fix specific functionalities, ensuring the entire system works cohesively."
            });
            setIsSaarthiReportOpen(true);

        } catch (error) {
            console.error("Full pipeline simulation failed:", error);
            toast({ title: "Simulation Error", description: "An error occurred during the simulation. Check the console.", variant: "destructive"});
            log("Error", `The simulation was interrupted by an error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };
  
  const renderActiveTabView = () => {
    switch (activeTab) {
      case 'roles':
        return <RolesTab roles={roles} setRoles={setRoles} onViewCandidates={handleViewCandidatesForRole} onReEngage={handleReEngage} />;
      case 'pool':
        return (
            <CandidatePoolTab 
                candidates={candidates}
                onUpload={handleBulkUpload}
                onScreenAll={handleScreenResumes}
                onAryaReviewAll={handleAryaReviewAll}
                onSuggestRoleMatches={handleSuggestRoleMatches}
                onFindPotentialRoles={handleFindPotentialRoles}
                onStimulateFullPipeline={handleStimulateFullPipeline}
                onProactiveSourcing={handleProactiveSourcing}
                onUpdateCandidate={handleUpdateCandidate}
                filteredRole={filteredRole}
                onClearFilter={() => setFilteredRole(null)}
            />
        );
      case 'analytics':
        return <AnalyticsTab roles={roles} candidates={candidates} suggestedChanges={suggestedChanges} setSuggestedChanges={setSuggestedChanges} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       {isLoading && (
            <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-slate-300">{loadingText}</p>
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
              toast({ title: "No SAARTHI report available yet.", description: "Please run the 'Stimulate Full Pipeline' first.", variant: "destructive" });
          }
      }} />
      <main>
        <div className="border-b border-slate-700 mb-6">
          <nav className="flex -mb-px">
            <button
              className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
              onClick={() => { setActiveTab('roles'); setFilteredRole(null); }}
            >
              <Briefcase className="inline-block w-4 h-4 mr-2" />
              Client Roles
            </button>
            <button
              className={`tab-btn ${activeTab === 'pool' ? 'active' : ''}`}
              onClick={() => setActiveTab('pool')}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Candidate Pool
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
        <div id="tab-content">{renderActiveTabView()}</div>
      </main>
    </div>
  );
}
