
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
import { Linkedin, Zap, Brain, Send, FileText, Loader2, FileSignature, Award, ShieldCheck, GitMerge, Archive, Link, Github, Goal, PlusCircle, Trash2, Search, File } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { reviewCandidate } from '@/ai/flows/ai-assisted-candidate-review';
import { aiDrivenCandidateEngagement } from '@/ai/flows/ai-driven-candidate-engagement';
import { skillGapAnalysis } from '@/ai/flows/skill-gap-analysis';
import { useToast } from '@/hooks/use-toast';
import { draftOfferLetter } from '@/ai/flows/autonomous-offer-drafting';
import { generateOnboardingPlan } from '@/ai/flows/automated-onboarding-plan';
import { cultureFitSynthesis } from '@/ai/flows/culture-fit-synthesis';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { bulkMatchCandidatesToRoles } from '@/ai/flows/bulk-match-candidates';

interface CandidateDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  roles: JobRole[];
  onUpdateCandidate: (updatedCandidate: Candidate) => void;
  onAddRole: (newRole: Omit<JobRole, 'id' | 'openings'>, candidateToUpdate: Candidate) => void;
  onDeleteCandidate: (candidateId: string) => void;
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
  roles,
  onUpdateCandidate,
  onAddRole,
  onDeleteCandidate
}: CandidateDetailSheetProps) {
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [generatedData, setGeneratedData] = useState<Record<string, any>>({});
  
  if (!candidate) return null;

  const handleGenerateClick = async (type: 'review' | 'email' | 'skillGap' | 'offer' | 'onboarding' | 'cultureFit' | 'potentialRoles') => {
    if (!candidate) return;

    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
        let result;
        if (type === 'review') {
            result = await reviewCandidate({
                candidateData: candidate.narrative,
                jobDescription: candidate.role,
                companyType: 'startup', // This could be made dynamic
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
        } else if (type === 'potentialRoles') {
             const { results } = await bulkMatchCandidatesToRoles({
                candidates: [{ id: candidate.id, skills: candidate.skills, narrative: candidate.narrative }],
                jobRoles: roles,
            });
            result = { matches: results[0]?.matches || [] };
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
  
  const handleDelete = () => {
      if (!candidate) return;
      onDeleteCandidate(candidate.id);
      onOpenChange(false);
  }

  const handleSendInterviewInvite = () => {
    if (!candidate) return;

    // Start the Gauntlet: Set start date
    onUpdateCandidate({ ...candidate, gauntletStartDate: new Date().toISOString() });

    const interviewUrl = `${window.location.origin}/gauntlet/login`;
    navigator.clipboard.writeText(`URL: ${interviewUrl}\nID: ${candidate.id}\nPassword: TEST1234`);
    toast({
        title: "Gauntlet Credentials Copied!",
        description: `Login details for ${candidate.name} have been copied.`
    });
  }
  
  const handleAssignRole = (roleTitle: string) => {
    if(!candidate) return;
    onUpdateCandidate({...candidate, role: roleTitle, status: 'Interview'});
    toast({title: "Role Assigned", description: `${candidate.name} has been assigned to ${roleTitle} and moved to Interview.`});
  }

  const handleViewCv = () => {
    if (candidate?.resumeDataUri) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<iframe src="${candidate.resumeDataUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        newWindow.document.title = `${candidate.name} - CV`;
      } else {
        toast({ title: "Popup Blocked", description: "Please allow popups for this site to view the CV.", variant: "destructive"});
      }
    }
  };

  const review = generatedData.review;
  const email = generatedData.email;
  const skillGaps = generatedData.skillGap?.skillGaps || [];
  const offer = generatedData.offer;
  const onboardingPlan = generatedData.onboarding;
  const cultureFit = generatedData.cultureFit;
  const potentialRoles = generatedData.potentialRoles?.matches || [];
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
                <div className='mt-2 flex items-center gap-2'>
                    {candidate.email && <Badge variant="outline">{candidate.email}</Badge>}
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
                    <CardTitle className='flex items-center justify-between text-xl'>
                        <div className="flex items-center gap-2">
                            <FileText className='h-5 w-5 text-primary'/> Candidate Profile
                        </div>
                        {candidate.resumeDataUri && (
                            <Button variant="link" className="h-auto p-0" onClick={handleViewCv}>
                                <File className="mr-2 h-4 w-4" /> View Original CV
                            </Button>
                        )}
                    </CardTitle>
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
                        <CardTitle className='flex items-center gap-2 text-lg'><Search className='h-5 w-5 text-primary' /> Match to Existing Roles</CardTitle>
                        <CardDescription>Scan all available client roles to find the best fit for this candidate.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {potentialRoles.length > 0 ? (
                            <div className='space-y-3'>
                                {potentialRoles.map((match: any, index: number) => (
                                    <div key={index} className="p-3 rounded-md border border-dashed border-border flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-primary">{match.roleTitle}</p>
                                            <p className="text-xs text-muted-foreground">{match.justification}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleAssignRole(match.roleTitle)}><PlusCircle className="mr-2 h-4 w-4" />Assign Role</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                           <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('potentialRoles')} disabled={isGenerating.potentialRoles || roles.length === 0}>
                              {isGenerating.potentialRoles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                              Find Potential Roles
                            </Button>
                        )}
                         {roles.length === 0 && <p className="text-xs text-center text-muted-foreground mt-2">No client roles exist to match against.</p>}
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'><ShieldCheck className='h-5 w-5 text-primary' /> Targeted Review</CardTitle>
                     <CardDescription>Validate this candidate's fit for their currently assigned role.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isUnassigned ? (
                      <div className='text-sm text-muted-foreground text-center p-4 bg-secondary/50 rounded-md'>
                        Assign a role to enable a targeted review.
                      </div>
                    ) : (
                      <>
                        {review ? (
                            <div className="space-y-2 text-sm">
                              <p><strong>Recommendation:</strong> <Badge variant={review.recommendation === 'Hire' ? 'default' : review.recommendation === 'Maybe' ? 'secondary' : 'destructive'} className={review.recommendation === 'Hire' ? 'bg-green-600/80' : ''}>{review.recommendation}</Badge></p>
                              <p className='text-muted-foreground'><strong>Justification:</strong> {review.justification}</p>
                            </div>
                        ) : (
                            <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('review')} disabled={isGenerating.review}>
                              {isGenerating.review ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                              Review for {candidate.role}
                            </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'><Goal className='h-5 w-5 text-primary' /> Skill & Culture Analysis</CardTitle>
                    <CardDescription>Identify growth areas and assess cultural alignment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div>
                        <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('skillGap')} disabled={isGenerating.skillGap || isUnassigned}>
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
                         <Button variant="outline" className="w-full" onClick={() => handleGenerateClick('cultureFit')} disabled={isGenerating.cultureFit}>
                           {isGenerating.cultureFit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                           Synthesize Culture Fit
                        </Button>
                        {cultureFit && (
                           <div className="mt-3 text-xs p-2 bg-secondary rounded-md space-y-2">
                                <div><strong>Alignment Score:</strong> <Badge>{cultureFit.alignmentScore}/100</Badge></div>
                                <div><strong>Summary:</strong> {cultureFit.summary}</div>
                            </div>
                        )}
                     </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2 text-lg'><Brain className='h-5 w-5 text-primary' /> AI Interview Gauntlet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm text-muted-foreground mb-4'>Invite the candidate to the AI Gauntlet and copy their unique credentials.</p>
                       <Button onClick={handleSendInterviewInvite} className="w-full" disabled={!candidate.id || candidate.role === 'Unassigned'}>
                          <Link className="mr-2 h-4 w-4" />
                          Start Gauntlet & Copy Credentials
                        </Button>
                         {candidate.role === 'Unassigned' && <p className="text-xs text-center text-muted-foreground mt-2">A role must be assigned to start the Gauntlet.</p>}
                    </CardContent>
                  </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'><FileSignature className='h-5 w-5 text-primary' /> Offer & Onboarding</CardTitle>
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
                    <CardTitle className='flex items-center gap-2 text-lg'><Send className='h-5 w-5 text-primary' /> Candidate Communication</CardTitle>
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
        <SheetFooter className="p-6 pt-0 bg-background/95 backdrop-blur-sm border-t flex justify-between">
          <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4"/> Delete Candidate
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the candidate's data from the servers.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>

          <Button variant={candidate.archived ? 'secondary' : 'outline'} onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4"/> {candidate.archived ? 'Restore Candidate' : 'Archive Candidate'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
