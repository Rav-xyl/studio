
import type { JobRole } from '@/lib/types'
import { Building, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useToast } from '@/hooks/use-toast'

interface RoleCardProps {
    role: JobRole
}

export function RoleCard({ role }: RoleCardProps) {
    const { toast } = useToast();

    const handleViewCandidates = () => {
        toast({
            title: "Feature In Development",
            description: "This will soon filter the candidate pool for this specific role.",
            variant: "destructive"
        })
    }

    return (
        <Card className="glass-card flex flex-col">
            <CardHeader>
                <CardTitle>{role.title}</CardTitle>
                <CardDescription className='flex items-center gap-2 pt-1'>
                    <Building className="h-4 w-4" /> {role.department}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className='flex items-center gap-2 text-muted-foreground'>
                    <Users className='h-5 w-5 text-primary' />
                    <span className='font-bold text-lg text-foreground'>{role.openings}</span>
                    <span>Open Positions</span>
                </div>
                 <p className='text-xs text-muted-foreground mt-4 line-clamp-3'>{role.description}</p>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className='w-full' onClick={handleViewCandidates}>View Candidates</Button>
            </CardFooter>
        </Card>
    )
}

    