'use client';

import React, { useState } from 'react';
import { Tag, Calendar, MapPin, FileText, Film, X, Layers, Clock, Camera, Plus, Settings2, Star } from 'lucide-react';
import { VideoFile, CustomField } from '../../types';

interface InspectorProps {
    selectedVideos: Set<string>;
    allVideos: VideoFile[];
    onUpdate: (id: string, field: string, value: unknown) => void;
    onBatchUpdate: (ids: string[], field: string, value: unknown) => void;
    onAddTag: (id: string, tag: string) => void;
    onBatchAddTag: (ids: string[], tag: string) => void;
    onRemoveTag: (id: string, index: number) => void;
    onAddCustomField: (id: string, field: CustomField) => void;
    onBatchAddCustomField: (ids: string[], field: CustomField) => void;
    onRemoveCustomField: (id: string, index: number) => void;
    onUpdateCustomField: (id: string, index: number, field: CustomField) => void;
    onToggleFavorite: (id: string) => void;
    onBatchToggleFavorite: (ids: string[], favorite: boolean) => void;
}

export default function StudioInspector({
    selectedVideos,
    allVideos,
    onUpdate,
    onBatchUpdate,
    onAddTag,
    onBatchAddTag,
    onRemoveTag,
    onAddCustomField,
    onBatchAddCustomField,
    onRemoveCustomField,
    onUpdateCustomField,
    onToggleFavorite,
    onBatchToggleFavorite
}: InspectorProps) {
    const count = selectedVideos.size;
    const isBatch = count > 1;
    const selectedIds = Array.from(selectedVideos);
    const singleVideo = count === 1 ? allVideos.find(v => v.id === selectedIds[0]) : null;

    // Create a key from selected videos to reset state when selection changes
    const selectionKey = Array.from(selectedVideos).sort().join(',');

    // For batch, we keep local state for inputs before applying
    const [batchLocation, setBatchLocation] = useState('');
    const [batchNotes, setBatchNotes] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [lastSelectionKey, setLastSelectionKey] = useState(selectionKey);

    // Custom field inputs
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    // Reset inputs when selection changes
    if (selectionKey !== lastSelectionKey) {
        setBatchLocation('');
        setBatchNotes('');
        setTagInput('');
        setNewFieldKey('');
        setNewFieldValue('');
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

    const handleAddCustomField = () => {
        if (!newFieldKey.trim() || !newFieldValue.trim()) return;

        const field: CustomField = {
            key: newFieldKey.trim(),
            value: newFieldValue.trim()
        };

        if (isBatch) {
            onBatchAddCustomField(selectedIds, field);
        } else if (singleVideo) {
            onAddCustomField(singleVideo.id, field);
        }

        setNewFieldKey('');
        setNewFieldValue('');
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

                {/* Favorite Button */}
                {!isBatch && singleVideo && (
                    <button
                        onClick={() => onToggleFavorite(singleVideo.id)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${
                            singleVideo.metadata.favorite
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                        }`}
                    >
                        <Star className={`w-4 h-4 ${singleVideo.metadata.favorite ? 'fill-amber-400' : ''}`} />
                        <span className="text-sm font-medium">
                            {singleVideo.metadata.favorite ? 'Favorito' : 'Marcar como Favorito'}
                        </span>
                    </button>
                )}

                {/* Batch Favorite */}
                {isBatch && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onBatchToggleFavorite(selectedIds, true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm"
                        >
                            <Star className="w-4 h-4 fill-amber-400" />
                            Favoritar
                        </button>
                        <button
                            onClick={() => onBatchToggleFavorite(selectedIds, false)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-sm"
                        >
                            <Star className="w-4 h-4" />
                            Desfavoritar
                        </button>
                    </div>
                )}

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
                            rows={3}
                            value={isBatch ? batchNotes : (singleVideo?.metadata.notes || '')}
                            onChange={(e) => isBatch ? setBatchNotes(e.target.value) : singleVideo && onUpdate(singleVideo.id, 'notes', e.target.value)}
                            onBlur={() => isBatch && batchNotes && onBatchUpdate(selectedIds, 'notes', batchNotes)}
                            placeholder={isBatch ? "Sobrescrever notas para todos..." : "Adicionar notas..."}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>

                    {/* Custom Fields */}
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                        <label className="text-xs text-slate-500 flex items-center gap-1">
                            <Settings2 className="w-3 h-3" /> Campos Personalizados
                        </label>

                        {/* Existing Custom Fields (only for single) */}
                        {!isBatch && singleVideo && singleVideo.metadata.customFields.length > 0 && (
                            <div className="space-y-2">
                                {singleVideo.metadata.customFields.map((field, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-slate-800/50 rounded p-2">
                                        <input
                                            type="text"
                                            value={field.key}
                                            onChange={(e) => onUpdateCustomField(singleVideo.id, idx, { ...field, key: e.target.value })}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                                            placeholder="Campo"
                                        />
                                        <span className="text-slate-600">:</span>
                                        <input
                                            type="text"
                                            value={field.value}
                                            onChange={(e) => onUpdateCustomField(singleVideo.id, idx, { ...field, value: e.target.value })}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                            placeholder="Valor"
                                        />
                                        <button
                                            onClick={() => onRemoveCustomField(singleVideo.id, idx)}
                                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Custom Field */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newFieldKey}
                                onChange={(e) => setNewFieldKey(e.target.value)}
                                placeholder="Campo (ex: Esporte)"
                                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomField();
                                    }
                                }}
                            />
                            <span className="text-slate-600">:</span>
                            <input
                                type="text"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                                placeholder="Valor (ex: Ciclismo)"
                                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomField();
                                    }
                                }}
                            />
                            <button
                                onClick={handleAddCustomField}
                                disabled={!newFieldKey.trim() || !newFieldValue.trim()}
                                className="p-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded transition-colors"
                                title="Adicionar campo"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {isBatch && (
                            <p className="text-[10px] text-slate-600">
                                Campos adicionados serão aplicados a todos os {count} vídeos selecionados.
                            </p>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
}
