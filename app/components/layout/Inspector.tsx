'use client';

import React, { useState } from 'react';
import { Tag, Calendar, MapPin, FileText, Film, X, Layers, Clock, Camera } from 'lucide-react';
import { VideoFile } from '../../types';

interface InspectorProps {
    selectedVideos: Set<string>;
    allVideos: VideoFile[];
    onUpdate: (id: string, field: string, value: unknown) => void;
    onBatchUpdate: (ids: string[], field: string, value: unknown) => void;
    onAddTag: (id: string, tag: string) => void;
    onBatchAddTag: (ids: string[], tag: string) => void;
    onRemoveTag: (id: string, index: number) => void;
}

export default function StudioInspector({
    selectedVideos,
    allVideos,
    onUpdate,
    onBatchUpdate,
    onAddTag,
    onBatchAddTag,
    onRemoveTag
}: InspectorProps) {
    const count = selectedVideos.size;
    const isBatch = count > 1;
    const selectedIds = Array.from(selectedVideos);
    const singleVideo = count === 1 ? allVideos.find(v => v.id === selectedIds[0]) : null;

    // Create a key from selected videos to reset state when selection changes
    const selectionKey = Array.from(selectedVideos).sort().join(',');

    // For batch, we keep local state for inputs before applying
    // Using key-based reset pattern instead of useEffect
    const [batchLocation, setBatchLocation] = useState('');
    const [batchNotes, setBatchNotes] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [lastSelectionKey, setLastSelectionKey] = useState(selectionKey);

    // Reset inputs when selection changes (derived state pattern)
    if (selectionKey !== lastSelectionKey) {
        setBatchLocation('');
        setBatchNotes('');
        setTagInput('');
        setLastSelectionKey(selectionKey);
    }

    const handleAddTagSubmit = () => {
        if (!tagInput.trim()) return;

        if (isBatch) {
            onBatchAddTag(selectedIds, tagInput);
        } else if (singleVideo) {
            onAddTag(singleVideo.id, tagInput);
        }
        setTagInput('');
    };

    if (count === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                <Film className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Selecione um ou mais vídeos para editar</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isBatch ? <Layers className="w-4 h-4 text-purple-400" /> : <Film className="w-4 h-4 text-indigo-400" />}
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {isBatch ? `${count} Itens Selecionados` : 'Detalhes do Vídeo'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Preview (Single Only) */}
                {!isBatch && singleVideo && (
                    <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center relative group">
                        {singleVideo.metadata.thumbnail ? (
                            <img src={singleVideo.metadata.thumbnail} alt={singleVideo.filename} className="w-full h-full object-cover" />
                        ) : (
                            <Film className="w-8 h-8 text-slate-600" />
                        )}
                    </div>
                )}

                {/* Fields */}
                <div className="space-y-4">

                    {/* Filename (Read-only, Single Only) */}
                    {!isBatch && singleVideo && (
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">Arquivo Original</label>
                            <div className="text-sm text-slate-300 font-mono truncate" title={singleVideo.filename}>
                                {singleVideo.filename}
                            </div>
                        </div>
                    )}

                    {/* Auto-detected info (Single Only) */}
                    {!isBatch && singleVideo && (singleVideo.metadata.recordingTime || singleVideo.metadata.lens || singleVideo.metadata.cameraModel) && (
                        <div className="flex flex-wrap gap-2 py-2 border-y border-slate-800">
                            {singleVideo.metadata.cameraModel && (
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded flex items-center gap-1">
                                    <Camera className="w-3 h-3" />
                                    {singleVideo.metadata.cameraModel}
                                </span>
                            )}
                            {singleVideo.metadata.recordingTime && (
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {singleVideo.metadata.recordingTime}
                                </span>
                            )}
                            {singleVideo.metadata.lens && (
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                    Lente: {singleVideo.metadata.lens}
                                </span>
                            )}
                            {singleVideo.metadata.clipNumber && (
                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                    Clip #{singleVideo.metadata.clipNumber}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Title (Single Only) */}
                    {!isBatch && singleVideo && (
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">Título</label>
                            <input
                                type="text"
                                value={singleVideo.metadata.title}
                                onChange={(e) => onUpdate(singleVideo.id, 'title', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Adicione um título..."
                            />
                        </div>
                    )}

                    {isBatch && (
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <p className="text-xs text-purple-300 text-center">
                                Edição em Lote Ativa. As alterações serão aplicadas a todos os {count} vídeos.
                            </p>
                        </div>
                    )}

                    {/* Date & Location */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Data
                            </label>
                            <input
                                type="date"
                                value={!isBatch && singleVideo ? singleVideo.metadata.date : ''}
                                onChange={(e) => !isBatch && singleVideo && onUpdate(singleVideo.id, 'date', e.target.value)}
                                disabled={isBatch}
                                title={isBatch ? "Edição de data em lote não suportada" : ""}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Local
                            </label>
                            <input
                                type="text"
                                value={isBatch ? batchLocation : (singleVideo?.metadata.location || '')}
                                onChange={(e) => isBatch ? setBatchLocation(e.target.value) : singleVideo && onUpdate(singleVideo.id, 'location', e.target.value)}
                                onBlur={() => isBatch && batchLocation && onBatchUpdate(selectedIds, 'location', batchLocation)}
                                placeholder={isBatch ? "Definir local..." : "Definir local..."}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Tags
                        </label>

                        {/* Existing Tags (only for single) */}
                        {!isBatch && singleVideo && singleVideo.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {singleVideo.metadata.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {tag}
                                        <button onClick={() => onRemoveTag(singleVideo.id, idx)} className="hover:text-white">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder={isBatch ? "Adicionar tag a todos..." : "Adicionar tag..."}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTagSubmit();
                                    }
                                }}
                            />
                            <button
                                onClick={handleAddTagSubmit}
                                disabled={!tagInput.trim()}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Notas
                        </label>
                        <textarea
                            rows={4}
                            value={isBatch ? batchNotes : (singleVideo?.metadata.notes || '')}
                            onChange={(e) => isBatch ? setBatchNotes(e.target.value) : singleVideo && onUpdate(singleVideo.id, 'notes', e.target.value)}
                            onBlur={() => isBatch && batchNotes && onBatchUpdate(selectedIds, 'notes', batchNotes)}
                            placeholder={isBatch ? "Sobrescrever notas para todos..." : "Adicionar notas..."}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>

                </div>
            </div>

        </div>
    );
}
