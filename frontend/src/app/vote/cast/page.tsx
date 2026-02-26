'use client';

import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle, Warning, ShieldWarning, SealCheck, ArrowRight, ArrowLeft, LockKey } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Candidate {
    id: string;
    name: string;
    party: string;
    symbol: string;
    constituency: string;
}

export default function CastVotePage() {
    const router = useRouter();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [confirmStep, setConfirmStep] = useState(0); // 0=none, 1=review, 2=warning, 3=final
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState('');
    const [electionId, setElectionId] = useState('');
    const [electionName, setElectionName] = useState('');

    useEffect(() => {
        const eId = sessionStorage.getItem('voter_election_id');
        const constituency = sessionStorage.getItem('voter_constituency');
        const eName = sessionStorage.getItem('voter_election_name');

        if (!eId || !constituency) {
            router.replace('/vote');
            return;
        }

        setElectionId(eId || '');
        setElectionName(eName || '');

        async function fetchCandidates() {
            try {
                const data = await api.getVoteCandidates(eId!, constituency!);
                setCandidates(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load candidates');
            } finally {
                setLoading(false);
            }
        }

        fetchCandidates();
    }, [router]);

    const handleVote = async () => {
        if (!selectedCandidate) return;
        setVoting(true);
        setError('');
        try {
            await api.castVote(selectedCandidate, electionId);
            sessionStorage.clear();
            api.clearToken();
            router.push('/vote/success');
        } catch (err: any) {
            setError(err.message || 'Failed to cast vote');
            setConfirmStep(0);
        } finally {
            setVoting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    <Fingerprint size={48} className="text-green-500 animate-pulse mx-auto" />
                    <div className="text-slate-500 font-mono text-sm animate-pulse">LOADING BALLOT...</div>
                </div>
            </div>
        );
    }

    const selectedCandidateData = candidates.find((c) => c.id === selectedCandidate);

    return (
        <div className="min-h-screen relative"
            style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <div className="scanlines" />

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <Fingerprint size={40} weight="duotone" className="text-green-400 mx-auto mb-3" />
                    <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider">
                        Select Your Candidate
                    </h1>
                    {electionName && <p className="text-slate-400 text-sm mt-1">{electionName}</p>}
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-800 rounded-sm p-3 mb-6 text-sm text-red-400 text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {candidates.map((candidate) => (
                        <button
                            key={candidate.id}
                            onClick={() => setSelectedCandidate(candidate.id)}
                            className={`relative p-6 rounded-sm border-2 transition-all duration-200 text-left ${selectedCandidate === candidate.id
                                ? 'border-green-500 bg-green-950/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                                : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                                }`}
                        >
                            {selectedCandidate === candidate.id && (
                                <div className="absolute top-3 right-3">
                                    <CheckCircle size={24} weight="fill" className="text-green-400" />
                                </div>
                            )}
                            <div className="w-16 h-16 mb-3 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-center overflow-hidden">
                                {candidate.symbol ? (
                                    <img src={api.getImageUrl(candidate.symbol)} alt={candidate.party} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <span className="text-3xl">🗳️</span>
                                )}
                            </div>
                            <h3 className="text-lg font-chivo font-bold uppercase tracking-wider">{candidate.name}</h3>
                            <p className="text-slate-400 text-sm mt-1 font-mono">{candidate.party}</p>
                            <p className="text-slate-500 text-xs mt-1">{candidate.constituency}</p>
                        </button>
                    ))}
                </div>

                {candidates.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 font-mono">No candidates found for your constituency</p>
                    </div>
                )}

                {selectedCandidate && confirmStep === 0 && (
                    <div className="text-center">
                        <button
                            onClick={() => setConfirmStep(1)}
                            className="bg-green-600 hover:bg-green-500 text-white rounded-sm font-medium tracking-wide uppercase text-sm px-8 py-3 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all inline-flex items-center gap-2"
                        >
                            Submit Vote <ArrowRight size={16} weight="bold" />
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════ */}
                {/* MULTI-STEP CONFIRMATION MODAL                       */}
                {/* Step 1: Review → Step 2: Warning → Step 3: Final    */}
                {/* ═══════════════════════════════════════════════════ */}
                {confirmStep > 0 && selectedCandidateData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-0 max-w-md w-full mx-4 animate-scale-in overflow-hidden shadow-2xl shadow-black/50">

                            {/* Progress Bar */}
                            <div className="flex h-1.5 bg-slate-800">
                                <div className={`h-full transition-all duration-500 ${confirmStep >= 1 ? 'bg-blue-500' : 'bg-slate-700'}`} style={{ width: '33.33%' }} />
                                <div className={`h-full transition-all duration-500 ${confirmStep >= 2 ? 'bg-yellow-500' : 'bg-slate-700'}`} style={{ width: '33.33%' }} />
                                <div className={`h-full transition-all duration-500 ${confirmStep >= 3 ? 'bg-green-500' : 'bg-slate-700'}`} style={{ width: '33.33%' }} />
                            </div>

                            <div className="p-8">
                                {/* ════════════════════════════════════ */}
                                {/* STEP 1: Review Your Choice           */}
                                {/* ════════════════════════════════════ */}
                                {confirmStep === 1 && (
                                    <>
                                        <div className="text-center mb-6">
                                            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <SealCheck size={32} weight="duotone" className="text-blue-400" />
                                            </div>
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <span className="text-blue-400 font-mono text-xs uppercase tracking-wider">Step 1 of 3</span>
                                            </div>
                                            <h2 className="text-xl font-chivo font-bold uppercase tracking-wider">Review Your Choice</h2>
                                            <p className="text-slate-400 text-sm mt-1">Please verify your selected candidate</p>
                                        </div>

                                        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-5 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {selectedCandidateData.symbol ? (
                                                        <img src={api.getImageUrl(selectedCandidateData.symbol)} alt={selectedCandidateData.party} className="w-full h-full object-contain p-1.5" />
                                                    ) : (
                                                        <span className="text-2xl">🗳️</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-chivo font-bold text-lg text-white">{selectedCandidateData.name}</p>
                                                    <p className="text-slate-400 text-sm font-mono">{selectedCandidateData.party}</p>
                                                    <p className="text-slate-500 text-xs mt-0.5">{selectedCandidateData.constituency}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setConfirmStep(0)}
                                                className="flex-1 py-2.5 px-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ArrowLeft size={14} /> Change
                                            </button>
                                            <button
                                                onClick={() => setConfirmStep(2)}
                                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium text-sm py-2.5 px-4 transition-colors flex items-center justify-center gap-1"
                                            >
                                                Continue <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* ════════════════════════════════════ */}
                                {/* STEP 2: Important Warning            */}
                                {/* ════════════════════════════════════ */}
                                {confirmStep === 2 && (
                                    <>
                                        <div className="text-center mb-6">
                                            <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <ShieldWarning size={32} weight="duotone" className="text-yellow-400" />
                                            </div>
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <span className="text-yellow-400 font-mono text-xs uppercase tracking-wider">Step 2 of 3</span>
                                            </div>
                                            <h2 className="text-xl font-chivo font-bold uppercase tracking-wider">Important Notice</h2>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="bg-yellow-950/20 border border-yellow-800/40 rounded-md p-3 flex items-start gap-3">
                                                <Warning size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-yellow-200/80 text-sm">Your vote is <strong>final and irreversible</strong>. Once submitted, it cannot be changed or withdrawn.</p>
                                            </div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-md p-3 flex items-start gap-3">
                                                <LockKey size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-slate-300/80 text-sm">Your vote will be recorded <strong>anonymously</strong>. No one can trace your vote back to you.</p>
                                            </div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-md p-3 flex items-start gap-3">
                                                <Fingerprint size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-slate-300/80 text-sm">You can only vote <strong>once</strong> per election. Multiple voting attempts will be blocked.</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/60 border border-slate-800 rounded-md p-3 mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-slate-800/80 border border-slate-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {selectedCandidateData.symbol ? (
                                                    <img src={api.getImageUrl(selectedCandidateData.symbol)} alt={selectedCandidateData.party} className="w-full h-full object-contain p-0.5" />
                                                ) : (
                                                    <span className="text-lg">🗳️</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{selectedCandidateData.name}</p>
                                                <p className="text-xs text-slate-400 font-mono">{selectedCandidateData.party}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setConfirmStep(1)}
                                                className="flex-1 py-2.5 px-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ArrowLeft size={14} /> Back
                                            </button>
                                            <button
                                                onClick={() => setConfirmStep(3)}
                                                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md font-medium text-sm py-2.5 px-4 transition-colors flex items-center justify-center gap-1"
                                            >
                                                I Understand <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* ════════════════════════════════════ */}
                                {/* STEP 3: Final Confirmation           */}
                                {/* ════════════════════════════════════ */}
                                {confirmStep === 3 && (
                                    <>
                                        <div className="text-center mb-6">
                                            <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle size={32} weight="duotone" className="text-green-400" />
                                            </div>
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <span className="text-green-400 font-mono text-xs uppercase tracking-wider">Step 3 of 3</span>
                                            </div>
                                            <h2 className="text-xl font-chivo font-bold uppercase tracking-wider">Final Confirmation</h2>
                                            <p className="text-slate-400 text-sm mt-1">Press the button below to cast your vote</p>
                                        </div>

                                        <div className="bg-green-950/20 border border-green-800/40 rounded-lg p-5 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-lg bg-slate-800/80 border border-green-700/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {selectedCandidateData.symbol ? (
                                                        <img src={api.getImageUrl(selectedCandidateData.symbol)} alt={selectedCandidateData.party} className="w-full h-full object-contain p-1.5" />
                                                    ) : (
                                                        <span className="text-2xl">🗳️</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-green-400 uppercase font-mono tracking-wider mb-1">Your Vote</p>
                                                    <p className="font-chivo font-bold text-lg text-white">{selectedCandidateData.name}</p>
                                                    <p className="text-slate-400 text-sm font-mono">{selectedCandidateData.party}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setConfirmStep(2)}
                                                className="flex-1 py-2.5 px-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                disabled={voting}
                                            >
                                                <ArrowLeft size={14} /> Back
                                            </button>
                                            <button
                                                onClick={handleVote}
                                                disabled={voting}
                                                className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-md font-bold tracking-wide uppercase text-sm py-3 px-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {voting ? (
                                                    <>
                                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                        Casting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <SealCheck size={18} weight="fill" /> Cast My Vote
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
