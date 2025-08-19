'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page now serves as a redirector to the main dashboard for a logged-in admin.
export default function AdminRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        const authData = localStorage.getItem('admin-auth');
        if (authData) {
            router.replace('/');
        } else {
            router.replace('/admin/login');
        }
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirecting to your dashboard...</p>
        </div>
    );
}
