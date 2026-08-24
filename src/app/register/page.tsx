"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass-panel p-12 rounded-3xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
        <p className="text-gray-400 text-center mb-8">Join to book tickets and events</p>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Account Type</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition appearance-none"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="ORGANISER">Event Organiser</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold transition shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Register
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link href="/login" className="text-accent hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
