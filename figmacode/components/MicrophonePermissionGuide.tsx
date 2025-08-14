import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Mic, AlertCircle, CheckCircle, ExternalLink, Copy, RefreshCw, Chrome, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MicrophonePermissionGuideProps {
  onPermissionGranted: () => void;
  onClose?: () => void;
}

interface BrowserInfo {
  name: string;
  icon: React.ReactNode;
  instructions: {
    title: string;
    steps: string[];
    additionalTips?: string[];
  }[];
}

export function MicrophonePermissionGuide({ onPermissionGranted, onClose }: MicrophonePermissionGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isTestingPermission, setIsTestingPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    detectBrowserAndSetInstructions();
    checkInitialPermission();
  }, []);

  const detectBrowserAndSetInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      setBrowserInfo({
        name: 'Chrome',
        icon: <Chrome className="w-5 h-5" />,
        instructions: [
          {
            title: 'Method 1: Address Bar Permission',
            steps: [
              'Look for a 🔒 lock icon or 🎤 microphone icon in your address bar (next to the URL)',
              'Click on the icon to open the permissions menu',
              'Set "Microphone" to "Always allow" or "Allow"',
              'Refresh this page and try recording again'
            ]
          },
          {
            title: 'Method 2: Chrome Settings',
            steps: [
              'Click the three dots (⋮) in the top-right corner of Chrome',
              'Go to Settings → Privacy and security → Site Settings',
              'Click on "Microphone" in the permissions list',
              'Find this website in the "Not allowed" list and remove it',
              'Or add this site to the "Allowed" list'
            ],
            additionalTips: [
              'You can also type chrome://settings/content/microphone in your address bar',
              'Make sure "Sites can ask to use your microphone" is enabled'
            ]
          }
        ]
      });
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      setBrowserInfo({
        name: 'Safari',
        icon: <Globe className="w-5 h-5" />,
        instructions: [
          {
            title: 'Method 1: Safari Preferences',
            steps: [
              'Click Safari in the menu bar → Settings (or Preferences)',
              'Click the "Websites" tab at the top',
              'Select "Microphone" from the left sidebar',
              'Find this website and set it to "Allow"',
              'If not listed, set the default to "Allow" at the bottom'
            ]
          },
          {
            title: 'Method 2: Per-Site Settings',
            steps: [
              'Right-click in the address bar',
              'Select "Settings for This Website"',
              'Set Microphone to "Allow"',
              'Refresh the page'
            ]
          }
        ]
      });
    } else if (userAgent.includes('firefox')) {
      setBrowserInfo({
        name: 'Firefox',
        icon: <Globe className="w-5 h-5" />,
        instructions: [
          {
            title: 'Method 1: Address Bar Permission',
            steps: [
              'Look for a 🛡️ shield icon or 🎤 microphone icon in your address bar',
              'Click the icon to see blocked permissions',
              'Click "Allow" next to microphone access',
              'Choose "Remember this decision" if you want to save it'
            ]
          },
          {
            title: 'Method 2: Firefox Settings',
            steps: [
              'Click the menu button (☰) and select Settings',
              'Go to Privacy & Security in the left sidebar',
              'Scroll down to Permissions → Microphone',
              'Click "Settings..." next to Microphone',
              'Remove this site from blocked list or add to allowed list'
            ]
          }
        ]
      });
    } else if (userAgent.includes('edg')) {
      setBrowserInfo({
        name: 'Edge',
        icon: <Globe className="w-5 h-5" />,
        instructions: [
          {
            title: 'Method 1: Address Bar Permission',
            steps: [
              'Click the 🔒 lock icon in your address bar',
              'Set Microphone permission to "Allow"',
              'Refresh the page'
            ]
          },
          {
            title: 'Method 2: Edge Settings',
            steps: [
              'Click the three dots (...) → Settings',
              'Go to Site permissions in the left menu',
              'Click "Microphone"',
              'Remove this site from the "Block" list or add to "Allow" list'
            ]
          }
        ]
      });
    } else {
      setBrowserInfo({
        name: 'Your Browser',
        icon: <Globe className="w-5 h-5" />,
        instructions: [
          {
            title: 'General Instructions',
            steps: [
              'Look for a lock, shield, or microphone icon in your address bar',
              'Click it to access site permissions',
              'Allow microphone access for this website',
              'Check your browser settings for site permissions'
            ]
          }
        ]
      });
    }
  };

  const checkInitialPermission = async () => {
    if (!navigator.permissions) return;
    
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionStatus(result.state as any);
    } catch (error) {
      console.error('Permission query failed:', error);
    }
  };

  const testMicrophonePermission = async () => {
    setIsTestingPermission(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      toast.success('🎉 Success! Microphone access granted.');
      
      setTimeout(() => {
        onPermissionGranted();
        onClose?.();
      }, 1500);
      
    } catch (error: any) {
      console.error('Permission test failed:', error);
      setPermissionStatus('denied');
      
      if (error.name === 'NotAllowedError') {
        toast.error('❌ Still denied. Please follow the instructions below.');
      } else {
        toast.error(`❌ Error: ${error.message}`);
      }
    } finally {
      setIsTestingPermission(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('📋 URL copied to clipboard');
  };

  const getCurrentInstructions = () => {
    if (!browserInfo || currentStep >= browserInfo.instructions.length) {
      return browserInfo?.instructions[0] || null;
    }
    return browserInfo.instructions[currentStep];
  };

  const currentInstructions = getCurrentInstructions();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="zen-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl mb-2">Microphone Permission Required</h2>
              <p className="text-muted-foreground">
                Your browser is blocking microphone access. Let's fix this step by step.
              </p>
            </div>
          </div>

          {/* Browser Detection */}
          {browserInfo && (
            <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3">
              {browserInfo.icon}
              <div>
                <div className="font-medium">Detected Browser: {browserInfo.name}</div>
                <div className="text-sm text-muted-foreground">
                  Instructions customized for your browser
                </div>
              </div>
            </div>
          )}

          {/* Permission Status */}
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Current Status:</span>
              <div className="flex items-center gap-2">
                {permissionStatus === 'granted' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-peaceful-green" />
                    <span className="text-peaceful-green">Granted</span>
                  </>
                ) : permissionStatus === 'denied' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">Denied</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Unknown</span>
                  </>
                )}
              </div>
            </div>
            
            <Button
              onClick={testMicrophonePermission}
              disabled={isTestingPermission}
              className="w-full calm-button gap-2"
            >
              {isTestingPermission ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Test Microphone Access
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          {currentInstructions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{currentInstructions.title}</h3>
                {browserInfo && browserInfo.instructions.length > 1 && (
                  <div className="flex gap-2">
                    {browserInfo.instructions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentStep ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {currentInstructions.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>

              {currentInstructions.additionalTips && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="font-medium text-primary mb-2">💡 Additional Tips:</div>
                  <ul className="text-sm space-y-1">
                    {currentInstructions.additionalTips.map((tip, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Website URL */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Website URL:</span>
              <Button
                onClick={copyUrl}
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <code className="text-xs bg-background px-2 py-1 rounded break-all block">
              {window.location.href}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Copy this URL to find this site in your browser settings
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {browserInfo && browserInfo.instructions.length > 1 && currentStep > 0 && (
              <Button
                onClick={() => setCurrentStep(currentStep - 1)}
                variant="outline"
                className="rounded-xl"
              >
                Previous Method
              </Button>
            )}
            
            {browserInfo && browserInfo.instructions.length > 1 && currentStep < browserInfo.instructions.length - 1 && (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                variant="outline"
                className="rounded-xl"
              >
                Try Another Method
              </Button>
            )}
            
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-xl gap-2 ml-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
            
            {onClose && (
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
            )}
          </div>

          {/* Emergency Instructions */}
          <div className="border-t pt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                🆘 Still not working? Click for emergency instructions
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                <div className="bg-sunset-orange/10 border border-sunset-orange/30 rounded-lg p-3">
                  <div className="font-medium text-sunset-orange mb-2">Try these solutions:</div>
                  <ul className="space-y-1">
                    <li>• Close other apps that might be using your microphone (Zoom, Skype, Discord)</li>
                    <li>• Try using an incognito/private browsing window</li>
                    <li>• Clear your browser's cache and cookies</li>
                    <li>• Restart your browser completely</li>
                    <li>• Check your system's microphone privacy settings</li>
                    <li>• Make sure your microphone is properly connected and working</li>
                  </ul>
                </div>
                
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="font-medium text-primary mb-2">🔧 System Settings:</div>
                  <ul className="space-y-1">
                    <li>• <strong>Windows:</strong> Settings → Privacy → Microphone</li>
                    <li>• <strong>Mac:</strong> System Preferences → Security & Privacy → Microphone</li>
                    <li>• <strong>Linux:</strong> Check your audio settings and permissions</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        </div>
      </Card>
    </div>
  );
}