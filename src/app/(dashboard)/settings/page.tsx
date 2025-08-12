import { RubricRefinement } from "@/components/settings/rubric-refinement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and AI model settings.
        </p>
      </div>
      <Separator />
      <RubricRefinement />
    </div>
  )
}
