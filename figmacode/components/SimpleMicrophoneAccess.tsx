import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Mic, MicOff, AlertCircle, CheckCircle, RefreshCw, Shield, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SimpleMicrophoneAccessProps {
  onPermissionGranted: () => void;
  onClose?: () => void;
}

export function SimpleMicrophoneAccess({ onPermissionGranted, onClose }: SimpleMicrophoneAccessProps) {
  const [step, setStep] = useState<'initial' | 'requesting' | 'instructions' | 'testing' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requestMicrophoneAccess = useCallback(async () => {
    setIsLoading(true);
    setStep('requesting');
    setErrorMessage('');

    try {
      // Simple, direct microphone request
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      // Success! Clean up and notify
      stream.getTracks().forEach(track => track.stop());
      setStep('success');
      toast.success('🎉 Microphone access granted!');
      
      setTimeout(() => {
        onPermissionGranted();
        onClose?.();
      }, 1500);
      
    } catch (error: any) {
      console.error('Microphone access failed:', error);
      setErrorMessage(error.message || 'Permission denied');
      
      if (error.name === 'NotAllowedError') {
        setStep('instructions');
        toast.error('❌ Permission denied. Please follow the instructions below.');
      } else {
        setStep('error');
        toast.error(`❌ Error: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onPermissionGranted, onClose]);

  const testAgain = useCallback(() => {
    setStep('testing');
    requestMicrophoneAccess();
  }, [requestMicrophoneAccess]);

  const resetAndTryAgain = useCallback(() => {
    setStep('initial');
    setErrorMessage('');
  }, []);

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return {
        browser: 'Chrome',
        steps: [
          'Look for the 🔒 lock icon or 🎤 microphone icon in your address bar',
          'Click the icon and select "Always allow" for microphone',
          'If no icon appears, click the three dots → Settings → Privacy and security → Site Settings → Microphone',
          'Find this website and set it to "Allow"'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Go to Safari → Settings → Websites → Microphone',
          'Find this website and set it to "Allow"',
          'If not listed, set the default to "Allow" at the bottom',
          'Refresh this page after making changes'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Look for the 🛡️ shield icon or 🎤 microphone icon in your address bar',
          'Click the icon and select "Allow" for microphone access',
          'You can also go to Firefox menu → Settings → Privacy & Security → Permissions',
          'Find "Microphone" and remove this site from blocked list'
        ]
      };
    } else {
      return {
        browser: 'Your browser',
        steps: [
          'Look for a microphone or lock icon in your address bar',
          'Click it and allow microphone access for this site',
          'Check your browser settings for site permissions',
          'Make sure this website is allowed to use your microphone'
        ]
      };
    }
  };

  const instructions = getBrowserInstructions();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="zen-card max-w-md w-full">
        <div className="p-6 text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              {step === 'success' ? (
                <CheckCircle className="w-8 h-8 text-peaceful-green" />
              ) : step === 'error' ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : isLoading ? (
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-medium">
              {step === 'success' ? 'Success!' :
               step === 'error' ? 'Error' :
               step === 'instructions' ? 'Enable Microphone' :
               'Microphone Access Required'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === 'success' ? 'Microphone access has been granted successfully!' :
               step === 'error' ? 'There was an issue accessing your microphone.' :
               step === 'instructions' ? 'Please enable microphone access in your browser settings.' :
               'This app needs access to your microphone to record voice notes.'}
            </p>
          </div>

          {/* Content based on step */}
          {step === 'initial' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                When you click "Allow Access", your browser will ask for permission to use your microphone.
              </p>
              <Button 
                onClick={requestMicrophoneAccess}
                disabled={isLoading}
                className="calm-button w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Allow Microphone Access
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'requesting' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please click "Allow" when your browser asks for microphone permission.
              </p>
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-primary/20 rounded-full mx-auto"></div>
              </div>
            </div>
          )}

          {step === 'instructions' && (
            <div className="space-y-4 text-left">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-3 text-center">Instructions for {instructions.browser}:</h3>
                <ol className="space-y-2 text-sm">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={testAgain}
                  className="calm-button flex-1 gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Test Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'testing' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Testing microphone access...
              </p>
              <div className="animate-spin">
                <RefreshCw className="w-6 h-6 text-primary mx-auto" />
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={resetAndTryAgain}
                  className="calm-button flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => setStep('instructions')}
                  variant="outline"
                  className="rounded-xl gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Help
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="text-peaceful-green text-sm">
                You can now start recording voice notes!
              </div>
            </div>
          )}

          {/* Close button for non-critical steps */}
          {(step === 'initial' || step === 'error') && onClose && (
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}