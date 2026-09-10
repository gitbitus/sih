import os
import sys

base_dir = sys.argv[1]

files = {
  'src/components/common/LoadingSpinner.tsx': """import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}""",
  'src/components/common/Pagination.tsx': """import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{start}</span> to{' '}
            <span className="font-medium">{end}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* Simple page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}""",
  'src/components/common/StatusBadge.tsx': """import React from 'react';
import { getStatusColor } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        getStatusColor(status)
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}""",
  'src/components/common/SearchInput.tsx': """import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="input pl-10"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    </div>
  );
}""",
  'src/components/common/ConfirmModal.tsx': """import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-xl w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-medium text-gray-900">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="btn-secondary">
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            >
              {confirmText}
            </button>
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}""",
  'src/components/common/FileUpload.tsx': """import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
}

export default function FileUpload({ onFilesChange, multiple = false, accept = 'image/*' }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="w-full">
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <div className="space-y-1 text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
              <span>Upload a file</span>
              <input
                ref={inputRef}
                type="file"
                className="sr-only"
                multiple={multiple}
                accept={accept}
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
        </div>
      </div>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 p-2 rounded">
              <span className="truncate">{file.name}</span>
              <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}""",
  'src/components/common/NotificationBell.tsx': """import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-2 text-gray-400 hover:text-gray-500 relative focus:outline-none">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="w-80 bg-white rounded-md shadow-lg border border-gray-200 p-2 mr-2 z-50">
          <div className="px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Notifications
          </div>
          <div className="py-2">
            <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none rounded">
              <p className="font-medium text-gray-900">Application Approved</p>
              <p className="text-gray-500 text-xs mt-1">Your instrument #123 has been certified.</p>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none rounded">
              <p className="font-medium text-gray-900">New Visit Assigned</p>
              <p className="text-gray-500 text-xs mt-1">You have a new inspection visit scheduled for tomorrow.</p>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}""",
  'src/components/calendar/AvailabilityCalendar.tsx': """import React, { useState } from 'react';
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
}""",
  'src/components/signature/SignaturePad.tsx': """import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
}

export default function SignaturePad({ onSave }: SignaturePadProps) {
  const padRef = useRef<SignatureCanvas>(null);

  const clear = () => {
    padRef.current?.clear();
  };

  const save = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      onSave(padRef.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Digital Signature</span>
        <div className="space-x-2">
          <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
          <button type="button" onClick={save} className="text-xs bg-primary text-white px-2 py-1 rounded">Save</button>
        </div>
      </div>
      <SignatureCanvas
        ref={padRef}
        penColor="black"
        canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
      />
    </div>
  );
}""",
  'src/components/qr/QRScanner.tsx': """import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    }, false);

    scanner.render(
      (result) => {
        scanner.clear();
        setScanResult(result);
        navigate(`/verify/${result}`);
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [navigate]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput) {
      navigate(`/verify/${manualInput}`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h3>
        <div id="reader" className="overflow-hidden rounded-lg"></div>
      </div>
      <div className="text-center text-sm text-gray-500">OR</div>
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Certificate ID manually</h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="e.g. CERT-12345"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
          <button type="submit" className="btn-primary">Verify</button>
        </form>
      </div>
    </div>
  );
}"""
}

for relative_path, content in files.items():
    full_path = os.path.join(base_dir, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created {full_path}")
