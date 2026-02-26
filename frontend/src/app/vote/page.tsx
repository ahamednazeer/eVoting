'use client';

import React, { useState } from 'react';
import { Fingerprint, DeviceMobile, ArrowLeft } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function VoterEntryPage() {
    const router = useRouter();
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.sendOtp(mobile);
            // Store voter data in sessionStorage for the next steps
            sessionStorage.setItem('voter_mobile', mobile);
            sessionStorage.setItem('voter_name', response.voter_name);
            sessionStorage.setItem('voter_election_id', response.election_id.toString());
            router.push('/vote/verify');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative"
            style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <div className="scanlines" />

            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-slate-900/90 border border-slate-700 rounded-sm p-8 backdrop-blur-md">
                    <div className="flex flex-col items-center mb-8">
                        <Fingerprint size={48} weight="duotone" className="text-green-400 mb-4" />
                        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider text-center">
                            Cast Your Vote
                        </h1>
                        <p className="text-slate-400 text-sm mt-2">Enter your registered mobile number</p>
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-800 rounded-sm p-3 mb-4 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <DeviceMobile className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="Enter your mobile number"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white rounded-sm font-medium tracking-wide uppercase text-sm px-4 py-3 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending OTP...' : 'Get OTP'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-1 mx-auto transition-colors">
                            <ArrowLeft size={14} /> Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
