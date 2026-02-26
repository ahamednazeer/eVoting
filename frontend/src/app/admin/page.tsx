'use client';

import React, { useEffect, useState } from 'react';
import { DataCard } from '@/components/DataCard';
import { api } from '@/lib/api';
import { Gauge, ListBullets, Users, Fingerprint, ChartBar, ArrowSquareOut, Sparkle } from '@phosphor-icons/react';

interface Stats {
    total_elections: number;
    active_elections: number;
    total_candidates: number;
    total_voters: number;
    total_votes: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await api.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin" />
                </div>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                    Loading Dashboard...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <Gauge size={28} weight="duotone" className="text-indigo-400" />
                    Administration
                </h1>
                <p className="text-slate-500 mt-1">eVoting system overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <DataCard title="Total Elections" value={stats?.total_elections || 0} icon={ListBullets} />
                <DataCard title="Active Elections" value={stats?.active_elections || 0} icon={Fingerprint} />
                <DataCard title="Total Candidates" value={stats?.total_candidates || 0} icon={Users} />
                <DataCard title="Total Voters" value={stats?.total_voters || 0} icon={Users} />
                <DataCard title="Total Votes" value={stats?.total_votes || 0} icon={ChartBar} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
                    <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <ArrowSquareOut size={16} weight="duotone" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <button
                            onClick={() => window.location.href = '/admin/elections'}
                            className="bg-gradient-to-br from-blue-900/40 to-blue-950/60 border border-blue-700/30 hover:border-blue-600/50 rounded-xl px-4 py-3 text-blue-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
                        >
                            Manage Elections
                        </button>
                        <button
                            onClick={() => window.location.href = '/admin/results'}
                            className="bg-gradient-to-br from-green-900/40 to-green-950/60 border border-green-700/30 hover:border-green-600/50 rounded-xl px-4 py-3 text-green-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
                        >
                            View Results
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
                    <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Fingerprint size={16} weight="duotone" />
                        System Status
                    </h3>
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800/50 transition-colors">
                            <span className="text-slate-400 text-sm font-mono uppercase tracking-wider">Active Elections</span>
                            <span className="text-slate-100 font-bold font-mono text-lg">{stats?.active_elections || 0}</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800/50 transition-colors">
                            <span className="text-slate-400 text-sm font-mono uppercase tracking-wider">Votes Cast</span>
                            <span className="text-slate-100 font-bold font-mono text-lg">{stats?.total_votes || 0}</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800/50 transition-colors">
                            <span className="text-slate-400 text-sm font-mono uppercase tracking-wider">Registered Voters</span>
                            <span className="text-slate-100 font-bold font-mono text-lg">{stats?.total_voters || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
