import React from 'react';
import { Camera, FolderOpen, Video } from 'lucide-react';
import { CAMERA_MODELS } from '../utils/parsers';

interface HeaderProps {
    cameraModel: string;
    setCameraModel: (model: string) => void;
    directoryPath: string;
    setDirectoryPath: (path: string) => void;
}

export default function Header({
    cameraModel,
    setCameraModel,
    directoryPath,
    setDirectoryPath
}: HeaderProps) {
    return (
        <>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
                    <Video className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        Catalogador de Vídeos
                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">v2.0-FIXED</span>
                    </h1>
                    <p className="text-slate-500 text-sm">Gerencie e organize sua biblioteca de mídias</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Como usar:</h3>
                <ol className="text-sm text-blue-700 space-y-1 ml-4 list-decimal">
                    <li>Importe catálogos JSON anteriores (opcional)</li>
                    <li>Selecione o modelo da sua câmera</li>
                    <li>Adicione os arquivos de vídeo</li>
                    <li>Edite em lote ou individualmente</li>
                    <li>Gere o catálogo JSON final</li>
                </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-500" />
                        Modelo da Câmera <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={cameraModel}
                        onChange={(e) => setCameraModel(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="">Selecione o modelo</option>
                        {CAMERA_MODELS.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                    {!cameraModel && (
                        <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                            ⚠️ Necessário para extração automática de metadados
                        </p>
                    )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        Caminho do Diretório (opcional)
                    </label>
                    <input
                        type="text"
                        value={directoryPath}
                        onChange={(e) => setDirectoryPath(e.target.value)}
                        placeholder="Ex: /Users/videos/Ciclismo"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Caminho base para referência no JSON
                    </p>
                </div>
            </div>
        </>
    );
}
