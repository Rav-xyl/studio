import { Brain } from "lucide-react";
import { Button } from "../ui/button";

export function AstraHireHeader({ onReportClick }: { onReportClick: () => void }) {
  return (
    <header className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-background"
            >
                <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
            </svg>
        </div>
        <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">AstraHire</h1>
            <p className="text-sm text-muted-foreground">
              Global Talent Acquisition Partner
            </p>
        </div>
      </div>
      <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground hover:bg-secondary text-sm flex items-center gap-2"
          onClick={onReportClick}
        >
          <Brain className="w-4 h-4" /> SAARTHI Report
        </Button>
    </header>
  );
}
