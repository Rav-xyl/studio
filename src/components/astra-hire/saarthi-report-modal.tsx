
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { Brain, CheckCircle, X, XCircle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

interface SaarthiReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: any;
}

const statusIcon = (status: 'Success' | 'Failure' | 'Info') => {
    switch (status) {
        case 'Success': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'Failure': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return null;
    }
}

const UserManualContent = () => (
    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
        <h2 className="text-2xl font-bold text-foreground">TalentFlow AI - User Manual</h2>
        <p>Welcome to TalentFlow AI, your intelligent, autonomous recruitment partner. This guide will walk you through the core features of the platform.</p>
        
        <Separator className="my-4" />

        <h3 className="text-xl font-semibold text-foreground">1. The Main Interface: Your Command Center</h3>
        <p>The primary interface is organized into several tabs, each serving a specific purpose in the recruitment lifecycle.</p>

        <h4 className="text-lg font-semibold text-foreground">a. Client Roles Tab</h4>
        <p>This is where you manage the job positions you are hiring for.</p>
        <ul>
            <li><strong>Adding a New Role:</strong> Click the <strong>"Add New Role"</strong> button. You can paste an existing job description, and the AI will automatically format it professionally and suggest several appropriate job titles.</li>
            <li><strong>Finding Candidates for a Role:</strong> Each role card has powerful AI actions:
                <ul>
                    <li><strong>Find Top Matches (AI):</strong> This is the most intelligent feature. It scans all unassigned candidates and returns a curated list of the absolute best fits for that specific role, based on a deep analysis of their skills and experience. It's fast because it uses a smart cache.</li>
                    <li><strong>Find All Qualified:</strong> This shows you every unassigned candidate who meets the baseline qualification (a score of 70+) for the role.</li>
                    <li><strong>Re-engage Archives:</strong> The AI will scan your archived/rejected candidates to see if any are a good fit for this new role, allowing you to resurrect past talent.</li>
                    <li><strong>View Assigned Candidates:</strong> This filters the "Candidate Pool" to show you only the candidates currently assigned to this role.</li>
                </ul>
            </li>
        </ul>

        <h4 className="text-lg font-semibold text-foreground">b. Candidate Pool Tab</h4>
        <p>This is your visual pipeline, presented as a Kanban board.</p>
        <ul>
            <li><strong>Adding Candidates:</strong> Click <strong>"Add Candidates"</strong> to bulk upload resumes. The AI will screen them in the background, assign an initial score, and place them in the appropriate column.</li>
            <li><strong>Kanban Workflow:</strong>
                <ul>
                    <li><strong>Sourcing:</strong> New candidates who didn't meet the initial quality bar are placed here and archived. You can review and restore them if needed.</li>
                    <li><strong>Screening:</strong> Qualified candidates land here after AI screening. They are now "Unassigned" and ready to be matched with a role in the "Prospecting Hub".</li>
                    <li><strong>Interview:</strong> Candidates who have been assigned a role and are undergoing the AI Gauntlet or other interview processes are moved here.</li>
                    <li><strong>Hired:</strong> The final stage for successful candidates.</li>
                </ul>
            </li>
            <li><strong>Moving Candidates:</strong> Simply drag and drop a candidate's card from one column to the next to update their status.</li>
            <li><strong>Stimulate Pipeline:</strong> A powerful AI simulation that identifies a top candidate, creates a suitable role, runs them through a simulated interview, and hires them, demonstrating the platform's autonomous capabilities.</li>
        </ul>

        <h4 className="text-lg font-semibold text-foreground">c. Prospecting Hub</h4>
        <p>This is the most important tab for managing your unassigned talent.</p>
        <ul>
            <li><strong>Overview:</strong> This tab shows a table of <strong>all unassigned candidates</strong> who have passed the initial screening.</li>
            <li><strong>Finding Matches:</strong>
                <ul>
                    <li><strong>For a single candidate:</strong> Click the "Find Matches" button on any row. The AI will instantly score that candidate against all available client roles.</li>
                    <li><strong>For ALL candidates:</strong> Click the <strong>"Run AI Match for All"</strong> button at the top. This is a powerful one-click command that analyzes every unassigned candidate in the background, populating the entire table with the best role matches for each person.</li>
                </ul>
            </li>
            <li><strong>Assigning Roles:</strong> Once matches are found, you can assign a candidate to their best-fit role with a single click.</li>
        </ul>

        <h4 className="text-lg font-semibold text-foreground">d. Gauntlet Portal Tab</h4>
        <p>This tab is for managing candidates who have been shortlisted for the AI-proctored technical interview.</p>
        <ul>
            <li><strong>Who appears here?</strong> Any candidate with an initial AI score of 70 or higher who is not archived.</li>
            <li><strong>Action:</strong> Click <strong>"Copy Credentials"</strong> for a candidate. This copies their unique login URL, their Candidate ID, and the universal password (<code>TEST1234</code>) to your clipboard. Send these details to the candidate so they can begin their assessment.</li>
        </ul>

        <h4 className="text-lg font-semibold text-foreground">e. Analytics Tab</h4>
        <p>This dashboard provides insights into your recruitment pipeline, showing hiring velocity, role distribution, and predictive forecasts generated by the AI.</p>
    </div>
);


export function SaarthiReportModal({ isOpen, onClose, reportData }: SaarthiReportModalProps) {
    if (!reportData) return null;

    const isAudit = reportData.reportType === "System Audit";
    const isManual = reportData.reportType === "User Manual";
    const title = isManual ? "User Manual" : isAudit ? "SAARTHI's System Audit" : "SAARTHI's Simulation Overview";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-background text-foreground border-border shadow-lg">
                 <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                       <Brain className="w-8 h-8 text-primary"/> {title}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  {isManual ? (
                     <UserManualContent />
                  ) : (
                    <div className="space-y-6">
                        {reportData.simulationSummary && (
                            <div className="bg-secondary/50 p-6 rounded-lg">
                                <h4 className="text-xl font-semibold text-foreground mb-3">Summary</h4>
                                <p className="text-muted-foreground">{reportData.simulationSummary}</p>
                            </div>
                        )}

                        {reportData.detailedProcessLog && reportData.detailedProcessLog.length > 0 && (
                            <div className="bg-secondary/50 p-6 rounded-lg">
                                <h4 className="text-xl font-semibold text-foreground mb-3">Detailed Process Log</h4>
                                <ul className="space-y-3 text-muted-foreground">
                                    {reportData.detailedProcessLog.map((log: any, index: number) => (
                                    <li key={index} className="flex items-start gap-3">
                                        {isAudit && <span className="mt-1">{statusIcon(log.status)}</span>}
                                        <div>
                                           <span className="font-semibold text-foreground">{log.step}:</span> {log.description}
                                        </div>
                                    </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                  )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

    
