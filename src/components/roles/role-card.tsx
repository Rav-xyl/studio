
import type { JobRole } from '@/lib/types'
import { Building, Users, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

interface RoleCardProps {
    role: JobRole
    onViewCandidates: (role: JobRole) => void;
}

export function RoleCard({ role, onViewCandidates }: RoleCardProps) {

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
                <Button variant="outline" className='w-full' onClick={() => onViewCandidates(role)}>
                    <Eye className="mr-2 h-4 w-4" /> View Candidates
                </Button>
            </CardFooter>
        </Card>
    )
}
