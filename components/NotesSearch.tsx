import { useState, useMemo } from 'react';
import { Note } from './VoiceNotesApp';

interface NotesSearchProps {
  notes: Note[];
}

export function NotesSearch({ notes }: NotesSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return notes.filter(note =>
      note.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  return (
    <div className="p-6 bg-card rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Search Notes</h2>
      <input
        type="text"
        placeholder="Search your notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-3 rounded-lg bg-background border border-input text-foreground"
      />

      {searchQuery.trim() && (
        <div className="mt-4 space-y-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className="p-4 rounded-lg bg-accent/20"
              >
                <p className="text-sm text-muted-foreground mb-2">
                  {new Date(note.timestamp).toLocaleString()}
                </p>
                <p className="text-foreground">{note.text}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No matching notes found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
