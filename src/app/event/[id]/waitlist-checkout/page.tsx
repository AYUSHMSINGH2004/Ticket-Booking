"use client";

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function WaitlistCheckoutContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const waitlistId = searchParams.get('waitlistId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/waitlist-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlistId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/history');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-panel p-12 rounded-3xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Complete Waitlist Booking</h1>
        <p className="text-gray-400 mb-8">You are claiming an available ticket from the waitlist.</p>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <button 
          onClick={handleCheckout} 
          disabled={loading || !waitlistId}
          className="w-full bg-accent hover:bg-indigo-500 text-white rounded-xl py-4 font-semibold transition shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          Pay & Confirm Ticket
        </button>
      </div>
    </div>
  );
}

export default function WaitlistCheckout() {
  return (
    <Suspense fallback={<div className="text-center mt-12">Loading...</div>}>
      <WaitlistCheckoutContent />
    </Suspense>
  );
}
