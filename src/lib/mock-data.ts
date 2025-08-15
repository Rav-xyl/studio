import type { Candidate, JobRole, KanbanStatus } from './types';

export const KANBAN_COLUMNS: KanbanStatus[] = [
  'Uploaded',
  'Processing',
  'Screening',
  'Manual Review',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
  'Error'
];

export const mockCandidates: Candidate[] = [
];

export const mockJobRoles: JobRole[] = [
];
