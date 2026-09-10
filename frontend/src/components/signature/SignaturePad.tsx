import React, { useRef } from 'react';
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
}