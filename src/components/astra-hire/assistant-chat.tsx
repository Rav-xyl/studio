
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { HardHat } from 'lucide-react';

interface AssistantChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionHandled: () => void;
}

export function AssistantChat({ open, onOpenChange }: AssistantChatProps) {

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 text-center">
            <SheetTitle className="flex items-center justify-center gap-2">
                <HardHat className="h-6 w-6 text-primary" />
                Under Construction
            </SheetTitle>
            <SheetDescription>
                The "Ask Astra" AI assistant is currently being upgraded.
            </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground text-center">
                This feature will be back online soon with enhanced capabilities. Thank you for your patience.
            </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
