'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Upload, Search, PlusCircle, ArrowUpDown } from 'lucide-react';
import { VideoFile, SortConfig, CatalogStats, VideoExport } from './types';
import { parseFilename } from './utils/parsers';

// Components
import StudioLayout from './components/layout/StudioLayout';
import StudioSidebar from './components/layout/Sidebar';
import StudioInspector from './components/layout/Inspector';
import VideoCard from './components/VideoCard';
import { ToastContainer, useNotifications } from './components/Toast';

// Local Storage Keys
const STORAGE_KEYS = {
  VIDEOS: 'cataloger_videos',
  CAMERA_MODEL: 'cataloger_camera_model'
};

// Generate unique ID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export default function VideoCataloger() {
  // --- Global State ---
  const [cameraModel, setCameraModel] = useState('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- UI State ---
  const [selectedVideos, setSelectedVideos] = useState(new Set<string>());
  const [filterType, setFilterType] = useState('all'); // all, auto-only, missing-title
  const [filterCamera, setFilterCamera] = useState(''); // Filter by camera model
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' });

  // --- Notifications ---
  const { notifications, notify, dismissNotification } = useNotifications();

  // --- Persistence ---
  useEffect(() => {
    try {
      const savedVideos = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      const savedCamera = localStorage.getItem(STORAGE_KEYS.CAMERA_MODEL);
      if (savedVideos) {
        const parsed = JSON.parse(savedVideos);
        // Ensure IDs are strings (migration from old format)
        const migrated = parsed.map((v: VideoFile) => ({
          ...v,
          id: String(v.id)
        }));
        setVideos(migrated);
      }
      if (savedCamera) setCameraModel(savedCamera);
      setIsLoaded(true);
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
    } catch (e) {
      console.error('Failed to save videos:', e);
      notify.error('Erro ao salvar. O armazenamento pode estar cheio.');
    }
  }, [videos, isLoaded, notify]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CAMERA_MODEL, cameraModel);
  }, [cameraModel, isLoaded]);

  // --- Statistics ---
  const stats: CatalogStats = useMemo(() => {
    const byCamera: Record<string, number> = {};
    let withTitle = 0;
    let withLocation = 0;
    let withTags = 0;

    videos.forEach(v => {
      if (v.metadata.title) withTitle++;
      if (v.metadata.location) withLocation++;
      if (v.metadata.tags.length > 0) withTags++;
      const cam = v.metadata.cameraModel || 'Desconhecida';
      byCamera[cam] = (byCamera[cam] || 0) + 1;
    });

    return {
      total: videos.length,
      withTitle,
      withLocation,
      withTags,
      byCamera
    };
  }, [videos]);

  // --- Filtering & Sorting ---
  const filteredAndSortedVideos = useMemo(() => {
    let result = videos;

    // Filter by type
    if (filterType === 'missing-title') {
      result = result.filter(v => !v.metadata.title);
    } else if (filterType === 'auto-only') {
      result = result.filter(v => v.metadata.recordingTime);
    }

    // Filter by camera
    if (filterCamera) {
      result = result.filter(v => v.metadata.cameraModel === filterCamera);
    }

    // Search (expanded to include location and date)
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.filename.toLowerCase().includes(lower) ||
        v.metadata.title?.toLowerCase().includes(lower) ||
        v.metadata.location?.toLowerCase().includes(lower) ||
        v.metadata.date?.includes(lower) ||
        v.metadata.tags.some(t => t.toLowerCase().includes(lower)) ||
        v.metadata.notes?.toLowerCase().includes(lower)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;

      switch (sortConfig.field) {
        case 'date':
          return direction * (a.metadata.date || '').localeCompare(b.metadata.date || '');
        case 'filename':
          return direction * a.filename.localeCompare(b.filename);
        case 'title':
          return direction * (a.metadata.title || '').localeCompare(b.metadata.title || '');
        case 'missing-title':
          // Videos without title first
          const aHasTitle = a.metadata.title ? 1 : 0;
          const bHasTitle = b.metadata.title ? 1 : 0;
          return direction * (aHasTitle - bHasTitle);
        default:
          return 0;
      }
    });

    return result;
  }, [videos, filterType, filterCamera, searchTerm, sortConfig]);

  // --- Actions ---
  const handleUpdateMetadata = useCallback((id: string, field: string, value: unknown) => {
    setVideos(prev => prev.map(v =>
      v.id === id ? { ...v, metadata: { ...v.metadata, [field]: value } } : v
    ));
  }, []);

  const handleBatchUpdateMetadata = useCallback((ids: string[], field: string, value: unknown) => {
    setVideos(prev => prev.map(v =>
      ids.includes(v.id) ? { ...v, metadata: { ...v.metadata, [field]: value } } : v
    ));
  }, []);

  const handleAddTag = useCallback((id: string, tag: string) => {
    if (!tag.trim()) return;
    setVideos(prev => prev.map(v =>
      v.id === id
        ? { ...v, metadata: { ...v.metadata, tags: [...v.metadata.tags, tag.trim()] } }
        : v
    ));
  }, []);

  const handleBatchAddTag = useCallback((ids: string[], tag: string) => {
    if (!tag.trim()) return;
    setVideos(prev => prev.map(v =>
      ids.includes(v.id)
        ? { ...v, metadata: { ...v.metadata, tags: [...v.metadata.tags, tag.trim()] } }
        : v
    ));
  }, []);

  const handleRemoveTag = useCallback((id: string, index: number) => {
    setVideos(prev => prev.map(v =>
      v.id === id
        ? { ...v, metadata: { ...v.metadata, tags: v.metadata.tags.filter((_, i) => i !== index) } }
        : v
    ));
  }, []);

  // --- JSON Export ---
  const handleExportJSON = async () => {
    if (videos.length === 0) {
      notify.warning('Nenhum vídeo para exportar.');
      return;
    }

    try {
      const data = {
        generatedAt: new Date().toISOString(),
        cameraModel,
        totalVideos: videos.length,
        videos: videos.map(v => ({
          filename: v.filename,
          title: v.metadata.title,
          date: v.metadata.date,
          location: v.metadata.location,
          tags: v.metadata.tags,
          notes: v.metadata.notes,
          recordingTime: v.metadata.recordingTime,
          lens: v.metadata.lens,
          clipNumber: v.metadata.clipNumber,
          cameraModel: v.metadata.cameraModel,
          customFields: v.metadata.customFields.length > 0 ? v.metadata.customFields : undefined
        } as VideoExport))
      };

      const filename = `catalog-${new Date().toISOString().split('T')[0]}.json`;

      // Use File System API if available
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as Window & { showSaveFilePicker: (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
          });
          const writable = await handle.createWritable();
          await writable.write(JSON.stringify(data, null, 2));
          await writable.close();
          notify.success(`Catálogo exportado: ${filename}`);
        } catch (e) {
          // User cancelled or API error, use fallback
          if ((e as Error).name !== 'AbortError') {
            throw e;
          }
        }
      } else {
        // Fallback download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        notify.success(`Catálogo exportado: ${filename}`);
      }
    } catch (e) {
      console.error("Export failed", e);
      notify.error('Falha ao exportar catálogo.');
    }
  };

  // --- CSV Export ---
  const handleExportCSV = async () => {
    if (videos.length === 0) {
      notify.warning('Nenhum vídeo para exportar.');
      return;
    }

    try {
      // CSV header
      const headers = ['Arquivo', 'Título', 'Data', 'Local', 'Tags', 'Notas', 'Hora', 'Lente', 'Clip', 'Câmera'];

      // CSV rows
      const rows = videos.map(v => [
        v.filename,
        v.metadata.title || '',
        v.metadata.date || '',
        v.metadata.location || '',
        v.metadata.tags.join('; '),
        (v.metadata.notes || '').replace(/"/g, '""').replace(/\n/g, ' '),
        v.metadata.recordingTime || '',
        v.metadata.lens || '',
        v.metadata.clipNumber?.toString() || '',
        v.metadata.cameraModel || ''
      ]);

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Add BOM for Excel compatibility
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      notify.success('Catálogo exportado como CSV.');
    } catch (e) {
      console.error("CSV Export failed", e);
      notify.error('Falha ao exportar CSV.');
    }
  };

  // --- JSON Import with validation ---
  const handleImportCatalog = async (files: FileList) => {
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        try {
          const data = JSON.parse(text);

          // Validate structure
          if (!data.videos || !Array.isArray(data.videos)) {
            notify.error(`Arquivo inválido: ${file.name} - Campo "videos" não encontrado.`);
            continue;
          }

          setVideos(prev => {
            const existingNames = new Set(prev.map(v => v.filename));
            const newVideos: VideoFile[] = [];

            for (const v of data.videos) {
              // Validate required fields
              if (!v.filename || typeof v.filename !== 'string') {
                skippedCount++;
                continue;
              }

              // Skip duplicates
              if (existingNames.has(v.filename)) {
                skippedCount++;
                continue;
              }

              newVideos.push({
                id: generateId(),
                filename: v.filename,
                size: 0,
                metadata: {
                  title: v.title || '',
                  date: v.date || '',
                  location: v.location || '',
                  tags: Array.isArray(v.tags) ? v.tags : [],
                  notes: v.notes || '',
                  recordingTime: v.recordingTime,
                  lens: v.lens,
                  clipNumber: v.clipNumber,
                  cameraModel: v.cameraModel || data.cameraModel,
                  customFields: Array.isArray(v.customFields) ? v.customFields : []
                }
              });
              importedCount++;
            }

            return [...prev, ...newVideos];
          });
        } catch (e) {
          console.error("Import failed for file", file.name, e);
          notify.error(`Falha ao importar: ${file.name}`);
        }
      }
    }

    if (importedCount > 0) {
      notify.success(`${importedCount} vídeos importados.${skippedCount > 0 ? ` ${skippedCount} ignorados (duplicados ou inválidos).` : ''}`);
    } else if (skippedCount > 0) {
      notify.warning(`Nenhum vídeo novo importado. ${skippedCount} ignorados.`);
    }
  };

  // --- Thumbnail Generation (with memory leak fix) ---
  const generateThumbnail = async (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
      };

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          cleanup();
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } catch {
          cleanup();
          resolve(undefined);
        }
      };

      video.onerror = () => {
        cleanup();
        resolve(undefined);
      };

      video.src = objectUrl;
    });
  };

  // --- File Processing ---
  const processFiles = useCallback(async (files: File[]) => {
    if (!cameraModel) {
      notify.warning('Selecione um modelo de câmera na barra lateral primeiro!');
      return;
    }

    const validFiles = files.filter(file =>
      file.type.startsWith('video/') ||
      file.name.toLowerCase().endsWith('.insv') ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.mov')
    );

    if (validFiles.length === 0) {
      notify.warning('Nenhum arquivo de vídeo válido encontrado.');
      return;
    }

    notify.info(`Processando ${validFiles.length} arquivo(s)...`);

    const newVideos = await Promise.all(validFiles.map(async (file) => {
      const parsed = parseFilename(file.name, cameraModel);
      let thumb: string | undefined;

      if (file.type.startsWith('video/')) {
        thumb = await generateThumbnail(file);
      }

      return {
        id: generateId(),
        filename: file.name,
        size: file.size,
        metadata: {
          title: '',
          date: parsed?.date || new Date().toISOString().split('T')[0],
          location: '',
          tags: [],
          notes: '',
          recordingTime: parsed?.time,
          lens: parsed?.lens,
          clipNumber: parsed?.clipNumber,
          cameraModel: cameraModel,
          thumbnail: thumb,
          customFields: []
        }
      } as VideoFile;
    }));

    setVideos(prev => [...prev, ...newVideos]);
    notify.success(`${newVideos.length} vídeo(s) adicionado(s).`);
  }, [cameraModel, notify]);

  // --- Drag & Drop ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // --- Selection ---
  const toggleVideoSelection = useCallback((videoId: string) => {
    setSelectedVideos(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(videoId)) {
        newSelection.delete(videoId);
      } else {
        newSelection.add(videoId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedVideos.size === filteredAndSortedVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredAndSortedVideos.map(v => v.id)));
    }
  }, [selectedVideos, filteredAndSortedVideos]);

  const handleManualAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'video/*,.insv,.mp4,.mov,.avi,.mkv';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        await processFiles(Array.from(files));
      }
    };
    input.click();
  };

  const handleResetCatalog = () => {
    if (confirm("Tem certeza que deseja limpar todo o catálogo? Isso removerá todos os vídeos da lista.")) {
      setVideos([]);
      setSelectedVideos(new Set());
      localStorage.removeItem(STORAGE_KEYS.VIDEOS);
      notify.info('Catálogo limpo.');
    }
  };

  // --- Sort Toggle ---
  const toggleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (!isLoaded) return null;

  return (
    <>
      <StudioLayout
        sidebar={
          <StudioSidebar
            cameraModel={cameraModel}
            setCameraModel={setCameraModel}
            filterType={filterType}
            setFilterType={setFilterType}
            filterCamera={filterCamera}
            setFilterCamera={setFilterCamera}
            stats={stats}
            onExportJSON={handleExportJSON}
            onExportCSV={handleExportCSV}
            onImportCatalog={handleImportCatalog}
          />
        }
        inspector={
          <StudioInspector
            selectedVideos={selectedVideos}
            allVideos={videos}
            onUpdate={handleUpdateMetadata}
            onBatchUpdate={handleBatchUpdateMetadata}
            onAddTag={handleAddTag}
            onBatchAddTag={handleBatchAddTag}
            onRemoveTag={handleRemoveTag}
          />
        }
      >
        {/* Main Canvas Area */}
        <div
          className={`h-full relative flex flex-col min-h-[500px] transition-colors duration-200 ${dragActive ? 'bg-indigo-500/10' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md p-4 border-b border-slate-800 flex items-center justify-between gap-4">
            {/* Left Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualAdd}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                Adicionar Vídeos
              </button>

              {/* Sort Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
                  <ArrowUpDown className="w-4 h-4" />
                  Ordenar
                </button>
                <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 min-w-[160px]">
                  <button
                    onClick={() => toggleSort('date')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-800 ${sortConfig.field === 'date' ? 'text-indigo-400' : 'text-slate-300'}`}
                  >
                    Por Data {sortConfig.field === 'date' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => toggleSort('filename')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-800 ${sortConfig.field === 'filename' ? 'text-indigo-400' : 'text-slate-300'}`}
                  >
                    Por Nome {sortConfig.field === 'filename' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => toggleSort('title')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-800 ${sortConfig.field === 'title' ? 'text-indigo-400' : 'text-slate-300'}`}
                  >
                    Por Título {sortConfig.field === 'title' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => toggleSort('missing-title')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-800 ${sortConfig.field === 'missing-title' ? 'text-indigo-400' : 'text-slate-300'}`}
                  >
                    Sem Título Primeiro
                  </button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md group mx-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nome, título, local, data, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
              >
                {selectedVideos.size === filteredAndSortedVideos.length && filteredAndSortedVideos.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              {selectedVideos.size > 0 && (
                <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">
                  {selectedVideos.size}
                </span>
              )}

              <div className="h-6 w-px bg-slate-800 mx-2"></div>

              <button
                onClick={handleResetCatalog}
                className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                title="Limpar Catálogo"
              >
                Limpar Tudo
              </button>
            </div>
          </div>

          {/* Scrollable Grid Container */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {/* Empty State */}
            {videos.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center mb-6 animate-pulse">
                  <Upload className="w-8 h-8 text-slate-600" />
                </div>
                <h2 className="text-xl font-medium text-slate-300 mb-2">Sua biblioteca está vazia</h2>
                <p className="text-sm max-w-md text-center text-slate-500">
                  Arraste vídeos ou clique em &quot;Adicionar Vídeos&quot; para começar.
                </p>
              </div>
            )}

            {/* No Results State */}
            {videos.length > 0 && filteredAndSortedVideos.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Nenhum vídeo encontrado com os filtros atuais.</p>
              </div>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
              {filteredAndSortedVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSelected={selectedVideos.has(video.id)}
                  onSelect={() => toggleVideoSelection(video.id)}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      toggleVideoSelection(video.id);
                    } else {
                      setSelectedVideos(new Set([video.id]));
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Invisible Overlay for Drop */}
          {dragActive && (
            <div className="absolute inset-0 z-50 border-4 border-indigo-500 rounded-lg flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
              <span className="text-2xl font-bold text-white tracking-widest uppercase">Soltar Arquivos</span>
            </div>
          )}
        </div>
      </StudioLayout>

      {/* Toast Notifications */}
      <ToastContainer notifications={notifications} onDismiss={dismissNotification} />
    </>
  );
}
