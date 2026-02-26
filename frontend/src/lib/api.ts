const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
    private token: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('evoting_token');
        }
    }

    getToken() {
        return this.token;
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('evoting_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('evoting_token');
        }
    }

    private async request(path: string, options: RequestInit = {}) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const res = await fetch(`${API_URL}${path}`, { ...options, headers });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }

        return res.json();
    }

    // Auth
    login(username: string, password: string) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    getMe() {
        return this.request('/api/auth/me');
    }

    // Elections
    getElections() {
        return this.request('/api/elections');
    }

    getElection(id: string) {
        return this.request(`/api/elections/${id}`);
    }

    createElection(data: any) {
        return this.request('/api/elections', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    updateElection(id: string, data: any) {
        return this.request(`/api/elections/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    deleteElection(id: string) {
        return this.request(`/api/elections/${id}`, { method: 'DELETE' });
    }

    startElection(id: string) {
        return this.request(`/api/elections/${id}/start`, { method: 'POST' });
    }

    endElection(id: string) {
        return this.request(`/api/elections/${id}/end`, { method: 'POST' });
    }

    // Multipart upload (for file uploads)
    private async uploadRequest(path: string, formData: FormData, method: string = 'POST') {
        const headers: Record<string, string> = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        // Don't set Content-Type — browser will set it with boundary for multipart
        const res = await fetch(`${API_URL}${path}`, { method, headers, body: formData });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }
        return res.json();
    }

    // Candidates
    getCandidates(electionId: string) {
        return this.request(`/api/candidates?election_id=${electionId}`);
    }

    createCandidate(data: any, symbolFile?: File) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('party', data.party);
        formData.append('constituency', data.constituency);
        formData.append('election_id', data.election_id.toString());
        if (symbolFile) {
            formData.append('symbol', symbolFile);
        }
        return this.uploadRequest('/api/candidates', formData, 'POST');
    }

    updateCandidate(id: string, data: any, symbolFile?: File) {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.party) formData.append('party', data.party);
        if (data.constituency) formData.append('constituency', data.constituency);
        if (data.election_id) formData.append('election_id', data.election_id.toString());
        if (symbolFile) {
            formData.append('symbol', symbolFile);
        }
        return this.uploadRequest(`/api/candidates/${id}`, formData, 'PUT');
    }

    deleteCandidate(id: string) {
        return this.request(`/api/candidates/${id}`, { method: 'DELETE' });
    }

    getImageUrl(path: string) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`;
    }

    // Voters
    getVoters(electionId: string) {
        return this.request(`/api/voters?election_id=${electionId}`);
    }

    createVoter(data: any) {
        return this.request('/api/voters', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    updateVoter(id: string, data: any) {
        return this.request(`/api/voters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    deleteVoter(id: string) {
        return this.request(`/api/voters/${id}`, { method: 'DELETE' });
    }

    // OTP — secured with API key
    sendOtp(mobile: string) {
        return this.request('/api/otp/send', {
            method: 'POST',
            body: JSON.stringify({ mobile }),
            headers: { 'x-api-key': process.env.NEXT_PUBLIC_OTP_API_KEY || '' } as any,
        });
    }

    verifyOtp(mobile: string, otp: string) {
        return this.request('/api/otp/verify', {
            method: 'POST',
            body: JSON.stringify({ mobile, otp }),
            headers: { 'x-api-key': process.env.NEXT_PUBLIC_OTP_API_KEY || '' } as any,
        });
    }

    // Voting
    getVoteCandidates(electionId: string, constituency: string) {
        return this.request(`/api/vote/candidates?election_id=${electionId}&constituency=${constituency}`);
    }

    castVote(candidateId: string, electionId: string) {
        return this.request('/api/vote/cast', {
            method: 'POST',
            body: JSON.stringify({ candidate_id: candidateId, election_id: electionId }),
        });
    }

    // Results
    getDashboardStats() {
        return this.request('/api/results/dashboard');
    }

    getResults(electionId: string) {
        return this.request(`/api/results/${electionId}`);
    }
}

export const api = new ApiClient();
