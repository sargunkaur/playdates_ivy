import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Dialog } from './components/ui/dialog';
import BookingPage from './BookingPage';
import ConfirmationScreen from './ConfirmationScreen';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface FilterPageProps {
  filterTag: string;
}

export default function FilterPage({ filterTag }: FilterPageProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', reason: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{ activity: any; userName: string } | null>(null);
  const [phoneError, setPhoneError] = useState<string>('');

  // Shared form field styles
  const formFieldClasses = "border-2 border-[#cbd5d8] p-2 sm:p-2.5 md:p-3 rounded-[12px] bg-transparent text-[#3d342e] placeholder-[#594f43] focus:outline-none focus:border-[#594f43] transition-colors text-xs sm:text-sm md:text-base w-full";

  const cardColors = ['#f1ecdd', '#cbd5d8'];

  // Decode the filter tag from URL (handles spaces and special characters)
  const decodedFilterTag = decodeURIComponent(filterTag);

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 or 11 digits)
    if (cleaned.length === 10) {
      return true; // 10-digit number
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return true; // 11-digit number starting with 1
    }
    
    return false;
  };

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
    
    // Clear previous phone error
    setPhoneError('');
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (selectedActivity) {
      try {
        // Insert booking with correct schema
        const { data: bookingData, error: bookingError } = await supabase.from('bookings').insert({
          activity_id: selectedActivity.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          preferred_date_start: formData.date || null, // Save as text
          preferred_date_end: formData.date || null, // Save as text
          notes: formData.reason || ''
        });

        if (bookingError) {
          console.error('Failed to save booking:', bookingError);
          console.error('Booking data attempted:', {
            activity_id: selectedActivity.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            preferred_date_start: formData.date || null,
            preferred_date_end: formData.date || null,
            notes: formData.reason || ''
          });
          throw new Error(`Booking save failed: ${bookingError.message}`);
        }

        // Update activity status
        const { error: activityError } = await supabase.from('activities').update({ is_booked: true }).eq('id', selectedActivity.id);
        
        if (activityError) {
          console.error('Failed to update activity status:', activityError);
          throw new Error(`Activity update failed: ${activityError.message}`);
        }

        // Send email confirmation
        try {
          await sendEmailConfirmation(formData.email, selectedActivity.title, formData.date, formData.name);
        } catch (error) {
          console.error('Failed to send email confirmation:', error);
        }
        
        // Show confirmation screen
        setConfirmationData({ activity: selectedActivity, userName: formData.name });
        setShowConfirmation(true);
        setSelectedActivity(null);
        setFormData({ name: '', email: '', phone: '', date: '', reason: '' });
        
      } catch (error) {
        console.error('Booking process failed:', error);
        // You could show an error message to the user here
        alert('Failed to save booking. Please try again.');
      }
    }
  };

  // Email confirmation function
  const sendEmailConfirmation = async (email: string, activityName: string, activityDate: string, userName: string) => {
    const emailData = {
      to: email,
      subject: 'Playdate Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #594f43; text-align: center;">🎉 Playdate Confirmed! 🎉</h2>
          <div style="background-color: #f1ecdd; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #3d342e; margin-bottom: 10px;">You've booked "${activityName}" with Sargun</h3>
            <p style="color: #594f43; margin: 5px 0;"><strong>Date:</strong> ${activityDate}</p>
            <p style="color: #594f43; margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
          </div>
          <p style="color: #3d342e; text-align: center; font-size: 16px;">
            We're excited to have fun together! Sargun will text you soon to plan out all the details. ✨
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #594f43; font-size: 14px;">Can't wait to play with you!</p>
          </div>
        </div>
      `
    };

    // Using a simple email service (you can replace this with your preferred email service)
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  };

  // Filter activities based on the filter tag
  const filteredActivities = activities.filter(activity => 
    activity.tags && activity.tags.some((tag: string) => 
      tag.toLowerCase() === decodedFilterTag.toLowerCase()
    )
  );

  // Debug logging
  console.log('FilterPage Debug:', {
    originalFilterTag: filterTag,
    decodedFilterTag,
    totalActivities: activities.length,
    filteredActivities: filteredActivities.length,
    allTags: activities.flatMap(activity => activity.tags || []),
    uniqueTags: Array.from(new Set(activities.flatMap(activity => activity.tags || [])))
  });

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

  // Show confirmation screen on mobile
  if (isMobile && showConfirmation && confirmationData) {
    return (
      <ConfirmationScreen
        activity={confirmationData.activity}
        userName={confirmationData.userName}
        onClose={() => {
          setShowConfirmation(false);
          setConfirmationData(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen font-sans text-[#3d342e]">
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, idx) => (
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
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-xl font-bold text-[#3d342e] mb-4">
                No activities found for "{decodedFilterTag}"
              </h3>
              <p className="text-[#3d342e]/80 mb-6">
                Available tags: {Array.from(new Set(activities.flatMap(activity => activity.tags || []))).join(', ')}
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-[#594f43] text-white px-6 py-2 rounded-[12px] font-semibold text-sm"
              >
                ← Back to All Activities
              </button>
            </div>
          )}
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
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (phoneError) setPhoneError(''); // Clear error when user types
                  }}
                  className={`${formFieldClasses} ${phoneError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {phoneError && (
                  <p className="text-red-500 text-xs mt-1 ml-1">
                    {phoneError}
                  </p>
                )}
              </div>
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

      {/* Confirmation Modal - Desktop Only */}
      {showConfirmation && confirmationData && !isMobile && (
        <Dialog open={true} onOpenChange={() => {
          setShowConfirmation(false);
          setConfirmationData(null);
        }}>
          <div className="w-full max-w-md mx-auto bg-[#f1ecdd] rounded-[20px] shadow-xl border-2 border-[#cbd5d8] m-2 sm:m-4 relative">
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmationData(null);
              }}
              className="absolute top-4 right-4 text-[#594f43] hover:text-[#3d342e] text-2xl font-bold z-10 bg-[#f1ecdd] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#e8e0d0] transition-colors"
            >
              ×
            </button>
            <div className="p-6 text-center">
              {/* Title */}
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Play Date Booked! 🎉
              </h2>

              {/* Activity Confirmation Box */}
              <div className="bg-[#cbd5d8] rounded-[12px] p-4 mb-6">
                <h3 className="font-bold text-lg mb-2">
                  🎉 {confirmationData.activity.title}
                </h3>
                <p className="text-sm text-[#594f43]">
                  Your playdate is confirmed!
                </p>
              </div>

              {/* Confirmation Details */}
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 text-lg">✓</span>
                  <span className="text-sm">Calendar invite sent to your email</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#594f43] text-lg">📱</span>
                  <span className="text-sm">Text conversation started</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#594f43] text-lg">💾</span>
                  <span className="text-sm">Your booking has been saved</span>
                </div>
              </div>

              {/* Personalized Message Box */}
              <div className="bg-[#f1ecdd] border-2 border-[#cbd5d8] rounded-[12px] p-4 mb-6">
                <p className="font-bold text-[#3d342e]">
                  Hey {confirmationData.userName}! I'll text you soon to plan out all the fun details. Can't wait! ✨
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmationData(null);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-[12px] font-bold hover:from-green-600 hover:to-blue-600 transition-all"
              >
                Awesome! ✨
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
} 