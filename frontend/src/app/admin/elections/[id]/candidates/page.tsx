'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { UserCircle, Plus, PencilSimple, Trash, ArrowLeft, UploadSimple, Image as ImageIcon } from '@phosphor-icons/react';

interface Candidate {
    id: string;
    name: string;
    party: string;
    symbol: string;
    constituency: string;
    election_id: string;
}

export default function CandidatesPage() {
    const params = useParams();
    const router = useRouter();
    const electionId = params.id as string;
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [election, setElection] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [form, setForm] = useState({ name: '', party: '', constituency: '' });
    const [symbolFile, setSymbolFile] = useState<File | null>(null);
    const [symbolPreview, setSymbolPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        try {
            const [candidatesData, electionData] = await Promise.all([
                api.getCandidates(electionId),
                api.getElection(electionId),
            ]);
            setCandidates(candidatesData);
            setElection(electionData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [electionId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('File size must be under 2MB');
                return;
            }
            setSymbolFile(file);
            const reader = new FileReader();
            reader.onload = () => setSymbolPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { ...form, election_id: electionId };
            if (editingCandidate) {
                await api.updateCandidate(editingCandidate.id, data, symbolFile || undefined);
            } else {
                await api.createCandidate(data, symbolFile || undefined);
            }
            setShowModal(false);
            setEditingCandidate(null);
            setForm({ name: '', party: '', constituency: '' });
            setSymbolFile(null);
            setSymbolPreview('');
            fetchData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setForm({ name: candidate.name, party: candidate.party, constituency: candidate.constituency });
        setSymbolFile(null);
        setSymbolPreview(candidate.symbol ? api.getImageUrl(candidate.symbol) : '');
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this candidate?')) return;
        try {
            await api.deleteCandidate(id);
            fetchData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const openCreateModal = () => {
        setEditingCandidate(null);
        setForm({ name: '', party: '', constituency: election?.constituency || '' });
        setSymbolFile(null);
        setSymbolPreview('');
        setShowModal(true);
    };

    const columns = [
        {
            key: 'symbol' as keyof Candidate, label: 'Symbol', render: (c: Candidate) => (
                c.symbol ? (
                    <img src={api.getImageUrl(c.symbol)} alt={c.party} className="w-10 h-10 object-contain rounded bg-slate-900/50 border border-slate-700/50 p-0.5" />
                ) : (
                    <div className="w-10 h-10 rounded bg-slate-900/50 border border-slate-700/50 flex items-center justify-center">
                        <ImageIcon size={16} className="text-slate-600" />
                    </div>
                )
            ),
        },
        { key: 'name' as keyof Candidate, label: 'Candidate Name' },
        { key: 'party' as keyof Candidate, label: 'Party' },
        { key: 'constituency' as keyof Candidate, label: 'Constituency' },
        {
            key: 'actions' as any, label: 'Actions', render: (c: Candidate) => (
                <div className="flex items-center gap-2">
                    <button onClick={(ev) => { ev.stopPropagation(); handleEdit(c); }} className="p-1.5 text-blue-400 hover:bg-blue-950/50 rounded transition-colors" title="Edit">
                        <PencilSimple size={16} />
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); handleDelete(c.id); }} className="p-1.5 text-red-400 hover:bg-red-950/50 rounded transition-colors" title="Delete">
                        <Trash size={16} />
                    </button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-purple-500 animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Candidates...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <button onClick={() => router.push('/admin/elections')} className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm mb-2 transition-colors">
                        <ArrowLeft size={16} /> Back to Elections
                    </button>
                    <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                        <UserCircle size={28} weight="duotone" className="text-purple-400" />
                        Candidates
                    </h1>
                    <p className="text-slate-500 mt-1">{election?.name} — {election?.constituency}</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={16} weight="bold" /> Add Candidate
                </button>
            </div>

            <DataTable data={candidates} columns={columns} emptyMessage="No candidates added yet" />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Symbol Upload */}
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Party Symbol</label>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 rounded-lg bg-slate-900/80 border-2 border-dashed border-slate-600 hover:border-blue-500 flex items-center justify-center cursor-pointer transition-colors overflow-hidden"
                            >
                                {symbolPreview ? (
                                    <img src={symbolPreview} alt="Symbol" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <UploadSimple size={24} className="text-slate-500" />
                                )}
                            </div>
                            <div className="text-sm">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    {symbolPreview ? 'Change Image' : 'Upload Image'}
                                </button>
                                <p className="text-slate-500 text-xs mt-1">JPG, PNG, SVG, WebP — max 2MB</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Candidate Name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-modern" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Party</label>
                        <input type="text" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} required className="input-modern" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Constituency</label>
                        <input type="text" value={form.constituency} onChange={(e) => setForm({ ...form, constituency: e.target.value })} required className="input-modern" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">{editingCandidate ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
