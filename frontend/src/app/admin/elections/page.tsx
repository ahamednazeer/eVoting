'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { ListBullets, Plus, Play, Stop, Trash, PencilSimple, Users, UserCircle, ChartBar } from '@phosphor-icons/react';

interface Election {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    constituency: string;
    status: string;
    created_at: string;
}

export default function ElectionsPage() {
    const router = useRouter();
    const [elections, setElections] = useState<Election[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingElection, setEditingElection] = useState<Election | null>(null);
    const [form, setForm] = useState({ name: '', start_date: '', end_date: '', constituency: '' });

    const fetchElections = async () => {
        try {
            const data = await api.getElections();
            setElections(data);
        } catch (error) {
            console.error('Failed to fetch elections:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchElections(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingElection) {
                await api.updateElection(editingElection.id, form);
            } else {
                await api.createElection(form);
            }
            setShowModal(false);
            setEditingElection(null);
            setForm({ name: '', start_date: '', end_date: '', constituency: '' });
            fetchElections();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = (election: Election) => {
        setEditingElection(election);
        setForm({
            name: election.name,
            start_date: election.start_date,
            end_date: election.end_date,
            constituency: election.constituency,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this election? This will also delete all associated candidates, voters, and votes.')) return;
        try {
            await api.deleteElection(id);
            fetchElections();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleStart = async (id: string) => {
        try {
            await api.startElection(id);
            fetchElections();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEnd = async (id: string) => {
        if (!confirm('End this election? Voting will be stopped.')) return;
        try {
            await api.endElection(id);
            fetchElections();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const columns = [
        { key: 'name' as keyof Election, label: 'Election Name' },
        { key: 'constituency' as keyof Election, label: 'Constituency' },
        { key: 'start_date' as keyof Election, label: 'Start Date', render: (e: Election) => <span className="font-mono text-slate-400">{e.start_date}</span> },
        { key: 'end_date' as keyof Election, label: 'End Date', render: (e: Election) => <span className="font-mono text-slate-400">{e.end_date}</span> },
        { key: 'status' as keyof Election, label: 'Status', render: (e: Election) => <StatusBadge status={e.status} /> },
        {
            key: 'actions' as any, label: 'Actions', render: (e: Election) => (
                <div className="flex items-center gap-2">
                    {e.status === 'INACTIVE' && (
                        <>
                            <button onClick={(ev) => { ev.stopPropagation(); handleStart(e.id); }} className="p-1.5 text-green-400 hover:bg-green-950/50 rounded transition-colors" title="Start Election">
                                <Play size={16} weight="fill" />
                            </button>
                            <button onClick={(ev) => { ev.stopPropagation(); handleEdit(e); }} className="p-1.5 text-blue-400 hover:bg-blue-950/50 rounded transition-colors" title="Edit">
                                <PencilSimple size={16} />
                            </button>
                            <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }} className="p-1.5 text-red-400 hover:bg-red-950/50 rounded transition-colors" title="Delete">
                                <Trash size={16} />
                            </button>
                        </>
                    )}
                    {e.status === 'ACTIVE' && (
                        <button onClick={(ev) => { ev.stopPropagation(); handleEnd(e.id); }} className="p-1.5 text-red-400 hover:bg-red-950/50 rounded transition-colors" title="End Election">
                            <Stop size={16} weight="fill" />
                        </button>
                    )}
                    <button onClick={(ev) => { ev.stopPropagation(); router.push(`/admin/elections/${e.id}/candidates`); }} className="p-1.5 text-purple-400 hover:bg-purple-950/50 rounded transition-colors" title="Candidates">
                        <UserCircle size={16} />
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); router.push(`/admin/elections/${e.id}/voters`); }} className="p-1.5 text-yellow-400 hover:bg-yellow-950/50 rounded transition-colors" title="Voters">
                        <Users size={16} />
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); router.push(`/admin/elections/${e.id}/results`); }} className="p-1.5 text-cyan-400 hover:bg-cyan-950/50 rounded transition-colors" title="Results">
                        <ChartBar size={16} />
                    </button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Elections...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                        <ListBullets size={28} weight="duotone" className="text-blue-400" />
                        Elections
                    </h1>
                    <p className="text-slate-500 mt-1">Manage all elections</p>
                </div>
                <button onClick={() => { setEditingElection(null); setForm({ name: '', start_date: '', end_date: '', constituency: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
                    <Plus size={16} weight="bold" /> Create Election
                </button>
            </div>

            <DataTable data={elections} columns={columns} emptyMessage="No elections created yet" />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingElection ? 'Edit Election' : 'Create Election'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Election Name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-modern" placeholder="e.g., General Election 2024" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Constituency</label>
                        <input type="text" value={form.constituency} onChange={(e) => setForm({ ...form, constituency: e.target.value })} required className="input-modern" placeholder="e.g., District 1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Start Date</label>
                            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required className="input-modern" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">End Date</label>
                            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required className="input-modern" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">{editingElection ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
