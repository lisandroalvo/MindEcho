import { useState, useRef, useEffect } from 'react';
import { Note } from './VoiceNotesApp';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onNewNote: (note: Note) => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  item(index: number): {
    transcript: string;
  };
}

interface SpeechRecognitionResultList {
  item(index: number): SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
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
    if (typeof window === 'undefined') return;

    const initializeSpeechRecognition = () => {
      try {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          throw new Error('Speech recognition is not supported in this browser');
        }

        // Create and configure recognition instance
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Set language explicitly

        // Handle results
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results.item(i);
            if (result.isFinal) {
              finalTranscript += result.item(0).transcript;
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript);
          }
        };

        // Handle errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          let errorMessage = 'Speech recognition error';
          
          switch (event.error) {
            case 'network':
              errorMessage = 'Network error occurred. Please check your connection.';
              break;
            case 'not-allowed':
            case 'permission-denied':
              errorMessage = 'Microphone permission is required.';
              break;
            case 'no-speech':
              errorMessage = 'No speech was detected.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone was found or microphone is disabled.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          setError(errorMessage);
          toast.error(errorMessage);
          stopRecording();
        };

        // Handle recognition end
        recognition.onend = () => {
          console.log('Speech recognition ended');
          if (isRecording) {
            console.log('Restarting speech recognition...');
            recognition.start();
          }
        };

        // Store the recognition instance
        recognitionRef.current = recognition;
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize speech recognition';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    initializeSpeechRecognition();

    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Initialize MediaRecorder with optimal settings
      const options = {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      // Handle incoming audio data
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        if (chunksRef.current.length === 0) {
          toast.error('No audio data was recorded');
          return;
        }

        try {
          const audioBlob = new Blob(chunksRef.current, { type: options.mimeType });
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
        } catch (error) {
          console.error('Error creating audio blob:', error);
          toast.error('Error saving audio recording');
        }
      };

      // Handle MediaRecorder errors
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Error recording audio');
        toast.error('Error recording audio');
        stopRecording();
      };

      // Start both audio and speech recognition
      mediaRecorderRef.current.start(1000); // Collect data every second
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          // Continue with audio recording even if speech recognition fails
          toast.warning('Speech-to-text may not work, but audio recording will continue');
        }
      }

      setIsRecording(true);
      toast.info('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error 
        ? error.message
        : 'Failed to start recording. Please check microphone permissions.';
      setError(errorMessage);
      toast.error(errorMessage);
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
