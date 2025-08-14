import { useState } from 'react';
import { MicrophonePermissionGuide } from './MicrophonePermissionGuide';
import { SimpleMicrophoneAccess } from './SimpleMicrophoneAccess';

interface PermissionSetupProps {
  onPermissionGranted: () => void;
}

export function PermissionSetup({ onPermissionGranted }: PermissionSetupProps) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {showGuide ? (
          <MicrophonePermissionGuide onPermissionGranted={onPermissionGranted} />
        ) : (
          <SimpleMicrophoneAccess
            onPermissionGranted={onPermissionGranted}
            onNeedHelp={() => setShowGuide(true)}
          />
        )}
      </div>
    </div>
  );
}
