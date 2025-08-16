
'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Briefcase, Users, Loader2, Shield } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, getDocs, query, where, addDoc } from 'firebase/firestore';
import { GauntletPortalTab } from '../gauntlet/gauntlet-portal-tab';

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [isSaarthiReportOpen, setIsSaarthiReportOpen] = useState(false);
  const { toast } = useToast();

  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

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
    const candidateDocRef = doc(db, 'candidates', id);
    await updateDoc(candidateDocRef, candidateData);
  };

  const handleAddRole = async (newRole: Omit<JobRole, 'id' | 'openings'>) => {
    const fullNewRole: JobRole = {
        id: `role-${nanoid(10)}`,
        ...newRole,
        openings: 1,
    };
    await addDoc(collection(db, 'roles'), fullNewRole);
    toast({ title: 'Role Added', description: `Successfully added ${fullNewRole.title} to client roles.` });
  };


  const handleBulkUpload = async (files: FileList | null) => {
    if (!files) return;

    const newFilesMap = new Map<string, File>();
    const newCandidates: Candidate[] = [];
    let addedCount = 0;

    for (const file of files) {
      if (!candidates.some(c => c.name === file.name)) {
        newFilesMap.set(file.name, file);
        const newCandidate: Candidate = {
          id: `cand-${nanoid(10)}`,
          name: file.name,
          avatarUrl: '',
          role: 'Unassigned', // Start as unassigned
          skills: [],
          status: 'Sourcing', 
          narrative: `Resume file: ${file.name}`,
          inferredSkills: [],
          lastUpdated: new Date().toISOString(),
        };
        newCandidates.push(newCandidate);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      toast({ title: "Upload Successful", description: `${addedCount} new resumes added. Screening automatically...` });
      
      setIsLoading(true);
      setLoadingText(`Screening ${newCandidates.length} new resumes...`);

      const screeningPromises = newCandidates.map(async (candidate) => {
        const file = newFilesMap.get(candidate.name);
        if (!file) return null;
        try {
          const resumeDataUri = await convertFileToDataUri(file);
          const result = await automatedResumeScreening({ resumeDataUri });
          return {
            ...candidate,
            ...result.extractedInformation,
            status: 'Screening' as KanbanStatus, 
            aiInitialScore: result.candidateScore,
            lastUpdated: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Failed to process ${candidate.name}:`, error);
          return { ...candidate, status: 'Sourcing' as KanbanStatus, narrative: 'AI screening failed.' };
        }
      });
      
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
                const newRole: JobRole = { id: `role-${nanoid(10)}`, title: targetRoleTitle, description: jdResult.jobDescription, department: "Engineering", openings: 1 };
                await setDoc(doc(db, 'roles', newRole.id), newRole);
                
                log("Role Synthesis Complete", `Created and saved new role: '${newRole.title}'.`);
                
                const candidatesToReview = candidatesForSim.filter(c => c.status === 'Screening');
                const reviewPromises = candidatesToReview.map(async (c) => {
                    const review = await reviewCandidate({ candidateData: c.narrative, jobDescription: newRole.description });
                    if (review.recommendation === 'Hire' || review.recommendation === 'Maybe') {
                        return { ...c, status: 'Interview' as KanbanStatus, role: newRole.title };
                    }
                    return c;
                });

                const updatedCandidates = await Promise.all(reviewPromises);
                const batch = writeBatch(db);
                updatedCandidates.forEach(c => {
                    const { id, ...data } = c;
                    batch.update(doc(db, 'candidates', id), data);
                });
                await batch.commit();
                
                const matchedCount = updatedCandidates.filter(c => c.status === 'Interview').length;
                log("Candidate Review Complete", `Matched ${matchedCount} candidates to '${newRole.title}' and moved to 'Interview'.`);
            } else {
                 log("Role Synthesis", "Not enough qualified candidates to synthesize a new role. Ending simulation.");
                 throw new Error("Simulation ended early: No qualified candidates found.");
            }

            log("Simulation", "Further phases (Interview, BOSS review, Offer) are simulated for brevity.");
            const finalCandidateToHire = candidatesForSim.find(c => c.status === 'Interview');
            if (finalCandidateToHire) {
                await updateDoc(doc(db, 'candidates', finalCandidateToHire.id), { status: 'Hired' });
                log("Hiring Decision", `Autonomously hired ${finalCandidateToHire.name} for the role of ${finalCandidateToHire.role}.`);
            }

            setLastSaarthiReport({
                simulationSummary: `The end-to-end simulation autonomously processed the pipeline. It sourced/screened candidates, created a role, and moved the top candidate through to a hired state.`,
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
        return <RolesTab roles={roles} onViewCandidates={handleViewCandidatesForRole} onReEngage={handleReEngageForRole} />;
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
