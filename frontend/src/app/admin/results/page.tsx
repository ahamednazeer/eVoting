'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ChartBar } from '@phosphor-icons/react';

interface Election {
    id: string;
    name: string;
    status: string;
    constituency: string;
}

export default function AdminResultsPage() {
    const [elections, setElections] = useState<Election[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchElections() {
            try {
                const data = await api.getElections();
                setElections(data);
            } catch (error) {
                console.error('Failed to fetch elections:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchElections();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <ChartBar size={28} weight="duotone" className="text-cyan-400" />
                    Election Results
                </h1>
                <p className="text-slate-500 mt-1">Select an election to view results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {elections.map((e) => (
                    <a key={e.id} href={`/admin/elections/${e.id}/results`} className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-6 hover:border-slate-500 transition-all group">
                        <h3 className="text-lg font-chivo font-bold uppercase tracking-wider group-hover:text-blue-400 transition-colors">{e.name}</h3>
                        <p className="text-slate-500 text-sm mt-1">{e.constituency}</p>
                        <div className="mt-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${e.status === 'ACTIVE' ? 'text-green-400 bg-green-950/50 border-green-800' : e.status === 'COMPLETED' ? 'text-blue-400 bg-blue-950/50 border-blue-800' : 'text-red-400 bg-red-950/50 border-red-800'}`}>
                                {e.status}
                            </span>
                        </div>
                    </a>
                ))}
            </div>

            {elections.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500 font-mono">No elections found</p>
                </div>
            )}
        </div>
    );
}
