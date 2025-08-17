
import type { JobRole } from '@/lib/types'
import { Building, Users, Eye, RefreshCw, Search, Loader2, ListChecks } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

interface RoleCardProps {
    role: JobRole
    onViewCandidates: (role: JobRole) => void;
    onReEngage: (role: JobRole) => void;
    onFindMatches: (role: JobRole, mode: 'top' | 'qualified') => void;
    style?: React.CSSProperties;
}

export function RoleCard({ role, onViewCandidates, onReEngage, onFindMatches, style }: RoleCardProps) {

    return (
        <Card style={style} className="bg-white flex flex-col border-border/50 hover:border-primary/50 transition-colors">
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
            <CardFooter className='grid grid-cols-2 gap-2'>
                <Button variant="outline" className='w-full bg-background hover:bg-secondary col-span-2' onClick={() => onViewCandidates(role)}>
                    <Eye className="mr-2 h-4 w-4" /> View Assigned Candidates
                </Button>
                 <Button variant="secondary" className='w-full' onClick={() => onReEngage(role)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Re-engage Archives
                </Button>
                <Button variant="secondary" className='w-full' onClick={() => onFindMatches(role, 'qualified')}>
                     <ListChecks className="mr-2 h-4 w-4" />
                     Find All Qualified
                </Button>
                <Button variant="default" className='w-full col-span-2' onClick={() => onFindMatches(role, 'top')}>
                    <Search className="mr-2 h-4 w-4" />
                     Find Top Matches (AI)
                </Button>
            </CardFooter>
        </Card>
    )
}
