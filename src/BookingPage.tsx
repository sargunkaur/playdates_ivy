import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ConfirmationScreen from './ConfirmationScreen';
import { 
  validatePhoneNumber, 
  formFieldClasses, 
  handleBookingSubmission
} from './utils/bookingUtils';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface BookingPageProps {
  activity: any;
  onClose: () => void;
  onBookingSuccess?: () => void;
}

export default function BookingPage({ activity, onClose, onBookingSuccess }: BookingPageProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', reason: '' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');

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
    
    if (activity) {
      const result = await handleBookingSubmission(activity, formData);
      
      if (result.success) {
        setShowConfirmation(true);
        
        // Notify parent component that booking was successful
        if (onBookingSuccess) {
          onBookingSuccess();
        }
      }
    }
  };

  // Show confirmation screen if booking was successful
  if (showConfirmation) {
    return (
      <ConfirmationScreen
        activity={activity}
        userName={formData.name}
        onClose={onClose}
      />
    );
  }

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
                required
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
              className="bg-[#594f43] text-white py-3 rounded-[12px] font-bold mt-4 hover:bg-[#4a4038] transition-colors"
            >
              Let's go play!
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 