
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import type { Candidate, JobRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Linkedin, Zap, Brain, Send, FileText, Loader2, FileSignature, Award, ShieldCheck, GitMerge, Archive, Link, Github, Goal, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { reviewCandidate } from '@/ai/flows/ai-assisted-candidate-review';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { skillGapAnalysis } from '@/ai/flows/skill-gap-analysis';
import { useToast } from '@/hooks/use-toast';
import { draftOfferLetter } from '@/ai/flows/autonomous-offer-drafting';
import { generateOnboardingPlan } from '@/ai/flows/automated-onboarding-plan';
import { cultureFitSynthesis } from '@/ai/flows/culture-fit-synthesis';
import { suggestRoleMatches } from '@/ai/flows/suggest-role-matches';
import { nanoid } from 'nanoid';


interface CandidateDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onUpdateCandidate: (updatedCandidate: Candidate) => void;
  onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>) => void;
}

const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('') : '';
}

const SocialLink = ({ url }: { url: string | undefined }) => {
    if (!url) return null;

    let icon = <Link className="h-5 w-5 text-muted-foreground hover:text-primary" />;
    if (url.includes('linkedin.com')) {
        icon = <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary" />;
    } else if (url.includes('github.com')) {
        icon = <Github className="h-5 w-5 text-muted-foreground hover:text-primary" />;
    }

    return (
        <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon">
                {icon}
            </Button>
        </a>
    )
}

export function CandidateDetailSheet({
  open,
  onOpenChange,
  candidate,
  onUpdateCandidate,
  onAddRole,
}: CandidateDetailSheetProps) {
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [generatedData, setGeneratedData] = useState<Record<string, any>>({});
  
  if (!candidate) return null;

  const handleGenerateClick = async (type: 'review' | 'email' | 'skillGap' | 'offer' | 'onboarding' | 'cultureFit' | 'roleMatches') => {
    if (!candidate) return;

    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
        let result;
        if (type === 'review') {
            result = await reviewCandidate({
                candidateData: candidate.narrative,
                jobDescription: candidate.role
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
      const updatedCandidate = { ...candidate, archived: !candidate.archived };
      onUpdateCandidate(updatedCandidate);
      toast({ title: `Candidate ${updatedCandidate.archived ? 'Archived' : 'Restored'}`, description: `${candidate.name} has been ${updatedCandidate.archived ? 'removed from' : 'restored to'} the active pipeline.`});
      onOpenChange(false);
  }

  const handleSendInterviewInvite = () => {
    if (!candidate) return;
    const interviewUrl = `${window.location.origin}/candidate/${candidate.id}`;
    navigator.clipboard.writeText(interviewUrl);
    toast({
        title: "Gauntlet Link Copied!",
        description: `The unique interview link for ${candidate.name} has been copied to your clipboard.`
    });
  }
  
  const handleAddSuggestedRole = (role: { roleTitle: string; rationale: string; }) => {
    onAddRole({
      title: role.roleTitle,
      description: role.rationale,
      department: 'AI Suggested',
    });
  };

  const review = generatedData.review;
  const email = generatedData.email;
  const skillGaps = generatedData.skillGap?.skillGaps || [];
  const offer = generatedData.offer;
  const onboardingPlan = generatedData.onboarding;
  const cultureFit = generatedData.cultureFit;
  const roleMatches = generatedData.roleMatches?.roles || [];
  const isUnassigned = candidate.role === 'Unassigned';

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
                    <SocialLink url={candidate.socialUrl} />
                </div>
              </div>
            </SheetHeader>
            <Separator className="my-4" />
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
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
                                    <div key={index} className="p-3 rounded-md border border-dashed border-border flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-primary">{match.roleTitle}</p>
                                            <p className="text-xs text-muted-foreground">{match.rationale}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleAddSuggestedRole(match)}><PlusCircle className="mr-2 h-4 w-4" />Add Role</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                           <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('roleMatches')} disabled={isGenerating.roleMatches}>
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
                    {isUnassigned ? (
                      <div className='text-sm text-muted-foreground text-center p-4 bg-secondary/50 rounded-md'>
                        Assign a specific role to this candidate on the Kanban board to enable a targeted review.
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><Goal className='h-5 w-5 text-primary' /> Skill & Culture Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div>
                        <p className='text-sm text-muted-foreground mb-2'>Analyze the gap between the candidate's skills and the ideal profile for the role.</p>
                        <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('skillGap')} disabled={isGenerating.skillGap}>
                           {isGenerating.skillGap ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                           Analyze Skill Gap
                        </Button>
                        {skillGaps.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {skillGaps.map((gap: any, index: number) => (
                                <div key={index} className="text-xs p-2 bg-secondary rounded-md">
                                    <p><strong>Gap:</strong> {gap.skill}</p>
                                    <p><strong>Suggestion:</strong> {gap.suggestion}</p>
                                </div>
                                ))}
                            </div>
                        )}
                     </div>
                     <div>
                        <p className='text-sm text-muted-foreground mb-2'>Generate a 'Cultural Alignment Profile' by analyzing their resume's narrative and inferred soft skills.</p>
                         <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('cultureFit')} disabled={isGenerating.cultureFit}>
                           {isGenerating.cultureFit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                           Synthesize Culture Fit
                        </Button>
                        {cultureFit && (
                           <div className="mt-3 text-xs p-2 bg-secondary rounded-md space-y-2">
                                <p><strong>Alignment Score:</strong> <Badge>{cultureFit.alignmentScore}/100</Badge></p>
                                <p><strong>Summary:</strong> {cultureFit.summary}</p>
                            </div>
                        )}
                     </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2 text-xl'><Brain className='h-5 w-5 text-primary' /> AI Interview Gauntlet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground mb-4'>Generate a unique, secure link to the multi-phase AI interview gauntlet for this candidate.</p>
                       <Button onClick={handleSendInterviewInvite} className="w-full">
                          <Link className="mr-2 h-4 w-4" />
                          Copy Secure Gauntlet Link
                        </Button>
                    </CardContent>
                  </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'><FileSignature className='h-5 w-5 text-primary' /> Offer & Onboarding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>Generate a competitive offer letter or a 30-60-90 day onboarding plan.</p>
                    <div className='flex gap-2'>
                      <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('offer')} disabled={isGenerating.offer || candidate.status !== 'Hired'}>
                        {isGenerating.offer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                        Draft Offer
                      </Button>
                      <Button className="w-full" onClick={() => handleGenerateClick('onboarding')} disabled={isGenerating.onboarding || candidate.status !== 'Hired'}>
                        <Award className="mr-2 h-4 w-4" />
                        Generate Onboarding Plan
                      </Button>
                    </div>
                     {candidate.status !== 'Hired' && <p className="text-xs text-center text-muted-foreground mt-2">Candidate must be in 'Hired' column to enable these actions.</p>}
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
          <Button variant={candidate.archived ? 'secondary' : 'destructive'} onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4"/> {candidate.archived ? 'Restore Candidate' : 'Archive Candidate'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
