'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, Loader2, MessageSquare, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const FEEDBACK_USERNAME = 'tester';
const FEEDBACK_PASSWORD = 'feedback1234';
const OWNER_USERNAME = 'owner';
const OWNER_PASSWORD = 'owner1234';


export default function FeedbackLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if ((username === FEEDBACK_USERNAME && password === FEEDBACK_PASSWORD) || (username === OWNER_USERNAME && password === OWNER_PASSWORD)) {
      sessionStorage.setItem('feedback-auth', JSON.stringify({ username }));
      toast({
        title: 'Login Successful',
        description: 'Redirecting to the feedback portal...',
      });
      router.push('/feedback');
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Credentials',
        description: 'The username or password you entered is incorrect.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-secondary">
      <Card className="w-full max-w-md p-8 text-center">
        <CardHeader>
           <div className="mx-auto bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
          <CardTitle className="text-3xl">Feedback Portal</CardTitle>
          <CardDescription>Please log in to leave or view feedback notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., tester"
                    required
                    className="pl-9"
                 />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
               <div className="relative">
                 <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
                 <Link href="/" passHref className="w-full">
                    <Button variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to App
                    </Button>
                 </Link>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Portal'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
