
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, PlusCircle, Trash2, Edit, Send, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, arrayUnion } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { FeedbackNote, FeedbackReply } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type UserSession = {
    username: string;
};

const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('') : '';
}

export default function FeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<UserSession | null>(null);
    const [notes, setNotes] = useState<FeedbackNote[]>([]);
    
    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState<FeedbackNote['type']>('General');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for editing a note
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteText, setEditingNoteText] = useState('');
    
    // State for replies
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const authData = sessionStorage.getItem('feedback-auth');
        if (!authData) {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'You must be logged in to view this page.',
            });
            router.replace('/feedback/login');
            return;
        }
        setSession(JSON.parse(authData));

        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedbackNote[];
            setNotes(notesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching feedback:", error);
            toast({ title: "Connection Error", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [router, toast]);

    const handleLogout = () => {
        sessionStorage.removeItem('feedback-auth');
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/feedback/login');
    };

    const handleSubmitNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !session) return;

        setIsSubmitting(true);
        const noteId = `note-${nanoid(10)}`;
        const noteRef = doc(db, 'feedback', noteId);

        try {
            await setDoc(noteRef, {
                id: noteId,
                author: session.username,
                note: newNote,
                type: noteType,
                status: 'Open',
                createdAt: serverTimestamp(),
                replies: [],
            });
            setNewNote('');
            setNoteType('General');
            toast({ title: 'Feedback Submitted', description: 'Thank you for your note!' });
        } catch (error) {
            console.error("Error submitting note:", error);
            toast({ title: "Submission Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateStatus = async (id: string, status: FeedbackNote['status']) => {
        if (session?.username !== 'owner') {
             toast({ title: "Permission Denied", description: "Only the owner can update status.", variant: "destructive" });
             return;
        }
        const noteRef = doc(db, 'feedback', id);
        await updateDoc(noteRef, { status });
    };
    
    const startEditing = (note: FeedbackNote) => {
        setEditingNoteId(note.id);
        setEditingNoteText(note.note);
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditingNoteText('');
    };

    const handleUpdateNote = async () => {
        if (!editingNoteId || !editingNoteText.trim()) return;
        const noteRef = doc(db, 'feedback', editingNoteId);
        await updateDoc(noteRef, { note: editingNoteText });
        toast({ title: "Note Updated" });
        cancelEditing();
    };
    
    const handleAddReply = async (noteId: string) => {
        if (!replyText.trim() || !session) return;

        const noteRef = doc(db, 'feedback', noteId);
        const newReply: FeedbackReply = {
            id: `reply-${nanoid(10)}`,
            author: session.username,
            text: replyText,
            createdAt: serverTimestamp(),
        };

        await updateDoc(noteRef, {
            replies: arrayUnion(newReply)
        });
        
        toast({ title: "Reply Added" });
        setReplyText('');
    };

    const handleDeleteNote = async (id: string) => {
        await deleteDoc(doc(db, 'feedback', id));
        toast({ title: "Note Deleted" });
    };

    if (isLoading || !session) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-secondary/50">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-10 h-10 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Feedback Notes</h1>
                        <p className="text-sm text-muted-foreground">Logged in as: <span className="font-semibold">{session.username}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/" passHref>
                        <Button variant="outline" size="sm">
                            <Home className="mr-2 h-4 w-4" />
                            Return to App
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave a New Note</CardTitle>
                            <CardDescription>Share your thoughts, suggestions, or issues.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitNote} className="space-y-4">
                                <Textarea
                                    placeholder="Type your feedback here..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="h-40"
                                    required
                                />
                                <Select onValueChange={(v) => setNoteType(v as FeedbackNote['type'])} value={noteType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select note type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General">General Feedback</SelectItem>
                                        <SelectItem value="Suggestion">Suggestion</SelectItem>
                                        <SelectItem value="Bug">Bug Report</SelectItem>
                                        <SelectItem value="Question">Question</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2" />}
                                    Submit Note
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    {notes.map(note => (
                        <Card key={note.id} className="fade-in">
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{note.type}</Badge>
                                        <Badge variant={note.status === 'Open' ? 'destructive' : note.status === 'In Progress' ? 'secondary' : 'default'} className={note.status === 'Resolved' ? 'bg-green-600/80' : ''}>
                                            {note.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        By <span className="font-semibold text-foreground">{note.author}</span> on {new Date(note.createdAt?.toDate()).toLocaleDateString()}
                                    </p>
                                </div>
                                {session.username === 'owner' && (
                                     <Select onValueChange={(v) => handleUpdateStatus(note.id, v as FeedbackNote['status'])} defaultValue={note.status}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Update status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Separator className="mb-4" />
                                {editingNoteId === note.id ? (
                                    <div className="space-y-2">
                                        <Textarea value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} className="h-24" />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={cancelEditing}>Cancel</Button>
                                            <Button size="sm" onClick={handleUpdateNote}>Save Changes</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-foreground whitespace-pre-wrap">{note.note}</p>
                                )}
                                
                                {(session.username === note.author || session.username === 'owner') && editingNoteId !== note.id && (
                                    <div className="text-right mt-2 flex justify-end gap-2">
                                        {session.username === note.author && (
                                            <Button variant="link" className="text-muted-foreground h-auto p-0" onClick={() => startEditing(note)}><Edit className="mr-1 h-3 w-3"/> Edit</Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="link" className="text-destructive h-auto p-0"><Trash2 className="mr-1 h-3 w-3"/> Delete</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone and will permanently delete this note.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteNote(note.id)}>Confirm Deletion</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}

                                {note.replies && note.replies.length > 0 && (
                                    <div className="mt-6 space-y-4">
                                        <Separator />
                                        <h4 className="text-sm font-semibold">Replies</h4>
                                        {note.replies.map(reply => (
                                            <div key={reply.id} className="flex items-start gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{getInitials(reply.author)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 bg-secondary/50 p-3 rounded-md">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold">{reply.author}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(reply.createdAt?.toDate()).toLocaleTimeString()}</p>
                                                    </div>
                                                    <p className="text-sm mt-1 text-muted-foreground">{reply.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4">
                                    <form onSubmit={(e) => { e.preventDefault(); handleAddReply(note.id); }} className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{getInitials(session.username)}</AvatarFallback>
                                        </Avatar>
                                        <Textarea
                                            placeholder="Write a reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="h-16"
                                        />
                                        <Button type="submit" size="icon" disabled={!replyText.trim()}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                     {notes.length === 0 && (
                        <div className="text-center text-muted-foreground py-16">
                            <p>No feedback notes submitted yet.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
