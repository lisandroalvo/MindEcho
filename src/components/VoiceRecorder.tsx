import { useState, useRef, useEffect } from 'react';
import { Note } from './VoiceNotesApp';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onNewNote: (note: Note) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => any;
  }
}

export function VoiceRecorder({ onNewNote }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Initialize speech recognition
  useEffect(() => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Started recording');
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      console.log('Got transcript:', transcript);
      setTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Recognition error:', event.error);
      toast.error('Recognition error - please try again');
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      chunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newNote: Note = {
          id: Date.now().toString(),
          text: transcript || 'Untitled Note',
          timestamp: Date.now(),
          audioUrl: audioUrl,
        };

        onNewNote(newNote);
        setTranscript('');
        setIsRecording(false);

        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start(1000);
      recognitionRef.current?.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Recording error:', error);
      setError(error.message || 'Failed to start recording');
      toast.error(error.message || 'Failed to start recording');
      setIsRecording(false);

      // Clean up any partial setup
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error('Error stopping recorder:', e);
        }
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    }
  };

  return (
    <div className="p-6 bg-card rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Voice Recorder</h2>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
            isRecording
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
          disabled={!!error}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}
      
      {isRecording && (
        <div className="mt-4">
          <div className="animate-pulse h-12 bg-accent rounded-lg"></div>
          <p className="mt-4 text-muted-foreground">
            {transcript || 'Listening...'}
          </p>
        </div>
      )}
    </div>
  );
}
