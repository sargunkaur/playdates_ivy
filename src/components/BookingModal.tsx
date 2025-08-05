import React from 'react';
import { Dialog } from './ui/dialog';
import { formFieldClasses } from '../utils/bookingUtils';

interface BookingModalProps {
  activity: any;
  formData: { name: string; email: string; phone: string; date: string; reason: string };
  setFormData: (data: any) => void;
  phoneError: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BookingModal({ 
  activity, 
  formData, 
  setFormData, 
  phoneError, 
  onClose, 
  onSubmit 
}: BookingModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="w-full max-w-md mx-auto bg-[#f1ecdd] rounded-[20px] shadow-xl border-2 border-[#cbd5d8] m-2 sm:m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#594f43] hover:text-[#3d342e] text-2xl font-bold z-10 bg-[#f1ecdd] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#e8e0d0] transition-colors"
        >
          ×
        </button>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-2 sm:mb-0 text-[#3d342e] p-2 sm:p-4 md:p-8 pb-0">
          Let's {activity.title.toLowerCase()} together!
        </h3>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-4 md:p-8 pt-0">
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
            className="bg-[#594f43] text-white py-2 sm:py-2.5 md:py-3 rounded-[12px] font-bold mt-4 hover:bg-[#4a4038] transition-colors text-xs sm:text-sm md:text-base"
          >
            Let's go play!
          </button>
        </form>
      </div>
    </Dialog>
  );
} 