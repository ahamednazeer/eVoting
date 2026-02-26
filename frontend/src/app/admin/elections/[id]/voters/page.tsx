'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { Users, Plus, PencilSimple, Trash, ArrowLeft } from '@phosphor-icons/react';

interface Voter {
    id: string;
    name: string;
    voter_id_number: string;
    mobile: string;
    constituency: string;
    has_voted: boolean;
    election_id: string;
}

export default function VotersPage() {
    const params = useParams();
    const router = useRouter();
    const electionId = params.id as string;
    const [voters, setVoters] = useState<Voter[]>([]);
    const [election, setElection] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
    const [form, setForm] = useState({ name: '', voter_id_number: '', mobile: '', constituency: '' });

    const fetchData = async () => {
        try {
            const [votersData, electionData] = await Promise.all([
                api.getVoters(electionId),
                api.getElection(electionId),
            ]);
            setVoters(votersData);
            setElection(electionData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [electionId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { ...form, election_id: electionId };
            if (editingVoter) {
                await api.updateVoter(editingVoter.id, data);
            } else {
                await api.createVoter(data);
            }
            setShowModal(false);
            setEditingVoter(null);
            setForm({ name: '', voter_id_number: '', mobile: '', constituency: '' });
            fetchData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = (voter: Voter) => {
        setEditingVoter(voter);
        setForm({ name: voter.name, voter_id_number: voter.voter_id_number, mobile: voter.mobile, constituency: voter.constituency });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this voter?')) return;
        try {
            await api.deleteVoter(id);
            fetchData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const columns = [
        { key: 'name' as keyof Voter, label: 'Name' },
        { key: 'voter_id_number' as keyof Voter, label: 'Voter ID', render: (v: Voter) => <span className="font-mono">{v.voter_id_number}</span> },
        { key: 'mobile' as keyof Voter, label: 'Mobile', render: (v: Voter) => <span className="font-mono">{v.mobile}</span> },
        { key: 'constituency' as keyof Voter, label: 'Constituency' },
        { key: 'has_voted' as keyof Voter, label: 'Voted', render: (v: Voter) => <StatusBadge status={v.has_voted ? 'TRUE' : 'FALSE'} /> },
        {
            key: 'actions' as any, label: 'Actions', render: (v: Voter) => (
                <div className="flex items-center gap-2">
                    <button onClick={(ev) => { ev.stopPropagation(); handleEdit(v); }} className="p-1.5 text-blue-400 hover:bg-blue-950/50 rounded transition-colors" title="Edit">
                        <PencilSimple size={16} />
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); handleDelete(v.id); }} className="p-1.5 text-red-400 hover:bg-red-950/50 rounded transition-colors" title="Delete">
                        <Trash size={16} />
                    </button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-yellow-500 animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Voters...</p>
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
                        <Users size={28} weight="duotone" className="text-yellow-400" />
                        Voters
                    </h1>
                    <p className="text-slate-500 mt-1">{election?.name} — {voters.length} voters registered</p>
                </div>
                <button onClick={() => { setEditingVoter(null); setForm({ name: '', voter_id_number: '', mobile: '', constituency: election?.constituency || '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
                    <Plus size={16} weight="bold" /> Add Voter
                </button>
            </div>

            <DataTable data={voters} columns={columns} emptyMessage="No voters registered yet" />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingVoter ? 'Edit Voter' : 'Add Voter'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Voter Name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-modern" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Voter ID Number</label>
                        <input type="text" value={form.voter_id_number} onChange={(e) => setForm({ ...form, voter_id_number: e.target.value })} required className="input-modern" placeholder="e.g., VOT001" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Mobile Number</label>
                        <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required className="input-modern" placeholder="e.g., 9876543210" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Constituency</label>
                        <input type="text" value={form.constituency} onChange={(e) => setForm({ ...form, constituency: e.target.value })} required className="input-modern" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">{editingVoter ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
