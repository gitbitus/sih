import React, { useState } from 'react';
import { addDays, format, isSameDay, startOfToday } from 'date-fns';
import { cn } from '../../lib/utils';
import ConfirmModal from '../common/ConfirmModal';

interface AvailabilityCalendarProps {
  subAdminId: string;
  onDateSelect?: (date: Date) => void;
  readOnly?: boolean;
}

export default function AvailabilityCalendar({ subAdminId, onDateSelect, readOnly = false }: AvailabilityCalendarProps) {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate next 14 days
  const days = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

  // Mock availability
  const unavailableDates = [addDays(today, 2), addDays(today, 5)];

  const handleDateClick = (date: Date) => {
    if (readOnly || date.getDay() === 0) return; // Sunday
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (selectedDate && onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
        ))}
        
        {/* Empty slots for padding first day */}
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((date, i) => {
          const isSunday = date.getDay() === 0;
          const isUnavailable = unavailableDates.some(d => isSameDay(d, date));
          
          return (
            <button
              key={i}
              onClick={() => handleDateClick(date)}
              disabled={readOnly || isSunday}
              className={cn(
                "p-2 flex flex-col items-center justify-center rounded-md border text-sm font-medium transition-colors h-14",
                isSunday ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                isUnavailable ? "bg-red-50 border-red-200 text-red-700 cursor-not-allowed" :
                "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
                selectedDate && isSameDay(selectedDate, date) && "ring-2 ring-primary ring-offset-1"
              )}
            >
              <span>{format(date, 'd')}</span>
            </button>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm Date Selection"
        description={`Are you sure you want to select ${selectedDate ? format(selectedDate, 'PPP') : ''}?`}
      />
    </div>
  );
}