
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { askAstra } from '@/ai/flows/ask-astra';
import { useToast } from '@/hooks/use-toast';

interface AssistantChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionHandled: () => void;
}

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function AssistantChat({ open, onOpenChange, onActionHandled }: AssistantChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
        setMessages([
            { role: 'assistant', content: "Hello! I'm Astra, your AI assistant. How can I help you with TalentFlow today? You can ask me questions about features or ask me to perform actions, like 'delete the candidate named John Doe'." }
        ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await askAstra({ question: input });
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, assistantMessage]);

        // If the response indicates a deletion, we can trigger a refresh
        if (response.toLowerCase().includes('deleted')) {
            onActionHandled();
        }

    } catch (error) {
        console.error("Astra failed:", error);
        toast({
            variant: 'destructive',
            title: 'Astra Error',
            description: 'The AI assistant encountered a problem. Please try again.',
        });
        setMessages(prev => [...prev, { role: 'assistant', content: 'I seem to be having some trouble right now. Please try again in a moment.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-4 border-b text-left">
            <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Ask Astra
            </SheetTitle>
            <SheetDescription>
                Your intelligent assistant for the TalentFlow app.
            </SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                 <div className="space-y-6">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                            {message.role === 'assistant' && <div className="p-2 bg-primary text-primary-foreground rounded-full"><Bot className="h-5 w-5"/></div>}
                            <div className={`rounded-lg p-3 max-w-[80%] text-sm ${message.role === 'assistant' ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}>
                                {message.content}
                            </div>
                            {message.role === 'user' && <div className="p-2 bg-secondary rounded-full"><User className="h-5 w-5"/></div>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                             <div className="p-2 bg-primary text-primary-foreground rounded-full"><Bot className="h-5 w-5"/></div>
                             <div className="rounded-lg p-3 bg-secondary flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                             </div>
                        </div>
                    )}
                 </div>
            </ScrollArea>
             <div className="p-4 border-t bg-background">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g., How do I add a new role?"
                        className="h-12 resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
