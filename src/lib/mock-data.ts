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
  { id: 'role-1', title: 'Senior Frontend Developer', department: 'Engineering', openings: 2, description: "Looking for an experienced frontend developer to lead our web application development." },
  { id: 'role-2', title: 'Product Manager', department: 'Product', openings: 1, description: "Seeking a product manager to drive the vision and roadmap for our B2B SaaS product." },
  { id: 'role-3', title: 'Data Scientist', department: 'Data & Analytics', openings: 1, description: "Hiring a data scientist to build and deploy machine learning models." },
  { id: 'role-4', title: 'DevOps Engineer', department: 'Engineering', openings: 3, description: "We need a DevOps engineer to manage our cloud infrastructure and CI/CD pipelines." },
  { id: 'role-5', title: 'UX Designer', department: 'Design', openings: 1, description: "Creative UX designer needed to craft beautiful and intuitive user experiences." },
];
