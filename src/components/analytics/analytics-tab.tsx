
'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { HiringVelocityChart } from "./hiring-velocity-chart";
import { BarChart2, Check, TrendingUp, Users, Map, Loader2 } from "lucide-react";
import { PredictiveHiresChart } from "./predictive-hires-chart";
import { RoleDistributionChart } from "./role-distribution-chart";
import { RubricRefinement } from "../settings/rubric-refinement";
import { Button } from "../ui/button";
import type { Candidate, JobRole, RubricChange, TalentHotspot } from "@/lib/types";
import { generateTalentMap } from "@/ai/flows/talent-mapping";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AnalyticsTabProps {
    candidates: Candidate[];
    roles: JobRole[];
    suggestedChanges: RubricChange[];
    setSuggestedChanges: React.Dispatch<React.SetStateAction<RubricChange[]>>;
}

export function AnalyticsTab({ candidates, roles, suggestedChanges, setSuggestedChanges }: AnalyticsTabProps) {
    const [isMapping, setIsMapping] = useState(false);
    const [talentMap, setTalentMap] = useState<{ hotspots: TalentHotspot[], recommendation: string} | null>(null);
    const { toast } = useToast();

    const hiredCount = candidates.filter(c => c.status === 'Hired').length;

    const handleGenerateMap = async () => {
        setIsMapping(true);
        try {
            const result = await generateTalentMap({
                openRoles: roles,
                internalHiringData: "We have offices in Bangalore and Pune, with most hires in the tech department."
            });
            setTalentMap({ hotspots: result.hotspots, recommendation: result.strategicRecommendation });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Could not generate talent map.', variant: 'destructive' });
        } finally {
            setIsMapping(false);
        }
    }

    return (
        <div className="fade-in space-y-6">
            <h2 className="text-3xl font-bold text-slate-100">Performance & Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Resumes Uploaded</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{candidates.length}</div>
                        <p className="text-xs text-muted-foreground">resumes in the pool</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Successful Hires</CardTitle>
                        <Check className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hiredCount}</div>
                        <p className="text-xs text-muted-foreground">candidates hired</p>
                    </CardContent>
                </Card>
                 <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Roles</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{roles.length}</div>
                        <p className="text-xs text-muted-foreground">active client roles</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="glass-card lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Hiring Velocity</CardTitle>
                        <CardDescription>Candidate progression through the pipeline over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HiringVelocityChart candidates={candidates} />
                    </CardContent>
                </Card>
                <Card className="glass-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Role Distribution</CardTitle>
                         <CardDescription>Breakdown of roles filled this quarter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RoleDistributionChart candidates={candidates} />
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-primary"/> Predictive Hiring Analytics
                        </CardTitle>
                        <CardDescription>Forecasts based on historical data and current pipeline trends.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <PredictiveHiresChart />
                    </CardContent>
                </Card>
                 <Card className="glass-card flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Map className="h-5 w-5 text-primary"/> Global Talent Mapping
                        </CardTitle>
                        <CardDescription>AI-analyzed market data to highlight talent hotspots.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {isMapping && <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>}
                        {talentMap ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold">Strategic Recommendation</h4>
                                    <p className="text-xs text-muted-foreground">{talentMap.recommendation}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Talent Hotspots</h4>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        {talentMap.hotspots.map(h => (
                                            <li key={h.location}><strong>{h.location}:</strong> ~{h.talentCount.toLocaleString()} candidates ({h.topSkills.join(', ')})</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : !isMapping && (
                            <div className="text-center text-muted-foreground">Click the button to generate a talent map.</div>
                        )}
                    </CardContent>
                     <CardContent>
                         <Button onClick={handleGenerateMap} disabled={isMapping || roles.length === 0} className="w-full">
                            {isMapping ? 'Analyzing...' : 'Generate Talent Map'}
                        </Button>
                        {roles.length === 0 && <p className="text-xs text-center text-muted-foreground mt-2">Create a role to enable talent mapping.</p>}
                     </CardContent>
                </Card>
            </div>

            <RubricRefinement suggestedChanges={suggestedChanges} setSuggestedChanges={setSuggestedChanges} />
        </div>
    )
}
