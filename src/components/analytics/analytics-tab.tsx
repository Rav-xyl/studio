
'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { HiringVelocityChart } from "./hiring-velocity-chart";
import { BarChart2, Check, TrendingUp, Users } from "lucide-react";
import { PredictiveHiresChart } from "./predictive-hires-chart";
import { RoleDistributionChart } from "./role-distribution-chart";
import { RubricRefinement } from "../settings/rubric-refinement";
import { Button } from "../ui/button";


export function AnalyticsTab() {

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
                        <div className="text-2xl font-bold">1,023</div>
                        <p className="text-xs text-muted-foreground">+18.2% from last month</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Successful Hires</CardTitle>
                        <Check className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">142</div>
                        <p className="text-xs text-muted-foreground">+25.1% from last month</p>
                    </CardContent>
                </Card>
                 <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time-to-Hire (Avg)</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">21 days</div>
                        <p className="text-xs text-muted-foreground">-5.8% from last month</p>
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
                        <HiringVelocityChart />
                    </CardContent>
                </Card>
                <Card className="glass-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Role Distribution</CardTitle>
                         <CardDescription>Breakdown of roles filled this quarter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RoleDistributionChart />
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
                 <div className="flex items-center justify-center glass-card p-6 rounded-lg">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Global Talent Mapping</h3>
                        <p className="text-muted-foreground mb-4">Feature coming soon. AI will analyze market data to highlight talent hotspots and emerging skill trends in the Indian job market.</p>
                        <Button disabled>View Talent Map</Button>
                    </div>
                </div>
            </div>

            <RubricRefinement />
        </div>
    )
}
