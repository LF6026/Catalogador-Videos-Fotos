import React from 'react';
import { Plus } from 'lucide-react';

interface FileImporterProps {
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    cameraModel: string;
}

export default function FileImporter({ onFileSelect, cameraModel }: FileImporterProps) {
    return (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group mb-6">
            <input
                type="file"
                multiple
                accept="video/*,.insv,.mp4,.mov"
                onChange={onFileSelect}
                className="hidden"
                id="files-input"
            />
            <label htmlFor="files-input" className="cursor-pointer block w-full h-full">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Plus className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-xl text-slate-700 font-semibold mb-2">Adicionar Vídeos</p>
                <p className="text-slate-500 mb-4">
                    Clique para selecionar múltiplos arquivos ou arraste para cá
                </p>
                <div className="flex justify-center gap-2 text-xs text-slate-400">
                    <span className="bg-slate-100 px-2 py-1 rounded">MP4</span>
                    <span className="bg-slate-100 px-2 py-1 rounded">MOV</span>
                    <span className="bg-slate-100 px-2 py-1 rounded">INSV</span>
                </div>

                {cameraModel && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium animate-in fade-in zoom-in">
                        <span>✓ Parsing automático ativado para {cameraModel}</span>
                    </div>
                )}
            </label>
        </div>
    );
}
