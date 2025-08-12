
'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Briefcase, Users, Brain, Loader2, X } from 'lucide-react';
import { AstraHireHeader } from './astra-hire-header';
import { CandidatePoolTab } from '../kanban/candidate-pool-tab';
import { RolesTab } from '../roles/roles-tab';
import { AnalyticsTab } from '../analytics/analytics-tab';
import type { Candidate, JobRole, KanbanStatus } from '@/lib/types';
import { KANBAN_COLUMNS, mockJobRoles } from '@/lib/mock-data';
import { synthesizeJobDescription } from '@/ai/flows/automated-job-description-synthesis';
import { automatedResumeScreening } from '@/ai/flows/automated-resume-screening';
import { reviewCandidate } from '@/ai/flows/ai-assisted-candidate-review';
import { suggestRoleMatches } from '@/ai/flows/suggest-role-matches';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { generateInterviewQuestions } from '@/ai/flows/dynamic-interview-question-generation';
import { SaarthiReportModal } from './saarthi-report-modal';
import { useToast } from '@/hooks/use-toast';

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
  const [companyType, setCompanyType] = useState('startup');

  // --- State Management ---
  const [roles, setRoles] = useState<JobRole[]>(mockJobRoles);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [simulationLog, setSimulationLog] = useState<any[]>([]);
  const [lastSaarthiReport, setLastSaarthiReport] = useState<any>(null);
  const [filteredRole, setFilteredRole] = useState<JobRole | null>(null);


  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [isSaarthiReportOpen, setIsSaarthiReportOpen] = useState(false);
  const { toast } = useToast();

  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

  // --- Core Logic ---

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
          status: result.candidateScore >= 70 ? 'Manual Review' : 'Rejected',
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

                return { ...candidate, status: newStatus, narrative: `${candidate.narrative}\n\nAI Review: ${result.justification}` };

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

        // Create a batch job to suggest roles for all eligible candidates
        const suggestionPromises = candidatesToAnalyze.map(c => suggestRoleMatches({
            candidateName: c.name,
            candidateSkills: c.skills.join(', '),
            candidateNarrative: c.narrative,
            candidateInferredSkills: c.inferredSkills.join(', ')
        }));

        try {
            const results = await Promise.all(suggestionPromises);
            const allRoles = results.flatMap(r => r.roles);

            // Aggregate and count role suggestions
            const roleCounts = allRoles.reduce((acc, role) => {
                acc[role.roleTitle] = (acc[role.roleTitle] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // Filter for roles suggested more than once or for a significant candidate
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
        const updatedCandidates = [...candidates];
        const updatedRoles = [...roles];

        for (const candidate of candidatesToMatch) {
            for (const role of updatedRoles) {
                const candidateSkills = new Set(candidate.skills.map(s => s.toLowerCase()));
                const roleSkills = new Set((role.description?.match(/\b(\w+)\b/g) || []).map(s => s.toLowerCase())); // Simple skill extraction
                
                const intersection = new Set([...candidateSkills].filter(skill => roleSkills.has(skill)));
                const score = (intersection.size / roleSkills.size) * 100;

                if (score > 50) { // Threshold for a potential match
                    const candidateIndex = updatedCandidates.findIndex(c => c.id === candidate.id);
                    if (candidateIndex !== -1) {
                        updatedCandidates[candidateIndex] = { ...updatedCandidates[candidateIndex], status: 'Interview', role: role.title };
                        matchedCount++;
                    }
                    break; 
                }
            }
        }

        setCandidates(updatedCandidates);
        setRoles(updatedRoles);
        setIsLoading(false);
        toast({ title: "Matching Complete", description: `${matchedCount} candidates were matched to potential roles and moved to the 'Interview' stage.` });
    };

    const handleViewCandidatesForRole = (role: JobRole) => {
        setFilteredRole(role);
        setActiveTab('pool');
    };
  
  const handleStimulateFullPipeline = async () => {
    setIsLoading(true);
    setSimulationLog([]);

    setLoadingText("Phase 1: Screening all new resumes...");
    await handleScreenResumes();
    await new Promise(r => setTimeout(r, 1000));

    setLoadingText("Phase 2: Arya is performing deep reviews...");
    await handleAryaReviewAll();
    await new Promise(r => setTimeout(r, 1000));
    
    setLoadingText("Generating SAARTHI Report...");
    setLastSaarthiReport({
        simulationSummary: "The simulation processed all uploaded candidates, performed automated screening, and conducted AI-assisted deep reviews. Candidates were sorted into appropriate pipeline stages based on score and AI recommendation. This iterative process refines the talent pool for optimal role matching.",
        detailedProcessLog: simulationLog,
        candidateOutcomesAnalysis: candidates.map(c => ({ candidateName: c.name, outcomeDetails: `Final status: ${c.status}. ${c.narrative}` })),
        roleManagementInsights: ["The system effectively filtered candidates, preparing a qualified pool for role-specific matching.", "Next step would be to create specific roles and run 'Suggest Role Matches' to build the interview pipelines."],
        systemLearningAndFutureImprovements: "Each screening and review cycle provides data to refine scoring rubrics and improve future AI accuracy. The system learns which resume patterns correlate with successful progression, enhancing its predictive capabilities."
    });
    setIsSaarthiReportOpen(true);
    setIsLoading(false);
  };
  
  const renderActiveTabView = () => {
    switch (activeTab) {
      case 'roles':
        return <RolesTab roles={roles} setRoles={setRoles} onViewCandidates={handleViewCandidatesForRole} />;
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
                filteredRole={filteredRole}
                onClearFilter={() => setFilteredRole(null)}
            />
        );
      case 'analytics':
        return <AnalyticsTab />;
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
