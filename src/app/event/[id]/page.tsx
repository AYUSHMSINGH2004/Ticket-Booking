"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import SeatMap from '@/components/SeatMap';

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!event || event.error) {
    return <div className="text-center text-red-500 mt-12">Event not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <h1 className="text-4xl font-bold text-white mb-4">{event.name}</h1>
        <p className="text-gray-300 max-w-3xl text-lg mb-6">{event.description}</p>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center text-gray-200 gap-2">
            <Calendar className="w-6 h-6 text-accent" />
            <span className="text-lg">{format(new Date(event.date), 'PPP p')}</span>
          </div>
          <div className="flex items-center text-gray-200 gap-2">
            <MapPin className="w-6 h-6 text-accent" />
            <span className="text-lg">{event.venue.name}, {event.venue.location}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Select Your Seats</h2>
        <SeatMap eventId={id} pricing={event.pricing} />
      </div>
    </div>
  );
}
