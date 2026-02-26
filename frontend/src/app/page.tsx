'use client';

import React from 'react';
import { Fingerprint, ShieldCheck, ChartBar, Lock, Users, ArrowRight } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative"
      style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
      <div className="absolute inset-0 bg-slate-950/80" />
      <div className="scanlines" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-md bg-slate-950/40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint size={32} weight="duotone" className="text-blue-400" />
              <span className="font-chivo font-bold text-lg uppercase tracking-wider">eVoting</span>
            </div>
            <button
              onClick={() => router.push('/admin/login')}
              className="text-slate-400 hover:text-slate-200 text-sm font-mono flex items-center gap-1.5 transition-colors"
            >
              <Lock size={14} /> Admin
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-950/40 border border-blue-700/30 rounded-full px-4 py-1.5 mb-8">
            <ShieldCheck size={16} className="text-blue-400" />
            <span className="text-blue-300 text-xs font-mono uppercase tracking-wider">Secure • Anonymous • Verified</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-chivo font-bold uppercase tracking-wider mb-6 leading-tight">
            <span className="text-gradient">Electronic</span> Voting<br />
            Made Secure
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            Cast your vote securely from anywhere. Our OTP-verified system ensures
            one person, one vote — with complete anonymity.
          </p>

          <button
            onClick={() => router.push('/vote')}
            className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white rounded-sm font-chivo font-bold tracking-wide uppercase text-lg px-10 py-4 shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-105"
          >
            <Fingerprint size={24} weight="duotone" />
            Cast Your Vote
            <ArrowRight size={20} weight="bold" />
          </button>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8 text-center hover:border-slate-600 transition-all group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-950/50 border border-blue-700/30 mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} weight="duotone" className="text-blue-400" />
              </div>
              <h3 className="font-chivo font-bold uppercase tracking-wider text-lg mb-2">OTP Verified</h3>
              <p className="text-slate-400 text-sm">Every voter is authenticated via SMS OTP before casting their vote. No unauthorized access.</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8 text-center hover:border-slate-600 transition-all group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-green-950/50 border border-green-700/30 mb-5 group-hover:scale-110 transition-transform">
                <Users size={28} weight="duotone" className="text-green-400" />
              </div>
              <h3 className="font-chivo font-bold uppercase tracking-wider text-lg mb-2">Anonymous Voting</h3>
              <p className="text-slate-400 text-sm">Your vote is stored without any link to your identity. Complete privacy guaranteed.</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8 text-center hover:border-slate-600 transition-all group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-950/50 border border-purple-700/30 mb-5 group-hover:scale-110 transition-transform">
                <ChartBar size={28} weight="duotone" className="text-purple-400" />
              </div>
              <h3 className="font-chivo font-bold uppercase tracking-wider text-lg mb-2">Real-Time Results</h3>
              <p className="text-slate-400 text-sm">Track election progress with live vote tallies, interactive charts, and instant winner declarations.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-6">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <p className="text-slate-600 text-xs font-mono">© 2024 eVoting System</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="text-slate-600 hover:text-slate-400 text-xs font-mono transition-colors"
            >
              Admin Panel →
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
