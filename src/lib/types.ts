export type KanbanStatus = 'Uploaded' | 'Processing' | 'Screening' | 'Manual Review' | 'Interview' | 'Offer' | 'Hired' | 'Rejected' | 'Error';

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
  // Optional fields from AI processing
  [key: string]: any; 
  // For rubric refinement
  aiInitialDecision?: 'Hired' | 'Rejected' | 'Maybe';
  aiInitialScore?: number;
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
