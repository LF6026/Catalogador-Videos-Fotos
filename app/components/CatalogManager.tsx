import React from 'react';
import { FileJson, Plus, Trash2 } from 'lucide-react';
import { Catalog } from '../types';

interface CatalogManagerProps {
    existingCatalogs: Catalog[];
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (index: number) => void;
}

export default function CatalogManager({ existingCatalogs, onImport, onRemove }: CatalogManagerProps) {
    return (
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
                    onChange={onImport}
                    className="hidden"
                    id="import-json"
                />
                <label
                    htmlFor="import-json"
                    className="flex-1 cursor-pointer border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-blue-500 transition-colors bg-slate-50 hover:bg-white"
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
                        <div key={idx} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <FileJson className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-800">
                                    Catálogo {idx + 1}: {cat.totalVideos} vídeo(s) - {new Date(cat.generatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={() => onRemove(idx)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
