import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Note {
  id: string;
  text: string;
  timestamp: Date;
}

type PermissionState = 'unknown' | 'granted' | 'denied' | 'prompt';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    checkMicrophonePermission();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setPermissionState('denied');
        toast.error('Microphone access required');
      } else if (event.error === 'no-speech') {
        toast.error('No speech detected');
      } else {
        toast.error('Recognition error');
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    const savedNotes = localStorage.getItem('voiceNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    if (!navigator.permissions) {
      setPermissionState('unknown');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(result.state as PermissionState);
      
      result.addEventListener('change', () => {
        setPermissionState(result.state as PermissionState);
      });
    } catch (error) {
      setPermissionState('unknown');
    }
  };

  const requestMicrophonePermission = async () => {
    setIsCheckingPermission(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      toast.success('Microphone access granted');
    } catch (error) {
      setPermissionState('denied');
      toast.error('Microphone access denied');
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const startRecording = async () => {
    if (!recognitionRef.current || !isSupported) return;
    
    if (permissionState === 'denied') {
      toast.error('Microphone access denied');
      return;
    }
    
    if (permissionState === 'prompt' || permissionState === 'unknown') {
      await requestMicrophonePermission();
      if (permissionState === 'denied') return;
    }
    
    try {
      setTranscript('');
      setIsRecording(true);
      recognitionRef.current.start();
    } catch (error) {
      setIsRecording(false);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    setIsRecording(false);
    recognitionRef.current.stop();
  };

  const saveNote = () => {
    if (!transcript.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      text: transcript.trim(),
      timestamp: new Date(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
    setTranscript('');
    toast.success('Note saved');
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
    toast.success('Note deleted');
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Mic className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg">Browser not supported</h2>
          <p className="text-sm text-muted-foreground">Please use Chrome, Safari, or Edge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-medium mb-2">Voice Notes</h1>
            <p className="text-muted-foreground text-sm">Speak your thoughts, save as text</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Recording Area */}
        <div className="text-center mb-16">
          {/* Record Button */}
          <div className="mb-8">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={permissionState === 'denied' || isCheckingPermission}
              className={`
                w-24 h-24 rounded-full p-0 transition-all duration-200 shadow-lg hover:shadow-xl
                ${isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-primary hover:bg-primary/90'
                }
              `}
            >
              {isRecording ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </Button>
          </div>

          {/* Status Text */}
          <div className="mb-8">
            {isRecording ? (
              <div className="flex items-center justify-center gap-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            ) : permissionState === 'denied' ? (
              <p className="text-sm text-muted-foreground">Microphone access required</p>
            ) : (
              <p className="text-sm text-muted-foreground">Tap to start recording</p>
            )}
          </div>

          {/* Permission Prompt */}
          {permissionState === 'prompt' && (
            <Button 
              onClick={requestMicrophonePermission} 
              disabled={isCheckingPermission}
              variant="outline"
              className="mb-8"
            >
              {isCheckingPermission ? 'Checking...' : 'Enable Microphone'}
            </Button>
          )}
        </div>

        {/* Live Transcript */}
        {(transcript || isRecording) && (
          <div className="mb-12">
            <div className="bg-muted/50 rounded-xl p-6 min-h-32 border border-border/50">
              {transcript ? (
                <p className="text-foreground leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-muted-foreground italic">Listening...</p>
              )}
            </div>
            
            {transcript && (
              <div className="text-center mt-4">
                <Button 
                  onClick={saveNote}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Note
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Saved Notes */}
        {notes.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-6">Recent Notes</h2>
            <div className="space-y-4">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className="group bg-card border border-border/50 rounded-lg p-4 hover:border-border transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed mb-2 text-foreground">
                        {note.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {note.timestamp.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Button
                      onClick={() => deleteNote(note.id)}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notes.length === 0 && !transcript && !isRecording && (
          <div className="text-center text-muted-foreground">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <p className="text-sm">Your voice notes will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}