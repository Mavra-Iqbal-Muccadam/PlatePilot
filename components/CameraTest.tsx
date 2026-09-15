'use client';

import { useRef, useState } from 'react';

export default function CameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('Testing camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        console.log('Camera test successful!');
      }
    } catch (error: any) {
      console.error('Camera test failed:', error);
      setError(`Camera Error: ${error.name} - ${error.message}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Camera Test</h2>
      
      <div className="mb-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-48 bg-gray-200 rounded ${!cameraActive ? 'hidden' : ''}`}
        />
        
        {!cameraActive && (
          <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
            <p className="text-gray-500">Camera not active</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Test Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Stop Camera
          </button>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}</p>
        <p><strong>HTTPS:</strong> {location.protocol === 'https:' ? 'Yes' : 'No'}</p>
        <p><strong>MediaDevices:</strong> {navigator.mediaDevices ? 'Supported' : 'Not supported'}</p>
      </div>
    </div>
  );
}