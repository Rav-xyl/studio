'use client';

import { useMemo } from "react";
import type { Candidate } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, Trash2, Database, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

interface AllCandidatesTableProps {
    candidates: Candidate[];
    onDeleteCandidate: (candidateId: string) => void;
}

export function AllCandidatesTable({ candidates, onDeleteCandidate }: AllCandidatesTableProps) {
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database />
                    Master Candidate Database
                </CardTitle>
                <CardDescription>
                    A complete and unfiltered view of every candidate in the system, including archived profiles.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Assigned Role</TableHead>
                                <TableHead className="text-center">AI Score</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {candidates.length > 0 ? (
                                candidates.map(candidate => (
                                    <TableRow key={candidate.id} className={candidate.archived ? 'bg-secondary/50' : ''}>
                                        <TableCell className="font-medium">{candidate.name}</TableCell>
                                        <TableCell>{candidate.role}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{Math.round(candidate.aiInitialScore || 0)}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {candidate.archived ? (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    <Archive className="mr-1 h-3 w-3" />
                                                    Archived
                                                </Badge>
                                            ) : (
                                                <Badge>{candidate.status}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive/80 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the candidate record for <span className="font-semibold">{candidate.name}</span> and all associated data from the database.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDeleteCandidate(candidate.id)}>
                                                            Confirm Permanent Deletion
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                                        No candidates found in the database.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
