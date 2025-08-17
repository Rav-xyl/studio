

export type KanbanStatus = 'Sourcing' | 'Screening' | 'Manual Review' | 'Interview' | 'Hired';

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

export interface JobRole {
  id: string;
  title: string;
  department: string;
  openings: number;
  description: string;
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

    