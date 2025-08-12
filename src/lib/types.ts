export type KanbanStatus = 'Uploaded' | 'Screening' | 'Manual Review' | 'Interview' | 'Offer' | 'Hired' | 'Rejected' | 'Processing' | 'Error';

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
}

export interface JobRole {
  id: string;
  title: string;
  department: string;
  openings: number;
  description?: string;
}
