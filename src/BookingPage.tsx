import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface BookingPageProps {
  activity: any;
  onClose: () => void;
}

export default function BookingPage({ activity, onClose }: BookingPageProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', reason: '' });

  // Shared form field styles
  const formFieldClasses = "border-2 border-[#cbd5d8] p-2 sm:p-2.5 md:p-3 rounded-[12px] bg-transparent text-[#3d342e] placeholder-[#594f43] focus:outline-none focus:border-[#594f43] transition-colors text-xs sm:text-sm md:text-base w-full";

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.date) {
      return;
    }
    if (activity) {
      await supabase.from('bookings').insert({
        activity_id: activity.id,
        title: activity.title,
        description: activity.description || '',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        reason: formData.reason
      });
      await supabase.from('activities').update({ is_booked: true }).eq('id', activity.id);
      onClose();
    }
  };

  return (
    <div className="min-h-screen bg-[#594f43] font-sans text-[#3d342e]">
      <div className="bg-[#f1ecdd] min-h-screen">
        {/* Header */}
        <div className="relative p-4 border-b-2 border-[#cbd5d8]">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-[#594f43] hover:text-[#3d342e] text-2xl font-bold z-10 bg-[#f1ecdd] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#e8e0d0] transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-center text-[#3d342e]">
            Book Playdate
          </h1>
        </div>

        {/* Content */}
        <div className="p-4">
          <h2 className="text-lg font-bold text-center mb-4 text-[#3d342e]">
            Let's {activity.title.toLowerCase()} together!
          </h2>
          
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={formFieldClasses}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={formFieldClasses}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={formFieldClasses}
            />
            <div>
              <label className="block text-sm font-semibold text-[#3d342e] mb-2">
                When do you want to play?
              </label>
              <input
                type="text"
                placeholder="Share a date between now and Dec 31, 2025"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={formFieldClasses}
                required
              />
            </div>
            <textarea
              placeholder="Why did you pick this playdate? What are you most looking forward to on it?"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className={`${formFieldClasses} resize-none`}
              rows={4}
            />
            <button
              type="submit"
              className="bg-[#594f43] text-white py-2 sm:py-2.5 md:py-3 rounded-[12px] font-bold mt-4 hover:bg-[#4a4038] transition-colors text-xs sm:text-sm md:text-base"
            >
              Let's go play!
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 