import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Mic, MicOff, Plus, History, Save, Circle, Settings, AlertTriangle, RefreshCw, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Note, Folder, NoteFilter, ViewMode } from '../types/notes';
import { FolderManager } from './FolderManager';
import { NotesHistoryTimeline } from './NotesHistoryTimeline';
import { NotesSearch } from './NotesSearch';
import { ThemeToggle } from './ThemeToggle';
import { MicrophoneDebugger } from './MicrophoneDebugger';
import { MicrophonePermissionGuide } from './MicrophonePermissionGuide';

type PermissionState = 'unknown' | 'granted' | 'denied' | 'prompt';

export function VoiceNotesApp() {
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isClicking, setIsClicking] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [hasTriedPermission, setHasTriedPermission] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isRecognitionActive = useRef(false);

  // Notes and folders state
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  
  // UI state
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<NoteFilter>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{ title: string; text: string }>({ title: '', text: '' });

  // Check if we're on a secure connection
  const isSecureConnection = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // Format recording duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Create ripple effect on button click
  const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }, []);

  // Check microphone permission status
  const checkMicrophonePermission = useCallback(async () => {
    if (!navigator.permissions) {
      setPermissionState('unknown');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(result.state as PermissionState);
      
      result.addEventListener('change', () => {
        setPermissionState(result.state as PermissionState);
        if (result.state === 'granted') {
          toast.success('✅ Microphone permission granted!');
        }
      });
    } catch (error) {
      console.error('Permission query failed:', error);
      setPermissionState('unknown');
    }
  }, []);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      setIsSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      isRecognitionActive.current = true;
      toast.success('🎙️ Recording started - speak now!');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcript
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      
      // Show interim results (replace previous interim)
      if (interimTranscript) {
        setTranscript(prev => {
          // Remove previous interim results and add new ones
          const lines = prev.split('\n');
          const lastLine = lines[lines.length - 1];
          if (lastLine && !lastLine.endsWith('.') && !lastLine.endsWith('!') && !lastLine.endsWith('?')) {
            lines[lines.length - 1] = interimTranscript;
            return lines.join('\n');
          } else {
            return prev + interimTranscript;
          }
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event);
      isRecognitionActive.current = false;
      
      switch (event.error) {
        case 'not-allowed':
          setPermissionState('denied');
          setHasTriedPermission(true);
          toast.error('🚫 Microphone access denied. Please check your browser settings.');
          break;
        case 'no-speech':
          toast.error('🔇 No speech detected. Try speaking louder.');
          break;
        case 'network':
          toast.error('🌐 Network error. Check your internet connection.');
          break;
        default:
          toast.error(`❌ Recognition error: ${event.error}`);
      }
      
      stopRecording();
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      isRecognitionActive.current = false;
      
      // Only restart if still recording and permissions are good
      if (isRecording && !document.hidden && permissionState === 'granted') {
        setTimeout(() => {
          if (isRecording && recognitionRef.current && !isRecognitionActive.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
              stopRecording();
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [isRecording, permissionState]);

  useEffect(() => {
    // Check browser compatibility
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Check HTTPS requirement
    if (!isSecureConnection) {
      toast.error('🔒 Microphone requires HTTPS or localhost.');
      setIsSupported(false);
      return;
    }

    checkMicrophonePermission();
    
    // Initialize speech recognition
    const recognition = initializeSpeechRecognition();
    recognitionRef.current = recognition;

    // Load saved data
    loadSavedData();

    return () => {
      if (recognitionRef.current && isRecognitionActive.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [checkMicrophonePermission, initializeSpeechRecognition, isSecureConnection]);

  // Timer effect
  useEffect(() => {
    if (isRecording && recordingStartTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, recordingStartTime]);

  const loadSavedData = () => {
    try {
      const savedNotes = localStorage.getItem('voiceNotes');
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp)
        }));
        setNotes(parsedNotes);
      }

      const savedFolders = localStorage.getItem('noteFolders');
      if (savedFolders) {
        const parsedFolders = JSON.parse(savedFolders).map((folder: any) => ({
          ...folder,
          createdAt: new Date(folder.createdAt)
        }));
        setFolders(parsedFolders);
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
      toast.error('⚠️ Failed to load saved notes and folders.');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      setHasTriedPermission(true);
      await checkMicrophonePermission();
      return true;
    } catch (error: any) {
      console.error('Permission request failed:', error);
      setPermissionState('denied');
      setHasTriedPermission(true);
      
      if (error.name === 'NotAllowedError') {
        setShowPermissionGuide(true);
        toast.error('❌ Permission denied. Opening setup guide...');
      } else {
        toast.error(`❌ Error: ${error.message}`);
      }
      return false;
    }
  };

  const startRecording = async () => {
    if (!recognitionRef.current || !isSupported) {
      toast.error('❌ Speech recognition not available. Try Chrome, Safari, or Edge.');
      return;
    }
    
    if (!isSecureConnection) {
      toast.error('🔒 Microphone requires HTTPS or localhost.');
      return;
    }

    // Check if we need to request permission
    if (permissionState !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }
    
    try {
      // Clear previous transcript and start recording
      setTranscript('');
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
      isRecognitionActive.current = false;
      
      // Start speech recognition
      recognitionRef.current.start();
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setRecordingStartTime(null);
      
      if (error.name === 'InvalidStateError') {
        toast.error('⚠️ Speech recognition already running. Wait and try again.');
      } else if (error.name === 'NotAllowedError') {
        setShowPermissionGuide(true);
        toast.error('❌ Permission denied. Opening setup guide...');
      } else {
        toast.error('❌ Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    setIsRecording(false);
    setRecordingStartTime(null);
    isRecognitionActive.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (transcript.trim()) {
      toast.success('🛑 Recording stopped. Ready to save!');
    } else {
      toast.info('🛑 Recording stopped.');
    }
  }, [transcript]);

  const handleRecordingClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Add click animation
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 200);
    
    // Create ripple effect
    createRipple(event);
    
    // Toggle recording
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePermissionGranted = () => {
    setPermissionState('granted');
    setHasTriedPermission(true);
    checkMicrophonePermission();
    // Reinitialize speech recognition
    const recognition = initializeSpeechRecognition();
    recognitionRef.current = recognition;
    toast.success('✅ Ready to record!');
  };

  const saveNote = () => {
    if (!transcript.trim()) {
      toast.error('❌ No content to save. Please record some audio first.');
      return;
    }

    const duration = recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : recordingDuration;

    const newNote: Note = {
      id: Date.now().toString(),
      text: transcript.trim(),
      timestamp: new Date(),
      folderId: selectedFolderId,
      duration,
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
    setTranscript('');
    setRecordingDuration(0);
    toast.success('💾 Note saved successfully!');
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, ...updates } : note
    );
    setNotes(updatedNotes);
    localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
    toast.success('🗑️ Note deleted');
  };

  const toggleNoteFavorite = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      updateNote(id, { isFavorite: !note.isFavorite });
      toast.success(note.isFavorite ? '💔 Removed from favorites' : '❤️ Added to favorites');
    }
  };

  const moveNoteToFolder = (noteId: string, folderId?: string) => {
    updateNote(noteId, { folderId });
    const folder = folders.find(f => f.id === folderId);
    toast.success(`📁 Moved to ${folder ? folder.name : 'All Notes'}`);
  };

  // Folder management
  const createFolder = (folderData: Omit<Folder, 'id'>) => {
    const newFolder: Folder = {
      ...folderData,
      id: Date.now().toString(),
    };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('noteFolders', JSON.stringify(updatedFolders));
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    const updatedFolders = folders.map(folder => 
      folder.id === id ? { ...folder, ...updates } : folder
    );
    setFolders(updatedFolders);
    localStorage.setItem('noteFolders', JSON.stringify(updatedFolders));
  };

  const deleteFolder = (id: string) => {
    const updatedNotes = notes.map(note => 
      note.folderId === id ? { ...note, folderId: undefined } : note
    );
    setNotes(updatedNotes);
    localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));

    const updatedFolders = folders.filter(folder => folder.id !== id);
    setFolders(updatedFolders);
    localStorage.setItem('noteFolders', JSON.stringify(updatedFolders));
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (filter.searchQuery && !note.text.toLowerCase().includes(filter.searchQuery.toLowerCase())) {
      return false;
    }
    if (filter.folderId && note.folderId !== filter.folderId) {
      return false;
    }
    if (filter.favorites && !note.isFavorite) {
      return false;
    }
    if (filter.dateRange) {
      const noteDate = new Date(note.timestamp);
      if (noteDate < filter.dateRange.start || noteDate > filter.dateRange.end) {
        return false;
      }
    }
    return true;
  });

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setEditingNote({ title: note.title || '', text: note.text });
    setIsNoteDialogOpen(true);
  };

  const handleNoteSave = () => {
    if (!selectedNote) return;
    
    updateNote(selectedNote.id, {
      title: editingNote.title.trim() || undefined,
      text: editingNote.text.trim()
    });
    
    setIsNoteDialogOpen(false);
    setSelectedNote(null);
    toast.success('💾 Note updated');
  };

  // Show browser not supported screen
  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md space-zen-lg">
          <div className="breathing-circle mx-auto mb-8 opacity-50">
            <AlertTriangle className="w-16 h-16 text-destructive" />
          </div>
          <h1 className="mb-4 text-gentle">
            {!isSecureConnection ? 'Secure Connection Required' : 'Browser Not Supported'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {!isSecureConnection 
              ? 'Microphone access requires HTTPS or localhost. Please use a secure connection.'
              : 'Please use Chrome, Safari, or Edge for voice recording functionality.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => setShowDebugger(true)}
              className="calm-button gap-2"
            >
              <Settings className="w-4 h-4" />
              Run Diagnostics
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-xl gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-80 glass-strong border-r border-white/20 dark:border-slate-600/30">
          <div className="p-8 border-b border-white/20 dark:border-slate-600/30">
            <h1 className="text-3xl mb-2 bg-gradient-to-r from-calm-blue to-ocean-teal bg-clip-text text-transparent">
              Mindful Notes
            </h1>
            <p className="text-muted-foreground">Capture your thoughts peacefully</p>
          </div>

          <div className="p-6">
            <FolderManager
              folders={folders}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              onFolderCreate={createFolder}
              onFolderUpdate={updateFolder}
              onFolderDelete={deleteFolder}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            {/* Header */}
            <div className="glass-strong border-b border-white/20 dark:border-slate-600/30 p-6">
              <div className="flex items-center justify-between">
                <TabsList className="grid grid-cols-2 h-12 bg-white/10 dark:bg-slate-800/50 backdrop-blur-md border border-white/20 dark:border-slate-600/30 rounded-2xl">
                  <TabsTrigger 
                    value="record" 
                    className="gap-3 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-slate-700/50 data-[state=active]:text-primary rounded-xl transition-all duration-300"
                  >
                    <Circle className={`w-4 h-4 ${isRecording ? 'fill-sunset-orange text-sunset-orange animate-gentle-breathe' : ''}`} />
                    Record
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="gap-3 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-slate-700/50 data-[state=active]:text-primary rounded-xl transition-all duration-300"
                  >
                    <History className="w-4 h-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowDebugger(true)}
                    variant="ghost"
                    size="sm"
                    className="rounded-2xl hover:bg-white/10"
                    title="Advanced Diagnostics"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            <TabsContent value="record" className="p-0">
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-zen-xl">
                {/* Recording Timer */}
                {isRecording && (
                  <div className="recording-timer mb-8 animate-float">
                    <div className="timer-dot"></div>
                    <span className="timer-text">{formatDuration(recordingDuration)}</span>
                  </div>
                )}

                {/* Breathing Wave Container with Recording Circle */}
                <div className="breathing-wave-container mb-16 animate-float">
                  {/* Subtle expanding waves */}
                  <div className={`breathing-wave wave-1 ${isRecording ? 'recording animate-breathing-waves' : 'animate-gentle-ripple'}`} />
                  <div className={`breathing-wave wave-2 ${isRecording ? 'recording animate-subtle-expansion' : 'animate-breathing-waves'}`} />
                  <div className={`breathing-wave wave-3 ${isRecording ? 'recording animate-gentle-ripple' : 'animate-subtle-expansion'}`} />
                  
                  {/* Main Recording Button */}
                  <button
                    ref={buttonRef}
                    onClick={handleRecordingClick}
                    className={`
                      breathing-circle transition-all duration-500 shadow-soft relative z-10
                      ${isRecording 
                        ? 'recording animate-gentle-breathe' 
                        : 'hover:scale-105'
                      }
                      ${isClicking ? 'clicking' : ''}
                      cursor-pointer
                    `}
                  >
                    {isRecording ? (
                      <div className="w-12 h-12 bg-white rounded-md animate-gentle-breathe relative z-10" />
                    ) : (
                      <Mic className="w-16 h-16 text-white relative z-10" />
                    )}
                  </button>
                </div>

                {/* Status */}
                <div className="text-center space-zen-md mb-8">
                  {isRecording ? (
                    <div className="space-y-4">
                      <h2 className="text-sunset-orange">Recording...</h2>
                      <p className="text-muted-foreground">Speak your mind, let your thoughts flow</p>
                      <p className="text-sm text-muted-foreground">Click the button again to stop recording</p>
                    </div>
                  ) : permissionState === 'denied' && hasTriedPermission ? (
                    <div className="space-y-4">
                      <h2 className="text-destructive flex items-center gap-2 justify-center">
                        <Shield className="w-5 h-5" />
                        Microphone Access Required
                      </h2>
                      <p className="text-muted-foreground max-w-md">
                        Your browser is blocking microphone access. We'll guide you through fixing this.
                      </p>
                      <Button 
                        onClick={() => setShowPermissionGuide(true)}
                        className="calm-button gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Fix Permissions
                      </Button>
                    </div>
                  ) : permissionState === 'granted' ? (
                    <div className="space-y-4">
                      <h2 className="text-gentle flex items-center gap-2 justify-center">
                        <CheckCircle className="w-5 h-5 text-peaceful-green" />
                        Ready to record
                      </h2>
                      <p className="text-muted-foreground">Tap the circle when you're ready to share your thoughts</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-gentle">Ready to listen</h2>
                      <p className="text-muted-foreground">Tap the circle to start recording your voice notes</p>
                      <p className="text-sm text-sunset-orange">Your browser will ask for microphone permission</p>
                    </div>
                  )}
                </div>

                {/* Live Transcript */}
                {(transcript || isRecording) && (
                  <div className="w-full max-w-4xl mt-16 space-zen-lg animate-float">
                    <div className="zen-card p-8 min-h-32 meditation-focus">
                      {transcript ? (
                        <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">{transcript}</p>
                      ) : (
                        <p className="text-muted-foreground italic">Listening to your thoughts...</p>
                      )}
                    </div>
                    
                    {transcript && !isRecording && (
                      <div className="text-center mt-8">
                        <Button 
                          onClick={saveNote}
                          className="calm-button gap-3"
                        >
                          <Plus className="w-5 h-5" />
                          Save Note
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-8">
              <div className="max-w-6xl mx-auto space-y-8">
                <NotesSearch
                  filter={filter}
                  folders={folders}
                  onFilterChange={setFilter}
                />

                <NotesHistoryTimeline
                  notes={filteredNotes}
                  folders={folders}
                  onNoteSelect={handleNoteSelect}
                  onNoteDelete={deleteNote}
                  onNoteFavorite={toggleNoteFavorite}
                  onNoteMoveToFolder={moveNoteToFolder}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Note Edit Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-4xl zen-card border-white/20 dark:border-slate-600/30">
          <DialogHeader className="border-b border-white/20 dark:border-slate-600/30 pb-6">
            <DialogTitle className="text-2xl text-gentle">Edit your note</DialogTitle>
            <DialogDescription>
              Make changes to your voice note content and title
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-6">
            <div>
              <label className="block mb-3 text-gentle">Title</label>
              <Input
                value={editingNote.title}
                onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Add a title to your note..."
                className="meditation-input"
              />
            </div>
            <div>
              <label className="block mb-3 text-gentle">Content</label>
              <Textarea
                value={editingNote.text}
                onChange={(e) => setEditingNote(prev => ({ ...prev, text: e.target.value }))}
                rows={12}
                className="meditation-input resize-none"
                placeholder="Your thoughts go here..."
              />
            </div>
            <div className="flex gap-4 pt-6">
              <Button onClick={handleNoteSave} className="calm-button flex-1 gap-3">
                <Save className="w-5 h-5" />
                Save Changes
              </Button>
              <Button 
                onClick={() => setIsNoteDialogOpen(false)}
                className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Microphone Permission Guide */}
      {showPermissionGuide && (
        <MicrophonePermissionGuide 
          onPermissionGranted={handlePermissionGranted}
          onClose={() => setShowPermissionGuide(false)}
        />
      )}

      {/* Advanced Microphone Debugger */}
      {showDebugger && (
        <MicrophoneDebugger onClose={() => setShowDebugger(false)} />
      )}
    </div>
  );
}