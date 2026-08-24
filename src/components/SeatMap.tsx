"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Seat {
  id: string;
  row: string;
  col: number;
  category: string;
  status: string;
  heldByUserId: string | null;
}

export default function SeatMap({ eventId, pricing }: { eventId: string, pricing: any[] }) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [booking, setBooking] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchSeats();
    // Real-time updates could be implemented here with polling or websockets.
    // We'll use a simple polling for demonstration (every 10s).
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchSeats = () => {
    fetch(`/api/events/${eventId}/seats`)
      .then(res => res.json())
      .then(data => {
        setSeats(data);
        setLoading(false);
      });
  };

  const toggleSeat = (seatId: string) => {
    if (holdSuccess) return; // Cannot change selection during checkout
    setSelectedSeats(prev => 
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const handleHold = async () => {
    if (selectedSeats.length === 0) return;
    setHolding(true);
    setError('');
    
    try {
      const res = await fetch(`/api/events/${eventId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: selectedSeats })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to hold seats');
      
      setHoldSuccess(true);
      fetchSeats();
    } catch (err: any) {
      setError(err.message);
      fetchSeats(); // Refresh map in case of concurrency conflict
      setSelectedSeats([]);
    } finally {
      setHolding(false);
    }
  };

  const handleBook = async () => {
    setBooking(true);
    setError('');
    
    try {
      const res = await fetch(`/api/events/${eventId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: selectedSeats })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book seats');
      
      router.push('/history');
    } catch (err: any) {
      setError(err.message);
      setHoldSuccess(false);
      fetchSeats();
    } finally {
      setBooking(false);
    }
  };

  const handleWaitlist = async (category: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Successfully joined waitlist for ' + category);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>;

  // Group seats by row
  const rows = seats.reduce((acc: any, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const selectedTotal = selectedSeats.reduce((total, id) => {
    const seat = seats.find(s => s.id === id);
    if (!seat) return total;
    const p = pricing.find(p => p.category === seat.category)?.price || 0;
    return total + p;
  }, 0);

  // Check if categories are sold out
  const categories = [...new Set(seats.map(s => s.category))];
  const soldOutCategories = categories.filter(c => 
    seats.filter(s => s.category === c).every(s => s.status !== 'AVAILABLE')
  );

  return (
    <div>
      {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl mb-6">{error}</div>}
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-[50%] opacity-50 mb-8" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.5)' }}></div>
        <span className="text-gray-500 text-sm tracking-[0.5em] uppercase">Screen</span>
      </div>

      <div className="flex flex-col gap-4 overflow-x-auto pb-4">
        {Object.keys(rows).sort().map(rowName => (
          <div key={rowName} className="flex justify-center items-center gap-4">
            <span className="w-8 font-bold text-gray-400 text-right">{rowName}</span>
            <div className="flex gap-2">
              {rows[rowName].sort((a: any, b: any) => a.col - b.col).map((seat: Seat) => {
                const isSelected = selectedSeats.includes(seat.id);
                const isAvailable = seat.status === 'AVAILABLE';
                const isHeld = seat.status === 'HELD';
                
                let bgClass = 'bg-white/10 hover:bg-white/30 border-transparent';
                if (isSelected) bgClass = 'bg-accent border-accent shadow-[0_0_10px_rgba(79,70,229,0.5)] text-white';
                else if (isHeld) bgClass = 'bg-yellow-500/20 border-yellow-500/50 cursor-not-allowed';
                else if (!isAvailable) bgClass = 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-50';
                
                // Color code by category if available
                if (isAvailable && !isSelected) {
                  if (seat.category === 'PREMIUM') bgClass = 'bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/30';
                }

                return (
                  <button
                    key={seat.id}
                    disabled={!isAvailable || holdSuccess}
                    onClick={() => toggleSeat(seat.id)}
                    className={`seat w-10 h-10 rounded-t-lg rounded-b-sm border transition-all text-xs flex items-center justify-center ${bgClass}`}
                    title={`${seat.category} - Row ${seat.row} Col ${seat.col}`}
                  >
                    {seat.col}
                  </button>
                );
              })}
            </div>
            <span className="w-8"></span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400 border-t border-white/10 pt-8">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-purple-500/20 border border-purple-500/30 rounded-t-sm"></div> Premium Available</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white/10 rounded-t-sm"></div> Standard Available</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-accent rounded-t-sm shadow-[0_0_5px_rgba(79,70,229,0.5)]"></div> Selected</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/50 rounded-t-sm"></div> Held</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-800 rounded-t-sm"></div> Booked</div>
      </div>

      {soldOutCategories.length > 0 && (
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-4">
          <p className="text-gray-300">Some categories are sold out. Join the waitlist!</p>
          <div className="flex gap-4">
            {soldOutCategories.map(cat => (
              <button key={cat} onClick={() => handleWaitlist(cat)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition text-sm">
                Join {cat} Waitlist
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 glass-panel border-t border-white/10 animate-in slide-in-from-bottom">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-gray-300 mb-1">{selectedSeats.length} seat(s) selected</p>
              <p className="text-2xl font-bold text-white">${selectedTotal}</p>
            </div>
            <div>
              {!holdSuccess ? (
                <button 
                  onClick={handleHold} 
                  disabled={holding}
                  className="px-8 py-3 bg-accent hover:bg-indigo-500 text-white rounded-full font-semibold transition shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 flex items-center gap-2"
                >
                  {holding && <Loader2 className="w-5 h-5 animate-spin" />}
                  Hold Tickets
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-yellow-400 text-sm text-right">
                    <p>Seats held for 10:00</p>
                    <p>Complete checkout now</p>
                  </div>
                  <button 
                    onClick={handleBook}
                    disabled={booking}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 flex items-center gap-2"
                  >
                    {booking && <Loader2 className="w-5 h-5 animate-spin" />}
                    Pay & Book
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
