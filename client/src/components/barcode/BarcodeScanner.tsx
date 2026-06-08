import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';
import { X, Camera, CameraOff } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanning = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError('Không tìm thấy camera. Hãy kết nối camera hoặc dùng máy quét USB.');
          setIsLoading(false);
          return;
        }
        const deviceId = devices[devices.length - 1].deviceId;
        setIsLoading(false);
        await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result, err) => {
          if (result) {
            onScan(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error(err);
          }
        });
      } catch (e) {
        setError('Không thể truy cập camera. Hãy cấp quyền camera cho trình duyệt.');
        setIsLoading(false);
      }
    };

    startScanning();

    return () => {
      readerRef.current?.reset();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="text-primary-500" size={20} />
            <h3 className="font-semibold text-gray-800">Quét mã vạch bằng camera</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-500">
              <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
              <p>Đang khởi động camera...</p>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <CameraOff size={40} className="text-gray-400" />
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          ) : (
            <div className="relative">
              <video ref={videoRef} className="w-full rounded-lg" />
              {!isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-32 border-4 border-primary-400 rounded-lg opacity-70" />
                </div>
              )}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">
            Hướng camera vào mã vạch để quét tự động
          </p>
        </div>
      </div>
    </div>
  );
}
