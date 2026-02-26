'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, ArrowLeft, Timer } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

export default function OtpVerifyPage() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mobile, setMobile] = useState('');
    const [voterName, setVoterName] = useState('');
    const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
    const [expired, setExpired] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = useCallback(() => {
        setTimeLeft(OTP_EXPIRY_SECONDS);
        setExpired(false);
        setOtp('');
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        const m = sessionStorage.getItem('voter_mobile');
        const n = sessionStorage.getItem('voter_name');
        if (!m) {
            router.replace('/vote');
            return;
        }
        setMobile(m);
        setVoterName(n || '');
        startTimer();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [router, startTimer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (expired) {
            setError('OTP has expired. Please resend.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const response = await api.verifyOtp(mobile, otp);
            if (timerRef.current) clearInterval(timerRef.current);
            api.setToken(response.access_token);
            sessionStorage.setItem('voter_constituency', response.voter.constituency);
            sessionStorage.setItem('voter_election_id', response.voter.election_id.toString());
            sessionStorage.setItem('voter_election_name', response.voter.election_name || '');
            router.push('/vote/cast');
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        try {
            await api.sendOtp(mobile);
            startTimer();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const timerColor = timeLeft <= 30
        ? 'text-red-400'
        : timeLeft <= 60
            ? 'text-yellow-400'
            : 'text-green-400';

    return (
        <div className="min-h-screen flex items-center justify-center relative"
            style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <div className="scanlines" />

            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-slate-900/90 border border-slate-700 rounded-sm p-8 backdrop-blur-md">
                    <div className="flex flex-col items-center mb-6">
                        <ShieldCheck size={48} weight="duotone" className="text-green-400 mb-4" />
                        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider text-center">
                            Verify OTP
                        </h1>
                        <p className="text-slate-400 text-sm mt-2">
                            OTP sent to <span className="text-green-400 font-mono">{mobile}</span>
                        </p>
                        {voterName && <p className="text-slate-500 text-xs mt-1">Welcome, {voterName}</p>}
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center justify-center gap-2 mb-4 py-2 rounded-sm border ${expired
                        ? 'bg-red-950/30 border-red-800/50'
                        : 'bg-slate-800/30 border-slate-700/50'
                        }`}>
                        <Timer size={18} weight="bold" className={timerColor} />
                        {expired ? (
                            <span className="text-red-400 font-mono text-sm font-medium">OTP Expired — Please resend</span>
                        ) : (
                            <span className={`font-mono text-lg font-bold ${timerColor}`}>
                                {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-800 rounded-sm p-3 mb-4 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">
                                Enter 4-Digit OTP
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                required
                                maxLength={4}
                                className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-sm placeholder:text-slate-600 font-mono text-3xl tracking-[0.8em] py-4 px-6 border outline-none text-center"
                                placeholder="0000"
                                disabled={loading || expired}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 4 || expired}
                            className="w-full bg-green-600 hover:bg-green-500 text-white rounded-sm font-medium tracking-wide uppercase text-sm px-4 py-3 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </form>

                    <div className="mt-4 flex items-center justify-between">
                        <button onClick={() => router.push('/vote')} className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1 transition-colors">
                            <ArrowLeft size={14} /> Change Number
                        </button>
                        <button onClick={handleResend} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                            Resend OTP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
