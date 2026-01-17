'use client'

import React, { useState } from 'react';
import { Video, Camera, FileJson, Plus, Trash2, Download, FolderOpen } from 'lucide-react';

export default function VideoCataloger() {
  const [cameraModel, setCameraModel] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [directoryPath, setDirectoryPath] = useState('');
  const [notification, setNotification] = useState<any>(null);
  const [existingCatalogs, setExistingCatalogs] = useState<any[]>([]);
  const [selectedVideos, setSelectedVideos] = useState(new Set<any>());
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [batchMetadata, setBatchMetadata] = useState<any>({
    location: '',
    description: '',
    resolution: '',
    fps: '',
    tags: [],
    notes: '',
    customFields: []
  });

  const showNotification = (message: string, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Toggle seleção de vídeo
  const toggleVideoSelection = (videoId: any) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
  };

  // Selecionar todos
  const selectAll = () => {
    setSelectedVideos(new Set(videos.map(v => v.id)));
  };

  // Desselecionar todos
  const deselectAll = () => {
    setSelectedVideos(new Set());
  };

  // Aplicar metadados em lote
  const applyBatchMetadata = () => {
    setVideos(videos.map(v => {
      if (selectedVideos.has(v.id)) {
        return {
          ...v,
          metadata: {
            ...v.metadata,
            ...(batchMetadata.location ? { location: batchMetadata.location } : {}),
            ...(batchMetadata.description ? { description: batchMetadata.description } : {}),
            ...(batchMetadata.resolution ? { resolution: batchMetadata.resolution } : {}),
            ...(batchMetadata.fps ? { fps: batchMetadata.fps } : {}),
            ...(batchMetadata.notes ? { notes: batchMetadata.notes } : {}),
            ...(batchMetadata.tags.length > 0 ? { tags: [...v.metadata.tags, ...batchMetadata.tags] } : {}),
            customFields: [
              ...(v.metadata.customFields || []),
              ...batchMetadata.customFields.filter((cf: any) => cf.key && cf.value)
            ]
          }
        };
      }
      return v;
    }));

    showNotification(`Metadados aplicados a ${selectedVideos.size} vídeo(s)!`, 'success');
    setBatchEditMode(false);
    setBatchMetadata({
      location: '',
      description: '',
      resolution: '',
      fps: '',
      tags: [],
      notes: '',
      customFields: []
    });
    setSelectedVideos(new Set());
  };

  // Adicionar tag em lote
  const addBatchTag = (tag: string) => {
    if (!tag.trim()) return;
    setBatchMetadata({
      ...batchMetadata,
      tags: [...batchMetadata.tags, tag.trim()]
    });
  };

  // Remover tag em lote
  const removeBatchTag = (index: number) => {
    setBatchMetadata({
      ...batchMetadata,
      tags: batchMetadata.tags.filter((_: any, i: number) => i !== index)
    });
  };

  // Adicionar campo customizado em lote
  const addBatchCustomField = () => {
    setBatchMetadata({
      ...batchMetadata,
      customFields: [...batchMetadata.customFields, { key: '', value: '' }]
    });
  };

  // Atualizar campo customizado em lote
  const updateBatchCustomField = (index: number, field: string, value: string) => {
    const newFields = [...batchMetadata.customFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setBatchMetadata({
      ...batchMetadata,
      customFields: newFields
    });
  };

  // Remover campo customizado em lote
  const removeBatchCustomField = (index: number) => {
    setBatchMetadata({
      ...batchMetadata,
      customFields: batchMetadata.customFields.filter((_: any, i: number) => i !== index)
    });
  };

  const cameraModels = [
    'Insta360 X5',
    'Insta360 X4',
    'Insta360 X3',
    'Canon EOS R50',
    'Canon EOS R5',
    'Canon EOS R6',
    'GoPro Hero 12',
    'GoPro Hero 11',
    'DJI Osmo Action 4',
    'Sony ZV-1',
    'Outro'
  ];

  // Parser para nomes de arquivo Insta360
  const parseInsta360Filename = (filename: string) => {
    const match = filename.match(/VID_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\d{2})_(\d{3})/);
    
    if (match) {
      const [_, year, month, day, hour, minute, second, lens, clip] = match;
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}:${second}`,
        lens: lens === '00' ? 'Traseira' : lens === '10' ? 'Frontal' : 'Desconhecida',
        clipNumber: parseInt(clip, 10)
      };
    }
    return null;
  };

  // Parser para Canon
  const parseCanonFilename = (filename: string) => {
    const match = filename.match(/([A-Z_]{3,4})_?(\d{4})/);
    if (match) {
      const [_, prefix, fileNumber] = match;
      return {
        prefix: prefix,
        fileNumber: parseInt(fileNumber, 10)
      };
    }
    return null;
  };

  // Parser para GoPro
  const parseGoProFilename = (filename: string) => {
    const match = filename.match(/G[HXL](\d{2})(\d{4})/);
    if (match) {
      const [_, chapter, file] = match;
      return {
        chapter: parseInt(chapter, 10),
        fileNumber: parseInt(file, 10)
      };
    }
    return null;
  };

  const parseFilename = (filename: string, camera: string) => {
    if (camera.startsWith('Insta360')) {
      return parseInsta360Filename(filename);
    } else if (camera.startsWith('Canon')) {
      return parseCanonFilename(filename);
    } else if (camera.startsWith('GoPro')) {
      return parseGoProFilename(filename);
    }
    return null;
  };

  // Adicionar campo customizado
  const addCustomField = (videoId: any) => {
    setVideos(videos.map(v => 
      v.id === videoId 
        ? { 
            ...v, 
            metadata: { 
              ...v.metadata, 
              customFields: [...(v.metadata.customFields || []), { key: '', value: '' }]
            }
          }
        : v
    ));
  };

  // Atualizar campo customizado
  const updateCustomField = (videoId: any, index: number, field: string, value: string) => {
    setVideos(videos.map(v => {
      if (v.id === videoId) {
        const newCustomFields = [...(v.metadata.customFields || [])];
        newCustomFields[index] = { ...newCustomFields[index], [field]: value };
        return { ...v, metadata: { ...v.metadata, customFields: newCustomFields } };
      }
      return v;
    }));
  };

  // Remover campo customizado
  const removeCustomField = (videoId: any, index: number) => {
    setVideos(videos.map(v => {
      if (v.id === videoId) {
        const newCustomFields = (v.metadata.customFields || []).filter((_: any, i: number) => i !== index);
        return { ...v, metadata: { ...v.metadata, customFields: newCustomFields } };
      }
      return v;
    }));
  };

  // Importar catálogos JSON existentes
  const handleImportCatalogs = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      showNotification('Nenhum arquivo JSON encontrado', 'error');
      return;
    }

    try {
      const catalogs = await Promise.all(
        jsonFiles.map(file => 
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              try {
                const data = JSON.parse(e.target.result);
                resolve(data);
              } catch (err) {
                reject(err);
              }
            };
            reader.readAsText(file);
          })
        )
      );
      
      setExistingCatalogs([...existingCatalogs, ...catalogs]);
      showNotification(`${catalogs.length} catálogo(s) importado(s)!`, 'success');
    } catch (error) {
      showNotification('Erro ao importar catálogos', 'error');
    }
  };

  // Remover catálogo importado
  const removeCatalog = (index: number) => {
    setExistingCatalogs(existingCatalogs.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    
    if (files.length === 0) {
      showNotification('Nenhum arquivo selecionado', 'error');
      return;
    }

    const videoFiles = files.filter(file => {
      const name = file.name.toLowerCase();
      const type = file.type.toLowerCase();
      return type.startsWith('video/') || 
             name.endsWith('.insv') ||
             name.endsWith('.mp4') ||
             name.endsWith('.mov') ||
             name.endsWith('.avi');
    });
    
    if (videoFiles.length === 0) {
      showNotification('Nenhum arquivo de vídeo encontrado', 'error');
      return;
    }

    const newVideos = videoFiles.map((file, index) => {
      const parsedData = cameraModel ? parseFilename(file.name, cameraModel) : null;

      return {
        id: Date.now() + index + Math.random(),
        filename: file.name,
        size: file.size,
        type: file.type || 'video/unknown',
        path: file.name,
        metadata: {
          title: '',
          description: '',
          location: '',
          date: parsedData?.date || new Date().toISOString().split('T')[0],
          recordingTime: parsedData?.time || '',
          lens: parsedData?.lens || '',
          clipNumber: parsedData?.clipNumber || parsedData?.fileNumber || '',
          prefix: parsedData?.prefix || '',
          chapter: parsedData?.chapter || '',
          duration: '',
          tags: [],
          resolution: '',
          fps: '',
          notes: '',
          customFields: []
        }
      };
    });

    setVideos([...videos, ...newVideos]);
    showNotification(`${videoFiles.length} vídeo(s) importado(s)!`, 'success');
  };

  const updateMetadata = (videoId: any, field: string, value: any) => {
    setVideos(videos.map(v => 
      v.id === videoId 
        ? { ...v, metadata: { ...v.metadata, [field]: value } }
        : v
    ));
  };

  const addTag = (videoId: any, tag: string) => {
    if (!tag.trim()) return;
    setVideos(videos.map(v => 
      v.id === videoId 
        ? { ...v, metadata: { ...v.metadata, tags: [...v.metadata.tags, tag.trim()] } }
        : v
    ));
  };

  const removeTag = (videoId: any, tagIndex: number) => {
    setVideos(videos.map(v => 
      v.id === videoId 
        ? { ...v, metadata: { ...v.metadata, tags: v.metadata.tags.filter((_: any, i: number) => i !== tagIndex) } }
        : v
    ));
  };

  const removeVideo = (videoId: any) => {
    setVideos(videos.filter(v => v.id !== videoId));
    if (currentVideo?.id === videoId) setCurrentVideo(null);
  };

  const generateJSON = () => {
    try {
      const currentCatalog = {
        generatedAt: new Date().toISOString(),
        cameraModel: cameraModel,
        directoryPath: directoryPath || "N/A",
        totalVideos: videos.length,
        videos: videos.map(v => {
          const videoData: any = {
            filename: v.filename,
            filePath: v.path,
            fileSize: v.size,
            fileSizeMB: parseFloat((v.size / 1024 / 1024).toFixed(2)),
            fileType: v.type
          };
          
          if (v.metadata.title) videoData.title = v.metadata.title;
          if (v.metadata.description) videoData.description = v.metadata.description;
          if (v.metadata.location) videoData.location = v.metadata.location;
          if (v.metadata.date) videoData.date = v.metadata.date;
          if (v.metadata.recordingTime) videoData.recordingTime = v.metadata.recordingTime;
          if (v.metadata.lens) videoData.lens = v.metadata.lens;
          if (v.metadata.clipNumber) videoData.clipNumber = v.metadata.clipNumber;
          if (v.metadata.prefix) videoData.prefix = v.metadata.prefix;
          if (v.metadata.chapter) videoData.chapter = v.metadata.chapter;
          if (v.metadata.duration) videoData.duration = v.metadata.duration;
          if (v.metadata.resolution) videoData.resolution = v.metadata.resolution;
          if (v.metadata.fps) videoData.fps = v.metadata.fps;
          if (v.metadata.tags && v.metadata.tags.length > 0) videoData.tags = v.metadata.tags;
          if (v.metadata.notes) videoData.notes = v.metadata.notes;
          
          if (v.metadata.customFields && v.metadata.customFields.length > 0) {
            v.metadata.customFields.forEach((field: any) => {
              if (field.key && field.value) {
                videoData[field.key] = field.value;
              }
            });
          }
          
          return videoData;
        })
      };

      let mergedVideos = [...currentCatalog.videos];
      
      if (existingCatalogs.length > 0) {
        existingCatalogs.forEach(catalog => {
          if (catalog.videos && Array.isArray(catalog.videos)) {
            catalog.videos.forEach((oldVideo: any) => {
              const exists = mergedVideos.some(v => v.filename === oldVideo.filename);
              if (!exists) {
                mergedVideos.push(oldVideo);
              }
            });
          }
        });
      }

      const finalCatalog: any = {
        ...currentCatalog,
        totalVideos: mergedVideos.length,
        videos: mergedVideos,
        mergedFrom: existingCatalogs.length > 0 ? `${existingCatalogs.length} catálogo(s) anterior(es)` : undefined
      };

      const jsonString = JSON.stringify(finalCatalog, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `catalog-${new Date().toISOString().slice(0,10)}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification(`Catálogo gerado: ${filename}`, 'success');
    } catch (error) {
      console.error('Erro ao gerar JSON:', error);
      showNotification('Erro ao gerar catálogo. Verifique o console.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Catalogador de Vídeos</h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Como usar:</h3>
            <ol className="text-sm text-blue-700 space-y-1 ml-4">
              <li>1. (Opcional) Importe catálogos JSON anteriores para mesclar</li>
              <li>2. Selecione o modelo da sua câmera</li>
              <li>3. Adicione os arquivos de vídeo</li>
              <li>4. Preencha os metadados de cada vídeo</li>
              <li>5. Gere o catálogo JSON (mesclará com anteriores se houver)</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>💡 Parsing automático:</strong> Insta360 extrai data/hora/lente do nome do arquivo. 
                Canon e GoPro extraem apenas número/prefixo.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileJson className="w-4 h-4 inline mr-2" />
              Mesclar com Catálogos Anteriores (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                multiple
                accept=".json"
                onChange={handleImportCatalogs}
                className="hidden"
                id="import-json"
              />
              <label
                htmlFor="import-json"
                className="flex-1 cursor-pointer border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-blue-500 transition-colors"
              >
                <Plus className="w-5 h-5 inline mr-2 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Importar JSON(s) existente(s)
                </span>
              </label>
            </div>
            {existingCatalogs.length > 0 && (
              <div className="mt-3 space-y-2">
                {existingCatalogs.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Catálogo {idx + 1}: {cat.totalVideos} vídeo(s) - {new Date(cat.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => removeCatalog(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Camera className="w-4 h-4 inline mr-2" />
                Modelo da Câmera *
              </label>
              <select
                value={cameraModel}
                onChange={(e) => setCameraModel(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o modelo</option>
                {cameraModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              {!cameraModel && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Selecione o modelo para extração automática de metadados
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FolderOpen className="w-4 h-4 inline mr-2" />
                Caminho do Diretório (opcional)
              </label>
              <input
                type="text"
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                placeholder="Ex: /Users/luiz/Videos/Ciclismo"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                Digite manualmente o caminho onde os vídeos estão armazenados
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              multiple
              accept="video/*,.insv,.mp4,.mov"
              onChange={handleFileSelect}
              className="hidden"
              id="files-input"
            />
            <label htmlFor="files-input" className="cursor-pointer block">
              <Plus className="w-16 h-16 mx-auto text-slate-400 mb-3" />
              <p className="text-lg text-slate-600 font-medium mb-1">Adicionar Vídeos</p>
              <p className="text-sm text-slate-400">
                Clique para selecionar múltiplos arquivos de vídeo
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Formatos: MP4, MOV, INSV (Insta360)
              </p>
              {cameraModel && (
                <div className="mt-3 inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                  ✓ Parsing automático ativado
                </div>
              )}
            </label>
          </div>
        </div>

        {videos.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Vídeos Importados ({videos.length})
              </h2>
              <div className="flex gap-2">
                {selectedVideos.size > 0 && (
                  <>
                    <button
                      onClick={() => setBatchEditMode(true)}
                      className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Editar {selectedVideos.size} em lote
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-sm bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600"
                    >
                      Desmarcar
                    </button>
                  </>
                )}
                {selectedVideos.size === 0 && videos.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Selecionar todos
                  </button>
                )}
                <button
                  onClick={() => setVideos([])}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar tudo
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {videos.map(video => (
            <div
              key={video.id}
              className={`bg-white rounded-lg p-4 cursor-pointer transition-all relative ${
                currentVideo?.id === video.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : selectedVideos.has(video.id)
                  ? 'ring-2 ring-purple-500 shadow-md'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedVideos.has(video.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleVideoSelection(video.id);
                  }}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                />
              </div>

              <div 
                onClick={() => setCurrentVideo(video)}
                className="pl-7"
              >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-800 truncate">{video.filename}</p>
                  <p className="text-xs text-slate-500">{(video.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="flex gap-1 mt-1">
                    {(video.metadata.recordingTime || video.metadata.prefix || video.metadata.chapter) && (
                      <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        ✓ Auto
                      </span>
                    )}
                    {video.metadata.customFields && video.metadata.customFields.length > 0 && (
                      <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        +{video.metadata.customFields.length} custom
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVideo(video.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {video.metadata.title && (
                <p className="text-sm text-slate-600 truncate">{video.metadata.title}</p>
              )}
              </div>
            </div>
          ))}
        </div>

        {batchEditMode && selectedVideos.size > 0 && (
          <div className="bg-white rounded-xl shadow-2xl p-6 mb-6 border-2 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-800">
                Edição em Lote - {selectedVideos.size} vídeo(s) selecionado(s)
              </h2>
              <button
                onClick={() => setBatchEditMode(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-purple-800">
                ℹ️ Preencha apenas os campos que deseja aplicar a todos os vídeos selecionados. 
                Campos vazios não serão modificados. Tags e campos customizados serão ADICIONADOS aos existentes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Local</label>
                <input
                  type="text"
                  value={batchMetadata.location}
                  onChange={(e) => setBatchMetadata({...batchMetadata, location: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Parque Ibirapuera, São Paulo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resolução</label>
                <input
                  type="text"
                  value={batchMetadata.resolution}
                  onChange={(e) => setBatchMetadata({...batchMetadata, resolution: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: 8K, 4K, 1080p"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">FPS</label>
                <input
                  type="text"
                  value={batchMetadata.fps}
                  onChange={(e) => setBatchMetadata({...batchMetadata, fps: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: 30, 60, 120"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                <textarea
                  value={batchMetadata.description}
                  onChange={(e) => setBatchMetadata({...batchMetadata, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  placeholder="Descrição comum para todos os vídeos"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags (serão adicionadas)</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {batchMetadata.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeBatchTag(idx)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addBatchTag((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Digite uma tag e pressione Enter"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
                <textarea
                  value={batchMetadata.notes}
                  onChange={(e) => setBatchMetadata({...batchMetadata, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  placeholder="Notas comuns"
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Campos Customizados (serão adicionados)
                  </label>
                  <button
                    onClick={addBatchCustomField}
                    className="text-sm bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Campo
                  </button>
                </div>

                {batchMetadata.customFields.length > 0 && (
                  <div className="space-y-3">
                    {batchMetadata.customFields.map((field: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-start bg-purple-50 p-3 rounded-lg">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateBatchCustomField(idx, 'key', e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Nome do campo"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateBatchCustomField(idx, 'value', e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Valor"
                          />
                        </div>
                        <button
                          onClick={() => removeBatchCustomField(idx)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={applyBatchMetadata}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-all"
              >
                Aplicar a {selectedVideos.size} vídeo(s)
              </button>
              <button
                onClick={() => setBatchEditMode(false)}
                className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {currentVideo && (
          <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Metadados: {currentVideo.filename}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Título</label>
                <input
                  type="text"
                  value={currentVideo.metadata.title}
                  onChange={(e) => updateMetadata(currentVideo.id, 'title', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Título do vídeo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data de Gravação</label>
                <input
                  type="date"
                  value={currentVideo.metadata.date}
                  onChange={(e) => updateMetadata(currentVideo.id, 'date', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {currentVideo.metadata.recordingTime && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hora de Gravação
                    <span className="ml-2 text-xs text-green-600">(Auto)</span>
                  </label>
                  <input
                    type="text"
                    value={currentVideo.metadata.recordingTime}
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-green-50"
                  />
                </div>
              )}

              {currentVideo.metadata.lens && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lente
                    <span className="ml-2 text-xs text-green-600">(Auto)</span>
                  </label>
                  <input
                    type="text"
                    value={currentVideo.metadata.lens}
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-green-50"
                  />
                </div>
              )}

              {currentVideo.metadata.clipNumber > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número do Clipe
                    <span className="ml-2 text-xs text-green-600">(Auto)</span>
                  </label>
                  <input
                    type="text"
                    value={`#${String(currentVideo.metadata.clipNumber).padStart(3, '0')}`}
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-green-50"
                  />
                </div>
              )}

              {currentVideo.metadata.prefix && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prefixo do Arquivo
                    <span className="ml-2 text-xs text-green-600">(Auto)</span>
                  </label>
                  <input
                    type="text"
                    value={currentVideo.metadata.prefix}
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-green-50"
                  />
                </div>
              )}

              {currentVideo.metadata.chapter > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Capítulo (GoPro)
                    <span className="ml-2 text-xs text-green-600">(Auto)</span>
                  </label>
                  <input
                    type="text"
                    value={`Cap. ${currentVideo.metadata.chapter}`}
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-green-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Local</label>
                <input
                  type="text"
                  value={currentVideo.metadata.location}
                  onChange={(e) => updateMetadata(currentVideo.id, 'location', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Local da gravação"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duração</label>
                <input
                  type="text"
                  value={currentVideo.metadata.duration}
                  onChange={(e) => updateMetadata(currentVideo.id, 'duration', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 5:30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resolução</label>
                <input
                  type="text"
                  value={currentVideo.metadata.resolution}
                  onChange={(e) => updateMetadata(currentVideo.id, 'resolution', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 8K, 4K, 1080p"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">FPS</label>
                <input
                  type="text"
                  value={currentVideo.metadata.fps}
                  onChange={(e) => updateMetadata(currentVideo.id, 'fps', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 30, 60, 120"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                <textarea
                  value={currentVideo.metadata.description}
                  onChange={(e) => updateMetadata(currentVideo.id, 'description', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrição do vídeo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {currentVideo.metadata.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(currentVideo.id, idx)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTag(currentVideo.id, (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite uma tag e pressione Enter"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
                <textarea
                  value={currentVideo.metadata.notes}
                  onChange={(e) => updateMetadata(currentVideo.id, 'notes', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Notas adicionais"
                />
              </div>

              <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Campos Customizados
                  </label>
                  <button
                    onClick={() => addCustomField(currentVideo.id)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Campo
                  </button>
                </div>

                {currentVideo.metadata.customFields && currentVideo.metadata.customFields.length > 0 && (
                  <div className="space-y-3">
                    {currentVideo.metadata.customFields.map((field: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateCustomField(currentVideo.id, idx, 'key', e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Nome do campo (ex: Equipamento)"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateCustomField(currentVideo.id, idx, 'value', e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Valor (ex: Specialized Epic)"
                          />
                        </div>
                        <button
                          onClick={() => removeCustomField(currentVideo.id, idx)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(!currentVideo.metadata.customFields || currentVideo.metadata.customFields.length === 0) && (
                  <p className="text-sm text-slate-400 italic text-center py-4">
                    Nenhum campo customizado. Clique em "Adicionar Campo" para criar.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div className="bg-white rounded-xl shadow-2xl p-6">
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Vídeos novos:</span>
                <span className="text-lg font-bold text-blue-600">{videos.length}</span>
              </div>
              
              {existingCatalogs.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Catálogos importados:</span>
                    <span className="text-lg font-bold text-green-600">{existingCatalogs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Vídeos anteriores:</span>
                    <span className="text-lg font-bold text-green-600">
                      {existingCatalogs.reduce((sum, cat) => sum + (cat.totalVideos || 0), 0)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Total mesclado:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {videos.length + existingCatalogs.reduce((sum, cat) => sum + (cat.totalVideos || 0), 0)}
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Com parsing automático:</span>
                <span className="text-lg font-bold text-green-600">
                  {videos.filter(v => v.metadata.recordingTime || v.metadata.prefix || v.metadata.chapter).length}
                </span>
              </div>
            </div>

            <button
              onClick={generateJSON}
              disabled={!cameraModel}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Download className="w-5 h-5" />
              {existingCatalogs.length > 0 ? 'Gerar Catálogo Mesclado' : 'Gerar Catálogo JSON'}
            </button>
            
            {!cameraModel && (
              <p className="text-sm text-red-600 text-center mt-3">
                ⚠️ Selecione o modelo da câmera antes de gerar o catálogo
              </p>
            )}
            
            {cameraModel && existingCatalogs.length > 0 && (
              <p className="text-xs text-purple-600 text-center mt-3">
                🔀 O catálogo incluirá vídeos novos + anteriores (sem duplicatas)
              </p>
            )}
            
            {cameraModel && existingCatalogs.length === 0 && (
              <p className="text-xs text-slate-500 text-center mt-3">
                O arquivo JSON será baixado automaticamente
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}