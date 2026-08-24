"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Discover Live Events
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Book your tickets for the most anticipated movies, concerts, and shows happening around you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <Link href={`/event/${event.id}`} key={event.id} className="group block">
            <div className="glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(79,70,229,0.2)]">
              <div className="h-48 bg-gradient-to-br from-indigo-900 to-purple-900 relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white drop-shadow-md">{event.name}</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center text-gray-300 gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  <span>{format(new Date(event.date), 'PPP p')}</span>
                </div>
                <div className="flex items-center text-gray-300 gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <span>{event.venue.name}, {event.venue.location}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="flex items-center text-gray-300 gap-2">
                    <Tag className="w-5 h-5 text-accent" />
                    <span>From ${Math.min(...event.pricing.map((p: any) => p.price))}</span>
                  </div>
                  <span className="text-accent font-semibold group-hover:underline">Book Now &rarr;</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">
            No upcoming events found.
          </div>
        )}
      </div>
    </div>
  );
}
