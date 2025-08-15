
'use client';

import { useState } from 'react';
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
            
            if (currentCandidates.filter(c => c.status === 'Sourcing' || c.status === 'Screening').length === 0) {
              setLoadingText("Phase 1/6: No candidates found. Sourcing talent...");
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
                  status: 'Screening', // Start them at screening
                  aiInitialScore: Math.floor(Math.random() * 20) + 75, // Give them a good score
                  avatarUrl: '',
                  lastUpdated: 'Just now'
              }));
              currentCandidates = [...currentCandidates, ...sourcedCandidates];
              setCandidates(currentCandidates);
              log("Proactive Sourcing Complete", `Generated ${sourcedCandidates.length} new candidates.`);
            }

            // 1. Genuine AI Screening
            setLoadingText("Phase 2/6: Screening candidates...");
            const candidatesToScreen = currentCandidates.filter(c => c.status === 'Sourcing');
            if (candidatesToScreen.length > 0) {
                log("Screening", `Found ${candidatesToScreen.length} candidates in Sourcing. Invoking screening AI...`);
                const screeningPromises = candidatesToScreen.map(async (c) => {
                    const file = uploadedFiles.get(c.name);
                    if (!file) return { ...c, status: 'Screening' as KanbanStatus, aiInitialScore: 70, narrative: "This is a simulated candidate profile for demonstration." };
                    const resumeDataUri = await convertFileToDataUri(file);
                    const result = await automatedResumeScreening({ resumeDataUri });
                    return { ...c, ...result.extractedInformation, status: 'Screening' as KanbanStatus, aiInitialScore: result.candidateScore };
                });
                const screenedCandidates = await Promise.all(screeningPromises);
                currentCandidates = currentCandidates.map(c => screenedCandidates.find(sc => sc.id === c.id) || c);
                setCandidates(currentCandidates);
                log("Screening Complete", `Screened ${screenedCandidates.length} candidates. Moved to 'Screening' column.`);
            } else {
                log("Screening", "No candidates in Sourcing to screen. Skipping phase.");
            }

            // 2. Autonomous Role Creation
            setLoadingText("Phase 3/6: Analyzing talent pool to create role...");
            const topCandidatesForRoleGen = currentCandidates.filter(c => c.status === 'Screening').sort((a,b) => (b.aiInitialScore || 0) - (a.aiInitialScore || 0)).slice(0, 3);
            if(topCandidatesForRoleGen.length > 0) {
                const roleSuggestionInput = topCandidatesForRoleGen[0];
                const roleSuggestions = await suggestRoleMatches({
                    candidateName: roleSuggestionInput.name,
                    candidateSkills: roleSuggestionInput.skills.join(', '),
                    candidateNarrative: roleSuggestionInput.narrative,
                    candidateInferredSkills: roleSuggestionInput.inferredSkills.join(', '),
                });

                const targetRoleTitle = roleSuggestions.roles[0]?.roleTitle || "Lead Software Engineer";
                log("Role Synthesis", `Identified top talent cluster. Synthesizing role for: '${targetRoleTitle}'`);

                const jdResult = await synthesizeJobDescription({
                    jobTitle: targetRoleTitle,
                    companyInformation: "A fast-growing tech startup in the AI space, focused on innovation and agile development."
                });

                const newRole: JobRole = {
                    id: `role-${nanoid(10)}`,
                    title: targetRoleTitle,
                    description: jdResult.jobDescription,
                    department: "Engineering",
                    openings: 1
                };
                currentRoles = [...currentRoles, newRole];
                setRoles(currentRoles);
                log("Role Synthesis Complete", `Successfully created new role: '${newRole.title}'.`);

                // 3. Intelligent Candidate Matching
                setLoadingText("Phase 4/6: Matching candidates to new role...");
                const candidatesToReview = currentCandidates.filter(c => c.status === 'Screening').slice(0, 5); // Review top 5
                log("Candidate Review", `Reviewing ${candidatesToReview.length} screened candidates for the new role.`);

                const reviewPromises = candidatesToReview.map(async (c) => {
                    const review = await reviewCandidate({ candidateData: c.narrative, jobDescription: newRole.description });
                    return { ...c, review };
                });
                const reviewedCandidates = await Promise.all(reviewPromises);

                const matchedCandidates = reviewedCandidates.filter(c => c.review.recommendation === 'Hire' || c.review.recommendation === 'Maybe').map(c => ({...c, status: 'Interview' as KanbanStatus, role: newRole.title }));
                currentCandidates = currentCandidates.map(c => matchedCandidates.find(mc => mc.id === c.id) || c);
                setCandidates(currentCandidates);
                log("Candidate Review Complete", `Matched ${matchedCandidates.length} candidates to '${newRole.title}' and moved to 'Interview'.`);
                
                // 4. Simulated Hiring & Learning Event
                setLoadingText("Phase 5/6: Simulating final hire...");
                const candidateToHire = currentCandidates.find(c => c.status === 'Interview');
                if (candidateToHire) {
                    candidateToHire.status = 'Hired';
                    candidateToHire.humanFinalDecision = 'Hired';
                    currentCandidates = currentCandidates.map(c => c.id === candidateToHire.id ? candidateToHire : c);
                    setCandidates(currentCandidates);
                    log("Hiring Decision", `Autonomously hired ${candidateToHire.name} for the role of ${candidateToHire.role}.`);
                    
                    // 5. Self-Correction Analysis
                    setLoadingText("Phase 6/6: Performing self-correction analysis...");
                    const rubricAnalysis = await analyzeHiringOverride({
                        candidateProfile: {
                            name: candidateToHire.name,
                            skills: candidateToHire.skills,
                            narrative: candidateToHire.narrative,
                            aiInitialScore: candidateToHire.aiInitialScore || 75,
                            aiInitialDecision: 'Maybe',
                            humanFinalDecision: 'Hired'
                        },
                        roleTitle: candidateToHire.role,
                        currentRubricWeights: "Standard tech rubric with high weight on React, Next.js"
                    });
                    log("Rubric Refinement", `AI suggests refining the rubric: "${rubricAnalysis.suggestedChange}" based on analysis: "${rubricAnalysis.analysis}"`);
                    
                    const newChange: RubricChange = {
                        id: Date.now(),
                        criteria: "AI Scoring Rubric",
                        change: rubricAnalysis.suggestedChange,
                        reason: rubricAnalysis.analysis,
                        status: 'Pending'
                    };
                    setSuggestedChanges(prev => [newChange, ...prev]);

                } else {
                    log("Hiring Decision", "No candidates made it to the interview stage. No hire was made.");
                }
            } else {
                log("Role Synthesis", "Not enough qualified candidates to synthesize a new role. Ending simulation.");
            }

            setLastSaarthiReport({
                simulationSummary: `The end-to-end simulation autonomously processed the pipeline. It screened candidates, created a new role based on the talent pool, matched candidates, hired one, and performed a self-correction analysis.`,
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
