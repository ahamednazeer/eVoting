'use client';

import React from 'react';
import { CheckCircle, Fingerprint } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function VoteSuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center relative"
            style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <div className="scanlines" />

            <div className="relative z-10 w-full max-w-md mx-4 text-center">
                <div className="bg-slate-900/90 border border-slate-700 rounded-sm p-8 backdrop-blur-md">
                    <div className="mb-6">
                        <div className="relative inline-block">
                            <CheckCircle size={80} weight="fill" className="text-green-400 animate-vote-pulse" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider mb-3 text-green-400">
                        Vote Cast Successfully!
                    </h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Your vote has been recorded securely and anonymously. Thank you for participating in the democratic process.
                    </p>

                    <div className="bg-green-950/30 border border-green-700/40 rounded-sm p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 text-green-400">
                            <Fingerprint size={20} weight="duotone" />
                            <span className="text-xs font-mono uppercase tracking-wider">Vote Verified & Encrypted</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full btn-secondary"
                        >
                            Return to Home
                        </button>
                    </div>

                    <div className="mt-6 text-xs text-slate-600 font-mono">
                        <p>Session destroyed • Voter marked • Vote anonymous</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
