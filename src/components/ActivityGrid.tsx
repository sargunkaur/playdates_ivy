import React from 'react';
import { cardColors } from '../utils/bookingUtils';

interface ActivityGridProps {
  activities: any[];
  onActivitySelect: (activity: any) => void;
  isMobile: boolean;
}

export default function ActivityGrid({ activities, onActivitySelect, isMobile }: ActivityGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {activities.map((activity, idx) => (
        <div
          key={activity.id}
          className={`rounded-[20px] text-center p-6 shadow-xl transition-all duration-300 ${
            activity.is_booked ? 'opacity-60 grayscale' : ''
          }`}
          style={{ backgroundColor: cardColors[idx % cardColors.length] }}
        >
          <h2 className="font-bold text-lg uppercase mb-2">{activity.title}</h2>
          <p className="text-sm mb-4">{activity.description}</p>

          {activity.is_booked ? (
            <div className="text-gray-700 py-2 px-4 rounded text-center">
              Playdate set with {activity.bookerName || 'someone'}
            </div>
          ) : (
            <button
              onClick={() => onActivitySelect(activity)}
              className="bg-[#594f43] text-white px-6 py-2 rounded-[12px] font-semibold text-sm hover:bg-pink-300 transition-colors duration-200"
            >
              SCHEDULE THIS!
            </button>
          )}            
        </div>
      ))}
    </div>
  );
} 