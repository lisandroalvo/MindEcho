import { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { NotesHistoryTimeline } from './NotesHistoryTimeline';
import { NotesSearch } from './NotesSearch';
import { FolderManager } from './FolderManager';
import { PermissionSetup } from './PermissionSetup';

export type Note = {
  id: string;
  text: string;
  timestamp: number;
  folderId?: string;
  audioUrl?: string;
};

export function VoiceNotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  const addNote = (note: Note) => {
    setNotes(prev => [note, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      )
    );
  };

  if (!hasPermission) {
    return <PermissionSetup onPermissionGranted={() => setHasPermission(true)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <VoiceRecorder onNewNote={addNote} />
          <NotesHistoryTimeline 
            notes={notes}
            onDeleteNote={deleteNote}
            onUpdateNote={updateNote}
          />
        </div>
        <div className="space-y-6">
          <NotesSearch notes={notes} />
          <FolderManager 
            notes={notes}
            onUpdateNote={updateNote}
          />
        </div>
      </div>
    </div>
  );
}
