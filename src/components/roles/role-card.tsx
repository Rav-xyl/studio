
import type { JobRole } from '@/lib/types'
import { Building, Users, Eye, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

interface RoleCardProps {
    role: JobRole
    onViewCandidates: (role: JobRole) => void;
    onReEngage: (role: JobRole) => void;
}

export function RoleCard({ role, onViewCandidates, onReEngage }: RoleCardProps) {

    return (
        <Card className="bg-secondary/30 flex flex-col border-transparent hover:border-foreground/20 transition-colors">
            <CardHeader>
                <CardTitle className='tracking-tight'>{role.title}</CardTitle>
                <CardDescription className='flex items-center gap-2 pt-1 text-muted-foreground'>
                    <Building className="h-4 w-4" /> {role.department}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className='flex items-center gap-2 text-muted-foreground'>
                    <Users className='h-5 w-5 text-foreground/80' />
                    <span className='font-bold text-lg text-foreground'>{role.openings}</span>
                    <span>Open Positions</span>
                </div>
                 <p className='text-sm text-muted-foreground mt-4 line-clamp-3'>{role.description}</p>
            </CardContent>
            <CardFooter className='flex flex-col gap-2'>
                <Button variant="outline" className='w-full bg-transparent hover:bg-secondary' onClick={() => onViewCandidates(role)}>
                    <Eye className="mr-2 h-4 w-4" /> View Candidates
                </Button>
                <Button variant="secondary" className='w-full' onClick={() => onReEngage(role)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Re-engage Candidates
                </Button>
            </CardFooter>
        </Card>
    )
}
