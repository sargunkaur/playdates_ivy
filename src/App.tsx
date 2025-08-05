import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Dialog } from './components/ui/dialog';
import BookingPage from './BookingPage';
import ConfirmationScreen from './ConfirmationScreen';
import FilterPage from './FilterPage';
import ActivityGrid from './components/ActivityGrid';
import BookingModal from './components/BookingModal';
import ConfirmationModal from './components/ConfirmationModal';
import { 
  validatePhoneNumber, 
  sendEmailConfirmation, 
  formFieldClasses, 
  fetchActivitiesWithBookings,
  handleBookingSubmission
} from './utils/bookingUtils';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Extract filter tag from URL
  const filterTag = currentPath.slice(1); // Remove leading slash

  // Check if we're on a filter page
  if (filterTag && filterTag !== '') {
    return <FilterPage filterTag={filterTag} />;
  }

  // Main page
  return <PlaydateSelector />;
}

function PlaydateSelector() {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', reason: '' });
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{ activity: any; userName: string } | null>(null);
  const [phoneError, setPhoneError] = useState<string>('');



  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel('realtime-activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        (payload) => {
          console.log('Realtime activity update:', payload);
          fetchActivities();
        }
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
                  onClick={() => {
                    // Navigate to filter page with proper URL encoding
                    window.location.href = `/${encodeURIComponent(tag)}`;
                  }}
                  className="px-6 py-3 rounded-md font-bold text-sm transition-all flex-shrink-0 text-[#594f43] hover:bg-[#e8e0d0]"
                >
                  {tag.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ActivityGrid 
          activities={filteredActivities}
          onActivitySelect={setSelectedActivity}
          isMobile={isMobile}
        />
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
