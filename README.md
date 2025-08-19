# TalentFlow AI

### Project Overview: TalentFlow AI

**Primary Technical Domain:** **Applied Natural Language Processing (NLP) & Intelligent Agent Systems.**

This project does not fall under Computer Vision, as it does not involve image or video analysis. Instead, its core focus is on processing, understanding, and generating human language to automate complex tasks.

**Explanation for Capstone Presentation:**

*   **Natural Language Processing (NLP):** This is the central discipline. The system uses advanced NLP techniques to perform tasks that traditionally require human linguistic understanding. This includes:
    *   **Information Extraction:** Parsing resumes to pull out structured data like skills, names, and experience.
    *   **Text Summarization:** Creating concise narrative summaries of candidate profiles.
    *   **Text Generation:** Autonomously writing job descriptions, interview questions, and professional emails.
    *   **Semantic Analysis & Classification:** Evaluating the quality of a candidate's written answers and making pass/fail recommendations.

*   **Intelligent Agent Systems:** The project goes beyond simple NLP tasks by building autonomous "agents." These are specialized AI components (like the "Proctor AI" or the "BOSS AI Reviewer") that are given specific goals, tools, and the authority to make decisions within the system, such as failing a candidate for cheating or recommending a hire.

*   **Machine Learning (ML) Application:** While we are not training a new model from scratch, this project is a quintessential example of **Applied Machine Learning**. We are using a powerful, pre-trained Large Language Model (Google's Gemini) and fine-tuning its behavior with carefully crafted prompts and logic (a technique called "prompt engineering") to solve a specific, real-world business problem. This is a very modern and practical application of ML principles.

**In summary, this is a capstone project in Applied NLP and AI, demonstrating how to build an autonomous, multi-agent system using state-of-the-art Large Language Models to solve a complex automation challenge.**

---

### Key Features & Technologies:

1.  **Autonomous Resume Screening:** The system ingests resumes in bulk (`.pdf`, `.docx`) and uses a Genkit AI flow (`automated-resume-screening`) to parse them, extract key information (skills, experience), and assign an initial qualification score. This immediately filters the talent pool.
2.  **AI-Powered Job Description Synthesis:** Recruiters can paste raw job descriptions, and an AI flow (`automated-job-description-synthesis`) will automatically rewrite them into a professional, standardized format and suggest appropriate job titles.
3.  **Intelligent Candidate Matching:** The platform can analyze the entire pool of qualified, unassigned candidates and intelligently match them to the most suitable open roles, providing a confidence score and justification for each match.
4.  **The "AI Gauntlet" - An Autonomous Interview Process:** This is the core intelligent feature.
    *   **Dynamic Question Generation:** The system uses AI to generate unique, role-specific technical questions for each candidate, ensuring a relevant and challenging assessment.
    *   **AI Proctoring & Evaluation:** During the technical exam, the system monitors candidate behavior (tab switching, ambient audio) and uses a powerful AI flow (`proctor-technical-exam`) to evaluate the quality of their answer and their integrity, delivering a pass/fail verdict.
    *   **Multi-Stage Assessment:** The interview is a two-phase process (Technical Exam & System Design Challenge), creating a comprehensive evaluation funnel.
    *   **The "BOSS" AI Supervisor:** A final-level AI (`final-interview-review`) validates the results of each interview stage, adding a layer of intelligent oversight and making the final hiring recommendation.
5.  **Admin Command Center:** A secure admin portal provides complete oversight of the system, including a real-time monitor for all candidates in the AI Gauntlet and the authority to permanently manage the master candidate database.
6.  **Automated Candidate Communication:** The system can autonomously draft and send personalized emails for various stages of the hiring process, from interview reminders to final offer and rejection letters, powered by the `ai-driven-candidate-engagement` flow.

### Firestore Setup

This project uses Firestore to store data. To allow the application to read from and write to the database, you must deploy the security rules.

**Run the following command in your terminal:**

```bash
firebase deploy --only firestore:rules
```

This will apply the permissive rules defined in `firestore.rules`, which are necessary for the application to function correctly in this development environment.
