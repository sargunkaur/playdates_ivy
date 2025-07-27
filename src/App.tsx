import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Dialog } from './components/ui/dialog';
import BookingPage from './BookingPage';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function PlaydateSelector() {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', reason: '' });
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);

  // Shared form field styles
  const formFieldClasses = "border-2 border-[#cbd5d8] p-2 sm:p-2.5 md:p-3 rounded-[12px] bg-transparent text-[#3d342e] placeholder-[#594f43] focus:outline-none focus:border-[#594f43] transition-colors text-xs sm:text-sm md:text-base w-full";

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

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
    if (!formData.name || !formData.email || !formData.phone || !formData.date) {
      return;
    }
    if (selectedActivity) {
      await supabase.from('bookings').insert({
        activity_id: selectedActivity.id,
        title: selectedActivity.title,
        description: selectedActivity.description || '',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        reason: formData.reason
      });
      await supabase.from('activities').update({ is_booked: true }).eq('id', selectedActivity.id);
      setSelectedActivity(null);
      setFormData({ name: '', email: '', phone: '', date: '', reason: '' });
    }
  };

  const cardColors = ['#f1ecdd', '#cbd5d8'];

  // Extract unique tags from all activities
  const allTags = Array.from(
    new Set(
      activities.flatMap(activity => activity.tags || [])
    )
  );

  // Filter activities based on selected filter
  const filteredActivities = selectedFilter === 'all' 
    ? activities 
    : activities.filter(activity => 
        activity.tags && activity.tags.includes(selectedFilter)
      );

    // Show booking page on mobile, modal on desktop
  if (isMobile && selectedActivity) {
    return (
      <BookingPage 
        activity={selectedActivity} 
        onClose={() => {
          setSelectedActivity(null);
          setFormData({ name: '', email: '', phone: '', date: '', reason: '' });
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#594f43] font-sans text-[#3d342e]">
      <div className="px-6 py-12 max-w-6xl mx-auto">
        {/* Filter Buttons */}
        <div className="mb-8">
          <div className="bg-[#f1ecdd] rounded-lg p-1 w-full">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-6 py-3 rounded-md font-bold text-sm transition-all flex-shrink-0 ${
                  selectedFilter === 'all'
                    ? 'bg-[#594f43] text-white shadow-sm'
                    : 'text-[#594f43] hover:bg-[#e8e0d0]'
                }`}
              >
                ALL
              </button>
              {allTags.map((tag, index) => (
                <button
                  key={tag}
                  onClick={() => setSelectedFilter(tag)}
                  className={`px-6 py-3 rounded-md font-bold text-sm transition-all flex-shrink-0 ${
                    selectedFilter === tag
                      ? 'bg-[#594f43] text-white shadow-sm'
                      : 'text-[#594f43] hover:bg-[#e8e0d0]'
                  }`}
                >
                  {tag.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity, idx) => (
            <div
              key={activity.id}
              className="rounded-[20px] text-center p-6 shadow-xl"
              style={{ backgroundColor: cardColors[idx % cardColors.length] }}
            >
              <h2 className="font-bold text-lg uppercase mb-2">{activity.title}</h2>
              <p className="text-sm mb-4">{activity.description}</p>

              {activity.is_booked ? (
                <div className="text-gray-700 py-2 px-4 rounded text-center">
                  Playdate set with {activity.booked_by || 'someone'}
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

      {/* Booking Form Modal - Desktop Only */}
      {selectedActivity && !isMobile && (
        <Dialog open={true} onOpenChange={() => setSelectedActivity(null)}>
          <div className="w-full max-w-md mx-auto bg-[#f1ecdd] rounded-[20px] shadow-xl border-2 border-[#cbd5d8] m-2 sm:m-4 relative">
            <button
              onClick={() => {
                setSelectedActivity(null);
                setFormData({ name: '', email: '', phone: '', date: '', reason: '' });
              }}
              className="absolute top-4 right-4 text-[#594f43] hover:text-[#3d342e] text-2xl font-bold z-10 bg-[#f1ecdd] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#e8e0d0] transition-colors"
            >
              ×
            </button>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-2 sm:mb-0 text-[#3d342e] p-2 sm:p-4 md:p-8 pb-0">
              Let's {selectedActivity.title.toLowerCase()} together!
            </h3>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 md:p-8 pt-0">
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
        </Dialog>
      )}
    </div>
  );
}
