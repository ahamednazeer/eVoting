'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ChartBar, ArrowLeft, Trophy, Crown } from '@phosphor-icons/react';

interface CandidateResult {
    candidate_id: string;
    candidate_name: string;
    party: string;
    symbol: string;
    constituency: string;
    vote_count: number;
}

interface ResultData {
    election: { id: string; name: string; status: string; constituency: string };
    total_votes: number;
    total_voters: number;
    voted_voters: number;
    turnout_percentage: string;
    winner: CandidateResult | null;
    results: CandidateResult[];
}

export default function ResultsPage() {
    const params = useParams();
    const router = useRouter();
    const electionId = params.id as string;
    const [data, setData] = useState<ResultData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchResults() {
            try {
                const result = await api.getResults(electionId);
                setData(result);
            } catch (error) {
                console.error('Failed to fetch results:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchResults();
    }, [electionId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Counting Votes...</p>
            </div>
        );
    }

    if (!data) return <p className="text-slate-500 text-center">Failed to load results</p>;

    const maxVotes = Math.max(...data.results.map((r) => r.vote_count), 1);

    return (
        <div className="space-y-6">
            <div>
                <button onClick={() => router.push('/admin/elections')} className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm mb-2 transition-colors">
                    <ArrowLeft size={16} /> Back to Elections
                </button>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <ChartBar size={28} weight="duotone" className="text-cyan-400" />
                    Results
                </h1>
                <p className="text-slate-500 mt-1">{data.election.name} — {data.election.constituency}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-mono mb-1">Total Voters</p>
                    <p className="text-2xl font-bold font-mono">{data.total_voters}</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-mono mb-1">Votes Cast</p>
                    <p className="text-2xl font-bold font-mono text-green-400">{data.total_votes}</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-mono mb-1">Voted</p>
                    <p className="text-2xl font-bold font-mono text-blue-400">{data.voted_voters}</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-mono mb-1">Turnout</p>
                    <p className="text-2xl font-bold font-mono text-yellow-400">{data.turnout_percentage}%</p>
                </div>
            </div>

            {data.election.status !== 'COMPLETED' ? (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-12 text-center text-slate-400 mt-8">
                    <Crown size={48} weight="duotone" className="mx-auto mb-4 text-slate-600" />
                    <h2 className="text-xl font-chivo mb-2">Results are Hidden</h2>
                    <p>Candidate tallies and the winner will be unveiled automatically when the election ends.</p>
                </div>
            ) : (
                <>
                    {/* Winner */}
                    {data.winner && (
                        <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-700/40 rounded-xl p-6 flex items-center gap-4">
                            {data.winner.symbol ? (
                                <img src={api.getImageUrl(data.winner.symbol)} alt={data.winner.party} className="w-14 h-14 object-contain rounded-lg bg-slate-900/50 border border-yellow-700/30 p-1" />
                            ) : (
                                <Crown size={40} weight="fill" className="text-yellow-400 animate-vote-pulse" />
                            )}
                            <div>
                                <p className="text-yellow-400 text-xs uppercase tracking-widest font-mono mb-1">Winner</p>
                                <p className="text-2xl font-chivo font-bold text-yellow-200">{data.winner.candidate_name}</p>
                                <p className="text-yellow-400/70 text-sm">{data.winner.party} — {data.winner.vote_count} votes</p>
                            </div>
                        </div>
                    )}

                    {/* Results Bar Chart */}
                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-sm p-6">
                        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Trophy size={16} weight="duotone" />
                            Vote Distribution
                        </h3>
                        <div className="space-y-4">
                            {data.results.map((r, i) => (
                                <div key={r.candidate_id} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-slate-500 w-4">{i + 1}.</span>
                                            {r.symbol && (
                                                <img src={api.getImageUrl(r.symbol)} alt={r.party} className="w-7 h-7 object-contain rounded bg-slate-900/50 border border-slate-700/50 p-0.5" />
                                            )}
                                            <span className="text-sm font-medium">{r.candidate_name}</span>
                                            <span className="text-xs text-slate-500 font-mono">({r.party})</span>
                                        </div>
                                        <span className="text-sm font-bold font-mono text-blue-400">{r.vote_count}</span>
                                    </div>
                                    <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                                            style={{ width: `${(r.vote_count / maxVotes) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
