import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

interface QRScannerProps {
  onScanSuccess?: (result: string) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
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
        if (onScanSuccess) {
          onScanSuccess(result);
        } else {
          navigate(`/verify/${result}`);
        }
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
}