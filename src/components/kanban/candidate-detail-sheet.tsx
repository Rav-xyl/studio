
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
import { Lightbulb, Linkedin, Zap, Brain, Video, Send, Scan, Star, FileText, Loader2, FileSignature, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { suggestRoleMatches } from '@/ai/flows/suggest-role-matches';
import { reviewCandidate } from '@/ai/flows/ai-assisted-candidate-review';
import { generateInterviewQuestions } from '@/ai/flows/dynamic-interview-question-generation';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { skillGapAnalysis } from '@/ai/flows/skill-gap-analysis';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { draftOfferLetter } from '@/ai/flows/autonomous-offer-drafting';
import { generateOnboardingPlan } from '@/ai/flows/automated-onboarding-plan';

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
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [generatedData, setGeneratedData] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const router = useRouter();

  if (!candidate) return null;

  const handleGenerateClick = async (type: 'suggestions' | 'review' | 'questions' | 'email' | 'skillGap' | 'offer' | 'onboarding') => {
    if (!candidate) return;
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
        let result;
        if (type === 'suggestions') {
            result = await suggestRoleMatches({
                candidateName: candidate.name,
                candidateSkills: candidate.skills.join(', '),
                candidateNarrative: candidate.narrative,
                candidateInferredSkills: candidate.inferredSkills.join(', '),
            });
        } else if (type === 'review') {
            result = await reviewCandidate({
                candidateData: candidate.narrative,
                jobDescription: candidate.role
            });
        } else if (type === 'questions') {
            result = await generateInterviewQuestions({
                resumeText: candidate.narrative,
                jobDescription: candidate.role,
                candidateAnalysis: 'An promising candidate with strong skills in their domain.'
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

  const handleMoveToNextStage = () => {
    if (!candidate) return;

    let nextStatus: any = candidate.status;
    switch(candidate.status) {
        case 'Uploaded': nextStatus = 'Screening'; break;
        case 'Screening': nextStatus = 'Manual Review'; break;
        case 'Manual Review': nextStatus = 'Interview'; break;
        case 'Interview': nextStatus = 'Offer'; break;
        case 'Offer': nextStatus = 'Hired'; break;
    }

    if (nextStatus !== candidate.status) {
        const updatedCandidate = { ...candidate, status: nextStatus };
        onUpdateCandidate(updatedCandidate);
        toast({ title: 'Candidate Updated', description: `${candidate.name} moved to ${nextStatus}`});
        onOpenChange(false);
    } else {
        toast({ title: 'No action taken', description: `Candidate is already in the final stage or cannot be moved.`});
    }
  }

  const handleSendInterviewInvite = () => {
    if (!candidate) return;
    toast({
        title: "Interview Invite Sent!",
        description: `An invitation for the AI video interview has been sent to ${candidate.name}.`
    });
    router.push(`/interview/${candidate.id}`);
  }


  const suggestions = generatedData.suggestions?.roles || [];
  const review = generatedData.review;
  const questions = generatedData.questions?.questions || [];
  const email = generatedData.email;
  const skillGaps = generatedData.skillGap?.skillGaps || [];
  const offer = generatedData.offer;
  const onboardingPlan = generatedData.onboarding;


  const renderOnboardingPlan = () => {
    if (!onboardingPlan) return null;
    return (
        <div className='space-y-4'>
            <div>
                <h5 className="font-semibold text-primary">Performance Forecast</h5>
                <p className='text-sm text-muted-foreground'>{onboardingPlan.performanceForecast}</p>
            </div>
            <div>
                <h5 className="font-semibold">First 30 Days</h5>
                <ul className='list-disc list-inside text-sm text-muted-foreground'>
                    {onboardingPlan.onboardingPlan.days30.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
            </div>
             <div>
                <h5 className="font-semibold">Days 31-60</h5>
                <ul className='list-disc list-inside text-sm text-muted-foreground'>
                    {onboardingPlan.onboardingPlan.days60.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
            </div>
             <div>
                <h5 className="font-semibold">Days 61-90</h5>
                <ul className='list-disc list-inside text-sm text-muted-foreground'>
                    {onboardingPlan.onboardingPlan.days90.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] flex flex-col p-0 glass-card border-l border-slate-700/80">
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
              <TabsList className="grid w-full grid-cols-5 bg-secondary/50">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="review">AI Review</TabsTrigger>
                <TabsTrigger value="interview">Interview</TabsTrigger>
                <TabsTrigger value="engage">Engage</TabsTrigger>
                <TabsTrigger value="post-hire">Post-Hire</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-4">
                <Card className='glass-card'>
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
                <Card className='glass-card mt-4'>
                  <CardHeader>
                     <CardTitle className='flex items-center gap-2 text-xl'><Lightbulb className='h-5 w-5 text-primary'/> AI Role Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {suggestions.length > 0 ? (
                        suggestions.map((s: any) => (
                          <div key={s.roleTitle}>
                            <h5 className="font-semibold">{s.roleTitle}</h5>
                            <p className="text-sm text-muted-foreground">Rationale: {s.rationale}</p>
                          </div>
                        ))
                     ) : (
                       <p className='text-sm text-muted-foreground'>Click the button below to generate AI role suggestions.</p>
                     )}
                     
                     <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('suggestions')} disabled={isGenerating.suggestions}>
                      {isGenerating.suggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Generate New Suggestions
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="mt-4">
                <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Scan className='h-5 w-5 text-primary' /> AI-Assisted Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-2'>For candidates requiring manual review, AI provides the following analysis.</p>
                     {review ? (
                        <div className="rounded-md border border-dashed border-accent p-4 text-center">
                          <p className="font-semibold text-accent mb-1">Recommendation: {review.recommendation}</p>
                          <p className="text-sm text-muted-foreground">Justification: {review.justification}</p>
                        </div>
                     ) : (
                        <p className='text-sm text-muted-foreground text-center p-4'>Click the button to generate a review.</p>
                     )}
                    <Button variant="outline" className="w-full mt-4" onClick={() => handleGenerateClick('review')} disabled={isGenerating.review}>
                       {isGenerating.review ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Run Full Review
                    </Button>
                  </CardContent>
                </Card>
                <Card className='glass-card mt-4'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Star className='h-5 w-5 text-primary' /> Skill Gap & Training</CardTitle>
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

              <TabsContent value="interview" className="mt-4">
                <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Brain className='h-5 w-5 text-primary' /> Dynamic Interview Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {questions.length > 0 ? (
                        <ol className='list-decimal list-inside space-y-2 text-sm bg-secondary/50 p-4 rounded-md'>
                          {questions.map((q: string) => <li key={q}>"{q}"</li>)}
                        </ol>
                     ) : (
                       <p className='text-sm text-muted-foreground mb-4'>Click the button to generate AI-powered questions tailored to this candidate and role.</p>
                     )}
                    <Button variant="outline" className="w-full mt-4" onClick={() => handleGenerateClick('questions')} disabled={isGenerating.questions}>
                      {isGenerating.questions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Generate New Questions
                    </Button>
                  </CardContent>
                </Card>
                <Card className='glass-card mt-4'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Video className='h-5 w-5 text-primary' /> AI Video Interview</CardTitle>
                  </CardHeader>
                  <CardContent className='text-center'>
                    <p className='text-sm text-muted-foreground mb-4'>Invite the candidate to an automated AI-powered video interview.</p>
                    <Button onClick={handleSendInterviewInvite}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Interview Invite
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engage" className="mt-4">
                 <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Send className='h-5 w-5 text-primary' /> AI-Driven Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>Let AI draft a personalized email based on the candidate's current stage.</p>
                    <Textarea
                        readOnly
                        className="h-48 font-mono bg-secondary/50 text-sm"
                        value={email ? `Subject: ${email.emailSubject}\n\n${email.emailBody}` : "Click button to generate email..."}
                    />
                    <Button variant="outline" className="w-full mt-4" onClick={() => handleGenerateClick('email')} disabled={isGenerating.email}>
                      {isGenerating.email ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Generate New Draft
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="post-hire" className="mt-4">
                 <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><FileSignature className='h-5 w-5 text-primary' /> Autonomous Offer Drafting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {offer ? (
                        <div>
                            <p className='font-semibold'>Suggested Salary: <span className='text-primary'>{offer.suggestedSalary}</span></p>
                            <p className='font-semibold mt-2'>Benefits:</p>
                            <ul className='list-disc list-inside text-sm text-muted-foreground'>
                                {offer.benefitsPackage.map((b: string) => <li key={b}>{b}</li>)}
                            </ul>
                            <Textarea readOnly className='h-48 mt-4 font-mono bg-secondary/50' value={offer.offerLetterBody} />
                        </div>
                    ) : (
                         <p className='text-sm text-muted-foreground mb-4'>Let AI analyze market data and draft a competitive offer. (Only available for candidates in 'Offer' stage)</p>
                    )}
                    <Button variant="outline" className="w-full mt-4" onClick={() => handleGenerateClick('offer')} disabled={isGenerating.offer || candidate.status !== 'Offer'}>
                      {isGenerating.offer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Draft Offer Letter
                    </Button>
                  </CardContent>
                </Card>
                 <Card className='glass-card mt-4'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Award className='h-5 w-5 text-primary' /> Onboarding & Success Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {onboardingPlan ? renderOnboardingPlan() : (
                         <p className='text-sm text-muted-foreground mb-4'>Generate a personalized 30-60-90 day plan and success forecast. (Only available for 'Hired' candidates)</p>
                    )}
                    <Button variant="outline" className="w-full mt-4" onClick={() => handleGenerateClick('onboarding')} disabled={isGenerating.onboarding || candidate.status !== 'Hired'}>
                      {isGenerating.onboarding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Generate Onboarding Plan
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 pt-0 bg-background/95 backdrop-blur-sm border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleMoveToNextStage}>Move to Next Stage</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
