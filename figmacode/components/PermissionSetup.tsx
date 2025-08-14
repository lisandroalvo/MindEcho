import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Mic, MicOff, AlertCircle, CheckCircle, ExternalLink, Copy, RefreshCw, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PermissionSetupProps {
  onClose?: () => void;
  onPermissionGranted?: () => void;
}

export function PermissionSetup({ onClose, onPermissionGranted }: PermissionSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [browserName, setBrowserName] = useState('Chrome');

  useEffect(() => {
    detectBrowser();
    checkInitialPermission();
  }, []);

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      setBrowserName('Chrome');
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      setBrowserName('Safari');
    } else if (userAgent.includes('firefox')) {
      setBrowserName('Firefox');
    } else if (userAgent.includes('edg')) {
      setBrowserName('Edge');
    } else {
      setBrowserName('Chrome'); // Default fallback
    }
  };

  const checkInitialPermission = async () => {
    if (!navigator.permissions) {
      setPermissionState('unknown');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(result.state as any);
      
      if (result.state === 'granted') {
        setCurrentStep(4); // Skip to success step
      } else if (result.state === 'denied') {
        setCurrentStep(2); // Go to reset instructions
      }

      result.addEventListener('change', () => {
        setPermissionState(result.state as any);
        if (result.state === 'granted') {
          setCurrentStep(4);
          onPermissionGranted?.();
        }
      });
    } catch (error) {
      console.error('Permission query failed:', error);
      setPermissionState('unknown');
    }
  };

  const testMicrophonePermission = async () => {
    setIsTestingMic(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Success!
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      setCurrentStep(4);
      toast.success('🎉 Microphone access granted successfully!');
      onPermissionGranted?.();
      
    } catch (error: any) {
      console.error('Microphone test failed:', error);
      
      if (error.name === 'NotAllowedError') {
        setPermissionState('denied');
        setCurrentStep(2); // Show reset instructions
        toast.error('❌ Permission still denied. Please follow the reset instructions below.');
      } else {
        toast.error(`❌ Test failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsTestingMic(false);
    }
  };

  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('📋 URL copied to clipboard');
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  const renderStepIndicator = (step: number, title: string) => {
    const status = getStepStatus(step);
    
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
        status === 'active' ? 'bg-primary/10 border border-primary/30' :
        status === 'completed' ? 'bg-peaceful-green/10 border border-peaceful-green/30' :
        'bg-muted/30'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
          status === 'active' ? 'bg-primary text-primary-foreground' :
          status === 'completed' ? 'bg-peaceful-green text-white' :
          'bg-muted text-muted-foreground'
        }`}>
          {status === 'completed' ? <CheckCircle className="w-4 h-4" /> : step}
        </div>
        <span className={`transition-all duration-300 ${
          status === 'active' ? 'text-primary font-medium' :
          status === 'completed' ? 'text-peaceful-green' :
          'text-muted-foreground'
        }`}>
          {title}
        </span>
      </div>
    );
  };

  const renderBrowserInstructions = () => {
    const instructions = {
      Chrome: [
        {
          step: 1,
          text: "Look for the microphone icon in your address bar (usually on the right side)",
          icon: <Mic className="w-4 h-4" />
        },
        {
          step: 2,
          text: "Click the microphone icon or the lock/shield icon next to the URL",
          icon: <Shield className="w-4 h-4" />
        },
        {
          step: 3,
          text: "Select 'Always allow' or 'Allow' for microphone access",
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          step: 4,
          text: "If you don't see the icon, go to Chrome Settings → Privacy & Security → Site Settings → Microphone",
          icon: <ExternalLink className="w-4 h-4" />
        }
      ],
      Safari: [
        {
          step: 1,
          text: "Go to Safari menu → Settings (or Preferences)",
          icon: <ExternalLink className="w-4 h-4" />
        },
        {
          step: 2,
          text: "Click on 'Websites' tab, then select 'Microphone' from the left sidebar",
          icon: <Mic className="w-4 h-4" />
        },
        {
          step: 3,
          text: "Find this website in the list and set it to 'Allow'",
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          step: 4,
          text: "If not listed, change the bottom dropdown to 'Allow' and refresh this page",
          icon: <RefreshCw className="w-4 h-4" />
        }
      ],
      Firefox: [
        {
          step: 1,
          text: "Look for the microphone icon in your address bar",
          icon: <Mic className="w-4 h-4" />
        },
        {
          step: 2,
          text: "Click the shield or microphone icon, then click 'Allow' or remove the block",
          icon: <Shield className="w-4 h-4" />
        },
        {
          step: 3,
          text: "You can also go to Firefox menu → Settings → Privacy & Security → Permissions",
          icon: <ExternalLink className="w-4 h-4" />
        },
        {
          step: 4,
          text: "Find 'Microphone' settings and remove this site from blocked list",
          icon: <CheckCircle className="w-4 h-4" />
        }
      ],
      Edge: [
        {
          step: 1,
          text: "Click the lock icon or microphone icon in the address bar",
          icon: <Shield className="w-4 h-4" />
        },
        {
          step: 2,
          text: "Set Microphone permission to 'Allow'",
          icon: <Mic className="w-4 h-4" />
        },
        {
          step: 3,
          text: "Or go to Edge menu → Settings → Site permissions → Microphone",
          icon: <ExternalLink className="w-4 h-4" />
        },
        {
          step: 4,
          text: "Remove this site from the 'Block' list if present",
          icon: <CheckCircle className="w-4 h-4" />
        }
      ]
    };

    return (
      <div className="space-y-3">
        <h3 className="font-medium mb-4">📱 Instructions for {browserName}:</h3>
        <div className="space-y-3">
          {instructions[browserName as keyof typeof instructions]?.map((instruction) => (
            <div key={instruction.step} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                {instruction.step}
              </div>
              <div className="flex items-start gap-2 flex-1">
                <div className="text-primary mt-0.5">{instruction.icon}</div>
                <span className="text-sm">{instruction.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="zen-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mic className="w-6 h-6 text-primary" />
              <h2 className="text-xl">Microphone Setup</h2>
            </div>
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="rounded-xl"
              >
                ✕
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="space-y-3 mb-8">
            {renderStepIndicator(1, "Check Permission")}
            {renderStepIndicator(2, "Reset Browser Settings")}
            {renderStepIndicator(3, "Test Access")}
            {renderStepIndicator(4, "Success!")}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="text-center space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg">Let's check your microphone permission</h3>
                  <p className="text-muted-foreground">We'll test if your browser allows microphone access</p>
                </div>
                
                <Button
                  onClick={testMicrophonePermission}
                  disabled={isTestingMic}
                  className="calm-button gap-2 mx-auto"
                >
                  {isTestingMic ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Test Microphone Access
                    </>
                  )}
                </Button>

                {permissionState === 'denied' && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Permission Denied</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your browser is currently blocking microphone access. Let's fix this!
                    </p>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      size="sm"
                      className="calm-button gap-2"
                    >
                      Show Fix Instructions
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <h3 className="text-lg">Reset Your Browser Permissions</h3>
                  <p className="text-muted-foreground">Follow these steps to allow microphone access</p>
                </div>

                {renderBrowserInstructions()}

                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-medium">Need the Website URL?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1">
                      {window.location.href}
                    </code>
                    <Button
                      onClick={copyCurrentUrl}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="calm-button gap-2"
                  >
                    I've Updated Settings
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={refreshPage}
                    variant="outline"
                    className="rounded-xl gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg">Test Your Updated Settings</h3>
                  <p className="text-muted-foreground">
                    Now let's verify that microphone access is working
                  </p>
                </div>

                <Button
                  onClick={testMicrophonePermission}
                  disabled={isTestingMic}
                  className="calm-button gap-2 mx-auto"
                >
                  {isTestingMic ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Testing Access...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Test Microphone Now
                    </>
                  )}
                </Button>

                <div className="text-sm text-muted-foreground">
                  Your browser should show a permission popup. Click "Allow" when prompted.
                </div>

                {permissionState === 'denied' && (
                  <div className="bg-sunset-orange/10 border border-sunset-orange/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sunset-orange mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Still Having Issues?</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Try these additional steps:
                    </p>
                    <div className="text-left text-sm space-y-2">
                      <div>• Clear your browser cache and cookies for this site</div>
                      <div>• Try using an incognito/private browsing window</div>
                      <div>• Restart your browser completely</div>
                      <div>• Check if other applications are using your microphone</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                      >
                        Review Instructions
                      </Button>
                      <Button
                        onClick={refreshPage}
                        size="sm"
                        className="calm-button"
                      >
                        Try Fresh Page
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-peaceful-green/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-peaceful-green" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg text-peaceful-green">Success! 🎉</h3>
                  <p className="text-muted-foreground">
                    Your microphone is now ready to use. You can start recording voice notes!
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      onPermissionGranted?.();
                      onClose?.();
                    }}
                    className="calm-button gap-2"
                  >
                    Start Recording
                    <Mic className="w-4 h-4" />
                  </Button>
                  {onClose && (
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}