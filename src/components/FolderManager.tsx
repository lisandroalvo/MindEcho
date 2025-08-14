import { useState } from 'react';
import { Note } from './VoiceNotesApp';

interface FolderManagerProps {
  notes: Note[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}

interface Folder {
  id: string;
  name: string;
}

export function FolderManager({ notes, onUpdateNote }: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim()
    };
    
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
  };

  const deleteFolder = (folderId: string) => {
    // Remove folder from notes
    notes
      .filter(note => note.folderId === folderId)
      .forEach(note => onUpdateNote(note.id, { folderId: undefined }));
    
    // Remove folder
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
  };

  const getFolderNotes = (folderId: string) => {
    return notes.filter(note => note.folderId === folderId);
  };

  return (
    <div className="p-6 bg-card rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Folders</h2>
      
      {/* Create new folder */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New folder name..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="flex-1 p-2 rounded-lg bg-background border border-input text-foreground"
        />
        <button
          onClick={createFolder}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Create
        </button>
      </div>

      {/* Folder list */}
      <div className="space-y-4">
        {folders.map(folder => (
          <div
            key={folder.id}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              selectedFolder === folder.id
                ? 'bg-accent text-accent-foreground'
                : 'bg-background hover:bg-accent/50'
            }`}
            onClick={() => setSelectedFolder(folder.id === selectedFolder ? null : folder.id)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{folder.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {getFolderNotes(folder.id).length} notes
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                  className="text-destructive hover:text-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Folder contents */}
            {selectedFolder === folder.id && (
              <div className="mt-4 space-y-2">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={note.folderId === folder.id}
                      onChange={(e) => {
                        onUpdateNote(note.id, {
                          folderId: e.target.checked ? folder.id : undefined
                        });
                      }}
                      className="form-checkbox h-4 w-4"
                    />
                    <span className="text-sm truncate">{note.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {folders.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No folders created yet
          </p>
        )}
      </div>
    </div>
  );
}
