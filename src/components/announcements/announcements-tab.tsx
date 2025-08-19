
'use client';

import type { Announcement } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Megaphone, MessageSquare } from "lucide-react";

interface AnnouncementsTabProps {
    announcements: Announcement[];
}

export function AnnouncementsTab({ announcements }: AnnouncementsTabProps) {
    return (
        <div className="fade-in-slide-up">
            <header className="flex items-center gap-3 mb-6">
                <Megaphone className="w-10 h-10 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Announcements</h1>
                    <p className="text-sm text-muted-foreground">
                        Updates and new features from the development team.
                    </p>
                </div>
            </header>
            
            <ScrollArea className="h-[calc(100vh-18rem)]">
                 <div className="space-y-4 pr-4">
                    {announcements.length > 0 ? (
                        announcements.map(announcement => (
                            <Card key={announcement.id}>
                                <CardHeader>
                                    <CardTitle>{announcement.title}</CardTitle>
                                    <CardDescription>
                                        Posted by {announcement.author} on {announcement.createdAt?.toDate().toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                         <div className="text-center text-muted-foreground py-16">
                            <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">No Announcements Yet</h3>
                            <p>Check back later for updates and news.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
