import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Clock, Folder, Heart, MoreHorizontal } from 'lucide-react';
import { Note, Folder as FolderType } from '../types/notes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface NotesHistoryTimelineProps {
  notes: Note[];
  folders: FolderType[];
  onNoteSelect: (note: Note) => void;
  onNoteDelete: (id: string) => void;
  onNoteFavorite: (id: string) => void;
  onNoteMoveToFolder: (noteId: string, folderId?: string) => void;
}

export function NotesHistoryTimeline({
  notes,
  folders,
  onNoteSelect,
  onNoteDelete,
  onNoteFavorite,
  onNoteMoveToFolder
}: NotesHistoryTimelineProps) {
  // Group notes by date
  const groupedNotes = notes.reduce((groups, note) => {
    const date = new Date(note.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(note);
    return groups;
  }, {} as Record<string, Note[]>);

  const sortedDates = Object.keys(groupedNotes).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getFolderById = (folderId?: string) => {
    return folders.find(f => f.id === folderId);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No notes yet</h3>
        <p className="text-muted-foreground">Your voice notes timeline will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <h3 className="font-medium text-lg">{formatDate(date)}</h3>
            <div className="flex-1 h-px bg-border" />
            <Badge variant="secondary" className="text-xs">
              {groupedNotes[date].length} {groupedNotes[date].length === 1 ? 'note' : 'notes'}
            </Badge>
          </div>

          {/* Notes for this date */}
          <div className="space-y-3 ml-6">
            {groupedNotes[date]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((note) => {
                const folder = getFolderById(note.folderId);
                return (
                  <Card 
                    key={note.id} 
                    className="group relative p-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onNoteSelect(note)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Note title or preview */}
                        <div className="flex items-center gap-2 mb-2">
                          {note.isFavorite && (
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                          )}
                          <h4 className="font-medium truncate">
                            {note.title || note.text.slice(0, 50) + (note.text.length > 50 ? '...' : '')}
                          </h4>
                        </div>

                        {/* Note preview */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {note.text}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(note.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          
                          {note.duration && (
                            <div className="flex items-center gap-1">
                              <span>Duration:</span>
                              {formatDuration(note.duration)}
                            </div>
                          )}

                          {folder && (
                            <div className="flex items-center gap-1">
                              <Folder className="w-3 h-3" style={{ color: folder.color }} />
                              {folder.name}
                            </div>
                          )}

                          {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1">
                              {note.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {note.tags.length > 2 && (
                                <span className="text-muted-foreground">+{note.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onNoteFavorite(note.id);
                          }}>
                            <Heart className="w-4 h-4 mr-2" />
                            {note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          </DropdownMenuItem>
                          {folders.map((folder) => (
                            <DropdownMenuItem 
                              key={folder.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onNoteMoveToFolder(note.id, folder.id);
                              }}
                            >
                              <Folder className="w-4 h-4 mr-2" style={{ color: folder.color }} />
                              Move to {folder.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onNoteDelete(note.id);
                            }}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}