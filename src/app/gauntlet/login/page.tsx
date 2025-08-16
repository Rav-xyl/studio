
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, Loader2, User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const UNIVERSAL_PASSWORD = 'TEST1234';

export default function GauntletLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [candidateId, setCandidateId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== UNIVERSAL_PASSWORD) {
      toast({
        variant: 'destructive',
        title: 'Invalid Credentials',
        description: 'The password you entered is incorrect.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const candidateDocRef = doc(db, 'candidates', candidateId);
      const candidateDoc = await getDoc(candidateDocRef);

      if (candidateDoc.exists()) {
        // Store auth state in session storage for simple persistence across refreshes
        sessionStorage.setItem('gauntlet-auth-id', candidateId);
        toast({
          title: 'Login Successful',
          description: `Welcome, ${candidateDoc.data().name}. Redirecting to your portal...`,
        });
        router.push(`/candidate/${candidateId}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid Credentials',
          description: 'No candidate found with that ID.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: 'Could not connect to the server. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-secondary">
      <Card className="w-full max-w-md p-8 text-center">
        <CardHeader>
          <CardTitle className="text-3xl">AstraHire Gauntlet Portal</CardTitle>
          <CardDescription>Please log in to begin your intelligent assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="space-y-2">
              <Label htmlFor="candidateId">Candidate ID</Label>
              <div className="relative">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                    id="candidateId"
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    placeholder="e.g., cand-xxxxxxxxxx"
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
            <Button type="submit" className="w-full h-11 text-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Gauntlet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
