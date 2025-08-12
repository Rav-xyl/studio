import { BrainCircuit } from 'lucide-react';
import * as React from 'react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-lg font-bold text-primary">
      <BrainCircuit className="h-6 w-6" />
      <span className="text-foreground">TalentFlow AI</span>
    </div>
  );
}
