
'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This page is now a redirector to the new candidate portal structure.
export default function InterviewRedirectPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id: candidateId } = params;

    useEffect(() => {
        if (candidateId) {
            router.replace(`/candidate/${candidateId}`);
        }
    }, [candidateId, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirecting to the candidate portal...</p>
        </div>
    );
}
