'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, Loader2, Shield } from 'lucide-react';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin1234';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('admin-auth', JSON.stringify({ username: 'admin', role: 'admin' }));
      toast({
        title: 'Login Successful',
        description: 'Welcome, Admin. Redirecting to the main dashboard...',
      });
      router.push('/');
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
          <CardTitle className="text-3xl">AstraHire Admin Portal</CardTitle>
          <CardDescription>Enter your credentials to access the command center.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                 <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
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
              {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
