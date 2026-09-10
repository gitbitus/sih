import React, { useRef, useState } from 'react';
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
}