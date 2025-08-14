import { useState, useEffect } from 'react';
import { MicrophoneDebugger } from './MicrophoneDebugger';

interface MicrophonePermissionGuideProps {
  onPermissionGranted: () => void;
}

export function MicrophonePermissionGuide({ onPermissionGranted }: MicrophonePermissionGuideProps) {
  const [step, setStep] = useState(1);
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') {
        onPermissionGranted();
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const steps = [
    {
      title: 'Check Browser Settings',
      content: (
        <>
          <p className="mb-4">
            First, make sure your browser settings allow microphone access:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Click the lock/info icon in your browser's address bar</li>
            <li>Look for "Microphone" or "Site permissions"</li>
            <li>Make sure it's set to "Allow"</li>
          </ul>
        </>
      )
    },
    {
      title: 'System Permissions',
      content: (
        <>
          <p className="mb-4">
            Check your system's microphone permissions:
          </p>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">For macOS:</h4>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Open System Preferences</li>
                <li>Click on Security & Privacy</li>
                <li>Select the Privacy tab</li>
                <li>Click on Microphone</li>
                <li>Ensure your browser is checked</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Windows:</h4>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Open Settings</li>
                <li>Click on Privacy</li>
                <li>Select Microphone</li>
                <li>Ensure your browser is enabled</li>
              </ol>
            </div>
          </div>
        </>
      )
    },
    {
      title: 'Test Your Microphone',
      content: (
        <>
          <p className="mb-4">
            Let's test your microphone to make sure it's working:
          </p>
          <button
            onClick={() => setShowDebugger(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Open Microphone Debugger
          </button>
          {showDebugger && (
            <div className="mt-4">
              <MicrophoneDebugger onSuccess={onPermissionGranted} />
            </div>
          )}
        </>
      )
    }
  ];

  return (
    <div className="p-6 bg-card rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Microphone Permission Guide
      </h2>

      <div className="space-y-8">
        {steps.map((s, index) => {
          const stepNumber = index + 1;
          return (
            <div
              key={stepNumber}
              className={`transition-opacity duration-300 ${
                step === stepNumber ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-medium
                  ${step === stepNumber
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {stepNumber}
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  {s.title}
                </h3>
              </div>
              <div className="ml-12">{s.content}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStep(prev => Math.max(1, prev - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous Step
        </button>
        <button
          onClick={() => setStep(prev => Math.min(steps.length, prev + 1))}
          disabled={step === steps.length}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
