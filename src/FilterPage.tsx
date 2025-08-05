import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Dialog } from './components/ui/dialog';
import BookingPage from './BookingPage';
import ConfirmationScreen from './ConfirmationScreen';
import ActivityGrid from './components/ActivityGrid';
import BookingModal from './components/BookingModal';
import ConfirmationModal from './components/ConfirmationModal';
import { 
  validatePhoneNumber, 
  formFieldClasses, 
  fetchActivitiesWithBookings,
  handleBookingSubmission
} from './utils/bookingUtils';

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

  // Decode the filter tag from URL (handles spaces and special characters)
  const decodedFilterTag = decodeURIComponent(filterTag);

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
    const enrichedActivities = await fetchActivitiesWithBookings();
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
      const result = await handleBookingSubmission(selectedActivity, formData, fetchActivities);
      
      if (result.success) {
        // Show confirmation screen
        setConfirmationData({ activity: selectedActivity, userName: formData.name });
        setShowConfirmation(true);
        setSelectedActivity(null);
        setFormData({ name: '', email: '', phone: '', date: '', reason: '' });
      }
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
        onBookingSuccess={fetchActivities}
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
        {filteredActivities.length > 0 ? (
          <ActivityGrid 
            activities={filteredActivities}
            onActivitySelect={setSelectedActivity}
            isMobile={isMobile}
          />
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

      {/* Booking Form Modal - Desktop Only */}
      {selectedActivity && !isMobile && (
        <BookingModal
          activity={selectedActivity}
          formData={formData}
          setFormData={setFormData}
          phoneError={phoneError}
          onClose={() => {
            setSelectedActivity(null);
            setFormData({ name: '', email: '', phone: '', date: '', reason: '' });
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Confirmation Modal - Desktop Only */}
      {showConfirmation && confirmationData && !isMobile && (
        <ConfirmationModal
          confirmationData={confirmationData}
          onClose={() => {
            setShowConfirmation(false);
            setConfirmationData(null);
          }}
        />
      )}
    </div>
  );
} 