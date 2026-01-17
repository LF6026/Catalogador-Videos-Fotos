import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BatchMetadata } from '../types';

interface BatchEditorProps {
    filesCount: number;
    batchMetadata: BatchMetadata;
    setBatchMetadata: (data: BatchMetadata) => void;
    onApply: () => void;
    onCancel: () => void;
    onAddTag: (tag: string) => void;
    onRemoveTag: (index: number) => void;
    onAddCustomField: () => void;
    onUpdateCustomField: (index: number, field: string, value: string) => void;
    onRemoveCustomField: (index: number) => void;
}

export default function BatchEditor({
    filesCount,
    batchMetadata,
    setBatchMetadata,
    onApply,
    onCancel,
    onAddTag,
    onRemoveTag,
    onAddCustomField,
    onUpdateCustomField,
    onRemoveCustomField
}: BatchEditorProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-200 bg-purple-50 rounded-t-xl">
                <h2 className="text-lg font-bold text-purple-800">
                    Edição em Lote — {filesCount} vídeo(s)
                </h2>
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 p-1">✕</button>
            </div>

            <div className="p-6 space-y-5">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                    ℹ️ Preencha apenas o que deseja aplicar. Campos vazios serão ignorados. Tags serão <strong>adicionadas</strong> às existentes.
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                    <input
                        type="text"
                        value={batchMetadata.location}
                        onChange={(e) => setBatchMetadata({ ...batchMetadata, location: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Florianópolis, SC"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tags (serão adicionadas)</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {batchMetadata.tags.map((tag, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                {tag}
                                <button onClick={() => onRemoveTag(idx)} className="hover:text-red-600 font-bold">×</button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                onAddTag((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                            }
                        }}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Digite e pressione Enter"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                    <textarea
                        value={batchMetadata.notes}
                        onChange={(e) => setBatchMetadata({ ...batchMetadata, notes: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        rows={2}
                        placeholder="Notas comuns a todos os vídeos selecionados"
                    />
                </div>

                {/* Custom Fields */}
                <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-slate-700">Campos Extras</label>
                        <button onClick={onAddCustomField} className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 flex gap-1 items-center">
                            <Plus className="w-4 h-4" /> Adicionar
                        </button>
                    </div>
                    {batchMetadata.customFields.map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-center mb-2">
                            <input
                                type="text"
                                value={field.key}
                                onChange={(e) => onUpdateCustomField(idx, 'key', e.target.value)}
                                className="flex-1 px-3 py-2 border rounded text-sm"
                                placeholder="Nome"
                            />
                            <input
                                type="text"
                                value={field.value}
                                onChange={(e) => onUpdateCustomField(idx, 'value', e.target.value)}
                                className="flex-1 px-3 py-2 border rounded text-sm"
                                placeholder="Valor"
                            />
                            <button onClick={() => onRemoveCustomField(idx)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <button
                    onClick={onApply}
                    className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-purple-700 shadow-md transition-all"
                >
                    Aplicar em {filesCount} vídeos
                </button>
                <button
                    onClick={onCancel}
                    className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-white font-medium transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
