
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import type { Candidate } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Linkedin, Zap, Brain, Video, Send, Star, FileText, Loader2, FileSignature, Award, ShieldCheck, GitMerge, Archive } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { reviewCandidate } from '@/ai/flows/ai-assisted-candidate-review';
import { generateInterviewQuestions } from '@/ai/flows/dynamic-interview-question-generation';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { skillGapAnalysis } from '@/ai/flows/skill-gap-analysis';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { draftOfferLetter } from '@/ai/flows/autonomous-offer-drafting';
import { generateOnboardingPlan } from '@/ai/flows/automated-onboarding-plan';
import { cultureFitSynthesis } from '@/ai/flows/culture-fit-synthesis';
import { suggestRoleMatches } from '@/ai/flows/suggest-role-matches';


interface CandidateDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onUpdateCandidate: (updatedCandidate: Candidate) => void;
}

const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('') : '';
}

export function CandidateDetailSheet({
  open,
  onOpenChange,
  candidate,
  onUpdateCandidate,
}: CandidateDetailSheetProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [generatedData, setGeneratedData] = useState<Record<string, any>>({});
  
  if (!candidate) return null;

  const handleGenerateClick = async (type: 'review' | 'questions' | 'email' | 'skillGap' | 'offer' | 'onboarding' | 'cultureFit' | 'roleMatches') => {
    if (!candidate) return;

    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
        let result;
        if (type === 'review') {
            result = await reviewCandidate({
                candidateData: candidate.narrative,
                jobDescription: candidate.role
            });
        } else if (type === 'questions') {
            result = await generateInterviewQuestions({
                resumeText: candidate.narrative,
                jobDescription: candidate.role,
                candidateAnalysis: 'A promising candidate with strong skills in their domain.'
            });
        } else if (type === 'email') {
            result = await aiDrivenCandidateEngagement({
                candidateName: candidate.name,
                candidateStage: candidate.status,
                jobTitle: candidate.role,
                companyName: 'AstraHire',
                recruiterName: 'The Hiring Team',
                candidateSkills: candidate.skills.join(', '),
            });
        } else if (type === 'skillGap') {
            result = await skillGapAnalysis({
                candidateSkills: candidate.skills,
                jobDescription: candidate.role, // In a real app, you'd use a more detailed JD
            });
        } else if (type === 'offer') {
             result = await draftOfferLetter({
                candidateName: candidate.name,
                roleTitle: candidate.role,
                candidateSkills: candidate.skills,
                candidateExperience: candidate.narrative,
                companyName: "AstraHire Client",
                companySalaryBands: "For a senior role, the band is typically between $120,000 and $150,000.",
                simulatedMarketData: "Market analysis indicates the average salary for this role with this experience is around $135,000."
            });
        } else if (type === 'onboarding') {
            result = await generateOnboardingPlan({
                candidateName: candidate.name,
                roleTitle: candidate.role,
                roleResponsibilities: "Lead frontend development efforts, mentor junior developers, and drive architectural decisions.",
                candidateStrengths: candidate.skills,
                companyCulture: "A fast-paced startup focused on innovation and collaboration."
            });
        } else if (type === 'cultureFit') {
            result = await cultureFitSynthesis({
                candidateNarrative: candidate.narrative,
                inferredSoftSkills: candidate.inferredSkills,
                companyValues: "Innovation, Collaboration, Customer-Centricity, Fast-Paced Growth",
            });
        } else if (type === 'roleMatches') {
            result = await suggestRoleMatches({
              candidateName: candidate.name,
              candidateSkills: candidate.skills.join(', '),
              candidateNarrative: candidate.narrative,
              candidateInferredSkills: candidate.inferredSkills.join(', '),
            });
        }
        setGeneratedData(prev => ({...prev, [type]: result }));
        toast({ title: `AI ${type} generated successfully!`})
    } catch (error) {
        console.error(`Failed to generate ${type}`, error);
        toast({ title: `Error generating ${type}`, description: "Please check the console for details.", variant: 'destructive'})
    } finally {
        setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleArchive = () => {
      if (!candidate) return;
      const updatedCandidate = { ...candidate, archived: true };
      onUpdateCandidate(updatedCandidate);
      toast({ title: 'Candidate Archived', description: `${candidate.name} has been removed from the active pipeline.`});
      onOpenChange(false);
  }

  const handleSendInterviewInvite = () => {
    if (!candidate) return;
    localStorage.setItem('interviewCandidate', JSON.stringify(candidate));
    toast({
        title: "Navigating to Interview Room...",
        description: `Preparing the AI video interview for ${candidate.name}.`
    });
    router.push(`/interview/${candidate.id}`);
  }

  const review = generatedData.review;
  const questions = generatedData.questions?.questions || [];
  const email = generatedData.email;
  const skillGaps = generatedData.skillGap?.skillGaps || [];
  const offer = generatedData.offer;
  const onboardingPlan = generatedData.onboarding;
  const cultureFit = generatedData.cultureFit;
  const roleMatches = generatedData.roleMatches?.roles || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] flex flex-col p-0 bg-background/95 backdrop-blur-sm border-l">
        <ScrollArea className='h-full'>
          <div className='p-6'>
            <SheetHeader className="flex flex-row items-start gap-4 space-y-0">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={candidate.avatarUrl} alt={candidate.name} data-ai-hint="person" />
                <AvatarFallback className='text-2xl'>{getInitials(candidate.name)}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-2xl font-bold">{candidate.name}</SheetTitle>
                <SheetDescription className="text-base text-muted-foreground">
                  {candidate.role}
                </SheetDescription>
                <div className='mt-2'>
                    <Button variant="ghost" size="icon">
                        <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Button>
                </div>
              </div>
            </SheetHeader>
            <Separator className="my-4" />
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="ai-analysis">AI Actions</TabsTrigger>
                <TabsTrigger value="comms">Communication</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><FileText className='h-5 w-5 text-primary'/> Candidate Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{candidate.narrative}</p>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                    </div>
                     <Separator className="my-4" />
                    <h4 className="font-semibold mb-2">Inferred Skills (by AI)</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.inferredSkills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-analysis" className="mt-4 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-xl'><GitMerge className='h-5 w-5 text-primary' /> Mode 1: Exploratory Screening</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-sm text-muted-foreground mb-4'>Use AI to discover potential roles this candidate is a strong fit for, regardless of current openings.</p>
                         {roleMatches.length > 0 ? (
                            <div className='space-y-3'>
                                {roleMatches.map((match: any, index: number) => (
                                    <div key={index} className="p-3 rounded-md border border-dashed border-border">
                                        <p className="font-semibold text-primary">{match.roleTitle}</p>
                                        <p className="text-xs text-muted-foreground">{match.rationale}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                           <Button variant="outline" className="w-full mt-4" onClick={() => handleGenerateClick('roleMatches')} disabled={isGenerating.roleMatches}>
                              {isGenerating.roleMatches ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                              Find Potential Roles
                            </Button>
                        )}
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><ShieldCheck className='h-5 w-5 text-primary' /> Mode 2: Targeted Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>Validate this candidate's fit for the specific role of **{candidate.role}**.</p>
                     {review ? (
                        <div className="space-y-2 text-sm">
                           <p><strong>Recommendation:</strong> <Badge variant={review.recommendation === 'Hire' ? 'default' : review.recommendation === 'Maybe' ? 'secondary' : 'destructive'} className={review.recommendation === 'Hire' ? 'bg-green-600/80' : ''}>{review.recommendation}</Badge></p>
                           <p className='text-muted-foreground'><strong>Justification:</strong> {review.justification}</p>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('review')} disabled={isGenerating.review}>
                          {isGenerating.review ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                          Review for this Role
                        </Button>
                    )}
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Star className='h-5 w-5 text-primary' /> Skill Gap Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {skillGaps.length > 0 ? (
                        <ul className='list-disc list-inside space-y-2 text-sm'>
                            {skillGaps.map((gap: any) => (
                                <li key={gap.skill}><span className='font-semibold'>{gap.skill}:</span> <span className='text-muted-foreground'>{gap.suggestion}</span></li>
                            ))}
                        </ul>
                    ) : (
                        <p className='text-sm text-muted-foreground mb-4'>Click the button to analyze skill gaps and get training suggestions.</p>
                    )}
                    <Button variant="outline" className="w-full mt-4" onClick={() => handleGenerateClick('skillGap')} disabled={isGenerating.skillGap}>
                       {isGenerating.skillGap ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Analyze Skill Gap
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comms" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2 text-xl'><Brain className='h-5 w-5 text-primary' /> AI Interview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground mb-4'>Generate AI-powered questions and invite the candidate to an automated AI video interview.</p>
                       {questions.length > 0 && (
                          <ol className='list-decimal list-inside space-y-2 text-sm bg-secondary p-4 rounded-md mb-4'>
                            {questions.map((q: string) => <li key={q}>"{q}"</li>)}
                          </ol>
                       )}
                      <div className='flex gap-2'>
                        <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('questions')} disabled={isGenerating.questions}>
                          {isGenerating.questions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                          Generate Questions
                        </Button>
                        <Button onClick={handleSendInterviewInvite} className="w-full" disabled={candidate.status !== 'Interview'}>
                          <Video className="mr-2 h-4 w-4" />
                          Start Interview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><FileSignature className='h-5 w-5 text-primary' /> Offer & Onboarding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>Generate a competitive offer letter or a 30-60-90 day onboarding plan.</p>
                    <div className='flex gap-2'>
                      <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('offer')} disabled={isGenerating.offer || candidate.status !== 'Interview'}>
                        {isGenerating.offer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                        Draft Offer
                      </Button>
                      <Button className="w-full" onClick={() => handleGenerateClick('onboarding')} disabled={isGenerating.onboarding || candidate.status !== 'Hired'}>
                        <Award className="mr-2 h-4 w-4" />
                        Generate Onboarding Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Send className='h-5 w-5 text-primary' /> Candidate Communication</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className='text-sm text-muted-foreground mb-4'>Let AI draft a personalized email based on the candidate's current stage.</p>
                     <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('email')} disabled={isGenerating.email}>
                      {isGenerating.email ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Draft Email
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 pt-0 bg-background/95 backdrop-blur-sm border-t">
          <Button variant="destructive" onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4"/> Archive Candidate
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
