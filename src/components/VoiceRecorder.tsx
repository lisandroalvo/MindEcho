import { useState, useRef, useEffect } from 'react';
import { Note } from './VoiceNotesApp';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onNewNote: (note: Note) => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    item(index: number): {
      item(index: number): {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceRecorder({ onNewNote }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          throw new Error('Speech recognition is not supported in this browser');
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const results = Array.from({ length: event.results.length }, (_, i) => 
            event.results.item(i).item(0).transcript
          );
          const transcript = results.join('');
          setTranscript(transcript);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          toast.error(`Speech recognition error: ${event.error}`);
          stopRecording();
        };

        recognitionRef.current.onend = () => {
          if (isRecording) {
            // Restart recognition if it ends while we're still recording
            recognitionRef.current?.start();
          }
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize speech recognition');
        toast.error('Speech recognition initialization failed');
      }
    }

    return () => {
      // Cleanup on unmount
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (chunksRef.current.length === 0) {
          toast.error('No audio data was recorded');
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newNote: Note = {
          id: Date.now().toString(),
          text: transcript || 'Untitled Note',
          timestamp: Date.now(),
          audioUrl
        };

        onNewNote(newNote);
        setTranscript('');
        toast.success('Note saved successfully');
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Error recording audio');
        toast.error('Error recording audio');
        stopRecording();
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      recognitionRef.current?.start();
      setIsRecording(true);
      toast.info('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      recognitionRef.current?.stop();
      setIsRecording(false);

      // Stop all audio tracks
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to stop recording');
      toast.error('Failed to stop recording');
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
