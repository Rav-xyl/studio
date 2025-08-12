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
import { Lightbulb, Linkedin, Zap, Brain, Video, Send, Scan, Star, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';

interface CandidateDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
}

const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('') : '';
}

export function CandidateDetailSheet({
  open,
  onOpenChange,
  candidate,
}: CandidateDetailSheetProps) {
  if (!candidate) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] flex flex-col p-0">
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="review">AI Review</TabsTrigger>
                <TabsTrigger value="interview">Interview</TabsTrigger>
                <TabsTrigger value="engage">Engage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-4">
                <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'><FileText className='h-5 w-5 text-primary'/> Candidate Profile</CardTitle>
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
                     <CardTitle className='flex items-center gap-2'><Lightbulb className='h-5 w-5 text-primary'/> AI Role Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <p className='text-sm text-muted-foreground'>AI has identified these potential roles based on the candidate's profile.</p>
                     <div>
                        <h5 className="font-semibold">Senior AI Prompt Engineer</h5>
                        <p className="text-sm text-muted-foreground">Rationale: Matches candidate's deep experience with NLP and creative problem-solving.</p>
                     </div>
                     <div>
                        <h5 className="font-semibold">Lead Conversational Designer</h5>
                        <p className="text-sm text-muted-foreground">Rationale: Aligns with their background in UX and understanding of language models.</p>
                     </div>
                     <Button variant="outline" className="w-full">
                      <Zap className="mr-2 h-4 w-4" />
                      Generate New Suggestions
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="mt-4">
                <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Scan className='h-5 w-5 text-primary' /> AI-Assisted Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-2'>For candidates requiring manual review, AI provides the following analysis.</p>
                    <div className="rounded-md border border-dashed border-accent p-4 text-center">
                      <p className="font-semibold text-accent mb-1">Recommendation: Maybe</p>
                      <p className="text-sm text-muted-foreground">Justification: Candidate shows strong potential in adjacent skills but lacks direct experience in the core technology stack. Worth exploring for a related role.</p>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      <Zap className="mr-2 h-4 w-4" />
                      Run Full Review
                    </Button>
                  </CardContent>
                </Card>
                <Card className='glass-card mt-4'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Star className='h-5 w-5 text-primary' /> Skill Gap & Training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>AI analysis of skill gaps and suggested training for future opportunities.</p>
                    <ul className='list-disc list-inside space-y-2 text-sm'>
                        <li><span className='font-semibold'>Gap:</span> Advanced Kubernetes knowledge. <span className='text-muted-foreground'>Suggestion: CKA Certification.</span></li>
                        <li><span className='font-semibold'>Gap:</span> Experience with Terraform. <span className='text-muted-foreground'>Suggestion: Complete "Terraform for Beginners" on Udemy.</span></li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interview" className="mt-4">
                <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Brain className='h-5 w-5 text-primary' /> Dynamic Interview Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>AI-generated questions tailored to this candidate and role.</p>
                    <ol className='list-decimal list-inside space-y-2 text-sm bg-secondary p-4 rounded-md'>
                        <li>"Can you walk me through a complex Next.js project you've led?"</li>
                        <li>"How do you approach state management in a large-scale React application?"</li>
                        <li>"Describe a time you had to optimize the performance of a web app. What were the results?"</li>
                    </ol>
                    <Button variant="outline" className="w-full mt-4">
                      <Zap className="mr-2 h-4 w-4" />
                      Generate New Questions
                    </Button>
                  </CardContent>
                </Card>
                <Card className='glass-card mt-4'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Video className='h-5 w-5 text-primary' /> AI Video Interview</CardTitle>
                  </CardHeader>
                  <CardContent className='text-center'>
                    <p className='text-sm text-muted-foreground mb-4'>Invite the candidate to an automated AI-powered video interview.</p>
                    <Button>
                      <Send className="mr-2 h-4 w-4" />
                      Send Interview Invite
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">Status: Not Invited</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engage" className="mt-4">
                 <Card className='glass-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'><Send className='h-5 w-5 text-primary' /> AI-Driven Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-muted-foreground mb-4'>Let AI draft a personalized email based on the candidate's current stage.</p>
                    <Textarea
                        readOnly
                        className="h-48 font-code bg-secondary"
                        value={`Subject: Exciting Opportunity at TalentFlow AI - ${candidate.role}

Dear ${candidate.name},

We were very impressed with your background in ${candidate.skills[0]} and ${candidate.skills[1]}. Your experience seems like a strong match for the ${candidate.role} position.

We would like to invite you to the next stage of our process. Please let us know a few times that work for you to connect briefly.

Best,
The TalentFlow AI Team`}
                    />
                    <Button variant="outline" className="w-full mt-4">
                      <Zap className="mr-2 h-4 w-4" />
                      Generate New Draft
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
          <Button>Move to Next Stage</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
