import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, Briefcase, GitMerge, Users, Zap } from "lucide-react"
import { HiringVelocityChart } from "@/components/analytics/hiring-velocity-chart"
import { RoleDistributionChart } from "@/components/analytics/role-distribution-chart"
import { PredictiveHiresChart } from "@/components/analytics/predictive-hires-chart"

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Insights into your recruitment pipeline and AI performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired This Month</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+45</div>
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time-to-Hire</CardTitle>
            <GitMerge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21 days</div>
            <p className="text-xs text-muted-foreground">-5% from last month</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Actions Taken</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Hiring Velocity</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <HiringVelocityChart />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Open Roles Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleDistributionChart />
          </CardContent>
        </Card>
      </div>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-primary" /> Predictive Hiring Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <p className="text-muted-foreground mb-4 ml-4">AI-powered forecasts for the next quarter.</p>
          <PredictiveHiresChart />
        </CardContent>
      </Card>
    </div>
  )
}
