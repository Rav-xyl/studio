'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const initialChanges = [
  {
    id: 1,
    criteria: 'Experience in Next.js',
    change: 'Increase weight from 15% to 20%',
    reason: 'Hired candidates for "Senior Frontend" consistently had strong Next.js experience, even when their overall score was lower.',
    status: 'Pending'
  },
  {
    id: 2,
    criteria: 'GraphQL Knowledge',
    change: 'Decrease weight from 10% to 5%',
    reason: 'Multiple high-performing hires had minimal GraphQL experience, indicating it is less critical than initially thought.',
    status: 'Pending'
  },
  {
    id: 3,
    criteria: 'Degree from Tier-1 University',
    change: 'Set weight to 0% (Neutral)',
    reason: 'Analysis shows no correlation between university tier and job performance for hired candidates in the last 6 months.',
    status: 'Approved'
  }
];

export function RubricRefinement() {
  const [suggestedChanges, setSuggestedChanges] = useState(initialChanges);
  const { toast } = useToast();

  const handleAction = (id: number, action: 'Approved' | 'Rejected') => {
    setSuggestedChanges(prev =>
      prev.map(change =>
        change.id === id ? { ...change, status: action } : change
      )
    );
    toast({
      title: `Change ${action}`,
      description: `The suggested rubric change has been ${action.toLowerCase()}.`
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Continuous AI Rubric Refinement</CardTitle>
        <CardDescription>
          The AI learns from hiring decisions and suggests refinements to its scoring rubric. Review and approve changes below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criteria</TableHead>
              <TableHead>Suggested Change</TableHead>
              <TableHead>AI's Reasoning</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestedChanges.map((change) => (
              <TableRow key={change.id}>
                <TableCell className="font-medium">{change.criteria}</TableCell>
                <TableCell>{change.change}</TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-xs">{change.reason}</TableCell>
                <TableCell className="text-center">
                    <Badge variant={change.status === 'Approved' ? 'default' : change.status === 'Rejected' ? 'destructive' : 'secondary'} className={change.status === 'Approved' ? 'bg-green-600/80' : ''}>
                        {change.status === 'Approved' && <Check className="mr-1 h-3 w-3" />}
                        {change.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {change.status === 'Pending' ? (
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="text-green-400 hover:text-green-400 hover:bg-green-900/50" onClick={() => handleAction(change.id, 'Approved')}>
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-400 hover:bg-red-900/50" onClick={() => handleAction(change.id, 'Rejected')}>
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Actioned</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
