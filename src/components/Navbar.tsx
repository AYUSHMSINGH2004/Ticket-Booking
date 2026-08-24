"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Ticket } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center mb-8">
      <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white tracking-tighter">
        <Ticket className="text-accent w-8 h-8" />
        Book<span className="text-accent">My</span>Show
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-300">Hi, {user.email}</span>
            {user.role === 'ADMIN' && <Link href="/admin" className="text-sm hover:text-accent transition">Admin</Link>}
            {user.role === 'ORGANISER' && <Link href="/organiser" className="text-sm hover:text-accent transition">Dashboard</Link>}
            <Link href="/history" className="text-sm hover:text-accent transition">My Tickets</Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-full transition">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm hover:text-accent transition">Login</Link>
            <Link href="/register" className="px-4 py-2 text-sm bg-accent hover:bg-indigo-500 rounded-full text-white transition shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
