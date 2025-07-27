import React, { useState } from "react";
import { Calendar } from "./components/ui/calendar";

export function BookingModal({ onClose }: { onClose: () => void }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Schedule This</h2>
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full border rounded p-2"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded p-2"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full border rounded p-2"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select a Date
            </label>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
          </div>

          <textarea
            placeholder="Message"
            className="w-full border rounded p-2 h-24"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            ✅ Book This Playdate
          </button>
        </form>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
