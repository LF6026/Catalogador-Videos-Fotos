'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Upload, Download, Search, PlusCircle } from 'lucide-react';
import { VideoFile, Catalog } from './types';
import { parseFilename } from './utils/parsers';

// New Studio Components
import StudioLayout from './components/layout/StudioLayout';
import StudioSidebar from './components/layout/Sidebar';
import StudioInspector from './components/layout/Inspector';
import VideoCard from './components/VideoCard';

// Local Storage Keys
const STORAGE_KEYS = {
  VIDEOS: 'cataloger_videos',
  CAMERA_MODEL: 'cataloger_camera_model'
};

export default function VideoCataloger() {
  // --- Global State ---
  const [cameraModel, setCameraModel] = useState('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- UI State ---
  const [selectedVideos, setSelectedVideos] = useState(new Set<any>());
  const [filterType, setFilterType] = useState('all'); // all, auto-only, missing-title
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Persistence ---
  useEffect(() => {
    try {
      const savedVideos = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      const savedCamera = localStorage.getItem(STORAGE_KEYS.CAMERA_MODEL);
      if (savedVideos) setVideos(JSON.parse(savedVideos));
      if (savedCamera) setCameraModel(savedCamera);
      setIsLoaded(true);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  }, [videos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CAMERA_MODEL, cameraModel);
  }, [cameraModel, isLoaded]);

  // --- Derived (HOISTED TO TOP) ---
  const filteredVideos = useMemo(() => {
    let result = videos;
    if (filterType === 'missing-title') result = result.filter(v => !v.metadata.title);
    if (filterType === 'auto-only') result = result.filter(v => v.metadata.recordingTime);
    // Search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.filename.toLowerCase().includes(lower) ||
        v.metadata.title?.toLowerCase().includes(lower) ||
        v.metadata.tags.some(t => t.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [videos, filterType, searchTerm]);

  // --- Actions ---

  const handleUpdateMetadata = useCallback((id: any, field: string, value: any) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, metadata: { ...v.metadata, [field]: value } } : v));
  }, []);

  const handleBatchUpdateMetadata = useCallback((ids: any[], field: string, value: any) => {
    setVideos(prev => prev.map(v =>
      ids.includes(v.id) ? { ...v, metadata: { ...v.metadata, [field]: value } } : v
    ));
  }, []);

  const handleAddTag = useCallback((id: any, tag: string) => {
    if (!tag.trim()) return;
    setVideos(prev => prev.map(v => v.id === id ? { ...v, metadata: { ...v.metadata, tags: [...v.metadata.tags, tag.trim()] } } : v));
  }, []);

  const handleBatchAddTag = useCallback((ids: any[], tag: string) => {
    if (!tag.trim()) return;
    setVideos(prev => prev.map(v =>
      ids.includes(v.id) ? { ...v, metadata: { ...v.metadata, tags: [...v.metadata.tags, tag.trim()] } } : v
    ));
  }, []);

  const handleRemoveTag = useCallback((id: any, index: number) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, metadata: { ...v.metadata, tags: v.metadata.tags.filter((_, i) => i !== index) } } : v));
  });

  // --- JSON Export/Import ---
  const handleExportJSON = async () => {
    try {
      const data = {
        generatedAt: new Date().toISOString(),
        cameraModel,
        totalVideos: videos.length,
        videos: videos.map(v => ({
          filename: v.filename,
          ...v.metadata
        }))
      };

      // Use File System API if available
      if ('showSaveFilePicker' in window) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: `catalog-${new Date().toISOString().split('T')[0]}.json`,
          types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
      } else {
        // Fallback
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `catalog-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleImportCatalog = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          if (data.videos && Array.isArray(data.videos)) {
            // Smart Merge? For now just append and avoid dupes by filename
            setVideos(prev => {
              const existingNames = new Set(prev.map(v => v.filename));
              const newVideos = data.videos
                .filter((v: any) => !existingNames.has(v.filename))
                .map((v: any) => ({
                  id: Date.now() + Math.random(),
                  filename: v.filename,
                  size: 0, // Unknown on import
                  metadata: {
                    ...v,
                    // Ensure required fields exist
                    tags: v.tags || [],
                    customFields: v.customFields || []
                  }
                }));
              return [...prev, ...newVideos];
            });
          }
        } catch (e) {
          console.error("Import failed for file", file.name, e);
        }
      }
    }
  };


  const generateThumbnail = async (file: File): Promise<string | undefined> => {
    // Simplified thumbnail logic for brevity, kept from original
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => video.currentTime = 1;
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320; canvas.height = 180;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } catch { resolve(undefined); }
      };
      video.onerror = () => resolve(undefined);
      video.src = URL.createObjectURL(file);
    });
  };

  const processFiles = useCallback(async (files: File[]) => {
    if (!cameraModel) {
      alert("Selecione um modelo de câmera na barra lateral primeiro!"); // TODO: Better notification
      return;
    }

    const newVideos = await Promise.all(files.map(async (file, idx) => {
      if (!file.type.startsWith('video/') && !file.name.endsWith('.insv')) return null;

      const parsed = parseFilename(file.name, cameraModel);
      let thumb = undefined;
      if (file.type.startsWith('video/')) thumb = await generateThumbnail(file);

      return {
        id: Date.now() + idx + Math.random(),
        filename: file.name,
        size: file.size,
        metadata: {
          title: '',
          date: parsed?.date || new Date().toISOString().split('T')[0],
          location: '',
          tags: [],
          notes: '',
          recordingTime: parsed?.time,
          cameraModel: cameraModel,
          thumbnail: thumb,
          customFields: []
        }
      } as VideoFile;
    }));

    const validVideos = newVideos.filter(Boolean) as VideoFile[];
    setVideos(prev => [...prev, ...validVideos]);
  }, [cameraModel]);

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

  // --- Batch Operations (Now Safe) ---
  const toggleVideoSelection = useCallback((videoId: any) => {
    setSelectedVideos(prev => {
      const newSelection = new Set(prev);
      newSelection.has(videoId) ? newSelection.delete(videoId) : newSelection.add(videoId);
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
    }
  }, [selectedVideos, filteredVideos]);

  const handleManualAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'video/*,.insv,.mp4,.mov'; // Add common video formats
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
    }
  };


  if (!isLoaded) return null;

  return (
    <StudioLayout
      sidebar={
        <StudioSidebar
          cameraModel={cameraModel}
          setCameraModel={setCameraModel}
          filterType={filterType}
          setFilterType={setFilterType}
          totalVideos={videos.length}
          onExportJSON={handleExportJSON}
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
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md group mx-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar vídeos..."
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
              {selectedVideos.size === filteredVideos.length && filteredVideos.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
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
                Arraste vídeos ou clique em "Adicionar Vídeos" para começar.
              </p>
            </div>
          )}

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                isSelected={selectedVideos.has(video.id)}
                onSelect={() => toggleVideoSelection(video.id)}
                onClick={(e) => {
                  // Multi-select with Ctrl/Cmd
                  if (e.ctrlKey || e.metaKey) {
                    toggleVideoSelection(video.id);
                  } else {
                    // Single select
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
  );
}
