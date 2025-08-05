import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Phone number validation function
export const validatePhoneNumber = (phone: string): boolean => {
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

// Email confirmation function
export const sendEmailConfirmation = async (email: string, activityName: string, activityDate: string, userName: string) => {
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

// Shared form field styles
export const formFieldClasses = "border-2 border-[#cbd5d8] p-2 sm:p-2.5 md:p-3 rounded-[12px] bg-transparent text-[#3d342e] placeholder-[#594f43] focus:outline-none focus:border-[#594f43] transition-colors text-xs sm:text-sm md:text-base w-full";

// Card colors
export const cardColors = ['#f1ecdd', '#cbd5d8'];

// Fetch activities with booking data
export const fetchActivitiesWithBookings = async () => {
  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('*');

  if (activitiesError) {
    console.error('Error fetching activities:', activitiesError.message);
    return [];
  }

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('activity_id, name');

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError.message);
    return [];
  }

  const enrichedActivities = activitiesData.map((activity) => {
    const booker = bookingsData.find((b) => b.activity_id === activity.id);
    return {
      ...activity,
      bookerName: booker?.name || null
    };
  });

  return enrichedActivities;
};

// Handle booking submission
export const handleBookingSubmission = async (
  activity: any,
  formData: { name: string; email: string; phone: string; date: string; reason: string },
  onSuccess?: () => void
) => {
  try {
    // Insert booking with correct schema
    const { data: bookingData, error: bookingError } = await supabase.from('bookings').insert({
      activity_id: activity.id,
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
        activity_id: activity.id,
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
    const { error: activityError } = await supabase.from('activities').update({ is_booked: true }).eq('id', activity.id);
    
    if (activityError) {
      console.error('Failed to update activity status:', activityError);
      throw new Error(`Activity update failed: ${activityError.message}`);
    }

    // Send email confirmation
    try {
      await sendEmailConfirmation(formData.email, activity.title, formData.date, formData.name);
    } catch (error) {
      console.error('Failed to send email confirmation:', error);
    }

    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }

    return { success: true };
  } catch (error) {
    console.error('Booking process failed:', error);
    alert('Failed to save booking. Please try again.');
    return { success: false, error };
  }
}; 