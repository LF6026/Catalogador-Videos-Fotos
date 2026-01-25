'use client'

import React, { useState, useMemo, useCallback } from 'react';
import {
  FolderOpen,
  Search,
  Star,
  MapPin,
  Calendar,
  Camera,
  Tag,
  FileJson,
  FolderTree,
  X,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { IndexedVideo, SearchStats } from '../types';

// File System Access API types (not included in default TS lib)
interface FileSystemHandleBase {
  kind: 'file' | 'directory';
  name: string;
}

interface FSFileHandle extends FileSystemHandleBase {
  kind: 'file';
  getFile(): Promise<File>;
}

interface FSDirHandle extends FileSystemHandleBase {
  kind: 'directory';
  values(): AsyncIterable<FSFileHandle | FSDirHandle>;
  getDirectoryHandle(name: string): Promise<FSDirHandle>;
}

interface SearchModeProps {
  onNotify: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };
}

// Generate unique ID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export default function SearchMode({ onNotify }: SearchModeProps) {
  // State
  const [indexedVideos, setIndexedVideos] = useState<IndexedVideo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [rootFolderName, setRootFolderName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCamera, setFilterCamera] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Stats
  const stats: SearchStats = useMemo(() => {
    const folders = new Set<string>();
    const cameras = new Set<string>();
    const catalogs = new Set<string>();
    let minDate = '';
    let maxDate = '';

    indexedVideos.forEach(v => {
      folders.add(v.sourcePath);
      catalogs.add(`${v.sourcePath}/${v.sourceFile}`);
      if (v.metadata.cameraModel) cameras.add(v.metadata.cameraModel);
      if (v.metadata.date) {
        if (!minDate || v.metadata.date < minDate) minDate = v.metadata.date;
        if (!maxDate || v.metadata.date > maxDate) maxDate = v.metadata.date;
      }
    });

    return {
      totalVideos: indexedVideos.length,
      totalCatalogs: catalogs.size,
      folders: Array.from(folders).sort(),
      cameras: Array.from(cameras).sort(),
      dateRange: minDate && maxDate ? { min: minDate, max: maxDate } : null
    };
  }, [indexedVideos]);

  // Filtered videos
  const filteredVideos = useMemo(() => {
    let result = indexedVideos;

    // Search - supports multiple terms (space or comma separated)
    // All terms must match (AND logic)
    if (searchTerm.trim()) {
      // Split by space or comma, filter empty strings
      const terms = searchTerm.toLowerCase().split(/[\s,]+/).filter(t => t.length > 0);

      result = result.filter(v => {
        // Build searchable text from all fields
        const searchableText = [
          v.filename,
          v.metadata.title,
          v.metadata.location,
          v.metadata.date,
          v.metadata.notes,
          v.sourcePath,
          ...(v.metadata.tags || []),
          ...(v.metadata.customFields || []).map(f => `${f.key} ${f.value}`)
        ].filter(Boolean).join(' ').toLowerCase();

        // All terms must be found
        return terms.every(term => searchableText.includes(term));
      });
    }

    // Filter by camera
    if (filterCamera) {
      result = result.filter(v => v.metadata.cameraModel === filterCamera);
    }

    // Filter favorites
    if (filterFavorites) {
      result = result.filter(v => v.metadata.favorite);
    }

    return result;
  }, [indexedVideos, searchTerm, filterCamera, filterFavorites]);

  // Group by folder
  const groupedByFolder = useMemo(() => {
    const groups: Record<string, IndexedVideo[]> = {};
    filteredVideos.forEach(v => {
      const key = v.sourcePath;
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });
    return groups;
  }, [filteredVideos]);

  // Scan folder for JSON files
  const scanFolder = useCallback(async () => {
    // Check for File System Access API support
    if (!('showDirectoryPicker' in window)) {
      onNotify.error('Seu navegador não suporta seleção de pastas. Use Chrome, Edge ou Opera.');
      return;
    }

    try {
      // Request folder access
      const dirHandle = await (window as Window & {
        showDirectoryPicker: () => Promise<FSDirHandle>
      }).showDirectoryPicker();

      setIsScanning(true);
      setRootFolderName(dirHandle.name);
      setIndexedVideos([]);

      const videos: IndexedVideo[] = [];
      let catalogCount = 0;

      // Recursive scan function
      async function scanDirectory(handle: FSDirHandle, path: string = '') {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.json')) {
            try {
              const file = await (entry as FSFileHandle).getFile();
              const text = await file.text();
              const data = JSON.parse(text);

              // Validate it's a catalog file
              if (data.videos && Array.isArray(data.videos)) {
                catalogCount++;

                for (const v of data.videos) {
                  if (!v.filename) continue;

                  videos.push({
                    id: generateId(),
                    filename: v.filename,
                    metadata: {
                      title: v.title || '',
                      date: v.date || '',
                      location: v.location || '',
                      tags: Array.isArray(v.tags) ? v.tags : [],
                      notes: v.notes || '',
                      favorite: v.favorite || false,
                      recordingTime: v.recordingTime,
                      lens: v.lens,
                      clipNumber: v.clipNumber,
                      cameraModel: v.cameraModel,
                      customFields: Array.isArray(v.customFields) ? v.customFields : []
                    },
                    sourcePath: path || dirHandle.name,
                    sourceFile: entry.name
                  });
                }
              }
            } catch (e) {
              console.warn(`Failed to parse ${entry.name}:`, e);
            }
          } else if (entry.kind === 'directory') {
            const subHandle = await handle.getDirectoryHandle(entry.name);
            const subPath = path ? `${path}/${entry.name}` : entry.name;
            await scanDirectory(subHandle, subPath);
          }
        }
      }

      await scanDirectory(dirHandle);

      setIndexedVideos(videos);
      setIsScanning(false);

      if (videos.length > 0) {
        onNotify.success(`Encontrados ${videos.length} vídeos em ${catalogCount} catálogo(s).`);
        // Expand all folders by default
        const allFolders = new Set(videos.map(v => v.sourcePath));
        setExpandedFolders(allFolders);
      } else {
        onNotify.warning('Nenhum catálogo JSON encontrado na pasta selecionada.');
      }
    } catch (e) {
      setIsScanning(false);
      if ((e as Error).name !== 'AbortError') {
        console.error('Scan failed:', e);
        onNotify.error('Falha ao escanear pasta.');
      }
    }
  }, [onNotify]);

  // Toggle folder expansion
  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCamera('');
    setFilterFavorites(false);
  };

  const hasActiveFilters = searchTerm || filterCamera || filterFavorites;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        {/* Folder Selection */}
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={scanFolder}
            disabled={isScanning}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Escaneando...
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5" />
                Selecionar Pasta
              </>
            )}
          </button>

          {rootFolderName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <FolderTree className="w-4 h-4" />
              <span className="truncate">{rootFolderName}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {indexedVideos.length > 0 && (
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Vídeos Indexados</span>
              <span className="font-bold text-indigo-400">{stats.totalVideos}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Catálogos</span>
              <span className="font-medium text-slate-300">{stats.totalCatalogs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Pastas</span>
              <span className="font-medium text-slate-300">{stats.folders.length}</span>
            </div>
            {stats.dateRange && (
              <div className="text-xs text-slate-500">
                {stats.dateRange.min} → {stats.dateRange.max}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {indexedVideos.length > 0 && (
          <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* Camera Filter */}
            {stats.cameras.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                  Câmera
                </label>
                <select
                  value={filterCamera}
                  onChange={(e) => setFilterCamera(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">Todas as câmeras</option>
                  {stats.cameras.map(cam => (
                    <option key={cam} value={cam}>{cam}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Favorites Filter */}
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filterFavorites
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className={`w-4 h-4 ${filterFavorites ? 'fill-amber-400' : ''}`} />
              Apenas Favoritos
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md p-4 border-b border-slate-800">
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por título, local, data, tags, notas, pasta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results count */}
          {indexedVideos.length > 0 && (
            <div className="text-center mt-2 text-sm text-slate-500">
              {filteredVideos.length === indexedVideos.length
                ? `${indexedVideos.length} vídeos`
                : `${filteredVideos.length} de ${indexedVideos.length} vídeos`
              }
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Empty State */}
          {indexedVideos.length === 0 && !isScanning && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-medium text-slate-300 mb-2">Nenhuma pasta selecionada</h2>
              <p className="text-sm text-center max-w-md">
                Clique em &quot;Selecionar Pasta&quot; para escolher a pasta raiz com seus vídeos catalogados.
              </p>
            </div>
          )}

          {/* No Results */}
          {indexedVideos.length > 0 && filteredVideos.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Nenhum vídeo encontrado com os filtros atuais.</p>
            </div>
          )}

          {/* Results grouped by folder */}
          <div className="space-y-4">
            {Object.entries(groupedByFolder).map(([folder, videos]) => (
              <div key={folder} className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(folder)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <ChevronRight
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      expandedFolders.has(folder) ? 'rotate-90' : ''
                    }`}
                  />
                  <FolderTree className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-slate-200 flex-1 text-left truncate">
                    {folder}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                    {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Videos in folder */}
                {expandedFolders.has(folder) && (
                  <div className="border-t border-slate-800 divide-y divide-slate-800/50">
                    {videos.map(video => (
                      <VideoSearchResult key={video.id} video={video} searchTerm={searchTerm} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Video Search Result Component
interface VideoSearchResultProps {
  video: IndexedVideo;
  searchTerm: string;
}

function VideoSearchResult({ video, searchTerm }: VideoSearchResultProps) {
  const { metadata, filename, sourceFile } = video;

  // Highlight matching text
  const highlight = (text: string) => {
    if (!searchTerm.trim() || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5">{part}</mark> : part
    );
  };

  return (
    <div className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Thumbnail or placeholder */}
        <div className="w-24 h-14 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
          {metadata.thumbnail ? (
            <img src={metadata.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileJson className="w-6 h-6 text-slate-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Filename & Title */}
          <div className="flex items-center gap-2">
            {metadata.favorite && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
            <span className="font-medium text-slate-200 truncate">
              {metadata.title ? highlight(metadata.title) : <span className="text-slate-500 italic">Sem título</span>}
            </span>
          </div>

          <div className="text-xs text-slate-500 truncate mt-0.5">
            {highlight(filename)}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">
            {metadata.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {highlight(metadata.date)}
              </span>
            )}
            {metadata.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {highlight(metadata.location)}
              </span>
            )}
            {metadata.cameraModel && (
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {metadata.cameraModel}
              </span>
            )}
          </div>

          {/* Tags */}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {metadata.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-xs">
                  <Tag className="w-2.5 h-2.5" />
                  {highlight(tag)}
                </span>
              ))}
            </div>
          )}

          {/* Custom Fields */}
          {metadata.customFields && metadata.customFields.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {metadata.customFields.map((field, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                  {highlight(field.key)}: {highlight(field.value)}
                </span>
              ))}
            </div>
          )}

          {/* Source file */}
          <div className="text-xs text-slate-600 mt-2">
            <FileJson className="w-3 h-3 inline mr-1" />
            {sourceFile}
          </div>
        </div>
      </div>
    </div>
  );
}
