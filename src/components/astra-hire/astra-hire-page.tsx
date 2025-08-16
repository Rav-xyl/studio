
'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Briefcase, Users, Loader2 } from 'lucide-react';
import { AstraHireHeader } from './astra-hire-header';
import { CandidatePoolTab } from '../kanban/candidate-pool-tab';
import { RolesTab } from '../roles/roles-tab';
import { AnalyticsTab } from '../analytics/analytics-tab';
import type { Candidate, JobRole, KanbanStatus, RubricChange } from '@/lib/types';
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
  const [lastSaarthiReport, setLastSaarthiReport] = useState<any>(null);
  const [filteredRole, setFilteredRole] = useState<JobRole | null>(null);
  const [suggestedChanges, setSuggestedChanges] = useState<RubricChange[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [isSaarthiReportOpen, setIsSaarthiReportOpen] = useState(false);
  const { toast } = useToast();

  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

  // --- State Persistence ---
  useEffect(() => {
    try {
      const storedCandidates = localStorage.getItem('candidates');
      const storedRoles = localStorage.getItem('roles');
      if (storedCandidates) {
        setCandidates(JSON.parse(storedCandidates));
      }
      if (storedRoles) {
        setRoles(JSON.parse(storedRoles));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('candidates', JSON.stringify(candidates));
  }, [candidates]);
  
  useEffect(() => {
    localStorage.setItem('roles', JSON.stringify(roles));
  }, [roles]);


  // --- Core Logic ---
  const handleUpdateCandidate = async (updatedCandidate: Candidate) => {
    setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
  };


  const handleBulkUpload = async (files: FileList | null) => {
    if (!files) return;

    const newFilesMap = new Map(uploadedFiles);
    const newCandidates: Candidate[] = [];
    let addedCount = 0;

    for (const file of files) {
      if (!newFilesMap.has(file.name) && !candidates.some(c => c.name === file.name)) {
        newFilesMap.set(file.name, file);
        const newCandidate: Candidate = {
          id: `cand-${nanoid(10)}`,
          name: file.name,
          avatarUrl: '',
          role: 'New Upload',
          skills: [],
          status: 'Sourcing', 
          narrative: `Resume file: ${file.name}`,
          inferredSkills: [],
          lastUpdated: 'Just now',
        };
        newCandidates.push(newCandidate);
        addedCount++;
      }
    }
    setUploadedFiles(newFilesMap);
    const candidatesToProcess = [...candidates, ...newCandidates];
    setCandidates(candidatesToProcess);

    if (addedCount > 0) {
      toast({ title: "Upload Successful", description: `${addedCount} new resumes added. Screening automatically...` });
      
      setIsLoading(true);
      setLoadingText(`Screening ${newCandidates.length} new resumes...`);

      const screeningPromises = newCandidates.map(async (candidate) => {
        const file = newFilesMap.get(candidate.name);
        if (!file) {
          return { ...candidate, status: 'Sourcing' as KanbanStatus, narrative: 'File not found for processing.' };
        }
        try {
          const resumeDataUri = await convertFileToDataUri(file);
          const result = await automatedResumeScreening({ resumeDataUri });
          return {
            ...candidate,
            ...result.extractedInformation,
            status: 'Screening' as KanbanStatus,
            aiInitialScore: result.candidateScore,
            lastUpdated: 'Just now'
          };
        } catch (error) {
          console.error(`Failed to process ${candidate.name}:`, error);
          return { ...candidate, status: 'Sourcing' as KanbanStatus, narrative: 'AI screening failed.' };
        }
      });
      
      const updatedCandidates = await Promise.all(screeningPromises);
      setCandidates(prev => prev.map(c => updatedCandidates.find(uc => uc.id === c.id) || c));

      setIsLoading(false);
      toast({ title: 'Screening Complete', description: `Processed ${updatedCandidates.length} resumes.` });

    } else {
      toast({ title: "No new resumes added", description: "All selected files were already in the pool.", variant: "destructive" });
    }
  };
  
  const handleStimulateFullPipeline = async () => {
        setIsLoading(true);
        const currentSimulationLog: any[] = [];
        let currentCandidates = [...candidates];
        let currentRoles = [...roles];

        const log = (step: string, description: string) => {
            console.log(`[SAARTHI LOG] ${step}: ${description}`);
            currentSimulationLog.push({ step, description });
        };

        try {
            log("Start Simulation", "Beginning autonomous pipeline simulation.");
            
            // Phase 1: Proactive Sourcing if needed
            if (currentCandidates.filter(c => c.status === 'Sourcing' || c.status === 'Screening').length === 0) {
              setLoadingText("Phase 1/5: No candidates found. Proactively sourcing talent...");
              log("Proactive Sourcing", "Candidate pool is empty. Generating fictional candidates to demonstrate pipeline.");
              const sourcingResult = await proactiveCandidateSourcing({
                  openRoles: currentRoles.length > 0 ? currentRoles : [{ title: "Senior Software Engineer", description: "Lead development of our core platform." }],
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
                  lastUpdated: 'Just now'
              }));
              currentCandidates = [...currentCandidates, ...sourcedCandidates];
              setCandidates(currentCandidates);
              log("Proactive Sourcing Complete", `Generated ${sourcedCandidates.length} new candidates.`);
            }

            // Phase 2: Autonomous Role Creation & Matching
            setLoadingText("Phase 2/5: Synthesizing role and matching candidates...");
            const topCandidate = currentCandidates.filter(c => c.status === 'Screening').sort((a,b) => (b.aiInitialScore || 0) - (a.aiInitialScore || 0))[0];
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
                const newRole: JobRole = { id: `role-${nanoid(10)}`, title: targetRoleTitle, description: jdResult.jobDescription, department: "Engineering", openings: 1 };
                currentRoles = [...currentRoles, newRole];
                setRoles(currentRoles);
                log("Role Synthesis Complete", `Created new role: '${newRole.title}'.`);

                const reviewPromises = currentCandidates.filter(c => c.status === 'Screening').map(async (c) => {
                    const review = await reviewCandidate({ candidateData: c.narrative, jobDescription: newRole.description });
                    return { ...c, review };
                });
                const reviewedCandidates = await Promise.all(reviewPromises);
                const matchedCandidates = reviewedCandidates.filter(c => c.review.recommendation === 'Hire' || c.review.recommendation === 'Maybe').map(c => ({...c, status: 'Interview' as KanbanStatus, role: newRole.title }));
                currentCandidates = currentCandidates.map(c => matchedCandidates.find(mc => mc.id === c.id) || c);
                setCandidates(currentCandidates);
                log("Candidate Review Complete", `Matched ${matchedCandidates.length} candidates to '${newRole.title}' and moved to 'Interview'.`);
            } else {
                 log("Role Synthesis", "Not enough qualified candidates to synthesize a new role. Ending simulation.");
                 throw new Error("Simulation ended early: No qualified candidates found.");
            }

            // Phase 3: The Automated Gauntlet (Simulated)
            setLoadingText("Phase 3/5: Simulating interview gauntlets...");
            const interviewCandidates = currentCandidates.filter(c => c.status === 'Interview');
            log("Interview Simulation", `Simulating gauntlet for ${interviewCandidates.length} candidates.`);
            const interviewReports = interviewCandidates.map(c => ({
                candidateId: c.id,
                report: `SIMULATED INTERVIEW REPORT FOR ${c.name}:\n- Technical Score: 8/10\n- System Design: Strong, scalable approach.\n- Overall: A promising candidate.`
            }));

            // Phase 4: The Final Judgment (BOSS Validation)
            setLoadingText("Phase 4/5: BOSS AI is validating candidates...");
            const validationPromises = interviewReports.map(async (r) => {
                const result = await finalInterviewReview({ interviewReport: r.report });
                return { ...r, validation: result };
            });
            const validatedCandidates = await Promise.all(validationPromises);
            const successfulCandidates = validatedCandidates.filter(v => v.validation.finalRecommendation === "Strong Hire");
            log("BOSS Validation", `BOSS AI reviewed ${validatedCandidates.length} reports. ${successfulCandidates.length} received a 'Strong Hire'.`);

            if (successfulCandidates.length === 0) {
                log("Hiring Decision", "No candidates passed the BOSS AI validation. No hire was made.");
            } else {
                const candidateToHireId = successfulCandidates[0].candidateId;
                const candidateToHire = currentCandidates.find(c => c.id === candidateToHireId)!;

                // Phase 5: The Market-Aware Offer
                setLoadingText("Phase 5/5: Drafting market-aware offer...");
                log("Offer Drafting", `Drafting offer for ${candidateToHire.name}.`);
                const offer = await draftOfferLetter({
                    candidateName: candidateToHire.name,
                    roleTitle: candidateToHire.role,
                    candidateSkills: candidateToHire.skills,
                    candidateExperience: candidateToHire.narrative,
                    companyName: "AstraHire Client",
                    companySalaryBands: "Senior: 140k-180k INR",
                    simulatedMarketData: "Average market rate for this role in the Indian job market is around 165k INR.",
                });
                log("Offer Complete", `Drafted offer with salary ${offer.suggestedSalary}.`);

                currentCandidates = currentCandidates.map(c => c.id === candidateToHireId ? { ...c, status: 'Hired' as KanbanStatus } : c);
                setCandidates(currentCandidates);
                log("Hiring Decision", `Autonomously hired ${candidateToHire.name} for the role of ${candidateToHire.role}.`);
            }

            setLastSaarthiReport({
                simulationSummary: `The end-to-end simulation autonomously processed the pipeline. It sourced/screened candidates, created a role, ran candidates through a simulated interview gauntlet, had the BOSS AI validate the results, and drafted a market-aware offer for the top candidate.`,
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
  
    const handleViewCandidatesForRole = (role: JobRole) => {
        setFilteredRole(role);
        setActiveTab('pool');
    };

    const handleReEngageForRole = async (role: JobRole) => {
        setIsLoading(true);
        setLoadingText(`Scanning for archived candidates for ${role.title}...`);
        
        const archivedCandidates = candidates.filter(c => c.archived);

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
        return <RolesTab roles={roles} setRoles={setRoles} onViewCandidates={handleViewCandidatesForRole} onReEngage={handleReEngageForRole} />;
      case 'pool':
        return (
            <CandidatePoolTab 
                candidates={candidates}
                onUpload={handleBulkUpload}
                onStimulateFullPipeline={handleStimulateFullPipeline}
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
              toast({ title: "No SAARTHI report available yet.", description: "Please run the 'Stimulate Full Pipeline' first.", variant: "destructive" });
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
