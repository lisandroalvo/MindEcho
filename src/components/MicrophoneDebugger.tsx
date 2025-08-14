import { useState, useEffect, useRef } from 'react';

interface MicrophoneDebuggerProps {
  onSuccess: () => void;
}

export function MicrophoneDebugger({ onSuccess }: MicrophoneDebuggerProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadDevices();
    return () => {
      stopRecording();
    };
  }, []);

  const loadDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      setDevices(audioDevices);
      if (audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0].deviceId);
      }
    } catch (err) {
      setError('Error accessing microphone: ' + (err as Error).message);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined
        }
      });

      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (!analyserRef.current || !isRecording) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(average);
        
        if (isRecording) {
          requestAnimationFrame(updateVolume);
        }
      };

      setIsRecording(true);
      updateVolume();
      onSuccess();
    } catch (err) {
      setError('Error starting recording: ' + (err as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setVolume(0);
  };

  return (
    <div className="p-6 bg-card rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold mb-6 text-foreground">
        Microphone Debugger
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Select Microphone
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full px-4 py-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isRecording ? 'Stop Test' : 'Start Test'}
          </button>
        </div>

        {isRecording && (
          <div>
            <div className="mb-2 flex justify-between text-sm text-muted-foreground">
              <span>Volume Level</span>
              <span>{Math.round((volume / 255) * 100)}%</span>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${(volume / 255) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
