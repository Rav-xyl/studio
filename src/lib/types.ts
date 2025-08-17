

export type KanbanStatus = 'Sourcing' | 'Screening' | 'Interview' | 'Hired';

export interface LogEntry {
  timestamp: string;
  event: string;
  details: string;
  author: 'System' | 'AI' | 'Admin';
}

export interface FinalInterviewReviewOutput {
  finalRecommendation: string;
  overallAssessment: string;
  keyStrengths: string[];
  potentialConcerns: string[];
}

export type GauntletPhase = 
  | 'Locked' 
  | 'Technical' 
  | 'PendingTechReview' 
  | 'SystemDesign' 
  | 'PendingDesignReview'
  | 'Complete'
  | 'Failed';

export interface GauntletState {
    phase: GauntletPhase;
    technicalReport: string | null;
    techReview: FinalInterviewReviewOutput | null;
    systemDesignReport: string | null;
    designReview: FinalInterviewReviewOutput | null;
    finalReview?: FinalInterviewReviewOutput | null; // Added for completeness
}


export interface Candidate {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  skills: string[];
  status: KanbanStatus;
  narrative: string;
  inferredSkills: string[];
  lastUpdated: string;
  archived?: boolean;
  log?: LogEntry[];
  gauntletStartDate?: string;
  gauntletState?: GauntletState;
  communicationSent?: boolean;
  // Optional fields from AI processing
  [key: string]: any;
}

export interface RoleMatch {
  candidateId: string;
  candidateName: string;
  justification: string;
  confidenceScore: number;
}

export interface JobRole {
  id: string;
  title: string;
  department: string;
  openings: number;
  description: string;
  roleMatches?: RoleMatch[];
  lastMatched?: string; // ISO date string
}

export interface ProactiveSourcingNotification {
    id: string;
    candidateId: string;
    candidateName: string;
    roleId: string;
    roleTitle: string;
    justification: string;
    confidenceScore: number;
    status: 'pending' | 'actioned';
}


// For Analytics
export type HistoricalData = {
    hires: number[];
    timeToHire: number[];
    roles: Record<string, number>;
}

export type PredictiveAnalysis = {
    predictedHires: number[];
    predictedTimeToHire: number;
}

export type TalentHotspot = {
    location: string;
    talentCount: number;
    topSkills: string[];
}

export interface RubricChange {
  id: number;
  criteria: string;
  change: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export type FeedbackReply = {
    id: string;
    author: string;
    text: string;
    createdAt: any;
};

export type FeedbackNote = {
    id: string;
    author: string;
    note: string;
    type: 'Suggestion' | 'Bug' | 'Question' | 'General';
    status: 'Open' | 'In Progress' | 'Resolved';
    createdAt: any;
    replies?: FeedbackReply[];
};
