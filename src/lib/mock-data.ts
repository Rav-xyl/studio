
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
  {
    "id": "cand-1",
    "name": "Priya Sharma",
    "avatarUrl": "https://i.pravatar.cc/150?u=priya",
    "role": "Senior Frontend Developer",
    "skills": ["React", "TypeScript", "Next.js", "GraphQL", "CI/CD"],
    "status": "Interview",
    "narrative": "Accomplished Senior Frontend Developer with 8+ years of experience building scalable and performant web applications for high-traffic platforms. Expert in modern JavaScript frameworks and passionate about creating exceptional user experiences.",
    "inferredSkills": ["Leadership", "Mentoring", "System Design"],
    "lastUpdated": "2 days ago",
    "aiInitialScore": 92
  },
  {
    "id": "cand-2",
    "name": "Rohan Gupta",
    "avatarUrl": "https://i.pravatar.cc/150?u=rohan",
    "role": "Product Manager",
    "skills": ["Roadmap Planning", "Agile", "User Research", "JIRA", "SQL"],
    "status": "Offer",
    "narrative": "Data-driven Product Manager with a track record of launching successful B2B SaaS products. Skilled in translating complex user needs into actionable product roadmaps and leading cross-functional teams to deliver results.",
    "inferredSkills": ["Stakeholder Management", "Data Analysis", "Communication"],
    "lastUpdated": "1 day ago",
    "aiInitialScore": 88
  },
  {
    "id": "cand-3",
    "name": "Anjali Mehta",
    "avatarUrl": "https://i.pravatar.cc/150?u=anjali",
    "role": "UX/UI Designer",
    "skills": ["Figma", "Prototyping", "Wireframing", "Design Systems"],
    "status": "Hired",
    "narrative": "Creative and detail-oriented UX/UI Designer with a passion for crafting intuitive and beautiful digital experiences. Proficient in all stages of the design process, from user research to high-fidelity prototypes.",
    "inferredSkills": ["Empathy", "Visual Communication", "Problem-Solving"],
    "lastUpdated": "5 days ago",
    "aiInitialScore": 95
  },
  {
    "id": "cand-4",
    "name": "Vikram Singh",
    "avatarUrl": "https://i.pravatar.cc/150?u=vikram",
    "role": "Backend Developer",
    "skills": ["Node.js", "Python", "PostgreSQL", "AWS", "Docker"],
    "status": "Screening",
    "narrative": "Backend Developer with 4 years of experience designing and building robust APIs and microservices. Strong understanding of cloud infrastructure and database management. Eager to tackle new challenges in a fast-paced environment.",
    "inferredSkills": ["Scalability", "API Design", "Problem-Solving"],
    "lastUpdated": "1 week ago",
    "aiInitialScore": 81
  },
  {
    "id": "cand-5",
    "name": "Sanya Kapoor",
    "avatarUrl": "https://i.pravatar.cc/150?u=sanya",
    "role": "Data Scientist",
    "skills": ["Python", "TensorFlow", "scikit-learn", "Pandas", "SQL"],
    "status": "Manual Review",
    "narrative": "Recent Masters graduate in Data Science with hands-on project experience in machine learning and predictive modeling. Seeking an opportunity to apply analytical skills to solve real-world problems.",
    "inferredSkills": ["Statistical Analysis", "Machine Learning", "Data Visualization"],
    "lastUpdated": "3 days ago",
    "aiInitialScore": 68,
    "aiInitialDecision": "Rejected"
  },
  {
    "id": "cand-6",
    "name": "Arjun Reddy",
    "avatarUrl": "https://i.pravatar.cc/150?u=arjun",
    "role": "DevOps Engineer",
    "skills": ["Kubernetes", "Terraform", "Jenkins", "AWS", "Ansible"],
    "status": "Rejected",
    "narrative": "Experienced DevOps engineer focused on automating infrastructure and streamlining deployment pipelines. My resume was not a good fit for the previous role.",
    "inferredSkills": ["Infrastructure as Code", "CI/CD", "Automation"],
    "lastUpdated": "2 weeks ago",
    "aiInitialScore": 45
  }
];

export const mockJobRoles: JobRole[] = [
    {
        "id": "role-1",
        "title": "Senior Frontend Developer",
        "department": "Engineering",
        "openings": 2,
        "description": "Seeking an experienced Senior Frontend Developer to lead the development of our next-generation user interfaces using React and Next.js. Must have a strong command of TypeScript and a passion for performance."
    },
    {
        "id": "role-2",
        "title": "Product Manager",
        "department": "Product",
        "openings": 1,
        "description": "We are looking for a strategic Product Manager to own the roadmap for our core platform. The ideal candidate will be adept at user research, data analysis, and working with agile development teams."
    },
    {
        "id": "role-3",
        "title": "Backend Developer",
        "department": "Engineering",
        "openings": 3,
        "description": "Join our backend team to build and scale the APIs that power our application. Experience with Node.js, PostgreSQL, and AWS is highly desirable. We value clean code and robust architecture."
    }
];
