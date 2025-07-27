import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Dialog } from './components/ui/dialog';
import { Calendar } from './components/ui/calendar';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function PlaydateSelector() {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', reason: '' });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel('realtime-activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

async function fetchActivities() {
  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('*');

  if (activitiesError) {
    console.error('Error fetching activities:', activitiesError.message);
    return;
  }

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('activity_id, name');

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError.message);
    return;
  }

  const enrichedActivities = activitiesData.map((activity) => {
    const booker = bookingsData.find((b) => b.activity_id === activity.id);
    return {
      ...activity,
      bookerName: booker?.name || null
    };
  });

  setActivities(enrichedActivities);
}


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      return;
    }
    // const formattedDate = selectedDate?.toDateString() || '';
    if (selectedActivity) {
      await supabase.from('bookings').insert({
        activity_id: selectedActivity.id,
        title: selectedActivity.title,
        description: selectedActivity.description || '',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        // date_range: formattedDate,
        reason: formData.reason
      });
      await supabase.from('activities').update({ booked: true }).eq('id', selectedActivity.id);
      setSelectedActivity(null);
      setFormData({ name: '', email: '', phone: '', date: '', reason: '' });
    }
  };

  const cardColors = ['#f1ecdd', '#cbd5d8'];

  return (
    <div className="min-h-screen bg-[#594f43] font-sans text-[#3d342e]">
      <div className="px-6 py-12 max-w-6xl mx-auto">
        {/* <h1 className="text-center text-3xl font-extrabold mb-2 tracking-wider text-[#f9f6ef]">
          SELECT A PLAYDATE
        </h1>
        <p className="text-center text-[#d8d1c5] mb-8 text-sm">
          Explore playdates below and schedule the one you'd most like to do together!
        </p> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, idx) => (
            <div
              key={activity.id}
              className="rounded-[20px] text-center p-6 shadow-xl"
              style={{ backgroundColor: cardColors[idx % cardColors.length] }}
            >
              <h2 className="font-bold text-lg uppercase mb-2">{activity.title}</h2>
              <p className="text-sm mb-4">{activity.description}</p>

              {activity.booked ? (
                <div className="bg-gray-300 text-gray-700 py-2 px-4 rounded text-center">
                  Playdate set with {activity.bookerName || 'someone'}
                </div>
              ) : (
                <button
                  onClick={() => setSelectedActivity(activity)}
                  className="bg-[#594f43] text-white px-6 py-2 rounded-[12px] font-semibold text-sm"
                >
                  SCHEDULE THIS!
                </button>
              )}            
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form Modal */}
      {selectedActivity && (
        <Dialog open={true} onOpenChange={() => setSelectedActivity(null)}>
          <div className="p-6 w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
            <h3 className="text-2xl font-extrabold text-center mb-4 text-[#3d342e]">
              🎉 {selectedActivity.title.toLowerCase()} 🎉
            </h3>
            <p className="text-center text-[#3d342e] mb-4">
              Let's have an amazing time together with this activity!
            </p>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border p-3 rounded-md"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border p-3 rounded-md"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border p-3 rounded-md"
              />
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select a Date
                </label>
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
              </div> */}
              <textarea
                placeholder="Why did you pick this playdate? What are you most looking forward to on it?"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="border p-3 rounded-md"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-400 to-pink-500 text-white py-3 rounded-md font-bold mt-2"
              >
                Let's Do This! 🎉
              </button>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}
