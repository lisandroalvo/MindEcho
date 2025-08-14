import { Note } from './VoiceNotesApp';

interface NotesHistoryTimelineProps {
  notes: Note[];
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}

export function NotesHistoryTimeline({
  notes,
  onDeleteNote,
  onUpdateNote,
}: NotesHistoryTimelineProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Notes History</h2>
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-6 bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(note.timestamp)}
                </p>
                {note.folderId && (
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground mt-2">
                    Folder: {note.folderId}
                  </span>
                )}
              </div>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="text-destructive hover:text-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>

            <p className="text-foreground mb-4">{note.text}</p>

            {note.audioUrl && (
              <div className="mt-4">
                <audio controls className="w-full">
                  <source src={note.audioUrl} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            <div className="mt-4">
              <textarea
                className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                value={note.text}
                onChange={(e) =>
                  onUpdateNote(note.id, { text: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No notes recorded yet. Start recording to see your notes here!
          </div>
        )}
      </div>
    </div>
  );
}
