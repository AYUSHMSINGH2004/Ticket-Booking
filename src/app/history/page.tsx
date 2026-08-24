"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { QrCode, Ticket, XCircle } from 'lucide-react';
import Image from 'next/image';

export default function History() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      });
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to cancel');
      fetchBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center mt-12">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-white mb-8">My Tickets</h1>
      
      {bookings.length === 0 && (
        <div className="text-center text-gray-500 py-12 glass-panel rounded-2xl">
          You have no bookings yet.
        </div>
      )}

      {bookings.map((booking: any) => (
        <div key={booking.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col md:flex-row relative">
          {booking.status === 'CANCELLED' && (
            <div className="absolute inset-0 bg-red-900/20 backdrop-blur-sm z-10 flex items-center justify-center pointer-events-none">
              <span className="text-red-500 font-black text-6xl tracking-widest opacity-50 rotate-[-15deg] uppercase border-4 border-red-500 px-8 py-4 rounded-xl">Cancelled</span>
            </div>
          )}
          
          <div className="p-8 flex-1 border-r border-white/10">
            <h2 className="text-3xl font-bold text-white mb-2">{booking.event.name}</h2>
            <p className="text-accent mb-6">{format(new Date(booking.event.date), 'PPPP at p')}</p>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Venue</p>
                <p className="text-white font-medium">{booking.event.venue.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Seats ({booking.seats.length})</p>
                <p className="text-white font-medium">{booking.seats.map((s:any) => s.row+s.col).join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Paid</p>
                <p className="text-white font-medium">${booking.totalAmount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Booking ID</p>
                <p className="text-white font-medium text-xs font-mono">{booking.id}</p>
              </div>
            </div>

            {booking.status === 'CONFIRMED' && (
              <button 
                onClick={() => handleCancel(booking.id)}
                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition"
              >
                <XCircle className="w-4 h-4" /> Cancel Booking
              </button>
            )}
          </div>
          
          <div className="p-8 flex flex-col items-center justify-center bg-white/5 md:w-64 border-l border-white/5 border-dashed">
            {booking.qrCodeUrl && booking.status === 'CONFIRMED' ? (
              <>
                <div className="bg-white p-2 rounded-xl mb-4">
                  <Image src={booking.qrCodeUrl} alt="QR Code" width={150} height={150} />
                </div>
                <p className="text-gray-400 text-xs text-center">Scan at the entrance</p>
              </>
            ) : (
              <Ticket className="w-16 h-16 text-gray-600 mb-4" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
