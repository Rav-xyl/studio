export type KanbanStatus = 'Uploaded' | 'Screening' | 'Manual Review' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

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
}

export interface JobRole {
  id: string;
  title: string;
  department: string;
  openings: number;
}
