
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { askAstra } from '@/ai/flows/ask-astra';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface AssistantChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionHandled: () => void; // Callback to notify parent that an action was taken
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AssistantChat({ open, onOpenChange, onActionHandled }: AssistantChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm Astra, your AI assistant. How can I help you with the TalentFlow app today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
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

      // Check if the response indicates a successful action
      if (response.toLowerCase().includes('successfully deleted')) {
        onActionHandled();
        toast({
            title: "Action Complete",
            description: "Astra has successfully completed the requested action."
        })
      }

    } catch (error) {
      console.error("Error asking Astra:", error);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: "Assistant Error", description: "Could not get a response from the AI.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle>Ask Astra</SheetTitle>
          <SheetDescription>
            Your AI assistant for navigating and managing the TalentFlow app.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg p-3 max-w-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                 <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                <div className="rounded-lg p-3 bg-secondary flex items-center">
                   <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="p-6">
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Delete the candidate John Doe"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
