
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
          status: 'Sourcing', // New simplified status
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
      
      // Autonomous screening
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
            status: 'Screening' as KanbanStatus, // Move to Screening after processing
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
        const log = (step: string, description: string) => {
            currentSimulationLog.push({ step, description });
        };

        try {
            log("Start Simulation", "Beginning autonomous pipeline simulation.");

            setLoadingText("Phase 1/3: Analyzing Sourcing Pool...");
            let currentCandidates = [...candidates];
            let candidatesToProcess = currentCandidates.filter(c => c.status === 'Sourcing');

            if (candidatesToProcess.length > 0) {
                log("Screening", `Found ${candidatesToProcess.length} candidates in Sourcing to be screened.`);
                // This logic is now part of handleBulkUpload but we simulate it here too
                const screenedCandidates = candidatesToProcess.map(c => ({...c, status: "Screening" as KanbanStatus, aiInitialScore: (Math.random() * 40 + 60)}));
                currentCandidates = currentCandidates.map(c => screenedCandidates.find(s => s.id === c.id) || c);
                setCandidates(currentCandidates);
                log("Screening Complete", `All Sourcing candidates moved to Screening.`);
            } else {
                log("Screening", "No candidates in Sourcing. Skipped.");
            }

            setLoadingText("Phase 2/3: Autonomous Role Creation & Matching...");
            let candidatesToMatch = currentCandidates.filter(c => c.status === 'Screening');
            if (roles.length > 0 && candidatesToMatch.length > 0) {
                const targetRole = roles[0]; // Match to the first available role
                const matchedCandidates = candidatesToMatch.map(c => ({...c, status: "Interview" as KanbanStatus, role: targetRole.title }));
                currentCandidates = currentCandidates.map(c => matchedCandidates.find(m => m.id === c.id) || c);
                setCandidates(currentCandidates);
                log("Role Matching", `Matched ${matchedCandidates.length} candidates to role: '${targetRole.title}'.`);
            } else {
                log("Role Matching", "No roles or no candidates in Screening to match. Skipped.");
            }

            setLoadingText("Phase 3/3: Simulating Final Hires...");
            let candidatesToHire = currentCandidates.filter(c => c.status === 'Interview');
             if (candidatesToHire.length > 0) {
                const hiredCandidates = candidatesToHire.slice(0, 1).map(c => ({...c, status: "Hired" as KanbanStatus})); // Hire the first one
                currentCandidates = currentCandidates.map(c => hiredCandidates.find(h => h.id === c.id) || c);
                setCandidates(currentCandidates);
                log("Hiring", `Simulated hiring of ${hiredCandidates.length} candidate(s).`);
            } else {
                 log("Hiring", "No candidates in Interview to hire. Skipped.");
            }
            
            setLastSaarthiReport({
                simulationSummary: `The end-to-end simulation autonomously processed the pipeline. It moved candidates from Sourcing to Screening, matched them to existing roles, and simulated final hires.`,
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
  
  const renderActiveTabView = () => {
    switch (activeTab) {
      case 'roles':
        return <RolesTab roles={roles} setRoles={setRoles} onViewCandidates={handleViewCandidatesForRole} />;
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
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen">
       {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-foreground" />
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
        <div id="tab-content">{renderActiveTabView()}</div>
      </main>
    </div>
  );
}
