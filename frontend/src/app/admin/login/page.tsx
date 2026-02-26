'use client';

import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, User, ArrowLeft } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        async function checkExistingAuth() {
            try {
                const token = api.getToken();
                if (!token) { setCheckingAuth(false); return; }
                await api.getMe();
                router.replace('/admin');
            } catch {
                api.clearToken();
                setCheckingAuth(false);
            }
        }
        checkExistingAuth();
    }, [router]);

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
                <div className="relative z-10 text-center space-y-4">
                    <Fingerprint size={48} className="text-blue-500 animate-pulse mx-auto" />
                    <div className="text-slate-500 font-mono text-sm animate-pulse">VERIFYING SESSION...</div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.login(username, password);
            api.setToken(response.access_token);
            router.push('/admin');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
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
                        <Fingerprint size={48} weight="duotone" className="text-blue-400 mb-4" />
                        <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider text-center">
                            Admin Login
                        </h1>
                        <p className="text-slate-400 text-sm mt-2">eVoting Administration Panel</p>
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-800 rounded-sm p-3 mb-4 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="Enter username" disabled={loading} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="••••••••" disabled={loading} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-medium tracking-wide uppercase text-sm px-4 py-3 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Authenticating...' : 'Access System'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-1 mx-auto transition-colors">
                            <ArrowLeft size={14} /> Back to Home
                        </button>
                    </div>

                    <div className="mt-4 p-4 bg-slate-950/50 border border-slate-800 rounded-sm">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">Demo Credentials:</p>
                        <div className="text-xs font-mono text-slate-400">admin / admin123</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
