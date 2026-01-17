'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { Download, Search } from 'lucide-react';
import { VideoFile, Catalog, BatchMetadata } from './types';
import { parseFilename } from './utils/parsers';

// Components
import Header from './components/Header';
import CatalogManager from './components/CatalogManager';
import FileImporter from './components/FileImporter';
import VideoCard from './components/VideoCard';
import MetadataForm from './components/MetadataForm';
import BatchEditor from './components/BatchEditor';

export default function VideoCataloger() {
  // VERSION MARKER - if you see this in the UI, the code is updated!
  const BUILD_VERSION = "v2.0-FIXED";

  const [cameraModel, setCameraModel] = useState('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<any | null>(null);
  const [directoryPath, setDirectoryPath] = useState('');
  const [notification, setNotification] = useState<any>(null);
  const [existingCatalogs, setExistingCatalogs] = useState<Catalog[]>([]);
  const [selectedVideos, setSelectedVideos] = useState(new Set<any>());
  const [batchEditMode, setBatchEditMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [batchMetadata, setBatchMetadata] = useState<BatchMetadata>({
    location: '',
    tags: [],
    notes: '',
    customFields: []
  });

  const showNotification = useCallback((message: string, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // --- Derived State ---

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = video.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.metadata.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType === 'missing-title') return !video.metadata.title;
      if (filterType === 'auto-only') return !!video.metadata.recordingTime;
      return true;
    });
  }, [videos, searchTerm, filterType]);

  // Get current video directly from videos array (not memoized to avoid stale data)
  const currentVideo = currentVideoId ? videos.find(v => v.id === currentVideoId) ?? null : null;

  // Navigation
  const activeIndex = currentVideoId ? filteredVideos.findIndex(v => v.id === currentVideoId) : -1;
  const hasNext = activeIndex !== -1 && activeIndex < filteredVideos.length - 1;
  const hasPrev = activeIndex > 0;

  const handleNextVideo = useCallback(() => {
    if (activeIndex !== -1 && activeIndex < filteredVideos.length - 1) {
      setCurrentVideoId(filteredVideos[activeIndex + 1].id);
    }
  }, [activeIndex, filteredVideos]);

  const handlePrevVideo = useCallback(() => {
    if (activeIndex > 0) {
      setCurrentVideoId(filteredVideos[activeIndex - 1].id);
    }
  }, [activeIndex, filteredVideos]);

  // --- File Handling ---

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) {
      showNotification('Nenhum arquivo selecionado', 'error');
      return;
    }

    const videoFiles = files.filter(file => {
      const name = file.name.toLowerCase();
      const type = file.type.toLowerCase();
      return type.startsWith('video/') ||
        name.endsWith('.insv') || name.endsWith('.mp4') ||
        name.endsWith('.mov') || name.endsWith('.avi');
    });

    if (videoFiles.length === 0) {
      showNotification('Nenhum arquivo de vídeo encontrado', 'error');
      return;
    }

    const newVideos: VideoFile[] = videoFiles.map((file, index) => {
      const parsedData: any = cameraModel ? parseFilename(file.name, cameraModel) : null;
      return {
        id: Date.now() + index + Math.random(),
        filename: file.name,
        size: file.size,
        metadata: {
          title: '',
          date: parsedData?.date || new Date().toISOString().split('T')[0],
          location: '',
          tags: [],
          notes: '',
          recordingTime: parsedData?.time,
          lens: parsedData?.lens,
          clipNumber: parsedData?.clipNumber || parsedData?.fileNumber,
          customFields: []
        }
      };
    });

    setVideos(prev => [...prev, ...newVideos]);
    showNotification(`${videoFiles.length} vídeo(s) importado(s)!`, 'success');

    // Reset file input
    e.target.value = '';
  }, [cameraModel, showNotification]);

  const handleImportCatalogs = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));
    if (jsonFiles.length === 0) {
      showNotification('Nenhum arquivo JSON encontrado', 'error');
      return;
    }

    try {
      const catalogs = await Promise.all(
        jsonFiles.map(file =>
          new Promise<Catalog>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              try { resolve(JSON.parse(e.target.result)); }
              catch (err) { reject(err); }
            };
            reader.readAsText(file);
          })
        )
      );
      setExistingCatalogs(prev => [...prev, ...catalogs]);
      showNotification(`${catalogs.length} catálogo(s) importado(s)!`, 'success');
    } catch (error) {
      showNotification('Erro ao importar catálogos', 'error');
    }
  }, [showNotification]);

  // --- JSON Generation (Simplified Output) ---

  const generateJSON = useCallback(() => {
    try {
      const videosForExport = videos.map(v => {
        const exported: any = {
          filename: v.filename,
          date: v.metadata.date,
        };

        // Add optional fields only if they have values
        if (v.metadata.title) exported.title = v.metadata.title;
        if (v.metadata.location) exported.location = v.metadata.location;
        if (v.metadata.tags.length > 0) exported.tags = v.metadata.tags;
        if (v.metadata.notes) exported.notes = v.metadata.notes;

        // Auto-detected
        if (v.metadata.recordingTime) exported.recordingTime = v.metadata.recordingTime;
        if (v.metadata.lens) exported.lens = v.metadata.lens;
        if (v.metadata.clipNumber) exported.clipNumber = v.metadata.clipNumber;

        // Custom fields as top-level keys
        if (v.metadata.customFields && v.metadata.customFields.length > 0) {
          v.metadata.customFields.forEach(field => {
            if (field.key && field.value) exported[field.key] = field.value;
          });
        }

        return exported;
      });

      let mergedVideos = [...videosForExport];
      if (existingCatalogs.length > 0) {
        existingCatalogs.forEach(catalog => {
          if (catalog.videos && Array.isArray(catalog.videos)) {
            catalog.videos.forEach((oldVideo: any) => {
              const exists = mergedVideos.some(v => v.filename === oldVideo.filename);
              if (!exists) mergedVideos.push(oldVideo);
            });
          }
        });
      }

      const finalCatalog = {
        generatedAt: new Date().toISOString(),
        cameraModel: cameraModel,
        directoryPath: directoryPath || undefined,
        totalVideos: mergedVideos.length,
        videos: mergedVideos
      };

      const jsonString = JSON.stringify(finalCatalog, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `catalog-${new Date().toISOString().slice(0, 10)}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification(`Catálogo gerado: ${filename}`, 'success');
    } catch (error) {
      console.error('Erro ao gerar JSON:', error);
      showNotification('Erro ao gerar catálogo.', 'error');
    }
  }, [videos, existingCatalogs, cameraModel, directoryPath, showNotification]);

  // --- CRUD Operations ---

  const updateMetadata = useCallback((videoId: any, field: string, value: any) => {
    setVideos(prev => prev.map(v =>
      v.id === videoId ? { ...v, metadata: { ...v.metadata, [field]: value } } : v
    ));
  }, []);

  const addTag = useCallback((videoId: any, tag: string) => {
    if (!tag.trim()) return;
    setVideos(prev => prev.map(v =>
      v.id === videoId ? { ...v, metadata: { ...v.metadata, tags: [...v.metadata.tags, tag.trim()] } } : v
    ));
  }, []);

  const removeTag = useCallback((videoId: any, tagIndex: number) => {
    setVideos(prev => prev.map(v =>
      v.id === videoId ? { ...v, metadata: { ...v.metadata, tags: v.metadata.tags.filter((_, i) => i !== tagIndex) } } : v
    ));
  }, []);

  const addCustomField = useCallback((videoId: any) => {
    setVideos(prev => prev.map(v =>
      v.id === videoId ? { ...v, metadata: { ...v.metadata, customFields: [...(v.metadata.customFields || []), { key: '', value: '' }] } } : v
    ));
  }, []);

  const updateCustomField = useCallback((videoId: any, index: number, field: string, value: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        const newFields = [...(v.metadata.customFields || [])];
        newFields[index] = { ...newFields[index], [field]: value };
        return { ...v, metadata: { ...v.metadata, customFields: newFields } };
      }
      return v;
    }));
  }, []);

  const removeCustomField = useCallback((videoId: any, index: number) => {
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        const newFields = (v.metadata.customFields || []).filter((_, i) => i !== index);
        return { ...v, metadata: { ...v.metadata, customFields: newFields } };
      }
      return v;
    }));
  }, []);

  // --- Batch Operations ---

  const toggleVideoSelection = useCallback((videoId: any) => {
    setSelectedVideos(prev => {
      const newSelection = new Set(prev);
      newSelection.has(videoId) ? newSelection.delete(videoId) : newSelection.add(videoId);
      return newSelection;
    });
  }, []);

  const applyBatchMetadata = useCallback(() => {
    setVideos(prev => prev.map(v => {
      if (selectedVideos.has(v.id)) {
        return {
          ...v,
          metadata: {
            ...v.metadata,
            ...(batchMetadata.location ? { location: batchMetadata.location } : {}),
            ...(batchMetadata.notes ? { notes: batchMetadata.notes } : {}),
            ...(batchMetadata.tags.length > 0 ? { tags: [...v.metadata.tags, ...batchMetadata.tags] } : {}),
            customFields: [
              ...(v.metadata.customFields || []),
              ...batchMetadata.customFields.filter(cf => cf.key && cf.value)
            ]
          }
        };
      }
      return v;
    }));

    showNotification(`Metadados aplicados a ${selectedVideos.size} vídeo(s)!`, 'success');
    setBatchEditMode(false);
    setBatchMetadata({ location: '', tags: [], notes: '', customFields: [] });
  }, [selectedVideos, batchMetadata, showNotification]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <Header cameraModel={cameraModel} setCameraModel={setCameraModel} directoryPath={directoryPath} setDirectoryPath={setDirectoryPath} />
        <CatalogManager existingCatalogs={existingCatalogs} onImport={handleImportCatalogs} onRemove={(i) => setExistingCatalogs(prev => prev.filter((_, idx) => idx !== i))} />
        <FileImporter onFileSelect={handleFileSelect} cameraModel={cameraModel} />

        {/* Toolbar */}
        {videos.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-10 bg-white/95 backdrop-blur-sm">
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-100 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Todos</option>
                <option value="missing-title">Sem Título</option>
                <option value="auto-only">Com Metadados Auto</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-sm text-slate-500 pr-4 border-r border-slate-200">{filteredVideos.length} vídeos</span>
              {selectedVideos.size > 0 ? (
                <>
                  <button onClick={() => setBatchEditMode(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                    Editar {selectedVideos.size} Selecionados
                  </button>
                  <button onClick={() => setSelectedVideos(new Set())} className="text-slate-500 hover:text-slate-700 text-sm px-3">Limpar</button>
                </>
              ) : (
                <button onClick={() => setSelectedVideos(new Set(filteredVideos.map(v => v.id)))} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium">
                  Selecionar Todos
                </button>
              )}
              <button onClick={generateJSON} disabled={!cameraModel}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Download className="w-4 h-4" /> Gerar JSON
              </button>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {filteredVideos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              isSelected={selectedVideos.has(video.id)}
              isCurrent={currentVideoId === video.id}
              onSelect={() => toggleVideoSelection(video.id)}
              onClick={() => setCurrentVideoId(video.id)}
              onRemove={() => {
                setVideos(prev => prev.filter(v => v.id !== video.id));
                if (currentVideoId === video.id) setCurrentVideoId(null);
              }}
            />
          ))}
        </div>

        {/* Modal Overlay */}
        {(batchEditMode || currentVideo) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => { setBatchEditMode(false); setCurrentVideoId(null); }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {batchEditMode && (
                <BatchEditor
                  filesCount={selectedVideos.size}
                  batchMetadata={batchMetadata}
                  setBatchMetadata={setBatchMetadata}
                  onApply={applyBatchMetadata}
                  onCancel={() => setBatchEditMode(false)}
                  onAddTag={(tag) => setBatchMetadata(p => ({ ...p, tags: [...p.tags, tag] }))}
                  onRemoveTag={(idx) => setBatchMetadata(p => ({ ...p, tags: p.tags.filter((_, i) => i !== idx) }))}
                  onAddCustomField={() => setBatchMetadata(p => ({ ...p, customFields: [...p.customFields, { key: '', value: '' }] }))}
                  onUpdateCustomField={(idx, f, v) => {
                    const nf = [...batchMetadata.customFields];
                    nf[idx] = { ...nf[idx], [f]: v };
                    setBatchMetadata({ ...batchMetadata, customFields: nf });
                  }}
                  onRemoveCustomField={(idx) => setBatchMetadata(p => ({ ...p, customFields: p.customFields.filter((_, i) => i !== idx) }))}
                />
              )}
              {currentVideo && !batchEditMode && (
                <MetadataForm
                  key={currentVideo.id}
                  video={currentVideo}
                  onUpdate={updateMetadata}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  onAddCustomField={addCustomField}
                  onUpdateCustomField={updateCustomField}
                  onRemoveCustomField={removeCustomField}
                  onNext={handleNextVideo}
                  onPrev={handlePrevVideo}
                  hasNext={hasNext}
                  hasPrev={hasPrev}
                  onClose={() => setCurrentVideoId(null)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}