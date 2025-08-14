import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  FolderPlus,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { Folder as FolderType } from "../types/notes";
import { toast } from "sonner@2.0.3";

interface FolderManagerProps {
  folders: FolderType[];
  selectedFolderId?: string;
  onFolderSelect: (folderId?: string) => void;
  onFolderCreate: (folder: Omit<FolderType, "id">) => void;
  onFolderUpdate: (
    id: string,
    updates: Partial<FolderType>,
  ) => void;
  onFolderDelete: (id: string) => void;
}

const FOLDER_COLORS = [
  "#667eea", // calm blue
  "#48bb78", // peaceful green
  "#38b2ac", // ocean teal
  "#9f7aea", // lavender
  "#ed8936", // sunset orange
  "#ed64a6", // soft pink
  "#4299e1", // sky blue
  "#68d391", // mint green
];

export function FolderManager({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete,
}: FolderManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(false);
  const [editingFolder, setEditingFolder] =
    useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    FOLDER_COLORS[0],
  );

  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    onFolderCreate({
      name: folderName.trim(),
      color: selectedColor,
      createdAt: new Date(),
    });

    setFolderName("");
    setSelectedColor(FOLDER_COLORS[0]);
    setIsCreateDialogOpen(false);
    toast.success("Folder created");
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !folderName.trim()) return;

    onFolderUpdate(editingFolder.id, {
      name: folderName.trim(),
      color: selectedColor,
    });

    setEditingFolder(null);
    setFolderName("");
    setSelectedColor(FOLDER_COLORS[0]);
    toast.success("Folder updated");
  };

  const handleDeleteFolder = (folderId: string) => {
    onFolderDelete(folderId);
    if (selectedFolderId === folderId) {
      onFolderSelect(undefined);
    }
    toast.success("Folder deleted");
  };

  const openEditDialog = (folder: FolderType) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setSelectedColor(folder.color || FOLDER_COLORS[0]);
  };

  return (
    <div className="space-y-3">
      {/* All Notes */}
      <button
        onClick={() => onFolderSelect(undefined)}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
          !selectedFolderId
            ? "bg-gradient-to-r from-calm-blue to-ocean-teal text-white shadow-soft"
            : "hover:bg-white/10 text-muted-foreground hover:text-foreground"
        }`}
      >
        <FolderOpen className="w-5 h-5" />
        <span className="text-sm font-medium">All Notes</span>
      </button>

      {/* Folders */}
      {folders.map((folder) => (
        <div key={folder.id} className="group relative">
          <button
            onClick={() => onFolderSelect(folder.id)}
            className={`w-full flex items-center gap-4 p-4 pr-12 rounded-2xl transition-all duration-300 ${
              selectedFolderId === folder.id
                ? "text-white shadow-soft"
                : "hover:bg-white/10 text-muted-foreground hover:text-foreground"
            }`}
            style={
              selectedFolderId === folder.id
                ? {
                    background: `linear-gradient(135deg, ${folder.color}dd, ${folder.color}99)`,
                  }
                : {}
            }
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
            <span className="text-sm font-medium flex-1 truncate text-left">
              {folder.name}
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8 rounded-full hover:bg-white/20"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="zen-card border-white/20"
            >
              <DropdownMenuItem
                onClick={() => openEditDialog(folder)}
                className="gap-3 rounded-lg"
              >
                <Edit className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteFolder(folder.id)}
                className="gap-3 text-destructive rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {/* Create Folder Button */}
      <Dialog
        open={isCreateDialogOpen || !!editingFolder}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingFolder(null);
            setFolderName("");
            setSelectedColor(FOLDER_COLORS[0]);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-4 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <FolderPlus className="w-5 h-5" />
            <span className="text-sm font-medium">
              New Folder
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="zen-card border-white/20 max-w-md">
          <DialogHeader className="border-b border-white/20 pb-6">
            <DialogTitle className="text-xl text-gentle">
              {editingFolder
                ? "Edit folder"
                : "Create new folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-6">
            <div>
              <label className="block mb-3 text-gentle">
                Folder name
              </label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="meditation-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    editingFolder
                      ? handleUpdateFolder()
                      : handleCreateFolder();
                  }
                }}
              />
            </div>

            <div>
              <label className="block mb-3 text-gentle">
                Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-2xl transition-all duration-300 ${
                      selectedColor === color
                        ? "ring-4 ring-primary/30 scale-110 shadow-soft"
                        : "hover:scale-105 hover:shadow-gentle"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                onClick={
                  editingFolder
                    ? handleUpdateFolder
                    : handleCreateFolder
                }
                className="calm-button flex-1"
              >
                {editingFolder ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingFolder(null);
                }}
                className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}