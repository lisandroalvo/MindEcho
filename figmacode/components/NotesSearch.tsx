import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Search, Filter, Calendar as CalendarIcon, Heart, X } from 'lucide-react';
import { NoteFilter, Folder } from '../types/notes';

interface NotesSearchProps {
  filter: NoteFilter;
  folders: Folder[];
  onFilterChange: (filter: NoteFilter) => void;
}

export function NotesSearch({ filter, folders, onFilterChange }: NotesSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  const handleSearchChange = (searchQuery: string) => {
    onFilterChange({ ...filter, searchQuery: searchQuery || undefined });
  };

  const handleFolderFilter = (folderId: string) => {
    onFilterChange({ 
      ...filter, 
      folderId: filter.folderId === folderId ? undefined : folderId 
    });
  };

  const handleFavoritesFilter = () => {
    onFilterChange({ 
      ...filter, 
      favorites: filter.favorites ? undefined : true 
    });
  };

  const handleDateRangeFilter = () => {
    if (dateRange.from && dateRange.to) {
      onFilterChange({
        ...filter,
        dateRange: {
          start: dateRange.from,
          end: dateRange.to
        }
      });
    }
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    onFilterChange({});
    setDateRange({});
  };

  const activeFilters = [
    filter.folderId && folders.find(f => f.id === filter.folderId)?.name,
    filter.favorites && 'Favorites',
    filter.dateRange && 'Date Range',
    filter.searchQuery && `"${filter.searchQuery}"`
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={filter.searchQuery || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              {/* Folders Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Folders</label>
                <div className="flex flex-wrap gap-2">
                  {folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant={filter.folderId === folder.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFolderFilter(folder.id)}
                      className="text-xs"
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Favorites Filter */}
              <div>
                <Button
                  variant={filter.favorites ? "default" : "outline"}
                  size="sm"
                  onClick={handleFavoritesFilter}
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Favorites Only
                </Button>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {dateRange.from && dateRange.to 
                          ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                          : 'Select date range'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange(range || {})}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  {dateRange.from && dateRange.to && (
                    <Button 
                      onClick={handleDateRangeFilter}
                      size="sm" 
                      className="w-full"
                    >
                      Apply Date Filter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filterName, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {filterName}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}