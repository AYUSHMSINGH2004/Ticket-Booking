"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { BarChart3, Users, DollarSign } from 'lucide-react';

export default function OrganiserDashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organiser/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-12">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white mb-8">Organiser Dashboard</h1>

      <div className="grid grid-cols-1 gap-6">
        {stats.map((event) => (
          <div key={event.id} className="glass-panel rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">{event.name}</h2>
            <p className="text-accent mb-6">{format(new Date(event.date), 'PPPP')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${event.totalRevenue}</p>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Bookings</p>
                  <p className="text-2xl font-bold text-white">{event.totalBookings}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Occupancy</p>
                  <p className="text-2xl font-bold text-white">{Math.round(event.occupancy)}%</p>
                  <p className="text-xs text-gray-500">{event.soldSeats} / {event.totalSeats} seats</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="text-center text-gray-500 py-12 glass-panel rounded-2xl">
            You haven't organised any events yet.
          </div>
        )}
      </div>
    </div>
  );
}
