import React from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoFile } from '../types';

interface MetadataFormProps {
    video: VideoFile;
    onUpdate: (videoId: any, field: string, value: any) => void;
    onAddTag: (videoId: any, tag: string) => void;
    onRemoveTag: (videoId: any, tagIndex: number) => void;
    onAddCustomField: (videoId: any) => void;
    onUpdateCustomField: (videoId: any, index: number, field: string, value: string) => void;
    onRemoveCustomField: (videoId: any, index: number) => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
    onClose?: () => void;
}

export default function MetadataForm({
    video,
    onUpdate,
    onAddTag,
    onRemoveTag,
    onAddCustomField,
    onUpdateCustomField,
    onRemoveCustomField,
    onNext,
    onPrev,
    hasPrev,
    hasNext,
    onClose
}: MetadataFormProps) {
    const { metadata } = video;
    const fileSizeMB = (video.size / 1024 / 1024).toFixed(2);

    return (
        <div className="bg-white rounded-xl shadow-lg">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Vídeo anterior"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Próximo vídeo"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-center flex-1 px-4">
                    <h2 className="font-bold text-slate-800 truncate">{video.filename}</h2>
                    <p className="text-xs text-slate-500">{fileSizeMB} MB</p>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                    title="Fechar"
                >
                    ✕
                </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-6">

                {/* Auto-detected info (read-only) */}
                {(metadata.recordingTime || metadata.lens || metadata.clipNumber) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 mb-2">📷 Detectado automaticamente:</p>
                        <div className="flex flex-wrap gap-3 text-sm text-green-800">
                            {metadata.recordingTime && <span>Hora: <strong>{metadata.recordingTime}</strong></span>}
                            {metadata.lens && <span>Lente: <strong>{metadata.lens}</strong></span>}
                            {metadata.clipNumber && <span>Clipe: <strong>#{metadata.clipNumber}</strong></span>}
                        </div>
                    </div>
                )}

                {/* Core Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <input
                            type="text"
                            value={metadata.title}
                            onChange={(e) => onUpdate(video.id, 'title', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Trilha na Serra do Rio do Rastro"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                        <input
                            type="date"
                            value={metadata.date}
                            onChange={(e) => onUpdate(video.id, 'date', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                        <input
                            type="text"
                            value={metadata.location}
                            onChange={(e) => onUpdate(video.id, 'location', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Urubici, SC"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {metadata.tags.map((tag, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                {tag}
                                <button onClick={() => onRemoveTag(video.id, idx)} className="hover:text-red-600 font-bold">×</button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                onAddTag(video.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                            }
                        }}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite e pressione Enter (ex: ciclismo, viagem)"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                    <textarea
                        value={metadata.notes}
                        onChange={(e) => onUpdate(video.id, 'notes', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Observações livres sobre o vídeo..."
                    />
                </div>

                {/* Custom Fields */}
                <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-slate-700">Campos Extras</label>
                        <button
                            onClick={() => onAddCustomField(video.id)}
                            className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-200 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Adicionar
                        </button>
                    </div>

                    {metadata.customFields && metadata.customFields.length > 0 ? (
                        <div className="space-y-2">
                            {metadata.customFields.map((field, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={field.key}
                                        onChange={(e) => onUpdateCustomField(video.id, idx, 'key', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                                        placeholder="Nome"
                                    />
                                    <input
                                        type="text"
                                        value={field.value}
                                        onChange={(e) => onUpdateCustomField(video.id, idx, 'value', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                                        placeholder="Valor"
                                    />
                                    <button onClick={() => onRemoveCustomField(video.id, idx)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-2">Nenhum campo extra.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
