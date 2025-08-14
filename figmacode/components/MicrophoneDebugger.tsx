import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Mic, MicOff, AlertCircle, CheckCircle, Info, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MicrophoneDebuggerProps {
  onClose?: () => void;
}

interface DebugInfo {
  browserSupport: boolean;
  permissionStatus: string;
  microphoneDevices: MediaDeviceInfo[];
  speechRecognitionSupport: boolean;
  httpsConnection: boolean;
  userAgent: string;
  currentUrl: string;
}

export function MicrophoneDebugger({ onClose }: MicrophoneDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    browserSupport: false,
    permissionStatus: 'unknown',
    microphoneDevices: [],
    speechRecognitionSupport: false,
    httpsConnection: false,
    userAgent: '',
    currentUrl: '',
  });
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  useEffect(() => {
    checkSystemCapabilities();
  }, []);

  const checkSystemCapabilities = async () => {
    const info: DebugInfo = {
      browserSupport: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      permissionStatus: 'unknown',
      microphoneDevices: [],
      speechRecognitionSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      httpsConnection: location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1',
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
    };

    // Check permission status
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        info.permissionStatus = permission.state;
      } catch (error) {
        console.error('Permission query failed:', error);
      }
    }

    // Get microphone devices (may be limited if no permission)
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        info.microphoneDevices = devices.filter(device => device.kind === 'audioinput');
      } catch (error) {
        console.error('Device enumeration failed:', error);
      }
    }

    setDebugInfo(info);
  };

  const testMicrophoneAccess = async () => {
    setIsTestingMic(true);
    
    try {
      // Request with specific constraints that are more likely to succeed
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        } 
      });
      
      setTestStream(stream);
      toast.success('✅ Microphone access granted! Test successful.');
      
      // Update permission status
      await checkSystemCapabilities();
      
      // Stop the test stream after a few seconds
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setTestStream(null);
          toast.success('Microphone test completed.');
        }
      }, 3000);
      
    } catch (error: any) {
      console.error('Microphone test failed:', error);
      
      let errorMessage = 'Unknown microphone error';
      let actionMessage = '';
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Microphone access denied by user or browser policy';
          actionMessage = 'Click "Reset Permissions" below for step-by-step instructions';
          setShowPermissionGuide(true);
          break;
        case 'NotFoundError':
          errorMessage = 'No microphone device found';
          actionMessage = 'Please connect a microphone and refresh the page';
          break;
        case 'NotSupportedError':
          errorMessage = 'Microphone not supported in this browser';
          actionMessage = 'Try using Chrome, Safari, or Edge';
          break;
        case 'NotReadableError':
          errorMessage = 'Microphone is being used by another application';
          actionMessage = 'Close other applications using the microphone';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Microphone constraints not supported';
          actionMessage = 'Your microphone may not support the required settings';
          break;
        case 'SecurityError':
          errorMessage = 'Security error accessing microphone';
          actionMessage = 'Make sure you\'re using HTTPS or localhost';
          break;
        default:
          errorMessage = error.message || 'Microphone access failed';
          actionMessage = 'Try refreshing the page or restarting your browser';
      }
      
      toast.error(`❌ ${errorMessage}. ${actionMessage}`);
      
      // Update permission status
      await checkSystemCapabilities();
    } finally {
      setIsTestingMic(false);
    }
  };

  const stopMicrophoneTest = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
      toast.success('Microphone test stopped.');
    }
  };

  const testSpeechRecognition = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('❌ Speech Recognition not supported in this browser.');
      return;
    }

    if (debugInfo.permissionStatus !== 'granted') {
      toast.error('❌ Please grant microphone permission first.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      let hasStarted = false;

      recognition.onstart = () => {
        hasStarted = true;
        toast.success('🎙️ Speech recognition started. Say something!');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        toast.success(`✅ Speech detected: "${transcript}" (${Math.round(confidence * 100)}% confidence)`);
        recognition.stop();
      };

      recognition.onerror = (event) => {
        let errorMsg = `❌ Speech recognition error: ${event.error}`;
        if (event.error === 'not-allowed') {
          errorMsg = '❌ Microphone permission required for speech recognition';
        } else if (event.error === 'no-speech') {
          errorMsg = '❌ No speech detected. Try speaking louder or closer to the microphone';
        }
        toast.error(errorMsg);
      };

      recognition.onend = () => {
        if (hasStarted) {
          console.log('Speech recognition test completed');
        }
      };

      // Set a timeout to stop recognition if no speech is detected
      setTimeout(() => {
        if (hasStarted) {
          recognition.stop();
          toast.info('Speech recognition test timed out');
        }
      }, 10000);

      recognition.start();
    } catch (error: any) {
      toast.error(`❌ Speech recognition test failed: ${error.message}`);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(debugInfo.currentUrl);
    toast.success('URL copied to clipboard');
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-peaceful-green" />
    ) : (
      <AlertCircle className="w-5 h-5 text-destructive" />
    );
  };

  const getPermissionColor = (status: string) => {
    switch (status) {
      case 'granted': return 'text-peaceful-green';
      case 'denied': return 'text-destructive';
      case 'prompt': return 'text-sunset-orange';
      default: return 'text-muted-foreground';
    }
  };

  const getBrowserName = () => {
    const userAgent = debugInfo.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('edge')) return 'Edge';
    return 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="zen-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-primary" />
              <h2 className="text-xl">Microphone Diagnostics & Troubleshooting</h2>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={refreshPage}
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
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
          </div>

          <div className="space-y-6">
            {/* Permission Status Alert */}
            {debugInfo.permissionStatus === 'denied' && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-medium text-destructive mb-2">Microphone Permission Denied</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your browser has blocked microphone access. You need to reset permissions to use voice recording.
                    </p>
                    <Button
                      onClick={() => setShowPermissionGuide(!showPermissionGuide)}
                      className="calm-button gap-2"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {showPermissionGuide ? 'Hide' : 'Show'} Permission Reset Guide
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Permission Reset Guide */}
            {showPermissionGuide && (
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-medium mb-3">How to Reset Microphone Permissions in {getBrowserName()}</h3>
                <div className="space-y-3 text-sm">
                  {getBrowserName() === 'Chrome' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                        <span>Click the <strong>lock icon</strong> or <strong>camera/microphone icon</strong> in the address bar</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                        <span>Set Microphone to <strong>"Ask (default)"</strong> or <strong>"Allow"</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                        <span>Refresh this page and try again</span>
                      </div>
                    </>
                  )}
                  {getBrowserName() === 'Safari' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                        <span>Go to Safari → Settings → Websites → Microphone</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                        <span>Find this website and set it to <strong>"Allow"</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                        <span>Refresh this page and try again</span>
                      </div>
                    </>
                  )}
                  {getBrowserName() === 'Firefox' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                        <span>Click the <strong>shield icon</strong> or <strong>microphone icon</strong> in the address bar</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                        <span>Click <strong>"Temporarily allow"</strong> or remove the microphone block</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                        <span>Refresh this page and try again</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current URL:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs flex-1">{debugInfo.currentUrl}</code>
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
                </div>
              </div>
            )}

            {/* System Capabilities */}
            <div className="space-y-3">
              <h3 className="text-lg">System Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span>Browser Support</span>
                  {getStatusIcon(debugInfo.browserSupport)}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span>Speech Recognition</span>
                  {getStatusIcon(debugInfo.speechRecognitionSupport)}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span>Secure Connection</span>
                  {getStatusIcon(debugInfo.httpsConnection)}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span>Permission Status</span>
                  <span className={`capitalize font-medium ${getPermissionColor(debugInfo.permissionStatus)}`}>
                    {debugInfo.permissionStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Available Microphones */}
            <div className="space-y-3">
              <h3 className="text-lg">Available Microphones</h3>
              <div className="space-y-2">
                {debugInfo.microphoneDevices.length > 0 ? (
                  debugInfo.microphoneDevices.map((device, index) => (
                    <div key={device.deviceId || index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <Mic className="w-4 h-4 text-primary" />
                      <span>{device.label || `Microphone ${index + 1}`}</span>
                      {device.deviceId && (
                        <code className="text-xs text-muted-foreground ml-auto">
                          {device.deviceId.substring(0, 8)}...
                        </code>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    <MicOff className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {debugInfo.permissionStatus === 'denied' 
                        ? 'Microphone access denied - devices hidden for privacy'
                        : 'No microphones detected'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Controls */}
            <div className="space-y-3">
              <h3 className="text-lg">Tests</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={testStream ? stopMicrophoneTest : testMicrophoneAccess}
                  disabled={isTestingMic || !debugInfo.browserSupport}
                  className={`gap-2 ${testStream ? 'bg-destructive hover:bg-destructive/90' : 'calm-button'}`}
                >
                  {isTestingMic ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : testStream ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop Mic Test
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Test Microphone Access
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={testSpeechRecognition}
                  disabled={!debugInfo.speechRecognitionSupport || debugInfo.permissionStatus !== 'granted'}
                  className="calm-button gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Test Speech Recognition
                </Button>

                <Button
                  onClick={checkSystemCapabilities}
                  variant="outline"
                  className="rounded-xl gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </Button>
              </div>
            </div>

            {/* Browser Information */}
            <div className="space-y-3">
              <h3 className="text-lg">Browser Information</h3>
              <div className="space-y-2">
                <div className="p-3 bg-muted/30 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">Browser</div>
                  <div className="font-mono text-sm">{getBrowserName()}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">User Agent</div>
                  <code className="text-xs text-muted-foreground break-all block">
                    {debugInfo.userAgent}
                  </code>
                </div>
              </div>
            </div>

            {/* Troubleshooting Tips */}
            <div className="space-y-3">
              <h3 className="text-lg">Troubleshooting Tips</h3>
              <div className="space-y-2 text-sm">
                {!debugInfo.httpsConnection && (
                  <div className="flex items-start gap-2 p-3 bg-sunset-orange/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-sunset-orange mt-0.5" />
                    <div>
                      <strong>Use HTTPS:</strong> Microphone access requires a secure connection. 
                      Try accessing via HTTPS or use localhost for development.
                    </div>
                  </div>
                )}
                
                {!debugInfo.speechRecognitionSupport && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <strong>Browser Compatibility:</strong> Speech Recognition is not supported. 
                      Try using Chrome, Safari, or Edge for the best experience.
                    </div>
                  </div>
                )}
                
                {debugInfo.permissionStatus === 'denied' && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <strong>Permission Denied:</strong> Follow the permission reset guide above, 
                      then refresh this page and try again.
                    </div>
                  </div>
                )}
                
                {debugInfo.microphoneDevices.length === 0 && debugInfo.permissionStatus !== 'denied' && (
                  <div className="flex items-start gap-2 p-3 bg-sunset-orange/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-sunset-orange mt-0.5" />
                    <div>
                      <strong>No Microphones:</strong> Make sure a microphone is connected and enabled 
                      in your system settings. You may need to restart your browser.
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-xl">
                  <Info className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <strong>Still having issues?</strong> Try closing other applications that might be using your microphone 
                    (Zoom, Skype, etc.), restart your browser, or try using an incognito/private window.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}