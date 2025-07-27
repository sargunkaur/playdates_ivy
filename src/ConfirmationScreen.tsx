import React from 'react';

interface ConfirmationScreenProps {
  activity: any;
  userName: string;
  onClose: () => void;
}

export default function ConfirmationScreen({ activity, userName, onClose }: ConfirmationScreenProps) {
  return (
    <div className="min-h-screen bg-[#594f43] font-sans text-[#3d342e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#f1ecdd] rounded-[20px] shadow-xl border-2 border-[#cbd5d8] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#594f43] hover:text-[#3d342e] text-2xl font-bold z-10 bg-[#f1ecdd] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#e8e0d0] transition-colors"
        >
          ×
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Title */}
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Play Date Booked! 🎉
          </h2>

          {/* Activity Confirmation Box */}
          <div className="bg-[#cbd5d8] rounded-[12px] p-4 mb-6">
            <h3 className="font-bold text-lg mb-2">
              🎉 {activity.title}
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
              Hey {userName}! I'll text you soon to plan out all the fun details. Can't wait! ✨
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-[12px] font-bold hover:from-green-600 hover:to-blue-600 transition-all"
          >
            Awesome! ✨
          </button>
        </div>
      </div>
    </div>
  );
} 