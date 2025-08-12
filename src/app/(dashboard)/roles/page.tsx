'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockJobRoles } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { GenerateJdDialog } from "@/components/roles/generate-jd-dialog";

export default function RolesPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manage Roles</h1>
        <p className="text-muted-foreground">
          View, edit, and create new job roles for your organization.
        </p>
      </div>
      
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current Openings</CardTitle>
            <CardDescription>A list of all active job roles.</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Synthesize Job Description
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Openings</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJobRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.department}</Badge>
                  </TableCell>
                  <TableCell>{role.openings}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <GenerateJdDialog open={isDialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
