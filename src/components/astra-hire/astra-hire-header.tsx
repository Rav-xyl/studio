import { Brain } from "lucide-react";
import { Button } from "../ui/button";

export function AstraHireHeader({ onReportClick }: { onReportClick: () => void }) {
  return (
    <header className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-indigo-500"
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
          <div>
            <h1 className="text-3xl font-bold text-slate-50">AstraHire</h1>
            <p className="text-sm text-slate-400">
              Global Talent Acquisition Partner
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          className="btn-secondary px-3 py-1 text-sm flex items-center gap-1"
          onClick={onReportClick}
        >
          <Brain className="w-4 h-4" /> View SAARTHI Report
        </Button>
      </div>
    </header>
  );
}
