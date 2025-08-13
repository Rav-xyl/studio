'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { RubricChange } from "@/lib/types";

interface RubricRefinementProps {
  suggestedChanges: RubricChange[];
  setSuggestedChanges: React.Dispatch<React.SetStateAction<RubricChange[]>>;
}

export function RubricRefinement({ suggestedChanges, setSuggestedChanges }: RubricRefinementProps) {
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
            {suggestedChanges.length > 0 ? (
              suggestedChanges.map((change) => (
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No rubric refinement suggestions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
